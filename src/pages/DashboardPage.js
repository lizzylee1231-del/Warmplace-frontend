const API_BASE = "https://warmplace-production.up.railway.app";
const SUMMARY_RANGE = "7d";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildSummaryUrl() {
  const url = new URL(`${API_BASE}/api/summary`);
  url.searchParams.set("range", SUMMARY_RANGE);
  url.searchParams.set("user_id", window.USER_ID);
  return url.toString();
}

function EmotionTrendCard({ moodTrend }) {
  const items = moodTrend.length
    ? moodTrend
        .map((point) => {
          const shortDate = point.date.slice(5);
          return `
            <li>
              <span>${escapeHtml(shortDate)}</span>
              <strong>${escapeHtml(point.avg_intensity)}</strong>
            </li>
          `;
        })
        .join("")
    : `<li><span>暂无数据</span></li>`;

  return `
    <section class="dashboard-card trend-card" aria-labelledby="trend-title">
      <div class="card-heading">
        <p class="eyebrow">趋势</p>
        <h2 id="trend-title">情绪趋势图</h2>
      </div>
      <div class="chart-placeholder" role="img" aria-label="情绪趋势图占位">
        情绪趋势图占位
      </div>
      <ul class="trend-list" aria-label="最近情绪分值">
        ${items}
      </ul>
    </section>
  `;
}

function TagCloudCard({ topEmotions }) {
  const tags = topEmotions.length
    ? topEmotions
        .map((label, index) => {
          const weight = topEmotions.length - index;
          return `
            <span class="dashboard-tag" style="--weight: ${weight}">
              ${escapeHtml(label)}
            </span>
          `;
        })
        .join("")
    : `<p style="margin: 0; color: #5b5350;">还没有足够的情绪标签。</p>`;

  return `
    <section class="dashboard-card" aria-labelledby="tag-cloud-title">
      <div class="card-heading">
        <p class="eyebrow">标签</p>
        <h2 id="tag-cloud-title">高频情绪</h2>
      </div>
      <div class="dashboard-tag-cloud">
        ${tags}
      </div>
    </section>
  `;
}

function HappyMomentCard({ happyMoments }) {
  const moments = happyMoments.length
    ? happyMoments
        .map(
          (moment) => `
            <article class="moment-item">
              <p>${escapeHtml(moment)}</p>
            </article>
          `,
        )
        .join("")
    : `<p style="margin: 0; color: #5b5350;">还没有记录到开心时刻。</p>`;

  return `
    <section class="dashboard-card" aria-labelledby="happy-moment-title">
      <div class="card-heading">
        <p class="eyebrow">Moment</p>
        <h2 id="happy-moment-title">开心 Moment</h2>
      </div>
      <div class="moment-list">
        ${moments}
      </div>
    </section>
  `;
}

function GrowthSummaryCard({ growthSummary }) {
  return `
    <section class="dashboard-card summary-card" aria-labelledby="growth-summary-title">
      <div class="card-heading">
        <p class="eyebrow">小结</p>
        <h2 id="growth-summary-title">本周成长小结</h2>
      </div>
      <p>${escapeHtml(growthSummary)}</p>
    </section>
  `;
}

export function DashboardPage({ navigateTo }) {
  const page = document.createElement("main");
  page.className = "page dashboard-page";
  const abortController = new AbortController();
  let isActive = true;

  page.innerHTML = `
    <header class="page-header dashboard-header">
      <button class="ghost-button" type="button" data-back-home>返回首页</button>
      <div>
        <p class="eyebrow">疗愈小屋</p>
        <h1>回顾这一段心情路径</h1>
      </div>
    </header>

    <div data-loading style="display: flex; align-items: center; gap: 10px; color: #2b5960; font-weight: 800;">
      正在加载这段时间的记录...
    </div>

    <div
      data-error
      hidden
      style="display: grid; gap: 12px; color: #8a2f20;"
    >
      <p data-error-text style="margin: 0;"></p>
      <button class="secondary-action" type="button" data-retry style="justify-self: start;">
        重试加载
      </button>
    </div>

    <div data-dashboard-grid class="dashboard-grid" hidden></div>
  `;

  page.querySelector("[data-back-home]").addEventListener("click", () => {
    navigateTo("/");
  });

  const loading = page.querySelector("[data-loading]");
  const error = page.querySelector("[data-error]");
  const errorText = page.querySelector("[data-error-text]");
  const retryButton = page.querySelector("[data-retry]");
  const grid = page.querySelector("[data-dashboard-grid]");

  function setElementVisible(element, isVisible, visibleDisplay = "") {
    element.hidden = !isVisible;
    element.style.display = isVisible ? visibleDisplay : "none";
  }

  async function loadSummary() {
    setElementVisible(error, false);
    setElementVisible(grid, false);
    setElementVisible(loading, true, "flex");

    try {
      const response = await fetch(buildSummaryUrl(), {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }

      const data = await response.json();

      if (!isActive) {
        return;
      }

      grid.innerHTML = [
        EmotionTrendCard({ moodTrend: data.mood_trend ?? [] }),
        TagCloudCard({ topEmotions: data.top_emotions ?? [] }),
        HappyMomentCard({ happyMoments: data.happy_moments ?? [] }),
        GrowthSummaryCard({ growthSummary: data.growth_summary ?? "" }),
      ].join("");

      setElementVisible(grid, true, "grid");
    } catch (requestError) {
      if (!isActive || requestError.name === "AbortError") {
        return;
      }

      errorText.textContent = requestError.message || "加载失败，请稍后重试。";
      setElementVisible(error, true, "grid");
    } finally {
      if (isActive) {
        setElementVisible(loading, false);
      }
    }
  }

  retryButton.addEventListener("click", () => {
    loadSummary();
  });

  page.destroy = () => {
    isActive = false;
    abortController.abort();
  };

  loadSummary();
  return page;
}
