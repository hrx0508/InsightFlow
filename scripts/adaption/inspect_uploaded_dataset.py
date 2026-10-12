from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()
client = Adaption()

DATASET_ID = "21683442-ded7-4638-b719-c151447e4614"

print("\n========== DATASET DETAILS ==========")

try:
    dataset = client.datasets.get(DATASET_ID)
    print(dataset)

except Exception as error:
    print("Could not retrieve dataset details.")
    print(f"Error: {type(error).__name__}: {error}")

print("\n========== DATASET STATUS ==========")

try:
    status = client.datasets.get_status(DATASET_ID)
    print(status)

except Exception as error:
    print("Could not retrieve dataset status.")
    print(f"Error: {type(error).__name__}: {error}")

print("\n========== INSPECTION COMPLETE ==========")