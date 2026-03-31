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
STEP_DELAY = 0.0005  # Delay between step pulses in seconds (0.5ms for smooth operation)
# Motor runs continuously for this duration (seconds) unless the toggle stops it earlier.
MOTOR_RUN_DURATION_SEC = 240  # 4 minutes

# GPIO pin assignments (BCM numbering)
# Start control: physical toggle switch; each flip toggles exhibit on/off (not fixed ON=start / OFF=stop)
START_SWITCH_PIN = 5   # Toggle switch GPIO (physical pin 29); pull-down: open=LOW, closed to 3.3V=HIGH

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
# Start toggle switch state (logical on/off flips on every physical state change)
last_switch_state = None
start_toggle_logical_on = False
monitoring_active = True

# Selection button state
last_clk2_state = None
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
    """Run the motor for MOTOR_RUN_DURATION_SEC or until the toggle requests a stop."""
    global motor_running
    
    try:
        end_time = time.time() + MOTOR_RUN_DURATION_SEC
        print(
            f"Starting rotation for up to {MOTOR_RUN_DURATION_SEC}s "
            f"(until {time.strftime('%H:%M:%S', time.localtime(end_time))})"
        )
        
        # Enable motor for movement
        enable.off()  # Enable motor (LOW = enabled)
        print("Motor enabled")
        time.sleep(0.1)  # Brief pause to let pins settle
        
        steps_done = 0
        
        # Pulse STEP pin for each microstep: HIGH then LOW (with delay) moves motor one microstep.
        while not stop_event.is_set() and time.time() < end_time:
            step.on()
            time.sleep(STEP_DELAY)
            step.off()
            time.sleep(STEP_DELAY)
            steps_done += 1
        
        completed_full_duration = not stop_event.is_set()
        
        # Disable motor to prevent overheating
        enable.on()  # Disable motor (HIGH = disabled)
        print("Motor disabled for cooling - preventing overheating")
        
        if completed_full_duration:
            print(f"Completed full {MOTOR_RUN_DURATION_SEC}s run ({steps_done} microsteps)")
            try:
                sio.emit("motor-session-complete", {})
            except Exception as e:
                print(f"Socket.IO emit motor-session-complete failed: {e}")
        else:
            print(f"Rotation stopped early ({steps_done} microsteps)")
            
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
    """Callback when logical state is toggled to ON - sends start event."""
    print("Toggle → ON - sending start event!")
    
    # Send start event to web interface
    try:
        sio.emit('start-event', {})
    except Exception as e:
        print(f"Socket.IO emit failed: {e}")
    
    # Check if motor is already running
    if motor_running:
        print("Motor is already running, ignoring start button trigger")
        return
    
    print(f"Starting motor for up to {MOTOR_RUN_DURATION_SEC}s...")
    start_motor()

def start_button_stop_trigger():
    """Callback when logical state is toggled to OFF - sends stop event."""
    print("Toggle → OFF - sending stop event!")
    
    # Send stop event to web interface
    try:
        sio.emit('stop-event', {})
    except Exception as e:
        print(f"Socket.IO emit failed: {e}")
    
    # Stop motor
    print("Stopping motor due to toggle → OFF...")
    stop_motor()

def monitor_start_button():
    """On each physical state change, flip logical on/off and run start or stop accordingly."""
    global last_switch_state, start_toggle_logical_on, monitoring_active

    try:
        while monitoring_active:
            current = start_switch.value
            if current != last_switch_state:
                start_toggle_logical_on = not start_toggle_logical_on
                if start_toggle_logical_on:
                    start_button_trigger()
                else:
                    start_button_stop_trigger()
                last_switch_state = current
            time.sleep(0.02)  # 50 Hz poll
    except Exception as e:
        print(f"Error monitoring start toggle switch: {e}")

def monitor_selection_button():
    """Monitor the selection button for rotation and emit on each detent"""
    global last_clk2_state, monitoring_active
    
    skip_counter = 0  # Counter to skip every other pulse
    
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
                    rotation_direction = "clockwise"
                else:
                    rotation_direction = "counter-clockwise"
                
                skip_counter += 1
                
                # Only emit every other pulse (to get one event per detent)
                if skip_counter % 2 == 0:
                    try:
                        sio.emit('selection_button_rotated', {
                            'direction': rotation_direction
                        })
                    except Exception as e:
                        print(f"Socket.IO emit failed: {e}")
            
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
        except Exception as e:
            print(f"⚠️  Failed to connect to Node.js server: {e}")
            print("Continuing without web interface connection...")
        
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
        print(f"• Start Toggle Switch (GPIO {START_SWITCH_PIN}): Each flip toggles start/stop")
        print(f"• Selection Button (Pins CLK:{CLK2_PIN}, DT:{DT2_PIN}, SW:{SELECTION_SW_PIN}): Rotate + push")
        print(f"• Motor run duration per start: {MOTOR_RUN_DURATION_SEC}s")
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