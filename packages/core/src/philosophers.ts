/**
 * Philosopher pages (Torian, 2026-11-16 03:01Z to 03:17Z, "go" at 03:19Z on the guide "Philosophers and music"): one
 * person, everything in Scholē that is theirs or about them. Plato and Aristotle wrote about music and plays, so those
 * sections start in their own words, cited by the standard numbering (Stephanus pages for Plato, Bekker pages for
 * Aristotle, book and section for the Meditations). Where a philosopher said little or nothing, the section is rebuilt
 * from their time and court and says so. Music chosen across the ages "in the spirit of" a philosopher is chosen by
 * Reflect's editors, each piece with why, and is never shown as the philosopher's own choice.
 *
 * Sources are split the way historians split them: from the time (primary) and about the time (secondary). Quotations
 * are from translations in the public domain: Jowett's Plato (1871), Ellis's Politics (1776), Butcher's Poetics
 * (1895) and Long's Marcus Aurelius (1862). The Greek modes are not the church modes that later took their names; the
 * page links an article on why rather than explaining it. Pure: no I/O.
 */
import { ab, iot, yt, type CollectionItem } from "./collections";
import { workById, type TopicPerson } from "./topic-pages";

/** A place in a work: the work (an id in `topic-pages.ts`), where in it, and its words in a public-domain translation. */
export type Passage = { work: string; at: string; words?: string; tr?: string };

/** Whether a section starts in the philosopher's own words, or is rebuilt from their time. */
export type Stance = "own" | "rebuilt";

/** One thing a philosopher kept or warned against: a mode, an instrument or a kind of song, with the passage that says so. */
export type Rule = { what: string; kind: "mode" | "instrument" | "song"; verdict: "kept" | "warned"; why: string; at: Passage };

export type Contemporary = TopicPerson & { note: string };

/** A playlist across the ages chosen by Reflect's editors in a philosopher's spirit. */
export type Ages = { name: string; about: string; items: readonly CollectionItem[] };

export type MusicSection = {
  stance: Stance;
  /** The one line said above a rebuilt section. */
  note?: string;
  words: readonly Passage[];
  rules: readonly Rule[];
  /** Music of their time, what survives, played by people who reconstruct it. */
  time: readonly CollectionItem[];
  timeNote: string;
  people: readonly Contemporary[];
  ages: readonly Ages[];
};

export type TheatreSection = {
  stance: Stance;
  note?: string;
  words: readonly Passage[];
  /** Plays of their time with work pages (ids in `topic-pages.ts`). */
  plays: readonly string[];
  people: readonly Contemporary[];
};

/** A song, poem or play a philosopher names, and where it is now: a work page, or lost with what remains. */
export type Named = { at: Passage; names: string; why: string; work?: string; lost?: string };

/** A Wikipedia article read inside Scholē, by its page title. */
export type Article = { title: string; note: string };

export type Philosopher = {
  id: string;
  name: string;
  wiki: string;
  ol?: string;
  born: string;
  died: string;
  place: string;
  what: string;
  about: string;
  /** The work most people should hear first (an id in `topic-pages.ts`). */
  start: string;
  /** Their works with pages, in reading order. */
  works: readonly string[];
  music: MusicSection;
  theatre: TheatreSection;
  named: readonly Named[];
  /** Read and hear more, written in their time. */
  from: readonly CollectionItem[];
  /** Read and hear more, written later about the time. */
  later: readonly CollectionItem[];
  articles: readonly Article[];
  topics: readonly string[];
};

// Gregorio Paniagua and Atrium Musicae de Madrid, Musique de la Grèce antique: one track in Apple Music's player.
const PANIAGUA = "https://music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071";
const PANIAGUA_ART = "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c7/8d/f4/c78df426-5e97-0b8c-fa50-614f2da09c79/5414939990168_cover.jpg/600x600bb.jpg";
const track = (i: string, title: string, by: string, why: string): CollectionItem =>
  ({ kind: "find", medium: "music", title, by, url: `${PANIAGUA}?i=${i}`, image: PANIAGUA_ART, why });
/** An album in Apple Music's player: previews for everyone, whole tracks for its subscribers. */
const album = (url: string, art: string, title: string, by: string, why: string): CollectionItem =>
  ({ kind: "find", medium: "music", title, by, url: `https://music.apple.com/us/album/${url}`, image: `https://is1-ssl.mzstatic.com/image/thumb/${art}/600x600bb.jpg`, why });

