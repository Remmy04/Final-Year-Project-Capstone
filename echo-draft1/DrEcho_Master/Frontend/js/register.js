/* frontend/js/register.js */

document.addEventListener('DOMContentLoaded', function() {
  const passwordInput = document.getElementById('passwordInput');
  const confirmInput = document.getElementById('confirmInput');
  
  // Real-time password validation listeners
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
  // Validation rules
  const hasLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isMatch = password === confirm && password.length > 0;

  // Update checklist UI
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

// --- MAIN REGISTRATION LOGIC ---
document.getElementById("registerForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const fullname = this.fullname.value.trim();
  const email = this.email.value.trim();
  const password = this.password.value;
  const confirm = this.confirm_password.value;
  
  // Safety check for role selection
  const roleEl = document.querySelector("input[name='role']:checked");
  const role = roleEl ? roleEl.value : "Doctor"; 

  // 1. Final Password Validation
  const hasLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-\=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLength || !hasLower || !hasUpper || !hasNumber || !hasSpecial) {
    alert("Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.");
    return;
  }

  if (password !== confirm) {
    alert("Passwords do not match!");
    return;
  }

  try {
    // 2. Create Firebase Auth user (The Login Account)
    const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const authUid = userCred.user.uid;

    // 3. Generate Custom ID using your new tool!
    // This replaces the long transaction block.
    // Ensure <script src="../js/id_generator.js"></script> is in your HTML!
    const customUserId = await generateNextId('users', 'U'); 

    // 4. Save user profile to Firestore
    // KEY CHANGE: We use 'authUid' as the document ID for security/easy lookup.
    // We store the 'customUserId' inside the data fields.
    await firebase.firestore().collection("users").doc(authUid).set({
      authUid: authUid,       // Link to Authentication
      userId: customUserId,   // Your pretty ID (e.g., U000001)
      fullname: fullname,
      email: email,
      role: role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Registration successful! Your Doctor ID is " + customUserId);
    window.location.href = "../html/login.html";

  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
});