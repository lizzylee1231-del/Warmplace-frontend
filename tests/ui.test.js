import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { DashboardPage } from "../src/pages/DashboardPage.js";
import { RecordPage } from "../src/pages/RecordPage.js";
import { AiReplyPage } from "../src/pages/AiReplyPage.js";

function setup() {
  const dom = new JSDOM("<div id='app'></div>", { url: "https://example.test/" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document,
    localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage,
    FormData: dom.window.FormData });
  window.USER_ID = "test-user";
  return dom;
}
const tick = () => new Promise(resolve => setTimeout(resolve, 20));

test("empty dashboard never invents trend or frequency data", async () => {
  setup();
  globalThis.fetch = async url => new Response(JSON.stringify(String(url).includes("weekly-letter")
    ? { record_count: 0, letter: "" }
    : { mood_trend: [], top_emotion_counts: [], top_scene_counts: [], happy_moments_with_date: [], growth_summary: "还没有足够的记录" }));
  const page = DashboardPage({ navigateTo() {}, request: (...args) => fetch(...args) });
  document.body.append(page);
  await tick();
  assert.doesNotMatch(page.textContent, /焦虑\s*4次|工作\/学习\s*5次|5\/12/);
  assert.equal(page.querySelector(".chart-line"), null);
  assert.match(page.textContent, /还没有/);
  page.destroy();
});

test("record page uses router callback when going back", () => {
  setup();
  let target;
  const page = RecordPage({ query: new URLSearchParams(), navigateTo(value) { target = value; } });
  page.querySelector("[data-back-home]").click();
  assert.equal(target, "/");
});

test("retrying a failed save reuses the generated reply", async () => {
  setup();
  sessionStorage.setItem("nuanwo_ai_reply_payload", JSON.stringify({ mood_text: "test", intensity: 3, scene_category: "test" }));
  window.setTimeout = callback => { queueMicrotask(callback); return 0; };
  let generations = 0;
  let saves = 0;
  globalThis.fetch = async url => {
    if (String(url).includes("analyze")) {
      generations++;
      return new Response(JSON.stringify({ ai_reply: "回应", ai_summary: "小结", ai_self_care_tips: "休息", ai_closing_message: "结尾", risk_level: "unknown", generation_status: "fallback" }), { headers: { "content-type": "application/json" } });
    }
    saves++;
    return saves === 1 ? new Response("{}", { status: 503 }) : new Response('{"record_id":"42"}');
  };
  const page = AiReplyPage({ navigateTo() {}, request: (...args) => fetch(...args) });
  document.body.append(page);
  await tick();
  assert.match(page.querySelector("[data-error-text]").textContent, /保存/);
  assert.match(page.textContent, /未完成|通用|暂时/);
  page.querySelector("[data-retry]").click();
  await tick();
  assert.equal(generations, 1);
  assert.equal(saves, 2);
  page.destroy();
});
