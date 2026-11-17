import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { IDEAS, WITH, type Adventure } from "@reflect/core/adventures";
import { addAdventureAction } from "./actions";
import { ADVENTURE_PHOTOS } from "@reflect/core/adventure-photos";
import { cn } from "@/lib/utils";
import { GLYPHS, MINE } from "../home-tiles";

export const tileLabel = (id: string) => MINE.find((t) => t.id === id)?.label ?? id;
export const withLabel = (id: string | null) => WITH.find((w) => w.id === id)?.label ?? null;

/** A tile's glyph, as Home draws it. */
export function TileGlyph({ id }: { id: string }) {
  const d = GLYPHS[id];
  return d ? <svg viewBox="0 0 100 100" aria-hidden="true"><path d={d} className="fill-current" fillRule="evenodd" /></svg> : null;
}

/** The photo for an adventure: its idea's photo from Wikimedia Commons, else the general one. */
export const photoOf = (a: Pick<Adventure, "ref">) => ADVENTURE_PHOTOS[a.ref ?? ""] ?? ADVENTURE_PHOTOS.default ?? null;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDay = (d: string) => `${MONTHS.at(Number(d.slice(5, 7)) - 1)} ${Number(d.slice(8))}`;

/** "Dec 12 to 14, in 23 days", or what is known of it. */
export function whenOf(a: Adventure, today: string): string | null {
  if (!a.start) return null;
  const span = a.end && a.end !== a.start ? `${shortDay(a.start)} to ${a.end.slice(5, 7) === a.start.slice(5, 7) ? Number(a.end.slice(8)) : shortDay(a.end)}` : shortDay(a.start);
  const n = Math.round((Date.parse(a.start) - Date.parse(today)) / 86400_000);
  return n > 1 ? `${span}, in ${n} days` : n === 1 ? `${span}, tomorrow` : n === 0 ? `${span}, today` : span;
}

/** Faces of the people going, as initials (accounts come with invitations). */
export function Faces({ people, size = "size-7" }: { people: string[]; size?: string }) {
  if (!people.length) return null;
  return (
    <span className="flex -space-x-2">
      {people.slice(0, 5).map((p, i) => (
        <span key={i} title={p} className={cn("bg-background text-foreground ring-background grid shrink-0 place-items-center rounded-full text-[0.65rem] font-semibold ring-2", size)}>
          {p.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
        </span>
      ))}
      {people.length > 5 ? <span className={cn("bg-muted ring-background grid place-items-center rounded-full text-[0.65rem] ring-2", size)}>+{people.length - 5}</span> : null}
    </span>
  );
}

/** A photo card: the adventure's photo with its name under it. */
export function AdventureCard({ a, sub, small = false }: { a: Adventure; sub?: string | null; small?: boolean }) {
  const p = photoOf(a);
  return (
    <Link href={`/adventures/${a.id}`} className="group grid gap-2">
      <span className={cn("bg-muted relative block overflow-hidden rounded-xl", small ? "aspect-[4/3]" : "aspect-[3/2]")}>
        {p ? <img src={`/adventure-photos/${p.image}`} alt="" className="size-full object-cover transition group-hover:scale-[1.02]" /> : null}
      </span>
      <span className="grid min-w-0">
        <span className={cn("truncate font-medium", small && "text-sm")}>{a.name}</span>
        {sub ? <span className="text-muted-foreground truncate text-sm">{sub}</span> : null}
      </span>
    </Link>
  );
}

/** The ideas as photo tiles, a tap adds one; compact, a row of chips. */
export function Ideas({ compact = false }: { compact?: boolean }) {
  const ideas = IDEAS.flatMap((g) => g.ideas);
  if (compact) return (
    <ul className="flex flex-wrap gap-2">
      {ideas.map((i) => (
        <li key={i.id}>
          <form action={addAdventureAction.bind(null, i.id)}>
            <button type="submit" className="hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition"><PlusIcon className="size-3.5" />{i.name}</button>
          </form>
        </li>
      ))}
    </ul>
  );
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {ideas.map((i) => {
        const p = photoOf({ ref: i.id });
        return (
          <li key={i.id}>
            <form action={addAdventureAction.bind(null, i.id)}>
              <button type="submit" className="group grid w-full gap-2 text-left">
                <span className="bg-muted relative block aspect-[3/2] overflow-hidden rounded-xl">
                  {p ? <img src={`/adventure-photos/${p.image}`} alt="" className="size-full object-cover transition group-hover:scale-[1.02]" /> : null}
                  <span className="bg-background/90 absolute top-2 right-2 grid size-7 place-items-center rounded-full shadow"><PlusIcon className="size-4" /></span>
                </span>
                <span className="font-medium">{i.name}</span>
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
