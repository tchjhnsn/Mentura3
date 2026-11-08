// The hosted child must run from the console's file trace alone. This copies only the files
// page.js.nft.json names into a scratch directory, then runs that copy against a scratch Postgres.
// It does not use the repository checkout as the child's module path.
//
//   MENTURA_EVAL_DATABASE_URL=postgres://mentura@127.0.0.1:5432/postgres node platform/hosted/trace-artifact-test.ts

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { signAssertion, type Identity } from "../../console/lib/assertion.ts";
import { ensureSchema, TABLE, type Client } from "../connectors/postgres.ts";

const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const nftPath = join(repo, "console/.next/server/app/page.js.nft.json");
const required = [
  "platform/hosted/console-child.ts",
  "platform/hosted/account-workspace.ts",
  "platform/hosted/public-error.ts",
  "platform/hosted/required.ts",
  "platform/hosted/working-copy.ts",
  "platform/hosted/tenant-session.ts",
  "platform/connectors/postgres.ts",
  "console/lib/bridge.mjs",
  "console/lib/assertion.ts",
  "console/lib/claims.ts",
  "console/lib/phase.ts",
  "console/lib/record-forms.ts",
  "node_modules/naive-framework/package.json",
  "node_modules/pg/package.json",
];

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok) { failed++; if (detail !== undefined) console.log("      ", detail); }
};

const built = spawnSync("npm", ["run", "build"], { cwd: join(repo, "console"), encoding: "utf8", stdio: "inherit" });
expect("the console production build exits 0", built.status === 0);
if (built.status !== 0 || !existsSync(nftPath)) {
  console.log(`${failed} failed`);
  process.exit(1);
}

const nftDir = dirname(nftPath);
const files = (JSON.parse(readFileSync(nftPath, "utf8")) as { files: string[] }).files;
const repoFiles = files.map((file) => relative(repo, resolve(nftDir, file)).split(sep).join("/"));
const missing = required.filter((file) => !repoFiles.includes(file));
const privateFile = repoFiles.find((file) => file === ".env" || file.startsWith(".env.") || file.includes("/.env") || file.includes("/.data/") || file.startsWith("console/.data"));
expect("the page trace contains the hosted child closure", missing.length === 0, missing);
expect("the page trace does not contain an env file or console/.data", privateFile === undefined, privateFile);

const routes = ["page.js.nft.json", "claim/page.js.nft.json", "new/page.js.nft.json", "v/[venture]/page.js.nft.json"];
const routeGap = routes.filter((route) => {
  const listed = (JSON.parse(readFileSync(join(repo, "console/.next/server/app", route), "utf8")) as { files: string[] }).files;
  const names = listed.map((file) => relative(repo, resolve(dirname(join(repo, "console/.next/server/app", route)), file)).split(sep).join("/"));
  return !names.includes("platform/hosted/account-workspace.ts");
});
expect("every hosted page trace contains the workspace module", routeGap.length === 0, routeGap);

const source = process.env.MENTURA_EVAL_DATABASE_URL ?? "";
if (!source) {
  if (process.env.CI) {
    console.error("FAIL  trace artifact: CI did not set MENTURA_EVAL_DATABASE_URL");
    process.exit(1);
  }
  console.log("SKIP  trace artifact execution: set MENTURA_EVAL_DATABASE_URL to a local Postgres");
  process.exit(failed ? 1 : 0);
}
const hostName = new URL(source).hostname;
if (hostName !== "localhost" && hostName !== "127.0.0.1" && hostName !== "::1") {
  console.error("FAIL  trace artifact: refusing a database host that is not loopback");
  process.exit(1);
}

async function ensureDatabase(name: string): Promise<string> {
  const admin = new URL(source);
  admin.pathname = "/postgres";
  const pool = new pg.Pool({ connectionString: admin.toString(), max: 1 });
  try {
    const existing = await pool.query("select 1 from pg_database where datname = $1", [name]);
    if (!existing.rowCount) await pool.query(`create database ${name}`);
  } finally {
    await pool.end();
  }
  admin.pathname = `/${name}`;
  return admin.toString();
}

const tenantUrl = await ensureDatabase("mentura_trace_artifact");
const identityUrl = await ensureDatabase("mentura_trace_identity");
const outsideUrl = await ensureDatabase("mentura_trace_outside");
const admin = new pg.Pool({ connectionString: tenantUrl, max: 1 });
const adminClient: Client = {
  query: (text, params) => admin.query(text, params),
  connect: async () => {
    const client = await admin.connect();
    return { query: (text, params) => client.query(text, params), release: () => client.release() };
  },
};
await ensureSchema(adminClient);
await admin.query(readFileSync(new URL("./sql/002-tenant-isolation.sql", import.meta.url), "utf8"));

