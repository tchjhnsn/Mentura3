import { describe, expect, it } from "vitest";
import { bucketFrom, isSha256, memoryBlobs, noBlobs, objectStorage, sha256Of, signS3, syncBlobs, syncFileKey } from "./sync-files";

const WHO = { person: "acct1", business: "harbor" };
const bytes = new TextEncoder().encode("the founder's notes");
const hash = sha256Of(bytes);

const BUCKET = {
  MENTURA_STORAGE_ENDPOINT: "https://store.example/",
  MENTURA_STORAGE_BUCKET: "assets",
  MENTURA_STORAGE_REGION: "auto",
  MENTURA_STORAGE_ACCESS_KEY_ID: "AKIATEST",
  MENTURA_STORAGE_SECRET_ACCESS_KEY: "secret-for-the-test-only",
};

describe("the key a file sits at", () => {
  it("carries the account and the business, so the key is the boundary", () => {
    expect(syncFileKey(WHO, hash)).toBe(`sync/acct1/harbor/${hash}`);
    expect(syncFileKey({ ...WHO, business: "mill" }, hash)).not.toBe(syncFileKey(WHO, hash));
  });

  it("refuses an id or a hash that could reach out of the key", () => {
    expect(() => syncFileKey({ person: "../acct2", business: "harbor" }, hash)).toThrow();
    expect(() => syncFileKey({ person: "acct1", business: "har/bor" }, hash)).toThrow();
    expect(() => syncFileKey(WHO, "../../secret")).toThrow();
    expect(() => syncFileKey(WHO, hash.toUpperCase())).toThrow();
  });

  it("knows a sha256 from anything else", () => {
    expect(isSha256(hash)).toBe(true);
    expect(isSha256(`${hash}0`)).toBe(false);
    expect(isSha256(hash.toUpperCase())).toBe(false);
  });
});

describe("the bucket the environment names", () => {
  it("is null until every part of it is set", () => {
    expect(bucketFrom({})).toBe(null);
    const { MENTURA_STORAGE_SECRET_ACCESS_KEY: _secret, ...most } = BUCKET;
    expect(bucketFrom(most)).toBe(null);
    expect(bucketFrom(BUCKET)?.bucket).toBe("assets");
  });

  it("defaults the region and drops a trailing slash from the endpoint", () => {
    const { MENTURA_STORAGE_REGION: _region, ...rest } = BUCKET;
    expect(bucketFrom(rest)).toMatchObject({ region: "auto", endpoint: "https://store.example" });
  });

  it("gives a store that refuses when no bucket is named", async () => {
    await expect(syncBlobs({}).has("sync/acct1/harbor/x")).rejects.toThrow(/keeps no files/);
    await expect(noBlobs().get("x")).rejects.toThrow();
  });
});

describe("a signed request to the file store", () => {
  const bucket = bucketFrom(BUCKET)!;
  const now = new Date("2026-11-25T08:09:10.000Z");

  it("puts the bucket and the key in the path and signs the bytes it sends", () => {
    const { url, headers } = signS3(bucket, "PUT", syncFileKey(WHO, hash), bytes, now);
    expect(url).toBe(`https://store.example/assets/sync/acct1/harbor/${hash}`);
    expect(headers["x-amz-date"]).toBe("20261125T080910Z");
    expect(headers["x-amz-content-sha256"]).toBe(hash);
    expect(headers.authorization).toContain("Credential=AKIATEST/20261125/auto/s3/aws4_request");
    expect(headers.authorization).toContain("SignedHeaders=host;x-amz-content-sha256;x-amz-date");
    expect(headers.authorization).not.toContain(BUCKET.MENTURA_STORAGE_SECRET_ACCESS_KEY);
  });

  it("signs the same request the same way twice, and a different key differently", () => {
    const a = signS3(bucket, "GET", "sync/acct1/harbor/a", null, now);
    const b = signS3(bucket, "GET", "sync/acct1/harbor/a", null, now);
    const c = signS3(bucket, "GET", "sync/acct1/harbor/b", null, now);
    expect(a.headers.authorization).toBe(b.headers.authorization);
    expect(a.headers.authorization).not.toBe(c.headers.authorization);
  });

  it("hashes an empty body for a read, as S3 requires", () => {
    const { headers } = signS3(bucket, "HEAD", "sync/acct1/harbor/a", null, now);
    expect(headers["x-amz-content-sha256"]).toBe(sha256Of(new Uint8Array()));
  });
});

describe("the bucket as a blob store", () => {
  const bucket = bucketFrom(BUCKET)!;
  const key = syncFileKey(WHO, hash);

  it("reads 404 as nothing there and 200 as the bytes", async () => {
    const seen: { method: string; url: string }[] = [];
    const send = (async (url: string | URL | Request, init?: RequestInit) => {
      seen.push({ method: String(init?.method), url: String(url) });
      return String(init?.method) === "HEAD" ? new Response(null, { status: 404 }) : new Response(bytes as unknown as BodyInit, { status: 200 });
    }) as unknown as typeof fetch;
    const store = objectStorage(bucket, send);
    expect(await store.has(key)).toBe(false);
    expect(new Uint8Array((await store.get(key))!)).toEqual(bytes);
    expect(seen.map((s) => s.method)).toEqual(["HEAD", "GET"]);
    expect(seen[0]?.url).toContain(`/assets/${key}`);
  });

  it("gives nothing for a read the store says is not there", async () => {
    const send = (async () => new Response(null, { status: 404 })) as unknown as typeof fetch;
    expect(await objectStorage(bucket, send).get(key)).toBe(null);
  });

  it("says in one sentence, naming no host, when the store will not answer", async () => {
    const send = (async () => new Response("AccessDenied by store.example", { status: 403 })) as unknown as typeof fetch;
    const store = objectStorage(bucket, send);
    await expect(store.has(key)).rejects.toThrow("the file store did not answer");
    await expect(store.get(key)).rejects.toThrow("the file store did not answer");
    await expect(store.put(key, bytes)).rejects.toThrow("the file store did not take the file");
  });

  it("sends the bytes on a put", async () => {
    let sent: Uint8Array | null = null;
    const send = (async (_url: string, init?: RequestInit) => {
      sent = init?.body as Uint8Array;
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;
    await objectStorage(bucket, send).put(key, bytes);
    expect(sent).toEqual(bytes);
  });
});

describe("the in-memory store the tests use", () => {
  it("keeps, finds and copies the bytes it is given", async () => {
    const files = memoryBlobs();
    expect(await files.has("k")).toBe(false);
    await files.put("k", bytes);
    expect(await files.has("k")).toBe(true);
    const back = await files.get("k");
    expect(back).toEqual(bytes);
    expect(back).not.toBe(bytes);
    expect(files.keys()).toEqual(["k"]);
  });
});
