// Two tools that reach every chat action without its own tool (Ask Reflect: most are the page acts, plan step 4):
// find_actions searches them by words and shows each one's input, and act runs one by its id, checked against its
// own schema and run like any other tool (logged, held when it is shared or leaves Reflect, undoable when it can be).
import { tool, type Tool } from "ai";
import { z } from "zod";
import { describeFor, type Action } from "@/server/actions";

export const META_TOOLS = ["find_actions", "act"] as const;

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

/** The actions that best match the words, best first: a word in the id or title counts more than one in the description. */
export function findActions(actions: readonly Action[], query: string, limit = 8): Action[] {
  const q = words(query);
  if (!q.length) return actions.slice(0, limit);
  const scored = actions.map((a) => {
    const head = words(`${a.id.replace(/_/g, " ")} ${a.title}`);
    const body = words(a.description);
    const score = q.reduce((n, w) => n + (head.some((h) => h.startsWith(w) || w.startsWith(h)) ? 3 : 0) + (body.some((b) => b.startsWith(w)) ? 1 : 0), 0);
    return { a, score };
  });
  return scored.filter((s) => s.score > 0).sort((x, y) => y.score - x.score).slice(0, limit).map((s) => s.a);
}

const schemaOf = (a: Action): unknown => {
  if (!a.input) return {};
  try {
    return z.toJSONSchema(a.input as z.ZodType, { io: "input", unrepresentable: "any" });
  } catch {
    return "an object; see the description";
  }
};

export function actTools(actions: readonly Action[], run: (a: Action) => (input: unknown) => Promise<unknown>): [string, Tool][] {
  if (!actions.length) return [];
  const byId = new Map(actions.map((a) => [a.id, a]));
  const ids = actions.map((a) => a.id) as [string, ...string[]];
  return [
    [
      "find_actions",
      tool({
        description: `Search the other things you can do in Reflect for the person (log something, change or remove a record, plan a meal, keep an excerpt, follow a person or topic, set a reading goal, and more), by a few words of what they asked. Returns the best matches with each one's id, what it does and the input it takes; then call act. Their ids: ${actions.map((a) => a.id).join(", ")}.`,
        inputSchema: z.object({ query: z.string().describe("A few words of what the person wants done") }),
        execute: async ({ query }) => {
          const found = findActions(actions, query);
          if (!found.length) return "Nothing matches. Try other words, or tell the person this cannot be done from the chat yet.";
          return found.map((a) => ({ id: a.id, title: a.title, tier: a.tier, does: describeFor(a, "chat").slice(0, 600), input: schemaOf(a) }));
        },
      }) as Tool,
    ],
    [
      "act",
      tool({
        description: "Do one action found with find_actions, for the person, only when they asked for it. Give its id and an input that fits the schema find_actions showed.",
        inputSchema: z.object({ action: z.enum(ids), input: z.record(z.string(), z.unknown()).optional() }),
        execute: async ({ action, input }) => {
          const a = byId.get(action);
          if (!a) return `No action ${action}.`;
          let parsed: unknown = input ?? {};
          if (a.input) {
            const r = (a.input as z.ZodType).safeParse(input ?? {});
            if (!r.success) return `That input does not fit ${a.id}: ${r.error.issues.map((i) => `${i.path.join(".") || "input"} ${i.message}`).join("; ")}. Call find_actions to see its input.`;
            parsed = r.data;
          }
          return run(a)(parsed);
        },
      }) as Tool,
    ],
  ];
}
