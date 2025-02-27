import time, cv2, numpy as np
from collections import Counter
from utils import process_frame

def inference_loop(config, resources, fps_avg_len=200):
    model = resources['model']
    labels = resources['labels']
    source_type = resources['source_type']
    cap = resources.get('cap')
    imgs_list = resources.get('imgs_list')
    record = resources.get('record')
    recorder = resources.get('recorder')
    user_res = resources.get('user_res')
    resW, resH = resources.get('resW'), resources.get('resH')
    
    avg_frame_rate = 0
    frame_rate_buffer = []
    img_count = 0
    
    bbox_colors = [(164,120,87), (68,148,228), (93,97,209), (178,182,133),
                   (88,159,106), (96,202,231), (159,124,168), (169,162,241),
                   (98,118,150), (172,176,184)]
    
    while True:
        t_start = time.perf_counter()
        # Get the frame based on source_type (image, video, USB, etc.)
        frame, img_count = get_frame(source_type, imgs_list, cap, img_count, resW, resH, user_res)
        if frame is None:
            break

        results = model(frame, verbose=False)
        detections = results[0].boxes
        object_count, frame_detections = 0, []
        for det in detections:
            xyxy = det.xyxy.cpu().numpy().squeeze().astype(int)
            xmin, ymin, xmax, ymax = xyxy
            classidx = int(det.cls.item())
            classname = labels[classidx]
            conf = det.conf.item()
            if conf > config.thresh:
                color = bbox_colors[classidx % len(bbox_colors)]
                cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)
                label = f'{classname}: {int(conf*100)}%'
                cv2.putText(frame, label, (xmin, max(ymin - 10, 0)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                object_count += 1
                frame_detections.append(classname)
        
        # Optionally display FPS and number of detections.
        cv2.putText(frame, f'FPS: {avg_frame_rate:0.2f}', (10,20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)
        cv2.putText(frame, f'Number of objects: {object_count}', (10,40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)

        cv2.imshow('YOLO detection results', frame)
        if record:
            recorder.write(frame)
        
        key = cv2.waitKey(5) if source_type in ['video', 'usb'] else cv2.waitKey()
        if key in [ord('q'), ord('Q')]:
            break
        elif key in [ord('p'), ord('P')]:
            cv2.imwrite('capture.png', frame)
        
        process_frame(frame, frame_detections)
        
        t_stop = time.perf_counter()
        frame_rate_calc = 1 / (t_stop - t_start)
        frame_rate_buffer.append(frame_rate_calc)
        if len(frame_rate_buffer) > fps_avg_len:
            frame_rate_buffer.pop(0)
        avg_frame_rate = np.mean(frame_rate_buffer)
    
    cleanup(source_type, cap, record, recorder)
    cv2.destroyAllWindows()

def get_frame(source_type, imgs_list, cap, img_count, resW, resH, user_res):
    # A helper function that returns the next frame and updates img_count if needed.
    if source_type in ['image', 'folder']:
        if img_count >= len(imgs_list):
            print('All images processed. Exiting.')
            return None, img_count
        frame = cv2.imread(imgs_list[img_count])
        img_count += 1
    elif source_type == 'video':
        ret, frame = cap.read()
        if not ret:
            print('Reached end of video. Exiting.')
            return None, img_count
    elif source_type == 'usb':
        ret, frame = cap.read()
        if not ret or frame is None:
            print('Unable to read from USB camera. Exiting.')
            return None, img_count
    elif source_type == 'picamera':
        frame = cap.capture_array()
        if frame is None:
            print('Unable to read from Picamera. Exiting.')
            return None, img_count
   
    if user_res:
        frame = cv2.resize(frame, (resW, resH))
    return frame, img_count

def cleanup(source_type, cap, record, recorder):
    if source_type in ['video', 'usb']:
        cap.release()
    if record:
        recorder.release()
