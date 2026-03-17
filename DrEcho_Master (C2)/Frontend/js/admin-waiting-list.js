// ============================================
// WAITING LIST PAGE - ADMIN
// ============================================

// Override the onDataReady callback to load waiting list when data is ready
window.onDataReady = function() {
    loadWaitingList();
};

// Load and display waiting list
function loadWaitingList() {
    const pendingUsers = users
        .filter(u => u.status === 'pending')
        .map(user => ({
            id: user.firebaseId,
            userId: user.id,
            name: user.name || 'N/A',
            email: user.email || 'N/A',
            phone: user.fullRecord?.phone || 'N/A',
            specialty: user.fullRecord?.specialty || 'N/A',
            dob: user.fullRecord?.dob || 'N/A',
            gender: user.fullRecord?.gender || 'N/A',
            department: user.fullRecord?.department || 'N/A',
            graduatedFrom: user.fullRecord?.graduatedFrom || 'N/A',
            graduatedYear: user.fullRecord?.graduatedYear || 'N/A',
            certification: user.fullRecord?.certification || 'N/A',
            currentPractice: user.fullRecord?.placeOfPractice || 'N/A',
            yearsExperience: user.fullRecord?.yearsExperience || 'N/A',
            status: 'pending',
            submittedDate: user.joinDate,
            fullRegistration: user.fullRecord?.fullRegistration || '',
            provisionalRegistration: user.fullRecord?.provisionalRegistration || '',
            tpcNumber: user.fullRecord?.tpcNumber || ''
        }));

    displayWaitingList(pendingUsers);
    updateStatistics(pendingUsers);
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

// Display waiting list requests as cards
function displayWaitingList(requests) {
    const container = document.getElementById('waitingListContent');
    const emptyState = document.getElementById('emptyState');

    if (!requests || requests.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = requests.map(request => `
        <div class="waiting-card">
            <div class="card-header">
                <div class="card-header-left">
                    <div class="card-title">${escapeHtml(request.userId)}</div>
                    <div class="card-subtitle">${escapeHtml(request.email)}</div>
                </div>
            </div>

            <div class="card-body">
                <div class="grid-two-col">
                    <div class="col-left">
                        <div class="info-row">
                            <div class="info-label">Name</div>
                            <div class="info-value">${request.name}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Phone</div>
                            <div class="info-value">${escapeHtml(request.phone)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Date of Birth</div>
                            <div class="info-value">${escapeHtml(request.dob)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Gender</div>
                            <div class="info-value">${escapeHtml(request.gender)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Hospital/ Department</div>
                            <div class="info-value">${escapeHtml(request.department)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Submitted</div>
                            <div class="info-value">${formatDate(request.submittedDate)}</div>
                        </div>

                    </div>
                    <div class="col-right">
                        <div class="info-row">
                            <div class="info-label">Specialty</div>
                            <div class="info-value">${escapeHtml(request.specialty)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Place of Practice</div>
                            <div class="info-value">${escapeHtml(request.currentPractice)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Provisional Registration</div>
                            <div class="info-value">${escapeHtml(request.provisionalRegistration)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Graduated From</div>
                            <div class="info-value">${escapeHtml(request.graduatedFrom)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Full Registration</div>
                            <div class="info-value">${escapeHtml(request.fullRegistration)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">TPC Number</div>
                            <div class="info-value">${escapeHtml(request.tpcNumber)}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn-small reject" onclick="event.stopPropagation(); rejectUser('${request.id}')">Reject</button>
                <button class="btn-small approve" onclick="event.stopPropagation(); approveUser('${request.id}')">Approve</button>
            </div>
        </div>
    `).join('');

}

// Approve / Reject entry points from card buttons
function approveUser(firebaseId) {
    currentViewingRequestId = firebaseId;
    approveRequest();
}

function rejectUser(firebaseId) {
    currentViewingRequestId = firebaseId;
    rejectRequest();
}

// Open details modal for pending request
function openDetailsModal(requestId) {
    viewRequestDetails(requestId);
}

// Close details modal
function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) modal.classList.remove('show');
    currentViewingRequestId = null;
}

