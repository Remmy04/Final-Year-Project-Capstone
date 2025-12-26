# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging

# Import your Chatbot Brain
from dr_echo import generate_ai_response

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# --- 1. Security & Connections (CORS) ---
# Allows your frontend (http://127.0.0.1:5500) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. Data Models (The "Shapes" of data) ---

class ChatRequest(BaseModel):
    user_id: str = Field(..., alias="userID")
    chat_doc_id: str = Field(..., alias="chatDocId")
    message: str
    prior_extracted_data: Optional[Dict[str, Any]] = Field(None, alias="priorExtractedData")

class ChatResponse(BaseModel):
    ai_message: str
    extracted_data: Optional[Dict[str, Any]] = None
    suggested_template: Optional[str] = None

class GenerateReportRequest(BaseModel):
    chat_doc_id: str = Field(..., alias="chatDocId")
    template_type: str = Field(..., alias="templateType")  # e.g., "CT_MR_Liver"
    template_data: Dict[str, Any] = Field(..., alias="templateData")

class GenerateReportResponse(BaseModel):
    report_text: str

# --- 3. The Chatbot Endpoint ---

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    logger.info(f"Chat received from {payload.user_id}: {payload.message}")
    
    ai_message, extracted_data, suggested_template = generate_ai_response(
        payload.message,
        prior_extracted=payload.prior_extracted_data,
    )
    
    return ChatResponse(
        ai_message=ai_message,
        extracted_data=extracted_data,
        suggested_template=suggested_template,
    )

# --- 4. The Report Generator Logic (The Missing Piece!) ---

def build_liver_report(data: Dict[str, Any]) -> str:
    """
    Constructs a professional Radiology Report text from the JSON form data.
    """
    # Helper to get field or default to "None"
    def get(key, default="--"):
        return data.get(key) if data.get(key) else default

    # A. Header Info
    exam_type = get("modality", "CT/MRI") + " LIVER"
    technique = f"{get('modality')} of the abdomen was performed."
    if get('studyContrast') == 'contrast':
        technique += f" {get('contrastType', '')} contrast was administered ({get('contrastVolume', 'N/A')} ml)."
    else:
        technique += " Without IV contrast."

    # B. Clinical Indication
    history = get("clinicalHistory", "None provided")
    etiology = get("etiologyOfLiverDisease", "None")
    
    # C. Findings Construction
    findings = []
    
    # Liver Background
    liver_bg = []
    if get("cirrhosis") == "Yes": liver_bg.append("cirrhosis")
    if get("steatosis") == "Yes": liver_bg.append("steatosis")
    if get("siderosis") == "Yes": liver_bg.append("siderosis")
    
    if liver_bg:
        findings.append(f"LIVER BACKGROUND: Background liver demonstrates features of {', '.join(liver_bg)}.")
    else:
        findings.append("LIVER BACKGROUND: Normal morphology and signal intensity.")

    # Lesions
    lesion_count = get("lesionCount", "0")
    if int(lesion_count) > 0:
        findings.append(f"FOCAL LESIONS: There are {lesion_count} focal lesion(s) observed.")
        # Note: In a real app, you would loop through 'lesions' array if you sent it
        findings.append("See detailed lesion table below (if applicable).")
    else:
        findings.append("FOCAL LESIONS: No suspicious focal liver lesions identified.")

    # Other Organs (Placeholders based on standard template)
    findings.append(f"BILIARY: {get('aggregateBiliary', 'No ductal dilation.')}")
    findings.append(f"VASCULAR: {get('aggregateVascular', 'Patent portal and hepatic veins.')}")
    findings.append(f"EXTRA-HEPATIC: {get('extraHepatic', 'Unremarkable.')}")

    # D. Impression (The Conclusion)
    impression = get("impressionSummary", "No acute abnormality.")
    recommendation = get("recommendation", "Routine follow-up.")

    # --- ASSEMBLE FINAL TEXT ---
    report_text = f"""
EXAM: {exam_type}

CLINICAL HISTORY: {history}
Etiology: {etiology}

TECHNIQUE:
{technique}

COMPARISON: {get("comparisonAvailable", "None")} ({get("priorExamDate", "")})

FINDINGS:
{chr(10).join(findings)}

IMPRESSION:
{impression}

RECOMMENDATION:
{recommendation}
"""
    return report_text

# --- 5. The Report Generation Endpoint ---

@app.post("/api/generate-standard-report", response_model=GenerateReportResponse)
async def generate_report_endpoint(payload: GenerateReportRequest):
    logger.info(f"Generating report for: {payload.template_type}")
    
    # 1. Choose the builder based on template type
    if "liver" in payload.template_type.lower():
        final_text = build_liver_report(payload.template_data)
    else:
        # Fallback for other templates
        final_text = f"Report Generation for {payload.template_type} is not yet implemented.\n\nData received: {payload.template_data}"

    return GenerateReportResponse(report_text=final_text)

# --- 6. Run Instruction (Comment) ---
# To run this: uvicorn main:app --reload