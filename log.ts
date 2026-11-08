import { closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, rmSync, unlinkSync, writeSync } from "node:fs";
import { join } from "node:path";
import { assertNoLink } from "./paths.ts";

export type StoredLine = { readonly kind: string; readonly [key: string]: unknown };

/** The lines of one venture log. `read` includes lines appended in this call. */
export interface LineIo {
  read(): StoredLine[];
  append(line: StoredLine): void;
}

/**
 * One account's outside log. The file implementation is the local console.
 * The hosted implementation is Postgres and does not use the serverless disk.
 */
export interface HostLog {
  run<T>(ventureId: string, fn: (io: LineIo) => T): Promise<T>;
}

const LOCK_MS = 15_000;

export function logFile(dir: string): string {
  return join(dir, "events.jsonl");
}

function parseLine(line: string): StoredLine {
  try {
    const parsed = JSON.parse(line) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("outside: log is not valid");
    return parsed as StoredLine;
  } catch (error) {
    if (error instanceof Error && error.message === "outside: log is not valid") throw error;
    throw new Error("outside: log is not valid");
  }
}

/** A regular file with one name. A symlink or a hard link is refused before any byte is written. */
function openOwned(file: string, flags: number): number {
  try {
    const st = lstatSync(file);
    if (st.isSymbolicLink()) throw new Error("outside: log must not be a symlink");
    if (!st.isFile() || st.nlink !== 1) throw new Error("outside: log must not be a hard link");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const fd = openSync(file, flags | constants.O_NOFOLLOW, 0o600);
  try {
    const st = fstatSync(fd);
    if (!st.isFile() || st.nlink !== 1) throw new Error("outside: log must not be a hard link");
    return fd;
  } catch (error) {
    closeSync(fd);
    throw error;
  }
}

/** One writer per venture log. A crash leaves a real lock directory that the next call removes after 15 seconds. */
export function withLock<T>(accountReal: string, dir: string, fn: () => T): T {
  assertNoLink(accountReal, dir);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  assertNoLink(accountReal, dir);
  const lock = join(dir, "lock");
  const release = () => {
    let st;
    try {
      st = lstatSync(lock);
    } catch {
      return;
    }
    if (st.isSymbolicLink()) {
      unlinkSync(lock);
      return;
    }
    if (st.isDirectory()) rmSync(lock, { recursive: true, force: true });
  };
  try {
    mkdirSync(lock);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EEXIST") throw error;
    const st = lstatSync(lock);
    if (st.isSymbolicLink() || !st.isDirectory()) throw new Error("outside: path escapes the account workspace");
    const age = Date.now() - st.mtimeMs;
    if (age < LOCK_MS) throw new Error("outside: log is busy");
    rmSync(lock, { recursive: true, force: true });
    mkdirSync(lock);
  }
  try {
    return fn();
  } finally {
    release();
  }
}

export function readLog(dir: string): StoredLine[] {
  const file = logFile(dir);
  let fd: number;
  try {
    fd = openOwned(file, constants.O_RDONLY);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  try {
    return readFileSync(/*turbopackIgnore: true*/ fd, "utf8").split("\n").filter(Boolean).map(parseLine);
  } finally {
    closeSync(fd);
  }
}

export function appendLog(dir: string, line: StoredLine): void {
  const fd = openOwned(logFile(dir), constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND);
  try {
    writeSync(fd, JSON.stringify(line) + "\n");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