const PM = "Gregorio Paniagua, Atrium Musicae de Madrid";
const ORESTES = track("6771405574", "Orestes, chorus (stasimon)", `Euripides, 408 BC; ${PM}`, "A chorus from Euripides' Orestes, staged in Athens when Plato was about twenty: one of the oldest pieces of written Greek music, on a scrap of papyrus.");
const DELPHIC = track("6771405576", "First Delphic Hymn to Apollo", `Athenaeus, 2nd century BC; ${PM}`, "Carved in stone at Delphi two centuries later: the nearest whole piece to the music Plato knew.");
const SUN = track("6771405587", "Hymn to the Sun", `Mesomedes, 2nd century AD; ${PM}`, "By Hadrian's court composer, one of three hymns of his that survive with their notes.");
const MUSE = track("6771405590", "Hymn to the Muse", `Mesomedes, 2nd century AD; ${PM}`, "Mesomedes again: a short prayer to the Muse, as a lyre singer at court would sing it.");
const NEMESIS = track("6771406042", "Hymn to Nemesis", `Mesomedes, 2nd century AD; ${PM}`, "To the goddess who brings down the proud: a hymn a Stoic emperor could hear without shame.");
const SEIKILOS = yt("music", "mGfOHoun0OQ", "Seikilos Epitaph", "Greek song carved on a grave in Asia Minor, about the 1st century AD", "The oldest complete song with its tune: \"While you live, shine.\"");

const CHANT = album("the-mystery-of-santo-domingo-de-silos/1452149891", "Music124/v4/4e/b3/f7/4eb3f7d3-fa1c-886c-ffc6-040609ff1745/00028944539929.rgb.jpg", "The Mystery of Santo Domingo de Silos", "Benedictine Monks of Santo Domingo de Silos", "One line of melody sung to words, with no display: close to what he asked songs to be. Its modes carry Greek names but are not his.");
const PALESTRINA = album("allegri-miserere-palestrina-missa-papae-marcelli-remastered/573087801", "Music115/v4/70/2e/91/702e914a-cd03-b5c5-4c9a-b017b2ceedb3/041-SqBig.jpg", "Missa Papae Marcelli", "Palestrina; The Tallis Scholars", "A mass written, the story goes, to show that many voices could sing together and keep every word clear.");
const CHORALES = album("bach-333-4-part-chorales-vol-3/1436925093", "Music118/v4/3b/46/1b/3b461b5f-f885-854c-0c22-9d0226508aa0/00028948360284.rgb.jpg", "Four-part chorales", "J. S. Bach; Vocalconsort Berlin", "Hymn tunes set for a whole congregation to sing: the music of a city's common worship.");
const LACHRIMAE = album("dowland-lachrimae-alpha-collection/1571731892", "Music115/v4/20/8c/f9/208cf97d-240d-f93d-9920-fdf824d5aad2/3760014193262.png", "Lachrimae, or Seven Tears", "John Dowland; Thomas Dunford and others", "Seven pavans of tears: the lamenting music he would send out of the city (Republic III, 398e).");
const PAGANINI = album("paganini-24-caprices/695590557", "Music6/v4/c3/62/d9/c362d92d-357f-14b9-19f5-34097a2ec172/724356725751.jpg", "24 Caprices", "Paganini; Itzhak Perlman", "Showpieces of many notes for one virtuoso: the display both he and Aristotle kept out of a young person's training.");
const RITE = album("stravinsky-the-rite-of-spring/1452304508", "Music114/v4/cc/df/21/ccdf2184-f7a0-51a1-feec-0c13fc53a741/00028947917786.rgb.jpg", "The Rite of Spring", "Stravinsky; Pierre Boulez, Cleveland Orchestra", "A new kind of music that started a riot at its first performance in Paris in 1913. He warned that a new kind of song changes a city's laws (Republic IV, 424c).");
const WATER = album("handel-water-music/1440758223", "Music125/v4/51/03/ec/5103ecff-be8b-1699-4441-b04337a57d6b/00028941052520.rgb.jpg", "Water Music", "Handel; The English Concert, Trevor Pinnock", "Played for a king's evening on the Thames in 1717: music for cultured leisure, one of the uses he names.");
const SATIE = album("satie-gymnopedies/694083664", "Music125/v4/df/d6/1a/dfd61a3e-f27a-0a0f-bc7b-9d27a84856b6/dj.wuxscvir.jpg", "Gymnopédies", "Satie; Aldo Ciccolini", "Slow pieces named for a Spartan festival of dancing boys: music to rest by.");
const MISERERE = album("allegri-miserere-tallis-lamentations-of-jeremiah/1452218367", "Music124/v4/54/15/cb/5415cba1-3cda-1c78-0b7b-c5f91e62f9c8/00028947836223.rgb.jpg", "Miserere", "Allegri; The Sixteen and others", "A psalm for Holy Week, once sung only in the Sistine Chapel: the sacred melody he says restores those overcome by pity and fear (Politics VIII, 1342a).");
const REQUIEM = album("mozart-requiem/1440764542", "Music126/v4/13/eb/c1/13ebc16b-b5d4-f898-af41-04afcf29887a/06UMGIM59165.rgb.jpg", "Requiem", "Mozart; Academy of St Martin in the Fields", "A mass for the dead Mozart left unfinished: pity and fear, heard in order to be relieved of them.");

