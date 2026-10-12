import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

# Load the dataset
CSV_PATH = "BuildBattle_2026_Customer_Feedback_Dataset.csv"

df = pd.read_csv(CSV_PATH)

print("\n========== DATASET OVERVIEW ==========")
print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")

# Validate required columns
required_columns = {"review", "category"}

if not required_columns.issubset(df.columns):
    raise ValueError(
        f"Dataset must contain these columns: {required_columns}"
    )

# Remove missing values and duplicate review/category pairs
df = df.dropna(subset=["review", "category"]).copy()
df["review"] = df["review"].astype(str).str.strip()
df["category"] = df["category"].astype(str).str.strip()

df = df[
    (df["review"] != "") &
    (df["category"] != "")
].drop_duplicates(subset=["review", "category"])

print(f"\nUsable rows: {len(df)}")

print("\n========== CATEGORY DISTRIBUTION ==========")
print(df["category"].value_counts())

# Separate inputs and labels
X = df["review"]
y = df["category"]

# Keep a separate test set for evaluation
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

print(f"\nTraining rows: {len(X_train)}")
print(f"Testing rows: {len(X_test)}")

# Build a simple text-classification baseline
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

print("\nTraining baseline classifier...")
model.fit(X_train, y_train)

# Evaluate on data not used for training
predictions = model.predict(X_test)

print("\n========== BASELINE RESULTS ==========")
print(f"Accuracy: {accuracy_score(y_test, predictions):.4f}")

print("\nClassification report:")
print(classification_report(y_test, predictions, zero_division=0))

print("\nConfusion matrix:")
labels = sorted(y.unique())

matrix = confusion_matrix(
    y_test,
    predictions,
    labels=labels,
)

print("Category order:", labels)
print(matrix)

print("\n========== EVALUATION COMPLETE ==========")