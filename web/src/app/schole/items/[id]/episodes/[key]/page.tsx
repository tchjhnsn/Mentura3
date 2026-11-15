import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { chaptersFromNotes, episodeDay } from "@reflect/core/podcasts";
import { episodeGuests } from "@reflect/core/guests";
import { commentsOn } from "@/server/comment-store";
import { Comments } from "../../../../podcasts/comments";
import { EpisodeBooks, GuestChips } from "../../../../podcasts/mentions";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { favoritesOf } from "@/server/favorite-store";
import { STANCES } from "@reflect/core/claims";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { getItem, listUnits } from "@/server/ways-store";
import { chaptersOf, showFor, transcriptOf } from "@/server/podcasts";
import { keepTranscript, keptTranscript } from "@/server/transcript-store";
import { Chapters } from "../../../../podcasts/chapters";
import { Notes, People } from "../../../../podcasts/parts";
import { TaskHeader } from "@/components/headers";
import { listClaims } from "@/server/claims-store";
import { UnitPlayer } from "../../../unit-player";
import { episodeTrack } from "../../../../podcasts/track";

export const metadata: Metadata = { title: "Scholē" };

/** A length as a person says it: "1h 3m", "56m". */
const said = (s: number) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h${m ? ` ${m}m` : ""}` : `${Math.max(1, m)}m`; };
export const dynamic = "force-dynamic";

/** One episode of a podcast, heard inside Reflect from the show's own feed, with its transcript when it has one. */
export default async function EpisodePage({ params, searchParams }: { params: Promise<{ id: string; key: string }>; searchParams: Promise<{ at?: string }> }) {
  const user = await requireUser();
  const { id, key } = await params;
  const item = await getItem(user.id, id);
  if (!item) notFound();
  const show = await showFor(item.url);
  const at = show?.episodes.findIndex((e) => e.key === key) ?? -1;
  if (!show || at < 0) notFound();
  const e = show.episodes[at]!;
  const [published, units, given, kept, claims, comments, favorites] = await Promise.all([
    transcriptOf(e), listUnits(user.id, id), chaptersOf(e), keptTranscript(user.id, id, key),
    listClaims(user.id).catch(() => []),
    commentsOn(user.id, show.feed, key),
    favoritesOf(user.id, id),
  ]);
  // A show that publishes no chapters often lists times in its notes; those are its chapters then.
  const chapters = given.length ? given : chaptersFromNotes(e.notes);
  const cite = [item.by, `${item.title}, “${e.title}”`].filter(Boolean).join(", ");
  // Claims kept from this episode's transcript carry its citation.
  const mineHere = claims.filter((c) => item.claimIds.includes(c.id) && c.holders.some((h) => h.citation?.startsWith(cite)));
  // A published transcript is kept too, so it can be searched with the rest.
  if (published.length && !kept) await keepTranscript(user.id, id, key, "published", published).catch(() => {});
  const transcript = published.length ? published : kept?.passages ?? [];
  const at0 = /^\d{1,6}$/.test((await searchParams).at ?? "") ? Number((await searchParams).at) : null;
  const base = { ...episodeTrack({ episodes: show.episodes, at, show: item.title, image: item.image, item: id, feed: show.feed, units }), chapters };
  // Opened from a search, it plays from the place found.
  const track = at0 !== null ? { ...base, place: at0 } : base;
  const unit = units.find((u) => u.unit === key);
  const older = show.episodes[at + 1];
  const newer = at > 0 ? show.episodes[at - 1] : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const art = e.image ?? item.image ?? show.image;
  const line = [episodeDay(e.date, today), e.season && e.number ? `S${e.season} E${e.number}` : e.number ? `E${e.number}` : null, e.seconds ? said(e.seconds) : null].filter(Boolean).join(" · ");
  const shownNotes = e.notes.length
    ? <section className="space-y-2"><h2 className="text-sm font-medium">Show notes</h2><Notes blocks={e.notes} track={e.kind === "audio" ? track : null} /></section>
    : e.about ? <p className="max-w-prose text-sm whitespace-pre-line">{e.about}</p> : null;
  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: `/schole/items/${id}`, label: "Back to the show" }} title={item.title} />
      <div className="mt-6 space-y-5">
        <header className="flex gap-4">
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt="" className="size-24 shrink-0 rounded-lg border object-cover sm:size-28" />
          ) : null}
          <div className="min-w-0 space-y-1">
            <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold tabular-nums">
              {line ? <span>{line}</span> : null}
              {e.type !== "full" ? <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{e.type === "trailer" ? "Trailer" : "Bonus"}</Badge> : null}
              {e.kind === "video" ? <Badge variant="outline" className="h-4 px-1.5 text-[10px]">Video</Badge> : null}
            </p>
            <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{e.title}</h1>
            {item.by ? <p className="text-muted-foreground">{item.by}</p> : null}
          </div>
        </header>
        <People people={e.people.filter((p) => p.role !== "guest")} />
        <GuestChips guests={episodeGuests(e, show)} show={{ feed: show.feed, title: item.title }} />
        <UnitPlayer
          item={id} unit={key} title={e.title} by={item.by} cite={cite}
          youtube={null} media={{ src: e.audio, kind: e.kind }} place={at0 ?? unit?.place ?? null} done={Boolean(unit?.doneOn)} of={null}
          transcript={transcript} notes={item.notes.filter((x) => x.unit === key)} next={older ? `/schole/items/${id}/episodes/${older.key}` : null}
          track={track} favorite={favorites.has(key)}
          between={<>{e.kind === "audio" ? <Chapters chapters={chapters} track={track} /> : null}{shownNotes}</>}
          noTranscript={<p className="text-muted-foreground text-sm">The show publishes no transcript for this episode.</p>}
        />
        {mineHere.length ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Claims you kept from this episode</h2>
            <ul className="divide-y rounded-lg border text-sm">
              {mineHere.map((c) => {
                const at = c.holders.map((h) => h.citation?.match(/, at ((?:\d+:)?\d+:\d\d)$/)?.[1]).find(Boolean);
                return (
                  <li key={c.id} className="space-y-1 px-4 py-3">
                    <p>{c.text}</p>
                    <p className="text-muted-foreground text-xs">{[c.holders.map((h) => h.name).join("; ") || null, at ?? null, c.stance ? STANCES.find((s) => s.id === c.stance!.stance)?.text : null].filter(Boolean).join(" · ")}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        <Suspense fallback={null}><EpisodeBooks notes={e.notes} userId={user.id} /></Suspense>
        <Comments comments={comments} feed={show.feed} episode={key} path={`/schole/items/${id}/episodes/${key}`} track={track} />
        {older || newer ? (
          <nav aria-label="Other episodes" className="grid gap-2 sm:grid-cols-2">
            {older ? (
              <Link href={`/schole/items/${id}/episodes/${older.key}`} className="hover:bg-accent flex items-center gap-2 rounded-lg border p-3 text-sm">
                <ChevronLeftIcon className="text-muted-foreground size-4 shrink-0" />
                <span className="min-w-0"><span className="text-muted-foreground block text-xs">Previous episode{older.date ? ` · ${episodeDay(older.date, today)}` : ""}</span><span className="line-clamp-1 font-medium">{older.title}</span></span>
              </Link>
            ) : <span className="hidden sm:block" />}
            {newer ? (
              <Link href={`/schole/items/${id}/episodes/${newer.key}`} className="hover:bg-accent flex items-center justify-end gap-2 rounded-lg border p-3 text-right text-sm">
                <span className="min-w-0"><span className="text-muted-foreground block text-xs">Next episode{newer.date ? ` · ${episodeDay(newer.date, today)}` : ""}</span><span className="line-clamp-1 font-medium">{newer.title}</span></span>
                <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
              </Link>
            ) : null}
          </nav>
        ) : null}
        <p className="text-muted-foreground text-xs">Played from the show&apos;s own feed. Reflect keeps no copy.</p>
      </div>
    </main>
  );
}
