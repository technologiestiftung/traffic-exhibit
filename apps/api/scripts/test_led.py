#!/usr/bin/env python3
"""
LED Test Script for Raspberry Pi 5
Tests a WS2813 LED strip connected to GPIO pin 19

WS2813 LED Strip Configuration:
- WS2813 is compatible with WS281x protocol
- Requires rpi_ws281x library: pip install rpi-ws281x
- May need to run with sudo: sudo python3 test_led.py
- GPIO 19 on Raspberry Pi 5: Uses PWM channel 1 (PWM1) - excellent choice!
- Other recommended pins:
  - GPIO 18 or 21 (PCM channel - default, no config needed)
  - GPIO 12, 13 (PWM channels)
  - GPIO 10, 38 (SPI channel - requires config changes)

Power Requirements:
- WS2813 LEDs can consume significant power
- Consider using a separate 5V power supply for longer strips
- Connect GND from power supply to Raspberry Pi GND
"""

import time
import signal
import sys

# Try to import LED strip library, fall back to simple LED
HAS_WS281X = False
HAS_GPIOZERO = False

try:
    from rpi_ws281x import PixelStrip, Color
    HAS_WS281X = True
except ImportError:
    pass

try:
    from gpiozero import LED
    HAS_GPIOZERO = True
except ImportError:
    pass

if not HAS_WS281X and not HAS_GPIOZERO:
    print("Error: Neither rpi_ws281x nor gpiozero is installed.")
    print("For LED strips: pip install rpi-ws281x")
    print("For simple LEDs: pip install gpiozero")
    sys.exit(1)

# GPIO pin for the LED (BCM numbering)
LED_PIN = 19

# WS2813 LED strip configuration
# IMPORTANT: Set LED_COUNT to match the number of LEDs in your strip
LED_COUNT = 10      # Number of LED pixels (adjust to match your strip length)
LED_FREQ_HZ = 800000  # LED signal frequency in hertz (800kHz for WS2813)
LED_DMA = 10        # DMA channel to use (10 is safe, avoid 5 which is used by SD card)
LED_BRIGHTNESS = 255  # Set to 0 for darkest and 255 for brightest (start lower for testing)
LED_INVERT = False  # True to invert the signal (when using NPN transistor level shift)
# GPIO 19 on Raspberry Pi 5 uses PWM channel 1 (PWM1)
# For GPIO 18/21 use channel 0, for GPIO 12/13/19 use channel 1
LED_CHANNEL = 1     # PWM channel: 0 for GPIO 12, 18, 26; 1 for GPIO 13, 19

# Global variables for LED/strip objects (initialized in main)
strip = None
led = None

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
        if HAS_WS281X and strip:
            # Turn off all LEDs in the strip
            for i in range(strip.numPixels()):
                strip.setPixelColor(i, Color(0, 0, 0))
            strip.show()
            print("LED strip turned off. GPIO pin cleaned up.")
        elif led:
            led.off()
            print("LED turned off. GPIO pin cleaned up.")
    except Exception as e:
        print(f"Error cleaning up: {e}")

def color_wipe(strip, color, wait_ms=50):
    """Wipe color across strip a pixel at a time."""
    for i in range(strip.numPixels()):
        if not running:
            break
        strip.setPixelColor(i, color)
        strip.show()
        time.sleep(wait_ms/1000.0)

def blink_led(times=10, on_duration=0.5, off_duration=0.5):
    """Blink the LED a specified number of times"""
    if HAS_WS281X and strip:
        print(f"Blinking LED strip {times} times...")
        for i in range(times):
            if not running:
                break
            print(f"  Blink {i+1}/{times}")
            # Turn all LEDs on (white)
            for j in range(strip.numPixels()):
                strip.setPixelColor(j, Color(255, 255, 255))
            strip.show()
            time.sleep(on_duration)
            # Turn all LEDs off
            for j in range(strip.numPixels()):
                strip.setPixelColor(j, Color(0, 0, 0))
            strip.show()
            time.sleep(off_duration)
    elif led:
        print(f"Blinking LED {times} times...")
        for i in range(times):
            if not running:
                break
            print(f"  Blink {i+1}/{times}")
            led.on()
            time.sleep(on_duration)
            led.off()
            time.sleep(off_duration)

def test_continuous_blink(interval=1.0):
    """Continuously blink the LED until stopped"""
    if HAS_WS281X and strip:
        print(f"Continuous blinking (interval: {interval}s). Press Ctrl+C to stop...")
        while running:
            for j in range(strip.numPixels()):
                strip.setPixelColor(j, Color(255, 255, 255))
            strip.show()
            time.sleep(interval)
            if not running:
                break
            for j in range(strip.numPixels()):
                strip.setPixelColor(j, Color(0, 0, 0))
            strip.show()
            time.sleep(interval)
    elif led:
        print(f"Continuous blinking (interval: {interval}s). Press Ctrl+C to stop...")
        while running:
            led.on()
            time.sleep(interval)
            if not running:
                break
            led.off()
            time.sleep(interval)

