import { BackgroundSoundPicker } from "../components/BackgroundSoundPicker.js";

const DEFAULT_BACKGROUND =
  "linear-gradient(135deg, rgba(232, 139, 92, 0.2), transparent 32%), linear-gradient(315deg, rgba(91, 141, 146, 0.22), transparent 34%), #f7f3ed";

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatTodayLabel() {
  const today = new Date();
  return `${today.getMonth() + 1}月${today.getDate()}日 ${WEEKDAY_LABELS[today.getDay()]}`;
}

export function HomePage({ navigateTo }) {
  const page = document.createElement("main");
  page.className = "page home-page";
  page.style.background = DEFAULT_BACKGROUND;
  page.style.transition = "background 240ms ease";

  page.innerHTML = `
    <section class="home-hero-banner" aria-labelledby="home-title">
      <p class="home-hero-icon" aria-hidden="true">🏠</p>
      <h1 id="home-title">暖窝</h1>
      <p class="hero-copy">把想说的话放在这里</p>
    </section>

    <div class="home-cards">
      <article class="today-card" aria-labelledby="today-card-title">
        <div class="today-card-icon" aria-hidden="true">🏮</div>
        <div class="today-card-body">
          <div class="today-card-heading">
            <span id="today-card-title">今日状态</span>
            <time>${formatTodayLabel()}</time>
          </div>
          <p class="today-card-mood">先看看，给自己一点温柔 🌙</p>
          <button class="today-card-action" type="button" data-record-entry>
            <span>记录此刻的感受</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </article>

      <div class="home-cards-row">
        <button class="home-tile" type="button" data-dashboard-entry>
          <h3>近7天回顾</h3>
          <p>看看情绪的变化趋势</p>
          <span class="home-tile-glyph" aria-hidden="true">📈</span>
        </button>
        <button class="home-tile" type="button" data-happy-entry>
          <h3>开心 moment</h3>
          <p>收集生活里的小确幸</p>
          <span class="home-tile-glyph" aria-hidden="true">☕</span>
        </button>
      </div>

      <button class="home-privacy-row" type="button" data-privacy-row disabled>
        <span aria-hidden="true">🔒</span>
        <span>隐私与安全</span>
        <span aria-hidden="true">›</span>
      </button>
    </div>

    <nav class="quick-entry-bar" aria-label="快捷入口">
      <button class="quick-entry is-active" type="button" data-home-entry>
        <span class="quick-entry-icon" aria-hidden="true">🏠</span>
        <span>首页</span>
      </button>
      <button class="quick-entry" type="button" data-quick-record>
        <span class="quick-entry-icon" aria-hidden="true">📝</span>
        <span>记录</span>
      </button>
      <button class="quick-entry" type="button" data-quick-dashboard>
        <span class="quick-entry-icon" aria-hidden="true">📊</span>
        <span>回顾</span>
      </button>
      <button class="quick-entry" type="button" data-quick-music>
        <span class="quick-entry-icon" aria-hidden="true">🎵</span>
        <span>音乐</span>
      </button>
    </nav>
  `;

  page.querySelector("[data-record-entry]").addEventListener("click", () => {
    navigateTo("/record");
  });

  page.querySelector("[data-happy-entry]").addEventListener("click", () => {
    navigateTo("/record?mood=happy");
  });

  page.querySelector("[data-dashboard-entry]").addEventListener("click", () => {
    navigateTo("/dashboard");
  });

  page.querySelector("[data-home-entry]").addEventListener("click", () => {
    navigateTo("/");
  });

  page.querySelector("[data-quick-record]").addEventListener("click", () => {
    navigateTo("/record");
  });

  page.querySelector("[data-quick-dashboard]").addEventListener("click", () => {
    navigateTo("/dashboard");
  });

  page.querySelector("[data-quick-music]").addEventListener("click", () => {
    page.querySelector("[data-sound-toggle]")?.click();
  });

  page.append(
    BackgroundSoundPicker({
      onChange(sound) {
        page.style.background = sound.background;
      },
    }),
  );

  return page;
}
