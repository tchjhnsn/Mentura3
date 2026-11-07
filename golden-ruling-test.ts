import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readSchema } from "naive-framework/src/records/index.mjs";
import { naivePath } from "./naive.ts";
import { ideasIn } from "./records-folder.ts";

const root = new URL("..", import.meta.url).pathname;
const sample = JSON.parse(readFileSync(naivePath("packages/naive/src/records/examples/ontology-golden/n-001.scope.json"), "utf8"));
const dir = mkdtempSync(join(tmpdir(), "golden-ruling-"));

const validate = (ruling: unknown) => {
  const file = join(dir, "ruling.json");
  writeFileSync(file, JSON.stringify(ruling));
  const r = spawnSync(process.execPath, [naivePath("packages/naive/src/records/validate.mjs"), "--schema", "golden-ruling.schema.json", "--file", file], { cwd: root, encoding: "utf8" });
  return { status: r.status, out: r.stdout + r.stderr };
};

try {
  const valid = validate(sample);
  assert.equal(valid.status, 0, `the sample ruling validates: ${valid.out}`);

  const comment = "https://github.com/tchjhnsn/everything-ecosystem/issues/1#issuecomment-1";
  const { card, ...noSource } = sample;
  const byComment = { ...noSource, comment };
  assert.equal(validate(byComment).status, 0, "a ruling that cites a GitHub comment validates");
  assert.equal(validate({ ...noSource, card }).status, 0, "a ruling that cites a decision card validates");

  assert.equal(validate(noSource).status, 1, "a ruling with no source is rejected");
  assert.equal(validate({ ...noSource, comment, card }).status, 1, "a ruling that cites both a comment and a card is rejected");

  assert.equal(validate({ ...byComment, comment: `${comment}\n` }).status, 1, "a comment URL ending in a newline is rejected");
  assert.equal(validate({ ...byComment, comment: "https://github.com/tchjhnsn/everything-ecosystem/issues/1" }).status, 1, "a URL that is not a comment is rejected");

  assert.equal(validate({ ...sample, card: { ...card, message: "msg_01SampleCard" } }).status, 1, "a card message id without the cmsg_ prefix is rejected");
  assert.equal(validate({ ...sample, card: { ...card, thread: "cmsg_01-thread" } }).status, 1, "a card thread id with a character outside letters and digits is rejected");
  assert.equal(validate({ ...sample, card: { ...card, message: `${card.message}\n` } }).status, 1, "a card id ending in a newline is rejected");
  assert.equal(validate({ ...sample, card: { ...card, chosen_at: "2026-11-05" } }).status, 1, "a card without the time of the tap is rejected");
  assert.equal(validate({ ...sample, card: { thread: card.thread, message: card.message } }).status, 1, "a card missing chosen_at is rejected");
  assert.equal(validate({ ...sample, card: { ...card, url: "https://claude.ai" } }).status, 1, "a card with an extra key is rejected");

  const unknown = validate({ ...sample, field: "tags", value: ["x"] });
  assert.equal(unknown.status, 1, "a ruling on a field outside the closed set is rejected");
  assert.match(unknown.out, /field: "tags" is not one of/);

  assert.equal(validate({ ...sample, field: "status", value: "high" }).status, 1, "a value from another field is rejected");
  assert.equal(validate({ ...sample, field: "importance", value: "high" }).status, 0, "an importance ruling validates");
  assert.equal(validate({ ...sample, field: "relation", value: [{ relation: "builds_on", to: "n-002" }] }).status, 0, "a relation ruling validates");
  assert.equal(validate({ ...sample, field: "relation", value: [{ relation: "inspires", to: "n-002" }] }).status, 1, "a relation outside the term engine's set is rejected");

  const idea = readSchema("founder-idea");
  const golden = readSchema("golden-ruling");
  for (const f of ["status", "importance"]) assert.deepEqual(golden.$defs[f].enum, idea.properties[f].enum, `${f} values match the idea record`);

  const folder = join(root, "docs/reviews/ontology-golden");
  for (const name of readdirSync(folder).filter((f) => f.endsWith(".json"))) {
    const r = JSON.parse(readFileSync(join(folder, name), "utf8"));
    assert.equal(name, `${r.idea}.${r.field}.json`, `${name} is named for its idea and field`);
    // The idea records live in the store since EE-118 step 9c: checked when MENTURA_RECORDS names an export.
    if (process.env.MENTURA_RECORDS) assert.ok(existsSync(join(ideasIn(process.env.MENTURA_RECORDS), `${r.idea}.json`)), `${name} rules on an idea that exists`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log("golden rulings: all pass");
