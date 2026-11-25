import "server-only";
// The Venture Studio's door into Naive. Each call runs packages/platform/bridge/bridge.mjs in a child process with one
// operation, signed for the signed-in person, so Naive is never bundled into the app and every write goes through
// Naive's router, gate and provenance log (packages/platform/README.md, "The bridge").
//
// Where ventures live:
// - On a machine with a disk (next dev, next start): one workspace per account under NAIVE_CONSOLE_WORKSPACE, by
//   default packages/platform/.data/workspace. Naive must be installed there: cd packages/platform && npm install.
// - On the hosted site: the hosted venture store, when MENTURA_PUBLIC_ORIGIN is https and NAIVE_BRIDGE_KEY is set
//   (packages/platform/hosted). Until then the Studio says it is not connected and writes nothing.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { headers } from "next/headers";
import { signAssertion, type Identity } from "../../../packages/platform/bridge/assertion.ts";
import { hostedWorkspaceRequired } from "../../../packages/platform/hosted/required.ts";
import { auth } from "./auth";
import { OWNER_ID } from "./session";
import { openMode } from "./open-mode";
import { siteUrl } from "./site";

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

/** Why the Studio cannot reach Naive here, or null when it can. */
export function studioUnavailable(env: NodeJS.ProcessEnv = process.env): string | null {
  if (hostedWorkspaceRequired(env)) return env.NAIVE_BRIDGE_KEY ? null : "The Studio is not connected to a venture store on this site yet.";
  // A serverless deployment has no disk that lasts, so a venture written there would vanish.
  if (env.VERCEL) return "The Studio is not connected to a venture store on this site yet.";
  return null;
}

const WRITES = new Set(["adopt", "create", "decide", "record", "accept", "confirm", "advance", "prompt", "claim", "fileWrite", "fileFolder", "fileMove", "fileDelete", "source"]);
const READ_MS = 15_000;
const WRITE_MS = 120_000;
// A key for this process: the bridge only checks that the request was signed by its caller just now. The hosted store
// checks the assertion again in Postgres, so it needs the same key everywhere: NAIVE_BRIDGE_KEY.
const processKey = randomBytes(32).toString("hex");

/** The key the bridge checks, which also signs the bridge's reads back to this server (src/app/api/naive/mcp). */
export const bridgeKey = (): string => process.env.NAIVE_BRIDGE_KEY ?? processKey;
// Writes run one at a time: each appends to a venture's hash-chained provenance log.
let writes: Promise<unknown> = Promise.resolve();

async function identity(): Promise<Identity> {
  if (openMode()) return { userId: OWNER_ID, name: "Owner", email: "owner@reflect.local", organizationId: OWNER_ID, organizationRole: "owner" };
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sign in to use the Studio.");
  const { id, name, email } = session.user;
  return { userId: id, name: name || "Founder", email, organizationId: id, organizationRole: "owner" };
}

async function call<T>(op: string, args: Record<string, unknown>): Promise<T> {
  const why = studioUnavailable();
  if (why) throw new Error(why);
  const timeout = WRITES.has(op) ? WRITE_MS : READ_MS;
  const bridge = bridgePath();
  const who = await identity();
  const key = bridgeKey();
  const assertion = signAssertion(who, { op, ...args }, key);
  if (hostedWorkspaceRequired()) {
    const { runHostedConsole } = await import("../../../packages/platform/bridge/hosted-call.ts");
    return runHostedConsole<T>({ userId: who.userId, assertion, bridgePath: bridge, key, timeoutMs: timeout });
  }
  const { BETTER_AUTH_SECRET: _secret, ...env } = process.env;
  // The child's own error would name server paths, so the founder sees one plain sentence instead.
  const stdout = await run(bridge, assertion, { timeout, env: { ...env, NAIVE_BRIDGE_KEY: key, NAIVE_MCP_URL: `${siteUrl()}/api/naive/mcp` } })
    .catch(() => { throw new Error(`Naive did not finish in ${timeout / 1000} seconds. Try again.`); });
  const r = JSON.parse(stdout) as { ok: boolean; result?: T; error?: string };
  if (!r.ok) throw new Error(r.error ?? "Naive refused this.");
  return r.result as T;
}

/** One operation through Naive, as the signed-in person. */
export function naive<T>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!WRITES.has(op)) return call<T>(op, args);
  const next = writes.then(() => call<T>(op, args));
  writes = next.catch(() => undefined);
  return next;
}
