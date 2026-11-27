// What must be finished before a workflow may start, and whether it is. This applies to people and agents alike, and
// it fails closed. A meeting that walks a workflow does not open, and none of its items is worked, until every
// prerequisite is met. Two sources apply, and every entry of both must hold:
//   Naive's verdict (EE-217): the workflow's own `requires`, the venture's prerequisites config and the overrides a
//     person made, judged by Naive's prerequisitesOf. Mentura never judges those itself (naiveMissing below).
//   Mentura's policy (prerequisites.json): its opinion on top, and the only source for site/<role>, which Naive has no
//     workflow for. Every matching rule applies.
//
//   const check = await prerequisitesOf("marketing-and-sales/weekly-pipeline-review", routerLookup({ venture: "mentura" }, dir), { naive: () => naiveMissing(dir, "marketing-and-sales/weekly-pipeline-review") });
//   // { met: false, missing: [{ kind: "meeting", what: "marketing-and-sales/intake", why: "...", fix: "/meet marketing-and-sales intake" }] }
//
// What counts as met:
//   meeting  <function>/<workflow>: a meeting that walked it is closed with outcome.reached "yes". Partly or no leaves it locked.
//   record   a route, or <collection>/* for at least one item, that is live. A draft held for a person is not live.
//   decision an id under decisions/ whose status is decided.
// An entry that cannot be checked counts as missing, and so does a policy that cannot be read.

import { existsSync, readFileSync } from "node:fs";
import { call } from "naive-framework/src/router/router.mjs";
import { prerequisitesOf as naivePrerequisitesOf } from "naive-framework/src/engine/prerequisites.mjs";
import { meetingsIn, type Meeting } from "./meetings.ts";

export interface Requires { records?: string[], meetings?: string[], decisions?: string[] }
export interface Rule { workflow: string, except?: string[], why: string, requires: Requires }
export interface Policy { rules: Rule[] }
export interface Missing { kind: "meeting" | "record" | "decision" | "policy", what: string, why: string, fix: string }
export interface Check { workflow: string, met: boolean, missing: Missing[] }

/** How prerequisites are looked up. The production lookup reads through Naive's router; tests pass a fixed one. */
export interface Lookup {
  /** "live" when the record (or, for <collection>/*, at least one item) is live; "draft" when only a held draft exists. */
  record(route: string): Promise<"live" | "draft" | "none">,
  meetings(): Meeting[],
  decision(id: string): Promise<string | null>,
}

const POLICY = new URL("./prerequisites.json", import.meta.url);

/** The shipped policy. Throws when it cannot be read, so a caller fails closed. */
export function policy(file: URL | string = POLICY): Policy {
  const p = JSON.parse(readFileSync(file, "utf8")) as Policy;
  if (!Array.isArray(p.rules)) throw new Error("prerequisites.json has no rules");
  return p;
}

/** Whether a `<function>/<workflow>` pattern (either part may be *) matches a workflow. Pure. */
export function matches(pattern: string, workflow: string): boolean {
  const [pf, pw] = pattern.split("/"), [f, w] = workflow.split("/");
  return (pf === "*" || pf === f) && (pw === "*" || pw === w);
}

/** Everything Mentura's policy requires of a workflow, with the reason for each entry. It never requires its own meeting. Pure. */
export function requiresOf(workflow: string, p: Policy): { kind: Missing["kind"], what: string, why: string }[] {
  const fn = workflow.split("/")[0];
  const out = new Map<string, { kind: Missing["kind"], what: string, why: string }>();
  const add = (r: Requires, why: string): void => {
    for (const [kind, list] of [["meeting", r.meetings], ["record", r.records], ["decision", r.decisions]] as const) {
      for (const raw of list ?? []) {
        const what = raw.replaceAll("<function>", fn);
        if (kind === "meeting" && what === workflow) continue;
        const key = `${kind}:${what}`;
        if (!out.has(key)) out.set(key, { kind, what, why });
      }
    }
  };
  for (const rule of p.rules) if (matches(rule.workflow, workflow) && !(rule.except ?? []).some((e) => matches(e, workflow))) add(rule.requires, rule.why);
  return [...out.values()];
}

const fixOf = (kind: Missing["kind"], what: string, state?: string): string => {
  if (kind === "meeting") return `/meet ${what.replace("/", " ")}, and close it with its outcome reached`;
  if (kind === "record") return state === "draft" ? `approve the held draft of ${what} in its meeting (/approve), or mentura accept ${what.replace(/\/\*$/, "")}` : `draft ${what} in a meeting and approve it`;
  if (kind === "decision") return `decide decisions/${what}`;
  return "fix prerequisites.json";
};

