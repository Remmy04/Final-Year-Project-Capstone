// ============================================
// SEARCH DOCTORS PAGE - ADMIN
// ============================================

window.onDataReady = function() {
    loadDoctors();
};

let currentProfileDoctorId = null;

// Load and display all approved doctors 
function loadDoctors() {
    const approvedDoctors = users
        .filter(u => u.status === 'active' && u.role !== 'admin')
        .map(user => ({
            id: user.id,
            firebaseId: user.firebaseId,
            name: user.name,
            email: user.email,
            phone: user.fullRecord?.phone || 'N/A',
            specialty: user.fullRecord?.specialty || 'N/A',
            dob: user.fullRecord?.dob || 'N/A',
            gender: user.fullRecord?.gender || 'N/A',
            department: user.fullRecord?.department || 'N/A',
            university: user.fullRecord?.graduatedFrom || 'N/A',
            graduatedYear: user.fullRecord?.graduatedYear || 'N/A',
            certification: user.fullRecord?.certification || 'N/A',
            currentPractice: user.fullRecord?.placeOfPractice || 'N/A',
            
            fullRegistration: user.fullRecord?.fullRegistration || 'N/A',
            provisionalRegistration: user.fullRecord?.provisionalRegistration || 'N/A',
            tpcNumber: user.fullRecord?.tpcNumber || 'N/A',
            status: 'active',
            joinDate: user.joinDate
        }));
    
    displayDoctors(approvedDoctors);
}

// Display doctors in grid format
function displayDoctors(doctors) {
    const grid = document.getElementById('doctorsGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');

    if (!doctors || doctors.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        if (resultsCount) resultsCount.textContent = '0';
        return;
    }

    emptyState.style.display = 'none';
    if (resultsCount) resultsCount.textContent = doctors.length;

    grid.innerHTML = doctors.map(doctor => `
        <div class="doctor-card">
            <div class="doctor-card-header">
                <div class="doctor-name">${escapeHtml(doctor.name)}</div>
                <div class="doctor-id">#${doctor.id}</div>
            </div>

            <div class="doctor-card-body">
                <div class="info-item">
                    <div class="info-label">Email:</div>
                    <div class="info-text">${escapeHtml(doctor.email)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Graduated From:</div>
                    <div class="info-text">${escapeHtml(doctor.university)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Place of Practice:</div>
                    <div class="info-text">${escapeHtml(doctor.currentPractice)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Full Registration Number:</div>
                    <div class="info-text">${escapeHtml(doctor.fullRegistration)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Provisional Registration:</div>
                    <div class="info-text">${escapeHtml(doctor.provisionalRegistration)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">TPC Number:</div>
                    <div class="info-text">${escapeHtml(doctor.tpcNumber)}</div>
                </div>

                <div class="status-badge active">
                    ${capitalizeFirst(doctor.status)}
                </div>

            </div>
            <div class="doctor-card-footer">
                <button class="view-profile-btn" onclick="openProfileModal('${doctor.firebaseId}')">View Full Profile</button>
            </div>
        </div>
    `).join('');
}

// Search and Filter functionality
function searchDoctors() {
    console.log('searchDoctors called');
    applyFilters();
}

