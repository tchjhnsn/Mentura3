import { describe, expect, it } from "vitest";
import { serveChanges, serveFileGet, serveFilePut, serveMissing, servePush, type PushInput, type SyncBackend, type Verify } from "./sync-api";
import { memoryBlobs, sha256Of, syncFileKey, type BlobStore } from "./sync-files";
import type { TokenHolder } from "./sync-token";

const WHO: TokenHolder = { business: "harbor", person: "acct1" };
const OTHER: TokenHolder = { business: "mill", person: "acct2" };

/** Stands in for device sign-in: the token "good" belongs to this holder, and nothing else is a token.
 *  A handler the test gives no verify to uses the real one, which reaches the device-auth store. */
const signedIn = (who: TokenHolder = WHO): Verify =>
  async (req) => (req.headers.get("authorization") === "Bearer good" ? who : null);

const call = (path: string, init: RequestInit & { token?: string } = {}): Request => {
  const { token = "good", ...rest } = init;
  return new Request(`https://mentura.xyz${path}`, {
    ...rest,
    headers: { ...(rest.headers as Record<string, string> | undefined), authorization: `Bearer ${token}` },
  });
};

/** A backend that answers from this process and remembers what it was asked. */
function stubBackend(over: Partial<SyncBackend> = {}): SyncBackend & { pushes: PushInput[] } {
  const pushes: PushInput[] = [];
  return {
    pushes,
    changes: over.changes ?? (async (who, since) => ({ business: who.business, point: "7", records: [
      { path: "foundation/problem.json", version: "v1", sha256: "a".repeat(64), content: { statement: since ?? "all" }, by: "Ada", at: "2026-11-25T00:00:00.000Z" },
    ] })),
    push: over.push ?? (async (_who, input) => { pushes.push(input); return { point: "9", accepted: input.changes.map((c) => ({ path: c.path, version: "v2" })) }; }),
  };
}

const push = (body: unknown, token = "good"): Request =>
  call("/api/naive/sync/push", { method: "POST", token, body: JSON.stringify(body), headers: { "content-type": "application/json" } });

const onePush = { working_copy: "laptop", changes: [{ path: "foundation/problem.json", base: "v1", content: { statement: "x" } }] };

/** A verifier that knows no token, as the real one answers for a token device sign-in never issued. */
const nobody: Verify = async () => null;

describe("every route refuses a request whose token names nobody", () => {
  it("answers 401 on every route, and the backend is never asked", async () => {
    const backend = stubBackend();
    const files = memoryBlobs();
    const answers = await Promise.all([
      serveChanges(call("/api/naive/sync/changes"), { backend, verify: nobody }),
      servePush(push(onePush), { backend, verify: nobody }),
      serveMissing(call("/api/naive/sync/files/missing", { method: "POST", body: JSON.stringify({ hashes: [] }) }), { files, verify: nobody }),
      serveFileGet(call("/api/naive/sync/files/x"), "b".repeat(64), { files, verify: nobody }),
      serveFilePut(call("/api/naive/sync/files/x", { method: "PUT", body: "hello" }), "b".repeat(64), { files, verify: nobody }),
    ]);
    for (const r of answers) {
      expect(r.status).toBe(401);
      expect(await r.json()).toEqual({ error: "unauthorized" });
    }
    expect(backend.pushes).toEqual([]);
    expect(files.keys()).toEqual([]);
  });

  it("answers 401 when the request carries no bearer token", async () => {
    const bare = new Request("https://mentura.xyz/api/naive/sync/changes");
    expect((await serveChanges(bare, { backend: stubBackend(), verify: signedIn() })).status).toBe(401);
  });

  it("answers 401 when the token is not one that was issued", async () => {
    expect((await serveChanges(call("/api/naive/sync/changes", { token: "stale" }), { backend: stubBackend(), verify: signedIn() })).status).toBe(401);
  });
});

