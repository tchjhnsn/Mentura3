/**
 * Topics and works (Torian, 2026-11-16 01:17Z, agreeing to the guide "Topics and playlists"). A topic is a wide place
 * to discover, grouped by form; a playlist is one ordered path through it (`collections.ts`); a work is one work with
 * every version of it in one place.
 *
 * Topics follow the facets library catalogues use (OCLC's FAST): topical (Philosophy), geographic and chronological
 * (The Greeks), and form or genre (Tragedy). The topics here are places, periods and schools; the topical ones are the
 * listening topics in `audiobooks.ts`. Both share one page design.
 *
 * Every version plays in Scholē: a LibriVox recording by its catalogue id, a podcast episode, a course, or a find
 * (music, art, a lecture) that the find page plays or shows. Pure: no I/O.
 */
import { ANCIENT_FORMS } from "./topic-ancient";
import { MEDIEVAL_FORMS, MEDIEVAL_TOPIC, MEDIEVAL_WORKS } from "./topic-medieval";
import { RENAISSANCE_FORMS, RENAISSANCE_TOPIC, RENAISSANCE_WORKS } from "./topic-renaissance";
import { ENLIGHTENMENT_FORMS, ENLIGHTENMENT_TOPIC, ENLIGHTENMENT_WORKS } from "./topic-enlightenment";
import { FOUNDING_FORMS, FOUNDING_TOPIC, FOUNDING_WORKS } from "./topic-founding";
import { ab, aic, collectionById, COLLECTIONS, course, iot, itemKey, yt, type Collection, type CollectionItem } from "./collections";

/** What you do with a version of a work, the groups of a work page after its recordings. */
export type VersionGroup = "understand" | "music" | "watch" | "see";
export const GROUP_LABEL: Record<VersionGroup, string> = { understand: "Understand it", music: "Its music", watch: "Watch it", see: "See it" };

export type Work = {
  id: string;
  title: string;
  by: string;
  /** When it was made, as historians date it ("458 BC"). */
  when: string;
  /** The topic and form it sits under. */
  topic: string;
  form: string;
  about: string;
  /** LibriVox recordings of it, the one to play first first (other translations follow). */
  audiobooks: readonly string[];
  /** Versions other than recordings, each with why it belongs. */
  versions: readonly { group: VersionGroup; item: CollectionItem }[];
};

export type TopicForm = {
  id: string;
  label: string;
  /** Where and when, said under the chips when the form is chosen. */
  where?: string;
  /** Works with pages of their own, in order. */
  works?: readonly string[];
  /** Things that are not works with pages (an album, a vase, a lecture), in order. */
  items?: readonly CollectionItem[];
};

export type TopicPerson = { name: string; /** English Wikipedia page title, for the face. */ wiki: string; /** Open Library author id, for their page. */ ol?: string };

export type TopicPage = {
  id: string;
  name: string;
  about: string;
  /** The playlist to start with, chosen by a person. */
  start: string;
  forms: readonly TopicForm[];
  people: readonly TopicPerson[];
};

const W = (id: string, title: string, by: string, when: string, topic: string, form: string, about: string, audiobooks: string[], versions: Work["versions"] = []): Work =>
  ({ id, title, by, when, topic, form, about, audiobooks, versions });
const v = (group: VersionGroup, item: CollectionItem) => ({ group, item });

const KAGAN = course("https://oyc.yale.edu/classics/clcv-205", "Introduction to Ancient Greek History", "Donald Kagan", "Yale's course on the whole story, a lecture at a time.");
const AMPHORA = aic(166, "7605118c-b634-cd1f-2c92-b1406ffb1071", "Amphora (Storage Jar)", "Achilles Painter, Athens, 460-450 BCE", "Painted in Athens by the painter named for his Achilles.");
const KRATER = aic(84551, "10d782f2-d7e8-4f1d-9779-8302ca35e29e", "Bell Krater (Mixing Bowl)", "Manner of the Niobid Painter, Athens, about 450 BCE", "A wine bowl from the years the tragedies were first staged.");
const STELE = aic(11625, "0c49ea9d-c9bc-381e-9ca5-0fce23cc70ec", "Figure of a Youth from a Funerary Stele", "Greek, Athens, about 380 BCE", "How Athenians marked a grave in Plato's lifetime.");
const SOCRATES = iot("14qr1rch1j87v", "Socrates in Prison", "Scholars on his last days.");
const PANIAGUA: CollectionItem = {
  kind: "find", medium: "music", title: "Musique de la Grèce antique", by: "Gregorio Paniagua, Atrium Musicae de Madrid",
  url: "https://music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071",
  image: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c7/8d/f4/c78df426-5e97-0b8c-fa50-614f2da09c79/5414939990168_cover.jpg/600x600bb.jpg",
  why: "The surviving fragments of Greek music played on copies of Greek instruments, from a chorus of Euripides' Orestes to the Seikilos song.",
};
const SEIKILOS = yt("music", "mGfOHoun0OQ", "Seikilos Epitaph", "Ancient Greek song, about 200 BCE", "The oldest complete song with its tune: \"While you live, shine.\"");

