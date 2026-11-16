import Link from "next/link";
import { COLLECTIONS, itemHref } from "@reflect/core/collections";
import { articleSlug } from "@reflect/core/articles";
import { cite, eraOf, hasWorks, peopleOf, peopleOfEra, personHref, relationsOf, startOf, tabLabel, tabsOf, type Tab } from "@reflect/core/historical-people";
import { REL_LABEL, type Contemporary, type Passage, type Person, type Rule } from "@reflect/core/historical";
import { topicPageById, workById, workOf, type Work } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/section-head";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { listItems } from "@/server/ways-store";
import { haveKeys } from "@/server/collections";
import { bioFor } from "@/server/guests";
import { followed } from "@/server/people";
import { facesOf, type Face } from "@/server/topics";
import { LEARN } from "../crumbs";
import { CoverImg } from "../cover-img";
import { CollectionCard, PlaylistRows } from "../playlists/card";
import { Faces, WorkRows } from "../topics/[topic]/topic-view";
import { PersonFollowButton } from "./follow-button";

const works = (ids: readonly string[]): Work[] => ids.flatMap((id) => { const w = workById(id); return w ? [w] : []; });

/** A citation that opens the work it is in, when Scholē has a page for it. */
function Cite({ a }: { a: Passage }) {
  const text = `${cite(a)}${a.tr ? `, tr. ${a.tr}` : ""}`;
  return workById(a.work)
    ? <Link href={`/schole/works/${a.work}`} className="text-muted-foreground text-[13px] underline-offset-4 hover:underline">{text}</Link>
    : <span className="text-muted-foreground text-[13px]">{text}</span>;
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

/** People as faces with a line on each; a face opens their page when Scholē has one. */
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

function Tabs({ x, on }: { x: Person; on: Tab }) {
  return (
    <nav aria-label="Sections" className="-mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-5">
        {tabsOf(x).map((t) => (
          <li key={t}>
            <Link href={personHref(x, t === "works" ? undefined : t)} scroll={false} aria-current={t === on ? "page" : undefined}
              className={`-mb-px inline-block border-b-2 py-2 text-sm whitespace-nowrap ${t === on ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent"}`}>{tabLabel(x, t)}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function WorksTab({ x, have }: { x: Person; have: ReadonlySet<string> }) {
  const own = works(x.works);
  const about = works(x.aboutWorks ?? []);
  const ids = [...x.works, ...(x.aboutWorks ?? [])];
  const playlists = COLLECTIONS.filter((c) => c.items.some((i) => { const w = workOf(i); return w ? ids.includes(w.id) : false; }));
  const named = x.named ?? [];
  const aboutFirst = !hasWorks(x);
  const aboutSection = about.length || x.aboutThem?.length ? (
    <section className="space-y-2">
      <SectionHead title={aboutFirst ? `What was written about ${x.name}` : "About them"} note={aboutFirst ? `${x.name} wrote nothing that survives. Everything we know comes from these.` : "Lives, plays and histories with them as the subject."} />
      {about.length ? <WorkRows works={about} /> : null}
      {x.aboutThem?.length ? <PlaylistRows items={x.aboutThem} have={have} numbered={false} /> : null}
    </section>
  ) : null;
  return (
    <>
      {aboutFirst ? aboutSection : (
        <section className="space-y-2">
          <SectionHead title="By them" />
          {own.length ? <WorkRows works={own} /> : null}
          {x.by?.length ? <PlaylistRows items={x.by} have={have} numbered={false} /> : null}
        </section>
      )}
      {named.length ? (
        <section className="space-y-2">
          <SectionHead title="Works they name" note={`Songs, poems and plays ${x.name} points to, with the passage that names each.`} />
          <ul className="max-w-3xl divide-y">
            {named.map((n) => {
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
      {aboutFirst ? null : aboutSection}
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

function MusicTab({ x, have, faces }: { x: Person; have: ReadonlySet<string>; faces: ReadonlyMap<string, Face> }) {
  const m = x.music!;
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
          <SectionHead title={`Across the ages, in ${x.name}'s spirit`} note={`Chosen by Reflect's editors, each with why it fits. Never shown as ${x.name}'s own choice.`} />
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

function TheatreTab({ x, faces }: { x: Person; faces: ReadonlyMap<string, Face> }) {
  const t = x.theatre!;
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

/** Who they knew, grouped by the tie, then the musicians and poets of their time, then others of the era with pages. */
function PeopleTab({ x, faces, others }: { x: Person; faces: ReadonlyMap<string, Face>; others: readonly Face[] }) {
  const around = peopleOf(x);
  return (
    <>
      {relationsOf(x).map((g) => (
        <section key={g.rel} className="space-y-3">
          <SectionHead title={REL_LABEL[g.rel]} />
          <People people={g.people} faces={faces} />
        </section>
      ))}
      {around.length ? <section className="space-y-3"><SectionHead title="Musicians and poets of their time" /><People people={around} faces={faces} /></section> : null}
      {others.length ? (
        <section className="space-y-3">
          <SectionHead title={`Others in ${eraOf(x).label}`} />
          <Faces faces={others} />
        </section>
      ) : null}
    </>
  );
}

/** What they read: each book with the passage that shows it, opening the book when Scholē has it. */
function ReadingTab({ x }: { x: Person }) {
  return (
    <section className="space-y-2">
      <SectionHead title="What they read" note={`Earlier works ${x.name} knew, each with the passage that shows it.`} />
      <ul className="max-w-3xl divide-y">
        {x.read.map((r) => {
          const href = r.work ? `/schole/works/${r.work}` : r.item ? itemHref(r.item) : null;
          return (
            <li key={`${r.title}${r.by}`} className="space-y-1 py-3">
              <p>{href ? <Link href={href} className="font-medium hover:underline">{r.title}</Link> : <span className="font-medium">{r.title}</span>} <span className="text-muted-foreground text-sm">· {r.by}</span></p>
              <p className="text-foreground/80 text-sm">{r.note}</p>
              {r.at.words ? <blockquote className="max-w-prose border-l-2 pl-3 text-[15px] leading-relaxed">&ldquo;{r.at.words}&rdquo;</blockquote> : null}
              <Cite a={r.at} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AboutTab({ x, have }: { x: Person; have: ReadonlySet<string> }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {x.from.length ? (
        <section className="space-y-2">
          <SectionHead title="From the time" note="Written in their lifetime or soon after." />
          <PlaylistRows items={x.from} have={have} numbered={false} />
        </section>
      ) : null}
      <section className="space-y-2">
        <SectionHead title="About the time" note="Written later, about them and their age." />
        <PlaylistRows items={x.later} have={have} numbered={false} />
        {x.articles.length ? (
          <>
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
          </>
        ) : null}
      </section>
    </div>
  );
}

/** Their time, for people who left nothing on music: the era's music from its topic pages, playable here. */
function TimeTab({ x, have }: { x: Person; have: ReadonlySet<string> }) {
  const topics = x.topics.flatMap((id) => { const t = topicPageById(id); return t ? [t] : []; });
  const music = topics.flatMap((t) => t.forms.filter((f) => f.id === "music").map((f) => ({ t, f })));
  return (
    <>
      {music.map(({ t, f }) => (
        <section key={t.id} className="space-y-2">
          <SectionHead title={`Music of ${t.name.replace(/^The /, "the ")}`} note={f.where ?? "What survives from their time, played by people who reconstruct it."} />
          <PlaylistRows items={f.items ?? []} have={have} numbered={false} />
        </section>
      ))}
      <section className="space-y-3">
        <SectionHead title="More from their time" />
        <ul className="flex flex-wrap gap-1.5">
          {topics.map((t) => <li key={t.id}><Link href={`/schole/topics/${t.id}`} className="hover:bg-muted inline-flex h-8 items-center rounded-full border px-3 text-sm">{t.name}</Link></li>)}
        </ul>
      </section>
    </>
  );
}

/**
 * A person in history (guide tab "People and eras", Torian 2026-11-16 04:07Z): face, name, dates and place with
 * Follow at the top right; the one filled button starts what most people should hear first, by them or about them;
 * then tabs. Music and Theatre come second for those who wrote about them; who they knew and what they read follow;
 * then Read about, and their time.
 */
export async function HistoricalPerson({ x, userId, asked }: { x: Person; userId: string; asked: string }) {
  const tabs = tabsOf(x);
  const on: Tab = (tabs as string[]).includes(asked) ? (asked as Tab) : "works";
  const known = [...x.relations, ...peopleOf(x)];
  const others = peopleOfEra(x.era).filter((o) => o.id !== x.id);
  const [items, follows, bio, faceList, otherFaces] = await Promise.all([
    listItems(userId).catch(() => []),
    followed(userId).catch(() => []),
    bioFor(x.name, `https://en.wikipedia.org/wiki/${x.wiki}`).catch(() => null),
    on === "people" ? facesOf(known) : Promise.resolve([]),
    on === "people" ? facesOf(others) : Promise.resolve([]),
  ]);
  const have = haveKeys(items);
  const faces = new Map(faceList.map((f) => [f.name, f]));
  const start = startOf(x);
  const startWork = start.work ? workById(start.work) : undefined;
  const startHref = startWork ? `/schole/audiobooks/${startWork.audiobooks[0]}` : start.item ? itemHref(start.item) : null;
  const following = follows.some((f) => f.name.toLowerCase() === x.name.toLowerCase());
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/people/history" crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }, { label: "People in history", href: "/schole/people/history" }]} title={x.name} />
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
            {startHref ? <Button asChild size="lg" className="h-10 sm:px-8"><Link href={startHref}>Start with {start.title.startsWith("The ") ? start.title : `the ${start.title}`}</Link></Button> : null}
            {x.ol ? <Link href={`/schole/authors/${x.ol}`} className="text-muted-foreground text-sm underline-offset-4 hover:underline">Books by {x.name}</Link> : null}
          </div>
        </header>
        <Tabs x={x} on={on} />
        <div className="space-y-8">
          {on === "works" ? <WorksTab x={x} have={have} /> : null}
          {on === "music" ? <MusicTab x={x} have={have} faces={faces} /> : null}
          {on === "theatre" ? <TheatreTab x={x} faces={faces} /> : null}
          {on === "people" ? <PeopleTab x={x} faces={faces} others={otherFaces} /> : null}
          {on === "read" ? <ReadingTab x={x} /> : null}
          {on === "about" ? <AboutTab x={x} have={have} /> : null}
          {on === "time" ? <TimeTab x={x} have={have} /> : null}
        </div>
      </div>
    </main>
  );
}
