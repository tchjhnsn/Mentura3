import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { XIcon } from "lucide-react";
import { STANCES } from "@reflect/core/claims";
import { coverUrl } from "@reflect/core/openlibrary";
import { categoryOf, showCall, themaCategory } from "@reflect/core/thema";
import { LEISURE, WAYS, bookWay, mediumOf, placeOf, type Medium, type Way } from "@reflect/core/ways";
import { starters } from "@reflect/core/item-lists";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PAGE } from "@/components/page-header";
import { LearnHeader, LibraryTabs } from "../header";
import { Art } from "../art";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { learnView, type LearnView } from "@/server/learn-store";
import { listClaims, type ClaimOut } from "@/server/claims-store";
import { claimWorks } from "@/server/book-store";
import { shelvesOf } from "@/server/learn-shelves";
import { listItems, mergeInputs, type LearnItem } from "@/server/ways-store";
import { keepClaimAction, restoreItemAction, setBookStatusAction, setBookWayAction, setStanceAction } from "../actions";
import { AddItem } from "../items/add-item";
import { ImportItems } from "../items/import-items";
import { bookTone, subjectTone, type ShelfTone } from "../tones";

export const metadata: Metadata = { title: "Your library" };
export const dynamic = "force-dynamic";

type Tab = "shelves" | "claims";
const BOOK = "M8 4 h84 v92 h-84 z";
const SUBJ = "M50 4 A46 46 0 1 1 49.99 4 Z";
const STATUS = [["want", "Want to read"], ["reading", "Reading"], ["read", "Read"]] as const;
const STANCE_LABEL: Record<string, string> = { belief: "Belief", disbelief: "Disbelief", suspension: "Suspension of judgment" };
const TONE: Record<ShelfTone, string> = { known: "fill-foreground", learning: "fill-neutral-400", registered: "fill-neutral-200" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const Note = ({ children }: { children: ReactNode }) => <p className="text-muted-foreground text-sm">{children}</p>;

/** Learn's shelves (`/schole/shelves`, Learn itself opens to the workspace since 2026-11-14): your shelves by the ways of learning (books by Thema section within them), and your claims. Browsing the library is its own page. */
export default async function LearnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  // Browsing moved to its own page (/schole/browse); old links still land there.
  if (one(sp.tab) === "library") redirect(`/schole/browse${one(sp.q) ? `?q=${encodeURIComponent(one(sp.q))}` : ""}`);
  if (/^[0-9a-f-]{36}$/.test(one(sp.item))) redirect(`/schole/items/${one(sp.item)}`);
  const tab: Tab = one(sp.tab) === "claims" ? "claims" : "shelves";
  const view = await learnView(user.id);
  return (
    <main className={PAGE}>
      <LearnHeader on={tab} />
      {tab === "shelves" ? <LibraryTabs on="shelves" className="mt-4" /> : null}
      <div className="mt-6">
        {tab === "shelves" ? <ShelvesTab userId={user.id} view={view} sp={sp} /> : null}
        {tab === "claims" ? <Claims claims={await listClaims(user.id).catch((): ClaimOut[] | null => null)} works={await claimWorks(user.id).catch(() => new Map<string, { workId: string; title: string }>())} /> : null}
      </div>
      {tab === "shelves" && one(sp.by) === "subject" ? (
        <footer className="text-muted-foreground mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
          <span>■ Book</span>
          <span>● Subject</span>
          <span>Dark = known · grey = learning · light = registered</span>
          <span>Thema subject categories</span>
        </footer>
      ) : null}
    </main>
  );
}

