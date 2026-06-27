const SUMMARY_API_URL = "https://warmplace-production.up.railway.app/api/summary";

const ICONS = {
  home: "assets/icons/icon-home.png",
  record: "assets/icons/icon-record.png",
  review: "assets/icons/icon-review.png",
  music: "assets/icons/icon-music.png",
  calendar: "assets/icons/icon-calendar.png",
  cup: "assets/icons/icon-cup.png",
  heart: "assets/icons/icon-heart.png",
};

const MOOD_ICONS = ["😊", "😌", "🙂", "☹", "😟"];
const SCENE_ICONS = ["💻", "💗", "👥", "🌿", "🏠"];

function formatShortDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(5);
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function scoreToY(score) {
  const numericScore = Number(score) || 1;
  return Math.max(18, Math.min(96, 110 - numericScore * 18));
}

function buildTrendSvg(trend) {
  const fallback = [
    { date: "5/12", score: 3 },
    { date: "5/13", score: 5 },
    { date: "5/14", score: 4 },
    { date: "5/15", score: 4 },
    { date: "5/16", score: 2 },
    { date: "5/17", score: 3 },
    { date: "5/18", score: 4 },
  ];
  const points = (trend.length ? trend : fallback).slice(-7);
  const width = 286;
  const height = 128;
  const chartLeft = 42;
  const chartTop = 12;
  const chartWidth = 224;
  const chartHeight = 92;
  const xStep = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
  const coords = points.map((item, index) => ({
    x: chartLeft + index * xStep,
    y: chartTop + scoreToY(item.score),
    label: formatShortDate(item.date),
  }));
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");

  return `
    <svg class="review-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="近 7 天心情趋势">
      <g class="chart-grid">
        ${[0, 1, 2, 3].map((index) => `<line x1="${chartLeft}" y1="${chartTop + index * 26}" x2="${chartLeft + chartWidth}" y2="${chartTop + index * 26}" />`).join("")}
        ${coords.map((point) => `<line x1="${point.x}" y1="${chartTop}" x2="${point.x}" y2="${chartTop + chartHeight}" />`).join("")}
      </g>
      <g class="chart-moods">
        ${MOOD_ICONS.map((icon, index) => `<text x="12" y="${chartTop + 12 + index * 20}">${icon}</text>`).join("")}
      </g>
      <polyline class="chart-line" points="${polyline}" />
      ${coords.map((point) => `<circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="5" />`).join("")}
      ${coords.map((point) => `<text class="chart-label" x="${point.x}" y="124">${point.label}</text>`).join("")}
    </svg>
  `;
}

