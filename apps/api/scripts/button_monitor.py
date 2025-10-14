import time
import socketio
import sys
import signal
from stepper_control import (
    StepperPins,
    create_stepper,
)

# =============================================
# Configuration
# =============================================
# Number of full steps per revolution for 1.8° motor
FULL_STEPS_PER_REV = 200  # 360 / 1.8
# Microstepping setting (1, 2, 4, 8, 16, 32) – update wiring for MICROSTEP1/MICROSTEP2/MICROSTEP3 if you change this.
MICROSTEP = 1
# Slow rotation: delay between step pulses in seconds (increase for slower)
STEP_DELAY = 0.02  # 20 ms => ~50 full steps/sec => ~4 s per revolution
# Continuous rotation mode: button toggles start/stop.
# Optional auto stop after N revolutions (set number) or None for indefinite.
AUTO_STOP_REVS = None
# Whether to alternate direction each time motion starts
TOGGLE_DIRECTION = True

# GPIO pin assignments (BCM numbering)

BUTTON_PIN = 17
STEP_PIN = 23
DIRECTION_PIN = 24
ENABLE_PIN = 25  # Active LOW on DRV8825
# Optional microstep pins if you want to change MICROSTEP (not required for full step)
MICROSTEP1_PIN = 5
MICROSTEP2_PIN = 6
MICROSTEP3_PIN = 13

# =============================================

stepper, is_raspberry_pi = create_stepper(
    pins=StepperPins(
        step=STEP_PIN,
        direction=DIRECTION_PIN,
        enable=ENABLE_PIN,
        microstep1=MICROSTEP1_PIN,
        microstep2=MICROSTEP2_PIN,
        microstep3=MICROSTEP3_PIN,
    ),
    microstep=MICROSTEP,
    step_delay=STEP_DELAY,
    auto_stop_revs=AUTO_STOP_REVS,
    toggle_direction=TOGGLE_DIRECTION,
    full_steps_per_rev=FULL_STEPS_PER_REV,
)

if is_raspberry_pi:
    # Lazy import for button GPIO only when on Pi
    import RPi.GPIO as GPIO  # type: ignore
    GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# Socket.IO client setup
sio = socketio.Client()

def cleanup_and_exit(_signum=None, _frame=None):
    print("\nCleaning up...")
    try:
        stepper.cleanup()
    except Exception as e:  # noqa: BLE001
        print(f"Stepper cleanup error: {e}")
    try:
        sio.disconnect()
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

def button_callback(_channel):
    """Callback function when button is pressed"""
    print("Button pressed!")
    sio.emit('button_pressed', {'isStartStopButtonPressed': True})
    if is_raspberry_pi:
        stepper.toggle()
    # Debounce - wait a bit before allowing another press
    time.sleep(0.3)

def simulate_button_press():
    """Simulate button press for development"""
    print("Simulated button press!")
    sio.emit('button_pressed', {'isStartStopButtonPressed': True})
    stepper.toggle()

def main():
    try:
        # Connect to your Node.js server
        server_url = 'http://localhost:3001'
        print(f"Connecting to {server_url}...")
        sio.connect(server_url)
        
        if is_raspberry_pi:
            # Set up button interrupt on Raspberry Pi
            GPIO.add_event_detect(BUTTON_PIN, GPIO.FALLING, 
                                callback=button_callback, 
                                bouncetime=300)
            
            print("Button monitor started on Raspberry Pi. Press Ctrl+C to exit.")
            print(f"Monitoring GPIO pin {BUTTON_PIN} for button presses...")
            
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
                
    except socketio.exceptions.ConnectionError as e:
        print(f"Failed to connect to Node.js server: {e}")
        print("Make sure your Node.js server is running on http://localhost:3001")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cleanup_and_exit(None, None)

if __name__ == "__main__":
    main()