const SOUND_OPTIONS = [
  {
    id: "wind",
    icon: "🌬️",
    label: "风声",
    background: "linear-gradient(135deg, #e0f7fa, #b2ebf2)",
  },
  {
    id: "rain",
    icon: "🌧️",
    label: "雨声",
    background: "linear-gradient(135deg, #cfd8dc, #90a4ae)",
  },
  {
    id: "wave",
    icon: "🌊",
    label: "海浪声",
    background: "linear-gradient(135deg, #b3e5fc, #81d4fa)",
  },
  {
    id: "cicada",
    icon: "🦗",
    label: "蝉鸣声",
    background: "linear-gradient(135deg, #dcedc8, #aed581)",
  },
  {
    id: "fire",
    icon: "🔥",
    label: "冬日柴火声",
    background: "linear-gradient(135deg, #ffe0b2, #ffcc80)",
  },
];

export function BackgroundSoundPicker({ onChange }) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.right = "24px";
  container.style.bottom = "112px";
  container.style.zIndex = "10";

  let selectedSound = null;
  let isOpen = false;

  function render() {
    container.innerHTML = `
      ${
        isOpen
          ? `
            <button
              type="button"
              data-sound-overlay
              aria-label="关闭背景音选择面板"
              style="
                position: fixed;
                inset: 0;
                border: 0;
                background: transparent;
                cursor: default;
              "
            ></button>
            <div
              role="menu"
              aria-label="背景音选项"
              style="
                position: absolute;
                right: 0;
                bottom: 64px;
                display: grid;
                gap: 10px;
                width: min(260px, calc(100vw - 48px));
                padding: 12px;
                border: 1px solid rgba(43, 107, 116, 0.18);
                border-radius: 8px;
                background: rgba(255, 253, 249, 0.95);
                box-shadow: 0 18px 42px rgba(68, 54, 48, 0.18);
                backdrop-filter: blur(10px);
              "
            >
              ${SOUND_OPTIONS.map(
                (sound) => `
                  <button
                    type="button"
                    data-sound-option="${sound.id}"
                    role="menuitem"
                    style="
                      display: flex;
                      align-items: center;
                      gap: 10px;
                      min-height: 46px;
                      width: 100%;
                      padding: 0 12px;
                      border: 1px solid ${
                        sound.id === selectedSound?.id
                          ? "rgba(46, 125, 50, 0.82)"
                          : "rgba(82, 72, 68, 0.12)"
                      };
                      border-radius: 8px;
                      background: ${
                        sound.id === selectedSound?.id
                          ? "rgba(76, 175, 80, 0.14)"
                          : "#fffdf9"
                      };
                      color: #26211f;
                      box-shadow: ${
                        sound.id === selectedSound?.id
                          ? "0 8px 18px rgba(46, 125, 50, 0.16)"
                          : "none"
                      };
                      text-align: left;
                      font-weight: 700;
                    "
                  >
                    <span aria-hidden="true" style="font-size: 1.25rem;">${sound.icon}</span>
                    <span>${sound.label}</span>
                  </button>
                `,
              ).join("")}
            </div>
          `
          : ""
      }
      <button
        type="button"
        data-sound-toggle
        aria-label="选择背景音"
        aria-expanded="${isOpen}"
        style="
          display: grid;
          width: 52px;
          height: 52px;
          place-items: center;
          border: 1px solid rgba(43, 107, 116, 0.22);
          border-radius: 999px;
          background: rgba(255, 253, 249, 0.88);
          box-shadow: 0 14px 28px rgba(68, 54, 48, 0.18);
          font-size: 1.45rem;
        "
      >
        ${selectedSound?.icon ?? "🎵"}
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
