// js/firebase-config.js

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDkDMGMIjo-rM57WbpPTv9wWGzyawDnjs0",
  authDomain: "echo-capstone.firebaseapp.com",
  projectId: "echo-capstone",
  storageBucket: "echo-capstone.appspot.com",
  messagingSenderId: "184580910397",
  appId: "1:184580910397:web:2acf3cff442500f151e954",
  measurementId: "G-47D2CH1DK3"
};

// Get the global Firebase object from window
const firebaseGlobal = window.firebase;

if (!firebaseGlobal) {
  console.error(
    "Firebase SDK not loaded. Check that firebase-app-compat.js and firebase-firestore-compat.js scripts are loading correctly."
  );
} else {
  // Initialize Firebase app only once
  if (!firebaseGlobal.apps.length) {
    firebaseGlobal.initializeApp(firebaseConfig);
  }

  // Expose Firestore instance globally
  window.db = firebaseGlobal.firestore();
  window.firebaseConfig = firebaseConfig;

  console.log("Firebase initialized. window.db =", window.db);
}
