import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VentureFile } from "@reflect/core/naive-venture";

// A venture's files (2026-11-18): the actions over in-memory stand-ins for the life records and the file store.
const ID = "11111111-1111-4111-8111-111111111111";
const files = new Map<string, string>();
const record = { id: ID, app: "ventures", kind: "venture", state: "starting", body: { name: "Rosa's Prints", where: "Etsy", note: "Saturdays." }, createdAt: "", updatedAt: "" };
vi.mock("../life-store", () => ({ lifeRecord: async (_u: string, id: string) => (id === ID ? record : null) }));
vi.mock("../venture-files-store", () => ({
  ventureFiles: async (): Promise<VentureFile[]> => [...files].sort(([a], [b]) => a.localeCompare(b)).map(([path, body]) => ({ path, body })),
  putVentureFiles: async (_u: string, _v: string, fs: VentureFile[]) => void fs.forEach((f) => files.set(f.path, f.body)),
  removeVentureFiles: async (_u: string, _v: string, ps: string[]) => void ps.forEach((p) => files.delete(p)),
}));

const { draftNaiveVenture, startNaiveVenture, ventureFilesAction, writeVentureFile } = await import("./ventures");
const ctx = { userId: "u" };
const logged = (actionId: string, before: unknown, after: unknown) => ({ id: "c", userId: "u", actionId, source: "chat" as const, tier: "own" as const, input: {}, before, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });

describe("a venture's files", () => {
  beforeEach(() => files.clear());

  it("drafts without keeping anything, then starts, reads and undoes", async () => {
    const draft = await draftNaiveVenture.run(ctx, { venture: ID });
    expect(draft.files.map((f) => f.path)).toContain("venture.json");
    expect(files.size).toBe(0);

    const before = await startNaiveVenture.before!(ctx, { venture: ID });
    const res = await startNaiveVenture.run(ctx, { venture: ID });
    expect(JSON.parse(files.get("venture.json")!)).toMatchObject({ id: "rosa-s-prints", phase: "discovery" });
    expect(files.get("raw/dump/from-reflect.md")).toContain("Where it sells: Etsy");
    await expect(startNaiveVenture.run(ctx, { venture: ID })).rejects.toThrow("already started");

    const tree = await ventureFilesAction.run(ctx, { venture: ID, path: "" });
    expect(tree).toMatchObject({ started: true });
    expect(await ventureFilesAction.run(ctx, { venture: ID, path: "raw/dump/from-reflect.md" })).toMatchObject({ text: expect.stringContaining("Saturdays.") });

    const c = startNaiveVenture.change!(res, { venture: ID }, before);
    await startNaiveVenture.undo!(ctx, logged("start_naive_venture", c.before, c.after));
    expect(files.size).toBe(0);
  });

  it("writes a file, refuses a venture.json Naive would refuse, and undo puts the old text back", async () => {
    await expect(writeVentureFile.run(ctx, { venture: ID, path: "ideas/a.md", text: "x" })).rejects.toThrow("Start this venture in Naive first");
    await startNaiveVenture.run(ctx, { venture: ID });
    await expect(writeVentureFile.run(ctx, { venture: ID, path: "venture.json", text: '{"id":"x"}' })).rejects.toThrow('needs "name"');
    await expect(writeVentureFile.run(ctx, { venture: ID, path: "../x", text: "x" })).rejects.toThrow("not a path");

    const old = files.get("profile.md");
    const before = await writeVentureFile.before!(ctx, { venture: ID, path: "profile.md", text: "new" });
    const res = await writeVentureFile.run(ctx, { venture: ID, path: "profile.md", text: "# Rosa's Prints\n\nNew words." });
    const c = writeVentureFile.change!(res, { venture: ID, path: "profile.md", text: "" }, before);
    await writeVentureFile.undo!(ctx, logged("write_venture_file", c.before, c.after));
    expect(files.get("profile.md")).toBe(old);

    const b2 = await writeVentureFile.before!(ctx, { venture: ID, path: "ideas/one.md", text: "" });
    const r2 = await writeVentureFile.run(ctx, { venture: ID, path: "ideas/one.md", text: "An idea." });
    const c2 = writeVentureFile.change!(r2, { venture: ID, path: "ideas/one.md", text: "" }, b2);
    await writeVentureFile.undo!(ctx, logged("write_venture_file", c2.before, c2.after));
    expect(files.has("ideas/one.md")).toBe(false);
  });

  it("only reads the person's ventures", async () => {
    await expect(ventureFilesAction.run(ctx, { venture: "22222222-2222-4222-8222-222222222222", path: "" })).rejects.toThrow("No such venture");
  });
});
