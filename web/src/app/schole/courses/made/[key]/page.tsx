import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { WorkRef } from "@reflect/core/course-drafts";
import { ThingHeader } from "@/components/headers";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { madeCourseOf } from "@/server/course-drafts";
import { browseCrumbs } from "../../../crumbs";

export const metadata: Metadata = { title: "Course" };
export const dynamic = "force-dynamic";

const workHref = (w: WorkRef) => (w.kind === "book" ? `/schole/works/${w.work}` : `/schole/items/${w.item}`);
const workLine = (w: WorkRef) => (w.kind === "book" ? [w.title, w.author].filter(Boolean).join(" by ") : [w.title, w.by].filter(Boolean).join(" by "));

/**
 * A course drafted in chat, laid out as Scholē's unit courses are: the course's name and goal, Start as the
 * one filled act (the first passage in its reader), then each unit with the works it reads and its passages. Every
 * passage is cut from a text Reflect holds and opens the reader (or the transcript) at its place, cited to its
 * edition. There are no grades and no quizzes: examiners are people.
 */
export default async function MadeCoursePage({ params }: { params: Promise<{ key: string }> }) {
  const user = await requireUser();
  const got = await madeCourseOf(user.id, (await params).key);
  if (!got) notFound();
  const { item, plan } = got;
  const first = plan.units.flatMap((u) => [...u.passages.map((p) => p.href), ...u.works.map(workHref)])[0];
  const passages = plan.units.reduce((n, u) => n + u.passages.length, 0);
  const start = first ? <Button asChild size="sm"><Link href={first}>Start</Link></Button> : undefined;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <ThingHeader back="/schole" crumbs={browseCrumbs("course")} title={item.title} action={start} />
      <div className="mt-6 space-y-10">
        <header className="space-y-3">
          <p className="text-muted-foreground text-sm">Course · drafted in chat · {plan.units.length} {plan.units.length === 1 ? "unit" : "units"} · {passages} {passages === 1 ? "passage" : "passages"}</p>
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">{item.title}</h1>
          {plan.goal ? <p className="text-muted-foreground max-w-prose">{plan.goal}</p> : null}
          {first ? <Button asChild size="lg" className="rounded-full px-8"><Link href={first}>Start</Link></Button> : null}
        </header>
        <ol className="space-y-10">
          {plan.units.map((u, n) => (
            <li key={n} className="space-y-3">
              <p className="text-muted-foreground text-sm">Unit {n + 1}</p>
              <h2 className="text-xl leading-tight font-semibold tracking-tight">{u.title}</h2>
              {u.works.length ? (
                <ul className="text-[15px]">
                  {u.works.map((w) => (
                    <li key={w.kind === "book" ? w.work : w.item}><Link href={workHref(w)} className="hover:underline hover:underline-offset-4">{workLine(w)}</Link></li>
                  ))}
                </ul>
              ) : null}
              {u.passages.map((p, i) => (
                <Link key={i} href={p.href} className="hover:bg-muted/50 block rounded-lg border p-4">
                  <blockquote className="font-serif">{p.text}</blockquote>
                  <p className="text-muted-foreground mt-2 text-xs">{p.cite} · {p.source.replace(/\s*\(https?:[^)]*\)$/, "")}</p>
                </Link>
              ))}
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
