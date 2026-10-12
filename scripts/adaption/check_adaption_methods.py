import inspect
from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()

client = Adaption()

methods_to_check = [
    "upload_file",
    "adapt",
    "get_status",
    "get_evaluation",
    "get_export_links",
]

print("\n========== ADAPTION METHOD SIGNATURES ==========")

for name in methods_to_check:
    method = getattr(client.datasets, name)
    print(f"\n{name}{inspect.signature(method)}")

    doc = inspect.getdoc(method)
    if doc:
        print(doc[:1500])

print("\n========== CHECK COMPLETE ==========")