import json
import sys
from pathlib import Path

import joblib


ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = ROOT / "models" / "feedback_classifier.joblib"


def main():
    # Read the review sent by Node.js through standard input.
    data = json.load(sys.stdin)

    review = data.get("review")

    if not isinstance(review, str) or not review.strip():
        raise ValueError("A non-empty review is required.")

    if not MODEL_PATH.exists():
        raise FileNotFoundError("The trained classifier was not found.")

    model = joblib.load(MODEL_PATH)

    # Predict the category and its confidence.
    probabilities = model.predict_proba([review])[0]
    best_index = probabilities.argmax()

    category = str(model.classes_[best_index])
    confidence = float(probabilities[best_index])

    threshold = 0.60

    result = {
        "review": review,
        "predicted_category": category,
        "confidence": round(confidence, 4),
        "needs_human_review": bool(confidence < threshold),
        "model_version": "baseline-v1",
    }

    print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            json.dumps({"error": str(error)}),
            file=sys.stderr,
        )
        sys.exit(1)