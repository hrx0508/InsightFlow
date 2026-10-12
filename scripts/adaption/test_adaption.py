from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()

try:
    client = Adaption()

    # Make an actual request to Adaption's API
    response = client.datasets.list()

    print("✅ Adaption API authentication successful!")
    print("Successfully connected to Adaption.")

except Exception as error:
    print("❌ Adaption API request failed.")
    print(f"Error type: {type(error).__name__}")
    print(f"Details: {error}")