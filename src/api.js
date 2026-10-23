export const API_BASE_URL = "";

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
import { getSession } from "./auth.js";


export function createApiFetch(sessionProvider, send = (...args) => fetch(...args)) {
  return async function request(url, options = {}) {
    options.signal?.throwIfAborted();
    const session = await sessionProvider();
    options.signal?.throwIfAborted();
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${session.access_token}`);
    return send(url, { ...options, headers, cache: "no-store" });
  };
}

export const apiFetch = createApiFetch(getSession);
