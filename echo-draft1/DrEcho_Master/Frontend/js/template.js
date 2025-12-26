// Template data (in real app, this would come from backend)
const templates = [
    { id: 'ct-cardiac', name: 'CT Cardiac', specialty: 'Cardiology', modality: 'ct', category: 'ct' },
    { id: 'ct-mri-liver', name: 'CT and MRI Liver', specialty: 'Hepatology', modality: 'ct,mri', category: 'ct' },
    { id: 'obgyn-cervical', name: 'OB/GYN Cervical Cancer', specialty: 'Gynecology', modality: 'mri', category: 'mri' },
];

let currentTemplateId = '';

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
            if (rowCategory === category) {
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
    
    // Get template preview content
    const templatePreview = getTemplatePreview(templateId);
    previewContent.innerHTML = templatePreview;
    
    // Show modal
    modal.style.display = 'block';
}

// Get template preview HTML
function getTemplatePreview(templateId) {
    const previews = {
        'ct-cardiac': `
            <div class="template-preview">
                <h3>CT CARDIAC REPORT</h3>
                <div class="preview-section">
                    <h4>Patient Information</h4>
                    <p><strong>Name:</strong> [Patient Name]</p>
                    <p><strong>MRN:</strong> [Medical Record Number]</p>
                    <p><strong>Date of Exam:</strong> [Date]</p>
                </div>
                <div class="preview-section">
                    <h4>Clinical History</h4>
                    <p>[Clinical indication for the exam]</p>
                </div>
                <div class="preview-section">
                    <h4>Technique</h4>
                    <p>Cardiac CT performed with ECG gating.</p>
                </div>
                <div class="preview-section">
                    <h4>Findings</h4>
                    <p><strong>Coronary Arteries:</strong> [Describe coronary arteries]</p>
                    <p><strong>Cardiac Chambers:</strong> [Describe chambers]</p>
                    <p><strong>Pericardium:</strong> [Describe pericardium]</p>
                </div>
                <div class="preview-section">
                    <h4>Impression</h4>
                    <p>[Summary of findings]</p>
                </div>
            </div>
        `,
        'ct-mri-liver': `
            <div class="template-preview">
                <h3>CT AND MRI LIVER REPORT</h3>
                <div class="preview-section">
                    <h4>Patient Information</h4>
                    <p><strong>Name:</strong> [Patient Name]</p>
                    <p><strong>MRN:</strong> [Medical Record Number]</p>
                    <p><strong>Date of Exam:</strong> [Date]</p>
                </div>
                <div class="preview-section">
                    <h4>Clinical History</h4>
                    <p>[Clinical indication]</p>
                </div>
                <div class="preview-section">
                    <h4>Findings</h4>
                    <p><strong>Liver:</strong> [Describe liver parenchyma, size, contour]</p>
                    <p><strong>Lesions:</strong> [Describe any lesions]</p>
                    <p><strong>Biliary System:</strong> [Describe biliary ducts]</p>
                    <p><strong>Portal Vein:</strong> [Describe portal vein]</p>
                </div>
                <div class="preview-section">
                    <h4>Impression</h4>
                    <p>[Summary of findings]</p>
                </div>
            </div>
        `,
        'obgyn-cervical': `
            <div class="template-preview">
                <h3>OB/GYN CERVICAL CANCER STAGING</h3>
                <div class="preview-section">
                    <h4>Patient Information</h4>
                    <p><strong>Name:</strong> [Patient Name]</p>
                    <p><strong>MRN:</strong> [Medical Record Number]</p>
                    <p><strong>Date of Exam:</strong> [Date]</p>
                </div>
                <div class="preview-section">
                    <h4>Clinical History</h4>
                    <p>[Clinical indication - cervical cancer staging]</p>
                </div>
                <div class="preview-section">
                    <h4>Findings</h4>
                    <p><strong>Primary Tumor:</strong> [Size, location, extent]</p>
                    <p><strong>Parametrial Invasion:</strong> [Present/Absent]</p>
                    <p><strong>Lymph Nodes:</strong> [Regional node involvement]</p>
                    <p><strong>Distant Metastases:</strong> [Assessment]</p>
                </div>
                <div class="preview-section">
                    <h4>Staging</h4>
                    <p><strong>FIGO Stage:</strong> [Stage]</p>
                </div>
                <div class="preview-section">
                    <h4>Impression</h4>
                    <p>[Summary and stage]</p>
                </div>
            </div>
        `
    };
    
    return previews[templateId] || '<p>Template preview not available.</p>';
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