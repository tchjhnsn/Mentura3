import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SCHEMES, accuracy, choicesFor, combine, cqText, drawSession, issueKey, itemsFor, parseCq, unitKey, type Kind } from "@reflect/core/argument-practice";
import { DIALOGUES, ISSUES, isDialogue } from "@reflect/core/practice-settled";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { answersOn, locate, settledOf, textOf } from "@/server/practice";
import { LEARN } from "../../../crumbs";
import { Session, type Step } from "./session";

export const metadata: Metadata = { title: "Practice" };
export const dynamic = "force-dynamic";

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const QUESTION: Record<Kind, string> = {
  act: "What do the marked words do?",
  relation: "How do the marked words bear on another statement?",
  target: "Which statement do they bear on?",
  stasis: "What is in question?",
  scheme: "What kind of argument is this?",
  cq: "",
};

/**
 * A session of ten questions on one dialogue (guide "Dialectic practice: tagging arguments", second guidelines): three
 * settled and seven open, shuffled by the session's seed so a reload keeps the same order. A first session opens on a
 * settled item. Each question is asked of one sentence, marked in its turn.
 */
export default async function PracticeSessionPage({ params, searchParams }: { params: Promise<{ work: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { work } = await params;
  if (!isDialogue(work)) notFound();
  const d = DIALOGUES.find((x) => x.id === work)!;
  const raw = (await searchParams).s;
  const seed = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(seed) || seed <= 0) redirect(`/schole/dialectic/practice/${work}?s=${Math.floor(Math.random() * 1e9) + 1}`);
  const text = textOf(work);
  if (!text) notFound();
  const { turns, units } = text;
  const [answers, settled] = [await answersOn(work), settledOf(work)];
  const acc = accuracy(answers, settled);
  const items = itemsFor(work, units, ISSUES[work], answers, settled, acc);
  const first = !answers.some((a) => a.user === user.id);
  const session = drawSession({ items, settled, answers, user: user.id, seed, firstSettled: first });
  // The relation a unit is known to have, so a target question can say what it is looking for.
  const knownOf = (key: string, kind: "act" | "relation") => {
    const s = settled.find((x) => x.key === key && x.kind === kind);
    if (s) return s.answer;
    const c = combine({ key, kind }, answers, acc, choicesFor(kind).map((x) => x.id));
    return c && c.n >= 5 ? c.answer : null;
  };
  const VERB: Record<string, string> = { supports: "support", rebuts: "rebut", undermines: "undermine", undercuts: "undercut", rephrases: "rephrase", agreeing: "agree with", challenging: "challenge", retracting: "take back" };
  const steps: Step[] = session.flatMap((i): Step[] => {
    const where = locate(work, i.key);
    if (!where) return [];
    if (where.issue) {
      const t = turns[where.issue.at]!;
      return [{
        key: issueKey(work, where.issue.id), kind: i.kind, question: QUESTION.stasis, issue: where.issue.question, note: null,
        turn: { speaker: cap(t.speaker), parts: [{ text: t.text, marked: false }] }, before: [],
        choices: choicesFor("stasis"),
      }];
    }
    const u = where.unit!;
    const t = turns[u.n]!;
    const parts = units.filter((x) => x.n === u.n).map((x) => ({ text: x.text, marked: x.u === u.u }));
    const cq = i.kind === "cq" ? parseCq(i.key) : null;
    const verb = i.kind === "target" ? VERB[knownOf(unitKey(work, u), "relation") ?? ""] ?? VERB[knownOf(unitKey(work, u), "act") ?? ""] : null;
    const question = i.kind === "cq" ? cqText(i.key) ?? "" : verb ? `Which statement do they ${verb}?` : QUESTION[i.kind];
    return [{
      key: i.key, kind: i.kind, question, issue: null,
      note: cq ? `A critical question for an argument ${SCHEMES.find((s) => s.id === cq.scheme)?.label.toLowerCase() ?? ""}.` : null,
      turn: { speaker: cap(t.speaker), parts },
      before: turns.slice(Math.max(0, t.n - 2), t.n).map((b) => ({ speaker: cap(b.speaker), text: b.text })),
      choices: choicesFor(i.kind, { units, at: where.index, work, key: i.key }),
    }];
  });
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-6">
      <ThingHeader back="/schole/dialectic/practice" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }, { label: "Course", href: "/schole/courses/dialectic" }, { label: "Practice", href: "/schole/dialectic/practice" }]} title={d.title} />
      <h1 id="page-title" className="sr-only">Practice: {d.title}</h1>
      <Session work={work} title={d.title} audiobook={d.audiobook} steps={steps} />
    </main>
  );
}
