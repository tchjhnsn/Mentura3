import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, linkSync, existsSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { consoleOutsideLog } from "./console-account.ts";
import { stampedAccountOwner } from "./owner.ts";
import { accountId, loadRequirement, openToolHost, signBody, ventureId, type CapabilityRequirement, type HostOptions, type ToolHost, type VentureScope } from "./host.ts";
import type { VenturePolicy } from "./policy.ts";
import { naivePath } from "../naive.ts";

let failed = 0;
const expect = (name: string, cond: boolean, detail?: unknown) => {
  console.log(`${cond ? "ok  " : "FAIL"}  ${name}`);
  if (!cond) { failed++; if (detail !== undefined) console.log("      ", JSON.stringify(detail)); }
};

const functionIds = (JSON.parse(readFileSync(naivePath("packages/naive/src/functions/departments.json"), "utf8")) as { departments: { id: string }[] }).departments.map((row) => row.id);
expect("Naive lists 13 function ids", functionIds.length === 13 && functionIds.includes("finance") && functionIds.includes("strategy"));
const sessionLog = consoleOutsideLog("/data/workspace", "better-auth-user-1", "kettle");
const personLog = consoleOutsideLog("/data/workspace", "identity-person-1", "kettle");
expect("the Better Auth user id and a person id are different directories", sessionLog !== personLog && sessionLog === "/data/workspace/.accounts/better-auth-user-1/outside/kettle/events.jsonl");
const opener = readFileSync(new URL("./console-account.ts", import.meta.url), "utf8");
expect("the console opener parameter is the session user id", /readonly sessionUserId:/.test(opener) && !/readonly personId:/.test(opener) && !opener.includes("headers"));

const root = mkdtempSync(join(tmpdir(), "outside-host-"));
const keyMaterial = "test-key-material-0123456789abcdef";
const inboundMaterial = "test-inbound-material-0123456789abcd";
const secretDir = join(root, "secrets");
mkdirSync(secretDir, { mode: 0o700 });
const signingKeyFile = join(secretDir, "signing");
const inboundKeyFile = join(secretDir, "inbound");
writeFileSync(signingKeyFile, keyMaterial, { mode: 0o600 });
writeFileSync(inboundKeyFile, inboundMaterial, { mode: 0o600 });

function layout(name: string): { workspace: string; venture: string; fixture: string } {
  const workspace = join(root, name);
  const venture = join(workspace, "kettle");
  const fixture = join(workspace, "fixtures", "finance");
  mkdirSync(venture, { recursive: true });
  mkdirSync(fixture, { recursive: true });
  writeFileSync(join(fixture, "note.txt"), "local reading\n", { mode: 0o600 });
  return { workspace, venture, fixture };
}

const ada = layout("acct-ada");
const bea = layout("acct-bea");

const shapeCheck = { accepted: () => true };

function policyFor(signers: readonly string[]): VenturePolicy {
  const named = (name: string) => name === "Ada" || name === "Cara" || name === "Bea";
  const owns = (dir: string, sessionUserId: string) => {
    const owner = stampedAccountOwner(dir);
    return owner === null || owner === sessionUserId;
  };
  return {
    personMayAct(dir, name, sessionUserId) { return named(name) && owns(dir, sessionUserId); },
    personMayApprove(dir, name, sessionUserId) { return named(name) && owns(dir, sessionUserId) && signers.includes(name); },
  };
}

function requirement(id: string, functionId: string, address: string | null): CapabilityRequirement {
  return loadRequirement({
    id,
    ventureId: "kettle",
    functionId,
    statement: "Finance needs a reading of the fixture directory in this account.",
    gap: "GitHub issues, projects, discussions, docs, reviews, actions, and repository files do not hold this reading.",
    address,
    support: {
      status: "hypothesized",
      evidence: { kind: "founder-statement", recordPath: `knowledge/outside/${id}.json` },
      provenance: { by: "Ada", at: "2026-11-08T00:00:00.000Z" },
    },
  }, functionIds);
}

function hostOptions(workspace: string, signers: readonly string[] = ["Ada"], check = shapeCheck): HostOptions {
  return {
    accountId: accountId(workspace.endsWith("acct-ada") ? "acct-ada" : "acct-bea"),
    accountWorkspace: workspace,
    signingKeyFile,
    inboundKeyFile,
    policy: policyFor(signers),
    functionIds,
    shapeCheck: check,
  };
}

function hostFor(workspace: string, signers: readonly string[] = ["Ada"], check = shapeCheck): ToolHost {
  return openToolHost(hostOptions(workspace, signers, check));
}

function person(workspace: string, venture: string, name: string, functionId = "finance"): VentureScope {
  const id = workspace.endsWith("acct-ada") ? "acct-ada" : "acct-bea";
  return { ventureId: ventureId("kettle"), ventureDir: venture, functionId, actor: { kind: "person", sessionUserId: accountId(id), venturePersonName: name } };
}