async function ShelvesTab({ userId, view, sp }: { userId: string; view: LearnView; sp: Record<string, string | string[] | undefined> }) {
  await mergeInputs(userId).catch(() => 0);
  const items = await listItems(userId).catch((): LearnItem[] | null => null);
  const removedId = one(sp.removed);
  const removed = removedId ? (await listItems(userId, { removed: true }).catch(() => [])).find((i) => i.id === removedId) ?? null : null;
  const kept = view.books.filter((b) => b.catalog?.work).map((b) => ({ work: b.catalog!.work, title: b.title }));
  const subjects = [...new Set(view.books.flatMap((b) => b.subjects.map((s) => s.name)).concat(view.known.map((s) => s.name)))];
  const have = new Set((items ?? []).map((i) => i.title.toLowerCase()));
  return <Shelves view={view} items={items} all={one(sp.filled) !== "1"} open={one(sp.book)} removed={removed} way={one(sp.way)} bySubject={one(sp.by) === "subject"} show={["want", "doing", "done", "all"].includes(one(sp.show)) ? one(sp.show) : ""} sort={["oldest", "title"].includes(one(sp.sort)) ? one(sp.sort) : ""} starters={starters(subjects, have)} kept={kept} />;
}

/** How far through a book the person is, by chapter and how far down it, read in Reflect. */
function Progress({ place, className }: { place: { chapter: number; chapters: number; at: number }; className: string }) {
  const share = Math.min(1, (place.chapter - 1 + place.at) / place.chapters);
  return (
    <span className={cn("bg-muted block h-1 overflow-hidden rounded-full", className)} role="progressbar" aria-label={`Chapter ${place.chapter} of ${place.chapters}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)}>
      <span className="bg-foreground block h-full" style={{ width: `${Math.max(2, share * 100)}%` }} />
    </span>
  );
}

function Glyph({ d, tone, className }: { d: string; tone: ShelfTone; className: string }) {
  return <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={d} className={TONE[tone]} /></svg>;
}

const SHOW = [["doing", "Under way"], ["want", "Want to"], ["done", "Done"], ["", "All"]] as const;
type Tile = { key: string; kind: string; title: string; by: string | null; at: string; square: boolean; image: string | null; href: string; line: string; share: number | null };
const BOOK_SHOW: Record<string, string> = { want: "want", doing: "reading", done: "read" };
const statusLabel = (i: LearnItem) => (i.status === "want" ? "Want to" : i.status === "doing" ? mediumOf(i.medium).doing : mediumOf(i.medium).done);
type Starter = { title: string; by?: string; medium: Medium; list: string };

/**
 * The shelves, arranged by Aristotle's ways of learning: teaching, dialectic, imitation and practice. A book goes
 * by the way the person chose, else by its catalog (written dialogues under dialectic, stories under imitation);
 * teaching keeps the Thema shelves and the subjects. Lectures, debates, films, music, games and the rest are items
 * with their medium shown, each opening its own page; a game, music or art without a lesson is kept under Rest
 * and leisure. Shelves can be narrowed by status and sorted, and each way folds away.
 */
function Shelves({ view, items, all, open, removed, show: asked, sort, starters, kept, way, bySubject }: { view: LearnView; items: LearnItem[] | null; all: boolean; open: string; removed: LearnItem | null; show: string; sort: string; starters: Record<string, Starter[]>; kept: { work: string; title: string }[]; way: string; bySubject: boolean }) {
  // Under way is the default view of a shelf; "all" asks for everything.
  const show = asked === "all" ? "" : asked || "doing";
  const byId = new Map(view.books.map((b) => [b.id, b]));
  const subjectBooks = new Map<string, LearnView["books"]>();
  for (const b of view.books) for (const s of b.subjects) subjectBooks.set(s.id, [...(subjectBooks.get(s.id) ?? []), b]);
  const grasp = new Map(view.books.flatMap((b) => b.subjects).concat(view.known).map((s) => [s.id, s.grasp?.grasp ?? null]));
  const book = open ? byId.get(open) : undefined;
  const q = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ ...(all ? {} : { filled: "1" }), ...(asked ? { show: asked } : {}), ...(sort ? { sort } : {}), ...extra });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return `/schole/shelves${s ? `?${s}` : ""}`;
  };
  const close = q({});
  const wayOf = (b: LearnView["books"][number]): Way => b.way ?? bookWay(b.catalog ? categoryOf(b.catalog) : null, b.catalog?.subjects ?? []);
  const shownBooks = view.books.filter((b) => !show || b.status === BOOK_SHOW[show]);
  const shownItems = (items ?? []).filter((i) => !show || i.status === show).sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : sort === "oldest" ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at)));
  const row = (books: { id: string; title: string; category?: string }[], subjects: { id: string; name: string }[]) => (
    <div className="flex flex-wrap gap-4">
      {books.map((b) => {
        const full = byId.get(b.id)!;
        return (
          <Link key={b.id} href={q({ book: b.id })} className={cn("hover:bg-accent flex w-24 flex-col items-center gap-2 rounded-lg p-2 text-center transition", open === b.id && "bg-accent")} aria-label={`${b.title}, book, ${full.status}`}>
            {full.catalog && coverUrl(full.catalog, "S") ? (
              <span className="flex flex-col overflow-hidden rounded-sm border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl(full.catalog, "M")!} alt="" loading="lazy" className="h-20 w-14 object-cover" />
                <Glyph d={BOOK} tone={bookTone(full.status)} className="h-1.5 w-14" />
              </span>
            ) : <Glyph d={BOOK} tone={bookTone(full.status)} className="h-20 w-14 rounded-sm" />}
            {full.place && full.status !== "read" ? <Progress place={full.place} className="w-14" /> : null}
            <span className="line-clamp-2 text-xs font-medium">{b.title}</span>
            {b.category ? <span className="text-muted-foreground -mt-1 line-clamp-1 text-[11px]">{themaCategory(b.category)?.short}</span> : null}
          </Link>
        );
      })}
      {subjects.map((s) => (
        <span key={s.id} className="flex w-24 flex-col items-center gap-2 p-2 text-center" aria-label={`${s.name}, subject`}>
          <Glyph d={SUBJ} tone={subjectTone(grasp.get(s.id), (subjectBooks.get(s.id) ?? []).map((b) => b.status))} className="size-20" />
          <span className="line-clamp-2 text-xs">{s.name}</span>
        </span>
      ))}
    </div>
  );
  const shelf = (key: string, id: string, name: string, filled: boolean, body: ReactNode) => (
    <Card key={key} className="gap-4 py-5">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-3 text-sm">
          <Badge variant={filled ? "default" : "outline"} className="size-6 justify-center rounded-md p-0">{id}</Badge>
          {name}
        </CardTitle>
      </CardHeader>
      {filled ? <CardContent className="px-5">{body}</CardContent> : null}
    </Card>
  );
  const sections = [...WAYS, LEISURE].map((w) => {
    const books = w.id === "leisure" ? [] : shownBooks.filter((b) => wayOf(b) === w.id);
    const teaching = w.id === "teaching";
    const sh = shelvesOf({ ...view, books }, teaching && all && !show, teaching);
    const here = shownItems.filter((i) => placeOf(i) === w.id);
    const total = (w.id === "leisure" ? 0 : view.books.filter((b) => wayOf(b) === w.id).length) + (items ?? []).filter((i) => placeOf(i) === w.id).length;
    return { w, books, sh, here, count: total };
  });
  const visible = sections.filter((s) => s.w.id !== "leisure" || s.count);
  // One shelf at a time (priority guides, library, 2026-11-15): the one asked for, else the first with something
  // under way, else the first with anything on it.
  const underWay = (x: (typeof sections)[number]) => x.books.some((b) => b.status === "reading") || x.here.some((i) => i.status === "doing");
  const current = visible.find((x) => x.w.id === way) ?? visible.find(underWay) ?? visible.find((x) => x.count) ?? visible[0]!;
  const tiles: Tile[] = [
    ...current.books.map((b): Tile => ({
      key: b.id, kind: "Book", title: b.title, by: b.authors[0] ?? null, at: b.startedOn ?? "", square: false,
      image: b.catalog ? coverUrl(b.catalog, "M") : null,
      href: b.catalog?.work ? `/schole/works/${b.catalog.work}` : q({ way: current.w.id, book: b.id }),
      line: b.status === "reading" ? (b.place ? `Chapter ${b.place.chapter} of ${b.place.chapters}` : "Reading") : b.status === "want" ? "Want to" : "Read",
      share: b.place && b.status !== "read" ? Math.min(1, (b.place.chapter - 1 + b.place.at) / b.place.chapters) : null,
    })),
    ...current.here.map((i): Tile => ({
      key: i.id, kind: mediumOf(i.medium).label, title: i.title, by: i.by, at: i.at, square: ["podcast", "music", "art"].includes(i.medium), image: i.image, href: `/schole/items/${i.id}`,
      line: [mediumOf(i.medium).label, i.parts && i.part ? `${i.medium === "course" ? "Lecture" : "Part"} ${i.part} of ${i.parts}` : statusLabel(i)].join(" · "),
      share: i.status === "doing" && i.parts && i.part ? Math.min(1, i.part / i.parts) : null,
    })),
  ].sort((x, y) => (sort === "title" ? x.title.localeCompare(y.title) : sort === "oldest" ? x.at.localeCompare(y.at) : y.at.localeCompare(x.at)));
  const keptCount = view.books.length + (items ?? []).length;
  return (
    <section className="space-y-6">
      {removed ? (
        <form action={restoreItemAction} className="bg-muted flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm" role="status">
          <input type="hidden" name="item" value={removed.id} />
          <span>Removed {removed.title}.</span>
          <Button size="sm" variant="outline">Undo</Button>
        </form>
      ) : null}
      <p className="text-muted-foreground -mt-2 flex flex-wrap gap-x-3 text-[13px]">
        <span>{keptCount} kept</span>
        {[["Claims", "/schole/shelves?tab=claims"], ["Reading", "/schole/reading"]].map(([label, href]) => <Link key={href} href={href!} className="hover:text-foreground underline-offset-4 hover:underline">{label}</Link>)}
      </p>
      <div className="space-y-3">
        <nav role="tablist" aria-label="Ways of learning" className="-mx-4 flex gap-6 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
          {visible.map((x) => (
            <Link key={x.w.id} role="tab" aria-selected={x === current} href={q({ way: x.w.id, show: "" })} className={cn("-mb-px shrink-0 border-b-2 px-1 pb-2 text-sm font-medium whitespace-nowrap", x === current ? "border-foreground text-foreground" : "text-muted-foreground hover:text-foreground border-transparent")}>
              {x.w.label} <span className="text-muted-foreground font-normal">{x.count}</span>
            </Link>
          ))}
        </nav>
        <Note>{current.w.about}</Note>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="bg-muted/60 inline-flex rounded-lg p-0.5 text-sm" role="group" aria-label="Show">
            {SHOW.map(([id, label]) => <Link key={id || "all"} href={q({ way: current.w.id, show: id || "all" })} aria-current={(show || "all") === (id || "all") ? "true" : undefined} className={cn("rounded-md px-3 py-1", (show || "all") === (id || "all") ? "bg-background shadow-xs font-medium" : "text-muted-foreground hover:text-foreground")}>{label}</Link>)}
          </div>
          <span className="text-muted-foreground flex items-center gap-1 text-xs" aria-label="Sort">
            {[["", "Newest"], ["oldest", "Oldest"], ["title", "Title"]].map(([id, label]) => <Link key={id || "newest"} href={q({ way: current.w.id, sort: id! })} aria-current={sort === id ? "true" : undefined} className={cn("rounded px-2 py-1", sort === id ? "bg-accent text-foreground" : "hover:text-foreground")}>{label}</Link>)}
            {current.w.id === "teaching" && current.books.length ? <><span aria-hidden="true">·</span><Link href={q({ way: current.w.id, by: bySubject ? "" : "subject" })} aria-current={bySubject ? "true" : undefined} className={cn("rounded px-2 py-1", bySubject ? "bg-accent text-foreground" : "hover:text-foreground")}>By subject</Link></> : null}
          </span>
        </div>
      </div>
      {bySubject && current.w.id === "teaching" ? (
        <div className="space-y-6">
          {current.sh.shelves.filter((x) => x.books.length || x.subjects.length).map((x) => <div key={x.id} className="space-y-2"><h3 className="text-sm font-semibold">{x.name}</h3>{row(x.books, x.subjects)}</div>)}
          {current.sh.unshelved.books.length ? <div className="space-y-2"><h3 className="text-sm font-semibold">Not yet placed</h3>{row(current.sh.unshelved.books, current.sh.unshelved.subjects)}</div> : null}
        </div>
      ) : tiles.length ? (
        <ul className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
          {tiles.map((t) => (
            <li key={t.key} className="min-w-0">
              <Link href={t.href} className="group block space-y-1.5">
                <Art image={t.image} kind={t.kind} title={t.title} className={cn("w-full rounded-md shadow-xs transition-opacity group-hover:opacity-90", t.square ? "aspect-square" : "aspect-[2/3]")} />
                <span className="line-clamp-2 text-sm font-medium leading-tight group-hover:underline">{t.title}</span>
                <span className="text-muted-foreground line-clamp-1 block text-xs">{t.line}</span>
                {t.share !== null ? <span className="bg-muted block h-1 overflow-hidden rounded-full"><span className="bg-foreground block h-full" style={{ width: `${Math.max(2, t.share * 100)}%` }} /></span> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          <Note>Nothing on this shelf{show ? " with that status" : ""} yet.{starters[current.w.id]?.length ? " To start with, from the lists:" : ""}</Note>
          {starters[current.w.id]?.length ? (
            <ul className="text-sm">
              {starters[current.w.id]!.slice(0, 4).map((x) => <li key={x.title}>{x.title}{x.by ? <span className="text-muted-foreground"> · {x.by}</span> : null} <span className="text-muted-foreground text-xs">({x.list})</span></li>)}
            </ul>
          ) : null}
          <Link href={current.w.id === "teaching" && !view.books.length ? "/schole/browse" : "/schole/lists"} className="text-sm underline underline-offset-4">{current.w.id === "teaching" && !view.books.length ? "Browse" : "See the lists"}</Link>
        </div>
      )}
      {items ? (
        <details className="group border-t pt-4">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">Add something not in Browse, or import from another service</summary>
          <div className="mt-4 space-y-4">
            <AddItem books={kept} />
            <ImportItems kept={items.map((i) => ({ medium: i.medium, title: i.title }))} />
          </div>
        </details>
      ) : <Note>Lectures, debates, films, music and games are not set up on this database yet.</Note>}
      {book ? (
        <>
        <Link href={close} aria-label="Close" tabIndex={-1} className="fixed inset-0 z-10 bg-black/40" />
        <aside className="bg-background fixed inset-y-0 right-0 z-20 w-full max-w-80 space-y-4 overflow-y-auto border-l p-6 shadow-lg" aria-label={book.title}>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold leading-tight">{book.title}</h2>
            <Button asChild variant="ghost" size="icon" aria-label="Close"><Link href={close}><XIcon /></Link></Button>
          </div>
          <Note>{book.authors.join(", ") || "Author not given"}{book.catalog?.year ? ` · ${book.catalog.year}` : ""}</Note>
          {book.catalog ? (
            <p className="text-muted-foreground text-xs">
              {themaCategory(categoryOf(book.catalog) ?? "")?.heading ?? "Not yet placed"}
              {book.catalog.lcc?.[0] ? <> · Call number {showCall(book.catalog.lcc[0])}</> : null}
            </p>
          ) : null}
          {book.place && book.catalog?.work ? (
            <div className="space-y-2">
              <Progress place={book.place} className="w-full" />
              <Button asChild size="sm"><Link href={`/schole/works/${book.catalog.work}/read?c=${book.place.chapter}`}>Continue reading · {book.place.chapter} of {book.place.chapters}</Link></Button>
            </div>
          ) : null}
          {book.catalog?.work ? <Button asChild variant="outline" size="sm"><Link href={`/schole/works/${book.catalog.work}`}>Open the book page</Link></Button> : null}
          <form action={setBookStatusAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="book" value={book.id} />
            {STATUS.map(([id, label]) => (
              <Button key={id} size="sm" name="status" value={id} variant={book.status === id ? "default" : "outline"} aria-pressed={book.status === id}>{label}</Button>
            ))}
          </form>
          <form action={setBookWayAction} className="space-y-2">
            <input type="hidden" name="book" value={book.id} />
            <p className="text-xs font-medium">Way of learning</p>
            <div className="flex flex-wrap gap-2">
              {WAYS.map((w) => <Button key={w.id} size="sm" name="way" value={w.id} variant={wayOf(book) === w.id ? "default" : "outline"} aria-pressed={wayOf(book) === w.id}>{w.label}</Button>)}
            </div>
            {book.way ? <Button size="sm" variant="ghost" name="way" value="">Back to {WAYS.find((w) => w.id === bookWay(book.catalog ? categoryOf(book.catalog) : null, book.catalog?.subjects ?? []))!.label.toLowerCase()}, from its catalog</Button> : null}
          </form>
          {(items ?? []).some((i) => i.work && i.work === book.catalog?.work) ? (
            <div className="space-y-1">
              <p className="text-xs font-medium">Adaptations you keep</p>
              {(items ?? []).filter((i) => i.work && i.work === book.catalog?.work).map((i) => <Link key={i.id} href={`/schole/items/${i.id}`} className="block text-sm underline underline-offset-4">{i.title} <span className="text-muted-foreground">({mediumOf(i.medium).label})</span></Link>)}
            </div>
          ) : null}
          {book.subjects.length ? (
            <div className="space-y-2">
              <p className="text-xs font-medium">Subjects</p>
              <div className="flex flex-wrap gap-1.5">{book.subjects.map((s) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}</div>
            </div>
          ) : null}
          {book.catalog?.subjects.length ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">The catalog suggests</p>
              <div className="flex flex-wrap gap-1.5">{book.catalog.subjects.slice(0, 8).map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
            </div>
          ) : null}
        </aside>
        </>
      ) : null}
    </section>
  );
}

function Claims({ claims, works }: { claims: ClaimOut[] | null; works: Map<string, { workId: string; title: string }> }) {
  if (!claims) return <Note>Claims are not set up on this database yet.</Note>;
  return (
    <section className="space-y-4">
      <Note>What you believe, disbelieve, or suspend judgment on, with who holds each view. Your latest stance counts; earlier ones are kept.</Note>
      {STANCES.map((st) => {
        const here = claims.filter((c) => c.stance?.stance === st.id);
        return (
          <Card key={st.id} className="gap-3 py-5">
            <CardHeader className="px-5">
              <CardTitle className="flex items-center gap-2 text-sm">{STANCE_LABEL[st.id]}<Badge variant="secondary">{here.length}</Badge></CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 px-5">
              {here.length ? null : <Note>None</Note>}
              {here.map((c, i) => (
                <div key={c.id} className={cn("flex flex-wrap items-center justify-between gap-3 py-3", i > 0 && "border-t")}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.text}</p>
                    <p className="text-muted-foreground text-xs">{[c.subject?.name, c.holders.map((h) => (h.citation ? `${h.name} (${h.citation})` : h.name)).join("; ")].filter(Boolean).join(" · ") || "No holder named"}
                      {works.get(c.id) ? <> · from <Link href={`/journal/w/${works.get(c.id)!.workId}`} className="underline underline-offset-2">{works.get(c.id)!.title}</Link></> : null}</p>
                  </div>
                  <form action={setStanceAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="claim" value={c.id} />
                    {STANCES.filter((x) => x.id !== st.id).map((x) => <Button key={x.id} size="sm" variant="outline" name="stance" value={x.id}>{STANCE_LABEL[x.id]}</Button>)}
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
      <Card className="py-5">
        <CardHeader className="px-5"><CardTitle className="text-sm">Keep a claim</CardTitle></CardHeader>
        <CardContent className="px-5">
          <form action={keepClaimAction} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium">Claim<Input name="claim" required maxLength={500} /></label>
            <label className="block space-y-1.5 text-sm font-medium">Subject (optional)<Input name="subject" maxLength={120} /></label>
            <label className="block space-y-1.5 text-sm font-medium">Who holds it, one per line: name | citation<Textarea name="holders" rows={2} /></label>
            <div className="flex flex-wrap gap-2">
              {STANCES.map((x) => <Button key={x.id} size="sm" variant="outline" name="stance" value={x.id}>Keep as {(STANCE_LABEL[x.id] ?? x.id).toLowerCase()}</Button>)}
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
