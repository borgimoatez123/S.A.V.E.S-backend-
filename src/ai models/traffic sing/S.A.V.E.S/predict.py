"""
predict.py — called by Node.js after an ESP32 image is saved.
Runs YOLO on the image and prints JSON results to stdout.

Usage:
    python predict.py <image_path> [confidence_threshold]
"""

import sys
import json
import datetime
import os
from ultralytics import YOLO

CONFIDENCE = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5

# Use absolute path — script is called from Node.js with different cwd
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "best.pt")

def main():
    image_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not image_path:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    model = YOLO(MODEL_PATH)
    results = model(image_path, conf=CONFIDENCE, verbose=False)

    detections = []
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            confidence = round(float(box.conf[0]), 4)
            detections.append({
                "label": label,
                "confidence": confidence,
                "isStop": "stop" in label.lower(),
                "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            })

    # Node.js reads this from stdout
    print(json.dumps({"detections": detections}))

if __name__ == "__main__":
    main()
