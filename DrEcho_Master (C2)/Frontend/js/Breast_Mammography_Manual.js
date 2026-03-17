async function generateManualReportId() {
  const reportIdEl = document.getElementById('reportId');
  if (!reportIdEl || reportIdEl.value) return;
  reportIdEl.value = await generateNextId('reports_manual', 'RM');
}

async function saveManualReport() {
  const saveBtn = document.getElementById('saveBtn');
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Please log in to save reports.');
    return;
  }

  const finalReportId = document.getElementById('reportId')?.value;
  if (!finalReportId) {
    alert('Report ID is missing.');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const userSnap = await db.collection('users').doc(user.uid).get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const reportData = {
      ...collectFormData(),
      reportId: finalReportId,
      authUid: user.uid,
      userDisplayId: userData.userId || user.uid,
      userEmail: user.email || 'unknown',
      savedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      reportType: 'Breast_Mammography_Manual',
      reportTitle: document.getElementById('reportTitle')?.textContent?.trim() || 'Breast Mammography Report',
      isDraft: false,
      templateType: 'Breast_Mammography'
    };

    await db.collection('reports_manual').doc(finalReportId).set(reportData);
    alert(`Report ID: ${finalReportId}\nReport saved successfully.`);
    window.location.href = '../html/template.html';
  } catch (error) {
    console.error('Manual save failed', error);
    alert('Failed to save: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Template';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await generateManualReportId();
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    const newBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newBtn, saveBtn);
    newBtn.addEventListener('click', saveManualReport);
  }
});
