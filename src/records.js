import { apiFetch, buildApiUrl } from "./api.js";

// The same client_request_id makes a retry safe if the first response was lost.
export async function saveNote(payload, request = apiFetch) {
  const response = await request(buildApiUrl("/api/records"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, user_id: undefined, record_id: undefined }),
  });
  if (!response.ok) throw new Error("记录未保存，请重试。");
  const data = await response.json();
  if (!data.record_id) throw new Error("记录未保存，请重试。");
  return String(data.record_id);
}
