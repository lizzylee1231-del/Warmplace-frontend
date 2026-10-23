import { apiFetch, buildApiUrl } from "../api.js";
import { saveNote } from "../records.js";

const AI_REQUEST_KEY = "nuanwo_ai_reply_payload";


const ICONS = {
  heart: "assets/icons/icon-heart.png",
  cup: "assets/icons/icon-cup.png",
  lamp: "assets/icons/icon-lamp.png",
  record: "assets/icons/icon-record.png",
};

const RISK_MESSAGES = {
  needs_attention: "这条记录里有一些需要多照看自己的信号。如果这种状态持续，找信任的人聊聊会更稳。",
  crisis: "如果你此刻有伤害自己或他人的念头，请立刻联系身边可信任的人，或拨打当地紧急求助电话。",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    return [];
  }

  const parsedTips = String(tips)
    .split(/\n|。|；|;/)
    .map((item) => item.replace(/^[-\d.\s、]+/, "").trim())
    .filter(Boolean)
    .slice(0, 4);

  return parsedTips;
}

function formatMainReply(data) {
  const reply = data.ai_reply ?? "这些感受值得被认真看见，也不需要立刻被整理得很完美。";
  const observed = data.ai_observed_emotions?.length
    ? `我听见了这些感受：${data.ai_observed_emotions.join("、")}`
    : "";
  const summary = data.ai_summary ? `小结：${data.ai_summary}` : "";
  const closing = data.ai_closing_message ?? "今晚先把自己放回暖窝里，慢慢呼吸一下，我们明天再一点点靠近它。";

  return [reply, observed, summary, closing].filter(Boolean).join("\n\n");
}

function getRiskInfo(riskLevel) {
  if (!riskLevel || riskLevel === "normal") {
    return null;
  }

  const isCrisis = riskLevel === "crisis";
  const icon = isCrisis ? "🆘" : "⚠️";
  const message = RISK_MESSAGES[riskLevel] ?? "";

  if (!message) {
    return null;
  }

  return { level: riskLevel, icon, message, isCrisis };
}

function renderRiskBanner(riskInfo) {
  if (!riskInfo) {
    return "";
  }

  return `
    <div class="ai-risk-banner ${riskInfo.isCrisis ? "crisis" : ""}" role="alert">
      <span class="ai-risk-banner-icon" aria-hidden="true">${riskInfo.icon}</span>
      <span class="ai-risk-banner-text">${escapeHtml(riskInfo.message)}</span>
    </div>
  `;
}

function renderCareItems(items) {
  return items
    .map(
      (item) => `
        <li>
          <span class="care-bullet" aria-hidden="true">🍃</span>
          <span>${escapeHtml(item)}</span>
        </li>
      `,
    )
    .join("");
}

export function AiReplyPage({ query = new URLSearchParams(), navigateTo, request = apiFetch }) {
  const page = document.createElement("main");
  page.className = "page ai-reply-page";
  const abortController = new AbortController();
  const typewriterTimers = new Map();
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

        <div class="ai-risk-area" data-risk-area hidden></div>

        <div class="ai-message" data-message></div>

        <div class="error-state" data-error hidden>
          <p data-error-text></p>
          <button class="ai-action-button ai-action-light" type="button" data-retry>
            重试生成
          </button>
        </div>
        <img class="ai-card-heart ai-card-heart-end" src="${ICONS.heart}" alt="" aria-hidden="true" />
      </article>

      <aside class="ai-care-card ai-pixel-card" aria-labelledby="care-title" data-care-card hidden>
        <h2 id="care-title">
          <img src="${ICONS.cup}" alt="" aria-hidden="true" />
          照顾自己
        </h2>
        <ul data-care-list></ul>
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
  let recordId = query.get("record_id") || payload?.record_id;
  const emptyState = page.querySelector("[data-empty-state]");
  const riskArea = page.querySelector("[data-risk-area]");
  const messageCard = page.querySelector("[data-message-card]");
  const message = page.querySelector("[data-message]");
  const loading = page.querySelector("[data-loading]");
  const error = page.querySelector("[data-error]");
  const errorText = page.querySelector("[data-error-text]");
  const retryButton = page.querySelector("[data-retry]");
  const careList = page.querySelector("[data-care-list]");
  const careCard = page.querySelector("[data-care-card]");

  let fullText = "";
  let completed = false;
  let inFlight = false;

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
        typewriterTimers.set(timer, resolve);
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

  async function displayReply(data, animate) {
    completed = true;
    const careItems = splitCareTips(data.ai_self_care_tips);
    careList.innerHTML = renderCareItems(careItems);
    setElementVisible(careCard, careItems.length > 0);
    const riskInfo = getRiskInfo(data.risk_level);
    if (riskInfo) {
      riskArea.innerHTML = renderRiskBanner(riskInfo);
      riskArea.hidden = false;
    }
    setLoading(false);
    if (animate) {
      await appendWithTypewriter(formatMainReply(data));
    } else {
      fullText = formatMainReply(data);
      updateMessage();
    }
  }

  async function requestAiReply() {
    if (!recordId && !payload) {
      setElementVisible(messageCard, false);
      setElementVisible(emptyState, true);
      return;
    }

    if (inFlight || completed) return;
    inFlight = true;
    retryButton.disabled = true;

    fullText = "";
    updateMessage();
    setElementVisible(error, false);
    riskArea.hidden = true;
    riskArea.innerHTML = "";
    setElementVisible(careCard, false);
    careList.innerHTML = "";
    setLoading(true);

    let recordLoaded = false;
    try {
      // Support a reply tab opened before this release: save its note first, too.
      if (!recordId) {
        payload.client_request_id ||= window.crypto.randomUUID();
        sessionStorage.setItem(AI_REQUEST_KEY, JSON.stringify(payload));
        recordId = await saveNote(payload, request);
        payload.record_id = recordId;
        sessionStorage.setItem(AI_REQUEST_KEY, JSON.stringify(payload));
      }
      if (!isActive) return;
      // The URL remains sufficient after refresh, even without a session payload.
      window.history.replaceState(window.history.state, "", `#/ai-reply?record_id=${encodeURIComponent(recordId)}`);
      const recordUrl = buildApiUrl(`/api/records/${encodeURIComponent(recordId)}`);
      const storedResponse = await request(recordUrl, { signal: abortController.signal });
      if (!storedResponse.ok) throw new Error("Record unavailable");
      const record = await storedResponse.json();
      if (!isActive) return;
      recordLoaded = true;
      if (record.ai_reply?.trim()) {
        await displayReply(record, false);
        return;
      }
      const response = await request(`${recordUrl}/analyze`, {
        method: "POST",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }

      const data = await response.json();
      if (!isActive) return;
      if (data.generation_status !== "generated") {
        throw new Error("AI generation failed");
      }
      // This endpoint only succeeds after writing the reply to this saved record.
      await displayReply(data, true);
    } catch (requestError) {
      if (!isActive || requestError.name === "AbortError") {
        return;
      }

      retryButton.textContent = recordId ? (recordLoaded ? "重试生成" : "重试读取") : "重试保存";
      showError(recordId
        ? (recordLoaded ? "回复没生成出来，记录已保存" : "记录不存在或暂时无法读取，请稍后重试。")
        : "记录未保存，请重试保存。");
    } finally {
      setLoading(false);
      inFlight = false;
      retryButton.disabled = false;
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
    typewriterTimers.forEach((resolve, timer) => { window.clearTimeout(timer); resolve(); });
    typewriterTimers.clear();
  };

  requestAiReply();
  return page;
}
