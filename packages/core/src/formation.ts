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

export type TraitId = "focus" | "frugality" | "industry" | "order" | "perseverance" | "courage" | "service" | "integrity" | "self-command"
  | "simplicity" | "dignity-of-labour" | "household" | "habits" | "study" | "will" | "friendship";

export type Trait = {
  id: TraitId;
  name: string;
  /** One line on what it is, in plain words. */
  about: string;
  /** Playlists (collection ids) that teach it, best first. */
  playlists: readonly string[];
};

export const TRAITS: readonly Trait[] = [
  { id: "focus", name: "Focus on one thing", about: "Choosing one line of work and mastering it rather than scattering effort.", playlists: ["founders-own-words", "making-a-living", "stoics"] },
  { id: "frugality", name: "Frugality", about: "Wasting nothing, and knowing where every dollar goes.", playlists: ["founders-own-words", "making-a-living", "founding"] },
  { id: "industry", name: "Industry", about: "Working thoroughly and without wasting time.", playlists: ["founders-own-words", "household-and-land", "making-a-living"] },
  { id: "order", name: "Order", about: "A place for everything and a time for each part of the work.", playlists: ["making-a-living", "stoics"] },
  { id: "perseverance", name: "Perseverance", about: "Staying on the right path until it succeeds.", playlists: ["stoics", "making-a-living"] },
  { id: "courage", name: "Courage in failure", about: "Not fearing failure, and beginning again more wisely.", playlists: ["stoics", "socrates"] },
  { id: "service", name: "Service before profit", about: "Serving people well first, with profit as the reward of the service.", playlists: ["founders-own-words", "making-a-living", "founding"] },
  { id: "integrity", name: "Integrity", about: "Honest dealing, and wronging no one.", playlists: ["greeks", "founding"] },
  { id: "self-command", name: "Self-command", about: "Governing one's temper and passions.", playlists: ["stoics", "greeks"] },
  { id: "simplicity", name: "Simplicity", about: "Keeping life to what is essential, so there is time for what matters.", playlists: ["household-and-land", "stoics"] },
  { id: "dignity-of-labour", name: "Dignity of labour", about: "Honouring work with the hands as much as any other.", playlists: ["household-and-land", "founders-own-words"] },
  { id: "household", name: "Keeping a household", about: "Running a home as its leader, so the family can flourish in it.", playlists: ["household-and-land", "raising-children"] },
  { id: "habits", name: "Forming good habits", about: "Training good habits early, so that doing right becomes easy.", playlists: ["raising-children", "manners-and-character"] },
  { id: "study", name: "Study and preparation", about: "Thinking ahead of the game by studying it closely.", playlists: ["athletes-own-words", "making-a-living"] },
  { id: "will", name: "Will-power", about: "Strengthening the will by steady, regular effort.", playlists: ["athletes-own-words", "stoics"] },
  { id: "friendship", name: "Friendship", about: "Choosing good friends and being a good one.", playlists: ["friendship", "manners-and-character"] },
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
  {
    id: "booker-t-washington", name: "Booker T. Washington", what: "Born enslaved; founded Tuskegee Institute and taught there for thirty-four years.",
    book: ab("2632", "Up from Slavery", "Booker T. Washington", "His own story, from a slave cabin to Tuskegee."), gutenberg: 2376,
    traits: [
      { trait: "perseverance", quote: "I have learned that success is to be measured not so much by the position that one has reached in life as by the obstacles which he has overcome while trying to succeed.", where: "chapter II, Boyhood Days" },
      { trait: "dignity-of-labour", quote: "No race can prosper till it learns that there is as much dignity in tilling a field as in writing a poem.", where: "chapter XIV, The Atlanta Exposition Address" },
    ],
  },
  {
    id: "hesiod", name: "Hesiod", what: "Greek poet and farmer of Boeotia, about 700 BC, who wrote the year's work in verse.",
    book: ab("10196", "Works and Days", "Hesiod", "His advice to his brother on work, the seasons and the farm."), gutenberg: 348,
    traits: [
      { trait: "industry", quote: "Work is no disgrace: it is idleness which is a disgrace.", where: "Works and Days, in Evelyn-White's translation" },
    ],
  },
  {
    id: "henry-david-thoreau", name: "Henry David Thoreau", what: "Built a cabin by Walden Pond and lived there two years, then wrote Walden.",
    book: ab("549", "Walden", "Henry David Thoreau", "Two years in a cabin he built himself."), gutenberg: 205,
    traits: [
      { trait: "simplicity", quote: "Simplicity, simplicity, simplicity! I say, let your affairs be as two or three, and not a hundred or a thousand.", where: "Where I Lived, and What I Lived For" },
    ],
  },
  {
    id: "isabella-beeton", name: "Isabella Beeton", what: "Wrote the Book of Household Management (1861), the guide that ran Victorian homes.",
    book: ab("1319", "Book of Household Management", "Mrs. Isabella Beeton", "Its first chapter is on the mistress of the house."), gutenberg: 10136,
    traits: [
      { trait: "household", quote: "As with the commander of an army, or the leader of any enterprise, so is it with the mistress of a house. Her spirit will be seen through the whole establishment.", where: "chapter I, The Mistress" },
    ],
  },
  {
    id: "charlotte-mason", name: "Charlotte Mason", what: "Educator who taught mothers and governesses to give children a living education.",
    book: ab("11200", "Home Education", "Charlotte Mason", "Her lectures to mothers on children under nine."), gutenberg: 71087,
    traits: [
      { trait: "habits", quote: "The mother who takes pains to endow her children with good habits secures for herself smooth and easy days; while she who lets their habits take care of themselves has a weary life of endless friction with the children.", where: "part IV, 'Habit is ten natures'" },
    ],
  },
  {
    id: "christy-mathewson", name: "Christy Mathewson", what: "Pitcher for the New York Giants, one of the first five players in the Baseball Hall of Fame.",
    book: ab("7974", "Pitching in a Pinch", "Christy Mathewson", "Baseball from the inside, by its great pitcher."), gutenberg: 33291,
    traits: [
      { trait: "study", quote: "That is why so few men without brains last in the Big Leagues nowadays.", where: "chapter VII, Honest and Dishonest Sign Stealing" },
    ],
  },
  {
    id: "eugen-sandow", name: "Eugen Sandow", what: "Strongman who began modern physical culture and bodybuilding.",
    book: ab("17483", "Strength and How to Obtain It", "Eugen Sandow", "His book of exercises and why they matter."), gutenberg: 65987,
    traits: [
      { trait: "will", quote: "Will-power is a mighty factor--perhaps the mightiest--in all that goes to make up the sum of human success or failure.", where: "chapter I, Concerning Physical Culture" },
    ],
  },
  {
    id: "cicero", name: "Cicero", what: "Roman statesman, orator and philosopher; consul in 63 BC.",
    book: ab("13377", "Treatises on Friendship and Old Age", "Marcus Tullius Cicero", "His dialogue on friendship, spoken by Laelius."), gutenberg: 2808, page: "/schole/people/cicero",
    traits: [
      { trait: "friendship", quote: "But I must at the very beginning lay down this principle--friendship can only exist between good men.", where: "On Friendship" },
    ],
  },
];

