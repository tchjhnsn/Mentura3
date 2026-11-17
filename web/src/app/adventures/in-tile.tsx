import { CompassIcon } from "lucide-react";
import { adventuresIn } from "@reflect/core/adventures";
import { Group, Row } from "@/components/list-rows";
import { adventuresOf } from "@/server/adventures";
import { tileLabel, withLabel } from "./parts";

/** The adventures that touch these tiles, shown in the tile (the Adventures lens, 2026-11-17); nothing when there are none. */
export async function TileAdventures({ userId, tiles }: { userId: string; tiles: readonly string[] }) {
  const all = await adventuresOf(userId);
  const seen = new Set<string>();
  const mine = tiles.flatMap((t) => adventuresIn(all, t)).filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  if (!mine.length) return null;
  return (
    <Group title="Adventures" id="adventures">
      {mine.map((a) => (
        <Row key={a.id} href={`/adventures/${a.id}`} icon={<CompassIcon />} label={a.name}
          sub={[a.tiles.filter((t) => !tiles.includes(t)).map(tileLabel).join(", "), withLabel(a.with)].filter(Boolean).join(" · ") || undefined}
          value={a.done ? "Done" : "Not yet"} />
      ))}
    </Group>
  );
}