describe("changes", () => {
  it("hands the business, the point and the records back", async () => {
    const r = await serveChanges(call("/api/naive/sync/changes?since=4"), { backend: stubBackend(), verify: signedIn() });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ business: "harbor", point: "7", records: [
      { path: "foundation/problem.json", version: "v1", sha256: "a".repeat(64), content: { statement: "4" }, by: "Ada", at: "2026-11-25T00:00:00.000Z" },
    ] });
  });

  it("refuses a point it did not give out", async () => {
    for (const since of ["yesterday", "-1", "4.5", "'; drop table naive_records; --"]) {
      const r = await serveChanges(call(`/api/naive/sync/changes?since=${encodeURIComponent(since)}`), { backend: stubBackend(), verify: signedIn() });
      expect(r.status).toBe(400);
    }
  });

  it("says in one sentence when the store cannot answer", async () => {
    const backend = stubBackend({ changes: async () => { throw new Error("this token names a business the store does not hold"); } });
    const r = await serveChanges(call("/api/naive/sync/changes"), { backend, verify: signedIn() });
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ error: "this token names a business the store does not hold" });
  });
});

describe("push", () => {
  it("accepts a batch and answers with the point and every version", async () => {
    const backend = stubBackend();
    const r = await servePush(push(onePush), { backend, verify: signedIn() });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ point: "9", accepted: [{ path: "foundation/problem.json", version: "v2" }] });
    expect(backend.pushes[0]?.working_copy).toBe("laptop");
    expect(backend.pushes[0]?.provenance).toEqual([]);
  });

  it("passes the working copy's provenance lines through, oldest first", async () => {
    const backend = stubBackend();
    const lines = [
      { at: "2026-11-24T10:00:00.000Z", entity: "foundation/problem.json", activity: "write", prev: null },
      { at: "2026-11-24T11:00:00.000Z", entity: "foundation/problem.json", activity: "write", prev: "c".repeat(64) },
    ];
    await servePush(push({ ...onePush, provenance: lines }), { backend, verify: signedIn() });
    expect(backend.pushes[0]?.provenance).toEqual(lines);
  });

  it("answers 409 with every stale path and writes nothing", async () => {
    const backend = stubBackend({ push: async () => ({ stale: [{ path: "foundation/problem.json", current: "v9" }, { path: "decisions/pricing.json", current: null }] }) });
    const r = await servePush(push(onePush), { backend, verify: signedIn() });
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: "stale", stale: [
      { path: "foundation/problem.json", current: "v9" },
      { path: "decisions/pricing.json", current: null },
    ] });
  });

  it("refuses a body that is not the shape the contract names, before the backend sees it", async () => {
    const backend = stubBackend();
    const bad: unknown[] = [
      "not an object",
      { changes: [] },
      { working_copy: "laptop", changes: [] },
      { working_copy: "laptop", changes: [{ path: "foundation/problem.json", base: "v1" }] },
      { working_copy: "laptop", changes: [{ path: "foundation/problem.json", base: 7, content: {} }] },
      { working_copy: "laptop", changes: [{ path: "foundation/problem.json", base: null, content: {} }, { path: "foundation/problem.json", base: null, content: {} }] },
      { working_copy: "laptop", changes: [{ path: "foundation/problem.json", base: null, content: {} }], provenance: [{ at: "now" }] },
    ];
    for (const body of bad) {
      const r = await servePush(push(body), { backend, verify: signedIn() });
      expect(r.status, JSON.stringify(body)).toBe(400);
    }
    expect(backend.pushes).toEqual([]);
  });

  it("refuses a path that leaves the business, and the provenance log", async () => {
    const backend = stubBackend();
    const paths = ["/etc/passwd", "../other/venture.json", "foundation/../../out.json", "a\\b.json", ".naive/cache.json", "foundation//problem.json"];
    for (const path of paths) {
      const r = await servePush(push({ working_copy: "laptop", changes: [{ path, base: null, content: {} }] }), { backend, verify: signedIn() });
      expect(r.status, path).toBe(400);
    }
    const log = await servePush(push({ working_copy: "laptop", changes: [{ path: "provenance.jsonl", base: null, content: "" }] }), { backend, verify: signedIn() });
    expect(log.status).toBe(422);
    expect(backend.pushes).toEqual([]);
  });

  it("refuses a body that is not JSON", async () => {
    const r = await servePush(call("/api/naive/sync/push", { method: "POST", body: "{" }), { backend: stubBackend(), verify: signedIn() });
    expect(r.status).toBe(400);
  });
});

