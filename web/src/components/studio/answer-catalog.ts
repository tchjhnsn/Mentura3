import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

/**
 * What an agent's answer may show in the Venture Studio (json-render, as Reflect's chat does in src/app/chat). The
 * agent fetches the records it needs and answers with a spec built from them; only these pieces render, each prop
 * checked by its schema. Records are shown as documents, never as loose cards.
 */
export const answerCatalog = defineCatalog(schema, {
  components: {
    Stack: { props: z.object({}), description: "Pieces shown one under another" },
    Note: { props: z.object({ text: z.string() }), description: "A sentence from the agent" },
    Record: {
      props: z.object({ slug: z.string(), path: z.string(), title: z.string(), lines: z.array(z.string()) }),
      description: "A record shown as a document: its title and the lines that answer the question, with its JSON one tap away",
    },
    NextPhase: { props: z.object({ slug: z.string() }), description: "What must be true for this business to reach its next phase, each criterion met or open" },
    Held: { props: z.object({ who: z.string(), what: z.string(), detail: z.string() }), description: "A draft an agent made that waits for the person's yes" },
    Plan: {
      props: z.object({ title: z.string(), steps: z.array(z.object({ title: z.string(), who: z.string(), status: z.enum(["Done", "Running", "Next", "Waiting for you"]) })) }),
      description: "Work the agents are doing, step by step, with who does each step",
    },
    Choice: { props: z.object({ question: z.string(), why: z.string(), options: z.array(z.string()) }), description: "A call only the person can make, with the agent's reason and the options" },
    Runs: { props: z.object({ slug: z.string() }), description: "What the agents did recently, opening each run" },
  },
  actions: {},
});