const adaHost = hostFor(ada.workspace);
const financeReq = requirement("fin-reading-1", "finance", "finance");
const adaScope = person(ada.workspace, ada.venture, "Ada");

const pointed = await adaHost.inspect(adaScope, { requirement: financeReq, receiptId: null, inboundReceiptId: null });
expect("address with no row is pointed", pointed.status === "ready" && pointed.condition === "pointed" && pointed.provider === null && pointed.accepted === false);

const closed = hostFor(ada.workspace, ["Ada"], { accepted: () => false });
const unchecked = await closed.submit(adaScope, { kind: "bind", idempotencyKey: "no-shape", requirement: financeReq, providerId: "local-fixture", fixture: "finance", accountRef: "local" });
expect("a record the validator refused is not bound", unchecked.status === "refused" && unchecked.reason === "requirement shape was not accepted by Naive's validator");

const github = await adaHost.submit(adaScope, { kind: "bind", idempotencyKey: "gh", requirement: financeReq, providerId: "github", fixture: "finance", accountRef: "local" });
expect("github is refused and is not a catalog provider", github.status === "refused" && github.reason === "catalog");
const logAfterGithub = join(ada.workspace, "outside", "kettle", "events.jsonl");
expect("a refused github bind appends nothing", !existsSyncSafe(logAfterGithub));

const bound = await adaHost.submit(adaScope, { kind: "bind", idempotencyKey: "bind-1", requirement: financeReq, providerId: "local-fixture", fixture: "finance", accountRef: "local" });
expect("bind connects the local fixture", bound.status === "bound" && "connectionId" in bound);
const connectionId = bound.status === "bound" ? String(bound.connectionId) : "";

const read1 = await adaHost.submit(adaScope, { kind: "read", idempotencyKey: "read-1", connectionId });
const read2 = await adaHost.submit(adaScope, { kind: "read", idempotencyKey: "read-1", connectionId });
expect("a repeated read returns the same receipt", read1.status === "done" && read2.status === "done" && "receiptId" in read1 && "receiptId" in read2 && read1.receiptId === read2.receiptId);
const receiptLines = readFileSync(logAfterGithub, "utf8").split("\n").filter((line) => line.includes("\"kind\":\"receipt\"") && line.includes("\"outcome\":\"completed\"") && !line.includes("eventId"));
expect("the driver receipt is stored once", receiptLines.length === 1);

const held = await adaHost.submit(adaScope, { kind: "write", idempotencyKey: "write-1", connectionId, payload: { note: "fixture line" } });
expect("a write is held and grants nothing", held.status === "awaiting-approval" && "granted" in held && held.granted === false);
expect("a held write does not touch the outbox", !existsSyncSafe(join(ada.fixture, "outbox.jsonl")));
const approved = await adaHost.submit(adaScope, { kind: "approve", idempotencyKey: "approve-1", approves: String("intentId" in held ? held.intentId : "") });
const approvedAgain = await adaHost.submit(adaScope, { kind: "approve", idempotencyKey: "approve-1", approves: String("intentId" in held ? held.intentId : "") });
expect("approve runs once and the repeat returns the same receipt", approved.status === "done" && approvedAgain.status === "done" && "receiptId" in approved && "receiptId" in approvedAgain && approved.receiptId === approvedAgain.receiptId);
const outbox = readFileSync(join(ada.fixture, "outbox.jsonl"), "utf8").trim().split("\n");
expect("the outbox has one line and not the payload", outbox.length === 1 && !outbox[0].includes("fixture line"));

