import { accountId, openToolHost, ventureId } from "./host.ts";

const [workspace, venture, signingKeyFile, inboundKeyFile, connectionId, idempotencyKey] = process.argv.slice(2);
const host = openToolHost({
  accountId: accountId("acct-ada"),
  accountWorkspace: workspace,
  signingKeyFile,
  inboundKeyFile,
  policy: {
    personMayAct: () => true,
    personMayApprove: () => true,
  },
  functionIds: ["finance"],
  shapeCheck: { accepted: () => true },
});
const result = await host.submit({
  ventureId: ventureId("kettle"),
  ventureDir: venture,
  functionId: "finance",
  actor: { kind: "person", sessionUserId: accountId("acct-ada"), venturePersonName: "Ada" },
}, { kind: "read", idempotencyKey, connectionId });
const ok = result.status === "done" || (result.status === "refused" && result.reason === "busy");
process.exit(ok ? 0 : 1);
