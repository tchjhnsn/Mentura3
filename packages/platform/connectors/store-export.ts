// Writes a tenant's records out of its Postgres store into a folder (EE-118 step 9c): the newest row of every
// path, as the Postgres connector reads it. It is the way back from store-import.ts, for tools that read a
// folder of records, such as the ontology program's scripts (--records). Every file is checked against the
// version the store gives, and it exits 1 if any differs. It writes only into a folder that is missing or
// empty, so it never mixes two exports or overwrites a working copy. Keep an export out of git: it holds the
// tenant's private records.
//
//   node platform/connectors/store-export.ts <folder> --tenant <id> [--root <path>] [--url <variable>]
//
//   --root   only the records under this path, such as people/p-54697df9 (default every record)
//   --url    the environment variable holding the connection string (default MENTURA_DATABASE_URL)
//   MENTURA_DB_DRIVER=neon-ws  connects over Neon's WebSocket driver on 443 (through HTTPS_PROXY when set)

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { blobSha } from "naive-framework/src/store/connectors/contract.mjs";
import { connect, poolFrom, type Client } from "./postgres.ts";

export interface ExportReport { files: number, mismatched: string[] }

/** Writes every record of the tenant (under root) into dir, which must be missing or empty, and checks each one. */
export async function exportFolder(dir: string, { tenant, client, root = "" }: { tenant: string, client: Client, root?: string }): Promise<ExportReport> {
  if (existsSync(dir) && readdirSync(dir).length) throw new Error(`${dir} is not empty: export into a missing or empty folder`);
  const c = connect({ tenant, client, root, writes: "none" });
  const mismatched: string[] = [];
  const entries = await c.list();
  for (const { path, version } of entries) {
    const r = await c.read(path);
    if (!r) { mismatched.push(path); continue; }
    const file = join(dir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, r.content);
    if (blobSha(readFileSync(file, "utf8")) !== version) mismatched.push(path);
  }
  return { files: entries.length, mismatched };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (n: string) => { const i = args.indexOf(`--${n}`); return i < 0 ? null : args.splice(i, 2)[1] ?? null; };
  const tenant = opt("tenant"), url = opt("url") ?? "MENTURA_DATABASE_URL", root = opt("root") ?? "";
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir || !tenant) { console.error("usage: node platform/connectors/store-export.ts <folder> --tenant <id> [--root <path>] [--url <variable>]"); process.exit(2); }
  let pool: ReturnType<typeof poolFrom>;
  try { pool = poolFrom(url); } catch (e) { console.error((e as Error).message); process.exit(2); }
  try {
    const r = await exportFolder(dir, { tenant, client: pool, root });
    for (const m of r.mismatched) console.log(`FAIL  ${m} was not written as the store holds it`);
    console.log(`${tenant}: wrote ${r.files} files to ${dir}${r.mismatched.length ? `, ${r.mismatched.length} differ` : ""}`);
    process.exitCode = r.mismatched.length ? 1 : 0;
  } catch (e) { console.error((e as Error).message); process.exitCode = 2; }
  finally { await pool.end(); }
}
