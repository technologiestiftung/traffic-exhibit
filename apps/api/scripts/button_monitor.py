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
        from gpiozero import OutputDevice, Button  # Same as working simple script
        _HAS_GPIO = True
    else:
        _HAS_GPIO = False
except ImportError:
    _HAS_GPIO = False

# =============================================
# Configuration
# =============================================
# Number of full steps per revolution for 1.8° motor
FULL_STEPS_PER_REV = 200  # 360 / 1.8
# Fast rotation with microsteps: delay between step pulses in seconds
STEP_DELAY = 0.001  # 1 ms for smooth, quiet operation with 1/32 microsteps
# Number of complete rotations to perform when button is pressed
ROTATIONS_PER_PRESS = 2  # Same as test_motor.py

# GPIO pin assignments (BCM numbering)
BUTTON_PIN = 17
STEP_PIN = 21
DIRECTION_PIN = 20

# Microstep control pins (same as test_motor.py)
M0_PIN = 14
M1_PIN = 15
M2_PIN = 18

# Enable pin to control motor power and prevent overheating
ENABLE_PIN = 23

# =============================================
# Motor Control Variables
# =============================================
motor_running = False
stop_event = threading.Event()
motor_thread = None

# Initialize pins using gpiozero (same as working simple script)
if _HAS_GPIO:
    try:
        step = OutputDevice(STEP_PIN, initial_value=False)
        direction = OutputDevice(DIRECTION_PIN, initial_value=False)
        
        # Microstep control pins (same as test_motor.py)
        m0 = OutputDevice(M0_PIN, initial_value=False)
        m1 = OutputDevice(M1_PIN, initial_value=False)
        m2 = OutputDevice(M2_PIN, initial_value=False)
        
        # Enable pin (active low - motor enabled when pin is LOW)
        enable = OutputDevice(ENABLE_PIN, initial_value=True)  # Start disabled (HIGH = disabled)
        
        # Set direction to clockwise (same as test_motor.py)
        direction.on()
        
        # Set 1/32 microstep mode for quiet operation (same as test_motor.py)
        m0.on()   # M0 = HIGH
        m1.off()  # M1 = LOW  
        m2.on()   # M2 = HIGH
        print("Microstep mode set to: thirty_second (1/32) for quiet operation")
        
        # Setup button using gpiozero (Pi 5 compatible)
        button = Button(BUTTON_PIN, pull_up=True)
        print(f"GPIO pins initialized successfully: STEP={STEP_PIN}, DIR={DIRECTION_PIN}, BUTTON={BUTTON_PIN}")
        print(f"Microstep pins: M0={M0_PIN}, M1={M1_PIN}, M2={M2_PIN}, ENABLE={ENABLE_PIN}")
    except Exception as e:
        print(f"GPIO initialization failed: {e}")
        sys.exit(1)
else:
    step = None
    direction = None
    button = None
    m0 = None
    m1 = None
    m2 = None
    enable = None

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

def button_pressed():
    """Callback function when button is pressed (same as working simple script)"""
    print("Button pressed!")
    
    # Send event to web interface (if connected)
    try:
        sio.emit('button_pressed', {'isStartStopButtonPressed': True})
    except Exception as e:
        print(f"Socket.IO emit failed: {e}")
    
    # Check if motor is already running
    if motor_running:
        print("Motor is already running, ignoring button press")
        return
    
    print(f"Starting motor for {ROTATIONS_PER_PRESS} complete rotations...")
    start_motor()

def simulate_button_press():
    """Simulate button press for development"""
    print("Simulated button press!")
    button_pressed()

def main():
    try:
        # Try to connect to Node.js server (optional)
        server_url = 'http://localhost:3001'
        print(f"Trying to connect to {server_url}...")
        try:
            sio.connect(server_url)
            print("Connected to Node.js server")
        except Exception as e:
            print(f"Failed to connect to Node.js server: {e}")
            print("Continuing without web interface connection...")
        
        if _HAS_GPIO:
            # Set up button callback using gpiozero (same as working simple script)
            button.when_pressed = button_pressed
            
            print("Button monitor started on Raspberry Pi. Press Ctrl+C to exit.")
            print(f"Monitoring GPIO pin {BUTTON_PIN} for button presses...")
            print(f"Motor will rotate {ROTATIONS_PER_PRESS} times when button is pressed.")
            
            # Keep the script running
            while True:
                time.sleep(1)
        else:
            # Development mode - simulate button presses
            print("Development mode - Button monitor started. Press Ctrl+C to exit.")
            print("Simulating button press every 10 seconds for testing...")
            
            counter = 0
            while True:
                time.sleep(10)
                counter += 1
                print(f"Simulation {counter}: Sending button press...")
                simulate_button_press()
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cleanup_and_exit(None, None)

if __name__ == "__main__":
    main()