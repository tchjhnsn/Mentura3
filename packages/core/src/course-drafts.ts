// Courses drafted in Ask Reflect: a title, a goal and units, each unit with the works it reads and passages chosen
// from texts Reflect holds. A passage is kept as a reference to its place in the held text (a book's chapter and
// paragraph, or a moment in a transcript), never as words a model wrote; the words shown are cut from the held text
// by the server. The course is kept the way the piano course is: a learn item (medium course) whose plan rides on
// its notes, so no table of its own. Examiners stay people: a drafted course has no grades and no quizzes.

/** Where a passage sits in a text Reflect holds. */
export type PassageRef =
  /** A book read in Reflect: its Open Library work, the chapter (from 1) and the paragraph (from 0). */
  | { kind: "book"; work: string; chapter: number; p: number }
  /** A transcript the person pasted for a learn item: the item and the second the passage starts at. */
  | { kind: "transcript"; item: string; at: number };

/** A work a unit reads: a book by its Open Library work, or one of the person's learn items. */
export type WorkRef = { kind: "book"; work: string; title: string; author: string } | { kind: "item"; item: string; title: string; by: string | null };

/** A passage as the course keeps it: its place, the words cut from the held text, and whom the text comes from. */
export type KeptPassage = { ref: PassageRef; text: string; cite: string; source: string; href: string };
export type CourseUnit = { title: string; works: WorkRef[]; passages: KeptPassage[] };
export type CoursePlan = { goal: string; units: CourseUnit[] };

/** A note row on a learn item, as the store keeps it. */
export type PlanNote = { unit: string; quote: string | null; note: string };

export const WORK_ID = /^OL\d+W$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const whole = (n: unknown, lo: number, hi: number): n is number => typeof n === "number" && Number.isInteger(n) && n >= lo && n <= hi;

/** A passage reference checked again (it came from a model), or null. */
export function cleanRef(raw: unknown): PassageRef | null {
  const r = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  if (!r) return null;
  if (r.kind === "book" && typeof r.work === "string" && WORK_ID.test(r.work) && whole(r.chapter, 1, 10000) && whole(r.p, 0, 100000)) return { kind: "book", work: r.work, chapter: r.chapter, p: r.p };
  if (r.kind === "transcript" && typeof r.item === "string" && UUID.test(r.item) && whole(r.at, 0, 100000)) return { kind: "transcript", item: r.item, at: r.at };
  return null;
}

export const refKey = (r: PassageRef) => (r.kind === "book" ? `book:${r.work}:${r.chapter}:${r.p}` : `transcript:${r.item}:${r.at}`);

/** The reading page at a passage: the book's chapter, scrolled to the paragraph, with the words marked when given. */
export function readHref(work: string, chapter: number, p: number, find?: string): string {
  return `/schole/works/${work}/read?c=${chapter}${find ? `&find=${encodeURIComponent(find)}` : ""}&p=${p}`;
}

/** The longest passage shown: a paragraph past it is cut around the words looked for. */
export const PASSAGE_MAX = 700;

/**
 * A paragraph as a passage: whole when it is short, else cut to `max` characters around the character `at` (where the
 * words looked for start), at word boundaries, with an ellipsis where it was cut. The words are the held text's own.
 */
export function clipPassage(paragraph: string, at = 0, max = PASSAGE_MAX): string {
  const t = paragraph.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const centre = Math.min(Math.max(0, at), t.length);
  let a = Math.max(0, Math.min(centre - Math.floor(max / 3), t.length - max));
  let b = Math.min(t.length, a + max);
  if (a > 0) a = t.indexOf(" ", a) + 1 || a;
  if (b < t.length) b = t.lastIndexOf(" ", b) > a ? t.lastIndexOf(" ", b) : b;
  return `${a > 0 ? "…" : ""}${t.slice(a, b).trim()}${b < t.length ? "…" : ""}`;
}

// A drafted course is a learn item whose link is its own page in Reflect.
export const MADE_PATH = "/schole/courses/made/";
export const madeCourseHref = (key: string) => `${MADE_PATH}${key}`;

/** The key of a drafted course from its learn item's link, or null when the link is not a drafted course's. */
export function madeCourseKey(url: string | null | undefined): string | null {
  if (!url) return null;
  let path: string;
  try { path = new URL(url).pathname; } catch { return null; }
  const key = path.startsWith(MADE_PATH) ? path.slice(MADE_PATH.length).replace(/\/$/, "") : "";
  return UUID.test(key) ? key : null;
}

/** At most this many units, works a unit and passages a unit. */
export const LIMITS = { units: 12, works: 6, passages: 6 } as const;

/**
 * A plan as note rows: the goal first, then for each unit its title and works, then its passages, each passage's
 * words in the note's quote. Each row says which unit and place it holds, so the order does not depend on the store's.
 */
export function planNotes(plan: CoursePlan): PlanNote[] {
  const out: PlanNote[] = [{ unit: "goal", quote: null, note: JSON.stringify({ kind: "goal", goal: plan.goal }) }];
  plan.units.forEach((u, n) => {
    out.push({ unit: `unit ${n + 1}`, quote: null, note: JSON.stringify({ kind: "unit", n, title: u.title, works: u.works }) });
    u.passages.forEach((p, i) => out.push({ unit: `unit ${n + 1}`, quote: p.text, note: JSON.stringify({ kind: "passage", n, i, ref: p.ref, cite: p.cite, source: p.source, href: p.href }) }));
  });
  return out;
}

const parse = (s: string | null): Record<string, unknown> | null => {
  try {
    const v = s ? (JSON.parse(s) as unknown) : null;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** A plan read back from its note rows; rows that are not a plan's are left out, and so is a passage whose reference no longer checks. */
export function readPlan(notes: readonly { quote: string | null; note: string | null }[]): CoursePlan {
  let goal = "";
  const units: (CourseUnit & { at: number })[] = [];
  const passages: { n: number; i: number; p: KeptPassage }[] = [];
  for (const row of notes) {
    const x = parse(row.note);
    if (!x) continue;
    if (x.kind === "goal") goal = str(x.goal);
    else if (x.kind === "unit" && whole(x.n, 0, 1000)) {
      const works = (Array.isArray(x.works) ? x.works : []).filter((w): w is WorkRef => Boolean(w && typeof w === "object" && ((w as WorkRef).kind === "book" || (w as WorkRef).kind === "item") && typeof (w as WorkRef).title === "string"));
      units.push({ at: x.n, title: str(x.title), works, passages: [] });
    } else if (x.kind === "passage" && whole(x.n, 0, 1000) && whole(x.i, 0, 1000)) {
      const ref = cleanRef(x.ref);
      if (ref && row.quote) passages.push({ n: x.n, i: x.i, p: { ref, text: row.quote, cite: str(x.cite), source: str(x.source), href: str(x.href) } });
    }
  }
  units.sort((a, b) => a.at - b.at);
  for (const p of passages.sort((a, b) => a.i - b.i)) units.find((u) => u.at === p.n)?.passages.push(p.p);
  return { goal, units: units.map(({ at: _at, ...u }) => u) };
}
