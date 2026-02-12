import os
import sys
import argparse
import glob
import time
import requests
import json
import socketio

import cv2
import numpy as np
from ultralytics import YOLO

# Define and parse user input arguments

parser = argparse.ArgumentParser()
parser.add_argument('--model', help='Path to YOLO model file (example: "runs/detect/train/weights/best.pt")',
                    required=True)
parser.add_argument('--source', help='Image source, can be image file ("test.jpg"), \
                    image folder ("test_dir"), video file ("testvid.mp4"), or index of USB camera ("usb0")', 
                    required=True)
parser.add_argument('--thresh', help='Minimum confidence threshold for displaying detected objects (example: "0.4")',
                    default=0.5)
parser.add_argument('--resolution', help='Resolution in WxH to display inference results at (example: "640x480"), \
                    otherwise, match source resolution',
                    default=None)
parser.add_argument('--record', help='Record results from video or webcam and save it as "demo1.avi". Must specify --resolution argument to record.',
                    action='store_true')
parser.add_argument('--headless', help='Run without GUI display (for headless/kiosk mode)',
                    action='store_true')
parser.add_argument('--server-url', help='URL of the server to send detection data to (example: "http://localhost:3001")',
                    default='http://localhost:3001')
parser.add_argument('--send-interval', help='Interval in seconds between sending detection data to server (default: 2.0)',
                    type=float, default=2.0)
parser.add_argument('--listen-motor', help='Listen for motor start/stop events to reset detection counts',
                    action='store_true')

args = parser.parse_args()


# Parse user inputs
model_path = args.model
img_source = args.source
min_thresh = args.thresh
user_res = args.resolution
record = args.record
headless = args.headless
server_url = args.server_url
send_interval = args.send_interval
listen_motor = args.listen_motor

# Socket.IO client for listening to motor events
sio = None
if listen_motor:
    sio = socketio.Client()
    
    @sio.event
    def connect():
        print("YOLO: Connected to server for motor event listening")
    
    @sio.event
    def disconnect():
        print("YOLO: Disconnected from server")
    
    @sio.on('start-event')
    def on_start_event():
        global detection_enabled, camera_paused, capture
        print("Start event received - sending data and disabling YOLO detection")
        # Send current detection data to server (server forwards to frontend via socket.io)
        send_detection_data()
        # Turn off detection
        detection_enabled = False
        # Turn off camera for video/usb/picamera sources
        if source_type == 'video' or source_type == 'usb':
            capture.release()
            camera_paused = True
        elif source_type == 'picamera':
            capture.stop()
            camera_paused = True
    
    @sio.on('stop-event')
    def on_stop_event():
        global detection_counts, detection_enabled, camera_paused, capture
        print("Stop event received - enabling YOLO detection and resetting counts")
        # Turn camera back on
        if source_type == 'video' or source_type == 'usb':
            capture = cv2.VideoCapture(capture_arg)
            if user_res:
                capture.set(3, resW)
                capture.set(4, resH)
            camera_paused = False
        elif source_type == 'picamera':
            capture.start()
            camera_paused = False
        # Reset counts and turn on detection
        detection_counts = {'car': 0, 'bike': 0, 'pedestrian': 0, 'heavy': 0}
        detection_enabled = True
    
    try:
        sio.connect(server_url)
        print(f"YOLO: Connected to server at {server_url} for motor events")
    except Exception as e:
        print(f"YOLO: Failed to connect to server for motor events: {e}")
        print("YOLO: Continuing without motor event listening")
        sio = None

# Map YOLO class names to our categories
# Your model classes: Pedestrian, Car, Bike, Truck
CLASS_MAPPING = {
    'Pedestrian': 'pedestrian',
    'Car': 'car',
    'Bike': 'bike',
    'Truck': 'heavy',
}

# Check if model file exists and is valid
if (not os.path.exists(model_path)):
    print('ERROR: Model path is invalid or model was not found. Make sure the model filename was entered correctly.')
    sys.exit(0)

