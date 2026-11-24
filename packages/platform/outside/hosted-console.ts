// The console's outside host. A hosted origin (https MENTURA_PUBLIC_ORIGIN) uses outside_log.
// It does not fall back to the events file. Local npm start keeps that file.
// The account id is the Better Auth session user id, not an identity-store person id.
// Signing keys are file paths. Their bytes are not copied into the environment.

import { readFileSync } from "node:fs";
import { consoleAccountWorkspace } from "./account-path.ts";
import { accountId, openToolHost, type HostOptions, type ToolHost } from "./host.ts";
import { naiveRequirementCheck } from "./naive-requirement.ts";
import { outsideLog, outsidePool, proveOutsideSeparate, type OutsidePool } from "./postgres-log.ts";
import type { VenturePolicy } from "./policy.ts";

const pools = new Map<string, OutsidePool>();

export function hostedOutsideRequired(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    return new URL(env.MENTURA_PUBLIC_ORIGIN ?? "").protocol === "https:";
  } catch {
    return false;
  }
}

export function catalogFunctionIds(): readonly string[] {
  const parsed = JSON.parse(readFileSync(new URL("../docs/decisions/decisions.json", import.meta.url), "utf8")) as { decisions: { id: string; decision: string }[] };
  const text = parsed.decisions.find((row) => row.id === "EE-090")?.decision ?? "";
  const listed = text.match(/named for the 13 functions of the catalog \(([^)]+)\)/);
  const ids = (listed?.[1] ?? "").split(", ").map((id) => id.trim()).filter(Boolean);
  if (ids.length !== 13) throw new Error("outside: function id is not one of the thirteen");
  return ids;
}

/** Naive's validator for a requirement, plus the thirteen function ids. */
export function hypothesizedShape(functionIds: readonly string[]): HostOptions["shapeCheck"] {
  return naiveRequirementCheck(functionIds);
}

function keyPath(value: string): string {
  if (!value || value.length > 4096 || /[\r\n]/.test(value)) throw new Error("outside: secret file is missing");
  return value;
}

export async function closeOutsidePools(): Promise<void> {
  const open = [...pools.values()];
  pools.clear();
  await Promise.all(open.map((pool) => pool.end()));
}

export async function openAccountOutsideHost(input: {
  readonly root: string;
  /** Better Auth session.user.id. */
  readonly sessionUserId: string;
  readonly signingKeyFile: string;
  readonly inboundKeyFile: string;
  readonly policy: VenturePolicy;
  readonly functionIds?: readonly string[];
  readonly shapeCheck?: HostOptions["shapeCheck"];
  readonly env?: NodeJS.ProcessEnv;
  /** Signed session assertion. Required when the log is outside_log. The database reads the account from it. */
  readonly assertion?: string;
}): Promise<{ host: ToolHost; close: () => Promise<void>; durable: boolean }> {
  const env = input.env ?? process.env;
  const functionIds = input.functionIds ?? catalogFunctionIds();
  const shapeCheck = input.shapeCheck ?? hypothesizedShape(functionIds);
  const common = {
    accountId: accountId(input.sessionUserId),
    accountWorkspace: consoleAccountWorkspace(input.root, input.sessionUserId),
    signingKeyFile: keyPath(input.signingKeyFile),
    inboundKeyFile: keyPath(input.inboundKeyFile),
    policy: input.policy,
    functionIds,
    shapeCheck,
  };
  if (!hostedOutsideRequired(env)) {
    return { host: openToolHost(common), close: async () => {}, durable: false };
  }
  const url = env.MENTURA_OUTSIDE_DATABASE_URL ?? "";
  if (!url) throw new Error("outside: database URL is refused");
  if (!input.assertion) throw new Error("outside: assertion refused");
  await proveOutsideSeparate(url, env);
  let pool = pools.get(url);
  if (!pool) {
    pool = outsidePool(url);
    pools.set(url, pool);
  }
  const held = pool;
  return {
    host: openToolHost({ ...common, log: outsideLog(held, input.sessionUserId, input.assertion) }),
    close: async () => {
      pools.delete(url);
      await held.end();
    },
    durable: true,
  };
}
