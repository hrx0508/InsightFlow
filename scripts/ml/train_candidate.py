from pathlib import Path
import json

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score


# --------------------------------------------------
# PATHS
# --------------------------------------------------

ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "models"

DATASET_PATH = ROOT / "BuildBattle_2026_Customer_Feedback_Dataset.csv"
CORRECTIONS_PATH = MODEL_DIR / "retraining_dataset.csv"

BASELINE_PATH = MODEL_DIR / "feedback_classifier.joblib"
CANDIDATE_PATH = MODEL_DIR / "candidate_classifier.joblib"
METRICS_PATH = MODEL_DIR / "candidate_metrics.json"


# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------

def load_data():
    df = pd.read_csv(DATASET_PATH)
    df = df[["review", "category"]].dropna()

    df["review"] = df["review"].astype(str).str.strip()
    df["category"] = df["category"].astype(str).str.strip()

    df = df[
        (df["review"] != "") &
        (df["category"] != "")
    ]

    df = df.drop_duplicates(
        subset=["review", "category"]
    )

    conflicts = df.groupby("review")["category"].nunique()
    conflicts = conflicts[conflicts > 1]

    if not conflicts.empty:
        raise ValueError("Original dataset contains conflicting labels.")

    return df.reset_index(drop=True)


def load_verified_corrections():
    if not CORRECTIONS_PATH.exists():
        return pd.DataFrame(columns=["review", "category"])

    df = pd.read_csv(CORRECTIONS_PATH)

    if not {"review", "category"}.issubset(df.columns):
        raise ValueError("Retraining dataset has invalid columns.")

    return df[["review", "category"]].dropna()


# --------------------------------------------------
# TRAINING
# --------------------------------------------------

def create_model():
    return Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                sublinear_tf=True,
            ),
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=2000,
                random_state=42,
            ),
        ),
    ])


def main():
    if not BASELINE_PATH.exists():
        raise FileNotFoundError(
            "Baseline model is missing. Train the original classifier first."
        )

    original = load_data()

    X_train, X_test, y_train, y_test = train_test_split(
        original["review"],
        original["category"],
        test_size=0.20,
        random_state=42,
        stratify=original["category"],
    )

    # The original test reviews are never included in training.
    test_reviews = set(X_test)

    training = pd.DataFrame({
        "review": X_train.to_numpy(),
        "category": y_train.to_numpy(),
    })

    corrections = load_verified_corrections()

    corrections["review"] = corrections["review"].astype(str).str.strip()
    corrections["category"] = corrections["category"].astype(str).str.strip()

    corrections = corrections[
        (corrections["review"] != "") &
        (corrections["category"] != "")
    ]

    # Never train on reviews reserved for evaluation.
    corrections = corrections[
        ~corrections["review"].isin(test_reviews)
    ]

    # A correction for an existing training review replaces its old label.
    corrected_reviews = set(corrections["review"])

    training = training[
        ~training["review"].isin(corrected_reviews)
    ]

    training = pd.concat(
        [training, corrections],
        ignore_index=True,
    )

    training = training.drop_duplicates(
        subset=["review", "category"]
    )

    conflicts = training.groupby("review")["category"].nunique()
    conflicts = conflicts[conflicts > 1]

    if not conflicts.empty:
        raise ValueError(
            "Conflicting training labels detected. Resolve them first."
        )

    if training["category"].nunique() < 2:
        raise ValueError("At least two categories are required.")

    print(f"Training examples: {len(training)}")
    print(f"Test examples: {len(X_test)}")
    print(f"Eligible corrections: {len(corrections)}")

    # Load the unchanged baseline.
    baseline = joblib.load(BASELINE_PATH)

    baseline_predictions = baseline.predict(X_test)

    baseline_accuracy = accuracy_score(
        y_test,
        baseline_predictions,
    )

    baseline_f1 = f1_score(
        y_test,
        baseline_predictions,
        average="macro",
        zero_division=0,
    )

    # Train the candidate independently.
    candidate = create_model()

    candidate.fit(
        training["review"],
        training["category"],
    )

    candidate_predictions = candidate.predict(X_test)

    candidate_accuracy = accuracy_score(
        y_test,
        candidate_predictions,
    )

    candidate_f1 = f1_score(
        y_test,
        candidate_predictions,
        average="macro",
        zero_division=0,
    )

    # Save candidate separately. Never overwrite the baseline here.
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(candidate, CANDIDATE_PATH)

    metrics = {
        "baseline_accuracy": float(baseline_accuracy),
        "baseline_macro_f1": float(baseline_f1),
        "candidate_accuracy": float(candidate_accuracy),
        "candidate_macro_f1": float(candidate_f1),
        "training_examples": int(len(training)),
        "testing_examples": int(len(X_test)),
        "eligible_corrections": int(len(corrections)),
        "candidate_model": str(CANDIDATE_PATH),
        "promoted": False,
        "note": (
            "Candidate saved separately. It has not automatically "
            "replaced the baseline model."
        ),
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=4)

    print("\nMODEL COMPARISON")
    print("-" * 40)
    print(f"Baseline accuracy:  {baseline_accuracy:.4f}")
    print(f"Candidate accuracy: {candidate_accuracy:.4f}")
    print(f"Baseline macro-F1:  {baseline_f1:.4f}")
    print(f"Candidate macro-F1: {candidate_f1:.4f}")
    print(f"\nCandidate saved: {CANDIDATE_PATH}")
    print(f"Metrics saved:   {METRICS_PATH}")
    print("\nBaseline model remains unchanged.")


if __name__ == "__main__":
    main()