#!/usr/bin/env python3
import time
import socketio
import sys
import signal
import threading
try:
    from gpiozero import OutputDevice, DigitalInputDevice
except ImportError:
    print("This script requires a Raspberry Pi with gpiozero. Install: pip install gpiozero")
    sys.exit(1)

# =============================================
# Configuration
# =============================================
# Motor configuration
FULL_STEPS_PER_REV = 200  # Number of full steps per revolution for 1.8° motor
STEP_DELAY = 0.0005  # Delay between step pulses in seconds (0.5ms for smooth operation)
ROTATIONS_PER_PRESS = 2  # Number of complete rotations to perform when triggered

# GPIO pin assignments (BCM numbering)
# Start control: toggle switch (ON = start, OFF = stop)
START_SWITCH_PIN = 5   # Toggle switch GPIO (physical pin 29); pull-down: OFF=LOW, ON=HIGH

# Selection button pins (step counter)
CLK2_PIN = 12   # Selection button rotary encoder CLK pin
DT2_PIN = 16    # Selection button rotary encoder DT pin
SELECTION_SW_PIN = 6   # Selection button push switch (SW); pull-up: pressed = LOW

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
# Start toggle switch state
last_switch_state = None
monitoring_active = True

# Selection button state
selection_button_position = 0
last_clk2_state = None
last_direction2 = None
last_sw_state = None

# Motor control state
motor_running = False
stop_event = threading.Event()
motor_thread = None

# Initialize pins using gpiozero
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
    
    # Start toggle switch (pull-down: OFF=LOW, ON=HIGH)
    start_switch = DigitalInputDevice(START_SWITCH_PIN, pull_up=False)
    last_switch_state = start_switch.value
    
    # Selection button pins (rotary encoder + push switch)
    clk2 = DigitalInputDevice(CLK2_PIN, pull_up=True)
    dt2 = DigitalInputDevice(DT2_PIN, pull_up=True)
    selection_sw = DigitalInputDevice(SELECTION_SW_PIN, pull_up=True)  # SW: pressed = LOW
    last_clk2_state = clk2.value
    last_sw_state = selection_sw.value
    
    print("=== GPIO Initialization Complete ===")
    print(f"Motor pins - STEP: {STEP_PIN}, DIR: {DIRECTION_PIN}, ENABLE: {ENABLE_PIN}")
    print(f"Microstep pins - M0: {M0_PIN}, M1: {M1_PIN}, M2: {M2_PIN}")
    print(f"Start toggle switch - GPIO: {START_SWITCH_PIN}")
    print(f"Selection button pins - CLK2: {CLK2_PIN}, DT2: {DT2_PIN}, SW: {SELECTION_SW_PIN}")
    print("Microstep mode: 1/32 for quiet operation")
    
except Exception as e:
    print(f"GPIO initialization failed: {e}")
    sys.exit(1)

# =============================================
# Socket.IO client setup
# =============================================
sio = socketio.Client()

# =============================================
# Motor Control Functions (same as working simple script)
# =============================================

def do_rotation():
    """Perform motor rotation"""
    global motor_running
    
    try:
        # Calculate steps for microstep mode (same as test_motor.py)
        # 2 full rotations = 2 * 200 steps * 32 microsteps = 12800 steps
        target_steps = ROTATIONS_PER_PRESS * FULL_STEPS_PER_REV * 32  # 32 for 1/32 microsteps
        
        print(f"Starting rotation for {ROTATIONS_PER_PRESS} revolutions ({target_steps} microsteps)")
        
        # Enable motor for movement
        enable.off()  # Enable motor (LOW = enabled)
        print("Motor enabled")
        time.sleep(0.1)  # Brief pause to let pins settle
        
        steps_done = 0
        
        # Pulse STEP pin for each microstep: HIGH then LOW (with delay) moves motor one microstep.
        while not stop_event.is_set() and steps_done < target_steps:
            step.on()
            time.sleep(STEP_DELAY)
            step.off()
            time.sleep(STEP_DELAY)
            steps_done += 1
        
        # Disable motor to prevent overheating
        enable.on()  # Disable motor (HIGH = disabled)
        print("Motor disabled for cooling - preventing overheating")
        
        if steps_done >= target_steps:
            print(f"Completed {ROTATIONS_PER_PRESS} rotations ({steps_done} microsteps)")
        else:
            print("Rotation stopped early")
            
    except Exception as e:
        print(f"Motor error: {e}")
    finally:
        enable.on()  # Ensure motor is disabled
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
    try:
        enable.on()  # Disable motor (HIGH = disabled)
        print("Motor disabled for cleanup - preventing overheating")
    except Exception as e:
        print(f"Error disabling motor: {e}")

def cleanup_and_exit(_signum=None, _frame=None):
    print("\nCleaning up...")
    global monitoring_active
    monitoring_active = False  # Stop monitoring threads
    try:
        cleanup_motor()
    except Exception as e:  # noqa: BLE001
        print(f"Motor cleanup error: {e}")
    try:
        start_switch.close()
    except Exception as e:  # noqa: BLE001
        print(f"Switch cleanup error: {e}")
    try:
        selection_sw.close()
    except Exception as e:  # noqa: BLE001
        print(f"Selection SW cleanup error: {e}")
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

def start_button_trigger():
    """Callback when toggle switch is ON - sends start event"""
    print("Toggle switch ON - sending start event!")
    
    # Send start event to web interface
    try:
        sio.emit('start-event', {})
    except Exception as e:
        print(f"Socket.IO emit failed: {e}")
    
    # Check if motor is already running
    if motor_running:
        print("Motor is already running, ignoring start button trigger")
        return
    
    print(f"Starting motor for {ROTATIONS_PER_PRESS} complete rotations...")
    start_motor()

