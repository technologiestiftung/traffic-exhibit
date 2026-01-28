#!/usr/bin/env python3
import time
import socketio
import sys
import signal
import threading
import platform

# Determine if we are on a Raspberry Pi
_pi_arch = platform.machine() in ["armv6l", "armv7l", "aarch64"]

try:
    if _pi_arch:
        from gpiozero import OutputDevice, DigitalInputDevice, Button
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
CLK_PIN = 12   # Rotary encoder CLK pin
DT_PIN = 16    # Rotary encoder DT pin

# Secondary rotary encoder pins (step counter)
CLK2_PIN = 5   # Second rotary encoder CLK pin
DT2_PIN = 6    # Second rotary encoder DT pin

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

# Second rotary encoder state
encoder2_position = 0
last_clk2_state = None
last_direction2 = None

# Motor control state
motor_running = False
stop_event = threading.Event()
motor_thread = None

# System state
system_enabled = True  # Controls whether the system responds to rotary encoder

# Initialize pins using gpiozero 
if _HAS_GPIO:
    try:
        # Motor control pins
        step = OutputDevice(STEP_PIN, initial_value=False)
        direction = OutputDevice(DIRECTION_PIN, initial_value=False)
        enable = OutputDevice(ENABLE_PIN, initial_value=True)  # Start disabled (HIGH = disabled)
        
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
        
        # Second rotary encoder pins
        clk2 = DigitalInputDevice(CLK2_PIN, pull_up=True)
        dt2 = DigitalInputDevice(DT2_PIN, pull_up=True)
        last_clk2_state = clk2.value
        
        # On-off button
        on_off_button = Button(ON_OFF_BUTTON_PIN, pull_up=True)
        
        print("=== GPIO Initialization Complete ===")
        print(f"Motor pins - STEP: {STEP_PIN}, DIR: {DIRECTION_PIN}, ENABLE: {ENABLE_PIN}")
        print(f"Microstep pins - M0: {M0_PIN}, M1: {M1_PIN}, M2: {M2_PIN}")
        print(f"Rotary encoder pins - CLK: {CLK_PIN}, DT: {DT_PIN}")
        print(f"Second rotary encoder pins - CLK2: {CLK2_PIN}, DT2: {DT2_PIN}")
        print(f"On-off button pin: {ON_OFF_BUTTON_PIN}")
        print("Microstep mode: 1/32 for quiet operation")
        
    except Exception as e:
        print(f"GPIO initialization failed: {e}")
        sys.exit(1)
else:
    # Development mode - no GPIO
    step = direction = enable = None
    m0 = m1 = m2 = None
    clk = dt = clk2 = dt2 = on_off_button = None

# =============================================
# Socket.IO client setup
# =============================================
sio = socketio.Client()

# =============================================
# Motor Control Functions (same as working simple script)
# =============================================

def do_rotation():
    """Perform motor rotation using the exact same logic as test_motor.py"""
    global motor_running
    
    try:
        # Calculate steps for microstep mode (same as test_motor.py)
        # 2 full rotations = 2 * 200 steps * 32 microsteps = 12800 steps
        target_steps = ROTATIONS_PER_PRESS * FULL_STEPS_PER_REV * 32  # 32 for 1/32 microsteps
        
        print(f"Starting rotation for {ROTATIONS_PER_PRESS} revolutions ({target_steps} microsteps)")
        
        if _HAS_GPIO:
            # Enable motor for movement (same as test_motor.py)
            enable.off()  # Enable motor (LOW = enabled)
            print("Motor enabled")
            time.sleep(0.1)  # Brief pause to let pins settle
        
        steps_done = 0
        
        while not stop_event.is_set() and steps_done < target_steps:
            if _HAS_GPIO:
                # Exact same logic as test_motor.py
                step.on()
                time.sleep(STEP_DELAY)
                step.off()
                time.sleep(STEP_DELAY)
            else:
                # Simulation mode
                time.sleep(STEP_DELAY * 2)
            
            steps_done += 1
            
            # Print progress every 1000 steps (adjusted for microsteps)
            if steps_done % 1000 == 0:
                if _HAS_GPIO:
                    print(f"Microsteps completed: {steps_done}")
                else:
                    print(f"[SIMULATION] Microsteps completed: {steps_done}")
        
        if _HAS_GPIO:
            # Disable motor to prevent overheating and allow cooling (same as test_motor.py)
            enable.on()  # Disable motor (HIGH = disabled)
            print("Motor disabled for cooling - preventing overheating")
        
        if steps_done >= target_steps:
            print(f"Completed {ROTATIONS_PER_PRESS} rotations ({steps_done} microsteps)")
        else:
            print("Rotation stopped early")
            
    except Exception as e:
        print(f"Motor error: {e}")
    finally:
        if _HAS_GPIO:
            # Ensure motor is disabled
            enable.on()  # Disable motor (HIGH = disabled)
        motor_running = False
        print("Motor stopped.")

def start_motor():
    """Start the motor rotation"""
    global motor_running, motor_thread, stop_event
    
    if motor_running:
        print("Motor is already running, ignoring request")
        return False
    
    motor_running = True
    stop_event.clear()
    motor_thread = threading.Thread(target=do_rotation, daemon=True)
    motor_thread.start()
    return True

def stop_motor():
    """Stop the motor rotation"""
    global motor_running, stop_event
    
    if motor_running:
        print("Stopping motor...")
        stop_event.set()
        if motor_thread and motor_thread.is_alive():
            motor_thread.join(timeout=2)

