// Builds the json-render spec for one chat answer from what Reflect fetched out of its own apps. Pure, so
// every card can be checked: the model names what to show; only this file decides how it looks.
import type { Spec, UIElement } from "@json-render/core";
import type { Holder } from "@reflect/core/claims";
import type { CatalogEntry } from "@reflect/core/openlibrary";
import { categoryOf, themaCategory } from "@reflect/core/thema";
import type { BudgetView } from "@reflect/core/budget";

export type Piece =
  | { kind: "shelves"; shelves: { id: string; name: string; books: string[]; subjects: string[] }[] }
  | { kind: "claims"; claims: { text: string; stance: string | null; holders: Holder[] }[] }
  | { kind: "library"; label: string; books: CatalogEntry[]; kept: ReadonlySet<string>; /** The same list on Browse, where it goes on. */ href?: string }
  | { kind: "propose_claim"; text: string; subject?: string; holders: Holder[]; stance: string }
  | { kind: "quote"; text: string; cite: string; href: string }
  | { kind: "found_item"; medium: string; label: string; title: string; by?: string; image?: string; source: string; kept: boolean; item: string }
  | { kind: "course"; title: string; goal: string; units: string; href: string }
  | { kind: "event"; title: string; day: string; when: string; tile: string; href: string }
  | { kind: "home_card"; title: string; tile: string; lines: string[]; until: string }
  | { kind: "budget"; view: BudgetView; href: string }
  | { kind: "lens"; name: string; works: string[]; living: boolean; href: string | null; ideas: { text: string; cites: { label: string; href: string }[] }[] }
  | { kind: "note"; text: string }
  | { kind: "lifeline" }
  /** Undo for a change the chat just made in the person's own records (the change log's id). */
  | { kind: "undo"; change: string; title: string }
  /** A shared or outside change held for the person's tap: Keep for shared, Send for outside (the change log's id). */
  | { kind: "approval"; change: string; title: string; preview: string; tier: "shared" | "outside" };

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
/** The budget card's props: tiles with an allotment or a cost, each as a share of the largest figure shown. */
export function budgetCard(v: BudgetView, href: string) {
  const shown = v.tiles.filter((t) => t.allot !== null || (t.cost !== null && t.cost > 0));
  const top = Math.max(1, ...shown.map((t) => Math.max(t.allot ?? 0, t.cost ?? 0)));
  const left = v.leftToAllot >= 0 ? `${usd(v.leftToAllot)} left to allot` : `${usd(-v.leftToAllot)} more allotted than comes in`;
  return {
    title: `Budget${v.stage.id === "already" ? "" : `, ${v.stage.name}`}: ${usd(v.allotted)} a month allotted`,
    sub: `Of ${usd(v.takeHome)} a month after taxes; ${left}.`,
    href,
    rows: shown.map((t) => ({
      label: t.label,
      allot: t.allot === null ? "Not allotted" : usd(t.allot),
      cost: t.covered ? "covered" : t.cost === null ? "no cost in the plan" : `${usd(t.cost)} in the plan`,
      allotShare: (t.allot ?? 0) / top,
      costShare: t.cost === null ? null : t.cost / top,
      over: t.status === "over",
    })),
  };
}

/** The Approval card's props: the title in the person's words, the preview, and the one tap its tier asks for. */
export function approvalCard(p: { change: string; title: string; preview: string; tier: "shared" | "outside" }) {
  return { change: p.change, title: p.title.replace(/the person's/g, "your"), preview: p.preview, tap: p.tier === "outside" ? ("Send" as const) : ("Keep" as const) };
}

/** "Friday, November 20", read in UTC so the day is the day the person gave. */
const longDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const holderText = (hs: readonly Holder[]) => hs.map((h) => (h.citation ? `${h.name} (${h.citation})` : h.name)).join("; ");
const shelfName = (e: Pick<CatalogEntry, "lcc" | "subjects">) => {
  const c = categoryOf(e);
  return c ? themaCategory(c)?.short ?? c : "not yet placed";
};

/** One spec for the cards of one answer, or null when there is nothing to show. */
export function buildSpec(pieces: readonly Piece[]): Spec | null {
  const elements: Record<string, UIElement> = {};
  const root: string[] = [];
  let n = 0;
  const add = (el: UIElement) => {
    const key = `e${n++}`;
    elements[key] = el;
    root.push(key);
    return key;
  };
  const note = (text: string) => add({ type: "Note", props: { text } });
  for (const p of pieces) {
    if (p.kind === "note") note(p.text);
    else if (p.kind === "lifeline") add({ type: "Lifeline", props: {} });
    else if (p.kind === "undo") add({ type: "UndoChange", props: { change: p.change, text: `Done: ${p.title.charAt(0).toLowerCase()}${p.title.slice(1).replace(/the person's/g, "your")}.` } });
    else if (p.kind === "approval") add({ type: "Approval", props: approvalCard(p) });
    else if (p.kind === "quote") add({ type: "Quote", props: { text: p.text, cite: p.cite, href: p.href } });
    else if (p.kind === "course") add({ type: "Course", props: { title: p.title, goal: p.goal, units: p.units, href: p.href } });
    else if (p.kind === "budget") add({ type: "Budget", props: budgetCard(p.view, p.href) });
    else if (p.kind === "event") add({ type: "CalendarEvent", props: { title: p.title, day: longDay(p.day), when: p.when, tile: p.tile, href: p.href } });
    else if (p.kind === "home_card") add({ type: "HomeCard", props: { title: p.title, tile: p.tile, lines: p.lines, until: `Until ${longDay(p.until)}` } });
    else if (p.kind === "lens") {
      if (!p.ideas.length) note(`No ideas from ${p.name} here.`);
      else add({ type: "Lens", props: { title: `Ideas from ${p.living ? p.works.join(" and ") : p.name}`, works: p.living ? p.name : p.works.join(", "), href: p.href, ideas: p.ideas } });
    }
    else if (p.kind === "found_item") add({ type: "FoundItem", props: { medium: p.label, title: p.title, by: p.by ?? null, image: p.image ?? null, source: p.source, kept: p.kept, item: p.item } });
    else if (p.kind === "shelves") {
      if (!p.shelves.length) note("No shelves yet. Books go on a shelf once they have a call number.");
      for (const s of p.shelves) add({ type: "Shelf", props: { id: s.id, name: s.name, books: s.books, subjects: s.subjects } });
    } else if (p.kind === "claims") {
      if (!p.claims.length) note("You keep no claims yet.");
      for (const c of p.claims) add({ type: "Claim", props: { text: c.text, stance: c.stance ?? "no stance", holders: holderText(c.holders) } });
    } else if (p.kind === "library") {
      if (!p.books.length) note(`The open library has nothing for ${p.label}.`);
      for (const b of p.books) {
        add({
          type: "LibraryBook",
          props: { title: b.title, by: b.authors.join(", ") || "unknown author", shelf: shelfName(b), onShelves: p.kept.has(b.work), entry: JSON.stringify(b) },
        });
      }
      if (p.books.length && p.href?.startsWith("/schole/browse")) add({ type: "BrowseLink", props: { href: p.href, label: `See more of ${p.label} on Browse` } });
    } else {
      const claim = { text: p.text, holders: p.holders, stance: p.stance, ...(p.subject ? { subject: p.subject } : {}) };
      add({
        type: "ProposeClaim",
        props: { text: p.text, stance: p.stance, holders: holderText(p.holders), subject: p.subject ?? null, claim: JSON.stringify(claim) },
      });
    }
  }
  if (!root.length) return null;
  elements.root = { type: "Stack", props: {}, children: root };
  return { root: "root", elements };
}
