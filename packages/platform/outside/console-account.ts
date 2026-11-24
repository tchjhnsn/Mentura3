import { join } from "node:path";
import { consoleAccountWorkspace } from "./account-path.ts";
import { accountId, openToolHost, type HostOptions, type ToolHost } from "./host.ts";

/**
 * Opens the outside host on the console's account directory.
 *
 * `sessionUserId` is the Better Auth session user id (`session.user.id`). Signup, merged on main
 * as `6f55313`, passes that same string to `ensureAccount` as `providerSubject`. It is not the
 * identity store's `personId` or `accountId`, and it is not a person id from the browser. This
 * file does not read the request session header. That header stays on the console origin and is
 * not a host credential. The log opened here is the local directory. A hosted caller passes
 * `log` from `outsideLog` instead of using this directory.
 *
 * This file does not import `console/lib/auth.ts`, `console/lib/identity.ts`, or the mail and
 * hosting files. `console/app/actions.ts` declares `submitSignedOutside`, and
 * `console/lib/outside-host.ts` passes `requireIdentity().userId`. Do not call this from a
 * function agent.
 *
 * `root` is `NAIVE_CONSOLE_WORKSPACE` or `console/.data/workspace`.
 */
export function openConsoleOutsideHost(input: {
  readonly root: string;
  /** Better Auth `session.user.id`. Never an identity-store person id. */
  readonly sessionUserId: string;
  readonly signingKeyFile: HostOptions["signingKeyFile"];
  readonly inboundKeyFile: HostOptions["inboundKeyFile"];
  readonly policy: HostOptions["policy"];
  readonly functionIds: HostOptions["functionIds"];
  readonly shapeCheck: HostOptions["shapeCheck"];
}): ToolHost {
  return openToolHost({
    accountId: accountId(input.sessionUserId),
    accountWorkspace: consoleAccountWorkspace(input.root, input.sessionUserId),
    signingKeyFile: input.signingKeyFile,
    inboundKeyFile: input.inboundKeyFile,
    policy: input.policy,
    functionIds: input.functionIds,
    shapeCheck: input.shapeCheck,
  });
}

export function consoleOutsideLog(root: string, sessionUserId: string, ventureId: string): string {
  return join(consoleAccountWorkspace(root, sessionUserId), "outside", ventureId, "events.jsonl");
}
