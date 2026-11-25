// Moving a business between teams and removing a team's businesses (hosted/move-business.ts, hosted/store-change.ts),
// on disk always and in naive_records on a throwaway Postgres when one is given.
//
//   node hosted/move-business-test.ts
//   MENTURA_EVAL_DATABASE_URL=postgres://mentura@127.0.0.1:5432/postgres node hosted/move-business-test.ts

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { signAssertion, type Identity } from "../bridge/assertion.ts";
import { REMOVED, TABLE, connect, ensureSchema, verify, type Client } from "../connectors/postgres.ts";
import { closeWorkspacePools, runHostedBridge } from "./account-workspace.ts";
import { businessFolder, freeFolder, idProblem, NESTED_BUSINESS, NO_SUCH_BUSINESS, withoutVenture, withVenture, WORKSPACE_FILE, WORKSPACE_LOG } from "./move-business.ts";
import { checkMove, checkRemove, OWNER_OF_BOTH, OWNER_TO_DELETE } from "./store-change.ts";

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok) { failed++; if (detail !== undefined) console.log("      ", detail); }
};
const threw = (f: () => unknown): string => { try { f(); return ""; } catch (e) { return e instanceof Error ? e.message : String(e); } };

const here = import.meta.dirname;
const bridgePath = join(here, "../bridge/bridge.mjs");
const childPath = join(here, "store-child.ts");
const key = "move-test-key-0123456789abcdef-0123";
const ada = (team: string, role = "owner"): Identity => ({ userId: "acct-ada", name: "Ada", email: "ada@example.test", organizationId: team, organizationRole: role });
const transfer = (venture: string, from: string, to: string) => ({ op: "transfer", venture, from, to, toName: "Team B" });
const moveRequest = (venture: string, from: string, to: string, fromRole = "owner", toRole = "owner") => ({
  op: "move", key,
  from: signAssertion(ada(from, fromRole), transfer(venture, from, to), key),
  to: signAssertion(ada(to, toRole), transfer(venture, from, to), key),
});
const removeRequest = (team: string, role = "owner") => ({ op: "remove", key, assertion: signAssertion(ada(team, role), { op: "removeTeam", team }, key) });

/** Runs hosted/store-child.ts as the web server does, with the request on stdin. */
function child(request: Record<string, unknown>, env: NodeJS.ProcessEnv): { ok: boolean; result?: { venture?: string; folder?: string; moved?: number; removed?: number }; error?: string } {
  const r = spawnSync(process.execPath, [childPath], { input: JSON.stringify(request), encoding: "utf8", env, timeout: 120_000 });
  try { return JSON.parse(r.stdout); } catch { return { ok: false, error: `no answer: ${r.stderr}` }; }
}

// ---- pure rules ----------------------------------------------------------------------------------------------------

const v = (id: string) => JSON.stringify({ id, name: id });
expect("finds a business's folder by its id", businessFolder([{ path: "harbor/venture.json", content: v("harbor") }, { path: "dock/venture.json", content: v("dock") }], "dock") === "dock");
expect("a business that is not there is refused", threw(() => businessFolder([{ path: "harbor/venture.json", content: v("harbor") }], "dock")) === NO_SUCH_BUSINESS);
expect("a business inside another, or holding one, does not move alone", threw(() => businessFolder([{ path: "a/venture.json", content: v("a") }, { path: "a/b/venture.json", content: v("b") }], "a")) === NESTED_BUSINESS
  && threw(() => businessFolder([{ path: "a/venture.json", content: v("a") }, { path: "a/b/venture.json", content: v("b") }], "b")) === NESTED_BUSINESS);
