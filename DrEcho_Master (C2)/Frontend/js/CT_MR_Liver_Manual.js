/* frontend/js/CT_MR_Liver_Manual.js */

// 1. Universal ID Generation (Replaces the old transaction logic)
async function generateManualReportId() {
    const reportIdEl = document.getElementById("reportId");
    
    // Only generate if empty or showing an error/login msg
    if (reportIdEl && (reportIdEl.value === "" || reportIdEl.value === "Please log in" || reportIdEl.value === "Login required")) {
        try {
            // Uses your new universal id_generator.js
            const newId = await generateNextId('reports_manual', 'RM');
            reportIdEl.value = newId;
            console.log("Generated Manual ID:", newId);
        } catch (err) {
            console.error("ID Gen Error:", err);
            // Fallback so the user isn't stuck
            reportIdEl.value = "RM-" + Date.now(); 
        }
    }
}

// 2. Patient ID Auto-Generator
function updatePatientId() {
    const nameInput = document.getElementById('patientName');
    const dobInput = document.getElementById('dob');
    const pIdInput = document.getElementById('patientId');
    
    if (!nameInput || !dobInput || !pIdInput) return;

    const name = nameInput.value;
    const dob = dobInput.value;
    
    // Only generate if we have a Name and the ID field is empty
    if (name && pIdInput.value === "") {
        // Logic: First 3 letters of Name + Year of Birth (e.g. HNG2004)
        // Removes spaces, takes 3 chars, uppercase
        const namePart = name.replace(/\s/g, '').substring(0, 3).toUpperCase();
        const yearPart = dob ? dob.split('-')[0] : new Date().getFullYear();
        pIdInput.value = `P-${namePart}${yearPart}`;
    }
}


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
        if (treatmentDatesContainer.querySelectorAll('.treatmentDateRow').length === 0) addTreatmentDateRow();
    } else {
        treatmentBlock.style.display = 'none';
        pathologyBlock.style.display = 'none';
        document.getElementById('treatmentModalityHistory').value = '';
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
    input.value = dateValue;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-small';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
        row.remove();
    });

    row.appendChild(input);
    row.appendChild(removeBtn);
    treatmentDatesContainer.appendChild(row);

    adjustTreatmentDateRemoveButtons();
}

function adjustTreatmentDateRemoveButtons() {
    const rows = treatmentDatesContainer.querySelectorAll('.treatmentDateRow');
    rows.forEach((r, idx) => {
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
        document.getElementById('priorExamDate').value = '';
        document.getElementById('comparisonRemarks').value = '';
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

/* Observation Part*/
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
               <input class="input" type="text" name="benignitySpec_${idx}" />
             </div>
           </div>
   
           <div>
             <label>Favoring Malignancy</label>
             <select class="input ancillarySelect" data-target="malignancyDetails_${idx}" id="malignancy_${idx}" name="malignancy_${idx}">
               <option value="">—</option><option>Yes</option><option>None</option>
             </select>
             <div id="malignancyDetails_${idx}" class="ancillaryDetail" style="display:none; margin-top: 12px;">
               <label>Specify features</label>
               <input class="input" type="text" name="malignancySpec_${idx}" />
             </div>
           </div>
   
           <div>
             <label>Favoring HCC in Particular</label>
             <select class="input ancillarySelect" data-target="hccDetails_${idx}" id="hcc_${idx}" name="hcc_${idx}">
               <option value="">—</option><option>Yes</option><option>None</option>
             </select>
             <div id="hccDetails_${idx}" class="ancillaryDetail" style="display:none; margin-top: 12px;">
               <label>Specify features</label>
               <input class="input" type="text" name="hccSpec_${idx}" />
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
                 <input class="input" type="number" step="1" name="equivSize_${idx}" 
                    oninput="this.value = this.value.replace(/[^0-9]/g, '');" />
               </div>
   
               <div>
                 <label>Pretreatment LR Category & Size</label>
                 <div style="display:flex; align-items:center; gap:6px;">
                   <span>LR - </span>
                   <input class="input" type="text" style="width:50px;" name="pretLR_${idx}" />
                   <input class="input" type="number" step="1" style="width:90px;" name="pretSize_${idx}" 
                        oninput="this.value = this.value.replace(/[^0-9.]/g, '');" />
                   <span>mm</span>
                 </div>
               </div>
   
               <div style="grid-column:1 / -1;">
                 <label>Treatment Modality</label>
                 <input class="input" type="text" name="treatModality_${idx}" />
               </div>
   
               <div style="grid-column:1 / -1;">
                 <label>Interim Change</label>
                 <input class="input" type="text" name="interimChange_${idx}" />
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
    if (e.target.value === 'Yes') el.style.display = 'block';
    else el.style.display = 'none';
}

function handleTreatedChange(e) {
    const targetId = e.target.getAttribute('data-target');
    const el = document.getElementById(targetId);
    if (!el) return;
    if (e.target.value === 'Yes') el.style.display = 'block';
    else el.style.display = 'none';
}

/* -------------------------
   7) Validation & Save logic
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

/* helper: check element visibility */
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

/* Validate radio groups: ensure at least one radio in visible group selected */
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

/* Validate inputs/selects/textareas. Then adds missing elements to error set*/
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
            } else {
                if (!el.value) errorEls.add(el);
            }
        } else if (tag === 'textarea') {
            if (!el.value) errorEls.add(el);
        }
    });
}

