/**
 * The Renaissance (Torian, 2026-11-16, "People and eras"): the humanists who read the ancients again and wrote for
 * princes, Machiavelli's Florence, Montaigne's tower, and Elizabeth's England, where Shakespeare wrote for the stage.
 * Every work plays its LibriVox recording; the music is free recordings on Wikimedia Commons that Reflect plays itself,
 * each with who sang it and under what licence. Pure: no I/O.
 */
import { ab, commons, iot } from "./collections";
import type { TopicForm, TopicPage, Work } from "./topic-pages";

const W = (id: string, title: string, by: string, when: string, form: string, about: string, audiobooks: string[], versions: Work["versions"] = []): Work =>
  ({ id, title, by, when, topic: "renaissance", form, about, audiobooks, versions });

export const ERASMUS_IOT = iot("1n291g01rvsy4j", "Erasmus", "The scholar of Rotterdam, his books and his quarrels.");
export const UTOPIA_IOT = iot("1w971r51v2zta0", "Thomas More's Utopia", "The island with no money, and the man who wrote it.");
export const MACHIAVELLI_IOT = iot("bozpdmkmjkt1", "Machiavelli and the Italian City States", "The Florence he served and the Italy he wrote for.");
export const MONTAIGNE_IOT = iot("dtnqj2g0t3ml", "Montaigne", "The essays, and the man who tried himself out in them.");
export const HAMLET_IOT = iot("xasc6a1w6az7l", "Hamlet", "The play, its sources and its many texts.");
export const TEMPEST_IOT = iot("1eiasuop0d6aj", "The Tempest", "Shakespeare's island play, and what it borrowed.");
export const LEAR_IOT = iot("7oovzowwroin", "Lear", "The king who divides his kingdom.");
export const SONNETS_IOT = iot("uv0up01i5og1b", "Shakespeare's Sonnets", "The poems, printed in 1609, and whom they address.");
export const ROMANS_IOT = iot("mvb3jljayneo", "Is Shakespeare History? The Romans", "Julius Caesar, Antony and Cleopatra and Coriolanus against Plutarch.");

export const JOSQUIN_GRILLO = commons("f/f2", "Josquin El grillo sung by the dwsChorale.ogg", "El grillo", "Josquin des Prez; dwsChorale", "dwsChorale, CC BY-SA 3.0", "A frottola about a cricket that sings all night, by the most admired composer of Erasmus' youth.");
export const PALESTRINA_LILIUM = commons("9/90", "The Tudor Consort - 01 - Palestrina - Sicut lilium inter spinas.ogg", "Sicut lilium inter spinas", "Palestrina; The Tudor Consort", "The Tudor Consort, CC BY 3.0", "A motet from the Song of Songs by the choirmaster of St Peter's in Rome.");
export const PALESTRINA_MARCELLI = commons("0/04", "Missa Papae Marcelli - V. Agnus Dei I.flac", "Missa Papae Marcelli: Agnus Dei I", "Palestrina; European Archive", "European Archive, CC0", "From the mass printed in 1567, written so that many voices could sing together and keep the words clear.");
export const TALLIS_LAMENTATIONS = commons("0/03", "The Tudor Consort - 07 - Thomas Tallis - Lamentations I.ogg", "Lamentations of Jeremiah I", "Thomas Tallis; The Tudor Consort", "The Tudor Consort, CC BY 3.0", "Holy Week music by the organist of Elizabeth's Chapel Royal.");
export const TALLIS_IF_YE_LOVE_ME = commons("2/29", "Tallis - If ye love me.ogg", "If ye love me", "Thomas Tallis; Coro Santa Pazienza", "Coro Santa Pazienza, CC BY 3.0", "An anthem in English for the new English service, one syllable to a note so that every word is heard.");
export const BYRD_CIVITAS = commons("1/1d", "The Tudor Consort - 02 - William Byrd - Civitas Sancti Tui.ogg", "Civitas sancti tui", "William Byrd; The Tudor Consort", "The Tudor Consort, CC BY 3.0", "A Latin motet by the Catholic composer who kept his place in a Protestant queen's chapel.");
export const MORLEY_LOVER = commons("2/27", "Morley It was a lover and his lass performed by D W Solomons.ogg", "It was a lover and his lass", "Thomas Morley; D. W. Solomons", "D. W. Solomons, CC BY-SA 3.0", "Words from Shakespeare's As You Like It (V, 3), set by Morley in his First Book of Airs, 1600.");
export const GREENSLEEVES = commons("3/37", "Greensleeves. La Juglaresa.opus", "Greensleeves", "Traditional English; La Juglaresa", "Emilio Villalba, CC BY 3.0", "The ballad tune of Elizabeth's London, named twice in Shakespeare's Merry Wives of Windsor.");
export const DOWLAND_SHALL_I_SUE = commons("f/f6", "John Dowland -- Shall I sue.ogg", "Shall I sue", "John Dowland; Collegium Vocale", "Collegium Vocale, CC BY 3.0", "A lute song from Dowland's Second Book of Songs, 1600, by the lutenist of Shakespeare's London.");
export const DOWLAND_COME_AWAY = commons("b/b7", "John Dowland -- Come away, come sweet love.opus", "Come away, come sweet love", "John Dowland; Collegium Vocale", "Collegium Vocale, CC BY 3.0", "From his First Book of Songs, 1597, one of the best-selling music books of Elizabeth's reign.");
export const GIBBONS_OUT_OF_THE_DEEP = commons("b/b8", "Orlando Gibbons Out of the deep (The Tudor Consort).ogg", "Out of the deep", "Orlando Gibbons; The Tudor Consort", "The Tudor Consort, CC BY 2.5", "An English anthem by the organist of James I's Chapel Royal, the king of Shakespeare's last plays.");
export const MONTEVERDI_AUGELLIN = commons("c/c6", "The Tudor Consort - 05 - Claudio Monteverdi - Quel Augelin Che Canta.ogg", "Quel augellin che canta", "Claudio Monteverdi; The Tudor Consort", "The Tudor Consort, CC BY 3.0", "A madrigal from Monteverdi's Fourth Book, 1603, the year Elizabeth died.");