# Load the model into memory and get labemap
model = YOLO(model_path, task='detect')
labels = model.names

# Parse input to determine if image source is a file, folder, video, or USB camera
img_ext_list = ['.jpg','.JPG','.jpeg','.JPEG','.png','.PNG','.bmp','.BMP']
vid_ext_list = ['.avi','.mov','.mp4','.mkv','.wmv']

if os.path.isdir(img_source):
    source_type = 'folder'
elif os.path.isfile(img_source):
    _, ext = os.path.splitext(img_source)
    if ext in img_ext_list:
        source_type = 'image'
    elif ext in vid_ext_list:
        source_type = 'video'
    else:
        print(f'File extension {ext} is not supported.')
        sys.exit(0)
elif 'usb' in img_source:
    source_type = 'usb'
    usb_idx = int(img_source[3:])
elif 'picamera' in img_source:
    source_type = 'picamera'
    picam_idx = int(img_source[8:])
else:
    print(f'Input {img_source} is invalid. Please try again.')
    sys.exit(0)

# Parse user-specified display resolution
resize = False
if user_res:
    resize = True
    resW, resH = int(user_res.split('x')[0]), int(user_res.split('x')[1])

# Check if recording is valid and set up recording
if record:
    if source_type not in ['video','usb']:
        print('Recording only works for video and camera sources. Please try again.')
        sys.exit(0)
    if not user_res:
        print('Please specify resolution to record video at.')
        sys.exit(0)
    
    # Set up recording
    record_name = 'demo1.avi'
    record_fps = 30
    recorder = cv2.VideoWriter(record_name, cv2.VideoWriter_fourcc(*'MJPG'), record_fps, (resW,resH))

# Load or initialize image source
if source_type == 'image':
    imgs_list = [img_source]
elif source_type == 'folder':
    imgs_list = []
    filelist = glob.glob(img_source + '/*')
    for file in filelist:
        _, file_ext = os.path.splitext(file)
        if file_ext in img_ext_list:
            imgs_list.append(file)
elif source_type == 'video' or source_type == 'usb':

    if source_type == 'video': capture_arg = img_source
    elif source_type == 'usb': capture_arg = usb_idx
    capture = cv2.VideoCapture(capture_arg)

    # Set camera or video resolution if specified by user
    if user_res:
        ret = capture.set(3, resW)
        ret = capture.set(4, resH)

elif source_type == 'picamera':
    from picamera2 import Picamera2
    capture = Picamera2()
    capture.configure(capture.create_video_configuration(main={"format": 'XRGB8888', "size": (resW, resH)}))
    capture.start()

# Set bounding box colors (using the Tableu 10 color scheme)
bbox_colors = [(164,120,87), (68,148,228), (93,97,209), (178,182,133), (88,159,106), 
              (96,202,231), (159,124,168), (169,162,241), (98,118,150), (172,176,184)]

# Initialize control and status variables
avg_frame_rate = 0
frame_rate_buffer = []
fps_avg_len = 200
img_count = 0

# Detection counting variables
detection_counts = {'car': 0, 'bike': 0, 'pedestrian': 0, 'heavy': 0}
last_send_time = 0
detection_enabled = True  # Start enabled, will be disabled on start-event (after sending data)
camera_paused = False  # True when camera is released on start-event, turned back on on stop-event

def send_detection_data():
    """Send current detection data to server"""
    global last_send_time
    try:
        # Calculate percentages
        total = sum(detection_counts.values())
        if total > 0:
            percentages = {
                'car': round((detection_counts['car'] / total) * 100, 2),
                'bike': round((detection_counts['bike'] / total) * 100, 2),
                'pedestrian': round((detection_counts['pedestrian'] / total) * 100, 2),
                'heavy': round((detection_counts['heavy'] / total) * 100, 2),
            }
        else:
            percentages = {'car': 0, 'bike': 0, 'pedestrian': 0, 'heavy': 0}
        
        # Send both counts and percentages
        payload = {
            'counts': detection_counts.copy(),
            'percentages': percentages
        }
        
        response = requests.post(
            f'{server_url}/api/detections',
            json=payload,
            timeout=2.0
        )
        if response.status_code == 200:
            print(f'Detection data sent: {percentages}')
            return True
        else:
            print(f'Failed to send detection data: {response.status_code}')
            return False
    except Exception as e:
        print(f'Error sending detection data: {e}')
        return False

