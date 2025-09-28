// background.js
chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectSoulMeshOverlay
    });
  });
  
  function injectSoulMeshOverlay() {
    // if overlay already exists, remove (toggle)
    const existing = document.getElementById("soulmesh-overlay-root");
    if (existing) {
      existing.remove();
      return;
    }
  
    // =================================================================
    // SECTION 1: VOICE MODE STATE & HELPERS (New)
    // =================================================================
    let recognition = null;
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let animationFrameId = null;
    let isVoiceModeActive = false;
  
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
    // =================================================================
    // SECTION 2: UI ELEMENTS & STYLES (Original + New Styles)
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
    // SECTION 3: CORE CHAT LOGIC (Original)
    // =================================================================
  
    function appendMessage(from, text) {
      const m = document.createElement("div");
      m.className = "msg " + (from === "user" ? "user" : "ai");
      m.textContent = text;
      chatArea.appendChild(m);
      chatArea.scrollTop = chatArea.scrollHeight;
    }

    function appendMessageWithTyping(from, text) {
      const m = document.createElement("div");
      m.className = "msg " + (from === "user" ? "user" : "ai");
      chatArea.appendChild(m);
      chatArea.scrollTop = chatArea.scrollHeight;
      
      if (from === "ai") {
        // For AI messages, use typing animation and preserve line breaks
        typeTextWithLineBreaks(m, text);
      } else {
        // For user messages, display immediately
        m.textContent = text;
      }
    }

    function typeTextWithLineBreaks(element, text, speed = 7) {
      let index = 0;
      element.innerHTML = "";
      
      const typeInterval = setInterval(() => {
        if (index < text.length) {
          // Replace \n with <br> for line breaks
          const char = text[index];
          if (char === '\n') {
            element.innerHTML += '<br>';
          } else {
            element.innerHTML += char;
          }
          index++;
          chatArea.scrollTop = chatArea.scrollHeight;
        } else {
          clearInterval(typeInterval);
        }
      }, speed);
    }

    function typeText(element, text, speed = 7) {
      let index = 0;
      element.textContent = "";
      
      const typeInterval = setInterval(() => {
        if (index < text.length) {
          element.textContent += text[index];
          index++;
          chatArea.scrollTop = chatArea.scrollHeight;
        } else {
          clearInterval(typeInterval);
        }
      }, speed);
    }

    function formatAiResponse(text) {
      // Create beautiful structured format
      let result = text;
      
      // Handle the pattern: "1. **Category**: - "response""
      result = result.replace(/(\d+)\.\s*\*\*([^*]+)\*\*:\s*-\s*"([^"]+)"/g, '\n\n$2:\n• "$3"');
      
      // Clean up extra line breaks
      result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
     // result = result.replace(/\n\s+/g, '\n');
      
      return result.trim();
    }

    // Test function to debug formatting
    function testFormatting() {
      const testText = "Here's a set of responses that keep it cool and confident: 1. **Playful and Agreeable**: - \"Sure, I could use a good Netflix session. What's on the menu?\" 2. **Confident and Casual**: - \"Sounds like a plan. What are we watching?\" 3. **Slightly Teasing**: - \"Only if you promise not to hog the remote!\" 4. **Nonchalant and Cool**: - \"I'm in. Let's see if your Netflix picks can impress me.\" 5. **Lighthearted and Fun**: - \"Why not? Let's see if we can find something binge-worthy.\" 6. **Direct and Confident**: - \"Count me in. I'm always up for a good show.\" These responses keep the tone light and engaging, showing interest without appearing too eager.";
      
      console.log("Original text:");
      console.log(testText);
      
      const formatted = formatAiResponse(testText);
      console.log("Formatted text:");
      console.log(formatted);
      
      return formatted;
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
            const response = await fetch("https://api.sensay.io/v1/replicas/d8bc1216-3911-429d-a9fb-ac4f5c79ac55/chat/completions", {
                method: "POST",
                headers: {
                    "X-ORGANIZATION-SECRET": "095603a7742f2e6e41e7efbfefc70e97190775b5b2022724f340acbaeb812089",
                    "X-USER-ID": "jumung",
                    "Content-Type": "application/json",
                    "X-API-Version": "2025-03-25"
                },
                body: JSON.stringify({
                    content: prompt,
                    skip_chat_history: false,
                    source: "discord",
                    discord_data: { channel_id: "string", channel_name: "string", author_id: "string", author_name: "string", message_id: "string", created_at: "string", server_id: "string", server_name: "string" }
                })
            });
  
            const data = await response.json();
  
            let aiText = (data && typeof data.content === 'string' && data.content.trim()) ? data.content : "Sorry, I couldn't get a proper response.";
            
            // Format the AI response for better readability
            const formattedAiText = formatAiResponse(aiText);

            if (!isVoiceModeActive) {
                if (typingId) document.getElementById(typingId)?.remove();
                appendMessageWithTyping("ai", formattedAiText);
                saveHistory("ai", formattedAiText);
            } else {
                // In voice mode, speak the response
                speakText(formattedAiText);
            }
  
        } catch (err) {
            console.error("API error:", err);
            const errorMsg = "Error fetching reply.";
            if (!isVoiceModeActive) {
                if (typingId) document.getElementById(typingId)?.remove();
                appendMessageWithTyping("ai", formatAiResponse(errorMsg));
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

      appendMessageWithTyping("user", text);
      saveHistory("user", text);
      input.value = "";
      chatArea.scrollTop = chatArea.scrollHeight;
      
      await getAiResponse(text);
    });
  
    // =================================================================
    // SECTION 4: VOICE MODE LOGIC (New)
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
                 window.speechSynthesis.cancel();
                 document.getElementById("soulmesh-voice-status").textContent = "You're speaking...";
                 return; // Don't process interim results
             }
             
             // This is a final result - process it
             const userText = event.results[event.results.length - 1][0].transcript;
             console.log('Recognized:', userText);
             
             // Stop AI from talking immediately when user starts speaking
             window.speechSynthesis.cancel();
             
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
  
        // 2. Stop Visualizer Animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
  
        // 3. Stop Microphone Track & Audio Context
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
  
        // 4. Remove UI
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
  
     function speakText(text) {
         const utterance = new SpeechSynthesisUtterance(text);
         const statusElem = document.getElementById("soulmesh-voice-status");

         utterance.onstart = () => {
             if(statusElem) statusElem.textContent = "Speaking...";
         };

         utterance.onend = () => {
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

         utterance.onerror = (event) => {
             console.error('Speech synthesis error:', event.error);
             if (isVoiceModeActive) {
                 if(statusElem) statusElem.textContent = "Speaking error. Listening...";
                 setTimeout(() => {
                     if (recognition && isVoiceModeActive) {
                         recognition.start();
                     }
                 }, 300); // Reduced from 1000ms to 300ms
             }
         };

        window.speechSynthesis.speak(utterance);
    }

    // Test the formatting function
    console.log("Testing formatting function:");
    testFormatting();
  }