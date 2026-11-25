import "server-only";
// The Venture Studio's door into Naive. Each call runs packages/platform/bridge/bridge.mjs in a child process with one
// operation, signed for the signed-in person, so Naive is never bundled into the app and every write goes through
// Naive's router, gate and provenance log (packages/platform/README.md, "The bridge").
//
// Each call is for one team (src/server/teams.ts): the person must belong to it, and the team's id is the tenant.
//
// Where ventures live:
// - On a machine with a disk (next dev, next start): one workspace per team under NAIVE_CONSOLE_WORKSPACE, by
//   default packages/platform/.data/workspace. Naive must be installed there: cd packages/platform && npm install.
// - On the hosted site: the hosted venture store, when MENTURA_PUBLIC_ORIGIN is https and NAIVE_BRIDGE_KEY is set
//   (packages/platform/hosted). Until then the Studio says it is not connected and writes nothing.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { signAssertion, type Identity } from "../../../packages/platform/bridge/assertion.ts";
import { hostedWorkspaceRequired } from "../../../packages/platform/hosted/required.ts";
import { siteUrl } from "./site";
import { consolePerson, landingTeam, teamAt, teamsFor } from "./teams";
import { VIEWER_REFUSED, type Team } from "./teams-core";

export type { Identity };

/** Runs the bridge with the signed request on stdin, not the command line: an upload is larger than one argument may be,
 *  and the command line would show the founder's words to anyone listing processes. */
function run(bridge: string, input: string, { timeout, env }: { timeout: number; env: NodeJS.ProcessEnv }): Promise<string> {
  return new Promise((done, fail) => {
    const child = spawn(process.execPath, [bridge], { env, stdio: ["pipe", "pipe", "ignore"] });
    const out: Buffer[] = [];
    let size = 0;
    const timer = setTimeout(() => { child.kill(); fail(new Error("timeout")); }, timeout);
    child.stdout.on("data", (b: Buffer) => { size += b.length; if (size > 48 * 1024 * 1024) child.kill(); else out.push(b); });
    child.on("error", (e) => { clearTimeout(timer); fail(e); });
    child.on("close", (code) => { clearTimeout(timer); if (code === 0) done(Buffer.concat(out).toString("utf8")); else fail(new Error(`exit ${code}`)); });
    child.stdin.end(input);
  });
}
// Found from the working directory (web/ under next dev and next start, or the repo root), not import.meta.url,
// because the bundler rewrites new URL(..., import.meta.url) into an asset reference.
const bridgePath = () => {
  const file = [join(/*turbopackIgnore: true*/ process.cwd(), "../packages/platform/bridge/bridge.mjs"), join(/*turbopackIgnore: true*/ process.cwd(), "packages/platform/bridge/bridge.mjs")].find((f) => existsSync(f));
  if (!file) throw new Error("The Studio cannot find Naive's bridge in this checkout.");
  return file;
};

export type VentureSummary = { id: string; name: string; phase: string; path: string };
export type DocketDecision = { id: string; question: string; function: string; value: number; why: string[] };
export type Docket = {
  venture: string; phase: string; total: number;
  next: { function: string; decision: string; question: string; value: number; dominant: boolean; why: string[] } | null;
  functions: { id: string; function: string; attention: number; decisions: DocketDecision[] }[];
};
/** `departments`: the functions the venture has turned on, by id from Naive's departments.json. */
export type VentureDetail = { id: string; name: string; phase: string; founder: string | null; departments: string[];
  /** venture.json `industry` (NAICS), `regulation.exposure` and `form.funding`, for the integrations recommender. Absent from an older bridge. */
  industry?: { code: string; label: string | null } | null; regulation?: string | null; funding?: string | null };

/** One open decision waiting on a person (bridge op `needs`, round 5), in the order of Naive's decision index. `function`
 *  is the Naive package that owns the record it decides (a function id, or "venture" for the business itself). */
export type NeedsDecision = {
  id: string; question: string; function: string | null; render: "now" | "overdue" | "stale"; rank: number;
  /** Activities this decision opens (decision-record `unlocks`, EE-058). */
  unlocks: string[];
  /** How many decisions are held until this one is settled. */
  opens: number;
  due: string | null; why: string[];
};
/** What needs a person in one business: the decisions they can settle now, how many more wait behind others, and the
 *  last decision a person made. */
