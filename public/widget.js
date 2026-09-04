(function () {
  "use strict";

  // Identify script tag and attributes
  const currentScript =
    document.currentScript ||
    document.querySelector("script[data-agent-id]");

  if (!currentScript) {
    console.error("[Brain Plug] Widget script tag with data-agent-id not found.");
    return;
  }

  const agentId = currentScript.getAttribute("data-agent-id");
  let apiKey = currentScript.getAttribute("data-api-key") || "";
  if (apiKey === "YOUR_AGENT_API_KEY") {
    apiKey = "";
  }

  let baseUrl = currentScript.getAttribute("data-base-url");
  if (!baseUrl) {
    if (currentScript.src && currentScript.src.startsWith("http")) {
      baseUrl = new URL(currentScript.src).origin;
    } else {
      baseUrl = window.location.origin;
    }
  }
  baseUrl = baseUrl.replace(/\/+$/, "");

  if (!agentId) {
    console.error("[Brain Plug] data-agent-id is required.");
    return;
  }

  // Create Container & Attach Shadow DOM to prevent CSS leaks
  const container = document.createElement("div");
  container.id = `brain-plug-widget-${agentId}`;
  document.body.appendChild(container);
  const shadow = container.attachShadow({ mode: "open" });

  let config = null;
  let isOpen = false;
  let messages = [];
  let conversationId = null;
  let isStreaming = false;

  // Session storage key
  const storageKey = `bp_chat_${agentId}`;
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      messages = (parsed.messages || []).filter((m) => m && m.content && m.content.trim().length > 0);
      conversationId = parsed.conversationId || null;
    }
  } catch (e) {}

  function saveSession() {
    try {
      const validMessages = messages.filter((m) => m && m.content && m.content.trim().length > 0);
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ messages: validMessages, conversationId })
      );
    } catch (e) {}
  }

  async function init() {
    try {
      const res = await fetch(`${baseUrl}/api/v1/widget/config/${agentId}`);
      if (!res.ok) {
        let errData = null;
        try { errData = await res.json(); } catch (e) {}
        throw new Error(errData?.error?.message || errData?.error || `Failed to load widget config (HTTP ${res.status})`);
      }
      const json = await res.json();
      config = json.data;

      // Add default welcome message if empty
      if (messages.length === 0 && config.welcomeMessage) {
        messages.push({
          role: "assistant",
          content: config.welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }

      render();
    } catch (err) {
      console.error("[Brain Plug] Widget initialization failed:", err);
    }
  }

  function toggleWidget() {
    isOpen = !isOpen;
    render();
    if (isOpen) {
      setTimeout(() => {
        const input = shadow.querySelector(".bp-input");
        if (input) input.focus();
        scrollToBottom();
      }, 100);
    }
  }

  function scrollToBottom() {
    const messagesEl = shadow.querySelector(".bp-messages");
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function formatMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bp-code"><code>$1</code></pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bp-inline-code">$1</code>');
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // Bullet points
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li class="bp-li">$1</li>');
    html = html.replace(/((?:<li class="bp-li">.*<\/li>\s*)+)/g, '<ul class="bp-ul">$1</ul>');
    // Newlines
    html = html.replace(/\n/g, "<br/>");
    return html;
  }

  async function sendMessage(text) {
    if (!text || !text.trim() || isStreaming) return;

    const userMessage = {
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    messages.push(userMessage);
    render();
    scrollToBottom();

    // Prepare placeholder assistant response
    const assistantMessage = {
      role: "assistant",
      content: "",
      sources: [],
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    messages.push(assistantMessage);
    isStreaming = true;
    render();
    scrollToBottom();

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (apiKey && apiKey.trim() && apiKey.trim() !== "YOUR_AGENT_API_KEY") {
        headers["x-api-key"] = apiKey.trim();
      }

      const response = await fetch(`${baseUrl}/api/v1/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          agentId,
          conversationId: conversationId || undefined,
          message: text.trim(),
        }),
      });

      if (!response.ok) {
        let errJson = null;
        try { errJson = await response.json(); } catch (e) {}
        const msg = errJson?.error?.message || errJson?.error || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));

              if (data.type === "start") {
                conversationId = data.conversationId;
                assistantMessage.sources = data.sources || [];
              } else if (data.type === "token") {
                assistantMessage.content += data.content;
                renderMessagesOnly();
                scrollToBottom();
              } else if (data.type === "done") {
                conversationId = data.conversationId;
                if (data.sources) assistantMessage.sources = data.sources;
              } else if (data.type === "error") {
                assistantMessage.content = `⚠️ ${data.message || "An error occurred"}`;
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      assistantMessage.content = `⚠️ ${err.message || "Sorry, I encountered a network error. Please try again."}`;
    } finally {
      isStreaming = false;
      saveSession();
      render();
      scrollToBottom();
    }
  }

  function renderMessagesOnly() {
    const messagesEl = shadow.querySelector(".bp-messages");
    if (!messagesEl) return;
    messagesEl.innerHTML = renderMessagesHtml();
  }

  function renderMessagesHtml() {
    return messages
      .map((msg, index) => {
        const isUser = msg.role === "user";
        let contentHtml = "";
        if (msg.content) {
          contentHtml = formatMarkdown(msg.content);
        } else if (isStreaming && index === messages.length - 1) {
          contentHtml = '<span class="bp-typing-dots"><span>.</span><span>.</span><span>.</span></span>';
        }

        return `
          <div class="bp-message ${isUser ? "bp-user-msg" : "bp-assistant-msg"}">
            <div class="bp-msg-bubble">
              <div class="bp-msg-text">${contentHtml}</div>
              <div class="bp-msg-time">${msg.timestamp || ""}</div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function getIconSvg(iconName) {
    switch (iconName) {
      case "Bot":
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h0M16 15h0"/></svg>`;
      case "Sparkles":
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;
      case "Headphones":
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`;
      case "MessageCircle":
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`;
      case "Zap":
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      case "MessageSquare":
      default:
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    }
  }

  function render() {
    if (!config) return;

    const wc = config.widgetConfig || {};
    const primaryColor = wc.primaryColor || "#7c3aed";
    const secondaryColor = wc.secondaryColor || "#ede9fe";
    const textColor = wc.textColor || "#1e1b4b";
    const backgroundColor = wc.backgroundColor || "#ffffff";
    const borderRadius = wc.borderRadius || 16;
    const width = wc.width || 400;
    const height = wc.height || 600;
    const launcherColor = wc.launcherColor || primaryColor;
    const isRound = (wc.launcherType || "").toUpperCase() === "ROUND" || (wc.launcherType || "").toUpperCase() === "FLOATING_ICON";
    const hasLogo = Boolean(config.avatar && config.avatar.trim());
    const iconSvg = getIconSvg(wc.buttonIcon || "MessageSquare");

    const rawPos = (wc.position || "BOTTOM_RIGHT").toString().toUpperCase().replace(/-/g, "_");
    let posStyles = "bottom: 24px; right: 24px;";
    if (rawPos === "BOTTOM_LEFT") posStyles = "bottom: 24px; left: 24px;";
    else if (rawPos === "TOP_RIGHT") posStyles = "top: 24px; right: 24px;";
    else if (rawPos === "TOP_LEFT") posStyles = "top: 24px; left: 24px;";

    let launcherContentHtml = "";
    if (isRound) {
      if (hasLogo) {
        launcherContentHtml = `<img src="${config.avatar}" class="bp-launcher-img" alt="logo" />`;
      } else {
        launcherContentHtml = `${iconSvg}`;
      }
    } else {
      if (hasLogo) {
        launcherContentHtml = `<img src="${config.avatar}" class="bp-launcher-img-small" alt="logo" /><span>${wc.buttonLabel || "Chat with us"}</span>`;
      } else {
        launcherContentHtml = `${iconSvg}<span>${wc.buttonLabel || "Chat with us"}</span>`;
      }
    }

    shadow.innerHTML = `
      <style>
        :host {
          --bp-primary: ${primaryColor};
          --bp-secondary: ${secondaryColor};
          --bp-text: ${textColor};
          --bp-bg: ${backgroundColor};
          --bp-radius: ${borderRadius}px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          z-index: 2147483647;
          position: fixed;
          ${posStyles}
          color: var(--bp-text);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .bp-launcher {
          background-color: ${launcherColor};
          color: #ffffff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
          ${
            isRound
              ? `width: 58px; height: 58px; border-radius: 50%; padding: 0;`
              : `border-radius: 9999px; padding: 12px 20px; font-weight: 600; font-size: 14.5px; gap: 9px;`
          }
        }

        .bp-launcher:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.32);
        }

        .bp-launcher svg {
          width: ${isRound ? "26px" : "19px"};
          height: ${isRound ? "26px" : "19px"};
        }

        .bp-launcher-img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
        }

        .bp-launcher-img-small {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          object-fit: cover;
        }

        .bp-window {
          position: fixed;
          ${posStyles}
          bottom: 84px;
          width: ${width}px;
          height: ${height}px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 100px);
          background: var(--bp-bg);
          border-radius: var(--bp-radius);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.08);
          display: ${isOpen ? "flex" : "none"};
          flex-direction: column;
          overflow: hidden;
          animation: bp-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes bp-slide-up {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .bp-header {
          background: linear-gradient(135deg, var(--bp-primary), #672ca0);
          color: #ffffff;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .bp-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bp-header-avatar-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.5);
          background: #ffffff;
        }

        .bp-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          border: 2px solid rgba(255, 255, 255, 0.4);
        }

        .bp-title {
          font-weight: 700;
          font-size: 15px;
          line-height: 1.2;
        }

        .bp-subtitle {
          font-size: 11px;
          opacity: 0.85;
          margin-top: 2px;
        }

        .bp-close-btn {
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          opacity: 0.8;
          padding: 4px;
          border-radius: 6px;
          transition: opacity 0.2s, background-color 0.2s;
        }

        .bp-close-btn:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.15);
        }

        .bp-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #faf8fd;
        }

        .bp-message {
          display: flex;
          width: 100%;
        }

        .bp-user-msg {
          justify-content: flex-end;
        }

        .bp-assistant-msg {
          justify-content: flex-start;
        }

        .bp-msg-bubble {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 14px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .bp-user-msg .bp-msg-bubble {
          background: var(--bp-primary);
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }

        .bp-assistant-msg .bp-msg-bubble {
          background: #ffffff;
          color: var(--bp-text);
          border: 1px solid #ede9fe;
          border-bottom-left-radius: 4px;
        }

        .bp-msg-text {
          font-size: 13.5px;
          word-break: break-word;
        }

        .bp-msg-time {
          font-size: 10px;
          margin-top: 4px;
          opacity: 0.65;
          text-align: right;
        }

        .bp-code {
          background: #1e1b4b;
          color: #f5f0fd;
          padding: 10px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 8px 0;
          font-family: monospace;
          font-size: 12px;
        }

        .bp-inline-code {
          background: #ede9fe;
          color: #672ca0;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }

        .bp-ul {
          margin-left: 18px;
          margin-top: 6px;
        }

        .bp-typing-dots span {
          animation: bp-blink 1.4s infinite both;
          font-size: 20px;
          line-height: 10px;
        }

        .bp-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .bp-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bp-blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }

        .bp-footer {
          padding: 14px 16px;
          background: #ffffff;
          border-top: 1px solid #ede9fe;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bp-input {
          flex: 1;
          border: 1px solid #dec1f7;
          border-radius: 9999px;
          padding: 10px 16px;
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.2s;
        }

        .bp-input:focus {
          border-color: var(--bp-primary);
          box-shadow: 0 0 0 2px rgba(124, 50, 196, 0.15);
        }

        .bp-send-btn {
          background: var(--bp-primary);
          color: #ffffff;
          border: none;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .bp-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .bp-branding {
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
          padding-bottom: 6px;
          background: #ffffff;
        }

        @media (max-width: 640px) {
          :host {
            bottom: 16px !important;
            right: 16px !important;
            left: auto !important;
            top: auto !important;
          }
          .bp-window {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            top: 0 !important;
            border-radius: 0 !important;
            z-index: 2147483647 !important;
          }
          .bp-header {
            padding: 14px 16px;
          }
          .bp-input {
            font-size: 15px !important;
          }
        }
      </style>

      ${
        !isOpen
          ? `<button class="bp-launcher" id="bp-launcher-btn" title="Open chat">
              ${launcherContentHtml}
            </button>`
          : ""
      }

      <div class="bp-window">
        <div class="bp-header">
          <div class="bp-header-info">
            ${
              hasLogo
                ? `<img src="${config.avatar}" class="bp-header-avatar-img" alt="${config.name}" />`
                : `<div class="bp-avatar">${config.name.charAt(0).toUpperCase()}</div>`
            }
            <div>
              <div class="bp-title">${config.name}</div>
              <div class="bp-subtitle">${config.description || "AI Assistant"}</div>
            </div>
          </div>
          <button class="bp-close-btn" id="bp-close-btn" title="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="bp-messages">${renderMessagesHtml()}</div>

        <form class="bp-footer" id="bp-chat-form">
          <input type="text" class="bp-input" placeholder="Type your question..." autocomplete="off" ${
            isStreaming ? "disabled" : ""
          } />
          <button type="submit" class="bp-send-btn" ${
            isStreaming ? "disabled" : ""
          }>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </form>

        <div class="bp-branding">
          Powered by <strong>Brain Plug</strong>
        </div>
      </div>
    `;

    // Event listeners
    const launcherBtn = shadow.querySelector("#bp-launcher-btn");
    if (launcherBtn) launcherBtn.addEventListener("click", toggleWidget);

    const closeBtn = shadow.querySelector("#bp-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", toggleWidget);

    const form = shadow.querySelector("#bp-chat-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = shadow.querySelector(".bp-input");
        if (input && input.value) {
          const val = input.value;
          input.value = "";
          sendMessage(val);
        }
      });
    }
  }

  // Bootstrap when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
