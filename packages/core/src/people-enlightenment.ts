/**
 * The Enlightenment (Torian, 2026-11-16 04:02Z, "People and eras"): seven people from Locke to Adam Smith, and
 * Frederick the Great, the one ruler here, because Voltaire, Bach and Rousseau each dealt with him. Locke, Hume and
 * Smith wrote in English and are quoted as they wrote; Voltaire's Letters on England are quoted in the English of
 * 1733 (Lockman). Rousseau composed, so his page has a music section of his own opera; the others show the era's
 * music as Their time. Citations use the standard divisions (book, chapter, section). Pure: no I/O.
 */
import { ab, iot } from "./collections";
import { en, p, type Person } from "./historical";
import { DEVIN, DEVIN_HAHN } from "./topic-enlightenment";

const LOCKMAN = "Lockman";

const GLORIOUS = iot("1wvnqs9f02r3c", "The Glorious Revolution", "The change of king in 1688 that Locke's Two Treatises were published to defend.");
const BRITAIN = iot("1t0cp1d1uc8y3k", "The Enlightenment in Britain", "Locke, Newton and the century after them.");
const SCOTLAND = iot("ec0accbc56tz", "The Enlightenment in Scotland", "Hume, Smith, Hutcheson and Edinburgh.");
const ENCYCLOPEDIE = iot("31ho8h1h4w290", "The Encyclopédie", "Diderot and d'Alembert's dictionary, to which Rousseau wrote the articles on music.");