const cara = person(ada.workspace, ada.venture, "Cara");
const caraWrite = await adaHost.submit(cara, { kind: "write", idempotencyKey: "write-cara", connectionId, payload: { note: "no" } });
expect("a roster person who is not a signer may stage a write", caraWrite.status === "awaiting-approval" && "intentId" in caraWrite);
const caraApprove = await adaHost.submit(cara, { kind: "approve", idempotencyKey: "approve-cara", approves: String("intentId" in caraWrite ? caraWrite.intentId : "") });
expect("that person cannot approve the write", caraApprove.status === "refused");
const eve = person(ada.workspace, ada.venture, "Eve");
const eveRead = await adaHost.submit(eve, { kind: "read", idempotencyKey: "read-1", connectionId });
expect("a refused person does not receive a cached receipt", eveRead.status === "refused" && !("receiptId" in eveRead));
const adaStill = await adaHost.submit(adaScope, { kind: "read", idempotencyKey: "read-1", connectionId });
expect("the authorized reader still gets the original receipt", adaStill.status === "done" && "receiptId" in adaStill && adaStill.receiptId === ("receiptId" in read1 ? read1.receiptId : ""));
const eveView = await adaHost.inspect(eve, { requirement: financeReq, receiptId: "receiptId" in read1 ? String(read1.receiptId) : null, inboundReceiptId: null });
expect("inspect does not disclose a connection to a refused person", eveView.status === "refused" && !("health" in eveView));
const otherApprove = await adaHost.submit(adaScope, { kind: "approve", idempotencyKey: "approve-2", approves: String("intentId" in held ? held.intentId : "") });
expect("a second approve key returns the same receipt", otherApprove.status === "done" && "receiptId" in otherApprove && "receiptId" in approved && otherApprove.receiptId === approved.receiptId && readFileSync(join(ada.fixture, "outbox.jsonl"), "utf8").trim().split("\n").length === 1);
const linesBeforeRevoke = readFileSync(join(ada.fixture, "outbox.jsonl"), "utf8").trim().split("\n").length;
const heldRevoke = await adaHost.submit(adaScope, { kind: "write", idempotencyKey: "write-revoke", connectionId, payload: { note: "stop" } });
const revoked = await adaHost.submit(adaScope, { kind: "revoke", idempotencyKey: "revoke-1", authorizationId: String("authorizationId" in heldRevoke ? heldRevoke.authorizationId : "") });
const afterRevoke = await adaHost.submit(adaScope, { kind: "approve", idempotencyKey: "approve-revoked", approves: String("intentId" in heldRevoke ? heldRevoke.intentId : "") });
expect("revoke accepts the authorization id and blocks approve", revoked.status === "revoked" && afterRevoke.status === "refused" && afterRevoke.reason === "revoked" && readFileSync(join(ada.fixture, "outbox.jsonl"), "utf8").trim().split("\n").length === linesBeforeRevoke);

const beforeAgent = readFileSync(logAfterGithub, "utf8");
chmodSync(signingKeyFile, 0o644);
const agentScope = { ...adaScope, actor: { kind: "agent", role: "finance-agent", functionId: "finance", proof: "v1.x.y" } } as unknown as VentureScope;
const agentRead = await adaHost.submit(agentScope, { kind: "read", idempotencyKey: "agent-read", connectionId });
chmodSync(signingKeyFile, 0o600);
expect("an agent is refused before any key is read", agentRead.status === "refused" && agentRead.reason === "agents are not admitted");
expect("an agent refusal does not append", readFileSync(logAfterGithub, "utf8") === beforeAgent);
expect("the host source does not offer proofForRun", !readFileSync(new URL("./host.ts", import.meta.url), "utf8").includes("proofForRun"));
expect("the function agent does not import the outside host", !readFileSync(new URL("../agents/function-agent.ts", import.meta.url), "utf8").includes("outside/"));

const raw = new TextEncoder().encode("{\"echoed\":\"next\"}");
const beforeBad = readFileSync(logAfterGithub, "utf8");
const bad = await adaHost.receive({ ventureId: ventureId("kettle"), connectionId, eventId: "evt-1", rawBody: raw, signature: "nope" });
expect("a bad HMAC is rejected", bad.status === "rejected" && bad.reason === "authenticity");
chmodSync(inboundKeyFile, 0o640);
const looseInbound = await adaHost.receive({ ventureId: ventureId("kettle"), connectionId, eventId: "evt-mode", rawBody: raw, signature: "nope" });
chmodSync(inboundKeyFile, 0o600);
expect("a group-readable inbound file is not reported as a missing secret", looseInbound.status === "rejected" && looseInbound.reason === "outside: secret file must be readable only by its owner");
expect("a bad HMAC appends nothing", readFileSync(logAfterGithub, "utf8") === beforeBad);
const macFor = (eventId: string, body: Uint8Array, id = connectionId) => signBody(inboundKeyFile, { accountId: "acct-ada", ventureId: "kettle", connectionId: id, eventId, rawBody: body });
const signature = macFor("evt-1", raw);
const stored = await adaHost.receive({ ventureId: ventureId("kettle"), connectionId, eventId: "evt-1", rawBody: raw, signature });
const storedAgain = await adaHost.receive({ ventureId: ventureId("kettle"), connectionId, eventId: "evt-1", rawBody: raw, signature });
expect("the same inbound body returns the same receipt", stored.status === "stored" && storedAgain.receiptId === stored.receiptId);
const other = new TextEncoder().encode("{\"echoed\":\"other\"}");
const conflict = await adaHost.receive({ ventureId: ventureId("kettle"), connectionId, eventId: "evt-1", rawBody: other, signature: macFor("evt-1", other) });
expect("a changed body on the same event id conflicts and keeps the first", conflict.status === "stored" && conflict.receiptId !== stored.receiptId);
const replayedEvent = await adaHost.receive({ ventureId: ventureId("kettle"), connectionId, eventId: "evt-2", rawBody: raw, signature });
expect("an inbound signature does not replay onto another event", replayedEvent.status === "rejected" && replayedEvent.reason === "authenticity");
expect("the log never contains the signing key or the inbound key", !readFileSync(logAfterGithub, "utf8").includes(keyMaterial) && !readFileSync(logAfterGithub, "utf8").includes(inboundMaterial));

