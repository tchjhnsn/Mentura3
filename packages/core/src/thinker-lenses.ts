/**
 * Thinker lenses (Torian asked for advice "as if Tony Robbins were advising me"; decided on a card, 2026-11-17):
 * Reflect gives cited ideas from a thinker's works in Reflect's own voice, and never speaks as a living person.
 *
 * A lens is a thinker (linked to their Scholē page when there is one), their works, and ideas. Each idea is a short
 * statement in Reflect's words with one or more citations:
 * - to a passage Reflect holds (a public-domain text it reads from Project Gutenberg): the work, the chapter and
 *   paragraph of that text as Reflect splits it, the place as the edition numbers it, and the words, quoted exactly;
 * - for a living author, to their book by title and chapter, with at most a short phrase and never a quotation.
 *
 * Not to be confused with the journal's lenses (Log, Legacy, Qualities, Adventures), which are views across tiles.
 * Every seeded quotation was checked word for word against the Gutenberg text named, split into chapters by
 * `chaptersOf` (gutenberg.ts) as Reflect's reader splits it. An idea whose passage could not be checked is left out.
 * Pure: no I/O.
 */
import { personById, personHref } from "./historical-people";
import { traitById, type TraitId } from "./formation";

/** A work a lens draws on. `id` is its Open Library work id; `gutenberg` the Project Gutenberg text Reflect holds. */
export type LensWork = { id: string; title: string; gutenberg?: string; /** Who translated the held text; none when written in English. */ tr?: string };

/** A passage of a text Reflect holds. `chapter` (from 1) and `p` (from 0) are where Reflect's reader shows it. */
export type HeldCite = { kind: "held"; work: string; chapter: number; p: number; /** The place as the edition numbers it: "Book II, 2". */ at: string; /** Quoted exactly from the held text. */ words: string };
/** A book Reflect does not hold, cited by title and chapter; at most a short phrase, never a quotation. */
export type BookCite = { kind: "book"; title: string; chapter: string; phrase?: string };
export type LensCite = HeldCite | BookCite;

export type LensIdea = { id: string; /** In Reflect's words, never the thinker's voice. */ text: string; cites: readonly LensCite[]; /** The quality it bears on, in the Qualities lens. */ trait?: TraitId };

export type Lens = {
  id: string;
  name: string;
  /** Their Scholē page (historical-people.ts), when there is one. */
  person?: string;
  /** A living author: cited ideas only, no quotations, never first person. */
  living: boolean;
  works: readonly LensWork[];
  ideas: readonly LensIdea[];
};

/** The longest phrase a living author's citation may carry, in words. */
export const SHORT_PHRASE = 8;
const FIRST_PERSON = /\b(I|I'm|I've|I'll|I'd)\b|\b(me|my|mine|myself|we|we're|we've|us|our|ours|ourselves)\b/i;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Whether a line speaks in the first person (as the thinker would, not as Reflect). */
export const firstPerson = (s: string): boolean => FIRST_PERSON.test(s.replace(/\b[A-Z]\.\s/g, " "));

/** What is wrong with a lens, in words; empty when it may be shown. */
export function checkLens(l: Lens): string[] {
  const out: string[] = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.id)) out.push(`${l.id}: the id is not kebab-case`);
  if (l.person && !personById(l.person)) out.push(`${l.id}: no Scholē page ${l.person}`);
  const works = new Map(l.works.map((w) => [w.id, w]));
  const seen = new Set<string>();
  for (const i of l.ideas) {
    const at = `${l.id}/${i.id}`;
    if (seen.has(i.id)) out.push(`${at}: the idea id is used twice`);
    seen.add(i.id);
    if (!i.text.trim()) out.push(`${at}: the idea says nothing`);
    if (!i.cites.length) out.push(`${at}: no citation`);
    if (l.living && firstPerson(i.text)) out.push(`${at}: speaks in the first person for a living person`);
    if (i.trait && !traitById(i.trait)) out.push(`${at}: no quality ${i.trait}`);
    for (const c of i.cites) {
      if (c.kind === "held") {
        const w = works.get(c.work);
        if (l.living) out.push(`${at}: quotes a living author; cite the book by title and chapter`);
        if (!w) out.push(`${at}: cites ${c.work}, not one of the lens's works`);
        else if (!w.gutenberg) out.push(`${at}: Reflect holds no text of ${w.title}`);
        if (!c.words.trim()) out.push(`${at}: a held citation quotes nothing`);
        if (!Number.isInteger(c.chapter) || c.chapter < 1 || !Number.isInteger(c.p) || c.p < 0) out.push(`${at}: no place in the text`);
        if (!c.at.trim()) out.push(`${at}: no place as the edition numbers it`);
      } else {
        if (!c.title.trim() || !c.chapter.trim()) out.push(`${at}: a book citation needs its title and chapter`);
        if (c.phrase && words(c.phrase) > SHORT_PHRASE) out.push(`${at}: quotes more than a short phrase`);
      }
    }
  }
  return out;
}

