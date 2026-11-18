// A venture's files (2026-11-18, the card "In Reflect, exportable"): each Ventures record can keep its folder in
// Naive's layout (@reflect/core/naive-venture). The chat and the person's own AI read the files, draft a Naive venture
// to show the person, start it when they say so, and write a file; the venture page runs the same entries.
import { z } from "zod";
import { draftVenture, fileProblems, fileTree, type VentureFile, type VentureSeed } from "@reflect/core/naive-venture";
import { lifeRecord, type LifeRecord } from "../life-store";
import { putVentureFiles, removeVentureFiles, ventureFiles } from "../venture-files-store";
import { action, type ActionContext, type LoggedChange } from "./types";

const ventureInput = z.object({ venture: z.string().uuid().describe("The venture's record id, from `life` with app 'ventures'") });

export async function ventureOf(userId: string, id: string): Promise<LifeRecord> {
  const r = await lifeRecord(userId, id);
  if (!r || r.app !== "ventures" || r.kind !== "venture") throw new Error("No such venture.");
  return r;
}

/** What a Ventures record holds that a Naive venture starts from. */
export function seedOf(r: LifeRecord): VentureSeed {
  const b = r.body as Record<string, unknown>;
  const text = (k: string) => (typeof b[k] === "string" && (b[k] as string).trim() ? (b[k] as string) : undefined);
  const num = (k: string) => (typeof b[k] === "number" ? (b[k] as number) : undefined);
  return { name: text("name") ?? "Venture", what: text("what"), where: text("where"), link: text("link"), started: text("started"), revenue: num("revenue"), costs: num("costs"), note: text("note"), state: r.state };
}

export const ventureFilesAction = action({
  id: "venture_files",
  title: "Read a venture's files",
  description: "Read the files one of the person's ventures keeps in Naive's layout. With no path, the folder tree; with a file's path (such as 'venture.json' or 'raw/dump/from-reflect.md'), that file's text. An empty tree means the venture has not been started in Naive.",
  tier: "read",
  on: ["chat", "mcp"],
  input: ventureInput.extend({ path: z.string().max(300).default("") }),
  run: async ({ userId }, { venture, path }) => {
    const r = await ventureOf(userId, venture);
    const files = await ventureFiles(userId, r.id);
    if (!path) return { venture: r.id, started: files.length > 0, tree: fileTree(files.map((f) => f.path)) };
    const f = files.find((x) => x.path === path);
    return f ? { venture: r.id, path, text: f.body } : { venture: r.id, path, text: null, note: "No such file." };
  },
});

export const draftNaiveVenture = action({
  id: "draft_naive_venture",
  title: "Draft a Naive venture",
  description: "Draft the files a Naive venture would start with for one of the person's ventures (venture.json in Discovery, a profile, their own notes in raw/), without keeping anything. Show the person the draft; start it with start_naive_venture only once they say so.",
  tier: "read",
  on: ["chat", "mcp"],
  input: ventureInput,
  run: async ({ userId }, { venture }) => {
    const r = await ventureOf(userId, venture);
    const files = draftVenture(seedOf(r));
    return { venture: r.id, tree: fileTree(files.map((f) => f.path)), files: files.filter((f) => f.body) };
  },
});

const undoFiles = async ({ userId }: ActionContext, c: LoggedChange) => {
  const b = c.before as { venture?: unknown; files?: unknown } | null;
  const a = c.after as { paths?: unknown } | null;
  if (typeof b?.venture !== "string" || !Array.isArray(b.files) || !Array.isArray(a?.paths)) throw new Error("This change cannot be undone.");
  const before = b.files as VentureFile[];
  await removeVentureFiles(userId, b.venture, (a.paths as string[]).filter((p) => !before.some((f) => f.path === p)));
  if (before.length) await putVentureFiles(userId, b.venture, before);
};

export const startNaiveVenture = action({
  id: "start_naive_venture",
  title: "Start a venture in Naive",
  description: "Start one of the person's ventures in Naive: keep its first files in Reflect (venture.json in Discovery, a profile, their notes in raw/ and Naive's empty folders), which they can then download and open in Naive. Only when the person asks; show the draft first with draft_naive_venture.",
  tier: "own",
  on: ["chat", "mcp"],
  input: ventureInput,
  before: async ({ userId }, { venture }) => ({ venture, files: await ventureFiles(userId, venture) }),
  run: async ({ userId }, { venture }) => {
    const r = await ventureOf(userId, venture);
    if ((await ventureFiles(userId, r.id)).some((f) => f.path === "venture.json")) throw new Error("This venture is already started in Naive.");
    const files = draftVenture(seedOf(r));
    for (const f of files) {
      const p = fileProblems(f);
      if (p.length) throw new Error(p.join(" "));
    }
    await putVentureFiles(userId, r.id, files);
    return { venture: r.id, paths: files.map((f) => f.path), href: `/life/ventures/${r.id}` };
  },
  change: (res, _input, before) => ({ before, after: { paths: res.paths } }),
  undo: undoFiles,
});

export const writeVentureFile = action({
  id: "write_venture_file",
  title: "Write a file in a venture",
  description: "Keep one file in a venture started in Naive, in Naive's layout: a note in raw/dump/, an idea in ideas/, or a change to venture.json (checked against Naive's schema). Replaces a file at the same path. Only the person's own words, or what they asked for.",
  tier: "own",
  on: ["chat", "mcp"],
  input: ventureInput.extend({ path: z.string().min(1).max(300), text: z.string().max(200_000) }),
  before: async ({ userId }, { venture }) => ({ venture, files: await ventureFiles(userId, venture) }),
  run: async ({ userId }, { venture, path, text }) => {
    const r = await ventureOf(userId, venture);
    const files = await ventureFiles(userId, r.id);
    if (!files.some((f) => f.path === "venture.json")) throw new Error("Start this venture in Naive first.");
    const problems = fileProblems({ path, body: text });
    if (problems.length) throw new Error(problems.join(" "));
    await putVentureFiles(userId, r.id, [{ path, body: text }]);
    return { venture: r.id, path };
  },
  // Only the file written is kept as before, so Undo puts back that one file (or removes it when it is new).
  change: (res, _input, before) => {
    const b = before as { venture: string; files: VentureFile[] };
    return { before: { venture: b.venture, files: b.files.filter((f) => f.path === res.path) }, after: { paths: [res.path] } };
  },
  undo: undoFiles,
});
