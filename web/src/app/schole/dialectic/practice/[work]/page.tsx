import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DIALOGUES, isDialogue } from "@reflect/core/practice-settled";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { gameOf, textOf } from "@/server/practice";
import { LEARN } from "../../../crumbs";
import { Game } from "./game";

export const metadata: Metadata = { title: "Annotate" };
export const dynamic = "force-dynamic";

/**
 * A game on one dialogue (Torian, 2026-11-16 22:56Z to 23:08Z): five rounds, each a passage to annotate, rounds with
 * known sentences first, in an order fixed by the seed so a reload keeps it.
 */
export default async function GamePage({ params, searchParams }: { params: Promise<{ work: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { work } = await params;
  if (!isDialogue(work) || !textOf(work)) notFound();
  const d = DIALOGUES.find((x) => x.id === work)!;
  const raw = (await searchParams).s;
  const seed = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(seed) || seed <= 0) redirect(`/schole/dialectic/practice/${work}?s=${Math.floor(Math.random() * 1e9) + 1}`);
  const rounds = await gameOf(work, user.id, seed);
  return (
    <main className="mx-auto w-full max-w-xl px-6 pt-6 pb-48">
      <ThingHeader back="/schole/dialectic/practice" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }, { label: "Course", href: "/schole/courses/dialectic" }, { label: "Annotate", href: "/schole/dialectic/practice" }]} title={d.title} />
      <h1 id="page-title" className="sr-only">Annotate: {d.title}</h1>
      <Game work={work} title={d.title} audiobook={d.audiobook} rounds={rounds} />
    </main>
  );
}
