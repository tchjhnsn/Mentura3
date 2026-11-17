// What an action asks of the person before it happens (Ask Reflect plan, step 1). One tier per action in the
// web app's registry (web/src/server/actions/); the chat and the person's own AI over MCP read it from there.
// Pure types and words only: nothing here asks, undoes or sends. The prompts each tier names are later steps.

/** How much an action asks of the person. */
export type Tier =
  /** Reads the person's records and changes nothing. Done with no prompt. */
  | "read"
  /** Changes the person's own record. Done at once; the person can Undo it (later). */
  | "own"
  /** Changes a household or shared record others also see. Waits for the person's Keep tap (later). */
  | "shared"
  /** Leaves Reflect: reaches another person or an outside service. Waits for the person's Send tap (later). */
  | "outside"
  /** Never offered to a model, whoever asks. */
  | "never";

export type TierInfo = { id: Tier; label: string; asks: "nothing" | "undo" | "keep" | "send" | "not offered"; says: string };

/** Every tier in order of how much it asks, with what it asks of the person. */
export const TIERS: readonly TierInfo[] = [
  { id: "read", label: "Read", asks: "nothing", says: "Reads the person's records and changes nothing." },
  { id: "own", label: "Own record", asks: "undo", says: "Changes the person's own record; they can undo it." },
  { id: "shared", label: "Shared record", asks: "keep", says: "Changes a household or shared record; it waits for the person to tap Keep." },
  { id: "outside", label: "Leaves Reflect", asks: "send", says: "Reaches someone or something outside Reflect; it waits for the person to tap Send." },
  { id: "never", label: "Never", asks: "not offered", says: "Not offered to a model." },
];

export const isTier = (v: unknown): v is Tier => TIERS.some((t) => t.id === v);

/** What a tier asks of the person, in words. */
export function describeTier(tier: Tier): TierInfo {
  return TIERS.find((t) => t.id === tier)!;
}

/** Whether a model may be offered an action of this tier at all. */
export const offered = (tier: Tier) => tier !== "never";
