from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uvicorn

from dr_echo import process_chat_message

app = FastAPI(title="DrEcho API")

# Configure CORS so your frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change to your specific Firebase domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the Pydantic schema for incoming requests
class ChatRequest(BaseModel):
    userId: str
    message: str
    current_state: Optional[Dict[str, Any]] = None

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    # Initialize an empty state map if none is provided
    state = request.current_state or {
        "patient_name": None, "patient_age": None, "indication": None,
        "breast_composition": None, "mass_present": None, "mass_shape": None,
        "mass_margin": None, "mass_density": None, "calcifications_present": None,
        "calc_morphology": None, "calc_distribution": None, "axillary_lymph_nodes": None,
        "is_ready_for_template": False
    }
    
    # Process the state and message through Gemini
    ai_response = await process_chat_message(request.message, state)
    
    # Return the clean JSON back to the frontend
    return ai_response

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)