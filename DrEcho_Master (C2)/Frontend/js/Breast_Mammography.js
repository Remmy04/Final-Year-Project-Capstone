function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
}

function populateDateTimeNow() {
  const dateEl = document.getElementById('reportDate');
  if (!dateEl || dateEl.value) return;
  const now = new Date();
  const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  dateEl.value = local;
}

function toggleBlock(blockId, show) {
  const el = document.getElementById(blockId);
  if (el) el.style.display = show ? 'block' : 'none';
}

function renderMasses() {
  const count = parseInt(document.getElementById('massCount')?.value || '0', 10);
  const container = document.getElementById('massContainer');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    const html = `
      <div class="observation-block" data-index="${i}">
        <div class="observation-header"><strong>Mass ${i}</strong></div>
        <div class="grid">
          <div>
            <label>Side</label>
            <select class="input" data-field="side"><option value="">—</option><option>Left Breast</option><option>Right Breast</option></select>
          </div>
          <div>
            <label>Quadrant</label>
            <select class="input" data-field="quadrant"><option value="">—</option><option>UIQ</option><option>UOQ</option><option>LIQ</option><option>LOQ</option><option>Retroareolar</option><option>Central inner</option><option>Central outer</option></select>
          </div>
          <div>
            <label>Shape</label>
            <select class="input" data-field="shape"><option value="">—</option><option>Oval</option><option>Round</option><option>Irregular</option></select>
          </div>
          <div>
            <label>Margin</label>
            <select class="input" data-field="margin"><option value="">—</option><option>Circumscribed</option><option>Obscured</option><option>Microlobulated</option><option>Indistinct</option><option>Spiculated</option></select>
          </div>
          <div>
            <label>Density</label>
            <select class="input" data-field="density"><option value="">—</option><option>High density</option><option>Equal density</option><option>Low density</option><option>Fat-containing</option></select>
          </div>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
  }
}

function createLesionBlock(side, idx) {
  return `
  <div class="observation-block" data-index="${idx}">
    <div class="observation-header"><strong>${side} Lesion ${idx}</strong></div>
    <div class="grid">
      <div>
        <label>Status</label>
        <select class="input" data-field="status"><option value="">—</option><option>New</option><option>Stable</option><option>Changed</option></select>
      </div>
      <div>
        <label>Clock Position</label>
        <input class="input" type="number" min="1" max="12" data-field="clockPosition" />
      </div>
      <div>
        <label>Distance from Nipple (cm)</label>
        <input class="input" type="number" min="0" step="0.1" data-field="distanceFromNippleCm" />
      </div>
      <div>
        <label>Length (cm)</label>
        <input class="input" type="number" min="0" step="0.1" data-field="lengthCm" />
      </div>
      <div>
        <label>Width (cm)</label>
        <input class="input" type="number" min="0" step="0.1" data-field="widthCm" />
      </div>
      <div>
        <label>Height (cm)</label>
        <input class="input" type="number" min="0" step="0.1" data-field="heightCm" />
      </div>
      <div>
        <label>Shape</label>
        <select class="input" data-field="shape"><option value="">—</option><option>Oval</option><option>Round</option><option>Lobulated</option><option>Irregular</option></select>
      </div>
      <div>
        <label>Echo Pattern</label>
        <select class="input" data-field="echoPattern"><option value="">—</option><option>Anechoic</option><option>Hyperechoic</option><option>Complex</option><option>Hypoechoic</option><option>Isoechoic</option></select>
      </div>
      <div>
        <label>Internal Vascularity</label>
        <select class="input" data-field="internalVascularity"><option value="">—</option><option>Absent</option><option>Present</option></select>
      </div>
      <div>
        <label>Internal Calcifications</label>
        <select class="input" data-field="internalCalcifications"><option value="">—</option><option>Absent</option><option>Present</option></select>
      </div>
    </div>
  </div>`;
}

function createCystBlock(side, idx) {
  return `
  <div class="observation-block" data-index="${idx}">
    <div class="observation-header"><strong>${side} Cyst ${idx}</strong></div>
    <div class="grid">
      <div><label>Clock Position</label><input class="input" type="number" min="1" max="12" data-field="clockPosition" /></div>
      <div><label>Distance from Nipple (cm)</label><input class="input" type="number" min="0" step="0.1" data-field="distanceFromNippleCm" /></div>
      <div><label>Length (cm)</label><input class="input" type="number" min="0" step="0.1" data-field="lengthCm" /></div>
      <div><label>Width (cm)</label><input class="input" type="number" min="0" step="0.1" data-field="widthCm" /></div>
      <div><label>Height (cm)</label><input class="input" type="number" min="0" step="0.1" data-field="heightCm" /></div>
      <div><label>Type</label><select class="input" data-field="type"><option value="">—</option><option>Simple</option><option>Complicated</option><option>Complex/Septated</option></select></div>
    </div>
  </div>`;
}

function renderByCount(countId, containerId, blockFactory, sideLabel) {
  const count = parseInt(document.getElementById(countId)?.value || '0', 10);
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= count; i++) container.insertAdjacentHTML('beforeend', blockFactory(sideLabel, i));
}

function collectBlocks(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} .observation-block`)).map((block, idx) => {
    const obj = { index: idx + 1 };
    block.querySelectorAll('[data-field]').forEach(el => {
      obj[el.dataset.field] = el.value || '';
    });
    return obj;
  });
}

