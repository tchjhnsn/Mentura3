/**
 * Ideas and terms (Torian, 2026-11-16 07:23Z, 07:33Z "let's start there", 07:41Z "continue"; guide tab "Ideas and terms").
 * An idea is one of the 102 Great Ideas of Adler's Syntopicon (1952), with the passages that discuss it, each cited by
 * standard numbering. "How often" is the number of works with a cited passage; editors add passages and nothing counts
 * words. A term is a later word for part of an idea, with its origin, the passages before the word, things to hear
 * and read, and stories and cases to spot it in. The exercises are prompts that open the journal (07:41Z: an essay
 * or the full journal, not small notes). Quotes are checked word for word against public-domain texts.
 */
import type { CollectionItem } from "./collections";
import { en, p, type Passage } from "./historical";

/** A passage on an idea: what it is about, whose it is, and the era it belongs to. */
export type IdeaPassage = { what: string; by: string; era: "Greeks" | "Middle Ages" | "Enlightenment" | "American founding"; at: Passage };

export type Idea = {
  id: string;
  name: string;
  /** Where the idea is listed as one. */
  from: string;
  about: string;
  /** The passage to start with, by its work id. */
  start: string;
  passages: readonly IdeaPassage[];
  terms: readonly string[];
  articles: readonly { title: string; note: string }[];
};

/** A story to spot the term in: a short public-domain passage. */
export type Story = { what: string; by: string; at: Passage; audiobook?: string };
/** A real case, read as an article. */
export type Case = { what: string; when: string; article: string };

export type Term = {
  id: string;
  name: string;
  idea: string;
  /** One plain sentence. */
  meaning: string;
  /** Where the word came from, dated, with the source the dates come from. */
  origin: readonly { when: string; what: string }[];
  originSource: string;
  before: readonly IdeaPassage[];
  listen: readonly CollectionItem[];
  articles: readonly { title: string; note: string }[];
  stories: readonly Story[];
  cases: readonly Case[];
};

export const IDEAS: readonly Idea[] = [
  {
    id: "justice",
    name: "Justice",
    from: "One of the 102 Great Ideas of Mortimer Adler's Syntopicon (Great Books of the Western World, 1952)",
    about: "What is owed to others, and whether a person is just only for fear of being seen.",
    start: "republic",
    passages: [
      { what: "The ring of Gyges", by: "Plato", era: "Greeks", at: p("republic", "II, 359d to 360d", "wherever any one thinks that he can safely be unjust, there he is unjust.", "Jowett") },
      { what: "Doing wrong is worse than suffering it", by: "Plato", era: "Greeks", at: p("gorgias", "469b") },
      { what: "Justice as a virtue, and the kinds of justice", by: "Aristotle", era: "Greeks", at: p("ethics", "V") },
      { what: "Of justice", by: "Thomas Aquinas", era: "Middle Ages", at: p("summa-theologica", "II-II, question 58") },
      { what: "Of justice and injustice", by: "David Hume", era: "Enlightenment", at: p("hume-treatise", "III.ii") },
      { what: "The end of government", by: "James Madison", era: "American founding", at: en("federalist", "No. 51", "Justice is the end of government. It is the end of civil society.") },
    ],
    terms: ["moral-hazard"],
    articles: [
      { title: "Ring of Gyges", note: "The story in Republic II and how it has been read since." },
      { title: "Syntopicon", note: "Adler's index of the Great Ideas, where this list comes from." },
    ],
  },
];

