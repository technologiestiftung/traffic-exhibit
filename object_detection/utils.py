import cv2
from collections import Counter
from shared_state import detection_state

def process_frame(frame, frame_detections):
    if frame_detections:
        detection_counts = Counter(frame_detections)
        total_detections = len(frame_detections)
        percentages = {cls: (cnt / total_detections) * 100 for cls, cnt in detection_counts.items()}
        y_offset = 60
        for cls, pct in percentages.items():
            text = f'{cls}: {pct:.1f}%'
            cv2.putText(frame, text, (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            y_offset += 25
        detection_state.update_percentages(percentages)