def cleanup_motor():
    """Clean up motor resources and disable motor to prevent overheating"""
    stop_motor()
    # Disable motor to prevent overheating (same as test_motor.py)
    if _HAS_GPIO and 'enable' in globals():
        try:
            enable.on()  # Disable motor (HIGH = disabled)
            print("Motor disabled for cleanup - preventing overheating")
        except Exception as e:
            print(f"Error disabling motor: {e}")
    # gpiozero handles GPIO cleanup automatically

def cleanup_and_exit(_signum=None, _frame=None):
    print("\nCleaning up...")
    global encoder_running
    encoder_running = False  # Stop encoder monitoring
    try:
        cleanup_motor()
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

def on_off_button_pressed():
    """Callback function when on-off button is pressed"""
    global system_enabled
    
    system_enabled = not system_enabled
    status = "ENABLED" if system_enabled else "DISABLED"
    
    print(f"\n=== ON-OFF BUTTON PRESSED ===")
    print(f"System is now: {status}")
    
    if not system_enabled:
        print("System disabled - stopping motor and ignoring rotary encoder")
        stop_motor()
    else:
        print("System enabled - rotary encoder is now active")
    
    # Send system state to web interface
    try:
        sio.emit('system_state_changed', {'systemEnabled': system_enabled})
    except Exception as e:
        print(f"Socket.IO emit failed: {e}")
    
    print("=" * 30)

def rotary_encoder_start():
    """Callback function when rotary encoder rotates clockwise - sends start event"""
    if not system_enabled:
        print("System disabled - ignoring rotary encoder input")
        return
    
    print("Clockwise rotation detected - sending start event!")
    
    # Send start event to web interface
    try:
        sio.emit('start-event', {})
    except Exception as e:
        print(f"Socket.IO emit failed: {e}")
    
    # Check if motor is already running
    if motor_running:
        print("Motor is already running, ignoring encoder trigger")
        return
    
    print(f"Starting motor for {ROTATIONS_PER_PRESS} complete rotations...")
    start_motor()

def rotary_encoder_stop():
    """Callback function when rotary encoder rotates counter-clockwise - sends stop event"""
    if not system_enabled:
        print("System disabled - ignoring rotary encoder input")
        return
    
    print("Counter-clockwise rotation detected - sending stop event!")
    
    # Send stop event to web interface
    try:
        sio.emit('stop-event', {})
    except Exception as e:
        print(f"Socket.IO emit failed: {e}")
    
    # Stop motor
    print("Stopping motor due to counter-clockwise rotation...")
    stop_motor()

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

def monitor_second_rotary_encoder():
    """Monitor the second rotary encoder for rotation and emit after 6 pulses"""
    global encoder2_position, last_clk2_state, last_direction2, encoder_running
    
    print("Starting second rotary encoder monitoring...")
    
    pulse_count = 0
    PULSES_REQUIRED = 6
    TOTAL_PULSES = 20
    current_direction_accumulator = None  # Track current direction for pulse accumulation
    
    try:
        while encoder_running:
            if not _HAS_GPIO or clk2 is None:
                time.sleep(0.1)
                continue
            
            current_clk2_state = clk2.value
            
            # Check if CLK pin has changed state (falling edge detection)
            if current_clk2_state != last_clk2_state:
                # Determine direction
                if dt2.value != current_clk2_state:
                    current_direction2 = "Clockwise"
                    encoder2_position -= 1
                    direction = "clockwise"
                else:
                    current_direction2 = "Counter-Clockwise"
                    encoder2_position += 1
                    direction = "counter-clockwise"
                
                # Reset accumulator if direction changed
                if current_direction_accumulator is not None and current_direction_accumulator != direction:
                    pulse_count = 0
                
                current_direction_accumulator = direction
                pulse_count += 1
                
                # Only emit after 6 pulses in the same direction
                if pulse_count >= PULSES_REQUIRED:
                    # Send socket io event to frontend
                    try:
                        sio.emit('rotary_encoder2_rotated', {
                            'direction': direction,
                            'position': encoder2_position,
                            'pulseCount': pulse_count
                        })
                    except Exception as e:
                        print(f"Socket.IO emit failed: {e}")
                    
                    # Log the event
                    progress = (abs(encoder2_position) % TOTAL_PULSES)
                    print(f"[ROTARY 2] {pulse_count} pulses - Direction: {current_direction2} (progress: {progress}/{TOTAL_PULSES})")
                    
                    # Reset pulse count after emitting
                    pulse_count = 0
                
                # Update direction tracking
                last_direction2 = current_direction2
            
            last_clk2_state = current_clk2_state
            time.sleep(0.001)  # Small delay to prevent excessive CPU usage
            
    except Exception as e:
        print(f"Error monitoring second rotary encoder: {e}")

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
            # Set up on-off button callback
            on_off_button.when_pressed = on_off_button_pressed
            
            # Start rotary encoder monitoring in a separate thread
            encoder_thread = threading.Thread(target=monitor_rotary_encoder, daemon=True)
            encoder_thread.start()
            
            # Start second rotary encoder monitoring in a separate thread
            encoder2_thread = threading.Thread(target=monitor_second_rotary_encoder, daemon=True)
            encoder2_thread.start()
            
            print("\n=== System Ready ===")
            print("Controls:")
            print(f"• On-Off Button (Pin {ON_OFF_BUTTON_PIN}): Enable/Disable system")
            print(f"• Rotary Encoder 1 (Pins {CLK_PIN}, {DT_PIN}): Motor control")
            print("  - Clockwise: Start motor")
            print("  - Counter-clockwise: Stop motor")
            print(f"• Rotary Encoder 2 (Pins {CLK2_PIN}, {DT2_PIN}): Pulse logging")
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
                    on_off_button_pressed()
                else:
                    print(f"Simulation {counter}: Clockwise rotation detected")
                    simulate_encoder_trigger()
                    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cleanup_and_exit(None, None)

if __name__ == "__main__":
    main()