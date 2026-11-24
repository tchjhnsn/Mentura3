// Each venture's own storage (bridge/files.ts): a round trip through files/, and every way out of it refused.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deleteStored, filesRoot, listFiles, makeFolder, MAX_FILE_BYTES, moveStored, readStored, writeStored } from "./files.ts";

const venture = mkdtempSync(join(tmpdir(), "files-test-"));
try {
  writeFileSync(join(venture, "venture.json"), "{}");
  const root = filesRoot(venture, join(venture, "k-base", "files"));
  const b64 = (s: string) => Buffer.from(s).toString("base64");

  makeFolder(root, "Decks");
  assert.equal(writeStored(root, "Decks/deck.txt", b64("v1")).size, 2);
  assert.throws(() => writeStored(root, "Decks/deck.txt", b64("v2")), /already here/, "an upload never overwrites by accident");
  writeStored(root, "Decks/deck.txt", b64("v2"), true);
  assert.equal(Buffer.from(readStored(root, "Decks/deck.txt").base64, "base64").toString(), "v2");
  assert.deepEqual(listFiles(root).map((f) => [f.kind, f.path, f.children?.map((c) => c.path)]), [["folder", "Decks", ["Decks/deck.txt"]]]);

  moveStored(root, "Decks/deck.txt", "Decks/pitch.txt");
  assert.throws(() => moveStored(root, "Decks", "Decks/inner"), /inside itself/);
  assert.equal(deleteStored(root, "Decks").removed.length, 1);
  assert.deepEqual(listFiles(root), []);

  for (const bad of ["../venture.json", ".env", "a/../../venture.json", "", "a\\b"]) assert.throws(() => writeStored(root, bad, b64("x")), Error, bad);
  assert.throws(() => readStored(root, "../../venture.json"));
  assert.throws(() => writeStored(root, "big.bin", Buffer.alloc(MAX_FILE_BYTES + 1).toString("base64")), /larger than/);

  // A link out of the venture is never followed.
  const outside = mkdtempSync(join(tmpdir(), "files-out-"));
  symlinkSync(outside, join(root, "out"));
  assert.throws(() => writeStored(root, "out/x.txt", b64("x")), /outside|links/);
  assert.throws(() => readStored(root, "out"), /links/);
  rmSync(outside, { recursive: true });

  // The files folder itself may not be a link out of the venture.
  const v2 = mkdtempSync(join(tmpdir(), "files-test-")), elsewhere = mkdtempSync(join(tmpdir(), "files-out-"));
  mkdirSync(join(v2, "k-base"));
  symlinkSync(elsewhere, join(v2, "k-base", "files"));
  assert.throws(() => filesRoot(v2, join(v2, "k-base", "files")), /link/);
  rmSync(v2, { recursive: true }); rmSync(elsewhere, { recursive: true });
  console.log("files-test: ok");
} finally {
  rmSync(venture, { recursive: true, force: true });
}
