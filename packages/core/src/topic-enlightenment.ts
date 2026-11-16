/**
 * The Enlightenment (Torian, 2026-11-16 04:02Z, "People and eras"): Locke to Adam Smith, the books on government,
 * the mind and trade that the American founders read, with the music of the courts and cities they lived in. Every
 * work page plays a LibriVox recording from the catalogue; the Music form holds free recordings Reflect plays itself,
 * each with its performer and licence. Pure: no I/O.
 */
import type { TopicForm, TopicPage, Work } from "./topic-pages";
import { ab, commons, iot, type CollectionItem } from "./collections";

/** Free recordings of the era's music that Reflect plays itself, shared with the people pages. */
export const BACH_ARIA = commons("e/e6", "Kimiko Ishizaka - 01 - Aria.ogg", "Goldberg Variations: Aria", "J. S. Bach, 1741; Kimiko Ishizaka, piano", "Kimiko Ishizaka, CC0", "The theme of the variations Bach published in 1741.");
export const OFFERING_TRIO = commons("f/f4", "Disques pro musica-pm107-7001.ogg", "The Musical Offering: Trio sonata, Largo", "J. S. Bach, 1747; Ensemble Pro Musica (André Proffit, violin; Fernand Marseau, flute)", "Ensemble Pro Musica, Public domain", "Bach built the Musical Offering on a theme Frederick the Great gave him at Potsdam in 1747, and wrote its trio sonata with a part for the king's flute.");
export const HALLELUJAH = commons("5/5d", "Handel - Messiah, Part 2 (Scherchen) - 45. Hallelujah.ogg", "Messiah: Hallelujah", "Handel, 1741; London Symphony Orchestra and London Philharmonic Choir, Hermann Scherchen", "Hermann Scherchen, London Symphony Orchestra, Public domain", "The chorus that closes Part Two of the oratorio first heard in Dublin in 1742.");
export const SPRING = commons("f/ff", "Vivaldi - Four Seasons 1 Spring mvt 1 Allegro - John Harrison violin.oga", "The Four Seasons: Spring, Allegro", "Vivaldi, published 1725; John Harrison, violin", "John Harrison, CC BY-SA 4.0", "Concertos printed in Amsterdam in 1725 and played across Europe.");
export const TOURBILLONS = commons("9/93", "Jean-Philippe Rameau - Les Tourbillons (Marcelle Meyer, 1953).flac", "Les Tourbillons", "Rameau, 1724; Marcelle Meyer, piano", "Marcelle Meyer, Public domain", "A harpsichord piece by the leading French composer of the age, whom Rousseau argued with over French music.");
export const QUANTZ_SONATA = commons("6/6f", "Johann Joachim Quantz - Sonata Concertate in D.ogg", "Sonata in D, QV 2:14", "Quantz; Alex Murray, flute; Martha Goldstein, harpsichord", "Martha Goldstein, CC BY-SA 2.0", "By Frederick the Great's flute teacher, who wrote hundreds of pieces for the king to play.");
export const CPE_FLUTE = commons("3/3e", "Carl Philipp Emanuel Bach- Flute Concerto Gmaj - 1. Allegro.ogg", "Flute Concerto in G major: Allegro", "C. P. E. Bach; Advent Chamber Orchestra, Constance Schoepflin, flute", "Advent Chamber Orchestra, CC BY-SA 2.0", "By the son of J. S. Bach who was harpsichordist at Frederick's court and wrote flute music for it.");
export const DEVIN = commons("2/25", "Le Devin du village.ogg", "Le devin du village: Colette's aria", "Jean-Jacques Rousseau, 1752; Martha Angelici, soprano, 1937", "Martha Angelici, Public domain", "Rousseau's one-act opera, first given before Louis XV at Fontainebleau in 1752.");
export const DEVIN_HAHN = commons("1/1a", "L'amour ne sait guère.ogg", "Le devin du village: L'amour ne sait guère", "Jean-Jacques Rousseau, 1752; Reynaldo Hahn, voice, 1911", "Reynaldo Hahn, Public domain", "Another air from the opera, sung by the composer Reynaldo Hahn in 1911.");
export const LARK = commons("c/ca", "Haydn - String Quartet, Op. 64 No. 5 in D major 'The Lark' - I. Allegro moderato (Musopen String Quartet).flac", "String Quartet in D major, Op. 64 No. 5, 'The Lark': Allegro moderato", "Haydn, 1790; Musopen String Quartet", "Musopen String Quartet, Public domain", "Written the year before Haydn's first visit to London.");
export const MOZART_40 = commons("a/a8", "Mozart - Symphony No. 40 in G minor, K550 - I. Molto allegro (Musopen Symphony).flac", "Symphony No. 40 in G minor: Molto allegro", "Mozart, 1788; Musopen Symphony", "Musopen Symphony, Public domain", "Written in Vienna in the summer of 1788, two years after Frederick died.");
export const ENLIGHTENMENT_MUSIC: readonly CollectionItem[] = [SPRING, BACH_ARIA, TOURBILLONS, HALLELUJAH, OFFERING_TRIO, QUANTZ_SONATA, CPE_FLUTE, DEVIN, LARK, MOZART_40];

