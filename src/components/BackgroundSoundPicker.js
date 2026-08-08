const SOUND_OPTIONS = [
  {
    id: "wind",
    icon: "🍃",
    label: "风声",
    src: "assets/sounds/wind.mp3",
    overlay: "rgba(128, 184, 156, 0.16)",
  },
  {
    id: "rain",
    icon: "🌧",
    label: "雨声",
    src: "assets/sounds/rain.mp3",
    overlay: "rgba(95, 124, 154, 0.18)",
  },
  {
    id: "wave",
    icon: "🌊",
    label: "海浪声",
    src: "assets/sounds/wave.mp3",
    overlay: "rgba(86, 145, 170, 0.16)",
  },
  {
    id: "cicada",
    icon: "🦗",
    label: "蝉鸣声",
    src: "assets/sounds/cicada.mp3",
    overlay: "rgba(126, 159, 75, 0.16)",
  },
  {
    id: "fire",
    icon: "🔥",
    label: "冬日柴火声",
    src: "assets/sounds/fire.mp3",
    overlay: "rgba(210, 112, 45, 0.18)",
  },
];

export function BackgroundSoundPicker({ onChange }) {
  const container = document.createElement("div");
  container.className = "sound-picker";

  let selectedSound = null;
  let isOpen = false;
  const audio = new Audio();
  audio.loop = true;
  audio.volume = 0.45;

  function playSound(sound) {
    if (audio.src !== new URL(sound.src, window.location.href).href) {
      audio.src = sound.src;
    }

    audio.play().catch(() => {
      // 浏览器可能会因播放策略阻止音频；用户下一次点击时会再次尝试。
    });
  }

  function render() {
    container.innerHTML = `
      ${
        isOpen
          ? `
            <button
              class="sound-picker-overlay"
              type="button"
              data-sound-overlay
              aria-label="关闭背景音选择面板"
            ></button>
            <div class="sound-picker-menu" role="menu" aria-label="背景音选项">
              ${SOUND_OPTIONS.map(
                (sound) => `
                  <button
                    class="sound-option ${sound.id === selectedSound?.id ? "is-active" : ""}"
                    type="button"
                    data-sound-option="${sound.id}"
                    role="menuitem"
                  >
                    <span aria-hidden="true">${sound.icon}</span>
                    <span>${sound.label}</span>
                  </button>
                `,
              ).join("")}
            </div>
          `
          : ""
      }
      <button
        class="sound-toggle"
        type="button"
        data-sound-toggle
        aria-label="选择背景音"
        aria-expanded="${isOpen}"
      >
        ${
          selectedSound
            ? `<span aria-hidden="true">${selectedSound.icon}</span>`
            : `<span class="sound-toggle-glyph" aria-hidden="true">♫</span>`
        }
      </button>
    `;

    container.querySelector("[data-sound-toggle]").addEventListener("click", () => {
      isOpen = !isOpen;
      render();
    });

    container.querySelector("[data-sound-overlay]")?.addEventListener("click", () => {
      isOpen = false;
      render();
    });

    container.querySelectorAll("[data-sound-option]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedSound = SOUND_OPTIONS.find(
          (sound) => sound.id === button.dataset.soundOption,
        );
        isOpen = false;
        playSound(selectedSound);
        onChange(selectedSound);
        render();
      });
    });
  }

  container.destroy = () => {
    audio.pause();
    audio.src = "";
  };

  render();
  return container;
}