export const ENLIGHTENMENT: readonly Person[] = [
  {
    id: "john-locke", name: "John Locke", wiki: "John_Locke", ol: "OL77200A", born: "1632", died: "1704", place: "Somerset, Oxford, London and Holland",
    what: "Philosopher and physician",
    about: "A doctor and secretary to the Earl of Shaftesbury, he went into exile in Holland in 1683 and came home after the Glorious Revolution. In 1689 he published a case for government by consent, a letter for toleration, and an essay arguing that all our ideas come from experience.",
    era: "enlightenment", topics: ["enlightenment"],
    start: "two-treatises",
    works: ["two-treatises", "toleration", "locke-understanding"],
    relations: [
      { name: "Richard Busby", wiki: "Richard_Busby", rel: "teacher", note: "Headmaster of Westminster School, where Locke was a pupil before Oxford." },
      { name: "Anthony Ashley-Cooper, 3rd Earl of Shaftesbury", wiki: "Anthony_Ashley-Cooper,_3rd_Earl_of_Shaftesbury", rel: "student", note: "The first earl's grandson, whose education Locke directed." },
      { name: "Anthony Ashley Cooper, 1st Earl of Shaftesbury", wiki: "Anthony_Ashley_Cooper,_1st_Earl_of_Shaftesbury", rel: "patron", note: "Locke lived in his household from 1667 as his physician and secretary, and fled to Holland after him." },
      { name: "Isaac Newton", wiki: "Isaac_Newton", rel: "friend", note: "They corresponded on scripture and science; the Essay's Epistle to the Reader calls him \"the incomparable Mr. Newton\"." },
      { name: "Thomas Sydenham", wiki: "Thomas_Sydenham", rel: "friend", note: "The London physician Locke worked beside in the 1660s and 1670s." },
      { name: "Robert Boyle", wiki: "Robert_Boyle", rel: "friend", note: "Locke worked with him in Oxford and edited his History of the Air after his death." },
      { name: "Damaris Cudworth Masham", wiki: "Damaris_Cudworth_Masham", rel: "friend", note: "A philosopher in her own right; Locke lived at her house at Oates in Essex from 1691 until he died there." },
      { name: "William III of England", wiki: "William_III_of_England", rel: "ruler", note: "Locke came home in 1689 with William's wife Mary, and served on William's Board of Trade from 1696." },
    ],
    read: [
      { title: "Of the Laws of Ecclesiastical Polity", by: "Richard Hooker", item: ab("18436", "Of the Laws of Ecclesiastical Polity, Book 1", "Richard Hooker", "The book Locke quotes on natural law."), at: en("two-treatises", "Second Treatise, §5", "This equality of men by nature, the judicious Hooker looks upon as so evident in itself, and beyond all question, that he makes it the foundation of that obligation to mutual love amongst men"), note: "He quotes Hooker again and again in the Second Treatise." },
      { title: "Patriarcha", by: "Robert Filmer", at: p("two-treatises", "First Treatise, chapter I"), note: "The whole First Treatise is a reply to Filmer's case that kings rule by descent from Adam." },
    ],
    from: [
      ab("875", "Leviathan (Books I and II)", "Thomas Hobbes", "The case for an absolute sovereign, published in 1651 while Locke was at Oxford."),
    ],
    later: [GLORIOUS, BRITAIN],
    articles: [
      { title: "Glorious Revolution", note: "The change of king in 1688 and 1689." },
      { title: "Two Treatises of Government", note: "When they were written and what they answered." },
      { title: "Tabula rasa", note: "The mind as white paper." },
      { title: "Robert Filmer", note: "The defender of royal power the First Treatise answers." },
    ],
  },
  {
    id: "montesquieu", name: "Montesquieu", wiki: "Montesquieu", ol: "OL25573A", born: "1689", died: "1755", place: "La Brède and Bordeaux",
    what: "Judge, political philosopher and writer",
    about: "A president of the Parlement of Bordeaux, he made his name with the Persian Letters in 1721, spent two years in England, and gave twenty years to The Spirit of the Laws, which describes how laws fit a people and sets out the separation of powers.",
    era: "enlightenment", topics: ["enlightenment"],
    start: "spirit-of-laws",
    works: ["spirit-of-laws"],
    relations: [
      { name: "Philip Stanhope, 4th Earl of Chesterfield", wiki: "Philip_Stanhope,_4th_Earl_of_Chesterfield", rel: "friend", note: "Montesquieu crossed to England with him in 1729." },
      { name: "David Hume", wiki: "David_Hume", ol: "OL29349A", rel: "friend", note: "Hume sent him remarks on The Spirit of the Laws in 1749, and they corresponded." },
    ],
    read: [
      { title: "Germania", by: "Tacitus", item: ab("3115", "Germania", "Tacitus", "The Roman account of the German tribes."), at: p("spirit-of-laws", "XI, 6"), note: "He cites Tacitus' account of the Germans as the source of the English constitution: \"this beautiful system was invented first in the woods\"." },
    ],
    from: [
      ab("14476", "Letters on England", "Voltaire", "Another Frenchman on the English constitution, written in the same years Montesquieu was in England."),
    ],
    later: [iot("1vlxo631kxjuc2", "Montesquieu", "His life, the Persian Letters and The Spirit of the Laws.")],
    articles: [
      { title: "Separation of powers", note: "The idea Book XI made famous." },
      { title: "Persian Letters", note: "His first book, letters home from two Persians in Paris." },
    ],
  },
  {
    id: "voltaire", name: "Voltaire", wiki: "Voltaire", ol: "OL32293A", born: "1694", died: "1778", place: "Paris, London, Cirey, Potsdam and Ferney",
    what: "Writer, playwright and historian",
    about: "Twice in the Bastille as a young man, he spent three years in England and wrote home about its liberty, its science and its plays. He lived at Cirey with Émilie du Châtelet, at Frederick the Great's court, and at last at Ferney by Geneva, writing tales, histories and campaigns against intolerance.",
    era: "enlightenment", topics: ["enlightenment"],
    start: "candide",
    works: ["letters-on-england", "candide", "zadig"],
    by: [ab("3317", "Sincere Huron (L'Ingénu)", "Voltaire", "A tale of 1767: a young man raised among the Huron comes to France.")],
    relations: [
      { name: "Émilie du Châtelet", wiki: "Émilie_du_Châtelet", rel: "friend", note: "Mathematician and translator of Newton's Principia; he lived with her at Cirey from 1734 until her death in 1749." },
      { name: "Marie Louise Mignot", wiki: "Marie_Louise_Mignot", rel: "family", note: "His niece, Madame Denis, who kept house for him in his last decades." },
      { name: "Frederick the Great", wiki: "Frederick_the_Great", rel: "ruler", note: "Wrote to him first in 1736; Voltaire lived at his court at Potsdam from 1750 to 1753." },
      { name: "Louis XV", wiki: "Louis_XV", rel: "ruler", note: "Made him royal historiographer in 1745." },
      { name: "Jean-Jacques Rousseau", wiki: "Jean-Jacques_Rousseau", ol: "OL29048A", rel: "contemporary", note: "Rousseau revised the music of Voltaire and Rameau's Les fêtes de Ramire in 1745 (Confessions VII), and answered his poem on the Lisbon earthquake in a letter of 1756." },
    ],
    read: [
      { title: "An Essay Concerning Human Understanding", by: "John Locke", work: "locke-understanding", at: p("letters-on-england", "XIII", "Mr. Locke has displayed the human soul in the same manner as an excellent anatomist explains the springs of the human body.", LOCKMAN), note: "The thirteenth letter is on Locke." },
      { title: "Principia", by: "Isaac Newton", at: p("letters-on-england", "XIV to XVII"), note: "Four letters explain Newton's gravitation, optics and calculus to French readers." },
      { title: "Hamlet", by: "William Shakespeare", work: "hamlet", at: p("letters-on-england", "XVIII"), note: "He translates part of the soliloquy \"To be, or not to be\" into French verse." },
    ],
    from: [
      ab("8400", "Essay on Crimes and Punishments", "Cesare Beccaria, Voltaire", "Beccaria's book against torture, with Voltaire's commentary."),
    ],
    later: [iot("bbstshb9qs2k", "Voltaire's Candide", "The tale, the Lisbon earthquake behind it, and its targets."), ENCYCLOPEDIE],
    articles: [
      { title: "Letters on the English", note: "The book's history, and why it was burned in Paris in 1734." },
      { title: "1755 Lisbon earthquake", note: "The disaster behind Candide." },
      { title: "Émilie du Châtelet", note: "His companion at Cirey and Newton's French translator." },
    ],
  },
  {
    id: "jean-jacques-rousseau", name: "Jean-Jacques Rousseau", wiki: "Jean-Jacques_Rousseau", ol: "OL29048A", born: "1712", died: "1778", place: "Geneva, Paris, Montmorency and Môtiers",
    what: "Philosopher, writer and composer",
    about: "A watchmaker's son from Geneva, he came to Paris to make his name in music, wrote the Encyclopédie's articles on it, and had an opera played before the king. His discourses, The Social Contract and Emile followed; Emile was condemned in 1762 and he spent his last years moving from refuge to refuge.",
    era: "enlightenment", topics: ["enlightenment"],
    start: "social-contract",
    works: ["inequality", "social-contract", "emile", "rousseau-confessions"],
    by: [DEVIN, DEVIN_HAHN],
    music: {
      stance: "own",
      words: [],
      rules: [
        { what: "Italian melody", kind: "song", verdict: "kept", why: "In the quarrel over Pergolesi's La serva padrona in Paris he took the Italian side: melody should lead.", at: p("Letter on French Music", "1753") },
        { what: "French opera", kind: "song", verdict: "warned", why: "He argued that the French language does not suit music, and so the French have no music of their own.", at: p("Letter on French Music", "1753") },
      ],
      time: [DEVIN, DEVIN_HAHN],
      timeNote: "His own opera, Le devin du village, first played before Louis XV at Fontainebleau in 1752 and kept in the Paris Opéra's repertory for decades. Both recordings are early: 1937 and 1911.",
      people: [
        { name: "Jean-Philippe Rameau", wiki: "Jean-Philippe_Rameau", note: "Heard Rousseau's opera Les muses galantes in 1745 and said that part of it was by a master and part by someone who knew nothing of music (Confessions VII)." },
        { name: "Giovanni Battista Pergolesi", wiki: "Giovanni_Battista_Pergolesi", note: "His La serva padrona, played in Paris in 1752, began the quarrel Rousseau joined." },
      ],
      ages: [],
    },
    relations: [
      { name: "Isaac Rousseau", wiki: "Isaac_Rousseau", rel: "family", note: "His father, a Geneva watchmaker, who read novels and then Plutarch with him through the nights (Confessions I)." },
      { name: "Thérèse Levasseur", wiki: "Thérèse_Levasseur", rel: "family", note: "His companion from 1745, whom he married in 1768." },
      { name: "Françoise-Louise de Warens", wiki: "Françoise-Louise_de_Warens", rel: "patron", note: "Took him in at Annecy in 1728, when he was fifteen, and later at Chambéry (Confessions II to VI)." },
      { name: "Louise d'Épinay", wiki: "Louise_d'Épinay", rel: "patron", note: "Lent him the Hermitage at Montmorency in 1756." },
      { name: "Denis Diderot", wiki: "Denis_Diderot", rel: "friend", note: "Walking to visit him in prison at Vincennes in 1749, Rousseau read the Dijon Academy's prize question that became his first discourse (Confessions VIII)." },
      { name: "George Keith, 10th Earl Marischal", wiki: "George_Keith,_10th_Earl_Marischal", rel: "friend", note: "Frederick's governor of Neuchâtel, who sheltered him at Môtiers from 1762." },
      { name: "David Hume", wiki: "David_Hume", ol: "OL29349A", rel: "friend", note: "Brought him to England in January 1766; they quarrelled publicly within the year." },
      { name: "Frederick the Great", wiki: "Frederick_the_Great", rel: "ruler", note: "Neuchâtel was Frederick's principality, and Rousseau lived there under his protection from 1762 to 1765." },
      { name: "Voltaire", wiki: "Voltaire", ol: "OL32293A", rel: "contemporary", note: "Rousseau revised the music of Voltaire's Les fêtes de Ramire in 1745, and wrote to him on Providence in 1756." },
    ],
    read: [
      { title: "Parallel Lives", by: "Plutarch", work: "plutarch", at: p("rousseau-confessions", "Book I"), note: "Plutarch became his favourite author at about seven, read in his father's workroom." },
      { title: "Metamorphoses", by: "Ovid", item: ab("3778", "Metamorphoses", "Ovid", "Every myth of change."), at: p("rousseau-confessions", "Book I"), note: "Among his grandfather's books he read as a child, with Plutarch and La Bruyère." },
      { title: "Some Thoughts Concerning Education", by: "John Locke", at: p("emile", "Book II"), note: "He names and answers Locke's rule that one should reason with children." },
    ],
    from: [],
    later: [ab("14052", "Rousseau (Volume 1 and 2)", "John Morley", "A life of Rousseau published in 1873."), iot("1dxsvffa7g5tm", "The Social Contract", "From Hobbes and Locke to Rousseau."), iot("17v5pm8i1pmvv", "Rousseau on Education", "What Emile proposed, and why it was burned."), ENCYCLOPEDIE],
    articles: [
      { title: "Le devin du village", note: "His opera, and how it was received." },
      { title: "Querelle des Bouffons", note: "The Paris quarrel over French and Italian opera." },
      { title: "Social contract", note: "The idea from Hobbes and Locke to Rousseau." },
    ],
  },
  {
    id: "david-hume", name: "David Hume", wiki: "David_Hume", ol: "OL29349A", born: "1711", died: "1776", place: "Edinburgh, La Flèche, London and Paris",
    what: "Philosopher, historian and essayist",
    about: "He wrote A Treatise of Human Nature in France in his twenties; it \"fell dead-born from the press\", and he recast it as the Enquiries. In his lifetime he was best known for his History of England. He was secretary to the British embassy in Paris in the 1760s.",
    era: "enlightenment", topics: ["enlightenment"],
    start: "hume-enquiry",
    works: ["hume-treatise", "hume-enquiry", "hume-morals", "hume-dialogues"],
    by: [ab("6320", "History of England, Volume 1A", "David Hume", "The history that made his name, from Julius Caesar to 1688.")],
    relations: [
      { name: "Adam Smith", wiki: "Adam_Smith", ol: "OL39302A", rel: "friend", note: "Friends from about 1750; Smith wrote the letter on his last days published with My Own Life in 1777." },
      { name: "Francis Hutcheson", wiki: "Francis_Hutcheson_(philosopher)", rel: "friend", note: "Hume sent him the third book of the Treatise in manuscript in 1739, and they corresponded." },
      { name: "Montesquieu", wiki: "Montesquieu", ol: "OL25573A", rel: "friend", note: "Hume sent him remarks on The Spirit of the Laws in 1749." },
      { name: "Jean-Jacques Rousseau", wiki: "Jean-Jacques_Rousseau", ol: "OL29048A", rel: "friend", note: "Hume brought him to England in 1766, and published his account of their quarrel that year." },
    ],
    read: [
      { title: "An Essay Concerning Human Understanding", by: "John Locke", work: "locke-understanding", at: en("hume-treatise", "Book I, Part I, Section I, note", "Perhaps I rather restore the word, idea, to its original sense, from which Mr Locke had perverted it, in making it stand for all our perceptions."), note: "He takes Locke's word idea and narrows it." },
      { title: "The Fable of the Bees", by: "Bernard Mandeville", item: ab("14759", "Fable of the Bees", "Bernard Mandeville", "Private vices, public benefits."), at: en("hume-treatise", "Introduction, note", "Mr. Locke, my Lord Shaftesbury, Dr. Mandeville, Mr. Hutchinson, Dr. Butler, etc."), note: "His list of the English writers who began the science of man." },
      { title: "Works", by: "Cicero", at: p("My Own Life", "1776"), note: "He says that while his family thought he was reading law, he was reading Cicero and Virgil." },
    ],
    from: [],
    later: [iot("1py8m78145uyif", "David Hume", "His life and his philosophy."), SCOTLAND],
    articles: [
      { title: "Problem of induction", note: "His question why the past should guide us." },
      { title: "Scottish Enlightenment", note: "Edinburgh and Glasgow in his century." },
    ],
  },
  {
    id: "adam-smith", name: "Adam Smith", wiki: "Adam_Smith", ol: "OL39302A", born: "1723", died: "1790", place: "Kirkcaldy, Glasgow and Edinburgh",
    what: "Moral philosopher and economist",
    about: "Professor of moral philosophy at Glasgow, he published The Theory of Moral Sentiments in 1759, travelled in France as a duke's tutor, and spent ten years on The Wealth of Nations, published in 1776. He ended his life as a commissioner of customs in Edinburgh.",
    era: "enlightenment", topics: ["enlightenment"],
    start: "wealth-of-nations",
    works: ["moral-sentiments", "wealth-of-nations"],
    relations: [
      { name: "Francis Hutcheson", wiki: "Francis_Hutcheson_(philosopher)", rel: "teacher", note: "Taught him moral philosophy at Glasgow from 1737; Smith later held the same chair." },
      { name: "Henry Scott, 3rd Duke of Buccleuch", wiki: "Henry_Scott,_3rd_Duke_of_Buccleuch", rel: "student", note: "Smith left Glasgow in 1764 to be his tutor on a journey through France and Geneva." },
      { name: "David Hume", wiki: "David_Hume", ol: "OL29349A", rel: "friend", note: "His closest friend, whose last days he described in a letter to William Strahan in 1776." },
      { name: "Voltaire", wiki: "Voltaire", ol: "OL32293A", rel: "contemporary", note: "Smith visited him at Ferney while in Geneva in 1765." },
      { name: "François Quesnay", wiki: "François_Quesnay", rel: "contemporary", note: "The physician and economist he met in Paris in 1766, and discusses in Wealth of Nations IV, 9." },
    ],
    read: [
      { title: "History of England", by: "David Hume", item: ab("6320", "History of England, Volume 1A", "David Hume", "The history Smith cites."), at: en("wealth-of-nations", "III, 4", "Mr Hume is the only writer who, so far as I know, has hitherto taken notice of it."), note: "On how trade and towns brought order and liberty to the country." },
      { title: "Discourse on Inequality", by: "Jean-Jacques Rousseau", work: "inequality", at: p("Letter to the Edinburgh Review", "1756"), note: "He reviewed it in the Edinburgh Review soon after it appeared, translating passages from it." },
      { title: "The Fable of the Bees", by: "Bernard Mandeville", item: ab("14759", "Fable of the Bees", "Bernard Mandeville", "Private vices, public benefits."), at: p("moral-sentiments", "VII, ii, 4"), note: "He names Mandeville's system and answers it in the part on systems of moral philosophy." },
    ],
    from: [],
    later: [ab("17196", "Life of Adam Smith", "John Rae", "A life of Smith from his letters, published in 1895."), iot("12aqr7lznljd8", "The Wealth of Nations", "What Smith argued in 1776, and what he did not."), SCOTLAND],
    articles: [
      { title: "Invisible hand", note: "Where the phrase appears in his books." },
      { title: "Physiocracy", note: "The French economists he met in Paris." },
      { title: "Scottish Enlightenment", note: "Glasgow and Edinburgh in his century." },
    ],
  },
  {
    id: "frederick-the-great", name: "Frederick the Great", wiki: "Frederick_the_Great", ol: "OL1050292A", born: "1712", died: "1786", place: "Berlin and Potsdam",
    what: "King of Prussia, flautist and composer",
    about: "King of Prussia from 1740 to 1786, he took Silesia from Austria and held it through the Seven Years' War. He played the flute and composed, kept a court orchestra, wrote in French, and brought Voltaire to his palace at Potsdam.",
    era: "enlightenment", topics: ["enlightenment"],
    start: ab("10469", "Frederic the Great", "Thomas Babington Macaulay", "Macaulay's essay of 1842 on his life and reign."),
    works: [],
    aboutThem: [ab("10469", "Frederic the Great", "Thomas Babington Macaulay", "Macaulay's essay of 1842 on his life and reign.")],
    relations: [
      { name: "Johann Joachim Quantz", wiki: "Johann_Joachim_Quantz", rel: "teacher", note: "Taught him the flute from 1728, and from 1741 served him at court, writing hundreds of flute pieces for him." },
      { name: "Frederick William I of Prussia", wiki: "Frederick_William_I_of_Prussia", rel: "family", note: "His father, who imprisoned him after he tried to flee in 1730 and had his friend Katte executed." },
      { name: "Wilhelmine, Margravine of Brandenburg-Bayreuth", wiki: "Wilhelmine,_Margravine_of_Brandenburg-Bayreuth", rel: "family", note: "His elder sister, a composer, and his closest confidante." },
      { name: "Voltaire", wiki: "Voltaire", ol: "OL32293A", rel: "friend", note: "They corresponded from 1736; Voltaire lived at his court from 1750 to 1753." },
      { name: "Carl Philipp Emanuel Bach", wiki: "Carl_Philipp_Emanuel_Bach", rel: "served", note: "His court harpsichordist from 1740 until he left for Hamburg in 1768." },
      { name: "Carl Heinrich Graun", wiki: "Carl_Heinrich_Graun", rel: "served", note: "His Kapellmeister from 1740, who led the Berlin opera." },
      { name: "Pierre Louis Maupertuis", wiki: "Pierre_Louis_Maupertuis", rel: "served", note: "President of his Academy in Berlin from 1746." },
      { name: "Johann Sebastian Bach", wiki: "Johann_Sebastian_Bach", rel: "contemporary", note: "Visited him at Potsdam in May 1747 and improvised on a theme the king gave him, then published it as The Musical Offering, dedicated to him." },
      { name: "Jean-Jacques Rousseau", wiki: "Jean-Jacques_Rousseau", ol: "OL29048A", rel: "contemporary", note: "Lived under his protection at Môtiers in Neuchâtel, his principality, from 1762 to 1765." },
    ],
    read: [
      { title: "The Prince", by: "Niccolò Machiavelli", work: "prince", at: p("Anti-Machiavel", "1740"), note: "His Anti-Machiavel answers The Prince chapter by chapter; Voltaire saw it through the press in 1740." },
      { title: "La Henriade", by: "Voltaire", at: p("Preface to the Henriade", "1739"), note: "He wrote a preface for an edition of Voltaire's epic." },
    ],
    from: [ab("14476", "Letters on England", "Voltaire", "The book that made Voltaire famous, three years before Frederick first wrote to him.")],
    later: [
      iot("1u2aacv1mu5zaq", "Frederick the Great", "The king of Prussia, his wars, his flute and Voltaire."),
      ab("5853", "With Frederick The Great", "G. A. Henty", "A novel for boys of 1898, set in the Seven Years' War: fiction, not history."),
    ],
    articles: [
      { title: "Anti-Machiavel", note: "His answer to The Prince." },
      { title: "The Musical Offering", note: "Bach's work on the king's theme." },
      { title: "Sanssouci", note: "His summer palace at Potsdam." },
      { title: "Seven Years' War", note: "The war he fought against Austria, France and Russia." },
    ],
  },
];