const JOWETT = "Jowett";
const ELLIS = "Ellis";
const BUTCHER = "Butcher";
const LONG = "Long";

const PLATO_REPUBLIC_IOT = iot("xhe4mmwzwi0p", "Plato's Republic", "Scholars on the city in words.");
const SYMPOSIUM_IOT = iot("1jr6q6dn2whpg", "Plato's Symposium", "The drinking party, its speakers and its poets.");
const MATHS_MUSIC_IOT = iot("7txoa7vgfr", "Mathematics and Music", "Pythagoras' ratios and the scales built on them.");
const SPHERES_IOT = iot("15byn5amko4yd", "The Music of the Spheres", "The idea in Plato's Timaeus that the heavens are tuned.");
const COMEDY_IOT = iot("2ctycpbil9ts", "Comedy in Ancient Greek Theatre", "Aristophanes and the comedy Plato knew.");
const TRAGEDY_IOT = iot("1ib6iu9ixnzdg", "Tragedy", "What tragedy is, from Athens on.");
const POETICS_IOT = iot("1fz6jno1uhchrz", "Aristotle's Poetics", "What the Poetics says about plays, and why it lasted.");
const POLITICS_IOT = iot("13l26u21glddl9", "Aristotle's Politics", "The book whose last part is on music.");
const MARCUS_IOT = iot("1tyinop5kt3m0", "Marcus Aurelius", "Scholars on the man behind the notebook.");

const p = (work: string, at: string, words?: string, tr?: string): Passage => ({ work, at, ...(words ? { words } : {}), ...(tr ? { tr } : {}) });