/* Run full validation and return Set of missing elements (DOM nodes) */
function runValidation() {
    const errorEls = new Set();
    validateRadioGroups(errorEls);
    validateControls(errorEls);
    return errorEls;
}

/* Apply missing highlight to elements in set */
function showMissingHighlights(missingSet) {
    missingSet.forEach(el => {
        el.classList.add('missing');
    });
}

/* Remove missing highlights from elements that are now valid.   */
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
   Collect data
   ------------------------- */

function collectFormData() {
    const data = {};

    const get = (id) => document.getElementById(id)?.value || '';
    const getChecked = (name) => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : '';
    };
    const getAllChecked = (name) => {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
            .map(cb => cb.value || cb.id.replace('rf_', ''));
    };

    // Patient Info
    data.patientName = get('patientName');
    data.dob = get('dob');
    data.age = get('age');
    data.sex = get('sex');
    data.patientId = get('patientId');
    data.reportId = get('reportId');
    data.referrer = get('referrer');
    data.institution = get('institution');
    data.reportDate = get('reportDate');

    // Procedure
    data.modality = get('modality');
    data.studyContrast = getChecked('studyContrast');
    data.contrastType = get('contrastType');
    data.contrastVolume = get('contrastVolume');
    data.useSubtraction = get('useSubtraction');
    data.subtractionPurpose = get('subtractionPurpose');

    // Clinical Info
    data.riskFactors = getAllChecked(/^rf_/).filter(Boolean);
    data.etiologyOfLiverDisease = get('etiologyOfLiverDisease');
    data.anyTreatment = getChecked('anyTreatment');
    data.treatmentModalityHistory = get('treatmentModalityHistory');
    data.treatmentDates = Array.from(document.querySelectorAll('.treatmentDate'))
        .map(input => input.value).filter(Boolean);
    data.pathologyDiagnosis = get('pathologyDiagnosis');
    data.pathologyDate = get('pathologyDate');

    // Comparison
    data.comparisonAvailable = get('comparisonAvailable');
    data.priorExamModality = get('priorExamModality');
    data.priorContrastType = get('priorContrastType');
    data.priorExamDate = get('priorExamDate');
    data.comparisonRemarks = get('comparisonRemarks');

    // Findings - Background
    data.cirrhosis = getChecked('cirrhosis');
    data.steatosis = getChecked('steatosis');
    data.siderosis = getChecked('siderosis');
    data.portalHypertension = getChecked('portalHypertension');
    data.extraHepatic = get('extraHepatic');

    // Observation Mode
    data.observationMode = getChecked('observationMode');

    // Lesion-based observations
    data.lesions = [];
    if (data.observationMode === 'lesion') {
        const count = parseInt(get('lesionCount') || '0');
        for (let i = 1; i <= count; i++) {
            const lesion = {
                segment: get(`segment_${i}`),
                size_cm: get(`size_cm_${i}`),
                size_mm: get(`size_mm_${i}`),
                imageId: get(`imageid_${i}`),
                seriesNumber: get(`seriesNumber_${i}`),
                tumorInVein: getChecked(`tumorInVein_${i}`),
                lrMfeatures: get(`lrMfeatures_${i}`),
                lrMetiology: get(`lrMetiology_${i}`),

                // Major features
                nonrimAPHE: getChecked(`nonrimAPHE_${i}`),
                washout: getChecked(`washout_${i}`),
                enhancingCapsule: getChecked(`enhCapsule_${i}`),
                thresholdGrowth: getChecked(`thresholdGrowth_${i}`),

                // Ancillary
                benignity: get(`benignity_${i}`),
                benignitySpec: get(`benignitySpec_${i}`),
                malignancy: get(`malignancy_${i}`),
                malignancySpec: get(`malignancySpec_${i}`),
                hccParticular: get(`hcc_${i}`),
                hccSpec: get(`hccSpec_${i}`),
                ancillaryOther: get(`ancillaryOther_${i}`),

                // Treated
                treated: get(`treated_${i}`),
                equivocalViableSize: get(`equivSize_${i}`),
                pretreatmentLR: get(`pretLR_${i}`),
                pretreatmentSize: get(`pretSize_${i}`),
                treatmentModality: get(`treatModality_${i}`),
                interimChange: get(`interimChange_${i}`)
            };
            data.lesions.push(lesion);
        }
    }

    // Aggregate observation (non-lesion mode)
    if (data.observationMode === 'non-lesion') {
        data.aggregate = {
            identifier: get('aggregateIdentifier'),
            size_mm: get('aggregateSize'),
            location: get('aggregateLocation'),
            imagingFeatures: get('aggregateImagingFeatures'),
            vascular: get('aggregateVascular'),
            biliary: get('aggregateBiliary')
        };
    }

    // Impression & Summary
    data.impressionSummary = get('impressionSummary');
    data.recommendation = get('recommendation');
    data.examConclusion = get('examConclusion');
    data.createdBy = get('createdBy');
    data.approvedBy = get('approvedBy');

    return data;
}

