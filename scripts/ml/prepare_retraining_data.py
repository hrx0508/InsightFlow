import json
import sys
from pathlib import Path

import pandas as pd

from fetch_corrections import fetch_verified_corrections


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    PROJECT_ROOT / "BuildBattle_2026_Customer_Feedback_Dataset.csv"
)

OUTPUT_PATH = (
    PROJECT_ROOT / "models" / "retraining_dataset.csv"
)


def prepare_dataset():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Original dataset not found: {DATASET_PATH}"
        )

    # Load the original labeled dataset.
    original = pd.read_csv(DATASET_PATH)

    required_columns = {"review", "category"}

    if not required_columns.issubset(original.columns):
        raise ValueError(
            "The original dataset must contain 'review' and 'category'."
        )

    original = original[["review", "category"]].copy()
    original["source"] = "original"

    # Normalize whitespace and remove empty rows.
    original["review"] = original["review"].astype(str).str.strip()
    original["category"] = original["category"].astype(str).str.strip()

    original = original[
        (original["review"] != "")
        & (original["category"] != "")
    ]

    # Fetch explicitly verified human corrections.
    corrections = fetch_verified_corrections()

    if corrections:
        corrected = pd.DataFrame([
            {
                "review": item["review"],
                "category": item["corrected_category"],
                "source": "verified_correction",
            }
            for item in corrections
        ])

        combined = pd.concat(
            [original, corrected],
            ignore_index=True,
        )
    else:
        combined = original.copy()

    combined["review"] = combined["review"].astype(str).str.strip()
    combined["category"] = combined["category"].astype(str).str.strip()

    # A review with conflicting labels must not silently enter training.
    label_counts = combined.groupby("review")["category"].nunique()
    conflicting_reviews = label_counts[label_counts > 1].index.tolist()

    if conflicting_reviews:
        preview = conflicting_reviews[:5]

        raise ValueError(
            f"Found {len(conflicting_reviews)} reviews with conflicting "
            f"labels. Resolve them before training. Examples: {preview}"
        )

    # Remove duplicate review/label pairs.
    combined = combined.drop_duplicates(
        subset=["review", "category"],
        keep="last",
    )

    # Keep only the columns needed for model training.
    training_data = combined[["review", "category"]].copy()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    training_data.to_csv(OUTPUT_PATH, index=False)

    summary = {
        "success": True,
        "original_rows": len(original),
        "verified_corrections_fetched": len(corrections),
        "prepared_rows": len(training_data),
        "output_file": str(OUTPUT_PATH),
        "category_counts": training_data["category"].value_counts().to_dict(),
    }

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    try:
        prepare_dataset()
    except Exception as error:
        print(
            json.dumps({
                "success": False,
                "error": str(error),
            }, indent=2),
            file=sys.stderr,
        )
        sys.exit(1)