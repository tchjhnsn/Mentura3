// The checks and the door for changes that span a whole business or a whole team (hosted/move-business.ts): moving a
// business to another team (D5) and removing a team's businesses (D6, A4). The web server signs one assertion per team
// (web/src/server/moving.ts) and hosted/store-child.ts hands them here; nothing is read or written until they pass.
//
//   move    two assertions from one person, the same request { op: "transfer", venture, from, to } signed for each team,
//           an Owner of both. The first names the source team, the second the destination.
//   remove  one assertion { op: "removeTeam", team } signed for that team, by one of its Owners.
//
// A hosted origin (hosted/required.ts) changes naive_records through the runtime login, where the row policy checks each
// assertion again; a local one changes the workspace folders under NAIVE_CONSOLE_WORKSPACE.

import { openAssertion, type Identity } from "../bridge/assertion.ts";
import { sharedRoot } from "../bridge/claims.ts";
import { moveBusinessInStore, moveBusinessOnDisk, removeTenantInStore, removeTenantOnDisk, type MoveReport } from "./move-business.ts";
import { hostedWorkspaceRequired } from "./required.ts";
import { tenantPool } from "./account-workspace.ts";

export const OWNER_OF_BOTH = "Only someone who is an Owner of both teams can move a business between them.";
export const OWNER_TO_DELETE = "Only an Owner of this team can delete it.";
const REFUSED = "The console refused this request: it carries no signed identity.";

export type StoreRequest =
  | { op: "move"; key: string; from: string; to: string }
  | { op: "remove"; key: string; assertion: string };

type Transfer = { op: "transfer"; venture: string; from: string; to: string; toName?: string };
type Removal = { op: "removeTeam"; team: string };

const sameRequest = (a: Record<string, unknown>, b: Record<string, unknown>) => JSON.stringify(a) === JSON.stringify(b);

/** The two halves of a move, once both assertions are checked: one person, an Owner of both teams, one request. */
export function checkMove(from: string, to: string, key: string): { by: Identity; request: Transfer } {
  let a, b;
  try { a = openAssertion(from, key); b = openAssertion(to, key); } catch { throw new Error(REFUSED); }
  const r = a.request as Partial<Transfer> & { op: string };
  if (r.op !== "transfer" || !sameRequest(a.request, b.request)) throw new Error(REFUSED);
  if (typeof r.venture !== "string" || !r.venture || r.venture.includes("/") || typeof r.from !== "string" || typeof r.to !== "string") throw new Error(REFUSED);
  if (a.identity.userId !== b.identity.userId) throw new Error(REFUSED);
  if (a.identity.organizationId !== r.from || b.identity.organizationId !== r.to) throw new Error(REFUSED);
  if (r.from === r.to) throw new Error("The business is already in that team.");
  if (a.identity.organizationRole !== "owner" || b.identity.organizationRole !== "owner") throw new Error(OWNER_OF_BOTH);
  return { by: a.identity, request: { op: "transfer", venture: r.venture, from: r.from, to: r.to, ...(typeof r.toName === "string" ? { toName: r.toName } : {}) } };
}

/** A removal, once its assertion is checked: an Owner of the team it names. */
export function checkRemove(assertion: string, key: string): { by: Identity; request: Removal } {
  let c;
  try { c = openAssertion(assertion, key); } catch { throw new Error(REFUSED); }
  const r = c.request as Partial<Removal> & { op: string };
  if (r.op !== "removeTeam" || typeof r.team !== "string" || r.team !== c.identity.organizationId) throw new Error(REFUSED);
  if (c.identity.organizationRole !== "owner") throw new Error(OWNER_TO_DELETE);
  return { by: c.identity, request: { op: "removeTeam", team: r.team } };
}

/** Runs one checked change, in the hosted store or on disk. */
export async function runStoreChange(input: StoreRequest, env: NodeJS.ProcessEnv = process.env): Promise<MoveReport | { removed: number }> {
  if (input.op === "move") {
    const { by, request } = checkMove(input.from, input.to, input.key);
    if (hostedWorkspaceRequired(env)) {
      return moveBusinessInStore(await tenantPool(env), {
        from: { tenant: request.from, assertion: input.from }, to: { tenant: request.to, assertion: input.to },
        venture: request.venture, by: by.userId, toName: request.toName,
      });
    }
    return moveBusinessOnDisk(sharedRoot(), { from: request.from, to: request.to, venture: request.venture, by: by.userId, toName: request.toName });
  }
  if (input.op === "remove") {
    const { request } = checkRemove(input.assertion, input.key);
    if (hostedWorkspaceRequired(env)) return removeTenantInStore(await tenantPool(env), { tenant: request.team, assertion: input.assertion });
    return removeTenantOnDisk(sharedRoot(), request.team);
  }
  throw new Error(REFUSED);
}
