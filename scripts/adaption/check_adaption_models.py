from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()

client = Adaption()

print("\n========== AVAILABLE AUTOSCIENTIST MODELS ==========")

try:
    response = client.autoscientist.list_models()
    print(response)

except Exception as error:
    print("Failed to retrieve models.")
    print(f"Error: {type(error).__name__}: {error}")

print("\n========== CHECK COMPLETE ==========")