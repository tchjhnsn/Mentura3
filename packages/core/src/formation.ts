/**
 * What a person wants to become, and the traits that make it (Torian, 2026-11-16 23:42Z: curate "around forming
 * someone into a particular thing", as fanout.sh forms AI researchers; "if the role is more broad and general, like a
 * founder, then we curate around traits that these founders have, and they can choose the type of founders that
 * inspire them and the traits that they need"). Doc: "Scholē subjects by ICP and recommendations".
 *
 * A broad role (founder, statesman) names people who did it. Each person names traits, and every trait a person names
 * carries the passage where they name it, quoted from their own book (checked against the Project Gutenberg text).
 * No trait is ever inferred from a life without a source. Each trait points at the playlists that teach it. Pure: no
 * I/O.
 */
import type { CollectionItem } from "./collections";

type Book = CollectionItem & { kind: "audiobook" };
const ab = (id: string, title: string, by: string, why: string): Book => ({ kind: "audiobook", id, title, by, why });

export type TraitId = "focus" | "frugality" | "industry" | "order" | "perseverance" | "courage" | "service" | "integrity" | "self-command";

export type Trait = {
  id: TraitId;
  name: string;
  /** One line on what it is, in plain words. */
  about: string;
  /** Playlists (collection ids) that teach it, best first. */
  playlists: readonly string[];
};

export const TRAITS: readonly Trait[] = [
  { id: "focus", name: "Focus on one thing", about: "Choosing one line of work and mastering it rather than scattering effort.", playlists: ["making-a-living", "stoics"] },
  { id: "frugality", name: "Frugality", about: "Wasting nothing, and knowing where every dollar goes.", playlists: ["making-a-living", "founding"] },
  { id: "industry", name: "Industry", about: "Working thoroughly and without wasting time.", playlists: ["making-a-living", "greeks"] },
  { id: "order", name: "Order", about: "A place for everything and a time for each part of the work.", playlists: ["making-a-living", "stoics"] },
  { id: "perseverance", name: "Perseverance", about: "Staying on the right path until it succeeds.", playlists: ["stoics", "making-a-living"] },
  { id: "courage", name: "Courage in failure", about: "Not fearing failure, and beginning again more wisely.", playlists: ["stoics", "socrates"] },
  { id: "service", name: "Service before profit", about: "Serving people well first, with profit as the reward of the service.", playlists: ["making-a-living", "founding"] },
  { id: "integrity", name: "Integrity", about: "Honest dealing, and wronging no one.", playlists: ["greeks", "founding"] },
  { id: "self-command", name: "Self-command", about: "Governing one's temper and passions.", playlists: ["stoics", "greeks"] },
];

export const traitById = (id: string): Trait | undefined => TRAITS.find((t) => t.id === id);

/** Where a person names a trait: their words, the book, where in it, and the recording of that book in Scholē. */
export type Evidence = { trait: TraitId; quote: string; where: string };

export type Exemplar = {
  /** The person page id when Scholē has one (historical people), else a slug of their own. */
  id: string;
  name: string;
  /** One line on who they were. */
  what: string;
  /** Their book the quotes come from, as a recording Scholē plays. */
  book: Book;
  /** Its Project Gutenberg number, where the quotes were checked. */
  gutenberg: number;
  /** Person page in Scholē, when there is one. */
  page?: string;
  traits: readonly Evidence[];
};

