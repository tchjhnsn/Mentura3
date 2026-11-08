// Second process for the hosted log. It reads Postgres and does not read events.jsonl.
import { accountId, loadRequirement, openToolHost, ventureId } from "./host.ts";
import { outsideLog, outsidePool } from "./postgres-log.ts";

const [url, workspace, venture, signingKeyFile, inboundKeyFile, receiptId] = process.argv.slice(2);
const pool = outsidePool(url);
const host = openToolHost({
  accountId: accountId("acct-ada"),
  accountWorkspace: workspace,
  signingKeyFile,
  inboundKeyFile,
  log: outsideLog(pool, "acct-ada"),
  policy: { personMayAct: () => true, personMayApprove: () => true },
  functionIds: ["finance"],
  shapeCheck: { accepted: () => true },
});
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
const view = await host.inspect({
  ventureId: ventureId("kettle"),
  ventureDir: venture,
  functionId: "finance",
  actor: { kind: "person", sessionUserId: accountId("acct-ada"), venturePersonName: "Ada" },
}, { requirement, receiptId, inboundReceiptId: null });
await pool.end();
const health = "health" in view ? view.health : null;
process.stdout.write(JSON.stringify({ status: view.status, condition: "condition" in view ? view.condition : null, receiptId: health?.receiptId ?? null }));
process.exit(view.status === "ready" && health?.receiptId === receiptId ? 0 : 1);
