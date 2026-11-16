/**
 * The Renaissance (Torian, 2026-11-16, "People and eras"): four writers who read the ancients again, a playwright,
 * and the queen whose court they wrote for. Elizabeth I is here because writers dealt with her and because she wrote
 * and translated; other rulers appear only beside the people who served or met them.
 *
 * Quotations are from translations in the public domain: Burnet's Utopia (1684), Wilson's Praise of Folly (1668),
 * Thomson's Discourses (1883), Marriott's Prince (1908) and Cotton's Montaigne (1685; Florio's of 1603 is not in
 * Project Gutenberg, so it could not be checked). Shakespeare and Ascham wrote in English and are quoted as printed
 * in Project Gutenberg's texts. Only Shakespeare has a Music section, because his plays speak of music and were sung
 * to settings made for them; the others show the topic's music as their time. Pure: no I/O.
 */
import { ab, iot } from "./collections";
import { en, p, type Person } from "./historical";
import {
  ERASMUS_IOT, GREENSLEEVES, HAMLET_IOT, LEAR_IOT, MACHIAVELLI_IOT, MONTAIGNE_IOT, MORLEY_LOVER, ROMANS_IOT, SONNETS_IOT, TEMPEST_IOT, UTOPIA_IOT,
} from "./topic-renaissance";

const BURNET = "Burnet";
const WILSON = "Wilson";
const THOMSON = "Thomson";
const MARRIOTT = "Marriott";
const COTTON = "Cotton";

const HUMANISM_IOT = iot("1gc8wrx1j7s24g", "Humanism", "The scholars who went back to the ancient texts.");
const TUDOR_STATE_IOT = iot("feg1wl47oiw0", "The Tudor State", "How Henry VIII's and Elizabeth's England was governed.");

