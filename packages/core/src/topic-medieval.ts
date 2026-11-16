/**
 * The Middle Ages (Torian, 2026-11-16 04:02Z, "People and eras"): Augustine to Dante and Chaucer, the books of the
 * monasteries, courts and universities, with the chant and song of the churches they sang in. Every work page plays a
 * LibriVox recording from the catalogue; the Music form holds free recordings from Wikimedia Commons that Reflect
 * plays itself, each with its performer and licence. Pure: no I/O.
 */
import type { TopicForm, TopicPage, Work } from "./topic-pages";
import { commons, iot } from "./collections";

/** Free recordings of the era's music that Reflect plays itself, shared with the people pages. */
export const RESURREXI = commons("9/9b", "The Tudor Consort - 02 - Introit - Resurrexi et Adhuc Tecum Sum.ogg", "Introit: Resurrexi", "Gregorian chant; The Tudor Consort", "The Tudor Consort, CC BY 3.0", "The Easter introit of the Roman rite: Gregorian chant, written down in the West from the 9th century.");
export const RORATE = commons("f/f8", "Rorate Caeli ~ Gregorian Chant.ogg", "Rorate caeli", "Gregorian chant; sung by Inritter", "Inritter, CC BY-SA 4.0", "An Advent chant on words of Isaiah, sung as one line of melody.");
export const VICTIMAE = commons("5/52", "The Tudor Consort - 09 - Sequence - Victimae Paschali Laudes.ogg", "Victimae paschali laudes", "Sequence attributed to Wipo of Burgundy, 11th century; The Tudor Consort", "The Tudor Consort, CC BY 3.0", "The Easter sequence, attributed to Wipo, chaplain to the emperor Conrad II.");
export const O_FRONDENS = commons("a/ad", "O frondens 2.ogg", "O frondens virga", "Hildegard of Bingen, 12th century; sung by Makemi", "Makemi, Public domain", "An antiphon to the Virgin by Hildegard, abbess of Rupertsberg.");
export const O_FRONDENS_LIVE = commons("3/37", "O frondens.ogg", "O frondens virga (another performance)", "Hildegard of Bingen, 12th century; sung by Makemi", "Makemi, CC BY-SA 3.0", "The same antiphon, sung live.");
export const BREVES_DIES = commons("d/dd", "Breves dies hominis.ogg", "Breves dies hominis", "Leonin or Perotin, Paris, about 1200; sung by Makemi", "Makemi, Public domain", "A song from the Notre Dame school in Paris on how short a man's days are.");
export const SANTA_MARIA = commons("1/13", "Santa Maria.ogg", "Santa Maria, strela do dia", "Cantigas de Santa Maria, no. 100, court of Alfonso X of Castile, 13th century; sung by Makemi", "Makemi, Public domain", "One of the songs to the Virgin gathered at the court of Alfonso X, in Galician-Portuguese.");
export const PANGE_LINGUA = commons("0/01", "Pange Lingua Latin in Latin.ogg", "Pange lingua gloriosi", "Thomas Aquinas, 1264; sung by Gareth Hughes", "Gareth Hughes, CC BY-SA 3.0", "Aquinas' hymn for the feast of Corpus Christi, sung to its plainchant melody in the third mode.");

const W = (id: string, title: string, by: string, when: string, form: string, about: string, audiobooks: string[], versions: Work["versions"] = []): Work =>
  ({ id, title, by, when, topic: "medieval", form, about, audiobooks, versions });