export const exemplarById = (id: string): Exemplar | undefined => EXEMPLARS.find((e) => e.id === id);

export type Role = { id: string; name: string; plural: string; about: string; exemplars: readonly string[] };

/** Broad roles, each named by the people who did it. A specific job comes from Work's catalogue instead. */
export const ROLES: readonly Role[] = [
  { id: "founder", name: "Founder", plural: "Founders", about: "Someone who builds an enterprise that lasts.", exemplars: ["benjamin-franklin", "andrew-carnegie", "john-d-rockefeller", "henry-ford", "booker-t-washington", "p-t-barnum"] },
  { id: "statesman", name: "Statesman", plural: "Statesmen", about: "Someone who governs well and serves the city.", exemplars: ["marcus-aurelius", "cicero", "benjamin-franklin"] },
  { id: "teacher", name: "Teacher", plural: "Teachers", about: "Someone who forms the young.", exemplars: ["booker-t-washington", "charlotte-mason"] },
  { id: "homemaker", name: "Mother and homemaker", plural: "Mothers and homemakers", about: "Someone who raises children and keeps a home.", exemplars: ["charlotte-mason", "isabella-beeton"] },
  { id: "farmer", name: "Farmer and homesteader", plural: "Farmers and homesteaders", about: "Someone who lives from the land.", exemplars: ["hesiod", "henry-david-thoreau", "booker-t-washington"] },
  { id: "athlete", name: "Athlete", plural: "Athletes", about: "Someone who trains body and will to compete.", exemplars: ["christy-mathewson", "eugen-sandow"] },
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

/** The qualities kept (Qualities lens, doc "Qualities design guide"), each with every person it was seen in, in the order first kept. */
export function keptQualities(admired: readonly Admired[]): { trait: Trait; from: Exemplar[] }[] {
  const out = new Map<TraitId, { trait: Trait; from: Exemplar[] }>();
  for (const a of admired) {
    const e = exemplarById(a.exemplar);
    if (!e) continue;
    for (const t of a.traits) {
      const trait = traitById(t);
      if (!trait || !e.traits.some((x) => x.trait === t)) continue;
      const had = out.get(t);
      if (had) { if (!had.from.includes(e)) had.from.push(e); } else out.set(t, { trait, from: [e] });
    }
  }
  return [...out.values()];
}

/**
 * Qualities named by the authors of books the person finished (by LibriVox id) and not yet kept, each with whose
 * book: Aristotle's second sign, pleasure in the activity (Ethics II.3, X.5). Nothing is kept until the person adds it.
 */
export function suggestedQualities(admired: readonly Admired[], finished: ReadonlySet<string>): { trait: Trait; from: Exemplar }[] {
  const kept = new Set(keptQualities(admired).map((q) => q.trait.id));
  const out = new Map<TraitId, { trait: Trait; from: Exemplar }>();
  for (const e of EXEMPLARS) {
    if (!finished.has(e.book.id)) continue;
    for (const x of e.traits) {
      const trait = traitById(x.trait);
      if (trait && !kept.has(x.trait) && !out.has(x.trait)) out.set(x.trait, { trait, from: e });
    }
  }
  return [...out.values()];
}

/** The person a Scholē person page shows, by its path name ("benjamin-franklin", "Cicero") or full name. */
export function exemplarForPage(name: string): Exemplar | undefined {
  const n = name.trim().toLowerCase();
  return EXEMPLARS.find((e) => e.id === n || e.name.toLowerCase() === n || e.page === `/schole/people/${n}`);
}

/** Where a person's page is in Scholē. */
export const exemplarHref = (e: Exemplar) => e.page ?? `/schole/people/${encodeURIComponent(e.name)}`;