function applyFilters() {
    console.log('applyFilters called');
    const searchInput = document.getElementById('doctorSearchInput').value.toLowerCase();
    const specialtyFilter = document.getElementById('specialtyFilter').value;
    
    console.log('Search input:', searchInput);
    console.log('Specialty filter:', specialtyFilter);
    console.log('Total users:', users.length);

    const approvedDoctors = users
        .filter(u => u.status === 'active' && u.role !== 'admin' && u.status !== 'rejected')
        .map(user => ({
            id: user.id,
            firebaseId: user.firebaseId,
            name: user.name,
            email: user.email,
            phone: user.fullRecord?.phone || 'N/A',
            specialty: user.fullRecord?.specialty || 'N/A',
            dob: user.fullRecord?.dob || 'N/A',
            gender: user.fullRecord?.gender || 'N/A',
            department: user.fullRecord?.department || 'N/A',
            university: user.fullRecord?.graduatedFrom || 'N/A',
            currentPractice: user.fullRecord?.placeOfPractice || 'N/A',
            fullRegistration: user.fullRecord?.fullRegistration || 'N/A',
            provisionalRegistration: user.fullRecord?.provisionalRegistration || 'N/A',
            tpcNumber: user.fullRecord?.tpcNumber || 'N/A',
            status: 'active',
            joinDate: user.joinDate
        }));

    console.log('Approved doctors to filter:', approvedDoctors.length);

    let filtered = approvedDoctors.filter(doctor => {
        const matchesSearch = !searchInput || 
            doctor.name.toLowerCase().includes(searchInput) ||
            doctor.email.toLowerCase().includes(searchInput) ||
            doctor.id.toLowerCase().includes(searchInput);

        const matchesSpecialty = !specialtyFilter || 
            (doctor.specialty && doctor.specialty.toLowerCase() === specialtyFilter.toLowerCase());

        const result = matchesSearch && matchesSpecialty;
        if (searchInput || specialtyFilter) {
            console.log(`Doctor: ${doctor.name}, specialty: ${doctor.specialty}, matches: ${result}`);
        }
        return result;
    });

    console.log('Filtered results:', filtered.length);
    displayDoctors(filtered);
}

