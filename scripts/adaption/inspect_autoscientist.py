from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()

client = Adaption()

print("\n========== AUTOSCIENTIST METHODS ==========")

for name in dir(client.autoscientist):
    if name.startswith("_"):
        continue

    try:
        attribute = getattr(client.autoscientist, name)

        if callable(attribute):
            print(f"\n{name}")

            doc = getattr(attribute, "__doc__", None)

            if doc:
                print(doc[:1000])

    except Exception as error:
        print(f"Could not inspect {name}: {error}")

print("\n========== CHECK COMPLETE ==========")