export const RENAISSANCE_WORKS: readonly Work[] = [
  W("praise-of-folly", "The Praise of Folly", "Desiderius Erasmus", "1511", "humanists", "Folly gives a speech in praise of herself, and of the kings, scholars and churchmen who serve her.", ["2628"], [{ group: "understand", item: ERASMUS_IOT }]),
  W("utopia", "Utopia", "Thomas More", "1516", "humanists", "A traveller tells of an island where no one owns anything, after an argument about whether a scholar should counsel kings.", ["993", "7995"], [{ group: "understand", item: UTOPIA_IOT }]),
  W("prince", "The Prince", "Niccolò Machiavelli", "1513", "politics", "How new princes take states and keep them, written after the Medici put him out of office; printed in 1532.", ["368", "5021"], [{ group: "understand", item: MACHIAVELLI_IOT }]),
  W("discourses-livy", "Discourses on Livy", "Niccolò Machiavelli", "about 1517", "politics", "On republics, read through the first ten books of Livy's history of Rome.", ["13444", "13680", "13835"]),
  W("art-of-war", "The Art of War", "Niccolò Machiavelli", "1521", "politics", "A dialogue on how a state should raise and train its own army, printed in Florence in 1521.", ["13129"]),
  W("history-of-florence", "Florentine Histories", "Niccolò Machiavelli", "1525", "politics", "The history of Florence to 1492, written for the Medici pope Clement VII.", ["2337", "2939"]),
  W("montaigne-essays", "Essays", "Michel de Montaigne", "1580 to 1588", "essays", "Short tries at every subject, from cannibals to thumbs, written in a tower library in the Périgord: the book that named the form.", ["5147", "6844", "7129", "18859"], [{ group: "understand", item: MONTAIGNE_IOT }]),
  W("titus-andronicus", "Titus Andronicus", "William Shakespeare", "about 1592", "plays", "A Roman general's revenge, his first tragedy.", ["4825", "20372"]),
  W("romeo-juliet", "Romeo and Juliet", "William Shakespeare", "about 1595", "plays", "Two young lovers from feuding houses in Verona.", ["243", "2026", "669"]),
  W("midsummer", "A Midsummer Night's Dream", "William Shakespeare", "about 1595", "plays", "Lovers, workmen and fairies in a wood outside Athens.", ["2057", "6020"]),
  W("julius-caesar", "Julius Caesar", "William Shakespeare", "1599", "plays", "The murder of Caesar and what came of it, taken from North's Plutarch.", ["3620", "10777"], [{ group: "understand", item: ROMANS_IOT }]),
  W("twelfth-night", "Twelfth Night", "William Shakespeare", "about 1601", "plays", "Shipwrecked twins in Illyria, and a play full of songs.", ["347", "6758"]),
  W("hamlet", "Hamlet", "William Shakespeare", "about 1600", "plays", "A prince of Denmark told by his father's ghost to avenge his murder.", ["346", "6828", "6718"], [{ group: "understand", item: HAMLET_IOT }]),
  W("king-lear", "King Lear", "William Shakespeare", "about 1606", "plays", "An old king divides his kingdom among his daughters.", ["758", "6430"], [{ group: "understand", item: LEAR_IOT }]),
  W("macbeth", "Macbeth", "William Shakespeare", "about 1606", "plays", "A Scottish lord told by witches that he will be king.", ["2333", "7488"]),
  W("antony-cleopatra", "Antony and Cleopatra", "William Shakespeare", "about 1607", "plays", "Antony between Rome and Egypt, from North's Plutarch.", ["4950"], [{ group: "understand", item: ROMANS_IOT }]),
  W("tempest", "The Tempest", "William Shakespeare", "about 1611", "plays", "A magician on an island raises a storm to bring his enemies to him.", ["2244", "13566"], [{ group: "understand", item: TEMPEST_IOT }]),
  W("shakespeare-sonnets", "Sonnets", "William Shakespeare", "1609", "poetry", "A hundred and fifty-four sonnets, to a young man and a dark lady.", ["229", "1121"], [{ group: "understand", item: SONNETS_IOT }]),
];