export const MEDIEVAL_WORKS: readonly Work[] = [
  W("confessions", "Confessions", "Augustine", "about 397 to 400", "philosophy", "Augustine's life to his conversion and his mother's death, told as a prayer to God.", ["754", "2601"], [
    { group: "understand", item: iot("xbxyh1i3vt4s", "Augustine's Confessions", "Scholars on the book and the man.") },
  ]),
  W("city-of-god", "City of God", "Augustine", "413 to 426", "philosophy", "Written after the sack of Rome in 410: the city of this world and the city of God, from the beginning to the end of time.", ["1691"]),
  W("christian-doctrine", "On Christian Doctrine", "Augustine", "396 to 426", "philosophy", "How to read Scripture and how to teach what it says.", ["13724"]),
  W("enchiridion-augustine", "Enchiridion", "Augustine", "about 421", "philosophy", "A short handbook on faith, hope and love, written for a layman who asked for one.", ["1047"]),
  W("consolation", "The Consolation of Philosophy", "Boethius", "about 524", "philosophy", "Written in prison awaiting execution: Philosophy comes to Boethius as a woman and talks him out of despair.", ["85", "14650"], [
    { group: "understand", item: iot("cr4x2f5hyo5y", "The Consolations of Philosophy", "Scholars on Boethius and his prison book.") },
  ]),
  W("theological-tractates", "Theological Tractates", "Boethius", "early 6th century", "philosophy", "Short treatises on the Trinity and the nature of Christ, using Aristotle's logic.", ["20041"]),
  W("rule-of-benedict", "Rule of St. Benedict", "Benedict of Nursia", "about 530", "philosophy", "The rule for monks that most Western monasteries came to live by: prayer, work and reading.", ["5571"]),
  W("summa-theologica", "Summa Theologica", "Thomas Aquinas", "1265 to 1274", "philosophy", "The whole of theology set out as questions, each with objections, an answer and replies. He left it unfinished.", ["2443", "9618"], [
    { group: "understand", item: iot("1kf8hj6xut2jp", "St Thomas Aquinas", "His life, works and influence.") },
  ]),
  W("convivio", "Convivio", "Dante Alighieri", "about 1304 to 1307", "philosophy", "A banquet of learning in Italian: Dante's own poems with long commentaries on them. Unfinished.", ["8834"]),
  W("monarchia", "Monarchia", "Dante Alighieri", "1310s", "philosophy", "Dante's Latin argument that the emperor's authority comes from God directly, not through the pope.", ["8972"]),
  W("divine-comedy", "Divine Comedy", "Dante Alighieri", "about 1308 to 1320", "poetry", "Dante's journey through Hell and Purgatory with Virgil, and through Paradise with Beatrice.", ["67", "8944"], [
    { group: "understand", item: iot("abi3ho17t7087", "Dante's Inferno", "The nine circles of Hell.") },
    { group: "understand", item: iot("sjf50m4t6v5x", "Purgatory", "The idea Dante gave a mountain to.") },
  ]),
  W("vita-nuova", "La Vita Nuova", "Dante Alighieri", "about 1294", "poetry", "Dante's poems for Beatrice, with the prose story of how he wrote them.", ["8536"]),
  W("beowulf", "Beowulf", "Unknown", "manuscript about 1000", "poetry", "An Old English poem of a hero who kills a monster and its mother, and dies fighting a dragon.", ["8103", "151"], [
    { group: "understand", item: iot("17lr653msauri", "Beowulf", "The poem and its world.") },
  ]),
  W("song-of-roland", "The Song of Roland", "Anonymous", "about 1100", "poetry", "Charlemagne's rearguard destroyed at Roncevaux, and Roland who would not blow his horn for help.", ["2904"], [
    { group: "understand", item: iot("x2pp5j1uz5wde", "The Song of Roland", "The French epic and the battle behind it.") },
  ]),
  W("gawain", "Sir Gawain and the Green Knight", "The Gawain Poet", "late 14th century", "poetry", "A knight of Arthur's court keeps a bargain with a green giant.", ["2054", "10513"]),
  W("canterbury-tales", "The Canterbury Tales", "Geoffrey Chaucer", "about 1387 to 1400", "poetry", "Pilgrims on the road to Canterbury tell stories to win a free supper.", ["342"], [
    { group: "understand", item: iot("14wnjwxwx51tw", "Chaucer", "The poet and his England.") },
  ]),
  W("bede-history", "Ecclesiastical History of the English People", "Bede", "731", "lives", "England from the Romans to Bede's own day, by a monk of Jarrow.", ["6395"], [
    { group: "understand", item: iot("1ejt0ef1jfkwjy", "The Venerable Bede", "The monk who wrote England's first history.") },
  ]),
  W("life-of-benedict", "Life of St. Benedict", "Pope Gregory I", "593 to 594", "lives", "The life and miracles of the founder of Monte Cassino, from the second book of Gregory's Dialogues.", ["18287"]),
  W("life-of-charlemagne", "Life of Charlemagne", "Einhard", "about 830", "lives", "The emperor as a man of his court remembered him: his wars, his family, his habits and his learning.", ["1536"], [
    { group: "understand", item: iot("1tymtaa1ti62d", "The Carolingian Renaissance", "Charlemagne's court and its learning.") },
  ]),
  W("abelard-heloise", "Letters of Abelard and Heloise", "Héloïse and Pierre Abélard", "12th century", "lives", "Letters between a famous teacher and the pupil he loved, years after they were parted.", ["1107"], [
    { group: "understand", item: iot("1ohmy5t1czeg5w", "Abelard and Heloise", "Their story and their letters.") },
  ]),
];