// Open profile modal with full details
function openProfileModal(firebaseId) {
    const user = users.find(u => u.firebaseId === firebaseId);
    if (!user) return;

    const doctor = {
        id: user.id,
        firebaseId: user.firebaseId,
        name: user.name,
        email: user.email,
        phone: user.fullRecord?.phone || 'N/A',
        dob: user.fullRecord?.dob || 'N/A',
        age: user.fullRecord?.age || 'N/A',
        gender: user.fullRecord?.gender || 'N/A',
        department: user.fullRecord?.department || 'N/A',
        specialty: user.fullRecord?.specialty || 'N/A',
        university: user.fullRecord?.graduatedFrom || 'N/A',
        currentPractice: user.fullRecord?.placeOfPractice || 'N/A',
        fullRegistration: user.fullRecord?.fullRegistration || 'N/A',
        provisionalRegistration: user.fullRecord?.provisionalRegistration || 'N/A',
        tpcNumber: user.fullRecord?.tpcNumber || 'N/A',
        status: 'active',
        joinDate: user.joinDate
    };

    const modal = document.getElementById('profileModal');
    const title = document.getElementById('profileModalTitle');
    const content = document.getElementById('profileContent');

    currentProfileDoctorId = firebaseId;
    if (modal) modal.dataset.editing = 'false';

    if (title) title.textContent = 'Doctor Profile';

    content.innerHTML = `
        <div class="profile-header">
            <div class="profile-name">${escapeHtml(doctor.name)}</div>
            <div class="profile-id">ID: ${doctor.id}</div>
        </div>

        <div class="section">
            <div class="section-title">Personal & Contact Information</div>
            <div class="profile-row">
                <div class="profile-label">Email</div>
                <div class="profile-value">${escapeHtml(doctor.email)}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Phone</div>
                <div class="profile-value">${doctor.phone}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Date of Birth</div>
                <div class="profile-value">${doctor.dob}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Gender</div>
                <div class="profile-value">${escapeHtml(doctor.gender)}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Hospital/ Department</div>
                <div class="profile-value">${doctor.department}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Professional Details</div>
            <div class="profile-row">
                <div class="profile-label">Specialty</div>
                <div class="profile-value">${escapeHtml(doctor.specialty)}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Graduated From</div>
                <div class="profile-value">${escapeHtml(doctor.university)}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Place of Practice</div>
                <div class="profile-value">${escapeHtml(doctor.currentPractice)}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Full Registration Number</div>
                <div class="profile-value">${escapeHtml(doctor.fullRegistration)}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Provisional Registration</div>
                <div class="profile-value">${escapeHtml(doctor.provisionalRegistration)}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">TPC Number</div>
                <div class="profile-value">${escapeHtml(doctor.tpcNumber)}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Account Information</div>
            <div class="profile-row">
                <div class="profile-label">Join Date</div>
                <div class="profile-value">${formatDate(doctor.joinDate)}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Account Status</div>
                <div class="profile-value">
                    <span class="profile-status active">
                        ${capitalizeFirst(doctor.status)}
                    </span>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('show');
}

// Close profile modal
function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('show');
        modal.dataset.editing = 'false';
    }

    const primaryBtn = document.querySelector('#profileModal .modal-actions .btn.primary');
    if (primaryBtn) primaryBtn.textContent = 'Edit Information';
}

window.addEventListener('click', function(event) {
    const profileModal = document.getElementById('profileModal');

    if (profileModal && event.target === profileModal) {
        closeProfileModal();
    }
});

// Edit doctor 
async function editDoctor() {
    const modal = document.getElementById('profileModal');
    const content = document.getElementById('profileContent');
    const primaryBtn = document.querySelector('#profileModal .modal-actions .btn.primary');
    if (!modal || !content || !primaryBtn) return;

    const isEditing = modal.dataset.editing === 'true';

    if (!isEditing) {
        const user = users.find(u => u.firebaseId === currentProfileDoctorId);
        if (!user) return alert('User not found for editing');
        const r = user.fullRecord || {};

        content.innerHTML = `
            <form id="editDoctorForm" class="edit-doctor-form">
                <div class="form-row"><label>Full Name</label><input class="form-control" id="editFullName" value="${escapeHtml(user.name || r.fullName || '')}"></div>
                <div class="form-row"><label>Email</label><input class="form-control" id="editEmail" value="${escapeHtml(user.email || r.email || '')}"></div>
                <div class="form-row"><label>Phone</label><input class="form-control" id="editPhone" value="${escapeHtml(r.phone || '')}"></div>
                <div class="form-row"><label>Date of Birth</label><input class="form-control" id="editDob" type="date" value="${r.dob || ''}"></div>
                <div class="form-row"><label>Gender</label><input class="form-control" id="editGender" value="${escapeHtml(r.gender || '')}"></div>
                <div class="form-row"><label>Department</label><input class="form-control" id="editDepartment" value="${escapeHtml(r.department || '')}"></div>
                <div class="form-row"><label>Specialty</label><input class="form-control" id="editSpecialty" value="${escapeHtml(r.specialty || '')}"></div>
                <div class="form-row"><label>Graduated From</label><input class="form-control" id="editGraduatedFrom" value="${escapeHtml(r.graduatedFrom || '')}"></div>

                <div class="form-row"><label>Place of Practice</label><input class="form-control" id="editPlaceOfPractice" value="${escapeHtml(r.placeOfPractice || '')}"></div>

                <div class="form-row"><label>Full Registration</label><input class="form-control" id="editFullRegistration" value="${escapeHtml(r.fullRegistration || '')}"></div>
                <div class="form-row"><label>Provisional Registration</label><input class="form-control" id="editProvisionalRegistration" value="${escapeHtml(r.provisionalRegistration || '')}"></div>
                <div class="form-row"><label>TPC Number</label><input class="form-control" id="editTpcNumber" value="${escapeHtml(r.tpcNumber || '')}"></div>
            </form>
        `;

        modal.dataset.editing = 'true';
        primaryBtn.textContent = 'Save Changes';
        return;
    }

    // Save changes
    try {
        const updates = {
            fullName: document.getElementById('editFullName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            dob: document.getElementById('editDob').value || null,
            gender: document.getElementById('editGender').value.trim(),
            department: document.getElementById('editDepartment').value.trim(),
            specialty: document.getElementById('editSpecialty').value.trim(),
            graduatedFrom: document.getElementById('editGraduatedFrom').value.trim(),
            placeOfPractice: document.getElementById('editPlaceOfPractice').value.trim(),
            fullRegistration: document.getElementById('editFullRegistration').value.trim(),
            provisionalRegistration: document.getElementById('editProvisionalRegistration').value.trim(),
            tpcNumber: document.getElementById('editTpcNumber').value.trim()
        };

        // Update Firestore
        await firebase.firestore().collection('users').doc(currentProfileDoctorId).update(updates);

        // Refresh data and UI
        await loadDataFromFirebase();
        modal.dataset.editing = 'false';
        primaryBtn.textContent = 'Edit Information';
        
        // Re-open profile to show updated values
        openProfileModal(currentProfileDoctorId);
        alert('Doctor information updated successfully');
    } catch (err) {
        console.error('Failed to update doctor:', err);
        alert('Failed to update: ' + (err.message || err));
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