const BASE_WORKS: readonly Work[] = [
  W("iliad", "Iliad", "Homer", "8th century BC", "greeks", "epic", "The wrath of Achilles in the tenth year of the Trojan War: the poem every Greek learned first.", ["690", "5513", "3965", "20625"], [
    v("understand", iot("1pk8p2aa043pl", "The Iliad", "What the poem is about, and why it lasted.")),
    v("see", AMPHORA),
  ]),
  W("odyssey", "Odyssey", "Homer", "8th century BC", "greeks", "epic", "Odysseus' ten years' journey home from Troy, and what he finds there.", ["65", "14206", "9922", "20840"]),
  W("theogony", "Works and Days, Theogony", "Hesiod", "about 700 BC", "greeks", "epic", "The birth of the gods, and a farmer's year of honest work.", ["10196"]),
  W("hymns", "Homeric Hymns", "Homer", "7th and 6th centuries BC", "greeks", "epic", "Songs to the gods, sung before the epics at festivals.", ["10291"]),
  W("oresteia", "Oresteia", "Aeschylus", "458 BC", "greeks", "tragedy", "Agamemnon's murder, Orestes' revenge, and the court of Athens that ends the killing: the only trilogy that survives whole.", ["663"], [
    v("see", KRATER),
  ]),
  W("persians", "The Persians", "Aeschylus", "472 BC", "greeks", "tragedy", "The defeat at Salamis, told from the Persian court by a man who fought there.", ["10076"]),
  W("oedipus", "Oedipus the King", "Sophocles", "about 429 BC", "greeks", "tragedy", "The king who hunts a murderer and finds himself. Aristotle's model tragedy.", ["2685"], [
    v("understand", iot("p0cx3rfdbmsy", "Oedipus Rex", "Scholars on why the play still works.")),
  ]),
  W("antigone", "Antigone", "Sophocles", "about 441 BC", "greeks", "tragedy", "A sister buries her brother against the king's law.", ["4632"]),
  W("colonus", "Oedipus at Colonus", "Sophocles", "401 BC", "greeks", "tragedy", "Old, blind and exiled, Oedipus comes to Athens to die.", ["4631"]),
  W("electra", "Electra", "Sophocles", "about 410 BC", "greeks", "tragedy", "Orestes' revenge, told from the sister who waited.", ["4810"]),
  W("medea", "Medea", "Euripides", "431 BC", "greeks", "tragedy", "A wife abandoned for a princess takes the worst revenge there is.", ["6404"]),
  W("bacchae", "The Bacchae", "Euripides", "405 BC", "greeks", "tragedy", "The god Dionysus comes home to Thebes, and the king who refuses him.", ["4724", "18671"]),
  W("iphigenia", "Iphigenia in Aulis", "Euripides", "405 BC", "greeks", "tragedy", "Agamemnon must give his daughter to the gods for a wind to Troy.", ["7985", "10019"]),
  W("tauris", "Iphigenia among the Taurians", "Euripides", "about 414 BC", "greeks", "tragedy", "Iphigenia, saved from the altar, is a priestess at the end of the world when her brother arrives to be sacrificed. Aristotle's favourite recognition.", ["9997", "10035"]),
  W("clouds", "The Clouds", "Aristophanes", "423 BC", "greeks", "comedy", "Socrates mocked as a sophist hanging in a basket, twenty-four years before his trial.", ["9998"]),
  W("frogs", "The Frogs", "Aristophanes", "405 BC", "greeks", "comedy", "Dionysus goes down to Hades to bring back a good poet, and holds a contest between Aeschylus and Euripides.", ["8000"]),
  W("lysistrata", "Lysistrata", "Aristophanes", "411 BC", "greeks", "comedy", "The women of Greece end a war by refusing their husbands.", ["5001", "10933"]),
  W("acharnians", "The Acharnians", "Aristophanes", "425 BC", "greeks", "comedy", "A farmer makes his own private peace with Sparta.", ["10029"]),
  W("euthyphro", "Euthyphro", "Plato", "4th century BC", "greeks", "dialogues", "On his way to court, Socrates asks a priest what piety is.", ["275"]),
  W("apology", "Apology", "Plato", "4th century BC", "greeks", "dialogues", "Socrates' defence of the examined life to the jury that condemns him.", ["1268", "6055", "9448"], [v("understand", SOCRATES)]),
  W("phaedo", "Phaedo", "Plato", "4th century BC", "greeks", "dialogues", "His last day, spent arguing that the soul outlives the body.", ["4421"], [v("understand", SOCRATES), v("see", STELE)]),
  W("republic", "Republic", "Plato", "about 375 BC", "greeks", "dialogues", "What justice is, asked by building a city in words.", ["2707", "7166"], [
    v("understand", yt("lecture", "8rf3uqDj00A", "Plato's Republic I: Justice, Power, and Knowledge", "Michael Sugrue", "A lecture on the first books.")),
  ]),
  W("symposium", "Symposium", "Plato", "about 385 BC", "greeks", "dialogues", "A drinking party where each guest praises love, until Alcibiades arrives.", ["3485"]),
  W("meno", "Meno", "Plato", "4th century BC", "greeks", "dialogues", "Can virtue be taught? A slave boy is led to a proof he did not know he knew.", ["5566"]),
  W("gorgias", "Gorgias", "Plato", "4th century BC", "greeks", "dialogues", "Rhetoric against philosophy: is it better to suffer wrong than to do it?", ["6991"]),
  W("laws", "Laws", "Plato", "about 348 BC", "greeks", "dialogues", "His last and longest work: three old men walk to a temple and write the laws of a new city, its music included.", ["6423", "10549"]),
  W("timaeus", "Timaeus", "Plato", "about 360 BC", "greeks", "dialogues", "How the world was made, its soul tuned in the ratios of a musical scale.", ["842"]),
  W("phaedrus", "Phaedrus", "Plato", "4th century BC", "greeks", "dialogues", "A walk outside the walls on love, the soul and writing.", ["2429"]),
  W("ethics", "Nicomachean Ethics", "Aristotle", "4th century BC", "greeks", "treatises", "Happiness as living well, and the virtues that make it.", ["3733"], [
    v("understand", iot("1ft00r2ap8dq9", "Aristotle's Nicomachean Ethics", "Four scholars on what the Ethics asks of you.")),
  ]),
  W("politics", "Politics", "Aristotle", "4th century BC", "greeks", "treatises", "Man as a political animal, and the kinds of city.", ["1360"]),
  W("poetics", "Poetics", "Aristotle", "about 335 BC", "greeks", "treatises", "What tragedy is and why Oedipus is the best of them.", ["240"]),
  W("rhetoric", "Rhetoric", "Aristotle", "4th century BC", "greeks", "treatises", "How to persuade, and why it matters in a free city.", ["4114"]),
  W("metaphysics", "Metaphysics", "Aristotle", "4th century BC", "greeks", "treatises", "Being as being, and the causes of things.", ["5224"]),
  W("herodotus", "Histories", "Herodotus", "about 430 BC", "greeks", "histories", "The first history: the Persian Wars and everything that led to them.", ["2198", "2401", "3101"], [v("understand", KAGAN)]),
  W("thucydides", "History of the Peloponnesian War", "Thucydides", "about 400 BC", "greeks", "histories", "Athens against Sparta, by an Athenian general who lost a battle and wrote it all down.", ["422", "22108"], [v("understand", KAGAN)]),
  W("anabasis", "Anabasis", "Xenophon", "about 370 BC", "greeks", "histories", "Ten thousand Greek soldiers march home through Persia.", ["2727"]),
  W("memorabilia", "Memorable Thoughts of Socrates", "Xenophon", "about 371 BC", "greeks", "histories", "Another pupil remembers Socrates.", ["14766"]),
  W("meditations", "Meditations", "Marcus Aurelius", "AD 170s", "romans", "philosophy", "Notes an emperor wrote to himself on campaign, never meant to be read.", ["1095", "12252"], [
    v("understand", iot("1tyinop5kt3m0", "Marcus Aurelius", "Scholars on the man behind the notebook.")),
    v("understand", yt("lecture", "Auuk1y4DRgk", "Marcus Aurelius' Meditations: The Stoic Ideal", "Michael Sugrue", "A lecture on what the Meditations teach.")),
    v("see", aic(5644, "9b312820-971d-04ba-361d-4b008eaaaccc", "Aureus (Coin) Portraying Marcus Aurelius", "Ancient Roman, 153-154", "His face as Romans carried it.")),
  ]),
  W("plutarch", "Parallel Lives", "Plutarch", "about AD 100", "greeks", "histories", "Greek and Roman lives side by side, to see what character does.", ["3119"]),
];

