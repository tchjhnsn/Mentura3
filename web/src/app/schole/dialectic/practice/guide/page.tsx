import type { Metadata } from "next";
import { GUIDELINES_VERSION, MOVES, STASES, krippendorffAlpha, type Kind } from "@reflect/core/argument-practice";
import { DIALOGUES, DRAFTS } from "@reflect/core/practice-settled";
import { ThingHeader } from "@/components/headers";
import { answersOn, turnsOf } from "@/server/practice";
import { LEARN } from "../../../crumbs";

export const metadata: Metadata = { title: "Practice guidelines" };
export const dynamic = "force-dynamic";

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** The guidelines: each answer in a sentence, with examples from Euthyphro, the sources, and agreement so far. */
export default async function GuidePage() {
  const turns = turnsOf("euthyphro") ?? [];
  const examples = (kind: Kind, id: string) => DRAFTS.filter((d) => d.kind === kind && d.answer === id).slice(0, 2).map((d) => turns[d.n]).filter(Boolean);
  const all = (await Promise.all(DIALOGUES.map((d) => answersOn(d.id)))).flat();
  const alpha = (k: Kind) => {
    const a = all.filter((x) => x.kind === k);
    const v = krippendorffAlpha(a);
    return a.length >= 20 && v !== null ? v.toFixed(2) : null;
  };
  const section = (kind: Kind, title: string, intro: string, choices: typeof MOVES) => (
    <section className="space-y-4" aria-labelledby={`g-${kind}`}>
      <div className="space-y-1">
        <h2 id={`g-${kind}`} className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-[15px]">{intro}{alpha(kind) ? ` Agreement so far (Krippendorff's alpha): ${alpha(kind)}.` : ""}</p>
      </div>
      {choices.map((c) => (
        <div key={c.id} className="space-y-1.5">
          <h3 className="font-semibold">{c.label}</h3>
          <p className="text-[15px]">{c.means}</p>
          {examples(kind, c.id).map((t) => <p key={t!.n} className="text-muted-foreground border-l-2 pl-3 text-sm"><span className="font-medium">{cap(t!.speaker)}:</span> {t!.text.length > 220 ? `${t!.text.slice(0, 220)}...` : t!.text}</p>)}
        </div>
      ))}
    </section>
  );
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-6">
      <ThingHeader back="/schole/dialectic/practice" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }, { label: "Course", href: "/schole/courses/dialectic" }, { label: "Practice", href: "/schole/dialectic/practice" }]} title="Guidelines" />
      <div className="mt-6 space-y-10">
        <header className="space-y-2">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">Guidelines</h1>
          <p className="text-muted-foreground">What each answer means. A turn is one speaker&apos;s words until the next speaker begins. If you cannot tell, choose Not sure: it counts as no answer, and a guess makes the map worse.</p>
        </header>
        {section("move", "What is the speaker doing here?", "Pick what the turn does in the argument, not whether it is right.", MOVES)}
        <section className="space-y-1.5" aria-labelledby="g-target">
          <h2 id="g-target" className="text-xl font-semibold tracking-tight">Which earlier turn does this answer?</h2>
          <p className="text-[15px]">Asked of a reason, an attack or a granted point. Pick the turn it supports, attacks or grants, from the three before it, or None of them when it answers something further back.</p>
        </section>
        {section("stasis", "What is in question here?", "The point at issue, as the Greek and Roman teachers of rhetoric sorted it.", STASES)}
        <footer className="text-muted-foreground space-y-1 border-t pt-4 text-xs">
          <p>Moves follow the Argument Interchange Format and Inference Anchoring Theory (Centre for Argument Technology, University of Dundee). Stasis follows Cicero, On Invention 1.10, and Quintilian, Institutio Oratoria 3.6.</p>
          <p>Texts: Plato, translated by Benjamin Jowett, from Project Gutenberg. Guidelines version {GUIDELINES_VERSION}.</p>
        </footer>
      </div>
    </main>
  );
}