expect("a venture.json in a hidden or private folder is not a business", threw(() => businessFolder([{ path: ".home/x/venture.json", content: v("x") }], "x")) === NO_SUCH_BUSINESS);
expect("a folder the destination uses gets a number", freeFolder(["harbor/venture.json", "harbor-2/a.md"], "harbor") === "harbor-3" && freeFolder(["dock/a"], "harbor") === "harbor");
expect("the destination refuses a second business with the same address", (idProblem([{ path: "x/venture.json", content: v("harbor") }], "harbor", "Team B") ?? "").startsWith("Team B already has") && idProblem([], "harbor") === null);
const ws = JSON.stringify({ schema: "everything-ecosystem", schema_version: "1", name: "W", timeZone: "UTC", ventures: ["harbor", "dock"], settings: { cross_venture_reads: true } });
expect("the source's workspace file drops the folder", JSON.parse(withoutVenture(ws, "harbor") ?? "{}").ventures.join() === "dock" && withoutVenture(ws, "nowhere") === null && withoutVenture("{not json", "harbor") === null);
const made = JSON.parse(withVenture(undefined, "harbor", ws) ?? "{}");
expect("a team with no workspace file gets one listing the business", made.schema === "everything-ecosystem" && made.timeZone === "UTC" && made.ventures.join() === "harbor");
expect("a workspace file that does not parse is left for the person to fix", withVenture("{not json", "harbor", ws) === null && withVenture(ws, "harbor", ws) === null);

// ---- the assertions ------------------------------------------------------------------------------------------------

const ok = moveRequest("harbor", "team-a", "team-b");
expect("an Owner of both teams may move a business", checkMove(ok.from, ok.to, key).request.venture === "harbor");
const asMember = moveRequest("harbor", "team-a", "team-b", "owner", "member");
expect("a Member of the destination may not", threw(() => checkMove(asMember.from, asMember.to, key)) === OWNER_OF_BOTH);
const asViewer = moveRequest("harbor", "team-a", "team-b", "viewer", "owner");
expect("a Viewer of the source may not", threw(() => checkMove(asViewer.from, asViewer.to, key)) === OWNER_OF_BOTH);
const bea = signAssertion({ ...ada("team-b"), userId: "acct-bea" }, transfer("harbor", "team-a", "team-b"), key);
expect("two people's assertions do not make one move", threw(() => checkMove(ok.from, bea, key)).includes("refused"));
const swapped = signAssertion(ada("team-b"), transfer("dock", "team-a", "team-b"), key);
expect("two different requests do not make one move", threw(() => checkMove(ok.from, swapped, key)).includes("refused"));
const wrongTeam = signAssertion(ada("team-c"), transfer("harbor", "team-a", "team-b"), key);
expect("an assertion for a team the request does not name is refused", threw(() => checkMove(ok.from, wrongTeam, key)).includes("refused"));
expect("an assertion signed with another key is refused", threw(() => checkMove(ok.from, ok.to, "another-key-0123456789abcdef")).includes("refused"));
expect("a bridge assertion is not a move", threw(() => checkMove(signAssertion(ada("team-a"), { op: "ventures" }, key), ok.to, key)).includes("refused"));
const rm = removeRequest("team-a");
expect("an Owner may remove their team's businesses", checkRemove(rm.assertion, key).request.team === "team-a");
expect("a Member may not", threw(() => checkRemove(removeRequest("team-a", "member").assertion, key)) === OWNER_TO_DELETE);
expect("a removal names its own team", threw(() => checkRemove(signAssertion(ada("team-a"), { op: "removeTeam", team: "team-b" }, key), key)).includes("refused"));

// ---- on disk -------------------------------------------------------------------------------------------------------

const scratch = mkdtempSync(join(tmpdir(), "move-business-test-"));
const shared = join(scratch, "ws");
const temp = join(scratch, "tmp");
mkdirSync(temp, { recursive: true });
const diskEnv: NodeJS.ProcessEnv = { PATH: process.env.PATH, NAIVE_CONSOLE_WORKSPACE: shared, TMPDIR: temp, XDG_CONFIG_HOME: join(scratch, "xdg") };
type Answer<T> = { ok: boolean; error?: string; result: T };
function bridge<T>(as: Identity, input: { op: string; [k: string]: unknown }): Answer<T> {
  const r = spawnSync(process.execPath, [bridgePath, signAssertion(as, input, key)], { encoding: "utf8", env: { ...diskEnv, NAIVE_BRIDGE_KEY: key }, timeout: 120_000 });
  return JSON.parse(r.stdout) as Answer<T>;
}
/** Where the venture's layout keeps its provenance log, relative to the venture. */
function findLog(dir: string, rel = ""): string | null {
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isFile() && e.name === "provenance.jsonl") return r;
    if (e.isDirectory() && e.name !== "node_modules") { const f = findLog(dir, r); if (f) return f; }
  }
  return null;
}
const ids = (as: Identity) => bridge<{ ventures: { id: string }[] }>(as, { op: "ventures" }).result.ventures.map((x) => x.id).sort().join();

