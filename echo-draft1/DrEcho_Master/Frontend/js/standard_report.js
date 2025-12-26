// js/standard_report.js

console.log("[standard_report] script loaded");

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  
  // --- NEW: Look for reportId first ---
  const reportId = params.get("reportId");
  
  if (!reportId) {
    alert("Missing reportId in URL.");
    return;
  }

  const firestoreDB = window.db;
  if (!firestoreDB) {
    alert("Error: Firebase is not initialized.");
    return;
  }

  // 1. Fetch the Saved Report Data using Report ID
  let reportDoc;
  try {
    // Note: We are now querying by the Report ID (e.g. RA00001)
    const snap = await firestoreDB.collection("reports").doc(reportId).get();
    if (!snap.exists) {
      alert("Report data not found (" + reportId + ").");
      return;
    }
    reportDoc = snap.data() || {};
  } catch (err) {
    console.error(err);
    alert("Error loading report from database.");
    return;
  }

  // Get the chat ID from inside the report (for the back buttons)
  const linkedChatId = reportDoc.chatDocId; 
  const t = reportDoc.templateData || {};

  // 2. Fill Metadata
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value && String(value).trim() ? String(value) : "—";
  };

  setText("sr-patientName", t.patientName);
  setText("sr-subTitle", `for ${t.patientName || 'Patient'}`);
  setText("sr-age", t.age);
  setText("sr-sex", t.sex);
  setText("sr-dob", t.dob);
  setText("sr-patientId", t.patientId);
  setText("sr-reportId", t.reportId);
  setText("sr-institution", t.institution);
  setText("sr-referrer", t.referrer);
  setText("sr-reportDate", t.reportDate ? t.reportDate.replace("T", " ") : "");

  setText("sr-modality", t.modality);
  setText("sr-studyContrast", t.studyContrast);
  setText("sr-contrastType", t.contrastType);
  setText("sr-contrastVolume", t.contrastVolume);
  
  setText("sr-impressionSummary", t.impressionSummary);
  setText("sr-recommendation", t.recommendation);
  setText("sr-examConclusion", t.examConclusion);
  setText("sr-createdBy", t.createdBy);
  setText("sr-approvedBy", t.approvedBy);

  // 3. Generate Text (Rule-Based)
  const reportTextBox = document.getElementById("sr-fullReportText");
  
  if (reportTextBox) {
      if (reportDoc.generatedReport && reportDoc.generatedReport.text) {
          reportTextBox.innerHTML = reportDoc.generatedReport.text;
      } else {
          console.log("Generating fresh report text...");
          // Ensure generateLiverReportText is loaded from report_generator.js
          if (typeof generateLiverReportText === 'function') {
              const generatedHTML = generateLiverReportText(t); 
              reportTextBox.innerHTML = generatedHTML;
              saveReportToDB(generatedHTML); 
          } else {
              reportTextBox.textContent = "Error: Generator script not loaded.";
          }
      }
  }

  // ================= BUTTON LOGIC =================

  async function saveReportToDB(htmlContent) {
      try {
          await firestoreDB.collection("reports").doc(reportId).update({
              generatedReport: { text: htmlContent },
              status: "completed",
              updatedAt: new Date().toISOString()
          });
          console.log("Report text auto-saved.");
      } catch (e) {
          console.error("Auto-save failed", e);
      }
  }

  const saveBtn = document.getElementById("sr-saveReportBtn");
  if(saveBtn) {
      saveBtn.addEventListener("click", async () => {
          await saveReportToDB(reportTextBox.innerHTML);
          alert("Report saved successfully!");
      });
  }

  const downloadBtn = document.getElementById("sr-downloadBtn");
  if(downloadBtn) {
      downloadBtn.addEventListener("click", () => {
          window.print(); 
      });
  }

  const editBtn = document.getElementById("sr-editBtn");
  let isEditing = false;
  if(editBtn) {
      editBtn.addEventListener("click", () => {
          isEditing = !isEditing;
          reportTextBox.contentEditable = isEditing;
          reportTextBox.classList.toggle("editing", isEditing);
          editBtn.classList.toggle("active", isEditing);
          if(isEditing) alert("Edit mode enabled. Click Save when done.");
      });
  }
  
  // Back Buttons - Use the linkedChatId we got from the report
  const backBtn = document.getElementById("sr-backBtn");
  if(backBtn) {
      backBtn.onclick = () => {
          if(linkedChatId) window.location.href = `CT_MR_Liver_AI.html?sessionId=${linkedChatId}`;
          else window.history.back();
      };
  }
  
  const chatBtn = document.getElementById("sr-chatbotBtn");
  if(chatBtn) {
      chatBtn.onclick = () => {
          if(linkedChatId) window.location.href = `chatbot.html?sessionId=${linkedChatId}`;
          else window.location.href = 'chatbot.html';
      };
  }

});