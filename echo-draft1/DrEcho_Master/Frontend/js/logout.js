firebase.auth().signOut().then(() => {
    window.location.href = "../html/index.html";
}).catch(() => {
    window.location.href = "../html/index.html";
});