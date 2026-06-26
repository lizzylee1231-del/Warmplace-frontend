const AI_REQUEST_KEY = "nuanwo_ai_reply_payload";
const API_BASE = "https://warmplace-production.up.railway.app";
const AI_API_URL = `${API_BASE}/api/ai/analyze`;
const RECORDS_API_URL = `${API_BASE}/api/records`;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMarkdown(markdown) {
  const lines = escapeHtml(markdown).split("\n");
  const html = [];
  let listOpen = false;

  // 简易 Markdown 渲染：支持标题、无序列表、加粗和普通段落，避免新增第三方库。
  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (listOpen) {
        html.push("</ul>");
        listOpen = false;
      }
      return;
    }

    const withBold = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    if (withBold.startsWith("### ")) {
      if (listOpen) {
        html.push("</ul>");
        listOpen = false;
      }
      html.push(`<h3 style="margin: 20px 0 8px; font-size: 1.1rem;">${withBold.slice(4)}</h3>`);
      return;
    }

    if (withBold.startsWith("- ")) {
      if (!listOpen) {
        html.push('<ul style="display: grid; gap: 8px; margin: 8px 0 0; padding-left: 20px;">');
        listOpen = true;
      }
      html.push(`<li>${withBold.slice(2)}</li>`);
      return;
    }

    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
    html.push(`<p style="margin: 0 0 12px;">${withBold}</p>`);
  });

  if (listOpen) {
    html.push("</ul>");
  }

  return html.join("");
}

function readStoredPayload() {
  try {
    const rawPayload = sessionStorage.getItem(AI_REQUEST_KEY);
    return rawPayload ? JSON.parse(rawPayload) : null;
  } catch {
    return null;
  }
}

function formatAiJson(data) {
  // ai_observed_emotions 只存进数据库给周回顾用，这个页面不展示。
  return [
    data.ai_summary ?? "这是一条值得被认真看见的情绪记录。",
    "",
    "### 可以怎么照顾自己",
    data.ai_self_care_tips ?? "先慢慢呼吸一下，把此刻的感受照顾好。",
    "",
    data.ai_closing_message ?? "你已经很努力了，慢慢来就好。",
  ].join("\n");
}

function extractChunkText(chunk) {
  // 兼容未来后端返回 SSE：优先解析 data: 行，解析失败时按普通文本追加。
  const events = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s*/, ""))
    .filter((line) => line && line !== "[DONE]");

  if (!events.length) {
    return chunk;
  }

  return events
    .map((event) => {
      try {
        const data = JSON.parse(event);
        return data.content ?? data.text ?? data.delta ?? "";
      } catch {
        return event;
      }
    })
    .join("");
}

