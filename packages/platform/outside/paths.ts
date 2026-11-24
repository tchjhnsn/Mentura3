import { constants, lstatSync, mkdirSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";

/** Real path of `target` when it stays inside `root`. Symlinks are resolved before the check. */
export function confine(root: string, target: string): string {
  if (!isAbsolute(root) || !isAbsolute(target)) throw new Error("outside: paths must be absolute");
  const base = realpathSync(root);
  const real = realpathSync(target);
  const rel = relative(base, real);
  if (rel.startsWith(`..${sep}`) || rel === "..") throw new Error("outside: path escapes the account workspace");
  if (real !== base && !real.startsWith(base + sep)) throw new Error("outside: path escapes the account workspace");
  return real;
}

/** A fixture segment: one path piece, no dots. */
export function fixtureSegment(input: string): string {
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(input)) throw new Error("outside: fixture segment is not a single safe name");
  return input;
}

export function ventureLogDir(accountReal: string, ventureId: string): string {
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(ventureId)) throw new Error("outside: venture id is not a single safe name");
  return join(accountReal, "outside", ventureId);
}

/**
 * Every existing component of `target` under `root` is a real directory or file, not a symlink.
 * A missing tail is allowed so the caller can create it. This does not follow links.
 */
export function assertNoLink(root: string, target: string): void {
  if (!isAbsolute(root) || !isAbsolute(target)) throw new Error("outside: paths must be absolute");
  const rel = relative(root, target);
  if (rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel)) throw new Error("outside: path escapes the account workspace");
  let current = root;
  for (const part of rel.split(sep)) {
    if (part === "" || part === "." || part === "..") throw new Error("outside: path escapes the account workspace");
    current = join(current, part);
    let st;
    try {
      st = lstatSync(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw new Error("outside: path escapes the account workspace");
    }
    if (st.isSymbolicLink()) throw new Error("outside: path escapes the account workspace");
  }
}

/** The venture directory and the venture id must be the same folder inside the account. */
export function canonicalVenture(accountReal: string, ventureId: string, ventureDir: string): string {
  const expected = confine(accountReal, join(accountReal, ventureId));
  const given = confine(accountReal, ventureDir);
  if (given !== expected) throw new Error("outside: venture directory does not match the venture id");
  return expected;
}

/** Refuse a symlink. The caller opens the returned path with O_NOFOLLOW. */
export function rejectSymlink(file: string): void {
  const st = lstatSync(file);
  if (st.isSymbolicLink()) throw new Error("outside: secret file must not be a symlink");
  if (!st.isFile()) throw new Error("outside: secret file is missing");
  if ((st.mode & 0o077) !== 0) throw new Error("outside: secret file must be readable only by its owner");
  if (typeof process.getuid === "function" && st.uid !== process.getuid()) throw new Error("outside: secret file is owned by someone else");
  if (st.size < 16 || st.size > 4096) throw new Error("outside: secret file has an unexpected size");
}

export const noFollow = constants.O_RDONLY | constants.O_NOFOLLOW;

export function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
}
