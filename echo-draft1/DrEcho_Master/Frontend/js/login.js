document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = this.email.value;
    const password = this.password.value;
    const role = document.querySelector("input[name='role']:checked").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCred) => {
            const authUid = userCred.user.uid;

            // Find user by authUid 
            return firebase.firestore().collection("users")
                .where("authUid", "==", authUid)
                .limit(1)
                .get();
        })
        .then((snapshot) => {
            if (snapshot.empty) throw new Error("User not found");
            const userDoc = snapshot.docs[0];
            const data = userDoc.data();

            if (data.role !== role) {
                alert("Incorrect role selected.");
                firebase.auth().signOut();
                return;
            }

            // Save userId to localStorage for display
            localStorage.setItem("currentUserId", data.userId || userDoc.id);

            window.location.href = "../html/index.html";
        })
        .catch((err) => {
            alert("Login failed: " + err.message);
        });
});