export const PHILOSOPHERS: readonly Philosopher[] = [
  {
    id: "plato", name: "Plato", wiki: "Plato", ol: "OL12823A", born: "about 428 BC", died: "348 BC", place: "Athens",
    what: "Philosopher, pupil of Socrates, founder of the Academy",
    about: "He wrote dialogues in which Socrates questions the people of Athens about justice, love, knowledge and death. He thought music shapes character and that a city's laws depend on it, and he wanted the poets sent away unless they could defend themselves.",
    start: "apology",
    works: ["apology", "euthyphro", "phaedo", "republic", "symposium", "meno", "gorgias", "phaedrus", "timaeus", "laws"],
    music: {
      stance: "own",
      words: [
        p("republic", "III, 401d", "Musical training is a more potent instrument than any other, because rhythm and harmony find their way into the inward places of the soul, on which they mightily fasten, imparting grace.", JOWETT),
        p("republic", "IV, 424c", "When modes of music change, the fundamental laws of the State always change with them.", JOWETT),
      ],
      rules: [
        { what: "Dorian", kind: "mode", verdict: "kept", why: "For the brave man in the hour of danger, who meets the blows of fortune with a firm step.", at: p("republic", "III, 399a") },
        { what: "Phrygian", kind: "mode", verdict: "kept", why: "For a man at peace, praying to a god or persuading a friend, and moderate in success.", at: p("republic", "III, 399b") },
        { what: "Lyre and kithara", kind: "instrument", verdict: "kept", why: "The instruments of Apollo, for use in the city.", at: p("republic", "III, 399d") },
        { what: "Shepherd's pipe", kind: "instrument", verdict: "kept", why: "For shepherds, in the country only.", at: p("republic", "III, 399d") },
        { what: "Mixolydian and Syntonolydian", kind: "mode", verdict: "warned", why: "The modes of lament, of no use even to women of character, much less to men.", at: p("republic", "III, 398e") },
        { what: "Ionian and Lydian", kind: "mode", verdict: "warned", why: "The soft modes of drinking songs, called relaxed.", at: p("republic", "III, 398e") },
        { what: "Aulos", kind: "instrument", verdict: "warned", why: "The reed pipe (Jowett calls it the flute): it plays every mode, and so is worse than all the stringed instruments together.", at: p("republic", "III, 399d") },
        { what: "Many-stringed harps", kind: "instrument", verdict: "warned", why: "Triangular harps and instruments of many strings and complex scales.", at: p("republic", "III, 399c") },
        { what: "A new kind of song", kind: "song", verdict: "warned", why: "Praising new songs is fine; a new kind of song is dangerous to the whole city, as Damon taught.", at: p("republic", "IV, 424c") },
        { what: "Music judged by applause", kind: "song", verdict: "warned", why: "When the crowd's whistling and clapping judged the contests, a rule of the theatre replaced the rule of the best.", at: p("laws", "III, 700c-701a") },
      ],
      time: [ORESTES, DELPHIC, SEIKILOS],
      timeNote: "Almost no Greek music survives with its notes. These are the fragments, played by musicians who rebuild the instruments.",
      people: [
        { name: "Damon of Athens", wiki: "Damon_of_Athens", note: "Pericles' teacher in music, whom Socrates recommends; Plato cites him on modes and rhythm (Republic III, 400b; IV, 424c)." },
        { name: "Timotheus of Miletus", wiki: "Timotheus_of_Miletus", note: "The best-known composer of the New Music, the change the Laws regrets." },
        { name: "Philoxenus of Cythera", wiki: "Philoxenus_of_Cythera", note: "A composer of dithyrambs at the court of Dionysius of Syracuse, which Plato visited." },
        { name: "Archytas", wiki: "Archytas", note: "Plato's friend in Tarentum, who worked out the ratios of the three kinds of Greek scale." },
      ],
      ages: [
        { name: "Music that steadies", about: "Chosen by Reflect's editors in the spirit of Republic III: simple, sung to words, made for a people to share. Not Plato's own choice.", items: [CHANT, PALESTRINA, CHORALES] },
        { name: "What he warned against, across the ages", about: "Laments, showpieces and new kinds of song from later centuries, chosen by Reflect's editors to hear what he meant. Not his list.", items: [LACHRIMAE, PAGANINI, RITE] },
      ],
    },
    theatre: {
      stance: "own",
      words: [
        p("republic", "X, 607a", "Hymns to the gods and praises of famous men are the only poetry which ought to be admitted into our State.", JOWETT),
      ],
      plays: ["clouds", "frogs", "bacchae", "iphigenia", "tauris", "medea"],
      people: [
        { name: "Aristophanes", wiki: "Aristophanes", ol: "OL24462A", note: "Speaks in the Symposium; his Clouds is named at Socrates' trial in the Apology." },
        { name: "Agathon", wiki: "Agathon", note: "The tragic poet whose victory party is the Symposium. Only fragments of his plays survive." },
        { name: "Euripides", wiki: "Euripides", ol: "OL21589A", note: "Died when Plato was about twenty; his late plays were new in Plato's youth." },
      ],
    },
    named: [
      { at: p("apology", "19c"), names: "The comedy where a Socrates swings about saying he walks on air", why: "Socrates tells the jury that this is the old slander against him.", work: "clouds" },
      { at: p("republic", "III, 388a"), names: "Achilles lying on his side, then on his back, mourning Patroclus", why: "Plato quotes it to argue that heroes should not be shown lamenting.", work: "iliad" },
      { at: p("republic", "II, 377e"), names: "Hesiod on what Uranus did, and how Cronus took revenge", why: "The first stories children hear must not be lies about the gods.", work: "theogony" },
      { at: p("republic", "IV, 424b"), names: "\"The newest song which the singers have\" (Odyssey, Book I)", why: "He reads the line as praising new songs, not a new kind of song.", work: "odyssey" },
      { at: p("republic", "II, 380a"), names: "Aeschylus' Niobe", why: "A poet may not say a god caused Niobe's sufferings.", lost: "Lost. A few lines survive on papyrus." },
      { at: p("laws", "I, 629a"), names: "Tyrtaeus' war songs", why: "The Athenian asks whether courage in war is the whole of virtue.", lost: "Survives only in fragments quoted by later writers." },
      { at: p("symposium", "173a"), names: "Agathon's first prize-winning tragedy, 416 BC", why: "The party in the Symposium celebrates it.", lost: "Lost; not even its title is known." },
    ],
    from: [
      ab("14766", "Memorable Thoughts of Socrates", "Xenophon", "Socrates as another pupil remembered him."),
      ab("9998", "The Clouds", "Aristophanes", "Socrates mocked on stage while Plato was a boy."),
    ],
    later: [PLATO_REPUBLIC_IOT, SYMPOSIUM_IOT, MATHS_MUSIC_IOT, SPHERES_IOT, yt("lecture", "8rf3uqDj00A", "Plato's Republic I: Justice, Power, and Knowledge", "Michael Sugrue", "A lecture on the first books.")],
    articles: [
      { title: "Musical system of ancient Greece", note: "The modes, scales and notation Plato meant." },
      { title: "Gregorian mode", note: "Why today's Dorian is not his: the church modes took Greek names for different scales." },
      { title: "Aulos", note: "The reed pipe he banned." },
      { title: "Damon of Athens", note: "The musician he credits." },
      { title: "Timotheus of Miletus", note: "The New Music." },
      { title: "Pythagorean tuning", note: "The ratios behind the Timaeus." },
      { title: "Theatre of ancient Greece", note: "The theatre he would send the poets out of." },
    ],
    topics: ["greeks"],
  },
  {
    id: "aristotle", name: "Aristotle", wiki: "Aristotle", ol: "OL22105A", born: "384 BC", died: "322 BC", place: "Stagira and Athens",
    what: "Philosopher, pupil of Plato, tutor of Alexander, founder of the Lyceum",
    about: "He wrote on nearly everything: ethics, politics, poetry, nature and logic. He agreed with Plato that music shapes character, but held that every mode has its use, and that tragedy gives pity and fear a release.",
    start: "ethics",
    works: ["ethics", "politics", "poetics", "rhetoric", "metaphysics"],
    music: {
      stance: "own",
      words: [
        p("politics", "VIII, 1342a", "It is evident that all harmonies are to be used; but not for all purposes; but the most moral in education.", ELLIS),
        p("politics", "VIII, 1340a-b", "Others fix it in a firm and settled state, such is the power of the Doric music only; while the Phrygian fills the soul with enthusiasm.", ELLIS),
      ],
      rules: [
        { what: "Dorian", kind: "mode", verdict: "kept", why: "For the young: the most serious, a mean between the others, fittest to make them brave.", at: p("politics", "VIII, 1342b") },
        { what: "Every mode, each for its use", kind: "mode", verdict: "kept", why: "Steady ones to learn by, stirring ones to listen to, and music for rest and leisure.", at: p("politics", "VIII, 1342a") },
        { what: "Sacred melodies", kind: "song", verdict: "kept", why: "They restore those overcome by pity, fear or frenzy, as if a physician had treated them: a catharsis.", at: p("politics", "VIII, 1342a") },
        { what: "Aulos in education", kind: "instrument", verdict: "warned", why: "Not a moral instrument but one that inflames, and the player cannot speak while playing.", at: p("politics", "VIII, 1341a") },
        { what: "Training for contests", kind: "song", verdict: "warned", why: "The young should not learn the showpieces of the public games, only enough to judge good music.", at: p("politics", "VIII, 1341a") },
        { what: "Plato's Phrygian", kind: "mode", verdict: "warned", why: "He faults Socrates in the Republic for keeping the Phrygian mode while banning the aulos, which does the same.", at: p("politics", "VIII, 1342b") },
      ],
      time: [ORESTES, DELPHIC],
      timeNote: "Nothing survives with its notes from Aristotle's own years. These are the nearest: a chorus the Athenians of his day still knew, and a hymn carved at Delphi later.",
      people: [
        { name: "Aristoxenus", wiki: "Aristoxenus", note: "His pupil, who wrote the Elements of Harmony, the first surviving treatise on music theory." },
        { name: "Philoxenus of Cythera", wiki: "Philoxenus_of_Cythera", note: "The composer whose dithyramb Aristotle uses to show the Phrygian mode at work." },
      ],
      ages: [
        { name: "To learn by", about: "Chosen by Reflect's editors for the first use Aristotle names: steady music for training character. Not his own choice.", items: [CHORALES, PALESTRINA] },
        { name: "To rest by", about: "For the third use: rest and cultured leisure. Chosen by Reflect's editors.", items: [WATER, SATIE] },
        { name: "To be relieved by", about: "For the second use: catharsis, pity and fear heard in order to be relieved of them. Chosen by Reflect's editors.", items: [MISERERE, REQUIEM] },
      ],
    },
    theatre: {
      stance: "own",
      words: [
        p("poetics", "6, 1449b", "Tragedy, then, is an imitation of an action that is serious, complete, and of a certain magnitude; through pity and fear effecting the proper purgation of these emotions.", BUTCHER),
      ],
      plays: ["oedipus", "tauris", "iphigenia", "medea", "antigone"],
      people: [
        { name: "Theodectes", wiki: "Theodectes", note: "His friend, a tragic poet whose Lynceus the Poetics cites. His plays are lost." },
        { name: "Astydamas", wiki: "Astydamas", note: "A leading tragic poet of his day; the Poetics names his Alcmaeon, now lost." },
      ],
    },
    named: [
      { at: p("poetics", "11, 1452a"), names: "The messenger who comes to cheer Oedipus and reveals who he is", why: "His example of a reversal.", work: "oedipus" },
      { at: p("poetics", "11, 1452b; 16, 1455a"), names: "Iphigenia revealed to Orestes by the sending of a letter", why: "A recognition on both sides; in chapter 16, the best kind, coming from the events themselves.", work: "tauris" },
      { at: p("poetics", "15, 1454a"), names: "Iphigenia at Aulis, who as a suppliant is not like her later self", why: "A character who changes without reason.", work: "iphigenia" },
      { at: p("poetics", "14, 1453b"), names: "Medea, who kills her children knowing what she does", why: "The deed done knowingly; and in chapter 15, an ending brought by machine.", work: "medea" },
      { at: p("poetics", "9, 1451b"), names: "Agathon's Antheus", why: "A tragedy whose story and names were all invented.", lost: "Lost." },
      { at: p("politics", "VIII, 1340a"), names: "The melodies of Olympus", why: "They fill the soul with enthusiasm. (Ellis's translation reads \"the music at the Olympic games\".)", lost: "Lost. No note of them survives." },
      { at: p("politics", "VIII, 1342b"), names: "Philoxenus' dithyramb The Mysians", why: "Written for the Dorian mode, it fell back into the Phrygian. (Ellis leaves out the title.)", lost: "Lost." },
    ],
    from: [
      ab("2707", "Republic", "Plato", "The views on music he answers in Politics VIII."),
      ab("6423", "Laws", "Plato", "Plato's last word on music, written while Aristotle was his pupil."),
    ],
    later: [POETICS_IOT, POLITICS_IOT, TRAGEDY_IOT, iot("1ft00r2ap8dq9", "Aristotle's Nicomachean Ethics", "Four scholars on what the Ethics asks of you.")],
    articles: [
      { title: "Aristoxenus", note: "His pupil and the first music theorist whose work survives." },
      { title: "Catharsis", note: "The word he promised to explain in the Poetics." },
      { title: "Musical system of ancient Greece", note: "The modes he sorts by use." },
      { title: "Gregorian mode", note: "Why the church modes share Greek names but not Greek scales." },
      { title: "Theatre of ancient Greece", note: "The theatre the Poetics describes." },
    ],
    topics: ["greeks"],
  },
  {
    id: "marcus-aurelius", name: "Marcus Aurelius", wiki: "Marcus_Aurelius", ol: "OL133986A", born: "AD 121", died: "AD 180", place: "Rome and the Danube frontier",
    what: "Roman emperor and Stoic philosopher",
    about: "Emperor for nineteen years, much of them at war on the Danube, he kept a notebook in Greek of what he was trying to live by. It was never meant to be read; we call it the Meditations.",
    start: "meditations",
    works: ["meditations"],
    music: {
      stance: "rebuilt",
      note: "Marcus Aurelius says little about music, and that little is about resisting it. This section is rebuilt from his time and the court of the emperors before him.",
      words: [
        p("meditations", "XI, 2", "Thou wilt set little value on pleasing song and dancing and the pancratium, if thou wilt distribute the melody of the voice into its several sounds, and ask thyself as to each, if thou art mastered by this.", LONG),
      ],
      rules: [],
      time: [SUN, MUSE, NEMESIS, SEIKILOS],
      timeNote: "Rebuilt from his time: hymns by the court composer of Hadrian, the emperor who chose Marcus as a future emperor at sixteen, and a song carved on a grave in the Greek East.",
      people: [
        { name: "Mesomedes", wiki: "Mesomedes", note: "Hadrian's freed slave and court composer; three of his hymns survive with their notes." },
      ],
      ages: [],
    },
    theatre: {
      stance: "own",
      words: [
        p("meditations", "XI, 6", "At first tragedies were brought on the stage as means of reminding men of the things which happen to them, and that it is according to nature for things to happen so.", LONG),
      ],
      plays: ["oedipus"],
      people: [],
    },
    named: [
      { at: p("meditations", "XI, 6"), names: "Those who cry out \"O Cithaeron\"", why: "What we watch on the small stage teaches us to bear the larger one.", work: "oedipus" },
      { at: p("meditations", "XI, 6"), names: "\"Me and my children if the gods neglect, this has its reason too\"", why: "A line he keeps from the tragic poets (also at VII, 41).", lost: "From Euripides' Antiope, lost; known from quotations like this one." },
    ],
    from: [
      ab("518", "Enchiridion", "Epictetus", "The teacher whose discourses Rusticus lent him (Meditations I, 7)."),
      ab("4947", "Of the Shortness of Life", "Seneca", "The Stoic of Nero's court, a century before him."),
    ],
    later: [MARCUS_IOT, iot("1sgaxe81uzkg3n", "Stoicism", "The school from Zeno to Rome."), yt("lecture", "Auuk1y4DRgk", "Marcus Aurelius' Meditations: The Stoic Ideal", "Michael Sugrue", "What the Meditations teach.")],
    articles: [
      { title: "Mesomedes", note: "The court composer whose hymns survive." },
      { title: "Water organ", note: "The hydraulis, the organ of the Roman games." },
      { title: "Theatre of ancient Rome", note: "What the stage was in his day." },
    ],
    topics: ["romans", "stoics"],
  },
];

