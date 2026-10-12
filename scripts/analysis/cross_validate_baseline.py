import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

CSV_PATH = "BuildBattle_2026_Customer_Feedback_Dataset.csv"

# Load the dataset
df = pd.read_csv(CSV_PATH)

# Remove invalid rows
df = df.dropna(subset=["review", "category"]).copy()

df["review"] = df["review"].astype(str).str.strip()
df["category"] = df["category"].astype(str).str.strip()

df = df[
    (df["review"] != "") &
    (df["category"] != "")
]

# Keep only unique review/category pairs
df = df.drop_duplicates(subset=["review", "category"])

# Check for reviews assigned to conflicting categories
category_counts = df.groupby("review")["category"].nunique()
conflicting_reviews = category_counts[category_counts > 1]

print("\n========== DATASET CHECK ==========")
print(f"Unique review/category pairs: {len(df)}")
print(f"Reviews with conflicting categories: {len(conflicting_reviews)}")

if len(conflicting_reviews) > 0:
    print("\nConflicting examples:")
    print(
        df[df["review"].isin(conflicting_reviews.index)]
        .sort_values("review")
        .head(20)
        .to_string(index=False)
    )

    raise ValueError(
        "Resolve conflicting labels before evaluating the classifier."
    )

print("\nCategory distribution:")
print(df["category"].value_counts())

X = df["review"]
y = df["category"]

# Four folds are suitable for this small dataset.
# Every fold preserves the approximate category distribution.
cv = StratifiedKFold(
    n_splits=4,
    shuffle=True,
    random_state=42,
)

model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            max_features=50000,
        ),
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
        ),
    ),
])

print("\nEvaluating with 4-fold cross-validation...")

results = cross_validate(
    model,
    X,
    y,
    cv=cv,
    scoring={
        "accuracy": "accuracy",
        "macro_f1": "f1_macro",
        "weighted_f1": "f1_weighted",
    },
    n_jobs=-1,
)

print("\n========== CROSS-VALIDATION RESULTS ==========")

for metric in ["accuracy", "macro_f1", "weighted_f1"]:
    scores = results[f"test_{metric}"]

    print(
        f"{metric}: "
        f"{scores.mean():.4f} "
        f"+/- {scores.std():.4f}"
    )

print("\nIndividual fold accuracies:")
print(results["test_accuracy"])

print("\n========== COMPLETE ==========")