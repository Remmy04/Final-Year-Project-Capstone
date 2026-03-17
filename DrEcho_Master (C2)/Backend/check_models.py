import os
from google import genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY is missing.")
    exit()

client = genai.Client(api_key=api_key)

print("--- Available Models for your API Key ---")
try:
    # Loop through and print all models your key has access to
    for model in client.models.list():
        # We only want models that support generating content (text/chat)
        if "generateContent" in model.supported_actions:
            print(f"- {model.name}")
except Exception as e:
    print(f"Error fetching models: {e}")