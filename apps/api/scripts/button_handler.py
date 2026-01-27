"""Button handler for managing on-off button and rotary encoder callbacks."""

import platform

# Determine if we are on a Raspberry Pi
_pi_arch = platform.machine() in ["armv6l", "armv7l", "aarch64"]

try:
    if _pi_arch:
        from gpiozero import Button
        _HAS_GPIO = True
    else:
        _HAS_GPIO = False
except ImportError:
    _HAS_GPIO = False


class ButtonHandler:
    """Handles all button-related functionality including on-off button and rotary encoder callbacks"""
    
    def __init__(self, socketio_client, motor_control, system_state):
        """
        Initialize button handler
        
        Args:
            socketio_client: Socket.IO client instance
            motor_control: Object with start_motor() and stop_motor() methods
            system_state: Dictionary with 'system_enabled' key
        """
        self.sio = socketio_client
        self.motor_control = motor_control
        self.system_state = system_state
        self.button = None
    
    def initialize_button(self, button_pin):
        """Initialize the on-off button if GPIO is available"""
        if _HAS_GPIO:
            try:
                self.button = Button(button_pin, pull_up=True)
                self.button.when_pressed = self.on_pressed
                print(f"On-off button initialized on pin {button_pin}")
                return True
            except Exception as e:
                print(f"Button initialization failed: {e}")
                return False
        return False
    
    def on_pressed(self):
        """Handle on-off button press - toggles system enabled state"""
        self.system_state['system_enabled'] = not self.system_state['system_enabled']
        status = "ENABLED" if self.system_state['system_enabled'] else "DISABLED"
        
        print(f"\n=== ON-OFF BUTTON PRESSED ===")
        print(f"System is now: {status}")
        
        if not self.system_state['system_enabled']:
            print("System disabled - stopping motor and ignoring rotary encoder")
            self.motor_control.stop_motor()
        else:
            print("System enabled - rotary encoder is now active")
        
        self._emit_system_state()
        print("=" * 30)
    
    def _emit_system_state(self):
        """Emit system state change to web interface"""
        try:
            self.sio.emit('system_state_changed', {
                'systemEnabled': self.system_state['system_enabled']
            })
        except Exception as e:
            print(f"Socket.IO emit failed: {e}")
    
    def handle_rotary_start(self, rotations_per_press=2):
        """Handle clockwise rotary encoder rotation - starts motor"""
        if not self.system_state['system_enabled']:
            print("System disabled - ignoring rotary encoder input")
            return
        
        print("Clockwise rotation detected - sending start event!")
        self._emit_start_event()
        
        if self.motor_control.is_running():
            print("Motor is already running, ignoring encoder trigger")
            return
        
        print(f"Starting motor for {rotations_per_press} complete rotations...")
        self.motor_control.start_motor()
    
    def handle_rotary_stop(self):
        """Handle counter-clockwise rotary encoder rotation - stops motor"""
        if not self.system_state['system_enabled']:
            print("System disabled - ignoring rotary encoder input")
            return
        
        print("Counter-clockwise rotation detected - sending stop event!")
        self._emit_stop_event()
        
        print("Stopping motor due to counter-clockwise rotation...")
        self.motor_control.stop_motor()
    
    def _emit_start_event(self):
        """Emit start event to web interface"""
        try:
            self.sio.emit('start-event', {})
        except Exception as e:
            print(f"Socket.IO emit failed: {e}")
    
    def _emit_stop_event(self):
        """Emit stop event to web interface"""
        try:
            self.sio.emit('stop-event', {})
        except Exception as e:
            print(f"Socket.IO emit failed: {e}")

