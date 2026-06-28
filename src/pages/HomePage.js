import { BackgroundSoundPicker } from "../components/BackgroundSoundPicker.js";

const ICONS = {
  home: "assets/icons/icon-home.png",
  record: "assets/icons/icon-record.png",
  review: "assets/icons/icon-review.png",
  music: "assets/icons/icon-music.png",
  cup: "assets/icons/icon-cup.png",
  lock: "assets/icons/icon-lock.png",
  heart: "assets/icons/icon-heart.png",
};

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatTodayLabel() {
  const today = new Date();
  return `${today.getMonth() + 1}月${today.getDate()}日 ${WEEKDAY_LABELS[today.getDay()]}`;
}

export function HomePage({ navigateTo }) {
  const page = document.createElement("main");
  page.className = "page home-page";

  page.innerHTML = `
    <section class="home-hero-banner" aria-labelledby="home-title">
      <img class="home-hero-icon pixel-icon pixel-icon-lg" src="${ICONS.home}" alt="" aria-hidden="true" />
      <h1 id="home-title">暖窝</h1>
    </section>

    <div class="home-cards">
      <article class="today-card" aria-label="今日状态">
        <div class="today-card-icon" aria-hidden="true">
          <img class="pixel-icon" src="${ICONS.cup}" alt="" />
        </div>
        <div class="today-card-body">
          <div class="today-card-heading today-card-heading-date-only">
            <time>${formatTodayLabel()}</time>
          </div>
          <p class="today-card-mood">把想说的话放在这里</p>
          <button class="today-card-action" type="button" data-record-entry>
            <span>点击记录</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </article>

      <div class="home-cards-row">
        <button class="home-tile" type="button" data-dashboard-entry>
          <h3>7 天回顾</h3>
          <p>看看情绪的变化和反复出现的主题。</p>
          <img class="home-tile-glyph pixel-icon" src="${ICONS.review}" alt="" aria-hidden="true" />
        </button>
        <button class="home-tile" type="button" data-happy-entry>
          <h3>开心 moment</h3>
          <p>收集生活里值得被记住的小确幸。</p>
          <img class="home-tile-glyph pixel-icon" src="${ICONS.heart}" alt="" aria-hidden="true" />
        </button>
      </div>

      <button class="home-privacy-row" type="button" data-privacy-row disabled>
        <img class="pixel-icon pixel-icon-sm" src="${ICONS.lock}" alt="" aria-hidden="true" />
        <span>隐私与安全</span>
        <span aria-hidden="true">已开启</span>
      </button>
    </div>

    <nav class="quick-entry-bar" aria-label="快捷入口">
      <button class="quick-entry is-active" type="button" data-home-entry>
        <img class="quick-entry-icon pixel-icon" src="${ICONS.home}" alt="" aria-hidden="true" />
        <span>首页</span>
      </button>
      <button class="quick-entry" type="button" data-quick-record>
        <img class="quick-entry-icon pixel-icon" src="${ICONS.record}" alt="" aria-hidden="true" />
        <span>记录</span>
      </button>
      <button class="quick-entry" type="button" data-quick-dashboard>
        <img class="quick-entry-icon pixel-icon" src="${ICONS.review}" alt="" aria-hidden="true" />
        <span>回顾</span>
      </button>
      <button class="quick-entry" type="button" data-quick-music>
        <img class="quick-entry-icon pixel-icon" src="${ICONS.music}" alt="" aria-hidden="true" />
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
        page.style.setProperty("--ambient-overlay", sound.overlay);
      },
    }),
  );

  return page;
}
