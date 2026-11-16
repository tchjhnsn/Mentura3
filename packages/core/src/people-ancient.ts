/**
 * Greece and Rome (Torian, 2026-11-16 03:19Z "go" on "Philosophers and music"; widened to people at 04:02Z). Plato and
 * Aristotle wrote about music and plays, so those sections start in their own words, cited by the standard numbering
 * (Stephanus pages for Plato, Bekker pages for Aristotle, book and section for the Meditations). Where a person said
 * little or nothing, the section is rebuilt from their time and court and says so. Music chosen across the ages "in
 * the spirit of" a person is chosen by Reflect's editors, each piece with why, and never shown as their own choice.
 *
 * Quotations are from translations in the public domain: Jowett's Plato (1871), Ellis's Politics (1776), Butcher's
 * Poetics (1895), Long's Marcus Aurelius (1862), and the Langhornes' Plutarch (1770) for lives. The Greek modes are
 * not the church modes that later took their names; the page links an article on why. Pure: no I/O.
 */
import { ab, commons, iot, yt, type CollectionItem } from "./collections";
import { p, type Person } from "./historical";

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
export const SEIKILOS = commons("b/b6", "Ο Επιτάφιος του Σεῖκιλου - Epitaph of Seikilos.ogg", "Seikilos Epitaph", "Greek song carved on a grave in Asia Minor, about the 1st century AD; sung by Marcus Harvey", "Marcus Harvey, CC BY-SA 2.5", "The oldest complete song with its tune: \"While you live, shine.\"");

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
const DRYDEN = "Dryden and Clough";

const PLATO_REPUBLIC_IOT = iot("xhe4mmwzwi0p", "Plato's Republic", "Scholars on the city in words.");
const SYMPOSIUM_IOT = iot("1jr6q6dn2whpg", "Plato's Symposium", "The drinking party, its speakers and its poets.");
const MATHS_MUSIC_IOT = iot("7txoa7vgfr", "Mathematics and Music", "Pythagoras' ratios and the scales built on them.");
const SPHERES_IOT = iot("15byn5amko4yd", "The Music of the Spheres", "The idea in Plato's Timaeus that the heavens are tuned.");
const COMEDY_IOT = iot("2ctycpbil9ts", "Comedy in Ancient Greek Theatre", "Aristophanes and the comedy Plato knew.");
const TRAGEDY_IOT = iot("1ib6iu9ixnzdg", "Tragedy", "What tragedy is, from Athens on.");
const POETICS_IOT = iot("1fz6jno1uhchrz", "Aristotle's Poetics", "What the Poetics says about plays, and why it lasted.");
const POLITICS_IOT = iot("13l26u21glddl9", "Aristotle's Politics", "The book whose last part is on music.");
const MARCUS_IOT = iot("1tyinop5kt3m0", "Marcus Aurelius", "Scholars on the man behind the notebook.");