export const philosopherById = (id: string): Philosopher | undefined => PHILOSOPHERS.find((x) => x.id === id);

/** The philosopher page for a name, if there is one ("Plato", or "Marcus Aurelius"). */
export const philosopherNamed = (name: string): Philosopher | undefined => PHILOSOPHERS.find((x) => x.name.toLowerCase() === name.trim().toLowerCase());

/** The philosopher page for an Open Library author, if there is one. */
export const philosopherByOl = (ol: string): Philosopher | undefined => PHILOSOPHERS.find((x) => x.ol === ol);

export type Tab = "works" | "music" | "theatre" | "read" | "people";
export const TAB_LABEL: Record<Tab, string> = { works: "Works", music: "Music", theatre: "Theatre", read: "Read about", people: "People" };

/** The tabs in order: Music and Theatre come second for those who wrote about them, and after Read about otherwise. */
export function tabsOf(x: Philosopher): Tab[] {
  const own = (["music", "theatre"] as const).filter((t) => x[t].stance === "own");
  const rebuilt = (["music", "theatre"] as const).filter((t) => x[t].stance === "rebuilt");
  return ["works", ...own, "read", ...rebuilt, "people"];
}

/** A passage as a citation: "Republic III, 401d". */
export function cite(a: Passage): string {
  const w = workById(a.work);
  return `${w ? w.title : a.work} ${a.at}`;
}

/** Every passage that names a work, across philosophers, with who wrote it: for the work page's "Named by". */
export function namedIn(work: string): { by: Philosopher; n: Named }[] {
  return PHILOSOPHERS.flatMap((by) => by.named.filter((n) => n.work === work).map((n) => ({ by, n })));
}

/** Everyone a page shows as a face: the philosopher's contemporaries in music and theatre, each once. */
export function peopleOf(x: Philosopher): Contemporary[] {
  const seen = new Set<string>();
  return [...x.music.people, ...x.theatre.people].filter((c) => !seen.has(c.name) && seen.add(c.name));
}
