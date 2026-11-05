import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const sample = JSON.parse(readFileSync(join(root, "schema/examples/ontology-golden/n-001.scope.json"), "utf8"));
const dir = mkdtempSync(join(tmpdir(), "golden-ruling-"));

const validate = (ruling: unknown) => {
  const file = join(dir, "ruling.json");
  writeFileSync(file, JSON.stringify(ruling));
  const r = spawnSync("python3", ["-I", "schema/validate.py", "--schema", "golden-ruling.schema.json", "--file", file], { cwd: root, encoding: "utf8" });
  return { status: r.status, out: r.stdout + r.stderr };
};

try {
  const valid = validate(sample);
  assert.equal(valid.status, 0, `the sample ruling validates: ${valid.out}`);

  const { comment, ...noComment } = sample;
  const missing = validate(noComment);
  assert.equal(missing.status, 1, "a ruling without its comment URL is rejected");
  assert.match(missing.out, /'comment' is a required property/);

  assert.equal(validate({ ...sample, comment: `${comment}\n` }).status, 1, "a comment URL ending in a newline is rejected");
  assert.equal(validate({ ...sample, comment: "https://github.com/tchjhnsn/everything-ecosystem/issues/1" }).status, 1, "a URL that is not a comment is rejected");

  const unknown = validate({ ...sample, field: "tags", value: ["x"] });
  assert.equal(unknown.status, 1, "a ruling on a field outside the closed set is rejected");
  assert.match(unknown.out, /field: 'tags' is not one of/);

  assert.equal(validate({ ...sample, field: "status", value: "high" }).status, 1, "a value from another field is rejected");
  assert.equal(validate({ ...sample, field: "importance", value: "high" }).status, 0, "an importance ruling validates");
  assert.equal(validate({ ...sample, field: "relation", value: [{ relation: "builds_on", to: "n-002" }] }).status, 0, "a relation ruling validates");
  assert.equal(validate({ ...sample, field: "relation", value: [{ relation: "inspires", to: "n-002" }] }).status, 1, "a relation outside the term engine's set is rejected");

  const idea = JSON.parse(readFileSync(join(root, "schema/founder-idea.schema.json"), "utf8"));
  const golden = JSON.parse(readFileSync(join(root, "schema/golden-ruling.schema.json"), "utf8"));
  for (const f of ["status", "importance"]) assert.deepEqual(golden.$defs[f].enum, idea.properties[f].enum, `${f} values match the idea record`);

  const folder = join(root, "docs/reviews/ontology-golden");
  for (const name of readdirSync(folder).filter((f) => f.endsWith(".json"))) {
    const r = JSON.parse(readFileSync(join(folder, name), "utf8"));
    assert.equal(name, `${r.idea}.${r.field}.json`, `${name} is named for its idea and field`);
    assert.ok(existsSync(join(root, "instance/people/p-54697df9/ideas", `${r.idea}.json`)), `${name} rules on an idea that exists`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log("golden rulings: all pass");
