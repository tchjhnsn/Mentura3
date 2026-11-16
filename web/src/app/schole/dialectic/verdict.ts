/** The text of a verdict note: what it is about first (as the Notes list reads it), then the motion, the side, and why. */
export function verdictBody(v: { title: string; motion: string | null; side: string; why: string }): string {
  return [
    `> ${v.title.replace(/\s+/g, " ").trim()}`,
    v.motion ? `The motion: ${v.motion}` : null,
    v.side ? `Won me over: ${v.side}` : null,
    v.why || null,
  ].filter(Boolean).join("\n\n");
}