# Begin inference loop
while True:

    t_start = time.perf_counter()

    # When camera is paused (released on start-event), wait until stop-event turns it back on
    if (source_type == 'video' or source_type == 'usb' or source_type == 'picamera') and camera_paused:
        time.sleep(0.1)
        continue

    # Load frame from image source
    if source_type == 'image' or source_type == 'folder': # If source is image or image folder, load the image using its filename
        if img_count >= len(imgs_list):
            print('All images have been processed. Exiting program.')
            sys.exit(0)
        img_filename = imgs_list[img_count]
        frame = cv2.imread(img_filename)
        img_count = img_count + 1
    
    elif source_type == 'video': # If source is a video, load next frame from video file
        ret, frame = capture.read()
        if not ret:
            print('Reached end of the video file. Exiting program.')
            break
    
    elif source_type == 'usb': # If source is a USB camera, grab frame from camera
        ret, frame = capture.read()
        if (frame is None) or (not ret):
            print('Unable to read frames from the camera. This indicates the camera is disconnected or not working. Exiting program.')
            break

    elif source_type == 'picamera': # If source is a Picamera, grab frames using picamera interface
        frame_bgra = capture.capture_array()
        frame = cv2.cvtColor(np.copy(frame_bgra), cv2.COLOR_BGRA2BGR)
        if (frame is None):
            print('Unable to read frames from the Picamera. This indicates the camera is disconnected or not working. Exiting program.')
            break

    # Resize frame to desired display resolution
    if resize == True:
        frame = cv2.resize(frame,(resW,resH))

    # Only run inference and count if detection is enabled
    if detection_enabled:
        # Run inference on frame
        results = model(frame, verbose=False)
    else:
        # Skip inference when detection is disabled
        results = None

    # Initialize variable for basic object counting example
    object_count = 0
    
    # Reset detection counts for this frame
    frame_counts = {'car': 0, 'bike': 0, 'pedestrian': 0, 'heavy': 0}

    # Only process detections if enabled
    if detection_enabled and results is not None:
        # Extract results
        detections = results[0].boxes

        # Go through each detection and get bbox coords, confidence, and class
        for i in range(len(detections)):

            # Get bounding box coordinates
            # Ultralytics returns results in Tensor format, which have to be converted to a regular Python array
            xyxy_tensor = detections[i].xyxy.cpu() # Detections in Tensor format in CPU memory
            xyxy = xyxy_tensor.numpy().squeeze() # Convert tensors to Numpy array
            xmin, ymin, xmax, ymax = xyxy.astype(int) # Extract individual coordinates and convert to int

            # Get bounding box class ID and name
            classidx = int(detections[i].cls.item())
            classname = labels[classidx]

            # Get bounding box confidence
            conf = detections[i].conf.item()

            # Map class name to our categories and count
            # Direct mapping since your model uses exact class names: Pedestrian, Car, Bike, Truck
            category = CLASS_MAPPING.get(classname, None)
            
            # Draw box if confidence threshold is high enough
            if conf > min_thresh:

                color = bbox_colors[classidx % 10]
                cv2.rectangle(frame, (xmin,ymin), (xmax,ymax), color, 2)

                label = f'{classname}: {int(conf*100)}%'
                labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1) # Get font size
                label_ymin = max(ymin, labelSize[1] + 10) # Make sure not to draw label too close to top of window
                cv2.rectangle(frame, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), color, cv2.FILLED) # Draw white box to put label text in
                cv2.putText(frame, label, (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1) # Draw label text

                # Basic example: count the number of objects in the image
                object_count = object_count + 1
                
                # Count by category
                if category:
                    frame_counts[category] = frame_counts.get(category, 0) + 1

        # Update cumulative detection counts (accumulate over time)
        for category in detection_counts:
            detection_counts[category] += frame_counts.get(category, 0)
    
    # Calculate and draw framerate (if using video, USB, or Picamera source)
    if source_type == 'video' or source_type == 'usb' or source_type == 'picamera':
        cv2.putText(frame, f'FPS: {avg_frame_rate:0.2f}', (10,20), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,255,255), 2) # Draw framerate
    
    # Display detection results
    cv2.putText(frame, f'Number of objects: {object_count}', (10,40), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,255,255), 2) # Draw total number of detected objects
    
    # Display category counts
    y_offset = 60
    for category, count in detection_counts.items():
        cv2.putText(frame, f'{category}: {count}', (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, .5, (0,255,255), 1)
        y_offset += 20
    
    # Display detection status
    status_text = "DETECTING" if detection_enabled else "STOPPED"
    status_color = (0, 255, 0) if detection_enabled else (0, 0, 255)
    cv2.putText(frame, f'Status: {status_text}', (10, y_offset + 20), cv2.FONT_HERSHEY_SIMPLEX, .5, status_color, 1)
    
    # Send detection data to server at specified interval (only when enabled)
    if detection_enabled:
        current_time = time.time()
        if current_time - last_send_time >= send_interval:
            send_detection_data()
            last_send_time = current_time
    
    if not headless:
        cv2.imshow('YOLO detection results',frame) # Display image
    if record: recorder.write(frame)

    # If inferencing on individual images, wait for user keypress before moving to next image. Otherwise, wait 5ms before moving to next frame.
    if not headless:
        if source_type == 'image' or source_type == 'folder':
            key = cv2.waitKey()
        elif source_type == 'video' or source_type == 'usb' or source_type == 'picamera':
            key = cv2.waitKey(5)
        
        if key == ord('q') or key == ord('Q'): # Press 'q' to quit
            break
        elif key == ord('s') or key == ord('S'): # Press 's' to pause inference
            cv2.waitKey()
        elif key == ord('p') or key == ord('P'): # Press 'p' to save a picture of results on this frame
            cv2.imwrite('capture.png',frame)
    else:
        # In headless mode, print detection results and add simple exit condition
        if object_count > 0:
            print(f'Frame processed: {object_count} objects detected')
        
        # For headless mode with images, automatically continue
        if source_type == 'image' or source_type == 'folder':
            time.sleep(0.1)  # Small delay for images
        elif source_type == 'video' or source_type == 'usb' or source_type == 'picamera':
            time.sleep(0.01)  # Very small delay for video/camera
    
    # Calculate FPS for this frame
    t_stop = time.perf_counter()
    frame_rate_calc = float(1/(t_stop - t_start))

    # Append FPS result to frame_rate_buffer (for finding average FPS over multiple frames)
    if len(frame_rate_buffer) >= fps_avg_len:
        temp = frame_rate_buffer.pop(0)
        frame_rate_buffer.append(frame_rate_calc)
    else:
        frame_rate_buffer.append(frame_rate_calc)

    # Calculate average FPS for past frames
    avg_frame_rate = np.mean(frame_rate_buffer)


# Clean up
print(f'Average pipeline FPS: {avg_frame_rate:.2f}')
if source_type == 'video' or source_type == 'usb':
    if not camera_paused:
        capture.release()
elif source_type == 'picamera':
    capture.stop()
if record: recorder.release()
if not headless:
    cv2.destroyAllWindows()
if sio:
    try:
        sio.disconnect()
    except Exception as e:
        print(f"Error disconnecting Socket.IO: {e}")