export function AiReplyPage({ navigateTo }) {
  const page = document.createElement("main");
  page.className = "page ai-reply-page";
  const abortController = new AbortController();
  const typewriterTimers = new Set();
  let isActive = true;

  page.innerHTML = `
    <section
      style="
        display: grid;
        gap: 24px;
        max-width: 820px;
        margin: 0 auto;
      "
    >
      <header class="page-header" style="margin-bottom: 0;">
        <button class="ghost-button" type="button" data-back-record>返回记录页</button>
        <div>
          <p class="eyebrow">AI 陪伴回复</p>
          <h1>给这一刻一点温柔回应</h1>
        </div>
      </header>

      <div
        data-empty-state
        hidden
        style="
          padding: 24px;
          border: 1px solid rgba(82, 72, 68, 0.12);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.68);
          color: #5b5350;
        "
      >
        暂时没有可分析的记录。请先回到记录页写下一条情绪记录。
      </div>

      <article
        data-message-card
        style="
          display: grid;
          gap: 16px;
          min-height: 360px;
          padding: 28px;
          border: 1px solid rgba(82, 72, 68, 0.12);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 18px 42px rgba(68, 54, 48, 0.1);
        "
      >
        <div
          data-loading
          style="
            display: flex;
            align-items: center;
            gap: 10px;
            color: #2b5960;
            font-weight: 800;
          "
        >
          <span
            style="
              width: 10px;
              height: 10px;
              border-radius: 999px;
              background: #2b6b74;
              box-shadow: 16px 0 0 rgba(43, 107, 116, 0.5), 32px 0 0 rgba(43, 107, 116, 0.22);
            "
          ></span>
          正在生成回复...
        </div>

        <div
          data-message
          style="
            overflow: auto;
            max-height: 52vh;
            color: #3b3330;
            font-size: 1rem;
            line-height: 1.75;
          "
        ></div>

        <div data-error hidden style="display: grid; gap: 12px; color: #8a2f20;">
          <p data-error-text style="margin: 0;"></p>
          <button class="secondary-action" type="button" data-retry style="justify-self: start;">
            重试生成
          </button>
        </div>
      </article>

      <div
        data-save-bar
        hidden
        style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;"
      >
        <button class="ghost-button" type="button" data-back-edit>返回修改</button>
        <button class="primary-action" type="button" data-save-record>保存记录</button>
        <p data-save-error style="margin: 0; color: #8a2f20;"></p>
      </div>
    </section>
  `;

  const payload = readStoredPayload();
  const emptyState = page.querySelector("[data-empty-state]");
  const messageCard = page.querySelector("[data-message-card]");
  const message = page.querySelector("[data-message]");
  const loading = page.querySelector("[data-loading]");
  const error = page.querySelector("[data-error]");
  const errorText = page.querySelector("[data-error-text]");
  const retryButton = page.querySelector("[data-retry]");
  const saveBar = page.querySelector("[data-save-bar]");
  const saveButton = page.querySelector("[data-save-record]");
  const saveError = page.querySelector("[data-save-error]");
  const backEditButton = page.querySelector("[data-back-edit]");

  let fullText = "";
  let latestAiData = null;

  function setElementVisible(element, isVisible, visibleDisplay = "") {
    element.hidden = !isVisible;
    element.style.display = isVisible ? visibleDisplay : "none";
  }

  function updateMessage() {
    if (!isActive) {
      return;
    }

    message.innerHTML = renderMarkdown(fullText);
    message.scrollTop = message.scrollHeight;
  }

  async function appendWithTypewriter(text) {
    // 打字机效果：无论后端是流式 chunk 还是普通 JSON，都逐字追加到消息区。
    for (const char of text) {
      if (!isActive) {
        return;
      }

      fullText += char;
      updateMessage();
      await new Promise((resolve) => {
        const timer = window.setTimeout(() => {
          typewriterTimers.delete(timer);
          resolve();
        }, 6);
        typewriterTimers.add(timer);
      });
    }
  }

  function setLoading(isLoading) {
    setElementVisible(loading, isLoading, "flex");
  }

  function showError(messageText) {
    setElementVisible(error, true, "grid");
    errorText.textContent = messageText;
  }

  async function requestAiReply() {
    if (!payload) {
      setElementVisible(messageCard, false);
      setElementVisible(emptyState, true);
      return;
    }

    fullText = "";
    latestAiData = null;
    updateMessage();
    setElementVisible(error, false);
    setElementVisible(saveBar, false);
    setLoading(true);

    try {
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        latestAiData = data;
        await appendWithTypewriter(formatAiJson(data));
        setElementVisible(saveBar, true, "flex");
        return;
      }

      if (!response.body) {
        throw new Error("后端没有返回可读取的内容");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        await appendWithTypewriter(extractChunkText(decoder.decode(value, { stream: true })));
      }
    } catch (requestError) {
      if (!isActive || requestError.name === "AbortError") {
        return;
      }

      showError(requestError.message || "网络请求失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function saveRecord() {
    if (!payload || !latestAiData) {
      return;
    }

    saveError.textContent = "";
    saveButton.disabled = true;
    saveButton.textContent = "正在保存...";

    try {
      const response = await fetch(RECORDS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: window.USER_ID,
          mood_text: payload.mood_text,
          emotion_tags: payload.emotion_tags,
          intensity: payload.intensity,
          scene_category: payload.scene_category,
          happy_moment: payload.happy_moment,
          ai_observed_emotions: latestAiData.ai_observed_emotions,
          ai_summary: latestAiData.ai_summary,
          ai_self_care_tips: latestAiData.ai_self_care_tips,
          ai_closing_message: latestAiData.ai_closing_message,
          risk_level: latestAiData.risk_level,
        }),
      });

      if (!response.ok) {
        throw new Error(`保存失败：${response.status}`);
      }

      sessionStorage.removeItem(AI_REQUEST_KEY);
      navigateTo("/dashboard");
    } catch (saveRequestError) {
      saveError.textContent = saveRequestError.message || "保存失败，请稍后重试。";
      saveButton.disabled = false;
      saveButton.textContent = "保存记录";
    }
  }

  page.querySelector("[data-back-record]").addEventListener("click", () => {
    navigateTo("/record");
  });

  backEditButton.addEventListener("click", () => {
    navigateTo("/record");
  });

  saveButton.addEventListener("click", () => {
    saveRecord();
  });

  retryButton.addEventListener("click", () => {
    requestAiReply();
  });

  page.destroy = () => {
    isActive = false;
    abortController.abort();
    typewriterTimers.forEach((timer) => window.clearTimeout(timer));
    typewriterTimers.clear();
  };

  requestAiReply();
  return page;
}
