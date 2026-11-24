import { refusedPerson, signers } from "naive-framework/src/engine/decisions.mjs";
import { stampedAccountOwner } from "../outside/owner.ts";
import type { VenturePolicy } from "../outside/policy.ts";

/**
 * The host's person port, built from the checks `console/lib/bridge.mjs` already calls.
 * `refusedPerson`, then the stamped account owner, then `signers`.
 * Agents are not a caller of this port.
 * This file does not add a second store connector and it does not call the term engine.
 */
function ownerAllows(dir: string, sessionUserId: string): boolean {
  const owner = stampedAccountOwner(dir);
  return owner === null || owner === sessionUserId;
}

export function naiveVenturePolicy(): VenturePolicy {
  return {
    personMayAct(dir, name, sessionUserId) {
      return !refusedPerson(dir, name) && ownerAllows(dir, sessionUserId);
    },
    personMayApprove(dir, name, sessionUserId) {
      if (refusedPerson(dir, name) || !ownerAllows(dir, sessionUserId)) return false;
      const founders = signers(dir) as Set<string>;
      return founders.size === 0 || founders.has(name);
    },
  };
}
