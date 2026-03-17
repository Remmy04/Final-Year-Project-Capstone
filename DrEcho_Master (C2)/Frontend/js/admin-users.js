// ============================================
// USERS PAGE - TABLE & CRUD OPERATIONS
// ============================================

let originalAdminEmail = null;
let originalAdminPassword = null;
let pendingAction = null;
let pendingActionData = null;

window.onDataReady = function() {
    populateUsersTable();
    setupUserSearchListener();
};

// Populate Users Table with all users from Firebase
function populateUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('usersEmptyState');

    if (!tbody) return; 

    if (users.length === 0) {
        tbody.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    tbody.style.display = 'table-row-group';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>

            <td>
                <span class="role-badge role-${user.role}">
                    ${capitalizeFirst(user.role)}
                </span>
            </td>

            <td>
                <span class="status-badge status-${user.status }">
                    ${capitalizeFirst(user.status)}   
                </span>        
            </td>

            <td>${formatDate(user.joinDate)}</td>

            <td>
                <div class="actions">
                    <button class="action-btn view" onclick="editUser('${user.firebaseId}')">View</button>
                    <button class="action-btn delete" onclick="deleteUser('${user.firebaseId}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function toggleStepValidation(activeStepId) {
    const allSteps = document.querySelectorAll('#userForm .form-step');

    allSteps.forEach(step => {
        const inputs = step.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            if (step.id === activeStepId) {
                input.disabled = false;   
            } else {
                input.disabled = true;    
            }
        });
    });
}

let currentEditingFirebaseId = null;
let currentEditingUserRole = null;
let newUserCreationRole = null; 

function openAddUserModal() {
    currentEditingFirebaseId = null;
    currentEditingUserRole = null;
    newUserCreationRole = null;
    
    // Show add form, hide edit form
    document.getElementById('userForm').style.display = '';
    document.getElementById('editUserForm').style.display = 'none';
    
    // Reset UI
    document.getElementById('newUserRole').value = '';
    document.getElementById('step1-role').style.display = '';
    document.getElementById('step2-admin').style.display = 'none';
    document.getElementById('step2-user').style.display = 'none';
    
    document.getElementById('userModalTitle').textContent = 'Add New User';
    
    toggleStepValidation('step1-role');
    
    const modal = document.getElementById('userModal');
    if (modal) modal.classList.add('show');
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.classList.remove('show');

    originalAdminPassword = null;
}

function onNewUserRoleChange() {
}

function goToStep1() {
    document.getElementById('step1-role').style.display = '';
    document.getElementById('step2-admin').style.display = 'none';
    document.getElementById('step2-user').style.display = 'none';
    
    toggleStepValidation('step1-role');
}

function goToStep2() {
    const role = document.getElementById('newUserRole').value;
    if (!role) {
        alert('Please select a role');
        return;
    }
    
    newUserCreationRole = role;
    document.getElementById('step1-role').style.display = 'none';
    
    if (role === 'admin') {
        document.getElementById('adminFullName').value = '';
        document.getElementById('adminEmail').value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminConfirmPassword').value = '';
        
        document.getElementById('step2-admin').style.display = '';
        document.getElementById('step2-user').style.display = 'none';
        
        toggleStepValidation('step2-admin');
    } else if (role === 'user') {
        document.getElementById('userFullName').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userPassword').value = '';
        document.getElementById('userConfirmPassword').value = '';
        document.getElementById('userGraduatedFrom').value = '';
        document.getElementById('userPlaceOfPractice').value = '';
        document.getElementById('userFullRegistration').value = '';
        document.getElementById('userProvisionalRegistration').value = '';
        document.getElementById('userTpcNumber').value = '';
        
        document.getElementById('step2-admin').style.display = 'none';
        document.getElementById('step2-user').style.display = '';
        
        toggleStepValidation('step2-user');
    }
}

async function saveNewUser(event) {
    if (event && event.preventDefault) event.preventDefault();
    
    if (newUserCreationRole === 'admin') {
        await saveNewAdmin();
    } else if (newUserCreationRole === 'user') {
        await saveNewUserDoctor();
    }
}

