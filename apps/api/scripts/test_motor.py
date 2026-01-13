from gpiozero import OutputDevice
from time import sleep
import signal
import sys

STEP_PIN = 21
DIR_PIN  = 20   # change direction by flipping this

step = OutputDevice(STEP_PIN, initial_value=False)
direction = OutputDevice(DIR_PIN, initial_value=False)

# choose a direction
direction.on()   # or .off()

# Flag to control the motor rotation
running = True

def signal_handler(sig, frame):
    global running
    print('\nStopping motor...')
    running = False

def continuous_rotation(delay=0.015):
    """Continuously rotate the motor until stopped"""
    while running:
        step.on()
        sleep(delay)
        step.off()
        sleep(delay)

# Set up signal handler for Ctrl+C
signal.signal(signal.SIGINT, signal_handler)

print("Starting continuous rotation...")
print("Press Ctrl+C to stop the motor")
continuous_rotation(delay=0.015)
print("Motor stopped. Done!")
