const SUMMARY_API_URL = "https://warmplace-production.up.railway.app/api/summary";

function EmotionTrendCard({ trend }) {
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
        ${
          trend.length
            ? trend
                .map(
                  (item) => `
              <li>
                <span>${item.date}</span>
                <strong>${item.score}</strong>
              </li>
            `,
                )
                .join("")
            : "<li>还没有记录</li>"
        }
      </ul>
    </section>
  `;
}

function TagCloudCard({ tags }) {
  return `
    <section class="dashboard-card" aria-labelledby="tag-cloud-title">
      <div class="card-heading">
        <p class="eyebrow">标签</p>
        <h2 id="tag-cloud-title">高频标签云</h2>
      </div>
      <div class="dashboard-tag-cloud">
        ${
          tags.length
            ? tags
                .map(
                  (tag) => `
              <span class="dashboard-tag" style="--weight: ${tag.count}">
                ${tag.label}
                <small>${tag.count}</small>
              </span>
            `,
                )
                .join("")
            : "<span>还没有标签数据</span>"
        }
      </div>
    </section>
  `;
}

function HappyMomentCard({ moments }) {
  return `
    <section class="dashboard-card" aria-labelledby="happy-moment-title">
      <div class="card-heading">
        <p class="eyebrow">Moment</p>
        <h2 id="happy-moment-title">开心 Moment</h2>
      </div>
      <div class="moment-list">
        ${
          moments.length
            ? moments
                .map(
                  (moment) => `
              <article class="moment-item">
                <h3>${moment.title}</h3>
                <p>${moment.content}</p>
              </article>
            `,
                )
                .join("")
            : "<p>还没有记录开心时刻</p>"
        }
      </div>
    </section>
  `;
}

function GrowthSummaryCard({ summary }) {
  return `
    <section class="dashboard-card summary-card" aria-labelledby="growth-summary-title">
      <div class="card-heading">
        <p class="eyebrow">小结</p>
        <h2 id="growth-summary-title">${summary.title}</h2>
      </div>
      <p>${summary.content}</p>
    </section>
  `;
}

function mapSummaryToDashboardData(summary) {
  return {
    trend: (summary.mood_trend ?? []).map((item) => ({
      date: item.date,
      score: item.avg_intensity,
    })),
    tags: (summary.top_emotion_counts ?? []).map((item) => ({
      label: item.label,
      count: item.count,
    })),
    happyMoments: (summary.happy_moments_with_date ?? []).map((item) => ({
      title: `开心时刻 · ${item.date}`,
      content: item.content,
    })),
    summary: {
      title: "本周成长小结",
      content: summary.growth_summary ?? "还没有足够的记录，多记录几次后我们会帮你看见变化。",
    },
  };
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
        <h1>我一直都在这</h1>
      </div>
    </header>

    <div class="dashboard-grid" data-dashboard-grid>
      <p data-dashboard-loading>正在加载你的回顾数据...</p>
    </div>
  `;

  page.querySelector("[data-back-home]").addEventListener("click", () => {
    navigateTo("/");
  });

  async function loadSummary() {
    const grid = page.querySelector("[data-dashboard-grid]");

    try {
      const response = await fetch(
        `${SUMMARY_API_URL}?range=7d&user_id=${encodeURIComponent(window.USER_ID ?? "")}`,
        { signal: abortController.signal },
      );

      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }

      const summary = await response.json();

      if (!isActive) {
        return;
      }

      const dashboardData = mapSummaryToDashboardData(summary);

      grid.innerHTML = `
        ${EmotionTrendCard({ trend: dashboardData.trend })}
        ${TagCloudCard({ tags: dashboardData.tags })}
        ${HappyMomentCard({ moments: dashboardData.happyMoments })}
        ${GrowthSummaryCard({ summary: dashboardData.summary })}
      `;
    } catch (loadError) {
      if (!isActive || loadError.name === "AbortError") {
        return;
      }

      grid.innerHTML = `<p>加载回顾数据失败，请稍后重试。</p>`;
    }
  }

  page.destroy = () => {
    isActive = false;
    abortController.abort();
  };

  loadSummary();

  return page;
}