export type Needs = { venture: string; phase: string; decisions: NeedsDecision[]; held: number; last_decided: { id: string; question: string; at: string } | null };
/** One activity a process group needs from a person (Naive's activity-briefing.ts `Needed`). */
export type BriefedActivity = { id: string; from: "pcf" | "catalog"; statement: string; source: "assigned" | "default"; kind?: string };
/** Levels 1 and 2 for one function (Naive's activity-briefing.ts `FunctionBriefing`, EE-180). */
export type FunctionBriefing = {
  function: string; category: { id: string; name: string } | null; needs_person: number;
  process_groups: { id: string; name: string; performs: BriefedActivity[]; approves: BriefedActivity[]; agent: number }[];
};
/** An activity with a rule in one business: assigned in operations/activity-assignments.json, or the default for its
 *  kind (Naive's agents/assignments.ts, EE-173 and EE-179). */
export type RuledActivity = {
  id: string; from: "pcf" | "catalog"; process_group: string; statement: string;
  performer: "person" | "agent" | null; approval: "person" | "none" | null; source: "assigned" | "default"; kind: string | null;
};
/** The bridge op `briefing`: every listed function, or one function with its activities. */
export type Briefing = { briefing: FunctionBriefing[]; listed: string[]; activities?: RuledActivity[] };

/** Why the Studio cannot reach Naive here, or null when it can. */
export function studioUnavailable(env: NodeJS.ProcessEnv = process.env): string | null {
  if (hostedWorkspaceRequired(env)) return env.NAIVE_BRIDGE_KEY ? null : "The Studio is not connected to a venture store on this site yet.";
  // A serverless deployment has no disk that lasts, so a venture written there would vanish.
  if (env.VERCEL) return "The Studio is not connected to a venture store on this site yet.";
  return null;
}

const WRITES = new Set(["transfer", "removeTeam", "adopt", "create", "decide", "record", "accept", "confirm", "advance", "prompt", "claim", "fileWrite", "fileFolder", "fileMove", "fileDelete", "source", "syncPush"]);
const READ_MS = 15_000;
const WRITE_MS = 120_000;
// A key for this process: the bridge only checks that the request was signed by its caller just now. The hosted store
// checks the assertion again in Postgres, so it needs the same key everywhere: NAIVE_BRIDGE_KEY.
const processKey = randomBytes(32).toString("hex");

/** The key the bridge checks, which also signs the bridge's reads back to this server (src/app/api/naive/mcp). */
export const bridgeKey = (): string => process.env.NAIVE_BRIDGE_KEY ?? processKey;
// Writes run one at a time: each appends to a venture's hash-chained provenance log.
let writes: Promise<unknown> = Promise.resolve();

/** The team a call is for, checked against the person's memberships here, before anything is signed: the team at
 *  this URL slug, or the person's personal team when no slug is given (the command line's sign-in, for one). The
 *  business store's tenant is the team's id; a personal team's id is its person's, so businesses made before teams
 *  are where they were. */
export async function teamOfCall(team?: string): Promise<{ person: { id: string; name: string; email: string }; team: Team }> {
  const person = await consolePerson();
  if (!person) throw new Error("Sign in to use the Studio.");
  if (!team) return { person, team: (await teamsFor(person)).find((t) => t.personal) ?? await landingTeam(person) };
  const at = await teamAt(person, team);
  if (!at.ok) throw new Error(at.error);
  return { person, team: at.team };
}

async function identity(op: string, team?: string): Promise<Identity> {
  const { person, team: t } = await teamOfCall(team);
  // A Viewer sees the team's businesses and changes nothing; Naive's own gate decides the rest inside a business.
  if (WRITES.has(op) && t.role === "viewer") throw new Error(VIEWER_REFUSED);
  return { userId: person.id, name: person.name, email: person.email, organizationId: t.id, organizationRole: t.role };
}

