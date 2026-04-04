import cv2

# On va tester les index 0, 1 et 2
for i in range(3):
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        print(f"SUCCÈS : Caméra trouvée à l'index {i}")
        while True:
            ret, frame = cap.read()
            cv2.imshow(f'Test Camera {i} - Appuie sur Q pour quitter', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        cap.release()
        cv2.destroyAllWindows()
        break
    else:
        print(f"ÉCHEC : Pas de caméra à l'index {i}")