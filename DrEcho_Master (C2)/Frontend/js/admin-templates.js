// ============================================
// TEMPLATES PAGE - GRID & CRUD OPERATIONS
// ============================================

window.onDataReady = function() {
    populateTemplatesGrid();
    setupTemplateSearchListener();
};

// Populate Templates Grid
function populateTemplatesGrid() {
    const grid = document.getElementById('templatesGrid');
    const emptyState = document.getElementById('templatesEmptyState');

    if (!grid) return; 

    if (templates.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = templates.map(template => `
        <div class="template-card">
            <div class="template-card-header">
                <div class="template-card-title">${template.name}</div>
                <div class="template-card-categories">
                    ${(template.modalities || (template.category ? [template.category] : [])).map(mod => `<span class="template-card-category">${mod}</span>`).join('')}
                </div>
            </div>
            <div class="template-card-info">
                <p><strong>Specialty:</strong> ${template.specialty}</p>
                <p>${template.description}</p>
            </div>
            <span class="template-card-status template-status-${template.status}">
                ${capitalizeFirst(template.status)} ${template.isVisible === false ? '(Hidden)' : '(Visible)'}
            </span>
            <div class="template-card-actions">
                <button class="action-btn edit" onclick="editTemplate('${template.id}')">Edit</button>
                <button class="action-btn toggle ${template.isVisible === false ? 'show' : 'hide'}" onclick="toggleVisibility('${template.id}')">${template.isVisible === false ? 'Show' : 'Hide'}</button>
            </div>
        </div>
    `).join('');
}

// Edit Template
function editTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const templateModal = document.getElementById('templateModal');
    if (!templateModal) return;

    currentEditingTemplateId = templateId;
    const templateModalTitle = document.getElementById('templateModalTitle');
    if (templateModalTitle) templateModalTitle.textContent = 'Edit Template';
    
    const templateName = document.getElementById('templateName');
    const templateCategory = document.getElementById('templateCategory');
    const templateSpecialty = document.getElementById('templateSpecialty');
    const templateStatus = document.getElementById('templateStatus');
    const templateDescription = document.getElementById('templateDescription');
    const templateVisible = document.getElementById('templateVisible');
    
    if (templateName) templateName.value = template.name;
    if (templateSpecialty) templateSpecialty.value = template.specialty;
    if (templateStatus) templateStatus.value = template.status;
    if (templateDescription) templateDescription.value = template.description;
    if (templateVisible) templateVisible.checked = template.isVisible !== false;

    // Set modalities checkboxes
    const modalities = template.modalities || (template.category ? [template.category] : []);
    document.querySelectorAll('input[name="modalities"]').forEach(cb => {
        cb.checked = modalities.includes(cb.value);
    });

    templateModal.classList.add('show');
}

// Save Template (Add or Update)
async function saveTemplate(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('templateName').value,
        modalities: Array.from(document.querySelectorAll('input[name="modalities"]:checked')).map(cb => cb.value),
        specialty: document.getElementById('templateSpecialty').value,
        status: document.getElementById('templateStatus').value,
        description: document.getElementById('templateDescription').value,
        isVisible: document.getElementById('templateVisible').checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (currentEditingTemplateId) {
            // Update existing template
            await firebase.firestore().collection('template_types').doc(currentEditingTemplateId).update(formData);
            const templateIndex = templates.findIndex(t => t.id === currentEditingTemplateId);
            if (templateIndex !== -1) {
                templates[templateIndex] = { ...templates[templateIndex], ...formData };
            }
            console.log('Template updated successfully:', currentEditingTemplateId);
        } else {
            // Add new template
            const docRef = await firebase.firestore().collection('template_types').add({
                ...formData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            const newTemplate = {
                id: docRef.id,
                ...formData,
                createdAt: new Date().toISOString().split('T')[0],
                firebaseId: docRef.id
            };
            templates.push(newTemplate);
            console.log('Template created successfully:', docRef.id);
        }

        closeTemplateModal();
        populateTemplatesGrid();
    } catch (error) {
        console.error('Error saving template:', error);
        alert('Error saving template: ' + error.message);
    }
}

// Toggle Template Visibility
async function toggleVisibility(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newVisibility = template.isVisible === false;

    try {
        await firebase.firestore().collection('template_types').doc(templateId).update({
            isVisible: newVisibility,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        template.isVisible = newVisibility;
        populateTemplatesGrid();
        console.log('Template visibility updated:', templateId, newVisibility);
    } catch (error) {
        console.error('Error updating template visibility:', error);
        alert('Error updating template visibility: ' + error.message);
    }
}

// Search Functionality
function setupTemplateSearchListener() {
    const templateSearchInput = document.getElementById('templateSearchInput');

    if (templateSearchInput) {
        templateSearchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.template-card');

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}
