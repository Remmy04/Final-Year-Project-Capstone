// Access control check - prevent rejected and unapproved users
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "../html/login.html";
        return;
    }

    try {
        const snap = await db.collection("users")
            .where("authUid", "==", user.uid)
            .limit(1)
            .get();

        if (snap.empty) {
            window.location.href = "../html/login.html";
            return;
        }

        const userData = snap.docs[0].data();
        
        // Check if user is pending or rejected - redirect to profile
        if (userData.accountStatus === 'pending' || userData.accountStatus === 'rejected') {
            window.location.href = "../html/profile.html";
            return;
        }

        // Load templates
        loadTemplates();
    } catch (err) {
        console.error('Error checking user status:', err);
        window.location.href = "../html/login.html";
    }
});

// Template data (loaded from Firebase)
let templates = [];

let currentTemplateId = '';

// Load templates from Firebase
async function loadTemplates() {
    try {
        const snapshot = await db.collection('template_types').get();
        templates = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).filter(template => template.isVisible !== false);
        populateTemplatesTable();
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

// Populate templates table
function populateTemplatesTable() {
    const tbody = document.getElementById('templatesTableBody');
    if (!tbody) return;

    tbody.innerHTML = templates.map(template => `
        <tr data-category="${(template.modalities || (template.category ? [template.category] : [])).join(',')}">
            <td><strong>${template.name}</strong></td>
            <td>${template.specialty}</td>
            <td>${getModalityBadges(template.modalities || (template.category ? [template.category] : []))}</td>
            <td><button class="btn-icon" onclick="previewTemplate('${template.id}')">👁️</button></td>
            <td><a href="../html/${getTemplateLink(template)}" class="btn-use">Use Template</a></td>
        </tr>
    `).join('');

    updateTemplateCount(templates.length);
}

function getModalityBadges(modalities) {
    const badges = {
        ct: '<span class="badge badge-ct">CT</span>',
        mri: '<span class="badge badge-mri">MRI</span>',
        ultrasound: '<span class="badge badge-ultrasound">Ultrasound</span>',
        xray: '<span class="badge badge-xray">X-Ray</span>'
    };
    return modalities.map(mod => badges[mod] || '').join(' ');
}

function getTemplateLink(template) {
    const name = template.name.toLowerCase();
    if (name.includes('liver')) return 'CT_MR_Liver.html';
    if (name.includes('mammography')) return 'Breast_Mammography.html';
    return 'standard_report.html'; // default
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterTemplates(searchTerm);
});

// Filter functionality
document.getElementById('filterSelect').addEventListener('change', function(e) {
    const filterValue = e.target.value;
    filterByCategory(filterValue);
});

function filterTemplates(searchTerm) {
    const rows = document.querySelectorAll('#templatesTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    updateTemplateCount(visibleCount);
}

function filterByCategory(category) {
    const rows = document.querySelectorAll('#templatesTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (category === 'all') {
            row.style.display = '';
            visibleCount++;
        } else {
            const rowCategory = row.getAttribute('data-category');
            if (rowCategory && rowCategory.includes(category)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        }
    });
    
    updateTemplateCount(visibleCount);
}

function updateTemplateCount(count) {
    document.getElementById('templateCount').textContent = count;
}

// Preview Template
function previewTemplate(templateId) {
    currentTemplateId = templateId;
    const modal = document.getElementById('previewModal');
    const previewContent = document.getElementById('previewContent');
    
    // Find the template by id
    const template = templates.find(t => t.id === templateId);
    if (!template) {
        previewContent.innerHTML = '<p>Template not found.</p>';
        modal.style.display = 'block';
        return;
    }
    
    // Get template preview content based on name
    const templatePreview = getTemplatePreview(template.name);
    previewContent.innerHTML = templatePreview;
    
    // Show modal
    modal.style.display = 'block';
}

