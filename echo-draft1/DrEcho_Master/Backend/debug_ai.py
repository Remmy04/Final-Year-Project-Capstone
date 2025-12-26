# backend/debug_ai.py
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"--- CHECKING MODELS FOR KEY: {api_key[:5]}... ---")

try:
    client = genai.Client(api_key=api_key)
    
    print("\nAvailable Models:")
    # This simple loop works with the new library
    for model in client.models.list():
        print(f" - {model.name}")

    print("\n--- END OF LIST ---")

except Exception as e:
    print(f"\nCRITICAL ERROR: {e}")