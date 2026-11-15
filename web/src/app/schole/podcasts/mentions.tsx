import Link from "next/link";
import { bareName, episodeBooks, showBooks, type Guest } from "@reflect/core/guests";
import type { NoteBlock, Show } from "@reflect/core/podcasts";
import { booksFound } from "@/server/guests";
import { learnView } from "@/server/learn-store";
import { BookGrid } from "../book-card";

/** A guest's page, carrying the show they were found on. */
export const guestHref = (g: Guest, show: { feed: string; title: string }) =>
  `/schole/guests/${encodeURIComponent(bareName(g.name))}?u=${encodeURIComponent(show.feed)}&t=${encodeURIComponent(show.title)}${g.wiki ? `&w=${encodeURIComponent(g.wiki)}` : ""}`;

/** Guests as chips, each opening the guest's page. */
export function GuestChips({ guests, show, title = "Guests" }: { guests: Guest[]; show: { feed: string; title: string }; title?: string }) {
  if (!guests.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {guests.map((g) => (
          <li key={g.name}>
            <Link href={guestHref(g, show)} className="hover:bg-accent flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm">
              <span aria-hidden className="bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-[11px] font-medium">{bareName(g.name).split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
              {g.name}
            </Link>
          </li>
        ))}
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
      <h2 className="text-sm font-medium">Books mentioned</h2>
      <BookGrid books={books} mine={new Map(view.books.filter((b) => b.catalog?.work).map((b) => [b.catalog!.work, b.status]))} row />
    </section>
  );
}

/** The books a show's episodes mention most, as covers. */
export async function ShowBooks({ show, userId }: { show: Pick<Show, "episodes">; userId: string }) {
  const mentions = showBooks(show, 18);
  if (!mentions.length) return null;
  const [books, view] = await Promise.all([booksFound(mentions, 12), learnView(userId)]);
  if (!books.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium">Books mentioned most</h2>
      <BookGrid books={books} mine={new Map(view.books.filter((b) => b.catalog?.work).map((b) => [b.catalog!.work, b.status]))} row />
    </section>
  );
}