export const WORKS: readonly Work[] = [...BASE_WORKS, ...MEDIEVAL_WORKS, ...RENAISSANCE_WORKS, ...ENLIGHTENMENT_WORKS, ...FOUNDING_WORKS];

export const workById = (id: string): Work | undefined => WORKS.find((w) => w.id === id);

const STOICISM = iot("1sgaxe81uzkg3n", "Stoicism", "The school from Zeno to Rome.");
const AUREUS = aic(5644, "9b312820-971d-04ba-361d-4b008eaaaccc", "Aureus (Coin) Portraying Marcus Aurelius", "Ancient Roman, 153-154", "His face as Romans carried it.");

const BASE_TOPICS: readonly TopicPage[] = [
  {
    id: "greeks", name: "The Greeks", start: "greeks",
    about: "Homer to Plutarch: the epics, the tragedies and comedies of Athens, Plato's dialogues, Aristotle, the historians, and the music, vases and coins that survive.",
    forms: [
      { id: "epic", label: "Epic", where: "Ionia and mainland Greece, 8th and 7th centuries BC", works: ["iliad", "odyssey", "theogony", "hymns"] },
      { id: "tragedy", label: "Tragedy", where: "Athens, 5th century BC", works: ["oresteia", "persians", "oedipus", "antigone", "colonus", "electra", "medea", "bacchae", "iphigenia", "tauris"] },
      { id: "comedy", label: "Comedy", where: "Athens, 5th century BC", works: ["clouds", "frogs", "lysistrata", "acharnians"] },
      { id: "dialogues", label: "Dialogues", where: "Athens, 4th century BC", works: ["euthyphro", "apology", "phaedo", "republic", "symposium", "meno", "gorgias", "phaedrus", "timaeus", "laws"] },
      { id: "treatises", label: "Treatises", where: "Athens, 4th century BC", works: ["ethics", "politics", "poetics", "rhetoric", "metaphysics"] },
      { id: "histories", label: "Histories and lives", where: "5th century BC to the 2nd century AD", works: ["herodotus", "thucydides", "anabasis", "memorabilia", "plutarch"] },
      { id: "music", label: "Music", items: [PANIAGUA, SEIKILOS] },
      { id: "art", label: "Art", items: [
        AMPHORA,
        aic(185, "9312601d-c20c-289e-c026-eafc676c5116", "Kylix (Drinking Cup)", "Penthesilea Painter, Athens, about 460 BCE", "A cup for the drinking parties Plato wrote about."),
        KRATER,
        aic(9655, "c1691eb7-517e-6d06-987d-dbd9a87d0826", "Tetradrachm (Coin) Depicting the Goddess Athena", "Greek, Athens, about 163 BCE", "Athena, as Athenians paid with her."),
        aic(454, "38ea638d-c8f7-f916-da08-ac7730b6ed5a", "Statuette of a Seated Girl", "Greek, Athens, 330-320 BCE", "Made in Aristotle's Athens."),
        STELE,
      ] },
      { id: "lectures", label: "Lectures", items: [KAGAN, yt("lecture", "8rf3uqDj00A", "Plato's Republic I: Justice, Power, and Knowledge", "Michael Sugrue", "A lecture on the Republic.")] },
      { id: "podcasts", label: "Podcasts", items: [
        iot("1pk8p2aa043pl", "The Iliad", "What the poem is about, and why it lasted."),
        iot("p0cx3rfdbmsy", "Oedipus Rex", "Why the play still works."),
        SOCRATES,
        iot("1ft00r2ap8dq9", "Aristotle's Nicomachean Ethics", "What the Ethics asks of you."),
      ] },
    ],
    people: [
      { name: "Homer", wiki: "Homer", ol: "OL18404A" },
      { name: "Aeschylus", wiki: "Aeschylus", ol: "OL74434A" },
      { name: "Sophocles", wiki: "Sophocles", ol: "OL11149A" },
      { name: "Euripides", wiki: "Euripides", ol: "OL21589A" },
      { name: "Aristophanes", wiki: "Aristophanes", ol: "OL24462A" },
      { name: "Socrates", wiki: "Socrates" },
      { name: "Plato", wiki: "Plato", ol: "OL12823A" },
      { name: "Aristotle", wiki: "Aristotle", ol: "OL22105A" },
      { name: "Herodotus", wiki: "Herodotus", ol: "OL7680575A" },
      { name: "Thucydides", wiki: "Thucydides", ol: "OL62641A" },
    ],
  },
  {
    id: "romans", name: "The Romans", start: "romans",
    about: "Rome from its founding poem to its emperors: Virgil and Ovid, the historians, Cicero and Seneca, Plautus' comedies, and the coins Romans carried.",
    forms: [
      { id: "poetry", label: "Epic and poetry", where: "Rome, 1st century BC to 1st century AD", items: [
        ab("1718", "Aeneid", "Virgil", "The poem Rome told itself about where it came from."),
        ab("3778", "Metamorphoses", "Ovid", "Every myth of change, from chaos to Caesar."),
        ab("15045", "Georgics", "Virgil", "A poem on farming, and on work."),
        ab("3064", "On the Nature of Things", "Lucretius", "Atoms, the void, and why not to fear death."),
        ab("1328", "To Lesbia", "Catullus", "Love poems, two thousand years old."),
      ] },
      { id: "histories", label: "Histories and lives", where: "Rome, 1st century BC to 2nd century AD", items: [
        ab("3496", "From the Foundation of the City, Vol. 1", "Livy", "Rome's history from the beginning."),
        ab("4732", "Commentaries on the Gallic War", "Julius Caesar", "A general's own account of his war."),
        ab("2332", "Annals, Vol. 1", "Tacitus", "The emperors after Augustus."),
        ab("3113", "Agricola", "Tacitus", "A good man's life under a bad emperor."),
        ab("2376", "Lives of the Twelve Caesars", "Suetonius", "Caesar to Domitian, with the gossip left in."),
      ] },
      { id: "philosophy", label: "Philosophy", where: "Rome, 1st century BC to 2nd century AD", items: [
        ab("9450", "On Duties", "Cicero", "A statesman's last book, written to his son."),
        ab("7035", "On the Nature of the Gods", "Cicero", "Three schools argue about the gods."),
        ab("4947", "Of the Shortness of Life", "Seneca", "Life is long enough, if you know how to use it."),
      ], works: ["meditations"] },
      { id: "comedy", label: "Comedy and satire", where: "Rome, 2nd century BC to 2nd century AD", items: [
        ab("15450", "Trinummus", "Plautus", "A comedy about a friend's buried treasure."),
        ab("16331", "Bacchides", "Plautus", "Twin sisters, two lovers, one clever slave."),
        ab("19982", "Satires", "Juvenal", "Rome's vices, by a man who hated them."),
      ] },
      { id: "podcasts", label: "Podcasts", items: [iot("cjg9rz1cs4rja", "Seneca the Younger", "A Stoic who served Nero."), iot("1tyinop5kt3m0", "Marcus Aurelius", "The man behind the notebook.")] },
      { id: "art", label: "Art", items: [AUREUS] },
    ],
    people: [
      { name: "Virgil", wiki: "Virgil", ol: "OL28294A" },
      { name: "Ovid", wiki: "Ovid", ol: "OL18770A" },
      { name: "Cicero", wiki: "Cicero", ol: "OL28743A" },
      { name: "Livy", wiki: "Livy", ol: "OL127331A" },
      { name: "Seneca", wiki: "Seneca_the_Younger", ol: "OL3143587A" },
      { name: "Tacitus", wiki: "Tacitus", ol: "OL4274775A" },
      { name: "Marcus Aurelius", wiki: "Marcus_Aurelius", ol: "OL133986A" },
    ],
  },
  {
    id: "stoics", name: "Stoicism", start: "stoics",
    about: "The school Zeno founded in a painted porch in Athens, and the Romans who lived by it: a freed slave, a statesman and an emperor on what is up to us.",
    forms: [
      { id: "greek", label: "Greek Stoics", where: "Athens and Nicopolis, 3rd century BC to 2nd century AD", items: [
        ab("20053", "Lives of Eminent Philosophers, Vol. 2", "Diogenes Laertius", "Book VII holds what survives of Zeno, Cleanthes and Chrysippus."),
        ab("518", "Enchiridion", "Epictetus", "The handbook: what is up to us, and what is not."),
        ab("16717", "Discourses", "Epictetus", "A freed slave's lessons, taken down by a pupil."),
      ] },
      { id: "roman", label: "Roman Stoics", where: "Rome, 1st and 2nd centuries AD", items: [
        ab("4947", "Of the Shortness of Life", "Seneca", "Life is long enough, if you know how to use it."),
        ab("5146", "Of Peace of Mind", "Seneca", "How to be steady in a changing life."),
        ab("9230", "Moral Letters, Vol. I", "Seneca", "Letters to a friend on time, grief, wealth and death."),
        ab("1095", "Meditations", "Marcus Aurelius", "Notes an emperor wrote to himself on campaign."),
      ] },
      { id: "podcasts", label: "Podcasts", items: [STOICISM, iot("1tyinop5kt3m0", "Marcus Aurelius", "The man behind the notebook."), iot("cjg9rz1cs4rja", "Seneca the Younger", "A Stoic who served Nero.")] },
      { id: "lectures", label: "Lectures", items: [yt("lecture", "Auuk1y4DRgk", "Marcus Aurelius' Meditations: The Stoic Ideal", "Michael Sugrue", "What the Meditations teach.")] },
      { id: "art", label: "Art", items: [AUREUS, aic(9612, "0922f579-59e0-7c34-fbd0-52361d1dbcbe", "Fantasy on the Death of Seneca", "Giovanni Battista Tiepolo, 1735/40", "How Seneca died, as a painter imagined it.")] },
    ],
    people: [
      { name: "Zeno of Citium", wiki: "Zeno_of_Citium" },
      { name: "Epictetus", wiki: "Epictetus", ol: "OL22801A" },
      { name: "Seneca", wiki: "Seneca_the_Younger", ol: "OL3143587A" },
      { name: "Marcus Aurelius", wiki: "Marcus_Aurelius", ol: "OL133986A" },
    ],
  },
  {
    id: "founding", name: "The American founding", start: "founding",
    about: "The arguments that made the United States, in the founders' words: the pamphlets, the papers for and against the Constitution, their lives, their songs and their faces.",
    forms: [
      { id: "arguments", label: "Arguments", where: "The thirteen colonies and states, 1776 to 1788", items: [
        ab("1126", "Common Sense", "Thomas Paine", "The pamphlet that turned a quarrel into a cause."),
        ab("670", "Federalist Papers", "Alexander Hamilton, John Jay, James Madison", "The case for the Constitution."),
        ab("1085", "Anti-Federalist Papers", "Patrick Henry", "The case against it, which gave the country its Bill of Rights."),
      ] },
      { id: "lives", label: "Lives", items: [ab("1143", "Autobiography of Benjamin Franklin", "Benjamin Franklin", "A printer's apprentice who signed the Declaration and the Constitution.")] },
      { id: "podcasts", label: "Podcasts", items: [
        iot("1n7msw51v8zus", "Thomas Paine's Common Sense", "Why it sold so many copies."),
        iot("129acml1xnj748", "The Federalist Papers", "Who wrote which, and what they feared."),
        iot("xe1hst1n9n0qg", "Benjamin Franklin", "His science, his diplomacy and his doubts."),
      ] },
      { id: "lectures", label: "Lectures and debates", items: [
        course("https://oyc.yale.edu/history/hist-116", "The American Revolution", "Joanne Freeman", "Yale's course, lecture by lecture."),
        yt("discussion", "xG7jMnkMd7Q", "Ratification Debates", "National Constitution Center", "Scholars take both sides."),
      ] },
      { id: "music", label: "Music", items: [yt("music", "t7S_07E-9CA", "Chester", "William Billings, 1770", "The war's marching hymn.")] },
      { id: "art", label: "Art and film", items: [
        aic(80460, "65070e6a-e55b-01dc-1e99-a649fd7fd8b1", "George Washington", "Edward Savage, 1793", "Painted from life."),
        { kind: "find", medium: "film", title: "America", by: "D. W. Griffith", url: "https://archive.org/details/silent-america", image: "https://archive.org/services/img/silent-america", year: "1924", why: "The Revolution as a silent epic; in the public domain." },
      ] },
    ],
    people: [
      { name: "Thomas Paine", wiki: "Thomas_Paine", ol: "OL31439A" },
      { name: "Benjamin Franklin", wiki: "Benjamin_Franklin", ol: "OL26170A" },
      { name: "George Washington", wiki: "George_Washington", ol: "OL17013A" },
      { name: "Alexander Hamilton", wiki: "Alexander_Hamilton", ol: "OL363754A" },
      { name: "James Madison", wiki: "James_Madison", ol: "OL240767A" },
    ],
  },
];

