// Second process for the hosted console entrypoint. It does not open the events file.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { consoleAccountWorkspace } from "./account-path.ts";
import { accountId, loadRequirement, ventureId } from "./host.ts";
import { openAccountOutsideHost } from "./hosted-console.ts";

const [root, sessionUserId, signingKeyFile, inboundKeyFile, receiptId, assertion] = process.argv.slice(2);
const opened = await openAccountOutsideHost({
  root,
  sessionUserId,
  signingKeyFile,
  inboundKeyFile,
  assertion,
  policy: { personMayAct: () => true, personMayApprove: () => true },
  functionIds: ["finance"],
  shapeCheck: { accepted: () => true },
});
const workspace = consoleAccountWorkspace(root, sessionUserId);
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
const view = await opened.host.inspect({
  ventureId: ventureId("kettle"),
  ventureDir: join(workspace, "kettle"),
  functionId: "finance",
  actor: { kind: "person", sessionUserId: accountId(sessionUserId), venturePersonName: "Ada" },
}, { requirement, receiptId, inboundReceiptId: null });
const fileLog = existsSync(join(workspace, "outside", "kettle", "events.jsonl"));
await opened.close();
const health = "health" in view ? view.health : null;
process.stdout.write(JSON.stringify({ status: view.status, receiptId: health?.receiptId ?? null, durable: opened.durable, fileLog }));
process.exit(view.status === "ready" && health?.receiptId === receiptId && opened.durable && !fileLog ? 0 : 1);
