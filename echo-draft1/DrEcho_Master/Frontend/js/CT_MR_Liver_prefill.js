// frontend/js/CT_MR_Liver_prefill.js - SUB-COLLECTION SUPPORT

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auto-fill Date & Time (LOCAL TIME FIX)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');     // <--- Must use getHours()
  const minutes = String(now.getMinutes()).padStart(2, '0'); // <--- Must use getMinutes()
  const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;

  const dateEl = document.getElementById('reportDate');
  if (dateEl) dateEl.value = localTimeString;
  
  // 2. Get Session ID from URL (Note: changed param name to sessionId)
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId') || params.get('chatDocId'); // Support both for now

  if (!sessionId) {
      console.warn("No session ID found in URL.");
      return;
  }

  const firestoreDB = window.db;
  if (!firestoreDB) return;

  try {
    console.log(`[prefill] Searching for data in session: ${sessionId}`);

    // --- NEW LOGIC: Find latest data in 'messages' sub-collection ---
    // We query the sub-collection, order by newest first, and limit to 1.
    const messagesSnap = await firestoreDB.collection('chatSessions')
                                          .doc(sessionId)
                                          .collection('messages')
                                          .where('role', '==', 'bot') // Only look at bot replies
                                          .orderBy('timestamp', 'desc')
                                          .limit(1)
                                          .get();

    if (messagesSnap.empty) {
        console.warn("[prefill] No bot messages found in this session.");
        return;
    }

    // Get the latest bot message data
    const latestMsgData = messagesSnap.docs[0].data();
    const extracted = latestMsgData.extractedData || {};
    
    console.log("[prefill] Found extracted data:", extracted);

    // 3. Map Data to HTML Fields (Standard mapping)
    const mapping = {
        'patientName': 'patientName', 'age': 'age', 'sex': 'gender',
        'dob': 'dob', 'modality': 'examType'
    };

    for (const [htmlId, jsonKey] of Object.entries(mapping)) {
        const value = extracted[jsonKey];
        const element = document.getElementById(htmlId);
        if (element && value) {
            if (htmlId === 'sex') {
                element.value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            } else if (htmlId === 'modality') {
                const titleEl = document.getElementById('reportTitle');
                if (value.toLowerCase().includes('ct')) {
                    element.value = 'CT'; if(titleEl) titleEl.innerText = "CT Liver Report";
                } else if (value.toLowerCase().includes('mri')) {
                    element.value = 'MRI'; if(titleEl) titleEl.innerText = "MRI Liver Report";
                }
            } else {
                element.value = value;
            }
        }
    }

    // 4. Generate IDs
    generatePatientId(extracted['patientName'], extracted['dob']);
    generateAIReportId();

  } catch (error) {
    console.error("Prefill Error:", error);
  }
});

// --- HELPERS (Same as before) ---
function generatePatientId(name, dob) {
    const pIdEl = document.getElementById("patientId");
    if (pIdEl && (!pIdEl.value)) {
        if (!name) { pIdEl.value = "Unknown"; return; }
        const namePart = name.replace(/\s/g, '').substring(0, 3).toUpperCase();
        const yearPart = dob ? dob.split('-')[0] : new Date().getFullYear();
        pIdEl.value = `P-${namePart}${yearPart}`;
    }
}

async function generateAIReportId() {
    const reportIdEl = document.getElementById("reportId");
    if(reportIdEl && reportIdEl.value === "") {
        try {
            // Uses your new universal id_generator.js
            const newId = await generateNextId('reports_echo', 'RA');
            reportIdEl.value = newId;
        } catch (err) {
            reportIdEl.value = "RA-" + Date.now();
        }
    }
}