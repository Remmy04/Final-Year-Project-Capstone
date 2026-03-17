import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from the environment variables.")

# Initialize the NEW Gemini Client
client = genai.Client(api_key=api_key)

# The Best Free-Tier Models
AVAILABLE_MODELS = [
    "gemini-2.0-flash",         
    "gemini-2.5-flash",         
    "gemini-2.5-flash-lite",
    "gemini-3-flash",
    "gemini-3.1-flash-lite"
]

def get_system_prompt(current_state_str):
    return f"""
You are Dr. Echo, a professional, friendly, and HIGHLY FLEXIBLE AI radiology assistant.
Your goal is to assist the radiologist in filling out a Breast Mammography template.

CRITICAL FLEXIBILITY RULE: You must NEVER nag the user or repeat questions. If a user gives a partial answer, just extract what they provided, leave the rest as `null`, and immediately move forward.

CURRENT KNOWLEDGE STATE (Before User's Message):
{current_state_str}

YOUR INSTRUCTIONS:
Analyze the user's latest message, extract any data into the JSON, and determine the NEW state. Then, generate your `bot_reply` based on the NEW state.

PHASE 0: GREETING & INTENT
- If `workflow_started` is false:
  - If the user says they want to do a report, set `workflow_started` to true. 
  - Reply: "Alright! Let's start the Breast Mammography report. Could you please provide the patient details? (e.g., Jane Doe, Age 45, Female, Screening)."

PHASE 1 -> 2: EXTRACTING DEMOGRAPHICS -> CHECKPOINT
- If `workflow_started` is true AND `section_1_complete` is false:
  - The user is replying with patient details. Extract whatever they gave you.
  - Set `section_1_complete` to true.
  - Set `user_preference_asked` to true.
  - Reply: "I've recorded the initial details. Would you like me to generate the template now so you can type the rest yourself, or shall we continue chatting for the clinical findings?"

PHASE 3: EVALUATE CHECKPOINT
- If `user_preference_asked` is true AND `continue_with_chat` is null:
  - If the user wants the template NOW: set `is_ready_for_template` to true, `continue_with_chat` to false, and reply: "Generating template now."
  - If the user wants to CONTINUE: set `continue_with_chat` to true. Reply: "Great. Please provide the Modality, Density, and any Masses or Calcifications. (e.g., Mammogram Only, Heterogeneously dense, No masses)."

PHASE 4: EXTRACTING MAMMOGRAPHY -> ULTRASOUND
- If `continue_with_chat` is true AND `section_2_3_complete` is false:
  - The user is replying with mammography details. Extract them.
  - Set `section_2_3_complete` to true.
  - Reply: "Got it. Finally, any Ultrasound findings or Axillary Lymphadenopathy? (e.g., Normal bilateral ultrasound, no nodes)."

PHASE 5: EXTRACTING ULTRASOUND -> FINISH
- If `section_2_3_complete` is true AND `is_ready_for_template` is false:
  - Extract the ultrasound/node findings.
  - Set `is_ready_for_template` to true.
  - Reply: "I have sufficient information. Generating your prefilled template now..."

NEVER ask about Section 6 (Impression or BI-RADS).

YOU MUST OUTPUT STRICTLY IN THIS JSON FORMAT:
{{
    "bot_reply": "Your conversational reply based on the next logical phase",
    "extracted_data": {{
        "patient_name": "string or null",
        "patient_age": "string or null",
        "patient_gender": "string or null",
        "patient_id": "string or null",
        "referring_physician": "string or null",
        "primary_indication": "string or null",
        "symptoms": "string or null",
        "prior_surgery": "string or null",
        
        "modality_evaluated": "string or null",
        "mammography_density": "string or null",
        "mass_present": "string or null",
        "calcifications_present": "string or null",
        
        "ultrasound_right": "string or null",
        "ultrasound_left": "string or null",
        "axillary_lymph_nodes": "string or null",
        
        "workflow_started": boolean,
        "section_1_complete": boolean,
        "user_preference_asked": boolean,
        "continue_with_chat": boolean or null,
        "section_2_3_complete": boolean,
        "is_ready_for_template": boolean
    }}
}}
"""

async def process_chat_message(user_message: str, current_state: dict) -> dict:
    # Safely handle an empty state from the frontend on the first load
    if not current_state:
        current_state = {}

    # Initialize all tracking flags if they don't exist in the memory yet
    flags = {
        "workflow_started": False,
        "section_1_complete": False,
        "user_preference_asked": False,
        "continue_with_chat": None,
        "section_2_3_complete": False,
        "is_ready_for_template": False
    }
    
    for key, default_value in flags.items():
        if key not in current_state:
            current_state[key] = default_value

    state_str = json.dumps(current_state, indent=2)
    system_prompt = get_system_prompt(state_str)
    
    full_prompt = f"{system_prompt}\n\nRADIOLOGIST MESSAGE: {user_message}"

    for model_name in AVAILABLE_MODELS:
        try:
            print(f"[Dr. Echo AI] Phase Check - Attempting with model: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                )
            )
            response_data = json.loads(response.text)
            return response_data
            
        except Exception as e:
            error_msg = str(e)
            print(f"[Dr. Echo AI] Model {model_name} failed. Error: {error_msg}")
            continue

    print("[Dr. Echo AI] All models exhausted.")
    return {
        "bot_reply": "I apologize, but my servers are currently at maximum capacity. Please wait a moment and try again.",
        "extracted_data": current_state
    }