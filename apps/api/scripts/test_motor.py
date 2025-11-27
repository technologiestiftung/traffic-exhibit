from gpiozero import OutputDevice
import time

STEP = 20
DIR = 21
EN  = 16

# Create gpiozero output devices
step = OutputDevice(STEP)
direction = OutputDevice(DIR)
enable = OutputDevice(EN, active_high=False)   # driver enable is active LOW

# enable driver (active LOW)
enable.on()     # because active_high=False → .on() sends LOW

# set direction
direction.on()  # HIGH   (use .off() for LOW)

# do 200 steps
for _ in range(200):
    step.on()      # HIGH
    time.sleep(0.0005)
    step.off()     # LOW
    time.sleep(0.0005)
