import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { check } from "./src/check.ts";
import { previewEdits } from "./src/editor.ts";
import type { Loaded } from "./src/model.ts";
import { analyze } from "./src/check.ts";
import { lookState, type LookCatalog } from "./src/looks.ts";
import { LOOKS_SNAPSHOT, looksSnapshot, siteSnapshot, SNAPSHOT } from "./snapshot-lib.ts";

describe("the personal site's Virtu system", () => {
  it("passes check", () => {
    expect(check(siteSnapshot()).verdict).toBe("pass");
  });
  it("has a current snapshot (node packages/virtu/snapshot.ts rewrites it)", () => {
    expect(JSON.parse(readFileSync(SNAPSHOT, "utf8"))).toEqual(JSON.parse(JSON.stringify(siteSnapshot())));
  });
  it("fails an edit that drops body text below 4.5:1, and the snapshot is not changed", () => {
    const loaded = JSON.parse(readFileSync(SNAPSHOT, "utf8")) as Loaded;
    const s = previewEdits(loaded, [{ token: "color.role.foreground", context: null, value: "{palette.stone.300}" }]);
    expect(s.verdict).toBe("fail");
    expect(s.findings.some((f) => f.rule === "L2.contrast")).toBe(true);
    expect(check(loaded).verdict).toBe("pass");
  });
  it("has a current looks snapshot, and every shape, ornament, and season in it passes against the site system", () => {
    const catalog = JSON.parse(readFileSync(LOOKS_SNAPSHOT, "utf8")) as LookCatalog;
    expect(catalog).toEqual(JSON.parse(JSON.stringify(looksSnapshot())));
    expect(catalog.shapes.length).toBeGreaterThanOrEqual(5);
    const a = analyze(siteSnapshot());
    for (const shape of catalog.shapes) expect(lookState(a, catalog, { shape: shape.name, ornaments: {}, season: null }).findings, shape.name).toEqual([]);
    for (const o of catalog.ornaments) expect(lookState(a, catalog, { shape: null, ornaments: { card: o.decl.name }, season: null }).findings, o.decl.name).toEqual([]);
    for (const s of catalog.seasons) expect(lookState(a, catalog, { shape: null, ornaments: {}, season: s.name }).findings, s.name).toEqual([]);
  });
  it("refuses a look the catalog does not have", () => {
    const catalog = JSON.parse(readFileSync(LOOKS_SNAPSHOT, "utf8")) as LookCatalog;
    const s = lookState(analyze(siteSnapshot()), catalog, { shape: "blobby", ornaments: {}, season: null });
    expect(s.refused).toEqual(["no shape is named blobby"]);
    expect(s.css).toBe("");
  });
});
