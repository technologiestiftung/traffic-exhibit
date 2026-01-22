from gpiozero import OutputDevice
from time import sleep
import signal
import sys

STEP_PIN = 21
DIR_PIN  = 20   # change direction by flipping this

# Microstep control pins
M0_PIN = 14
M1_PIN = 15
M2_PIN = 18

# Enable pin to control motor power and prevent overheating
ENABLE_PIN = 23

step = OutputDevice(STEP_PIN, initial_value=False)
direction = OutputDevice(DIR_PIN, initial_value=False)

# Microstep control pins
m0 = OutputDevice(M0_PIN, initial_value=False)
m1 = OutputDevice(M1_PIN, initial_value=False)
m2 = OutputDevice(M2_PIN, initial_value=False)

# Enable pin (active low - motor enabled when pin is LOW)
enable = OutputDevice(ENABLE_PIN, initial_value=True)  # Start disabled (HIGH = disabled)

# choose a direction
direction.on()   # or .off()

# Microstep resolution settings (for DRV8825/A4988 drivers)
# M0, M1, M2 pin combinations determine microstep resolution:
# 0,0,0 = Full step
# 1,0,0 = Half step (1/2)
# 0,1,0 = Quarter step (1/4)
# 1,1,0 = Eighth step (1/8)
# 0,0,1 = Sixteenth step (1/16)
# 1,0,1 = Thirty-second step (1/32)

MICROSTEP_MODES = {
    "full": (False, False, False),      # Full step
    "half": (True, False, False),       # 1/2 step
    "quarter": (False, True, False),    # 1/4 step
    "eighth": (True, True, False),      # 1/8 step
    "sixteenth": (False, False, True),  # 1/16 step
    "thirty_second": (True, False, True), # 1/32 step
}

def set_microstep_mode(mode_name):
    """Set the microstep resolution based on mode name"""
    if mode_name not in MICROSTEP_MODES:
        print(f"Unknown microstep mode: {mode_name}")
        return False
    
    m0_state, m1_state, m2_state = MICROSTEP_MODES[mode_name]
    
    if m0_state:
        m0.on()
    else:
        m0.off()
        
    if m1_state:
        m1.on()
    else:
        m1.off()
        
    if m2_state:
        m2.on()
    else:
        m2.off()
    
    print(f"Microstep mode set to: {mode_name} (M0={m0_state}, M1={m1_state}, M2={m2_state})")
    return True

# Flag to control the motor rotation
running = True

def signal_handler(sig, frame):
    global running
    print('\nStopping motor...')
    running = False
    cleanup_pins()

def cleanup_pins():
    """Clean up GPIO pins and disable motor to prevent overheating"""
    try:
        enable.on()  # Disable motor (HIGH = disabled) to prevent overheating
        step.off()
        m0.off()
        m1.off()
        m2.off()
        print("Motor disabled and GPIO pins cleaned up")
    except Exception as e:
        print(f"Error cleaning up pins: {e}")

def continuous_rotation(delay=0.08, steps=None):
    """Continuously rotate the motor until stopped or for a specified number of steps"""
    step_count = 0
    while running and (steps is None or step_count < steps):
        step.on()
        sleep(delay)
        step.off()
        sleep(delay)
        step_count += 1
    return step_count

def test_microstep_mode(mode_name, steps=200, delay=0.01):
    """Test a specific microstep mode"""
    print(f"\n--- Testing {mode_name} microstep mode ---")
    
    if not set_microstep_mode(mode_name):
        return
    
    # Enable motor for movement
    enable.off()  # Enable motor (LOW = enabled)
    print("Motor enabled")
    
    sleep(0.1)  # Brief pause to let pins settle
    
    print(f"Running {steps} steps with delay {delay}s...")
    step_count = continuous_rotation(delay=delay, steps=steps)
    print(f"Completed {step_count} steps in {mode_name} mode")
    
    # Disable motor to prevent overheating and allow cooling
    enable.on()  # Disable motor (HIGH = disabled)
    print("Motor disabled for cooling - preventing overheating")
    
    sleep(3)  # Cooling period

# Set up signal handler for Ctrl+C
signal.signal(signal.SIGINT, signal_handler)

print("Testing different microstep modes...")
print("Press Ctrl+C to stop the motor at any time")

# Test each microstep mode
for mode in ["thirty_second"]:  # Use 1/32 microsteps for maximum smoothness
    if not running:
        break
    # 2 full rotations = 2 * 200 steps * 32 microsteps = 12800 steps
    test_microstep_mode(mode, steps=12800, delay=0.001)  # 2 complete 360° rotations

print("\nMicrostep testing complete!")
cleanup_pins()
print("Motor stopped. Done!")
