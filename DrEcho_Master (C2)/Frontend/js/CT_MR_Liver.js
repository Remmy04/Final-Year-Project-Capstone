/* -------------------------
   DOM refs
   ------------------------- */
const modalityEl = document.getElementById('modality');
const reportTitleEl = document.getElementById('reportTitle');

const studyContrastRadios = document.getElementsByName('studyContrast');
const contrastOptionsBlock = document.getElementById('contrastOptions');
const contrastTypeEl = document.getElementById('contrastType');
const contrastVolumeEl = document.getElementById('contrastVolume');

const useSubtractionEl = document.getElementById('useSubtraction');
const subtractionPurposeContainer = document.getElementById('subtractionPurposeContainer');
const subtractionPurposeEl = document.getElementById('subtractionPurpose');

const anyTreatmentRadios = document.getElementsByName('anyTreatment');
const treatmentBlock = document.getElementById('treatmentBlock');
const pathologyBlock = document.getElementById('pathologyBlock');
const addTreatmentDateBtn = document.getElementById('addTreatmentDate');
const treatmentDatesContainer = document.getElementById('treatmentDatesContainer');

const comparisonAvailableEl = document.getElementById('comparisonAvailable');
const comparisonDetailsEl = document.getElementById('comparisonDetails');
const priorExamModalityEl = document.getElementById('priorExamModality');
const priorContrastTypeEl = document.getElementById('priorContrastType');

const observationModeRadios = document.getElementsByName('observationMode');
const lesionCountBlock = document.getElementById('lesionCountBlock');
const lesionCountInput = document.getElementById('lesionCount');
const lesionObservationsContainer = document.getElementById('lesionObservationsContainer');
const aggregateSection = document.getElementById('aggregateSection');

const saveBtn = document.getElementById('saveBtn');

/* -------------------------
   Contrast lists per modality
   ------------------------- */
const contrastLists = {
  CT: [
    { value: '', label: '—' },
    { value: 'iodinated', label: 'Iodinated (CT)' },
    { value: 'other', label: 'Other' }
  ],
  MRI: [
    { value: '', label: '—' },
    { value: 'ec', label: 'Extracellular (MRI)' },
    { value: 'hepatobiliary', label: 'Hepatobiliary agent (MRI)' },
    { value: 'other', label: 'Other' }
  ],
  default: [{ value: '', label: '—' }]
};

/* -------------------------
   Utility functions
   ------------------------- */
function populateSelect(selectEl, list) {
  selectEl.innerHTML = '';
  list.forEach(item => {
    const o = document.createElement('option');
    o.value = item.value;
    o.textContent = item.label;
    selectEl.appendChild(o);
  });
}

/* -------------------------
   1) Modality -> update title & contrast options
   ------------------------- */
function updateModality() {
  const modality = modalityEl.value;
  if (modality === 'CT') {
    reportTitleEl.textContent = 'CT Liver Report';
    populateSelect(contrastTypeEl, contrastLists.CT);
  } else if (modality === 'MRI') {
    reportTitleEl.textContent = 'MRI Liver Report';
    populateSelect(contrastTypeEl, contrastLists.MRI);
  } else {
    reportTitleEl.textContent = 'CT and MRI Liver Report';
    populateSelect(contrastTypeEl, contrastLists.default);
  }

  updatePriorContrastOptions();
}

/* -------------------------
   2) Study type -> show/hide contrast options
   ------------------------- */
function updateContrastBlock() {
  const sel = Array.from(studyContrastRadios).find(r => r.checked);
  if (sel && sel.value === 'contrast') contrastOptionsBlock.style.display = 'block';
  else {
    contrastOptionsBlock.style.display = 'none';
    contrastTypeEl.value = '';
    contrastVolumeEl.value = '';
  }
}

/* -------------------------
   3) Use of vascular subtraction -> show/hide purpose
   ------------------------- */