// Get template preview HTML
function getTemplatePreview(templateName) {
    const name = templateName.toLowerCase();
    if (name.includes('liver')) {
        return `
            <div class="template-preview template-preview-liver">
                <div class="preview-header">
                    <h3>CT AND MRI LIVER REPORT</h3>
                    <p class="preview-subtitle">Structured preview aligned with the CT_MR_Liver template sections.</p>
                </div>

                <div class="preview-section">
                    <h4>1. Patient Information</h4>
                    <div class="preview-row"><span class="preview-label">Patient Name</span><span class="preview-value">[Patient Name]</span></div>
                    <div class="preview-row"><span class="preview-label">Date of Birth / Age / Sex</span><span class="preview-value">[DOB] / [Age] / [Sex]</span></div>
                    <div class="preview-row"><span class="preview-label">Patient ID / Report ID</span><span class="preview-value">[Patient ID] / [Report ID]</span></div>
                    <div class="preview-row"><span class="preview-label">Referring Physician / Institution</span><span class="preview-value">[Referrer] / [Institution]</span></div>
                    <div class="preview-row"><span class="preview-label">Report Date & Time</span><span class="preview-value">[Date & Time]</span></div>
                </div>

                <div class="preview-section">
                    <h4>2. Procedure Information</h4>
                    <div class="preview-row"><span class="preview-label">Modality</span><span class="preview-value">[CT or MRI]</span></div>
                    <div class="preview-row"><span class="preview-label">Study Type</span><span class="preview-value">[Contrast / Non-Contrast]</span></div>
                    <div class="preview-row"><span class="preview-label">Contrast Agent / Volume</span><span class="preview-value">[Type] / [Volume ml]</span></div>
                    <div class="preview-row"><span class="preview-label">Vascular Subtraction / Purpose</span><span class="preview-value">[Yes/No] / [APHE, Washout, APHE and Washout]</span></div>
                </div>

                <div class="preview-section">
                    <h4>3. Clinical Information</h4>
                    <div class="preview-row"><span class="preview-label">Risk Factors for HCC</span><span class="preview-value">[Cirrhosis, HBV, Current HCV]</span></div>
                    <div class="preview-row"><span class="preview-label">Etiology of Liver Disease</span><span class="preview-value">[List all that apply]</span></div>
                    <div class="preview-row"><span class="preview-label">Prior Treatment / Dates</span><span class="preview-value">[Yes/No], [Modality], [Date(s)]</span></div>
                    <div class="preview-row"><span class="preview-label">Pathology</span><span class="preview-value">[Diagnosis and date if available]</span></div>
                </div>

                <div class="preview-section">
                    <h4>4. Comparison</h4>
                    <div class="preview-row"><span class="preview-label">Comparison Available</span><span class="preview-value">[Yes/No]</span></div>
                    <div class="preview-row"><span class="preview-label">Prior Exam Modality / Contrast / Date</span><span class="preview-value">[CT/MRI] / [Type] / [Date]</span></div>
                    <div class="preview-row"><span class="preview-label">Comparison Remarks</span><span class="preview-value">[Free text]</span></div>
                </div>

                <div class="preview-section">
                    <h4>5. Findings</h4>
                    <div class="preview-row"><span class="preview-label">Background Liver</span><span class="preview-value">Cirrhosis [Yes/No], Steatosis [Yes/No], Siderosis [Yes/No]</span></div>
                    <div class="preview-row"><span class="preview-label">Observation Type</span><span class="preview-value">[Lesion(s) / Non-lesion]</span></div>
                    <div class="preview-row"><span class="preview-label">Lesion / Aggregate Details</span><span class="preview-value">[Size, Location, Imaging Features, Vascular, Biliary]</span></div>
                    <div class="preview-row"><span class="preview-label">Additional Findings</span><span class="preview-value">Portal Hypertension [Yes/No], Extra Hepatic Findings [Optional]</span></div>
                </div>

                <div class="preview-section">
                    <h4>6. Impression</h4>
                    <div class="preview-row"><span class="preview-label">Impression Summary</span><span class="preview-value">[Concise diagnostic summary]</span></div>
                    <div class="preview-row"><span class="preview-label">Recommendation / Follow-up</span><span class="preview-value">[Suggested next step]</span></div>
                </div>

                <div class="preview-section">
                    <h4>7. Report Summary & Sign-off</h4>
                    <div class="preview-row"><span class="preview-label">Exam Conclusion</span><span class="preview-value">[Final conclusion]</span></div>
                    <div class="preview-row"><span class="preview-label">Report Created by</span><span class="preview-value">[Radiologist Name]</span></div>
                    <div class="preview-row"><span class="preview-label">Approved by</span><span class="preview-value">[Approver Name]</span></div>
                </div>
            </div>
        `;
    } else if (name.includes('mammography')) {
        return `
            <div class="template-preview template-preview-breast">
                <div class="preview-header">
                    <h3>BREAST MAMMOGRAPHY REPORT</h3>
                    <p class="preview-subtitle">X-ray breast template with optional ultrasound sub-sections.</p>
                </div>

                <div class="preview-section">
                    <h4>1. Patient Demographics & Clinical Information</h4>
                    <div class="preview-row"><span class="preview-label">MRN / Name / DOB / Age / Gender</span><span class="preview-value">[Core demographics]</span></div>
                    <div class="preview-row"><span class="preview-label">Primary Indication</span><span class="preview-value">[Screening / Diagnostic / Follow-up / Post-surgical]</span></div>
                    <div class="preview-row"><span class="preview-label">Symptoms / Prior Surgery</span><span class="preview-value">[Conditional inputs]</span></div>
                </div>

                <div class="preview-section">
                    <h4>2. Procedure & Comparison Studies</h4>
                    <div class="preview-row"><span class="preview-label">Modality Evaluated</span><span class="preview-value">[Mammogram only / Ultrasound only / Both]</span></div>
                    <div class="preview-row"><span class="preview-label">Comparison</span><span class="preview-value">[Prior modality and date]</span></div>
                </div>

                <div class="preview-section">
                    <h4>3. Mammography Findings</h4>
                    <div class="preview-row"><span class="preview-label">Density / Masses / Calcifications / Distortion</span><span class="preview-value">[BI-RADS density + structured descriptors]</span></div>
                </div>

                <div class="preview-section">
                    <h4>4. Ultrasound Findings</h4>
                    <div class="preview-row"><span class="preview-label">Right + Left Breast + Chest Wall</span><span class="preview-value">[Lesion/cyst loops with dimensions and descriptors]</span></div>
                </div>

                <div class="preview-section">
                    <h4>5. Axillary Nodes</h4>
                    <div class="preview-row"><span class="preview-label">Axillary nodes</span><span class="preview-value">[Side, fatty hilum, cortical thickness]</span></div>
                </div>

                <div class="preview-section">
                    <h4>6. Impression & Sign-off</h4>
                    <div class="preview-row"><span class="preview-label">Impression Summary</span><span class="preview-value">[Concise diagnostic summary]</span></div>
                    <div class="preview-row"><span class="preview-label">Recommendation / Follow-up</span><span class="preview-value">[Suggested next step]</span></div>
                    <div class="preview-row"><span class="preview-label">Final BI-RADS Category</span><span class="preview-value">[0 to 6]</span></div>
                    <div class="preview-row"><span class="preview-label">Report Created by</span><span class="preview-value">[Radiologist Name]</span></div>
                    <div class="preview-row"><span class="preview-label">Approved by</span><span class="preview-value">[Approver Name]</span></div>
                </div>
            </div>
        `;
    } else {
        return '<p>Template preview not available.</p>';
    }
}

// Close modal
function closeModal() {
    document.getElementById('previewModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('previewModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Download template as HTML
function downloadTemplate() {
    const templateHTML = getTemplateHTML(currentTemplateId);
    const blob = new Blob([templateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTemplateId}-template.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Template downloaded! You can fill it out offline or use our editor.');
}

// Get full HTML template for download
function getTemplateHTML(templateId) {
    const previewContent = getTemplatePreview(templateId);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateId} Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
        }
        h3 {
            color: #0D5A7D;
            border-bottom: 2px solid #29B6F6;
            padding-bottom: 10px;
        }
        h4 {
            color: #263238;
            margin-top: 20px;
        }
        .preview-section {
            margin-bottom: 20px;
        }
        p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    ${previewContent}
</body>
</html>`;
}

// Load more templates (placeholder)
function loadMoreTemplates() {
    alert('Loading more templates... (This would fetch more data from the server)');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Report Templates page loaded');
    updateTemplateCount(3);
});