/* -------------------------
   Save button handler
   ------------------------- */
async function handleSaveClick() {
    const missing = runValidation();

    if (missing.size > 0) {
        showMissingHighlights(missing);
        removeResolvedHighlights(missing);
        alert('Please fill in all required fields before saving.');
        return;
    }

    removeResolvedHighlights(new Set());

    const user = firebase.auth().currentUser;
    if (!user) {
        alert('You must be logged in to save a report.');
        window.location.href = '../html/login.html';
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        // Get user profile
        const userSnap = await db.collection("users").doc(user.uid).get();

        if (!userSnap.exists) {
            throw new Error("User profile not found");
        }

        const userData = userSnap.data();
        const userDisplayId = userData.userId || userSnap.id;

        const formData = collectFormData();
        
        // --- KEY CHANGE: Read Report ID directly from the UI ---
        const finalReportId = document.getElementById("reportId").value;

        if (!finalReportId || !finalReportId.startsWith('RM')) {
            throw new Error("Invalid Report ID. Please refresh and try again.");
        }

        const reportData = {
            ...formData,
            reportId: finalReportId,
            authUid: user.uid,
            userDisplayId: userDisplayId,
            userEmail: user.email || "unknown",
            savedAt: firebase.firestore.FieldValue.serverTimestamp(),
            reportType: 'CT_MR_Liver_Manual',
            reportTitle: document.getElementById('reportTitle').textContent.trim(),
            isDraft: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save using the ID as the key
        await db.collection("reports_manual").doc(finalReportId).set(reportData);

        alert(`Report ID: ${finalReportId}\nReport saved successfully.`);

        // After successful save, navigate back to the Report Templates page
        window.location.href = '../html/template.html';

    } catch (error) {
        console.error("Save failed:", error);
        alert("Failed to save: " + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Report';
    }
}


/* -------------------------
  Attach global listeners & init
  ------------------------- */
function attachListeners() {
    modalityEl.addEventListener('change', updateModality);
    Array.from(studyContrastRadios).forEach(r => r.addEventListener('change', updateContrastBlock));
    useSubtractionEl.addEventListener('change', updateSubtractionPurposeUI);
    Array.from(anyTreatmentRadios).forEach(r => r.addEventListener('change', updateTreatmentBlocks));
    addTreatmentDateBtn.addEventListener('click', () => addTreatmentDateRow());
    comparisonAvailableEl.addEventListener('change', updateComparisonDetails);
    priorExamModalityEl.addEventListener('change', updatePriorContrastOptions);
    Array.from(observationModeRadios).forEach(r => r.addEventListener('change', updateObservationMode));
    lesionCountInput.addEventListener('input', () => {
        const val = parseInt(lesionCountInput.value, 10);
        if (!Number.isNaN(val) && val > 0) generateLesionBlocks(val);
        else lesionObservationsContainer.innerHTML = '';
    });
    saveBtn.addEventListener('click', handleSaveClick);
    
    // Listeners for Patient ID Auto-generation
    const nameInput = document.getElementById('patientName');
    const dobInput = document.getElementById('dob');
    if (nameInput) nameInput.addEventListener('blur', updatePatientId);
    if (dobInput) dobInput.addEventListener('change', updatePatientId);
}

/* -------------------------
  Initial page setup
  ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    // Auto-fill Date
    const now = new Date();
    const timeString = now.toISOString().slice(0, 16);
    const dateEl = document.getElementById('reportDate');
    if (dateEl) dateEl.value = timeString;

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

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            generateManualReportId();
        } else {
            document.getElementById("reportId").value = "Please log in";
        }
    });
});