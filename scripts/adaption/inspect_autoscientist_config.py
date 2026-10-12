from dotenv import load_dotenv
from adaption import Adaption
import inspect

load_dotenv()
client = Adaption()

methods = [
    "create",
    "recommend_hyperparams",
    "get",
    "list",
    "wait_for_completion",
]

print("\n========== AUTOSCIENTIST CONFIGURATION ==========")

for method_name in methods:
    method = getattr(client.autoscientist, method_name, None)

    if method is None:
        print(f"\n{method_name}: Not available")
        continue

    print(f"\n--- {method_name} ---")

    try:
        print("Signature:")
        print(inspect.signature(method))

        print("\nDocumentation:")
        print(inspect.getdoc(method))

    except Exception as error:
        print(f"Could not inspect: {error}")

print("\n========== INSPECTION COMPLETE ==========")
