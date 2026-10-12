from dotenv import load_dotenv

from adaption.types.dataset_adapt_params import (
    ColumnMapping,
    RecipeSpecification,
    JobSpecification,
)

load_dotenv()

config_types = [
    ("ColumnMapping", ColumnMapping),
    ("RecipeSpecification", RecipeSpecification),
    ("JobSpecification", JobSpecification),
]

print("\n========== ADAPTION CONFIGURATION ==========")

for name, config_type in config_types:
    print(f"\n--- {name} ---")
    print("Type:", config_type)
    print("Is dictionary:", issubclass(config_type, dict))

    print("\nAvailable annotations:")
    print(getattr(config_type, "__annotations__", {}))

    print("\nDocumentation:")
    print(getattr(config_type, "__doc__", None))

    print("\nAvailable attributes:")
    print([
        attr for attr in dir(config_type)
        if not attr.startswith("_")
    ])

print("\n========== CHECK COMPLETE ==========")