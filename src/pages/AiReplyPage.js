const AI_REQUEST_KEY = "nuanwo_ai_reply_payload";
const AI_API_URL = "https://warmplace-production.up.railway.app/api/ai/analyze";
const SAVE_RECORD_API_URL = "https://warmplace-production.up.railway.app/api/records";

const ICONS = {
  heart: "assets/icons/icon-heart.png",
  cup: "assets/icons/icon-cup.png",
  lamp: "assets/icons/icon-lamp.png",
  record: "assets/icons/icon-record.png",
};

const DEFAULT_CARE_ITEMS = [
  "给自己 10 分钟，做一次深呼吸",
  "把想说的话写下来，交给纸张",
  "今晚早点休息，身体也需要被照顾",
  "可以听听喜欢的音乐，或慢慢散步",
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function saveRecord(payload, aiData) {
  try {
    await fetch(SAVE_RECORD_API_URL, {
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
        ai_observed_emotions: aiData.ai_observed_emotions ?? [],
        ai_summary: aiData.ai_summary ?? "",
        ai_self_care_tips: aiData.ai_self_care_tips ?? "",
        ai_closing_message: aiData.ai_closing_message ?? "",
        risk_level: aiData.risk_level ?? "normal",
      }),
    });
  } catch (saveError) {
    console.error("save record failed", saveError);
  }
}

function readStoredPayload() {
  try {
    const rawPayload = sessionStorage.getItem(AI_REQUEST_KEY);
    return rawPayload ? JSON.parse(rawPayload) : null;
  } catch {
    return null;
  }
}

function splitCareTips(tips) {
  if (!tips) {
    return DEFAULT_CARE_ITEMS;
  }

  const parsedTips = String(tips)
    .split(/\n|。|；|;/)
    .map((item) => item.replace(/^[-\d.\s、]+/, "").trim())
    .filter(Boolean)
    .slice(0, 4);

  return parsedTips.length ? parsedTips : DEFAULT_CARE_ITEMS;
}

function formatMainReply(data) {
  const summary = data.ai_summary ?? "这些感受值得被认真看见，也不需要立刻被整理得很完美。";
  const closing = data.ai_closing_message ?? "今晚先把自己放回暖窝里，慢慢呼吸一下，我们明天再一点点靠近它。";

  return [summary, closing].filter(Boolean).join("\n\n");
}

function extractChunkText(chunk) {
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

function renderCareItems(items) {
  return items
    .map(
      (item, index) => `
        <li>
          <span class="care-bullet" aria-hidden="true">${["☺", "✦", "☁", "♪"][index] ?? "✦"}</span>
          <span>${escapeHtml(item)}</span>
        </li>
      `,
    )
    .join("");
}

export function AiReplyPage({ navigateTo }) {
  const page = document.createElement("main");
  page.className = "page ai-reply-page";
  const abortController = new AbortController();
  const typewriterTimers = new Set();
  let isActive = true;

  page.innerHTML = `
    <header class="ai-topbar">
      <button class="ai-back-button" type="button" data-back-record aria-label="返回记录页">
        <span aria-hidden="true">←</span>
      </button>
      <h1>我都听到了哦</h1>
      <span class="ai-status-icons" aria-hidden="true"></span>
    </header>

    <section class="ai-reply-layout">
      <div class="empty-state ai-empty-state" data-empty-state hidden>
        暂时没有可分析的记录。请先回到记录页，写下一条情绪记录。
      </div>

      <article class="ai-message-card ai-pixel-card" data-message-card>
        <img class="ai-card-heart ai-card-heart-start" src="${ICONS.heart}" alt="" aria-hidden="true" />
        <div class="loading-row" data-loading>
          <span class="loading-dots" aria-hidden="true"></span>
          正在生成回应...
        </div>

        <div class="ai-message" data-message></div>

        <div class="error-state" data-error hidden>
          <p data-error-text></p>
          <button class="ai-action-button ai-action-light" type="button" data-retry>
            重试生成
          </button>
        </div>
        <img class="ai-card-heart ai-card-heart-end" src="${ICONS.heart}" alt="" aria-hidden="true" />
      </article>

      <aside class="ai-care-card ai-pixel-card" aria-labelledby="care-title">
        <h2 id="care-title">
          <img src="${ICONS.cup}" alt="" aria-hidden="true" />
          照顾自己
        </h2>
        <ul data-care-list>
          ${renderCareItems(DEFAULT_CARE_ITEMS)}
        </ul>
      </aside>

      <div class="ai-action-row">
        <button class="ai-action-button ai-action-light" type="button" data-back-record-secondary>
          <img src="${ICONS.record}" alt="" aria-hidden="true" />
          还有想说的
        </button>
        <button class="ai-action-button ai-action-red" type="button" data-save-moment>
          <span aria-hidden="true">▣</span>
          留住此刻
        </button>
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
  const careList = page.querySelector("[data-care-list]");

  let fullText = "";

  function setElementVisible(element, isVisible, visibleDisplay = "") {
    element.hidden = !isVisible;
    element.style.display = isVisible ? visibleDisplay : "none";
  }

  function updateMessage() {
    if (!isActive) {
      return;
    }

    message.innerHTML = escapeHtml(fullText)
      .split("\n")
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join("");
    message.scrollTop = message.scrollHeight;
  }

  async function appendWithTypewriter(text) {
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
    updateMessage();
    setElementVisible(error, false);
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
        saveRecord(payload, data);
        careList.innerHTML = renderCareItems(splitCareTips(data.ai_self_care_tips));
        await appendWithTypewriter(formatMainReply(data));
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

  page.querySelector("[data-back-record]").addEventListener("click", () => {
    navigateTo("/record");
  });

  page.querySelector("[data-back-record-secondary]").addEventListener("click", () => {
    navigateTo("/record");
  });

  page.querySelector("[data-save-moment]").addEventListener("click", () => {
    navigateTo("/dashboard");
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
