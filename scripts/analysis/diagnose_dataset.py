import pandas as pd

CSV_PATH = "BuildBattle_2026_Customer_Feedback_Dataset.csv"

# Read the original dataset
df = pd.read_csv(CSV_PATH)

print("\n========== ORIGINAL DATASET ==========")
print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")

print("\n========== MISSING VALUES ==========")
print(df[["review", "category"]].isna().sum())

# Examine empty strings and whitespace
for column in ["review", "category"]:
    values = df[column].astype("string").str.strip()

    print(f"\n{column}:")
    print("Empty or whitespace-only:", values.eq("").sum())
    print("Unique non-empty values:", values.nunique())

# Check exact duplicates
print("\n========== DUPLICATE ANALYSIS ==========")

print(
    "Exact duplicate rows:",
    df.duplicated().sum()
)

print(
    "Duplicate review/category pairs:",
    df.duplicated(subset=["review", "category"]).sum()
)

print(
    "Duplicate reviews regardless of category:",
    df.duplicated(subset=["review"]).sum()
)

# Check category distribution before removing anything
print("\n========== ORIGINAL CATEGORY COUNTS ==========")
print(df["category"].value_counts(dropna=False))

# Show repeated review examples
print("\n========== SAMPLE DUPLICATE REVIEWS ==========")

duplicates = df[
    df.duplicated(subset=["review"], keep=False)
].sort_values("review")

print(duplicates.head(20).to_string(index=False))

print("\n========== DIAGNOSIS COMPLETE ==========")