try {
  const harbor = bridge<{ id: string; folder: string }>(ada("team-a"), { op: "create", name: "Harbor", description: "A pier." });
  const dock = bridge<{ id: string; folder: string }>(ada("team-b"), { op: "create", name: "Dock", description: "A dock." });
  expect("two businesses made on disk, one per team", harbor.ok && dock.ok, [harbor.error, dock.error]);
  const logRel = findLog(join(shared, ".accounts/team-a", harbor.result.folder));
  const before = logRel ? readFileSync(join(shared, ".accounts/team-a", harbor.result.folder, logRel), "utf8") : null;

  const refused = child(moveRequest(harbor.result.id, "team-a", "team-b", "owner", "member"), diskEnv);
  expect("on disk, a Member of the destination is refused and nothing moves", !refused.ok && refused.error === OWNER_OF_BOTH && ids(ada("team-a")) === harbor.result.id);

  const moved = child(moveRequest(harbor.result.id, "team-a", "team-b"), diskEnv);
  expect("on disk, the business moves", moved.ok && moved.result?.folder === harbor.result.folder && (moved.result?.moved ?? 0) > 0, moved);
  expect("the source team no longer has it and the destination has both", ids(ada("team-a")) === "" && ids(ada("team-b")) === [harbor.result.id, dock.result.id].sort().join());
  const docket = bridge<{ venture: string }>(ada("team-b"), { op: "docket", venture: harbor.result.id });
  expect("Naive reads the moved business in its new team", docket.ok && docket.result.venture !== undefined, docket.error);
  const after = logRel ? readFileSync(join(shared, ".accounts/team-b", harbor.result.folder, logRel), "utf8") : "";
  expect("its provenance log moved unchanged", before !== null && before.length > 0 && after === before);
  const listed = JSON.parse(readFileSync(join(shared, ".accounts/team-b", WORKSPACE_FILE), "utf8")).ventures as string[];
  expect("the destination's workspace file lists it and the source's does not", listed.includes(harbor.result.folder)
    && !(JSON.parse(readFileSync(join(shared, ".accounts/team-a", WORKSPACE_FILE), "utf8")).ventures as string[]).includes(harbor.result.folder));
  expect("each workspace logs the move", readFileSync(join(shared, ".accounts/team-a", WORKSPACE_LOG), "utf8").includes("venture-transfer-out")
    && readFileSync(join(shared, ".accounts/team-b", WORKSPACE_LOG), "utf8").includes("venture-transfer-in"));

  const again = bridge<{ id: string }>(ada("team-a"), { op: "create", name: "Harbor", description: "Another pier." });
  const twice = child(moveRequest(again.result.id, "team-a", "team-b"), diskEnv);
  expect("a business whose address the destination has is refused and stays", again.ok && !twice.ok && (twice.error ?? "").includes("already has a business") && ids(ada("team-a")) === again.result.id);

  const removed = child(removeRequest("team-b"), diskEnv);
  expect("on disk, removing a team takes its businesses", removed.ok && (removed.result?.removed ?? 0) > 0 && !existsSync(join(shared, ".accounts/team-b")) && ids(ada("team-b")) === "");
  expect("on disk, a Member cannot remove a team", !child(removeRequest("team-a", "member"), diskEnv).ok && ids(ada("team-a")) === again.result.id);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

// ---- naive_records -------------------------------------------------------------------------------------------------

const source = process.env.MENTURA_EVAL_DATABASE_URL ?? "";
if (!source) {
  if (process.env.CI) { console.error("FAIL  move in the store: CI did not set MENTURA_EVAL_DATABASE_URL"); process.exit(1); }
  console.log("SKIP  move in the store: set MENTURA_EVAL_DATABASE_URL to a local Postgres");
  process.exit(failed ? 1 : 0);
}
if (!["localhost", "127.0.0.1", "::1"].includes(new URL(source).hostname)) { console.error("FAIL  refusing a database host that is not loopback"); process.exit(1); }

async function ensureDatabase(name: string): Promise<string> {
  const admin = new URL(source);
  admin.pathname = "/postgres";
  const pool = new pg.Pool({ connectionString: admin.toString(), max: 1 });
  try { if (!(await pool.query("select 1 from pg_database where datname = $1", [name])).rowCount) await pool.query(`create database ${name}`); }
  finally { await pool.end(); }
  admin.pathname = `/${name}`;
  return admin.toString();
}

const database = "mentura_move_test";
const adminUrl = await ensureDatabase(database);
const identityUrl = await ensureDatabase("mentura_identity_guard");
const outsideUrl = await ensureDatabase("mentura_outside_guard");
const admin = new pg.Pool({ connectionString: adminUrl, max: 2 });
const adminClient: Client = { query: (text, params) => admin.query(text, params) };
// A fresh table each run, so the counts below are this run's.
await admin.query(`drop table if exists ${TABLE} cascade`);
await ensureSchema(adminClient);
await admin.query(`do $$ begin if not exists (select 1 from pg_roles where rolname = 'mentura_console_tenant') then create role mentura_console_tenant login password 'mentura-console-tenant'; end if; end $$;`);
await admin.query("alter role mentura_console_tenant with login password 'mentura-console-tenant'");
await admin.query(`grant connect on database ${database} to mentura_console_tenant`);
await admin.query("grant usage on schema public to mentura_console_tenant");
await admin.query(`grant select, insert on ${TABLE} to mentura_console_tenant`);
await admin.query(`grant usage, select on sequence ${TABLE}_seq_seq to mentura_console_tenant`);
await admin.query(readFileSync(join(here, "sql/002-tenant-isolation.sql"), "utf8"));
await admin.query(readFileSync(join(here, "sql/003-team-tenant.sql"), "utf8"));
await admin.query("insert into mentura_tenant_key (id, secret) values (true, $1) on conflict (id) do update set secret = excluded.secret", [key]);
const runtime = new URL(adminUrl);
runtime.username = "mentura_console_tenant";
runtime.password = "mentura-console-tenant";
const hostedEnv: NodeJS.ProcessEnv = {
  PATH: process.env.PATH, MENTURA_PUBLIC_ORIGIN: "https://mentura.example", MENTURA_DATABASE_URL: runtime.toString(),
  MENTURA_IDENTITY_DATABASE_URL: identityUrl, MENTURA_OUTSIDE_DATABASE_URL: outsideUrl,
};
for (const [k, val] of Object.entries(hostedEnv)) process.env[k] = val;

const hosted = <T>(as: Identity, input: { op: string; [k: string]: unknown }) => runHostedBridge<T>({ userId: as.userId, assertion: signAssertion(as, input, key), bridgePath, key, env: hostedEnv });
const hostedIds = async (as: Identity) => (await hosted<{ ventures: { id: string }[] }>(as, { op: "ventures" })).ventures.map((x) => x.id).sort().join();
const count = async (tenant: string) => Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [tenant])).rows[0]?.n);
const unbroken = async (tenant: string) => (await verify(adminClient, tenant)).broken.length === 0;
const newest = async (tenant: string, path: string) => (await admin.query(`select content, version from ${TABLE} where tenant = $1 and path = $2 order by seq desc limit 1`, [tenant, path])).rows[0] as { content: string; version: string } | undefined;

