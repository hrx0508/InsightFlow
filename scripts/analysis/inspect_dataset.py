import csv
from pathlib import Path
from collections import Counter

project_dir = Path(__file__).parent

csv_files = [
    file for file in project_dir.rglob("*.csv")
    if ".venv" not in file.parts
]

if not csv_files:
    print("No CSV dataset found.")
    raise SystemExit(1)

csv_path = csv_files[0]

with csv_path.open("r", encoding="utf-8-sig", newline="") as file:
    reader = csv.DictReader(file)
    rows = list(reader)

print("\n========== DATASET SUMMARY ==========")
print(f"Filename: {csv_path.name}")
print(f"Total reviews: {len(rows)}")

print("\n========== CATEGORY DISTRIBUTION ==========")

category_counts = Counter(
    row["category"].strip()
    for row in rows
    if row.get("category")
)

for category, count in category_counts.most_common():
    percentage = count / len(rows) * 100 if rows else 0
    print(f"{category}: {count} reviews ({percentage:.1f}%)")

print("\n========== SAMPLE REVIEWS ==========")

for index, row in enumerate(rows[:10], start=1):
    print(f"\n{index}. Review: {row['review']}")
    print(f"   Category: {row['category']}")

print("\n========== CHECK COMPLETE ==========")