/**
 * The Middle Ages (Torian, 2026-11-16 04:02Z, "People and eras"): Augustine, Boethius, Charlemagne, Hildegard of
 * Bingen, Thomas Aquinas and Dante. Augustine, Boethius and Aquinas wrote about music and Hildegard composed it, so
 * their sections start in their own words or their own songs; Charlemagne and Dante have none, and their pages show the
 * era's music as their time. Citations use the standard divisions: book and chapter for the Confessions, book and
 * prose for the Consolation, chapter for Einhard, part, question and article for the Summa, canto and line for the
 * Comedy.
 *
 * Quotations are from translations in the public domain: Pusey's Confessions (1838), James's Consolation (1897),
 * Grant's Einhard (1905), the English Dominican Fathers' Summa (1911-1925), and Longfellow's Dante (1867). Hildegard's
 * letters and Dante's Convivio are cited without words, for want of a public-domain translation checked here.
 * Pure: no I/O.
 */
import { ab, iot } from "./collections";
import { p, type Person } from "./historical";
import { BREVES_DIES, O_FRONDENS, O_FRONDENS_LIVE, PANGE_LINGUA, RESURREXI, RORATE, SANTA_MARIA } from "./topic-medieval";

const PUSEY = "Pusey";
const JAMES = "James";
const GRANT = "Grant";
const DOMINICANS = "Fathers of the English Dominican Province";
const LONGFELLOW = "Longfellow";

const CONFESSIONS_IOT = iot("xbxyh1i3vt4s", "Augustine's Confessions", "Scholars on the book and the man.");
const COMEDY = ab("67", "Divine Comedy", "Dante Alighieri");

