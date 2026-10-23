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

test("record submit waits for durable save before opening the reply page", async () => {
  setup();
  let resolveSave, target;
  const calls = [];
  const page = RecordPage({ query: new URLSearchParams(), navigateTo(value) { target = value; },
    request(url, options) { calls.push({ url, body: JSON.parse(options.body) }); return new Promise(resolve => { resolveSave = resolve; }); } });
  page.querySelector("[data-note]").value = "今天想记下来";
  page.querySelector("form").dispatchEvent(new window.Event("submit", { cancelable: true }));
  page.querySelector("form").dispatchEvent(new window.Event("submit", { cancelable: true }));
  assert.equal(target, undefined);
  assert.equal(calls.length, 1);
  assert.match(String(calls[0].url), /\/api\/records$/);
  assert.equal(calls[0].body.mood_text, "今天想记下来");
  resolveSave(new Response('{"record_id":"42"}'));
  await tick();
  assert.equal(target, "/ai-reply");
  assert.equal(JSON.parse(sessionStorage.getItem("nuanwo_ai_reply_payload")).record_id, "42");
});

test("failed initial save keeps note and retries with the same request id", async () => {
  setup();
  let target;
  const keys = [];
  const page = RecordPage({ navigateTo(value) { target = value; }, request: async (_url, options) => {
    keys.push(JSON.parse(options.body).client_request_id);
    return keys.length === 1 ? new Response("{}", { status: 503 }) : new Response('{"record_id":"42"}');
  } });
  page.querySelector("[data-note]").value = "不能丢的原文";
  const submit = () => page.querySelector("form").dispatchEvent(new window.Event("submit", { cancelable: true }));
  submit();
  await tick();
  assert.equal(target, undefined);
  assert.equal(page.querySelector("[data-note]").value, "不能丢的原文");
  assert.match(page.querySelector("[data-save-error]").textContent, /未保存/);
  submit();
  await tick();
  assert.equal(keys[0], keys[1]);
  assert.equal(target, "/ai-reply");
});

function storedNote() {
  sessionStorage.setItem("nuanwo_ai_reply_payload", JSON.stringify({ record_id: "42", mood_text: "test", intensity: 3, scene_category: "test" }));
}

test("leaving during generation never depends on a later record insert", async () => {
  setup(); storedNote();
  const calls = [];
  const page = AiReplyPage({ navigateTo() {}, request(url, options) {
    calls.push(String(url));
    return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new DOMException("left", "AbortError"))));
  } });
  assert.match(calls[0], /\/api\/records\/42\/analyze$/);
  page.destroy();
  await tick();
  assert.equal(calls.length, 1);
  assert.equal(JSON.parse(sessionStorage.getItem("nuanwo_ai_reply_payload")).record_id, "42");
});

test("AI failure confirms saved note and retry uses the same record", async () => {
  for (const fallback of [false, true]) {
    setup(); storedNote();
    const calls = [];
    const page = AiReplyPage({ navigateTo() {}, request: async url => {
      calls.push(String(url));
      return fallback ? Response.json({ generation_status: "fallback" }) : new Response("{}", { status: 503 });
    } });
    await tick();
    assert.equal(page.querySelector("[data-error-text]").textContent, "回复没生成出来，记录已保存");
    page.querySelector("[data-retry]").click();
    await tick();
    assert.equal(calls.length, 2);
    assert.equal(calls[0], calls[1]);
    assert.match(calls[0], /\/api\/records\/42\/analyze$/);
    page.destroy();
  }
});

test("saved AI response is independent of the typewriter animation", async () => {
  setup(); storedNote();
  const calls = [];
  const page = AiReplyPage({ navigateTo() {}, request: async url => {
    calls.push(String(url));
    return Response.json({ record_id: "42", ai_reply: "这是一段还没有播完就离开的长回复", generation_status: "generated" });
  } });
  await tick();
  page.destroy();
  await tick();
  assert.equal(calls.length, 1);
  assert.match(calls[0], /\/api\/records\/42\/analyze$/);
});

test("legacy reply-page payload is saved before analysis starts", async () => {
  setup();
  sessionStorage.setItem("nuanwo_ai_reply_payload", JSON.stringify({ mood_text: "test", intensity: 3, scene_category: "test" }));
  const calls = [];
  const page = AiReplyPage({ navigateTo() {}, request: async url => {
    calls.push(String(url));
    return calls.length === 1 ? Response.json({ record_id: "42" }) : Response.json({ generation_status: "fallback" });
  } });
  await tick();
  assert.match(calls[0], /\/api\/records$/);
  assert.match(calls[1], /\/api\/records\/42\/analyze$/);
  page.destroy();
});
