from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()
client = Adaption()

DATASET_ID = "21683442-ded7-4638-b719-c151447e4614"

print("\n========== TRAINING RECOMMENDATIONS ==========")

try:
    response = client.autoscientist.recommend_hyperparams(
        dataset_id=DATASET_ID
    )

    print(response)

except Exception as error:
    print("\nCould not retrieve recommendations.")
    print(f"Error: {type(error).__name__}: {error}")

print("\n========== CHECK COMPLETE ==========")