from gpiozero import OutputDevice
import time

# Set GPIO pins
STEP_PIN = 17  # GPIO pin for step
DIR_PIN = 18   # GPIO pin for direction
ENABLE_PIN = 27  # GPIO pin for enabling the driver (active LOW)

# Set up the pins using gpiozero
step_device = OutputDevice(STEP_PIN, active_high=True, initial_value=False)
direction_device = OutputDevice(DIR_PIN, active_high=True, initial_value=False)
enable_device = OutputDevice(ENABLE_PIN, active_high=False, initial_value=True)  # disabled (active LOW)

# Enable the motor driver (active LOW, so False = enabled)
enable_device.value = False

# Set the direction (True for one direction, False for the other)
direction_device.value = True  # True or False to control direction

# Create a pulse on STEP_PIN to move the motor
try:
    while True:
        step_device.on()
        time.sleep(0.001)  # Pulse width (controls motor speed)
        step_device.off()
        time.sleep(0.001)
except KeyboardInterrupt:
    print("\nStopping motor...")
finally:
    # Disable the motor driver and cleanup
    enable_device.value = True  # Disable (active LOW)
    step_device.close()
    direction_device.close()
    enable_device.close()
    print("Cleanup complete.")
