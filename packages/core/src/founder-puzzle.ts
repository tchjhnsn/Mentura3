// A founder's puzzle report (`naive.founder-puzzle-source` v1: the prompt a founder pastes into the AI assistant they
// talk to most, which answers with what it knows of them) read as person attributes. Every attribute comes in as an
// import, proposed until the person confirms it: an assistant's reading is never the person's word (Torian,
// 2026-10-30: the founder's rating wins; 2026-11-20: telos, ambitions and the rest belong in the person schema). The
// puzzle statement is a puzzle attribute; open questions and alternatives stay in the report. The report stays
// confidential to the person: nothing here publishes. Pure: no I/O.
import { CONFIDENCES, isoDate, type Attribute, type AttributeKind, type Confidence, type IsoDate } from "./person.ts";

/** The report's attribute lists and the kind each becomes. */
export const PUZZLE_LISTS: Record<string, AttributeKind> = {
  telos: "telos",
  ambitions: "ambition",
  passions: "passion",
  values: "value",
  strengths: "strength",
  weaknesses: "weakness",
  puzzles: "puzzle",
  "unfair-advantages": "unfair-advantage",
  constraints: "constraint",
};

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const conf = (v: unknown): Confidence | undefined => CONFIDENCES.find((c) => c === v);

/** The report's assistant and day, as the import's name, such as "founder's puzzle, Claude, 2026-10-30". */
export function puzzleSourceName(report: Record<string, unknown>): string {
  const by = (report.reported_by ?? {}) as Record<string, unknown>;
  return ["founder's puzzle", str(by.assistant), str(by.reported_at)].filter(Boolean).join(", ");
}

/**
 * The attributes a report proposes, each an import (name: the report, item: where in it) and proposed. Throws when
 * the text is not a founder's puzzle report.
 */
export function attributesFromPuzzle(raw: unknown, at: IsoDate): Attribute[] {
  const r = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!r || r.kind !== "naive.founder-puzzle-source" || r.version !== 1) throw new Error("not a founder's puzzle report (kind naive.founder-puzzle-source, version 1)");
  const name = puzzleSourceName(r);
  const day = isoDate(String((r.reported_by as Record<string, unknown> | undefined)?.reported_at ?? "")) ?? at;
  const out: Attribute[] = [];
  const add = (kind: AttributeKind, text: string, item: string, evidence?: string | null, confidence?: Confidence) =>
    out.push({ kind, text, validFrom: day, validTo: null, recordedAt: at, source: { kind: "import", name, item, status: "proposed" }, status: "proposed", ...(evidence ? { evidence } : {}), ...(confidence ? { confidence } : {}) });
  const puzzle = (r.puzzle ?? {}) as Record<string, unknown>;
  const statement = str(puzzle.statement);
  if (statement) add("puzzle", statement, "puzzle.statement", str(puzzle.why), conf(puzzle.confidence));
  const attrs = (r.attributes ?? {}) as Record<string, unknown>;
  for (const [list, kind] of Object.entries(PUZZLE_LISTS)) {
    const items = Array.isArray(attrs[list]) ? (attrs[list] as unknown[]) : [];
    items.forEach((x, i) => {
      const o = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
      const text = str(o.text);
      if (text) add(kind, text, `attributes.${list}[${i}]`, str(o.evidence), conf(o.confidence));
    });
  }
  return out;
}
