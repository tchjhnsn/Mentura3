/**
 * The person checks the host calls. Production code builds this from the bridge:
 * `refusedPerson`, the venture's stamped account owner, then `signers`.
 * `refuseNonSigner` in `console/lib/bridge.mjs` calls `refuseNonOwner` before `signers`.
 * Agents are refused by the host before this port runs.
 */

export interface VenturePolicy {
  /** False when `refusedPerson` refuses the name, or a stamp names a different session user id. */
  personMayAct(ventureDir: string, personName: string, sessionUserId: string): boolean;
  /**
   * False when `personMayAct` is false, or when `signers` is non-empty and does not contain the name.
   * That is `refuseNonSigner`, including the owner check inside `refuseNonOwner`.
   */
  personMayApprove(ventureDir: string, personName: string, sessionUserId: string): boolean;
}