/**
 * What Naive's verdict (EE-217) says blocks a workflow, as Mentura's entries. Never throws: a verdict that cannot be
 * reached is one missing entry, so the lock holds.
 */
export function naiveMissing(dir: string, workflow: string): Missing[] {
  try {
    const v = naivePrerequisitesOf(dir, workflow);
    return v.met ? [] : v.missing.map((m) => ({ kind: m.kind, what: m.ref, why: `Naive: ${m.why}.`, fix: fixOf(m.kind, m.ref) }));
  }
  catch (e) { return [{ kind: "policy", what: workflow, why: `Naive's prerequisites cannot be read: ${String((e as Error)?.message ?? e)}`, fix: "run naive blocked to see why" }]; }
}

/**
 * Whether a workflow may start now: Mentura's policy, plus Naive's verdict when `naive` is given. An entry both name
 * is listed once, with Naive's reason. Never throws: what it cannot check is missing.
 */
export async function prerequisitesOf(workflow: string, look: Lookup, o: { naive?: () => Missing[], policy?: Policy } = {}): Promise<Check> {
  const fromNaive = o.naive ? o.naive() : [];
  let p: Policy;
  try { p = o.policy ?? policy(); if (!Array.isArray(p.rules)) throw new Error("it has no rules"); }
  catch (e) { return { workflow, met: false, missing: [...fromNaive, { kind: "policy", what: "prerequisites.json", why: `the policy cannot be read: ${String((e as Error)?.message ?? e)}`, fix: fixOf("policy", "") }] }; }
  const missing: Missing[] = [...fromNaive];
  const named = new Set(fromNaive.map((m) => `${m.kind}:${m.what}`));
  let meetings: Meeting[] | null = null;
  for (const r of requiresOf(workflow, p)) {
    if (named.has(`${r.kind}:${r.what}`)) continue;
    try {
      if (r.kind === "meeting") {
        meetings ??= look.meetings();
        const ok = meetings.some((m) => m.workflow === r.what && m.status === "closed" && m.outcome?.reached === "yes");
        if (!ok) {
          const last = meetings.find((m) => m.workflow === r.what);
          missing.push({ ...r, why: `${r.why} ${last ? `Its last meeting (${last.id}) is ${last.status}${last.outcome ? `, outcome ${last.outcome.reached}` : ""}.` : "It has never met."}`, fix: fixOf("meeting", r.what) });
        }
      }
      else if (r.kind === "record") {
        const state = await look.record(r.what);
        if (state !== "live") missing.push({ ...r, why: `${r.why} ${state === "draft" ? "It is drafted but no person has approved it." : "It does not exist yet."}`, fix: fixOf("record", r.what, state) });
      }
      else {
        const status = await look.decision(r.what);
        if (status !== "decided") missing.push({ ...r, why: `${r.why} It is ${status ?? "not filed"}.`, fix: fixOf("decision", r.what) });
      }
    }
    catch (e) { missing.push({ ...r, why: `${r.why} It could not be checked: ${String((e as Error)?.message ?? e)}`, fix: fixOf(r.kind, r.what) }); }
  }
  return { workflow, met: missing.length === 0, missing };
}

/** The production lookup: reads through Naive's router as a person would, so only live records count. */
export function routerLookup(ctx: { venture: string, workspace?: string }, dir: string): Lookup {
  const read = (route: string) => call({ venture: ctx.venture, workspace: ctx.workspace, route, action: "read", actor: "person", via: "mentura-prerequisites" });
  return {
    async record(route) {
      const collection = route.endsWith("/*");
      const base = collection ? route.slice(0, -2) : route;
      const r = await read(base);
      if (!r.ok) throw new Error(r.error ?? `cannot read ${base}`);
      const live = collection ? !!r.result && typeof r.result === "object" && Object.keys(r.result as object).length > 0 : r.result !== null && r.result !== undefined;
      if (live) return "live";
      return r.pending_draft || (collection && existsSync(`${dir}/_drafts/${base}`)) ? "draft" : "none";
    },
    meetings: () => meetingsIn(dir),
    async decision(id) {
      const r = await read(`decisions/${id}`);
      return r.ok && r.result && typeof r.result === "object" ? String((r.result as { status?: unknown }).status ?? "open") : null;
    },
  };
}

/** One line per missing prerequisite, for a person. Pure. */
export function explain(c: Check): string {
  if (c.met) return `${c.workflow} may start.`;
  return [`${c.workflow} is locked until:`, ...c.missing.map((m) => `- ${m.kind} ${m.what}: ${m.why} Next: ${m.fix}.`)].join("\n");
}
