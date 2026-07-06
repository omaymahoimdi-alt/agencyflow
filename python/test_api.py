import urllib.request
import json

tests = [
    ("Bonjour equipe, bon travail", False),
    ("T es vraiment un idiot", True),
    ("Je suis fier de notre collaboration", False),
    ("Ferme ta gueule", True),
    ("This is great work everyone", False),
    ("You are a fucking moron", True),
    ("Quel travail nul", True),
    ("Merci pour votre aide", False),
]

for msg, expected in tests:
    req = urllib.request.Request(
        "http://127.0.0.1:5000/check_toxicity",
        data=json.dumps({"message": msg}).encode(),
        headers={"Content-Type": "application/json"},
    )
    res = json.loads(urllib.request.urlopen(req).read())
    ok = "PASS" if res["toxic"] == expected else "FAIL"
    print(f'{ok}: "{msg[:45]}" -> toxic={res["toxic"]} ({res["method"]})')
