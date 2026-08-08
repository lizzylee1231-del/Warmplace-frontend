import { navigateTo } from "../router.js";

const EMOTION_TAGS = [
  { label: "焦虑", icon: "assets/icons/icon-emotion-anxiety.png" },
  { label: "疲惫", icon: "assets/icons/icon-emotion-tired.png" },
  { label: "难过", icon: "assets/icons/icon-emotion-sad.png" },
  { label: "压力大", icon: "assets/icons/icon-emotion-stress.png" },
  { label: "平静", icon: "assets/icons/icon-emotion-calm.png" },
  { label: "开心", icon: "assets/icons/icon-emotion-happy.png" },
  { label: "孤独", icon: "assets/icons/icon-emotion-lonely.png" },
  { label: "其它", icon: "assets/icons/icon-emotion-other.png" },
];

const SCENE_TAGS = [
  { label: "工作/学习", icon: "assets/icons/icon-scene-work.png" },
  { label: "人际关系", icon: "assets/icons/icon-scene-relationship.png" },
  { label: "亲密关系", icon: "assets/icons/icon-scene-intimate.png" },
  { label: "家庭", icon: "assets/icons/icon-scene-family.png" },
  { label: "独处", icon: "assets/icons/icon-scene-alone.png" },
  { label: "其它", icon: "assets/icons/icon-scene-other.png" },
];

const AI_REQUEST_KEY = "nuanwo_ai_reply_payload";
const LAMP_ICON = "assets/icons/icon-lamp.png";

function normalizeTag(value) { return String(value ?? "").trim(); }
function uniqueTags(tags) { return Array.from(new Set(tags.map(normalizeTag).filter(Boolean))); }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

function renderChoice({ label, icon }, name, selectedValues = []) {
  return `<label class="record-choice"><input type="checkbox" name="${name}" value="${label}" ${selectedValues.includes(label) ? "checked" : ""} /><span class="record-choice-content"><img class="record-choice-icon" src="${icon}" alt="" aria-hidden="true" /><span>${label}</span></span></label>`;
}

function renderIntensityOption(value, defaultIntensity) {
  return `<label class="intensity-option"><input type="radio" name="intensity" value="${value}" ${value === defaultIntensity ? "checked" : ""} /><span><img src="${LAMP_ICON}" alt="" aria-hidden="true" /><strong>${value}</strong></span></label>`;
}

export function RecordPage({ query }) {
  const page = document.createElement("main");
  page.className = "page record-page";
  const isHappyMood = query?.get("mood") === "happy";
  const selectedTags = isHappyMood ? ["开心"] : [];
  const defaultIntensity = isHappyMood ? 5 : 3;

  page.innerHTML = `
    <header class="record-topbar"><button class="record-back-button" type="button" data-back-home aria-label="返回首页"><span aria-hidden="true">←</span></button><h1>今天过得怎么样</h1><img class="record-top-icon" src="${LAMP_ICON}" alt="" aria-hidden="true" /></header>
    <form class="record-form record-pixel-form" data-record-form>
      <label class="record-note-field"><textarea name="note" maxlength="800" placeholder="写下此刻的想法和感受吧~&#10;随便写写，乱一点也没关系😊" required data-note></textarea><span class="note-counter"><output data-note-count>0</output>/800</span></label>
      <section class="record-section" aria-labelledby="emotion-title"><div class="record-section-heading"><h2 id="emotion-title">现在感觉怎么样？</h2></div><div class="record-choice-grid emotion-grid">${EMOTION_TAGS.map((tag) => renderChoice(tag, "tags", selectedTags)).join("")}</div><div class="custom-emotion-field"><label for="custom-emotion-input">自定义标签</label><div class="custom-emotion-control"><input id="custom-emotion-input" type="text" maxlength="18" placeholder="例如：被治愈" data-custom-emotion-input /><button type="button" data-add-custom-emotion>添加</button></div><div class="custom-emotion-selected" data-custom-emotion-selected></div></div></section>
      <section class="record-section" aria-labelledby="intensity-title"><div class="record-section-heading compact"><h2 id="intensity-title">情绪强度</h2><p>此刻感受有多强烈？</p></div><div class="intensity-picker" role="radiogroup" aria-labelledby="intensity-title">${[1, 2, 3, 4, 5].map((value) => renderIntensityOption(value, defaultIntensity)).join("")}</div></section>
      <section class="record-section" aria-labelledby="scene-title"><div class="record-section-heading"><h2 id="scene-title">发生的场景</h2><p>可多选</p></div><div class="record-choice-grid scene-grid">${SCENE_TAGS.map((tag) => renderChoice(tag, "scenes")).join("")}</div></section>
      <button class="record-submit" type="submit"><span aria-hidden="true">✦</span>让它陪我待一会儿<span aria-hidden="true">✦</span></button>
    </form>
  `;

  const form = page.querySelector("[data-record-form]");
  const noteInput = page.querySelector("[data-note]");
  const noteCount = page.querySelector("[data-note-count]");
  const customEmotionInput = page.querySelector("[data-custom-emotion-input]");
  const addCustomEmotionButton = page.querySelector("[data-add-custom-emotion]");
  const customEmotionSelected = page.querySelector("[data-custom-emotion-selected]");
  let customEmotionTags = [];

  page.querySelector("[data-back-home]").addEventListener("click", () => navigateTo("/"));
  noteInput.addEventListener("input", () => { noteCount.textContent = String(noteInput.value.length); });

  function renderCustomEmotionTags() {
    customEmotionSelected.innerHTML = customEmotionTags.map((tag, index) => `<button class="custom-emotion-chip" type="button" data-remove-custom-emotion="${index}"><span>${escapeHtml(tag)}</span><span aria-hidden="true">×</span></button>`).join("");
    customEmotionSelected.querySelectorAll("[data-remove-custom-emotion]").forEach((button) => {
      button.addEventListener("click", () => { customEmotionTags = customEmotionTags.filter((_tag, index) => index !== Number(button.dataset.removeCustomEmotion)); renderCustomEmotionTags(); });
    });
  }

  function addCustomEmotionTag(value = customEmotionInput.value) {
    const tag = normalizeTag(value);
    if (!tag || customEmotionTags.includes(tag)) return;
    customEmotionTags = uniqueTags([...customEmotionTags, tag]);
    customEmotionInput.value = "";
    renderCustomEmotionTags();
  }

  addCustomEmotionButton.addEventListener("click", () => addCustomEmotionTag());
  customEmotionInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); addCustomEmotionTag(); } });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const emotionTags = uniqueTags([...formData.getAll("tags"), ...customEmotionTags, customEmotionInput.value]);
    const sceneTags = formData.getAll("scenes");
    const note = String(formData.get("note") ?? "").trim();
    const payload = { user_id: window.USER_ID, mood_text: note, emotion_tags: emotionTags, intensity: Number(formData.get("intensity") ?? defaultIntensity), scene_category: sceneTags.length ? sceneTags.join("、") : "日常记录", happy_moment: emotionTags.includes("开心") ? note : null };
    sessionStorage.setItem(AI_REQUEST_KEY, JSON.stringify(payload));
    navigateTo("/ai-reply");
  });
  return page;
}
