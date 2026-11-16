import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTIONS } from "@reflect/core/collections";
import { articleSlug } from "@reflect/core/articles";
import { cite, philosopherById, PHILOSOPHERS, peopleOf, TAB_LABEL, tabsOf, type Contemporary, type Passage, type Philosopher, type Rule, type Tab } from "@reflect/core/philosophers";
import { topicPageById, workById, workOf, type Work } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/section-head";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { haveKeys } from "@/server/collections";
import { bioFor } from "@/server/guests";
import { followed } from "@/server/people";
import { facesOf, type Face } from "@/server/topics";
import { LEARN } from "../../crumbs";
import { CoverImg } from "../../cover-img";
import { CollectionCard, PlaylistRows } from "../../playlists/card";
import { Faces, WorkRows } from "../../topics/[topic]/topic-view";
import { PersonFollowButton } from "../../people/follow-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  return { title: philosopherById((await params).name)?.name ?? "Philosopher" };
}

const works = (ids: readonly string[]): Work[] => ids.flatMap((id) => { const w = workById(id); return w ? [w] : []; });

/** A citation that opens the work it is in. */
function Cite({ a }: { a: Passage }) {
  return <Link href={`/schole/works/${a.work}`} className="text-muted-foreground text-[13px] underline-offset-4 hover:underline">{cite(a)}{a.tr ? `, tr. ${a.tr}` : ""}</Link>;
}

/** Their own words: each passage set off, with its citation under it. */
function Words({ words }: { words: readonly Passage[] }) {
  return (
    <div className="max-w-prose space-y-4">
      {words.map((a) => (
        <figure key={`${a.work}${a.at}`} className="space-y-1 border-l-2 pl-4">
          <blockquote className="text-[17px] leading-relaxed">&ldquo;{a.words}&rdquo;</blockquote>
          <figcaption><Cite a={a} /></figcaption>
        </figure>
      ))}
    </div>
  );
}

