import os, sys, argparse, glob, cv2
from ultralytics import YOLO

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True, help='Path to YOLO model file')
    parser.add_argument('--source', required=True, help='Image source (file, folder, video, USB camera, or Picamera)')
    parser.add_argument('--thresh', default=0.5, type=float, help='Confidence threshold')
    parser.add_argument('--resolution', default=None, help='Display resolution WxH (e.g., "1280x720")')
    parser.add_argument('--record', action='store_true', help='Record video (requires --resolution)')
    return parser.parse_args()

def setup_resources(args):

    model_path = args.model

    # Validate model path, initialize model, set up input source, etc.
    if not os.path.exists(model_path):
        print('ERROR: Model file not found.')
        sys.exit(0)
    
    img_source = args.source
    min_thresh = float(args.thresh)
    user_res = args.resolution
    record = args.record

    model = YOLO(model_path, task='detect')
    labels = model.names

    img_ext_list = ['.jpg','.jpeg','.png','.bmp']
    vid_ext_list = ['.avi','.mov','.mp4','.mkv','.wmv']

    if os.path.isdir(img_source):
        source_type = 'folder'
    elif os.path.isfile(img_source):
        _, ext = os.path.splitext(img_source)
        if ext.lower() in img_ext_list:
            source_type = 'image'
        elif ext.lower() in vid_ext_list:
            source_type = 'video'
        else:
            print(f'Unsupported file extension: {ext}')
            sys.exit(0)
    elif 'usb' in img_source:
        source_type = 'usb'
        global usb_idx
        usb_idx = int(img_source[3:])
    elif 'picamera' in img_source:
        source_type = 'picamera'
        global picam_idx
        picam_idx = int(img_source[8:])
    else:
        print(f'Invalid source: {img_source}')
        sys.exit(0)

    resW = resH = None
    if user_res:
        resW, resH = map(int, user_res.split('x'))

    if record:
        if source_type not in ['video', 'usb']:
            print('Recording is only available for video or USB sources.')
            sys.exit(0)
        if not user_res:
            print('Resolution must be specified for recording.')
            sys.exit(0)
        record_name = 'demo1.avi'
        record_fps = 30
        recorder = cv2.VideoWriter(record_name, cv2.VideoWriter_fourcc(*'MJPG'), record_fps, (resW, resH))
    else:
        recorder = None

    if source_type == 'image':
        imgs_list = [img_source]
        cap = None
    elif source_type == 'folder':
        imgs_list = [f for f in glob.glob(os.path.join(img_source, '*'))
                     if os.path.splitext(f)[1].lower() in img_ext_list]
        cap = None
    elif source_type == 'video':
        imgs_list = None
        cap = cv2.VideoCapture(img_source)
        if user_res:
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, resW)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resH)
    elif source_type == 'usb':
        imgs_list = None
        cap = cv2.VideoCapture(usb_idx)
        if user_res:
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, resW)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resH)
    elif source_type == 'picamera':
        from picamera2 import Picamera2
        imgs_list = None
        cap = Picamera2()
        cap.configure(cap.create_video_configuration(main={"format": 'RGB888', "size": (resW, resH)}))
        cap.start()


    return {
        'model': model,
        'labels': labels,
        'source_type': source_type,
        'user_res': user_res,
        'resW': resW,
        'resH': resH,
        'imgs_list': imgs_list,
        'cap': cap,
        'record': record,
        'recorder': recorder,
    }