export const TERMS: readonly Term[] = [
  {
    id: "moral-hazard",
    name: "Moral hazard",
    idea: "justice",
    meaning: "Acting differently, taking more risk or less care, when someone else carries the cost.",
    origin: [
      { when: "17th century", what: "The term is in use." },
      { when: "Late 19th century", what: "Widely used by English insurance companies, often implying fraud by the insured." },
      { when: "1963", what: "Kenneth Arrow takes it into economics, in a paper on medical care and insurance." },
      { when: "1968", what: "Mark Pauly, The Economics of Moral Hazard, argues it is ordinary response to price, not a moral failing." },
    ],
    originSource: "Moral hazard",
    before: [
      { what: "The ring of Gyges: acting unseen", by: "Plato", era: "Greeks", at: p("republic", "II, 359d to 360d") },
      { what: "Directors managing other people's money", by: "Adam Smith", era: "Enlightenment", at: en("wealth-of-nations", "V.i, part III", "The directors of such companies, however, being the managers rather of other people’s money than of their own, it cannot well be expected that they should watch over it with the same anxious vigilance with which the partners in a private copartnery frequently watch over their own.") },
    ],
    listen: [
      { kind: "audiobook", id: "426", title: "The Invisible Man", by: "H. G. Wells", why: "A man who can act unseen, and what he does with it (1897)." },
    ],
    articles: [
      { title: "Moral hazard", note: "The term, its history, and its uses in insurance, finance and management." },
      { title: "Principal–agent problem", note: "When someone acts for another and their interests differ." },
      { title: "Deposit insurance", note: "Insuring bank deposits, and the risk-taking it is said to invite." },
      { title: "Too big to fail", note: "Firms rescued because their failure would harm everyone, and what that expectation does." },
    ],
    stories: [
      { what: "The ring of Gyges", by: "Plato, Republic II", at: p("republic", "II, 360b", "when he turned the collet inwards he became invisible, when outwards he reappeared.", "Jowett") },
      { what: "The Invisible Man fires the house", by: "H. G. Wells, The Invisible Man, chapter XX", at: en("The Invisible Man", "chapter XX", "Fired the house. It was the only way to cover my trail—and no doubt it was insured."), audiobook: "426" },
    ],
    cases: [
      { what: "Insured bank deposits and the risks banks take", when: "since 1933 in the United States", article: "Deposit insurance" },
      { what: "Rescues of firms too big to fail", when: "2008", article: "Too big to fail" },
    ],
  },
];

export const ideaById = (id: string): Idea | undefined => IDEAS.find((i) => i.id === id);
export const termById = (id: string): Term | undefined => TERMS.find((t) => t.id === id);

/** How many works discuss an idea: distinct works with a cited passage. */
export const worksDiscussing = (i: Idea): number => new Set(i.passages.map((x) => x.at.work)).size;

/** The work that discusses it most, by passages. */
export function mostIn(i: Idea): string {
  const n = new Map<string, number>();
  for (const x of i.passages) n.set(x.at.work, (n.get(x.at.work) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1])[0]?.[0] ?? i.start;
}

/** Ideas, most discussed first. */
export const ideasByCount = (): Idea[] => [...IDEAS].sort((a, b) => worksDiscussing(b) - worksDiscussing(a) || a.name.localeCompare(b.name));

/** The ideas a work's passages discuss: for "Ideas in this work". */
export const ideasIn = (work: string): Idea[] => IDEAS.filter((i) => i.passages.some((x) => x.at.work === work));

/** Every article an idea or term names: these are read in Scholē. */
export const ideaArticles = (): string[] => [
  ...IDEAS.flatMap((i) => i.articles.map((a) => a.title)),
  ...TERMS.flatMap((t) => [t.originSource, ...t.articles.map((a) => a.title), ...t.cases.map((c) => c.article)]),
];

/** The journal prompts a term opens, each a template with the text it starts from. */
export function termPrompts(t: Term): { own: string; essay: string; spot: (s: Story | Case) => string } {
  return {
    own: `${t.name}: ${t.meaning} When were you the one in a position to do it? When was it done to you?`,
    essay: `${t.name}: ${t.meaning}`,
    spot: (s) => "at" in s
      ? `${t.name} in ${s.what} (${s.by}): “${s.at.words ?? ""}” Who acts, and who carries the cost?`
      : `${t.name} in a real case: ${s.what}, ${s.when}. Who acts, and who carries the cost?`,
  };
}
