#!/usr/bin/env python3
import time
import socketio
import sys
import signal
import threading
import platform

# Import button and motor control classes
from button_handler import ButtonHandler
from motor_control import MotorControl
from selection_button_handler import SelectionButtonHandler

# Determine if we are on a Raspberry Pi
_pi_arch = platform.machine() in ["armv6l", "armv7l", "aarch64"]

try:
    if _pi_arch:
        from gpiozero import OutputDevice, DigitalInputDevice
        _HAS_GPIO = True
    else:
        _HAS_GPIO = False
except ImportError:
    _HAS_GPIO = False

# =============================================
# Configuration
# =============================================
# Motor configuration
FULL_STEPS_PER_REV = 200  # Number of full steps per revolution for 1.8° motor
STEP_DELAY = 0.001  # Delay between step pulses in seconds (1ms for smooth operation)
ROTATIONS_PER_PRESS = 2  # Number of complete rotations to perform when triggered

# GPIO pin assignments (BCM numbering)
# Primary rotary encoder pins (motor control)
CLK_PIN = 5   # Rotary encoder CLK pin
DT_PIN = 6    # Rotary encoder DT pin

# Selection button pins
CLK2_PIN = 12   # Selection button CLK pin
DT2_PIN = 16    # Selection button DT pin

# On-off button pin
ON_OFF_BUTTON_PIN = 17  # Physical push button for on/off control

# Motor control pins
STEP_PIN = 21
DIRECTION_PIN = 20

# Microstep control pins
M0_PIN = 14
M1_PIN = 15
M2_PIN = 18

# Enable pin to control motor power
ENABLE_PIN = 23

# =============================================
# System State Variables
# =============================================
# Rotary encoder state
encoder_position = 0
last_clk_state = None
last_direction = None
encoder_running = True

# Selection button will be handled by SelectionButtonHandler class

# System state
system_state = {
    'system_enabled': True  # Controls whether the system responds to rotary encoder
}

# Initialize motor control
motor_control = MotorControl(
    step_pin=STEP_PIN,
    enable_pin=ENABLE_PIN,
    rotations_per_press=ROTATIONS_PER_PRESS,
    full_steps_per_rev=FULL_STEPS_PER_REV,
    step_delay=STEP_DELAY
)

# Initialize pins using gpiozero 
if _HAS_GPIO:
    try:
        # Motor direction pin
        direction = OutputDevice(DIRECTION_PIN, initial_value=False)
        
        # Microstep control pins
        m0 = OutputDevice(M0_PIN, initial_value=False)
        m1 = OutputDevice(M1_PIN, initial_value=False)
        m2 = OutputDevice(M2_PIN, initial_value=False)
        
        # Set motor direction to clockwise
        direction.on()
        
        # Set 1/32 microstep mode for quiet operation
        m0.on()   # M0 = HIGH
        m1.off()  # M1 = LOW  
        m2.on()   # M2 = HIGH
        
        # Rotary encoder pins
        clk = DigitalInputDevice(CLK_PIN, pull_up=True)
        dt = DigitalInputDevice(DT_PIN, pull_up=True)
        last_clk_state = clk.value
        
        # Selection button pins (will be initialized by SelectionButtonHandler)
        
        print("=== GPIO Initialization Complete ===")
        print(f"Motor pins - STEP: {STEP_PIN}, DIR: {DIRECTION_PIN}, ENABLE: {ENABLE_PIN}")
        print(f"Microstep pins - M0: {M0_PIN}, M1: {M1_PIN}, M2: {M2_PIN}")
        print(f"Rotary encoder pins - CLK: {CLK_PIN}, DT: {DT_PIN}")
        print(f"Selection button pins - CLK2: {CLK2_PIN}, DT2: {DT2_PIN}")
        print(f"On-off button pin: {ON_OFF_BUTTON_PIN}")
        print("Microstep mode: 1/32 for quiet operation")
        
    except Exception as e:
        print(f"GPIO initialization failed: {e}")
        sys.exit(1)
else:
    # Development mode - no GPIO
    direction = None
    m0 = m1 = m2 = None
    clk = dt = None

# =============================================
# Socket.IO client setup
# =============================================
sio = socketio.Client()

# Initialize button handler
button_handler = ButtonHandler(sio, motor_control, system_state)

# Initialize button if GPIO is available
if _HAS_GPIO:
    button_handler.initialize_button(ON_OFF_BUTTON_PIN)

# Initialize selection button handler
selection_button_handler = SelectionButtonHandler(
    socketio_client=sio,
    clk_pin=CLK2_PIN if _HAS_GPIO else None,
    dt_pin=DT2_PIN if _HAS_GPIO else None,
    pulses_required=6,
    total_pulses=20
)

def cleanup_and_exit(_signum=None, _frame=None):
    print("\nCleaning up...")
    global encoder_running
    encoder_running = False  # Stop encoder monitoring
    try:
        motor_control.cleanup()
    except Exception as e:  # noqa: BLE001
        print(f"Motor cleanup error: {e}")
    try:
        sio.disconnect()
    except Exception as e:  # noqa: BLE001
        print(f"Socket cleanup error: {e}")
    finally:
        sys.exit(0)

