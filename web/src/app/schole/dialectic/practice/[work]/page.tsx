import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { accuracy, choicesFor, drawSession, itemsFor, turnKey } from "@reflect/core/argument-practice";
import { DIALOGUES, isDialogue } from "@reflect/core/practice-settled";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { answersOn, settledOf, turnsOf } from "@/server/practice";
import { LEARN } from "../../../crumbs";
import { Session, type Step } from "./session";

export const metadata: Metadata = { title: "Practice" };
export const dynamic = "force-dynamic";

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/**
 * A session of ten questions on one dialogue (guide "Dialectic practice: tagging arguments"): three settled and seven
 * open, shuffled by the session's seed so a reload keeps the same order. A first session opens on a settled item.
 */
export default async function PracticeSessionPage({ params, searchParams }: { params: Promise<{ work: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { work } = await params;
  if (!isDialogue(work)) notFound();
  const d = DIALOGUES.find((x) => x.id === work)!;
  const raw = (await searchParams).s;
  const seed = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(seed) || seed <= 0) redirect(`/schole/dialectic/practice/${work}?s=${Math.floor(Math.random() * 1e9) + 1}`);
  const turns = turnsOf(work);
  if (!turns) notFound();
  const [answers, settled] = [await answersOn(work), settledOf(work)];
  const acc = accuracy(answers, settled);
  const items = itemsFor(work, turns, answers, settled, acc);
  const first = !answers.some((a) => a.user === user.id);
  const session = drawSession({ items, settled, answers, user: user.id, seed, firstSettled: first });
  const byKey = new Map(turns.map((t) => [turnKey(work, t), t]));
  const steps: Step[] = session.map((i) => {
    const t = byKey.get(i.key)!;
    const question = i.kind === "move" ? `What is ${cap(t.speaker)} doing here?` : i.kind === "target" ? "Which earlier turn does this answer?" : "What is in question here?";
    return {
      key: i.key, kind: i.kind, question,
      turn: { speaker: cap(t.speaker), text: t.text },
      before: turns.slice(Math.max(0, t.n - 2), t.n).map((b) => ({ speaker: cap(b.speaker), text: b.text })),
      choices: choicesFor(i.kind, turns, t.n, work).map((c) => ({ id: c.id, label: c.label, means: c.means })),
    };
  });
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-6">
      <ThingHeader back="/schole/dialectic/practice" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }, { label: "Practice", href: "/schole/dialectic/practice" }]} title={d.title} />
      <h1 id="page-title" className="sr-only">Practice: {d.title}</h1>
      <Session work={work} title={d.title} audiobook={d.audiobook} steps={steps} />
    </main>
  );
}
