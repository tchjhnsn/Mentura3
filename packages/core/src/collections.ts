/**
 * Collections chosen by people (Torian, 2026-11-15 23:07Z, agreeing to the guide "Home, browse and library"): a few
 * things to hear or watch, put together by a named person with a line on why. Reflect chose the first ones; later
 * ambassadors and people who hold standing publish theirs. Each item is something that plays in Scholē: a LibriVox
 * recording by its id, or an Open Yale or MIT OpenCourseWare course by its page.
 *
 * A collection may name the work it serves (`for`: word stems matched against what the person is working toward in
 * Work), so a new Home and Browse's For you can say why they suggest it. Pure: no I/O.
 */

export type CollectionItem =
  | { kind: "audiobook"; id: string; title: string; by: string }
  | { kind: "course"; url: string; title: string; by: string };

export type Collection = {
  id: string;
  name: string;
  about: string;
  /** Who chose it. */
  by: string;
  /** Stems of the work it serves; empty when it serves anyone. */
  for: readonly string[];
  items: readonly CollectionItem[];
};

const ab = (id: string, title: string, by: string): CollectionItem => ({ kind: "audiobook", id, title, by });
const course = (url: string, title: string, by: string): CollectionItem => ({ kind: "course", url, title, by });

export const COLLECTIONS: readonly Collection[] = [
  {
    id: "greeks", name: "Start with the Greeks", by: "Reflect", for: [],
    about: "Where the questions began: Socrates on trial, Plato's city, Aristotle on the good life and the polis, and the two poems the Greeks learned first.",
    items: [
      ab("1268", "Apology of Socrates", "Plato"),
      ab("2707", "Republic", "Plato"),
      ab("3733", "Nicomachean Ethics", "Aristotle"),
      ab("1360", "Politics", "Aristotle"),
      ab("690", "Iliad", "Homer"),
      ab("65", "Odyssey", "Homer"),
      course("https://oyc.yale.edu/classics/clcv-205", "Introduction to Ancient Greek History", "Donald Kagan"),
    ],
  },
  {
    id: "teaching", name: "On teaching", by: "Reflect", for: ["teach", "tutor", "educat", "school", "instruct", "professor", "coach", "mentor"],
    about: "How people come to know things, from those who taught: Montessori's method, Dewey on school and democracy, Helen Keller on being taught, and Booker T. Washington building a school.",
    items: [
      ab("1836", "Montessori Method", "Maria Montessori"),
      ab("4492", "Democracy and Education", "John Dewey"),
      ab("884", "Story of My Life", "Helen Keller"),
      ab("2632", "Up from Slavery", "Booker T. Washington"),
    ],
  },
  {
    id: "care", name: "Medicine and care", by: "Reflect", for: ["nurs", "doctor", "physician", "medic", "health", "care", "therap", "pharm", "surgeon"],
    about: "The nurse who founded modern nursing on what care asks of you, and the anatomy medical students have learned from since 1858.",
    items: [
      ab("4247", "Notes on Nursing", "Florence Nightingale"),
      ab("2482", "Anatomy of the Human Body, Part 1", "Henry Gray"),
    ],
  },
  {
    id: "founding", name: "The American founding", by: "Reflect", for: ["law", "lawyer", "attorney", "judge", "politic", "government", "civic", "public", "policy", "legislat"],
    about: "The arguments that made the United States, in the founders' words, with Yale's course on the Revolution.",
    items: [
      ab("1126", "Common Sense", "Thomas Paine"),
      ab("670", "Federalist Papers", "Alexander Hamilton, John Jay, James Madison"),
      ab("1085", "Anti-Federalist Papers", "Patrick Henry"),
      ab("1143", "Autobiography of Benjamin Franklin", "Benjamin Franklin"),
      course("https://oyc.yale.edu/history/hist-116", "The American Revolution", "Joanne Freeman"),
    ],
  },
  {
    id: "making-a-living", name: "Making a living", by: "Reflect", for: ["business", "entrepreneur", "founder", "owner", "sales", "manag", "trade", "financ", "engineer", "electric", "carpent", "plumb", "mechanic", "build", "craft"],
    about: "Work, trade and building, from people who did them: Franklin's own account, Smiles on the Stephensons, Adam Smith on the division of labour.",
    items: [
      ab("1143", "Autobiography of Benjamin Franklin", "Benjamin Franklin"),
      ab("3823", "George and Robert Stephenson", "Samuel Smiles"),
      ab("3700", "Acres of Diamonds", "Russell Conwell"),
      ab("16476", "Thrift", "Samuel Smiles"),
      ab("1756", "Wealth of Nations, Book 1", "Adam Smith"),
    ],
  },
  {
    id: "programming", name: "Learn to program", by: "Reflect", for: ["program", "software", "develop", "computer", "data", "web", "code", "engineer", "analyst"],
    about: "MIT's first course in programming, then the mathematics and physics under it.",
    items: [
      course("https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/", "Introduction to Computer Science and Programming in Python", "Ana Bell, Eric Grimson and John Guttag"),
      course("https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/", "Linear Algebra", "Gilbert Strang"),
      course("https://oyc.yale.edu/physics/phys-200", "Fundamentals of Physics I", "Ramamurti Shankar"),
    ],
  },
  {
    id: "stoics", name: "The Stoics", by: "Reflect", for: [],
    about: "An emperor's notebook, a freed slave's handbook and a statesman's letters on how to live well whatever happens.",
    items: [
      ab("1095", "Meditations", "Marcus Aurelius"),
      ab("518", "Enchiridion", "Epictetus"),
      ab("9230", "Moral Letters, Vol. I", "Seneca"),
    ],
  },
];

export const collectionById = (id: string): Collection | undefined => COLLECTIONS.find((c) => c.id === id);

/** Where an item opens in Scholē. */
export const itemHref = (i: CollectionItem): string => (i.kind === "audiobook" ? `/schole/audiobooks/${i.id}` : `/schole/courses?u=${encodeURIComponent(i.url)}`);

/** A stable key for an item, to tell whether the person already has it. */
export const itemKey = (i: CollectionItem): string => (i.kind === "audiobook" ? `audiobook:${i.id}` : `course:${i.url}`);

/** The first of the person's aims a collection serves, or null. Aims are what they want in Work ("Teacher"). */
export function servedAim(c: Collection, aims: readonly string[]): string | null {
  if (!c.for.length) return null;
  return aims.find((a) => { const words = a.toLowerCase(); return c.for.some((s) => words.includes(s)); }) ?? null;
}

export type Suggestion = { collection: Collection; reason: string | null };

/**
 * Collections in the order to suggest them: those serving an aim first, each with its reason ("Because you want to
 * be a Teacher"), then the ones that serve anyone, in their curated order. Collections that serve only aims the
 * person does not hold come last.
 */
export function suggestCollections(aims: readonly string[], all: readonly Collection[] = COLLECTIONS): Suggestion[] {
  const served: Suggestion[] = [], general: Suggestion[] = [], other: Suggestion[] = [];
  for (const c of all) {
    const aim = servedAim(c, aims);
    if (aim) served.push({ collection: c, reason: `For ${aim}, from your Work` });
    else if (!c.for.length) general.push({ collection: c, reason: null });
    else other.push({ collection: c, reason: null });
  }
  return [...served, ...general, ...other];
}

/** The next item of a collection the person has not begun, given the keys they have; null when they have all. */
export function nextInCollection(c: Collection, have: ReadonlySet<string>): CollectionItem | null {
  return c.items.find((i) => !have.has(itemKey(i))) ?? null;
}
