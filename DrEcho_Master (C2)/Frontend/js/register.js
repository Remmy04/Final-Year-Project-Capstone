/* frontend/js/register.js */

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput');
    const confirmInput = document.getElementById('confirmInput');

    // Real-time password validation
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            validatePassword(this.value, confirmInput ? confirmInput.value : '');
        });
    }

    if (confirmInput) {
        confirmInput.addEventListener('input', function() {
            validatePassword(passwordInput ? passwordInput.value : '', this.value);
        });
    }
});

function validatePassword(password, confirm) {
    const hasLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isMatch = password === confirm && password.length > 0;

    updateChecklistItem('pw-length', hasLength);
    updateChecklistItem('pw-lower', hasLower);
    updateChecklistItem('pw-upper', hasUpper);
    updateChecklistItem('pw-number', hasNumber);
    updateChecklistItem('pw-special', hasSpecial);
    updateChecklistItem('pw-match', isMatch);
}

function updateChecklistItem(elementId, isValid) {
    const element = document.getElementById(elementId);
    if (element) {
        if (isValid) {
            element.classList.remove('unchecked');
            element.classList.add('checked');
        } else {
            element.classList.remove('checked');
            element.classList.add('unchecked');
        }
    }
}

// ───────────────────────────────────────
// Multi-step logic
// ───────────────────────────────────────

const form = document.getElementById("registerForm");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const successMsg = document.getElementById("successMessage");
const nextBtn = document.getElementById("nextBtn");

let currentStep = 1;

function showStep(step) {
    step1.classList.remove("active");
    step2.classList.remove("active");
    successMsg.style.display = "none";

    if (step === 1) {
        step1.classList.add("active");
    } else if (step === 2) {
        step2.classList.add("active");
    }

    document.querySelectorAll(".step").forEach((el, i) => {
        el.classList.toggle("active", i + 1 === step);
    });
}

// ───────────────────────────────────────
// Email/Password flow (Step 1)
// ───────────────────────────────────────

nextBtn.addEventListener("click", async () => {
    const password = form.password.value;
    const confirm = form.confirm_password.value;

    const hasLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLength || !hasLower || !hasUpper || !hasNumber || !hasSpecial) {
        alert("Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    if (!form.fullname.value.trim() || !form.email.value.trim()) {
        alert("Please fill in full name and email.");
        return;
    }

    try {
        const email = form.email.value.trim();
        const passwordVal = form.password.value;
        const userCred = await firebase.auth().createUserWithEmailAndPassword(email, passwordVal);
        const authUid = userCred.user.uid;

        const customUserId = await generateNextId('users', 'U');

        await firebase.firestore().collection("users").doc(customUserId).set({
            authUid: authUid,
            userId: customUserId,
            fullName: form.fullname.value.trim(),
            email: email,
            role: "user",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            accountStatus: "pending",
            isApproved: false,
            signInMethod: "email"
        });

        localStorage.setItem("pendingUid", authUid);
        localStorage.setItem("pendingUserId", customUserId);

        currentStep = 2;
        showStep(2);

    } catch (err) {
        console.error(err);
        alert("Error creating account: " + err.message);
    }
});

// ───────────────────────────────────────
// Final Submit (Step 2)
// ───────────────────────────────────────

form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const uid = localStorage.getItem("pendingUid");
    const customUserId = localStorage.getItem("pendingUserId");
    if (!uid || !customUserId || !firebase.auth().currentUser || firebase.auth().currentUser.uid !== uid) {
        alert("Session expired. Please start over.");
        window.location.href = "register.html";
        return;
    }

    const profileData = {
        graduatedFrom: form.graduatedFrom.value.trim(),
        placeOfPractice: form.placeOfPractice.value.trim(),
        fullRegistration: form.fullRegistration.value.trim(),
        provisionalRegistration: form.provisionalRegistration.value.trim(),
        tpcNumber: form.tpcNumber.value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await firebase.firestore().collection("users").doc(customUserId).update(profileData);

        successMsg.style.display = "block";
        step1.style.display = "none";
        step2.style.display = "none";

        localStorage.removeItem("pendingUid");
        localStorage.removeItem("pendingUserId");

    } catch (err) {
        console.error(err);
        alert("Error saving profile: " + err.message);
    }
});

