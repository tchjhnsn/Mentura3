import type { Episode, Person, Show } from "@reflect/core/podcasts";
import { Badge } from "@/components/ui/badge";
import { Face } from "./face";

// What a feed says about a show and its episodes, beyond the audio (Torian, 2026-11-15 "Build all"): show notes with
// their links, the people on it, its season and number, and whether it is a trailer or a bonus.

export { Notes } from "./notes";

const ROLE: Record<string, string> = { host: "Host", guest: "Guest", cohost: "Co-host", "co-host": "Co-host", producer: "Producer", editor: "Editor" };

/** The people on a show or an episode, each linked to their own page when the feed gives one. */
export function People({ people }: { people: Person[] }) {
  if (!people.length) return null;
  return (
    <ul className="flex flex-wrap gap-2 text-sm">
      {people.map((p) => {
        const inner = (
          <>
            {p.image ? <Face src={p.image} /> : null}
            <span>{p.name}</span><span className="text-muted-foreground text-xs">{ROLE[p.role] ?? p.role}</span>
          </>
        );
        return <li key={`${p.name}|${p.role}`}>{p.href ? <a href={p.href} target="_blank" rel="noreferrer nofollow" className="hover:bg-accent flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1.5">{inner}</a> : <span className="flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1.5">{inner}</span>}</li>;
      })}
    </ul>
  );
}

/** Season and number, and trailer or bonus, as the feed marks them. */
export function EpisodeMarks({ e }: { e: Episode }) {
  const n = [e.season ? `Season ${e.season}` : null, e.number ? `Episode ${e.number}` : null].filter(Boolean).join(", ");
  if (!n && e.type === "full" && e.kind === "audio") return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {n ? <span className="text-muted-foreground text-xs">{n}</span> : null}
      {e.type !== "full" ? <Badge variant="secondary" className="text-[11px]">{e.type === "trailer" ? "Trailer" : "Bonus"}</Badge> : null}
      {e.kind === "video" ? <Badge variant="outline" className="text-[11px]">Video</Badge> : null}
    </span>
  );
}

/** What the show says of itself: who makes it, its categories, its people, and how to support it. */
export function ShowFacts({ show }: { show: Show }) {
  return (
    <div className="space-y-3">
      {show.about ? <p className="text-muted-foreground max-w-prose text-sm">{show.about}</p> : null}
      {show.categories.length ? <p className="flex flex-wrap gap-1.5">{show.categories.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}</p> : null}
      <People people={show.people} />
      {show.funding.length ? <p className="text-sm">{show.funding.map((f, i) => <a key={i} href={f.url} target="_blank" rel="noreferrer nofollow" className="mr-3 underline underline-offset-2">{f.text}</a>)}</p> : null}
    </div>
  );
}
