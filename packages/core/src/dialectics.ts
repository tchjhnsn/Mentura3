/**
 * Reflect's own curated dialectics (Torian, 2026-11-16 09:43Z: "start out with our own curated set of dialectics...
 * historical dialectics around different subjects"): standing questions with the positions taken on them across the
 * ages, each position pointing at the place in a work where it is argued. No quotes here, only places, so nothing can
 * be misquoted; a position names a work with a page in Scholē when there is one.
 */

export type Position = {
  /** Which way it answers the question, in the question's own terms. */
  side: string;
  who: string;
  /** A work with a page in Scholē (`workById`), when there is one. */
  work?: string;
  /** The work's title when it has no page, and the place in it. */
  title?: string;
  at: string;
  /** What is argued there, in Reflect's words. */
  holds: string;
};

export type Dialectic = { id: string; question: string; subject: string; about: string; positions: readonly Position[] };

export const DIALECTICS: readonly Dialectic[] = [
  {
    id: "virtue-taught", question: "Can virtue be taught?", subject: "Virtue",
    about: "Whether being good is knowledge a teacher can pass on, a habit trained by practice, or neither.",
    positions: [
      { side: "Not by teachers", who: "Plato", work: "meno", at: "89d–100b", holds: "Socrates finds no teachers of virtue: good men fail to make their sons good, so virtue seems to come not by teaching but by a gift of the gods." },
      { side: "By habit, then teaching", who: "Aristotle", work: "ethics", at: "II.1 (1103a14–b25)", holds: "Virtue of thought grows by teaching; virtue of character comes by habit, by doing just acts we become just." },
      { side: "By nature and experience", who: "Jean-Jacques Rousseau", work: "emile", at: "Books I–II", holds: "Childhood should be left to nature and things rather than lessons; goodness is kept, not instilled." },
    ],
  },
  {
    id: "suffer-injustice", question: "Is it better to suffer injustice than to do it?", subject: "Justice",
    about: "Whether the unjust man who gets away with it is happier than the just man who suffers for it.",
    positions: [
      { side: "Better to suffer it", who: "Plato", work: "gorgias", at: "469b–c, 474b–479e", holds: "Socrates holds that doing wrong is the greatest evil to the one who does it, worse than suffering it." },
      { side: "Better to do it", who: "Plato (Callicles)", work: "gorgias", at: "482c–484c", holds: "Callicles answers that by nature the stronger should have more, and that the law of the weak calls this unjust." },
      { side: "Justice is the stronger's advantage", who: "Plato (Thrasymachus)", work: "republic", at: "I, 338c–344c", holds: "Thrasymachus says justice is what serves the ruler, and injustice on a large scale pays better." },
      { side: "Prove it without reward", who: "Plato (Glaucon)", work: "republic", at: "II, 357a–362c", holds: "Glaucon's challenge, with the ring of Gyges: show justice is good in itself, stripped of reputation and reward." },
    ],
  },
  {
    id: "feared-or-loved", question: "Is it better for a ruler to be feared or loved?", subject: "Rule",
    about: "Whether power is kept by fear or by goodwill.",
    positions: [
      { side: "Feared", who: "Niccolò Machiavelli", work: "prince", at: "chapter XVII", holds: "It is best to be both, but if one must choose it is safer to be feared than loved, so long as one avoids being hated." },
      { side: "Loved", who: "Cicero", title: "On Duties", at: "II.23–29", holds: "Fear is a poor keeper of lasting power; goodwill keeps it, and rule by fear has ended badly for those who tried it." },
      { side: "Neither: by law and the mean", who: "Aristotle", work: "politics", at: "V.11 (1313a–1315b)", holds: "Tyrants keep power by fear and by keeping subjects weak; a ruler lasts longer by seeming a steward and acting with moderation." },
    ],
  },
  {
    id: "education-for", question: "What is education for?", subject: "Education",
    about: "Whether learning is for virtue, for use, or for its own sake.",
    positions: [
      { side: "Turning the soul", who: "Plato", work: "republic", at: "VII, 514a–521b", holds: "Education is not putting sight into blind eyes but turning the whole soul toward what is, as from the cave to the sun." },
      { side: "For virtue and leisure", who: "Aristotle", work: "politics", at: "VIII.1–3 (1337a–1338b)", holds: "Men disagree whether to teach what is useful, what makes for virtue, or what is beyond use; free men learn some things for the sake of leisure." },
      { side: "For the natural man", who: "Jean-Jacques Rousseau", work: "emile", at: "Book I", holds: "Education should form a man for himself before a citizen, following nature rather than the customs of society." },
    ],
  },
  {
    id: "who-should-rule", question: "Who should rule?", subject: "Regimes",
    about: "One, the few or the many; the wise, the people, or the law.",
    positions: [
      { side: "The wise", who: "Plato", work: "republic", at: "V, 473c–e", holds: "Cities will have no rest from evils until philosophers rule or rulers become philosophers." },
      { side: "Many, under law", who: "Aristotle", work: "politics", at: "III.7–11 (1279a–1282b)", holds: "Rule for the common good is right in one, few or many; the many together may judge better than the few best." },
      { side: "The people, as one will", who: "Jean-Jacques Rousseau", work: "social-contract", at: "Books I–II", holds: "Sovereignty is the general will of the people and cannot be handed over to representatives." },
      { side: "Ambition against ambition", who: "James Madison", work: "federalist", at: "Nos. 10 and 51", holds: "A large republic with representatives and checks controls faction, since men are not angels." },
      { side: "Small republics", who: "Anti-Federalist writers", work: "anti-federalist", at: "Brutus No. 1", holds: "A free republic cannot last over so large a country; power drawn to the center will swallow the states." },
    ],
  },
  {
    id: "reason-or-feeling", question: "Does morality rest on reason or on feeling?", subject: "Ethics",
    about: "Whether we know right and wrong by reasoning or by what we approve and feel.",
    positions: [
      { side: "Reason", who: "Thomas Aquinas", work: "summa-theologica", at: "I–II, q. 94", holds: "The natural law is reason's share in the eternal law; its first precept, do good and avoid evil, is known to all by reason." },
      { side: "Practical wisdom", who: "Aristotle", work: "ethics", at: "VI.5, VI.13", holds: "Virtue of character and practical wisdom need each other: the right desire, and right reason about what to do." },
      { side: "Feeling", who: "David Hume", work: "hume-treatise", at: "II.iii.3; III.i.1–2", holds: "Moral distinctions are not drawn from reason; reason is the slave of the passions, and virtue is what we approve by a sentiment." },
      { side: "Sympathy", who: "Adam Smith", work: "moral-sentiments", at: "Part I", holds: "We judge by sympathy, imagining ourselves in another's place, and by the impartial spectator within." },
    ],
  },
  {
    id: "god-exists", question: "Does God exist?", subject: "God",
    about: "Whether reason can show there is a God, or whether the arguments fail.",
    positions: [
      { side: "Yes, by reason", who: "Thomas Aquinas", work: "summa-theologica", at: "I, q. 2, a. 3", holds: "The five ways: from motion, cause, contingency, degrees of being and order in nature to a first mover and cause." },
      { side: "Yes, from the idea of God", who: "Anselm of Canterbury", title: "Proslogion", at: "chapters 2–4", holds: "God is that than which nothing greater can be thought; such a being must exist in reality, not only in the mind." },
      { side: "The arguments fail", who: "David Hume", work: "hume-dialogues", at: "Parts II–VIII", holds: "Philo presses the argument from design until it shows at most an author we cannot know, not the God of religion." },
    ],
  },
  {
    id: "human-nature", question: "Is there a human nature?", subject: "Human nature",
    about: "Whether people are born with a nature that fixes what is good for them, or are made by what happens to them.",
    positions: [
      { side: "Yes, a political animal", who: "Aristotle", work: "politics", at: "I.2 (1253a1–39)", holds: "Man is by nature an animal made for the city; one who lives outside it is a beast or a god." },
      { side: "Yes, and at war", who: "Thomas Hobbes", title: "Leviathan", at: "chapter XIII", holds: "Without a power over them all, men are in a war of each against all, and life is solitary, poor, nasty, brutish and short." },
      { side: "Good, then corrupted", who: "Jean-Jacques Rousseau", work: "inequality", at: "Part I", holds: "Natural man is solitary and moved by pity; property and society, not nature, made him unequal and vicious." },
      { side: "A blank page", who: "John Locke", work: "locke-understanding", at: "II.1", holds: "The mind starts as white paper with no innate ideas; everything in it comes from experience." },
    ],
  },
];

export const dialecticById = (id: string): Dialectic | undefined => DIALECTICS.find((d) => d.id === id);

/** The works a dialectic draws on, by their Scholē ids. */
export const dialecticWorks = (d: Dialectic): string[] => [...new Set(d.positions.flatMap((p) => (p.work ? [p.work] : [])))];

/**
 * Dialectics in the order to show a person: those drawing on works they have kept first (with the work that put it
 * there), then the rest as curated.
 */
export function rankDialectics(keptWorks: ReadonlySet<string>): { d: Dialectic; because: string | null }[] {
  const out = DIALECTICS.map((d, i) => ({ d, i, because: dialecticWorks(d).find((w) => keptWorks.has(w)) ?? null }));
  return out.sort((a, b) => Number(Boolean(b.because)) - Number(Boolean(a.because)) || a.i - b.i).map(({ d, because }) => ({ d, because }));
}
