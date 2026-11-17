import type { Metadata } from "next";
import { exemplarForPage } from "@reflect/core/formation";
import { QualitiesInTheirWords } from "../qualities";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MicIcon } from "lucide-react";
import { bareName, episodeGuests } from "@reflect/core/guests";
import { episodeDay, episodeKey } from "@reflect/core/podcasts";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { showFor } from "@/server/podcasts";
import { appearancesOf, bioFor } from "@/server/guests";
import { browseCrumbs } from "../../crumbs";
import { followed, personFacts } from "@/server/people";
import { unshout, type Link as Account } from "@reflect/core/people";
import { GlobeIcon } from "lucide-react";
import { PersonFollowButton } from "../follow-button";
import { LatestCards, type LatestCard } from "../latest";
import { Clamp } from "../clamp";
import { ShowTiles, type ShowTile } from "../show-tiles";
import type { Track } from "../../player";
import { personById, personNamed } from "@reflect/core/historical-people";
import { HistoricalPerson } from "../historical";
import { scholarNamed } from "@reflect/core/scholars";
import { ScholarPerson } from "../scholar";

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const raw = decodeURIComponent((await params).name);
  return { title: (personNamed(raw) ?? personById(raw) ?? scholarNamed(raw))?.name ?? "Person" };
}
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const said = (s: number) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h${m ? ` ${m}m` : ""}` : `${Math.max(1, m)}m`; };

type Row = { key: string; title: string; show: string | null; date: string | null; seconds: number | null; image: string | null; href: string };

function Episodes({ rows, today }: { rows: Row[]; today: string }) {
  return (
    <ul className="divide-y">
      {rows.map((r) => (
        <li key={r.key}>
          <Link href={r.href} className="hover:bg-accent -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5">
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image} alt="" loading="lazy" className="size-12 shrink-0 rounded-md border object-cover" />
            ) : <span className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-md border"><MicIcon className="size-4" /></span>}
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-[15px] leading-snug font-medium">{unshout(r.title)}</span>
              <span className="text-muted-foreground block truncate text-xs">{[r.show, episodeDay(r.date, today), r.seconds ? said(r.seconds) : null].filter(Boolean).join(" · ")}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const ICON: Record<Account["kind"], React.ReactNode> = {
  x: <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.4 22H3.3l7.3-8.3L1 2h6.3l4.4 5.8L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z" /></svg>,
  instagram: <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>,
  youtube: <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15.1V8.9l5.7 3.1-5.7 3.1Z" /></svg>,
  tiktok: <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current"><path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.2 6.2 0 1 0 5.3 6.2V8.6a7.9 7.9 0 0 0 4.4 1.4V6.7A4.5 4.5 0 0 1 16.6 2Z" /></svg>,
  site: <GlobeIcon className="size-4" />,
};
const NAMED: Record<Account["kind"], string> = { x: "X", instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok", site: "Website" };
const H2 = "text-base font-semibold";

/**
 * A person's own profile (Torian, 2026-11-15 16:20Z, widened 16:47Z, laid out 17:07Z, 17:22Z): it belongs to no
 * show. Their name with Follow at the top right, as a show's page has it; who they are in two lines from Wikipedia;
 * their accounts as icons (X first); the podcasts they host and the newest episodes of them; and their guest
 * appearances on any show, each heard here. Reached from a show, it also lists their episodes on that show. Laid out
 * by the Scholē page priority guides (2026-11-15): the podcasts they host are tiles in the hero, since hosting is the
 * most important thing to know about a host, with the latest episode played from the art.
 */
export default async function PersonPage({ params, searchParams }: { params: Promise<{ name: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const raw = decodeURIComponent((await params).name);
  // A person in history has a page of their own, by name or by id.
  const past = personNamed(raw) ?? personById(raw);
  if (past) { const t = (await searchParams).tab; return <HistoricalPerson x={past} userId={user.id} asked={typeof t === "string" ? t : ""} />; }
  // A scholar a course reads has a page of their works and recordings.
  const scholar = scholarNamed(raw);
  if (scholar) return <ScholarPerson x={scholar} userId={user.id} />;
  const name = bareName(raw).slice(0, 80);
  if (!/^[\p{L}][\p{L}'’. -]{2,79}$/u.test(name)) notFound();
  const sp = await searchParams;
  const feed = one(sp.u);
  const showTitle = one(sp.t).slice(0, 200);
  const wiki = /^https:\/\/en\.wikipedia\.org\/wiki\/\S+$/.test(one(sp.w)) ? one(sp.w) : null;
  const [bio, elsewhere, show, items] = await Promise.all([
    bioFor(name, wiki), appearancesOf(name), /^https?:\/\/\S+$/.test(feed) ? showFor(feed) : Promise.resolve(null), listItems(user.id),
  ]);
  const given = /^Q\d{1,12}$/.test(one(sp.q)) ? one(sp.q) : null;
  const qid = given ?? bio?.qid ?? null;
  const [facts, follows] = await Promise.all([personFacts(qid, name), followed(user.id)]);
  const following = follows.some((f) => f.name.toLowerCase() === name.toLowerCase());
  // The Wikipedia page is surely theirs when the show linked it, Wikidata named it, or Wikidata calls them a podcast's host.
  const sure = Boolean(wiki || (given && bio?.qid === given) || facts.known);
  const own = new Set(facts.shows.map((x) => x.title.toLowerCase()));
  const today = new Date().toISOString().slice(0, 10);
  const keptBy = new Map(items.filter((i) => i.medium === "podcast" && i.url).map((i) => [i.url!, i.id]));
  const lower = name.toLowerCase();
  const title = showTitle || show?.title || "";
  const showHref = show ? `/schole/podcasts?u=${encodeURIComponent(feed)}&t=${encodeURIComponent(title)}` : null;
  // The newest episodes of the shows they host, two from each, newest first.
  const theirs = await Promise.all(facts.shows.filter((x) => x.feed).slice(0, 3).map((x) => showFor(x.feed!).then((s) => ({ x, s })).catch(() => ({ x, s: null }))));
  const latest: LatestCard[] = theirs.flatMap(({ x, s }) => (s ? s.episodes.slice(0, 2).map((e) => {
    const kept = keptBy.get(x.feed!) ?? keptBy.get(s.feed) ?? null;
    return { feed: s.feed, item: kept, key: e.key, show: x.title, title: unshout(e.title), date: e.date ?? "", day: episodeDay(e.date, today) ?? "", seconds: e.seconds, image: e.image ?? s.image ?? x.image ?? null, audio: e.audio, kind: e.kind, href: kept ? `/schole/items/${kept}/episodes/${e.key}` : `/schole/podcasts/episode?u=${encodeURIComponent(s.feed)}&k=${e.key}&t=${encodeURIComponent(x.title)}` };
  }) : [])).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map(({ date: _date, ...c }) => c);
  // Their episodes on the show they were found on, then on any other show Apple knows of.
  const onShow: Row[] = show ? show.episodes.filter((e) => episodeGuests(e, show).some((g) => bareName(g.name).toLowerCase() === lower)).map((e) => {
    const kept = keptBy.get(feed) ?? keptBy.get(show.feed);
    return { key: e.key, title: e.title, show: null, date: e.date, seconds: e.seconds, image: e.image ?? show.image, href: kept ? `/schole/items/${kept}/episodes/${e.key}` : `/schole/podcasts/episode?u=${encodeURIComponent(feed)}&k=${e.key}&t=${encodeURIComponent(title)}` };
  }) : [];
  const shown = new Set(onShow.map((r) => r.key));
  const others: Row[] = elsewhere.filter((a) => !own.has(a.show.toLowerCase())).filter((a) => !(show && ((a.feed === show.feed && shown.has(episodeKey(a.guid))) || onShow.some((r) => r.title === a.title)))).map((a) => {
    const k = episodeKey(a.guid);
    const kept = keptBy.get(a.feed);
    return { key: `${a.feed}|${k}`, title: a.title, show: a.show, date: a.date, seconds: a.seconds, image: a.image, href: kept ? `/schole/items/${kept}/episodes/${k}` : `/schole/podcasts/episode?u=${encodeURIComponent(a.feed)}&k=${k}&t=${encodeURIComponent(a.show)}` };
  });
  const follow = <PersonFollowButton name={name} qid={qid} following={following} />;
  const exemplar = exemplarForPage(name);
  const count = (n: number) => <span className="text-muted-foreground font-normal"> {n}</span>;
  const tiles: ShowTile[] = facts.shows.map((x) => {
    const link = x.feed ?? (x.apple ? `https://podcasts.apple.com/us/podcast/id${x.apple}` : null);
    const s = theirs.find((t) => t.x.title === x.title)?.s ?? null;
    const e = s?.episodes.find((y) => y.kind === "audio");
    const kept = x.feed ? keptBy.get(x.feed) ?? (s ? keptBy.get(s.feed) : undefined) ?? null : null;
    const latestTrack: Track | null = s && e ? { id: `episode:${kept ?? s.feed}:${e.key}`, src: e.audio, title: unshout(e.title), show: x.title, image: e.image ?? s.image ?? x.image ?? null, href: kept ? `/schole/items/${kept}/episodes/${e.key}` : `/schole/podcasts/episode?u=${encodeURIComponent(s.feed)}&k=${e.key}&t=${encodeURIComponent(x.title)}`, item: kept, unit: e.key, place: null, seconds: e.seconds, next: null } : null;
    return { title: x.title, image: x.image ?? s?.image ?? null, latest: latestTrack, href: link ? `/schole/podcasts?u=${encodeURIComponent(link)}&t=${encodeURIComponent(x.title)}${x.image ? `&i=${encodeURIComponent(x.image)}` : ""}` : null };
  });
  const accounts = facts.links.length ? (
    <ul className="flex flex-wrap items-center gap-0.5">
      {facts.links.map((l) => (
        <li key={l.href}>
          <a href={l.href} target="_blank" rel="noreferrer nofollow" aria-label={`${name} on ${NAMED[l.kind]}${l.kind === "x" || l.kind === "site" ? ` (${l.label})` : ""}`} title={l.kind === "x" || l.kind === "site" ? l.label : NAMED[l.kind]} className="hover:bg-accent text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-full">
            {ICON[l.kind]}
          </a>
        </li>
      ))}
    </ul>
  ) : null;
  const photo = bio?.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={bio.image} alt="" className="size-24 shrink-0 rounded-full border object-cover shadow-sm sm:size-[120px]" />
  ) : <span aria-hidden className="bg-muted text-muted-foreground flex size-24 shrink-0 items-center justify-center rounded-full text-2xl font-medium sm:size-[120px]">{name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>;
  return (
    <main className={PAGE}>
      <ThingHeader back={showHref ?? "/schole/browse?m=podcast"} crumbs={browseCrumbs("podcast")} title={name} action={follow} />
      <div className="mt-6 space-y-10">
        {/* On a phone the photo sits on its own row with Follow beside it, so the name gets the full width. */}
        <header className="sm:flex sm:items-start sm:gap-6">
          <div className="flex items-start justify-between gap-4">
            {photo}
            <div className="sm:hidden">{follow}</div>
          </div>
          <div className="mt-4 min-w-0 flex-1 space-y-4 sm:mt-0">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
                {bio?.description ? <p className="text-muted-foreground text-base">{bio.description.replace(/^./, (c) => c.toUpperCase())}</p> : null}
              </div>
              <div className="hidden items-center gap-2 sm:flex">{accounts}{follow}</div>
            </div>
            <div className="sm:hidden">{accounts}</div>
            {bio ? (
              <div className="text-muted-foreground">
                <Clamp text={bio.about}>
                  From <a href={bio.href} target="_blank" rel="noreferrer" className="underline underline-offset-2">Wikipedia</a>{sure ? "." : ". A Wikipedia page by this name may be about someone else."}
                </Clamp>
              </div>
            ) : null}
            {tiles.length ? (
              <section className="space-y-2 pt-1">
                <h2 className="text-muted-foreground text-sm font-medium">{tiles.length === 1 ? "Their podcast" : "Their podcasts"}</h2>
                <ShowTiles tiles={tiles} />
              </section>
            ) : null}
          </div>
        </header>
        <div className="max-w-3xl space-y-10">
          {exemplar ? <QualitiesInTheirWords e={exemplar} userId={user.id} back={`/schole/people/${encodeURIComponent(name)}`} /> : null}
          {latest.length ? <section className="space-y-3"><h2 className={H2}>Latest from {facts.shows.length === 1 ? "their podcast" : "their podcasts"}</h2><LatestCards cards={latest} /></section> : null}
          {onShow.length ? <section className="space-y-3"><h2 className={H2}>On {title}{count(onShow.length)}</h2><p className="text-muted-foreground -mt-2 text-xs">The show you came from.</p><Episodes rows={onShow} today={today} /></section> : null}
          {others.length ? <section className="space-y-3"><h2 className={H2}>Guest appearances{count(others.length)}</h2><Episodes rows={others} today={today} /><p className="text-muted-foreground text-xs">Episodes of other people&apos;s shows that name {name}, from Apple Podcasts&apos; search; each plays here.</p></section> : null}
          {!onShow.length && !others.length && !latest.length ? <p className="text-muted-foreground text-sm">No episodes found that name {name}.</p> : null}
        </div>
      </div>
    </main>
  );
}
