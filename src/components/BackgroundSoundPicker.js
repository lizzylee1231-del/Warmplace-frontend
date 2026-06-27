const MUSIC_ICON = "assets/icons/icon-music.png";

const SOUND_OPTIONS = [
  {
    id: "wind",
    icon: "🍃",
    label: "风声",
    overlay: "rgba(128, 184, 156, 0.16)",
  },
  {
    id: "rain",
    icon: "🌧",
    label: "雨声",
    overlay: "rgba(95, 124, 154, 0.18)",
  },
  {
    id: "wave",
    icon: "🌊",
    label: "海浪声",
    overlay: "rgba(86, 145, 170, 0.16)",
  },
  {
    id: "fire",
    icon: "🔥",
    label: "柴火声",
    overlay: "rgba(210, 112, 45, 0.18)",
  },
];

export function BackgroundSoundPicker({ onChange }) {
  const container = document.createElement("div");
  container.className = "sound-picker";

  let selectedSound = null;
  let isOpen = false;

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
            : `<img class="pixel-icon" src="${MUSIC_ICON}" alt="" aria-hidden="true" />`
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
        onChange(selectedSound);
        render();
      });
    });
  }

  render();
  return container;
}
