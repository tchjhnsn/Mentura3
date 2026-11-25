// The sync HTTP API a working copy talks to (the offline sync contract, 2026-11-25; Naive
// docs/design/OFFLINE_SYNC_2026-11-25.md, decisions EE-174 and EE-175). A founder's laptop holds a business as
// files, works on it offline, and comes back to pull what the business store changed and push what it changed.
//
//   GET  /api/naive/sync/changes?since=<point>   every record newer than a point the client keeps
//   POST /api/naive/sync/push                    a batch of changes, each naming the version it was based on
//   POST /api/naive/sync/files/missing           which file hashes the store does not hold
//   PUT  /api/naive/sync/files/<sha256>          upload a file's bytes
//   GET  /api/naive/sync/files/<sha256>          read a file's bytes
//
// This file is the boundary: it reads the token, parses and checks the request, and turns a backend's answer into
// a response. It holds no store and reaches nothing by itself: the backend, the file store and the token check all
// arrive as `deps`, so a route wires the real ones and a test drives the same code over memory. The hosted backend
// is in sync-store.ts, the file store in sync-files.ts, and the token check in sync-token.ts.
//
// Push is all or none. The backend checks every change's base version against the store before it writes anything,
// and answers 409 with the paths that moved when any base no longer matches.
//
// Who a call speaks for is device sign-in's to say: `verifySyncToken` in sync-token.ts. A request whose token names
// nobody is answered 401 before the backend is asked.

import { isSha256, MAX_FILE_BYTES, sha256Of, syncFileKey, type BlobStore } from "./sync-files";
import { verifySyncToken, type TokenHolder } from "./sync-token";

/** One record as the store has it now. `content` and `sha256` are null when the record was removed. */
export interface SyncRecord {
  path: string;
  version: string;
  sha256: string | null;
  content: unknown;
  by: string;
  at: string;
}

export interface ChangesPage {
  business: string;
  point: string;
  records: SyncRecord[];
}

/** One change a working copy pushes. `base` is the version it last saw, or null for a record it believes is new. */
export interface PushChange {
  path: string;
  base: string | null;
  content: unknown;
}

export interface PushInput {
  working_copy: string;
  changes: PushChange[];
  /** The working copy's own provenance lines, oldest first. Re-chaining them onto the store's chain is not built. */
  provenance: Record<string, unknown>[];
}

export type PushOutcome =
  | { stale: { path: string; current: string | null }[] }
  | { point: string; accepted: { path: string; version: string }[] };

export interface SyncBackend {
  changes(holder: TokenHolder, since: string | null): Promise<ChangesPage>;
  push(holder: TokenHolder, input: PushInput): Promise<PushOutcome>;
}

/** Who a request speaks for, or null when it carries no live token. The routes pass sync-token's own. */
export type Verify = (req: Request) => Promise<TokenHolder | null>;

/** What each handler needs. `verify` defaults to the real token check, so only a test ever names it. */
export interface SyncDeps { backend: SyncBackend; verify?: Verify }
export interface FileDeps { files: BlobStore; verify?: Verify }

const whoIs = (deps: { verify?: Verify }, req: Request): Promise<TokenHolder | null> => (deps.verify ?? verifySyncToken)(req);

/** A refusal with the status and the one sentence the client sees. */
export class SyncRefusal extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

const unauthorized = (): Response => json({ error: "unauthorized" }, 401);

/** A point is the store's own position, which the client keeps and sends back without reading it. */
const isPoint = (value: string): boolean => /^[0-9]{1,19}$/.test(value);

/** A path inside a business's folder: relative, no `..`, no backslash, nothing hidden, and not the provenance log. */
export function checkPath(path: unknown): string {
  if (typeof path !== "string" || !path || path.length > 400) throw new SyncRefusal(400, "a change needs a path inside the business");
  if (path.startsWith("/") || path.includes("\\") || path.includes("//")) throw new SyncRefusal(400, `${path} is not a path inside the business`);
  const parts = path.split("/");
  if (parts.some((p) => !p || p === "." || p === ".." || p.startsWith("."))) throw new SyncRefusal(400, `${path} is not a path inside the business`);
  if (path === "provenance.jsonl") throw new SyncRefusal(422, "the provenance log is written by the store, not pushed");
  return path;
}

/** The body of a push, once every part of it is the shape the contract names. */
export function readPush(body: unknown): PushInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new SyncRefusal(400, "the push body is not an object");
  const b = body as Record<string, unknown>;
  if (typeof b.working_copy !== "string" || !b.working_copy) throw new SyncRefusal(400, "a push names the working copy it comes from");
  if (!Array.isArray(b.changes)) throw new SyncRefusal(400, "a push carries a list of changes");
  if (!b.changes.length) throw new SyncRefusal(400, "a push carries at least one change");
  if (b.changes.length > 2000) throw new SyncRefusal(413, "that is more changes than one push may carry");
  const seen = new Set<string>();
  const changes = b.changes.map((raw): PushChange => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new SyncRefusal(400, "a change is an object");
    const c = raw as Record<string, unknown>;
    const path = checkPath(c.path);
    if (seen.has(path)) throw new SyncRefusal(400, `${path} is in this push twice`);
    seen.add(path);
    if (c.base !== null && typeof c.base !== "string") throw new SyncRefusal(400, `${path} needs the version it was based on, or null`);
    if (!("content" in c)) throw new SyncRefusal(400, `${path} needs content, or null to remove it`);
    return { path, base: (c.base as string | null) ?? null, content: c.content };
  });
  const provenance = b.provenance === undefined ? [] : readProvenance(b.provenance);
  return { working_copy: b.working_copy, changes, provenance };
}

