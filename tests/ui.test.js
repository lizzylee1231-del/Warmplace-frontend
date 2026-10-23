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
  assert.equal(target, "/ai-reply?record_id=42");
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
  assert.equal(target, "/ai-reply?record_id=42");
});

function storedNote() {
  sessionStorage.setItem("nuanwo_ai_reply_payload", JSON.stringify({ record_id: "42", mood_text: "test", intensity: 3, scene_category: "test" }));
}
const pendingRecord = () => Response.json({ record_id: "42", mood_text: "test", ai_reply: null });

test("leaving during generation never depends on a later record insert", async () => {
  setup(); storedNote();
  const calls = [];
  const page = AiReplyPage({ navigateTo() {}, request(url, options) {
    calls.push(String(url));
    if (!String(url).endsWith("/analyze")) return Promise.resolve(pendingRecord());
    return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new DOMException("left", "AbortError"))));
  } });
  await tick();
  assert.match(calls[1], /\/api\/records\/42\/analyze$/);
  page.destroy();
  await tick();
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(sessionStorage.getItem("nuanwo_ai_reply_payload")).record_id, "42");
});

test("AI failure confirms saved note and retry uses the same record", async () => {
  for (const fallback of [false, true]) {
    setup(); storedNote();
    const calls = [];
    const page = AiReplyPage({ navigateTo() {}, request: async url => {
      if (!String(url).endsWith("/analyze")) return pendingRecord();
      calls.push(String(url));
      return fallback ? Response.json({ generation_status: "fallback" }) : new Response("{}", { status: 503 });
    } });
    await tick();
    assert.equal(page.querySelector("[data-error-text]").textContent, "回复没生成出来，记录已保存");
    assert.equal(page.querySelector("[data-care-card]").hidden, true);
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
    if (!String(url).endsWith("/analyze")) return pendingRecord();
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
    if (String(url).endsWith("/api/records")) return Response.json({ record_id: "42" });
    if (!String(url).endsWith("/analyze")) return pendingRecord();
    return Response.json({ generation_status: "fallback" });
  } });
  await tick();
  assert.match(calls[0], /\/api\/records$/);
  assert.match(calls[1], /\/api\/records\/42$/);
  assert.match(calls[2], /\/api\/records\/42\/analyze$/);
  page.destroy();
});

test("care suggestions remain absent while AI is generating", async () => {
  setup(); storedNote();
  let finish;
  const page = AiReplyPage({ navigateTo() {}, request: async url => {
    if (!String(url).endsWith("/analyze")) return pendingRecord();
    return new Promise(resolve => { finish = resolve; });
  } });
  assert.equal(page.querySelector("[data-care-card]").hidden, true);
  assert.equal(page.querySelector("[data-care-list]").children.length, 0);
  await tick();
  assert.equal(page.querySelector("[data-loading]").hidden, false);
  finish(Response.json({ record_id: "42", ai_reply: "专属回应", ai_self_care_tips: "可以给自己泡杯茶", generation_status: "generated" }));
  await tick();
  assert.equal(page.querySelector("[data-care-card]").hidden, false);
  assert.match(page.querySelector("[data-care-list]").textContent, /可以给自己泡杯茶/);
  assert.doesNotMatch(page.querySelector("[data-care-list]").textContent, /给自己 10 分钟/);
  page.destroy();
});

test("reload by record id restores the full saved reply without session payload or generation", async () => {
  setup();
  const calls = [];
  const reply = "刷新后应该完整读回这条已经保存的回应";
  const page = AiReplyPage({ query: new URLSearchParams("record_id=42"), navigateTo() {}, request: async (url, options) => {
    calls.push({ url: String(url), method: options?.method ?? "GET" });
    return Response.json({ record_id: "42", ai_reply: reply, ai_summary: "保存的小结", ai_self_care_tips: "已经保存的建议" });
  } });
  await tick();
  assert.deepEqual(calls, [{ url: "/api/records/42", method: "GET" }]);
  assert.match(page.querySelector("[data-message]").textContent, new RegExp(reply));
  assert.match(page.querySelector("[data-care-list]").textContent, /已经保存的建议/);
  assert.equal(page.querySelector("[data-empty-state]").hidden, true);
  assert.equal(page.querySelector("[data-loading]").hidden, true);
  page.destroy();
});

test("URL record id takes priority over an unrelated session payload", async () => {
  setup(); storedNote();
  const calls = [];
  const page = AiReplyPage({ query: new URLSearchParams("record_id=84"), navigateTo() {}, request: async url => {
    calls.push(String(url));
    return Response.json({ record_id: "84", ai_reply: "编号 84 的回复" });
  } });
  await tick();
  assert.deepEqual(calls, ["/api/records/84"]);
  assert.match(page.querySelector("[data-message]").textContent, /编号 84 的回复/);
  page.destroy();
});

test("missing or inaccessible record shows a read error without generating or showing tips", async () => {
  setup();
  const calls = [];
  const page = AiReplyPage({ query: new URLSearchParams("record_id=42"), navigateTo() {}, request: async url => {
    calls.push(String(url));
    return new Response("{}", { status: 404 });
  } });
  await tick();
  assert.deepEqual(calls, ["/api/records/42"]);
  assert.match(page.querySelector("[data-error-text]").textContent, /记录.*无法读取|记录不存在/);
  assert.equal(page.querySelector("[data-care-card]").hidden, true);
  page.destroy();
});

test("refreshing an unfinished record resumes generation using that record id", async () => {
  setup();
  const calls = [];
  const page = AiReplyPage({ query: new URLSearchParams("record_id=42"), navigateTo() {}, request: async url => {
    calls.push(String(url));
    return calls.length === 1 ? pendingRecord() : Response.json({ ai_reply: "生成完成", generation_status: "generated" });
  } });
  await tick();
  assert.deepEqual(calls, ["/api/records/42", "/api/records/42/analyze"]);
  assert.equal(page.querySelector("[data-empty-state]").hidden, true);
  page.destroy();
});
