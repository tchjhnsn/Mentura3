import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const review = new URL("../docs/reviews/2026-11-03-architecture-inventory.md", import.meta.url);
const script = new URL("./architecture-inventory.ts", import.meta.url);

function run(args: string[]) {
  return spawnSync(process.execPath, [script.pathname, ...args], { cwd: root, encoding: "utf8" });
}

const check = run(["--check"]);
assert.equal(check.status, 0, `${check.stdout}${check.stderr}`);

const text = readFileSync(review, "utf8");
assert.equal(/polity/i.test(text), false, "the review names a forbidden example");
assert.match(text, /Of the \d+ folders, \d+ map cleanly, \d+ map to a noun with a different name, \d+ map to several nouns, and \d+ have no noun\./);

const fresh = run(["--stdout"]);
assert.equal(fresh.status, 0, fresh.stderr);
assert.equal(fresh.stdout, text, "a second run does not match the committed review");
