"""Stepper motor control

Factory ``create_stepper`` returns either a real GPIO-backed ``RealStepper``
when running on a Raspberry Pi (with RPi.GPIO) or a logging ``SimulatedStepper``
for development machines. Public API used elsewhere:
  * ``stepper.toggle()`` – start / stop continuous rotation (optionally toggling direction)
  * ``stepper.cleanup()`` – safe, idempotent shutdown

Supports configurable microstepping, optional auto-stop after N revolutions
"""

from __future__ import annotations

import platform
import threading
import time
from dataclasses import dataclass
from typing import Optional, Tuple

# Determine if we are on a Raspberry Pi by architecture; refined later if GPIO import fails.
_pi_arch = platform.machine() in ["armv6l", "armv7l", "aarch64"]

try:  # Attempt to import GPIO only if we look like a Pi
    if _pi_arch:
        import RPi.GPIO as GPIO  # type: ignore
        _HAS_GPIO = True
    else:
        _HAS_GPIO = False
except ImportError:
    _HAS_GPIO = False


@dataclass(frozen=True)
class StepperPins:
    step: int
    direction: int
    enable: int  # Active LOW
    microstep1: int
    microstep2: int
    microstep3: int


class StepperBase:
    """Abstract base defining the interface used by button_monitor."""

    def toggle(self) -> None:  # start if stopped, else request stop
        raise NotImplementedError

    def cleanup(self) -> None:  # release resources
        raise NotImplementedError


class SimulatedStepper(StepperBase):
    def __init__(self, *_, **__):
        self._running = False
        self._direction = False

    def toggle(self) -> None:
        if self._running:
            print("[SIMULATION] Stop requested.")
            self._running = False
            print("[SIMULATION] Stepper stopped.")
            return
        self._direction = not self._direction
        self._running = True
        print(f"[SIMULATION] Starting rotation direction={'CW' if self._direction else 'CCW'} (will run until next press).")

    def cleanup(self) -> None:
        if self._running:
            print("[SIMULATION] Cleaning up: stopping simulated stepper.")
            self._running = False


class RealStepper(StepperBase):
    def __init__(
        self,
        pins: StepperPins,
        microstep: int,
        step_delay: float,
        auto_stop_revs: Optional[float],
        toggle_direction: bool,
        full_steps_per_rev: int,
    ) -> None:
        self.pins = pins
        self.microstep = microstep
        self.step_delay = step_delay
        self.auto_stop_revs = auto_stop_revs
        self.toggle_direction = toggle_direction
        self.full_steps_per_rev = full_steps_per_rev

        self._direction_state = False
        self._is_running = False
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

        self._init_gpio()
        self._configure_microstepping()

    # ---------------- GPIO Setup ----------------
    def _init_gpio(self) -> None:
        GPIO.setmode(GPIO.BCM)
        # Output pins
        GPIO.setup(self.pins.step, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(self.pins.direction, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(self.pins.enable, GPIO.OUT, initial=GPIO.HIGH)  # disabled (active LOW)
        # Microstep pins
        GPIO.setup(self.pins.microstep1, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(self.pins.microstep2, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(self.pins.microstep3, GPIO.OUT, initial=GPIO.LOW)

    def _configure_microstepping(self) -> None:
        mapping = {
            1: (0, 0, 0),
            2: (1, 0, 0),
            4: (0, 1, 0),
            8: (1, 1, 0),
            16: (0, 0, 1),
            32: (1, 0, 1),
        }
        if self.microstep not in mapping:
            print(f"Unsupported MICROSTEP={self.microstep}; defaulting to full step")
            ms = mapping[1]
        else:
            ms = mapping[self.microstep]
        GPIO.output(self.pins.microstep1, GPIO.HIGH if ms[0] else GPIO.LOW)
        GPIO.output(self.pins.microstep2, GPIO.HIGH if ms[1] else GPIO.LOW)
        GPIO.output(self.pins.microstep3, GPIO.HIGH if ms[2] else GPIO.LOW)

    # ---------------- Public API ----------------
    def toggle(self) -> None:
        if self._is_running:
            print("Stop requested.")
            self._stop_event.set()
            return
        if self.toggle_direction:
            self._direction_state = not self._direction_state
        direction = self._direction_state if self.toggle_direction else True
        self._stop_event.clear()
        self._is_running = True
        print(
            f"Starting continuous rotation: direction={'CW' if direction else 'CCW'}; press button again to stop."
        )
        self._thread = threading.Thread(
            target=self._continuous_rotate, args=(direction,), daemon=True
        )
        self._thread.start()

    def cleanup(self) -> None:
        if self._is_running:
            self._stop_event.set()
            if self._thread and self._thread.is_alive():
                self._thread.join(timeout=2)
        GPIO.cleanup()

    # ---------------- Internal helpers ----------------
    def _enable_driver(self, enable: bool) -> None:
        # ENABLE pin is active LOW
        GPIO.output(self.pins.enable, GPIO.LOW if enable else GPIO.HIGH)

    def _continuous_rotate(self, direction: bool) -> None:
        try:
            GPIO.output(self.pins.direction, GPIO.HIGH if direction else GPIO.LOW)
            self._enable_driver(True)
            time.sleep(0.01)
            steps_done = 0
            target_steps = None
            if self.auto_stop_revs is not None:
                target_steps = int(self.auto_stop_revs * self.full_steps_per_rev * self.microstep)
            half_delay = (self.step_delay / 2) / self.microstep
            while not self._stop_event.is_set():
                GPIO.output(self.pins.step, GPIO.HIGH)
                time.sleep(half_delay)
                GPIO.output(self.pins.step, GPIO.LOW)
                time.sleep(half_delay)
                steps_done += 1
                if target_steps is not None and steps_done >= target_steps:
                    print("Auto-stop reached target revolutions.")
                    break
        except Exception as e:  # noqa: BLE001 - broad for cleanup guarantee
            print(f"Stepper error: {e}")
        finally:
            self._enable_driver(False)
            self._is_running = False
            print("Stepper stopped.")


def create_stepper(
    *,
    pins: StepperPins,
    microstep: int,
    step_delay: float,
    auto_stop_revs: Optional[float],
    toggle_direction: bool,
    full_steps_per_rev: int,
) -> Tuple[StepperBase, bool]:
    """Factory returning (stepper_instance, is_raspberry_pi)."""
    if _HAS_GPIO:
        print("Running on Raspberry Pi - GPIO + stepper initialized")
        return (
            RealStepper(
                pins=pins,
                microstep=microstep,
                step_delay=step_delay,
                auto_stop_revs=auto_stop_revs,
                toggle_direction=toggle_direction,
                full_steps_per_rev=full_steps_per_rev,
            ),
            True,
        )
    print("Running on development machine - GPIO simulation mode")
    return (SimulatedStepper(), False)


__all__ = [
    "StepperPins",
    "StepperBase",
    "SimulatedStepper",
    "RealStepper",
    "create_stepper",
]
