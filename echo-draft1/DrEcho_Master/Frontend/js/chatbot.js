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
let sessionExtractedData = null;      

// ========== UI DISPLAY LOGIC (NEW) ==========

/**
 * Creates the HTML for a message row.
 * ECHO: Avatar (Left) + Bubble (Grey)
 * USER: Bubble (Blue) (Right)
 */
function appendMessage(sender, text) {
  const isBot = sender === "Echo";
  
  const rowDiv = document.createElement("div");
  rowDiv.classList.add("message-row");
  rowDiv.classList.add(isBot ? "bot" : "user");

  // 1. If Bot, add Avatar Image
  if (isBot) {
      const avatarImg = document.createElement("img");
      avatarImg.src = "../imgs/logo_echo.png"; // Uses your existing logo file
      avatarImg.alt = "Dr. Echo";
      avatarImg.classList.add("bot-avatar");
      rowDiv.appendChild(avatarImg);
  }

  // 2. Create the Text Bubble
  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("bubble");
  bubbleDiv.classList.add(isBot ? "bubble-bot" : "bubble-user");
  
  // Allow HTML for buttons/formatting, but simple text otherwise
  bubbleDiv.innerHTML = text;

  rowDiv.appendChild(bubbleDiv);

  // 3. Append to Chat Window
  messagesDiv.appendChild(rowDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showEchoTyping() {
  if (document.getElementById("echo-typing")) return;

  const rowDiv = document.createElement("div");
  rowDiv.id = "echo-typing";
  rowDiv.className = "message-row bot typing-container";

  // Avatar
  const avatarImg = document.createElement("img");
  avatarImg.src = "../imgs/logo_echo.png";
  avatarImg.className = "bot-avatar";
  
  // Bubbles
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

function appendTemplateButtonMessage(url) {
    // We wrap the button inside the standard message bubble
    const htmlContent = `
        <strong>Template ready.</strong><br/>
        I have prepared the CT/MRI Liver template based on our conversation.
        <button class="template-btn" onclick="window.location.href='${url}'">
            Open Prefilled Template
        </button>
    `;
    appendMessage("Echo", htmlContent);
}


// ========== CORE SESSION LOGIC (Same as before) ==========

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

        if (aiData) {
            messageDoc.extractedData = aiData.extracted_data || null;
            messageDoc.suggestedTemplate = aiData.suggested_template || aiData.suggestedTemplate || null;
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

    const resp = await fetch("http://localhost:8000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userID: currentUser.uid,
        chatDocId: sessionId,
        message: text,
        priorExtractedData: sessionExtractedData,
      }),
    });

    if (!resp.ok) throw new Error(`Backend HTTP status ${resp.status}`);
    const json = await resp.json();

    removeEchoTyping();
    await saveMessageToFirestore(sessionId, "bot", json.ai_message, json);

    appendMessage("Echo", json.ai_message);
    if (json.extracted_data) sessionExtractedData = json.extracted_data;

    const templateCode = json.suggested_template || json.suggestedTemplate;

    if (templateCode) {
      const url = `CT_MR_Liver_AI.html?sessionId=${encodeURIComponent(sessionId)}`;
      appendTemplateButtonMessage(url);
    }

  } catch (err) {
    removeEchoTyping();
    console.error("[chatbot] Error:", err);
    appendMessage("Echo", "Sorry, I encountered an error connecting to the server.");
  }
};

// Add this at the VERY END of chatbot.js
window.onload = () => {
    appendMessage("Echo", "Hello! I am Dr. Echo. I can help you generate a report template. Tell me the patient details and exam type.");
};