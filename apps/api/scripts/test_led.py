#!/usr/bin/env python3
"""
LED Test Script for Raspberry Pi 5
Tests a 5V LED connected to GPIO pin 26

Note: Raspberry Pi GPIO pins output 3.3V. For a 5V LED, you may need:
- A current-limiting resistor (typically 220-330 ohms)
- Or a transistor/MOSFET if the LED requires more current
"""

from gpiozero import LED
from time import sleep
import signal
import sys

# GPIO pin for the LED (BCM numbering)
LED_PIN = 26

# Initialize LED
led = LED(LED_PIN, active_high=True)

# Flag to control the loop
running = True

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    global running
    print('\nStopping LED test...')
    running = False
    cleanup()

def cleanup():
    """Turn off LED and clean up GPIO pin"""
    try:
        led.off()
        print("LED turned off. GPIO pin cleaned up.")
    except Exception as e:
        print(f"Error cleaning up: {e}")

def blink_led(times=10, on_duration=0.5, off_duration=0.5):
    """Blink the LED a specified number of times"""
    print(f"Blinking LED {times} times...")
    for i in range(times):
        if not running:
            break
        print(f"  Blink {i+1}/{times}")
        led.on()
        sleep(on_duration)
        led.off()
        sleep(off_duration)

def test_continuous_blink(interval=1.0):
    """Continuously blink the LED until stopped"""
    print(f"Continuous blinking (interval: {interval}s). Press Ctrl+C to stop...")
    while running:
        led.on()
        sleep(interval)
        if not running:
            break
        led.off()
        sleep(interval)

# Set up signal handler for Ctrl+C
signal.signal(signal.SIGINT, signal_handler)

if __name__ == "__main__":
    print("=" * 50)
    print("LED Test Script - GPIO Pin 26")
    print("=" * 50)
    print(f"LED connected to GPIO pin {LED_PIN}")
    print("Press Ctrl+C to stop at any time\n")
    
    try:
        # Test 1: Quick blink test
        print("Test 1: Quick blink (5 times, 0.2s intervals)")
        blink_led(times=5, on_duration=0.2, off_duration=0.2)
        
        if not running:
            cleanup()
            sys.exit(0)
        
        sleep(1)
        
        # Test 2: Slow blink test
        print("\nTest 2: Slow blink (3 times, 1s intervals)")
        blink_led(times=3, on_duration=1.0, off_duration=1.0)
        
        if not running:
            cleanup()
            sys.exit(0)
        
        sleep(1)
        
        # Test 3: Continuous blink
        print("\nTest 3: Continuous blink")
        test_continuous_blink(interval=0.5)
        
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cleanup()
        print("\nLED test complete!")

