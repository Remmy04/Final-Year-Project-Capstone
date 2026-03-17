document.addEventListener("DOMContentLoaded", () => {
    const previewBtn = document.getElementById("previewBtn");
    const previewTextBox = document.getElementById("previewText");

    if (!previewBtn || !previewTextBox) return;

    function getRadioValue(name) {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : null;
    }

    function getCheckboxValues(name) {
        const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checked).map(cb => cb.value).join(", ");
    }

    // --- THE DEEP TRANSLATION ENGINE ---
    function generateDraftText() {
        let draft = "";

        // NEW: Upgraded Header Styling for better visual hierarchy
        const addHeader = (text) => draft += `<h3 style="margin-top: 25px; margin-bottom: 8px; color: #2c3e50; font-family: sans-serif; font-weight: bold; text-transform: uppercase; font-size: 1.15rem; border-bottom: 1px solid #ecf0f1; padding-bottom: 4px;">${text}</h3>`;
        
        const addLine = (text) => draft += `<p style="margin: 4px 0;">${text}</p>`;

        // --- 1. Header Information ---
        const patientId = document.getElementById("patientId")?.value;
        if (patientId) addLine(`<strong>Patient ID:</strong> ${patientId}`);

        const indication = document.getElementById("primaryIndication")?.value;
        if (indication && indication !== "—") addLine(`<strong>Indication:</strong> ${indication}`);

        const symptoms = getCheckboxValues("specificSymptoms");
        if (symptoms) addLine(`<strong>Symptoms:</strong> ${symptoms}`);

        const priorSurgery = document.getElementById("priorTreatmentSurgery")?.value;
        if (priorSurgery) addLine(`<strong>Prior Treatment/Surgery:</strong> ${priorSurgery}`);

        // --- 2. Comparison ---
        const comparison = getRadioValue("comparisonAvailable");
        if (comparison === "Yes") {
            const priorDate = document.getElementById("priorStudyDate")?.value || "unknown date";
            const priorModality = document.getElementById("priorStudyModality")?.value;
            if (priorModality && priorModality !== "—") {
                addLine(`<strong>Comparison:</strong> Made with previous ${priorModality} dated ${priorDate}.`);
            }
        } else if (comparison === "No") {
            addLine(`<strong>Comparison:</strong> No prior studies available for comparison.`);
        }

        addHeader("Findings");

        // --- 3. Mammography Findings ---
        const modality = getRadioValue("modalityEvaluated");
        if (modality === "Mammogram Only" || modality === "Mammogram + Ultrasound") {
            const density = getRadioValue("density");
            if (density) addLine(`${density} breast parenchymal pattern.`);

            const distortion = getRadioValue("architecturalDistortion");
            if (distortion === "Yes") {
                const desc = document.getElementById("architecturalDescription")?.value || "";
                addLine(`Architectural distortion noted. ${desc}`);
            }

            const calcifications = getRadioValue("calcificationsPresent");
            if (calcifications === "Yes") {
                const morph = document.getElementById("calcificationMorphology")?.value;
                const dist = document.getElementById("calcificationDistribution")?.value;
                if (morph && morph !== "—" && dist && dist !== "—") {
                    addLine(`${dist} ${morph} calcifications noted.`);
                } else {
                    addLine(`Calcifications noted in breast(s).`);
                }
            }

            const masses = getRadioValue("massPresent");
            if (masses === "Yes") {
                const massCount = document.getElementById("massCount")?.value || "0";
                addLine(`${massCount} mass(es) present in the mammogram.`);
                
                const massBlocks = document.querySelectorAll('#massContainer .observation-block');
                massBlocks.forEach((block, idx) => {
                    const side = block.querySelector('[data-field="side"]')?.value;
                    const quad = block.querySelector('[data-field="quadrant"]')?.value;
                    const shape = block.querySelector('[data-field="shape"]')?.value;
                    const margin = block.querySelector('[data-field="margin"]')?.value;
                    const density = block.querySelector('[data-field="density"]')?.value;

                    let txt = `Mass ${idx + 1}: `;
                    if (side && side !== "—") txt += `${side}, `;
                    if (quad && quad !== "—") txt += `${quad} quadrant. `;
                    if (shape && shape !== "—") txt += `Shape: ${shape}. `;
                    if (margin && margin !== "—") txt += `Margin: ${margin}. `;
                    if (density && density !== "—") txt += `Density: ${density}.`;
                    addLine(txt);
                });
            }

            const otherMammo = getCheckboxValues("otherMammographicFindings");
            if (otherMammo) addLine(`Other findings: ${otherMammo}.`);

            if (calcifications === "No" && masses === "No" && distortion === "No") {
                addLine(`No suspicious mass or significant cluster of microcalcification.`);
            }
        }

        // --- 4. Ultrasound Findings ---
        if (modality === "Ultrasound Only" || modality === "Mammogram + Ultrasound") {
            
            const buildUltrasoundLesions = (side, echoId, solidVal, cystVal, lesionContainer, cystContainer, resolvedVal, resolvedId, otherName) => {
                addHeader(`Ultrasound ${side} Breast`);
                
                const echo = document.getElementById(echoId)?.value;
                if (echo && echo !== "—") addLine(`${echo}.`);
                
                if (solidVal === "No" && cystVal === "No") {
                    addLine(`No solid or cystic lesion.`);
                } else {
                    if (solidVal === "Yes") {
                        const lBlocks = document.querySelectorAll(`#${lesionContainer} .observation-block`);
                        lBlocks.forEach((block) => {
                            const status = block.querySelector('[data-field="status"]')?.value;
                            const clock = block.querySelector('[data-field="clockPosition"]')?.value;
                            const dist = block.querySelector('[data-field="distanceFromNippleCm"]')?.value;
                            const l = block.querySelector('[data-field="lengthCm"]')?.value;
                            const w = block.querySelector('[data-field="widthCm"]')?.value;
                            const h = block.querySelector('[data-field="heightCm"]')?.value;
                            const shape = block.querySelector('[data-field="shape"]')?.value;
                            const ePattern = block.querySelector('[data-field="echoPattern"]')?.value;
                            const vasc = block.querySelector('[data-field="internalVascularity"]')?.value;
                            const calc = block.querySelector('[data-field="internalCalcifications"]')?.value;

                            let p = "";
                            if (status && status !== "—") p += `${status} `;
                            p += `well defined `;
                            if (ePattern && ePattern !== "—") p += `${ePattern.toLowerCase()} `;
                            p += `lesion `;
                            if (clock) p += `at ${clock} o'clock position `;
                            if (dist) p += `${dist}cm FN, `;
                            if (shape && shape !== "—") p += `${shape.toLowerCase()} shape solid lesion `;
                            else p += `solid lesion `;
                            if (l && w && h) p += `measuring ${l} x ${w} x ${h} cm. `;
                            
                            if (vasc === "Absent") p += `No significant internal vascularity. `;
                            else if (vasc === "Present") p += `Significant internal vascularity noted. `;
                            
                            if (calc === "Present") p += `Internal calcifications present.`;
                            
                            addLine(p.trim());
                        });
                    }
                    
                    if (cystVal === "Yes") {
                        const cBlocks = document.querySelectorAll(`#${cystContainer} .observation-block`);
                        cBlocks.forEach((block) => {
                            const clock = block.querySelector('[data-field="clockPosition"]')?.value;
                            const dist = block.querySelector('[data-field="distanceFromNippleCm"]')?.value;
                            const l = block.querySelector('[data-field="lengthCm"]')?.value;
                            const w = block.querySelector('[data-field="widthCm"]')?.value;
                            const h = block.querySelector('[data-field="heightCm"]')?.value;
                            const type = block.querySelector('[data-field="type"]')?.value;

                            let p = `At `;
                            if (clock) p += `${clock} o'clock `;
                            else p += `specified location `;
                            if (dist) p += `(${dist}cm FN) `;
                            p += `a `;
                            if (type && type !== "—") p += `${type.toLowerCase()} `;
                            p += `cyst measures `;
                            if (l && w && h) p += `${l} x ${w} x ${h} cm.`;
                            else p += `(dimensions not provided).`;
                            
                            addLine(p.trim());
                        });
                    }
                }

                if (resolvedVal === "Yes") {
                    const desc = document.getElementById(resolvedId)?.value || "";
                    addLine(`Resolved/Non-visualised lesion: ${desc}`);
                }
                const other = getCheckboxValues(otherName);
                if (other) addLine(`Other findings: ${other}.`);
            };

            // Run for Right and Left Breast
            buildUltrasoundLesions("Right", "rightBackgroundEchotexture", getRadioValue("rightSolidLesions"), getRadioValue("rightCysts"), "rightLesionContainer", "rightCystContainer", getRadioValue("rightResolved"), "rightResolvedDetails", "rightOtherFindings");
            buildUltrasoundLesions("Left", "leftBackgroundEchotexture", getRadioValue("leftSolidLesions"), getRadioValue("leftCysts"), "leftLesionContainer", "leftCystContainer", getRadioValue("leftResolved"), "leftResolvedDetails", "leftOtherFindings");

            // Chest Wall
            const chestSides = getCheckboxValues("chestWallSides");
            const chestFindings = getRadioValue("chestWallFindings");
            if (chestSides && chestFindings) {
                addHeader(`Chest Wall Ultrasound`);
                addLine(`Evaluated ${chestSides}: ${chestFindings}.`);
            }
        }

        // --- 5. Lymph Nodes ---
        const nodes = getRadioValue("lymphadenopathy");
        if (nodes === "No") {
            addLine(`<br>No significant axillary lymphadenopathy bilaterally.`);
        } else if (nodes === "Yes") {
            const side = document.getElementById("lymphNodeSide")?.value || "Bilateral";
            const hilum = getRadioValue("fattyHilum");
            const thickness = document.getElementById("corticalThickness")?.value;
            let txt = `<br>Significant ${side.toLowerCase()} axillary lymphadenopathy noted.`;
            if (hilum) txt += ` Fatty hilum is ${hilum.toLowerCase()}.`;
            if (thickness) txt += ` Cortical thickness: ${thickness} cm.`;
            addLine(txt);
        }

        // --- 6. Impression, Recommendations, & BIRADS ---
        const impression = document.getElementById("impressionSummary")?.value;
        if (impression) {
            addHeader("Impression");
            addLine(`${impression.replace(/\n/g, "<br>")}`);
        }

        // NEW: Pulling the Recommendations section!
        const recommendation = document.getElementById("recommendation")?.value;
        if (recommendation) {
            addHeader("Recommendations / Follow-up");
            addLine(`${recommendation.replace(/\n/g, "<br>")}`);
        }

        const birads = document.getElementById("biradsCategory")?.value;
        if (birads && birads !== "—") {
            addHeader("Final BI-RADS Category");
            addLine(`${birads}`);
        }

        return draft;
    }

    // --- BUTTON CLICK LOGIC ---
    previewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        previewTextBox.style.display = "block";
        previewTextBox.innerHTML = generateDraftText();
        
        previewBtn.style.backgroundColor = "#27ae60";
        previewBtn.innerText = "Preview Refreshed Successfully";
        
        setTimeout(() => {
            previewBtn.style.backgroundColor = "#3498db";
            previewBtn.innerText = "Generate / Refresh Preview";
        }, 2000);
    });
});