// Tests for the GitHub channel for raw capture (raw triage item 6), offline: a signed push writes the raw files it
// added; modified, removed and non-raw files, originals, another repository and a bad signature write nothing.

import type { AddressInfo } from "node:net";
import { githubIntake, intakePush, rawChanges, sign, type Reader, type Store } from "./github-push.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail?: unknown) => {
  if (cond) console.log(`ok ${name}`);
  else { failed++; console.log(`FAIL ${name}${detail === undefined ? "" : `: ${JSON.stringify(detail)}`}`); }
};

const memory = () => {
  const rows = new Map<string, string>();
  const store: Store & { rows: Map<string, string> } = {
    rows,
    async write(path, content, opts = {}) {
      if (opts.base === null && rows.has(path)) { const e = new Error(`${path} exists`); e.name = "VersionConflict"; throw e; }
      rows.set(path, content);
    },
  };
  return store;
};
const SHA = "a".repeat(40);
const files: Record<string, string> = {
  "raw/dump/20261109-0040-ab12.md": "---\nid: 20261109-0040-ab12\n---\n\nA kettle that texts you.\n",
  "raw/sources/pg-essay/source.json": "{\"id\":\"pg-essay\",\"origin\":\"https://example.com/essay\"}\n",
  "raw/sources/pg-essay/text.md": "The essay.\n",
};
const reads: string[] = [];
const read: Reader = async (repo, sha, path) => { reads.push(`${repo}@${sha}:${path}`); return files[path] ?? null; };
const push = {
  ref: "refs/heads/main", after: SHA, repository: { full_name: "tchjhnsn/ideas" },
  commits: [
    { added: ["raw/sources/pg-essay/text.md", "raw/dump/20261109-0040-ab12.md", "raw/sources/pg-essay/source.json", "raw/sources/pg-essay/original.pdf", "raw/notes.txt", "README.md"], modified: [], removed: [] },
    { added: [], modified: ["raw/dump/old.md"], removed: ["raw/dump/older.md"] },
  ],
};

const plan = rawChanges(push);
ok("only raw files the push added are taken, source.json before text.md", JSON.stringify(plan.take) === JSON.stringify(["raw/dump/20261109-0040-ab12.md", "raw/sources/pg-essay/source.json", "raw/sources/pg-essay/text.md"]), plan.take);
ok("an original, a non-raw file and changes to raw are skipped with a reason", ["raw/sources/pg-essay/original.pdf", "raw/notes.txt", "raw/dump/old.md", "raw/dump/older.md"].every((p) => plan.skipped.some((s) => s.path === p && s.reason)), plan.skipped);
ok("files outside raw/ are not mentioned", !plan.skipped.some((s) => s.path === "README.md"));

const store = memory();
const r = await intakePush(push, { repo: "tchjhnsn/ideas", store, read });
ok("the raw files are written to the store, read at the push's head commit", r.written.length === 3 && store.rows.get("raw/sources/pg-essay/text.md") === "The essay.\n" && reads.every((x) => x.startsWith(`tchjhnsn/ideas@${SHA}:`)), { r, reads });
const again = await intakePush(push, { repo: "tchjhnsn/ideas", store, read });
ok("a repeated push writes nothing new", again.written.length === 0 && again.skipped.filter((s) => s.reason === "the store already holds it").length === 3, again);
const elsewhere = await intakePush({ ...push, repository: { full_name: "someone/else" } }, { repo: "tchjhnsn/ideas", store: memory(), read });
ok("a push from another repository writes nothing", elsewhere.written.length === 0 && /not tchjhnsn\/ideas/.test(elsewhere.skipped[0].reason));
const noHead = await intakePush({ ...push, after: "main" }, { repo: "tchjhnsn/ideas", store: memory(), read });
ok("a push with no head commit writes nothing", noHead.written.length === 0);

// The server.
const secret = "test-secret-not-real";
const served = memory();
const server = githubIntake({ repo: "tchjhnsn/ideas", store: served, read, secret });
await new Promise<void>((res) => server.listen(0, "127.0.0.1", () => res()));
const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/intake/github`;
const post = async (body: string, headers: Record<string, string>) => {
  const res = await fetch(url, { method: "POST", body, headers: { "content-type": "application/json", ...headers } });
  return { status: res.status, json: await res.json() as Record<string, unknown> };
};
const body = JSON.stringify(push);
const bad = await post(body, { "x-github-event": "push", "x-hub-signature-256": sign("wrong", body) });
ok("a bad signature is refused and writes nothing", bad.status === 401 && served.rows.size === 0, bad);
const unsigned = await post(body, { "x-github-event": "push" });
ok("an unsigned push is refused", unsigned.status === 401);
const ping = await post("{}", { "x-github-event": "ping", "x-hub-signature-256": sign(secret, "{}") });
ok("a signed ping answers 200", ping.status === 200);
const good = await post(body, { "x-github-event": "push", "x-hub-signature-256": sign(secret, body) });
ok("a signed push writes its raw files", good.status === 202 && served.rows.size === 3, good);
const noSecret = githubIntake({ repo: "tchjhnsn/ideas", store: memory(), read, secret: "" });
await new Promise<void>((res) => noSecret.listen(0, "127.0.0.1", () => res()));
const r2 = await fetch(`http://127.0.0.1:${(noSecret.address() as AddressInfo).port}/intake/github`, { method: "POST", body, headers: { "x-github-event": "push", "x-hub-signature-256": sign("", body) } });
ok("with no secret set every request is refused", r2.status === 401);
const get = await fetch(url);
ok("a GET is refused", get.status === 405);
server.close(); noSecret.close();
process.exit(failed ? 1 : 0);
