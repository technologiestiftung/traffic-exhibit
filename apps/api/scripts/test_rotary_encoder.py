#!/usr/bin/env python3
"""
Rotary Encoder Test Script
Tests a rotary encoder connected to Raspberry Pi GPIO pins.
CLK pin: 5, DT pin: 6 (no SW button pin used)
"""

from gpiozero import DigitalInputDevice
from time import sleep
import signal
import sys

# Rotary encoder pins
CLK_PIN = 5   # Clock pin (was 7, changed due to SPI conflict)
DT_PIN = 6    # Data pin (was 8, changed due to SPI conflict)

# Initialize GPIO devices with pull-up resistors
clk = DigitalInputDevice(CLK_PIN, pull_up=True)
dt = DigitalInputDevice(DT_PIN, pull_up=True)

# Global variables
running = True
position = 0
last_clk_state = clk.value

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    global running
    print('\nStopping rotary encoder test...')
    running = False

def cleanup_pins():
    """Clean up GPIO pins"""
    try:
        clk.close()
        dt.close()
        print("GPIO pins cleaned up")
    except Exception as e:
        print(f"Error cleaning up pins: {e}")

def test_direction_changes():
    """Test specifically for direction changes in encoder rotation"""
    global position, last_clk_state
    
    print("=== Direction Change Test ===")
    print("CLK Pin:", CLK_PIN)
    print("DT Pin:", DT_PIN)
    print("This test focuses on detecting direction changes")
    print("Rotate clockwise, then counter-clockwise to test direction detection")
    print("Press Ctrl+C to stop\n")
    
    # Initialize variables
    last_clk_state = clk.value
    last_direction = None
    direction_changes = 0
    
    print(f"Initial CLK state: {last_clk_state}")
    print(f"Initial DT state: {dt.value}")
    print("Waiting for rotation...\n")
    
    try:
        while running:
            current_clk_state = clk.value
            
            # Check if CLK pin has changed state (falling edge detection)
            if current_clk_state != last_clk_state:
                # Determine direction
                if dt.value != current_clk_state:
                    current_direction = "Counter-clockwise"  # Swapped
                    position -= 1
                else:
                    current_direction = "Clockwise"  # Swapped
                    position += 1 
                
                # Check for direction change
                if last_direction is not None and last_direction != current_direction:
                    direction_changes += 1
                    print(f"🔄 DIRECTION CHANGE #{direction_changes}: {last_direction} → {current_direction}")
                    print(f"   Position: {position:4d}")
                    print()
                elif last_direction != current_direction:
                    print(f"Initial direction: {current_direction}")
                    print(f"Position: {position:4d}")
                    print()
                
                last_direction = current_direction
            
            last_clk_state = current_clk_state
            sleep(0.001)  # Small delay to prevent excessive CPU usage
            
    except Exception as e:
        print(f"Error during direction change test: {e}")
    
    print(f"\nTest Summary:")
    print(f"Total direction changes detected: {direction_changes}")
    print(f"Final position: {position}")
    if direction_changes > 0:
        print("✅ Direction change detection is working!")
    else:
        print("⚠️  No direction changes detected. Try rotating the encoder in both directions.")

def main():
    """Main test function - focuses only on direction changes"""
    print("Rotary Encoder Direction Change Test")
    print("=" * 40)
    print(f"CLK connected to GPIO pin {CLK_PIN}")
    print(f"DT connected to GPIO pin {DT_PIN}")
    print("SW pin not used")
    print()
    print("NOTE: Wiring instructions:")
    print("      - Connect CLK to GPIO pin 5 (physical pin 29)")
    print("      - Connect DT to GPIO pin 6 (physical pin 31)")
    print("      - Connect VCC to 3.3V (physical pin 1 or 17)")
    print("      - Connect GND to ground (physical pin 6, 9, 14, 20, 25, 30, 34, or 39)")
    print("      (Pins 7 and 8 are reserved for SPI)")
    print()
    
    # Set up signal handler for Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Only test direction changes
        test_direction_changes()
            
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Error during testing: {e}")
    finally:
        cleanup_pins()
        print("\nDirection change test completed!")

if __name__ == "__main__":
    main()