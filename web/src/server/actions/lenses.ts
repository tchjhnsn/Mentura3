// Thinker lenses (decided 2026-11-17): cited ideas from a thinker's works, applied in Reflect's own voice. Reflect
// never speaks as a living person; a public-domain thinker is quoted only from the text Reflect holds. The lenses
// and their check are pure, in @reflect/core/thinker-lenses.
import { z } from "zod";
import { ideasOut, lensAt, lensFor, lensGuidance, lensList, lensPersonHref, LENSES } from "@reflect/core/thinker-lenses";
import { action } from "./types";

const names = LENSES.map((l) => l.id).join(", ");

export const lensesAction = action({
  id: "lenses",
  title: "List the thinker lenses",
  description: `The thinker lenses Reflect has: each thinker, their works it holds, and how many cited ideas. Lenses: ${names}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async () => lensList(),
});

export const lensAction = action({
  id: "lens",
  title: "Read one thinker lens",
  description: `One thinker lens's ideas, each in Reflect's words with its citations: a path is a lens ("seneca") or one idea ("seneca/postponement"). Lenses: ${names}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ path: z.string().min(1).max(200).describe("A lens id, or lens/idea") }),
  /** Null when there is no such lens or idea. */
  run: async (_ctx, { path }) => {
    const at = lensAt(path);
    return at ? { id: at.lens.id, name: at.lens.name, living: at.lens.living, person: lensPersonHref(at.lens), works: at.lens.works.map((w) => w.title), ideas: ideasOut(at.lens, at.ideas) } : null;
  },
});

export const applyLens = action({
  id: "apply_lens",
  title: "Apply a thinker lens to the person's situation",
  description: `When the person asks what a thinker would say, or for advice "as if" someone were advising them: the lens's cited ideas and how to apply them in Reflect's own voice. Reflect never speaks as a living person; for a thinker with no lens it says so. Lenses: ${names}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ thinker: z.string().min(1).max(200).describe("The thinker's name or a lens id") }),
  /** `lens` is null when Reflect has no lens for the name; the guidance then says not to speak as them. */
  run: async (_ctx, { thinker }) => {
    const l = lensFor(thinker);
    return { lens: l ? { id: l.id, name: l.name, living: l.living, person: lensPersonHref(l), works: l.works.map((w) => w.title), ideas: ideasOut(l) } : null, guidance: lensGuidance(l, thinker) };
  },
});
