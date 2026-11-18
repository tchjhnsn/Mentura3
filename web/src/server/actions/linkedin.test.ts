import { beforeEach, describe, expect, it, vi } from "vitest";
import { strToU8, zipSync } from "fflate";

// LinkedIn's export (Profiles and accounts, 2026-11-18): the upload's parsing path from a zip to what Keep keeps, what
// the change log keeps of it, and Undo, over a stand-in for the rows. Every name here is invented.
const POSITIONS = `Company Name,Title,Description,Location,Started On,Finished On
Fernwood Labs,Product Designer,"Designs things, mostly",Austin,Mar 2022,
Quill & Co,"Intern, research",,Remote,Jun 2019,Aug 2019
`;
const EDUCATION = `School Name,Start Date,End Date,Notes,Degree Name,Activities
Lakeside University,2015,2019,,BA Philosophy,
`;
const SKILLS = `Name
Figma
Research
Figma
`;
const CONNECTIONS = `Notes:
"When exporting your connection data, you may notice that some of the email addresses are missing."

First Name,Last Name,URL,Email Address,Company,Position,Connected On
Ada,Brook,https://www.linkedin.com/in/ada-brook,,Fernwood Labs,Engineer,12 Mar 2023
Cal,Dune,https://www.linkedin.com/in/cal-dune,,Quill & Co,Editor,01 Jan 2021
Ada,Brook,https://www.linkedin.com/in/ada-brook,,Fernwood Labs,Engineer,12 Mar 2023
No,Link,,,Nowhere,,
`;

const state = { experience: [] as unknown[][], connections: [] as unknown[], removedExp: [] as string[][], removedTags: [] as unknown[] };
vi.mock("../profile-store", () => ({
  addExperience: async (_u: string, rows: unknown[], source: string) => (state.experience.push([rows, source]), rows.map((_, i) => `x${i}`)),
  keepConnections: async (_u: string, rows: { slug: string }[]) => (state.connections.push(rows), rows.map((r) => `t-${r.slug}`)),
  removeExperience: async (_u: string, ids: string[]) => (state.removedExp.push(ids), []),
  removeConnections: async (_u: string, tags: unknown) => (state.removedTags.push(tags), 2),
  connectionsOf: async () => [
    { name: "Ada Brook", company: "Fernwood Labs", position: "Engineer", connectedOn: "2023-03-12" },
    { name: "Cal Dune", company: "Quill & Co", position: "Editor", connectedOn: "2021-01-01" },
  ],
  linkedinMatches: async () => [{ id: "u2", name: "Ada Brook", handle: null }, { id: "u3", name: "Cal Dune", handle: "cal" }],
}));

const { exportPreview, importLinkedinAction, linkedinConnectionsAction, linkedinMatchesAction, picked, removeLinkedinConnectionsAction } = await import("./linkedin");
const { unzipLinkedin, linkedinFileName } = await import("@/app/settings/profile/linkedin/files");
const ctx = { userId: "me" };
const logged = (after: unknown) => ({ id: "c", userId: "me", actionId: "import_linkedin", source: "page" as const, tier: "own" as const, input: {}, before: null, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });

/** A zip as LinkedIn sends it, with files Reflect never reads beside the ones it does, in folders and odd case. */
const zip = () =>
  zipSync({
    "Basic_LinkedInDataExport_11-18-2026/Positions.csv": strToU8(POSITIONS),
    "Basic_LinkedInDataExport_11-18-2026/education.CSV": strToU8(EDUCATION),
    "Skills.csv": strToU8(SKILLS),
    "Connections.csv": strToU8(CONNECTIONS),
    "messages.csv": strToU8("FROM,TO,CONTENT\nsecret,secret,secret\n"),
    "Email Addresses.csv": strToU8("Email Address\nnobody@example.test\n"),
  });

