import pandas as pd
import numpy as np
import joblib
import re
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

CLEAN = [
    "Bonjour, j'espère que vous allez bien",
    "Merci pour votre aide sur ce projet",
    "Je pense qu'on devrait discuter de cette feature",
    "Très bon travail sur le déploiement hier",
    "Est-ce que quelqu'un peut review ma PR ?",
    "Félicitations à toute l'équipe pour le sprint",
    "Je vais push les changements ce soir",
    "On se fait une réunion demain à 10h ?",
    "Parfait, merci beaucoup",
    "Le client a validé la maquette",
    "Could you please review my pull request?",
    "Great work on the deployment yesterday",
    "I think we should discuss this feature further",
    "Thank you for your help on this project",
    "The client approved the design mockup",
    "Let's schedule a meeting for tomorrow",
    "I'll push the changes this evening",
    "Well done everyone on the sprint",
    "Perfect, thank you very much",
    "Can someone help me with this bug?",
    "Je viens de corriger le bug dans le module auth",
    "Les tests passent maintenant",
    "On peut merger cette branche ?",
    "J'ai besoin d'aide sur la partie frontend",
    "Voici le lien vers la documentation",
    "N'oubliez pas de mettre à jour le ticket",
    "Sprint planning demain à 9h",
    "La démo de vendredi était impressionnante",
    "J'apprécie vraiment votre travail",
    "Bonne journée à tous",
    "Please review the attached document",
    "The deployment script is ready",
    "I updated the API documentation",
    "All tests are passing now",
    "Can we merge this branch?",
    "I need help with the frontend part",
    "Here is the link to the documentation",
    "Don't forget to update the ticket",
    "Sprint planning tomorrow at 9am",
    "Friday's demo was impressive",
    "I really appreciate your work",
    "Have a great day everyone",
    "Le projet avance bien, bravo",
    "Les indicateurs sont au vert",
    "Le client est satisfait des résultats",
]

TOXIC = [
    "T'es vraiment un idiot",
    "Quel imbécile, tu ne comprends rien",
    "C'est nul ce que tu as fait",
    "Taisez-vous espèce d'imbécile",
    "Vous êtes tous des cons",
    "Arrête d'être stupide",
    "T'es un bon à rien",
    "Ferme ta gueule",
    "Va te faire foutre",
    "Dégage espèce de merde",
    "Tu es complètement con",
    "Quelle équipe de merde",
    "T'es trop nul pour ce projet",
    "Crétin va",
    "You are such an idiot",
    "This code is absolute garbage",
    "Shut up you moron",
    "What a stupid thing to say",
    "You're completely useless",
    "Get lost you piece of shit",
    "Fuck off and leave me alone",
    "You're a fucking idiot",
    "This is bullshit",
    "What the hell is wrong with you",
    "You don't know anything you imbecile",
    "Screw you and your stupid ideas",
    "You're worthless",
    "This is a disaster because of you",
    "Go to hell",
    "You're so dumb it's unbelievable",
    "Insulte de merde",
    "T'es qu'une grosse merde",
    "Ferme-la imbécile",
    "Sale con va",
    "Bâtard",
    "Enculé",
    "Fils de pute",
    "Putain de merde",
    "T'es un bon à rien",
    "Tu sers à rien",
    "Abruti",
    "Débile mental",
    "Fuck you",
    "Shithead",
    "Motherfucker",
    "You piece of garbage",
    "Dumbass",
    "Jackass",
    "You're a loser",
    "Die alone",
]

def augment_data(texts, labels, n=3):
    """Simple augmentation: shuffle words, add noise."""
    augmented_texts = []
    augmented_labels = []
    for text, label in zip(texts, labels):
        augmented_texts.append(text)
        augmented_labels.append(label)
        for _ in range(n):
            words = text.split()
            if len(words) > 3:
                np.random.shuffle(words)
                new_text = " ".join(words)
                augmented_texts.append(new_text)
                augmented_labels.append(label)
    return augmented_texts, augmented_labels

all_texts = CLEAN + TOXIC
all_labels = [0] * len(CLEAN) + [1] * len(TOXIC)

X_aug, y_aug = augment_data(all_texts, all_labels, n=2)

df = pd.DataFrame({"text": X_aug, "toxic": y_aug})

X_train, X_test, y_train, y_test = train_test_split(
    df["text"], df["toxic"], test_size=0.2, random_state=42, stratify=df["toxic"]
)

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=10000,
        min_df=2,
        max_df=0.95,
        sublinear_tf=True,
        analyzer="word",
    )),
    ("clf", LogisticRegression(
        C=2.0,
        class_weight="balanced",
        max_iter=1000,
        random_state=42,
        solver="liblinear",
    )),
])

pipeline.fit(X_train, y_train)

accuracy = pipeline.score(X_test, y_test)
print(f"Accuracy: {accuracy:.4f}")

from sklearn.metrics import classification_report
y_pred = pipeline.predict(X_test)
print(classification_report(y_test, y_pred, target_names=["Clean", "Toxic"]))

os.makedirs("model", exist_ok=True)
joblib.dump(pipeline, "model/toxic_model.pkl")
joblib.dump(pipeline.named_steps["tfidf"].vocabulary_, "model/tfidf_vocab.pkl")

print("Modele sauvegarde dans python/model/toxic_model.pkl")
print(f"Taille du jeu d entraînement: {len(X_train)} exemples")
print(f"Taille du jeu de test: {len(X_test)} exemples")

import json
toxic_words = [
    "idiot", "imbécile", "stupide", "nul", "con", "cons", "merde", "fuck", "shit",
    "crétin", "débile", "abruti", "enculé", "bâtard", "putain", "salope", "connard",
    "garbage", "useless", "worthless", "dumb", "moron", "loser", "jackass",
    "bullshit", "screw", "damn", "hate", "idiotic", "imbecile",
    "gueule", "dégage", "ferme-la", "foutre", "suce",
]
with open("model/toxic_words.json", "w") as f:
    json.dump(toxic_words, f, ensure_ascii=False, indent=2)

print("Mots toxiques sauvegardes dans python/model/toxic_words.json")
print("\n--- Entraînement terminé ---")
