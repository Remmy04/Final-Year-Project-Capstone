/* frontend/js/report_generator.js - RADIOLOGY DICTATION STYLE */

/**
 * Converts structured liver template data into a professional radiology report.
 * Uses standard medical terminology and dictation style phrasing.
 * @param {Object} data - The raw data saved from the template.
 * @returns {string} - HTML formatted report text.
 */
function generateLiverReportText(data) {
    let text = "";

    // --- HELPER FUNCTIONS ---
    const addPara = (content) => {
        if (content && content.trim() !== "") text += `<p>${content}</p>`;
    };
    
    const fmtDate = (d) => {
        if (!d) return "";
        const dateObj = new Date(d);
        return isNaN(dateObj) ? d : dateObj.toLocaleDateString('en-GB'); 
    };

    const listItems = (arr) => {
        if (!arr || arr.length === 0) return "";
        if (arr.length === 1) return arr[0];
        const last = arr.pop();
        return arr.join(", ") + " and " + last;
    };


    // ==========================================
    // 1. CLINICAL INFORMATION
    // ==========================================
    let clinical = `<strong>CLINICAL INFORMATION:</strong> `;
    
    // Standard Demographics
    const age = data.age || "Age unknown";
    const sex = data.sex || "patient";
    clinical += `${age}-year-old ${sex.toLowerCase()}. `;
    
    // Etiology (Direct phrasing is safer for variable inputs)
    if (data.etiologyOfLiverDisease) {
        clinical += `Etiology of liver disease: ${data.etiologyOfLiverDisease}. `;
    }
    
    // Risk Factors
    if (data.riskFactors && data.riskFactors.length > 0) {
        const cleanRisks = data.riskFactors.map(r => 
            r.replace('rf_', '').toUpperCase()
        );
        clinical += `Risk factors: ${cleanRisks.join(', ')}. `;
    }

    // Treatment History
    if (data.anyTreatment === 'Yes') {
        clinical += `Status: Post-treatment. `;
        if (data.treatmentModalityHistory) clinical += `Prior intervention: ${data.treatmentModalityHistory}. `;
        
        if (data.treatmentDates && data.treatmentDates.length > 0) {
            const formattedDates = data.treatmentDates.map(d => fmtDate(d));
            clinical += `Date(s) of treatment: ${formattedDates.join('; ')}. `;
        }
        
        if (data.pathologyDiagnosis) {
            clinical += `Pathology: ${data.pathologyDiagnosis}`;
            if (data.pathologyDate) clinical += ` (${fmtDate(data.pathologyDate)})`;
            clinical += `. `;
        }
    }
    addPara(clinical);


    // ==========================================
    // 2. COMPARISON
    // ==========================================
    if (data.comparisonAvailable === 'Yes') {
        let comp = `<strong>COMPARISON:</strong> `;
        const priorMod = data.priorExamModality || "study";
        const priorDate = data.priorExamDate ? ` dated ${fmtDate(data.priorExamDate)}` : "";
        
        comp += `Comparison is made with prior ${priorMod}${priorDate}`;
        if (data.priorContrastType) comp += ` (${data.priorContrastType} contrast)`;
        if (data.comparisonRemarks) comp += `. Note: ${data.comparisonRemarks}`;
        comp += `.`;
        addPara(comp);
    } else {
        addPara(`<strong>COMPARISON:</strong> None available.`);
    }


    // ==========================================
    // 3. TECHNIQUE
    // ==========================================
    let procedure = `<strong>TECHNIQUE:</strong> `; // 'Technique' is more standard than 'Procedure' text
    const mod = data.modality || "Imaging";
    
    if (data.studyContrast === 'contrast') {
        procedure += `Multiphasic contrast-enhanced ${mod} of the liver. `;
        if (data.contrastType) procedure += `Contrast agent: ${data.contrastType}. `;
        if (data.contrastVolume) procedure += `Volume: ${data.contrastVolume} ml. `;
        
        if (data.useSubtraction === 'Yes') {
            procedure += `Digital subtraction processing applied`;
            if (data.subtractionPurpose) procedure += ` for evaluation of ${data.subtractionPurpose}`;
            procedure += `.`;
        }
    } else {
        procedure += `Non-contrast ${mod} of the liver.`;
    }
    addPara(procedure);


    // ==========================================
    // 4. FINDINGS
    // ==========================================
    text += `<p><strong>FINDINGS:</strong></p>`;

    // --- A. Liver Parenchyma ---
    let liverBg = "<strong>Liver Background: </strong>";
    const bgFeatures = [];
    if (data.cirrhosis === 'Yes') bgFeatures.push("morphology consistent with cirrhosis");
    if (data.steatosis === 'Yes') bgFeatures.push("hepatic steatosis");
    if (data.siderosis === 'Yes') bgFeatures.push("features of siderosis");
    
    if (bgFeatures.length > 0) {
        liverBg += `The liver demonstrates ${listItems(bgFeatures)}. `;
    } else {
        liverBg += `Normal hepatic morphology without evidence of cirrhosis, steatosis, or siderosis. `;
    }
    
    if (data.portalHypertension === 'Yes') {
        liverBg += "Signs of portal hypertension are present. ";
    }
    
    if (data.extraHepatic) {
        liverBg += `Extra-hepatic findings: ${data.extraHepatic}.`;
    }
    addPara(liverBg);


    // --- B. Focal Observations (Lesion Mode) ---
    if (data.observationMode === 'lesion' && data.lesions && data.lesions.length > 0) {
        addPara(`<strong>Focal Observations:</strong> ${data.lesions.length} lesion(s) identified.`);
        
        data.lesions.forEach((lesion, index) => {
            let lText = `<u>Observation ${index + 1}:</u> `;
            
            // Location & Size
            lText += `Segment ${lesion.segment || "?"}. `;
            if (lesion.size_mm) lText += `Max diameter: ${lesion.size_mm} mm. `;
            else if (lesion.size_cm) lText += `Max diameter: ${lesion.size_cm} cm. `;
            
            // Image Ref
            if (lesion.imageid || lesion.seriesNumber) {
                lText += `[Series ${lesion.seriesNumber || "-"}, Img ${lesion.imageid || "-"}] `;
            }

            // Treated Status (Mention this early if present)
            if (lesion.treated === 'Yes') {
                lText += `<strong>Status: TREATED.</strong> `;
                if (lesion.treatModality) lText += `(Modality: ${lesion.treatModality}). `;
                if (lesion.equivSize) lText += `Viable tumor size: ${lesion.equivSize} mm. `;
                if (lesion.pretLR) lText += `Pre-treatment: LR-${lesion.pretLR} (${lesion.pretSize || "?"} mm). `;
                if (lesion.interimChange) lText += `Interval change: ${lesion.interimChange}. `;
            }

            // Vascular Features (Standardized Phrasing)
            const vascular = [];
            if (lesion.nonrimAPHE === 'Yes') vascular.push("non-rim arterial phase hyperenhancement (APHE)");
            if (lesion.washout === 'Yes') vascular.push("washout appearance");
            if (lesion.enhCapsule === 'Yes') vascular.push("enhancing capsule");
            
            if (vascular.length > 0) {
                lText += `Imaging features: ${listItems(vascular)}. `;
            } else if (lesion.nonrimAPHE === 'No' && lesion.washout === 'No') {
                lText += `No APHE or washout observed. `;
            }

            if (lesion.thresholdGrowth === 'Yes') lText += "Threshold growth is evident. ";

            // LR-M / Etiology
            if (lesion.lrMfeatures) lText += `LR-M features: ${lesion.lrMfeatures}. `;
            if (lesion.lrMetiology) lText += `Suspected etiology: ${lesion.lrMetiology}. `;

            // Ancillary
            const ancillary = [];
            if (lesion.tumorInVein === 'Yes') ancillary.push("tumor in vein");
            if (lesion.benignity === 'Yes') ancillary.push(`features favoring benignity (${lesion.benignitySpec})`);
            if (lesion.malignancy === 'Yes') ancillary.push(`features favoring malignancy (${lesion.malignancySpec})`);
            if (lesion.hcc === 'Yes') ancillary.push(`features favoring HCC (${lesion.hccSpec})`);
            
            if (ancillary.length > 0) {
                lText += `Ancillary features: ${listItems(ancillary)}. `;
            }
            if (lesion.ancillaryOther) {
                lText += `Additional features: ${lesion.ancillaryOther}. `;
            }

            addPara(lText);
        });

    // --- C. Aggregate Mode (Non-Lesion) ---
    } else if (data.observationMode === 'non-lesion') {
        const aggId = data.aggregateIdentifier || (data.aggregate ? data.aggregate.identifier : null);
        
        if (aggId) {
            let aggText = `<strong>Aggregate Findings:</strong> `;
            aggText += `Identifier: "${aggId}". `;
            
            const aggSize = data.aggregateSize || (data.aggregate ? data.aggregate.size_mm : "");
            if (aggSize) aggText += `Aggregate size: ${aggSize} mm. `;
            
            const aggLoc = data.aggregateLocation || (data.aggregate ? data.aggregate.location : "");
            if (aggLoc) aggText += `Location: ${aggLoc}. `;
            
            const aggImg = data.aggregateImagingFeatures || (data.aggregate ? data.aggregate.imagingFeatures : "");
            if (aggImg) aggText += `Features: ${aggImg}. `;
            
            addPara(aggText);
        } else {
            addPara("No focal liver lesions defined.");
        }
    }


    // ==========================================
    // 5. IMPRESSION
    // ==========================================
    let impression = `<strong>IMPRESSION:</strong><br/>`;
    impression += data.impressionSummary || "No acute findings.";
    addPara(impression);
    
    if (data.examConclusion) {
        addPara(`<strong>CONCLUSION:</strong> ${data.examConclusion}`);
    }


    // ==========================================
    // 6. RECOMMENDATION
    // ==========================================
    if (data.recommendation) {
        addPara(`<strong>RECOMMENDATION:</strong> ${data.recommendation}`);
    }

    return text;
}