const view = await adaHost.inspect(adaScope, { requirement: financeReq, receiptId: "receiptId" in approved ? String(approved.receiptId) : null, inboundReceiptId: stored.receiptId ?? null });
expect("inspect reports a mismatch for two different hashes and accepts nothing", view.status === "ready" && view.accepted === false && view.relation === "mismatch");
const same = await adaHost.inspect(adaScope, { requirement: financeReq, receiptId: "receiptId" in approved ? String(approved.receiptId) : null, inboundReceiptId: "receiptId" in approved ? String(approved.receiptId) : null });
expect("inspect reports a match when both ids are the same receipt", same.status === "ready" && same.relation === "match" && same.accepted === false);

writeFileSync(join(ada.venture, "knowledge"), "");
rmSync(join(ada.venture, "knowledge"));
mkdirSync(join(ada.venture, "knowledge"));
writeFileSync(join(ada.venture, "knowledge", "sources.json"), JSON.stringify({ sources: [{ connector: "github", repo: "ada/kettle" }] }));
const covered = await adaHost.inspect(adaScope, { requirement: financeReq, receiptId: null, inboundReceiptId: null });
expect("an existing github source is reported and not executed", covered.status === "ready" && covered.storeCoverage === "github-source");

mkdirSync(join(ada.workspace, "other"));
const beforeMismatch = readFileSync(logAfterGithub, "utf8");
const mismatch = await adaHost.submit({ ...adaScope, ventureDir: join(ada.workspace, "other") }, { kind: "read", idempotencyKey: "cross-venture", connectionId });
const mismatchView = await adaHost.inspect({ ...adaScope, ventureDir: join(ada.workspace, "other") }, { requirement: financeReq, receiptId: "receiptId" in read1 ? String(read1.receiptId) : null, inboundReceiptId: null });
expect("a different directory does not read the venture id's log", mismatch.status === "refused" && !("receiptId" in mismatch) && mismatchView.status === "refused" && !("health" in mismatchView) && readFileSync(logAfterGithub, "utf8") === beforeMismatch);
const onlyOther = openToolHost({
  ...hostOptions(ada.workspace),
  policy: {
    personMayAct: (dir) => dir.endsWith("/other"),
    personMayApprove: (dir) => dir.endsWith("/other"),
  },
});
const policyMismatch = await onlyOther.submit({ ...adaScope, ventureDir: join(ada.workspace, "other") }, { kind: "read", idempotencyKey: "policy-other", connectionId });
expect("a policy for another directory does not unlock this venture", policyMismatch.status === "refused" && !("receiptId" in policyMismatch) && readFileSync(logAfterGithub, "utf8") === beforeMismatch);

const outsideVenture = join(root, "not-in-account");
mkdirSync(outsideVenture);
const escaped = await adaHost.submit(person(ada.workspace, outsideVenture, "Ada"), { kind: "read", idempotencyKey: "escape", connectionId });
expect("a venture outside the account workspace is refused", escaped.status === "refused");
const link = join(ada.workspace, "link");
symlinkSync(outsideVenture, link);
const linked = await adaHost.submit({ ...adaScope, ventureDir: link }, { kind: "read", idempotencyKey: "link", connectionId });
expect("a symlink out of the workspace is refused", linked.status === "refused");

const beaHost = hostFor(bea.workspace);
const crossedAccount = await beaHost.submit(person(bea.workspace, ada.venture, "Bea"), { kind: "read", idempotencyKey: "cross-account", connectionId });
expect("another account cannot use this venture directory", crossedAccount.status === "refused");
const beaRead = await beaHost.submit(person(bea.workspace, bea.venture, "Bea"), { kind: "read", idempotencyKey: "bea-read", connectionId });
expect("a connection id from another account is not in this log", beaRead.status === "refused");

chmodSync(signingKeyFile, 0o644);
const loose = await adaHost.submit(adaScope, { kind: "read", idempotencyKey: "loose-key", connectionId });
chmodSync(signingKeyFile, 0o600);
expect("a group-readable signing key is refused", loose.status === "refused" && String(loose.reason).includes("readable only by its owner"));

mkdirSync(join(ada.venture, ".naive"), { recursive: true });
writeFileSync(join(ada.venture, ".naive", "owner-account"), "acct-other\n", { mode: 0o600 });
const foreignOwner = await adaHost.submit(adaScope, { kind: "read", idempotencyKey: "owner-read", connectionId });
const foreignView = await adaHost.inspect(adaScope, { requirement: financeReq, receiptId: null, inboundReceiptId: null });
expect("a stamped owner blocks another session user", foreignOwner.status === "refused" && !("receiptId" in foreignOwner) && foreignView.status === "refused");
writeFileSync(join(ada.venture, ".naive", "owner-account"), "acct-ada\n", { mode: 0o600 });
const ownerRead = await adaHost.submit(adaScope, { kind: "read", idempotencyKey: "owner-read", connectionId });
expect("the stamped account can read", ownerRead.status === "done");

