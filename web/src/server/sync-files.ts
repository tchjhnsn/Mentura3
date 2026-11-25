// A business's files, kept in object storage by their sha256 (the offline sync contract, 2026-11-25). A working
// copy names a file by its hash, so a file never conflicts: two sides that hold the same bytes hold the same name,
// and a push only has to upload the hashes the store does not have yet.
//
// The key carries the account and the business, so one business can never read another's bytes by naming a hash it
// happens to know. The hash is checked against the bytes on every upload and on every read, so a corrupted or
// swapped object is refused rather than handed to a working copy.
//
// Production is Neon's object storage, which speaks the S3 API, reached with SigV4 signed by node:crypto so the app
// takes no new dependency. The connection is read from these environment variables by name, and none of their
// values is ever logged or returned:
//
//   MENTURA_STORAGE_ENDPOINT           the bucket's host, such as https://<project>.storage.example
//   MENTURA_STORAGE_BUCKET             the assets bucket
//   MENTURA_STORAGE_REGION             the region the signature names (default auto)
//   MENTURA_STORAGE_ACCESS_KEY_ID      the access key
//   MENTURA_STORAGE_SECRET_ACCESS_KEY  its secret
//
// The tests use memoryBlobs(), so nothing in them reaches the network.

import { createHash, createHmac } from "node:crypto";
import { isSyncId, type TokenHolder } from "./sync-token";

/** Bytes a working copy keeps, read and written by their hash. */
export interface BlobStore {
  has(key: string): Promise<boolean>;
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, bytes: Uint8Array): Promise<void>;
}

/** A sha256 as the contract writes it: 64 lower-case hex digits. */
export const isSha256 = (value: string): boolean => /^[0-9a-f]{64}$/.test(value);

/** The hash of these bytes, as the contract names a file. */
export const sha256Of = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

/** The largest file a working copy may push, matching the venture files folder's own cap. */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Where one business's file sits. The person and the business are in the key, so the key is the boundary. */
export function syncFileKey(identity: Pick<TokenHolder, "person" | "business">, sha256: string): string {
  if (!isSyncId(identity.person) || !isSyncId(identity.business)) throw new Error("that is not a business this token can reach");
  if (!isSha256(sha256)) throw new Error("that is not a sha256");
  return `sync/${identity.person}/${identity.business}/${sha256}`;
}

/** Bytes in this process, for the tests. */
export function memoryBlobs(seed: Iterable<[string, Uint8Array]> = []): BlobStore & { keys(): string[] } {
  const held = new Map<string, Uint8Array>(seed);
  return {
    has: async (key) => held.has(key),
    get: async (key) => held.get(key) ?? null,
    put: async (key, bytes) => void held.set(key, Uint8Array.from(bytes)),
    keys: () => [...held.keys()].sort(),
  };
}

interface Bucket { endpoint: string; bucket: string; region: string; keyId: string; secret: string }

/** The variables this file reads, by name. Not NodeJS.ProcessEnv, because nothing here wants the rest of it. */
export type StorageEnv = Record<string, string | undefined>;

/** The bucket the environment names, or null when it names none. No value is returned, only whether it is there. */
export function bucketFrom(env: StorageEnv = process.env): Bucket | null {
  const endpoint = env.MENTURA_STORAGE_ENDPOINT ?? "";
  const bucket = env.MENTURA_STORAGE_BUCKET ?? "";
  const keyId = env.MENTURA_STORAGE_ACCESS_KEY_ID ?? "";
  const secret = env.MENTURA_STORAGE_SECRET_ACCESS_KEY ?? "";
  if (!endpoint || !bucket || !keyId || !secret) return null;
  return { endpoint: endpoint.replace(/\/+$/, ""), bucket, region: env.MENTURA_STORAGE_REGION || "auto", keyId, secret };
}

const hex = (bytes: Uint8Array | string): string => createHash("sha256").update(bytes).digest("hex");
const hmac = (key: Uint8Array | string, value: string): Uint8Array => new Uint8Array(createHmac("sha256", key).update(value).digest());
/** Each path segment encoded as S3 signs it: the slashes stay, everything else follows RFC 3986. */
const encodePath = (path: string): string => path.split("/").map((p) => encodeURIComponent(p).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");

/** One signed S3 request: the URL and the headers to send with it. */
export function signS3(bucket: Bucket, method: string, key: string, bytes: Uint8Array | null, now = new Date()): { url: string; headers: Record<string, string> } {
  const host = new URL(bucket.endpoint).host;
  const path = `/${encodePath(`${bucket.bucket}/${key}`)}`;
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = stamp.slice(0, 8);
  const payload = hex(bytes ?? new Uint8Array());
  const headers: Record<string, string> = { host, "x-amz-content-sha256": payload, "x-amz-date": stamp };
  const names = Object.keys(headers).sort();
  const canonical = [method, path, "", ...names.map((n) => `${n}:${headers[n]}`), "", names.join(";"), payload].join("\n");
  const scope = `${day}/${bucket.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", stamp, scope, hex(canonical)].join("\n");
  let signing = hmac(`AWS4${bucket.secret}`, day);
  for (const part of [bucket.region, "s3", "aws4_request"]) signing = hmac(signing, part);
  const signature = Buffer.from(hmac(signing, toSign)).toString("hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${bucket.keyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`;
  return { url: `${bucket.endpoint}${path}`, headers };
}

/** The bucket as a blob store. `fetch` is a parameter so a test can drive it without the network. */
export function objectStorage(bucket: Bucket, send: typeof fetch = fetch): BlobStore {
  const call = async (method: string, key: string, bytes: Uint8Array | null): Promise<Response> => {
    const { url, headers } = signS3(bucket, method, key, bytes);
    return await send(url, { method, headers, ...(bytes ? { body: bytes as unknown as BodyInit } : {}) });
  };
  return {
    async has(key) {
      const r = await call("HEAD", key, null);
      if (r.status === 200) return true;
      if (r.status === 404) return false;
      throw new Error("the file store did not answer");
    },
    async get(key) {
      const r = await call("GET", key, null);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("the file store did not answer");
      return new Uint8Array(await r.arrayBuffer());
    },
    async put(key, bytes) {
      const r = await call("PUT", key, bytes);
      if (!r.ok) throw new Error("the file store did not take the file");
    },
  };
}

/** A store that answers nothing, for a deployment with no bucket named. */
export function noBlobs(): BlobStore {
  // Rejected rather than thrown, so a route meets it the same way it meets a store that will not answer.
  const refuse = async (): Promise<never> => { throw new Error("this site keeps no files for a business yet"); };
  return { has: refuse, get: refuse, put: refuse };
}

/** The store the sync routes use: the bucket the environment names, else one that refuses. */
export function syncBlobs(env: StorageEnv = process.env): BlobStore {
  const bucket = bucketFrom(env);
  return bucket ? objectStorage(bucket) : noBlobs();
}
