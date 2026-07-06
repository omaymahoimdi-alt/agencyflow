from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import re
import json

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "toxic_model.pkl")
WORDS_PATH = os.path.join(os.path.dirname(__file__), "model", "toxic_words.json")

model = None
toxic_words_list = []

def load_model():
    global model, toxic_words_list
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"[OK] Modele ML charge ({MODEL_PATH})")
    else:
        print(f"[WARN] Modele ML introuvable ({MODEL_PATH}) - fallback sur liste de mots")
    if os.path.exists(WORDS_PATH):
        with open(WORDS_PATH, "r") as f:
            toxic_words_list = json.load(f)
        print(f"[OK] {len(toxic_words_list)} mots toxiques charges")
    else:
        toxic_words_list = [
            "idiot", "imbécile", "stupide", "nul", "con", "cons", "merde",
            "fuck", "shit", "crétin", "débile", "abruti", "enculé", "bâtard",
            "putain", "connard", "garbage", "useless", "worthless", "dumb",
            "moron", "loser", "jackass", "bullshit", "damn", "hate", "gueule",
            "dégage", "ferme-la", "foutre",
        ]

def detect_with_list(message: str) -> bool:
    msg_lower = message.lower()
    for word in toxic_words_list:
        if re.search(r'\b' + re.escape(word) + r'\b', msg_lower):
            print(f"  [LIST] Mot interdit detecte: '{word}'")
            return True
    return False

@app.route('/check_toxicity', methods=['POST'])
def check_toxicity():
    data = request.json
    text = data.get("message", "")
    print(f"[REQUEST] Analyse du message: '{text[:80]}{'...' if len(text)>80 else ''}'")

    is_toxic = False
    method = "none"

    if model is not None:
        proba = model.predict_proba([text])[0]
        is_toxic = bool(model.predict([text])[0])
        confidence = float(proba[1]) if is_toxic else float(proba[0])
        method = f"ml (confidence={confidence:.4f})"
        print(f"  [ML] Prediction: {'TOXIC' if is_toxic else 'CLEAN'} (conf={confidence:.4f})")

    if not is_toxic:
        is_toxic = detect_with_list(text)
        if is_toxic:
            method = "list"

    result = {
        "message": text,
        "toxic": is_toxic,
        "method": method,
    }
    print(f"  [RESULT] {'BLOQUE' if is_toxic else 'AUTORISE'} (method={method})")
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "toxic_words": len(toxic_words_list),
    })

load_model()

if __name__ == '__main__':
    print("=" * 50)
    print("  SERVEUR IA DETECTION DE TOXICITE")
    print(f"  Modele ML: {'CHARGE' if model is not None else 'NON CHARGE (fallback liste)'}")
    print("  Lancement sur http://0.0.0.0:5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