const outsideOutbox = join(root, "stolen-outbox.txt");
writeFileSync(outsideOutbox, "original\n", { mode: 0o600 });
rmSync(join(ada.fixture, "outbox.jsonl"));
symlinkSync(outsideOutbox, join(ada.fixture, "outbox.jsonl"));
const heldLink = await adaHost.submit(adaScope, { kind: "write", idempotencyKey: "write-link", connectionId, payload: { note: "no" } });
const approvedLink = await adaHost.submit(adaScope, { kind: "approve", idempotencyKey: "approve-link", approves: String("intentId" in heldLink ? heldLink.intentId : "") });
expect("an outbox symlink is not written", approvedLink.status === "refused" && readFileSync(outsideOutbox, "utf8") === "original\n");
rmSync(join(ada.fixture, "outbox.jsonl"));

let clock = Date.parse("2026-11-08T00:00:00.000Z");
const timed = openToolHost({ ...hostOptions(ada.workspace), now: () => clock });
const heldClock = await timed.submit(adaScope, { kind: "write", idempotencyKey: "write-clock", connectionId, payload: { note: "late" } });
clock += 120_000;
const late = await timed.submit(adaScope, { kind: "approve", idempotencyKey: "approve-clock", approves: String("intentId" in heldClock ? heldClock.intentId : "") });
expect("an expired hold is not approved", late.status === "refused" && late.reason === "expired");

const persisted = await new Promise<string>((resolve, reject) => {
  const child = spawn(process.execPath, ["--input-type=module", "-e", "import { readFileSync } from 'node:fs'; const t = readFileSync(process.argv[1], 'utf8'); const lines = t.split('\\n').filter(Boolean); for (const line of lines) JSON.parse(line); process.stdout.write(String(lines.length));", logAfterGithub], { stdio: ["ignore", "pipe", "inherit"] });
  let out = "";
  child.stdout.on("data", (chunk) => { out += chunk; });
  child.on("exit", (code) => code === 0 ? resolve(out) : reject(new Error(`persist child ${code}`)));
});
expect("a second process can read the same log", Number(persisted) > 0);

const contend = (key: string) => new Promise<number>((resolve) => {
  const child = spawn(process.execPath, ["outside/contend.ts", ada.workspace, ada.venture, signingKeyFile, inboundKeyFile, connectionId, key], { stdio: "inherit" });
  child.on("exit", (code) => resolve(code ?? 1));
});
const [firstCode, secondCode] = await Promise.all([contend("race-a"), contend("race-b")]);
const raced = readFileSync(logAfterGithub, "utf8").split("\n").filter(Boolean);
let torn = false;
for (const line of raced) { try { JSON.parse(line); } catch { torn = true; } }
expect("two processes leave a parseable log", firstCode === 0 && secondCode === 0 && !torn);

const leaked = "EXTERNAL-FILE-PREFIX-9f3c2a";
const quiet = (value: unknown) => !JSON.stringify(value).includes(leaked) && !JSON.stringify(value).includes("Unexpected token");
const bindOf = (key: string) => ({ kind: "bind" as const, idempotencyKey: key, requirement: financeReq, providerId: "local-fixture", fixture: "finance", accountRef: "local" as const });

{
  const box = layout("log-link/acct-ada");
  const outsideFile = join(root, "stolen-events.txt");
  writeFileSync(outsideFile, `original\n${leaked}\n`, { mode: 0o600 });
  const dir = join(box.workspace, "outside", "kettle");
  mkdirSync(dir, { recursive: true });
  symlinkSync(outsideFile, join(dir, "events.jsonl"));
  const bound = await hostFor(box.workspace).submit(person(box.workspace, box.venture, "Ada"), bindOf("bind-log-link"));
  expect("a log symlink is not written", bound.status === "refused" && quiet(bound) && readFileSync(outsideFile, "utf8") === `original\n${leaked}\n`);
}

{
  const box = layout("log-hard/acct-ada");
  const outsideFile = join(root, "stolen-events-hard.txt");
  writeFileSync(outsideFile, `original\n${leaked}\n`, { mode: 0o600 });
  const dir = join(box.workspace, "outside", "kettle");
  mkdirSync(dir, { recursive: true });
  linkSync(outsideFile, join(dir, "events.jsonl"));
  const bound = await hostFor(box.workspace).submit(person(box.workspace, box.venture, "Ada"), bindOf("bind-log-hard"));
  expect("a log hard link is not written", bound.status === "refused" && quiet(bound) && readFileSync(outsideFile, "utf8") === `original\n${leaked}\n`);
}

