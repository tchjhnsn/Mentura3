import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mediumOf } from "@reflect/core/ways";
import { coverUrl } from "@reflect/core/openlibrary";
import { daily, familyOf } from "@reflect/core/work-browse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { allExcerpts } from "@/server/excerpt-store";
import { highlightBooks } from "@/server/highlights";
import { restateAction } from "./actions";
import { PAGE } from "@/components/page-header";
import { Head, SPACE } from "@/app/life/space";
import { Upcoming } from "@/app/life/upcoming";
import { requireUser } from "@/server/session";
import { learnView } from "@/server/learn-store";
import { listExaminations } from "@/server/examination-store";
import { mergeInputs } from "@/server/ways-store";
import { workspace } from "@/server/work-space";
import { LearnHeader } from "./header";

export const metadata: Metadata = { title: "Scholē" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
// The shelves' own parameters, from links made before Learn opened to the workspace.
const SHELF_KEYS = ["tab", "book", "filled", "show", "sort", "removed"];
const GRID = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";
const LINK = "text-muted-foreground hover:text-foreground text-sm underline-offset-2 hover:underline";

type Card = { key: string; href: string; kind: string; title: string; by: string | null; image: string | null; share: number | null };

function Cards({ cards }: { cards: Card[] }) {
  return (
    <ul className={GRID}>
      {cards.map((c) => (
        <li key={c.key}>
          <Link href={c.href} className="bg-card hover:bg-accent flex h-full gap-3 rounded-xl border p-3 shadow-xs transition">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.image ? <img src={c.image} alt="" loading="lazy" className="h-16 w-11 shrink-0 rounded-sm border object-cover" /> : null}
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-muted-foreground text-xs">{c.kind}</span>
              <span className="line-clamp-2 text-sm font-medium leading-snug">{c.title}</span>
              {c.by ? <span className="text-muted-foreground truncate text-xs">{c.by}</span> : null}
              {c.share !== null ? <span className="bg-muted mt-auto block h-1 overflow-hidden rounded-full"><span className="bg-foreground block h-full" style={{ width: `${Math.max(2, c.share * 100)}%` }} /></span> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Learn's workspace (Torian, 2026-11-14 17:44Z: "Every tile should first open to the users own personal workspace";
 * 20:28Z, yes to Learn's): what the person is learning now and wants to next, what they learn toward the work they
 * want and where it leads (Learn feeds Work), the hours a week it takes, their open examinations, and Learn's
 * calendar. The shelves (`/schole/shelves`) and Browse are its icons.
 */
export default async function LearnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (/^[0-9a-f-]{36}$/.test(one(sp.item))) redirect(`/schole/items/${one(sp.item)}`);
  if (one(sp.tab) === "library") redirect(`/schole/browse${one(sp.q) ? `?q=${encodeURIComponent(one(sp.q))}` : ""}`);
  if (SHELF_KEYS.some((k) => one(sp[k]))) {
    const p = new URLSearchParams();
    for (const k of SHELF_KEYS) if (one(sp[k])) p.set(k, one(sp[k]));
    redirect(`/schole/shelves?${p}`);
  }
  const user = await requireUser();
  await mergeInputs(user.id).catch(() => 0);
  const today = new Date().toISOString().slice(0, 10);
  const [view, w, exams, excerpts] = await Promise.all([learnView(user.id), workspace(user.id), listExaminations(user.id).catch(() => []), allExcerpts(user.id).catch(() => [])]);
  // Today's highlights to restate: three a day, the same all day, from those not yet put in the person's own words.
  const unsaid = excerpts.filter((e) => !e.note);
  const picked = daily(unsaid.length ? unsaid : excerpts, 3, today, user.id);
  const titles = new Map((await highlightBooks(user.id, picked)).map((b) => [b.work, b.title]));
  const bookCard = (b: (typeof view.books)[number]): Card => ({
    key: b.id, href: b.catalog?.work ? `/schole/works/${b.catalog.work}` : `/schole/shelves?book=${b.id}`, kind: "Book", title: b.title, by: b.authors[0] ?? null,
    image: b.catalog ? coverUrl(b.catalog, "M") : null, share: b.place ? Math.min(1, (b.place.chapter - 1 + b.place.at) / b.place.chapters) : null,
  });
  const itemCard = (i: (typeof w.items)[number]): Card => ({
    key: i.id, href: `/schole/items/${i.id}`, kind: mediumOf(i.medium).label, title: i.title, by: i.by, image: i.image,
    share: i.parts && i.part ? Math.min(1, i.part / i.parts) : null,
  });
  const now = [...view.books.filter((b) => b.status === "reading").map(bookCard), ...w.items.filter((i) => i.status === "doing").map(itemCard)];
  const next = [
    ...view.books.filter((b) => b.status === "want").sort((a, b) => (a.wantRank ?? 1e9) - (b.wantRank ?? 1e9)).map(bookCard),
    ...w.items.filter((i) => i.status === "want").map(itemCard),
  ];
  const byId = new Map(w.items.map((i) => [i.id, i]));
  const toward = w.wanted.filter((x) => x.learning.length).map((x) => ({ x, items: x.learning.map((id) => byId.get(id)).filter((i) => i !== undefined) }));
  const open = exams.filter((e) => e.status === "open");
  return (
    <main className={PAGE}>
      <LearnHeader on="space" />
      <div className={`mt-4 ${SPACE}`}>
        {picked.length ? (
          <section className="grid gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Head title="Today" note="Three of your highlights. Say each in your own words; what you write is kept as its note." />
              <Link href="/schole/highlights" className={LINK}>All your highlights</Link>
            </div>
            <ul className="grid gap-3 lg:grid-cols-3">
              {picked.map((e) => (
                <li key={e.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-xs">
                  <blockquote className="line-clamp-6 border-l-2 pl-3 text-sm leading-relaxed">{e.quote}</blockquote>
                  <Link href={`/schole/works/${e.work}`} className="text-muted-foreground text-xs hover:underline">{titles.get(e.work) ?? "The book"}</Link>
                  <form action={restateAction.bind(null, e.id, e.work)} className="mt-auto grid gap-2">
                    <Textarea name="words" defaultValue={e.note ?? ""} rows={3} placeholder="In your own words" aria-label="In your own words" className="text-sm" />
                    <div><Button type="submit" size="sm" variant="outline">Keep it</Button></div>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Head title="Learning now" note="Books you are reading and courses, lectures and the rest under way." />
            <Link href="/schole/shelves?show=doing" className={LINK}>On your shelves</Link>
          </div>
          {now.length ? <Cards cards={now} /> : <p className="text-muted-foreground text-sm">Nothing under way. <Link href="/schole/browse" className="underline underline-offset-2">Browse</Link> for something to learn, or start one you want to.</p>}
        </section>

        <section className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Head title="Next" note="What you want to learn, in the order you put your books." />
            {next.length > 8 ? <Link href="/schole/shelves?show=want" className={LINK}>All {next.length}</Link> : null}
          </div>
          {next.length ? <Cards cards={next.slice(0, 8)} /> : <p className="text-muted-foreground text-sm">Nothing kept to learn next.</p>}
        </section>

        <section className="grid gap-3">
          <Head title="What Scholē gives Work" note="What you learn toward the work you want, where your learning leads, and the time it takes." />
          {toward.length ? (
            <ul className="divide-y rounded-xl border text-sm">
              {toward.map(({ x, items }) => (
                <li key={x.record.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-2">
                  <Link href={`/life/work/${x.record.id}`} className="font-medium first-letter:uppercase hover:underline">{x.title}</Link>
                  <span className="text-muted-foreground text-xs">{items.map((i) => i.title).join(", ") || `${x.learning.length} kept toward it`}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground text-sm">{w.wanted.length ? <>Open work you want in <Link href="/life/work" className="underline underline-offset-2">Work</Link> and check what you are learning toward it.</> : <>Add work you want in <Link href="/life/work" className="underline underline-offset-2">Work</Link>, and say what you learn toward it.</>}</p>}
          {w.later.length ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium">Where it leads</p>
              <ul className="flex flex-wrap gap-2">
                {w.later.slice(0, 6).map((s) => <li key={s.job.code}><Link href={`/life/work/jobs/${s.job.code}`} className="hover:bg-accent block rounded-lg border px-3 py-2 text-sm"><span className="font-medium">{s.job.title}</span><span className="text-muted-foreground"> · {familyOf(s.job.code)?.label ?? "Work"}</span></Link></li>)}
              </ul>
            </div>
          ) : null}
          <p className="text-sm">{w.learningHours ? <>Learning <span className="font-semibold">{w.learningHours} hours a week</span> from your sessions over four weeks, which Work counts against the hours you have.</> : <span className="text-muted-foreground">No learning sessions kept these four weeks.</span>}</p>
        </section>

        {open.length ? (
          <section className="grid gap-3">
            <Head title="Your examinations" note="Open, with the people examining you." />
            <ul className="divide-y rounded-xl border text-sm">
              {open.slice(0, 5).map((e) => <li key={e.id}><Link href={`/schole/examinations/${e.id}`} className="hover:bg-accent flex items-baseline justify-between gap-3 px-4 py-2"><span className="min-w-0 font-medium">{e.name}<span className="text-muted-foreground font-normal"> · {e.courseTitle}</span></span><span className="text-muted-foreground shrink-0 text-xs">{e.examiners.length} {e.examiners.length === 1 ? "examiner" : "examiners"}</span></Link></li>)}
              {open.length > 5 ? <li className="text-muted-foreground px-4 py-2 text-xs">{open.length - 5} more open</li> : null}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-3">
          <Head title="What you keep" note="From what you read, watch and hear." />
          <ul className="flex flex-wrap gap-2 text-sm">
            {[["Reading", "/schole/reading"], ["Highlights", "/schole/highlights"], ["Claims", "/schole/shelves?tab=claims"], ["Lists", "/schole/lists"]].map(([label, href]) => <li key={href}><Link href={href!} className="hover:bg-accent block rounded-lg border px-3 py-2 font-medium">{label}</Link></li>)}
          </ul>
        </section>

        <Upcoming userId={user.id} tile="learn" today={today} />
      </div>
    </main>
  );
}
