// Shared fetch with retry and backoff for the research adapters. Confidential (Mentura).
// Retries 429 and 5xx, honouring Retry-After; tests pass a stub fetch and a no-op sleep.

export const UA = "Mentura research engine (research@mentura.invalid)";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getWithRetry(url, { fetch: f = globalThis.fetch, sleep = wait, retries = 4, base = 1000, headers = {} } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await f(url, { headers: { "user-agent": UA, ...headers } });
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt >= retries) throw new Error(`${url}: HTTP ${res.status} after ${retries + 1} tries`);
    const after = Number(res.headers?.get?.("retry-after"));
    await sleep(Number.isFinite(after) && after > 0 ? after * 1000 : base * 2 ** attempt);
  }
}
export const json = async (res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };
