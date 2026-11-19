/** The parts of a prep the page adds to and edits one item at a time. A key point's item id is its index. */
export const PREP_KINDS = ["point", "question", "asset", "fact", "checklist"] as const;
export type PrepKind = (typeof PREP_KINDS)[number];
export const isPrepKind = (v: unknown): v is PrepKind => PREP_KINDS.includes(v as PrepKind);

/** The item being edited, from the page's `edit` address part ("question:abc123"), or null. */
export function editing(v: string): { kind: PrepKind; id: string } | null {
  const i = v.indexOf(":");
  if (i < 0) return null;
  const kind = v.slice(0, i);
  const id = v.slice(i + 1);
  return isPrepKind(kind) && id ? { kind, id } : null;
}
