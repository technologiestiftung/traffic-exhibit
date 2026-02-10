#!/usr/bin/env python3
"""
Toggle switch test script.
Tests a toggle switch (e.g. 3A 250V mini) used as a low-voltage logic input on Raspberry Pi.
Replaces the rotary encoder for start/stop: ON = start, OFF = stop.

Wiring (see CIRCUIT_TOGGLE_SWITCH.md for diagram):
  - Switch terminal 1 → GPIO 5 (BCM), physical pin 29
  - Switch terminal 2 → 3.3V, physical pin 1 or 17
  - Use internal pull-down so when switch is open, GPIO reads LOW.
"""

import sys
import signal
import time

try:
    from gpiozero import DigitalInputDevice
except ImportError:
    print("This script requires gpiozero. Install: pip install gpiozero")
    sys.exit(1)

# Same pin as original start button (reusing one of the rotary pins)
SWITCH_PIN = 5  # BCM 5, physical pin 29

running = True
switch = None


def signal_handler(sig, frame):
    global running
    print("\nStopping toggle switch test...")
    running = False


def main():
    global running, switch

    print("=== Toggle Switch Test ===")
    print("=" * 50)
    print(f"Switch GPIO: BCM {SWITCH_PIN} (physical pin 29)")
    print()
    print("Wiring:")
    print("  • One switch terminal → GPIO 5 (physical pin 29)")
    print("  • Other switch terminal → 3.3V (physical pin 1 or 17)")
    print("  • Internal pull-down: OFF = LOW, ON = HIGH")
    print()
    print("Expected: Flip ON → 'START', Flip OFF → 'STOP'")
    print("Press Ctrl+C to exit")
    print("=" * 50)

    # Pull-down: when switch is open, pin reads False (LOW); when closed to 3.3V, True (HIGH)
    switch = DigitalInputDevice(SWITCH_PIN, pull_up=False)

    signal.signal(signal.SIGINT, signal_handler)

    last_state = switch.value
    print(f"Initial state: {'ON (HIGH) - START' if last_state else 'OFF (LOW) - STOP'}\n")

    try:
        while running:
            current = switch.value
            if current != last_state:
                if current:
                    print("  → START (switch ON)")
                else:
                    print("  → STOP (switch OFF)")
                last_state = current
            time.sleep(0.02)  # 50 Hz poll
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if switch:
            switch.close()
        print("GPIO closed. Done.")


if __name__ == "__main__":
    main()
