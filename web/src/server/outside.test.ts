import { Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { call, outsideFetch, outsideText } from "./outside";

/** A fetch that answers each try from the list, in order: a status, "throw", or "hang" (answers only on abort). */
function script(...tries: (number | "throw" | "hang")[]) {
  const seen: { url: string; ua: string | null }[] = [];
  const fetcher = (async (url: string, init?: RequestInit) => {
    seen.push({ url, ua: new Headers(init?.headers).get("user-agent") });
    const t = tries.shift() ?? 200;
    if (t === "throw") throw new TypeError("fetch failed");
    if (t === "hang") return new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
    return new Response(`body ${t}`, { status: t });
  }) as typeof fetch;
  return { fetcher, seen };
}

const fast = { backoffMs: 1 };

describe("outside calls", () => {
  it("answers on the first try and sends Reflect's user-agent", async () => {
    const s = script(200);
    const r = await Effect.runPromise(call("https://x.test/a", {}, { ...fast, fetcher: s.fetcher }));
    expect(r.status).toBe(200);
    expect(s.seen).toEqual([{ url: "https://x.test/a", ua: "reflect-app" }]);
  });

  it("tries again when the service is busy or cannot be reached, then answers", async () => {
    const s = script(503, "throw", 200);
    expect(await outsideText("https://x.test/b", {}, { ...fast, fetcher: s.fetcher })).toBe("body 200");
    expect(s.seen).toHaveLength(3);
  });

  it("does not try again on a 404, and gives it to the caller", async () => {
    const s = script(404);
    const r = await outsideFetch({ ...fast, fetcher: s.fetcher })("https://x.test/c");
    expect(r.status).toBe(404);
    expect(s.seen).toHaveLength(1);
    expect(await outsideText("https://x.test/c", {}, { ...fast, fetcher: script(404).fetcher })).toBeNull();
  });

  it("fails with Busy after the last try, carrying the status", async () => {
    const exit = await Effect.runPromiseExit(call("https://x.test/d", {}, { ...fast, retries: 1, fetcher: script(429, 429).fetcher }));
    expect(Exit.isFailure(exit)).toBe(true);
    const err = Exit.isFailure(exit) ? exit.cause.toString() : "";
    expect(err).toContain("Busy");
  });

  it("times out a call that hangs and fails with TimedOut", async () => {
    const out = await Effect.runPromise(
      call("https://x.test/e", {}, { timeoutMs: 20, retries: 0, fetcher: script("hang").fetcher }).pipe(
        Effect.map(() => "answered"),
        Effect.catchTag("TimedOut", (e) => Effect.succeed(`timed out after ${e.ms} ms`)),
      ),
    );
    expect(out).toBe("timed out after 20 ms");
  });

  it("does not repeat a POST unless asked", async () => {
    const s = script(503, 200);
    expect((await outsideFetch({ ...fast, fetcher: s.fetcher })("https://x.test/h", { method: "POST" })).status).toBe(503);
    expect(s.seen).toHaveLength(1);
  });

  it("outsideFetch rejects only when no answer came", async () => {
    await expect(outsideFetch({ ...fast, retries: 1, fetcher: script("throw", "throw").fetcher })("https://x.test/f")).rejects.toBeTruthy();
    expect((await outsideFetch({ ...fast, retries: 0, fetcher: script(500).fetcher })("https://x.test/g")).status).toBe(500);
  });
});