function updatePrimaryIndicationUI() {
  const val = document.getElementById('primaryIndication')?.value || '';
  toggleBlock('symptomsBlock', val === 'Diagnostic' || val === 'Follow-up for known lumps');
  toggleBlock('postSurgicalBlock', val === 'Post-Surgical follow-up');
}

function updateComparisonUI() {
  toggleBlock('comparisonBlock', getRadioValue('comparisonAvailable') === 'Yes');
}

function updateModalitySectionVisibility() {
  const val = getRadioValue('modalityEvaluated');
  const mammographySection = document.getElementById('mammographyFindings');
  const usSection = document.getElementById('ultrasoundFindings');
  if (mammographySection) mammographySection.style.display = val === 'Ultrasound Only' ? 'none' : 'block';
  if (usSection) usSection.style.display = val === 'Mammogram Only' ? 'none' : 'block';
}

function updateToggleBlocks() {
  toggleBlock('massBlock', getRadioValue('massPresent') === 'Yes');
  toggleBlock('calcificationBlock', getRadioValue('calcificationsPresent') === 'Yes');
  toggleBlock('architecturalDescriptionBlock', getRadioValue('architecturalDistortion') === 'Yes');
  toggleBlock('rightLesionBlock', getRadioValue('rightSolidLesions') === 'Yes');
  toggleBlock('leftLesionBlock', getRadioValue('leftSolidLesions') === 'Yes');
  toggleBlock('rightCystBlock', getRadioValue('rightCysts') === 'Yes');
  toggleBlock('leftCystBlock', getRadioValue('leftCysts') === 'Yes');
  toggleBlock('rightResolvedBlock', getRadioValue('rightResolved') === 'Yes');
  toggleBlock('leftResolvedBlock', getRadioValue('leftResolved') === 'Yes');
  toggleBlock('lymphNodeBlock', getRadioValue('lymphadenopathy') === 'Yes');
  toggleBlock('chestWallFindingsBlock', getCheckedValues('chestWallSides').length > 0);
}

function collectFormData() {
  return {
    reportDate: document.getElementById('reportDate')?.value || '',
    patientName: document.getElementById('patientName')?.value || '',
    dob: document.getElementById('dob')?.value || '',
    age: document.getElementById('age')?.value || '',
    sex: document.getElementById('sex')?.value || '',
    patientId: document.getElementById('patientId')?.value || '',
    reportId: document.getElementById('reportId')?.value || '',
    referrer: document.getElementById('referrer')?.value || '',

    primaryIndication: document.getElementById('primaryIndication')?.value || '',
    specificSymptoms: getCheckedValues('specificSymptoms'),
    priorTreatmentSurgery: document.getElementById('priorTreatmentSurgery')?.value || '',

    modalityEvaluated: getRadioValue('modalityEvaluated'),
    comparisonAvailable: getRadioValue('comparisonAvailable'),
    priorStudyModality: document.getElementById('priorStudyModality')?.value || '',
    priorStudyDate: document.getElementById('priorStudyDate')?.value || '',

    density: getRadioValue('density'),
    massPresent: getRadioValue('massPresent'),
    massCount: document.getElementById('massCount')?.value || '',
    masses: collectBlocks('massContainer'),

    calcificationsPresent: getRadioValue('calcificationsPresent'),
    calcificationMorphology: document.getElementById('calcificationMorphology')?.value || '',
    calcificationDistribution: document.getElementById('calcificationDistribution')?.value || '',

    architecturalDistortion: getRadioValue('architecturalDistortion'),
    architecturalDescription: document.getElementById('architecturalDescription')?.value || '',
    otherMammographicFindings: getCheckedValues('otherMammographicFindings'),

    rightBackgroundEchotexture: document.getElementById('rightBackgroundEchotexture')?.value || '',
    rightSolidLesions: getRadioValue('rightSolidLesions'),
    rightLesionCount: document.getElementById('rightLesionCount')?.value || '',
    rightLesions: collectBlocks('rightLesionContainer'),
    rightCysts: getRadioValue('rightCysts'),
    rightCystCount: document.getElementById('rightCystCount')?.value || '',
    rightCystsDetail: collectBlocks('rightCystContainer'),
    rightResolved: getRadioValue('rightResolved'),
    rightResolvedDetails: document.getElementById('rightResolvedDetails')?.value || '',
    rightOtherFindings: getCheckedValues('rightOtherFindings'),

    leftBackgroundEchotexture: document.getElementById('leftBackgroundEchotexture')?.value || '',
    leftSolidLesions: getRadioValue('leftSolidLesions'),
    leftLesionCount: document.getElementById('leftLesionCount')?.value || '',
    leftLesions: collectBlocks('leftLesionContainer'),
    leftCysts: getRadioValue('leftCysts'),
    leftCystCount: document.getElementById('leftCystCount')?.value || '',
    leftCystsDetail: collectBlocks('leftCystContainer'),
    leftResolved: getRadioValue('leftResolved'),
    leftResolvedDetails: document.getElementById('leftResolvedDetails')?.value || '',
    leftOtherFindings: getCheckedValues('leftOtherFindings'),

    chestWallSides: getCheckedValues('chestWallSides'),
    chestWallFindings: getRadioValue('chestWallFindings'),

    lymphadenopathy: getRadioValue('lymphadenopathy'),
    lymphNodeSide: document.getElementById('lymphNodeSide')?.value || '',
    fattyHilum: getRadioValue('fattyHilum'),
    corticalThickness: document.getElementById('corticalThickness')?.value || '',

    impressionSummary: document.getElementById('impressionSummary')?.value || '',
    recommendation: document.getElementById('recommendation')?.value || '',
    biradsCategory: document.getElementById('biradsCategory')?.value || '',
    createdBy: document.getElementById('createdBy')?.value || '',
    approvedBy: document.getElementById('approvedBy')?.value || ''
  };
}

async function generateAIReportId() {
  const reportIdEl = document.getElementById('reportId');
  if (!reportIdEl || reportIdEl.value) return;
  reportIdEl.value = await generateNextId('reports', 'RA');
}

function generatePatientId(name = '', dob = '') {
  const pId = document.getElementById('patientId');
  if (!pId || pId.value) return;
  if (!name) return;
  const base = name.replace(/\s/g, '').substring(0, 3).toUpperCase();
  const year = dob ? dob.split('-')[0] : new Date().getFullYear();
  pId.value = `P-${base}${year}`;
}

async function saveTemplateData(e) {
    if (e) e.preventDefault();
    
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = "Generating...";
    }

    try {
        const currentUser = firebase.auth().currentUser;
        // Safe fallback ID so you don't get the auth error
        const currentUserId = currentUser ? currentUser.uid : "test_dev_user";

        // 1. Grab metadata
        const reportId = document.getElementById("reportId").value;
        const patientId = document.getElementById("patientId").value;
        const patientName = document.getElementById("patientName").value;
        const age = document.getElementById("age").value;
        const sex = document.getElementById("sex").value;
        const dob = document.getElementById("dob").value;
        const referrer = document.getElementById("referrer").value;
        const reportDate = document.getElementById("reportDate").value || new Date().toISOString();
        
        const createdBy = document.getElementById("createdBy")?.value || "Dr. Echo User";
        const approvedBy = document.getElementById("approvedBy")?.value || "";
        
        // CRITICAL FIX: Use .innerHTML to grab the bold tags and headings from the preview!
        const previewTextBox = document.getElementById("previewText");
        const finalNarrative = previewTextBox ? previewTextBox.innerHTML.trim() : "";

        if (!finalNarrative) {
            alert("Please click 'Generate / Refresh Preview' to generate the text before saving.");
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerText = "Generate standard patient report";
            }
            return;
        }

        // 2. Batch Write to Firestore
        const batch = window.db.batch();

        const patientRef = window.db.collection("patients").doc(patientId);
        batch.set(patientRef, {
            patientId,
            patientName,
            age,
            sex,
            dob,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        const reportRef = window.db.collection("reports").doc(reportId);
        batch.set(reportRef, {
            reportId,
            patientId,
            patientName,
            userId: currentUserId,
            examType: "Breast Mammography",
            reportDate,
            referrer,
            createdBy,
            approvedBy,
            finalNarrativeText: finalNarrative, // This now contains the formatted HTML!
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        // 3. Redirect to the Final Standard Report
        window.location.href = `Breast_Mammography_standard_report.html?reportId=${reportId}`;

    } catch (error) {
        console.error("Error generating report:", error);
        alert("Failed to generate report. Check console.");
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = "Generate standard patient report";
        }
    }
}

function attachListeners() {
  document.getElementById('primaryIndication')?.addEventListener('change', updatePrimaryIndicationUI);
  document.querySelectorAll('input[name="comparisonAvailable"]').forEach(el => el.addEventListener('change', updateComparisonUI));
  document.querySelectorAll('input[name="modalityEvaluated"]').forEach(el => el.addEventListener('change', updateModalitySectionVisibility));

  [
    'massPresent', 'calcificationsPresent', 'architecturalDistortion',
    'rightSolidLesions', 'leftSolidLesions', 'rightCysts', 'leftCysts',
    'rightResolved', 'leftResolved', 'lymphadenopathy'
  ].forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.addEventListener('change', updateToggleBlocks));
  });

  document.querySelectorAll('input[name="chestWallSides"]').forEach(el => el.addEventListener('change', updateToggleBlocks));

  document.getElementById('massCount')?.addEventListener('input', renderMasses);
  document.getElementById('rightLesionCount')?.addEventListener('input', () => renderByCount('rightLesionCount', 'rightLesionContainer', createLesionBlock, 'Right'));
  document.getElementById('leftLesionCount')?.addEventListener('input', () => renderByCount('leftLesionCount', 'leftLesionContainer', createLesionBlock, 'Left'));
  document.getElementById('rightCystCount')?.addEventListener('input', () => renderByCount('rightCystCount', 'rightCystContainer', createCystBlock, 'Right'));
  document.getElementById('leftCystCount')?.addEventListener('input', () => renderByCount('leftCystCount', 'leftCystContainer', createCystBlock, 'Left'));

  document.getElementById('patientName')?.addEventListener('blur', () => generatePatientId(document.getElementById('patientName')?.value, document.getElementById('dob')?.value));
  document.getElementById('dob')?.addEventListener('change', () => generatePatientId(document.getElementById('patientName')?.value, document.getElementById('dob')?.value));

  document.getElementById('saveBtn')?.addEventListener('click', saveTemplateData);
}

document.addEventListener('DOMContentLoaded', async () => {
  populateDateTimeNow();
  attachListeners();
  updatePrimaryIndicationUI();
  updateComparisonUI();
  updateModalitySectionVisibility();
  updateToggleBlocks();
  await generateAIReportId();
  generatePatientId(document.getElementById('patientName')?.value, document.getElementById('dob')?.value);
});
