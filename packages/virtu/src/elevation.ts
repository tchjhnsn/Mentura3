// virtu elevation: where a surface sits when it is placed on another, and the
// radius of a corner nested inside another. Both are pure arithmetic, with no
// imports, so an app can run them in the browser to pick a level's class
// (virtu-depth-<level>) or a corner's radius, and the checker runs the same
// functions to decide a declaration. The idea of a surface that climbs from
// whatever it sits on, capped at the top of the ladder, and of a shadow that
// can be pinned, comes from Fluid Functionalism's surfaces
// (fluidfunctionalism.com/docs/surfaces). The design is docs/design/DEPTH.md.

/** A placement: how many levels above its substrate a surface goes, and optionally the level whose shadow it always keeps. */
export type Placement = { offset: number; shadow?: number | null };

/** Where a placed surface lands: its level's index, and the index of the level whose shadow it shows. */
export type Placed = { level: number; shadow: number; capped: boolean };

/**
 * The level a surface lands on when placed on the level at index substrate of
 * a ladder of count levels: substrate + offset, capped at the top. capped says
 * the ladder ran out, so the surface sits lower than its offset asks. Its
 * shadow is its own level's unless the placement pins one.
 */
export function place(count: number, substrate: number, p: Placement): Placed {
  const top = count - 1;
  const from = Math.min(Math.max(0, Math.trunc(substrate)), top);
  const want = from + Math.max(0, Math.trunc(p.offset));
  const level = Math.min(want, top);
  const shadow = p.shadow === null || p.shadow === undefined ? level : Math.min(Math.max(0, Math.trunc(p.shadow)), top);
  return { level, shadow, capped: want > top };
}

/**
 * The levels a stack of placements climbs from the base, each placed on the
 * one before: [base, first, second, ...]. A stack rises only when each entry
 * is above the one before.
 */
export function climb(count: number, stack: Placement[], base = 0): Placed[] {
  const out: Placed[] = [{ level: base, shadow: base, capped: false }];
  for (const p of stack) out.push(place(count, out[out.length - 1]?.level ?? base, p));
  return out;
}

/**
 * The radius of a corner inside another, so the two curves stay concentric:
 * the outer radius less the inset and the outer border, never below 0.
 */
export function nestedRadius(outer: number, inset: number, border = 0): number {
  return Math.max(0, outer - inset - border);
}
