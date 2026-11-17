import { WITH, type Adventure } from "@reflect/core/adventures";
import { GLYPHS, MINE } from "../home-tiles";

export const tileLabel = (id: string) => MINE.find((t) => t.id === id)?.label ?? id;
export const withLabel = (id: string | null) => WITH.find((w) => w.id === id)?.label ?? null;

/** A tile's glyph, as Home draws it. */
export function TileGlyph({ id }: { id: string }) {
  const d = GLYPHS[id];
  return d ? <svg viewBox="0 0 100 100" aria-hidden="true"><path d={d} className="fill-current" fillRule="evenodd" /></svg> : null;
}

/** The line under an adventure's name: the tiles it touches and who it is with. */
export function adventureSub(a: Adventure): string | undefined {
  const parts = [a.tiles.map(tileLabel).join(", "), withLabel(a.with)].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}