const dest = mkdtempSync(join(tmpdir(), "mentura-traced-"));
for (const file of files) {
  const abs = resolve(nftDir, file);
  const rel = relative(repo, abs);
  if (rel.startsWith("..") || rel === "") continue;
  const out = join(dest, rel);
  if (!existsSync(abs)) continue;
  mkdirSync(dirname(out), { recursive: true });
  cpSync(abs, out, { recursive: statSync(abs).isDirectory() });
}
const child = join(dest, "platform/hosted/console-child.ts");
const bridge = join(dest, "console/lib/bridge.mjs");
expect("the copied artifact is not the checkout", child !== join(repo, "platform/hosted/console-child.ts") && existsSync(child) && existsSync(bridge) && !existsSync(join(dest, ".env")) && !existsSync(join(dest, "console/.data")));

const privateTmp = mkdtempSync(join(tmpdir(), "mentura-trace-tmp-"));
const userId = "traceacct";
const key = "trace-bridge-key-0123456789abcdef";
await admin.query("insert into mentura_tenant_key (id, secret) values (true, $1) on conflict (id) do update set secret = excluded.secret", [key]);
const identity: Identity = { userId, name: "Ada", email: "ada@example.com", organizationId: "org", organizationRole: "owner" };
const description = "kept-out-of-errors";
const baseEnv: NodeJS.ProcessEnv = {
  PATH: process.env.PATH ?? "",
  HOME: process.env.HOME ?? tmpdir(),
  TMPDIR: privateTmp,
  MENTURA_PUBLIC_ORIGIN: "https://mentura.example",
  MENTURA_DATABASE_URL: tenantUrl,
  MENTURA_IDENTITY_DATABASE_URL: identityUrl,
  MENTURA_OUTSIDE_DATABASE_URL: outsideUrl,
};

function runCopied(env: NodeJS.ProcessEnv, request: { op: string; [key: string]: unknown }): { code: number; out: string; err: string } {
  const assertion = signAssertion(identity, request, key);
  const proc = spawnSync(process.execPath, [child], {
    cwd: dest,
    input: JSON.stringify({ userId, assertion, bridgePath: bridge, key, timeoutMs: 60_000 }),
    encoding: "utf8",
    env,
    timeout: 90_000,
  });
  return { code: proc.status ?? 1, out: proc.stdout ?? "", err: proc.stderr ?? "" };
}

function quiet(text: string): boolean {
  return !text.includes(description) && !text.includes(identity.email) && !text.includes(key) && !text.includes("127.0.0.1") && !text.includes("secret-not-shown") && !text.includes("postgres://");
}

const created = runCopied(baseEnv, { op: "create", name: "Trace Harbor", description });
let createdId = "";
try { createdId = String((JSON.parse(created.out) as { result?: { id?: string } }).result?.id ?? ""); } catch { createdId = ""; }
const createdRows = await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId]);
const left = readdirSync(privateTmp);
expect("a traced child accepts one create and removes its copy", created.code === 0 && createdId.length > 0 && Number(createdRows.rows[0]?.n) > 0 && left.length === 0 && !created.out.includes(key) && !created.out.includes("postgres://") && !created.err.includes(key), { code: created.code, rows: Number(createdRows.rows[0]?.n), left: left.length });

const beforeReject = Number(createdRows.rows[0]?.n);
const rejected = runCopied(baseEnv, { op: "create", name: " -no", description });
const afterReject = Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId])).rows[0]?.n);
let rejectedBody: { ok?: boolean; error?: string } = {};
try { rejectedBody = JSON.parse(rejected.out) as { ok?: boolean; error?: string }; } catch { rejectedBody = {}; }
expect("a traced child commits nothing for a refused create", rejected.code === 0 && rejectedBody.ok === false && afterReject === beforeReject && quiet(`${rejected.out}\n${rejected.err}`), rejected.code === 0 ? undefined : rejected.err.slice(0, 400));

const refused = runCopied({ ...baseEnv, MENTURA_DATABASE_URL: "postgres://mentura:secret-not-shown@127.0.0.1:1/nope" }, { op: "ventures" });
let refusedBody: { ok?: boolean; error?: string } = {};
try { refusedBody = JSON.parse(refused.out) as { ok?: boolean; error?: string }; } catch { refusedBody = {}; }
expect("a traced child hides a refused database connection", refusedBody.ok === false && refusedBody.error === "Naive did not finish. Try again." && quiet(`${refused.out}\n${refused.err}`), refused.err.slice(0, 200));

await admin.end();
rmSync(dest, { recursive: true, force: true });
rmSync(privateTmp, { recursive: true, force: true });
if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("hosted trace artifact: all checks passed");