export const ANCIENT: readonly Person[] = [
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
    era: "ancient",
    relations: [
      { name: "Socrates", wiki: "Socrates", rel: "teacher", note: "Plato was at his trial and offered to pay his fine (Apology 38b); nearly every dialogue gives him the lead." },
      { name: "Aristotle", wiki: "Aristotle", ol: "OL22105A", rel: "student", note: "Studied at the Academy for twenty years, until Plato died." },
      { name: "Dion of Syracuse", wiki: "Dion_of_Syracuse", rel: "friend", note: "His pupil and friend in Sicily, for whom he tried to make a philosopher of a tyrant (Seventh Letter)." },
      { name: "Archytas", wiki: "Archytas", rel: "friend", note: "The Pythagorean of Tarentum who sent a ship to bring him home from Syracuse (Seventh Letter)." },
      { name: "Dionysius II of Syracuse", wiki: "Dionysius_the_Younger", rel: "ruler", note: "The young tyrant he twice went to teach, in 367 and 361 BC, and who held him almost as a prisoner (Seventh Letter)." },
      { name: "Xenophon", wiki: "Xenophon", rel: "contemporary", note: "Another pupil of Socrates, who wrote his own Apology and Symposium." },
    ],
    read: [
      { title: "Iliad and Odyssey", by: "Homer", work: "iliad", at: p("republic", "X, 595b", "Although I have always from my earliest youth had an awe and love of Homer, which even now makes the words falter on my lips, for he is the great captain and teacher of the whole of that charming tragic company.", "Jowett"), note: "The poet he quotes more than any other, and argues with most." },
      { title: "Theogony", by: "Hesiod", work: "theogony", at: p("republic", "II, 377e"), note: "He names its story of Uranus and Cronus as the first lie children should not hear." },
      { title: "The Clouds", by: "Aristophanes", work: "clouds", at: p("apology", "19c"), note: "Socrates names it at his trial; Plato puts its author at the Symposium." },
      { title: "On Nature", by: "Heraclitus", at: p("Cratylus", "402a", "Heracleitus is supposed to say that all things are in motion and nothing at rest; he compares them to the stream of a river, and says that you cannot go into the same water twice.", "Jowett"), note: "Lost but for fragments; Aristotle says Plato learned Heraclitus' views young, from Cratylus (Metaphysics I, 987a)." },
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
    era: "ancient",
    relations: [
      { name: "Plato", wiki: "Plato", ol: "OL12823A", rel: "teacher", note: "Twenty years in the Academy, from about 367 BC to Plato's death." },
      { name: "Alexander the Great", wiki: "Alexander_the_Great", rel: "student", note: "Taught him at Mieza from 343 BC, when Alexander was thirteen (Plutarch, Alexander 7)." },
      { name: "Theophrastus", wiki: "Theophrastus", rel: "student", note: "His pupil and successor as head of the Lyceum, to whom he left his books." },
      { name: "Hermias of Atarneus", wiki: "Hermias_of_Atarneus", rel: "friend", note: "The ruler in Asia Minor who took him in after Plato died; Aristotle married his niece Pythias and wrote a hymn for him." },
      { name: "Philip II of Macedon", wiki: "Philip_II_of_Macedon", rel: "patron", note: "Sent for him to teach his son, and rebuilt his home town Stagira as his fee (Plutarch, Alexander 7)." },
    ],
    read: [
      { title: "Republic", by: "Plato", work: "republic", at: p("politics", "II, 1261a"), note: "He takes apart Socrates' proposal that the guardians hold wives and property in common." },
      { title: "Laws", by: "Plato", work: "laws", at: p("politics", "II, 1265a"), note: "He goes through the Laws after the Republic, point by point." },
      { title: "Iliad and Odyssey", by: "Homer", work: "odyssey", at: p("poetics", "8, 1451a", "In composing the Odyssey he did not include all the adventures of Odysseus.", "Butcher"), note: "Homer is the Poetics' model of a single action, well made." },
      { title: "Histories", by: "Herodotus", work: "herodotus", at: p("poetics", "9, 1451b", "The work of Herodotus might be put into verse, and it would still be a species of history.", "Butcher"), note: "His example of why poetry is more philosophical than history." },
      { title: "Oedipus the King", by: "Sophocles", work: "oedipus", at: p("poetics", "11, 1452a"), note: "The play he cites most often." },
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
    era: "ancient",
    relations: [
      { name: "Junius Rusticus", wiki: "Junius_Rusticus", rel: "teacher", note: "The Stoic who turned him to philosophy and lent him Epictetus (Meditations I, 7)." },
      { name: "Fronto", wiki: "Marcus_Cornelius_Fronto", rel: "teacher", note: "His teacher in rhetoric; their letters survive (Meditations I, 11)." },
      { name: "Sextus of Chaeronea", wiki: "Sextus_of_Chaeronea", rel: "teacher", note: "Plutarch's nephew, a Stoic whose lectures he kept going to as emperor (Meditations I, 9)." },
      { name: "Antoninus Pius", wiki: "Antoninus_Pius", rel: "family", note: "The emperor who adopted him in 138 and whom he praises longest (Meditations I, 16)." },
      { name: "Faustina the Younger", wiki: "Faustina_the_Younger", rel: "family", note: "His wife, \"so obedient, and so affectionate\" (Meditations I, 17)." },
      { name: "Lucius Verus", wiki: "Lucius_Verus", rel: "family", note: "His adoptive brother and co-emperor from 161 to 169 (Meditations I, 17)." },
      { name: "Commodus", wiki: "Commodus", rel: "family", note: "His son, who ruled after him." },
      { name: "Hadrian", wiki: "Hadrian", rel: "ruler", note: "Chose him as a future emperor at sixteen, by making Antoninus adopt him." },
      { name: "Galen", wiki: "Galen", rel: "served", note: "The physician he called to Rome and kept near his son." },
    ],
    read: [
      { title: "Discourses", by: "Epictetus", item: ab("16717", "Discourses", "Epictetus", "A freed slave's lessons, taken down by a pupil."), at: p("meditations", "I, 7", "I am indebted to him for being acquainted with the discourses of Epictetus, which he communicated to me out of his own collection.", "Long"), note: "Rusticus lent him the book; he quotes Epictetus by name across the Meditations." },
      { title: "On Nature", by: "Heraclitus", at: p("meditations", "IV, 46", "Always remember the saying of Heraclitus.", "Long"), note: "Known to him in fragments, as to us." },
      { title: "Republic", by: "Plato", work: "republic", at: p("meditations", "VII, 35"), note: "He copies out Plato's question whether a mind that surveys all time can think a human life anything great (Republic VI, 486a)." },
    ],
    topics: ["romans", "stoics"],
  },
  {
    id: "socrates", name: "Socrates", wiki: "Socrates", born: "about 470 BC", died: "399 BC", place: "Athens",
    what: "Philosopher of Athens, who wrote nothing",
    about: "He spent his life in the streets and gymnasia of Athens, questioning people about justice, courage and how to live. In 399 BC a jury condemned him to death for impiety and corrupting the young, and he drank the hemlock in prison. He wrote nothing; we know him from his students Plato and Xenophon, and from Aristophanes, who mocked him on stage.",
    era: "ancient",
    topics: ["greeks"],
    start: "apology",
    works: [],
    aboutWorks: ["apology", "phaedo", "euthyphro", "symposium", "memorabilia", "clouds"],
    relations: [
      { name: "Diotima of Mantinea", wiki: "Diotima_of_Mantinea", rel: "teacher", note: "The woman of Mantinea who, as Plato tells it, taught him about love (Symposium 201d)." },
      { name: "Plato", wiki: "Plato", ol: "OL12823A", rel: "student", note: "Present at his trial, where Socrates names him among the friends offering to pay a fine (Apology 38b)." },
      { name: "Xenophon", wiki: "Xenophon", rel: "student", note: "Wrote the Memorabilia, an Apology and a Symposium in his memory." },
      { name: "Xanthippe", wiki: "Xanthippe", rel: "family", note: "His wife, with him in prison on his last morning, holding their child (Phaedo 60a)." },
      { name: "Crito", wiki: "Crito_of_Alopece", rel: "friend", note: "His friend of the same age and deme (Apology 33d-e), who came to the prison to urge him to escape (Crito)." },
      { name: "Alcibiades", wiki: "Alcibiades", rel: "friend", note: "In the Symposium he tells how Socrates saved his life in battle at Potidaea (220d-e)." },
      { name: "Aristophanes", wiki: "Aristophanes", ol: "OL24462A", rel: "contemporary", note: "Put him on stage in the Clouds in 423 BC; Plato seats them at the same party in the Symposium." },
      { name: "Meletus", wiki: "Meletus", rel: "contemporary", note: "Brought the charge against him in 399 BC (Apology 24b)." },
      { name: "Anytus", wiki: "Anytus", rel: "contemporary", note: "A democratic politician, one of his three accusers with Meletus and Lycon (Apology 23e)." },
    ],
    read: [
      { title: "On Nature", by: "Anaxagoras", at: p("phaedo", "97b-98b", "Then I heard some one reading, as he said, from a book of Anaxagoras, that mind was the disposer and cause of all.", JOWETT), note: "He tells how he got the books and read them as fast as he could (98b)." },
      { title: "Iliad", by: "Homer", work: "iliad", at: p("apology", "28c-d"), note: "He reminds the jury how Achilles chose death rather than disgrace." },
      { title: "Works and Days", by: "Hesiod", work: "theogony", at: p("memorabilia", "I, 3, 3", "He was ever an admirer of that line of Hesiod which says, According to thine ability do sacrifice to the immortal gods.", "Dakyns"), note: "Xenophon remembers the lines of Hesiod he quoted." },
      { title: "On Heracles", by: "Prodicus", at: p("memorabilia", "II, 1, 21", "And that wise man Prodicus delivers himself in a like strain concerning virtue in that composition of his about Heracles, which crowds have listened to.", "Dakyns"), note: "He retells Prodicus' story of the choice of Heracles to Aristippus. Lost but for this retelling." },
    ],
    from: [
      ab("422", "History of the Peloponnesian War", "Thucydides", "The war Socrates fought in, at Potidaea and Delium, told by an Athenian of his time."),
    ],
    later: [
      iot("1h3h9kpcqjqsw", "Socrates", "Scholars on the man who wrote nothing."),
      iot("14qr1rch1j87v", "Socrates in Prison", "Scholars on his last days."),
    ],
    articles: [
      { title: "Trial of Socrates", note: "The charges, the jury and the sentence, 399 BC." },
      { title: "Socratic problem", note: "Why the Socrates of Plato, Xenophon and Aristophanes differ." },
      { title: "Socratic method", note: "Questioning to test what someone claims to know." },
    ],
  },
  {
    id: "alexander-the-great", name: "Alexander the Great", wiki: "Alexander_the_Great", born: "356 BC", died: "323 BC", place: "Pella and Babylon",
    what: "King of Macedon, pupil of Aristotle, conqueror of the Persian Empire",
    about: "He became king of Macedon at twenty, when his father Philip was murdered. In eleven years he conquered the Persian Empire, from Egypt to the Indus, and founded cities named after him, Alexandria in Egypt among them. He died at Babylon at thirty-two. He wrote nothing; we know him from histories written centuries later, chiefly by Arrian and Plutarch.",
    era: "ancient",
    topics: ["greeks"],
    start: ab("14332", "Parallel Lives, Vol. 7", "Plutarch", "Plutarch's lives of Alexander, Caesar, Demosthenes and Cicero, in Perrin's translation."),
    works: [],
    aboutThem: [
      ab("14332", "Parallel Lives, Vol. 7", "Plutarch", "His life by Plutarch, set beside Caesar's."),
      ab("1179", "Alexander the Great", "Jacob Abbott", "A life by Jacob Abbott, written for young readers."),
    ],
    relations: [
      { name: "Aristotle", wiki: "Aristotle", ol: "OL22105A", rel: "teacher", note: "Taught him at Mieza from 343 BC (Plutarch, Alexander 7)." },
      { name: "Philip II of Macedon", wiki: "Philip_II_of_Macedon", rel: "family", note: "His father, king of Macedon, murdered in 336 BC." },
      { name: "Olympias", wiki: "Olympias", rel: "family", note: "His mother, a princess of Epirus (Plutarch, Alexander 2)." },
      { name: "Roxana", wiki: "Roxana", rel: "family", note: "A Bactrian noblewoman he married in 327 BC; mother of his son Alexander IV." },
      { name: "Hephaestion", wiki: "Hephaestion", rel: "friend", note: "His closest friend, whose death at Ecbatana in 324 BC he mourned beyond measure (Plutarch, Alexander 72)." },
      { name: "Darius III", wiki: "Darius_III", rel: "ruler", note: "The last Persian king of the Achaemenid line, beaten by him at Issus in 333 BC and at Gaugamela in 331 BC." },
      { name: "Ptolemy I Soter", wiki: "Ptolemy_I_Soter", rel: "served", note: "One of his generals, who took Egypt after his death and wrote a history of his campaigns." },
      { name: "Diogenes", wiki: "Diogenes", rel: "contemporary", note: "Met him at Corinth, and asked him only to stand out of his sun (Plutarch, Alexander 14)." },
    ],
    read: [
      { title: "Iliad", by: "Homer", work: "iliad", at: p("Plutarch, Alexander", "8", "He constantly laid Homer's Iliads, according to the copy corrected by Aristotle, called the casket copy, with his dagger under his pillow.", DRYDEN), note: "Plutarch has this from Onesicritus, who marched with him." },
      { title: "History of Sicily", by: "Philistus", at: p("Plutarch, Alexander", "8", "When he was in the upper Asia, being destitute of other books, he ordered Harpalus to send him some; who furnished him with Philistus's History.", DRYDEN), note: "Lost but for fragments." },
      { title: "Plays", by: "Euripides, Sophocles and Aeschylus", at: p("Plutarch, Alexander", "8"), note: "Harpalus sent him a great many of their plays, with dithyrambs by Telestes and Philoxenus." },
    ],
    from: [],
    later: [
      iot("12raa1917ndyos", "Alexander the Great", "Scholars on the king and the sources for him."),
      iot("cao9871pu5zry", "Demosthenes' Philippics", "The Athenian speeches against his father Philip."),
    ],
    articles: [
      { title: "Battle of Issus", note: "His first defeat of Darius, 333 BC." },
      { title: "Battle of Gaugamela", note: "The battle that won him the Persian Empire, 331 BC." },
      { title: "Hellenistic period", note: "The Greek world his successors ruled." },
      { title: "Alexander Romance", note: "The legends of him told for a thousand years after." },
    ],
  },
  {
    id: "julius-caesar", name: "Julius Caesar", wiki: "Julius_Caesar", ol: "OL7178325A", born: "100 BC", died: "44 BC", place: "Rome and Gaul",
    what: "Roman general, consul and dictator",
    about: "He rose through Roman politics in alliance with Pompey and Crassus, conquered Gaul between 58 and 50 BC, and crossed the Rubicon into civil war in 49 BC. He ruled Rome as dictator until senators stabbed him on 15 March 44 BC. He wrote his own accounts of his wars in Gaul and against Pompey.",
    era: "ancient",
    topics: ["romans"],
    start: ab("4732", "Commentaries on the Gallic War", "Julius Caesar", "His own account of eight years of war in Gaul."),
    works: [],
    by: [
      ab("4732", "Commentaries on the Gallic War", "Julius Caesar", "A general's own account of his war, written in the third person."),
    ],
    aboutThem: [
      ab("14332", "Parallel Lives, Vol. 7", "Plutarch", "His life by Plutarch, set beside Alexander's."),
      ab("2376", "Lives of the Twelve Caesars", "Suetonius", "The first of the twelve lives is his."),
      ab("3620", "Julius Caesar", "William Shakespeare", "Shakespeare's play of the conspiracy and its end, from Plutarch."),
      ab("5156", "History of Julius Caesar", "Jacob Abbott", "A life by Jacob Abbott, written for young readers."),
    ],
    relations: [
      { name: "Julia", wiki: "Julia_(daughter_of_Caesar)", rel: "family", note: "His daughter, married to Pompey in 59 BC; she died in 54 BC." },
      { name: "Calpurnia", wiki: "Calpurnia_(wife_of_Caesar)", rel: "family", note: "His wife from 59 BC to his death." },
      { name: "Augustus", wiki: "Augustus", rel: "family", note: "His great-nephew Octavian, adopted as his son in his will (Suetonius, Julius 83)." },
      { name: "Caesarion", wiki: "Caesarion", rel: "family", note: "Cleopatra's son, whom she named as Caesar's (Suetonius, Julius 52)." },
      { name: "Pompey", wiki: "Pompey", rel: "contemporary", note: "His ally with Crassus from 60 BC and his son-in-law; beaten by him at Pharsalus in 48 BC." },
      { name: "Marcus Licinius Crassus", wiki: "Marcus_Licinius_Crassus", rel: "contemporary", note: "The third man of the alliance with Pompey; killed at Carrhae in 53 BC." },
      { name: "Cicero", wiki: "Cicero", ol: "OL28743A", rel: "contemporary", note: "Sided with Pompey in the civil war; Caesar pardoned him in 47 BC (Plutarch, Cicero 39)." },
      { name: "Cleopatra", wiki: "Cleopatra", rel: "ruler", note: "The queen of Egypt he backed in the Alexandrian war of 48 to 47 BC." },
      { name: "Vercingetorix", wiki: "Vercingetorix", rel: "contemporary", note: "The Gallic leader he besieged at Alesia in 52 BC (Gallic War VII)." },
      { name: "Mark Antony", wiki: "Mark_Antony", rel: "served", note: "His officer in Gaul and the civil war, and his fellow consul in 44 BC." },
      { name: "Marcus Junius Brutus", wiki: "Marcus_Junius_Brutus", rel: "contemporary", note: "Pardoned after Pharsalus, he was among the leaders of the senators who killed him." },
    ],
    read: [
      { title: "A history of Alexander", by: "Not named by Plutarch", at: p("Plutarch, Caesar", "11", "After reading some part of the history of Alexander, he sat a great while very thoughtful, and at last burst out into tears.", DRYDEN), note: "Alexander at his age, he said, had conquered so many nations, and he had done nothing memorable." },
      { title: "Cato", by: "Cicero", at: p("Plutarch, Caesar", "3", "He himself, in his answer to Cicero's panegyric on Cato, desires his reader not to compare the plain discourse of a soldier with the harangues of an orator.", DRYDEN), note: "He answered Cicero's praise of Cato with his Anticato. Both are lost." },
    ],
    from: [
      ab("3335", "Catiline Conspiracy and the Jugurthine War", "Sallust", "By one of his officers: holds Caesar's speech to the Senate in 63 BC, and Cato's reply."),
      ab("1728", "Philippics", "Cicero", "Cicero's speeches against Antony in the year after Caesar's death."),
    ],
    later: [
      iot("iehm4k161g71r", "Julius Caesar", "Scholars on his career and death."),
      iot("1sidfjy1r3l4i5", "The Roman Republic", "The Republic his career ended."),
      iot("1n6j30ux533y9", "Cleopatra", "The queen of Egypt he backed."),
    ],
    articles: [
      { title: "Gallic Wars", note: "His conquest of Gaul, 58 to 50 BC." },
      { title: "First Triumvirate", note: "His alliance with Pompey and Crassus." },
      { title: "Crossing the Rubicon", note: "The start of the civil war, January 49 BC." },
      { title: "Assassination of Julius Caesar", note: "The Ides of March, 44 BC." },
    ],
  },
  {
    id: "cicero", name: "Cicero", wiki: "Cicero", ol: "OL28743A", born: "106 BC", died: "43 BC", place: "Arpinum and Rome",
    what: "Roman orator, consul and philosopher",
    about: "The leading orator of Rome, consul in 63 BC, when he put down Catiline's conspiracy. Shut out of power under Caesar, he wrote philosophy in Latin; after Caesar's death he attacked Mark Antony in the Philippics, and Antony had him killed in 43 BC. Hundreds of his letters survive.",
    era: "ancient",
    topics: ["romans"],
    start: ab("9450", "On Duties", "Cicero", "His last book on how to live, written to his son."),
    works: [],
    by: [
      ab("9450", "On Duties", "Cicero", "Written to his son in 44 BC: what is right, what is useful, and when they seem to clash."),
      ab("6872", "On the Laws", "Cicero", "A conversation with his brother and Atticus on law and the best laws for a commonwealth."),
      ab("7035", "On the Nature of the Gods", "Cicero", "An Epicurean, a Stoic and an Academic argue about the gods."),
      ab("9737", "Tusculan Disputations", "Cicero", "On death, pain and grief, written after his daughter died."),
      ab("1728", "Philippics", "Cicero", "The speeches against Mark Antony that cost him his life."),
    ],
    aboutThem: [
      ab("14332", "Parallel Lives, Vol. 7", "Plutarch", "His life by Plutarch, set beside Demosthenes'."),
      ab("2066", "Life of Cicero, Vol. I", "Anthony Trollope", "The novelist's life of him, 1880."),
      ab("2560", "Life of Cicero, Vol. II", "Anthony Trollope", "The second volume."),
    ],
    relations: [
      { name: "Philo of Larissa", wiki: "Philo_of_Larissa", rel: "teacher", note: "The head of the Academy, whom he heard in Rome as a young man (Plutarch, Cicero 3)." },
      { name: "Posidonius", wiki: "Posidonius", rel: "teacher", note: "The Stoic he studied philosophy with at Rhodes (Plutarch, Cicero 4)." },
      { name: "Terentia", wiki: "Terentia", rel: "family", note: "His wife for over thirty years; they divorced in 46 BC." },
      { name: "Tullia", wiki: "Tullia_(daughter_of_Cicero)", rel: "family", note: "His daughter, whose death in 45 BC he wrote a Consolation for, now lost." },
      { name: "Marcus Tullius Cicero Minor", wiki: "Cicero_Minor", rel: "family", note: "His son, a student in Athens, to whom On Duties is addressed (On Duties I, 1)." },
      { name: "Atticus", wiki: "Titus_Pomponius_Atticus", rel: "friend", note: "His closest friend; sixteen books of Cicero's letters to him survive." },
      { name: "Tiro", wiki: "Marcus_Tullius_Tiro", rel: "served", note: "His slave and secretary, later freed, who kept and published his letters." },
      { name: "Julius Caesar", wiki: "Julius_Caesar", ol: "OL7178325A", rel: "ruler", note: "Pardoned him after Pharsalus in 47 BC (Plutarch, Cicero 39)." },
      { name: "Pompey", wiki: "Pompey", rel: "contemporary", note: "Cicero joined him in the civil war against Caesar in 49 BC." },
      { name: "Mark Antony", wiki: "Mark_Antony", rel: "contemporary", note: "The target of the Philippics; he had Cicero put on the proscription list and killed in December 43 BC (Plutarch, Cicero 46 to 48)." },
      { name: "Augustus", wiki: "Augustus", rel: "contemporary", note: "Cicero backed the young Octavian against Antony; Octavian then agreed to his proscription (Plutarch, Cicero 46)." },
    ],
    read: [
      { title: "On Duties", by: "Panaetius", at: p("On Duties", "III, 7", "Panaetius, then, has given us what is unquestionably the most thorough discussion of moral duties that we have, and I have followed him in the main.", "Miller"), note: "The Stoic's book, now lost, that his own On Duties follows." },
      { title: "Laws", by: "Plato", work: "laws", at: p("On the Laws", "I, 15"), note: "Atticus says Cicero is doing as Plato did, writing on laws after writing on the commonwealth." },
      { title: "Meno", by: "Plato", work: "meno", at: p("Tusculan Disputations", "I, 24", "In that book which is inscribed Menon, Socrates asks a child some questions in geometry, with reference to measuring a square.", "Yonge"), note: "He uses it to argue that the soul remembers." },
    ],
    from: [
      ab("3335", "Catiline Conspiracy and the Jugurthine War", "Sallust", "The conspiracy of his consulship, told by a contemporary."),
    ],
    later: [
      iot("1uswkh81qkvd9z", "Cicero", "Scholars on the orator and his letters."),
      iot("1sidfjy1r3l4i5", "The Roman Republic", "The Republic he tried to save."),
      ab("22223", "Cicero and the Fall of the Roman Republic", "James Strachan-Davidson", "His life and the end of the Republic, in one book."),
    ],
    articles: [
      { title: "Catilinarian orations", note: "His speeches against Catiline in 63 BC." },
      { title: "Philippicae", note: "His speeches against Mark Antony, 44 and 43 BC." },
      { title: "De Officiis", note: "On Duties, his last philosophical work." },
      { title: "Panaetius", note: "The Stoic On Duties follows." },
    ],
  },
];

