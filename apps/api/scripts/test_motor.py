from gpiozero import OutputDevice
from time import sleep

STEP_PIN = 20
DIR_PIN  = 21   # change direction by flipping this

step = OutputDevice(STEP_PIN, initial_value=False)
direction = OutputDevice(DIR_PIN, initial_value=False)

# choose a direction
direction.on()   # or .off()

def do_steps(steps, delay=0.01):
    for _ in range(steps):
        step.on()
        sleep(delay)
        step.off()
        sleep(delay)

print("Starting…")
do_steps(200, delay=0.01)  # nice and slow so you can see/hear it
print("Done")
