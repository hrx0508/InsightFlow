from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()
client = Adaption()

DATASET_ID = "21683442-ded7-4638-b719-c151447e4614"

print("\n========== DATASET EVALUATION ==========")

try:
    response = client.datasets.get_evaluation(DATASET_ID)
    print(response)

except Exception as error:
    print("Could not retrieve dataset evaluation.")
    print(f"Error: {type(error).__name__}: {error}")

print("\n========== CHECK COMPLETE ==========")