describe("the upload", () => {
  it("keeps only LinkedIn's five files from a zip, by base name in any folder and any case", () => {
    expect(linkedinFileName("a/b/CONNECTIONS.csv")).toBe("Connections.csv");
    expect(linkedinFileName("messages.csv")).toBeNull();
    const files = unzipLinkedin(zip());
    expect(Object.keys(files).sort()).toEqual(["Connections.csv", "Education.csv", "Positions.csv", "Skills.csv"]);
    expect(JSON.stringify(files)).not.toContain("secret");
    expect(JSON.stringify(files)).not.toContain("nobody@example.test");
  });

  it("previews positions, schools, skills and a count of connections, ignoring other file names", () => {
    const p = exportPreview({ ...unzipLinkedin(zip()), ...({ "messages.csv": "x" } as object) });
    expect(p.positions).toEqual([
      { kind: "position", organisation: "Fernwood Labs", title: "Product Designer", starts: "Mar 2022", ends: null },
      { kind: "position", organisation: "Quill & Co", title: "Intern, research", starts: "Jun 2019", ends: "Aug 2019" },
    ]);
    expect(p.schools).toEqual([{ kind: "school", organisation: "Lakeside University", title: "BA Philosophy", starts: "2015", ends: "2019" }]);
    expect(p.skills).toEqual(["Figma", "Research"]);
    expect(p.connections).toBe(2);
    expect(p.files).not.toContain("messages.csv");
  });

  it("picks rows by index, ignoring repeats and numbers past the end; no pick keeps all", () => {
    expect(picked(["a", "b", "c"], [2, 0, 2, 9])).toEqual(["a", "c"]);
    expect(picked(["a", "b"], undefined)).toEqual(["a", "b"]);
    expect(picked(["a", "b"], [])).toEqual([]);
  });
});

describe("import_linkedin", () => {
  beforeEach(() => {
    state.experience = [];
    state.connections = [];
    state.removedExp = [];
    state.removedTags = [];
  });

  it("keeps the ticked positions and schools as LinkedIn experience and every connection, and lists skills back", async () => {
    const input = importLinkedinAction.input!.parse({ files: unzipLinkedin(zip()), keep: { positions: [1], schools: [0] } });
    const r = await importLinkedinAction.run(ctx, input);
    expect(state.experience).toEqual([[[expect.objectContaining({ organisation: "Quill & Co" }), expect.objectContaining({ organisation: "Lakeside University" })], "linkedin"]]);
    expect((state.connections[0] as { slug: string }[]).map((c) => c.slug)).toEqual(["ada-brook", "cal-dune"]);
    expect(r).toMatchObject({ experience_kept: 2, experience_added: 2, connections_kept: 2, connections_added: 2, skills: ["Figma", "Research"] });
    expect(JSON.stringify(r)).not.toContain("t-ada-brook");
    const c = importLinkedinAction.change!(r, input, undefined);
    expect(c.after).toEqual({ experience: ["x0", "x1"], connections: ["t-ada-brook", "t-cal-dune"] });
  });

  it("keeps no connections when told not to, and the change log keeps only file sizes, never the texts", async () => {
    const input = importLinkedinAction.input!.parse({ files: { "Connections.csv": CONNECTIONS }, keep: { connections: false } });
    const r = await importLinkedinAction.run(ctx, input);
    expect(state.connections).toEqual([]);
    expect(r.connections_kept).toBe(0);
    const kept = JSON.stringify(importLinkedinAction.logged!(input));
    expect(kept).toContain("Connections.csv");
    expect(kept).not.toContain("Brook");
  });

  it("undo removes the experience rows and connections the run added", async () => {
    await importLinkedinAction.undo!(ctx, logged({ experience: ["x0"], connections: ["t-ada-brook"] }));
    expect(state.removedExp).toEqual([["x0"]]);
    expect(state.removedTags).toEqual([["t-ada-brook"]]);
  });
});

describe("the reads and remove", () => {
  it("links each match to their profile by handle, else id", async () => {
    const r = await linkedinMatchesAction.run(ctx, {});
    expect(r.people).toEqual([{ name: "Ada Brook", href: "/p/u2" }, { name: "Cal Dune", href: "/p/cal" }]);
  });

  it("reads the person's own connections, narrowed by company", async () => {
    const r = await linkedinConnectionsAction.run(ctx, { company: "quill", limit: 10 });
    expect(r).toMatchObject({ total: 2, matching: 1, connections: [{ name: "Cal Dune", company: "Quill & Co" }] });
  });

  it("removes every connection and has no undo", async () => {
    state.removedTags = [];
    expect(await removeLinkedinConnectionsAction.run(ctx, {})).toMatchObject({ removed: 2 });
    expect(state.removedTags).toEqual(["all"]);
    expect(removeLinkedinConnectionsAction.undo).toBeUndefined();
  });
});

describe("the change log", () => {
  it("keeps what `logged` returns as a run's input", async () => {
    const { runAction } = await import("./run");
    const added: { input: unknown }[] = [];
    const changes = { add: async (c: { input: unknown }) => (added.push(c), "id1") } as unknown as import("./types").ChangeLog;
    const input = importLinkedinAction.input!.parse({ files: { "Connections.csv": CONNECTIONS } });
    await runAction(importLinkedinAction, { userId: "me", changes }, input, "page");
    expect(added[0]!.input).toEqual({ files: { "Connections.csv": `${CONNECTIONS.length} characters` }, keep: { connections: true } });
  });
});
