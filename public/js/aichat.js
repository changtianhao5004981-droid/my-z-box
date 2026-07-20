marked.setOptions({
    breaks: true,
    gfm: true,
  });

  let chatHistory = [];

  function loadChatHistory() {
    const saved = getCookie("chatHistory");
    if (saved) {
      try {
        chatHistory = JSON.parse(saved);
        renderAllMessages();
      } catch (e) {
        console.log("Failed to load chat history");
      }
    }
  }

  function saveChatHistory() {
    setCookie("chatHistory", JSON.stringify(chatHistory), 1);
  }

  function renderAllMessages() {
    const responseEl = document.getElementById("response");
    responseEl.innerHTML = "";

    chatHistory.forEach((message) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = `message-container ${message.type}-message`;

      if (message.type === "ai") {
        const htmlContent = marked.parse(message.content);
        messageDiv.innerHTML = `
          <div class="message-header">AI:</div>
          <div class="message-content">${htmlContent}</div>
        `;
      } else {
        messageDiv.innerHTML = `
          <div class="message-header">You:</div>
          <div class="message-content">${message.content}</div>
        `;
      }

      responseEl.appendChild(messageDiv);
    });

    responseEl.scrollTop = responseEl.scrollHeight;
  }

  function addMessageToHistory(type, content) {
    chatHistory.push({ type, content, timestamp: Date.now() });
    saveChatHistory();
  }

  function escapeSSE(str) {
    return String(str).replace(/\r?\n/g, "\\n");
  }

  async function sendMessage() {
    const q = document.getElementById("userInput").value.trim();
    const model = document.getElementById("category").value;
    if (!q) return;

    addMessageToHistory("user", q);

    document.getElementById("userInput").value = "";
    renderAllMessages();

    const responseEl = document.getElementById("response");
    const aiMessage = document.createElement("div");
    aiMessage.className = "message-container ai-message";
    aiMessage.innerHTML = `
      <div class="message-header">AI:</div>
      <div class="message-content" id="ai-content">Thinking...</div>
    `;
    responseEl.appendChild(aiMessage);
    responseEl.scrollTop = responseEl.scrollHeight;

    const evtSource = new EventSource(
      `/chat?q=${encodeURIComponent(q)}&model=${encodeURIComponent(model)}`
    );
    const aiContent = document.getElementById("ai-content");
    let fullText = "";

    evtSource.addEventListener("answer", (e) => {
      fullText += e.data;
      const processedText = fullText.replace(/\\n/g, "\n");
      const htmlContent = marked.parse(processedText);
      aiContent.innerHTML = htmlContent;
      responseEl.scrollTop = responseEl.scrollHeight;
    });

    evtSource.addEventListener("reasoning", (e) => {
      // Optional: handle reasoning events if needed
      // console.log("Reasoning:", e.data);
    });

    evtSource.addEventListener("error", (e) => {
      aiContent.innerHTML =
        '<span style="color:red;">Error: ' + (e.data || "connection error") + "</span>";
      evtSource.close();

      addMessageToHistory("ai", "Error: " + (e.data || "connection error"));
      renderAllMessages();
    });

    evtSource.addEventListener("done", () => {
      evtSource.close();

      if (fullText.trim() === "") {
        aiContent.innerHTML = "No response received.";
        fullText = "No response received.";
      }

      const finalText = fullText.replace(/\\n/g, "\n");
      addMessageToHistory("ai", finalText);
      renderAllMessages();

      responseEl.scrollTop = responseEl.scrollHeight;
    });
  }

  function clearChat() {
    chatHistory = [];
    saveChatHistory();
    document.getElementById("response").innerHTML = "";
  }

  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie =
      name + "=" + encodeURIComponent(value) + ";expires=" + expires.toUTCString() + ";path=/";
  }

  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  // Event listeners
  document.getElementById("sendBtn").addEventListener("click", sendMessage);
  document.getElementById("clearBtn").addEventListener("click", clearChat);

  document.getElementById("userInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  document.addEventListener("DOMContentLoaded", loadChatHistory);