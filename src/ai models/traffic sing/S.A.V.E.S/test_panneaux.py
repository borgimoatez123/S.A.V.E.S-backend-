import cv2
import threading
import datetime
import requests
from ultralytics import YOLO

# ─── CONFIG ───────────────────────────────────────────────────────────────────
API_URL = "http://localhost:5000/api/detections"
CONFIDENCE_THRESHOLD = 0.5
# ──────────────────────────────────────────────────────────────────────────────

model = YOLO('best.pt')
cap = cv2.VideoCapture(0)

print("--- SYSTÈME S.A.V.E.S : DÉTECTION DE PANNEAUX LANCÉE ---")
print("Appuyez sur 'q' pour quitter.")


def send_detection(label: str, confidence: float):
    """Send detection payload to the Node.js API in a background thread."""
    is_stop = "stop" in label.lower()
    payload = {
        "label": label,
        "confidence": round(float(confidence), 4),
        "isStop": is_stop,
        "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    try:
        response = requests.post(API_URL, json=payload, timeout=3)
        response.raise_for_status()
        print(f"[API] Detection sent: {label} ({confidence:.2f})")
    except requests.exceptions.RequestException as e:
        print(f"[API] Failed to send detection: {e}")


while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break

    results = model(frame, conf=CONFIDENCE_THRESHOLD)

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            confidence = float(box.conf[0])

            msg = f"DETECTE : {label}"
            color = (0, 255, 0)  # green

            if "stop" in label.lower():
                msg = "!!! ORDRE : STOP / FREINAGE !!!"
                color = (0, 0, 255)  # red

            cv2.putText(frame, msg, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 3)

            # Fire-and-forget — does NOT block the video loop
            thread = threading.Thread(
                target=send_detection,
                args=(label, confidence),
                daemon=True,
            )
            thread.start()

    annotated_frame = results[0].plot()
    cv2.imshow("S.A.V.E.S - Vision Artificielle", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
