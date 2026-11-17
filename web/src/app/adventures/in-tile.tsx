import Link from "next/link";
import { adventuresIn } from "@reflect/core/adventures";
import { adventuresOf } from "@/server/adventures";
import { AdventureCard, shortDay, tileLabel } from "./parts";

/** The adventures that touch these tiles, as photo cards in the tile (the Adventures lens, 2026-11-17); nothing when there are none. */
export async function TileAdventures({ userId, tiles }: { userId: string; tiles: readonly string[] }) {
  const all = await adventuresOf(userId);
  const seen = new Set<string>();
  const mine = tiles.flatMap((t) => adventuresIn(all, t)).filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  if (!mine.length) return null;
  return (
    <section aria-labelledby="adventures" className="grid gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="adventures" className="text-lg font-semibold">Adventures</h2>
        <Link href="/adventures" className="text-muted-foreground hover:text-foreground text-sm">See all</Link>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {mine.slice(0, 8).map((a) => (
          <li key={a.id}><AdventureCard a={a} small sub={a.done ? "Done" : a.start ? shortDay(a.start) : a.tiles.filter((t) => !tiles.includes(t)).map(tileLabel).join(", ") || "Not yet"} /></li>
        ))}
      </ul>
    </section>
  );
}
