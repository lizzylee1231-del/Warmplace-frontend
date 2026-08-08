import { buildApiUrl } from "../api.js";

const RECORDS_API_URL = buildApiUrl("/api/records");
const MOMENTS_API_URL = buildApiUrl("/api/moments");

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
  const recordId = record.record_id ?? String(record.id ?? "");
  const isHappy = Boolean(record.happy_moment);

  return `
    <article class="calendar-record-item" data-record-id="${escapeHtml(recordId)}">
      <div class="calendar-record-meta">
        <strong>${escapeHtml(date)}</strong>
        <div class="calendar-record-actions">
          <button class="happy-mark-btn ${isHappy ? "is-marked" : ""}" type="button" data-happy-mark="${escapeHtml(recordId)}">
            ${isHappy ? "🌟 已标记" : "☆ 标记开心"}
          </button>
          <button class="calendar-record-delete" type="button" data-delete-record="${escapeHtml(recordId)}">
            🗑 删除
          </button>
        </div>
      </div>
      ${
        tags.length
          ? `<div class="calendar-record-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
          : ""
      }
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

    attachRecordActions();
  }

  function attachRecordActions() {
    // 删除记录
    recordList.querySelectorAll("[data-delete-record]").forEach((button) => {
      button.addEventListener("click", async () => {
        const recordId = button.dataset.deleteRecord;
        if (!confirm("确定要删除这条记录吗？删除后无法恢复。")) {
          return;
        }

        button.textContent = "删除中...";
        button.disabled = true;

        try {
          const deleteUrl = buildApiUrl(`/api/records/${encodeURIComponent(recordId)}`);
          const response = await fetch(deleteUrl, { method: "DELETE" });

          if (!response.ok) {
            throw new Error(`删除失败：${response.status}`);
          }

          // 从本地数据中移除并重新渲染
          records = records.filter(
            (record) => String(record.record_id ?? record.id) !== recordId,
          );
          renderRecords();
        } catch (deleteError) {
          button.textContent = "🗑 删除";
          button.disabled = false;
          alert("删除失败，请稍后重试。");
          console.error("delete record error", deleteError);
        }
      });
    });

    // 补记开心时刻
    recordList.querySelectorAll("[data-happy-mark]").forEach((button) => {
      button.addEventListener("click", async () => {
        const recordId = button.dataset.happyMark;
        const article = button.closest("[data-record-id]");
        const text = article?.querySelector("p")?.textContent ?? "";

        button.disabled = true;
        button.textContent = "标记中...";

        try {
          const response = await fetch(MOMENTS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: window.USER_ID,
              record_id: recordId,
              happy_moment: text,
            }),
          });

          if (!response.ok) {
            throw new Error(`标记失败：${response.status}`);
          }

          // 更新本地数据
          const record = records.find(
            (record) => String(record.record_id ?? record.id) === recordId,
          );
          if (record) {
            record.happy_moment = text;
          }

          button.classList.add("is-marked");
          button.textContent = "🌟 已标记";
          button.disabled = false;
        } catch (markError) {
          button.textContent = "☆ 标记开心";
          button.disabled = false;
          alert("标记失败，请稍后重试。");
          console.error("mark happy moment error", markError);
        }
      });
    });
  }

  async function loadRecords() {
    setElementVisible(error, false);
    setElementVisible(loading, true, "block");

    try {
      const url = new URL(RECORDS_API_URL, window.location.origin);
      url.searchParams.set("range", "all");
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
