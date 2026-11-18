import { cardLines, type HomeCard } from "@reflect/core/home-cards";
import { hrefOf, MINE } from "./home-tiles";
import type { CardView } from "./home-cards";

/** A Home card as the strip draws it, its words worked out for today. */
export function cardView(c: HomeCard, today: string): CardView {
  const t = MINE.find((x) => x.id === c.tile);
  return {
    id: c.id, title: c.title, tile: t?.label ?? c.tile, href: t ? hrefOf(t) : null, kind: c.content.kind,
    lines: cardLines(c, today), items: c.content.kind === "checklist" ? c.content.items : [], marked: c.content.kind === "streak" && c.content.days.includes(today),
  };
}

