// Access control check - prevent rejected and unapproved users
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
            window.location.href = "../html/login.html";
            return;
        }

        const userData = snap.docs[0].data();
        
        // Check if user is pending or rejected - redirect to profile
        if (userData.accountStatus === 'pending' || userData.accountStatus === 'rejected') {
            window.location.href = "../html/profile.html";
            return;
        }
    } catch (err) {
        console.error('Error checking user status:', err);
        window.location.href = "../html/login.html";
    }
});

// js/chatbot.js - Modern UI Version

console.log("[chatbot] script loaded");
const firestoreDB = window.db;
if (!firestoreDB) console.error("Firebase DB missing.");

// DOM elements
const sendBtn = document.getElementById("send-btn");
const msgInput = document.getElementById("message-input");
const messagesDiv = document.getElementById("messages");

// --- GLOBAL SESSION STATE ---
let currentSessionId = null;
// Initialize state as null, the backend will create the default empty map on the first turn
let sessionExtractedData = null;      

// ========== UI DISPLAY LOGIC ==========

function appendMessage(sender, text) {
  const isBot = sender === "Echo";
  
  const rowDiv = document.createElement("div");
  rowDiv.classList.add("message-row");
  rowDiv.classList.add(isBot ? "bot" : "user");

  if (isBot) {
      const avatarImg = document.createElement("img");
      avatarImg.src = "../imgs/logo_echo.png"; 
      avatarImg.alt = "Dr. Echo";
      avatarImg.classList.add("bot-avatar");
      rowDiv.appendChild(avatarImg);
  }

  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("bubble");
  bubbleDiv.classList.add(isBot ? "bubble-bot" : "bubble-user");
  bubbleDiv.innerHTML = text;

  rowDiv.appendChild(bubbleDiv);
  messagesDiv.appendChild(rowDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showEchoTyping() {
  if (document.getElementById("echo-typing")) return;

  const rowDiv = document.createElement("div");
  rowDiv.id = "echo-typing";
  rowDiv.className = "message-row bot typing-container";

  const avatarImg = document.createElement("img");
  avatarImg.src = "../imgs/logo_echo.png";
  avatarImg.className = "bot-avatar";
  
  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "typing-bubble";
  bubbleDiv.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;

  rowDiv.appendChild(avatarImg);
  rowDiv.appendChild(bubbleDiv);
  
  messagesDiv.appendChild(rowDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeEchoTyping() {
  const typing = document.getElementById("echo-typing");
  if (typing) typing.remove();
}

function appendTemplateButtonMessage(url, patientName) {
    // If we have a name, use it. Otherwise, fallback to "the patient" just in case.
    const nameDisplay = patientName ? patientName : "the patient";
    
    const htmlContent = `
        <strong>Template ready! 📝</strong><br/>
        I have gathered enough information for the Breast Mammography report for <b>${nameDisplay}</b>. Feel free to access and complete the template now.
        <br/><br/>
        <button class="template-btn" onclick="window.location.href='${url}'">
            Preview & Complete Template
        </button>
    `;
    appendMessage("Echo", htmlContent);
}

// ========== CORE SESSION LOGIC ==========

async function ensureSession() {
    if (currentSessionId) return currentSessionId;

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        appendMessage("Echo", "Please log in to start a chat session.");
        throw new Error("User not logged in");
    }

    try {
        let customUserId = "Unknown";
        const userSnap = await firestoreDB.collection('users').doc(currentUser.uid).get();
        if (userSnap.exists) {
            customUserId = userSnap.data().userId;
        }

        currentSessionId = await generateNextId('chatSessions', 'C');
        console.log("[chatbot] Starting new session:", currentSessionId);

        await firestoreDB.collection("chatSessions").doc(currentSessionId).set({
            sessionId: currentSessionId,
            userId: customUserId,
            authUid: currentUser.uid,
            userEmail: currentUser.email,
            startTime: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        return currentSessionId;
    } catch (err) {
        console.error("Session creation failed:", err);
        currentSessionId = null;
        throw err;
    }
}

async function saveMessageToFirestore(sessionId, role, text, aiData = null) {
    try {
        const messageId = await generateNextId('messages', 'M');

        const messageDoc = {
            messageId: messageId,
            role: role,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save the updated JSON state to Firestore so the prefill script can grab it later
        if (aiData && aiData.extracted_data) {
            messageDoc.extractedData = aiData.extracted_data;
        }

        await firestoreDB.collection("chatSessions").doc(sessionId)
                         .collection("messages").doc(messageId)
                         .set(messageDoc);

        await firestoreDB.collection("chatSessions").doc(sessionId).update({
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        return messageDoc;
    } catch (err) {
        console.error("Error saving message:", err);
        throw err;
    }
}

// ========== Main Send Handler ==========

sendBtn.onclick = async () => {
  const text = msgInput.value.trim();
  if (!text) return;

  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
       appendMessage("Echo", "Please log in."); return;
  }

  appendMessage("You", text);
  msgInput.value = "";
  showEchoTyping(); 

  try {
    const sessionId = await ensureSession();
    await saveMessageToFirestore(sessionId, "user", text);

    // Call the updated FastAPI endpoint
    const resp = await fetch("http://localhost:8000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.uid,
        message: text,
        current_state: sessionExtractedData // Pass the memory back to the AI
      }),
    });

    if (!resp.ok) throw new Error(`Backend HTTP status ${resp.status}`);
    const json = await resp.json();

    removeEchoTyping();
    
    // Read the new bot_reply format
    const botText = json.bot_reply;
    
    await saveMessageToFirestore(sessionId, "bot", botText, json);
    appendMessage("Echo", botText);
    
    // Update our frontend memory with the AI's newly extracted data
    if (json.extracted_data) {
        sessionExtractedData = json.extracted_data;
        console.log("Current Extraction State:", sessionExtractedData);
    }

    // Dynamic Trigger: If the AI says it's ready, show the button and pass the name
    if (sessionExtractedData && sessionExtractedData.is_ready_for_template === true) {
      const url = `Breast_Mammography_AI.html?sessionId=${encodeURIComponent(sessionId)}`;
      
      // Pass the patient's name to make the message friendly!
      appendTemplateButtonMessage(url, sessionExtractedData.patient_name);
    }

  } catch (err) {
    removeEchoTyping();
    console.error("[chatbot] Error:", err);
    appendMessage("Echo", "Sorry, I encountered an error connecting to the server.");
  }
};

// Pressing Enter to send
msgInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendBtn.click();
  }
});

window.onload = () => {
    // A natural, open-ended greeting
    appendMessage("Echo", "Hello! I am Dr. Echo, your AI Radiology Assistant. How can I help you today?");
};