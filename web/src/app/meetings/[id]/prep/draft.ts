// "Draft my prep" (design guide, Meeting prep): the words a model is asked, how its reply is read, and how the draft
// joins what the host already wrote. Pure, so it is tested without a model. A draft never holds facts about the
// other person: those need real sources, which a model cannot give.
import type { MeetingPrep } from "@reflect/core/meetings";

/** What a model drafts: key points, questions with answers, and notes for assets. */
export type PrepDraft = {
  keyPoints: string[];
  questions: { question: string; answer: string }[];
  assets: { name: string; notes: string }[];
};

/** What the draft is written from: the meeting's own fields, and its venture when it has one. */
export type DraftSource = { title: string; agenda: string | null; minutes: number; venture: { name: string; what?: string } | null };

export const MAX_POINTS = 5;

export function draftPrompt(s: DraftSource): string {
  return [
    "You help a founder prepare for a meeting they host, often with an investor. Draft their prep from what is below only.",
    "",
    `Meeting: ${s.title}`,
    `Length: ${s.minutes} minutes`,
    s.agenda ? `Agenda:\n${s.agenda}` : "Agenda: none given",
    s.venture ? `Venture: ${s.venture.name}${s.venture.what ? `. ${s.venture.what}` : ""}` : "",
    "",
    "Reply with JSON only, in this shape:",
    '{"keyPoints": ["..."], "questions": [{"question": "...", "answer": "..."}], "assets": [{"name": "...", "notes": "..."}]}',
    "",
    "- keyPoints: three to five points the host must make, each one short sentence.",
    "- questions: six to ten questions or objections the other side is likely to raise, each with a first answer the host can rework. Where you do not know a number or fact, say what the host should fill in, in brackets.",
    "- assets: the things the host may show (such as Deck, One-pager, Use of funds, Demo), each with short presenter notes.",
    "- Do not write anything about the other person or the investor: facts about them need real sources.",
    "- Write plain sentences. No em dashes. Do not invent figures.",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
}

const plain = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim().slice(0, max) : "";

/** A model's reply read as a draft (its first JSON object), with every part cleaned and bounded; null when unreadable. */
export function readDraft(text: string): PrepDraft | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let v: unknown;
  try { v = JSON.parse(text.slice(start, end + 1)); } catch { return null; }
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const list = (x: unknown) => (Array.isArray(x) ? x : []);
  const rec = (x: unknown) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {});
  const draft: PrepDraft = {
    keyPoints: list(o.keyPoints).map((p) => plain(p, 500)).filter(Boolean).slice(0, MAX_POINTS),
    questions: list(o.questions).map((q) => ({ question: plain(rec(q).question, 1000), answer: plain(rec(q).answer, 4000) })).filter((q) => q.question).slice(0, 20),
    assets: list(o.assets).map((a) => ({ name: plain(rec(a).name, 200), notes: plain(rec(a).notes, 4000) })).filter((a) => a.name).slice(0, 10),
  };
  return draft.keyPoints.length || draft.questions.length || draft.assets.length ? draft : null;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The prep with the draft joined in, deleting nothing the host wrote: key points are added (not repeated) up to five,
 * questions not already there are added unrehearsed, a drafted answer fills only an empty one, a drafted asset's notes
 * fill only empty notes, and new assets are added without a link. Facts and the checklist are left as they are.
 */
export function mergeDraft(prep: MeetingPrep, draft: PrepDraft, newId: () => string): MeetingPrep {
  const keyPoints = [...prep.keyPoints];
  for (const p of draft.keyPoints) if (keyPoints.length < MAX_POINTS && !keyPoints.some((k) => same(k, p))) keyPoints.push(p);
  const questions = prep.questions.map((q) => ({ ...q }));
  for (const d of draft.questions) {
    const had = questions.find((q) => same(q.question, d.question));
    if (!had) questions.push({ id: newId(), question: d.question, answer: d.answer, rehearsed: false });
    else if (!had.answer.trim()) had.answer = d.answer;
  }
  const assets = prep.assets.map((a) => ({ ...a }));
  for (const d of draft.assets) {
    const had = assets.find((a) => same(a.name, d.name));
    if (!had) assets.push({ id: newId(), name: d.name, url: null, notes: d.notes });
    else if (!had.notes.trim()) had.notes = d.notes;
  }
  return { ...prep, keyPoints, questions: questions.slice(0, 100), assets: assets.slice(0, 30) };
}

/** Whether the host has no points, questions or assets yet (facts and the checklist do not count): the page then
 * offers "Draft my prep" first. */
export const prepIsEmpty = (p: MeetingPrep) => !p.keyPoints.length && !p.questions.length && !p.assets.length;
