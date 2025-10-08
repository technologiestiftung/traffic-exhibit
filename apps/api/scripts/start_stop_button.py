import json
import sys
import time
import platform

# Set up mock pin factory for development on non-Raspberry Pi systems
if platform.system() != "Linux" or not any("raspberry" in info.lower() for info in [platform.machine(), platform.processor()]):
    import os
    os.environ['GPIOZERO_PIN_FACTORY'] = 'mock'
    print(f"Debug: Running on {platform.system()}, using mock pin factory", flush=True)

from gpiozero import Button

def main():
    # For development on non-Raspberry Pi systems, use mock button
    if platform.system() != "Linux" or not any("raspberry" in info.lower() for info in [platform.machine(), platform.processor()]):
        print("Debug: Using mock button for development", flush=True)
        button = Button(17, pull_up=True)
        # Simulate a button press every 10 seconds for testing
        import threading
        
        def simulate_button_press():
            time.sleep(10)  # Wait 5 seconds before first press
            button.pin.drive_low()  # Simulate press
            time.sleep(0.1)
            button.pin.drive_high()  # Simulate release
        
        # Start simulation in background
        simulation_thread = threading.Thread(target=simulate_button_press, daemon=True)
        simulation_thread.start()
    else:
        button = Button(17, pull_up=True)
    
    is_moving = False
    
    print("Button monitoring started...", flush=True)
    
    while True:
        if button.is_pressed:
            # Toggle the state
            is_moving = not is_moving
            
            # Send state change to Node.js via stdout
            state_data = {
                "action": "state_change",
                "is_moving": is_moving,
                "timestamp": time.time()
            }
            
            print(f"BUTTON_STATE:{json.dumps(state_data)}", flush=True)
            print(f"Button pressed! State changed to: {'moving' if is_moving else 'stopped'}", flush=True)
            
            # Wait for button release to avoid multiple triggers
            while button.is_pressed:
                time.sleep(0.01)
            
            # Debounce delay
            time.sleep(0.2)
        
        time.sleep(0.1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nButton monitoring stopped.", flush=True)
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}", flush=True)
        sys.exit(1)
