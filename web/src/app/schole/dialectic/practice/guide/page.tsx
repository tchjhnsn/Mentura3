import type { Metadata } from "next";
import { ACTS, CQ_ANSWERS, GUIDELINES_VERSION, RELATIONS, SCHEMES, STASES, krippendorffAlpha, placeOf, type Choice, type Kind } from "@reflect/core/argument-practice";
import { DIALOGUES, DRAFTS, ISSUES } from "@reflect/core/practice-settled";
import { ThingHeader } from "@/components/headers";
import { answersOn, textOf } from "@/server/practice";
import { LEARN } from "../../../crumbs";

export const metadata: Metadata = { title: "Practice guidelines" };
export const dynamic = "force-dynamic";

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/**
 * The guidelines (second version, 2026-11-16 22:33Z): what each answer means, with examples from Euthyphro, the kinds
 * of argument and their critical questions, the sources, and agreement so far.
 */
export default async function GuidePage() {
  const units = textOf("euthyphro")?.units ?? [];
  const byPlace = new Map(units.map((x) => [placeOf(x), x]));
  const examples = (kind: Kind, id: string) => DRAFTS.filter((d) => d.kind === kind && d.answer === id).slice(0, 2).map((d) => byPlace.get(d.at.split("~")[0]!)).filter((x) => !!x);
  const all = (await Promise.all(DIALOGUES.map((d) => answersOn(d.id)))).flat();
  const alpha = (k: Kind) => {
    const a = all.filter((x) => x.kind === k);
    const v = krippendorffAlpha(a);
    return a.length >= 20 && v !== null ? v.toFixed(2) : null;
  };
  const section = (kind: Kind, title: string, intro: string, choices: readonly Choice[]) => (
    <section className="space-y-4" aria-labelledby={`g-${kind}`}>
      <div className="space-y-1">
        <h2 id={`g-${kind}`} className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-[15px]">{intro}{alpha(kind) ? ` Agreement so far (Krippendorff's alpha): ${alpha(kind)}.` : ""}</p>
      </div>
      {choices.map((c) => (
        <div key={c.id} className="space-y-1.5">
          <h3 className="font-semibold">{c.label}</h3>
          <p className="text-[15px]">{c.means}</p>
          {examples(kind, c.id).map((x) => <p key={placeOf(x)} className="text-muted-foreground border-l-2 pl-3 text-sm"><span className="font-medium">{cap(x.speaker)}:</span> {x.text.length > 220 ? `${x.text.slice(0, 220)}...` : x.text}</p>)}
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
          <p className="text-muted-foreground">How to play: pick a highlighter and tap a sentence to mark what its words do; tap it again to clear. With Link, tap a marked sentence, choose how it bears on another, then tap that one. Press Done to see how you did. Green is a match with a known answer, amber is where careful readers split and yours is one reading that stands, red is a miss with the known answer beside it, and a dashed line is a known sentence you left unmarked. Marks on sentences nothing is known of yet count toward the map.</p>
          <p className="text-muted-foreground">Mark from the words on the page, not from a guess at what the speaker privately meant. One turn often does several things, so each sentence is marked on its own. Leave a sentence unmarked when you cannot tell. Below, each highlighter is given under the name the theory uses (Claim is asserting, Leading question is assertive questioning, and so on).</p>
        </header>
        {section("act", "What do the marked words do?", "What the words count as in the dialogue: asserting, asking, agreeing and the rest. This is a different question from what was said (the content) and from what the words achieved (whether the other gave way).", ACTS)}
        {section("relation", "How do they bear on another statement?", "Asked once the act is known, of words that can support or attack. Rebutting, undermining and undercutting are the three ways of attacking an argument.", RELATIONS)}
        <section className="space-y-1.5" aria-labelledby="g-target">
          <h2 id="g-target" className="text-xl font-semibold tracking-tight">Which statement?</h2>
          <p className="text-[15px]">Asked of words that support, attack, rephrase, agree, challenge or retract. Pick the sentence they bear on, anywhere in the dialogue; the nearest come first, and a reason may come before or after what it supports.</p>
        </section>
        {section("scheme", "What kind of argument is this?", "Asked of words that support another statement. Each kind has its own critical questions, which test whether the argument is any good: describing an argument is not enough to resist being won over by rhetoric.", SCHEMES)}
        <section className="space-y-4" aria-labelledby="g-cq">
          <div className="space-y-1">
            <h2 id="g-cq" className="text-xl font-semibold tracking-tight">Critical questions</h2>
            <p className="text-muted-foreground text-[15px]">Asked once the kind of argument is known. Answer {CQ_ANSWERS.map((c) => c.label).join(", ")}.</p>
          </div>
          {SCHEMES.filter((s) => s.cqs.length).map((s) => (
            <div key={s.id} className="space-y-1">
              <h3 className="font-semibold">{s.label}</h3>
              <ol className="list-decimal space-y-0.5 pl-5 text-[15px]">{s.cqs.map((q) => <li key={q}>{q}</li>)}</ol>
            </div>
          ))}
        </section>
        {section("stasis", "What is in question?", `Asked of an issue, the point in dispute, not of a sentence; an issue can sit at more than one level. Euthyphro's issues: ${ISSUES.euthyphro.map((i) => i.question).join(" ")}`, STASES)}
        <footer className="text-muted-foreground space-y-1 border-t pt-4 text-xs">
          <p>Acts follow Inference Anchoring Theory (Budzynska, Janier, Reed and Saint-Dizier, &ldquo;Towards Extraction of Dialogical Arguments&rdquo;, 2013; Centre for Argument Technology, University of Dundee); retracting follows Walton and Krabbe, Commitment in Dialogue (1995). Relations follow the Argument Interchange Format and Prakken (2010). Kinds of argument and critical questions follow Walton, Reed and Macagno, Argumentation Schemes (2008). Stasis follows Cicero, On Invention 1.10, and Quintilian, Institutio Oratoria 3.6.</p>
          <p>Texts: Plato, translated by Benjamin Jowett, from Project Gutenberg. Guidelines version {GUIDELINES_VERSION}.</p>
        </footer>
      </div>
    </main>
  );
}