{
  const box = layout("dir-link/acct-ada");
  const outsideDir = join(root, "stolen-outside-dir");
  mkdirSync(outsideDir);
  symlinkSync(outsideDir, join(box.workspace, "outside"));
  const bound = await hostFor(box.workspace).submit(person(box.workspace, box.venture, "Ada"), bindOf("bind-dir-link"));
  expect("an outside directory symlink is not written", bound.status === "refused" && quiet(bound) && !existsSync(join(outsideDir, "kettle", "events.jsonl")));
}

{
  const box = layout("hard-outbox/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const bound = await host.submit(scope, bindOf("bind-hard-outbox"));
  const held = await host.submit(scope, { kind: "write", idempotencyKey: "write-hard-outbox", connectionId: String("connectionId" in bound ? bound.connectionId : ""), payload: { note: "no" } });
  const outsideFile = join(root, "stolen-hard-outbox.txt");
  writeFileSync(outsideFile, `original\n${leaked}\n`, { mode: 0o600 });
  rmSync(join(box.fixture, "outbox.jsonl"), { force: true });
  linkSync(outsideFile, join(box.fixture, "outbox.jsonl"));
  const approved = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-hard-outbox", approves: String("intentId" in held ? held.intentId : "") });
  expect("an outbox hard link is not written", approved.status === "refused" && quiet(approved) && readFileSync(outsideFile, "utf8") === `original\n${leaked}\n`);
}

{
  const box = layout("sources-link/acct-ada");
  const outsideFile = join(root, "stolen-sources.txt");
  writeFileSync(outsideFile, `${leaked} is not json {`, { mode: 0o600 });
  mkdirSync(join(box.venture, "knowledge"));
  symlinkSync(outsideFile, join(box.venture, "knowledge", "sources.json"));
  const view = await hostFor(box.workspace).inspect(person(box.workspace, box.venture, "Ada"), { requirement: financeReq, receiptId: null, inboundReceiptId: null });
  expect("a sources symlink does not return file text", view.status === "refused" && view.reason === "sources" && quiet(view) && readFileSync(outsideFile, "utf8").startsWith(leaked));
}

{
  const box = layout("sources-text/acct-ada");
  mkdirSync(join(box.venture, "knowledge"));
  writeFileSync(join(box.venture, "knowledge", "sources.json"), `${leaked} is not json {`, { mode: 0o600 });
  const view = await hostFor(box.workspace).inspect(person(box.workspace, box.venture, "Ada"), { requirement: financeReq, receiptId: null, inboundReceiptId: null });
  expect("a sources parse error does not return file text", view.status === "refused" && view.reason === "sources" && quiet(view));
}

{
  const box = layout("knowledge-link/acct-ada");
  const outsideDir = join(root, "stolen-knowledge");
  mkdirSync(outsideDir);
  writeFileSync(join(outsideDir, "sources.json"), `${leaked} is not json {`, { mode: 0o600 });
  symlinkSync(outsideDir, join(box.venture, "knowledge"));
  const view = await hostFor(box.workspace).inspect(person(box.workspace, box.venture, "Ada"), { requirement: financeReq, receiptId: null, inboundReceiptId: null });
  expect("a knowledge symlink does not return file text", view.status === "refused" && view.reason === "sources" && quiet(view));
}

{
  const box = layout("log-text/acct-ada");
  const dir = join(box.workspace, "outside", "kettle");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "events.jsonl"), `${leaked} is not json\n`, { mode: 0o600 });
  const view = await hostFor(box.workspace).inspect(person(box.workspace, box.venture, "Ada"), { requirement: financeReq, receiptId: null, inboundReceiptId: null });
  expect("a log parse error does not return file text", view.status === "refused" && quiet(view) && view.reason === "outside: log is not valid");
}

