// Shared fetch with retry and backoff for the research adapters. Confidential (Mentura).
// Retries 429, 5xx and network errors (including timeouts), honouring Retry-After. Each try is
// aborted after `timeout` ms so a hanging host cannot block a run. Tests pass a stub fetch and a
// no-op sleep.

export const UA = "Mentura research engine (research@mentura.invalid)";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function once(f, url, headers, timeout) {
  const ctl = new AbortController();
  let timer;
  const timedOut = new Promise((_, reject) => { timer = setTimeout(() => { ctl.abort(); reject(Object.assign(new Error(`${url}: timed out after ${timeout} ms`), { network: true })); }, timeout); });
  try {
    return await Promise.race([f(url, { headers: { "user-agent": UA, ...headers }, signal: ctl.signal }), timedOut]);
  } catch (e) {
    throw e.network ? e : Object.assign(new Error(`${url}: ${e.message ?? e}`), { network: true, cause: e });
  } finally { clearTimeout(timer); }
}

export async function getWithRetry(url, { fetch: f = globalThis.fetch, sleep = wait, retries = 4, base = 1000, headers = {}, timeout = 20000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try { res = await once(f, url, headers, timeout); }
    catch (e) {
      if (attempt >= retries) throw new Error(`${e.message} after ${retries + 1} tries`);
      await sleep(base * 2 ** attempt); continue;
    }
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt >= retries) throw new Error(`${url}: HTTP ${res.status} after ${retries + 1} tries`);
    const after = Number(res.headers?.get?.("retry-after"));
    await sleep(Number.isFinite(after) && after > 0 ? after * 1000 : base * 2 ** attempt);
  }
}
export const json = async (res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };
