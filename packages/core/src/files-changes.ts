// The folder host's change log (./registry.ts's ChangeLog): every run of a non-read action against a vault, kept as
// lines in `changes.jsonl` at the vault's root. Lines are only appended: a change is one `add` or `hold` line, and
// each later status (undone, claimed, settled, released, declined) is one more line naming it. Reading folds them.
// A folder has no transactions, so a claim is only one step within one process; two processes tapping the same held
// change at once could both claim it. The vault's own actions are read and own tier, which never hold.
import { randomUUID } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ChangeLog, LoggedChange } from "./registry.ts";

export const CHANGES_FILE = "changes.jsonl";

type Line =
  | { op: "add" | "hold"; id: string; at: string; change: Omit<LoggedChange, "id" | "createdAt" | "undoneAt" | "status"> }
  | { op: "undone" | "claim" | "release" | "decline"; id: string; at: string }
  | { op: "settle"; id: string; at: string; before: unknown; after: unknown };

export type FilesChangesOptions = { now?: () => Date; id?: () => string };

export function filesChanges(root: string, opts: FilesChangesOptions = {}): ChangeLog {
  const now = opts.now ?? (() => new Date());
  const newId = opts.id ?? randomUUID;
  const file = join(root, CHANGES_FILE);

  async function lines(): Promise<Line[]> {
    let text: string;
    try {
      text = await readFile(file, "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
    return text.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l) as Line);
  }

  const append = (l: Line) => appendFile(file, `${JSON.stringify(l)}\n`);

  /** Every change, oldest first, with its status after all its lines. */
  async function all(): Promise<LoggedChange[]> {
    const byId = new Map<string, LoggedChange>();
    for (const l of await lines()) {
      if (l.op === "add" || l.op === "hold") {
        byId.set(l.id, { ...l.change, id: l.id, status: l.op === "add" ? "done" : "held", createdAt: new Date(l.at), undoneAt: null });
        continue;
      }
      const c = byId.get(l.id);
      if (!c) continue;
      if (l.op === "undone") Object.assign(c, { status: "undone", undoneAt: new Date(l.at) });
      else if (l.op === "claim") c.status = "done";
      else if (l.op === "release") c.status = "held";
      else if (l.op === "decline") c.status = "declined";
      else if (l.op === "settle") Object.assign(c, { before: l.before, after: l.after });
    }
    return [...byId.values()];
  }

  async function one(userId: string, id: string): Promise<LoggedChange | null> {
    const c = (await all()).find((x) => x.id === id);
    return c && c.userId === userId ? c : null;
  }

  return {
    async add(c) {
      const id = newId();
      await append({ op: "add", id, at: now().toISOString(), change: { ...c, preview: null } });
      return id;
    },
    get: one,
    async recent(userId, limit) {
      return (await all()).filter((c) => c.userId === userId).reverse().slice(0, limit);
    },
    async markUndone(userId, id) {
      const c = await one(userId, id);
      if (!c || c.status !== "done") return false;
      await append({ op: "undone", id, at: now().toISOString() });
      return true;
    },
    async hold(c) {
      const id = newId();
      const { preview, ...rest } = c;
      await append({ op: "hold", id, at: now().toISOString(), change: { ...rest, before: null, after: null, preview } });
      return id;
    },
    async held(userId, since, limit) {
      return (await all()).filter((c) => c.userId === userId && c.status === "held" && c.createdAt >= since).reverse().slice(0, limit);
    },
    async claim(userId, id, since) {
      const c = await one(userId, id);
      if (!c || c.status !== "held" || c.createdAt < since) return false;
      await append({ op: "claim", id, at: now().toISOString() });
      return true;
    },
    async settle(userId, id, made) {
      if (await one(userId, id)) await append({ op: "settle", id, at: now().toISOString(), before: made.before, after: made.after });
    },
    async release(userId, id) {
      if (await one(userId, id)) await append({ op: "release", id, at: now().toISOString() });
    },
    async decline(userId, id) {
      const c = await one(userId, id);
      if (!c || c.status !== "held") return false;
      await append({ op: "decline", id, at: now().toISOString() });
      return true;
    },
  };
}
