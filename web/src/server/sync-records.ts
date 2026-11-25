// What a business store has to say when a working copy pulls (the offline sync contract, 2026-11-25). The store is
// `naive_records` in the account's tenant database: append-only, one row per write, each row carrying the content,
// its version (the git blob SHA-1 every Naive connector gives) and its position in the account's sequence.
//
// A point is that position, as a decimal string. The client keeps it and sends it back without reading it. A record
// is in a pull when the newest row for its path sits above the point the client last saw.
//
// The account's store holds every business it has, one folder each, so the business the token names is found by its
// `venture.json` and only paths inside that folder are ever sent.
//
// The store keeps each row at its physical path, where the business keeps it on disk; a working copy names records
// by their logical path, as Naive does (foundation/problem.json, provenance.jsonl). A structured business keeps its
// records under k-base/ and its provenance log in meta/, and a src business keeps package folders under
// src/<function>/, so a pull reads the business's layout from its venture.json and sends every record by its logical
// path. The rules are Naive's `physical` and `logical`, said over a list of paths in
// packages/platform/bridge/venture-layout.ts and pinned against Naive there.
//
// This file holds no SQL and opens no connection:
// it works over the RecordStore port below, so the tests drive it with an in-memory store.

import { createHash } from "node:crypto";
import { physicalPath, recordAt, storeLayout } from "../../../packages/platform/bridge/venture-layout.ts";
import type { SyncRecord } from "./sync-api";

/** One path in a business store, as the newest row has it. */
export interface StoredPath {
  path: string;
  version: string;
  /** The row's position in the account's sequence, as a decimal string. */
  seq: string;
  /** When the store accepted that row, ISO 8601. */
  writtenAt: string;
}

/** The account's store, as a pull needs to see it. Paths are relative to the account, not to one business. */
export interface RecordStore {
  /** The store's position now. A pull that answers nothing still moves the client to this. */
  head(): Promise<string>;
  /** Every path the account holds, with its newest version and position, and no content. */
  index(): Promise<StoredPath[]>;
  /** The newest content of each of these paths. A path the store does not hold is left out. */
  contents(paths: readonly string[]): Promise<Map<string, string>>;
}

/** The most records one pull answers with. Past this the point stops at the last one sent, so the client pulls again. */
export const PULL_LIMIT = 2000;

/** Sync never sends a venture's own logs, its caches or anything under a dot folder. Read on the logical path. */
export const sendable = (path: string): boolean =>
  !path.endsWith(".jsonl") && !path.split("/").some((p) => p.startsWith("."));

const sha256 = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");

/** The folder the named business sits in, or null when this account holds no such business. "" is the root. */
export async function businessFolder(store: RecordStore, business: string): Promise<string | null> {
  const candidates = (await store.index())
    .map((p) => p.path)
    .filter((p) => p === "venture.json" || p.endsWith("/venture.json"))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
  const held = await store.contents(candidates);
  for (const path of candidates) {
    const content = held.get(path);
    if (!content) continue;
    let id: unknown;
    try { id = (JSON.parse(content) as { id?: unknown }).id; } catch { continue; }
    if (id === business) return path === "venture.json" ? "" : path.slice(0, -"/venture.json".length);
  }
  return null;
}

/** Who wrote each record, read from the business's provenance log: the newest line per path, and per path and
 *  content hash when a line names one. The log names records by their logical path. A record the log does not mention is the store's own. */
export function writersIn(log: string | undefined): Map<string, string> {
  const by = new Map<string, string>();
  if (!log) return by;
  for (const raw of log.split("\n")) {
    if (!raw.trim()) continue;
    let line: { entity?: unknown; sha256?: unknown; agent?: { id?: unknown; kind?: unknown } };
    try { line = JSON.parse(raw) as typeof line; } catch { continue; }
    const entity = typeof line.entity === "string" ? line.entity : null;
    if (!entity) continue;
    const who = typeof line.agent?.id === "string" ? line.agent.id : typeof line.agent?.kind === "string" ? line.agent.kind : null;
    if (!who) continue;
    by.set(entity, who);
    if (typeof line.sha256 === "string") by.set(`${entity}@${line.sha256}`, who);
  }
  return by;
}

/** A record's content as the contract sends it: a JSON record parsed, anything else as its text. */
export function contentOf(path: string, text: string): unknown {
  if (!path.endsWith(".json")) return text;
  try { return JSON.parse(text) as unknown; } catch { return text; }
}

/**
 * Every record of one business that changed after `since`, with the store's position to send back next time.
 * `since` null is everything the business holds. A removed record is never in the answer: the store is
 * append-only and has no delete, so a record it once held it holds still.
 *
 * A pull of more than PULL_LIMIT records answers with the first of them and a point that stops there, so the
 * client's next pull takes the rest. Running the same pull twice gives the same answer.
 */
export async function changesSince(store: RecordStore, business: string, since: string | null): Promise<{ business: string; point: string; records: SyncRecord[] }> {
  const head = await store.head();
  const folder = await businessFolder(store, business);
  if (folder === null) throw new Error("this token names a business the store does not hold");
  const prefix = folder ? `${folder}/` : "";
  const after = since === null ? -1 : Number(since);
  const inBusiness = (await store.index()).filter((p) => p.path.startsWith(prefix));
  const layout = storeLayout((await store.contents([`${prefix}venture.json`])).get(`${prefix}venture.json`), inBusiness.map((p) => p.path.slice(prefix.length)));
  // Each row by the logical path Naive reads it as. A file Naive would not find where it sits (a stray copy at the
  // top of a structured business) is no record, and the logs and caches are never sent.
  const changed: (StoredPath & { logical: string })[] = [];
  for (const p of inBusiness) {
    const logical = recordAt(layout, p.path.slice(prefix.length));
    if (logical !== null && sendable(logical) && Number(p.seq) > after) changed.push({ ...p, logical });
  }
  changed.sort((a, b) => Number(a.seq) - Number(b.seq));
  const page = changed.slice(0, PULL_LIMIT);
  const last = page[page.length - 1];
  const point = page.length < changed.length && last ? last.seq : head;
  const log = `${prefix}${physicalPath(layout, "provenance.jsonl")}`;
  const held = await store.contents([...page.map((p) => p.path), log]);
  const by = writersIn(held.get(log));
  const records: SyncRecord[] = [];
  for (const p of page) {
    const text = held.get(p.path);
    if (text === undefined) continue;
    const hash = sha256(text);
    records.push({
      path: p.logical,
      version: p.version,
      sha256: hash,
      content: contentOf(p.logical, text),
      by: by.get(`${p.logical}@${hash}`) ?? by.get(p.logical) ?? "the business store",
      at: p.writtenAt,
    });
  }
  return { business, point, records };
}

/** A store held in this process, for the tests. */
export function memoryRecords(rows: Iterable<StoredPath & { content: string }>): RecordStore {
  const held = [...rows];
  return {
    head: async () => String(held.reduce((n, r) => Math.max(n, Number(r.seq)), 0)),
    index: async () => held.map(({ path, version, seq, writtenAt }) => ({ path, version, seq, writtenAt })),
    contents: async (paths) => new Map(held.filter((r) => paths.includes(r.path)).map((r) => [r.path, r.content])),
  };
}
