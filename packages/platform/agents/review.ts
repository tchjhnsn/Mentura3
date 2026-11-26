// What a person reviews before an agent's work counts. Each agenda item an agent works produces a print copy:
// a Markdown file a person can read or print and bring to a meeting, written to
// <venture>/.naive/presentations/<meeting>/<item>.md. When the person approves the item, the drafts the gate held are
// accepted in their name. A foundation record (foundation/...) is accepted only when the person names it in the
// approval, as Naive's own accept asks them to type it (EE-051).
//
//   const copy = await printCopy({ venture: "mentura" }, dir, meeting, item, ["foundation/problem (held for a person)"]);
//   const accepted = await acceptHeld({ venture: "mentura" }, ["foundation/problem"], "torian", ["foundation/problem"]);

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ventureFile } from "naive-framework/src/core/venture-paths.mjs";
import { settle } from "naive-framework/src/engine/gate-drafts.mjs";
import { call, draftOf } from "naive-framework/src/router/router.mjs";
import type { AgendaItem, Meeting } from "./meetings.ts";

type Ctx = { venture: string, workspace?: string };

const routeOf = (w: string): string => w.replace(/\s*\(held for a person\)$/, "");

/** A record as Markdown a person reads: each field a heading or a line, lists as bullets. Pure. */
export function markdownOf(value: unknown, depth = 3): string {
  if (value === null || value === undefined) return "_none_";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return value.map((v) => typeof v === "object" && v !== null ? `- ${markdownOf(v, depth + 1).replace(/\n/g, "\n  ")}` : `- ${String(v)}`).join("\n");
  return Object.entries(value as Record<string, unknown>).map(([k, v]) => {
    const label = k.replace(/[_-]/g, " ");
    return typeof v === "object" && v !== null ? `${"#".repeat(Math.min(depth, 6))} ${label}\n\n${markdownOf(v, depth + 1)}` : `**${label}:** ${markdownOf(v)}`;
  }).join("\n\n");
}

/** The content of a drafted route: the held draft when there is one, else the live record. */
async function contentOf(ctx: Ctx, route: string): Promise<{ from: "draft" | "live", value: unknown } | null> {
  const d = draftOf(route, ctx.venture, ctx.workspace);
  if (d) {
    const f = ventureFile(d.dir, d.draft);
    if (existsSync(f)) { try { return { from: "draft", value: JSON.parse(readFileSync(f, "utf8")) }; } catch { return { from: "draft", value: readFileSync(f, "utf8") }; } }
  }
  const r = await call({ venture: ctx.venture, workspace: ctx.workspace, route, action: "read", actor: "person", via: "mentura-review" });
  return r.ok && r.result !== null && r.result !== undefined ? { from: "live", value: r.result } : null;
}

/** Writes the print copy of what an item drafted and answers its path relative to the venture. */
export async function printCopy(ctx: Ctx, dir: string, m: Meeting, item: AgendaItem, drafted: string[]): Promise<string> {
  const parts = [
    `# ${m.title}: ${item.title}`, "",
    `**Goal of the meeting:** ${m.goal}`, "",
    `**Drafted by:** ${item.owner ?? "an agent"}`, "",
    `**What came of it:** ${item.result ?? ""}`, "",
  ];
  for (const w of drafted) {
    const route = routeOf(w);
    const c = await contentOf(ctx, route).catch(() => null);
    parts.push(`## ${route}${c?.from === "draft" ? " (draft, waiting for your approval)" : ""}`, "", c ? markdownOf(c.value) : "_could not be read_", "");
  }
  parts.push("---", "", `Approve: /approve ${m.id}${drafted.map(routeOf).filter((r) => r.startsWith("foundation/")).map((r) => ` ${r}`).join("")}`, `Rework: /rework ${m.id} <what to change>`, "");
  const rel = join(".naive", "presentations", m.id, `${item.id}.md`);
  const file = join(dir, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, parts.join("\n"));
  return rel;
}

/**
 * Accepts each held draft as the person. A foundation draft the person did not name in confirm is not accepted, and
 * nothing is: the whole approval throws, naming what to type, so an approval is all or none.
 */
export async function acceptHeld(ctx: Ctx, held: string[], by: string, confirm: string[]): Promise<string[]> {
  const routes = held.map(routeOf);
  const unnamed = routes.filter((r) => r.startsWith("foundation/") && !confirm.includes(r));
  if (unnamed.length) throw new Error(`a foundation record is accepted only by name: /approve <meeting> ${unnamed.join(" ")}`);
  const accepted: string[] = [];
  for (const route of routes) {
    const d = draftOf(route, ctx.venture, ctx.workspace);
    if (!d) throw new Error(`${route} is not a record route`);
    const f = ventureFile(d.dir, d.draft);
    if (!existsSync(f)) { accepted.push(`${route} (already accepted)`); continue; }
    const w = await call({ venture: ctx.venture, workspace: ctx.workspace, route: d.route, action: "write", input: JSON.parse(readFileSync(f, "utf8")), actor: "person", actor_id: by, via: "mentura-meeting",
      provenance: { activity: "accept", derived_from: [d.draft] } });
    if (!w.ok) throw new Error(`${route} was not accepted: ${w.error}`);
    // As Naive's own accept does: removes the draft, its variants and sidecar.
    settle(d.dir, d.draft, { picked: "a", by });
    accepted.push(route);
  }
  return accepted;
}