try {
  const harbor = await hosted<{ id: string; folder: string }>(ada("team-a"), { op: "create", name: "Harbor", description: "A pier." });
  const dock = await hosted<{ id: string; folder: string }>(ada("team-b"), { op: "create", name: "Dock", description: "A dock." });
  await closeWorkspacePools();
  const logPath = (await connect({ tenant: "team-a", client: adminClient, schema: false }).list(harbor.folder)).map((e) => e.path).find((p) => p.endsWith("/provenance.jsonl")) ?? "";
  const logBefore = await newest("team-a", logPath);
  const [a0, b0] = [await count("team-a"), await count("team-b")];

  const member = child(moveRequest(harbor.id, "team-a", "team-b", "owner", "member"), hostedEnv);
  expect("in the store, a Member of the destination is refused and no row is written", !member.ok && member.error === OWNER_OF_BOTH && await count("team-a") === a0 && await count("team-b") === b0);

  const moved = child(moveRequest(harbor.id, "team-a", "team-b"), hostedEnv);
  expect("in the store, the business moves", moved.ok && (moved.result?.moved ?? 0) > 0, moved);
  expect("the source team lists nothing and the destination lists both", await hostedIds(ada("team-a")) === "" && await hostedIds(ada("team-b")) === [harbor.id, dock.id].sort().join());
  const docket = await hosted<{ venture: string }>(ada("team-b"), { op: "docket", venture: harbor.id });
  expect("Naive reads the moved business in its new team", typeof docket.venture === "string");
  expect("both tenants' chains verify", await unbroken("team-a") && await unbroken("team-b"));
  const logAfter = await newest("team-b", logPath);
  expect("the business's provenance log arrived with the same content and version", !!logBefore && !!logAfter && logAfter.content.startsWith(logBefore.content) && (logAfter.content === logBefore.content ? logAfter.version === logBefore.version : true));
  const tomb = await newest("team-a", logPath);
  expect("the source keeps its history and ends each path with a tombstone", tomb?.version === REMOVED && tomb.content === "" && await count("team-a") > a0);

  const store = connect({ tenant: "team-a", client: adminClient, schema: false });
  const paths = (await store.list()).map((e) => e.path);
  expect("the connector lists no removed path and reads none", !paths.some((p) => p.startsWith(`${harbor.folder}/`)) && await store.read(logPath) === null);

  const again = await hosted<{ id: string }>(ada("team-a"), { op: "create", name: "Harbor", description: "Another pier." });
  await closeWorkspacePools();
  const [a1, b1] = [await count("team-a"), await count("team-b")];
  const twice = child(moveRequest(again.id, "team-a", "team-b"), hostedEnv);
  expect("a clash in the destination rolls the whole move back", !twice.ok && (twice.error ?? "").includes("already has a business") && await count("team-a") === a1 && await count("team-b") === b1 && await hostedIds(ada("team-a")) === again.id, [twice, await hostedIds(ada("team-a")), again.id]);

  // A forged destination: an assertion for team-b with team-c's request is refused before the database is reached,
  // and one signed with another key fails mentura_authorize in the database.
  const forgedKey = { ...moveRequest(again.id, "team-a", "team-b"), to: signAssertion(ada("team-b"), transfer(again.id, "team-a", "team-b"), "a-different-key-0123456789abcdef") };
  expect("an assertion with another key moves nothing", !child(forgedKey, hostedEnv).ok && await count("team-a") === a1 && await count("team-b") === b1);

  // Last, since it puts a file back in the folder the first business left.
  const restarted = await store.write(logPath, "again\n", { base: null });
  expect("a write after a tombstone starts the path again", typeof restarted.version === "string" && (await store.read(logPath))?.content === "again\n" && await unbroken("team-a"));

  const removed = child(removeRequest("team-b"), hostedEnv);
  expect("in the store, removing a team tombstones every path", removed.ok && (removed.result?.removed ?? 0) > 0 && await hostedIds(ada("team-b")) === "" && await unbroken("team-b"), removed);
  expect("a Member cannot remove a team in the store", !child(removeRequest("team-a", "member"), hostedEnv).ok && await hostedIds(ada("team-a")) === again.id);
} finally {
  await closeWorkspacePools();
  await admin.end();
}

process.exit(failed ? 1 : 0);
