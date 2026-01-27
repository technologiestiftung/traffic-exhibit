"""Motor control functionality for stepper motor management."""

import time
import threading
import platform

# Determine if we are on a Raspberry Pi
_pi_arch = platform.machine() in ["armv6l", "armv7l", "aarch64"]

try:
    if _pi_arch:
        from gpiozero import OutputDevice
        _HAS_GPIO = True
    else:
        _HAS_GPIO = False
except ImportError:
    _HAS_GPIO = False


class MotorControl:
    """Encapsulates motor control functionality"""
    
    def __init__(self, step_pin, enable_pin, rotations_per_press, full_steps_per_rev, step_delay):
        """
        Initialize motor control
        
        Args:
            step_pin: GPIO pin for step control
            enable_pin: GPIO pin for enable control
            rotations_per_press: Number of rotations per trigger
            full_steps_per_rev: Full steps per revolution
            step_delay: Delay between step pulses in seconds
        """
        self.step_pin = step_pin
        self.enable_pin = enable_pin
        self.rotations_per_press = rotations_per_press
        self.full_steps_per_rev = full_steps_per_rev
        self.step_delay = step_delay
        
        self.motor_running = False
        self.stop_event = threading.Event()
        self.motor_thread = None
        
        # Initialize GPIO pins if available
        if _HAS_GPIO:
            try:
                self.step = OutputDevice(step_pin, initial_value=False) if step_pin else None
                self.enable = OutputDevice(enable_pin, initial_value=True) if enable_pin else None  # Start disabled
            except Exception as e:
                print(f"Motor GPIO initialization failed: {e}")
                self.step = None
                self.enable = None
        else:
            self.step = None
            self.enable = None
    
    def _do_rotation(self):
        """Perform motor rotation - internal method"""
        try:
            # Calculate steps for microstep mode (1/32 microsteps)
            # rotations * 200 steps * 32 microsteps
            target_steps = self.rotations_per_press * self.full_steps_per_rev * 32
            
            print(f"Starting rotation for {self.rotations_per_press} revolutions ({target_steps} microsteps)")
            
            if _HAS_GPIO and self.enable:
                # Enable motor for movement
                self.enable.off()  # Enable motor (LOW = enabled)
                print("Motor enabled")
                time.sleep(0.1)  # Brief pause to let pins settle
            
            steps_done = 0
            
            while not self.stop_event.is_set() and steps_done < target_steps:
                if _HAS_GPIO and self.step:
                    # Step pulse
                    self.step.on()
                    time.sleep(self.step_delay)
                    self.step.off()
                    time.sleep(self.step_delay)
                else:
                    # Simulation mode
                    time.sleep(self.step_delay * 2)
                
                steps_done += 1
                
                # Print progress every 1000 steps
                if steps_done % 1000 == 0:
                    if _HAS_GPIO:
                        print(f"Microsteps completed: {steps_done}")
                    else:
                        print(f"[SIMULATION] Microsteps completed: {steps_done}")
            
            if _HAS_GPIO and self.enable:
                # Disable motor to prevent overheating
                self.enable.on()  # Disable motor (HIGH = disabled)
                print("Motor disabled for cooling - preventing overheating")
            
            if steps_done >= target_steps:
                print(f"Completed {self.rotations_per_press} rotations ({steps_done} microsteps)")
            else:
                print("Rotation stopped early")
                
        except Exception as e:
            print(f"Motor error: {e}")
        finally:
            if _HAS_GPIO and self.enable:
                # Ensure motor is disabled
                self.enable.on()  # Disable motor (HIGH = disabled)
            self.motor_running = False
            print("Motor stopped.")
    
    def start_motor(self):
        """Start the motor rotation"""
        if self.motor_running:
            print("Motor is already running, ignoring request")
            return False
        
        self.motor_running = True
        self.stop_event.clear()
        self.motor_thread = threading.Thread(target=self._do_rotation, daemon=True)
        self.motor_thread.start()
        return True
    
    def stop_motor(self):
        """Stop the motor rotation"""
        if self.motor_running:
            print("Stopping motor...")
            self.stop_event.set()
            if self.motor_thread and self.motor_thread.is_alive():
                self.motor_thread.join(timeout=2)
    
    def is_running(self):
        """Check if motor is currently running"""
        return self.motor_running
    
    def cleanup(self):
        """Clean up motor resources"""
        self.stop_motor()
        if _HAS_GPIO and self.enable:
            try:
                self.enable.on()  # Disable motor (HIGH = disabled)
                print("Motor disabled for cleanup - preventing overheating")
            except Exception as e:
                print(f"Error disabling motor: {e}")