/** Forms an era's own file adds to a topic page, ids prefixed with the topic ("founding:music"); one with the same id replaces the old one. */
const EXTRA_FORMS: readonly TopicForm[] = [...ANCIENT_FORMS, ...MEDIEVAL_FORMS, ...RENAISSANCE_FORMS, ...ENLIGHTENMENT_FORMS, ...FOUNDING_FORMS];
const withForms = (t: TopicPage): TopicPage => {
  const extra = EXTRA_FORMS.filter((f) => f.id.startsWith(`${t.id}:`)).map((f) => ({ ...f, id: f.id.slice(t.id.length + 1) }));
  if (!extra.length) return t;
  const ids = new Set(extra.map((f) => f.id));
  const kept = t.forms.filter((f) => !ids.has(f.id));
  const last = (f: TopicForm) => f.id === "podcasts" || f.id === "art" || f.id === "lectures";
  return { ...t, forms: [...kept.filter((f) => !last(f)), ...extra, ...kept.filter(last)] };
};
export const TOPIC_PAGES: readonly TopicPage[] = [...BASE_TOPICS, ...[MEDIEVAL_TOPIC, RENAISSANCE_TOPIC, ENLIGHTENMENT_TOPIC, FOUNDING_TOPIC].filter((t): t is TopicPage => t !== null)].map(withForms);