// Approve / Reject 
function approveRequest() {
    if (!currentViewingRequestId) return;
    currentAction = 'approve';
    showConfirmModal(
        'Approve Registration',
        'This user will be granted full access to the platform.',
        'Yes, Approve'
    );
}

function rejectRequest() {
    if (!currentViewingRequestId) return;
    currentAction = 'reject';
    showConfirmModal(
        'Reject Registration',
        'The user will be notified with your rejection reason.',
        'Yes, Reject',
        true
    );
}

// Show confirmation modal
function showConfirmModal(title, message, actionText, showRejectReason = false) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const actionBtn = document.getElementById('confirmActionBtn');
    const iconEl = document.getElementById('modalIcon');
    const reasonContainer = document.getElementById('rejectionReasonContainer');

    titleEl.textContent = title;
    messageEl.textContent = message;
    actionBtn.textContent = actionText;

    if (currentAction === 'approve') {
        modal.classList.add('confirm-success');
        modal.classList.remove('confirm-danger');
        iconEl.innerHTML = '✅';
        iconEl.style.background = '#d1fae5';
        iconEl.style.color = '#10b981';
        actionBtn.className = 'btn btn-success btn-confirm';
    } else {
        modal.classList.add('confirm-danger');
        modal.classList.remove('confirm-success');
        iconEl.innerHTML = '⚠️';
        iconEl.style.background = '#fee2e2';
        iconEl.style.color = '#ef4444';
        actionBtn.className = 'btn btn-danger btn-confirm';
    }

    reasonContainer.style.display = showRejectReason ? 'block' : 'none';
    if (showRejectReason) {
        setTimeout(() => {
            document.getElementById('rejectionReason').focus();
        }, 300);
    }

    modal.classList.add('show');
}

// Close confirmation modal
function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
    currentAction = null;
}

// Execute the action (approve or reject)
async function executeAction() {
    if (!currentViewingRequestId || !currentAction) return;

    try {
        const firebaseId = currentViewingRequestId;
        const newStatus = currentAction === 'approve' ? 'active' : 'rejected';

        // If rejecting, verify rejection reason is provided
        let rejectionReason = '';
        if (currentAction === 'reject') {
            const reasonField = document.getElementById('rejectionReason');
            rejectionReason = reasonField ? reasonField.value.trim() : '';
            if (!rejectionReason) {
                alert('Please provide a rejection reason');
                return;
            }
        }

        const updateData = {
            accountStatus: newStatus
        };

        if (currentAction === 'reject') {
            updateData.rejectionReason = rejectionReason;
            updateData.rejectedAt = new Date();
        }

        await firebase.firestore().collection("users").doc(firebaseId).update(updateData);

        const userIndex = users.findIndex(u => u.firebaseId === firebaseId);
        if (userIndex !== -1) {
            users[userIndex].status = newStatus;
            if (currentAction === 'reject') {
                users[userIndex].rejectionReason = rejectionReason;
            }
        }

        closeConfirmModal();
        closeDetailsModal();
        loadWaitingList();

        if (currentAction === 'approve') {
            alert('User registration approved successfully!');
        } else {
            alert('User registration rejected successfully!');
        }

    } catch (error) {
        console.error('Error updating user status:', error);
        alert('Error updating user status: ' + error.message);
    }
}

// Update statistics
function updateStatistics(requests) {
    const pending = requests ? requests.filter(r => r.status === 'pending').length : 0;

    const pendingEl = document.getElementById('pendingCount');
    if (pendingEl) pendingEl.textContent = pending;
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const detailsModal = document.getElementById('detailsModal');
    const confirmModal = document.getElementById('confirmModal');

    if (detailsModal && event.target === detailsModal) {
        closeDetailsModal();
    }
    if (confirmModal && event.target === confirmModal) {
        closeConfirmModal();
    }
});


