document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get("reportId");

    if (!reportId) {
        alert("No Report ID found.");
        return;
    }

    try {
        const reportDoc = await window.db.collection("reports").doc(reportId).get();
        if (!reportDoc.exists) {
            document.getElementById("sr-fullReportText").innerText = "Report not found.";
            return;
        }

        const data = reportDoc.data();

        // 1. Fill Grid
        document.getElementById("sr-patientName").innerText = data.patientName || "-";
        document.getElementById("sr-patientId").innerText = data.patientId || "-";
        document.getElementById("sr-reportId").innerText = data.reportId || "-";
        document.getElementById("sr-reportDate").innerText = new Date(data.reportDate).toLocaleString() || "-";
        document.getElementById("sr-referrer").innerText = data.referrer || "-";

        const patientDoc = await window.db.collection("patients").doc(data.patientId).get();
        if (patientDoc.exists) {
            const pData = patientDoc.data();
            document.getElementById("sr-age").innerText = pData.age || "-";
            document.getElementById("sr-sex").innerText = pData.sex || "-";
            document.getElementById("sr-dob").innerText = pData.dob || "-";
        }

        // 2. CRITICAL FIX: Inject the HTML narrative using .innerHTML!
        if (data.finalNarrativeText) {
            document.getElementById("sr-fullReportText").innerHTML = data.finalNarrativeText;
        }

        document.getElementById("sr-createdBy").innerText = data.createdBy || "Radiologist";
        document.getElementById("sr-approvedBy").innerText = data.approvedBy || "Pending Sign-off";

    } catch (error) {
        console.error("Error loading standard report:", error);
    }

    // --- CAPSTONE 1 TOOLBAR LOGIC ---
    
    document.getElementById("sr-backBtn").addEventListener("click", () => {
        window.history.back();
    });
    
    document.getElementById("sr-downloadBtn").addEventListener("click", () => {
        window.print();
    });

    // Edit Button Toggle
    const editBtn = document.getElementById("sr-editBtn");
    const reportTextBox = document.getElementById("sr-fullReportText");
    let isEditing = false;
    
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            isEditing = !isEditing;
            reportTextBox.contentEditable = isEditing;
            reportTextBox.classList.toggle("editing", isEditing);
            
            if (isEditing) {
                editBtn.classList.add("active");
                editBtn.innerText = "💾 Finish Editing";
            } else {
                editBtn.classList.remove("active");
                editBtn.innerText = "✎ Edit";
            }
        });
    }

    // Save Button (Updates Firestore manually)
    const saveBtn = document.getElementById("sr-saveReportBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            try {
                await window.db.collection("reports").doc(reportId).update({
                    // Use innerHTML here too when manually saving edits!
                    finalNarrativeText: reportTextBox.innerHTML, 
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert("Report text updated and saved successfully!");
            } catch (e) {
                console.error("Save failed", e);
                alert("Error saving report.");
            }
        });
    }

// --- SAVE TO PROFILE LOGIC ---
    
    // 1. Create a variable to hold your ID securely
    let loggedInUserId = null;

    // 2. Set up a silent background watcher to grab your ID the moment Firebase is ready
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loggedInUserId = user.uid;
        }
    });

    const saveProfileBtn = document.getElementById("sr-saveProfileBtn");
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener("click", async () => {
            
            // 3. Check our secure variable instead of asking Firebase directly
            if (!loggedInUserId) {
                alert("Please wait a second for your account to sync, or ensure you are logged in.");
                return;
            }

            saveProfileBtn.innerText = "Saving...";
            saveProfileBtn.disabled = true;

            try {
                const pNameText = document.getElementById("sr-patientName").innerText;
                const dobText = document.getElementById("sr-dob").innerText;

                const cleanName = pNameText.replace(/\s+/g, ''); 
                const year = (dobText && dobText !== "-") ? dobText.substring(0, 4) : new Date().getFullYear();
                const customReportName = `${cleanName}${year}`;

                // 4. Use the securely stored loggedInUserId!
                await window.db.collection("reports").doc(reportId).update({
                    savedToProfile: true,
                    customReportName: customReportName,
                    userId: loggedInUserId, 
                    savedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                saveProfileBtn.style.backgroundColor = "#27ae60"; 
                saveProfileBtn.style.color = "white";
                saveProfileBtn.innerText = "✓ Saved to Profile";

                alert(`Success! Report saved as "${customReportName}" in your Profile History.`);

            } catch (error) {
                console.error("Error saving to profile:", error);
                alert("Failed to save to profile.");
                saveProfileBtn.innerText = "💾 Save to Profile";
                saveProfileBtn.disabled = false;
            }
        });
    }
});