function topItems(items, fallback) {
  const normalized = items
    .filter((item) => item.label)
    .map((item) => ({
      label: item.label,
      count: Number(item.count) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return normalized.length ? normalized : fallback;
}

function SummaryCard({ summary }) {
  return `
    <section class="review-card growth-card" aria-labelledby="growth-title">
      <div>
        <h2 id="growth-title">成长小结</h2>
        <p>${summary}</p>
      </div>
      <div class="growth-illustration" aria-hidden="true">
        <span>✿</span>
        <img src="${ICONS.cup}" alt="" />
      </div>
    </section>
  `;
}

function HappyMomentCard({ moments }) {
  const count = moments.length;
  const moment = moments[0];
  return `
    <section class="review-card moment-summary-card" aria-labelledby="happy-title">
      <div>
        <div class="review-card-heading">
          <h2 id="happy-title">开心 moment</h2>
          <strong>${count || 0}件</strong>
        </div>
        <p>${moment ? moment.content : "小确幸是生活给你的礼物 ✨"}</p>
      </div>
      <div class="moment-cup" aria-hidden="true">
        <img src="${ICONS.cup}" alt="" />
        <span>›</span>
      </div>
    </section>
  `;
}

function TrendCard({ trend }) {
  return `
    <section class="review-card trend-summary-card" aria-labelledby="trend-title">
      <h2 id="trend-title">心情的小起伏 <span>近7天</span></h2>
      ${buildTrendSvg(trend)}
    </section>
  `;
}

function ListsCard({ moods, scenes }) {
  const moodItems = topItems(moods, [
    { label: "疲惫", count: 5 },
    { label: "焦虑", count: 4 },
    { label: "自责", count: 3 },
    { label: "委屈", count: 2 },
    { label: "平静", count: 2 },
  ]);
  const sceneItems = topItems(scenes, [
    { label: "工作/学习", count: 5 },
    { label: "人际关系", count: 3 },
    { label: "亲密关系", count: 2 },
    { label: "独处", count: 2 },
  ]);

  return `
    <section class="review-lists">
      <article class="review-card list-card">
        <h2>最近常有的心情 <span>出现次数</span></h2>
        <ul>
          ${moodItems
            .map(
              (item, index) => `
                <li>
                  <span>${MOOD_ICONS[index] ?? "☺"} ${item.label}</span>
                  <strong>${item.count}次</strong>
                </li>
              `,
            )
            .join("")}
        </ul>
      </article>
      <article class="review-card list-card">
        <h2>多半是因为这些事 <span>出现次数</span></h2>
        <ul>
          ${sceneItems
            .map(
              (item, index) => `
                <li>
                  <span>${SCENE_ICONS[index] ?? "✦"} ${item.label}</span>
                  <strong>${item.count}次</strong>
                </li>
              `,
            )
            .join("")}
        </ul>
      </article>
    </section>
  `;
}

function mapSummaryToDashboardData(summary) {
  return {
    trend: (summary.mood_trend ?? []).map((item) => ({
      date: item.date,
      score: item.avg_intensity,
    })),
    moods: (summary.top_emotion_counts ?? []).map((item) => ({
      label: item.label,
      count: item.count,
    })),
    scenes: (summary.top_scene_counts ?? summary.top_scene_category_counts ?? []).map((item) => ({
      label: item.label ?? item.scene_category,
      count: item.count,
    })),
    happyMoments: (summary.happy_moments_with_date ?? []).map((item) => ({
      title: `开心时刻 · ${item.date}`,
      content: item.content,
    })),
    summary:
      summary.growth_summary ??
      "你在慢慢照顾自己，也在好好陪伴自己。每一次记录，都是你走向自己的脚步。",
  };
}

function BottomNav({ navigateTo }) {
  const nav = document.createElement("nav");
  nav.className = "review-bottom-nav";
  nav.setAttribute("aria-label", "底部导航");
  nav.innerHTML = `
    <button type="button" data-nav-home>
      <img src="${ICONS.home}" alt="" aria-hidden="true" />
      首页
    </button>
    <button type="button" data-nav-record>
      <img src="${ICONS.record}" alt="" aria-hidden="true" />
      记录
    </button>
    <button class="is-active" type="button" data-nav-review>
      <img src="${ICONS.review}" alt="" aria-hidden="true" />
      回顾
    </button>
    <button type="button" data-nav-music>
      <img src="${ICONS.music}" alt="" aria-hidden="true" />
      音乐
    </button>
  `;

  nav.querySelector("[data-nav-home]").addEventListener("click", () => navigateTo("/"));
  nav.querySelector("[data-nav-record]").addEventListener("click", () => navigateTo("/record"));
  nav.querySelector("[data-nav-review]").addEventListener("click", () => navigateTo("/dashboard"));
  return nav;
}

export function DashboardPage({ navigateTo }) {
  const page = document.createElement("main");
  page.className = "page dashboard-page review-page";
  const abortController = new AbortController();
  let isActive = true;

  page.innerHTML = `
    <header class="review-topbar">
      <button class="review-back-button" type="button" data-back-home aria-label="返回首页">
        <span aria-hidden="true">←</span>
      </button>
      <h1>近7天回顾</h1>
      <img class="review-top-icon" src="${ICONS.calendar}" alt="" aria-hidden="true" />
    </header>

    <div class="review-scroll" data-dashboard-grid>
      <section class="review-card review-loading-card">
        正在加载你的回顾数据...
      </section>
    </div>
  `;

  page.append(BottomNav({ navigateTo }));

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
        ${SummaryCard({ summary: dashboardData.summary })}
        ${HappyMomentCard({ moments: dashboardData.happyMoments })}
        ${TrendCard({ trend: dashboardData.trend })}
        ${ListsCard({ moods: dashboardData.moods, scenes: dashboardData.scenes })}
      `;
    } catch (loadError) {
      if (!isActive || loadError.name === "AbortError") {
        return;
      }

      grid.innerHTML = `
        <section class="review-card review-loading-card">
          加载回顾数据失败，请稍后重试。
        </section>
      `;
    }
  }

  page.destroy = () => {
    isActive = false;
    abortController.abort();
  };

  loadSummary();

  return page;
}
