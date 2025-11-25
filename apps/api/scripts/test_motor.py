import RPi.GPIO as GPIO
import time

# Set GPIO mode
GPIO.setmode(GPIO.BCM)

# Set GPIO pins
STEP_PIN = 17  # GPIO pin for step
DIR_PIN = 18   # GPIO pin for direction
ENABLE_PIN = 27  # GPIO pin for enabling the driver

# Set up the pins
GPIO.setup(STEP_PIN, GPIO.OUT)
GPIO.setup(DIR_PIN, GPIO.OUT)
GPIO.setup(ENABLE_PIN, GPIO.OUT)

# Enable the motor driver
GPIO.output(ENABLE_PIN, GPIO.LOW)

# Set the direction (True for one direction, False for the other)
GPIO.output(DIR_PIN, GPIO.HIGH)  # HIGH or LOW to control direction

# Create a pulse on STEP_PIN to move the motor
while True:
    GPIO.output(STEP_PIN, GPIO.HIGH)
    time.sleep(0.001)  # Pulse width (controls motor speed)
    GPIO.output(STEP_PIN, GPIO.LOW)
    time.sleep(0.001)