function updateSubtractionPurposeUI() {
  const val = useSubtractionEl.value;
  if (val === 'Yes') subtractionPurposeContainer.style.display = 'block';
  else subtractionPurposeContainer.style.display = 'none';
}

/* -------------------------
   4) Any treatment? -> show/hide treatment & pathology
   ------------------------- */
function updateTreatmentBlocks() {
  const sel = Array.from(anyTreatmentRadios).find(r => r.checked);
  if (sel && sel.value === 'Yes') {
    treatmentBlock.style.display = 'block';
    pathologyBlock.style.display = 'block';
    if (treatmentDatesContainer.querySelectorAll('.treatmentDateRow').length === 0) {
      addTreatmentDateRow();
    }
  } else {
    treatmentBlock.style.display = 'none';
    pathologyBlock.style.display = 'none';
    const modalityField = document.getElementById('treatmentModalityHistory');
    if (modalityField) modalityField.value = '';
    treatmentDatesContainer.innerHTML = '';
  }
}

/* -------------------------
   Treatment dates: add/remove rows
   ------------------------- */
function addTreatmentDateRow(dateValue = '') {
  const row = document.createElement('div');
  row.className = 'treatmentDateRow';

  const input = document.createElement('input');
  input.type = 'date';
  input.className = 'input treatmentDate';
  input.name = 'treatmentDate';       // for collection
  input.value = dateValue;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-small';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => {
    row.remove();
    adjustTreatmentDateRemoveButtons();
  });

  row.appendChild(input);
  row.appendChild(removeBtn);
  treatmentDatesContainer.appendChild(row);

  adjustTreatmentDateRemoveButtons();
}

function adjustTreatmentDateRemoveButtons() {
  const rows = treatmentDatesContainer.querySelectorAll('.treatmentDateRow');
  rows.forEach(r => {
    const btn = r.querySelector('.btn-small');
    if (!btn) return;
    btn.style.display = (rows.length > 1) ? 'inline-block' : 'none';
  });
}

/* -------------------------
   5) Comparison details toggle & prior contrast population
   ------------------------- */
function updateComparisonDetails() {
  if (comparisonAvailableEl.value === 'Yes') {
    comparisonDetailsEl.style.display = 'block';
  } else {
    comparisonDetailsEl.style.display = 'none';
    priorExamModalityEl.value = '';
    priorContrastTypeEl.innerHTML = '';
    const priorExamDateEl = document.getElementById('priorExamDate');
    const comparisonRemarksEl = document.getElementById('comparisonRemarks');
    if (priorExamDateEl) priorExamDateEl.value = '';
    if (comparisonRemarksEl) comparisonRemarksEl.value = '';
  }
}

function updatePriorContrastOptions() {
  const priorMod = priorExamModalityEl.value;
  if (priorMod === 'CT') populateSelect(priorContrastTypeEl, contrastLists.CT);
  else if (priorMod === 'MRI') populateSelect(priorContrastTypeEl, contrastLists.MRI);
  else populateSelect(priorContrastTypeEl, contrastLists.default);
}

/* -------------------------
   6) Findings: observation mode and lesion generation
   ------------------------- */
function updateObservationMode() {
  const sel = Array.from(observationModeRadios).find(r => r.checked);
  if (!sel) {
    lesionCountBlock.style.display = 'none';
    lesionObservationsContainer.innerHTML = '';
    aggregateSection.style.display = 'none';
    return;
  }

  if (sel.value === 'lesion') {
    lesionCountBlock.style.display = 'block';
    aggregateSection.style.display = 'none';
    const n = parseInt(lesionCountInput.value, 10);
    if (!Number.isNaN(n) && n > 0) generateLesionBlocks(n);
    else lesionObservationsContainer.innerHTML = '';
  } else {
    lesionCountBlock.style.display = 'none';
    lesionObservationsContainer.innerHTML = '';
    aggregateSection.style.display = 'block';
  }
}

