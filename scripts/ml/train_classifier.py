import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

ROOT = Path(__file__).resolve().parents[2]
DATASET = ROOT / "BuildBattle_2026_Customer_Feedback_Dataset.csv"
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(exist_ok=True)

df = pd.read_csv(DATASET)
df = df[["review", "category"]].dropna()
df["review"] = df["review"].astype(str).str.strip()
df["category"] = df["category"].astype(str).str.strip()
df = df[df["review"] != ""]
df = df.drop_duplicates(subset=["review", "category"])

# Remove reviews with conflicting labels.
conflicts = df.groupby("review")["category"].nunique()
df = df[df["review"].map(conflicts) == 1]
df = df.drop_duplicates(subset=["review"])

X_train, X_test, y_train, y_test = train_test_split(
    df["review"],
    df["category"],
    test_size=0.2,
    random_state=42,
    stratify=df["category"],
)

model = Pipeline([
    ("tfidf", TfidfVectorizer(
        lowercase=True,
        strip_accents="unicode",
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1,
        max_df=0.98,
        max_features=30000,
    )),
    ("classifier", LogisticRegression(
        max_iter=3000,
        class_weight="balanced",
        C=2.0,
        random_state=42,
    )),
])

model.fit(X_train, y_train)
predictions = model.predict(X_test)

print("Accuracy:", round(accuracy_score(y_test, predictions), 4))
print(classification_report(y_test, predictions, zero_division=0))

joblib.dump(model, MODEL_DIR / "feedback_classifier.joblib")
print("Model retrained successfully.")