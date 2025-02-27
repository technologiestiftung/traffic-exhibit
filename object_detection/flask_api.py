from flask import Flask, jsonify
from shared_state import detection_state

app = Flask(__name__)

@app.route('/detections', methods=['GET'])
def get_detections():
    return jsonify(detection_state.get_percentages())

def run_flask_app():
    app.run(port=5000, use_reloader=False)