// The turning order of names in Scholē, shared by server pages and the RotatingName client component.
import type { Lang, Name } from "@reflect/core/crafts";


/** The order the names turn in (doc "Scholē landing design guide"): English, Greek, Hebrew, Latin, French, German. */
export const LANG_ORDER: readonly Lang[] = ["en", "el", "he", "la", "fr", "de"];

/** The names in turning order, English first; languages outside the order keep their place after them. */
export function ordered(names: readonly Name[]): Name[] {
  const rank = (l: Lang) => {
    const i = LANG_ORDER.indexOf(l);
    return i < 0 ? LANG_ORDER.length : i;
  };
  return names.map((n, i) => ({ n, i })).sort((a, b) => rank(a.n.lang) - rank(b.n.lang) || a.i - b.i).map((x) => x.n);
}

/** The name after `i` among `count`, back to the first after the last. */
export const nextIndex = (i: number, count: number) => (count > 0 ? (i + 1) % count : 0);

/** A craft group's names: its English label and, where it has one, its Latin (groups turn in English and Latin only). */
export const groupNames = (g: { label: string; latin?: string }): Name[] =>
  g.latin ? [{ lang: "en", text: g.label }, { lang: "la", text: g.latin }] : [{ lang: "en", text: g.label }];

