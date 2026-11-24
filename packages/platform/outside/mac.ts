import { createHmac, timingSafeEqual } from "node:crypto";
import { closeSync, fstatSync, openSync, readSync } from "node:fs";
import { noFollow, rejectSymlink } from "./paths.ts";

/** Read a secret file and zero the buffer after `fn` returns. The value is not logged. */
export function withSecret<T>(file: string, fn: (key: Buffer) => T): T {
  rejectSymlink(file);
  const fd = openSync(file, noFollow);
  try {
    const st = fstatSync(fd);
    if (st.isSymbolicLink() || !st.isFile()) throw new Error("outside: secret file must be a regular file");
    if ((st.mode & 0o077) !== 0) throw new Error("outside: secret file must be readable only by its owner");
    const key = Buffer.alloc(st.size);
    const n = readSync(fd, key, 0, st.size, 0);
    if (n !== st.size) throw new Error("outside: secret file could not be read");
    try {
      return fn(key);
    } finally {
      key.fill(0);
    }
  } finally {
    closeSync(fd);
  }
}

export function hmac(key: Buffer, text: string): string {
  return createHmac("sha256", key).update(text).digest("base64url");
}

export function macEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
