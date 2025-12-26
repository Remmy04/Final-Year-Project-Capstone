function calculateAge(dobString) {
    if (!dobString) return "-";
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return "-";
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age > 0 ? age : "-";
}

// Logout → back to index.html
function logoutUser() {
    firebase.auth().signOut().then(() => {
        window.location.href = "../html/index.html";
    }).catch(() => {
        window.location.href = "../html/index.html";
    });
}

// Main Auth Check
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
            alert("Profile not found. Please register again.");
            window.location.href = "../html/login.html";
            return;
        }

        const doc = snap.docs[0];
        const data = doc.data();
        const userDocId = doc.id;

        populateProfile(user, data, userDocId);
        setupAllButtons(user, userDocId, data);
        loadUserReports(data.userId || userDocId);

        // Reminder Banner for Incomplete Profiles
        const required = ["fullName", "specialty", "licenseId"];
        const missing = required.filter(f => !data[f] || data[f].toString().trim() === "" || data[f] === "Not set");

        if (missing.length > 0) {
            document.body.insertAdjacentHTML('afterbegin', `
                <div id="profileReminderBanner" style="
                    background:#fffbeb; 
                    color:#92400e; 
                    padding:14px 20px; 
                    text-align:center; 
                    font-size:15px; 
                    font-weight:500;
                    border-bottom:1px solid #fde68a;
                    position:fixed; 
                    top:0; left:0; right:0; 
                    z-index:9999;
                    box-shadow:0 2px 10px rgba(0,0,0,0.05);
                ">
                    Complete your profile to unlock full access 
                    <a href="#" id="completeProfileNow" style="
                        color:#1d4ed8; 
                        font-weight:600; 
                        text-decoration:underline; 
                        margin-left:6px;
                    ">Complete Now</a>
                </div>
            `);

            document.getElementById("completeProfileNow")?.addEventListener("click", (e) => {
                e.preventDefault();
                document.getElementById("editProfileModal").classList.remove("hidden");
            });

            window.scrollTo(0, 80);
        }

    } catch (err) {
        console.error(err);
        alert("Failed to load profile");
    }
});

function populateProfile(user, data, userDocId) {
    // User ID badge
    if (!document.getElementById("userIdDisplay")) {
        document.querySelector(".profile-details").insertAdjacentHTML("afterbegin", `
            <div id="userIdDisplay" style="font-weight:700; color:#1e40af; background:#dbeafe;
                 padding:6px 12px; border-radius:8px; display:inline-block; margin-bottom:12px; font-size:15px;">
                User ID: ${data.userId || userDocId}
            </div>
        `);
    }

    // Profile photo (default only)
    document.getElementById("profilePhoto").src = 
        (data.photoURL || "../imgs/default_profilePic.jpg") + "?t=" + Date.now();

    // Name & title
    document.getElementById("profileName").textContent = data.fullName || "Dr. User";
    document.getElementById("profileTitleLine").textContent = 
        (data.specialty || "Radiologist") + 
        (data.department && data.department !== "Not set" ? `, ${data.department}` : "");

    // License
    document.getElementById("profileLicense").textContent = data.licenseId || "Not set";
    const badge = document.getElementById("licenseBadge");
    const verified = data.licenseId && data.licenseId.trim() !== "" && data.licenseId !== "Not set";
    badge.textContent = verified ? "Verified" : "Not Verified";
    badge.className = "verification-badge " + (verified ? "verified" : "unverified");

    // Details
    document.getElementById("detailEmail").textContent = data.email || user.email;
    document.getElementById("detailPhone").textContent = data.phone || "-";
    document.getElementById("detailDob").textContent = data.dob || "-";
    document.getElementById("detailAge").textContent = calculateAge(data.dob);
    document.getElementById("detailGender").textContent = data.gender || "-";
    document.getElementById("detailDepartment").textContent = data.department || "Not set";
    document.getElementById("detailSpecialty").textContent = data.specialty || "Not set";

    // Pre-fill edit modal
    ["FullName","Specialty","Department","License","Phone","Dob","Gender"].forEach(field => {
        const el = document.getElementById("input" + field);
        if (el) el.value = data[field.toLowerCase()] || "";
    });
}