export const EXEMPLARS: readonly Exemplar[] = [
  {
    id: "benjamin-franklin", name: "Benjamin Franklin", what: "Printer, inventor, founder of institutions, and a framer of the United States.",
    book: ab("1143", "Autobiography of Benjamin Franklin", "Benjamin Franklin", "Where he lists the thirteen virtues he practised, one a week."), gutenberg: 20203, page: "/schole/people/benjamin-franklin",
    traits: [
      { trait: "frugality", quote: "Make no expense but to do good to others or yourself; i. e., waste nothing.", where: "the thirteen virtues, 5. Frugality" },
      { trait: "industry", quote: "Lose no time; be always employ'd in something useful; cut off all unnecessary actions.", where: "the thirteen virtues, 6. Industry" },
      { trait: "order", quote: "Let all your things have their places; let each part of your business have its time.", where: "the thirteen virtues, 3. Order" },
      { trait: "perseverance", quote: "Resolve to perform what you ought; perform without fail what you resolve.", where: "the thirteen virtues, 4. Resolution" },
      { trait: "integrity", quote: "Wrong none by doing injuries, or omitting the benefits that are your duty.", where: "the thirteen virtues, 8. Justice" },
      { trait: "self-command", quote: "Avoid extreams; forbear resenting injuries so much as you think they deserve.", where: "the thirteen virtues, 9. Moderation" },
    ],
  },
  {
    id: "andrew-carnegie", name: "Andrew Carnegie", what: "Built the Carnegie Steel Company, then gave his fortune to libraries and learning.",
    book: ab("7181", "Autobiography of Andrew Carnegie", "Andrew Carnegie", "His own account, from bobbin boy to steel."), gutenberg: 17976,
    traits: [
      { trait: "focus", quote: "I believe the true road to preeminent success in any line is to make yourself master in that line.", where: "chapter on the iron business" },
    ],
  },
  {
    id: "john-d-rockefeller", name: "John D. Rockefeller", what: "Founded Standard Oil, then the Rockefeller Foundation and the University of Chicago.",
    book: ab("6858", "Random Reminiscences of Men and Events", "John D. Rockefeller", "His short memoir of getting and giving."), gutenberg: 17090,
    traits: [
      { trait: "frugality", quote: "From early boyhood I kept a little book which I remember I called Ledger A--and this little volume is still preserved--containing my receipts and expenditures as well as an account of the small sums that I was taught to give away regularly.", where: "chapter II, The Difficult Art of Getting" },
    ],
  },
  {
    id: "henry-ford", name: "Henry Ford", what: "Founded the Ford Motor Company and made the car something working families could own.",
    book: ab("4431", "My Life and Work", "Henry Ford", "The principles he says his business ran on."), gutenberg: 7213,
    traits: [
      { trait: "courage", quote: "Failure is only the opportunity more intelligently to begin again. There is no disgrace in honest failure; there is disgrace in fearing to fail.", where: "introduction, the first of his principles of service" },
      { trait: "service", quote: "The putting of service before profit. Without a profit, business cannot extend.", where: "introduction, the third of his principles of service" },
    ],
  },
  {
    id: "p-t-barnum", name: "P. T. Barnum", what: "Showman and founder of the circus that bore his name; mayor of Bridgeport.",
    book: ab("5295", "Art of Money Getting", "P. T. Barnum", "His rules for making money, each one short."), gutenberg: 8581,
    traits: [
      { trait: "focus", quote: "Engage in one kind of business only, and stick to it faithfully until you succeed, or until your experience shows that you should abandon it.", where: "Do Not Scatter Your Powers" },
      { trait: "industry", quote: "Many a man acquires a fortune by doing his business thoroughly, while his neighbor remains poor for life, because he only half does it.", where: "Whatever You Do, Do It With All Your Might" },
      { trait: "perseverance", quote: "When a man is in the right path, he must persevere.", where: "Persevere" },
      { trait: "integrity", quote: "It is more precious than diamonds or rubies.", where: "Preserve Your Integrity" },
    ],
  },
  {
    id: "marcus-aurelius", name: "Marcus Aurelius", what: "Roman emperor who wrote the Meditations to himself.",
    book: ab("1095", "Meditations", "Marcus Aurelius", "Book I names what he learned from each person who formed him."), gutenberg: 2680, page: "/schole/people/marcus-aurelius",
    traits: [
      { trait: "self-command", quote: "Of my grandfather Verus I have learned to be gentle and meek, and to refrain from all anger and passion.", where: "Book I, 1" },
    ],
  },
];

export const exemplarById = (id: string): Exemplar | undefined => EXEMPLARS.find((e) => e.id === id);

export type Role = { id: string; name: string; plural: string; about: string; exemplars: readonly string[] };

/** Broad roles, each named by the people who did it. A specific job comes from Work's catalogue instead. */
export const ROLES: readonly Role[] = [
  { id: "founder", name: "Founder", plural: "Founders", about: "Someone who builds an enterprise that lasts.", exemplars: ["benjamin-franklin", "andrew-carnegie", "john-d-rockefeller", "henry-ford", "p-t-barnum"] },
  { id: "statesman", name: "Statesman", plural: "Statesmen", about: "Someone who governs well and serves the city.", exemplars: ["marcus-aurelius", "benjamin-franklin"] },
];

export const roleById = (id: string): Role | undefined => ROLES.find((r) => r.id === id);

/** A person the user keeps as an inspiration, with the traits of theirs they chose to build. */
export type Admired = { exemplar: string; traits: readonly TraitId[] };

/** The traits the person wants, each with the first person they took it from (for the reason line). */
export function traitsWanted(admired: readonly Admired[]): { trait: Trait; from: Exemplar }[] {
  const out = new Map<TraitId, { trait: Trait; from: Exemplar }>();
  for (const a of admired) {
    const e = exemplarById(a.exemplar);
    if (!e) continue;
    for (const t of a.traits) {
      const trait = traitById(t);
      if (trait && e.traits.some((x) => x.trait === t) && !out.has(t)) out.set(t, { trait, from: e });
    }
  }
  return [...out.values()];
}
