class DetectionState:
    def __init__(self):
        self.latest_percentages = {}
    
    def update_percentages(self, percentages):
        self.latest_percentages = percentages
    
    def get_percentages(self):
        return self.latest_percentages

# Create a single instance to be shared
detection_state = DetectionState()