/** The working copy's provenance lines, checked for shape only. The chain itself is the store's to rebuild. */
function readProvenance(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new SyncRefusal(400, "provenance is a list of lines");
  if (value.length > 20_000) throw new SyncRefusal(413, "that is more provenance than one push may carry");
  return value.map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new SyncRefusal(400, "a provenance line is an object");
    const line = raw as Record<string, unknown>;
    if (typeof line.at !== "string" || typeof line.entity !== "string" || typeof line.activity !== "string")
      throw new SyncRefusal(400, "a provenance line names when it was written, what it was about and what happened");
    if (line.prev !== undefined && line.prev !== null && typeof line.prev !== "string")
      throw new SyncRefusal(400, "a provenance line's prev is the hash before it");
    return line;
  });
}

/** Turns a thrown refusal into its response, and anything else into one plain sentence. */
function refused(error: unknown): Response {
  if (error instanceof SyncRefusal) return json({ error: error.message }, error.status);
  return json({ error: error instanceof Error && error.message ? error.message : "the business store did not answer" }, 502);
}

export async function serveChanges(req: Request, deps: SyncDeps): Promise<Response> {
  const who = await whoIs(deps, req);
  if (!who) return unauthorized();
  const since = new URL(req.url).searchParams.get("since");
  if (since !== null && !isPoint(since)) return json({ error: "since is a point this store gave out" }, 400);
  try {
    const page = await deps.backend.changes(who, since);
    return json(page);
  } catch (error) {
    return refused(error);
  }
}

export async function servePush(req: Request, deps: SyncDeps): Promise<Response> {
  const who = await whoIs(deps, req);
  if (!who) return unauthorized();
  let input: PushInput;
  try {
    input = readPush(await req.json().catch(() => { throw new SyncRefusal(400, "the push body is not JSON"); }));
  } catch (error) {
    return refused(error);
  }
  try {
    const outcome = await deps.backend.push(who, input);
    if ("stale" in outcome) return json({ error: "stale", stale: outcome.stale }, 409);
    return json(outcome);
  } catch (error) {
    return refused(error);
  }
}

export async function serveMissing(req: Request, deps: FileDeps): Promise<Response> {
  const who = await whoIs(deps, req);
  if (!who) return unauthorized();
  let hashes: string[];
  try {
    const body: unknown = await req.json().catch(() => { throw new SyncRefusal(400, "the body is not JSON"); });
    const raw = (body as { hashes?: unknown } | null)?.hashes;
    if (!Array.isArray(raw)) throw new SyncRefusal(400, "a request for missing files carries a list of hashes");
    if (raw.length > 5000) throw new SyncRefusal(413, "that is more hashes than one request may ask about");
    hashes = raw.map((h) => {
      if (typeof h !== "string" || !isSha256(h)) throw new SyncRefusal(400, "every hash is 64 lower-case hex digits");
      return h;
    });
  } catch (error) {
    return refused(error);
  }
  try {
    const missing: string[] = [];
    for (const sha256 of [...new Set(hashes)]) if (!(await deps.files.has(syncFileKey(who, sha256)))) missing.push(sha256);
    return json({ missing });
  } catch (error) {
    return refused(error);
  }
}

export async function serveFileGet(req: Request, sha256: string, deps: FileDeps): Promise<Response> {
  const who = await whoIs(deps, req);
  if (!who) return unauthorized();
  if (!isSha256(sha256)) return json({ error: "a file is named by its sha256" }, 400);
  try {
    const bytes = await deps.files.get(syncFileKey(who, sha256));
    if (!bytes) return json({ error: "this business has no file with that hash" }, 404);
    // The store could hand back the wrong object, so the hash is checked again before a working copy sees it.
    if (sha256Of(bytes) !== sha256) return json({ error: "the stored file does not hash to its name" }, 502);
    return new Response(bytes as unknown as BodyInit, {
      headers: { "content-type": "application/octet-stream", "content-length": String(bytes.byteLength), "cache-control": "no-store" },
    });
  } catch (error) {
    return refused(error);
  }
}

export async function serveFilePut(req: Request, sha256: string, deps: FileDeps): Promise<Response> {
  const who = await whoIs(deps, req);
  if (!who) return unauthorized();
  if (!isSha256(sha256)) return json({ error: "a file is named by its sha256" }, 400);
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await req.arrayBuffer());
  } catch {
    return json({ error: "the file's bytes did not arrive" }, 400);
  }
  if (!bytes.byteLength) return json({ error: "a file has bytes" }, 400);
  if (bytes.byteLength > MAX_FILE_BYTES) return json({ error: `a file is at most ${MAX_FILE_BYTES / (1024 * 1024)} MB` }, 413);
  if (sha256Of(bytes) !== sha256) return json({ error: "these bytes do not hash to that name" }, 400);
  try {
    const key = syncFileKey(who, sha256);
    // The name is the hash, so a file already there is the same file: the upload is a no-op and may be sent again.
    if (!(await deps.files.has(key))) await deps.files.put(key, bytes);
    return json({ sha256, bytes: bytes.byteLength });
  } catch (error) {
    return refused(error);
  }
}
