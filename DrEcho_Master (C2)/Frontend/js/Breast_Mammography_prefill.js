document.addEventListener("DOMContentLoaded", async () => {
    console.log("[Prefill] Initializing Breast Mammography Prefill...");
    
    // 1. Auto-Generate the Patient ID and Report ID
    try {
        const patientIdInput = document.getElementById("patientId");
        if (patientIdInput && !patientIdInput.value) {
            // Generates a transactional ID like P000001
            patientIdInput.value = await generateNextId('patients', 'P'); 
        }

        const reportIdInput = document.getElementById("reportId");
        if (reportIdInput && !reportIdInput.value) {
            // Generates a transactional ID like RA000001
            reportIdInput.value = await generateNextId('reports', 'RA');
        }
    } catch (error) {
        console.error("[Prefill] Error generating transactional IDs:", error);
    }

    // 2. Fetch the AI Extracted Data
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("sessionId");

    if (!sessionId) {
        console.warn("[Prefill] No sessionId found in URL. Skipping AI prefill.");
        return;
    }

    try {
        // Query Firestore for the latest messages in this chat session
        const messagesRef = window.db.collection("chatSessions").doc(sessionId).collection("messages");
        const snapshot = await messagesRef.orderBy("timestamp", "desc").limit(10).get();

        let aiData = null;

        // Find the most recent bot message that contains extractedData
        for (let doc of snapshot.docs) {
            const data = doc.data();
            if (data.role === "bot" && data.extractedData) {
                aiData = data.extractedData;
                break;
            }
        }

        if (aiData) {
            console.log("[Prefill] AI Data found! Populating template...", aiData);

            // --- SECTION 1: Demographics ---
            if (aiData.patient_name) {
                document.getElementById('patientName').value = aiData.patient_name;
            }
            if (aiData.patient_age) {
                // Strip out text just in case the AI included "years old"
                document.getElementById('age').value = aiData.patient_age.replace(/[^0-9]/g, '');
            }
            
            // Map Gender to the dropdown Select element
            if (aiData.patient_gender) {
                const sexSelect = document.getElementById('sex');
                const gender = aiData.patient_gender.toLowerCase();
                if (gender.includes('female')) sexSelect.value = 'Female';
                else if (gender.includes('male')) sexSelect.value = 'Male';
                else sexSelect.value = 'Other';
            }

            // Map Indication to the dropdown Select element
            if (aiData.primary_indication) {
                const indSelect = document.getElementById('primaryIndication');
                const ind = aiData.primary_indication.toLowerCase();
                if (ind.includes('screen')) indSelect.value = 'Screening';
                else if (ind.includes('diag')) indSelect.value = 'Diagnostic';
                else if (ind.includes('lump')) indSelect.value = 'Follow-up for known lumps';
                else if (ind.includes('surg')) indSelect.value = 'Post-Surgical follow-up';
            }

            if (aiData.referring_physician) {
                document.getElementById('referrer').value = aiData.referring_physician;
            }

            // You can add more mappings here for Sections 2-5 once we confirm Section 1 works perfectly!
        } else {
            console.warn("[Prefill] No extractedData found in the recent chat history.");
        }

    } catch (error) {
        console.error("[Prefill] Error fetching AI data:", error);
    }
});