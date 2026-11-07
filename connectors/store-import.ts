// Loads a folder of records into a tenant's Postgres store (EE-118 step 9): how this company's own records,
// once instance/ in this repository, moved to Neon. store-export.ts is the way back. Every file goes through the Postgres connector, so
// the store gets the same rows a write through the router would give. A file whose content the store
// already holds appends nothing, so running it again is safe. After the load it reads every file back and
// checks the hash chain, and it exits 1 if anything differs.
//
//   node platform/connectors/store-import.ts <folder> --tenant <id> [--url <variable>] [--check]
//
//   --url    the environment variable holding the connection string (default MENTURA_DATABASE_URL)
//   MENTURA_DB_DRIVER=neon-ws  connects over Neon's WebSocket driver on 443 (through HTTPS_PROXY when set), for where TCP to 5432 is blocked
//   --check  writes no records (it creates the table if it is missing): says how many files would be appended and how many the store already holds

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { blobSha } from "naive-framework/src/store/connectors/contract.mjs";
import { connect, poolFrom, verify, type Client } from "./postgres.ts";

/** Every file under a folder by its relative path, skipping dot files, .git and node_modules, as the filesystem connector does. */
export function filesOf(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p); else if (e.isFile()) out.push(relative(dir, p).split("\\").join("/"));
    }
  };
  walk(dir);
  return out.sort();
}

export interface Report { files: number, appended: number, unchanged: number, mismatched: string[], chain: { rows: number, broken: string[] } }

/** Loads (or with check, compares) a folder into the tenant's store and verifies it. */
export async function importFolder(dir: string, { tenant, client, check = false }: { tenant: string, client: Client, check?: boolean }): Promise<Report> {
  if (!statSync(dir).isDirectory()) throw new Error(`${dir} is not a folder`);
  const c = connect({ tenant, client, writes: check ? "none" : "direct" });
  const files = filesOf(dir);
  let appended = 0, unchanged = 0;
  for (const f of files) {
    const content = readFileSync(join(dir, f), "utf8");
    const same = check ? (await c.version(f)) === blobSha(content) : "unchanged" in (await c.write(f, content));
    if (same) unchanged++; else appended++;
  }
  const mismatched: string[] = [];
  if (!check) for (const f of files) if ((await c.version(f)) !== blobSha(readFileSync(join(dir, f), "utf8"))) mismatched.push(f);
  return { files: files.length, appended, unchanged, mismatched, chain: await verify(client, tenant) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (n: string) => { const i = args.indexOf(`--${n}`); return i < 0 ? null : args.splice(i, 2)[1] ?? null; };
  const tenant = opt("tenant"), url = opt("url") ?? "MENTURA_DATABASE_URL";
  const check = args.includes("--check");
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir || !tenant) { console.error("usage: node platform/connectors/store-import.ts <folder> --tenant <id> [--url <variable>] [--check]"); process.exit(2); }
  let pool: ReturnType<typeof poolFrom>;
  try { pool = poolFrom(url); } catch (e) { console.error((e as Error).message); process.exit(2); }
  try {
    const r = await importFolder(dir, { tenant, client: pool, check });
    console.log(check ? `would append ${r.appended} of ${r.files} files; the store already holds ${r.unchanged}` : `appended ${r.appended} of ${r.files} files; ${r.unchanged} were already there`);
    for (const m of r.mismatched) console.log(`FAIL  ${m} reads back different from the folder`);
    for (const b of r.chain.broken) console.log(`FAIL  ${b}`);
    console.log(`${tenant}: ${r.chain.rows} rows, chain ${r.chain.broken.length ? "broken" : "intact"}`);
    process.exitCode = r.mismatched.length || r.chain.broken.length ? 1 : 0;
  } finally { await pool.end(); }
}
