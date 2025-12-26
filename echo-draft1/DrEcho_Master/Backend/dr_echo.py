# backend/dr_echo.py

import os
import json
from google import genai
from google.genai import types # Import types for error handling
from dotenv import load_dotenv
from typing import Tuple, Dict, Any, Optional

# --- 1. CONFIGURATION ---
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

client = None
if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY)
    except Exception as e:
        print(f"Error initializing GenAI client: {e}")
else:
    print("CRITICAL: GEMINI_API_KEY is missing from .env file")

# --- 2. SYSTEM PROMPT ---
SYSTEM_PROMPT = """
You are Dr. Echo, an intelligent assistant for radiologists.
Your goal is to extract structured data from the user's input to fill a radiology report template.

You must extract these 5 fields:
1. examType (e.g., "CT Liver", "MRI Liver", "CT Cardiac")
2. patientName (Capitalize first letters, e.g. "John Doe")
3. age (Integer only)
4. gender (Male/Female)
5. dob (Format YYYY-MM-DD if found)

Output Rules:
- Return ONLY valid JSON.
- Do not say "Here is the JSON". Just return the JSON object.
- If a field is not found, set it to null.
- If the input is just a greeting (e.g., "Hi"), set fields to null and write a polite greeting in "ai_response".

Example Input: "I need a liver MRI for John Doe, 45 male."
Example Output:
{
  "examType": "MRI Liver",
  "patientName": "John Doe",
  "age": 45,
  "gender": "Male",
  "dob": null,
  "ai_response": "I've noted that. Preparing the MRI Liver template for John Doe."
}
"""

def generate_ai_response(user_message: str, prior_extracted: Optional[Dict[str, Any]] = None) -> Tuple[str, Dict[str, Any], Optional[str]]:
    """
    Sends user text to Gemini LLM.
    """
    if not client:
        return "System Error: AI Brain not connected (Check API Key).", prior_extracted or {}, None

    memory_context = ""
    if prior_extracted:
        memory_context = f"Current known info (fill gaps, don't overwrite if not changed): {json.dumps(prior_extracted)}.\n"
    
    full_prompt = f"{SYSTEM_PROMPT}\n\n{memory_context}User Input: \"{user_message}\""

    # --- LIST OF MODELS TO TRY (Fallback System) ---
    # We try the Lite version first (Best for free tier), then the Generic alias
    models_to_try = [
        "gemini-2.0-flash-lite-preview-02-05", # First choice: Flash Lite 2.0 (Fastest/Free)
        "gemini-flash-latest",                 # Backup: Whatever is currently stable
        "gemini-1.5-flash"                     # Last resort
    ]

    for model_name in models_to_try:
        try:
            print(f"Dr.Echo: Trying AI Model: {model_name}...")
            
            response = client.models.generate_content(
                model=model_name, 
                contents=full_prompt
            )
            
            # If we get here, it worked! Process the data.
            response_text = response.text.strip()

            if response_text.startswith("```"):
                lines = response_text.split("\n")
                if len(lines) >= 2:
                    response_text = "\n".join(lines[1:-1])
                else:
                    response_text = lines[0].replace("```json", "").replace("```", "")

            data = json.loads(response_text)

            extracted = {
                "examType": data.get("examType"),
                "patientName": data.get("patientName"),
                "age": data.get("age"),
                "gender": data.get("gender"),
                "dob": data.get("dob")
            }

            if prior_extracted:
                for k, v in prior_extracted.items():
                    if extracted.get(k) is None:
                        extracted[k] = v

            ai_message = data.get("ai_response", "Processing complete.")
            
            template_code = None
            e_type = extracted.get("examType", "").lower() if extracted.get("examType") else ""
            
            if "liver" in e_type:
                template_code = "T001"
            elif "cardiac" in e_type:
                template_code = "T002"

            return ai_message, extracted, template_code

        except Exception as e:
            error_msg = str(e)
            print(f"Model {model_name} failed: {error_msg}")
            # If it's a 429 (Quota) or 404 (Not Found), we loop to the next model
            continue

    # If ALL models fail:
    return "I am overloaded right now (Rate Limit Reached). Please wait 1 minute and try again.", prior_extracted or {}, None