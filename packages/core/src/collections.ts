/**
 * Collections chosen by people (Torian, 2026-11-15 23:07Z, agreeing to the guide "Home, browse and library"): things
 * to hear, watch and look at, put together by a named person, each with a line on why it is there. Reflect chose the
 * first ones; later ambassadors and people who hold standing publish theirs. A collection mixes media (Torian,
 * 2026-11-16 00:43Z: "podcasts, adaptations, courses/lectures and debates, music to accompany, art, and games where
 * applicable"), and every item plays in Scholē: a LibriVox recording by its id, an Open Yale or MIT OpenCourseWare
 * course by its page, a podcast episode by its feed and episode key, or a film, lecture, discussion, play, music or
 * work of art that Scholē's find page plays or shows (YouTube, the Internet Archive, the Art Institute of Chicago).
 *
 * A collection may name the work it serves (`for`: word stems matched against what the person is working toward in
 * Work), so a new Home and Browse's For you can say why they suggest it. Pure: no I/O.
 *
 * People call these playlists (Torian, 2026-11-16 01:17Z, agreeing to the guide "Topics and playlists"): a playlist
 * is one ordered path through a topic (`topics`, the topic pages it belongs to, in `topic-pages.ts`). The code keeps
 * the name collection.
 */
import { MEDIEVAL_PLAYLISTS } from "./start-medieval";
import { DIALECTIC_PLAYLISTS } from "./start-dialectic";
import { RENAISSANCE_PLAYLISTS } from "./start-renaissance";
import { ENLIGHTENMENT_PLAYLISTS } from "./start-enlightenment";
import { FOUNDING_PLAYLISTS } from "./start-founding";

/** The media a find in a collection may be: the ones Scholē's find page plays, shows or reads. */
export type FindMedium = "film" | "lecture" | "debate" | "discussion" | "music" | "art" | "theatre" | "game";

/** One thing in a collection, with why it is there when the chooser says. */
export type CollectionItem = { why?: string } & (
  | { kind: "audiobook"; id: string; title: string; by: string }
  | { kind: "course"; url: string; title: string; by: string }
  | { kind: "episode"; feed: string; key: string; show: string; image: string; title: string; by: string }
  | { kind: "find"; medium: FindMedium; title: string; by: string; url?: string; image?: string; year?: string; /** Who recorded it and under what licence, when the recording is free to use. */ credit?: string }
);

export type Collection = {
  id: string;
  name: string;
  about: string;
  /** Who chose it. */
  by: string;
  /** Stems of the work it serves; empty when it serves anyone. */
  for: readonly string[];
  /** The topic pages it is a path through (ids in `topic-pages.ts`). */
  topics?: readonly string[];
  items: readonly CollectionItem[];
};