export const RENAISSANCE: readonly Person[] = [
  {
    id: "erasmus", name: "Erasmus", wiki: "Erasmus", ol: "OL53336A", born: "about 1466", died: "1536", place: "Rotterdam, Paris, England and Basel",
    what: "Humanist scholar, editor of the Greek New Testament",
    about: "A priest from Rotterdam who lived by his pen across Europe. He edited the New Testament in Greek, collected thousands of ancient proverbs in his Adages, and wrote The Praise of Folly in Thomas More's house.",
    era: "renaissance", topics: ["renaissance"],
    start: "praise-of-folly",
    works: ["praise-of-folly"],
    by: [ab("20474", "Enchiridion Militis Christiani", "Desiderius Erasmus", "His handbook of the Christian life, 1503.")],
    aboutThem: [ab("15658", "Erasmus and the Age of Reformation", "Johan Huizinga", "A Dutch historian's life of him, 1924.")],
    relations: [
      { name: "Thomas More", wiki: "Thomas_More", ol: "OL112972A", rel: "friend", note: "Friends from Erasmus' first visit to England in 1499; he wrote The Praise of Folly in More's house and dedicated it to him (prefatory letter)." },
      { name: "John Colet", wiki: "John_Colet", rel: "friend", note: "The Oxford scholar he met in 1499, later Dean of St Paul's." },
      { name: "Johann Froben", wiki: "Johann_Froben", rel: "friend", note: "The Basel printer who published his Greek New Testament in 1516 and many of his books, and in whose house he lived." },
      { name: "Hans Holbein the Younger", wiki: "Hans_Holbein_the_Younger", rel: "contemporary", note: "Painted his portrait in Basel in 1523, and carried his letter of introduction to More in England in 1526." },
      { name: "Charles V, Holy Roman Emperor", wiki: "Charles_V,_Holy_Roman_Emperor", rel: "ruler", note: "Erasmus was made his councillor in 1516 and wrote The Education of a Christian Prince for him." },
      { name: "Henry VIII", wiki: "Henry_VIII", rel: "ruler", note: "Met him as a boy of eight at Eltham in 1499, when More took him to see the royal children." },
      { name: "Martin Luther", wiki: "Martin_Luther", rel: "contemporary", note: "Erasmus wrote On Free Will (1524); Luther replied with On the Bondage of the Will (1525)." },
    ],
    read: [
      { title: "Dialogues", by: "Lucian", item: ab("15880", "Dialogues of the Dead", "Lucian of Samosata", "Lucian's dead philosophers and kings in Hades."), at: p("praise-of-folly", "Prefatory letter to More", "Lucian, the fly and flattery; when Seneca made such sport with Claudius' canonizations", WILSON), note: "He names Lucian among the authors of mock praises before him; he and More had translated Lucian into Latin together (1506)." },
      { title: "Gryllus", by: "Plutarch", at: p("praise-of-folly", "Prefatory letter to More", "Plutarch, with his dialogue between Ulysses and Gryllus", WILSON), note: "Plutarch's dialogue in which a man Circe turned into a pig refuses to be changed back." },
      { title: "The Battle of Frogs and Mice", by: "attributed to Homer", at: p("praise-of-folly", "Prefatory letter to More", "Homer, so many ages since, did the like with the battle of frogs and mice", WILSON), note: "The first mock epic he names." },
    ],
    from: [ab("993", "Utopia", "Thomas More", "His friend's book, 1516, which Erasmus helped see through the press.")],
    later: [ERASMUS_IOT, iot("aon2hf1ydxta6", "Archive: Erasmus", "An earlier programme on him."), HUMANISM_IOT],
    articles: [
      { title: "In Praise of Folly", note: "The book, its speaker and its targets." },
      { title: "Adagia", note: "His collection of ancient proverbs." },
      { title: "Novum Instrumentum omne", note: "His Greek New Testament of 1516." },
      { title: "The Education of a Christian Prince", note: "The book he wrote for the young Charles V." },
      { title: "Renaissance humanism", note: "The movement he led." },
    ],
  },
  {
    id: "thomas-more", name: "Thomas More", wiki: "Thomas_More", ol: "OL112972A", born: "1478", died: "1535", place: "London",
    what: "Lawyer, humanist, Lord Chancellor of England",
    about: "A London lawyer who wrote Utopia, served Henry VIII as Lord Chancellor, and was beheaded for refusing to swear to the Act of Succession. The Catholic Church made him a saint in 1935.",
    era: "renaissance", topics: ["renaissance"],
    start: "utopia",
    works: ["utopia"],
    relations: [
      { name: "John Morton", wiki: "John_Morton_(cardinal)", rel: "patron", note: "The Archbishop of Canterbury in whose household he served as a boy; Morton appears in Book I of Utopia." },
      { name: "Erasmus", wiki: "Erasmus", ol: "OL53336A", rel: "friend", note: "Friends from 1499; Erasmus dedicated The Praise of Folly to him (prefatory letter)." },
      { name: "Pieter Gillis", wiki: "Pieter_Gillis", rel: "friend", note: "The Antwerp town clerk to whom Utopia is addressed; the book opens with More meeting Hythloday through him." },
      { name: "Hans Holbein the Younger", wiki: "Hans_Holbein_the_Younger", rel: "contemporary", note: "Stayed with him in 1526 and painted him and his family." },
      { name: "Margaret Roper", wiki: "Margaret_Roper", rel: "family", note: "His eldest daughter, a Latin scholar, who visited him in the Tower." },
      { name: "William Roper", wiki: "William_Roper", rel: "family", note: "His son-in-law, who wrote The Life of Sir Thomas More." },
      { name: "Thomas Wolsey", wiki: "Thomas_Wolsey", rel: "contemporary", note: "The cardinal he succeeded as Lord Chancellor in 1529." },
      { name: "Henry VIII", wiki: "Henry_VIII", rel: "ruler", note: "Made him Lord Chancellor in 1529; More resigned in 1532 and was beheaded on 6 July 1535." },
    ],
    read: [
      { title: "Republic", by: "Plato", work: "republic", at: p("utopia", "Book I", "your friend Plato thinks that nations will be happy when either philosophers become kings or kings become philosophers.", BURNET), note: "Said to Hythloday in the argument over whether a scholar should counsel princes (Republic V, 473d)." },
      { title: "Parallel Lives", by: "Plutarch", work: "plutarch", at: p("utopia", "Book II, Of the Travelling of the Utopians", "They esteem Plutarch highly, and were much taken with Lucian's wit and with his pleasant way of writing.", BURNET), note: "Among the Greek books Hythloday leaves on the island." },
      { title: "Dialogues", by: "Lucian", item: ab("17663", "True History", "Lucian of Samosata", "Lucian's tale of a voyage to the moon, a model for travellers' tales."), at: p("utopia", "Book II, Of the Travelling of the Utopians"), note: "He and Erasmus translated dialogues of Lucian into Latin, printed in 1506." },
      { title: "Comedies", by: "Aristophanes", at: p("utopia", "Book II, Of the Travelling of the Utopians", "As for the poets, they have Aristophanes, Homer, Euripides, and Sophocles of Aldus's edition", BURNET), note: "The Greek poets in the Venetian printer Aldus' editions." },
    ],
    from: [ab("2628", "The Praise of Folly", "Desiderius Erasmus", "Written in his house in 1509 and dedicated to him.")],
    later: [UTOPIA_IOT, iot("1959t7o19jku3j", "Utopia", "The idea of a perfect place, from Plato to More and after."), TUDOR_STATE_IOT],
    articles: [
      { title: "Utopia (book)", note: "The book and the word it made." },
      { title: "Sir Thomas More (play)", note: "A play on his life from the 1590s, part of it thought to be in Shakespeare's hand." },
      { title: "Renaissance humanism", note: "The learning he and Erasmus shared." },
    ],
  },
  {
    id: "niccolo-machiavelli", name: "Niccolò Machiavelli", wiki: "Niccolò_Machiavelli", ol: "OL23135A", born: "1469", died: "1527", place: "Florence",
    what: "Florentine diplomat, political writer and historian",
    about: "Secretary of the Florentine republic from 1498 to 1512, sent to the courts of France, the Pope and Cesare Borgia. When the Medici came back he lost his post and was imprisoned and tortured; on his farm outside the city he wrote The Prince and the Discourses on Livy.",
    era: "renaissance", topics: ["renaissance"],
    start: "prince",
    works: ["prince", "discourses-livy", "art-of-war", "history-of-florence"],
    relations: [
      { name: "Piero Soderini", wiki: "Piero_Soderini", rel: "ruler", note: "Head of the Florentine republic from 1502 to 1512, whose government he served until the Medici returned." },
      { name: "Cesare Borgia", wiki: "Cesare_Borgia", rel: "ruler", note: "Florence's envoy to him in the Romagna in 1502; The Prince holds him up as a new prince (Prince VII)." },
      { name: "Lorenzo di Piero de' Medici", wiki: "Lorenzo_di_Piero_de'_Medici", rel: "ruler", note: "The ruler of Florence to whom he dedicated The Prince (Dedication)." },
      { name: "Pope Clement VII", wiki: "Pope_Clement_VII", rel: "patron", note: "As Cardinal Giulio de' Medici he commissioned the Florentine Histories in 1520; Machiavelli dedicated the finished work to him as pope." },
      { name: "Francesco Vettori", wiki: "Francesco_Vettori", rel: "friend", note: "Florence's ambassador in Rome; Machiavelli's letter to him of 10 December 1513 tells how he was writing The Prince." },
      { name: "Francesco Guicciardini", wiki: "Francesco_Guicciardini", rel: "friend", note: "The historian and papal governor with whom he corresponded in his last years." },
    ],
    read: [
      { title: "History of Rome", by: "Livy", item: ab("3496", "From the Foundation of the City, Vol. 1", "Livy", "The first books of Livy, the ones he wrote on."), at: p("discourses-livy", "Book I, Preface", "I have thought fit to note down with respect to all those books of Titus Livius which have escaped the malignity of Time, whatever seems to me essential to a right understanding of ancient and modern affairs", THOMSON), note: "The Discourses are a commentary on Livy's first ten books." },
      { title: "The Education of Cyrus", by: "Xenophon", item: ab("9561", "Cyropaedia: The Education of Cyrus", "Xenophon", "Xenophon's life of the Persian king as a model ruler."), at: p("prince", "XIV", "And whoever reads the life of Cyrus, written by Xenophon, will recognize afterwards in the life of Scipio how that imitation was his glory", MARRIOTT), note: "He tells a prince to read histories and take a great man as his model." },
      { title: "Divine Comedy", by: "Dante", item: ab("67", "Divine Comedy", "Dante Alighieri", "Florence's poet, whom he carried into the woods."), at: p("Letter to Francesco Vettori", "10 December 1513"), note: "He tells Vettori he takes Dante or Petrarch, or a lesser poet such as Tibullus or Ovid, with him into the woods." },
    ],
    from: [ab("9561", "Cyropaedia: The Education of Cyrus", "Xenophon", "The ancient mirror for princes he cites in The Prince.")],
    later: [MACHIAVELLI_IOT, iot("sh5ux81jgpkhj", "The Medici", "The family that put him out of office and later employed him."), iot("bj7oypqf7ed8", "The Borgias", "Cesare Borgia and his father, Pope Alexander VI.")],
    articles: [
      { title: "The Prince", note: "The book, how it was written and how it was read." },
      { title: "Discourses on Livy", note: "His book on republics." },
      { title: "Florentine Histories", note: "His history of his city." },
      { title: "The Art of War (Machiavelli book)", note: "His dialogue on armies." },
      { title: "Machiavellianism", note: "What his name came to mean." },
    ],
  },
  {
    id: "michel-de-montaigne", name: "Michel de Montaigne", wiki: "Michel_de_Montaigne", ol: "OL112816A", born: "1533", died: "1592", place: "Château de Montaigne, Périgord",
    what: "Essayist, magistrate, mayor of Bordeaux",
    about: "A magistrate of Bordeaux who retired at thirty-eight to the tower of his château to read and write. His Essays, begun in 1572, test his judgment on everything he could think of, and on himself above all. He was mayor of Bordeaux from 1581 to 1585.",
    era: "renaissance", topics: ["renaissance"],
    start: "montaigne-essays",
    works: ["montaigne-essays"],
    relations: [
      { name: "George Buchanan", wiki: "George_Buchanan", rel: "teacher", note: "The Scottish poet who taught him at the Collège de Guyenne, where Montaigne acted in his Latin tragedies (Essays I, 26)." },
      { name: "Étienne de La Boétie", wiki: "Étienne_de_La_Boétie", rel: "friend", note: "His friend from about 1558 until La Boétie's death in 1563, the subject of \"Of Friendship\" (Essays I, 28)." },
      { name: "Marie de Gournay", wiki: "Marie_de_Gournay", rel: "friend", note: "His adopted daughter, as he called her, who edited the Essays after his death (1595)." },
      { name: "Henry III of France", wiki: "Henry_III_of_France", rel: "ruler", note: "Wrote to him in Italy in 1581 ordering him home to take up the office of mayor of Bordeaux." },
      { name: "Henry IV of France", wiki: "Henry_IV_of_France", rel: "ruler", note: "As King of Navarre he stayed at Montaigne's château in 1584; Montaigne carried messages between him and the court." },
    ],
    read: [
      { title: "Lives and Moral Essays", by: "Plutarch", work: "plutarch", at: p("montaigne-essays", "II, 10, Of Books", "The books that serve me to this purpose are Plutarch, since he has been translated into French, and Seneca.", COTTON), note: "He read Plutarch in Jacques Amyot's French." },
      { title: "Moral Letters", by: "Seneca", item: ab("9230", "Moral Letters, Vol. I", "Seneca", "The letters to Lucilius, in loose pieces as he liked."), at: p("montaigne-essays", "I, 26, Of the Education of Children", "I never seriously settled myself to the reading any book of solid learning but Plutarch and Seneca", COTTON), note: "Seneca and Plutarch are the authors he quotes most." },
      { title: "Metamorphoses", by: "Ovid", item: ab("3778", "Metamorphoses", "Ovid", "The book of changes."), at: p("montaigne-essays", "I, 26, Of the Education of Children", "The first taste which I had for books came to me from the pleasure in reading the fables of Ovid's Metamorphoses", COTTON), note: "He read it at seven or eight, in Latin, the language he was brought up to speak first." },
      { title: "Georgics", by: "Virgil", item: ab("15045", "Georgics", "Virgil", "Virgil's poem on farming."), at: p("montaigne-essays", "II, 10, Of Books", "Virgil in his Georgics, which I look upon as the most accomplished piece in poetry", COTTON), note: "He ranks Virgil, Lucretius, Catullus and Horace above the other Latin poets." },
      { title: "Discourse on Voluntary Servitude", by: "Étienne de La Boétie", at: p("montaigne-essays", "I, 28, Of Friendship"), note: "He meant to print his friend's essay in the middle of his first book, then left it out." },
    ],
    from: [ab("2244", "The Tempest", "William Shakespeare", "Gonzalo's commonwealth (II, 1) follows Florio's English of \"Of Cannibals\", printed in 1603.")],
    later: [MONTAIGNE_IOT, HUMANISM_IOT],
    articles: [
      { title: "Essays (Montaigne)", note: "The book, its three parts and its editions." },
      { title: "Discourse on Voluntary Servitude", note: "La Boétie's essay." },
      { title: "John Florio", note: "His first English translator, 1603." },
    ],
  },
  {
    id: "elizabeth-i", name: "Elizabeth I", wiki: "Elizabeth_I", ol: "OL159849A", born: "1533", died: "1603", place: "Greenwich, London",
    what: "Queen of England and Ireland from 1558 to 1603",
    about: "Daughter of Henry VIII and Anne Boleyn, taught Greek and Latin by Roger Ascham. She reigned forty-four years, through the execution of Mary, Queen of Scots and the Spanish Armada. Her speeches and letters survive, and in 1593 she translated Boethius' Consolation of Philosophy into English.",
    era: "renaissance", topics: ["renaissance"],
    start: ab("2626", "Queen Elizabeth", "Jacob Abbott", "Her life from her birth to her death, 1849."),
    works: [],
    aboutThem: [
      ab("2626", "Queen Elizabeth", "Jacob Abbott", "Her life from her birth to her death, 1849."),
      ab("10941", "Queen Elizabeth", "Mandell Creighton", "A bishop and historian's life of her, 1896."),
      ab("5980", "Memoirs of the Court of Queen Elizabeth", "Lucy Aikin", "Her court and the people in it, 1818."),
    ],
    relations: [
      { name: "Roger Ascham", wiki: "Roger_Ascham", ol: "OL1002184A", rel: "teacher", note: "Her tutor from 1548; he read Greek with her again as queen (The Scholemaster, 1570)." },
      { name: "Henry VIII", wiki: "Henry_VIII", rel: "family", note: "Her father." },
      { name: "Anne Boleyn", wiki: "Anne_Boleyn", rel: "family", note: "Her mother, beheaded in 1536 when Elizabeth was two." },
      { name: "Mary I", wiki: "Mary_I", rel: "family", note: "Her half-sister and queen before her, who held her in the Tower of London in 1554." },
      { name: "Mary, Queen of Scots", wiki: "Mary,_Queen_of_Scots", rel: "family", note: "Her cousin, held in England from 1568 and beheaded at Fotheringhay in 1587 on a warrant Elizabeth signed." },
      { name: "William Cecil", wiki: "William_Cecil,_1st_Baron_Burghley", rel: "served", note: "Her Secretary of State from 1558 and Lord Treasurer from 1572 until his death in 1598." },
      { name: "Francis Walsingham", wiki: "Francis_Walsingham", rel: "served", note: "Her Principal Secretary from 1573, who uncovered the Babington Plot in 1586." },
      { name: "Robert Dudley", wiki: "Robert_Dudley,_1st_Earl_of_Leicester", rel: "served", note: "Her Master of the Horse from 1558, made Earl of Leicester in 1564." },
      { name: "Thomas Tallis", wiki: "Thomas_Tallis", rel: "served", note: "Gentleman of her Chapel Royal; in 1575 she granted him and Byrd the sole right to print music, and they dedicated their Cantiones sacrae to her." },
      { name: "William Byrd", wiki: "William_Byrd", rel: "served", note: "Gentleman of her Chapel Royal, joint holder with Tallis of her 1575 licence to print music." },
      { name: "Edmund Spenser", wiki: "Edmund_Spenser", rel: "contemporary", note: "Dedicated The Faerie Queene to her in 1590; she granted him a pension of fifty pounds a year in 1591." },
      { name: "William Shakespeare", wiki: "William_Shakespeare", ol: "OL9388A", rel: "contemporary", note: "His company, the Lord Chamberlain's Men, played before her at court; he is named in the payment for Christmas 1594." },
      { name: "Philip II of Spain", wiki: "Philip_II_of_Spain", rel: "ruler", note: "Her sister Mary's husband, who proposed marriage to Elizabeth in 1559 and sent the Armada against her in 1588." },
    ],
    read: [
      { title: "On the False Embassy", by: "Demosthenes", item: ab("15773", "Public Orations of Demosthenes", "Demosthenes", "Demosthenes' speeches in English."), at: en("The Scholemaster", "Preface", "We red than togither in the Greke tongue, as I well remember, that noble Oration of Demosthenes against æschines, for his false dealing in his Ambassage to king Philip of Macedonie."), note: "Ascham read it with her at Windsor in 1563, the day the book was first talked of." },
      { title: "Orations of Isocrates and Cicero", by: "Isocrates and Cicero", at: en("The Scholemaster", "Book II", "Demosthenes and Isocrates dailie without missing euerie forenone, and likewise som part of Tullie euery afternone, for the space of a yeare or two"), note: "How Ascham taught her both tongues, by turning these authors into English and back." },
      { title: "The Consolation of Philosophy", by: "Boethius", item: ab("85", "Consolation of Philosophy", "Boethius", "The book she put into English."), at: p("Queen Elizabeth's Englishings of Boethius", "Her translation, 1593 (ed. Pemberton, 1899)"), note: "She translated it in October and November 1593; the manuscript is partly in her own hand." },
    ],
    from: [
      ab("310", "The Faerie Queene, Book 1", "Edmund Spenser", "The epic dedicated to her in 1590, whose Faerie Queene stands for her."),
      ab("4841", "Henry VIII", "William Shakespeare", "Shakespeare and Fletcher's play of 1613, which ends with her christening."),
    ],
    later: [
      iot("ox0hda11z9kb1", "The Death of Elizabeth I", "The end of her reign and the succession of James."),
      iot("1b73ez31d5y022", "William Cecil", "Her chief minister for forty years."),
      iot("1y7fwv21rkcyqd", "The Spanish Armada", "The fleet Philip II sent against her in 1588."),
      TUDOR_STATE_IOT,
    ],
    articles: [
      { title: "Speech to the Troops at Tilbury", note: "Her speech as the Armada approached, 1588." },
      { title: "Spanish Armada", note: "The invasion fleet of 1588." },
      { title: "Elizabethan religious settlement", note: "The church laws of her first years." },
      { title: "Babington Plot", note: "The plot that led to Mary, Queen of Scots' death." },
      { title: "Gentleman of the Chapel Royal", note: "The singers of her chapel, Tallis and Byrd among them." },
    ],
  },
  {
    id: "william-shakespeare", name: "William Shakespeare", wiki: "William_Shakespeare", ol: "OL9388A", born: "1564", died: "1616", place: "Stratford-upon-Avon and London",
    what: "Playwright, poet and actor",
    about: "A glover's son from Stratford who went to London as an actor and wrote about thirty-seven plays for his company, the Lord Chamberlain's Men, who became the King's Men under James I. His friends collected his plays in the First Folio of 1623.",
    era: "renaissance", topics: ["renaissance"],
    start: "hamlet",
    works: ["titus-andronicus", "romeo-juliet", "midsummer", "julius-caesar", "hamlet", "twelfth-night", "king-lear", "macbeth", "antony-cleopatra", "tempest", "shakespeare-sonnets"],
    by: [
      ab("2132", "The Merchant of Venice", "William Shakespeare", "The play with his longest speech on music (V, 1)."),
      ab("2092", "As You Like It", "William Shakespeare", "The play in which \"It was a lover and his lass\" is sung (V, 3)."),
      ab("15041", "Venus and Adonis", "William Shakespeare", "His first printed poem, 1593, dedicated to the Earl of Southampton."),
    ],
    music: {
      stance: "own",
      words: [
        en("The Merchant of Venice", "V, 1", "The man that hath no music in himself, Nor is not mov’d with concord of sweet sounds, Is fit for treasons, stratagems, and spoils"),
        en("twelfth-night", "I, 1", "If music be the food of love, play on, Give me excess of it; that, surfeiting, The appetite may sicken and so die."),
      ],
      rules: [],
      time: [MORLEY_LOVER, GREENSLEEVES],
      timeNote: "A song from his own As You Like It in the setting Thomas Morley printed in 1600, and the ballad tune Falstaff calls for in The Merry Wives of Windsor (V, 5).",
      people: [
        { name: "Thomas Morley", wiki: "Thomas_Morley", note: "Printed a setting of \"It was a lover and his lass\" from As You Like It in his First Book of Airs, 1600." },
        { name: "Robert Johnson", wiki: "Robert_Johnson_(English_composer)", note: "Lutenist to James I who wrote songs for the King's Men; his settings of \"Full fathom five\" and \"Where the bee sucks\" for The Tempest survive." },
        { name: "John Dowland", wiki: "John_Dowland", note: "The lutenist whose songs were sold in London while the plays were new." },
      ],
      ages: [],
    },
    relations: [
      { name: "Anne Hathaway", wiki: "Anne_Hathaway", rel: "family", note: "His wife, married in 1582." },
      { name: "Hamnet Shakespeare", wiki: "Hamnet_Shakespeare", rel: "family", note: "His son, who died in 1596 aged eleven." },
      { name: "Henry Wriothesley, Earl of Southampton", wiki: "Henry_Wriothesley,_3rd_Earl_of_Southampton", rel: "patron", note: "He dedicated Venus and Adonis (1593) and The Rape of Lucrece (1594) to him." },
      { name: "James VI and I", wiki: "James_VI_and_I", rel: "patron", note: "Took Shakespeare's company as the King's Men in 1603; Shakespeare is named in the royal licence." },
      { name: "Elizabeth I", wiki: "Elizabeth_I", ol: "OL159849A", rel: "ruler", note: "His company played before her at court; he is named in the payment for Christmas 1594." },
      { name: "Ben Jonson", wiki: "Ben_Jonson", ol: "OL112771A", rel: "friend", note: "Shakespeare acted in his Every Man in His Humour (1598); Jonson wrote \"To the memory of my beloved, the Author\" for the First Folio." },
      { name: "Richard Burbage", wiki: "Richard_Burbage", rel: "contemporary", note: "The company's leading actor; Shakespeare left him money for a ring in his will." },
      { name: "John Heminges", wiki: "John_Heminges", rel: "contemporary", note: "A fellow actor who, with Henry Condell, collected his plays in the First Folio (1623)." },
      { name: "Henry Condell", wiki: "Henry_Condell", rel: "contemporary", note: "A fellow actor and co-editor of the First Folio." },
    ],
    read: [
      { title: "Metamorphoses", by: "Ovid", item: ab("3778", "Metamorphoses", "Ovid", "The book Lavinia turns the pages of."), at: en("titus-andronicus", "IV, 1", "Grandsire, ’tis Ovid’s Metamorphosis. My mother gave it me."), note: "The book is brought on stage, and Titus reads in it the tale of Philomel." },
      { title: "Parallel Lives (North's translation)", by: "Plutarch", work: "plutarch", at: en("antony-cleopatra", "II, 2", "The barge she sat in, like a burnished throne, Burned on the water. The poop was beaten gold;"), note: "Enobarbus' speech follows Thomas North's English of Plutarch's Life of Antony (1579) closely." },
      { title: "Essays (Florio's translation)", by: "Michel de Montaigne", work: "montaigne-essays", at: en("tempest", "II, 1", "I’ th’ commonwealth I would by contraries Execute all things; for no kind of traffic Would I admit; no name of magistrate;"), note: "Gonzalo's commonwealth follows John Florio's English of Montaigne's \"Of Cannibals\" (1603)." },
    ],
    from: [
      ab("12983", "Every Man in His Humour", "Ben Jonson", "Jonson's comedy of 1598, in which Shakespeare acted."),
      ab("4560", "Doctor Faustus", "Christopher Marlowe", "The play of the poet born the same year as him, staged in his first years in London."),
    ],
    later: [
      iot("1qdlu9k195g337", "Shakespeare's Life", "What the records say."),
      iot("1a6eg87amhl16", "Shakespeare's Work", "The plays and poems."),
      HAMLET_IOT, LEAR_IOT, TEMPEST_IOT, SONNETS_IOT, ROMANS_IOT,
      iot("1ofxrbgogik27", "Elizabethan Revenge", "The revenge plays of his London."),
    ],
    articles: [
      { title: "First Folio", note: "The collected plays of 1623." },
      { title: "Lord Chamberlain's Men", note: "His company under Elizabeth." },
      { title: "King's Men (playing company)", note: "The same company under James I." },
      { title: "Globe Theatre", note: "The playhouse his company built in 1599." },
      { title: "Thomas North", note: "The translator of the Plutarch he used." },
      { title: "Arthur Golding", note: "The translator of the Ovid he knew." },
    ],
  },
];