# Register signal handlers for clean shutdown
signal.signal(signal.SIGINT, cleanup_and_exit)
signal.signal(signal.SIGTERM, cleanup_and_exit)

@sio.event
def connect():
    print("Connected to Node.js server")

@sio.event
def disconnect():
    print("Disconnected from Node.js server")

def rotary_encoder_start():
    """Callback function when rotary encoder rotates clockwise - sends start event"""
    button_handler.handle_rotary_start(ROTATIONS_PER_PRESS)

def rotary_encoder_stop():
    """Callback function when rotary encoder rotates counter-clockwise - sends stop event"""
    button_handler.handle_rotary_stop()

def monitor_rotary_encoder():
    """Monitor rotary encoder for direction changes"""
    global encoder_position, last_clk_state, last_direction, encoder_running
    
    if not _HAS_GPIO:
        return
    
    try:
        while encoder_running:
            current_clk_state = clk.value
            
            # Check if CLK pin has changed state (falling edge detection)
            if current_clk_state != last_clk_state:
                # Determine direction (corrected logic)
                if dt.value != current_clk_state:
                    current_direction = "Counter-clockwise"  # Swapped
                    encoder_position -= 1  # Swapped
                else:
                    current_direction = "Clockwise"  # Swapped
                    encoder_position += 1  # Swapped
                
                # Check for direction change
                if last_direction is not None and last_direction != current_direction:
                    if current_direction == "Clockwise":
                        print(f"Direction changed to clockwise (position: {encoder_position})")
                        rotary_encoder_start()
                    elif current_direction == "Counter-clockwise":
                        print(f"Direction changed to counter-clockwise (position: {encoder_position})")
                        rotary_encoder_stop()
                elif last_direction != current_direction and current_direction == "Clockwise":
                    # First time detecting clockwise motion
                    print(f"Initial clockwise rotation detected (position: {encoder_position})")
                    rotary_encoder_start()
                elif last_direction != current_direction and current_direction == "Counter-clockwise":
                    # First time detecting counter-clockwise motion
                    print(f"Initial counter-clockwise rotation detected (position: {encoder_position})")
                    rotary_encoder_stop()
                
                last_direction = current_direction
            
            last_clk_state = current_clk_state
            time.sleep(0.001)  # Small delay to prevent excessive CPU usage
            
    except Exception as e:
        print(f"Error monitoring rotary encoder: {e}")

def monitor_selection_button():
    """Monitor the selection button using the handler class"""
    selection_button_handler.monitor(encoder_running)

def simulate_encoder_trigger():
    """Simulate encoder trigger for development"""
    print("Simulated clockwise rotation detected!")
    rotary_encoder_start()

def main():
    """Main function - handles both rotary encoder and on-off button"""
    try:
        print("=== Traffic Exhibit Control System ===")
        print("Initializing...")
        
        # Try to connect to Node.js server (optional)
        server_url = 'http://localhost:3001'
        print(f"Attempting connection to {server_url}...")
        try:
            sio.connect(server_url)
            print("✅ Connected to Node.js server")
        except Exception as e:
            print(f"⚠️  Failed to connect to Node.js server: {e}")
            print("Continuing without web interface connection...")
        
        if _HAS_GPIO:
            # Button is already initialized via button_handler.initialize_button()
            # Start rotary encoder monitoring in a separate thread
            encoder_thread = threading.Thread(target=monitor_rotary_encoder, daemon=True)
            encoder_thread.start()
            
            # Start selection button monitoring in a separate thread
            selection_button_thread = threading.Thread(target=monitor_selection_button, daemon=True)
            selection_button_thread.start()
            
            print("\n=== System Ready ===")
            print("Controls:")
            print(f"• On-Off Button (Pin {ON_OFF_BUTTON_PIN}): Enable/Disable system")
            print(f"• Rotary Encoder 1 (Pins {CLK_PIN}, {DT_PIN}): Motor control")
            print("  - Clockwise: Start motor")
            print("  - Counter-clockwise: Stop motor")
            print(f"• Selection Button (Pins {CLK2_PIN}, {DT2_PIN}): Pulse logging")
            print(f"• Motor rotations per trigger: {ROTATIONS_PER_PRESS}")
            print("\nPress Ctrl+C to exit")
            print("=" * 40)
            
            # Keep the script running
            while True:
                time.sleep(1)
        else:
            # Development mode - simulate controls
            print("\n=== Development Mode ===")
            print("Simulating controls every 10 seconds...")
            
            counter = 0
            while True:
                time.sleep(10)
                counter += 1
                if counter % 2 == 1:
                    print(f"Simulation {counter}: On-off button pressed")
                    button_handler.on_pressed()
                else:
                    print(f"Simulation {counter}: Clockwise rotation detected")
                    simulate_encoder_trigger()
                    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cleanup_and_exit(None, None)

if __name__ == "__main__":
    main()