export const topicPageById = (id: string): TopicPage | undefined => TOPIC_PAGES.find((t) => t.id === id);

/** The playlists that are paths through a topic, its Start here first. */
export function playlistsOf(t: TopicPage, all: readonly Collection[] = COLLECTIONS): Collection[] {
  const start = collectionById(t.start);
  const rest = all.filter((c) => c.id !== t.start && c.topics?.includes(t.id));
  return start ? [start, ...rest] : rest;
}

/** A work as the item to play first: its first recording, with its about as why. */
export function workItem(w: Work): CollectionItem {
  return ab(w.audiobooks[0]!, w.title, w.by, w.about);
}

/** Everything in a form as items: each work's first recording, then the other things. */
export function formItems(f: TopicForm): CollectionItem[] {
  return [...(f.works ?? []).flatMap((id) => { const w = workById(id); return w ? [workItem(w)] : []; }), ...(f.items ?? [])];
}

/** How many things a form holds. */
export const formSize = (f: TopicForm): number => (f.works?.length ?? 0) + (f.items?.length ?? 0);

/** The kinds of versions a work has, as its row says them: "listen · podcast · art". */
export function versionLine(w: Work): string {
  const kinds = new Set<string>(["listen"]);
  for (const x of w.versions) kinds.add(x.item.kind === "episode" ? "podcast" : x.item.kind === "course" ? "course" : x.item.kind === "find" ? x.item.medium : "listen");
  return [...kinds].join(" · ");
}

/**
 * Everything a topic holds that a playlist made for one person may pick from, each once by key: works, the forms'
 * other things, then the topic's playlists. Reflect never picks anything outside this list.
 */
export function topicCandidates(t: TopicPage): CollectionItem[] {
  const seen = new Set<string>();
  const out: CollectionItem[] = [];
  const add = (i: CollectionItem) => { const k = itemKey(i); if (!seen.has(k)) { seen.add(k); out.push(i); } };
  for (const f of t.forms) formItems(f).forEach(add);
  for (const id of t.forms.flatMap((f) => f.works ?? [])) workById(id)?.versions.forEach((x) => add(x.item));
  for (const p of playlistsOf(t)) p.items.forEach(add);
  return out;
}

/** The work a recording or version belongs to, if it has a page. */
export function workOf(i: CollectionItem): Work | undefined {
  const k = itemKey(i);
  return WORKS.find((w) => (i.kind === "audiobook" && w.audiobooks.includes(i.id)) || w.versions.some((x) => itemKey(x.item) === k));
}
