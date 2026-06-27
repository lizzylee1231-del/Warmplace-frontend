const EMOTION_TAGS = [
  { label: "焦虑", icon: "🌺" },
  { label: "疲惫", icon: "😊" },
  { label: "难过", icon: "☹" },
  { label: "压力大", icon: "☹" },
  { label: "平静", icon: "☺" },
  { label: "开心", icon: "☺" },
  { label: "孤独", icon: "☹" },
  { label: "其他", icon: "…" },
];

const SCENE_TAGS = [
  { label: "工作/学习", icon: "💻" },
  { label: "人际关系", icon: "👥" },
  { label: "亲密关系", icon: "💗" },
  { label: "家庭", icon: "🏠" },
  { label: "独处", icon: "🌿" },
  { label: "其他", icon: "…" },
];

const AI_REQUEST_KEY = "nuanwo_ai_reply_payload";
const LAMP_ICON = "assets/icons/icon-lamp.png";

function renderChoice({ label, icon }, name, selectedValues = []) {
  return `
    <label class="record-choice">
      <input
        type="checkbox"
        name="${name}"
        value="${label}"
        ${selectedValues.includes(label) ? "checked" : ""}
      />
      <span>
        <span class="choice-icon" aria-hidden="true">${icon}</span>
        ${label}
      </span>
    </label>
  `;
}

function renderIntensityOption(value, defaultIntensity) {
  return `
    <label class="intensity-option">
      <input
        type="radio"
        name="intensity"
        value="${value}"
        ${value === defaultIntensity ? "checked" : ""}
      />
      <span>
        <img src="${LAMP_ICON}" alt="" aria-hidden="true" />
        <strong>${value}</strong>
      </span>
    </label>
  `;
}

export function RecordPage({ navigateTo, query }) {
  const page = document.createElement("main");
  page.className = "page record-page";
  const isHappyMood = query?.get("mood") === "happy";
  const selectedTags = isHappyMood ? ["开心"] : [];
  const defaultIntensity = isHappyMood ? 5 : 3;

  page.innerHTML = `
    <header class="record-topbar">
      <button class="record-back-button" type="button" data-back-home aria-label="返回首页">
        <span aria-hidden="true">←</span>
      </button>
      <h1>此刻的心事</h1>
      <img class="record-top-icon" src="${LAMP_ICON}" alt="" aria-hidden="true" />
    </header>

    <form class="record-form record-pixel-form" data-record-form>
      <label class="record-note-field">
        <textarea
          name="note"
          maxlength="800"
          placeholder="把此刻的想法和感受写下来吧...&#10;此刻的你，不需要完美表达"
          required
          data-note
        ></textarea>
        <span class="note-counter"><output data-note-count>0</output>/800</span>
      </label>

      <section class="record-section" aria-labelledby="emotion-title">
        <div class="record-section-heading">
          <h2 id="emotion-title">现在感觉怎么样？</h2>
        </div>
        <div class="record-choice-grid emotion-grid">
          ${EMOTION_TAGS.map((tag) => renderChoice(tag, "tags", selectedTags)).join("")}
        </div>
      </section>

      <section class="record-section" aria-labelledby="intensity-title">
        <div class="record-section-heading compact">
          <h2 id="intensity-title">情绪强度</h2>
          <p>此刻感受有多强烈？</p>
        </div>
        <div class="intensity-picker" role="radiogroup" aria-labelledby="intensity-title">
          ${[1, 2, 3, 4, 5].map((value) => renderIntensityOption(value, defaultIntensity)).join("")}
        </div>
      </section>

      <section class="record-section" aria-labelledby="scene-title">
        <div class="record-section-heading">
          <h2 id="scene-title">发生的场景</h2>
          <p>可多选</p>
        </div>
        <div class="record-choice-grid scene-grid">
          ${SCENE_TAGS.map((tag) => renderChoice(tag, "scenes")).join("")}
        </div>
      </section>

      <button class="record-submit" type="submit">
        <span aria-hidden="true">✦</span>
        让我们一起走近情绪
        <span aria-hidden="true">✦</span>
      </button>
    </form>
  `;

  const form = page.querySelector("[data-record-form]");
  const noteInput = page.querySelector("[data-note]");
  const noteCount = page.querySelector("[data-note-count]");

  page.querySelector("[data-back-home]").addEventListener("click", () => {
    navigateTo("/");
  });

  noteInput.addEventListener("input", () => {
    noteCount.textContent = String(noteInput.value.length);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const emotionTags = formData.getAll("tags");
    const sceneTags = formData.getAll("scenes");
    const payload = {
      mood_text: formData.get("note"),
      emotion_tags: emotionTags,
      intensity: Number(formData.get("intensity") ?? defaultIntensity),
      scene_category: sceneTags.length ? sceneTags.join("、") : "日常记录",
      happy_moment: emotionTags.includes("开心") ? formData.get("note") : null,
    };

    console.log("emotion record", payload);
    sessionStorage.setItem(AI_REQUEST_KEY, JSON.stringify(payload));
    navigateTo("/ai-reply");
  });

  return page;
}
