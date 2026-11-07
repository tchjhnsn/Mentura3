// Runs one Naive command for a tenant on a hosted working copy: checks the tenant out of its Postgres store into a
// fresh temporary folder, runs the command there as its own process with NAIVE_RUNTIME=hosted, commits what changed
// with base versions, and runs again on a conflict (working-copy.ts). The folder is removed afterwards.
//
//   node platform/hosted/run.ts --tenant <id> [--retries <n>] [--url <variable>] -- <command> [args...]
//
// In the command, {dir} is replaced by the working copy's path, for example:
//   node platform/hosted/run.ts --tenant everything-ecosystem -- node node_modules/naive-framework/packages/naive/src/checks/check-ventures.mjs {dir}
//
//   --url    the environment variable holding the connection string (default MENTURA_DATABASE_URL)
//   MENTURA_DB_DRIVER=neon-ws  connects over Neon's WebSocket driver on 443 (through HTTPS_PROXY when set)
//
// Exits with the command's status when the commit succeeds; 1 with the reason when the commit is refused.

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { connect, poolFrom } from "../connectors/postgres.ts";
import { withWorkingCopy, type Store } from "./working-copy.ts";

/** Runs argv (with {dir} filled in) in the working copy; the child inherits NAIVE_RUNTIME=hosted from withWorkingCopy. */
export const runCommand = (argv: string[]) => (dir: string) => {
  const [cmd, ...args] = argv.map((a) => a.replaceAll("{dir}", dir));
  const r = spawnSync(cmd, args, { cwd: process.cwd(), stdio: "inherit", env: process.env });
  return r.status ?? 1;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = process.argv.slice(2);
  const dash = all.indexOf("--");
  const opts = dash < 0 ? all : all.slice(0, dash), command = dash < 0 ? [] : all.slice(dash + 1);
  const opt = (n: string) => { const i = opts.indexOf(`--${n}`); return i < 0 ? null : opts[i + 1] ?? null; };
  const tenant = opt("tenant");
  if (!tenant || !command.length) { console.error("usage: run.ts --tenant <id> [--retries <n>] [--url <variable>] -- <command> [args...]"); process.exit(2); }
  const client = poolFrom(opt("url") ?? "MENTURA_DATABASE_URL");
  const store = connect({ tenant, client }) as unknown as Store;
  const dir = mkdtempSync(join(tmpdir(), `mentura-${tenant}-`));
  let code = 1;
  try {
    const out = await withWorkingCopy(store, join(dir, "copy"), runCommand(command), { retries: Number(opt("retries") ?? 2) });
    console.error(`${tenant}: wrote ${out.commit.wrote.length}, appended ${out.commit.appended.length}, skipped ${out.commit.skipped.length} derived, in ${out.attempts} attempt(s)`);
    code = out.result;
  } catch (e) {
    console.error(`${tenant}: nothing committed: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    await client.end();
  }
  process.exit(code);
}
