// ============================================
// ADMIN DASHBOARD - HOME PAGE
// ============================================

// Override the onDataReady callback to update stats when data is ready
window.onDataReady = function() {
    updateSystemOverview();
};

// Update system overview with real data from Firebase
function updateSystemOverview() {
    // Count total admins
    const totalAdmins = users.filter(u => u.role === 'admin').length;
    
    // Count total users (including all roles)
    const totalUsers = users.length;
    
    // Count templates 
    const totalTemplates = templates.length;

    // Update HTML elements with real data
    const adminsElement = document.getElementById('homeAdmins');
    const usersElement = document.getElementById('homeUsers');
    const templatesElement = document.getElementById('homeTemplates');

    if (adminsElement) adminsElement.textContent = totalAdmins;
    if (usersElement) usersElement.textContent = totalUsers;
    if (templatesElement) templatesElement.textContent = totalTemplates;

    console.log('System Overview Updated:', { totalAdmins, totalUsers, totalTemplates });
}
