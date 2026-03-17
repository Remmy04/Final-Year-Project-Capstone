// ============================================
// NAVIGATION HIGHLIGHTING
// ============================================

// Set active nav link based on current page
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-menu a.nav-link');
    const currentPage = window.location.pathname.split('/').pop();
    
    navLinks.forEach(link => {
        const hrefPage = link.getAttribute('href').split('/').pop();
        if (hrefPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    checkAuthAndLoadData();
});

// Check if user is authenticated before loading data
async function checkAuthAndLoadData() {
    try {
        const user = await new Promise((resolve, reject) => {
            const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
                unsubscribe();
                if (user) {
                    resolve(user);
                } else {
                    reject(new Error('User not authenticated'));
                }
            });
        });

        console.log('User authenticated:', user.email);

        // Verify user is admin 
        const userDoc = await firebase.firestore().collection("users")
            .where("authUid", "==", user.uid)
            .limit(1)
            .get();

        if (userDoc.empty) {
            console.error('User document not found in Firestore');
            alert('User account not found. Please contact support.');
            window.location.href = '../html/login.html';
            return;
        }

        const userData = userDoc.docs[0].data();
        
        if (userData.role !== 'admin') {
            console.error('User is not an admin:', userData.role);
            alert('You do not have permission to access this page.');
            window.location.href = '../html/index.html';
            return;
        }

        console.log('Admin user verified');

        await loadDataFromFirebase();
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '../html/login.html';
    }
}

// ============================================
// SHARED DATA & STATE - LOAD FROM FIREBASE
// ============================================

let users = [];
let templates = [];
let pendingUsers = [];
let approvedUsers = [];
let dataReady = false;
let performanceStats = {
    totalUsers: 0,
    chatbotInteractions: 0,
    reportsGenerated: 0,
    avgRating: 0
};

// Callback function when data is ready 
function onDataReady() {
    console.log('Data is ready for use');
}

// Load all data from Firebase
async function loadDataFromFirebase() {
    try {
        console.log('Starting to load data from Firebase...');
        
        const currentAuthUser = firebase.auth().currentUser;
        const currentUserEmail = currentAuthUser?.email || '';
        const currentUserUid = currentAuthUser?.uid || '';
        
        const usersSnapshot = await firebase.firestore().collection("users").get();
        users = usersSnapshot.docs.map(doc => {
            const docData = doc.data();

            let status = 'active';
            if (docData.accountStatus === 'pending') {
                status = 'pending';
            } else if (docData.accountStatus === 'rejected') {
                status = 'rejected';
            } else {
                status = 'active';
            }
            
            let email = docData.email || '';
            if (!email && docData.authUid === currentUserUid) {
                email = currentUserEmail;
            }
            
            return {
                id: docData.userId || doc.id,
                name: docData.fullName || 'Unknown',
                email: email,
                role: docData.role || 'user',
                status: status,
                joinDate: docData.createdAt ? new Date(docData.createdAt.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                firebaseId: doc.id,
                fullRecord: docData  
            };
        });

        // Separate pending and approved users
        pendingUsers = users.filter(u => u.status === 'pending');
        approvedUsers = users.filter(u => u.status === 'active' || u.status === 'approved');

        performanceStats.totalUsers = users.length;

        // Load templates from Firestore
        const templatesSnapshot = await firebase.firestore().collection("template_types").get();
        templates = templatesSnapshot.docs.map(doc => {
            const docData = doc.data();
            return {
                id: doc.id,
                name: docData.name || docData.template_name || '',
                modalities: docData.modalities || (docData.category ? [docData.category] : []),
                specialty: docData.specialty || docData.medical_specialty || '',
                status: docData.status || 'active',
                description: docData.description || docData.notes || '',
                isVisible: docData.isVisible !== false,
                createdAt: docData.createdAt ? new Date(docData.createdAt.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                updatedAt: docData.updatedAt ? new Date(docData.updatedAt.toDate()).toISOString().split('T')[0] : null,
                firebaseId: doc.id
            };
        });

        dataReady = true;
        
        console.log('Data loaded from Firebase:', { totalUsers: users.length, pendingUsers: pendingUsers.length, approvedUsers: approvedUsers.length, templates: templates.length });
        
        if (typeof onDataReady === 'function') {
            onDataReady();
        }
    } catch (error) {
        console.error('Error loading data from Firebase:', error);
        alert('Error loading data: ' + error.message);
    }
}

let currentEditingUserId = null;
let currentEditingTemplateId = null;
let deleteTarget = null;
let deleteType = null;
let currentViewingRequestId = null;
let currentAction = null;


// ============================================
// SHARED MODAL MANAGEMENT
// ============================================

// User Modal Functions
function openAddUserModal() {
    const userModal = document.getElementById('userModal');
    if (!userModal) return;
    
    currentEditingUserId = null;
    const userModalTitle = document.getElementById('userModalTitle');
    const userForm = document.getElementById('userForm');
    
    if (userModalTitle) userModalTitle.textContent = 'Add New User';
    if (userForm) userForm.reset();
    userModal.classList.add('show');
}

function closeUserModal() {
    const userModal = document.getElementById('userModal');
    if (userModal) userModal.classList.remove('show');
    currentEditingUserId = null;
}

// Template Modal Functions
function openAddTemplateModal() {
    const templateModal = document.getElementById('templateModal');
    if (!templateModal) return;
    
    currentEditingTemplateId = null;
    const templateModalTitle = document.getElementById('templateModalTitle');
    const templateForm = document.getElementById('templateForm');
    
    if (templateModalTitle) templateModalTitle.textContent = 'Add New Template';
    if (templateForm) templateForm.reset();
    templateModal.classList.add('show');
}

function closeTemplateModal() {
    const templateModal = document.getElementById('templateModal');
    if (templateModal) templateModal.classList.remove('show');
    currentEditingTemplateId = null;
}

// Delete Modal Functions
function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) deleteModal.classList.remove('show');
    deleteTarget = null;
    deleteType = null;
}

function confirmDelete() {
    if (deleteType === 'user') {
        users = users.filter(u => u.id !== deleteTarget);

        if (typeof populateUsersTable === 'function') {
            populateUsersTable();
        }
    }

    closeDeleteModal();
}

async function deleteTemplateFromFirebase(templateId) {
    try {
        // Delete from Firestore
        await firebase.firestore().collection('template_types').doc(templateId).delete();
        
        // Update local array
        templates = templates.filter(t => t.id !== templateId);
        
        // Refresh the UI
        if (typeof populateTemplatesGrid === 'function') {
            populateTemplatesGrid();
        }
        
        console.log('Template deleted successfully:', templateId);
    } catch (error) {
        console.error('Error deleting template:', error);
        alert('Error deleting template: ' + error.message);
    }
}

// Close modals 
window.addEventListener('click', function(event) {
    const userModal = document.getElementById('userModal');
    const templateModal = document.getElementById('templateModal');
    const deleteModal = document.getElementById('deleteModal');

    if (userModal && event.target === userModal) {
        closeUserModal();
    }
    if (templateModal && event.target === templateModal) {
        closeTemplateModal();
    }
    if (deleteModal && event.target === deleteModal) {
        closeDeleteModal();
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
