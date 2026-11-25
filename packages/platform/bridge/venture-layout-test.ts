// bridge/venture-layout.ts says Naive's layout rules over a list of paths, for the hosted store that has no disk.
// This pins it against Naive's own `physical` and `logical` (naive-framework/src/core/venture-paths.ts): for each
// layout a real business folder is laid out on disk, every logical path Naive's route table and venture template name
// is placed with Naive's `physical`, and the copy here must give the same physical path for every logical one and the
// same logical path for every file on disk.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { logical, physical } from "naive-framework/src/core/venture-paths.mjs";
import { routes } from "naive-framework/src/router/router.mjs";
import { layoutIn, logicalPath, physicalPath, recordAt, storeLayout } from "./venture-layout.ts";

interface Row { kind: string; files?: string[] }

const template = new URL("../node_modules/naive-framework/packages/naive/template/", import.meta.url).pathname;
const filesUnder = (root: string): string[] => {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p); else out.push(relative(root, p));
    }
  };
  walk(root);
  return out;
};

const fromRoutes = (routes() as Row[]).flatMap((r) => (r.files ?? []).map((f) => f.replace(/\*\*/g, "deep/sample").replace(/\*/g, "sample")));
const fromTemplate = filesUnder(template);
const specials = ["venture.json", "provenance.jsonl", "sources.json", "knowledge/sources.json", "naive.config.json", "operating-rules.json",
  "profile.md", "AGENTS.md", ".release/manifest.json", ".naive/sync.json", "codebase/site/index.html", "repo/app/main.ts",
  "foundation/problem.json", "decisions/pricing.decision.json", "money/_summary.json", "programs/finance.md"];
const logicalPaths = [...new Set([...fromRoutes, ...fromTemplate, ...specials])].filter((p) => p && !p.endsWith("/"));
assert.ok(fromRoutes.length > 50, `the route table names ${fromRoutes.length} record files; that is too few to be the real one`);

const put = (dir: string, rel: string) => {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), "{}\n");
};

// Each case: the layout venture.json names and the files laid down before Naive places anything, which is how a
// business made by 0.3.0 (knowledge/) or one that mirrors a function as a (group)/ folder looks on disk.
const cases: { name: string; layout: string | null; seed: string[] }[] = [
  { name: "flat", layout: null, seed: [] },
  { name: "structured", layout: "structured", seed: [] },
  { name: "structured from 0.3.0, under knowledge/", layout: "structured", seed: ["knowledge/foundation/problem.json"] },
  { name: "structured with a (group)/ folder", layout: "structured", seed: ["k-base/(strategy)/foundation/vision.json", "k-base/(people)/people/ada.json"] },
  { name: "src", layout: "src", seed: [] },
];

const root = mkdtempSync(join(tmpdir(), "venture-layout-"));
let checked = 0;
try {
  for (const c of cases) {
    const dir = join(root, c.name.replace(/[^a-z0-9]+/gi, "-"));
    mkdirSync(dir, { recursive: true });
    const venture = JSON.stringify(c.layout ? { id: "harbor", layout: c.layout } : { id: "harbor" });
    writeFileSync(join(dir, "venture.json"), venture);
    for (const s of c.seed) put(dir, s);
    const placed = new Map(logicalPaths.map((l) => [l, physical(dir, l) as string]));
    // venture.json is already there; writing it again would lose the layout it names.
    for (const p of placed.values()) if (p !== "venture.json") put(dir, p);
    const onDisk = filesUnder(dir);
    const at = storeLayout(venture, onDisk);
    assert.equal(at.layout, layoutIn(venture), c.name);

    const physicalDiffers = [...placed].filter(([l, p]) => physicalPath(at, l) !== p).map(([l, p]) => `${l}: Naive ${p}, here ${physicalPath(at, l)}`);
    assert.deepEqual(physicalDiffers, [], `${c.name}: physical paths differ from Naive's`);
    const logicalDiffers = onDisk.filter((p) => logicalPath(at, p) !== logical(dir, p)).map((p) => `${p}: Naive ${logical(dir, p)}, here ${logicalPath(at, p)}`);
    assert.deepEqual(logicalDiffers, [], `${c.name}: logical paths differ from Naive's`);
    // A file is a record where Naive reads it back from the same place: its logical path, when Naive's `physical`
    // of that path is the file, else none.
    for (const p of onDisk) {
      const l = logical(dir, p) as string;
      assert.equal(recordAt(at, p), physical(dir, l) === p ? l : null, `${c.name}: ${p}`);
    }
    checked += placed.size + onDisk.length;
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}

// The shapes the sync pull depends on, written out so a reader sees them.
const structured = storeLayout(JSON.stringify({ layout: "structured" }), ["k-base/foundation/problem.json", "meta/provenance.jsonl"]);
assert.equal(physicalPath(structured, "provenance.jsonl"), "meta/provenance.jsonl");
assert.equal(logicalPath(structured, "k-base/foundation/problem.json"), "foundation/problem.json");
assert.equal(logicalPath(structured, "README.md"), "profile.md");
assert.equal(logicalPath(structured, "meta/sources.json"), "knowledge/sources.json");
// A file at the top of a structured business is not where Naive reads that record, so it is no record.
assert.equal(recordAt(structured, "foundation/problem.json"), null);
const src = storeLayout(JSON.stringify({ layout: "src" }), []);
assert.equal(logicalPath(src, "src/strategy/foundation/problem.json"), "foundation/problem.json");
assert.equal(recordAt(src, "foundation/problem.json"), null);
assert.equal(physicalPath(src, "provenance.jsonl"), "provenance.jsonl");
assert.equal(layoutIn("{"), "flat");
assert.equal(layoutIn(JSON.stringify({ layout: "tiled" })), "flat");

console.log(`venture layout: ${checked} paths agree with Naive's physical and logical across ${cases.length} layouts`);