def start_button_stop_trigger():
    """Callback when toggle switch is OFF - sends stop event"""
    print("Toggle switch OFF - sending stop event!")
    
    # Send stop event to web interface
    try:
        sio.emit('stop-event', {})
    except Exception as e:
        print(f"Socket.IO emit failed: {e}")
    
    # Stop motor
    print("Stopping motor due to toggle switch OFF...")
    stop_motor()

def apply_initial_start_switch_state():
    """Check start switch position at boot and trigger start or stop so app/motor match physical switch."""
    global last_switch_state
    current = start_switch.value
    last_switch_state = current
    if current:
        # HIGH = stop position
        # start_button_stop_trigger()
        print("Start switch initial position: OFF (stop)")
    else:
        # LOW = start position
        # start_button_trigger()
        print("Start switch initial position: ON (start)")

def monitor_start_button():
    """Monitor toggle switch. Inverted so HIGH = stop, LOW = start (matches typical wiring)."""
    global last_switch_state, monitoring_active
    
    try:
        while monitoring_active:
            current = start_switch.value
            if current != last_switch_state:
                if current:
                    start_button_stop_trigger()
                else:
                    start_button_trigger()
                last_switch_state = current
            time.sleep(0.02)  # 50 Hz poll
    except Exception as e:
        print(f"Error monitoring start toggle switch: {e}")

def monitor_selection_button():
    """Monitor the selection button for rotation and emit on each detent"""
    global selection_button_position, last_clk2_state, last_direction2, monitoring_active
    
    pulse_count = 0
    skip_counter = 0  # Counter to skip every other pulse
    TOTAL_PULSES = 20
    
    try:
        while monitoring_active:
            current_clk2_state = clk2.value
            
            # Detect any state change
            if current_clk2_state != last_clk2_state:
                # Determine direction: use CLK edge (rising vs falling) + DT state
                # Quadrature: one signal leads the other; edge type + DT disambiguates.
                rising_edge = last_clk2_state is False and current_clk2_state is True
                dt_val = dt2.value
                if rising_edge:
                    direction_clockwise = not dt_val  # CW when DT is low on CLK rise
                else:
                    direction_clockwise = dt_val  # CW when DT is high on CLK fall
                if direction_clockwise:
                    current_direction2 = "Clockwise"
                    selection_button_position += 1
                    direction = "clockwise"
                else:
                    current_direction2 = "Counter-Clockwise"
                    selection_button_position -= 1
                    direction = "counter-clockwise"
                
                skip_counter += 1
                
                # Only emit every other pulse (to get one event per detent)
                if skip_counter % 2 == 0:
                    pulse_count += 1
                    try:
                        sio.emit('selection_button_rotated', {
                            'direction': direction
                        })
                    except Exception as e:
                        print(f"Socket.IO emit failed: {e}")
                
                # Update direction tracking
                last_direction2 = current_direction2
            
            last_clk2_state = current_clk2_state
            time.sleep(0.001)  # Small delay to prevent excessive CPU usage
            
    except Exception as e:
        print(f"Error monitoring selection button: {e}")

def monitor_selection_sw_button():
    """Monitor the selection button SW (push). Emit selection_button_pressed on press."""
    global last_sw_state, monitoring_active

    try:
        while monitoring_active:
            current = selection_sw.value
            # With pull-up: not pressed = HIGH (True), pressed = LOW (False)
            if not current and last_sw_state:
                # Transition HIGH -> LOW = button pressed
                try:
                    sio.emit("selection_button_pressed", {})
                except Exception as e:
                    print(f"Socket.IO emit failed: {e}")
            last_sw_state = current
            time.sleep(0.02)  # 50 Hz poll
    except Exception as e:
        print(f"Error monitoring selection SW button: {e}")

def main():
    """Main function - handles start toggle switch and selection button"""
    try:
        print("=== Traffic Exhibit Control System ===")
        print("Initializing...")
        
        # Try to connect to Node.js server (optional)
        server_url = 'http://localhost:3001'
        print(f"Attempting connection to {server_url}...")
        try:
            sio.connect(server_url)
            print("✅ Connected to Node.js server")
            # Apply initial switch state so frontend and motor match physical switch
            time.sleep(0.1)
            apply_initial_start_switch_state()
        except Exception as e:
            print(f"⚠️  Failed to connect to Node.js server: {e}")
            print("Continuing without web interface connection...")
            apply_initial_start_switch_state()
        
        # Start button monitoring in a separate thread
        start_button_thread = threading.Thread(target=monitor_start_button, daemon=True)
        start_button_thread.start()
        
        # Selection button monitoring in a separate thread
        selection_button_thread = threading.Thread(target=monitor_selection_button, daemon=True)
        selection_button_thread.start()

        # Selection button SW (push) monitoring
        selection_sw_thread = threading.Thread(target=monitor_selection_sw_button, daemon=True)
        selection_sw_thread.start()
        
        print("\n=== System Ready ===")
        print("Controls:")
        print(f"• Start Toggle Switch (GPIO {START_SWITCH_PIN}): Motor control")
        print("  - ON: Start motor")
        print("  - OFF: Stop motor")
        print(f"• Selection Button (Pins CLK:{CLK2_PIN}, DT:{DT2_PIN}, SW:{SELECTION_SW_PIN}): Rotate + push")
        print(f"• Motor rotations per trigger: {ROTATIONS_PER_PRESS}")
        print("\nPress Ctrl+C to exit")
        print("=" * 40)
        
        # Keep the script running
        while True:
            time.sleep(1)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cleanup_and_exit(None, None)

if __name__ == "__main__":
    main()