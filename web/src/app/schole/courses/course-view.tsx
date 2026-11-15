import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COURSE_SITES, OUTLINE, courseOutline, courseSite } from "@reflect/core/courses";
import { BookmarkIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { learnView } from "@/server/learn-store";
import { listItems, listUnits } from "@/server/ways-store";
import { courseInfoOf, syllabusTexts } from "@/server/courses";
import { listExaminations } from "@/server/examination-store";
import { reasonFor } from "@/server/learn-reason-store";
import { LearnHeader } from "../header";
import { ThingHeader } from "@/components/headers";
import { browseCrumbs, shelfCrumbs } from "../crumbs";
import { browseAddAction } from "../actions";
import { BookGrid } from "../book-card";
import { LocalDay } from "../items/local-day";
import { CourseShell, DOCS, courseHref, lectureHref } from "./shell";
import { SyllabusTabs } from "./syllabus-tabs";

/**
 * A course's own page in Reflect, laid out as a documentation page and the same for every source: its facts, then one
 * set of tabs (About with the description first and the official website, Required texts shown as books, Prerequisites,
 * Assignments, Grading, and More when the source has other parts), then every lecture, each opening in place to play. Start the course keeps it on your shelves and
 * opens it; once kept, the lectures keep your place.
 */
export async function CourseView({ userId, u, t, by: byAsked, footer }: { userId: string; u: string; t: string; by: string;
  /** What the person keeps about the course on their shelves, the "Yours" section at the foot of About (priority guides, kept items). */ footer?: ReactNode }) {
  const site = courseSite(u);
  if (!site) notFound();
  const [course, items, view, exams, reason] = await Promise.all([courseInfoOf(site.url), listItems(userId), learnView(userId), listExaminations(userId, site.url), reasonFor(userId, site.url)]);
  const kept = items.find((i) => courseSite(i.url)?.url === site.url);
  const units = kept ? await listUnits(userId, kept.id) : [];
  const finished = new Set(units.filter((u) => u.doneOn).map((u) => u.unit));
  const credit = COURSE_SITES[site.site];
  if (!course) {
    return <main className={DOCS}><LearnHeader on="browse" /><p className="text-muted-foreground mt-6 text-sm">{credit.name} did not answer just now. Try again in a moment.</p></main>;
  }
  const title = t || course.title;
  const by = byAsked || course.by;
  const href = (n: number) => lectureHref(site.url, n, title, kept?.id);
  const next = course.lectures.find((l) => !finished.has(String(l.n)));
  const outline = courseOutline(course);
  const texts = outline.sections.texts.length ? await syllabusTexts(outline.sections.texts.flatMap((p) => p.lines)) : [];
  const books = texts.flatMap((t) => (t.book ? [t.book] : [])).filter((b, j, a) => a.findIndex((x) => x.work === b.work) === j);
  const unfound = texts.filter((t) => !t.book && !/:$/.test(t.line)).map((t) => t.line);
  const mine = new Map(view.books.filter((b) => b.catalog?.work).map((b) => [b.catalog!.work, b.status]));
  const lectures = course.lectures.map((l) => ({ n: l.n, title: l.title, href: href(l.n), done: finished.has(String(l.n)), youtube: l.youtube }));
  const toc = [{ id: "course", label: "About the course" }];
  const prereqs = outline.sections.prerequisites.flatMap((p) => p.lines);
  const textCount = books.length + unfound.length;
  const facts = [course.lectures.length ? `${course.lectures.length} lectures` : "No lecture videos", textCount ? `${textCount} required ${textCount === 1 ? "text" : "texts"}` : null, prereqs.length ? `${prereqs.length} ${prereqs.length === 1 ? "prerequisite" : "prerequisites"}` : null, kept ? `${finished.size} finished` : null].filter(Boolean);
  const whyHref = (start: boolean) => `/schole/courses/why?u=${encodeURIComponent(site.url)}&t=${encodeURIComponent(title)}${by ? `&by=${encodeURIComponent(by)}` : ""}${course.image ? `&img=${encodeURIComponent(course.image)}` : ""}${start ? "&go=start" : ""}`;
  const allDone = Boolean(kept && course.lectures.length && course.lectures.every((l) => finished.has(String(l.n))));
  const none = (what: string) => <p className="text-muted-foreground text-sm">{credit.name} lists no {what} for this course.</p>;
  const parts = (list: { heading: string; lines: string[] }[], titled: boolean) => (
    <div className="max-w-prose space-y-5">
      {list.map((part, i) => (
        <section key={i} className="space-y-1.5">
          {titled ? <h3 className="font-medium">{part.heading}</h3> : null}
          <ul className="space-y-1.5 leading-relaxed">{part.lines.map((line, j) => <li key={j}>{line}</li>)}</ul>
        </section>
      ))}
    </div>
  );

  const primary = kept
    ? (next ? <Button asChild size="sm"><Link href={href(next.n)}>{finished.size ? "Continue" : "Start"}: Lecture {next.n}</Link></Button> : null)
    : reason
      ? <form action={browseAddAction}><input type="hidden" name="medium" value="course" /><input type="hidden" name="title" value={title} /><input type="hidden" name="url" value={site.url} />{by ? <input type="hidden" name="by" value={by} /> : null}{course.image ? <input type="hidden" name="image" value={course.image} /> : null}<LocalDay /><Button size="sm" name="go" value="start">Start the course</Button></form>
      : <Button asChild size="sm"><Link href={whyHref(true)}>Start the course</Link></Button>;
  const hidden = <><input type="hidden" name="medium" value="course" /><input type="hidden" name="title" value={title} /><input type="hidden" name="url" value={site.url} />{by ? <input type="hidden" name="by" value={by} /> : null}{course.image ? <input type="hidden" name="image" value={course.image} /> : null}<LocalDay /></>;
  // The one filled button (priority guides, course page): Start, or Continue naming the next lecture.
  const big = "h-11 w-full px-6 text-base sm:w-auto";
  const start = kept
    ? (next ? <Button asChild size="lg" className={big}><Link href={href(next.n)}>{finished.size ? "Continue" : "Start"}: Lecture {next.n}, {next.title}</Link></Button> : <p className="text-sm">You have finished every lecture.</p>)
    : reason
      ? <form action={browseAddAction}>{hidden}<Button size="lg" className={big} name="go" value="start">Start the course</Button></form>
      : <Button asChild size="lg" className={big}><Link href={whyHref(true)}>Start the course</Link></Button>;
  // Want to is the bookmark cards already use, beside the title; filled once the course is on your shelves.
  const keep = kept
    ? <Button asChild size="icon" variant="ghost" aria-label="On your shelves" title="On your shelves"><Link href={`/schole/items/${kept.id}`}><BookmarkIcon className="fill-current" /></Link></Button>
    : <form action={browseAddAction}>{hidden}<Button size="icon" variant="ghost" aria-label="Want to take this course" title="Want to"><BookmarkIcon /></Button></form>;
  const header = <ThingHeader back={kept ? "/schole" : "/schole/browse?m=course"} crumbs={kept ? shelfCrumbs(kept.way ?? "teaching") : browseCrumbs("course")} title={title} action={primary} />;

  return (
    <CourseShell header={header} course={title} overview={courseHref(site.url, title)} lectures={lectures} current={null} toc={toc}>
      <header className="space-y-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
          {course.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.image} alt="" className="aspect-video w-full rounded-lg border object-cover shadow-sm sm:w-56" />
          ) : null}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                <p className="text-muted-foreground text-base">{[by, credit.name].filter(Boolean).join(" · ")}</p>
                <p className="text-muted-foreground text-[13px]">{facts.join(" · ")}</p>
              </div>
              {keep}
            </div>
            {start}
            {reason ? (
              <p id="why" className="scroll-mt-20 max-w-prose font-serif text-[15px] leading-relaxed italic">
                <span className="text-muted-foreground not-italic font-sans text-xs font-medium">{allDone ? "Why you began" : "Why I am learning this"} </span>
                “{reason.cause.length > 200 ? `${reason.cause.slice(0, 197)}...` : reason.cause}”{" "}
                <Link href={whyHref(false)} className="text-muted-foreground font-sans text-xs not-italic underline underline-offset-4">Edit</Link>
              </p>
            ) : kept ? (
              <p id="why" className="scroll-mt-20 text-muted-foreground text-sm"><Link href={whyHref(false)} className="underline underline-offset-4">Write why you are learning this</Link></p>
            ) : null}
          </div>
        </div>
      </header>

      <section id="course" className="scroll-mt-20">
        <SyllabusTabs tabs={OUTLINE.filter((o) => o.id !== "more" || outline.sections.more.length).map((o) => ({
          id: o.id, label: o.label,
          content: o.id === "about" ? (
            <div className="space-y-6">
              {outline.description.length ? <div className="max-w-prose space-y-3 text-[15px] leading-relaxed">{outline.description.map((p, i) => <p key={i}>{p}</p>)}</div> : <p className="text-muted-foreground text-sm">{credit.name} gives no description for this course.</p>}
              {outline.sections.about.length ? parts(outline.sections.about, true) : null}
              <dl className="grid max-w-prose gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
                {by ? <><dt className="text-muted-foreground">Taught by</dt><dd>{by}</dd></> : null}
                <dt className="text-muted-foreground">From</dt><dd>{credit.name}, under the {credit.license} license</dd>
                <dt className="text-muted-foreground">Official website</dt>
                <dd><a href={site.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">{new URL(site.url).host}{new URL(site.url).pathname.replace(/\/$/, "")}<ExternalLinkIcon className="size-3.5" /></a></dd>
              </dl>
              <div className="max-w-prose space-y-2 border-t pt-5">
                <Button asChild size="sm" variant="outline"><Link href={`/schole/examinations/new?u=${encodeURIComponent(site.url)}&t=${encodeURIComponent(title)}`}>Put yourself under examination</Link></Button>
                {exams.length ? (
                  <p className="text-muted-foreground text-sm">Your examinations: {exams.map((x, i) => <span key={x.id}>{i ? ", " : ""}<Link href={`/schole/examinations/${x.id}`} className="underline underline-offset-4">{new Date(x.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ({x.status === "open" ? "open" : `closed, ${x.examiners.filter((y) => y.attests).length} attested`})</Link></span>)}</p>
                ) : null}
              </div>
              {footer ? <div className="max-w-prose border-t pt-6">{footer}</div> : null}
            </div>
          ) : o.id === "texts" ? (
            texts.length ? (
              <div className="space-y-6">
                {books.length ? <BookGrid books={books} mine={mine} cols="md:grid-cols-4" /> : null}
                {unfound.length ? (
                  <ul className={`max-w-prose space-y-2 text-sm leading-relaxed ${books.length ? "text-muted-foreground" : ""}`}>
                    {books.length ? <li className="text-foreground font-medium">Also on the syllabus</li> : null}
                    {unfound.map((line, j) => <li key={j}>{line} <Link href={`/schole/browse?q=${encodeURIComponent(line.replace(/\.\s.*$/, ""))}`} className="text-muted-foreground text-xs underline underline-offset-2">Find it in Reflect</Link></li>)}
                  </ul>
                ) : null}
              </div>
            ) : none("required texts")
          ) : outline.sections[o.id].length ? parts(outline.sections[o.id], outline.sections[o.id].length > 1 || o.id === "more") : none(o.id === "prerequisites" ? "prerequisites" : o.id === "assignments" ? "assignments" : "grading"),
        }))} />
      </section>

      <p className="text-muted-foreground text-xs">From {credit.name}, under the {credit.license} license. Reflect reads it from the publisher and keeps no copy.</p>
    </CourseShell>
  );
}