const W = (id: string, title: string, by: string, when: string, form: string, about: string, audiobooks: string[], versions: Work["versions"] = []): Work =>
  ({ id, title, by, when, topic: "enlightenment", form, about, audiobooks, versions });
const v = (group: Work["versions"][number]["group"], item: CollectionItem) => ({ group, item });

const GLORIOUS = iot("1wvnqs9f02r3c", "The Glorious Revolution", "The change of king in 1688 that Locke's Two Treatises were published to defend.");
const MONTESQUIEU_IOT = iot("1vlxo631kxjuc2", "Montesquieu", "His life, the Persian Letters and The Spirit of the Laws.");
const CANDIDE_IOT = iot("bbstshb9qs2k", "Voltaire's Candide", "The tale, the Lisbon earthquake behind it, and its targets.");
const SOCIAL_IOT = iot("1dxsvffa7g5tm", "The Social Contract", "From Hobbes and Locke to Rousseau.");
const EMILE_IOT = iot("17v5pm8i1pmvv", "Rousseau on Education", "What Emile proposed, and why it was burned.");
const HUME_IOT = iot("1py8m78145uyif", "David Hume", "His life and his philosophy.");
const WEALTH_IOT = iot("12aqr7lznljd8", "The Wealth of Nations", "What Smith argued in 1776, and what he did not.");
const SCOTLAND_IOT = iot("ec0accbc56tz", "The Enlightenment in Scotland", "Hume, Smith, Hutcheson and Edinburgh.");
const BRITAIN_IOT = iot("1t0cp1d1uc8y3k", "The Enlightenment in Britain", "Locke, Newton and the century after them.");
const ENCYCLOPEDIE_IOT = iot("31ho8h1h4w290", "The Encyclopédie", "Diderot and d'Alembert's dictionary of everything.");
const FREDERICK_IOT = iot("1u2aacv1mu5zaq", "Frederick the Great", "The king of Prussia, his wars, his flute and Voltaire.");
const MESSIAH_IOT = iot("113z73b1nd1f3e", "Handel's Messiah", "The oratorio first heard in Dublin in 1742.");

export const ENLIGHTENMENT_WORKS: readonly Work[] = [
  W("two-treatises", "Two Treatises of Government", "John Locke", "1689", "politics", "The first answers Filmer's case for the divine right of kings; the second argues that government rests on the consent of the governed and exists to protect life, liberty and property.", ["2361"], [v("understand", GLORIOUS)]),
  W("toleration", "A Letter Concerning Toleration", "John Locke", "1689", "politics", "Why the state should not compel belief: the care of souls is not the magistrate's business.", ["975"]),
  W("locke-understanding", "An Essay Concerning Human Understanding", "John Locke", "1689", "mind", "Where our ideas come from: not born with us, but from experience, on a mind that begins as white paper.", ["8062", "13243", "13545", "14164"], [v("understand", BRITAIN_IOT)]),
  W("spirit-of-laws", "The Spirit of the Laws", "Montesquieu", "1748", "politics", "How laws fit a people's climate, customs and form of government; Book XI describes the English constitution and the separation of powers.", ["5055"], [v("understand", MONTESQUIEU_IOT)]),
  W("letters-on-england", "Letters on England", "Voltaire", "1733", "lives", "Letters home from three years in England, on the Quakers, Parliament, inoculation, Bacon, Locke, Newton and Shakespeare.", ["14476"]),
  W("candide", "Candide", "Voltaire", "1759", "tales", "A young man taught that all is for the best meets war, earthquake and the Inquisition, and ends by tending his garden.", ["801", "761", "12995"], [v("understand", CANDIDE_IOT)]),
  W("zadig", "Zadig", "Voltaire", "1747", "tales", "A wise young man of Babylon is ruined and raised again by fortune.", ["1250", "16187"]),
  W("inequality", "Discourse on Inequality", "Jean-Jacques Rousseau", "1755", "politics", "How people left the state of nature, and how property made them unequal.", ["1349"]),
  W("social-contract", "The Social Contract", "Jean-Jacques Rousseau", "1762", "politics", "\"Man is born free, and everywhere he is in chains\": how a people can be free under laws they give themselves.", ["2230"], [v("understand", SOCIAL_IOT)]),
  W("emile", "Emile, or On Education", "Jean-Jacques Rousseau", "1762", "mind", "A boy raised away from the city and taught by things before books.", ["10190"], [v("understand", EMILE_IOT)]),
  W("rousseau-confessions", "Confessions", "Jean-Jacques Rousseau", "written 1765 to 1770", "lives", "His life from Geneva to his quarrels in Paris, told against himself.", ["3709", "3895", "4297"]),
  W("hume-treatise", "A Treatise of Human Nature", "David Hume", "1739 to 1740", "mind", "The science of man built on experience: impressions and ideas, cause and effect, the passions and morals.", ["2656", "3349"], [v("understand", HUME_IOT)]),
  W("hume-enquiry", "An Enquiry Concerning Human Understanding", "David Hume", "1748", "mind", "The Treatise's first book rewritten: why we expect the future to be like the past, and on miracles.", ["944"], [v("understand", HUME_IOT)]),
  W("hume-morals", "An Enquiry Concerning the Principles of Morals", "David Hume", "1751", "mind", "Morals founded on sentiment and on what is useful and agreeable; he thought it his best book.", ["7825"]),
  W("hume-dialogues", "Dialogues Concerning Natural Religion", "David Hume", "1779", "mind", "Three friends argue whether the order of the world proves a designer. Published after his death.", ["1093"]),
  W("moral-sentiments", "The Theory of Moral Sentiments", "Adam Smith", "1759", "mind", "Morals from sympathy and the impartial spectator within.", ["2013"], [v("understand", SCOTLAND_IOT)]),
  W("wealth-of-nations", "The Wealth of Nations", "Adam Smith", "1776", "politics", "The division of labour, markets, money and the duties of the state.", ["1756", "2222", "2810", "4069"], [v("understand", WEALTH_IOT)]),
];

