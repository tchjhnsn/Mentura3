import Link from "next/link";
import { bareName, episodeBooks, showBooks, type Guest } from "@reflect/core/guests";
import type { NoteBlock, Show } from "@reflect/core/podcasts";
import { bioFor, booksFound } from "@/server/guests";
import { learnView } from "@/server/learn-store";
import { BookGrid } from "../book-card";
import { hostsOf } from "@/server/people";

/** A show's hosts, from Wikidata or its feed, each opening their page. */
export async function ShowHosts({ show, link }: { show: Show; link: string | null; }) {
  const hosts = await hostsOf(show, link).catch(() => []);
  return <PeopleRow people={hosts.map((h) => ({ name: h.name, ...(h.wiki ? { wiki: h.wiki } : {}), ...(h.qid ? { qid: h.qid } : {}) }))} show={{ feed: show.feed, title: show.title }} title={hosts.length === 1 ? "Host" : "Hosts"} />;
}

/** A guest's page, carrying the show they were found on. */
export type PersonRef = Guest & { qid?: string };
export const guestHref = (g: PersonRef, show?: { feed: string; title: string } | null) => {
  const q = new URLSearchParams();
  if (show) { q.set("u", show.feed); q.set("t", show.title); }
  if (g.wiki) q.set("w", g.wiki);
  if (g.qid) q.set("q", g.qid);
  return `/schole/people/${encodeURIComponent(bareName(g.name))}${q.size ? `?${q}` : ""}`;
};

/**
 * People as faces (Torian, 2026-11-15 17:22Z): each person's picture (the feed's own, else their Wikipedia photo) over
 * their name, opening their profile. A row that swipes on a phone and wraps on a wider screen.
 */
export async function PeopleRow({ people, show, title = "Guests", small = false }: { people: PersonRef[]; show: { feed: string; title: string } | null; title?: string; /** 48 px faces, for a side column or a tab. */ small?: boolean }) {
  if (!people.length) return null;
  const face = small ? "size-12" : "size-16";
  const some = people.slice(0, 16);
  const bios = await Promise.all(some.map((p) => (p.image ? Promise.resolve(null) : bioFor(p.name, p.wiki).catch(() => null))));
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <ul className="-mx-6 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {some.map((p, i) => {
          const image = p.image ?? bios[i]?.image ?? null;
          return (
            <li key={p.name} className={`${small ? "w-16" : "w-20"} shrink-0 snap-start`}>
              <Link href={guestHref(p, show)} className="group flex flex-col items-center gap-1.5 text-center">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" loading="lazy" className={`${face} rounded-full border object-cover transition-opacity group-hover:opacity-80`} />
                ) : <span aria-hidden className={`bg-muted text-muted-foreground flex ${face} items-center justify-center rounded-full ${small ? "text-sm" : "text-lg"} font-medium group-hover:opacity-80`}>{bareName(p.name).split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>}
                <span className="line-clamp-2 text-xs font-medium leading-tight group-hover:underline">{p.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The books an episode's notes mention that Open Library has, as covers that open each book's page. */
export async function EpisodeBooks({ notes, userId }: { notes: readonly NoteBlock[]; userId: string }) {
  const mentions = episodeBooks(notes);
  if (!mentions.length) return null;
  const [books, view] = await Promise.all([booksFound(mentions), learnView(userId)]);
  if (!books.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Books mentioned</h2>
      <BookGrid books={books} mine={new Map(view.books.filter((b) => b.catalog?.work).map((b) => [b.catalog!.work, b.status]))} row />
    </section>
  );
}

/** The books a show's episodes mention most, as covers. */
export async function ShowBooks({ show, userId, limit = 12, cols }: { show: Pick<Show, "episodes">; userId: string; limit?: number; cols?: string }) {
  const mentions = showBooks(show, 18);
  if (!mentions.length) return null;
  const [books, view] = await Promise.all([booksFound(mentions, limit), learnView(userId)]);
  if (!books.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Books mentioned most</h2>
      <BookGrid books={books.slice(0, limit)} mine={new Map(view.books.filter((b) => b.catalog?.work).map((b) => [b.catalog!.work, b.status]))} row {...(cols ? { cols } : {})} />
    </section>
  );
}

/**
 * People as one line in a hero (Scholē page priority guides, 2026-11-15): their faces small and stacked, then "with"
 * and their names, each opening their profile. A show's hosts, an episode's guests.
 */
export async function PeopleLine({ people, show }: { people: PersonRef[]; show: { feed: string; title: string } | null }) {
  const refs = people.slice(0, 6);
  if (!refs.length) return null;
  const bios = await Promise.all(refs.slice(0, 4).map((p) => (p.image ? Promise.resolve({ image: p.image }) : bioFor(p.name, p.wiki).catch(() => null))));
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="flex -space-x-1.5" aria-hidden>
        {refs.slice(0, 4).map((p, i) => bios[i]?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.name} src={bios[i]!.image!} alt="" className="ring-background size-6 rounded-full object-cover ring-2" />
        ) : <span key={p.name} className="bg-muted text-muted-foreground ring-background flex size-6 items-center justify-center rounded-full text-[10px] font-medium ring-2">{bareName(p.name).split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>)}
      </span>
      <span className="text-muted-foreground">with</span>
      <span>{refs.map((p, i) => (
        <span key={p.name}>{i ? (i === refs.length - 1 ? " and " : ", ") : ""}<Link href={guestHref(p, show)} className="font-medium underline-offset-4 hover:underline">{p.name}</Link></span>
      ))}{people.length > refs.length ? <span className="text-muted-foreground"> and {people.length - refs.length} more</span> : null}</span>
    </p>
  );
}

/** A show's hosts as one line in its hero. */
export async function HostsLine({ show, link }: { show: Show; link: string | null }) {
  const hosts = await hostsOf(show, link).catch(() => []);
  return <PeopleLine people={hosts.map((h) => ({ name: h.name, ...(h.wiki ? { wiki: h.wiki } : {}), ...(h.qid ? { qid: h.qid } : {}) }))} show={{ feed: show.feed, title: show.title }} />;
}
