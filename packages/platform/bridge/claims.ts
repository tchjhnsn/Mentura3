// Claiming a venture that no account owns, once. A venture left at the top of the workspace is shown to
// no one, so nobody can pick one out in the console. Someone with a shell on the server issues a code for
// one venture and hands it to its founder. Holding the code is the whole proof, so it is random, kept only
// as a hash, expires, and dies when the venture moves into the account that redeemed it.

import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const LIFETIME_MS = 24 * 60 * 60 * 1000;
export const OWNER_FILE = "owner-account";

/** The folder holding every account's workspace, the codes, and ventures not yet in an account. */
export const sharedRoot = () => resolve(/*turbopackIgnore: true*/ process.env.NAIVE_CONSOLE_WORKSPACE ?? join(import.meta.dirname, "../.data/workspace"));

/** The account a pre-isolation venture recorded, if any. */
export const stampedOwner = (dir: string) => { try { return readFileSync(join(dir, ".naive", OWNER_FILE), "utf8").trim() || null; } catch { return null; } };

type Claim = { folder: string; expires: number };
const claimsDir = (root: string) => join(root, ".claims");
const fileOf = (root: string, code: string) => join(claimsDir(root), `${createHash("sha256").update(code.trim()).digest("hex")}.json`);
const read = (file: string): Claim => JSON.parse(readFileSync(file, "utf8"));

/** A new code for one folder. Older and expired codes go, so only the latest code for a venture works. */
export function issueClaim(root: string, folder: string): string {
  const dir = claimsDir(root);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    const old = read(join(dir, name));
    if (old.folder === folder || old.expires < Date.now()) rmSync(join(dir, name));
  }
  const code = randomBytes(24).toString("base64url");
  writeFileSync(fileOf(root, code), JSON.stringify({ folder, expires: Date.now() + LIFETIME_MS } satisfies Claim), { mode: 0o600, flag: "wx" });
  return code;
}

/** The claim a code stands for, or null for any code that is unknown or expired. */
export function openClaim(root: string, code: string): Claim | null {
  const file = fileOf(root, code);
  if (!existsSync(file)) return null;
  const claim = read(file);
  return claim.expires >= Date.now() ? claim : null;
}

export function closeClaim(root: string, code: string, account: string) {
  writeFileSync(join(claimsDir(root), "claimed.jsonl"), `${JSON.stringify({ at: new Date().toISOString(), folder: read(fileOf(root, code)).folder, account })}\n`, { flag: "a", mode: 0o600 });
  rmSync(fileOf(root, code));
}