export const ENLIGHTENMENT_TOPIC: TopicPage = {
  id: "enlightenment", name: "The Enlightenment", start: "enlightenment",
  about: "Late 17th and 18th centuries: Locke on government and the mind, Montesquieu on laws, Voltaire and Rousseau in France, Hume and Smith in Scotland, Frederick the Great's Prussia, and the music of Bach, Handel, Haydn and Mozart.",
  forms: [
    { id: "politics", label: "Government and trade", where: "England, France and Scotland, 1689 to 1776", works: ["two-treatises", "toleration", "spirit-of-laws", "inequality", "social-contract", "wealth-of-nations"] },
    { id: "mind", label: "Mind and morals", where: "England, Scotland and France, 1689 to 1779", works: ["locke-understanding", "hume-treatise", "hume-enquiry", "hume-morals", "hume-dialogues", "moral-sentiments", "emile"], items: [
      ab("602", "Critique of Pure Reason", "Immanuel Kant", "Kant said Hume woke him from his dogmatic slumber (Prolegomena, Preface); this is the book he wrote after."),
    ] },
    { id: "tales", label: "Tales", where: "France, 1747 to 1759", works: ["candide", "zadig"] },
    { id: "lives", label: "Letters and lives", where: "England, France and Prussia", works: ["letters-on-england", "rousseau-confessions"], items: [
      ab("10469", "Frederic the Great", "Thomas Babington Macaulay", "Macaulay's essay of 1842 on the king's life and reign."),
      ab("1011", "Life of Samuel Johnson, Vol. I", "James Boswell", "London in the same years, by the man who also visited Rousseau and Voltaire."),
    ] },
    { id: "music", label: "Music", where: "Leipzig, London, Potsdam, Paris and Vienna, 1720s to 1790s", items: ENLIGHTENMENT_MUSIC },
    { id: "podcasts", label: "Podcasts", items: [BRITAIN_IOT, SCOTLAND_IOT, GLORIOUS, MONTESQUIEU_IOT, CANDIDE_IOT, ENCYCLOPEDIE_IOT, SOCIAL_IOT, HUME_IOT, WEALTH_IOT, FREDERICK_IOT, MESSIAH_IOT] },
  ],
  people: [
    { name: "John Locke", wiki: "John_Locke", ol: "OL77200A" },
    { name: "Montesquieu", wiki: "Montesquieu", ol: "OL25573A" },
    { name: "Voltaire", wiki: "Voltaire", ol: "OL32293A" },
    { name: "Jean-Jacques Rousseau", wiki: "Jean-Jacques_Rousseau", ol: "OL29048A" },
    { name: "David Hume", wiki: "David_Hume", ol: "OL29349A" },
    { name: "Adam Smith", wiki: "Adam_Smith", ol: "OL39302A" },
    { name: "Frederick the Great", wiki: "Frederick_the_Great" },
  ],
};

export const ENLIGHTENMENT_FORMS: readonly TopicForm[] = [];
