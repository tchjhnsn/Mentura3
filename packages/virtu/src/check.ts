// check(loaded) runs the stages in the order of the CheckRun statechart
// (docs/design/statecharts/CheckRun.tla): structure, then relations under
// every permutation, then usage, then the report. Unresolvable aliases skip
// the relations stage but usage still runs. A run never stops at the first
// error.

import {
  DOMAIN_IDS,
  type DomainId,
  type Finding,
  type Loaded,
  type Mechanism,
  type Permutation,
} from "./model.ts";
import { allPermutations, contextValues, defaultPermutation, permutationKey } from "./permutations.ts";
import { checkRelations } from "./relations.ts";
import { finding, STRUCTURE_RULES, USAGE_RULES } from "./rules.ts";
import { resolveTokens, type Resolution } from "./tokens.ts";

export type VocabularyInfo = {
  /** The enumerated vocabulary's name, or the token path of the group. */
  id: string;
  domain: DomainId;
  kind: "tokens" | "members";
  members: Record<string, string> | null;
};

export type EntryLookup = { ok: true; domain: DomainId; vocabulary: string } | { ok: false; why: string };

export type Analysis = {
  loaded: Loaded;
  contexts: Array<{ name: string; values: string[] }>;
  permutations: Permutation[];
  defaultPermutation: Permutation;
  resolution(p: Permutation): Resolution;
  /** Token and group paths present under at least one permutation. */
  allPaths: Set<string>;
  allGroups: Set<string>;
  vocabularies: VocabularyInfo[];
  /** The mechanisms a cell reference could name. */
  lookup(ref: string): Mechanism[];
  /** The governed domain whose token vocabulary holds a token, if any. */
  domainOfToken(path: string): DomainId | null;
  /** What a usage entry names. */
  entry(name: string): EntryLookup;
};

export function analyze(loaded: Loaded): Analysis {
  const resolver = loaded.resolver;
  const permutations = allPermutations(resolver);
  const cache = new Map<string, Resolution>();
  const resolution = (p: Permutation): Resolution => {
    const key = permutationKey(p);
    let r = cache.get(key);
    if (!r) {
      r = resolveTokens(resolver, p);
      cache.set(key, r);
    }
    return r;
  };
  const allPaths = new Set<string>();
  const allGroups = new Set<string>();
  for (const p of permutations) {
    const r = resolution(p);
    for (const path of r.tokens.keys()) allPaths.add(path);
    for (const path of r.groups) allGroups.add(path);
  }
  const isTokenRef = (ref: string): boolean => allPaths.has(ref) || allGroups.has(ref);

  const lookup = (ref: string): Mechanism[] => {
    const out: Mechanism[] = [];
    if (ref in loaded.vocabularies || isTokenRef(ref)) out.push("vocabulary");
    if (ref in loaded.contexts || ref in resolver.modifiers) out.push("context");
    if (ref in loaded.machines) out.push("machine");
    return out;
  };

  const vocabularies: VocabularyInfo[] = [];
  const seen = new Set<string>();
  for (const id of DOMAIN_IDS) {
    const decl = loaded.domains[id];
    if (decl?.kind !== "governed") continue;
    const ref = decl.cells.vocabulary;
    if (typeof ref !== "string" || seen.has(ref)) continue;
    const enumerated = loaded.vocabularies[ref];
    if (enumerated) {
      vocabularies.push({ id: ref, domain: enumerated.domain, kind: "members", members: enumerated.members });
      seen.add(ref);
    } else if (isTokenRef(ref)) {
      vocabularies.push({ id: ref, domain: id, kind: "tokens", members: null });
      seen.add(ref);
    }
  }
  for (const [name, v] of Object.entries(loaded.vocabularies)) {
    if (!seen.has(name)) vocabularies.push({ id: name, domain: v.domain, kind: "members", members: v.members });
  }

  const domainOfToken = (path: string): DomainId | null => {
    for (const v of vocabularies) {
      if (v.kind === "tokens" && (path === v.id || path.startsWith(`${v.id}.`))) return v.domain;
    }
    return null;
  };

  const entry = (name: string): EntryLookup => {
    const dot = name.indexOf(".");
    if (dot > 0) {
      const vocab = loaded.vocabularies[name.slice(0, dot)];
      if (vocab) {
        const member = name.slice(dot + 1);
        if (member in vocab.members) return { ok: true, domain: vocab.domain, vocabulary: name.slice(0, dot) };
        return { ok: false, why: `vocabulary ${name.slice(0, dot)} has no member "${member}"` };
      }
    }
    if (allGroups.has(name) && !allPaths.has(name)) return { ok: false, why: `${name} is a group, not one entry` };
    if (!allPaths.has(name)) return { ok: false, why: `there is no token or vocabulary member ${name}` };
    const domain = domainOfToken(name);
    if (domain === null) return { ok: false, why: `${name} is a token, but no governed domain's vocabulary holds it` };
    const vocab = vocabularies.find((v) => v.kind === "tokens" && (name === v.id || name.startsWith(`${v.id}.`)));
    return { ok: true, domain, vocabulary: vocab?.id ?? name };
  };

  return {
    loaded,
    contexts: contextValues(resolver),
    permutations,
    defaultPermutation: defaultPermutation(resolver),
    resolution,
    allPaths,
    allGroups,
    vocabularies,
    lookup,
    domainOfToken,
    entry,
  };
}

export type Verdict = "pass" | "fail";

export type CheckResult = {
  verdict: Verdict;
  findings: Finding[];
  /** Every permutation the run resolved tokens under. */
  permutations: Permutation[];
  /** False when unresolvable aliases skipped the relations stage. */
  relationsChecked: boolean;
};

export function check(loaded: Loaded): CheckResult {
  const analysis = analyze(loaded);
  const findings: Finding[] = [...loaded.findings];

  // Checking structure (L0, L1, contexts, machines).
  for (const rule of STRUCTURE_RULES) findings.push(...rule.run(analysis));

  // Checking relations (L2) under each permutation, unless an alias is missing or circular.
  const unresolvable = findings.some((f) => f.rule === "L1.alias-unresolved" || f.rule === "L1.alias-cycle");
  if (unresolvable) {
    if (loaded.relations.length > 0) {
      findings.push(
        finding("L2.skipped", `relations were not checked because an alias is missing or circular`, loaded.relations.map((r) => r.id)),
      );
    }
  } else {
    findings.push(...checkRelations(analysis));
  }

  // Checking usage (L3).
  for (const rule of USAGE_RULES) findings.push(...rule.run(analysis));

  // Reporting.
  return {
    verdict: findings.some((f) => f.severity === "error") ? "fail" : "pass",
    findings,
    permutations: analysis.permutations,
    relationsChecked: !unresolvable,
  };
}
