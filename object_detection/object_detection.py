import threading
from config import parse_args, setup_resources
from inference import inference_loop
from flask_api import run_flask_app

def main():
    args = parse_args()
    resources = setup_resources(args)
    
    # Start Flask in a separate thread
    flask_thread = threading.Thread(target=run_flask_app, daemon=True)
    flask_thread.start()
    
    # Run the inference loop (main thread for cv2.imshow compatibility)
    inference_loop(args, resources)

if __name__ == '__main__':
    main()