export const ab = (id: string, title: string, by: string, why?: string): CollectionItem => ({ kind: "audiobook", id, title, by, ...(why ? { why } : {}) });
export const course = (url: string, title: string, by: string, why?: string): CollectionItem => ({ kind: "course", url, title, by, ...(why ? { why } : {}) });
// BBC Radio 4's In Our Time, whose whole archive is in one feed.
const IOT = { feed: "https://podcasts.files.bbci.co.uk/b006qykl.rss", show: "In Our Time", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/f3/12/e7/f312e703-b626-0091-5bdf-73d79cce25c5/mza_16900938594910783199.jpg/600x600bb.jpg" };
export const iot = (key: string, title: string, why?: string): CollectionItem => ({ kind: "episode", ...IOT, key, title, by: "Melvyn Bragg and guests", ...(why ? { why } : {}) });
export const yt = (medium: FindMedium, id: string, title: string, by: string, why?: string): CollectionItem => ({ kind: "find", medium, title, by, url: `https://www.youtube.com/watch?v=${id}`, image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, ...(why ? { why } : {}) });
/**
 * A recording on Wikimedia Commons, in the public domain or under Creative Commons, that Reflect's own player plays
 * (Torian, 2026-11-16 04:02Z: music "we can actually play ourselves"). `path` is the file's two hash folders ("b/b6").
 */
export const commons = (path: string, file: string, title: string, by: string, credit: string, why?: string): CollectionItem =>
  ({ kind: "find", medium: "music", title, by, url: `https://upload.wikimedia.org/wikipedia/commons/${path}/${encodeURIComponent(file.replace(/ /g, "_"))}`, credit, ...(why ? { why } : {}) });
export const aic = (id: number, image: string, title: string, by: string, why?: string): CollectionItem => ({ kind: "find", medium: "art", title, by, url: `https://www.artic.edu/artworks/${id}`, image: `https://www.artic.edu/iiif/2/${image}/full/400,/0/default.jpg`, ...(why ? { why } : {}) });

const BASE: readonly Collection[] = [
  {
    id: "greeks", name: "Homer to Socrates", by: "Reflect", for: [], topics: ["greeks"],
    about: "Where the questions began: Socrates on trial, Plato's city, Aristotle on the good life, and the poems and plays the Greeks learned from, heard, watched and looked at.",
    items: [
      ab("1268", "Apology of Socrates", "Plato", "Start here: Socrates defends the examined life to the jury that will condemn him."),
      iot("14qr1rch1j87v", "Socrates in Prison", "His last days, from the Crito and the Phaedo."),
      ab("2707", "Republic", "Plato", "What justice is, asked by building a city in words."),
      yt("lecture", "8rf3uqDj00A", "Plato's Republic I: Justice, Power, and Knowledge", "Michael Sugrue", "A lecture to listen to beside the first books."),
      ab("3733", "Nicomachean Ethics", "Aristotle", "Happiness as living well, and the virtues that make it."),
      iot("1ft00r2ap8dq9", "Aristotle's Nicomachean Ethics", "Four scholars on what the Ethics asks of you."),
      ab("1360", "Politics", "Aristotle", "Man as a political animal, and the kinds of city."),
      ab("690", "Iliad", "Homer", "The poem every Greek learned first: the wrath of Achilles."),
      iot("1pk8p2aa043pl", "The Iliad", "What the poem is about, and why it lasted."),
      aic(166, "7605118c-b634-cd1f-2c92-b1406ffb1071", "Amphora (Storage Jar)", "Achilles Painter, 460-450 BCE", "Painted in Athens while Socrates was a boy, by the painter named for his Achilles."),
      ab("65", "Odyssey", "Homer", "The long way home."),
      { kind: "find", medium: "theatre", title: "Oedipus the King", by: "Sophocles", why: "The tragedy Aristotle's Poetics holds up as the model." },
      iot("p0cx3rfdbmsy", "Oedipus Rex", "Then hear it discussed."),
      yt("music", "mGfOHoun0OQ", "Seikilos Epitaph", "Ancient Greek song, about 200 BCE", "The oldest complete song with its tune: \"While you live, shine.\""),
      course("https://oyc.yale.edu/classics/clcv-205", "Introduction to Ancient Greek History", "Donald Kagan", "The whole story, a lecture at a time."),
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
    id: "founding", name: "The American founding", by: "Reflect", topics: ["founding"], for: ["law", "lawyer", "attorney", "judge", "politic", "government", "civic", "public", "policy", "legislat"],
    about: "The arguments that made the United States, in the founders' words, with what scholars say of them, the songs they sang, the faces they knew, and a film of the war.",
    items: [
      ab("1126", "Common Sense", "Thomas Paine", "The pamphlet that turned a quarrel into a cause, January 1776."),
      iot("1n7msw51v8zus", "Thomas Paine's Common Sense", "Why it sold so many copies, and what it argued."),
      yt("music", "t7S_07E-9CA", "Chester", "William Billings, 1770", "The war's marching hymn: \"Let tyrants shake their iron rod.\""),
      ab("670", "Federalist Papers", "Alexander Hamilton, John Jay, James Madison", "The case for the Constitution, written to New York's voters."),
      iot("129acml1xnj748", "The Federalist Papers", "Who wrote which, and what they feared."),
      ab("1085", "Anti-Federalist Papers", "Patrick Henry", "The case against it, which gave the country its Bill of Rights."),
      yt("discussion", "xG7jMnkMd7Q", "Ratification Debates", "National Constitution Center", "Scholars take both sides of the ratification fight."),
      ab("1143", "Autobiography of Benjamin Franklin", "Benjamin Franklin", "A printer's apprentice who signed the Declaration and the Constitution."),
      iot("xe1hst1n9n0qg", "Benjamin Franklin", "His science, his diplomacy and his doubts."),
      aic(80460, "65070e6a-e55b-01dc-1e99-a649fd7fd8b1", "George Washington", "Edward Savage, 1793", "Painted from life in Washington's first term."),
      { kind: "find", medium: "film", title: "America", by: "D. W. Griffith", url: "https://archive.org/details/silent-america", image: "https://archive.org/services/img/silent-america", year: "1924", why: "The Revolution as a silent epic, from Lexington to Yorktown; in the public domain." },
      course("https://oyc.yale.edu/history/hist-116", "The American Revolution", "Joanne Freeman", "Yale's course, lecture by lecture."),
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
    id: "stoics", name: "The Stoics", by: "Reflect", for: [], topics: ["stoics", "romans"],
    about: "An emperor's notebook, a freed slave's handbook and a statesman's letters on how to live well whatever happens, with what scholars say of each and the faces history kept.",
    items: [
      ab("1095", "Meditations", "Marcus Aurelius", "Notes an emperor wrote to himself on campaign, never meant to be read."),
      aic(5644, "9b312820-971d-04ba-361d-4b008eaaaccc", "Aureus (Coin) Portraying Marcus Aurelius", "Ancient Roman, 153-154", "His face as Romans carried it, struck before he was emperor."),
      iot("1tyinop5kt3m0", "Marcus Aurelius", "The man behind the notebook."),
      yt("lecture", "Auuk1y4DRgk", "Marcus Aurelius' Meditations: The Stoic Ideal", "Michael Sugrue", "A lecture on what the Meditations teach."),
      ab("518", "Enchiridion", "Epictetus", "The handbook: what is up to us, and what is not."),
      iot("1sgaxe81uzkg3n", "Stoicism", "The school from Zeno to Rome."),
      ab("9230", "Moral Letters, Vol. I", "Seneca", "Letters to a friend on time, grief, wealth and death."),
      iot("cjg9rz1cs4rja", "Seneca the Younger", "A Stoic who served Nero."),
      aic(9612, "0922f579-59e0-7c34-fbd0-52361d1dbcbe", "Fantasy on the Death of Seneca", "Giovanni Battista Tiepolo, 1735/40", "How he died, as a painter imagined it."),
    ],
  },
  {
    id: "socrates", name: "Socrates' last days", by: "Reflect", for: [], topics: ["greeks"],
    about: "The charge, the trial, the prison and the death, in the order they happened, as Plato and Xenophon told it.",
    items: [
      ab("275", "Euthyphro", "Plato", "On his way to court, Socrates asks a priest what piety is."),
      ab("1268", "Apology of Socrates", "Plato", "The trial: his defence of the examined life."),
      iot("14qr1rch1j87v", "Socrates in Prison", "What happened between the verdict and the hemlock."),
      ab("4421", "Phaedo", "Plato", "His last day, spent arguing that the soul outlives the body."),
      aic(11625, "0c49ea9d-c9bc-381e-9ca5-0fce23cc70ec", "Figure of a Youth from a Funerary Stele", "Greek, Athens, about 380 BCE", "How Athenians marked a grave, twenty years after his."),
      ab("14766", "Memorable Thoughts of Socrates", "Xenophon", "Another pupil remembers the same man."),
    ],
  },
  {
    id: "atreus", name: "The house of Atreus", by: "Reflect", for: [], topics: ["greeks"],
    about: "One family's curse, told by all three tragedians: a father's sacrifice, a mother's revenge, a son's, and the court that ended it.",
    items: [
      ab("7985", "Iphigenia in Aulis", "Euripides", "Agamemnon gives his daughter to the gods for a wind to Troy."),
      ab("663", "Oresteia", "Aeschylus", "The trilogy: his murder, Orestes' revenge, and Athens' first court of law."),
      ab("4810", "Electra", "Sophocles", "The same revenge, told from the sister who waited."),
      { kind: "find", medium: "music", title: "Musique de la Grèce antique", by: "Gregorio Paniagua, Atrium Musicae de Madrid", url: "https://music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071", image: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c7/8d/f4/c78df426-5e97-0b8c-fa50-614f2da09c79/5414939990168_cover.jpg/600x600bb.jpg", why: "It opens with a chorus from Euripides' Orestes, the longest fragment of tragic music that survives." },
      aic(84551, "10d782f2-d7e8-4f1d-9779-8302ca35e29e", "Bell Krater (Mixing Bowl)", "Manner of the Niobid Painter, Athens, about 450 BCE", "A wine bowl from the years the Oresteia was first staged."),
    ],
  },
  {
    id: "thebes", name: "Three Theban plays", by: "Reflect", for: [], topics: ["greeks"],
    about: "Sophocles' plays about Oedipus and his daughter, with the scholars who explain them and the philosopher who held them up as the model.",
    items: [
      ab("2685", "Oedipus Rex", "Sophocles", "The king who hunts a murderer and finds himself."),
      iot("p0cx3rfdbmsy", "Oedipus Rex", "Why the play still works."),
      ab("4631", "Oedipus at Colonus", "Sophocles", "Old, blind and exiled, he comes to Athens to die."),
      ab("4632", "Antigone", "Sophocles", "His daughter buries her brother against the king's law."),
      ab("240", "Poetics", "Aristotle", "Why Aristotle thought Oedipus the best tragedy."),
    ],
  },
  {
    id: "romans", name: "Rome in its own words", by: "Reflect", for: [], topics: ["romans"],
    about: "Rome's founding poem, its historians, a general's own account and a statesman's duties, with a coin to hold the face of an emperor.",
    items: [
      ab("1718", "Aeneid", "Virgil", "The poem Rome told itself about where it came from."),
      ab("3496", "From the Foundation of the City, Vol. 1", "Livy", "Rome's history from the beginning, as Romans learned it."),
      ab("4732", "Commentaries on the Gallic War", "Julius Caesar", "A general's account of his own war, in the third person."),
      ab("9450", "On Duties", "Cicero", "A statesman's last book, written to his son."),
      ab("3113", "Agricola", "Tacitus", "A good man's life under a bad emperor."),
      aic(5644, "9b312820-971d-04ba-361d-4b008eaaaccc", "Aureus (Coin) Portraying Marcus Aurelius", "Ancient Roman, 153-154", "The face of a Roman emperor, as Romans carried it."),
      ab("1095", "Meditations", "Marcus Aurelius", "And the emperor's own notebook."),
    ],
  },
];

export const COLLECTIONS: readonly Collection[] = [...BASE, ...MEDIEVAL_PLAYLISTS, ...RENAISSANCE_PLAYLISTS, ...ENLIGHTENMENT_PLAYLISTS, ...FOUNDING_PLAYLISTS, ...DIALECTIC_PLAYLISTS];

export const collectionById = (id: string): Collection | undefined => COLLECTIONS.find((c) => c.id === id);

const q = (k: string, v: string | undefined) => (v ? `&${k}=${encodeURIComponent(v)}` : "");

/** Where an item opens in Scholē: its own page, or the find page that plays, shows or reads it. */
export function itemHref(i: CollectionItem): string {
  switch (i.kind) {
    case "audiobook": return `/schole/audiobooks/${i.id}`;
    case "course": return `/schole/courses?u=${encodeURIComponent(i.url)}`;
    case "episode": return `/schole/podcasts/episode?u=${encodeURIComponent(i.feed)}&k=${i.key}${q("t", i.show)}${q("i", i.image)}`;
    case "find": return `/schole/find?m=${i.medium}${q("t", i.title)}${q("by", i.by)}${q("u", i.url)}${q("i", i.image)}${q("y", i.year)}${q("c", i.credit)}&h=1`;
  }
}

/** A stable key for an item, to tell whether the person already has it (a find is keyed as kept items are: medium and title). */
export function itemKey(i: CollectionItem): string {
  switch (i.kind) {
    case "audiobook": return `audiobook:${i.id}`;
    case "course": return `course:${i.url}`;
    case "episode": return `episode:${i.feed}#${i.key}`;
    case "find": return `${i.medium}|${i.title.toLowerCase()}`;
  }
}

/** The kinds a collection holds, in the order they first appear ("Audiobook", "Podcast episode", "Art"...). */
export const KIND_LABEL: Record<FindMedium | "audiobook" | "course" | "episode", string> = {
  audiobook: "Audiobook", course: "Course", episode: "Podcast episode", film: "Film", lecture: "Lecture", debate: "Debate", discussion: "Discussion", music: "Music", art: "Art", theatre: "Play", game: "Game",
};
export const kindOf = (i: CollectionItem): string => KIND_LABEL[i.kind === "find" ? i.medium : i.kind];

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