# Set up signal handler for Ctrl+C
signal.signal(signal.SIGINT, signal_handler)

if __name__ == "__main__":
    # Initialize based on available library
    if HAS_WS281X:
        print("Detected rpi_ws281x library - using WS2813 LED strip mode")
        print(f"Initializing WS2813 strip on GPIO {LED_PIN}...")
        try:
            # GPIO 19 uses PWM channel 1 (PWM1) on Raspberry Pi 5
            strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS, LED_CHANNEL)
            strip.begin()
            print(f"✓ WS2813 strip initialized successfully!")
            print(f"  - {LED_COUNT} pixels")
            print(f"  - GPIO pin: {LED_PIN}")
            print(f"  - PWM channel: {LED_CHANNEL}")
            print(f"  - Brightness: {LED_BRIGHTNESS}/255")
            led = None
        except Exception as e:
            print(f"✗ Error initializing WS2813 strip: {e}")
            print("\nTroubleshooting tips:")
            print("1. Try running with sudo: sudo python3 test_led.py")
            print("2. GPIO 19 uses PWM channel 1 - this should work well on Pi 5")
            print("3. Check wiring: DIN to GPIO pin, 5V to 5V, GND to GND")
            print("4. Ensure rpi_ws281x is installed: pip install rpi-ws281x")
            if HAS_GPIOZERO:
                print("\nFalling back to simple LED mode...")
                strip = None
                led = LED(LED_PIN, active_high=True)
            else:
                print("\nCannot initialize LED. Exiting.")
                sys.exit(1)
    else:
        print("Using gpiozero library - using simple LED mode")
        led = LED(LED_PIN, active_high=True)
        strip = None
    
    print("=" * 50)
    print("WS2813 LED Strip Test - Raspberry Pi 5")
    print("=" * 50)
    print(f"LED strip connected to GPIO pin {LED_PIN}")
    if HAS_WS281X and strip:
        print(f"WS2813 strip: {LED_COUNT} pixels")
        print(f"GPIO {LED_PIN} uses PWM channel {LED_CHANNEL} on Raspberry Pi 5")
        print("This is an excellent pin choice for WS2813 LED strips!")
    print("Press Ctrl+C to stop at any time\n")
    
    try:
        if HAS_WS281X and strip:
            # WS2813 LED Strip Tests
            print("Test 1: Color wipe animations (testing all colors)")
            print("  Red wipe...")
            color_wipe(strip, Color(255, 0, 0), wait_ms=100)
            if not running:
                cleanup()
                sys.exit(0)
            
            print("  Green wipe...")
            color_wipe(strip, Color(0, 255, 0), wait_ms=100)
            if not running:
                cleanup()
                sys.exit(0)
            
            print("  Blue wipe...")
            color_wipe(strip, Color(0, 0, 255), wait_ms=100)
            if not running:
                cleanup()
                sys.exit(0)
            
            print("  White wipe...")
            color_wipe(strip, Color(255, 255, 255), wait_ms=100)
            if not running:
                cleanup()
                sys.exit(0)
            
            print("  Turn off...")
            color_wipe(strip, Color(0, 0, 0), wait_ms=100)
            
            time.sleep(1)
            
            # Test 2: Quick blink
            print("\nTest 2: Quick blink (5 times, 0.2s intervals)")
            blink_led(times=5, on_duration=0.2, off_duration=0.2)
            
            if not running:
                cleanup()
                sys.exit(0)
            
            time.sleep(1)
            
            # Test 3: Continuous blink
            print("\nTest 3: Continuous blink")
            test_continuous_blink(interval=0.5)
        else:
            # Simple LED Tests
            # Test 1: Quick blink test
            print("Test 1: Quick blink (5 times, 0.2s intervals)")
            blink_led(times=5, on_duration=0.2, off_duration=0.2)
            
            if not running:
                cleanup()
                sys.exit(0)
            
            time.sleep(1)
            
            # Test 2: Slow blink test
            print("\nTest 2: Slow blink (3 times, 1s intervals)")
            blink_led(times=3, on_duration=1.0, off_duration=1.0)
            
            if not running:
                cleanup()
                sys.exit(0)
            
            time.sleep(1)
            
            # Test 3: Continuous blink
            print("\nTest 3: Continuous blink")
            test_continuous_blink(interval=0.5)
        
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cleanup()
        print("\nLED test complete!")

