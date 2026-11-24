// The hosted console entrypoint against local Postgres.
// A https origin must use outside_log. It does not create events.jsonl.
// A second process, started after the pool is closed, reads the same receipt.

import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import pg from "pg";
import { signAssertion, type Identity } from "../console/lib/assertion.ts";
import { consoleAccountWorkspace } from "./account-path.ts";
import { accountId, loadRequirement, ventureId, type VentureScope } from "./host.ts";
import { closeOutsidePools, hostedOutsideRequired, openAccountOutsideHost } from "./hosted-console.ts";
import { applyOutsideSchema } from "./postgres-log.ts";

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok) { failed++; if (detail !== undefined) console.log("      ", JSON.stringify(detail)); }
};

const opener = readFileSync(new URL("../console/lib/outside-host.ts", import.meta.url), "utf8");
const action = readFileSync(new URL("../console/app/actions.ts", import.meta.url), "utf8");
expect("the console entrypoint binds the session user id", opener.includes("sessionUserId: identity.userId") && opener.includes("requireIdentity") && opener.includes("signAssertion") && !opener.includes("events.jsonl"));
expect("the server action declares that entrypoint", action.startsWith("\"use server\"") && /export async function submitSignedOutside\(/.test(action) && !action.includes("export { submitSignedOutside"));

async function ensureDatabase(adminUrl: string, name: string): Promise<string> {
  const admin = new URL(adminUrl);
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

const evalUrl = process.env.MENTURA_EVAL_DATABASE_URL ?? process.env.MENTURA_OUTSIDE_DATABASE_URL ?? "";
if (!evalUrl) {
  if (process.env.CI) {
    console.error("FAIL  hosted console: CI did not set a local Postgres URL");
    process.exit(1);
  }
  console.log("SKIP  hosted console: set MENTURA_EVAL_DATABASE_URL to a local Postgres");
  process.exit(failed ? 1 : 0);
}
const hostName = new URL(evalUrl).hostname;
if (hostName !== "localhost" && hostName !== "127.0.0.1" && hostName !== "::1") {
  console.error("FAIL  hosted console: refusing a database host that is not loopback");
  process.exit(1);
}

const outsideUrl = await ensureDatabase(evalUrl, "mentura_outside_hosted_test");
const tenantUrl = await ensureDatabase(evalUrl, "mentura_tenant_guard");
const identityUrl = await ensureDatabase(evalUrl, "mentura_identity_guard");
const secret = "hosted-secret-must-not-appear-0123456789";
const previous = {
  origin: process.env.MENTURA_PUBLIC_ORIGIN,
  outside: process.env.MENTURA_OUTSIDE_DATABASE_URL,
  tenant: process.env.MENTURA_DATABASE_URL,
  identity: process.env.MENTURA_IDENTITY_DATABASE_URL,
  auth: process.env.MENTURA_AUTH_DATABASE_URL,
  better: process.env.BETTER_AUTH_SECRET,
};
process.env.MENTURA_PUBLIC_ORIGIN = "https://mentura.example";
process.env.MENTURA_OUTSIDE_DATABASE_URL = outsideUrl;
process.env.MENTURA_DATABASE_URL = tenantUrl;
process.env.MENTURA_IDENTITY_DATABASE_URL = identityUrl;
process.env.MENTURA_AUTH_DATABASE_URL = identityUrl;
process.env.BETTER_AUTH_SECRET = secret;
expect("https origin requires the durable log", hostedOutsideRequired());

await applyOutsideSchema(outsideUrl);
const accountKey = "outside-hosted-account-key-0123456789";
const schemaOwner = new pg.Pool({ connectionString: outsideUrl, max: 1 });
await schemaOwner.query(readFileSync(new URL("./sql/002-outside-account.sql", import.meta.url), "utf8"));
await schemaOwner.query("insert into outside_log_key (id, secret) values (true, $1) on conflict (id) do update set secret = excluded.secret", [accountKey]);
await schemaOwner.query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'outside_host_test') then
      create role outside_host_test login password 'outside-host-test';
    end if;
  end $$;
`);
await schemaOwner.query("alter role outside_host_test with login nosuperuser password 'outside-host-test'");
await schemaOwner.query("grant connect on database mentura_outside_hosted_test to outside_host_test");
await schemaOwner.query("grant usage on schema public to outside_host_test");
await schemaOwner.query("grant select, insert on outside_log to outside_host_test");
await schemaOwner.query("grant execute on function outside_log_authorize(text), outside_log_account() to outside_host_test");
await schemaOwner.end();
const runtimeOutside = new URL(outsideUrl);
runtimeOutside.username = "outside_host_test";
runtimeOutside.password = "outside-host-test";
process.env.MENTURA_OUTSIDE_DATABASE_URL = runtimeOutside.toString();

const root = mkdtempSync(join(tmpdir(), "outside-hosted-"));
const secretDir = join(root, "secrets");
mkdirSync(secretDir, { mode: 0o700 });
const signingKeyFile = join(secretDir, "signing");
const inboundKeyFile = join(secretDir, "inbound");
writeFileSync(signingKeyFile, "test-key-material-0123456789abcdef", { mode: 0o600 });
writeFileSync(inboundKeyFile, "test-inbound-material-0123456789abcd", { mode: 0o600 });
const sessionUserId = "acct-ada";
const identityFor = (userId: string, name: string): Identity => ({ userId, name, email: `${name.toLowerCase()}@example.com`, organizationId: "org", organizationRole: "owner" });
const assertionFor = (userId: string, name: string) => signAssertion(identityFor(userId, name), { op: "outside" }, accountKey);
const workspace = consoleAccountWorkspace(root, sessionUserId);
const venture = join(workspace, "kettle");
const fixture = join(workspace, "fixtures", "finance");
mkdirSync(venture, { recursive: true });
mkdirSync(fixture, { recursive: true });
writeFileSync(join(fixture, "note.txt"), "local reading\n", { mode: 0o600 });

const requirement = loadRequirement({
  id: "fin-reading-1",
  ventureId: "kettle",
  functionId: "finance",
  statement: "Finance needs a reading of the fixture directory in this account.",
  gap: "GitHub issues, projects, discussions, docs, reviews, actions, and repository files do not hold this reading.",
  address: "finance",
  support: {
    status: "hypothesized",
    evidence: { kind: "founder-statement", recordPath: "knowledge/outside/fin-reading-1.json" },
    provenance: { by: "Ada", at: "2026-11-08T00:00:00.000Z" },
  },
}, ["finance"]);
const policy = { personMayAct: (_d: string, name: string) => name === "Ada" || name === "Bea", personMayApprove: (_d: string, name: string) => name === "Ada" };
const scope = (user: string, name: string, dir = workspace): VentureScope => ({
  ventureId: ventureId("kettle"),
  ventureDir: join(dir, "kettle"),
  functionId: "finance",
  actor: { kind: "person", sessionUserId: accountId(user), venturePersonName: name },
});

const missing = await openAccountOutsideHost({
  root, sessionUserId, signingKeyFile, inboundKeyFile, policy, functionIds: ["finance"], shapeCheck: { accepted: () => true },
  env: { ...process.env, MENTURA_OUTSIDE_DATABASE_URL: "" },
}).then(() => false).catch((error: unknown) => error instanceof Error && error.message === "outside: database URL is refused");
expect("a hosted console without the outside database does not open the file log", missing && !existsSync(join(workspace, "outside", "kettle", "events.jsonl")));

const opened = await openAccountOutsideHost({
  root, sessionUserId, signingKeyFile, inboundKeyFile, policy, functionIds: ["finance"], shapeCheck: { accepted: () => true },
  assertion: assertionFor(sessionUserId, "Ada"),
});
expect("the hosted entrypoint is durable", opened.durable);
const ada = scope(sessionUserId, "Ada");
const bound = await opened.host.submit(ada, { kind: "bind", idempotencyKey: "bind-hosted", requirement, providerId: "local-fixture", fixture: "finance", accountRef: "local" });
const connectionId = bound.status === "bound" ? String(bound.connectionId) : "";
const held = await opened.host.submit(ada, { kind: "write", idempotencyKey: "write-hosted", connectionId, payload: { note: "fixture line" } });
const approved = await opened.host.submit(ada, { kind: "approve", idempotencyKey: "approve-hosted", approves: String("intentId" in held ? held.intentId : "") });
const receiptId = "receiptId" in approved ? String(approved.receiptId) : "";
expect("hosted approve returns a receipt", approved.status === "done" && receiptId.length > 0);
const revokedHold = await opened.host.submit(ada, { kind: "write", idempotencyKey: "write-hosted-revoke", connectionId, payload: { note: "stop" } });
const revoked = await opened.host.submit(ada, { kind: "revoke", idempotencyKey: "revoke-hosted", authorizationId: String("authorizationId" in revokedHold ? revokedHold.authorizationId : "") });
const blocked = await opened.host.submit(ada, { kind: "approve", idempotencyKey: "approve-hosted-revoke", approves: String("intentId" in revokedHold ? revokedHold.intentId : "") });
expect("hosted revoke blocks approve", revoked.status === "revoked" && blocked.status === "refused" && blocked.reason === "revoked");
expect("the hosted log did not fall back to the events file", !existsSync(join(workspace, "outside", "kettle", "events.jsonl")));
await opened.close();

const child = await new Promise<{ code: number; out: string }>((resolve) => {
  const proc = spawn(process.execPath, ["outside/hosted-read.ts", root, sessionUserId, signingKeyFile, inboundKeyFile, receiptId, assertionFor(sessionUserId, "Ada")], { stdio: ["ignore", "pipe", "inherit"] });
  let out = "";
  proc.stdout.on("data", (chunk) => { out += chunk; });
  proc.on("exit", (code) => resolve({ code: code ?? 1, out }));
});
expect("a replacement process reads the receipt from the database", child.code === 0 && child.out.includes(receiptId) && !child.out.includes(secret));

const otherRoot = consoleAccountWorkspace(root, "acct-bea");
mkdirSync(join(otherRoot, "kettle"), { recursive: true });
mkdirSync(join(otherRoot, "fixtures", "finance"), { recursive: true });
const bea = await openAccountOutsideHost({
  root, sessionUserId: "acct-bea", signingKeyFile, inboundKeyFile, policy, functionIds: ["finance"], shapeCheck: { accepted: () => true },
  assertion: assertionFor("acct-bea", "Bea"),
});
const crossed = await bea.host.submit(scope("acct-bea", "Bea", otherRoot), { kind: "read", idempotencyKey: "bea-hosted", connectionId });
expect("another session account does not read the receipt", crossed.status === "refused" && !("receiptId" in crossed));
await bea.close();

const check = new pg.Pool({ connectionString: outsideUrl, max: 1 });
const rows = await check.connect().then(async (client) => {
  try {
    const found = await client.query("select line::text as line from outside_log where account_id = $1", [sessionUserId]);
    return found.rows.map((row) => String(row.line));
  } finally { client.release(); }
});
await check.end();
expect("stored lines do not contain the server secret", rows.length > 0 && rows.every((line) => !line.includes(secret) && !line.includes("mentura-eval")));

const savedOrigin = process.env.MENTURA_PUBLIC_ORIGIN;
delete process.env.MENTURA_PUBLIC_ORIGIN;
const local = await openAccountOutsideHost({
  root, sessionUserId, signingKeyFile, inboundKeyFile, policy, functionIds: ["finance"], shapeCheck: { accepted: () => true },
});
expect("local npm start keeps the file adapter", !local.durable);
await local.close();
if (savedOrigin === undefined) delete process.env.MENTURA_PUBLIC_ORIGIN;
else process.env.MENTURA_PUBLIC_ORIGIN = savedOrigin;

await closeOutsidePools();
const restore = (key: "MENTURA_PUBLIC_ORIGIN" | "MENTURA_OUTSIDE_DATABASE_URL" | "MENTURA_DATABASE_URL" | "MENTURA_IDENTITY_DATABASE_URL" | "MENTURA_AUTH_DATABASE_URL" | "BETTER_AUTH_SECRET", value: string | undefined) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
};
restore("MENTURA_PUBLIC_ORIGIN", previous.origin);
restore("MENTURA_OUTSIDE_DATABASE_URL", previous.outside);
restore("MENTURA_DATABASE_URL", previous.tenant);
restore("MENTURA_IDENTITY_DATABASE_URL", previous.identity);
restore("MENTURA_AUTH_DATABASE_URL", previous.auth);
restore("BETTER_AUTH_SECRET", previous.better);

if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("hosted console outside: all checks passed");
