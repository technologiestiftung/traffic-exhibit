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
    
    print(f"[PRIMARY ENCODER] Starting monitoring on pins CLK={CLK_PIN}, DT={DT_PIN}")
    
    try:
        # Add debouncing and direction confirmation
        direction_pulse_count = 0
        confirmed_direction = None
        MIN_PULSES_FOR_CONFIRMATION = 2  # Require at least 2 pulses in same direction
        
        while encoder_running:
            current_clk_state = clk.value
            
            # Check if CLK pin has changed state (edge detection)
            if current_clk_state != last_clk_state:
                # Determine direction
                if dt.value != current_clk_state:
                    current_direction = "Counter-clockwise"
                    encoder_position -= 1
                else:
                    current_direction = "Clockwise"
                    encoder_position += 1
                
                # Track direction consistency
                if confirmed_direction is None:
                    # First detection - start tracking
                    confirmed_direction = current_direction
                    direction_pulse_count = 1
                elif confirmed_direction == current_direction:
                    # Same direction - increment counter
                    direction_pulse_count += 1
                else:
                    # Direction changed - reset and start tracking new direction
                    confirmed_direction = current_direction
                    direction_pulse_count = 1
                
                # Only trigger motor control after confirming direction with multiple pulses
                # This prevents false triggers from noise or interference
                if direction_pulse_count >= MIN_PULSES_FOR_CONFIRMATION:
                    # Check if this is a new direction (not already triggered)
                    if last_direction != confirmed_direction:
                        if confirmed_direction == "Clockwise":
                            print(f"[PRIMARY ENCODER] Confirmed clockwise rotation (position: {encoder_position}, pulses: {direction_pulse_count})")
                            rotary_encoder_start()
                        elif confirmed_direction == "Counter-clockwise":
                            print(f"[PRIMARY ENCODER] Confirmed counter-clockwise rotation (position: {encoder_position}, pulses: {direction_pulse_count})")
                            rotary_encoder_stop()
                        last_direction = confirmed_direction
                        # Reset counter after triggering to prevent multiple triggers
                        direction_pulse_count = 0
                
                last_clk_state = current_clk_state
            else:
                # No state change - reset direction tracking if we haven't confirmed yet
                # This helps filter out single-pulse noise
                if direction_pulse_count > 0 and direction_pulse_count < MIN_PULSES_FOR_CONFIRMATION:
                    # Reset if we haven't confirmed direction yet
                    confirmed_direction = None
                    direction_pulse_count = 0
            
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