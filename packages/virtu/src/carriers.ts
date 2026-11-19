// The read carriers of D1 as pure functions over Loaded: discover (what the
// system governs), enumerate (its vocabularies as data), and resolve (one
// name to a value under given contexts).

import { analyze, type Analysis } from "./check.ts";
import { DOMAIN_IDS, type Json, type Loaded, type Permutation } from "./model.ts";
import { relationDomains, relationScope } from "./relations.ts";
import { canonicalValue, selectTokens } from "./tokens.ts";

export type DomainManifest =
  | { id: string; status: "governed"; cells: { vocabulary: string | null; context: string | null; machine: string | null } }
  | { id: string; status: "excluded"; reason: string }
  | { id: string; status: "undeclared" };

export type Manifest = {
  virtu: "0";
  name: string;
  medium: "screen";
  domains: DomainManifest[];
  vocabularies: Array<{ id: string; domain: string; kind: "tokens" | "members" }>;
  contexts: Array<{ name: string; dialect: string | null; values: string[]; default: string | null }>;
  machines: string[];
  relations: Array<{ id: string; kind: string; subkind: string; scope: "within" | "across" | "unknown"; domains: string[] }>;
  usage: { count: number };
};

export function discover(loaded: Loaded): Manifest {
  const a = analyze(loaded);
  return {
    virtu: "0",
    name: loaded.name,
    medium: loaded.medium,
    domains: DOMAIN_IDS.map((id): DomainManifest => {
      const d = loaded.domains[id];
      if (!d) return { id, status: "undeclared" };
      if (d.kind === "excluded") return { id, status: "excluded", reason: d.reason };
      return {
        id,
        status: "governed",
        cells: { vocabulary: d.cells.vocabulary ?? null, context: d.cells.context ?? null, machine: d.cells.machine ?? null },
      };
    }),
    vocabularies: a.vocabularies.map((v) => ({ id: v.id, domain: v.domain, kind: v.kind })),
    contexts: contextList(a),
    machines: Object.keys(loaded.machines),
    relations: loaded.relations.map((r) => ({
      id: r.id,
      kind: r.kind,
      subkind: r.subkind,
      scope: relationScope(r, a),
      domains: relationDomains(r, a),
    })),
    usage: { count: loaded.usage.length },
  };
}

export function contextList(a: Analysis): Manifest["contexts"] {
  const names = [...new Set([...a.contexts.map((c) => c.name), ...Object.keys(a.loaded.contexts)])];
  return names.map((name) => ({
    name,
    dialect: a.loaded.contexts[name]?.dialect ?? null,
    values: a.contexts.find((c) => c.name === name)?.values ?? [],
    default: a.defaultPermutation[name] ?? null,
  }));
}

export type Entry =
  | { name: string; type: string | null; value: Json | null }
  | { name: string; definition: string };

export type Enumeration = {
  permutation: Permutation;
  vocabularies: Array<{ id: string; domain: string; kind: "tokens" | "members"; entries: Entry[] }>;
};

export type PermutationResult = { ok: true; permutation: Permutation } | { ok: false; error: string };

/** Builds a permutation from name=value arguments; contexts not given take their default. */
export function parsePermutation(loaded: Loaded, args: string[]): PermutationResult {
  const a = analyze(loaded);
  const p: Record<string, string> = { ...a.defaultPermutation };
  for (const arg of args) {
    const eq = arg.indexOf("=");
    if (eq <= 0) return { ok: false, error: `--context takes name=value, got "${arg}"` };
    const name = arg.slice(0, eq);
    const value = arg.slice(eq + 1);
    const ctx = a.contexts.find((c) => c.name === name);
    if (!ctx) return { ok: false, error: `unknown context "${name}"; contexts are ${a.contexts.map((c) => c.name).join(", ") || "none"}` };
    if (!ctx.values.includes(value)) return { ok: false, error: `context ${name} has no value "${value}"; values are ${ctx.values.join(", ")}` };
    p[name] = value;
  }
  return { ok: true, permutation: p };
}

export function enumerate(loaded: Loaded, options: { domain?: string; permutation?: Permutation } = {}): Enumeration {
  const a = analyze(loaded);
  const permutation = options.permutation ?? a.defaultPermutation;
  const r = a.resolution(permutation);
  const vocabularies = a.vocabularies
    .filter((v) => options.domain === undefined || v.domain === options.domain)
    .map((v) => ({
      id: v.id,
      domain: v.domain,
      kind: v.kind,
      entries:
        v.kind === "members"
          ? Object.entries(v.members ?? {}).map(([m, definition]): Entry => ({ name: `${v.id}.${m}`, definition }))
          : selectTokens(r, v.id).map((t): Entry => ({ name: t.path, type: t.type, value: canonicalValue(t) })),
    }));
  return { permutation, vocabularies };
}

export type Resolved =
  | { ok: true; token: string; type: string | null; value: Json; permutation: Permutation }
  | { ok: true; entry: string; definition: string }
  | { ok: false; error: string };

export function resolve(loaded: Loaded, name: string, permutation?: Permutation): Resolved {
  const a = analyze(loaded);
  const dot = name.indexOf(".");
  const vocab = dot > 0 ? loaded.vocabularies[name.slice(0, dot)] : undefined;
  const member = vocab?.members[name.slice(dot + 1)];
  if (member !== undefined) return { ok: true, entry: name, definition: member };
  const p = permutation ?? a.defaultPermutation;
  const r = a.resolution(p);
  const token = r.tokens.get(name);
  if (!token) {
    const why = r.groups.has(name) ? `${name} is a group; name one token` : `there is no token ${name}`;
    return { ok: false, error: why };
  }
  if (token.raw === null) {
    const problem = r.problems.find((pr) => pr.entities[0] === name);
    return { ok: false, error: problem?.message ?? `${name} does not resolve` };
  }
  return { ok: true, token: name, type: token.type, value: canonicalValue(token) ?? token.raw, permutation: p };
}