async function getNextAdminId() {
    const counterRef = firebase.firestore().collection('counters').doc('admins_counter');
    
    return await firebase.firestore().runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        let current = 0;
        if (counterDoc.exists) {
            current = counterDoc.data().current || 0;
        }
        
        const next = current + 1;
        const newId = 'A' + String(next).padStart(2, '0');  
        
        transaction.set(counterRef, { current: next }, { merge: true });
        
        return newId;
    });
}

async function saveNewAdmin() {
    const fullName = document.getElementById('adminFullName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;

    if (!fullName || !email || !password) {
        alert('All fields are required');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }

    let adminEmailBeforeCreation = null;

    try {
        // Capture email while still logged in as admin
        if (firebase.auth().currentUser) {
            adminEmailBeforeCreation = firebase.auth().currentUser.email;
            console.log("Captured admin email before creation:", adminEmailBeforeCreation);
        }

        const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const authUid = userCred.user.uid;

        const newAdminId = await getNextAdminId();

        await firebase.firestore().collection('users').doc(newAdminId).set({
            fullName: fullName,
            email: email,
            authUid: authUid,
            role: 'admin',
            accountStatus: 'active',
            isApproved: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        await loadDataFromFirebase();
        populateUsersTable();
        closeUserModal();

        try {
            await firebase.auth().signOut();
            showReauthModal();   
        } catch (err) {
            console.error("Error during sign-out:", err);
            alert("User created, but session handling failed.\nPlease sign in again manually.");
            window.location.href = "../html/logout.html";
        }

    } catch (err) {
        console.error('Failed to create admin:', err);
        alert('Failed to create admin: ' + (err.message || err));
    }
}
        
async function saveNewUserDoctor() {
    const fullName = document.getElementById('userFullName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const confirmPassword = document.getElementById('userConfirmPassword').value;
    const graduatedFrom = document.getElementById('userGraduatedFrom').value.trim();
    const placeOfPractice = document.getElementById('userPlaceOfPractice').value.trim();
    const fullRegistration = document.getElementById('userFullRegistration').value.trim();
    const provisionalRegistration = document.getElementById('userProvisionalRegistration').value.trim();
    const tpcNumber = document.getElementById('userTpcNumber').value.trim();

    if (!fullName || !email || !password) {
        alert('Name, email, and password are required');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }

    try {
        if (firebase.auth().currentUser) {
            adminEmailBeforeCreation = firebase.auth().currentUser.email;
            console.log("Captured admin email before creation:", adminEmailBeforeCreation);
        }

        const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const authUid = userCred.user.uid;

        const customUserId = await generateNextId('users', 'U');

        await firebase.firestore().collection('users').doc(customUserId).set({
            userId: customUserId,
            fullName: fullName,
            email: email,
            authUid: authUid,
            role: 'user',
            accountStatus: 'active',
            isApproved: true,
            graduatedFrom: graduatedFrom || '',
            placeOfPractice: placeOfPractice || '',
            fullRegistration: fullRegistration || '',
            provisionalRegistration: provisionalRegistration || '',
            tpcNumber: tpcNumber || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadDataFromFirebase();
        populateUsersTable();
        closeUserModal();

        try {
            await firebase.auth().signOut();
            showReauthModal();   
        } catch (err) {
            console.error("Error during sign-out:", err);
            alert("User created, but session handling failed.\nPlease sign in again manually.");
            window.location.href = "../html/logout.html";
        }

    } catch (err) {
        console.error('Failed to create user:', err);
        alert('Failed to create user: ' + (err.message || err));
    }
}

function editUser(firebaseId) {
    // Show edit/view modal immediately; require verification only when saving
    doEditUser(firebaseId);
}

function doEditUser(firebaseId) {
    currentEditingFirebaseId = firebaseId;
    const user = users.find(u => u.firebaseId === firebaseId);
    if (!user) return alert('User not found');

    document.getElementById('userForm').style.display = 'none';
    document.getElementById('editUserForm').style.display = '';

    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserEmail').value = user.email || '';
    currentEditingUserRole = user.role || 'user';
    const statusEl = document.getElementById('editUserStatus');
    const statusGroup = document.getElementById('editUserStatusGroup');
    if (currentEditingUserRole === 'admin') {
        if (statusGroup) statusGroup.style.display = 'none';
        const group = document.getElementById('editRejectionReasonGroup');
        if (group) group.style.display = 'none';
    } else {
        if (statusEl) {
            if (statusGroup) statusGroup.style.display = '';
            statusEl.innerHTML = '<option value="active">Active</option><option value="rejected">Rejected</option>';
            statusEl.value = (user.status === 'active' || user.status === 'rejected') ? user.status : 'active';
        }
        document.getElementById('editUserRejectionReason').value = (user.fullRecord && user.fullRecord.rejectionReason) ? user.fullRecord.rejectionReason : '';
    }
    onUserStatusChange();

    const modal = document.getElementById('userModal');
    if (modal) modal.classList.add('show');
}

async function saveUser(event) {
    if (event && event.preventDefault) event.preventDefault();

    const firebaseId = currentEditingFirebaseId;
    if (!firebaseId) return alert('No user selected');

    const name = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const statusEl = document.getElementById('editUserStatus');
    const status = statusEl ? statusEl.value : null;
    const rejectionReason = document.getElementById('editUserRejectionReason').value.trim();

    if (!name || !email) {
        alert('Name and Email are required');
        return;
    }

    // Prepare updates but require re-auth before applying them
    let updates = {
        fullName: name,
        email: email
    };

    if (currentEditingUserRole !== 'admin') {
        updates.accountStatus = status;
        if (status === 'rejected') {
            updates.rejectionReason = rejectionReason;
            updates.rejectedAt = firebase.firestore.FieldValue.serverTimestamp();
        } else {
            updates.rejectionReason = '';
            updates.rejectedAt = firebase.firestore.FieldValue.delete();
        }
    }

    // Ask admin to reauthenticate before performing the save
    promptReauthForAction('save', {
        firebaseId: firebaseId,
        updates: updates,
        name: name,
        email: email,
        status: status,
        rejectionReason: rejectionReason,
        role: currentEditingUserRole
    });
}

// Perform the actual save after re-authentication
async function doSaveUser(data) {
    const firebaseId = data.firebaseId;
    const updates = data.updates;
    const name = data.name;
    const email = data.email;
    const status = data.status;
    const rejectionReason = data.rejectionReason;
    const role = data.role;

    try {
        await firebase.firestore().collection('users').doc(firebaseId).update(updates);

        // Update local array
        const userIdx = users.findIndex(u => u.firebaseId === firebaseId);
        if (userIdx >= 0) {
            users[userIdx].name = name;
            users[userIdx].email = email;
            if (role !== 'admin') {
                users[userIdx].status = status;
                if (!users[userIdx].fullRecord) users[userIdx].fullRecord = {};
                users[userIdx].fullRecord.accountStatus = status;
                if (status === 'rejected') {
                    users[userIdx].fullRecord.rejectionReason = rejectionReason;
                } else {
                    users[userIdx].fullRecord.rejectionReason = '';
                }
            }
        }

        await loadDataFromFirebase();
        populateUsersTable();
        closeUserModal();
        alert('User updated successfully');
    } catch (err) {
        console.error('Failed to save user:', err);
        alert('Error: ' + err.message);
    }
}

// Show or hide rejection reason field based on status selection
function onUserStatusChange() {
    const statusEl = document.getElementById('editUserStatus');
    if (!statusEl) return;
    const group = document.getElementById('editRejectionReasonGroup');
    if (statusEl.value === 'rejected') {
        if (group) group.style.display = '';
    } else {
        if (group) group.style.display = 'none';
    }
}

// Delete User
function deleteUser(firebaseId) {
    const user = users.find(u => u.firebaseId === firebaseId);
    if (!user) return;
    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) return;

    // After confirming intent, require re-auth before performing deletion
    promptReauthForAction('delete', { firebaseId });
}

async function doDeleteUser(firebaseId) {
    const user = users.find(u => u.firebaseId === firebaseId);
    if (!user) return;

    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) return;

    try {
        await firebase.firestore().collection("users").doc(firebaseId).delete();

        users = users.filter(u => u.firebaseId !== firebaseId);

        populateUsersTable();

        alert('User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
    }
}

// Setup search listener
function setupUserSearchListener() {
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchUsers(this.value);
        });
    }
}

// Search Users
function searchUsers(query) {
    const tbody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('usersEmptyState');
    const lowerQuery = query.toLowerCase();

    const filtered = users.filter(user => 
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery) ||
        user.id.toLowerCase().includes(lowerQuery)
    );

    if (filtered.length === 0) {
        tbody.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    tbody.style.display = 'table-row-group';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            
            <td>
                <span class="role-badge role-${user.role}">
                    ${capitalizeFirst(user.role)}
                </span>
            </td>

            <td>
                <span class="status-badge status-${user.status }">
                    ${capitalizeFirst(user.status)}   
                </span>        
            </td>

            <td>${formatDate(user.joinDate)}</td>
            <td>
                <div class="actions">
                    <button class="action-btn view" onclick="editUser('${user.firebaseId}')">View</button>
                    <button class="action-btn delete" onclick="deleteUser('${user.firebaseId}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Re-auth modal control functions
function showReauthModal() {
    const modal = document.getElementById('reauthModal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('reauthEmail').value = '';
        document.getElementById('reauthPassword').value = '';
        document.getElementById('reauthError').classList.remove('show');
        document.getElementById('reauthError').textContent = '';
    }
}

function cancelReauth() {
    const modal = document.getElementById('reauthModal');
    if (modal) {
        modal.classList.remove('show');
    }
    alert("You have been signed out for security reasons.\nPlease sign in again.");
    firebase.auth().signOut().then(() => {
        window.location.href = "../html/logout.html";
    });
}

// Prompt admin to re-authenticate before a sensitive action
function promptReauthForAction(action, data) {
    pendingAction = action;
    pendingActionData = data || null;

    const emailEl = document.getElementById('reauthEmail');
    const pwdEl = document.getElementById('reauthPassword');
    const errEl = document.getElementById('reauthError');

    if (emailEl && firebase.auth().currentUser) {
        emailEl.value = firebase.auth().currentUser.email || '';
    }
    if (pwdEl) pwdEl.value = '';
    if (errEl) { errEl.classList.remove('show'); errEl.textContent = ''; }

    const modal = document.getElementById('reauthModal');
    if (modal) modal.classList.add('show');
}

// Execute the pending action after successful verification
async function performPendingAction() {
    if (!pendingAction) return;

    try {
        if (pendingAction === 'view') {
            doEditUser(pendingActionData.firebaseId);
        } else if (pendingAction === 'delete') {
            await doDeleteUser(pendingActionData.firebaseId);
        } else if (pendingAction === 'save') {
            await doSaveUser(pendingActionData);
        }
    } catch (err) {
        console.error('Error performing pending action:', err);
    } finally {
        pendingAction = null;
        pendingActionData = null;
    }
}

async function submitReauth() {
    const emailInput    = document.getElementById('reauthEmail');
    const passwordInput = document.getElementById('reauthPassword');
    const errorEl       = document.getElementById('reauthError');

    const email    = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        errorEl.textContent = "Please enter both email and password";
        errorEl.classList.add('show');
        return;
    }

    errorEl.classList.remove('show');

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);

        console.log("Successfully signed in as:", email);

        const modal = document.getElementById('reauthModal');
        if (modal) {
            modal.classList.remove('show');
        }
        // After successful re-authentication, perform the pending sensitive action (if any)
        await performPendingAction();

    } catch (err) {
        console.error("Re-auth failed:", err);

        let msg = "Verification failed. Please check your credentials.";

        if (err.code === 'auth/wrong-password') {
            msg = "Incorrect password.";
        } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
            msg = "Account not found or invalid email.";
        } else if (err.code === 'auth/too-many-requests') {
            msg = "Too many attempts. Try again later.";
        } else {
            msg += ` (${err.message})`;
        }

        errorEl.textContent = msg;
        errorEl.classList.add('show');
    }
}

// Helper to escape HTML
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