async function loadUserReports(userDisplayId) {
    const tbody = document.getElementById("reportsTableBody");
    try {
        const snap = await db.collection("reports_manual")
            .where("userDisplayId", "==", userDisplayId)
            .orderBy("savedAt", "desc")
            .get();

        tbody.innerHTML = snap.empty ? `
            <tr><td colspan="6" style="text-align:center; padding:60px; color:#666;">
                No reports yet<br><br>
                <a href="../html/CT_MR_Liver.html" class="btn">Create Your First Report</a>
            </td></tr>` : "";

        snap.forEach(doc => {
            const d = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td><strong>${doc.id}</strong></td>
                    <td>${d.patientName || "—"}</td>
                    <td>${d.modality || "—"}</td>
                    <td>${d.reportDate ? new Date(d.reportDate).toLocaleDateString() : "—"}</td>
                    <td><span class="status-pill status-finalized">Finalized</span></td>
                    <td><a href="view-report.html?id=${doc.id}" class="history-link">View</a></td>
                </tr>`;
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Failed to load reports</td></tr>`;
    }
}

function setupAllButtons(user, userDocId, data) {
    const modal = document.getElementById("editProfileModal");
    const dropdown = document.getElementById("settingsDropdown");

    // Dropdown toggle
    document.getElementById("btnSettings").onclick = e => {
        e.stopPropagation();
        dropdown.classList.toggle("show");
    };
    document.addEventListener("click", () => dropdown.classList.remove("show"));

    // Open / Close modal
    document.getElementById("btnOpenEditModal").onclick = () => modal.classList.remove("hidden");
    const closeModal = () => modal.classList.add("hidden");
    document.querySelectorAll(".modal .close, #btnCancelProfile").forEach(btn => btn.onclick = closeModal);
    modal.onclick = e => { if (e.target === modal) closeModal(); };

    // Logout
    document.getElementById("btnLogout")?.addEventListener("click", e => {
        e.preventDefault();
        logoutUser();
    });

    // Change password — use modal dialog instead of prompts
    (function setupChangePasswordModal() {
        const changeModal = document.getElementById("changePasswordModal");
        const openChangeBtn = document.getElementById("btnChangePassword");
        const closeChangeBtn = document.getElementById("closeChangePasswordModal");
        const cancelChangeBtn = document.getElementById("btnCancelChangePassword");
        const submitChangeBtn = document.getElementById("btnSubmitChangePassword");
        const pwErrorEl = document.getElementById("pwError");
        const currentPwdEl = document.getElementById("currentPassword");
        const newPwdEl = document.getElementById("newPassword");
        const confirmPwdEl = document.getElementById("confirmNewPassword");

        if (!openChangeBtn || !changeModal) return;

        function openChangeModal() {
            changeModal.classList.remove("hidden");
            if (currentPwdEl) currentPwdEl.value = "";
            if (newPwdEl) newPwdEl.value = "";
            if (confirmPwdEl) confirmPwdEl.value = "";
            if (pwErrorEl) { pwErrorEl.style.display = "none"; pwErrorEl.textContent = ""; }
        }

        function closeChangeModal() {
            changeModal.classList.add("hidden");
        }

        openChangeBtn.onclick = () => openChangeModal();
        if (closeChangeBtn) closeChangeBtn.onclick = () => closeChangeModal();
        if (cancelChangeBtn) cancelChangeBtn.onclick = () => closeChangeModal();
        changeModal.onclick = (e) => { if (e.target === changeModal) closeChangeModal(); };

        if (!submitChangeBtn) return;

        submitChangeBtn.onclick = async (e) => {
            e.preventDefault();
            if (!currentPwdEl || !newPwdEl || !confirmPwdEl) return;

            const oldPass = currentPwdEl.value.trim();
            const newPass = newPwdEl.value;
            const confirmPass = confirmPwdEl.value;

            // Basic validation: follow register requirements (short hint provided in modal)
            const hasLength = newPass.length >= 8;
            const hasLower = /[a-z]/.test(newPass);
            const hasUpper = /[A-Z]/.test(newPass);
            const hasNumber = /[0-9]/.test(newPass);
            const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(newPass);

            if (!oldPass) {
                pwErrorEl.textContent = "Enter current password.";
                pwErrorEl.style.display = "block";
                return;
            }

            if (!hasLength || !hasLower || !hasUpper || !hasNumber || !hasSpecial) {
                pwErrorEl.textContent = "New password does not meet complexity requirements.";
                pwErrorEl.style.display = "block";
                return;
            }

            if (newPass !== confirmPass) {
                pwErrorEl.textContent = "Passwords do not match.";
                pwErrorEl.style.display = "block";
                return;
            }

            // Disable button while processing
            submitChangeBtn.disabled = true;
            submitChangeBtn.textContent = "Updating...";

            try {
                const cred = firebase.auth.EmailAuthProvider.credential(user.email, oldPass);
                await user.reauthenticateWithCredential(cred);
                await user.updatePassword(newPass);
                alert("Password changed!");
                closeChangeModal();
            } catch (err) {
                pwErrorEl.textContent = err && err.code === "auth/wrong-password" ? "Current password is incorrect." : (err && err.message ? err.message : "Failed to change password.");
                pwErrorEl.style.display = "block";
            } finally {
                submitChangeBtn.disabled = false;
                submitChangeBtn.textContent = "Change Password";
            }
        };
    })();

    // Save profile
    document.getElementById("btnSaveProfile").onclick = async () => {
        const updates = {
            fullName: document.getElementById("inputFullName").value.trim(),
            specialty: document.getElementById("inputSpecialty").value.trim(),
            department: document.getElementById("inputDepartment").value.trim(),
            licenseId: document.getElementById("inputLicense").value.trim(),
            phone: document.getElementById("inputPhone").value.trim(),
            dob: document.getElementById("inputDob").value,
            gender: document.getElementById("inputGender").value
        };
        await db.collection("users").doc(userDocId).update(updates);
        alert("Profile saved!");
        location.reload();
    };

    // Delete account
    document.getElementById("btnDeleteAccount").onclick = async () => {
        if (!confirm("Delete your account forever?")) return;
        if (prompt("Type DELETE to confirm") !== "DELETE") return;
        await db.collection("users").doc(userDocId).delete();
        await user.delete();
        alert("Account deleted");
        window.location.href = "../html/index.html";
    };
}
