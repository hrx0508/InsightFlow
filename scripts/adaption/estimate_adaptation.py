from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()

client = Adaption()

dataset_id = "21683442-ded7-4638-b719-c151447e4614"

print("Requesting an adaptation estimate...")

response = client.datasets.adapt(
    dataset_id,
    column_mapping={
        "prompt": "review",
        "completion": "category",
    },
    estimate=True,
)

print("\n========== ADAPTATION ESTIMATE ==========")
print(response)
print("\nNo adaptation job was intentionally started.")