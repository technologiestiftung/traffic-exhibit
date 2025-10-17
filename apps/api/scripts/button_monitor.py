import time
import socketio
import sys
import signal
import platform
from datetime import datetime

# This script emits button press and snapshot requests.
# Object detection is performed by the long-running yolo_detect.py process.

# GPIO setup with fallback for non-Raspberry Pi systems
BUTTON_PIN = 17
is_raspberry_pi = platform.machine() in ['armv6l', 'armv7l', 'aarch64']

if is_raspberry_pi:
    try:
        import RPi.GPIO as GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        print("Running on Raspberry Pi - GPIO initialized")
    except ImportError:
        print("RPi.GPIO not available, but running on Pi-like system")
        is_raspberry_pi = False
else:
    print("Running on development machine - GPIO simulation mode")

# Socket.IO client setup
sio = socketio.Client()

def cleanup_and_exit(signum, frame):
    print("\nCleaning up...")
    if is_raspberry_pi:
        GPIO.cleanup()
    sio.disconnect()
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

def button_callback(channel):
    """Callback function when physical button is pressed."""
    print("Button pressed!")
    _emit_button_and_snapshot(trigger_source="hardware")
    # Debounce - wait a bit before allowing another press
    time.sleep(0.3)

def simulate_button_press():
    """Simulate button press for development."""
    print("Simulated button press!")
    _emit_button_and_snapshot(trigger_source="simulation")


def _emit_button_and_snapshot(trigger_source: str):
    """Emit button_pressed and snapshot_request events to Node server.

    The object detection service (yolo_detect.py) listens for 'snapshot_request' and
    responds with 'object_detection_result'.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    sio.emit('button_pressed', {
        'isStartStopButtonPressed': True,
        'triggerSource': trigger_source,
        'ts': timestamp
    })
    sio.emit('snapshot_request', {
        'reason': 'button_press',
        'triggerSource': trigger_source,
        'ts': timestamp
    })

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