async function call<T>(op: string, args: Record<string, unknown>, who: Identity): Promise<T> {
  const why = studioUnavailable();
  if (why) throw new Error(why);
  const timeout = WRITES.has(op) ? WRITE_MS : READ_MS;
  const bridge = bridgePath();
  const key = bridgeKey();
  const assertion = signAssertion(who, { op, ...args }, key);
  if (hostedWorkspaceRequired()) {
    const { runHostedConsole } = await import("../../../packages/platform/bridge/hosted-call.ts");
    // The child script sits beside the bridge; its path is found here because the bundler rewrites import.meta.url.
    const childPath = join(bridge, "../../hosted/console-child.ts");
    return runHostedConsole<T>({ userId: who.userId, assertion, bridgePath: bridge, key, timeoutMs: timeout, childPath,
      env: { ...process.env, NAIVE_MCP_URL: `${siteUrl()}/api/naive/mcp` } });
  }
  const { BETTER_AUTH_SECRET: _secret, ...env } = process.env;
  // The child's own error would name server paths, so the founder sees one plain sentence instead.
  const stdout = await run(bridge, assertion, { timeout, env: { ...env, NAIVE_BRIDGE_KEY: key, NAIVE_MCP_URL: `${siteUrl()}/api/naive/mcp` } })
    .catch(() => { throw new Error(`Naive did not finish in ${timeout / 1000} seconds. Try again.`); });
  const r = JSON.parse(stdout) as { ok: boolean; result?: T; error?: string };
  if (!r.ok) throw new Error(r.error ?? "Naive refused this.");
  return r.result as T;
}

/** Writes wait their turn; a read runs now. */
function queued<T>(op: string, run: () => Promise<T>): Promise<T> {
  if (!WRITES.has(op)) return run();
  const next = writes.then(run);
  writes = next.catch(() => undefined);
  return next;
}

/** One operation through Naive, as the signed-in person, on one team's businesses: `team` is the team's URL slug,
 *  and the person's personal team when it is left out. */
export function naive<T>(op: string, args: Record<string, unknown> = {}, team?: string): Promise<T> {
  return queued(op, async () => call<T>(op, args, await identity(op, team)));
}

/** One operation through Naive as a person this server has already named another way: a sync token's person,
 *  who carries no browser session (src/server/sync-store.ts). The caller owns the check that made that name. */
export function naiveAs<T>(who: Identity, op: string, args: Record<string, unknown> = {}): Promise<T> {
  return queued(op, () => call<T>(op, args, who));
}

// Moving and removing whole businesses (D5 Transfer business, D6 Delete team, A4 Delete account): one change across a
// whole business or team, run by packages/platform/hosted/store-child.ts, in the hosted store or on disk. The callers in
// src/server/moving.ts check the person is an Owner of each team first; the child checks the signed assertions again,
// and the store's row policy checks each one a third time.

const ownerIdentity = (person: { id: string; name: string; email: string }, team: Team): Identity =>
  ({ userId: person.id, name: person.name, email: person.email, organizationId: team.id, organizationRole: team.role });

async function storeChange<T>(op: string, request: Record<string, unknown>): Promise<T> {
  return queued(op, async () => {
    const bridge = bridgePath();
    const { runStoreChild } = await import("../../../packages/platform/bridge/hosted-call.ts");
    const { BETTER_AUTH_SECRET: _secret, ...env } = process.env;
    return runStoreChild<T>({ request, timeoutMs: WRITE_MS, childPath: join(bridge, "../../hosted/store-child.ts"), env: hostedWorkspaceRequired() ? process.env : env });
  });
}

/** D5: every record and file of a business moves from one team to another, in one step. Both teams must be the
 *  person's, as an Owner (checked by the caller with the person's memberships). */
export async function moveInStore(person: { id: string; name: string; email: string }, from: Team, to: Team, venture: string): Promise<{ venture: string; folder: string; moved: number }> {
  const why = studioUnavailable();
  if (why) throw new Error(why);
  const key = bridgeKey();
  const request = { op: "transfer", venture, from: from.id, to: to.id, toName: to.name };
  return storeChange("transfer", {
    op: "move", key,
    from: signAssertion(ownerIdentity(person, from), request, key),
    to: signAssertion(ownerIdentity(person, to), request, key),
  });
}

/** D6 and A4: every business of a team the person owns is removed from the store. Where this site has no business
 *  store, there is nothing to remove. */
export async function removeFromStore(person: { id: string; name: string; email: string }, team: Team): Promise<{ removed: number }> {
  if (studioUnavailable()) return { removed: 0 };
  const key = bridgeKey();
  return storeChange("removeTeam", { op: "remove", key, assertion: signAssertion(ownerIdentity(person, team), { op: "removeTeam", team: team.id }, key) });
}
