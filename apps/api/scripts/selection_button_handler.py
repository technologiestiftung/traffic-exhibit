"""Handler for the selection button (rotary encoder) with pulse counting and event emission."""

import time
import platform
from typing import Optional

# Determine if we are on a Raspberry Pi
_pi_arch = platform.machine() in ["armv6l", "armv7l", "aarch64"]

try:
    if _pi_arch:
        from gpiozero import DigitalInputDevice
        _HAS_GPIO = True
    else:
        _HAS_GPIO = False
except ImportError:
    _HAS_GPIO = False


class SelectionButtonHandler:
    """Handles monitoring and event emission for the selection button (rotary encoder)."""
    
    # Configuration constants
    DEFAULT_PULSES_REQUIRED = 6
    DEFAULT_TOTAL_PULSES = 20
    POLLING_DELAY = 0.001  # 1ms delay to prevent excessive CPU usage
    NO_GPIO_SLEEP = 0.1  # Longer sleep when GPIO is not available
    
    def __init__(
        self,
        socketio_client,
        clk_pin: Optional[int] = None,
        dt_pin: Optional[int] = None,
        pulses_required: int = DEFAULT_PULSES_REQUIRED,
        total_pulses: int = DEFAULT_TOTAL_PULSES
    ):
        """
        Initialize the selection button handler.
        
        Args:
            socketio_client: Socket.IO client instance for emitting events
            clk_pin: GPIO pin number for CLK signal (BCM numbering)
            dt_pin: GPIO pin number for DT signal (BCM numbering)
            pulses_required: Number of pulses required before emitting event
            total_pulses: Total pulses for progress calculation
        """
        self.sio = socketio_client
        self.clk_pin = clk_pin
        self.dt_pin = dt_pin
        self.pulses_required = pulses_required
        self.total_pulses = total_pulses
        
        # Encoder state
        self.position = 0
        self.last_clk_state: Optional[bool] = None
        self.last_direction: Optional[str] = None
        
        # Pulse counting state
        self.pulse_count = 0
        self.current_direction_accumulator: Optional[str] = None
        
        # GPIO devices
        self.clk: Optional[DigitalInputDevice] = None
        self.dt: Optional[DigitalInputDevice] = None
        self.is_running = False
        
        # Initialize GPIO if available
        if _HAS_GPIO and clk_pin is not None and dt_pin is not None:
            self._initialize_gpio()
    
    def _initialize_gpio(self):
        """Initialize GPIO pins for the selection button."""
        try:
            self.clk = DigitalInputDevice(self.clk_pin, pull_up=True)
            self.dt = DigitalInputDevice(self.dt_pin, pull_up=True)
            self.last_clk_state = self.clk.value
            print(f"Selection button initialized - CLK: {self.clk_pin}, DT: {self.dt_pin}")
        except Exception as e:
            print(f"Failed to initialize selection button GPIO: {e}")
            self.clk = None
            self.dt = None
    
    def _determine_direction(self) -> tuple[str, str]:
        """
        Determine the rotation direction based on CLK and DT pin states.
        
        Returns:
            Tuple of (direction_label, direction_key) where:
            - direction_label: Human-readable direction ("Clockwise" or "Counter-Clockwise")
            - direction_key: Lowercase direction for events ("clockwise" or "counter-clockwise")
        """
        if self.dt is None:
            return "Unknown", "unknown"
        
        # Direction logic: if DT != CLK, it's counter-clockwise
        if self.dt.value != self.last_clk_state:
            return "Counter-Clockwise", "counter-clockwise"
        else:
            return "Clockwise", "clockwise"
    
    def _update_position(self, direction_key: str):
        """Update encoder position based on direction."""
        if direction_key == "clockwise":
            self.position += 1
        elif direction_key == "counter-clockwise":
            self.position -= 1
    
    def _reset_pulse_count_if_direction_changed(self, direction_key: str):
        """Reset pulse count if rotation direction has changed."""
        if (self.current_direction_accumulator is not None and 
            self.current_direction_accumulator != direction_key):
            self.pulse_count = 0
    
    def _should_emit_event(self) -> bool:
        """Check if enough pulses have been accumulated to emit an event."""
        return self.pulse_count >= self.pulses_required
    
    def _emit_rotation_event(self, direction_key: str, direction_label: str):
        """Emit rotation event to the web interface via Socket.IO."""
        try:
            self.sio.emit('selection_button_rotated', {
                'direction': direction_key,
                'position': self.position,
                'pulseCount': self.pulse_count
            })
        except Exception as e:
            print(f"Socket.IO emit failed: {e}")
    
    def _log_rotation_event(self, direction_label: str):
        """Log rotation event with progress information."""
        progress = abs(self.position) % self.total_pulses
        print(f"[SELECTION BUTTON] {self.pulse_count} pulses - Direction: {direction_label} "
              f"(progress: {progress}/{self.total_pulses})")
    
    def _process_encoder_pulse(self):
        """Process a single encoder pulse and handle event emission if needed."""
        if self.clk is None:
            return
        
        current_clk_state = self.clk.value
        
        # Check if CLK pin has changed state (edge detection)
        if current_clk_state != self.last_clk_state:
            # Determine direction
            direction_label, direction_key = self._determine_direction()
            
            # Update position
            self._update_position(direction_key)
            
            # Reset pulse count if direction changed
            self._reset_pulse_count_if_direction_changed(direction_key)
            
            # Update state
            self.current_direction_accumulator = direction_key
            self.pulse_count += 1
            self.last_direction = direction_label
            
            # Emit event if threshold reached
            if self._should_emit_event():
                self._emit_rotation_event(direction_key, direction_label)
                self._log_rotation_event(direction_label)
                self.pulse_count = 0  # Reset after emitting
            
            # Update CLK state
            self.last_clk_state = current_clk_state
    
    def monitor(self, encoder_running_flag):
        """
        Monitor the selection button in a loop.
        
        Args:
            encoder_running_flag: Thread-safe flag to control the monitoring loop
        """
        print("Starting selection button monitoring...")
        self.is_running = True
        
        try:
            while encoder_running_flag:
                if not _HAS_GPIO or self.clk is None:
                    time.sleep(self.NO_GPIO_SLEEP)
                    continue
                
                self._process_encoder_pulse()
                time.sleep(self.POLLING_DELAY)
                
        except Exception as e:
            print(f"Error monitoring selection button: {e}")
        finally:
            self.is_running = False
            print("Selection button monitoring stopped.")
    
    def get_state(self) -> dict:
        """Get current encoder state for debugging/monitoring."""
        return {
            'position': self.position,
            'pulse_count': self.pulse_count,
            'current_direction': self.current_direction_accumulator,
            'last_direction': self.last_direction,
            'is_running': self.is_running
        }

