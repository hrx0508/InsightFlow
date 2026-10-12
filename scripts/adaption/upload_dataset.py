from dotenv import load_dotenv
from adaption import Adaption
import time

load_dotenv()

client = Adaption()

dataset_id = "21683442-ded7-4638-b719-c151447e4614"

print("Checking dataset processing status...\n")

for attempt in range(10):
    response = client.datasets.get_status(dataset_id)

    print(f"Check {attempt + 1}: {response}")

    status_text = str(response).lower()

    if "failed" in status_text:
        print("\nDataset processing failed. Stop here and share the output.")
        break

    if "completed" in status_text or "succeeded" in status_text or "ready" in status_text:
        print("\nDataset appears to be ready.")
        break

    if attempt < 9:
        time.sleep(5)

else:
    print("\nProcessing is not confirmed yet. Share the latest status.")