export const MEDIEVAL_TOPIC: TopicPage = {
  id: "medieval", name: "The Middle Ages", start: "medieval",
  about: "The 5th to the 14th century: Augustine and Boethius at the end of Rome, Benedict's monks, Charlemagne's court, Hildegard's abbey, Aquinas in the universities, Dante and Chaucer, and the chant and song of the churches.",
  forms: [
    { id: "philosophy", label: "Philosophy and theology", where: "North Africa, Italy and Paris, 5th to 14th century", works: ["confessions", "city-of-god", "christian-doctrine", "enchiridion-augustine", "consolation", "theological-tractates", "rule-of-benedict", "summa-theologica", "convivio", "monarchia"] },
    { id: "poetry", label: "Poetry and epic", where: "England, France and Italy, about 1000 to 1400", works: ["divine-comedy", "vita-nuova", "beowulf", "song-of-roland", "gawain", "canterbury-tales"] },
    { id: "lives", label: "Histories, lives and letters", where: "England, Italy and the Frankish kingdom, 6th to 12th century", works: ["bede-history", "life-of-benedict", "life-of-charlemagne", "abelard-heloise"] },
    { id: "music", label: "Music", where: "Churches, abbeys and courts, 11th to 13th century", items: [RESURREXI, RORATE, VICTIMAE, O_FRONDENS, BREVES_DIES, SANTA_MARIA, PANGE_LINGUA] },
    { id: "podcasts", label: "Podcasts", items: [
      iot("xbxyh1i3vt4s", "Augustine's Confessions", "The book and the man."),
      iot("1tymtaa1ti62d", "The Carolingian Renaissance", "Charlemagne's court and its learning."),
      iot("f6s5ze1b5yq9", "Alcuin", "The scholar from York who taught at Charlemagne's court."),
      iot("1tw3hk21jnfdc5", "Hildegard of Bingen", "The abbess, her visions and her music."),
      iot("1argen01ya33d3", "The Medieval University", "Bologna, Paris and the schools that became universities."),
      iot("1kf8hj6xut2jp", "St Thomas Aquinas", "His life, works and influence."),
      iot("abi3ho17t7087", "Dante's Inferno", "The nine circles of Hell."),
    ] },
  ],
  people: [
    { name: "Augustine", wiki: "Augustine_of_Hippo", ol: "OL22060A" },
    { name: "Boethius", wiki: "Boethius", ol: "OL143103A" },
    { name: "Charlemagne", wiki: "Charlemagne" },
    { name: "Einhard", wiki: "Einhard", ol: "OL51204A" },
    { name: "Hildegard of Bingen", wiki: "Hildegard_of_Bingen", ol: "OL137661A" },
    { name: "Thomas Aquinas", wiki: "Thomas_Aquinas", ol: "OL38887A" },
    { name: "Dante Alighieri", wiki: "Dante_Alighieri", ol: "OL29303A" },
  ],
};

/** No forms added to other topics. */
export const MEDIEVAL_FORMS: readonly TopicForm[] = [];
