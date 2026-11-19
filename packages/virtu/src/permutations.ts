// Every assignment of one value to each context. Contexts are the DTCG
// resolver's modifiers, in resolution order. A modifier with no values takes
// no part in permutations.

import type { Modifier, Permutation, Resolver } from "./model.ts";

/** The value a modifier takes when none is given: its default when that is one of its values, else its first value. */
export function valueOf(modifier: Modifier, given: string | null): string | null {
  if (given !== null) return given;
  const names = modifier.values.map((v) => v.name);
  if (modifier.default !== null && names.includes(modifier.default)) return modifier.default;
  return names[0] ?? null;
}

/** Context names with their values, in resolution order. */
export function contextValues(resolver: Resolver): Array<{ name: string; values: string[] }> {
  const out: Array<{ name: string; values: string[] }> = [];
  for (const item of resolver.order) {
    if (item.kind !== "modifier") continue;
    const modifier = resolver.modifiers[item.name];
    if (!modifier || modifier.values.length === 0) continue;
    out.push({ name: item.name, values: modifier.values.map((v) => v.name) });
  }
  return out;
}

export function defaultPermutation(resolver: Resolver): Permutation {
  const out: Record<string, string> = {};
  for (const { name } of contextValues(resolver)) {
    const modifier = resolver.modifiers[name];
    const value = modifier ? valueOf(modifier, null) : null;
    if (value !== null) out[name] = value;
  }
  return out;
}

export function allPermutations(resolver: Resolver): Permutation[] {
  let out: Array<Record<string, string>> = [{}];
  for (const { name, values } of contextValues(resolver)) {
    out = out.flatMap((p) => values.map((v) => ({ ...p, [name]: v })));
  }
  return out;
}

export function permutationKey(p: Permutation): string {
  return Object.entries(p)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
}

/** "theme=dark density=compact", or "every permutation" for an empty assignment. */
export function formatPermutation(p: Permutation): string {
  return Object.keys(p).length === 0 ? "every permutation" : permutationKey(p);
}

/**
 * Reduces the permutations under which something happened to the fewest
 * contexts that explain it. If it happened for every value of a context while
 * the others are held fixed, that context is dropped. So a failure under
 * theme=dark with any density becomes {theme: "dark"}, and a failure under
 * every permutation becomes {}.
 */
export function collapse(happened: Permutation[], resolver: Resolver): Permutation[] {
  let current: Permutation[] = dedupe(happened);
  for (const { name, values } of contextValues(resolver)) {
    const byRest = new Map<string, Set<string>>();
    let closed = true;
    for (const p of current) {
      const value = p[name];
      if (value === undefined) {
        closed = false;
        break;
      }
      const rest = permutationKey(without(p, name));
      const seen = byRest.get(rest) ?? new Set<string>();
      seen.add(value);
      byRest.set(rest, seen);
    }
    if (!closed) continue;
    if ([...byRest.values()].every((seen) => values.every((v) => seen.has(v)))) {
      current = dedupe(current.map((p) => without(p, name)));
    }
  }
  return current;
}

function without(p: Permutation, name: string): Permutation {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) if (k !== name) out[k] = v;
  return out;
}

function dedupe(perms: Permutation[]): Permutation[] {
  const seen = new Map<string, Permutation>();
  for (const p of perms) seen.set(permutationKey(p), p);
  return [...seen.values()];
}
