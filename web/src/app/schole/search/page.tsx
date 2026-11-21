import type { Metadata } from "next";
import Link from "next/link";
import { COURSES, lessonsOf } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { cardOf } from "@/components/schole/index";
import { CourseCard, Head, LessonRow, PAGE } from "@/components/schole/parts";
import { glossary } from "@/components/schole/terms";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Search" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** S8 Search, after Searching Uxcel (Mobbin flow 8cb4ef57): all results, or courses, lessons or terms alone. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const tab = one(sp.tab) || "all";
  const words = plain(q).split(/\s+/).filter(Boolean);
  const hit = (...fields: string[]) => words.length > 0 && words.every((w) => fields.some((f) => plain(f).includes(w)));
  const courses = COURSES.filter((c) => hit(c.title, c.latin, c.greek, c.about, c.subject));
  const lessons = COURSES.flatMap((c) => lessonsOf(c).filter(({ lesson: l }) => hit(l.title, l.summary, l.passage.text, ...l.terms.flatMap((t) => [t.english, t.translit]))).map((x) => ({ c, ...x })));
  const terms = glossary().filter((t) => hit(t.greek, t.translit, t.english, t.gloss));
  const tabs = [["all", "All", courses.length + lessons.length + terms.length], ["courses", "Courses", courses.length], ["lessons", "Lessons", lessons.length], ["terms", "Terms", terms.length]] as const;
  const show = (t: string) => tab === "all" || tab === t;
  return (
    <div className={PAGE}>
      <Head n="S8" title={q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"} job="Courses, lessons and terms, by any word in them: a title, a Greek term, a line of the passage." />
      <form className="mb-4 flex gap-2 md:hidden" role="search"><input name="q" defaultValue={q} placeholder="Search courses, lessons, terms" className="h-10 flex-1 rounded-lg border px-3" /></form>
      {q ? (
        <>
          <div className="mb-6 flex flex-wrap gap-2 border-b pb-4">
            {tabs.map(([id, label, n]) => <Link key={id} href={`/schole/search?q=${encodeURIComponent(q)}&tab=${id}`} className={cn("rounded-lg border px-3 py-1.5 text-sm", tab === id ? "bg-foreground text-background border-foreground" : "hover:bg-accent")}>{label} <span className="opacity-70">{n}</span></Link>)}
          </div>
          {courses.length + lessons.length + terms.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center"><p className="font-medium">Nothing matches &ldquo;{q}&rdquo;</p><p className="text-muted-foreground mt-1 text-sm">Try one word, or an English word for a Greek term, like &ldquo;virtue&rdquo; or &ldquo;cause&rdquo;.</p></div>
          ) : null}
          {show("courses") && courses.length ? <section className="mb-8"><h2 className="mb-3 text-lg font-semibold">Courses</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{courses.map((c) => <CourseCard key={c.id} c={cardOf(c)} />)}</div></section> : null}
          {show("lessons") && lessons.length ? <section className="mb-8"><h2 className="mb-3 text-lg font-semibold">Lessons</h2><ul className="space-y-2">{lessons.slice(0, tab === "all" ? 12 : 200).map(({ c, unit, lesson: l }) => <li key={`${c.id}/${l.id}`}><LessonRow course={c.id} id={l.id} title={l.title} minutes={l.minutes} sub={`${c.title} · ${unit.title}`} /></li>)}</ul>{tab === "all" && lessons.length > 12 ? <Link href={`/schole/search?q=${encodeURIComponent(q)}&tab=lessons`} className="mt-2 inline-block text-sm underline">All {lessons.length} lessons</Link> : null}</section> : null}
          {show("terms") && terms.length ? <section><h2 className="mb-3 text-lg font-semibold">Terms</h2><ul className="divide-y rounded-xl border">{terms.map((t) => <li key={t.translit}><Link href={`/schole/glossary#${encodeURIComponent(t.translit)}`} className="hover:bg-accent/50 block p-3"><span className="font-serif">{t.greek}</span> <span className="italic">{t.translit}</span> <span className="text-muted-foreground">{t.english}</span><span className="text-muted-foreground block text-sm">{t.gloss}</span></Link></li>)}</ul></section> : null}
        </>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center"><p className="font-medium">Type a word above</p><p className="text-muted-foreground mt-1 text-sm">For example <Link href="/schole/search?q=friendship" className="underline">friendship</Link>, <Link href="/schole/search?q=substance" className="underline">substance</Link> or <Link href="/schole/search?q=catharsis" className="underline">catharsis</Link>.</p></div>
      )}
    </div>
  );
}