/* Observation block HTML */
function createObservationHTML(i) {
  const idx = i;
  return `
    <div class="observation-block" id="observation_${idx}">
      <div class="observation-header">
        <strong style="font-size:14px;">Lesion ${idx}</strong>
      </div>

      <div>
        <label>Segment Location (I–VIII)</label>
        <select class="input" name="segment_${idx}" id="segment_${idx}">
          <option value="">—</option>
          <option>I</option><option>II</option><option>III</option>
          <option>IVa</option><option>IVb</option>
          <option>V</option><option>VI</option><option>VII</option><option>VIII</option>
        </select>
      </div>

      <div class="grid" style="margin-top:10px;">
        <div>
          <label>Size (cm)</label>
          <input class="input" type="number" step="1" name="size_cm_${idx}" id="size_cm_${idx}"
             oninput="this.value = this.value.replace(/[^0-9]/g, '');" />
        </div>
        <div>
          <label>Size (mm)</label>
          <input class="input" type="number" step="1" name="size_mm_${idx}" id="size_mm_${idx}"
             oninput="this.value = this.value.replace(/[^0-9]/g, '');" />
        </div>
      </div>

      <div class="grid" style="margin-top:10px;">
        <div>
          <label>Image ID Number</label>
          <input class="input" type="number" step="1" name="imageid_${idx}" id="imageid_${idx}"
             oninput="this.value = this.value.replace(/[^0-9]/g, '');" />
        </div>
        <div>
          <label>Series Number</label>
          <input class="input" type="number" step="1" name="seriesNumber_${idx}" id="seriesNumber_${idx}"
             oninput="this.value = this.value.replace(/[^0-9]/g, '');" />
        </div>
      </div>

      <div style="margin-top:10px;">
        <label>Tumor in Vein</label>
        <div class="radio-group">
          <label><input type="radio" name="tumorInVein_${idx}" value="Yes"> Yes</label>
          <label><input type="radio" name="tumorInVein_${idx}" value="No"> No</label>
        </div>
      </div>

      <div style="margin-top:10px;">
        <label>LR-M Features</label>
        <input class="input" type="text" name="lrMfeatures_${idx}" id="lrMfeatures_${idx}" />
      </div>

      <div style="margin-top:10px;">
        <label>LR-M Etiology</label>
        <input class="input" type="text" name="lrMetiology_${idx}" id="lrMetiology_${idx}" />
      </div>

      <div class="divider" style="margin-top:14px;"></div>

      <div class="section-sub">Major Imaging Features</div> <br/>
      <div class="grid-4">
        <div>
          <label>Nonrim APHE</label>
          <div class="radio-group">
            <label><input type="radio" name="nonrimAPHE_${idx}" value="Yes"> Yes</label>
            <label><input type="radio" name="nonrimAPHE_${idx}" value="No"> No</label>
          </div>
        </div>
        <div>
          <label>Washout</label>
          <div class="radio-group">
            <label><input type="radio" name="washout_${idx}" value="Yes"> Yes</label>
            <label><input type="radio" name="washout_${idx}" value="No"> No</label>
          </div>
        </div>
        <div>
          <label>Enhancing Capsule</label>
          <div class="radio-group">
            <label><input type="radio" name="enhCapsule_${idx}" value="Yes"> Yes</label>
            <label><input type="radio" name="enhCapsule_${idx}" value="No"> No</label>
          </div>
        </div>
        <div>
          <label>Threshold Growth</label>
          <div class="radio-group">
            <label><input type="radio" name="thresholdGrowth_${idx}" value="Yes"> Yes</label>
            <label><input type="radio" name="thresholdGrowth_${idx}" value="No"> No</label>
            <label><input type="radio" name="thresholdGrowth_${idx}" value="N/A"> N/A</label>
          </div>
        </div>
      </div>

      <div class="divider" style="margin-top:14px;"></div>

      <div class="section-sub">Ancillary Features</div>
      <div class="grid-3">
        <div>
          <label>Favoring Benignity</label>
          <select class="input ancillarySelect" data-target="benignityDetails_${idx}" id="benignity_${idx}" name="benignity_${idx}">
            <option value="">—</option><option>Yes</option><option>None</option>
          </select>
          <div id="benignityDetails_${idx}" class="ancillaryDetail" style="display:none; margin-top: 12px;">
            <label>Specify features</label>
            <input class="input" type="text" name="benignitySpec_${idx}" id="benignitySpec_${idx}" />
          </div>
        </div>

        <div>
          <label>Favoring Malignancy</label>
          <select class="input ancillarySelect" data-target="malignancyDetails_${idx}" id="malignancy_${idx}" name="malignancy_${idx}">
            <option value="">—</option><option>Yes</option><option>None</option>
          </select>
          <div id="malignancyDetails_${idx}" class="ancillaryDetail" style="display:none; margin-top: 12px;">
            <label>Specify features</label>
            <input class="input" type="text" name="malignancySpec_${idx}" id="malignancySpec_${idx}" />
          </div>
        </div>

        <div>
          <label>Favoring HCC in Particular</label>
          <select class="input ancillarySelect" data-target="hccDetails_${idx}" id="hcc_${idx}" name="hcc_${idx}">
            <option value="">—</option><option>Yes</option><option>None</option>
          </select>
          <div id="hccDetails_${idx}" class="ancillaryDetail" style="display:none; margin-top: 12px;">
            <label>Specify features</label>
            <input class="input" type="text" name="hccSpec_${idx}" id="hccSpec_${idx}" />
          </div>
        </div>
      </div>

      <div style="margin-top:12px;">
        <label for="ancillaryOther_${idx}">Other Ancillary Features (If applicable)</label>
        <input id="ancillaryOther_${idx}" class="input optional" type="text" name="ancillaryOther_${idx}" />
      </div>

      <div class="divider" style="margin-top:14px;"></div>

      <div>
        <label>Treated Observation</label>
        <select class="input treatedSelect" data-target="treatedFields_${idx}" id="treated_${idx}" name="treated_${idx}">
          <option value="">—</option><option>Yes</option><option>No</option>
        </select>

        <div id="treatedFields_${idx}" style="display:none; margin-top:10px;">
          <div class="grid">
            <div>
              <label>Size of Equivocal or Viable Tumor</label>
              <input class="input" type="number" step="1" name="equivSize_${idx}" id="equivSize_${idx}"
                 oninput="this.value = this.value.replace(/[^0-9]/g, '');" />
            </div>

            <div>
              <label>Pretreatment LR Category & Size</label>
              <div style="display:flex; align-items:center; gap:6px;">
                <span>LR - </span>
                <input class="input" type="text" style="width:50px;" name="pretLR_${idx}" id="pretLR_${idx}" />
                <input class="input" type="number" step="1" style="width:90px;" name="pretSize_${idx}" id="pretSize_${idx}"
                     oninput="this.value = this.value.replace(/[^0-9.]/g, '');" />
                <span>mm</span>
              </div>
            </div>

            <div style="grid-column:1 / -1;">
              <label>Treatment Modality</label>
              <input class="input" type="text" name="treatModality_${idx}" id="treatModality_${idx}" />
            </div>

            <div style="grid-column:1 / -1;">
              <label>Interim Change</label>
              <input class="input" type="text" name="interimChange_${idx}" id="interimChange_${idx}" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateLesionBlocks(n) {
  lesionObservationsContainer.innerHTML = '';
  const limit = Math.min(Math.max(1, n), 50);
  for (let i = 1; i <= limit; i++) {
    lesionObservationsContainer.insertAdjacentHTML('beforeend', createObservationHTML(i));
  }
  attachGeneratedBlockListeners();
}

/* attach event listeners inside generated observation blocks */
function attachGeneratedBlockListeners() {
  const ancillarySelects = lesionObservationsContainer.querySelectorAll('.ancillarySelect');
  ancillarySelects.forEach(sel => {
    sel.removeEventListener('change', handleAncillaryChange);
    sel.addEventListener('change', handleAncillaryChange);
  });

  const treatedSelects = lesionObservationsContainer.querySelectorAll('.treatedSelect');
  treatedSelects.forEach(sel => {
    sel.removeEventListener('change', handleTreatedChange);
    sel.addEventListener('change', handleTreatedChange);
  });
}

function handleAncillaryChange(e) {
  const targetId = e.target.getAttribute('data-target');
  const el = document.getElementById(targetId);
  if (!el) return;
  el.style.display = (e.target.value === 'Yes') ? 'block' : 'none';
}

function handleTreatedChange(e) {
  const targetId = e.target.getAttribute('data-target');
  const el = document.getElementById(targetId);
  if (!el) return;
  el.style.display = (e.target.value === 'Yes') ? 'block' : 'none';
}

/* -------------------------
   7) Validation helpers
   ------------------------- */

function gatherVisibleRequiredControls() {
  const selectors = 'input, select, textarea';
  const all = Array.from(document.querySelectorAll(selectors));

  return all.filter(el => {
    if (!isElementVisible(el)) return false;
    if (el.tagName.toLowerCase() === 'input' && (el.type === 'button' || el.type === 'submit')) return false;
    if (el.classList.contains('optional')) return false;
    if (el.type === 'hidden') return false;
    return true;
  });
}

function isElementVisible(el) {
  if (!el.offsetParent) {
    const style = window.getComputedStyle(el);
    if (style && style.display === 'none') return false;
    if (style && style.visibility === 'hidden') return false;
  }
  let node = el;
  while (node && node !== document.body) {
    const s = window.getComputedStyle(node);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    node = node.parentElement;
  }
  return true;
}

function validateRadioGroups(errorEls) {
  const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
  const groups = {};
  radios.forEach(r => {
    if (!isElementVisible(r)) return;
    if (r.classList.contains('optional')) return;
    if (!r.name) return;
    groups[r.name] = groups[r.name] || [];
    groups[r.name].push(r);
  });

  Object.keys(groups).forEach(name => {
    const group = groups[name];
    const checked = group.some(r => r.checked);
    if (!checked) {
      const first = group.find(r => isElementVisible(r));
      if (first) errorEls.add(first);
    }
  });
}

function validateControls(errorEls) {
  const controls = gatherVisibleRequiredControls();

  controls.forEach(el => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'select') {
      if (el.value === '') errorEls.add(el);
    } else if (tag === 'input') {
      const t = el.type;
      if (t === 'text' || t === 'date' || t === 'datetime-local' || t === 'number') {
        if (!el.value) errorEls.add(el);
      } else if (t === 'radio' || t === 'checkbox') {
        // radios handled separately
      } else {
        if (!el.value) errorEls.add(el);
      }
    } else if (tag === 'textarea') {
      if (!el.value) errorEls.add(el);
    }
  });
}

function runValidation() {
  const errorEls = new Set();
  validateRadioGroups(errorEls);
  validateControls(errorEls);
  return errorEls;
}

function showMissingHighlights(missingSet) {
  missingSet.forEach(el => {
    el.classList.add('missing');
  });
}

function removeResolvedHighlights(currentMissingSet) {
  const allMissing = Array.from(document.querySelectorAll('.missing'));
  allMissing.forEach(el => {
    if (!currentMissingSet.has(el)) {
      el.classList.add('fade-out');
      el.classList.remove('missing');
      setTimeout(() => {
        el.classList.remove('fade-out');
      }, 450);
    }
  });
}

/* -------------------------
   Collect all template fields into a single object
   ------------------------- */
function collectTemplateFormData() {
  const controls = Array.from(document.querySelectorAll('input, select, textarea'));
  const data = {};

  // 1) Main pass: all normal controls (skip treatmentDate here)
  controls.forEach(el => {
    const tag = el.tagName.toLowerCase();
    const type = el.type;
    const id = el.id;
    const name = el.name;

    if (el.classList.contains('treatmentDate')) return;

    const key = id || name;
    if (!key) return;

    if (type === 'radio') {
      if (el.checked) {
        data[name || id] = el.value;
      }
    } else if (type === 'checkbox') {
      data[key] = el.checked;
    } else {
      data[key] = el.value;
    }
  });

  // 2) Treatment dates array
  const dateInputs = Array.from(document.querySelectorAll('input.treatmentDate'));
  const dates = dateInputs
    .map(el => el.value)
    .filter(v => v && v.trim() !== '');
  if (dates.length > 0) {
    data.treatmentDates = dates;
  }

  // 3) Structured lesions[] array (if observationMode == 'lesion')
  if (data.observationMode === 'lesion') {
    const lesions = [];

    const segmentEls = Array.from(document.querySelectorAll('[id^="segment_"]'));
    const indices = Array.from(
      new Set(
        segmentEls.map(el => {
          const parts = el.id.split('_');
          return parseInt(parts[1], 10);
        }).filter(n => !Number.isNaN(n))
      )
    ).sort((a, b) => a - b);

    indices.forEach(idx => {
      const lesion = { index: idx };

      const getVal = (baseId) => {
        const el = document.getElementById(`${baseId}_${idx}`);
        return el ? el.value : '';
      };

      const getRadio = (baseName) => {
        const radios = document.getElementsByName(`${baseName}_${idx}`);
        const rArr = Array.from(radios);
        const chosen = rArr.find(r => r.checked);
        return chosen ? chosen.value : '';
      };

      lesion.segment         = getVal('segment');
      lesion.size_cm         = getVal('size_cm');
      lesion.size_mm         = getVal('size_mm');
      lesion.imageid         = getVal('imageid');
      lesion.seriesNumber    = getVal('seriesNumber');
      lesion.tumorInVein     = getRadio('tumorInVein');
      lesion.lrMfeatures     = getVal('lrMfeatures');
      lesion.lrMetiology     = getVal('lrMetiology');

      lesion.nonrimAPHE      = getRadio('nonrimAPHE');
      lesion.washout         = getRadio('washout');
      lesion.enhCapsule      = getRadio('enhCapsule');
      lesion.thresholdGrowth = getRadio('thresholdGrowth');

      lesion.benignity       = getVal('benignity');
      lesion.benignitySpec   = getVal('benignitySpec');
      lesion.malignancy      = getVal('malignancy');
      lesion.malignancySpec  = getVal('malignancySpec');
      lesion.hcc             = getVal('hcc');
      lesion.hccSpec         = getVal('hccSpec');
      lesion.ancillaryOther  = getVal('ancillaryOther');

      lesion.treated         = getVal('treated');
      lesion.equivSize       = getVal('equivSize');
      lesion.pretLR          = getVal('pretLR');
      lesion.pretSize        = getVal('pretSize');
      lesion.treatModality   = getVal('treatModality');
      lesion.interimChange   = getVal('interimChange');

      lesions.push(lesion);
    });

    if (lesions.length > 0) {
      data.lesions = lesions;
    }
  }

  console.log('[template] collectTemplateFormData result:', data);
  return data;
}

/* -------------------------
   Generate standard report:
   save to reports/{chatDocId} + call NLP backend
   ------------------------- */
/* -------------------------
   Generate standard report:
   Save to Firestore -> Redirect to Preview (No Backend Call)
   ------------------------- */
/* -------------------------
   Generate standard report:
   1. Save Report to 'reports' (using RA ID)
   2. Save Patient to 'patients' (using P ID)
   3. Redirect to Preview
   ------------------------- */
async function handleGenerateReportClick() {
  console.log('[template] 🔹 Generate report clicked');

  // 1. Validation
  const missing = runValidation();
  if (missing.size > 0) {
    showMissingHighlights(missing);
    removeResolvedHighlights(missing);
    alert('⚠️ Please fill in all required fields before generating the report.');
    return;
  } else {
    removeResolvedHighlights(new Set());
  }

// ... inside handleGenerateReportClick ...

  // 2. Collect Data
  const templateData = collectTemplateFormData();
  const firestoreDB = window.db;
  
  // --- SAFETY NET FIX ---
  // If window.chatDocId is undefined, use null. Firestore accepts null, but crashes on undefined.
  const chatDocId = window.chatDocId || null; 

  // --- NEW: Get IDs directly from the form ---
  const finalReportId = document.getElementById('reportId').value;
  const finalPatientId = document.getElementById('patientId').value;

  if (!firestoreDB || !finalReportId || !finalPatientId) {
    alert('Error: Missing Database, Report ID, or Patient ID.');
    return;
  }

  saveBtn.textContent = "Processing...";
  saveBtn.disabled = true;

  const nowIso = new Date().toISOString();

  // 3. Prepare REPORT Document
  const reportDoc = {
    reportId: finalReportId,     
    patientId: finalPatientId,   
    chatDocId: chatDocId,        // Now safe (will be ID or null)
    templateType: 'CT_MR_LIVER',
    status: 'draft',
    templateData: templateData,
    generatedReport: null,       
    createdAt: nowIso,
    updatedAt: nowIso
  };

  // 4. Prepare PATIENT Document
  const patientDoc = {
      patientId: finalPatientId,
      name: templateData.patientName,
      dob: templateData.dob,
      age: templateData.age,
      sex: templateData.sex,
      lastSeen: nowIso
      // We use 'merge: true' later, so this updates existing patients without deleting old info
  };

  try {
    const batch = firestoreDB.batch();

    // Operation A: Save Report to reports/RA000001
    const reportRef = firestoreDB.collection('reports').doc(finalReportId);
    batch.set(reportRef, reportDoc);

    // Operation B: Save Patient to patients/P-XXXXXX
    const patientRef = firestoreDB.collection('patients').doc(finalPatientId);
    batch.set(patientRef, patientDoc, { merge: true }); // Merge updates info if patient exists

    // Commit both
    await batch.commit();
    console.log('[template] ✅ Saved Report & Patient data.');

    // 5. Redirect using REPORT ID (Not Chat ID)
    window.location.href = 'standard_report.html?reportId=' + encodeURIComponent(finalReportId);

  } catch (err) {
    console.error('[template] Error saving:', err);
    alert('Error saving data: ' + err.message);
    saveBtn.textContent = "Generate standard patient report";
    saveBtn.disabled = false;
  }
}

/* -------------------------
   Attach global listeners & init
   ------------------------- */
function attachListeners() {
  modalityEl.addEventListener('change', updateModality);
  Array.from(studyContrastRadios).forEach(r =>
    r.addEventListener('change', updateContrastBlock)
  );
  useSubtractionEl.addEventListener('change', updateSubtractionPurposeUI);
  Array.from(anyTreatmentRadios).forEach(r =>
    r.addEventListener('change', updateTreatmentBlocks)
  );
  addTreatmentDateBtn.addEventListener('click', () => addTreatmentDateRow());
  comparisonAvailableEl.addEventListener('change', updateComparisonDetails);
  priorExamModalityEl.addEventListener('change', updatePriorContrastOptions);
  Array.from(observationModeRadios).forEach(r =>
    r.addEventListener('change', updateObservationMode)
  );
  lesionCountInput.addEventListener('input', () => {
    const val = parseInt(lesionCountInput.value, 10);
    if (!Number.isNaN(val) && val > 0) generateLesionBlocks(val);
    else lesionObservationsContainer.innerHTML = '';
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', handleGenerateReportClick);
  }
}

/* -------------------------
   Initial page setup
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  populateSelect(contrastTypeEl, contrastLists.default);
  populateSelect(priorContrastTypeEl, contrastLists.default);

  addTreatmentDateRow();

  attachListeners();
  updateModality();
  updateContrastBlock();
  updateSubtractionPurposeUI();
  updateTreatmentBlocks();
  updateComparisonDetails();
  updateObservationMode();
});