/** A citation as words: "Meditations, Book II, 2 (tr. Meric Casaubon)", or "Title, chapter". */
export function citeLabel(l: Lens, c: LensCite): string {
  if (c.kind === "book") return `${c.title}, ${c.chapter}`;
  const w = l.works.find((x) => x.id === c.work);
  return `${w?.title ?? c.work}, ${c.at}${w?.tr ? ` (tr. ${w.tr})` : ""}`;
}

/** Where a citation opens inside Reflect: the reader at the passage, the words marked; a book Reflect does not hold opens Browse. */
export function citeHref(l: Lens, c: LensCite): string {
  if (c.kind === "book") return `/schole/browse?q=${encodeURIComponent(c.title)}`;
  const w = l.works.find((x) => x.id === c.work);
  // The reader marks at most 100 characters of a phrase; cut at a word.
  const find = c.words.length <= 100 ? c.words : c.words.slice(0, 100).replace(/\s+\S*$/, "");
  const q = new URLSearchParams({ ...(w?.gutenberg ? { t: w.gutenberg } : {}), c: String(c.chapter), p: String(c.p), find });
  return `/schole/works/${c.work}/read?${q}`;
}

/** The lens's Scholē page, when it has one. */
export const lensPersonHref = (l: Lens): string | null => {
  const x = l.person ? personById(l.person) : undefined;
  return x ? personHref(x) : null;
};

const held = (work: string, chapter: number, p: number, at: string, w: string): HeldCite => ({ kind: "held", work, chapter, p, at, words: w });

const MEDITATIONS = "OL1317211W";
const ENCHIRIDION = "OL39503682W";
const MINOR_DIALOGUES = "OL16876962W";
const AUTOBIOGRAPHY = "OL26492W";

export const LENSES: readonly Lens[] = [
  {
    id: "marcus-aurelius", name: "Marcus Aurelius", person: "marcus-aurelius", living: false,
    works: [{ id: MEDITATIONS, title: "Meditations", gutenberg: "2680", tr: "Meric Casaubon" }],
    ideas: [
      { id: "limited-time", text: "Your time is limited. Use what remains for what matters, or it passes and does not come back.", cites: [held(MEDITATIONS, 3, 0, "Book II, 1", "there is but a certain limit of time appointed unto thee")] },
      { id: "last-action", text: "Do each task as if it were your last, wholly and without pretence; that is how a crowded mind is eased.", cites: [held(MEDITATIONS, 3, 1, "Book II, 2", "go about every action as thy last action")], trait: "focus" },
      { id: "difficult-people", text: "Expect to meet difficult people today. Their faults come from not knowing better, and they cannot harm what is truly yours.", cites: [held(MEDITATIONS, 2, 14, "Book I, 15 (Book II, 1 in other editions)", "Betimes in the morning say to thyself")], trait: "self-command" },
      { id: "retreat-within", text: "Rest does not need a retreat. The mind can withdraw into itself whenever it chooses.", cites: [held(MEDITATIONS, 5, 2, "Book IV, 3", "it is in thy power to retire into thyself")] },
      { id: "rise-for-work", text: "When getting up is hard, remember the work you exist to do.", cites: [held(MEDITATIONS, 6, 0, "Book V, 1", "it is to go about a man's work that I am stirred up")], trait: "industry" },
    ],
  },
  {
    id: "epictetus", name: "Epictetus", living: false,
    works: [{ id: ENCHIRIDION, title: "Enchiridion", gutenberg: "45109", tr: "Thomas Wentworth Higginson" }],
    ideas: [
      { id: "in-your-power", text: "Sort what is in your power (your opinions, aims and desires) from what is not (body, property, reputation), and spend effort only on the first.", cites: [held(ENCHIRIDION, 2, 26, "I", "There are things which are within our power, and there are things which are beyond our power.")], trait: "self-command" },
      { id: "judgements", text: "What upsets you is your judgement about an event, not the event itself.", cites: [held(ENCHIRIDION, 2, 37, "V", "Men are disturbed not by things, but by the views which they take of things.")] },
      { id: "want-what-happens", text: "Want things to happen as they do happen, not as you would have them.", cites: [held(ENCHIRIDION, 3, 3, "VIII", "Demand not that events should happen as you wish")] },
      { id: "your-role", text: "You do not choose the part you are given; your work is to play it well.", cites: [held(ENCHIRIDION, 3, 22, "XVII", "Remember that you are an actor in a drama")] },
    ],
  },
  {
    id: "seneca", name: "Seneca", living: false,
    works: [{ id: MINOR_DIALOGUES, title: "Minor Dialogues", gutenberg: "64576", tr: "Aubrey Stewart" }],
    ideas: [
      { id: "not-short", text: "Life is not short so much as wasted. Arranged well, it is long enough for great work.", cites: [held(MINOR_DIALOGUES, 4, 218, "Of the Shortness of Life, I", "We do not have a very short time assigned to us, but we lose a great deal of it")] },
      { id: "guard-time", text: "People guard their money closely and give their time away freely; time deserves the stricter guard.", cites: [held(MINOR_DIALOGUES, 4, 222, "Of the Shortness of Life, III", "men covetously guard their property from waste")], trait: "frugality" },
      { id: "postponement", text: "Putting things off gives up today for a tomorrow no one is promised. Live now.", cites: [held(MINOR_DIALOGUES, 4, 228, "Of the Shortness of Life, IX", "postponement is the greatest waste of life")] },
    ],
  },
  {
    id: "benjamin-franklin", name: "Benjamin Franklin", person: "benjamin-franklin", living: false,
    works: [{ id: AUTOBIOGRAPHY, title: "The Autobiography of Benjamin Franklin", gutenberg: "148" }],
    ideas: [
      { id: "one-at-a-time", text: "Work on one habit at a time, and add the next only when it holds.", cites: [held(AUTOBIOGRAPHY, 3, 21, "Part Two", "fix it on one of them at a time")], trait: "habits" },
      {
        id: "daily-record", text: "Keep a daily record of lapses against each habit; seeing the marks thin out is its own encouragement.", trait: "habits",
        cites: [
          held(AUTOBIOGRAPHY, 3, 22, "Part Two", "I made a little book, in which I allotted a page for each of the virtues."),
          held(AUTOBIOGRAPHY, 3, 39, "Part Two", "I had the satisfaction of seeing them diminish"),
        ],
      },
      { id: "order", text: "Give each thing a place and each part of the work its time.", cites: [held(AUTOBIOGRAPHY, 3, 20, "Part Two", "Let all your things have their places; let each part of your business have its time.")], trait: "order" },
      { id: "industry", text: "Lose no time: keep to useful work and cut what is not needed.", cites: [held(AUTOBIOGRAPHY, 3, 20, "Part Two", "Lose no time; be always employ'd in something useful; cut off all unnecessary actions.")], trait: "industry" },
    ],
  },
];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** The lens for a name or id ("seneca", "Marcus Aurelius"), if Reflect has one. */
export function lensFor(name: string): Lens | undefined {
  const n = norm(name).replace(/^the\s+/, "");
  return LENSES.find((l) => l.id === n || norm(l.name) === n || l.works.some((w) => norm(w.title) === n));
}