function Rules({ title, rules }: { title: string; rules: readonly Rule[] }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <ul className="divide-y">
        {rules.map((r) => (
          <li key={r.what} className="space-y-0.5 py-2.5">
            <p className="font-medium">{r.what} <span className="text-muted-foreground text-xs font-normal">{r.kind}</span></p>
            <p className="text-foreground/80 text-sm">{r.why}</p>
            <Cite a={r.at} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Contemporaries as faces with a line on each. */
function People({ people, faces }: { people: readonly Contemporary[]; faces: ReadonlyMap<string, Face> }) {
  return (
    <ul className="grid max-w-3xl gap-x-6 gap-y-4 sm:grid-cols-2">
      {people.map((c) => {
        const f = faces.get(c.name);
        const face = (
          <span className="bg-muted relative block size-12 shrink-0 overflow-hidden rounded-full border">
            <span className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm font-medium">{c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            {f?.image ? <CoverImg src={f.image} className="absolute inset-0 size-full object-cover object-top" /> : null}
          </span>
        );
        return (
          <li key={c.name} className="flex gap-3">
            {f?.href ? <Link href={f.href} aria-hidden tabIndex={-1}>{face}</Link> : face}
            <span className="min-w-0">
              {f?.href ? <Link href={f.href} className="font-medium hover:underline">{c.name}</Link> : <span className="font-medium">{c.name}</span>}
              <span className="text-muted-foreground block text-sm">{c.note}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Tabs({ x, on }: { x: Philosopher; on: Tab }) {
  return (
    <nav aria-label="Sections" className="-mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-5">
        {tabsOf(x).map((t) => (
          <li key={t}>
            <Link href={t === "works" ? `/schole/philosophers/${x.id}` : `/schole/philosophers/${x.id}?tab=${t}`} scroll={false} aria-current={t === on ? "page" : undefined}
              className={`-mb-px inline-block border-b-2 py-2 text-sm whitespace-nowrap ${t === on ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent"}`}>{TAB_LABEL[t]}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function WorksTab({ x }: { x: Philosopher }) {
  const own = works(x.works);
  const playlists = COLLECTIONS.filter((c) => c.items.some((i) => { const w = workOf(i); return w ? x.works.includes(w.id) : false; }));
  return (
    <>
      <section className="space-y-2">
        <SectionHead title="Works" />
        <WorkRows works={own} />
      </section>
      {x.named.length ? (
        <section className="space-y-2">
          <SectionHead title="Works they name" note={`Songs, poems and plays ${x.name} points to, with the passage that names each.`} />
          <ul className="max-w-3xl divide-y">
            {x.named.map((n) => {
              const w = n.work ? workById(n.work) : undefined;
              return (
                <li key={`${n.at.work}${n.at.at}${n.names}`} className="py-3">
                  {w ? <Link href={`/schole/works/${w.id}`} className="font-medium hover:underline">{n.names}</Link> : <p className="font-medium">{n.names}</p>}
                  <p className="text-foreground/80 text-sm">{n.why}</p>
                  <p className="text-muted-foreground text-[13px]"><Cite a={n.at} /> · {w ? <>In Scholē: <Link href={`/schole/works/${w.id}`} className="text-foreground underline-offset-4 hover:underline">{w.title}</Link></> : n.lost}</p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <section className="space-y-3">
        <SectionHead title="Topics" />
        <ul className="flex flex-wrap gap-1.5">
          {x.topics.map((id) => { const t = topicPageById(id); return t ? <li key={id}><Link href={`/schole/topics/${id}`} className="hover:bg-muted inline-flex h-8 items-center rounded-full border px-3 text-sm">{t.name}</Link></li> : null; })}
        </ul>
      </section>
      {playlists.length ? (
        <section className="space-y-4">
          <SectionHead title="In playlists" />
          <ul className="grid grid-cols-1 gap-x-5 gap-y-6 min-[420px]:grid-cols-2 lg:grid-cols-3">
            {playlists.map((c) => <li key={c.id}><CollectionCard c={c} /></li>)}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function MusicTab({ x, have, faces }: { x: Philosopher; have: ReadonlySet<string>; faces: ReadonlyMap<string, Face> }) {
  const m = x.music;
  const kept = m.rules.filter((r) => r.verdict === "kept");
  const warned = m.rules.filter((r) => r.verdict === "warned");
  const modes = m.rules.some((r) => r.kind === "mode");
  return (
    <>
      {m.stance === "rebuilt" ? (
        <section className="space-y-1">
          <SectionHead title="Rebuilt from the time" />
          <p className="text-muted-foreground max-w-prose text-sm">{m.note}</p>
        </section>
      ) : null}
      {m.words.length ? (
        <section className="space-y-3">
          <SectionHead title={m.stance === "own" ? `In ${x.name}'s words` : "What little was said"} />
          <Words words={m.words} />
        </section>
      ) : null}
      {m.rules.length ? (
        <section className="space-y-3">
          <div className="grid max-w-4xl gap-6 sm:grid-cols-2">
            {kept.length ? <Rules title="Kept" rules={kept} /> : null}
            {warned.length ? <Rules title="Warned against" rules={warned} /> : null}
          </div>
          {modes ? (
            <p className="text-muted-foreground max-w-prose text-[13px]">
              These are the Greek modes; the church modes that later took their names are different scales. <Link href={`/schole/articles/${articleSlug("Gregorian mode")}?from=${x.id}`} className="text-foreground underline underline-offset-4">Why the names differ</Link>
            </p>
          ) : null}
        </section>
      ) : null}
      <section className="space-y-2">
        <SectionHead title="Music of the time" note={m.timeNote} />
        <PlaylistRows items={m.time} have={have} numbered={false} />
      </section>
      {m.people.length ? (
        <section className="space-y-3">
          <SectionHead title="Musicians of the time" />
          <People people={m.people} faces={faces} />
        </section>
      ) : null}
      {m.ages.length ? (
        <section className="space-y-5">
          <SectionHead title={`Across the ages, in ${x.name}'s spirit`} note="Chosen by Reflect's editors, each with why it fits. Never shown as the philosopher's own choice." />
          {m.ages.map((a) => (
            <div key={a.name} className="space-y-1">
              <h3 className="font-semibold">{a.name}</h3>
              <p className="text-muted-foreground max-w-prose text-sm">{a.about}</p>
              <PlaylistRows items={a.items} have={have} />
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}

function TheatreTab({ x, faces }: { x: Philosopher; faces: ReadonlyMap<string, Face> }) {
  const t = x.theatre;
  return (
    <>
      {t.stance === "rebuilt" ? <section className="space-y-1"><SectionHead title="Rebuilt from the time" /><p className="text-muted-foreground max-w-prose text-sm">{t.note}</p></section> : null}
      {t.words.length ? (
        <section className="space-y-3">
          <SectionHead title={`In ${x.name}'s words`} />
          <Words words={t.words} />
        </section>
      ) : null}
      {t.plays.length ? (
        <section className="space-y-2">
          <SectionHead title="Plays of the time" note={`Plays ${x.name} knew, each with every version Scholē has, adaptations included.`} />
          <WorkRows works={works(t.plays)} />
        </section>
      ) : null}
      {t.people.length ? (
        <section className="space-y-3">
          <SectionHead title="Poets of the time" />
          <People people={t.people} faces={faces} />
        </section>
      ) : null}
    </>
  );
}

function ReadTab({ x, have }: { x: Philosopher; have: ReadonlySet<string> }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-2">
        <SectionHead title="From the time" note="Written in their lifetime or soon after." />
        <PlaylistRows items={x.from} have={have} numbered={false} />
      </section>
      <section className="space-y-2">
        <SectionHead title="About the time" note="Written later, about them and their age." />
        <PlaylistRows items={x.later} have={have} numbered={false} />
        <h3 className="pt-4 font-semibold">Articles</h3>
        <ul className="divide-y">
          {x.articles.map((a) => (
            <li key={a.title}>
              <Link href={`/schole/articles/${articleSlug(a.title)}?from=${x.id}`} className="hover:bg-muted/60 -mx-2 block rounded-lg px-2 py-2.5">
                <span className="block font-medium">{a.title}</span>
                <span className="text-muted-foreground block text-[13px]">Wikipedia · {a.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PeopleTab({ x, faces, others }: { x: Philosopher; faces: ReadonlyMap<string, Face>; others: readonly Face[] }) {
  const people = peopleOf(x);
  return (
    <>
      {people.length ? <section className="space-y-3"><SectionHead title="Around them" /><People people={people} faces={faces} /></section> : null}
      <section className="space-y-3">
        <SectionHead title="Other philosophers" />
        <Faces faces={others} />
      </section>
    </>
  );
}

/**
 * A philosopher (guide "Philosophers and music", Torian 2026-11-16 03:19Z "go"): face, name, dates and place with
 * Follow at the top right; the one filled button starts the work most people should hear first; then tabs. Music and
 * Theatre come second for those who wrote about them and after Read about when rebuilt from their time.
 */
export default async function PhilosopherPage({ params, searchParams }: { params: Promise<{ name: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const x = philosopherById((await params).name);
  if (!x) notFound();
  const asked = (await searchParams).tab;
  const tabs = tabsOf(x);
  const on: Tab = typeof asked === "string" && (tabs as string[]).includes(asked) ? (asked as Tab) : "works";
  const people = peopleOf(x);
  const othersOf = PHILOSOPHERS.filter((o) => o.id !== x.id);
  const [items, follows, bio, faceList, others] = await Promise.all([
    listItems(user.id).catch(() => []),
    followed(user.id).catch(() => []),
    bioFor(x.name, `https://en.wikipedia.org/wiki/${x.wiki}`).catch(() => null),
    facesOf(people),
    facesOf(othersOf),
  ]);
  const have = haveKeys(items);
  const faces = new Map(faceList.map((f) => [f.name, f]));
  const start = workById(x.start)!;
  const following = follows.some((f) => f.name.toLowerCase() === x.name.toLowerCase());
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse" crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }, ...x.topics.slice(0, 1).flatMap((id) => { const t = topicPageById(id); return t ? [{ label: t.name, href: `/schole/topics/${id}` }] : []; })]} title={x.name} />
      <div className="mt-6 space-y-8">
        <header className="space-y-4">
          <div className="flex items-start gap-4">
            <span className="bg-muted relative block size-[52px] shrink-0 overflow-hidden rounded-full border sm:size-16">
              {bio?.image ? <CoverImg src={bio.image} className="absolute inset-0 size-full object-cover object-top" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h1 id="page-title" className="text-3xl leading-tight font-semibold tracking-tight">{x.name}</h1>
                <PersonFollowButton name={x.name} qid={null} following={following} />
              </div>
              <p className="text-muted-foreground text-[13px]">{x.born} to {x.died} · {x.place}</p>
              <p className="text-muted-foreground text-[13px]">{x.what}</p>
            </div>
          </div>
          <p className="max-w-prose">{x.about}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button asChild size="lg" className="h-10 sm:px-8"><Link href={`/schole/audiobooks/${start.audiobooks[0]}`}>Start with the {start.title}</Link></Button>
            {x.ol ? <Link href={`/schole/authors/${x.ol}`} className="text-muted-foreground text-sm underline-offset-4 hover:underline">Books by {x.name}</Link> : null}
          </div>
        </header>
        <Tabs x={x} on={on} />
        <div className="space-y-8">
          {on === "works" ? <WorksTab x={x} /> : null}
          {on === "music" ? <MusicTab x={x} have={have} faces={faces} /> : null}
          {on === "theatre" ? <TheatreTab x={x} faces={faces} /> : null}
          {on === "read" ? <ReadTab x={x} have={have} /> : null}
          {on === "people" ? <PeopleTab x={x} faces={faces} others={others} /> : null}
        </div>
      </div>
    </main>
  );
}