export const MEDIEVAL: readonly Person[] = [
  {
    id: "augustine", name: "Augustine", wiki: "Augustine_of_Hippo", ol: "OL22060A", born: "354", died: "430", place: "Thagaste, Carthage, Milan and Hippo",
    what: "Bishop of Hippo, theologian and philosopher",
    about: "Born in Roman North Africa, he taught rhetoric in Carthage, Rome and Milan, and was baptised by Ambrose in 387. As bishop of Hippo for over thirty years he wrote the Confessions, the City of God and hundreds of letters and sermons. He died while the Vandals besieged the city.",
    era: "medieval", topics: ["medieval"],
    start: "confessions",
    works: ["confessions", "city-of-god", "christian-doctrine", "enchiridion-augustine"],
    music: {
      stance: "own",
      words: [
        p("confessions", "IX, 6", "How did I weep, in Thy Hymns and Canticles, touched to the quick by the voices of Thy sweet-attuned Church!", PUSEY),
        p("confessions", "X, 33", "Yet when it befalls me to be more moved with the voice than the words sung, I confess to have sinned penally, and then had rather not hear music.", PUSEY),
      ],
      rules: [
        { what: "Singing in church", kind: "song", verdict: "kept", why: "He inclines to approve it, so that by the delight of the ears the weaker minds may rise to devotion.", at: p("confessions", "X, 33") },
        { what: "Hymns and psalms sung by the people", kind: "song", verdict: "kept", why: "Begun at Milan under Ambrose after the manner of the Eastern churches, so that the people should not grow faint from sorrow.", at: p("confessions", "IX, 7") },
        { what: "Being moved by the voice more than the words", kind: "song", verdict: "warned", why: "When the singing moves him more than what is sung, he counts it a sin.", at: p("confessions", "X, 33") },
      ],
      time: [RESURREXI, RORATE],
      timeNote: "No music from Augustine's lifetime survives with its notes. These are Gregorian chants, written down in the West from the 9th century: one line of melody sung to Latin words.",
      people: [
        { name: "Ambrose", wiki: "Ambrose", note: "Bishop of Milan, who brought the singing of hymns and psalms to his church in 386 and wrote hymns of his own (Confessions IX, 7)." },
      ],
      ages: [],
    },
    relations: [
      { name: "Ambrose", wiki: "Ambrose", rel: "teacher", note: "Bishop of Milan, whose sermons he went to hear and who baptised him at Easter 387 (Confessions V, 13; IX, 6)." },
      { name: "Monica", wiki: "Saint_Monica", rel: "family", note: "His mother, who followed him to Milan and died at Ostia on the way home in 387 (Confessions IX, 11)." },
      { name: "Adeodatus", wiki: "Adeodatus", rel: "family", note: "His son, baptised with him when not quite fifteen, who died young (Confessions IX, 6)." },
      { name: "Alypius of Thagaste", wiki: "Alypius_of_Thagaste", rel: "friend", note: "His friend and former pupil from Thagaste, with him in the garden at Milan and baptised with him (Confessions VI, 7; VIII, 12)." },
      { name: "Jerome", wiki: "Jerome", rel: "friend", note: "The translator of the Bible into Latin, with whom he exchanged letters about Scripture for over twenty years." },
      { name: "Possidius", wiki: "Possidius", rel: "friend", note: "Bishop of Calama, a member of his community at Hippo, who wrote his Life soon after he died." },
      { name: "Simplician", wiki: "Simplician", rel: "contemporary", note: "Priest of Milan, later Ambrose's successor, who told him how Victorinus became a Christian (Confessions VIII, 2)." },
      { name: "Faustus of Mileve", wiki: "Faustus_of_Mileve", rel: "contemporary", note: "The Manichaean bishop he met at Carthage in his twenty-ninth year (Confessions V, 3)." },
    ],
    read: [
      { title: "Hortensius", by: "Cicero", at: p("confessions", "III, 4", "This book of his contains an exhortation to philosophy, and is called \"Hortensius.\" But this book altered my affections, and turned my prayers to Thyself O Lord", PUSEY), note: "Read in his nineteenth year at Carthage. The book is lost." },
      { title: "Aeneid", by: "Virgil", item: ab("1718", "Aeneid", "Virgil"), at: p("confessions", "I, 13", "I was forced to learn the wanderings of one Aeneas, forgetful of my own, and to weep for dead Dido, because she killed herself for love", PUSEY), note: "Learned at school as a boy." },
      { title: "Categories", by: "Aristotle", at: p("confessions", "IV, 16"), note: "He read it at about twenty and says he understood it without a teacher." },
      { title: "Books of the Platonists", by: "Plotinus and Porphyry", item: ab("10957", "Enneads", "Plotinus"), at: p("confessions", "VII, 9", "certain books of the Platonists, translated from Greek into Latin.", PUSEY), note: "He does not name them; he says Victorinus translated them (VIII, 2). Most scholars take them to be Plotinus and Porphyry." },
      { title: "Letter to the Romans", by: "Paul", item: ab("5288", "Romans", "King James Version"), at: p("confessions", "VIII, 12", "I seized, opened, and in silence read that section on which my eyes first fell", PUSEY), note: "Romans 13:13-14, read in the garden at Milan in 386." },
    ],
    aboutThem: [ab("18048", "Saint Augustin", "Louis Bertrand", "A life by a French novelist, 1913.")],
    from: [ab("932", "On the Duties of the Clergy", "Saint Ambrose", "By the bishop of Milan who baptised him.")],
    later: [CONFESSIONS_IOT, iot("voalzj1m9v9xm", "The Pelagian Controversy", "The dispute over grace and free will in which he wrote for twenty years."), iot("1ghat29zgix7w", "Neoplatonism", "Plotinus and the Platonists whose books he read in Milan.")],
    articles: [
      { title: "Saint Monica", note: "His mother." },
      { title: "Hortensius (Cicero)", note: "The lost book that turned him to philosophy." },
      { title: "Ambrosian chant", note: "The chant of the church of Milan, named for Ambrose." },
    ],
  },
  {
    id: "boethius", name: "Boethius", wiki: "Boethius", ol: "OL143103A", born: "about 480", died: "524", place: "Rome and Pavia",
    what: "Roman senator, philosopher and translator",
    about: "A Roman of the old senatorial families under the Ostrogothic king Theodoric, he set out to translate Aristotle and Plato into Latin, and wrote textbooks on arithmetic and music that schools used for centuries. Accused of treason, he wrote the Consolation of Philosophy in prison before he was executed.",
    era: "medieval", topics: ["medieval"],
    start: "consolation",
    works: ["consolation", "theological-tractates"],
    music: {
      stance: "own",
      words: [
        p("consolation", "II, prose 1", "Wherefore I call to my aid the sweet persuasiveness of Rhetoric, who then only walketh in the right way when she forsakes not my instructions, and Music, my handmaid, I bid to join with her singing, now in lighter, now in graver strain.", JAMES),
      ],
      rules: [],
      time: [RESURREXI, RORATE],
      timeNote: "No music from his lifetime survives with its notes. These are Gregorian chants, written down from the 9th century in schools that learned music theory from his textbook On Music.",
      people: [],
      ages: [],
    },
    relations: [
      { name: "Symmachus", wiki: "Quintus_Aurelius_Memmius_Symmachus", rel: "family", note: "His father-in-law, who brought him up; Philosophy reminds him in prison that Symmachus is safe (Consolation II, prose 4)." },
      { name: "Theodoric the Great", wiki: "Theodoric_the_Great", rel: "ruler", note: "The Ostrogothic king of Italy who made him master of offices in 522, then had him imprisoned and executed." },
      { name: "Cassiodorus", wiki: "Cassiodorus", rel: "contemporary", note: "Followed him as Theodoric's master of offices in 523." },
      { name: "Albinus", wiki: "Caecina_Decius_Faustus_Albinus", rel: "contemporary", note: "The senator accused of treason whom he defended, which brought the charge on himself (Consolation I, prose 4)." },
    ],
    read: [
      { title: "Republic", by: "Plato", work: "republic", at: p("consolation", "I, prose 4", "that states would be happy, either if philosophers ruled them, or if it should so befall that their rulers would turn philosophers.", JAMES), note: "He gives it as his reason for entering public life (Republic V, 473d)." },
      { title: "Timaeus", by: "Plato", work: "timaeus", at: p("consolation", "III, prose 9", "as Plato maintains in the \"Timæus,\" we ought even in the most trivial matters to implore the Divine protection", JAMES), note: "The poem that follows, Book III, metre 9, is drawn from the Timaeus." },
      { title: "Physics", by: "Aristotle", item: ab("7322", "Physics", "Aristotle"), at: p("consolation", "V, prose 1"), note: "Philosophy gives Aristotle's definition of chance from the Physics." },
    ],
    from: [ab("5571", "Rule of St. Benedict", "Saint Benedict of Nursia", "Written in Italy in the years after his death.")],
    later: [iot("cr4x2f5hyo5y", "The Consolations of Philosophy", "Scholars on Boethius and his prison book."), iot("15byn5amko4yd", "The Music of the Spheres", "The idea, from Plato's Timaeus, that the heavens make music; his On Music passed it to the Middle Ages.")],
    articles: [
      { title: "Theodoric the Great", note: "The king he served." },
      { title: "Ostrogothic Kingdom", note: "The Gothic kingdom of Italy in his day." },
      { title: "Musica universalis", note: "The music of the spheres, the first of the three kinds of music in his On Music." },
    ],
  },
  {
    id: "charlemagne", name: "Charlemagne", wiki: "Charlemagne", born: "748", died: "814", place: "The Frankish kingdom; Aachen",
    what: "King of the Franks from 768, emperor from 800",
    about: "King of the Franks after his father Pepin, he conquered the Lombards, the Saxons and much of western Europe, and was crowned emperor in Rome on Christmas Day 800. He gathered scholars to his court at Aachen, had books copied and schools opened, and never learned to write well himself (Einhard 25).",
    era: "medieval", topics: ["medieval"],
    start: "life-of-charlemagne",
    works: [],
    aboutWorks: ["life-of-charlemagne", "song-of-roland"],
    aboutThem: [
      ab("1783", "Life of Charlemagne", "Notker the Stammerer", "Stories of the emperor told by a monk of St Gall some seventy years after his death."),
      ab("3518", "Legends of Charlemagne", "Thomas Bulfinch", "The later legends of the emperor and his knights, retold in 1863."),
    ],
    relations: [
      { name: "Peter of Pisa", wiki: "Peter_of_Pisa", rel: "teacher", note: "Taught him grammar, as an old man (Einhard 25)." },
      { name: "Alcuin", wiki: "Alcuin", rel: "teacher", note: "Taught him rhetoric, dialectic and astronomy; Einhard calls him the most learned man of his time (Einhard 25)." },
      { name: "Pepin the Short", wiki: "Pepin_the_Short", rel: "family", note: "His father, made king of the Franks in place of the last Merovingian (Einhard 3)." },
      { name: "Carloman I", wiki: "Carloman_I", rel: "family", note: "His brother, with whom he shared the kingdom from 768 until Carloman died in 771 (Einhard 3)." },
      { name: "Hildegard", wiki: "Hildegard_(queen)", rel: "family", note: "His wife from 771, mother of Louis the Pious (Einhard 18)." },
      { name: "Louis the Pious", wiki: "Louis_the_Pious", rel: "family", note: "His son, whom he crowned co-emperor at Aachen in 813 and who ruled after him (Einhard 30)." },
      { name: "Einhard", wiki: "Einhard", ol: "OL51204A", rel: "served", note: "Grew up at his court and served him, and wrote his Life after his death." },
      { name: "Paul the Deacon", wiki: "Paul_the_Deacon", rel: "served", note: "The Lombard historian, at his court in the 780s." },
      { name: "Pope Leo III", wiki: "Pope_Leo_III", rel: "contemporary", note: "Attacked by the Romans, he turned to Charlemagne, and in Rome gave him the title of emperor (Einhard 28)." },
      { name: "Harun al-Rashid", wiki: "Harun_al-Rashid", rel: "contemporary", note: "The caliph of Baghdad, who exchanged embassies with him and sent him an elephant (Einhard 16)." },
    ],
    read: [
      { title: "City of God", by: "Augustine", work: "city-of-god", at: p("life-of-charlemagne", "24", "He took delight also in the books of Saint Augustine, and especially in those which are entitled the City of God.", GRANT), note: "Read aloud to him at meals, with histories." },
    ],
    from: [],
    later: [
      iot("1tymtaa1ti62d", "The Carolingian Renaissance", "His court and its learning."),
      iot("f6s5ze1b5yq9", "Alcuin", "The scholar from York who taught him."),
      iot("x2pp5j1uz5wde", "The Song of Roland", "The epic made of his war in Spain three centuries later."),
    ],
    articles: [
      { title: "Carolingian Renaissance", note: "The revival of learning at his court." },
      { title: "Alcuin", note: "His teacher." },
      { title: "Pope Leo III", note: "The pope who crowned him." },
    ],
  },
  {
    id: "hildegard-of-bingen", name: "Hildegard of Bingen", wiki: "Hildegard_of_Bingen", ol: "OL137661A", born: "1098", died: "1179", place: "Disibodenberg and Rupertsberg, near Bingen",
    what: "Benedictine abbess, writer and composer",
    about: "Given to the religious life as a child, she led the women's community at Disibodenberg and then founded her own at Rupertsberg near Bingen. She wrote down her visions in Scivias and two later books, wrote on medicine and nature, and composed songs and a sung play, Ordo Virtutum.",
    era: "medieval", topics: ["medieval"],
    start: O_FRONDENS,
    works: [],
    by: [O_FRONDENS, O_FRONDENS_LIVE],
    music: {
      stance: "own",
      words: [p("Letter to the prelates of Mainz", "1178")],
      rules: [],
      time: [O_FRONDENS, O_FRONDENS_LIVE],
      timeNote: "Her own songs. More than seventy survive with their melodies, as well as her play Ordo Virtutum.",
      people: [],
      ages: [],
    },
    relations: [
      { name: "Jutta von Sponheim", wiki: "Jutta_von_Sponheim", rel: "teacher", note: "The noblewoman she was enclosed with at Disibodenberg as a girl; she led the community after Jutta died in 1136." },
      { name: "Volmar", wiki: "Volmar_(monk)", rel: "friend", note: "Monk of Disibodenberg who wrote down her visions as her secretary until he died in 1173." },
      { name: "Richardis von Stade", wiki: "Richardis_von_Stade", rel: "friend", note: "A nun who helped her with Scivias, then left to become abbess of Bassum and died in 1152." },
      { name: "Guibert of Gembloux", wiki: "Guibert_of_Gembloux", rel: "friend", note: "A monk who became her secretary in her last years." },
      { name: "Bernard of Clairvaux", wiki: "Bernard_of_Clairvaux", rel: "friend", note: "She wrote to him about her visions in 1146 or 1147, and he answered." },
      { name: "Pope Eugene III", wiki: "Pope_Eugene_III", rel: "patron", note: "Had part of Scivias read at the synod of Trier in 1147-48 and told her to go on writing." },
      { name: "Frederick Barbarossa", wiki: "Frederick_Barbarossa", rel: "ruler", note: "The emperor, who received her at his palace at Ingelheim and to whom she wrote letters." },
    ],
    read: [
      { title: "Psalms and Gospels", by: "The Bible", at: p("Scivias", "Declaration"), note: "She says that in 1141 she suddenly understood the meaning of the Psalter, the Gospels and the other books of both Testaments." },
    ],
    from: [
      ab("481", "On Loving God", "Saint Bernard of Clairvaux", "By the abbot she wrote to about her visions."),
      ab("1107", "Love Letters of Abelard and Heloise", "Pierre Abélard, Héloïse d'Argenteuil", "Letters of two of her contemporaries in France."),
    ],
    later: [iot("1tw3hk21jnfdc5", "Hildegard of Bingen", "The abbess, her visions and her music.")],
    articles: [
      { title: "Ordo Virtutum", note: "Her sung play of the soul and the virtues." },
      { title: "Scivias", note: "The book of her visions." },
      { title: "Lingua ignota", note: "The language she made up." },
      { title: "Neume", note: "The signs her melodies were written in." },
    ],
  },
  {
    id: "thomas-aquinas", name: "Thomas Aquinas", wiki: "Thomas_Aquinas", ol: "OL38887A", born: "1225", died: "1274", place: "Roccasecca, Paris, Cologne and Naples",
    what: "Dominican friar, theologian and philosopher",
    about: "Born near Aquino, he joined the Dominicans against his family's wishes, studied under Albertus Magnus, and taught theology at Paris, in Italy and at Naples. He brought Aristotle's philosophy into Christian theology in the Summa Theologica, which he left unfinished, and wrote the office for the feast of Corpus Christi.",
    era: "medieval", topics: ["medieval"],
    start: "summa-theologica",
    works: ["summa-theologica"],
    by: [PANGE_LINGUA],
    music: {
      stance: "own",
      words: [
        p("summa-theologica", "II-II, q. 91, a. 2", "Hence the use of music in the divine praises is a salutary institution, that the souls of the faint-hearted may be the more incited to devotion.", DOMINICANS),
      ],
      rules: [
        { what: "Chant sung for devotion", kind: "song", verdict: "kept", why: "The singer who chants for devotion attends more to the words, and hearers who do not follow them still know why it is sung.", at: p("summa-theologica", "II-II, q. 91, a. 2, reply 5") },
        { what: "Harp, flute and other instruments in worship", kind: "instrument", verdict: "warned", why: "They move the soul to pleasure rather than to a good disposition; the Old Law used them for a people that needed rousing.", at: p("summa-theologica", "II-II, q. 91, a. 2, reply 4") },
        { what: "Theatrical singing", kind: "song", verdict: "warned", why: "Singing in church to show off or to give pleasure, which is what Jerome reproved.", at: p("summa-theologica", "II-II, q. 91, a. 2, reply 2") },
      ],
      time: [PANGE_LINGUA, BREVES_DIES, SANTA_MARIA],
      timeNote: "His own hymn, sung to its plainchant melody, and music of his century: a song of the Notre Dame school in Paris, and one from the court of Alfonso X of Castile.",
      people: [
        { name: "Pérotin", wiki: "Pérotin", note: "Composer at Notre Dame in Paris around 1200, a generation before Aquinas taught in the city." },
        { name: "Alfonso X of Castile", wiki: "Alfonso_X_of_Castile", note: "King of Castile from 1252, at whose court the Cantigas de Santa Maria were gathered." },
      ],
      ages: [],
    },
    relations: [
      { name: "Albertus Magnus", wiki: "Albertus_Magnus", rel: "teacher", note: "His teacher at Paris and at Cologne from 1248; Dante puts them side by side in Paradise (Paradiso X, 97-99)." },
      { name: "Reginald of Piperno", wiki: "Reginald_of_Piperno", rel: "friend", note: "Dominican friar who was his companion and secretary in his last years." },
      { name: "Pope Urban IV", wiki: "Pope_Urban_IV", rel: "patron", note: "Instituted the feast of Corpus Christi in 1264, for which Aquinas wrote the office." },
      { name: "Bonaventure", wiki: "Bonaventure", rel: "contemporary", note: "The Franciscan theologian, received with him as a master at Paris in 1257." },
    ],
    read: [
      { title: "Metaphysics", by: "Aristotle", work: "metaphysics", at: p("summa-theologica", "I, q. 2, a. 3"), note: "The fourth of his five ways cites Metaphysics II." },
      { title: "Politics", by: "Aristotle", work: "politics", at: p("summa-theologica", "II-II, q. 91, a. 2", "As the Philosopher says (Polit. viii, 6), \"Teaching should not be accompanied with a flute or any artificial instrument such as the harp or anything else of this kind: but only with such things as make good hearers.\"", DOMINICANS), note: "\"The Philosopher\" is his name for Aristotle." },
      { title: "On the Two Natures", by: "Boethius", work: "theological-tractates", at: p("summa-theologica", "I, q. 29, a. 1"), note: "He defends Boethius' definition of a person as an individual substance of a rational nature." },
      { title: "Enchiridion", by: "Augustine", work: "enchiridion-augustine", at: p("summa-theologica", "I, q. 2, a. 3", "As Augustine says (Enchiridion xi): \"Since God is the highest good, He would not allow any evil to exist in His works, unless His omnipotence and goodness were such as to bring good even out of evil.\"", DOMINICANS), note: "His answer to the objection that evil shows there is no God." },
      { title: "Confessions", by: "Augustine", work: "confessions", at: p("summa-theologica", "II-II, q. 91, a. 2"), note: "He quotes Confessions IX and X on singing in church." },
    ],
    from: [],
    later: [
      iot("1kf8hj6xut2jp", "St Thomas Aquinas", "His life, works and influence."),
      iot("1argen01ya33d3", "The Medieval University", "The first universities, among them Paris, where he taught."),
      { ...COMEDY, why: "Dante, born when Aquinas was forty, puts him among the wise in the Heaven of the Sun (Paradiso X)." },
    ],
    articles: [
      { title: "Scholasticism", note: "The method of the schools: questions, objections and replies." },
      { title: "Pange lingua gloriosi corporis mysterium", note: "His hymn for Corpus Christi." },
      { title: "Adoro te devote", note: "A eucharistic hymn ascribed to him." },
      { title: "Feast of Corpus Christi", note: "The feast he wrote the office for." },
    ],
  },
  {
    id: "dante-alighieri", name: "Dante Alighieri", wiki: "Dante_Alighieri", ol: "OL29303A", born: "1265", died: "1321", place: "Florence, Verona and Ravenna",
    what: "Poet and Florentine statesman",
    about: "A Florentine who served as one of the city's priors in 1300, he was exiled in 1302 and never returned. In exile he wrote the Convivio, a book on the Italian language, the Monarchia and the Divine Comedy, which he finished in Ravenna shortly before he died.",
    era: "medieval", topics: ["medieval"],
    start: "divine-comedy",
    works: ["divine-comedy", "vita-nuova", "convivio", "monarchia"],
    by: [ab("8836", "Canzoniere", "Dante Alighieri", "His lyric poems."), ab("9496", "Epistolae, the letters of Dante", "Dante Alighieri", "His letters from exile.")],
    aboutThem: [ab("10373", "Early Lives of Dante", "Giovanni Boccaccio, Leonardo Bruni", "Boccaccio's life from the 1350s and Bruni's of 1436.")],
    relations: [
      { name: "Brunetto Latini", wiki: "Brunetto_Latini", rel: "teacher", note: "The Florentine writer and statesman whom Dante thanks in Hell for teaching him how a man becomes eternal (Inferno XV, 85)." },
      { name: "Guido Cavalcanti", wiki: "Guido_Cavalcanti", rel: "friend", note: "The poet he calls the first of his friends (Vita Nuova III)." },
      { name: "Gemma Donati", wiki: "Gemma_Donati", rel: "family", note: "His wife, of the Donati family, betrothed to him in 1277." },
      { name: "Beatrice Portinari", wiki: "Beatrice_Portinari", rel: "contemporary", note: "The Florentine woman of the Vita Nuova, who died in 1290 and is his guide in Paradise." },
      { name: "Cangrande della Scala", wiki: "Cangrande_I_della_Scala", rel: "patron", note: "Lord of Verona, who sheltered him in exile; Dante praises him in Paradiso XVII." },
      { name: "Guido da Polenta", wiki: "Guido_II_da_Polenta", rel: "patron", note: "Lord of Ravenna, where Dante spent his last years and died." },
      { name: "Pope Boniface VIII", wiki: "Pope_Boniface_VIII", rel: "ruler", note: "Florence sent Dante to him in 1301, and Dante's party fell while he was away; the Comedy foretells the pope's place in Hell (Inferno XIX)." },
      { name: "Henry VII", wiki: "Henry_VII,_Holy_Roman_Emperor", rel: "ruler", note: "The emperor whose coming to Italy Dante urged in letters to the princes, to Florence and to Henry himself (Epistles V-VII)." },
    ],
    read: [
      { title: "Aeneid", by: "Virgil", item: ab("1718", "Aeneid", "Virgil"), at: p("divine-comedy", "Inferno I, 85", "Thou art my master, and my author thou", LONGFELLOW), note: "Virgil is his guide through Hell and Purgatory." },
      { title: "The Consolation of Philosophy", by: "Boethius", work: "consolation", at: p("convivio", "II, 12"), note: "After Beatrice died he read it for comfort, he says, with Cicero's On Friendship." },
      { title: "On Friendship", by: "Cicero", item: ab("13377", "Treatises On Friendship And Old Age", "Cicero"), at: p("convivio", "II, 12"), note: "Read with Boethius after Beatrice's death." },
    ],
    from: [ab("1939", "Decameron", "Giovanni Boccaccio", "By the Florentine who wrote his first life and lectured on the Comedy in 1373.")],
    later: [
      iot("abi3ho17t7087", "Dante's Inferno", "The nine circles of Hell."),
      iot("sjf50m4t6v5x", "Purgatory", "The idea he gave a mountain to."),
      ab("18690", "Prophecy of Dante", "Lord Byron", "Byron's poem in Dante's voice, written at Ravenna in 1819."),
    ],
    articles: [
      { title: "Guelphs and Ghibellines", note: "The parties of the Florence that exiled him." },
      { title: "La Vita Nuova", note: "His book for Beatrice." },
      { title: "Beatrice Portinari", note: "Who she was." },
      { title: "Convivio", note: "His unfinished banquet of learning." },
    ],
  },
];