/** A lens by path: "seneca" is the lens, "seneca/postponement" one idea of it. */
export function lensAt(path: string): { lens: Lens; ideas: readonly LensIdea[] } | null {
  const [head = "", idea] = path.split("/").map((s) => s.trim());
  const lens = lensFor(head);
  if (!lens) return null;
  if (!idea) return { lens, ideas: lens.ideas };
  const one = lens.ideas.find((i) => i.id === idea);
  return one ? { lens, ideas: [one] } : null;
}

/** Each lens in a line: id, name, works, and how many ideas. */
export const lensList = () => LENSES.map((l) => ({ id: l.id, name: l.name, living: l.living, works: l.works.map((w) => w.title), ideas: l.ideas.length }));

/** A lens's ideas as the model reads them, each with its citations in words and their links. */
export const ideasOut = (l: Lens, ideas: readonly LensIdea[] = l.ideas) =>
  ideas.map((i) => ({ id: i.id, text: i.text, cites: i.cites.map((c) => ({ label: citeLabel(l, c), href: citeHref(l, c), ...(c.kind === "held" ? { words: c.words } : c.phrase ? { phrase: c.phrase } : {}) })) }));

/**
 * How the model applies a lens to the person's situation. With no lens for the name, Reflect holds no ideas of that
 * thinker, so it must not make any up or speak as them.
 */
export function lensGuidance(l: Lens | undefined, asked?: string): string {
  if (!l) {
    const who = asked?.trim() || "that thinker";
    return `Reflect has no lens for ${who}. Do not speak as ${who} or give advice in their voice, and do not attribute ideas to them from memory. Say so plainly, offer a lens Reflect has (call lenses), or search the library for their books (search_library) so the person can read them.`;
  }
  const voice = l.living
    ? `${l.name} is a living person: say "ideas from ${l.works.map((w) => w.title).join(" and ")}", cite the book and chapter, quote no more than a short phrase, and never speak as them or in the first person for them.`
    : `Reflect holds ${l.name}'s text, so you may quote the words given with each idea, exactly, with their citation; never speak as ${l.name} or in the first person for them.`;
  return `Apply these ideas from ${l.name} to the person's situation, in Reflect's own voice. Use only the ideas given here, cite each idea you use with its citation, and say plainly where an idea does not fit. ${voice} Facts about the person come only from what they said.`;
}
