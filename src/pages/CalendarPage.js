import { API_BASE_URL } from "../api-config.js";

const RECORDS_API_URL = `${API_BASE_URL}/api/records`;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeRecords(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.records)) {
    return data.records;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function getRecordDate(record) {
  return (
    record.date ??
    record.created_at ??
    record.createdAt ??
    record.time ??
    record.timestamp ??
    ""
  ).slice(0, 10);
}

function RecordItem({ record }) {
  const date = getRecordDate(record) || "未标注日期";
  const text = record.mood_text ?? record.note ?? record.content ?? "这一天留下了一条记录。";
  const tags = record.emotion_tags ?? record.tags ?? [];
  const summary = record.ai_summary ?? record.summary ?? "";

  return `
    <article class="calendar-record-item">
      <div class="calendar-record-meta">
        <strong>${escapeHtml(date)}</strong>
        ${
          tags.length
            ? `<span>${tags.map((tag) => escapeHtml(tag)).join(" / ")}</span>`
            : ""
        }
      </div>
      <p>${escapeHtml(text)}</p>
      ${summary ? `<small>${escapeHtml(summary)}</small>` : ""}
    </article>
  `;
}

export function CalendarPage({ navigateTo }) {
  const page = document.createElement("main");
  page.className = "page calendar-page review-page";
  const abortController = new AbortController();
  let records = [];
  let isActive = true;

  page.innerHTML = `
    <header class="review-topbar">
      <button class="review-back-button" type="button" data-back-dashboard aria-label="返回回顾页">
        <span aria-hidden="true">←</span>
      </button>
      <h1>日历记录</h1>
      <span></span>
    </header>

    <section class="calendar-panel">
      <label class="calendar-search-field">
        <span>按日期搜索</span>
        <input type="date" data-date-filter />
      </label>

      <div class="review-card review-loading-card" data-loading>
        正在加载过往记录...
      </div>

      <div class="error-state" data-error hidden>
        <p data-error-text></p>
        <button class="ai-action-button ai-action-light" type="button" data-retry>
          重试加载
        </button>
      </div>

      <div class="calendar-record-list" data-record-list></div>
    </section>
  `;

  const dateFilter = page.querySelector("[data-date-filter]");
  const loading = page.querySelector("[data-loading]");
  const error = page.querySelector("[data-error]");
  const errorText = page.querySelector("[data-error-text]");
  const retryButton = page.querySelector("[data-retry]");
  const recordList = page.querySelector("[data-record-list]");

  function setElementVisible(element, isVisible, visibleDisplay = "") {
    element.hidden = !isVisible;
    element.style.display = isVisible ? visibleDisplay : "none";
  }

  function renderRecords() {
    const selectedDate = dateFilter.value;
    const visibleRecords = selectedDate
      ? records.filter((record) => getRecordDate(record) === selectedDate)
      : records;

    recordList.innerHTML = visibleRecords.length
      ? visibleRecords.map((record) => RecordItem({ record })).join("")
      : `<p class="calendar-empty">这一天暂时还没有记录。</p>`;
  }

  async function loadRecords() {
    setElementVisible(error, false);
    setElementVisible(loading, true, "block");

    try {
      const url = new URL(RECORDS_API_URL);
      url.searchParams.set("range", "365d");
      url.searchParams.set("user_id", window.USER_ID ?? "");

      const response = await fetch(url.toString(), {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }

      const data = await response.json();

      if (!isActive) {
        return;
      }

      records = normalizeRecords(data);
      renderRecords();
    } catch (requestError) {
      if (!isActive || requestError.name === "AbortError") {
        return;
      }

      errorText.textContent = requestError.message || "加载失败，请稍后重试。";
      setElementVisible(error, true, "grid");
      recordList.innerHTML = "";
    } finally {
      if (isActive) {
        setElementVisible(loading, false);
      }
    }
  }

  page.querySelector("[data-back-dashboard]").addEventListener("click", () => {
    navigateTo("/dashboard");
  });

  dateFilter.addEventListener("input", () => {
    renderRecords();
  });

  retryButton.addEventListener("click", () => {
    loadRecords();
  });

  page.destroy = () => {
    isActive = false;
    abortController.abort();
  };

  loadRecords();
  return page;
}
