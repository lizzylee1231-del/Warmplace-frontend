import { BackgroundSoundPicker } from "../components/BackgroundSoundPicker.js";

const DEFAULT_BACKGROUND =
  "linear-gradient(135deg, rgba(232, 139, 92, 0.2), transparent 32%), linear-gradient(315deg, rgba(91, 141, 146, 0.22), transparent 34%), #f7f3ed";

export function HomePage({ navigateTo }) {
  const page = document.createElement("main");
  page.className = "page home-page";
  page.style.background = DEFAULT_BACKGROUND;
  page.style.transition = "background 240ms ease";

  page.innerHTML = `
    <section class="home-hero" aria-labelledby="home-title">
      <p class="eyebrow">暖屋</p>
      <h1 id="home-title">给今天的心情留一盏灯</h1>
      <p class="hero-copy">
        把想说的话放在这里
      </p>
      <div class="home-actions">
        <button class="primary-action" type="button" data-record-entry>
          记录今天的情绪
        </button>
        <button class="secondary-action" type="button" data-happy-entry>
          😊 记录开心 Moment
        </button>
        <button class="secondary-action" type="button" data-dashboard-entry>
          查看疗愈回顾
        </button>
      </div>
    </section>

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
