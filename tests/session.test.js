import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionManager } from "../src/auth.js";
import { createApiFetch } from "../src/api.js";

test("concurrent first requests create only one anonymous session", async () => {
  let signups = 0;
  const manager = createSessionManager(async () => ({ auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInAnonymously: async () => { signups++; return { data: { session: { access_token: "token", user: { id: "a" } } }, error: null }; },
  } }));
  const sessions = await Promise.all([manager(), manager(), manager()]);
  assert.equal(signups, 1);
  assert.equal(sessions[0].user.id, "a");
});

test("an auth outage is retriable without replacing existing identity", async () => {
  let attempts = 0;
  let signups = 0;
  const manager = createSessionManager(async () => ({ auth: {
    getSession: async () => ++attempts === 1 ? { error: new Error("offline") } : { data: { session: { access_token: "old-token" } } },
    signInAnonymously: async () => { signups++; },
  } }));
  await assert.rejects(manager(), /offline/);
  assert.equal((await manager()).access_token, "old-token");
  assert.equal(signups, 0);
});

test("authenticated requests add token and preserve abort signal", async () => {
  let sent;
  const controller = new AbortController();
  const request = createApiFetch(async () => ({ access_token: "verified-session" }), async (url, init) => { sent = init; return new Response("{}"); });
  await request("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: controller.signal });
  assert.equal(sent.headers.get("Authorization"), "Bearer verified-session");
  assert.equal(sent.headers.get("Content-Type"), "application/json");
  assert.equal(sent.signal, controller.signal);
});

test("request cancellation does not send a request after waiting for auth", async () => {
  const controller = new AbortController();
  let sent = 0;
  const request = createApiFetch(async () => { controller.abort(); return { access_token: "token" }; }, async () => { sent++; });
  await assert.rejects(request("/api/records", { signal: controller.signal }), { name: "AbortError" });
  assert.equal(sent, 0);
});
