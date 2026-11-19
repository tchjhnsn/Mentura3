import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { check } from "./src/check.ts";
import { previewEdits } from "./src/editor.ts";
import type { Loaded } from "./src/model.ts";
import { siteSnapshot, SNAPSHOT } from "./snapshot-lib.ts";

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
});
