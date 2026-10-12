from dotenv import load_dotenv
from adaption import Adaption
import inspect

load_dotenv()

client = Adaption()

print("\n========== ADAPT METHOD ==========")
print(inspect.getdoc(client.datasets.adapt))

print("\n========== RESPONSE TYPE ==========")
print(client.datasets.adapt.__annotations__)

print("\n========== CHECK COMPLETE ==========")