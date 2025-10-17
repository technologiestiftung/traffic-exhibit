import os
import sys
import argparse
import time
from typing import Dict

import cv2
import numpy as np
from ultralytics import YOLO
import socketio

# Define and parse user input arguments
parser = argparse.ArgumentParser()
parser.add_argument('--model', help='Path to YOLO model file (example: "runs/detect/train/weights/best.pt")', required=True)
parser.add_argument('--source', help='Image source: image file ("test.jpg"), index of USB camera ("usb0"), or index of Picamera ("picamera0")', required=True)
parser.add_argument('--thresh', help='Minimum confidence threshold for displaying detected objects (example: "0.4")', default=0.5)
parser.add_argument('--resolution', help='Resolution in WxH to display inference results at (example: "640x480"), otherwise, match source resolution', default=None)
parser.add_argument('--server-url', help='Socket.IO server URL', default='http://localhost:3001')
parser.add_argument('--headless', action='store_true', help='Disable GUI window output (no imshow / waitKey).')
args = parser.parse_args()

# Parse user inputs
model_path = args.model
img_source = args.source
min_thresh = args.thresh
user_res = args.resolution

# Check if model file exists and is valid
if (not os.path.exists(model_path)):
    print('ERROR: Model path is invalid or model was not found. Make sure the model filename was entered correctly.')
    sys.exit(0)

# Load the model into memory and get labemap
model = YOLO(model_path, task='detect')
labels = model.names
model_id = os.path.basename(model_path)

# Socket.IO setup
sio = socketio.Client()
snapshot_requested = False

@sio.event
def connect():
    print(f"[SocketIO] Connected to {args.server_url}")

@sio.event
def disconnect():
    print("[SocketIO] Disconnected")

@sio.on('snapshot_request')
def on_snapshot_request(data):
    global snapshot_requested
    snapshot_requested = True
    print(f"[SocketIO] Snapshot request received: {data}")

def emit_detection_summary(counts: Dict[str,int], total: int):
    payload = {
        'total': total,
        'classes': list(counts.keys()),
        'countsByClass': counts,
    }
    print(f"[SocketIO] Emitting object_detection_result: {payload}")
    sio.emit('object_detection_result', payload)

try:
    sio.connect(args.server_url)
except Exception as e:
    print(f"[SocketIO] Warning: could not connect to server {args.server_url}: {e}")
    # Continue without socket; snapshot requests won't function.

# Parse input to determine if image source is a file, USB camera, or Picamera (folder/video disabled)
img_ext_list = ['.jpg','.JPG','.jpeg','.JPEG','.png','.PNG','.bmp','.BMP']

if os.path.isfile(img_source):
    _, ext = os.path.splitext(img_source)
    if ext in img_ext_list:
        source_type = 'image'
    else:
        print(f'File extension {ext} is not supported. Only image files are allowed (video and folders disabled).')
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

# Load or initialize image source
if source_type == 'image':
    pass  # single image processed once in loop
elif source_type == 'usb':
    cap_arg = usb_idx
    cap = cv2.VideoCapture(cap_arg)
    if user_res:
        _ = cap.set(3, resW)
        _ = cap.set(4, resH)

elif source_type == 'picamera':
    from picamera2 import Picamera2
    cap = Picamera2()
    cap.configure(cap.create_video_configuration(main={"format": 'RGB888', "size": (resW, resH)}))
    cap.start()

# Set bounding box colors (using the Tableu 10 color scheme)
bbox_colors = [(164,120,87), (68,148,228), (93,97,209), (178,182,133), (88,159,106), 
              (96,202,231), (159,124,168), (169,162,241), (98,118,150), (172,176,184)]

# Initialize control and status variables
avg_frame_rate = 0
frame_rate_buffer = []
fps_avg_len = 200  # used for streaming sources (usb/picamera)

# Begin inference loop
while True:

    t_start = time.perf_counter()

    # Load frame from image source
    if source_type == 'image':
        frame = cv2.imread(img_source)
        if frame is None: 
            print('Unable to read the image file. Exiting program.')
            break
    elif source_type == 'usb': # If source is a USB camera, grab frame from camera
        ret, frame = cap.read()
        if (frame is None) or (not ret):
            print('Unable to read frames from the camera. This indicates the camera is disconnected or not working. Exiting program.')
            break
    elif source_type == 'picamera': # If source is a Picamera, grab frames using picamera interface
        frame = cap.capture_array()
        if (frame is None):
            print('Unable to read frames from the Picamera. This indicates the camera is disconnected or not working. Exiting program.')
            break

    # Resize frame to desired display resolution
    if resize == True:
        frame = cv2.resize(frame,(resW,resH))

    # Run inference on frame
    results = model(frame, verbose=False)
    detections = results[0].boxes

    # Build per-class counts and draw bboxes
    counts: Dict[str,int] = {}
    object_count = 0
    for i in range(len(detections)):
        conf = detections[i].conf.item()
        if conf <= float(min_thresh):
            continue
        classidx = int(detections[i].cls.item())
        classname = labels[classidx]
        counts[classname] = counts.get(classname, 0) + 1
        xyxy_tensor = detections[i].xyxy.cpu()
        xyxy = xyxy_tensor.numpy().squeeze()
        xmin, ymin, xmax, ymax = xyxy.astype(int)
        color = bbox_colors[classidx % 10]
        cv2.rectangle(frame, (xmin,ymin), (xmax,ymax), color, 2)
        label = f'{classname}: {int(conf*100)}%'
        labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        label_ymin = max(ymin, labelSize[1] + 10)
        cv2.rectangle(frame, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), color, cv2.FILLED)
        cv2.putText(frame, label, (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        object_count += 1

    # Emit summary if snapshot requested or interval elapsed
    if snapshot_requested:
        emit_detection_summary(counts, object_count)
        snapshot_requested = False

    # Calculate and draw framerate (if using video, USB, or Picamera source)
    if source_type == 'usb' or source_type == 'picamera':
        cv2.putText(frame, f'FPS: {avg_frame_rate:0.2f}', (10,20), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,255,255), 2) # Draw framerate
    
    # Display detection results (unless headless)
    cv2.putText(frame, f'Number of objects: {object_count}', (10,40), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,255,255), 2)
    key = -1
    if not args.headless:
        cv2.imshow('YOLO detection results', frame)
        if source_type == 'image':
            key = cv2.waitKey()
        elif source_type in ('usb', 'picamera'):
            key = cv2.waitKey(5)
    else:
        # Tiny sleep to prevent 100% CPU tight loop when headless
        time.sleep(0.002)
    
    if key == ord('q') or key == ord('Q'): # Press 'q' to quit
        break
    elif key == ord('s') or key == ord('S'): # Press 's' to pause inference
        cv2.waitKey()
    elif key == ord('p') or key == ord('P'): # Press 'p' to save a picture of results on this frame
        cv2.imwrite('capture.png',frame)
    
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
if source_type == 'usb':
    cap.release()
elif source_type == 'picamera':
    cap.stop()
if not args.headless:
    cv2.destroyAllWindows()