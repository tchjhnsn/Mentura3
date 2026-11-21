import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/session";
import { Num } from "@/components/studio/bits";
import { Head, PAGE } from "@/components/schole/parts";
import { glossary } from "@/components/schole/terms";

export const metadata: Metadata = { title: "Glossary" };

/** S9 Glossary: Uxcel opens a topic from search (Mobbin flow 8cb4ef57); here every term has its entry, with the
 * lessons that teach it. */
export default async function GlossaryPage() {
  await requireUser();
  const terms = glossary();
  const letters = [...new Set(terms.map((t) => t.translit.normalize("NFD").replace(/\p{M}/gu, "")[0]!.toUpperCase()))];
  return (
    <div className={PAGE}>
      <Head n="S9" title="Glossary" job={`${terms.length} Greek terms the courses teach, each with the lessons where you meet it.`} />
      <nav className="mb-6 flex flex-wrap gap-1" aria-label="Letters">{letters.map((l) => <a key={l} href={`#letter-${l}`} className="hover:bg-accent rounded-md border px-2 py-0.5 text-sm">{l}</a>)}</nav>
      <dl className="divide-y rounded-xl border">
        {terms.map((t, i) => {
          const first = t.translit.normalize("NFD").replace(/\p{M}/gu, "")[0]!.toUpperCase();
          const prev = i ? terms[i - 1]!.translit.normalize("NFD").replace(/\p{M}/gu, "")[0]!.toUpperCase() : "";
          return (
            <div key={t.translit} id={encodeURIComponent(t.translit)} className="relative scroll-mt-20 p-4">
              {first !== prev ? <span id={`letter-${first}`} className="absolute -top-20" /> : null}
              {i === 0 ? <Num n="C11" className="absolute top-2 right-2" /> : null}
              <dt className="flex flex-wrap items-baseline gap-2"><span className="font-serif text-lg">{t.greek}</span><span className="italic">{t.translit}</span><span className="text-muted-foreground">{t.english}</span></dt>
              <dd className="mt-1 text-sm">{t.gloss}</dd>
              <dd className="text-muted-foreground mt-1 text-xs">Taught in {t.where.slice(0, 4).map((w, k) => <span key={`${w.course}/${w.lesson}`}>{k ? ", " : ""}<Link href={`/schole/c/${w.course}/${w.lesson}`} className="underline underline-offset-2">{w.courseTitle}: {w.lessonTitle}</Link></span>)}{t.where.length > 4 ? ` and ${t.where.length - 4} more` : ""}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