function rewriteHold(logPath: string, intentId: string, change: (row: Record<string, unknown>) => void): void {
  const lines = readFileSync(logPath, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
  const row = [...lines].reverse().find((line) => line.kind === "auth" && line.intentId === intentId && line.granted === false);
  if (!row) throw new Error("missing hold");
  change(row);
  writeFileSync(logPath, `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`, { mode: 0o600 });
}

function outboxText(fixture: string): string {
  const file = join(fixture, "outbox.jsonl");
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

{
  const box = layout("tamper-expiry/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const bound = await host.submit(scope, bindOf("bind-tamper-expiry"));
  const linked = String("connectionId" in bound ? bound.connectionId : "");
  const held = await host.submit(scope, { kind: "write", idempotencyKey: "write-tamper-expiry", connectionId: linked, payload: { note: "no" } });
  const intentId = String("intentId" in held ? held.intentId : "");
  const log = join(box.workspace, "outside", "kettle", "events.jsonl");
  rewriteHold(log, intentId, (row) => { row.expiresAt = "2099-01-01T00:00:00.000Z"; });
  const approved = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-tamper-expiry", approves: intentId });
  expect("an edited expiry does not approve", approved.status === "refused" && approved.reason === "signature" && outboxText(box.fixture) === "");
}

{
  const box = layout("tamper-expiry-gone/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const bound = await host.submit(scope, bindOf("bind-tamper-expiry-gone"));
  const linked = String("connectionId" in bound ? bound.connectionId : "");
  const held = await host.submit(scope, { kind: "write", idempotencyKey: "write-tamper-expiry-gone", connectionId: linked, payload: { note: "no" } });
  const intentId = String("intentId" in held ? held.intentId : "");
  rewriteHold(join(box.workspace, "outside", "kettle", "events.jsonl"), intentId, (row) => { delete row.expiresAt; });
  const approved = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-tamper-expiry-gone", approves: intentId });
  expect("a deleted expiry does not approve", approved.status === "refused" && approved.reason === "signature" && outboxText(box.fixture) === "");
}

{
  const box = layout("tamper-revoke/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const bound = await host.submit(scope, bindOf("bind-tamper-revoke"));
  const linked = String("connectionId" in bound ? bound.connectionId : "");
  const held = await host.submit(scope, { kind: "write", idempotencyKey: "write-tamper-revoke", connectionId: linked, payload: { note: "no" } });
  const intentId = String("intentId" in held ? held.intentId : "");
  const authorizationId = String("authorizationId" in held ? held.authorizationId : "");
  await host.submit(scope, { kind: "revoke", idempotencyKey: "revoke-tamper", authorizationId });
  const log = join(box.workspace, "outside", "kettle", "events.jsonl");
  rewriteHold(log, intentId, (row) => { row.revoked = false; });
  const cleared = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-tamper-revoke", approves: intentId });
  rewriteHold(log, intentId, (row) => { delete row.revoked; });
  const removed = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-tamper-revoke-2", approves: intentId });
  expect("clearing revoked does not approve", cleared.status === "refused" && cleared.reason === "signature" && removed.status === "refused" && removed.reason === "signature" && outboxText(box.fixture) === "");
}

{
  const box = layout("tamper-connection/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const first = await host.submit(scope, bindOf("bind-tamper-connection-a"));
  const second = await host.submit(scope, bindOf("bind-tamper-connection-b"));
  const firstId = String("connectionId" in first ? first.connectionId : "");
  const secondId = String("connectionId" in second ? second.connectionId : "");
  const held = await host.submit(scope, { kind: "write", idempotencyKey: "write-tamper-connection", connectionId: firstId, payload: { note: "no" } });
  const intentId = String("intentId" in held ? held.intentId : "");
  rewriteHold(join(box.workspace, "outside", "kettle", "events.jsonl"), intentId, (row) => { row.connectionId = secondId; });
  const approved = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-tamper-connection", approves: intentId });
  expect("a changed connection does not approve", approved.status === "refused" && approved.reason === "signature" && firstId !== secondId && outboxText(box.fixture) === "");
}

{
  const box = layout("fixture-redirect/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const bound = await host.submit(scope, bindOf("bind-fixture-redirect"));
  const linked = String("connectionId" in bound ? bound.connectionId : "");
  const held = await host.submit(scope, { kind: "write", idempotencyKey: "write-fixture-redirect", connectionId: linked, payload: { note: "no" } });
  const intentId = String("intentId" in held ? held.intentId : "");
  const log = join(box.workspace, "outside", "kettle", "events.jsonl");
  const lines = readFileSync(log, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
  const current = lines.find((line) => line.kind === "connection" && line.id === linked);
  mkdirSync(join(box.workspace, "fixtures", "other"), { recursive: true });
  writeFileSync(log, `${[...lines, JSON.stringify({ ...current, fixture: "other", lifecycle: "bound", signature: "forged" })].map((line) => typeof line === "string" ? line : JSON.stringify(line)).join("\n")}\n`, { mode: 0o600 });
  const approved = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-fixture-redirect", approves: intentId });
  expect("an appended fixture change does not redirect the write", approved.status === "refused" && outboxText(box.fixture) === "" && outboxText(join(box.workspace, "fixtures", "other")) === "");
}

{
  const box = layout("lifecycle-replay/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const bound = await host.submit(scope, bindOf("bind-lifecycle-replay"));
  const linked = String("connectionId" in bound ? bound.connectionId : "");
  const log = join(box.workspace, "outside", "kettle", "events.jsonl");
  const boundLine = readFileSync(log, "utf8").split("\n").find((line) => line.includes("\"lifecycle\":\"bound\""));
  const disconnected = await host.submit(scope, { kind: "disconnect", idempotencyKey: "disconnect-lifecycle", connectionId: linked });
  writeFileSync(log, `${readFileSync(log, "utf8")}${boundLine}\n`, { mode: 0o600 });
  const restored = await host.submit(scope, { kind: "read", idempotencyKey: "read-lifecycle-replay", connectionId: linked });
  expect("an old connection line does not restore a disconnected read", disconnected.status === "disconnected" && restored.status === "refused" && !("receiptId" in restored));
}

{
  const box = layout("inbound-replay/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const first = await host.submit(scope, bindOf("bind-inbound-a"));
  const second = await host.submit(scope, bindOf("bind-inbound-b"));
  const firstId = String("connectionId" in first ? first.connectionId : "");
  const secondId = String("connectionId" in second ? second.connectionId : "");
  const body = new TextEncoder().encode("{\"echoed\":\"once\"}");
  const signature = signBody(inboundKeyFile, { accountId: "acct-ada", ventureId: "kettle", connectionId: firstId, eventId: "evt-a", rawBody: body });
  const stored = await host.receive({ ventureId: ventureId("kettle"), connectionId: firstId, eventId: "evt-a", rawBody: body, signature });
  const otherConnection = await host.receive({ ventureId: ventureId("kettle"), connectionId: secondId, eventId: "evt-a", rawBody: body, signature });
  const otherEvent = await host.receive({ ventureId: ventureId("kettle"), connectionId: firstId, eventId: "evt-b", rawBody: body, signature });
  expect("an inbound signature does not replay onto another connection or event", stored.status === "stored" && otherConnection.status === "rejected" && otherConnection.reason === "authenticity" && otherEvent.status === "rejected" && otherEvent.reason === "authenticity");
}

{
  const box = layout("fixture-swap/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const bound = await host.submit(scope, bindOf("bind-fixture-swap"));
  const linked = String("connectionId" in bound ? bound.connectionId : "");
  const held = await host.submit(scope, { kind: "write", idempotencyKey: "write-fixture-swap", connectionId: linked, payload: { note: "no" } });
  const payroll = join(box.workspace, "fixtures", "payroll");
  mkdirSync(payroll);
  writeFileSync(join(payroll, "marker.txt"), "payroll\n", { mode: 0o600 });
  rmSync(box.fixture, { recursive: true });
  symlinkSync(payroll, box.fixture);
  const approved = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-fixture-swap", approves: String("intentId" in held ? held.intentId : "") });
  expect("a fixture directory symlink does not receive the outbox", approved.status === "refused" && !existsSync(join(payroll, "outbox.jsonl")) && !JSON.stringify(approved).includes("payroll"));
}

{
  const box = layout("owner-link/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  mkdirSync(join(box.venture, ".naive"));
  symlinkSync(signingKeyFile, join(box.venture, ".naive", "owner-account"));
  const before = existsSync(join(box.workspace, "outside", "kettle", "events.jsonl")) ? readFileSync(join(box.workspace, "outside", "kettle", "events.jsonl"), "utf8") : "";
  const refused = await host.submit(scope, bindOf("bind-owner-link"));
  const after = existsSync(join(box.workspace, "outside", "kettle", "events.jsonl")) ? readFileSync(join(box.workspace, "outside", "kettle", "events.jsonl"), "utf8") : before;
  expect("an owner stamp symlink is refused without the key", refused.status === "refused" && !JSON.stringify(refused).includes(keyMaterial) && !after.includes(keyMaterial));
}

{
  const box = layout("forged-receipt/acct-ada");
  const host = hostFor(box.workspace);
  const scope = person(box.workspace, box.venture, "Ada");
  const bound = await host.submit(scope, bindOf("bind-forged-receipt"));
  const linked = String("connectionId" in bound ? bound.connectionId : "");
  const held = await host.submit(scope, { kind: "write", idempotencyKey: "write-forged-receipt", connectionId: linked, payload: { note: "once" } });
  const intentId = String("intentId" in held ? held.intentId : "");
  const approved = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-forged-receipt", approves: intentId });
  const receiptId = "receiptId" in approved ? String(approved.receiptId) : "";
  const log = join(box.workspace, "outside", "kettle", "events.jsonl");
  const lines = readFileSync(log, "utf8").split("\n").filter(Boolean);
  const receipt = [...lines].reverse().map((line) => JSON.parse(line) as Record<string, unknown>).find((line) => line.kind === "receipt" && line.intentId === intentId && line.outcome === "completed");
  writeFileSync(log, `${lines.concat(JSON.stringify({ ...receipt, signature: "forged" })).join("\n")}\n`, { mode: 0o600 });
  const completed = (text: string) => text.split("\n").filter((line) => line.includes(`"intentId":"${intentId}"`) && line.includes("\"kind\":\"receipt\"") && line.includes("\"outcome\":\"completed\"")).length;
  const before = completed(readFileSync(log, "utf8"));
  const again = await host.submit(scope, { kind: "approve", idempotencyKey: "approve-forged-receipt-2", approves: intentId });
  expect("a forged trailing receipt does not approve twice", again.status === "done" && "receiptId" in again && again.receiptId === receiptId && completed(readFileSync(log, "utf8")) === before && outboxText(box.fixture).trim().split("\n").length === 1, again);
}

rmSync(root, { recursive: true, force: true });
if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("outside host: all checks passed");

function existsSyncSafe(file: string): boolean {
  try { return readFileSync(file).byteLength >= 0; } catch { return false; }
}
