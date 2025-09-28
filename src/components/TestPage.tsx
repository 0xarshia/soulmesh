import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { ttsService } from '../ttsService';
import { apiService } from '../services/apiService';

const TestPage = () => {
  const navigate = useNavigate();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const chatMessages = [
    { id: 1, sender: 'them', text: 'Hey! How was your day?', time: '2:30 PM' },
    { id: 2, sender: 'me', text: 'ok', time: '2:45 PM', isAwkward: true },
    { id: 3, sender: 'them', text: 'Just ok? What did you do today?', time: '2:46 PM' },
    { id: 4, sender: 'me', text: 'nothing much', time: '3:00 PM', isAwkward: true },
    { id: 5, sender: 'them', text: 'I went to this amazing coffee shop downtown. The latte art was incredible! Do you like coffee?', time: '3:02 PM' },
    { id: 6, sender: 'me', text: 'ya coffee is good', time: '3:15 PM', isAwkward: true },
    { id: 7, sender: 'them', text: 'Cool! Maybe we could check out a coffee place together sometime? I know this place with the best pastries too', time: '3:17 PM' },
    { id: 8, sender: 'me', text: 'idk maybe', time: '3:30 PM', isAwkward: true },
    { id: 9, sender: 'them', text: 'What kind of things do you enjoy doing in your free time?', time: '3:35 PM' },
    { id: 10, sender: 'me', text: 'not much really', time: '3:50 PM', isAwkward: true },
  ];

  useEffect(() => {
    // Inject the extension functionality when component mounts
    injectSoulMeshExtension();
    
    return () => {
      // Cleanup when component unmounts
      cleanupExtension();
    };
  }, []);

  const injectSoulMeshExtension = () => {
    // =================================================================
    // SECTION 1: VOICE MODE STATE & HELPERS
    // =================================================================
    let recognition = null;
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let animationFrameId = null;
    let isVoiceModeActive = false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // =================================================================
    // SECTION 2: UI ELEMENTS & STYLES
    // =================================================================

    // root container
    const root = document.createElement("div");
    root.id = "soulmesh-overlay-root";
    root.style.position = "fixed";
    root.style.top = "0";
    root.style.right = "1%";
    root.style.width = "20vw";
    root.style.height = "100vh";
    root.style.zIndex = "2147483647";
    root.style.display = "flex";
    root.style.justifyContent = "flex-end";
    root.style.alignItems = "flex-start";
    root.style.pointerEvents = "none";
    root.style.paddingTop = "20px";
    document.documentElement.appendChild(root);

    // styles (glassy, modern)
    const style = document.createElement("style");
    style.id = "soulmesh-styles";
    style.textContent = `
      #soulmesh-overlay-root * { box-sizing: border-box; }
      #soulmesh-overlay {
        pointer-events: auto;
        width: 100%;
        height: calc(100vh - 40px);
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,10));
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(20px) saturate(120%);
        -webkit-backdrop-filter: blur(20px) saturate(120%);
        box-shadow: 0 30px 80px rgba(0,0,0,0.6);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #fff;
      }
      #soulmesh-header {
        display:flex;
        align-items:center;
        gap:12px;
        padding:14px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.03);
        background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
      }
      #soulmesh-title {
        font-weight: 800;
        font-size: 20px;
        letter-spacing: 0.6px;
        background: linear-gradient(135deg, #007AFF, #5AC8FA);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-family: "Gill Sans", "Segoe UI", "Helvetica Neue", Arial;
        text-shadow: 0 1px 0 rgba(255,255,255,0.5);
      }
      #soulmesh-sub { font-size:12px; opacity:0.7; margin-left:6px; color: rgba(255,255,255,0.7); }
      .soulmesh-controls { margin-left:auto; display:flex; gap:8px; align-items:center; }

      #soulmesh-chat { flex:1; overflow:auto; padding:14px; display:flex; flex-direction:column; gap:12px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.01)); }
      .msg { max-width:86%; padding:10px 14px; border-radius:14px; font-size:14px; line-height:1.35; word-break:break-word; }
      .msg.user { align-self:flex-end; background: linear-gradient(180deg, #007AFF, #0056CC); border:1px solid rgba(255,255,255,0.1); color:#fff; }
      .msg.ai { align-self:flex-start; background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); color:#fff; border:1px solid rgba(255,255,255,0.1); }
      .msg.typing { align-self:flex-start; background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); color:#ccc; border:1px solid rgba(255,255,255,0.1); }

      #soulmesh-input-row { padding:16px; display:flex; gap:8px; align-items:flex-end; border-top: 1px solid rgba(255,255,255,0.03); background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.005)); }
      #soulmesh-input { flex:1; min-height:56px; max-height:140px; padding:14px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.1); color:#fff; resize:none; font-size:16px; outline:none; }
      #soulmesh-input::-webkit-scrollbar { width: 8px; }
      #soulmesh-input::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 4px; }
      #soulmesh-input::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.6); border-radius: 4px; }
      #soulmesh-input::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.8); }
      .btn { padding:8px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.1); cursor:pointer; color:#ccc; font-weight:700; }
      .btn.small { padding:6px 8px; font-size:13px; border-radius:8px; }
      #soulmesh-clear { opacity:0.9; }
      #soulmesh-send { background: linear-gradient(180deg, #007AFF, #0056CC); color:#fff; border:1px solid rgba(255,255,255,0.1); font-weight:800; padding:10px 14px; border-radius:12px; }

      .mic-btn { width:44px;height:44px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.1); cursor:pointer; font-size:14px; color:#ccc; margin-right:8px; }
      .mic-btn img { width:20px; height:20px; filter: brightness(0) invert(1); }
      #soulmesh-close { position:absolute; right:12px; top:12px; width:36px;height:36px;border-radius:10px; display:inline-flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.1); cursor:pointer; color:#ccc; font-size:16px; }
      #soulmesh-chat::-webkit-scrollbar { width:10px; } #soulmesh-chat::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius:8px; }
      
      .typing-dots { display: inline-flex; align-items: center; gap: 4px; }
      .typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #666; animation: typing 1.4s infinite ease-in-out; }
      .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
      .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
      .typing-dots span:nth-child(3) { animation-delay: 0s; }
      
      @keyframes typing { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
      
      /* --- NEW STYLES FOR VOICE MODE --- */
      #soulmesh-voice-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 2147483647; /* Max z-index */
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        pointer-events: auto;
      }
      #soulmesh-voice-exit {
        position: absolute;
        top: 30px;
        right: 40px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255,255,255,0.1);
        color: #fff;
        border: 1px solid rgba(255,255,255,0.2);
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 20px;
        font-weight: bold;
      }
      #soulmesh-visualizer-container {
        position: relative;
        width: 200px;
        height: 200px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .visualizer-ring {
        position: absolute;
        border-radius: 50%;
        border: 2px solid;
        transition: transform 0.1s ease-out, opacity 0.1s;
        transform-origin: center;
      }
      #v-ring1 { width: 100px; height: 100px; border-color: rgba(0, 122, 255, 0.8); box-shadow: 0 0 20px rgba(0, 122, 255, 0.5); }
      #v-ring2 { width: 150px; height: 150px; border-color: rgba(90, 200, 250, 0.5); box-shadow: 0 0 30px rgba(90, 200, 250, 0.3); opacity: 0.8; }
      #v-ring3 { width: 200px; height: 200px; border-color: rgba(88, 86, 214, 0.3); box-shadow: 0 0 40px rgba(88, 86, 214, 0.2); opacity: 0.6; }
      #soulmesh-voice-mic-img {
        width: 50px;
        height: 50px;
        filter: brightness(0) invert(1) drop-shadow(0 0 10px rgba(255,255,255,0.5));
        z-index: 10;
      }
      #soulmesh-voice-status {
          margin-top: 40px;
          color: rgba(255,255,255,0.7);
          font-size: 16px;
          min-height: 24px;
      }

      /* Text Copy Extension Styles */
      #text-copy-button {
        font-weight: 500;
        letter-spacing: 0.5px;
        border: none;
        outline: none;
      }

      #text-copy-button:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }

      #text-copy-button:active {
        transform: scale(0.95) !important;
      }

      /* Ensure button is always on top */
      div[style*="z-index: 999999"] {
        z-index: 999999 !important;
      }
    `;
    document.head.appendChild(style);

    // panel
    const panel = document.createElement("div");
    panel.id = "soulmesh-overlay";

    // header
    const header = document.createElement("div");
    header.id = "soulmesh-header";

    const title = document.createElement("div");
    title.id = "soulmesh-title";
    title.textContent = "SoulMesh";

    const sub = document.createElement("div");
    sub.id = "soulmesh-sub";

    header.appendChild(title);
    header.appendChild(sub);

    // controls
    const controls = document.createElement("div");
    controls.className = "soulmesh-controls";

    header.appendChild(controls);
    panel.appendChild(header);

    // chat area
    const chatArea = document.createElement("div");
    chatArea.id = "soulmesh-chat";

    // load history (limited)
    try {
      const raw = localStorage.getItem("soulmesh_chat_history");
      const arr = raw ? JSON.parse(raw) : [];
      arr.forEach(item => {
        const m = document.createElement("div");
        m.className = "msg " + (item.from === "user" ? "user" : "ai");
        m.textContent = item.text;
        chatArea.appendChild(m);
      });
    } catch (e) {
      console.error("history load err", e);
    }

    // input row
    const inputRow = document.createElement("div");
    inputRow.id = "soulmesh-input-row";

    const input = document.createElement("textarea");
    input.id = "soulmesh-input";
    input.placeholder = "i have question about my message that im going to send to her/him here ...";
    input.rows = 2;

    // mic button (moved to input row)
    const micBtn = document.createElement("div");
    micBtn.className = "mic-btn";
    micBtn.title = "Start Voice Chat";
    const micImg = document.createElement("img");
    // Using a self-contained Base64 URI for the icon to avoid path issues
    micImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDFhMyAzIDAgMCAwLTMgM3Y4YTMgMyAwIDAgMCA2IDBWOEEzIDMgMCAwIDAgMTIgMVoiPjwvcGF0aD48cGF0aCBkPSJNMTkgMTBhNyA3IDAgMCAxLTE0IDBWMTMiPjwvcGF0aD48bGluZSB4MT0iMTIiIHkxPSIxOSIgeDI9IjEyIiB5Mj0iMjMiPjwvbGluZT48bGluZSB4MT0iOCIgeTE9IjIzIiB4Mj0iMTYiIHkyPSIyMyI+PC9saW5lPjwvc3ZnPg==";
    micImg.alt = "Mic";
    micBtn.appendChild(micImg);
    // Attach the main event listener
    micBtn.addEventListener("click", startVoiceMode);

    const sendBtn = document.createElement("button");
    sendBtn.className = "btn";
    sendBtn.id = "soulmesh-send";
    sendBtn.textContent = "Send";

    // close button
    const closeBtn = document.createElement("div");
    closeBtn.id = "soulmesh-close";
    closeBtn.innerText = "✕";
    closeBtn.addEventListener("click", () => root.remove());

    // append children
    inputRow.appendChild(input);
    inputRow.appendChild(micBtn);
    inputRow.appendChild(sendBtn);
    panel.appendChild(chatArea);
    panel.appendChild(inputRow);
    panel.appendChild(closeBtn);

    const clearBtnBottom = document.createElement("button");
    clearBtnBottom.className = "btn small";
    clearBtnBottom.textContent = "Clear";
    clearBtnBottom.style.position = "absolute";
    clearBtnBottom.style.right = "60px";
    clearBtnBottom.style.top = "12px";
    clearBtnBottom.addEventListener("click", () => {
      localStorage.removeItem("soulmesh_chat_history");
      const chat = document.getElementById("soulmesh-chat");
      if (chat) chat.innerHTML = "";
    });
    panel.appendChild(clearBtnBottom);

    root.appendChild(panel);

    setTimeout(() => input.focus(), 80);
    chatArea.scrollTop = chatArea.scrollHeight;

    // =================================================================
    // SECTION 3: CORE CHAT LOGIC
    // =================================================================

    function appendMessage(from, text) {
      const m = document.createElement("div");
      m.className = "msg " + (from === "user" ? "user" : "ai");
      m.textContent = text;
      chatArea.appendChild(m);
      chatArea.scrollTop = chatArea.scrollHeight;
    }

    function appendTypingMessage() {
      const typingId = "typing-" + Date.now();
      const m = document.createElement("div");
      m.id = typingId;
      m.className = "msg typing";
      m.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
      chatArea.appendChild(m);
      chatArea.scrollTop = chatArea.scrollHeight;
      return typingId;
    }

    function saveHistory(from, text) {
      try {
        const raw = localStorage.getItem("soulmesh_chat_history");
        const arr = raw ? JSON.parse(raw) : [];
        arr.push({ from, text, ts: Date.now() });
        while (arr.length > 40) arr.shift();
        localStorage.setItem("soulmesh_chat_history", JSON.stringify(arr));
      } catch (e) { console.error(e); }
    }

    async function getAiResponse(text) {
        const prompt = `i have question about my message that im going to send to her/him here  i want to ask you please give me strategies and ways to reply thats aligning with your main goal of purpose which is being confident and non cringy, little creative too, dont be simp too and etc etc... my question is {$chat input text}`.replace("{$chat input text}", text);

        // In text chat, show typing indicator
        let typingId = null;
        if (!isVoiceModeActive) {
            typingId = appendTypingMessage();
            sendBtn.textContent = "Thinking...";
            sendBtn.disabled = true;
        } else {
             document.getElementById("soulmesh-voice-status").textContent = "Thinking...";
        }

        try {
            const data = await apiService.getChatResponse(prompt, false);
            let aiText = (data && typeof data.content === 'string' && data.content.trim()) ? data.content : "Sorry, I couldn't get a proper response.";

            if (!isVoiceModeActive) {
                if (typingId) document.getElementById(typingId)?.remove();
                appendMessage("ai", aiText);
                saveHistory("ai", aiText);
            } else {
                // In voice mode, speak the response
                await speakText(aiText);
            }

        } catch (err) {
            console.error("API error:", err);
            const errorMsg = "Error fetching reply.";
            if (!isVoiceModeActive) {
                if (typingId) document.getElementById(typingId)?.remove();
                appendMessage("ai", errorMsg);
                saveHistory("ai", errorMsg);
            } else {
                 document.getElementById("soulmesh-voice-status").textContent = "API Error. Try again.";
                 setTimeout(() => recognition.start(), 2000); // restart listening after error
            }
        } finally {
            if (!isVoiceModeActive) {
                sendBtn.textContent = "Send";
                sendBtn.disabled = false;
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }
    }

    sendBtn.addEventListener("click", async () => {
      const text = input.value.trim();
      if (!text) return;

      appendMessage("user", text);
      saveHistory("user", text);
      input.value = "";
      chatArea.scrollTop = chatArea.scrollHeight;
      
      await getAiResponse(text);
    });

    // =================================================================
    // SECTION 4: VOICE MODE LOGIC
    // =================================================================

     // Network status handlers (defined outside function for proper cleanup)
     let handleOnline, handleOffline;
     
     function startVoiceMode() {
         if (!SpeechRecognition) {
             alert("Sorry, your browser doesn't support the Web Speech API. Please use Chrome, Edge, or Safari.");
             return;
         }
         
         // Check if we're in a secure context (HTTPS or localhost)
         if (!window.isSecureContext) {
             alert("Speech recognition requires a secure context (HTTPS or localhost). Please use HTTPS or localhost.");
             return;
         }
         
         // Check network connectivity
         if (!navigator.onLine) {
             alert("No internet connection detected. Speech recognition requires internet access.");
             return;
         }
         
         isVoiceModeActive = true;
         panel.style.display = 'none'; // Hide chat panel

        // Create voice overlay
        const voiceOverlay = document.createElement("div");
        voiceOverlay.id = "soulmesh-voice-overlay";
        voiceOverlay.innerHTML = `
            <div id="soulmesh-voice-exit">✕</div>
            <div id="soulmesh-visualizer-container">
                <div id="v-ring1" class="visualizer-ring"></div>
                <div id="v-ring2" class="visualizer-ring"></div>
                <div id="v-ring3" class="visualizer-ring"></div>
                <img id="soulmesh-voice-mic-img" src="${micImg.src}" alt="Microphone" />
            </div>
            <div id="soulmesh-voice-status">Listening...</div>
        `;
        document.body.appendChild(voiceOverlay);
        document.getElementById("soulmesh-voice-exit").addEventListener('click', stopVoiceMode);

         // --- Setup Speech Recognition ---
         recognition = new SpeechRecognition();
         recognition.continuous = true; // Keep listening
         recognition.interimResults = true; // Enable interim results for immediate response
         recognition.lang = 'en-US';
         recognition.maxAlternatives = 1;

         recognition.onstart = () => {
             console.log('Speech recognition started');
             document.getElementById("soulmesh-voice-status").textContent = "Listening...";
         };

         // Handle interim results - stop AI talking immediately when user starts speaking
         recognition.onresult = (event) => {
             // Check if this is an interim result (user is still speaking)
             const isInterim = event.results[event.results.length - 1].isFinal === false;
             
             if (isInterim) {
                 // User is speaking - stop AI immediately
                 ttsService.stop();
                 document.getElementById("soulmesh-voice-status").textContent = "You're speaking...";
                 return; // Don't process interim results
             }
             
             // This is a final result - process it
             const userText = event.results[event.results.length - 1][0].transcript;
             console.log('Recognized:', userText);
             
             // Stop AI from talking immediately when user starts speaking
             ttsService.stop();
             
             document.getElementById("soulmesh-voice-status").textContent = `You said: "${userText}"`;
             
             // Stop recognition temporarily while processing
             recognition.stop();
             
             // Start thinking immediately
             document.getElementById("soulmesh-voice-status").textContent = "Thinking...";
             getAiResponse(userText);
         };

         recognition.onerror = (event) => {
             console.error('Speech recognition error:', event.error, event);
             
             if (event.error === 'not-allowed') {
                 document.getElementById("soulmesh-voice-status").textContent = "Microphone permission denied. Please allow microphone access.";
             } else if (event.error === 'no-speech') {
                 document.getElementById("soulmesh-voice-status").textContent = "No speech detected. Please try again.";
                 if(isVoiceModeActive) setTimeout(() => recognition.start(), 2000);
             } else if (event.error === 'audio-capture') {
                 document.getElementById("soulmesh-voice-status").textContent = "No microphone found. Please check your microphone.";
             } else if (event.error === 'network') {
                 document.getElementById("soulmesh-voice-status").textContent = "Network error. Retrying in 5 seconds...";
                 if(isVoiceModeActive) {
                     setTimeout(() => {
                         try {
                             recognition.start();
                         } catch (retryError) {
                             console.error('Network retry failed:', retryError);
                             document.getElementById("soulmesh-voice-status").textContent = "Network unavailable. Please use text chat.";
                         }
                     }, 5000);
                 }
             } else if (event.error === 'aborted') {
                 document.getElementById("soulmesh-voice-status").textContent = "Speech recognition was interrupted.";
                 if(isVoiceModeActive) setTimeout(() => recognition.start(), 1000);
             } else if (event.error === 'language-not-supported') {
                 document.getElementById("soulmesh-voice-status").textContent = "Language not supported. Please try again.";
             } else {
                 document.getElementById("soulmesh-voice-status").textContent = `Speech recognition error: ${event.error}. Please try again.`;
                 if(isVoiceModeActive) setTimeout(() => recognition.start(), 3000);
             }
         };

         recognition.onend = () => {
             console.log('Speech recognition ended');
             // Only restart if we're still in voice mode and not processing
             if(isVoiceModeActive && !document.getElementById("soulmesh-voice-status").textContent.includes("Thinking")) {
                 setTimeout(() => recognition.start(), 1000);
             }
         };

         // --- Setup Audio Visualizer ---
         setupAudioVisualizer();
         
         // Define network status handlers
         handleOnline = () => {
             if (isVoiceModeActive && recognition) {
                 console.log('Network reconnected, restarting speech recognition...');
                 document.getElementById("soulmesh-voice-status").textContent = "Network reconnected. Restarting...";
                 setTimeout(() => {
                     try {
                         recognition.start();
                     } catch (error) {
                         console.error('Failed to restart after network reconnect:', error);
                     }
                 }, 1000);
             }
         };
         
         handleOffline = () => {
             if (isVoiceModeActive) {
                 document.getElementById("soulmesh-voice-status").textContent = "Network disconnected. Speech recognition paused.";
             }
         };
         
         window.addEventListener('online', handleOnline);
         window.addEventListener('offline', handleOffline);
         
         // Start recognition after a short delay to ensure everything is set up
         setTimeout(() => {
             try {
                 recognition.start();
                 console.log('Attempting to start speech recognition...');
             } catch (error) {
                 console.error('Failed to start speech recognition:', error);
                 document.getElementById("soulmesh-voice-status").textContent = "Failed to start speech recognition. Please try again.";
                 
                 // Try again after a longer delay
                 setTimeout(() => {
                     if (isVoiceModeActive) {
                         try {
                             recognition.start();
                         } catch (retryError) {
                             console.error('Retry failed:', retryError);
                             document.getElementById("soulmesh-voice-status").textContent = "Speech recognition unavailable. Please use text chat.";
                         }
                     }
                 }, 3000);
             }
         }, 500);
    }

     function stopVoiceMode() {
         isVoiceModeActive = false;

         // 1. Remove network event listeners
         if (handleOnline) window.removeEventListener('online', handleOnline);
         if (handleOffline) window.removeEventListener('offline', handleOffline);

         // 2. Stop Speech Recognition
         if (recognition) {
             recognition.stop();
             recognition = null;
         }

        // 3. Stop TTS Service
        ttsService.stop();

        // 4. Stop Visualizer Animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // 5. Stop Microphone Track & Audio Context
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        // 6. Remove UI
        const voiceOverlay = document.getElementById("soulmesh-voice-overlay");
        if (voiceOverlay) voiceOverlay.remove();
        panel.style.display = 'flex'; // Show chat panel again
    }

     function setupAudioVisualizer() {
         // Check if we already have microphone access
         if (micStream) {
             // Reuse existing stream
             audioContext = new AudioContext();
             analyser = audioContext.createAnalyser();
             const source = audioContext.createMediaStreamSource(micStream);
             source.connect(analyser);
             analyser.fftSize = 256;
             updateVisualizer();
             return;
         }

         navigator.mediaDevices.getUserMedia({ audio: true })
             .then(stream => {
                 micStream = stream;
                 audioContext = new AudioContext();
                 analyser = audioContext.createAnalyser();
                 const source = audioContext.createMediaStreamSource(stream);
                 source.connect(analyser);
                 analyser.fftSize = 256;
                 updateVisualizer();
             })
             .catch(err => {
                 console.error('Error accessing microphone:', err);
                 document.getElementById("soulmesh-voice-status").textContent = "Microphone access denied.";
             });
     }

    function updateVisualizer() {
        if (!analyser) return;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray); // Get waveform data

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // Normalize to -1.0 to 1.0
            sum += (v - 1) * (v - 1); // Calculate RMS
        }
        const volume = Math.sqrt(sum / bufferLength);

        const scale = 1 + volume * 2; // Amplify the effect

        // Apply scaling to visualizer rings
        const ring1 = document.getElementById('v-ring1');
        const ring2 = document.getElementById('v-ring2');
        const ring3 = document.getElementById('v-ring3');

        if (ring1) ring1.style.transform = `scale(${scale * 1.1})`;
        if (ring2) ring2.style.transform = `scale(${scale * 1.05})`;
        if (ring3) ring3.style.transform = `scale(${scale})`;

        animationFrameId = requestAnimationFrame(updateVisualizer);
    }

     async function speakText(text) {
         const statusElem = document.getElementById("soulmesh-voice-status");
         
         try {
             // Set up TTS event handlers
             ttsService.onStart = () => {
                 if(statusElem) statusElem.textContent = "Speaking...";
             };

             ttsService.onEnd = () => {
                 if (isVoiceModeActive) {
                     if(statusElem) statusElem.textContent = "Listening...";
                     // Restart recognition after speaking is done - faster response
                     setTimeout(() => {
                         if (recognition && isVoiceModeActive) {
                             recognition.start();
                         }
                     }, 200); // Reduced from 500ms to 200ms
                 }
             };

             ttsService.onError = (error) => {
                 console.error('TTS Error:', error);
                 if (isVoiceModeActive) {
                     if(statusElem) statusElem.textContent = "Speaking error. Listening...";
                     setTimeout(() => {
                         if (recognition && isVoiceModeActive) {
                             recognition.start();
                         }
                     }, 300); // Reduced from 1000ms to 300ms
                 }
             };

             // Use LobeHub TTS service
             await ttsService.speak(text);
         } catch (error) {
             console.error('TTS Error:', error);
             if (isVoiceModeActive) {
                 if(statusElem) statusElem.textContent = "Speaking error. Listening...";
                 setTimeout(() => {
                     if (recognition && isVoiceModeActive) {
                         recognition.start();
                     }
                 }, 300);
             }
         }
     }

    // =================================================================
    // SECTION 5: TEXT COPY EXTENSION LOGIC
    // =================================================================

    let copyButton;
    let answerButtons = [];

    // Create main copy button
    function createCopyButton() {
      copyButton = document.createElement("button");
      styleButton(copyButton, 1); // 1 = main button
      copyButton.textContent = "Copy";

      document.body.appendChild(copyButton);

      copyButton.addEventListener("click", async () => {
        const text = window.getSelection().toString();
        if (!text) return;

        copyButton.textContent = "Fetching answers...";
        
        try {
          // Call API service for reply suggestions
          const data = await apiService.getReplySuggestions(text);

          // Remove main button
          copyButton.style.display = "none";

          // Show answer buttons
          showAnswerButtons(data, window.getSelection().getRangeAt(0).getBoundingClientRect());
        } catch (err) {
          console.error(err);
          copyButton.textContent = "Error!";
          setTimeout(() => (copyButton.style.display = "none"), 1500);
        }
      });
    }

    // Create answer buttons at selection
    function showAnswerButtons(apiData, rect) {
      console.log("API Response:", apiData);
      
      let answers = [];
      
      try {
        // Check if we have the expected structure with content field
        if (apiData.content) {
          // Extract JSON from the content string
          const content = apiData.content;
          console.log("Content field:", content);
          
          // Look for JSON block in the content
          const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            const jsonString = jsonMatch[1];
            console.log("Extracted JSON string:", jsonString);
            
            // Parse the JSON
            const parsedAnswers = JSON.parse(jsonString);
            console.log("Parsed answers:", parsedAnswers);
            
            answers = [
              parsedAnswers["Answer1"],
              parsedAnswers["Answer2"],
              parsedAnswers["Answer3"],
              parsedAnswers["Answer4"],
              parsedAnswers["Answer5"],
              parsedAnswers["Answer6"]
            ].filter(Boolean); // Remove any undefined/null values
          } else {
            // Fallback: try to parse the entire content as JSON
            const parsedContent = JSON.parse(content);
            answers = [
              parsedContent["Answer1"],
              parsedContent["Answer2"],
              parsedContent["Answer3"],
              parsedContent["Answer4"],
              parsedContent["Answer5"],
              parsedContent["Answer6"]
            ].filter(Boolean);
          }
        } else {
          // Direct access to answer keys
          answers = [
            apiData["Answer1"],
            apiData["Answer2"],
            apiData["Answer3"],
            apiData["Answer4"],
            apiData["Answer5"],
            apiData["Answer6"]
          ].filter(Boolean);
        }
      } catch (error) {
        console.error("Error parsing API response:", error);
        copyButton.textContent = "Error parsing response";
        copyButton.style.display = "block";
        return;
      }

      console.log("Final answers:", answers);

      if (answers.length === 0) {
        console.error("No answers found in API response");
        copyButton.textContent = "No answers found";
        copyButton.style.display = "block";
        return;
      }

      answers.forEach((ans, i) => {
        const btn = document.createElement("button");
        styleButton(btn, 2); // 2 = smaller answer buttons
        btn.textContent = ans;
        btn.style.left = `${rect.left + window.scrollX}px`;
        btn.style.top = `${rect.bottom + (i * 75) + window.scrollY}px`; // Increased spacing to match bigger buttons
        btn.style.width = "437px"; // 25% bigger width (350 * 1.25)
        btn.style.height = "62px"; // 25% bigger height (50 * 1.25)
        btn.style.maxWidth = "437px"; // Consistent max width
        btn.style.wordWrap = "break-word";
        btn.style.whiteSpace = "normal";
        btn.style.textAlign = "center";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.padding = "8px 16px"; // Consistent padding

        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(ans);
          cleanupButtons();
        });

        document.body.appendChild(btn);
        answerButtons.push(btn);
      });
    }

    // Cleanup all buttons
    function cleanupButtons() {
      if (copyButton) copyButton.style.display = "none";
      answerButtons.forEach(b => b.remove());
      answerButtons = [];
    }

    // Button styling helper
    function styleButton(btn, type) {
      // type 1 = main, type 2 = smaller answers
      btn.style.position = "absolute";
      btn.style.zIndex = "9999";
      btn.style.padding = type === 1 ? "12px 21px" : "12px 24px"; // 2x smaller for main button
      btn.style.fontSize = type === 1 ? "21px" : "18px"; // 2x smaller font for main button
      btn.style.fontFamily = "Arial, sans-serif";
      btn.style.fontWeight = "500";
      btn.style.color = "#fff";
      btn.style.border = "2px solid hsla(270, 9.10%, 95.70%, 0.25)";
      btn.style.borderRadius = "18px"; // 2x smaller border radius
      btn.style.background = "rgba(0, 0, 0, 0.6)";
      btn.style.backdropFilter = "blur(10px)";
      btn.style.webkitBackdropFilter = "blur(10px)";
      btn.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.25)";
      btn.style.cursor = "pointer";
      btn.style.transition = "all 0.1s ease";

      btn.addEventListener("mouseenter", () => {
        btn.style.background = "rgba(0, 0, 0, 0.8)";
        btn.style.transform = "scale(1.05)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = "rgba(0, 0, 0, 0.6)";
        btn.style.transform = "scale(1)";
      });
    }

    // Show copy button on selection
    document.addEventListener("mouseup", (e) => {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText.length > 0) {
        if (!copyButton) createCopyButton();

        copyButton.style.display = "block";
        const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
        copyButton.style.left = `${rect.left + window.scrollX}px`;
        copyButton.style.top = `${rect.top + window.scrollY - 50}px`;
        copyButton.textContent = "Reply";
      } else {
        cleanupButtons();
      }
    });

    // Store cleanup function globally for component unmount
    window.soulMeshCleanup = () => {
      cleanupButtons();
      ttsService.stop(); // Stop TTS service on cleanup
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  };

  const cleanupExtension = () => {
    if (window.soulMeshCleanup) {
      window.soulMeshCleanup();
    }
  };

  const handleMessageClick = (message) => {
    if (message.isAwkward) {
      setSelectedMessage(message);
      setShowSuggestions(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-pink-500 rounded-full opacity-35 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full opacity-35 blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
                SoulMesh AI - Test Environment
              </span>
            </div>
          </div>
          
          <div className="hidden md:block px-4 py-2 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
            <span className="text-gray-300 text-sm">Select text to see AI suggestions • SoulMesh AI chat available on right</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6">
        <div className="flex justify-center">
          {/* Chat Interface */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden max-w-2xl w-full">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">A</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Alex</h3>
                  <p className="text-gray-400 text-sm">Online now</p>
                </div>
              </div>
            </div>
            
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                      message.sender === 'me'
                        ? message.isAwkward
                          ? 'bg-red-900/50 border border-red-500/30 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20'
                          : 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-white/10 hover:bg-white/15'
                    }`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <p className="text-white text-sm">{message.text}</p>
                    <p className="text-gray-400 text-xs mt-1">{message.time}</p>
                    {message.isAwkward && (
                      <div className="mt-2 flex items-center space-x-2 text-red-400">
                        <span className="text-xs">Select this text to see AI suggestions</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/10">
              <div className="flex items-center space-x-3">
                <div className="flex-1 px-4 py-3 bg-white/10 rounded-xl border border-white/20">
                  <span className="text-gray-400">Type a message...</span>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-semibold hover:scale-105 transition-transform duration-300">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-lg rounded-2xl border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-3">How it works:</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Select Message</p>
                <p className="text-gray-400 text-xs">Select any message text you received</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Get Suggestions</p>
                <p className="text-gray-400 text-xs">AI generates perfect replies</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Paste</p>
                <p className="text-gray-400 text-xs">Paste your chosen reply</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;