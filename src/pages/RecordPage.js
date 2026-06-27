const TAGS = ["开心", "工作", "关系", "身体", "睡眠", "独处", "天气"];
const AI_REQUEST_KEY = "nuanwo_ai_reply_payload";

export function RecordPage({ navigateTo, query }) {
  const page = document.createElement("main");
  page.className = "page record-page";
  const isHappyMood = query?.get("mood") === "happy";
  const selectedTags = isHappyMood ? ["开心"] : [];
  const defaultIntensity = isHappyMood ? 5 : 3;

  page.innerHTML = `
    <header class="page-header">
      <button class="ghost-button" type="button" data-back-home>返回首页</button>
      <div>
        <p class="eyebrow">情绪记录</p>
        <h1>今天过得怎么样</h1>
      </div>
    </header>

    <form class="record-form" data-record-form>
      <label class="field">
        <span>今天过得怎么样</span>
        <textarea
          name="note"
          rows="5"
          placeholder="写下此刻的想法和感受吧~
随便写写、乱一点也没关系"
          required
        ></textarea>
      </label>

      <fieldset class="field tag-field">
        <legend>选择标签</legend>
        <div class="tag-list">
          ${TAGS.map(
            (tag) => `
              <label class="tag-option">
                <input
                  type="checkbox"
                  name="tags"
                  value="${tag}"
                  ${selectedTags.includes(tag) ? "checked" : ""}
                />
                <span>${tag}</span>
              </label>
            `,
          ).join("")}
        </div>
      </fieldset>

      <label class="field range-field">
        <span>情绪强度</span>
        <div class="range-row">
          <input name="intensity" type="range" min="1" max="5" value="${defaultIntensity}" data-intensity />
          <output data-intensity-output>${defaultIntensity}</output>
        </div>
      </label>

      <button class="primary-action form-action" type="submit">
        让它陪我待一会儿
      </button>
    </form>
  `;

  const form = page.querySelector("[data-record-form]");
  const intensityInput = page.querySelector("[data-intensity]");
  const intensityOutput = page.querySelector("[data-intensity-output]");

  page.querySelector("[data-back-home]").addEventListener("click", () => {
    navigateTo("/");
  });

  intensityInput.addEventListener("input", () => {
    intensityOutput.value = intensityInput.value;
    intensityOutput.textContent = intensityInput.value;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      // 这里转换为后端 /api/ai/analyze 需要的字段名，并暂存在 sessionStorage 中。
      mood_text: formData.get("note"),
      emotion_tags: formData.getAll("tags"),
      intensity: Number(formData.get("intensity")),
      scene_category: "日常记录",
      happy_moment: formData.getAll("tags").includes("开心") ? formData.get("note") : null,
    };

    console.log("emotion record", payload);
    sessionStorage.setItem(AI_REQUEST_KEY, JSON.stringify(payload));
    navigateTo("/ai-reply");
  });

  return page;
}