export const RENAISSANCE_TOPIC: TopicPage | null = {
  id: "renaissance", name: "The Renaissance", start: "renaissance",
  about: "The 15th and 16th centuries: the humanists who read Greek and Latin books again, Erasmus and More, Machiavelli's Florence, Montaigne's essays, and Elizabeth's England, where Shakespeare wrote and Tallis and Byrd sang.",
  forms: [
    { id: "humanists", label: "Humanists", where: "The Low Countries and England, early 16th century", works: ["praise-of-folly", "utopia"], items: [ab("20474", "Enchiridion Militis Christiani", "Desiderius Erasmus", "Erasmus' handbook of the Christian life, 1503.")] },
    { id: "politics", label: "Politics and history", where: "Florence, 1513 to 1525", works: ["prince", "discourses-livy", "art-of-war", "history-of-florence"] },
    { id: "essays", label: "Essays", where: "The Périgord, 1570 to 1592", works: ["montaigne-essays"] },
    { id: "plays", label: "Plays", where: "London, 1590 to 1613", works: ["titus-andronicus", "romeo-juliet", "midsummer", "julius-caesar", "hamlet", "twelfth-night", "king-lear", "macbeth", "antony-cleopatra", "tempest"], items: [
      ab("4560", "Doctor Faustus", "Christopher Marlowe", "Marlowe's play of a scholar who sells his soul, staged in London in Shakespeare's first years there."),
      ab("8664", "Volpone", "Ben Jonson", "Jonson's comedy of a Venetian miser, played by the King's Men in 1606."),
    ] },
    { id: "poetry", label: "Poetry", where: "England, 1590 to 1609", works: ["shakespeare-sonnets"], items: [ab("310", "The Faerie Queene, Book 1", "Edmund Spenser", "Spenser's epic, dedicated to Elizabeth I in 1590.")] },
    { id: "lives", label: "Lives", items: [
      ab("2626", "Queen Elizabeth", "Jacob Abbott", "Her life, told for young readers in 1849."),
      ab("15658", "Erasmus and the Age of Reformation", "Johan Huizinga", "A historian's life of Erasmus, 1924."),
      ab("2769", "Autobiography of Benvenuto Cellini, Vol. 1", "Benvenuto Cellini", "A Florentine goldsmith's own story, begun in 1558."),
      ab("3175", "Lives of the Most Eminent Painters, Vol. 1", "Giorgio Vasari", "The lives of Italy's artists, by a painter who knew many of them, 1550."),
    ] },
    { id: "music", label: "Music", where: "Italy, the Low Countries and England, 1500 to 1610", items: [
      JOSQUIN_GRILLO, PALESTRINA_LILIUM, PALESTRINA_MARCELLI, TALLIS_LAMENTATIONS, TALLIS_IF_YE_LOVE_ME, BYRD_CIVITAS,
      GREENSLEEVES, MORLEY_LOVER, DOWLAND_COME_AWAY, DOWLAND_SHALL_I_SUE, MONTEVERDI_AUGELLIN, GIBBONS_OUT_OF_THE_DEEP,
    ] },
    { id: "podcasts", label: "Podcasts", items: [
      iot("dujj7y6gpfd5", "The Renaissance", "What the word means, and when it began."),
      iot("1gc8wrx1j7s24g", "Humanism", "The scholars who went back to the ancient texts."),
      ERASMUS_IOT, UTOPIA_IOT, MACHIAVELLI_IOT, MONTAIGNE_IOT,
      iot("1qdlu9k195g337", "Shakespeare's Life", "What the records say."),
      iot("ox0hda11z9kb1", "The Death of Elizabeth I", "The end of her reign and the succession of James."),
    ] },
  ],
  people: [
    { name: "Erasmus", wiki: "Erasmus", ol: "OL53336A" },
    { name: "Thomas More", wiki: "Thomas_More", ol: "OL112972A" },
    { name: "Niccolò Machiavelli", wiki: "Niccolò_Machiavelli", ol: "OL23135A" },
    { name: "Michel de Montaigne", wiki: "Michel_de_Montaigne", ol: "OL112816A" },
    { name: "Elizabeth I", wiki: "Elizabeth_I", ol: "OL159849A" },
    { name: "William Shakespeare", wiki: "William_Shakespeare", ol: "OL9388A" },
    { name: "Ben Jonson", wiki: "Ben_Jonson", ol: "OL112771A" },
    { name: "Edmund Spenser", wiki: "Edmund_Spenser" },
    { name: "Thomas Tallis", wiki: "Thomas_Tallis" },
    { name: "William Byrd", wiki: "William_Byrd" },
  ],
};

/** Forms added to an existing topic page; the Renaissance has its own page, so none. */
export const RENAISSANCE_FORMS: readonly TopicForm[] = [];
