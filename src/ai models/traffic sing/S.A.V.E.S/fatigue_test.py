import cv2
import mediapipe as mp
import numpy as np
import time
import winsound
import threading

# --- INITIALISATION ---
try:
    from mediapipe.solutions import face_mesh as mp_face_mesh
except:
    import mediapipe.python.solutions.face_mesh as mp_face_mesh

# Initialisation du modèle FaceMesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1)

# --- CONFIGURATION S.A.V.E.S ---
EAR_THRESHOLD = 0.21         
YAW_THRESHOLD = 20           
PITCH_THRESHOLD = 15         
TIME_LIMIT = 1.5             

LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
NOSE_TIP = 1  

def play_alarm():
    for _ in range(2):
        winsound.Beep(2500, 150)
        winsound.Beep(1500, 150)

def calculate_ear(landmarks, eye_indices):
    p2, p6 = np.array([landmarks[eye_indices[1]].x, landmarks[eye_indices[1]].y]), np.array([landmarks[eye_indices[5]].x, landmarks[eye_indices[5]].y])
    p3, p5 = np.array([landmarks[eye_indices[2]].x, landmarks[eye_indices[2]].y]), np.array([landmarks[eye_indices[4]].x, landmarks[eye_indices[4]].y])
    p1, p4 = np.array([landmarks[eye_indices[0]].x, landmarks[eye_indices[0]].y]), np.array([landmarks[eye_indices[3]].x, landmarks[eye_indices[3]].y])
    return (np.linalg.norm(p2 - p6) + np.linalg.norm(p3 - p5)) / (2.0 * np.linalg.norm(p1 - p4))

def get_eye_circle(landmarks, eye_indices, w, h):
    pts = [[int(landmarks[i].x * w), int(landmarks[i].y * h)] for i in eye_indices]
    center = np.mean(pts, axis=0).astype(int)
    radius = int(np.linalg.norm(np.array(pts[0]) - np.array(pts[3])) / 1.4)
    return tuple(center), radius

# --- VARIABLES DE SUIVI ---
# MODIFICATION ICI : On utilise l'index 0 et CAP_DSHOW pour Windows
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
start_time_alert = None
is_alarm_playing = False

print("--- S.A.V.E.S : MONITORING GLOBAL ACTIVE ---")

# Petite attente pour laisser la caméra s'initialiser
time.sleep(1)

if not cap.isOpened():
    print("ERREUR : Impossible d'ouvrir la caméra. Vérifie si une autre app l'utilise.")

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        # On ne break pas tout de suite, on réessaie
        print("Alerte : Problème de lecture du flux... tentative de reconnexion.")
        continue
        
    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    if results.multi_face_landmarks:
        landmarks = results.multi_face_landmarks[0].landmark
        
        ear_l = calculate_ear(landmarks, LEFT_EYE)
        ear_r = calculate_ear(landmarks, RIGHT_EYE)
        is_sleeping = (ear_l < EAR_THRESHOLD and ear_r < EAR_THRESHOLD)

        nose = landmarks[NOSE_TIP]
        yaw = (nose.x - 0.5) * 100    
        pitch = (nose.y - 0.5) * 100  
        is_distracted = abs(yaw) > YAW_THRESHOLD or abs(pitch) > PITCH_THRESHOLD

        color = (0, 255, 0) 
        alert_msg = ""

        if is_sleeping or is_distracted:
            if start_time_alert is None:
                start_time_alert = time.time()
            
            elapsed = time.time() - start_time_alert
            if elapsed > 0.4: color = (0, 0, 255) 
            
            if elapsed > TIME_LIMIT:
                alert_msg = "!!! DANGER : SOMMEIL !!!" if is_sleeping else "!!! REGARDEZ LA ROUTE !!!"
                if not is_alarm_playing:
                    is_alarm_playing = True
                    def a(): 
                        global is_alarm_playing
                        play_alarm()
                        is_alarm_playing = False
                    threading.Thread(target=a, daemon=True).start()
        else:
            start_time_alert = None

        c_l, r_l = get_eye_circle(landmarks, LEFT_EYE, w, h)
        c_r, r_r = get_eye_circle(landmarks, RIGHT_EYE, w, h)
        cv2.circle(frame, c_l, r_l + 8, (0, 0, 255) if ear_l < EAR_THRESHOLD else (0, 255, 0), 2)
        cv2.circle(frame, c_r, r_r + 8, (0, 0, 255) if ear_r < EAR_THRESHOLD else (0, 255, 0), 2)

        nose_x, nose_y = int(nose.x * w), int(nose.y * h)
        cv2.line(frame, (w//2, h//2), (nose_x, nose_y), color, 2)
        cv2.circle(frame, (nose_x, nose_y), 5, color, -1)

        if alert_msg:
            cv2.putText(frame, alert_msg, (w//15, h//2), cv2.FONT_HERSHEY_DUPLEX, 1.2, (0,0,255), 4)
        
        cv2.rectangle(frame, (0, 0), (380, 80), (0,0,0), -1)
        cv2.putText(frame, f"Sante Conducteur: {'Alerte' if alert_msg else 'OK'}", (15, 30), 1, 1, color, 2)
        cv2.putText(frame, f"Yaw: {int(yaw)} | Pitch: {int(pitch)}", (15, 60), 1, 0.8, (255,255,255), 1)

    cv2.imshow('S.A.V.E.S - Monitoring Complet', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'): break

cap.release()
cv2.destroyAllWindows()