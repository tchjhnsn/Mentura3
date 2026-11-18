import { describe, expect, it } from "vitest";
import { draftVenture, fileProblems, fileTree, isVenturePath, ventureId, ventureJsonProblems } from "./naive-venture";

describe("a Naive venture drafted from a Ventures record", () => {
  const files = draftVenture({ name: "Rosa's Prints", what: "Screen prints", where: "Etsy", revenue: 420, note: "Market stall on Saturdays.", state: "starting" });
  const venture = JSON.parse(files.find((f) => f.path === "venture.json")!.body);

  it("writes a venture.json Naive accepts, in Discovery and the src layout", () => {
    expect(ventureJsonProblems(venture)).toEqual([]);
    expect(venture).toMatchObject({ id: "rosa-s-prints", name: "Rosa's Prints", phase: "discovery", layout: "src", status: "active", parent: null });
    expect(venture.departments).toContain("strategy");
  });

  it("keeps the record's own words in raw/dump and invents nothing", () => {
    const notes = files.find((f) => f.path === "raw/dump/from-reflect.md")!.body;
    expect(notes).toContain("Where it sells: Etsy");
    expect(notes).toContain("$420");
    expect(notes).toContain("Market stall on Saturdays.");
    expect(notes).not.toContain("Costs a month");
  });

  it("puts each package under its function and every path is one a venture can keep", () => {
    expect(files.map((f) => f.path)).toContain("src/strategy/foundation/.gitkeep");
    expect(files.map((f) => f.path)).toContain("src/external-relationships/investors/.gitkeep");
    for (const f of files) expect(fileProblems(f)).toEqual([]);
  });

  it("shows the folders first and hides .gitkeep", () => {
    const tree = fileTree(files.map((f) => f.path));
    expect(tree.map((n) => n.name)).toEqual(["decisions", "evidence", "ideas", "knowledge", "public", "raw", "src", "profile.md", "venture.json"]);
    const ideas = tree.find((n) => n.name === "ideas");
    expect(ideas?.type === "folder" && ideas.children).toEqual([]);
  });
});

describe("venture.json checks", () => {
  it("names what Naive would refuse", () => {
    expect(ventureJsonProblems({ id: "Bad Id", name: "x", parent: null, phase: "someday", owner: "self", status: "active", layers: { knowledge: false }, departments: ["sales"], color: "red" })).toEqual([
      'venture.json has "color", which Naive does not know.',
      '"id" must be lower-case letters, digits and hyphens.',
      '"phase" must be one of discovery, validation, beachhead, scale, platform.',
      '"layers" needs "purpose".', '"layers" needs "operations".', '"layers" needs "evidence".',
      '"sales" is not one of Naive\'s functions.',
    ]);
    expect(fileProblems({ path: "venture.json", body: "{" })).toEqual(["venture.json is not valid JSON."]);
  });

  it("keeps paths inside the venture", () => {
    for (const p of ["../x", "a/../b", "/abs", "a//b", "./a", "a/"]) expect(isVenturePath(p)).toBe(false);
    for (const p of ["venture.json", "raw/dump/note.md", "src/strategy/foundation/.gitkeep"]) expect(isVenturePath(p)).toBe(true);
    expect(ventureId("  Café Été!! ")).toBe("cafe-ete");
    expect(ventureId("!!!")).toBe("venture");
  });
});
