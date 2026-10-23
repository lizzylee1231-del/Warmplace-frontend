import { createClient } from "@supabase/supabase-js";

// Keep initialization in flight until all first-page requests share one identity.
export function createSessionManager(makeClient) {
  let clientPromise;
  let pending;
  return async function getSession() {
    if (!pending) {
      pending = (async () => {
        clientPromise ??= Promise.resolve().then(makeClient).catch(error => {
          clientPromise = null;
          throw error;
        });
        const client = await clientPromise;
        const existing = await client.auth.getSession();
        if (existing.error) throw existing.error;
        if (existing.data.session) return existing.data.session;
        const signedIn = await client.auth.signInAnonymously();
        if (signedIn.error) throw signedIn.error;
        if (!signedIn.data.session) throw new Error("无法建立安全会话，请稍后重试。");
        return signedIn.data.session;
      })().finally(() => { pending = null; });
    }
    return pending;
  };
}

export const getSession = createSessionManager(async () => {
  const response = await fetch("/api/auth/config", { cache: "no-store" });
  if (!response.ok) throw new Error("安全会话暂时不可用，请稍后重试。");
  const config = await response.json();
  if (!config.publishable_key?.startsWith("sb_publishable_")) throw new Error("安全会话配置无效。");
  return createClient(config.url, config.publishable_key, {
    auth: { storageKey: "nuanwo_auth_v1", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
});
