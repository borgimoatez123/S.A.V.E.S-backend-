"""
Test script: run YOLO detection on a static image file
and send results to the Node.js API — no webcam needed.

Usage:
    python test_image.py path/to/your/image.jpg
"""

import sys
import datetime
import requests
from ultralytics import YOLO

API_URL = "http://localhost:5000/api/detections"
model = YOLO('best.pt')

# Accept image path and optional confidence threshold from CLI args
image_path = sys.argv[1] if len(sys.argv) > 1 else "test_sign.jpg"
CONFIDENCE_THRESHOLD = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5

print(f"[S.A.V.E.S] Running detection on: {image_path}")

results = model(image_path, conf=CONFIDENCE_THRESHOLD)

detections_found = 0

for r in results:
    for box in r.boxes:
        cls_id = int(box.cls[0])
        label = model.names[cls_id]
        confidence = round(float(box.conf[0]), 4)
        is_stop = "stop" in label.lower()

        payload = {
            "label": label,
            "confidence": confidence,
            "isStop": is_stop,
            "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

        print(f"  Detected: {label} ({confidence:.2f}) | isStop={is_stop}")

        try:
            resp = requests.post(API_URL, json=payload, timeout=3)
            resp.raise_for_status()
            print(f"  [API] ✅ Saved to MongoDB")
        except requests.exceptions.RequestException as e:
            print(f"  [API] ❌ Failed: {e}")

        detections_found += 1

if detections_found == 0:
    print("No detections above confidence threshold.")

# Save annotated image so you can inspect the result
output_path = "annotated_output.jpg"
results[0].save(filename=output_path)
print(f"\n[S.A.V.E.S] Annotated image saved to: {output_path}")