describe("files", () => {
  const bytes = new TextEncoder().encode("the founder's notes");
  const hash = sha256Of(bytes);

  it("says which hashes the business store does not hold", async () => {
    const files = memoryBlobs([[syncFileKey(WHO, hash), bytes]]);
    const other = "d".repeat(64);
    const r = await serveMissing(call("/api/naive/sync/files/missing", { method: "POST", body: JSON.stringify({ hashes: [hash, other, other] }) }), { files, verify: signedIn() });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ missing: [other] });
  });

  it("refuses a hash that is not a sha256", async () => {
    const files = memoryBlobs();
    for (const hashes of [["nope"], [hash.toUpperCase()], [1], "all"] as unknown[]) {
      const r = await serveMissing(call("/api/naive/sync/files/missing", { method: "POST", body: JSON.stringify({ hashes }) }), { files, verify: signedIn() });
      expect(r.status).toBe(400);
    }
  });

  it("takes an upload whose bytes hash to its name, and hands them back", async () => {
    const files = memoryBlobs();
    const put = await serveFilePut(call(`/api/naive/sync/files/${hash}`, { method: "PUT", body: bytes }), hash, { files, verify: signedIn() });
    expect(put.status).toBe(200);
    expect(await put.json()).toEqual({ sha256: hash, bytes: bytes.byteLength });
    const get = await serveFileGet(call(`/api/naive/sync/files/${hash}`), hash, { files, verify: signedIn() });
    expect(get.status).toBe(200);
    expect(new Uint8Array(await get.arrayBuffer())).toEqual(bytes);
  });

  it("takes the same upload twice without storing it twice", async () => {
    const files = memoryBlobs();
    for (let i = 0; i < 2; i++) {
      const r = await serveFilePut(call(`/api/naive/sync/files/${hash}`, { method: "PUT", body: bytes }), hash, { files, verify: signedIn() });
      expect(r.status).toBe(200);
    }
    expect(files.keys()).toEqual([syncFileKey(WHO, hash)]);
  });

  it("refuses bytes that do not hash to the name, and an empty body", async () => {
    const files = memoryBlobs();
    const wrong = await serveFilePut(call(`/api/naive/sync/files/${hash}`, { method: "PUT", body: new TextEncoder().encode("other bytes") }), hash, { files, verify: signedIn() });
    expect(wrong.status).toBe(400);
    const empty = await serveFilePut(call(`/api/naive/sync/files/${hash}`, { method: "PUT", body: new Uint8Array() }), hash, { files, verify: signedIn() });
    expect(empty.status).toBe(400);
    expect(files.keys()).toEqual([]);
  });

  it("refuses a name that is not a sha256", async () => {
    const files = memoryBlobs();
    expect((await serveFileGet(call("/api/naive/sync/files/x"), "../../secret", { files, verify: signedIn() })).status).toBe(400);
    expect((await serveFilePut(call("/api/naive/sync/files/x", { method: "PUT", body: bytes }), "nope", { files, verify: signedIn() })).status).toBe(400);
  });

  it("keeps one business from reading another's file by naming its hash", async () => {
    const files = memoryBlobs();
    await serveFilePut(call(`/api/naive/sync/files/${hash}`, { method: "PUT", body: bytes }), hash, { files, verify: signedIn(WHO) });
    const get = await serveFileGet(call(`/api/naive/sync/files/${hash}`), hash, { files, verify: signedIn(OTHER) });
    expect(get.status).toBe(404);
    const missing = await serveMissing(call("/api/naive/sync/files/missing", { method: "POST", body: JSON.stringify({ hashes: [hash] }) }), { files, verify: signedIn(OTHER) });
    expect(await missing.json()).toEqual({ missing: [hash] });
  });

  it("refuses a stored object that does not hash to its name", async () => {
    const files: BlobStore = { ...memoryBlobs(), has: async () => true, get: async () => new TextEncoder().encode("swapped") };
    const r = await serveFileGet(call(`/api/naive/sync/files/${hash}`), hash, { files, verify: signedIn() });
    expect(r.status).toBe(502);
  });

  it("answers 404 for a hash this business has not uploaded", async () => {
    const r = await serveFileGet(call(`/api/naive/sync/files/${hash}`), hash, { files: memoryBlobs(), verify: signedIn() });
    expect(r.status).toBe(404);
  });
});
