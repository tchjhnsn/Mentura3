// Politics, Rhetoric and Poetics: the practical work on living together, and the two productive arts of the speech and
// the play. Passages are verbatim from the translations named on each course, as published by the MIT Internet Classics
// Archive. The Constitution of the Athenians has no Bekker pages (it was found in 1890), so it is cited by chapter and
// section and its course `bekker` is empty.
import type { Check, Course, Term } from "./types";

const t = (greek: string, translit: string, english: string, gloss: string): Term => ({ greek, translit, english, gloss });
// Checks are written with the right option in any place; `k` rotates the options by a fixed amount taken from the
// question, so the right answer does not sit in the same position lesson after lesson.
const k = (q: string, options: string[], answer: number, why: string): Check => {
  const n = options.length;
  const shift = [...q].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 7) % n;
  return { q, options: options.map((_, i) => options[(i - shift + n) % n]!), answer: (answer + shift) % n, why };
};

const POLITICS: Course = {
  id: "politics",
  title: "Politics",
  greek: "Πολιτικά",
  latin: "Politica",
  subject: "politics",
  level: "Start here",
  bekker: "1252a-1342b",
  about:
    "Aristotle asks what a city is for, who counts as a citizen, which constitutions are just, why cities fall into faction, and what the best city would look like. It continues the Nicomachean Ethics: the good life it describes is lived together, under laws and an education.",
  before: ["nicomachean-ethics"],
  caveat:
    "The eight books may have been written at different times, and scholars have long debated their order; some editors moved Books VII and VIII to follow Book III. This course keeps the traditional order.",
  translation: { translator: "Benjamin Jowett", year: 1885, title: "The Politics of Aristotle", url: "https://classics.mit.edu/Aristotle/politics.html" },
  units: [
    {
      id: "book-1",
      title: "Book I: The household and the city",
      bekker: "1252a-1260b",
      line: "Builds the city up from the household and the village, and asks what rule over slaves, wives, children and wealth should be.",
      lessons: [
        {
          id: "the-city-exists-by-nature",
          title: "The city exists by nature",
          bekker: "1252a1-1253a39",
          minutes: 5,
          summary:
            "Every community aims at some good, and the city, the community that includes all the others, aims at the highest good. Aristotle traces how it grows: man and woman, and master and slave, form the household; households form the village; villages join into the city, which is self-sufficient. The city comes to be for the sake of life and exists for the sake of the good life. So the city is natural, and a human being is by nature a political animal. The sign is speech. Other animals have voice to signal pleasure and pain, but human speech can show what is useful and harmful, and so what is just and unjust. Sharing these perceptions is what makes a household and a city.",
          passage: {
            text:
              "Nature, as we often say, makes nothing in vain, and man is the only animal whom she has endowed with the gift of speech. And whereas mere voice is but an indication of pleasure or pain, and is therefore found in other animals (for their nature attains to the perception of pleasure and pain and the intimation of them to one another, and no further), the power of speech is intended to set forth the expedient and inexpedient, and therefore likewise the just and the unjust.",
            ref: "I.2, 1253a9-15",
          },
          terms: [
            t("πόλις", "polis", "city, state", "The self-sufficient community of households and villages, which exists for the good life."),
            t("πολιτικὸν ζῷον", "politikon zōion", "political animal", "A living thing whose nature is fulfilled only in a city."),
            t("λόγος", "logos", "speech, reason", "The power to set out the useful and the harmful, the just and the unjust."),
          ],
          checks: [
            k("What does speech do that mere voice cannot, according to the passage?", ["Express pleasure and pain", "Set forth the expedient and inexpedient, the just and the unjust", "Call other members of the herd together", "Imitate the sounds of other animals"], 1, "Voice only indicates pleasure or pain; speech is intended to set forth the expedient and inexpedient, and so the just and the unjust."),
            k("Why does Aristotle say the city exists by nature?", ["Because the gods founded the first cities", "Because it grows from natural communities and completes what human beings are", "Because people agreed to a contract to stop fighting", "Because large animals always live in groups"], 1, "The household and village are natural, the city completes them, and the human being is by nature a political animal."),
          ],
          journal: "Which of your judgments about what is just did you form only by talking with other people?",
        },
        {
          id: "natural-slavery-and-its-critics",
          title: "Natural slavery and its critics",
          bekker: "1253b1-1255b40",
          minutes: 6,
          summary:
            "Aristotle asks whether anyone is a slave by nature. He answers yes: some rule and some are ruled, and he claims that some people, from birth, lack the deliberative part of the soul and benefit from being ruled. He also admits that critics are partly right. Slavery by law, where whatever is taken in war belongs to the victors, often enslaves people who are not slaves by nature, and many thinkers call it violence. Aristotle concludes that slavery is just only where the natural distinction holds. Modern readers rightly reject his view. It is worth studying because he tries to justify it, sees its weakness himself, and shows how a careful thinker could defend an injustice his city depended on.",
          passage: {
            text:
              "But is there any one thus intended by nature to be a slave, and for whom such a condition is expedient and right, or rather is not all slavery a violation of nature? There is no difficulty in answering this question, on grounds both of reason and of fact. For that some should rule and others be ruled is a thing not only necessary, but expedient; from the hour of their birth, some are marked out for subjection, others for rule.",
            ref: "I.5, 1254a17-24",
          },
          terms: [
            t("δοῦλος", "doulos", "slave", "A person owned by another; Aristotle distinguishes slaves by nature from slaves by law."),
            t("φύσει", "physei", "by nature", "As something is from its own nature, contrasted with what is so by law or convention."),
            t("νόμῳ", "nomōi", "by law, by convention", "As something is because people have agreed or decreed it."),
          ],
          checks: [
            k("What question does the passage open with?", ["Whether slaves should be paid", "Whether anyone is intended by nature to be a slave, or all slavery violates nature", "Whether women should rule households", "Whether war is ever just"], 1, "It asks whether anyone is thus intended by nature to be a slave, or whether all slavery is a violation of nature."),
            k("What does Aristotle concede to the critics of slavery?", ["Nothing at all", "That slavery by law, such as enslaving captives of war, can enslave those who are not slaves by nature", "That masters and slaves are always friends", "That slavery should be abolished at once"], 1, "He grants that there is slavery by law as well as by nature, and the law that captives belong to the victors is widely attacked."),
          ],
          journal: "What practice around you is defended mainly because things depend on it, and how would you test that defence?",
        },
        {
          id: "wealth-and-money-making",
          title: "Wealth for living and money for its own sake",
          bekker: "1256a1-1259a36",
          minutes: 5,
          summary:
            "Aristotle separates two ways of getting wealth. One belongs to household management: it gathers what a household needs, and it has a natural limit, since true wealth is a store of useful things. The other is the art of money-making in trade, which has no limit because it treats coin itself as the goal. Money was invented to make exchange easier, but some people come to think that wealth simply is a heap of coin and spend their lives increasing it. He calls retail trade censured because people gain from one another, and he judges lending at interest the most unnatural way of all, since it breeds money from money instead of using money for exchange.",
          passage: {
            text:
              "The most hated sort, and with the greatest reason, is usury, which makes a gain out of money itself, and not from the natural object of it. For money was intended to be used in exchange, but not to increase at interest. And this term interest, which means the birth of money from money, is applied to the breeding of money because the offspring resembles the parent.",
            ref: "I.10, 1258b2-7",
          },
          terms: [
            t("οἰκονομική", "oikonomikē", "household management", "The art of running a household, which uses wealth and has a limit."),
            t("χρηματιστική", "chrēmatistikē", "money-making", "The art of acquiring wealth; in trade it treats money as an end without limit."),
            t("τόκος", "tokos", "interest, offspring", "The same word means a child and interest on a loan, so money breeding money."),
          ],
          checks: [
            k("What was money intended for, according to the passage?", ["To be stored as treasure", "To be used in exchange", "To increase at interest", "To pay soldiers"], 1, "The passage says money was intended to be used in exchange, but not to increase at interest."),
            k("Why does the word for interest suit lending, in Aristotle's account?", ["It sounds like the word for coin", "It means birth or offspring, and lending makes money breed money", "It was the name of a famous banker", "It means a debt owed to the gods"], 1, "Interest means the birth of money from money, because the offspring resembles the parent."),
            k("How does household wealth-getting differ from money-making in trade?", ["It has no limit", "It has a natural limit set by what a household needs", "It is forbidden by law", "It produces only coin"], 1, "Wealth for the household is a store of useful things and has a limit; money-making treats coin as the goal and has none."),
          ],
          journal: "How do you know when you have enough of something you are gathering?",
        },
      ],
    },
    {
      id: "book-2",
      title: "Book II: Ideal cities and the best-known constitutions",
      bekker: "1260b-1274b",
      line: "Tests the ideal cities of Plato and others, and the admired constitutions of Sparta, Crete and Carthage.",
      lessons: [
        {
          id: "what-is-common-is-neglected",
          title: "What belongs to everyone is cared for by no one",
          bekker: "1261a10-1262b36",
          minutes: 5,
          summary:
            "Plato's Republic proposes that the guardians share wives, children and property, so that the city will be as unified as possible. Aristotle objects that a city pushed toward unity stops being a city, since a city is made of different kinds of people. He also argues the plan would fail on its own terms. When a thousand men each call every child 'mine', no child is truly anyone's, and each assumes another will do the care. Real affection needs something that is one's own and something dear. A watery kinship shared by everyone is weaker than the bond of a real cousin.",
          passage: {
            text:
              "For that which is common to the greatest number has the least care bestowed upon it. Every one thinks chiefly of his own, hardly at all of the common interest; and only when he is himself concerned as an individual. For besides other considerations, everybody is more inclined to neglect the duty which he expects another to fulfill; as in families many attendants are often less useful than a few.",
            ref: "II.3, 1261b33-38",
          },
          terms: [
            t("κοινός", "koinos", "common", "Shared by many; Aristotle asks what may be common and what should be one's own."),
            t("ἑνότης", "henotēs", "unity", "Being one; Plato's goal for the city, which Aristotle thinks can be pushed too far."),
          ],
          checks: [
            k("What happens to things common to the greatest number, according to the passage?", ["They are cared for best", "They receive the least care", "They are divided fairly", "They become sacred"], 1, "The passage says that which is common to the greatest number has the least care bestowed upon it."),
            k("What example does Aristotle give of shared duty being neglected?", ["Soldiers in an army", "Many attendants in a family being less useful than a few", "Farmers in a drought", "Judges in a court"], 1, "He says that in families many attendants are often less useful than a few, since each expects another to do the duty."),
          ],
          journal: "Where in your life does a duty go undone because it belongs to everyone?",
        },
        {
          id: "private-property-common-use",
          title: "Owned privately, used in common",
          bekker: "1262b37-1264b25",
          minutes: 5,
          summary:
            "On property Aristotle seeks a middle course. Common ownership breeds quarrels, especially between those who work much and receive little and those who work little and receive much. Private ownership lets each person attend to his own affairs, and it gives scope for generosity, since one can only give what is one's own. Yet the proverb says friends have all things in common, and good cities already share use: a citizen may let friends use his slaves, horses or crops. So property should be private as a rule but common in use, and it is the legislator's task to form citizens of a character that will share. Aristotle also says the real source of the evils Plato blames on private property is human wickedness, which communism would not cure.",
          passage: {
            text:
              "Property should be in a certain sense common, but, as a general rule, private; for, when everyone has a distinct interest, men will not complain of one another, and they will make more progress, because every one will be attending to his own business. And yet by reason of goodness, and in respect of use, 'Friends,' as the proverb says, 'will have all things common.'",
            ref: "II.5, 1263a25-30",
          },
          terms: [
            t("κτῆσις", "ktēsis", "property, possession", "What a person owns; Aristotle separates owning a thing from using it."),
            t("χρῆσις", "chrēsis", "use", "Using a thing; Aristotle wants use to be shared among friends."),
            t("ἐλευθεριότης", "eleutheriotēs", "generosity", "The virtue of giving well, possible only with what is one's own."),
          ],
          checks: [
            k("What is Aristotle's general rule for property in the passage?", ["Wholly common", "Common in a certain sense, but as a general rule private", "Owned only by the city", "Owned only by the wealthy"], 1, "He says property should be in a certain sense common, but, as a general rule, private."),
            k("In what respect does the proverb say friends have all things common?", ["In ownership", "In use and by reason of goodness", "In inheritance", "In taxation"], 1, "The passage says that by reason of goodness and in respect of use, friends will have all things common."),
          ],
          journal: "What do you own that you would gladly let a friend use, and what makes the difference?",
        },
        {
          id: "should-laws-be-changed",
          title: "When laws should be changed",
          bekker: "1268b22-1269a28",
          minutes: 5,
          summary:
            "Discussing Hippodamus, who proposed rewards for anyone who found an improvement to the laws, Aristotle asks whether laws should be changed. Arts such as medicine have improved by change, and old laws are often crude, so some change must be allowed; written laws are universal while actions are particular, so laws are never perfect. But laws differ from arts. A law has no force except habit, and habit takes time. A city that changes laws lightly teaches its citizens to disobey, so when the gain is small it is better to leave some errors in place.",
          passage: {
            text:
              "The analogy of the arts is false; a change in a law is a very different thing from a change in an art. For the law has no power to command obedience except that of habit, which can only be given by time, so that a readiness to change from old to new laws enfeebles the power of the law.",
            ref: "II.8, 1269a19-24",
          },
          terms: [
            t("νόμος", "nomos", "law, custom", "A rule of the city, whose force comes from long habit."),
            t("ἔθος", "ethos", "habit", "Custom built by repetition over time; the source of a law's power to command."),
          ],
          checks: [
            k("Where does the law's power to command obedience come from, according to the passage?", ["Its wisdom alone", "Habit, which only time can give", "The strength of the army", "The vote of the assembly"], 1, "The passage says the law has no power to command obedience except that of habit, which can only be given by time."),
            k("Why does Aristotle reject the analogy with the arts?", ["Arts never change", "Changing a law weakens the habit of obedience, which changing an art does not", "Laws are written by gods", "Arts are less important than laws"], 1, "He says a change in a law is very different from a change in an art, because readiness to change enfeebles the power of the law."),
            k("When is it better to leave an error in the laws, according to the lesson?", ["Never", "When the gain from changing is small", "Whenever the people ask", "Only in wartime"], 1, "When the gain is small, the citizen gains less by the change than he loses by the habit of disobedience."),
          ],
          journal: "Which of your own rules would lose its hold on you if you changed it every time it was inconvenient?",
        },
      ],
    },
    {
      id: "book-3",
      title: "Book III: Citizens and constitutions",
      bekker: "1274b-1288b",
      line: "Defines the citizen, sorts constitutions into true forms and perversions, and asks who should hold supreme power.",
      lessons: [
        {
          id: "who-is-a-citizen",
          title: "Who is a citizen",
          bekker: "1274b32-1276b15",
          minutes: 5,
          summary:
            "To study constitutions Aristotle first asks what a citizen is. Living in a place does not make one a citizen, since resident foreigners and slaves live there too, and neither does the right to sue in the courts. Birth from citizen parents is how cities decide in practice, but it cannot explain the first citizens. The citizen in the strict sense is one who shares in judging and in office, such as the juror and the member of the assembly. Aristotle notes that this definition fits a democracy best, since other constitutions give these powers to fewer people. A city, then, is a body of such citizens large enough to be self-sufficient.",
          passage: {
            text:
              "But the citizen whom we are seeking to define is a citizen in the strictest sense, against whom no such exception can be taken, and his special characteristic is that he shares in the administration of justice, and in offices.",
            ref: "III.1, 1275a19-23",
          },
          terms: [
            t("πολίτης", "politēs", "citizen", "One who shares in judging and holding office in a city."),
            t("ἀρχή", "archē", "office, rule", "A post of authority in the city; also rule in general."),
          ],
          checks: [
            k("What is the special characteristic of a citizen in the strictest sense?", ["Living in the city", "Sharing in the administration of justice and in offices", "Owning land", "Being born of citizen parents"], 1, "The passage says his special characteristic is that he shares in the administration of justice, and in offices."),
            k("Which constitution does Aristotle say this definition fits best?", ["Tyranny", "Democracy", "Kingship", "Oligarchy"], 1, "He notes that the definition fits the citizen of a democracy best, since other constitutions give judging and office to fewer people."),
          ],
          journal: "In what communities do you actually share in deciding, and not only in living there?",
        },
        {
          id: "six-constitutions",
          title: "Six constitutions: true forms and perversions",
          bekker: "1278b6-1279b10",
          minutes: 5,
          summary:
            "The government is the supreme authority, and it must be in the hands of one, a few, or the many. Aristotle divides each by a second question: does it rule for the common interest or for the private interest of the rulers? Rule by one for the common good is kingship; its perversion is tyranny. Rule by the few for the common good is aristocracy; its perversion is oligarchy. Rule by the many for the common good he calls by the general name constitution (polity); its perversion is democracy, rule for the benefit of the poor. The true forms are just because citizens ought to share in the advantages of the city.",
          passage: {
            text:
              "The words constitution and government have the same meaning, and the government, which is the supreme authority in states, must be in the hands of one, or of a few, or of the many. The true forms of government, therefore, are those in which the one, or the few, or the many, govern with a view to the common interest; but governments which rule with a view to the private interest, whether of the one or of the few, or of the many, are perversions.",
            ref: "III.7, 1279a25-31",
          },
          terms: [
            t("πολιτεία", "politeia", "constitution, polity", "The arrangement of offices in a city; also the name of rule by the many for the common good."),
            t("παρέκβασις", "parekbasis", "perversion, deviation", "A constitution in which the rulers rule for their own interest."),
            t("τὸ κοινῇ συμφέρον", "to koinēi sympheron", "the common interest", "What benefits the whole city, the test of a true constitution."),
          ],
          checks: [
            k("What separates a true form of government from a perversion, according to the passage?", ["The number of rulers", "Whether it rules with a view to the common interest or the private interest", "Whether it has written laws", "Whether it wins wars"], 1, "True forms govern with a view to the common interest; those that rule for private interest are perversions."),
            k("What is the perversion of kingship?", ["Oligarchy", "Tyranny", "Democracy", "Aristocracy"], 1, "Rule by one for the common good is kingship; rule by one for his own interest is tyranny."),
          ],
          journal: "In a group you belong to, whose interest do the people in charge actually serve?",
        },
        {
          id: "the-many-together",
          title: "Many ordinary people together",
          bekker: "1281a39-1282b13",
          minutes: 5,
          summary:
            "Should the many or the few best hold supreme power? Aristotle finds some truth in the case for the many. Each may be ordinary, yet together they may judge better than a few excellent people, the way a feast to which many contribute is better than a dinner paid for by one. Each brings some share of virtue and practical wisdom, and gathered they become like one person with many feet, hands and senses. So the many are better judges of music and poetry, since each notices a different part. He adds limits: this may not hold of every multitude, and it suits the many to share in electing and auditing officials rather than to hold the highest offices alone.",
          passage: {
            text:
              "The principle that the multitude ought to be supreme rather than the few best is one that is maintained, and, though not free from difficulty, yet seems to contain an element of truth. For the many, of whom each individual is but an ordinary person, when they meet together may very likely be better than the few good, if regarded not individually but collectively, just as a feast to which many contribute is better than a dinner provided out of a single purse.",
            ref: "III.11, 1281a40-b3",
          },
          terms: [
            t("πλῆθος", "plēthos", "the multitude, the many", "The mass of citizens, considered as a body."),
            t("φρόνησις", "phronēsis", "practical wisdom, prudence", "Good judgment about what to do, of which each of the many has some share."),
          ],
          checks: [
            k("What image does Aristotle use for the many judging together?", ["An army on the march", "A feast to which many contribute, better than a dinner from a single purse", "A ship with many rowers", "A chorus singing in unison"], 1, "He says the many may be better collectively, just as a feast to which many contribute is better than a dinner provided out of a single purse."),
            k("How does Aristotle judge the principle that the multitude should be supreme?", ["Wholly false", "Not free from difficulty, yet containing an element of truth", "Proved beyond doubt", "A rule only for Sparta"], 1, "The passage says it is not free from difficulty, yet seems to contain an element of truth."),
          ],
          journal: "When has a group of ordinary people seen something that you, alone, missed?",
        },
      ],
    },
    {
      id: "book-4",
      title: "Book IV: Constitutions as they are",
      bekker: "1288b-1301a",
      line: "Turns from the ideal to the real: the kinds of democracy and oligarchy, and the mixed constitution of the middle class.",
      lessons: [
        {
          id: "best-best-possible-given",
          title: "The best, the best possible and the one you have",
          bekker: "1288b10-1289a25",
          minutes: 5,
          summary:
            "Aristotle compares political science to gymnastics. A trainer must know the best training for the best body, the best for most bodies, and even how to help someone who wants less than the best. So too the statesman must know the best constitution if nothing stood in the way, the best for the circumstances, how any given constitution can be founded and preserved, and the constitution that suits most cities. Earlier writers, he says, sketched ideal cities that cannot be reached and neglected the useful. The statesman must also know laws, which differ from constitutions and should be framed to suit them.",
          passage: {
            text:
              "For the best is often unattainable, and therefore the true legislator and statesman ought to be acquainted, not only with (1) that which is best in the abstract, but also with (2) that which is best relatively to circumstances.",
            ref: "IV.1, 1288b25-27",
          },
          terms: [
            t("πολιτικὴ ἐπιστήμη", "politikē epistēmē", "political science", "The knowledge a lawgiver and statesman needs about constitutions and laws."),
            t("νομοθέτης", "nomothetēs", "legislator, lawgiver", "One who frames a constitution and its laws."),
          ],
          checks: [
            k("Why must the statesman know more than the best constitution in the abstract?", ["Because the best is often unattainable", "Because the best constitution is unknowable", "Because all constitutions are equal", "Because the people prefer the worst"], 0, "The passage says the best is often unattainable, so he must also know what is best relatively to circumstances."),
            k("What comparison does Aristotle use for this science?", ["Navigation", "Gymnastic training, which serves bodies of every kind", "Cooking", "Architecture"], 1, "He compares it to gymnastics, which must know the best training and also what suits most bodies and lesser aims."),
          ],
          journal: "Where are you holding out for the ideal when the best possible is within reach?",
        },
        {
          id: "rich-and-poor-not-few-and-many",
          title: "Democracy and oligarchy are about wealth",
          bekker: "1289b27-1291b13",
          minutes: 5,
          summary:
            "Democracy is usually defined as rule by the many and oligarchy as rule by the few. Aristotle argues this misses the point. If the rich were the majority and ruled, no one would call it a democracy. What really makes a democracy is that the free and poor rule; what makes an oligarchy is that the rich and well-born rule. It happens that the poor are usually many and the rich few. He goes on to say that cities have many parts, farmers, craftsmen, traders, laborers, soldiers, the wealthy, and that different mixtures of these parts give the many kinds of democracy and oligarchy.",
          passage: {
            text:
              "the form of government is a democracy when the free, who are also poor and the majority, govern, and an oligarchy when the rich and the noble govern, they being at the same time few in number.",
            ref: "IV.4, 1290b17-20",
          },
          terms: [
            t("δημοκρατία", "dēmokratia", "democracy", "For Aristotle, rule by the free poor in their own interest."),
            t("ὀλιγαρχία", "oligarchia", "oligarchy", "Rule by the rich and well-born in their own interest."),
          ],
          checks: [
            k("Who governs in a democracy, according to the passage?", ["The rich and the noble", "The free, who are also poor and the majority", "One wise man", "The priests"], 1, "The passage says it is a democracy when the free, who are also poor and the majority, govern."),
            k("What does Aristotle think really defines oligarchy?", ["That few people rule", "That the rich and noble rule, who happen to be few", "That there are no laws", "That offices are filled by lot"], 1, "The rich and the noble govern, they being at the same time few in number; wealth is the real mark."),
          ],
          journal: "In a group you know, is power really held by the many or by the people with resources?",
        },
        {
          id: "the-middle-class",
          title: "The strength of the middle",
          bekker: "1295a25-1296b12",
          minutes: 5,
          summary:
            "What constitution is best for most cities and most people, not the ideal one? Aristotle applies the mean from his Ethics. The very rich tend toward arrogance and cannot obey; the very poor tend toward petty crime and cannot rule; the first become masters, the second slaves, and a city of masters and slaves has no friendship. Those of middle fortune are most ready to follow reason and least eager for office or for others' goods. So a city is best governed where the middle class is large, stronger than both extremes or at least than either. Where some have much and others nothing, extreme democracy or oligarchy, and then tyranny, tend to arise.",
          passage: {
            text:
              "Thus it is manifest that the best political community is formed by citizens of the middle class, and that those states are likely to be well-administered in which the middle class is large, and stronger if possible than both the other classes, or at any rate than either singly; for the addition of the middle class turns the scale, and prevents either of the extremes from being dominant.",
            ref: "IV.11, 1295b34-40",
          },
          terms: [
            t("μέσοι", "mesoi", "the middle, the middle class", "Citizens of moderate means, between the very rich and the very poor."),
            t("μεσότης", "mesotēs", "mean", "The middle between excess and deficiency, applied here to a city's wealth."),
          ],
          checks: [
            k("Which citizens form the best political community, according to the passage?", ["The very rich", "The middle class", "The very poor", "The soldiers"], 1, "The passage says the best political community is formed by citizens of the middle class."),
            k("What does a large middle class do?", ["It makes the city larger", "It turns the scale and prevents either extreme from being dominant", "It makes taxes lower", "It replaces the laws"], 1, "The addition of the middle class turns the scale, and prevents either of the extremes from being dominant."),
          ],
          journal: "Where do you stand between people who have much and people who have little, and how does it shape what you want?",
        },
      ],
    },
    {
      id: "book-5",
      title: "Book V: Faction and revolution",
      bekker: "1301a-1316b",
      line: "Explains why constitutions fall into faction and change, and how each kind can be preserved.",
      lessons: [
        {
          id: "the-desire-for-equality",
          title: "Faction begins with claims to equality",
          bekker: "1301a19-1302b5",
          minutes: 5,
          summary:
            "All agree that justice is proportionate equality, but they disagree about what makes people equal. Democrats think those equal in freedom should be equal in everything; oligarchs think those unequal in wealth should be unequal in everything. Each holds a partial view of justice, and when their share falls short of their idea, they stir up faction. The chief cause is the feeling of inequality. Those who think themselves equal to people who have more want equality; those who think themselves superior but get the same or less want superiority. The motives are gain and honor, or fear of losing them, and the occasions include insolence, fear, contempt and disproportionate growth.",
          passage: {
            text:
              "The universal and chief cause of this revolutionary feeling has been already mentioned; viz., the desire of equality, when men think that they are equal to others who have more than themselves; or, again, the desire of inequality and superiority, when conceiving themselves to be superior they think that they have not more but the same or less than their inferiors; pretensions which may and may not be just. Inferiors revolt in order that they may be equal, and equals that they may be superior.",
            ref: "V.2, 1302a24-31",
          },
          terms: [
            t("στάσις", "stasis", "faction, civil strife", "Division of a city into parties that fight for control."),
            t("μεταβολή", "metabolē", "change, revolution", "A change of constitution, from one form to another."),
            t("ἰσότης", "isotēs", "equality", "Being equal; numerical or proportionate, the root claim in every faction."),
          ],
          checks: [
            k("What does the passage name as the universal and chief cause of revolutionary feeling?", ["Foreign invasion", "The desire of equality, or of superiority", "Bad harvests", "The anger of the gods"], 1, "It names the desire of equality, and again the desire of inequality and superiority."),
            k("Why do equals revolt, according to the passage?", ["To be free of taxes", "That they may be superior", "To restore the old kings", "To escape punishment"], 1, "Inferiors revolt in order that they may be equal, and equals that they may be superior."),
          ],
          journal: "When have you felt you were getting less than you deserved, and what did that feeling make you want to do?",
        },
        {
          id: "small-beginnings",
          title: "Great quarrels from small beginnings",
          bekker: "1303b17-1304b18",
          minutes: 5,
          summary:
            "The occasions of revolution may be trifling, but what is at stake is great. Aristotle gives examples: at Syracuse a love quarrel between two young men in the government drew the ruling class in and split the city; at Hestiaea a dispute over an inheritance led to war. Quarrels among the powerful matter most, since the whole city takes sides. So the statesman should watch for the beginnings of evils and settle the disputes of leading men early. As the proverb says, the beginning is half of the whole, and a small error at the beginning grows in proportion to everything that follows.",
          passage: {
            text:
              "In revolutions the occasions may be trifling, but great interests are at stake. Even trifles are most important when they concern the rulers, as was the case of old at Syracuse; for the Syracusan constitution was once changed by a love-quarrel of two young men, who were in the government.",
            ref: "V.4, 1303b17-21",
          },
          terms: [
            t("ἀρχή", "archē", "beginning, origin", "The start of a thing; here, the first small cause of a great quarrel."),
            t("στάσις", "stasis", "faction, civil strife", "Division of a city into parties that fight for control."),
          ],
          checks: [
            k("What changed the Syracusan constitution, according to the passage?", ["A war with Athens", "A love-quarrel of two young men in the government", "A famine", "A new law code"], 1, "The passage says the Syracusan constitution was once changed by a love-quarrel of two young men who were in the government."),
            k("When are trifles most important, according to the passage?", ["When they concern the rulers", "When they concern foreigners", "When they happen in winter", "When they are written down"], 0, "It says even trifles are most important when they concern the rulers."),
          ],
          journal: "What small quarrel are you letting grow that would be easy to settle now?",
        },
        {
          id: "education-for-the-constitution",
          title: "Educating citizens for their constitution",
          bekker: "1307b26-1310a36",
          minutes: 5,
          summary:
            "How are constitutions preserved? Aristotle lists precautions: guard against small breaches of the law, which creep in unnoticed; do not trust tricks meant to fool the people; treat those outside the government well; keep offices short; watch for anyone growing too powerful. But the greatest safeguard, and the most neglected, is to educate the young in the spirit of the constitution. Even the best laws, approved by every citizen, are useless if people are not trained by habit to live by them. Being educated in this spirit does not mean doing what pleases the rulers of the day, but what lets the constitution endure.",
          passage: {
            text:
              "But of all the things which I have mentioned that which most contributes to the permanence of constitutions is the adaptation of education to the form of government, and yet in our own day this principle is universally neglected. The best laws, though sanctioned by every citizen of the state, will be of no avail unless the young are trained by habit and education in the spirit of the constitution,",
            ref: "V.9, 1310a12-17",
          },
          terms: [
            t("παιδεία", "paideia", "education, upbringing", "The training of the young in habits and understanding."),
            t("σωτηρία", "sōtēria", "preservation", "Keeping a constitution safe and lasting."),
          ],
          checks: [
            k("What most contributes to the permanence of constitutions, according to the passage?", ["A strong army", "Adapting education to the form of government", "Large treasuries", "Frequent elections"], 1, "It says that which most contributes to permanence is the adaptation of education to the form of government."),
            k("When will even the best laws be of no avail?", ["When they are not written down", "When the young are not trained by habit and education in the spirit of the constitution", "When they are too old", "When foreigners disagree with them"], 1, "The best laws will be of no avail unless the young are trained by habit and education in the spirit of the constitution."),
          ],
          journal: "What were you trained by habit to do that you now do without thinking, and does it fit the life you want?",
        },
      ],
    },
    {
      id: "book-6",
      title: "Book VI: Building democracies and oligarchies",
      bekker: "1316b-1323a",
      line: "Gives practical advice on founding and preserving democracies and oligarchies, and lists the offices a city needs.",
      lessons: [
        {
          id: "liberty-is-the-principle-of-democracy",
          title: "Liberty is the principle of democracy",
          bekker: "1317a40-1318a10",
          minutes: 5,
          summary:
            "Aristotle reports what democrats themselves say. The basis of democracy is liberty, and liberty has two marks. One is ruling and being ruled in turn, which brings a justice of numerical equality rather than equality by merit; so the majority is supreme, and since the poor are more numerous they hold more power. The other is living as one likes, which leads to wanting not to be ruled at all, or, failing that, to rule and be ruled in turn. From these follow democratic institutions: election of all from all, offices filled by lot, short terms, no property qualification, and pay for attending the assembly and courts.",
          passage: {
            text:
              "The basis of a democratic state is liberty; which, according to the common opinion of men, can only be enjoyed in such a state; this they affirm to be the great end of every democracy. One principle of liberty is for all to rule and be ruled in turn, and indeed democratic justice is the application of numerical not proportionate equality; whence it follows that the majority must be supreme, and that whatever the majority approve must be the end and the just.",
            ref: "VI.2, 1317a40-b7",
          },
          terms: [
            t("ἐλευθερία", "eleutheria", "liberty, freedom", "The status of a free person; the principle democrats claim for their constitution."),
            t("ἄρχειν καὶ ἄρχεσθαι", "archein kai archesthai", "ruling and being ruled", "Taking turns in office, the first mark of democratic liberty."),
          ],
          checks: [
            k("What is the basis of a democratic state, according to the passage?", ["Wealth", "Liberty", "Virtue", "Noble birth"], 1, "The passage opens: the basis of a democratic state is liberty."),
            k("What kind of equality does democratic justice apply?", ["Proportionate equality by merit", "Numerical equality", "Equality only among the rich", "No equality at all"], 1, "It says democratic justice is the application of numerical, not proportionate, equality."),
          ],
          journal: "Which matters more to you: ruling and being ruled in turn, or living as you like?",
        },
        {
          id: "making-a-democracy-last",
          title: "Making a democracy last",
          bekker: "1319b33-1320b17",
          minutes: 5,
          summary:
            "Founding a democracy is easy; any constitution can last a few days. The hard part is making it endure, and the truly democratic measure is the one that preserves democracy longest, not the one that makes it most extreme. Aristotle warns against demagogues who confiscate the property of the rich to please the people, and against handing out surplus revenue, which is like pouring water into a leaky jar. Instead the poor should be helped to lasting prosperity: public funds should be saved and distributed so that they can buy a small farm or start a trade, and the notables should share the means of work.",
          passage: {
            text:
              "Yet the true friend of the people should see that they be not too poor, for extreme poverty lowers the character of the democracy; measures therefore should be taken which will give them lasting prosperity; and as this is equally the interest of all classes, the proceeds of the public revenues should be accumulated and distributed among its poor, if possible, in such quantities as may enable them to purchase a little farm, or, at any rate, make a beginning in trade or husbandry.",
            ref: "VI.5, 1320a32-b1",
          },
          terms: [
            t("δημαγωγός", "dēmagōgos", "demagogue, popular leader", "One who leads the people, often by flattering them at the city's cost."),
            t("εὐπορία", "euporia", "prosperity", "Having enough means; Aristotle wants it lasting for the poor."),
          ],
          checks: [
            k("Why should the true friend of the people see that they are not too poor?", ["Because the poor pay most taxes", "Because extreme poverty lowers the character of the democracy", "Because the poor might leave the city", "Because the gods demand it"], 1, "The passage says extreme poverty lowers the character of the democracy."),
            k("How should public revenues be used to help the poor, according to the passage?", ["Handed out at every festival", "Saved and given in amounts that let them buy a little farm or start in trade", "Spent on walls", "Returned to the rich"], 1, "It says revenues should be accumulated and distributed so the poor may purchase a little farm or make a beginning in trade or husbandry."),
          ],
          journal: "What help have you received that gave you lasting footing, and what help only filled a leaky jar?",
        },
        {
          id: "offices-a-city-needs",
          title: "The offices every city needs",
          bekker: "1321b4-1323a10",
          minutes: 4,
          summary:
            "Book VI ends with a survey of the offices a city cannot do without. First is supervision of the market, since every city has buyers and sellers who supply one another's needs, and exchange is the readiest way to self-sufficiency. Then come officials for public and private property, roads, buildings and water; officials for the country around the city; treasurers; registrars of contracts and court decisions; those who carry out sentences and guard prisoners, a necessary but hated task; generals and officers for war; auditors of accounts; a council to prepare business for the people; and priests. Small cities combine offices that large ones divide.",
          passage: {
            text:
              "First among necessary offices is that which has the care of the market; a magistrate should be appointed to inspect contracts and to maintain order. For in every state there must inevitably be buyers and sellers who will supply one another's wants; this is the readiest way to make a state self-sufficing and so fulfill the purpose for which men come together into one state.",
            ref: "VI.8, 1321b12-18",
          },
          terms: [
            t("ἀγορανόμος", "agoranomos", "market official", "The magistrate who watches over contracts and order in the market."),
            t("αὐτάρκεια", "autarkeia", "self-sufficiency", "Having within itself what a life needs; the purpose for which a city exists."),
          ],
          checks: [
            k("Which office does Aristotle name first among necessary offices?", ["The general", "The care of the market", "The priesthood", "The treasurer"], 1, "The passage says first among necessary offices is that which has the care of the market."),
            k("Why does every city need a market, according to the passage?", ["To collect taxes from foreigners", "Buyers and sellers supply one another's wants, the readiest way to self-sufficiency", "To hold festivals", "To train soldiers"], 1, "Buyers and sellers supply one another's wants, which is the readiest way to make a state self-sufficing."),
          ],
          journal: "Which unglamorous work keeps your household or community running, and who does it?",
        },
      ],
    },
    {
      id: "book-7",
      title: "Book VII: The best city",
      bekker: "1323a-1337a",
      line: "Describes the best life and the city built for it: its size, its land, its citizens and its aim of peace and leisure.",
      lessons: [
        {
          id: "happiness-from-virtue-not-fortune",
          title: "Happiness comes from virtue, not fortune",
          bekker: "1323a14-1324a4",
          minutes: 5,
          summary:
            "To find the best constitution one must first know the best life. Aristotle divides goods into external goods, goods of the body and goods of the soul, and says a happy person needs all three. People argue about proportions: most think a little virtue is enough and pile up wealth and power without limit. He replies that external goods, like any tool, have a limit beyond which they harm or do no good, while goods of the soul are more useful the more one has. So each person has as much happiness as he has of virtue and wisdom and acts on them. Good fortune is not happiness, because chance gives external goods but no one is just or temperate by chance. The same holds for cities.",
          passage: {
            text:
              "God is a witness to us of this truth, for he is happy and blessed, not by reason of any external good, but in himself and by reason of his own nature. And herein of necessity lies the difference between good fortune and happiness; for external goods come of themselves, and chance is the author of them, but no one is just or temperate by or through chance.",
            ref: "VII.1, 1323b23-29",
          },
          terms: [
            t("εὐδαιμονία", "eudaimonia", "happiness, flourishing", "Living and doing well, the end of a human life and of a city."),
            t("εὐτυχία", "eutychia", "good fortune", "Luck in external goods, which chance supplies; not the same as happiness."),
            t("ἀρετή", "aretē", "virtue, excellence", "The excellence of character and mind on which happiness depends."),
          ],
          checks: [
            k("How much happiness does each person have, according to the lesson?", ["As much as his wealth", "Just so much as he has of virtue and wisdom, and of virtuous and wise action", "As much as the gods allow", "As much as his friends give him"], 1, "The passage says each one has just so much of happiness as he has of virtue and wisdom, and of virtuous and wise action."),
            k("Why is good fortune different from happiness?", ["Good fortune lasts longer", "Chance gives external goods, but no one is just or temperate by chance", "Happiness is only for gods", "Good fortune comes from virtue"], 1, "External goods come by chance, but no one is just or temperate by or through chance."),
          ],
          journal: "What part of your sense of doing well depends on luck, and what part on what you do?",
        },
        {
          id: "the-right-size-of-a-city",
          title: "The right size of a city",
          bekker: "1325b33-1326b25",
          minutes: 5,
          summary:
            "A great city is not the same as a populous one. What counts is how well a city does its work, and only those who are true parts of it, citizens rather than slaves and foreigners, measure its greatness. Experience shows that very populous cities are rarely well governed, and reason agrees: law is a kind of order, and order is hard to impose on a huge crowd. Like a ship, a city has a right size; too small and it cannot be self-sufficient, too large and it cannot be governed. Citizens must know one another's characters to elect officials and judge cases well, so the best size is the largest that suffices for life and can be taken in at a single view.",
          passage: {
            text:
              "a great city is not to be confounded with a populous one. Moreover, experience shows that a very populous city can rarely, if ever, be well governed; since all cities which have a reputation for good government have a limit of population. We may argue on grounds of reason, and the same result will follow. For law is order, and good law is good order;",
            ref: "VII.4, 1326a24-30",
          },
          terms: [
            t("μέγεθος", "megethos", "size, magnitude", "How large a thing is; every natural thing has a fitting size."),
            t("εὐνομία", "eunomia", "good order, good law", "The condition of a city whose laws are good and obeyed."),
          ],
          checks: [
            k("What does experience show about very populous cities, according to the passage?", ["They are always richest", "They can rarely, if ever, be well governed", "They never go to war", "They have the best laws"], 1, "The passage says a very populous city can rarely, if ever, be well governed."),
            k("What argument from reason does the passage begin?", ["Law is order, and good law is good order", "Large cities please the gods", "Small cities are poor", "Walls cost too much"], 0, "It says, for law is order, and good law is good order, which is hard to keep in a huge crowd."),
          ],
          journal: "How large can a group you belong to grow before people stop knowing one another well enough to decide together?",
        },
        {
          id: "war-for-peace-work-for-leisure",
          title: "War for peace, work for leisure",
          bekker: "1333a16-1334b5",
          minutes: 5,
          summary:
            "Life divides into business and leisure, war and peace, and actions into the necessary and useful and the noble. Aristotle says the lower is always for the sake of the higher, as the part of the soul that obeys reason is for the sake of reason. So war must be for the sake of peace, business for the sake of leisure, and useful things for the sake of noble ones. He criticizes Sparta and its admirers, whose laws aimed only at war and conquest; such cities stay safe while at war and decay in peace, like iron that loses its temper, because they never learned to use leisure. The lawgiver should train citizens for peace and leisure.",
          passage: {
            text:
              "And the preference given to one or the other class of actions must necessarily be like the preference given to one or other part of the soul and its actions over the other; there must be war for the sake of peace, business for the sake of leisure, things useful and necessary for the sake of things honorable.",
            ref: "VII.14, 1333a32-36",
          },
          terms: [
            t("σχολή", "scholē", "leisure", "Free time used well for noble activity; the root of the English word school."),
            t("ἀσχολία", "ascholia", "business, occupation", "Being busy with necessary work, which is for the sake of leisure."),
            t("τὸ καλόν", "to kalon", "the noble, the honorable", "What is fine and worth choosing for itself."),
          ],
          checks: [
            k("For the sake of what must war be, according to the passage?", ["Glory", "Peace", "Wealth", "Empire"], 1, "The passage says there must be war for the sake of peace."),
            k("How does the passage say business relates to leisure?", ["Leisure is for the sake of business", "Business is for the sake of leisure", "They are the same", "Business is nobler"], 1, "It says there must be business for the sake of leisure."),
          ],
          journal: "If your work is for the sake of your leisure, what do you actually do with that leisure?",
        },
      ],
    },
    {
      id: "book-8",
      title: "Book VIII: Education",
      bekker: "1337a-1342b",
      line: "Argues that education should be public and the same for all, and asks what music contributes to character.",
      lessons: [
        {
          id: "education-is-public",
          title: "Education is the city's business",
          bekker: "1337a11-1337a32",
          minutes: 4,
          summary:
            "The lawgiver must care above all for the education of the young, because the character of citizens shapes and preserves the constitution. Every art needs prior training and habituation, and so does virtue. Since the whole city has one end, education should be one and the same for all, and public, not left to each father to teach his own children what he thinks best. Aristotle adds that no citizen belongs to himself alone; each is part of the city, and the care of each part looks to the care of the whole. Here he praises the Spartans, who make education the business of the state.",
          passage: {
            text:
              "Again, for the exercise of any faculty or art a previous training and habituation are required; clearly therefore for the practice of virtue. And since the whole city has one end, it is manifest that education should be one and the same for all, and that it should be public, and not private- not as at present, when every one looks after his own children separately, and gives them separate instruction of the sort which he thinks best;",
            ref: "VIII.1, 1337a18-25",
          },
          terms: [
            t("παιδεία", "paideia", "education, upbringing", "The training of the young in habits and understanding."),
            t("ἐθισμός", "ethismos", "habituation", "Becoming used to acting in a way by repeated practice."),
          ],
          checks: [
            k("Why should education be one and the same for all, according to the passage?", ["Because it is cheaper", "Because the whole city has one end", "Because all children are alike", "Because parents cannot teach"], 1, "The passage says since the whole city has one end, education should be one and the same for all."),
            k("What does the practice of virtue require, like any art?", ["A wealthy family", "Previous training and habituation", "Good luck", "A written code"], 1, "It says any faculty or art requires previous training and habituation, and so does virtue."),
          ],
          journal: "What did your community teach you in common, and what did you have to learn on your own?",
        },
        {
          id: "learning-to-use-leisure",
          title: "Learning to use leisure well",
          bekker: "1337b22-1338b8",
          minutes: 5,
          summary:
            "The usual subjects were reading and writing, gymnastics, music and drawing. Reading, writing and drawing are useful, and gymnastics builds courage, but why music? Aristotle answers that nature requires us not only to work well but to use leisure well, and leisure is the first principle of all action, better than work and its end. Leisure is not amusement; amusement is rest from work, a medicine for toil. Leisure holds pleasure and happiness in itself. So there must be studies pursued for the sake of leisure, worthy of free people, and not chosen only because they are useful. Music was placed in education for this reason.",
          passage: {
            text:
              "the first principle of all action is leisure. Both are required, but leisure is better than occupation and is its end; and therefore the question must be asked, what ought we to do when at leisure? Clearly we ought not to be amusing ourselves, for then amusement would be the end of life.",
            ref: "VIII.3, 1337b32-1338a1",
          },
          terms: [
            t("σχολή", "scholē", "leisure", "Free time used for activity worth doing for itself."),
            t("παιδιά", "paidia", "amusement, play", "Rest and relaxation from work, which is not the end of life."),
          ],
          checks: [
            k("How does leisure relate to occupation, according to the passage?", ["Occupation is better", "Leisure is better than occupation and is its end", "They are equal", "Leisure is only for children"], 1, "The passage says leisure is better than occupation and is its end."),
            k("Why ought we not simply to amuse ourselves in leisure?", ["Amusement is forbidden by law", "Then amusement would be the end of life", "Amusement is too costly", "Amusement makes people ill"], 1, "It says we ought not to be amusing ourselves, for then amusement would be the end of life."),
          ],
          journal: "What would you study if it were useful for nothing at all?",
        },
        {
          id: "music-and-character",
          title: "Music shapes character",
          bekker: "1339a11-1340b19",
          minutes: 5,
          summary:
            "Music may serve amusement, the use of leisure, or the forming of character. Aristotle argues it does all three, and that it touches character more than people think. Rhythm and melody contain likenesses of anger and gentleness, courage and temperance and their opposites, and in listening our souls are changed. Feeling pleasure and pain at such likenesses is close to feeling them about the real things, so learning to enjoy the right music trains us to enjoy the right actions and characters. Different modes have different effects, some saddening, some calming, some inspiring. So music should be taught to the young, who are drawn to what is pleasant.",
          passage: {
            text:
              "Rhythm and melody supply imitations of anger and gentleness, and also of courage and temperance, and of all the qualities contrary to these, and of the other qualities of character, which hardly fall short of the actual affections, as we know from our own experience, for in listening to such strains our souls undergo a change. The habit of feeling pleasure or pain at mere representations is not far removed from the same feeling about realities;",
            ref: "VIII.5, 1340a18-25",
          },
          terms: [
            t("μουσική", "mousikē", "music", "The art of the Muses: melody, rhythm and the words sung to them."),
            t("μίμησις", "mimēsis", "imitation, representation", "A likeness of something; music imitates states of character."),
            t("ἦθος", "ēthos", "character", "A settled state of how one feels and acts."),
          ],
          checks: [
            k("What do rhythm and melody supply, according to the passage?", ["Only pleasant sounds", "Imitations of anger and gentleness, courage and temperance, and other qualities of character", "Proof of mathematical laws", "Signals for soldiers"], 1, "The passage says rhythm and melody supply imitations of anger and gentleness, courage and temperance, and other qualities of character."),
            k("Why does feeling pleasure at representations matter for character?", ["It is not far removed from feeling the same about realities", "It replaces real feelings", "It makes people idle", "It only matters for musicians"], 0, "The habit of feeling pleasure or pain at mere representations is not far removed from the same feeling about realities."),
          ],
          journal: "What music or story has changed how you feel about something real?",
        },
      ],
    },
  ],
};

const ATHENIANS: Course = {
  id: "constitution-of-the-athenians",
  title: "Constitution of the Athenians",
  greek: "Ἀθηναίων Πολιτεία",
  latin: "Atheniensium Respublica",
  subject: "politics",
  level: "Intermediate",
  bekker: "",
  about:
    "A history of the Athenian constitution through eleven changes, from the early oligarchy to the restored democracy, followed by a description of how Athens was governed in Aristotle's own day. It shows the kind of research on actual cities that lies behind the Politics.",
  before: ["politics"],
  caveat:
    "This work was lost for centuries and was found in 1890 on a papyrus bought in Egypt (British Library Papyrus 131), published in 1891. The opening chapters are missing and the end is damaged. Ancient writers attributed it to Aristotle, but many scholars think it was written by a student in his school as one of its 158 studies of constitutions. It has no Bekker pages, so it is cited by chapter and section.",
  translation: { translator: "Frederic G. Kenyon", year: 1891, title: "Aristotle on the Constitution of Athens", url: "https://classics.mit.edu/Aristotle/athenian_const.html" },
  units: [
    {
      id: "draco-and-solon",
      title: "Chapters 1-12: Debt, Draco and Solon",
      bekker: "",
      line: "Describes the crisis of debt and serfdom in early Athens and Solon's reforms that answered it.",
      lessons: [
        {
          id: "solon-lifts-the-burdens",
          title: "Solon lifts the burdens",
          bekker: "",
          minutes: 5,
          summary:
            "Early Athens was an oligarchy in which the poor worked the land of the rich for a share of the crop and could be sold into slavery, with their children, if they failed to pay. The people had no share in anything. Solon, chosen to mediate, freed them once and for all: he banned loans secured on the debtor's person and cancelled debts public and private, a measure called the Seisachtheia, the shaking off of burdens. The author reports a story that Solon's friends learned of the plan, borrowed to buy land and grew rich, but rejects the charge that Solon shared in the fraud, since he refused to make himself tyrant when he could have.",
          passage: {
            text:
              "As soon as he was at the head of affairs, Solon liberated the people once and for all, by prohibiting all loans on the security of the debtor's person: and in addition he made laws by which he cancelled all debts, public and private. This measure is commonly called the Seisachtheia [= removal of burdens], since thereby the people had their loads removed from them.",
            ref: "Ch. 6.1 (no Bekker page)",
          },
          terms: [
            t("σεισάχθεια", "seisachtheia", "shaking off of burdens", "Solon's cancellation of debts and ban on debt slavery."),
            t("ἑκτήμοροι", "hektēmoroi", "sixth-parters", "Poor tenants who worked the land of the rich for a share of its yield."),
          ],
          checks: [
            k("What did Solon prohibit, according to the passage?", ["All trade with foreigners", "Loans on the security of the debtor's person", "The worship of old gods", "Private ownership of land"], 1, "The passage says he liberated the people by prohibiting all loans on the security of the debtor's person."),
            k("Why was the measure called the Seisachtheia?", ["After the month it was passed", "Because the people had their loads removed from them", "After Solon's father", "Because it raised taxes"], 1, "It was so called since thereby the people had their loads removed from them."),
          ],
          journal: "What burden, once lifted, would let you begin again?",
        },
        {
          id: "solons-most-democratic-features",
          title: "Solon's three democratic features",
          bekker: "",
          minutes: 5,
          summary:
            "The author picks out three features of Solon's constitution as the most democratic. First, the ban on loans secured on the person. Second, the right of anyone who wished to seek redress on behalf of someone wronged. Third, appeal to the jury courts, which gave the people their greatest strength, because whoever controls the vote controls the constitution. Some said Solon wrote his laws vaguely on purpose so the people would decide every case in court. The author thinks this unlikely: no law framed in general terms can reach perfection, and Solon should be judged by the tenor of his whole legislation.",
          passage: {
            text:
              "There are three points in the constitution of Solon which appear to be its most democratic features: first and most important, the prohibition of loans on the security of the debtor's person; secondly, the right of every person who so willed to claim redress on behalf of any one to whom wrong was being done; thirdly, the institution of the appeal to the jurycourts;",
            ref: "Ch. 9.1 (no Bekker page)",
          },
          terms: [
            t("δικαστήριον", "dikastērion", "jury court", "A court of citizen jurors chosen from the people."),
            t("ἔφεσις", "ephesis", "appeal", "Referring a case to the jury courts for decision."),
          ],
          checks: [
            k("Which democratic feature does the passage call first and most important?", ["The jury courts", "The prohibition of loans on the security of the debtor's person", "Election by lot", "Pay for jurors"], 1, "It lists first and most important the prohibition of loans on the security of the debtor's person."),
            k("What was the second democratic feature?", ["The right of anyone to claim redress for someone wronged", "The building of the Long Walls", "The banishment of nobles", "A tax on the rich"], 0, "Secondly, the right of every person who so willed to claim redress on behalf of any one wronged."),
          ],
          journal: "Would you step in to seek justice for a stranger who was wronged, and what would it cost you?",
        },
      ],
    },
    {
      id: "pisistratus-and-cleisthenes",
      title: "Chapters 13-22: Tyranny and the reforms of Cleisthenes",
      bekker: "",
      line: "Tells how Pisistratus ruled as a mild tyrant and how Cleisthenes rebuilt the citizen body after the tyrants fell.",
      lessons: [
        {
          id: "a-mild-tyranny",
          title: "A mild tyranny",
          bekker: "",
          minutes: 5,
          summary:
            "Pisistratus seized power three times and finally held it. The author describes his rule as temperate and more like constitutional government than tyranny: he was humane, forgiving and lent money to poor farmers. The author says plainly that this had political aims. Scattered over the countryside and busy with their own farms, the poor would have neither the wish nor the time to attend to public affairs, while a tax of a tenth on produce raised his revenue. He sent local judges round the country so that people would not come to the city. Kindness, here, was also a way of keeping citizens out of politics.",
          passage: {
            text:
              "His administration was temperate, as has been said before, and more like constitutional government than a tyranny. Not only was he in every respect humane and mild and ready to forgive those who offended, but, in addition, he advanced money to the poorer people to help them in their labours, so that they might make their living by agriculture.",
            ref: "Ch. 16.2 (no Bekker page)",
          },
          terms: [
            t("τύραννος", "tyrannos", "tyrant", "One who holds sole power without lawful title."),
            t("δημοτικός", "dēmotikos", "popular, friendly to the people", "Favoring the common people, as Pisistratus's rule appeared."),
          ],
          checks: [
            k("How does the passage describe Pisistratus's administration?", ["Cruel and arbitrary", "Temperate, and more like constitutional government than a tyranny", "Chaotic and weak", "Ruled by priests"], 1, "It says his administration was temperate and more like constitutional government than a tyranny."),
            k("Why, according to the chapter, did he help poor farmers?", ["Only from kindness", "Partly so they would stay on their farms with no time for public affairs", "To prepare them for war", "Because the gods ordered it"], 1, "The chapter says he wanted them scattered over the country and busy, so they would have neither the wish nor the time for public affairs."),
          ],
          journal: "When has someone's generosity toward you also kept you from something?",
        },
        {
          id: "cleisthenes-mixes-the-tribes",
          title: "Cleisthenes mixes the tribes",
          bekker: "",
          minutes: 5,
          summary:
            "After the tyrants were expelled, Cleisthenes became the popular leader and rebuilt the citizen body. He divided the whole population into ten tribes in place of the old four, in order to mix people up and give more of them a share in citizenship; hence the saying 'Do not look at the tribes', aimed at those who checked family lists. He enlarged the Council to five hundred, fifty from each tribe. He divided the land into thirty groups of demes, ten from the city, ten from the coast and ten from the interior, and gave each tribe one from each region by lot, so that no tribe stood for a single district or clan.",
          passage: {
            text:
              "Accordingly, now that he was the popular leader, three years after the expulsion of the tyrants, in the archonship of Isagoras, his first step was to distribute the whole population into ten tribes in place of the existing four, with the object of intermixing the members of the different tribes, and so securing that more persons might have a share in the franchise.",
            ref: "Ch. 21.2 (no Bekker page)",
          },
          terms: [
            t("φυλή", "phylē", "tribe", "A division of the citizen body; Cleisthenes made ten in place of four."),
            t("δῆμος", "dēmos", "deme, the people", "A local district and its members; also the people as a whole."),
            t("βουλή", "boulē", "council", "The Council, enlarged by Cleisthenes to five hundred members."),
          ],
          checks: [
            k("How many tribes did Cleisthenes create in place of the old four?", ["Twelve", "Ten", "Six", "Three"], 1, "The passage says he distributed the whole population into ten tribes in place of the existing four."),
            k("What was his object in redistributing the tribes?", ["To raise an army", "To intermix the members so that more persons might share in the franchise", "To honor the old families", "To prepare for a tyranny"], 1, "The object was intermixing the members of the different tribes so that more persons might have a share in the franchise."),
          ],
          journal: "What groups would you mix together if you wanted people to see themselves as one community?",
        },
      ],
    },
    {
      id: "eleven-changes",
      title: "Chapters 23-41: From the Persian Wars to the restored democracy",
      bekker: "",
      line: "Follows the democracy through the Areopagus, Ephialtes, the Four Hundred and the Thirty, and counts eleven changes of constitution.",
      lessons: [
        {
          id: "the-people-master-of-everything",
          title: "The people become master of everything",
          bekker: "",
          minutes: 5,
          summary:
            "After the fall of the Thirty, the democracy returned in 403 BC. The author counts this as the eleventh change of the Athenian constitution, listing them all from Ion and Theseus through Draco, Solon, Pisistratus, Cleisthenes, the Areopagus, Ephialtes, the Four Hundred and the Thirty. Since then the power of the masses has grown. The people govern everything by votes in the Assembly and verdicts in the courts, and even the Council's judicial power has passed to them. The author judges this sound, since small bodies are easier to corrupt than large ones. He adds that pay for attending the Assembly was introduced because people stopped coming.",
          passage: {
            text:
              "The democracy has made itself master of everything and administers everything by its votes in the Assembly and by the law-courts, in which it holds the supreme power. Even the jurisdiction of the Council has passed into the hands of the people at large; and this appears to be a judicious change, since small bodies are more open to corruption, whether by actual money or influence, than large ones.",
            ref: "Ch. 41.2 (no Bekker page)",
          },
          terms: [
            t("ἐκκλησία", "ekklēsia", "assembly", "The meeting of all citizens that voted on the city's business."),
            t("μεταβολή", "metabolē", "change of constitution", "One of the eleven changes the author counts in Athenian history."),
          ],
          checks: [
            k("Why does the author think giving the Council's jurisdiction to the people was judicious?", ["Because the people are always wise", "Because small bodies are more open to corruption than large ones", "Because the Council was too slow", "Because Solon required it"], 1, "The passage says small bodies are more open to corruption, whether by money or influence, than large ones."),
            k("How does the democracy administer everything, according to the passage?", ["Through a single ruler", "By its votes in the Assembly and by the law-courts", "Through the priests", "By lot alone"], 1, "It administers everything by its votes in the Assembly and by the law-courts."),
          ],
          journal: "Are you harder to sway alone or as part of a large group, and why?",
        },
      ],
    },
    {
      id: "the-constitution-today",
      title: "Chapters 42-69: Athens in Aristotle's day",
      bekker: "",
      line: "Describes how the democracy worked in the fourth century: citizenship, the Council, the magistrates and the jury courts.",
      lessons: [
        {
          id: "becoming-a-citizen",
          title: "Becoming a citizen at eighteen",
          bekker: "",
          minutes: 5,
          summary:
            "The second part of the work describes the constitution as it stood. Citizenship belonged to those born of citizen parents on both sides. At eighteen a young man was enrolled in his deme, after the demesmen voted on oath whether he was of age and freeborn. If rejected as unfree he could appeal to the courts, at the risk of being sold as a slave if he lost. The Council then checked the ages of those enrolled. The new citizens, the ephebes, spent two years in military training and garrison duty before taking their full place in the city.",
          passage: {
            text:
              "The present state of the constitution is as follows. The franchise is open to all who are of citizen birth by both parents. They are enrolled among the demesmen at the age of eighteen. On the occasion of their enrollment the demesmen give their votes on oath, first whether the candidates appear to be of the age prescribed by the law (if not, they are dismissed back into the ranks of the boys), and secondly whether the candidate is free born and of such parentage as the laws require.",
            ref: "Ch. 42.1 (no Bekker page)",
          },
          terms: [
            t("ἔφηβος", "ephēbos", "ephebe, young citizen", "A newly enrolled citizen in his two years of training."),
            t("δημότης", "dēmotēs", "demesman", "A member of a deme, who votes on enrolling new citizens."),
          ],
          checks: [
            k("Who is open to the franchise, according to the passage?", ["All residents of Attica", "All who are of citizen birth by both parents", "Only the sons of archons", "Anyone who pays a fee"], 1, "The passage says the franchise is open to all who are of citizen birth by both parents."),
            k("At what age are citizens enrolled among the demesmen?", ["Sixteen", "Eighteen", "Twenty-one", "Thirty"], 1, "They are enrolled among the demesmen at the age of eighteen."),
          ],
          journal: "What marked your becoming a full member of a community, and who decided it?",
        },
        {
          id: "juries-by-lot",
          title: "Juries chosen by lot",
          bekker: "",
          minutes: 5,
          summary:
            "The final chapters describe the jury courts in detail. Juries were chosen by lot, tribe by tribe, using tickets, allotment machines and coloured staves, so that no one could know in advance who would judge which case. Any citizen over thirty could serve, unless he owed money to the state or had lost his civil rights; anyone who served unlawfully could be prosecuted. Jurors voted with bronze ballots, pierced for the prosecutor and solid for the defendant, and a tie went to the defendant. The care taken over the machinery shows how much the democracy feared bribery and wanted ordinary citizens to judge.",
          passage: {
            text:
              "All persons above thirty years of age are qualified to serve as jurors, provided they are not debtors to the state and have not lost their civil rights. If any unqualified person serves as juror, an information is laid against him, and he is brought before the court; and, if he is convicted, the jurors assess the punishment or fine which they consider him to deserve.",
            ref: "Ch. 63.3 (no Bekker page)",
          },
          terms: [
            t("κλήρωσις", "klērōsis", "selection by lot", "Choosing officials or jurors by chance draw rather than vote."),
            t("δικαστής", "dikastēs", "juror, judge", "A citizen over thirty serving on a jury court."),
          ],
          checks: [
            k("Who is qualified to serve as a juror, according to the passage?", ["All citizens over eighteen", "All persons above thirty who are not debtors to the state and have not lost civil rights", "Only members of the Council", "Only the rich"], 1, "The passage says all persons above thirty are qualified, provided they are not debtors to the state and have not lost their civil rights."),
            k("What happens to an unqualified person who serves as juror?", ["Nothing", "An information is laid against him and the jurors may punish or fine him", "He is made an archon", "He is exiled at once without trial"], 1, "An information is laid against him and, if convicted, the jurors assess the punishment or fine."),
          ],
          journal: "Would you trust a jury drawn by lot from your neighbors to judge you fairly, and why?",
        },
      ],
    },
  ],
};

const RHETORIC: Course = {
  id: "rhetoric",
  title: "Rhetoric",
  greek: "Τέχνη ῥητορική",
  latin: "Ars Rhetorica",
  subject: "rhetoric",
  level: "Start here",
  bekker: "1354a-1420b",
  about:
    "Aristotle treats persuasion as an art with methods that can be taught: arguments, the speaker's character and the audience's emotions in Books I and II, and style and arrangement in Book III. It is still the foundation of how people analyze speeches and arguments.",
  before: ["topics"],
  caveat: "",
  translation: { translator: "W. Rhys Roberts", year: 1924, title: "Rhetorica (The Works of Aristotle, vol. XI)", url: "https://classics.mit.edu/Aristotle/rhetoric.html" },
  units: [
    {
      id: "book-1",
      title: "Book I: What rhetoric is and the three kinds of speech",
      bekker: "1354a-1377b",
      line: "Defines rhetoric, names its three proofs, and sets out the topics of political, forensic and ceremonial speech.",
      lessons: [
        {
          id: "the-counterpart-of-dialectic",
          title: "The counterpart of dialectic",
          bekker: "1354a1-1355b24",
          minutes: 5,
          summary:
            "Rhetoric is the counterpart of dialectic. Both deal with matters that everyone has some acquaintance with and that belong to no special science, and everyone uses both, defending and attacking claims. Some do it at random and some by habit, so the matter can be studied systematically by asking why some succeed. Aristotle criticizes earlier handbooks for teaching mostly how to stir up the jury's feelings, which is beside the point, and neglecting proof, the body of persuasion. Rhetoric is useful because truth and justice are naturally stronger, yet need defending before ordinary audiences, and because one should be able to argue both sides to see how things really are.",
          passage: {
            text:
              "Rhetoric is the counterpart of Dialectic. Both alike are concerned with such things as come, more or less, within the general ken of all men and belong to no definite science. Accordingly all men make use, more or less, of both; for to a certain extent all men attempt to discuss statements and to maintain them, to defend themselves and to attack others.",
            ref: "I.1, 1354a1-6",
          },
          terms: [
            t("ῥητορική", "rhētorikē", "rhetoric", "The art of finding the available means of persuasion."),
            t("διαλεκτική", "dialektikē", "dialectic", "The art of reasoning from accepted opinions, by question and answer."),
            t("ἀντίστροφος", "antistrophos", "counterpart", "A matching part, like the answering stanza in a choral song."),
          ],
          checks: [
            k("What does Rhetoric share with Dialectic, according to the passage?", ["Both belong to a definite science", "Both concern things within the general ken of all men and belong to no definite science", "Both are used only by experts", "Both deal only with numbers"], 1, "Both are concerned with things within the general ken of all men and belong to no definite science."),
            k("What does the passage say all men attempt to do?", ["Write laws", "Discuss and maintain statements, defend themselves and attack others", "Avoid all argument", "Rule cities"], 1, "It says all men attempt to discuss statements and maintain them, to defend themselves and to attack others."),
          ],
          journal: "When you argue, do you rely on method, habit or chance?",
        },
        {
          id: "three-means-of-persuasion",
          title: "Character, emotion and argument",
          bekker: "1355b25-1358a35",
          minutes: 6,
          summary:
            "Aristotle defines rhetoric as the faculty of observing, in any given case, the available means of persuasion. Every other art persuades about its own subject; rhetoric can find means of persuasion on almost any subject. The proofs supplied by the speech itself are of three kinds. One rests on the speaker's character, when the speech makes him seem credible. One rests on putting the audience into a certain frame of mind, since we judge differently when pleased or pained. One rests on the argument, the proof or apparent proof in the words. Argument in rhetoric uses the enthymeme, a rhetorical syllogism, and the example, a rhetorical induction.",
          passage: {
            text:
              "Of the modes of persuasion furnished by the spoken word there are three kinds. The first kind depends on the personal character of the speaker; the second on putting the audience into a certain frame of mind; the third on the proof, or apparent proof, provided by the words of the speech itself. Persuasion is achieved by the speaker's personal character when the speech is so spoken as to make us think him credible.",
            ref: "I.2, 1356a1-6",
          },
          terms: [
            t("ἦθος", "ēthos", "character", "The speaker's character as shown in the speech, which makes him credible."),
            t("πάθος", "pathos", "emotion, feeling", "The frame of mind the speaker puts the audience into."),
            t("ἐνθύμημα", "enthymēma", "enthymeme", "A rhetorical syllogism, an argument from what is usually true."),
          ],
          checks: [
            k("On what does the first kind of persuasion depend, according to the passage?", ["The proof in the words", "The personal character of the speaker", "The size of the audience", "The laws of the city"], 1, "The first kind depends on the personal character of the speaker."),
            k("What does the second kind rely on?", ["Putting the audience into a certain frame of mind", "Quoting witnesses", "The speaker's wealth", "Written contracts"], 0, "The second depends on putting the audience into a certain frame of mind."),
            k("How does Aristotle define rhetoric in this chapter?", ["The art of winning every case", "The faculty of observing in any given case the available means of persuasion", "The art of beautiful speech", "The study of law"], 1, "He defines it as the faculty of observing in any given case the available means of persuasion."),
          ],
          journal: "Which of the three moves you most easily: who is speaking, how you feel, or the argument?",
        },
        {
          id: "three-kinds-of-speech",
          title: "Three kinds of speech",
          bekker: "1358a36-1359a29",
          minutes: 5,
          summary:
            "The kinds of rhetoric are set by the kinds of listener. A listener is either a judge, deciding about the future or the past, or an observer of the speaker's skill. A member of the assembly decides about the future, so political or deliberative speech urges us to do or not do something, and aims at the expedient or harmful. A juror decides about the past, so forensic speech accuses or defends, and aims at the just or unjust. The observer hears ceremonial speech, which praises or blames, concerns the present, and aims at the noble or shameful. The rest of Book I gathers the topics each kind needs.",
          passage: {
            text:
              "The hearer must be either a judge, with a decision to make about things past or future, or an observer. A member of the assembly decides about future events, a juryman about past events: while those who merely decide on the orator's skill are observers. From this it follows that there are three divisions of oratory-(1) political, (2) forensic, and (3) the ceremonial oratory of display.",
            ref: "I.3, 1358b2-8",
          },
          terms: [
            t("συμβουλευτικόν", "symbouleutikon", "deliberative, political", "Speech to an assembly about what to do in the future."),
            t("δικανικόν", "dikanikon", "forensic, judicial", "Speech in court about what was done in the past."),
            t("ἐπιδεικτικόν", "epideiktikon", "ceremonial, display", "Speech of praise or blame, heard by observers."),
          ],
          checks: [
            k("What does a member of the assembly decide about, according to the passage?", ["Past events", "Future events", "The orator's skill", "Religious rites"], 1, "A member of the assembly decides about future events."),
            k("Who are the observers in the passage?", ["Those who decide on the orator's skill", "Jurymen", "Members of the assembly", "Foreign ambassadors"], 0, "Those who merely decide on the orator's skill are observers."),
          ],
          journal: "Which of the three kinds of speech do you make most often in a week: urging, accusing or defending, or praising?",
        },
      ],
    },
    {
      id: "book-2",
      title: "Book II: Character and the emotions",
      bekker: "1377b-1403b",
      line: "Studies what makes a speaker trusted, each emotion an audience can feel, and the characters of different ages and fortunes.",
      lessons: [
        {
          id: "sense-character-goodwill",
          title: "Good sense, good character, goodwill",
          bekker: "1377b16-1378a30",
          minutes: 5,
          summary:
            "Since rhetoric ends in a judgment, the speaker must not only make his argument sound but show himself to be a certain kind of person and put the judges in the right frame of mind. Three things make us trust a speaker apart from proof: good sense, good moral character and goodwill. Bad advice comes from lacking one of them. People form false opinions through lack of sense; or they think rightly but out of badness do not say what they think; or they are sensible and upright but do not wish their hearers well. A speaker thought to have all three will be believed. For goodwill, Aristotle turns to the emotions.",
          passage: {
            text:
              "There are three things which inspire confidence in the orator's own character-the three, namely, that induce us to believe a thing apart from any proof of it: good sense, good moral character, and goodwill. False statements and bad advice are due to one or more of the following three causes.",
            ref: "II.1, 1378a6-9",
          },
          terms: [
            t("φρόνησις", "phronēsis", "good sense, practical wisdom", "Sound judgment about what to do."),
            t("ἀρετή", "aretē", "virtue, good character", "Moral excellence, so that the speaker says what he really thinks."),
            t("εὔνοια", "eunoia", "goodwill", "Wishing the hearers well."),
          ],
          checks: [
            k("What three things inspire confidence in the orator's character?", ["Wealth, birth and fame", "Good sense, good moral character, and goodwill", "Voice, gesture and memory", "Wit, beauty and courage"], 1, "The passage names good sense, good moral character, and goodwill."),
            k("These three induce belief in what way, according to the passage?", ["Only after full proof", "Apart from any proof", "Only in courts", "Only when written down"], 1, "They induce us to believe a thing apart from any proof of it."),
          ],
          journal: "Whose advice do you trust, and which of the three qualities earns it?",
        },
        {
          id: "what-anger-is",
          title: "What anger is",
          bekker: "1378a30-1380a4",
          minutes: 5,
          summary:
            "To rouse or calm an emotion, a speaker must know three things about it: the state of mind of those who feel it, whom they feel it toward, and on what grounds. Aristotle begins with anger. It is a desire, with pain, for revenge for a slight that was not deserved, aimed at oneself or one's friends. Anger is always at a particular person, never at mankind in general, and it carries a pleasure, the hope of revenge. He names three kinds of slight: contempt, spite and insolence. We grow angry when we are in pain and thwarted, and at those who slight what we care about most.",
          passage: {
            text:
              "Anger may be defined as an impulse, accompanied by pain, to a conspicuous revenge for a conspicuous slight directed without justification towards what concerns oneself or towards what concerns one's friends. If this is a proper definition of anger, it must always be felt towards some particular individual, e.g. Cleon, and not 'man' in general.",
            ref: "II.2, 1378a30-35",
          },
          terms: [
            t("ὀργή", "orgē", "anger", "A painful desire for revenge for an undeserved slight."),
            t("ὀλιγωρία", "oligōria", "slight, belittling", "Treating someone as worth nothing: contempt, spite or insolence."),
            t("ὕβρις", "hybris", "insolence", "Shaming another for one's own pleasure, a kind of slight."),
          ],
          checks: [
            k("Toward whom must anger always be felt, according to the passage?", ["Mankind in general", "Some particular individual", "The gods", "Oneself"], 1, "It must always be felt towards some particular individual, e.g. Cleon, and not 'man' in general."),
            k("What provokes anger in Aristotle's definition?", ["Any loss of money", "A conspicuous slight directed without justification at oneself or one's friends", "Bad weather", "A fair punishment"], 1, "Anger is an impulse to revenge for a conspicuous slight directed without justification towards oneself or one's friends."),
          ],
          journal: "Think of the last time you were angry: what slight, real or imagined, set it off?",
        },
        {
          id: "the-character-of-the-young",
          title: "The character of the young",
          bekker: "1388b31-1389b12",
          minutes: 5,
          summary:
            "A speaker must also suit his words to the characters of his hearers, which differ by age and fortune. Aristotle sketches the young. They have strong desires and act on them, but their desires change quickly. They are hot-tempered and love honor and victory more than money. They are trusting, hopeful and full of courage, since they have had few disappointments, and they live mostly in hope. They prefer noble deeds to useful ones and err by excess in everything. The old, he says, have the opposite traits, and those in their prime have the mean between them.",
          passage: {
            text:
              "Young men have strong passions, and tend to gratify them indiscriminately. Of the bodily desires, it is the sexual by which they are most swayed and in which they show absence of self-control. They are changeable and fickle in their desires, which are violent while they last, but quickly over: their impulses are keen but not deep-rooted, and are like sick people's attacks of hunger and thirst.",
            ref: "II.12, 1389a3-9",
          },
          terms: [
            t("νέοι", "neoi", "the young", "Young men, whose character Aristotle contrasts with the old and those in their prime."),
            t("ἀκμή", "akmē", "prime of life", "The peak of life, whose character lies in the mean."),
          ],
          checks: [
            k("How does the passage describe the desires of young men?", ["Steady and deep-rooted", "Changeable and fickle, violent while they last but quickly over", "Weak and rarely felt", "Directed only at money"], 1, "It says they are changeable and fickle in their desires, which are violent while they last, but quickly over."),
            k("What does Aristotle compare their impulses to?", ["A river in flood", "Sick people's attacks of hunger and thirst", "A soldier's courage", "Fire in dry grass"], 1, "Their impulses are keen but not deep-rooted, like sick people's attacks of hunger and thirst."),
          ],
          journal: "Which traits of your younger self have you kept, and which have changed?",
        },
      ],
    },
    {
      id: "book-3",
      title: "Book III: Style and arrangement",
      bekker: "1403b-1420b",
      line: "Turns from what to say to how to say it: clear and fitting style, metaphor, and the parts of a speech.",
      lessons: [
        {
          id: "clear-and-appropriate",
          title: "Style must be clear and fitting",
          bekker: "1404b1-1405a3",
          minutes: 5,
          summary:
            "The first virtue of style is clarity, since speech that does not make its meaning plain fails at the very thing speech is for. Style must also be appropriate, neither mean nor too elevated. Poetic language is not mean, but it does not fit prose. Clarity comes from current and ordinary words. Unusual words give distinction, because people admire what is strange, but in prose they should be used sparingly. The writer should conceal his art and seem to speak naturally, since natural speech persuades and artifice makes hearers suspicious, as of mixed wine.",
          passage: {
            text:
              "Style to be good must be clear, as is proved by the fact that speech which fails to convey a plain meaning will fail to do just what speech has to do. It must also be appropriate, avoiding both meanness and undue elevation; poetical language is certainly free from meanness, but it is not appropriate to prose. Clearness is secured by using the words (nouns and verbs alike) that are current and ordinary.",
            ref: "III.2, 1404b1-6",
          },
          terms: [
            t("λέξις", "lexis", "style, diction", "The way something is said, as distinct from what is said."),
            t("σαφήνεια", "saphēneia", "clarity", "Making the meaning plain, the first virtue of style."),
            t("τὸ πρέπον", "to prepon", "appropriateness", "Fitting the subject and the occasion."),
          ],
          checks: [
            k("Why must style be clear, according to the passage?", ["Because clear speech is shorter", "Because speech that fails to convey a plain meaning fails to do what speech has to do", "Because the law requires it", "Because poets are clear"], 1, "The passage says speech that fails to convey a plain meaning will fail to do just what speech has to do."),
            k("How is clearness secured?", ["By using rare and poetic words", "By using words that are current and ordinary", "By speaking slowly", "By repeating every point"], 1, "Clearness is secured by using the words that are current and ordinary."),
          ],
          journal: "When did you last hide a weak point behind fine words?",
        },
        {
          id: "metaphor-and-surprise",
          title: "Metaphor and the pleasure of surprise",
          bekker: "1410b6-1413b2",
          minutes: 5,
          summary:
            "We enjoy learning easily, and words that teach us something new please us most. Strange words puzzle and ordinary words teach nothing we did not know, so metaphor is the most effective: it lets us grasp something new through a likeness. Aristotle says liveliness comes chiefly from metaphor and from surprise. When the hearer expected one thing and is given another, he takes in the new idea more strongly, as if his mind said, 'Yes, of course, I never thought of that.' Well-made riddles and witty sayings please for the same reason, because they mean more than the words say.",
          passage: {
            text:
              "Liveliness is specially conveyed by metaphor, and by the further power of surprising the hearer; because the hearer expected something different, his acquisition of the new idea impresses him all the more. His mind seems to say, 'Yes, to be sure; I never thought of that'.",
            ref: "III.11, 1412a19-22",
          },
          terms: [
            t("μεταφορά", "metaphora", "metaphor", "Giving a thing a name that belongs to something else, by likeness."),
            t("ἀστεῖον", "asteion", "lively, witty saying", "A clever expression that pleases by teaching quickly."),
          ],
          checks: [
            k("By what is liveliness specially conveyed, according to the passage?", ["Long sentences", "Metaphor, and the power of surprising the hearer", "Loud delivery", "Rare foreign words"], 1, "The passage says liveliness is specially conveyed by metaphor, and by the further power of surprising the hearer."),
            k("Why does surprise make an idea more striking?", ["Because the hearer expected something different", "Because it is repeated", "Because it is in verse", "Because it flatters the hearer"], 0, "Because the hearer expected something different, his acquisition of the new idea impresses him all the more."),
          ],
          journal: "What metaphor has changed the way you see something?",
        },
        {
          id: "state-your-case-and-prove-it",
          title: "State your case and prove it",
          bekker: "1414a30-1414b18",
          minutes: 4,
          summary:
            "A speech has two necessary parts. You must state your case and you must prove it. You cannot state a case and leave it unproved, or prove something you have not stated, since a proof is always a proof of something. The usual division into many parts, narration, refutation and so on, is in Aristotle's view absurd, since narration belongs only to forensic speech. At most a speech has four parts: introduction, statement, argument and epilogue. The remaining chapters treat each part, along with interrogation and the close.",
          passage: {
            text:
              "A speech has two parts. You must state your case, and you must prove it. You cannot either state your case and omit to prove it, or prove it without having first stated it; since any proof must be a proof of something, and the only use of a preliminary statement is the proof that follows it.",
            ref: "III.13, 1414a30-36",
          },
          terms: [
            t("τάξις", "taxis", "arrangement", "The order of the parts of a speech."),
            t("πρόθεσις", "prothesis", "statement", "Setting out the case to be proved."),
            t("πίστις", "pistis", "proof, argument", "What makes the case believable."),
          ],
          checks: [
            k("What are the two parts of a speech, according to the passage?", ["Introduction and epilogue", "Stating the case and proving it", "Praise and blame", "Narration and refutation"], 1, "The passage says you must state your case, and you must prove it."),
            k("Why can you not prove a case without first stating it?", ["Because the audience would leave", "Because any proof must be a proof of something", "Because the law forbids it", "Because it takes too long"], 1, "Any proof must be a proof of something, and the statement exists for the proof that follows."),
          ],
          journal: "In something you need to say this week, what exactly is the case, and what is the proof?",
        },
      ],
    },
  ],
};

const POETICS: Course = {
  id: "poetics",
  title: "Poetics",
  greek: "Περὶ ποιητικῆς",
  latin: "De Poetica",
  subject: "poetics",
  level: "Start here",
  bekker: "1447a-1462b",
  about:
    "Aristotle asks what poetry is, why people make and enjoy it, and how a tragedy should be built: its plot, its hero, its reversals and recognitions, its language. Short and dense, it has shaped the craft and criticism of drama and story ever since.",
  before: [],
  caveat:
    "The Poetics survives incomplete: the promised treatment of comedy, probably a second book, is lost, and the text we have reads in places like lecture notes. The famous phrase on catharsis is never explained in the surviving text, and its meaning is disputed.",
  translation: { translator: "S. H. Butcher", year: 1895, title: "Aristotle's Theory of Poetry and Fine Art", url: "https://classics.mit.edu/Aristotle/poetics.html" },
  units: [
    {
      id: "chapters-1-5",
      title: "Chapters 1-5: Imitation and the origins of poetry",
      bekker: "1447a-1449b",
      line: "Defines poetry as imitation, sorts the arts by their means, objects and manner, and traces how tragedy and comedy grew.",
      lessons: [
        {
          id: "we-learn-by-imitating",
          title: "We learn by imitating",
          bekker: "1447a8-1448b24",
          minutes: 5,
          summary:
            "All poetry, along with music and dance, is a kind of imitation, differing in its means (rhythm, language, melody), its objects (people better, worse or like us) and its manner (narration or acting). Aristotle says poetry springs from two causes rooted in human nature. First, imitation is natural to us from childhood; humans are the most imitative of animals and learn their first lessons by imitating. Second, everyone delights in imitations. We enjoy looking at accurate images of things that are painful to see in life, such as the lowest animals and corpses, because learning is a great pleasure: we work out what each thing is.",
          passage: {
            text:
              "Poetry in general seems to have sprung from two causes, each of them lying deep in our nature. First, the instinct of imitation is implanted in man from childhood, one difference between him and other animals being that he is the most imitative of living creatures, and through imitation learns his earliest lessons; and no less universal is the pleasure felt in things imitated.",
            ref: "4, 1448b4-9",
          },
          terms: [
            t("μίμησις", "mimēsis", "imitation, representation", "Making a likeness of something; for Aristotle the genus of all poetry."),
            t("ποίησις", "poiēsis", "poetry, making", "The making of an imitation in words, rhythm and melody."),
          ],
          checks: [
            k("From how many causes does poetry spring, according to the passage?", ["One", "Two", "Three", "Four"], 1, "The passage says poetry seems to have sprung from two causes, each lying deep in our nature."),
            k("What difference between humans and other animals does the passage name?", ["Humans alone can speak", "Humans are the most imitative of living creatures", "Humans alone feel pain", "Humans alone build cities"], 1, "It says man is the most imitative of living creatures and learns his earliest lessons through imitation."),
          ],
          journal: "What did you learn first by copying someone, before anyone explained it?",
        },
        {
          id: "what-comedy-imitates",
          title: "What comedy imitates",
          bekker: "1448b24-1449b20",
          minutes: 5,
          summary:
            "Poetry split by the poets' characters: the more serious imitated noble actions, in hymns and praises, and the lighter imitated the actions of meaner people, in lampoons. From these came tragedy and comedy. Comedy imitates people worse than average, not in every kind of badness, but in what is ridiculous, which is a kind of ugliness: a fault or deformity that causes no pain or harm, like the comic mask, which is ugly and distorted but not painful. Tragedy's history is known, but comedy's is obscure because it was not taken seriously at first. Epic agrees with tragedy in imitating serious subjects, but differs in meter, narrative form and length.",
          passage: {
            text:
              "Comedy is, as we have said, an imitation of characters of a lower type- not, however, in the full sense of the word bad, the ludicrous being merely a subdivision of the ugly. It consists in some defect or ugliness which is not painful or destructive. To take an obvious example, the comic mask is ugly and distorted, but does not imply pain.",
            ref: "5, 1449a32-37",
          },
          terms: [
            t("κωμῳδία", "kōmōidia", "comedy", "The imitation of people worse than average in what is ridiculous."),
            t("τὸ γελοῖον", "to geloion", "the ridiculous, the ludicrous", "A fault or ugliness that causes no pain or harm."),
          ],
          checks: [
            k("What kind of defect does comedy consist in, according to the passage?", ["A crime deserving punishment", "Some defect or ugliness which is not painful or destructive", "Any kind of wickedness", "A deadly mistake"], 1, "It says comedy consists in some defect or ugliness which is not painful or destructive."),
            k("What example does Aristotle give?", ["The tragic chorus", "The comic mask, ugly and distorted but not implying pain", "A battle scene", "A funeral"], 1, "The comic mask is ugly and distorted, but does not imply pain."),
          ],
          journal: "What makes you laugh, and would it still be funny if someone were really hurt?",
        },
      ],
    },
    {
      id: "chapters-6-9",
      title: "Chapters 6-9: Tragedy and its plot",
      bekker: "1449b-1452a",
      line: "Defines tragedy, ranks its six parts with plot first, and sets out the unity and probability a plot needs.",
      lessons: [
        {
          id: "what-tragedy-is",
          title: "What tragedy is",
          bekker: "1449b21-1450a15",
          minutes: 6,
          summary:
            "Aristotle defines tragedy as an imitation of an action that is serious, complete and of a certain size, in language made pleasing, with different kinds of ornament in different parts, in the form of action not narration, and through pity and fear bringing about the catharsis of such emotions. He explains that the pleasing language means verse and song. From the definition he draws tragedy's six parts: plot, character, thought, diction, song and spectacle. Catharsis is not explained in the surviving text. Scholars read it as purgation of the emotions, as purification of them, or as a clarifying of the events, and none of these readings is settled.",
          passage: {
            text:
              "Tragedy, then, is an imitation of an action that is serious, complete, and of a certain magnitude; in language embellished with each kind of artistic ornament, the several kinds being found in separate parts of the play; in the form of action, not of narrative; through pity and fear effecting the proper purgation of these emotions.",
            ref: "6, 1449b24-28",
          },
          terms: [
            t("τραγῳδία", "tragōidia", "tragedy", "The imitation of a serious, complete action that arouses pity and fear."),
            t("κάθαρσις", "katharsis", "catharsis, purgation", "What tragedy does to pity and fear; its exact meaning is disputed."),
            t("ἔλεος καὶ φόβος", "eleos kai phobos", "pity and fear", "The two emotions tragedy arouses."),
          ],
          checks: [
            k("In what form does tragedy imitate, according to the definition?", ["Narrative", "Action, not narrative", "Song alone", "Letters"], 1, "The definition says tragedy is in the form of action, not of narrative."),
            k("Through which emotions does tragedy work, according to the passage?", ["Joy and hope", "Pity and fear", "Anger and envy", "Shame and pride"], 1, "It says tragedy works through pity and fear effecting the proper purgation of these emotions."),
            k("Which statement about catharsis is accurate?", ["Aristotle explains it fully in chapter 6", "The surviving text does not explain it, and its meaning is disputed", "It means the hero's death", "It refers only to music"], 1, "The summary notes that catharsis is not explained in the surviving text and scholars disagree about it."),
          ],
          journal: "What story has left you feeling lighter after it made you afraid or sorry?",
        },
        {
          id: "plot-is-the-soul-of-tragedy",
          title: "Plot is the soul of tragedy",
          bekker: "1450a15-1450b20",
          minutes: 5,
          summary:
            "Of the six parts, plot, the arrangement of the incidents, matters most. Tragedy imitates action and life, not people as such; character makes us who we are, but we are happy or unhappy by what we do. A play can work without much character but not without action, and the most moving moments, reversals and recognitions, are parts of the plot. Aristotle compares a painting: lovely colours smeared at random give less pleasure than a simple outline of a portrait. So plot is the first principle and the soul of tragedy; character comes second, then thought, diction, song and spectacle.",
          passage: {
            text:
              "The plot, then, is the first principle, and, as it were, the soul of a tragedy; Character holds the second place. A similar fact is seen in painting. The most beautiful colors, laid on confusedly, will not give as much pleasure as the chalk outline of a portrait. Thus Tragedy is the imitation of an action, and of the agents mainly with a view to the action.",
            ref: "6, 1450a38-b4",
          },
          terms: [
            t("μῦθος", "mythos", "plot", "The arrangement of the incidents, the soul of tragedy."),
            t("ἦθος", "ēthos", "character", "What shows the kind of choices the agents make; second to plot."),
          ],
          checks: [
            k("What is the soul of a tragedy, according to the passage?", ["Character", "The plot", "Spectacle", "Song"], 1, "The passage says the plot is the first principle and, as it were, the soul of a tragedy."),
            k("What does the painting comparison show?", ["Colour matters more than form", "Beautiful colors laid on confusedly please less than a chalk outline", "Painting is better than tragedy", "Portraits should be colourful"], 1, "The most beautiful colors, laid on confusedly, give less pleasure than the chalk outline of a portrait, as plot outweighs ornament."),
          ],
          journal: "Do you know people more by what they are like or by what they do?",
        },
        {
          id: "beginning-middle-end",
          title: "A beginning, a middle and an end",
          bekker: "1450b21-1451a35",
          minutes: 5,
          summary:
            "Tragedy imitates a whole action, and a whole has a beginning, a middle and an end. A beginning does not follow anything by necessity but has something naturally after it; an end follows something by necessity or as a rule but has nothing after it; a middle follows one thing and is followed by another. So a good plot neither starts nor stops at random. A beautiful thing also needs the right size: large enough to be grand, small enough to be grasped as one. Unity of plot does not come from having one hero, since many things happen to one person that do not form one action.",
          passage: {
            text:
              "A whole is that which has a beginning, a middle, and an end. A beginning is that which does not itself follow anything by causal necessity, but after which something naturally is or comes to be. An end, on the contrary, is that which itself naturally follows some other thing, either by necessity, or as a rule, but has nothing following it. A middle is that which follows something as some other thing follows it.",
            ref: "7, 1450b26-31",
          },
          terms: [
            t("ὅλον", "holon", "whole", "Something complete, with beginning, middle and end."),
            t("ἀρχή", "archē", "beginning", "What follows nothing by necessity but has something after it."),
            t("τελευτή", "teleutē", "end", "What follows something by necessity or as a rule, with nothing after it."),
          ],
          checks: [
            k("What is a beginning, according to the passage?", ["Whatever comes first on the page", "That which does not follow anything by causal necessity, but after which something naturally comes", "The longest part of the play", "The hero's birth"], 1, "A beginning does not itself follow anything by causal necessity, but something naturally comes after it."),
            k("What marks an end?", ["It follows some other thing and has nothing following it", "It is the most exciting scene", "It always contains a death", "It repeats the beginning"], 0, "An end naturally follows some other thing, by necessity or as a rule, but has nothing following it."),
          ],
          journal: "Where does the story of the last year of your life really begin?",
        },
        {
          id: "poetry-and-history",
          title: "Poetry is more philosophical than history",
          bekker: "1451a36-1452a11",
          minutes: 5,
          summary:
            "The poet's task is to say not what happened but what could happen, what is possible by probability or necessity. The historian and poet do not differ by verse and prose; Herodotus in verse would still be history. The difference is that history tells what happened and poetry what may happen. So poetry is more philosophical and more serious than history, since it speaks of universals, the kind of thing a certain kind of person would say or do, while history speaks of particulars, such as what Alcibiades did. Aristotle adds that episodic plots, whose events do not follow from one another, are the worst.",
          passage: {
            text:
              "Poetry, therefore, is a more philosophical and a higher thing than history: for poetry tends to express the universal, history the particular. By the universal I mean how a person of a certain type on occasion speak or act, according to the law of probability or necessity; and it is this universality at which poetry aims in the names she attaches to the personages.",
            ref: "9, 1451b5-10",
          },
          terms: [
            t("καθόλου", "katholou", "universal", "What holds of a kind, such as what a type of person would do."),
            t("καθ᾽ ἕκαστον", "kath' hekaston", "particular", "A single fact, such as what Alcibiades did."),
            t("εἰκός", "eikos", "probable, likely", "What usually happens, the standard a plot must meet."),
          ],
          checks: [
            k("Why is poetry more philosophical than history, according to the passage?", ["It uses verse", "Poetry tends to express the universal, history the particular", "Poetry is older", "Poets are better educated"], 1, "Poetry tends to express the universal, history the particular."),
            k("What does Aristotle mean by the universal?", ["Everything that has ever happened", "How a person of a certain type would speak or act by probability or necessity", "The laws of nature", "The gods' plans"], 1, "He means how a person of a certain type on occasion would speak or act, according to probability or necessity."),
          ],
          journal: "Which made-up story has told you more about real people than a true account did?",
        },
      ],
    },
    {
      id: "chapters-10-19",
      title: "Chapters 10-19: Reversal, the tragic hero and character",
      bekker: "1452a-1456b",
      line: "Explains reversal and recognition, who the tragic hero should be, and how character must be drawn.",
      lessons: [
        {
          id: "reversal-and-recognition",
          title: "Reversal and recognition",
          bekker: "1452a12-1452b13",
          minutes: 5,
          summary:
            "Plots are simple or complex. A complex plot turns by a reversal, a recognition or both, and these should grow out of the plot itself by probability or necessity. A reversal is a change of the action into its opposite: in Oedipus the messenger comes to cheer Oedipus and free him from fear about his mother, but by revealing who he is does the opposite. A recognition is a change from ignorance to knowledge, bringing love or hatred between those marked for good or bad fortune. The finest recognition comes together with a reversal, as in Oedipus. A third part of plot is suffering, a destructive or painful act.",
          passage: {
            text:
              "Reversal of the Situation is a change by which the action veers round to its opposite, subject always to our rule of probability or necessity. Thus in the Oedipus, the messenger comes to cheer Oedipus and free him from his alarms about his mother, but by revealing who he is, he produces the opposite effect.",
            ref: "11, 1452a22-26",
          },
          terms: [
            t("περιπέτεια", "peripeteia", "reversal", "A change of the action into its opposite."),
            t("ἀναγνώρισις", "anagnōrisis", "recognition", "A change from ignorance to knowledge."),
            t("πάθος", "pathos", "suffering", "A destructive or painful act, the third part of plot."),
          ],
          checks: [
            k("What is a reversal of the situation, according to the passage?", ["A change of scene", "A change by which the action veers round to its opposite", "The entrance of a god", "A change of actor"], 1, "It is a change by which the action veers round to its opposite, subject to probability or necessity."),
            k("What happens with the messenger in the Oedipus?", ["He comes to cheer Oedipus but, by revealing who he is, produces the opposite effect", "He brings news of victory", "He kills Oedipus", "He is never believed"], 0, "The messenger comes to cheer Oedipus but by revealing who he is produces the opposite effect."),
          ],
          journal: "When has trying to fix something brought about the very thing you feared?",
        },
        {
          id: "the-tragic-hero",
          title: "The tragic hero and the great error",
          bekker: "1452b28-1453a39",
          minutes: 6,
          summary:
            "Since tragedy should arouse pity and fear, some plots must be avoided. A good man falling from good to bad fortune is shocking, not pitiable or fearful. A bad man rising is the least tragic of all. A villain falling may satisfy our sense of justice but arouses neither pity, felt for undeserved misfortune, nor fear, felt for someone like us. What remains is a man between these: not outstanding in virtue and justice, who falls not through vice but through some great error (hamartia), and who is famous and prosperous, like Oedipus or Thyestes. Whether hamartia means a mistake of fact, a flaw of character or both is still debated.",
          passage: {
            text:
              "There remains, then, the character between these two extremes- that of a man who is not eminently good and just, yet whose misfortune is brought about not by vice or depravity, but by some error or frailty. He must be one who is highly renowned and prosperous- a personage like Oedipus, Thyestes, or other illustrious men of such families.",
            ref: "13, 1453a7-12",
          },
          terms: [
            t("ἁμαρτία", "hamartia", "error, mistake", "The cause of the hero's fall; whether a mistake or a flaw is debated."),
            t("μεταβολή", "metabolē", "change of fortune", "The turn from good fortune to bad, or bad to good."),
          ],
          checks: [
            k("What brings about the misfortune of the right kind of hero, according to the passage?", ["Vice or depravity", "Some error or frailty, not vice", "The anger of the gods alone", "Pure chance"], 1, "His misfortune is brought about not by vice or depravity, but by some error or frailty."),
            k("What kind of man should the hero be?", ["Eminently good and just", "Not eminently good and just, and highly renowned and prosperous", "A villain who rises", "An ordinary slave"], 1, "He is not eminently good and just, and he must be highly renowned and prosperous, like Oedipus or Thyestes."),
            k("Which statement about hamartia is fair to the text?", ["Aristotle defines it as a moral vice", "It is the cause of the fall and its exact sense is debated", "It means good luck", "It applies only to comedy"], 1, "The passage contrasts error with vice, and the summary notes scholars still debate whether it means a mistake or a flaw."),
          ],
          journal: "What mistake, not a vice, has cost you most?",
        },
        {
          id: "drawing-character",
          title: "How to draw character",
          bekker: "1454a15-1454b18",
          minutes: 5,
          summary:
            "In character the poet should aim at four things. First, characters should be good, which shows when their speech or action reveals a good choice; Aristotle says this is relative to each class of person, and his remarks about women and slaves reflect the prejudices of his time. Second, they should be appropriate to the kind of person. Third, they should be like life. Fourth, they should be consistent, and even an inconsistent person should be consistently inconsistent. As with plot, what a character says and does should follow by necessity or probability. The poet should also make people better than they are while keeping them recognizable, as good portrait painters do.",
          passage: {
            text:
              "In respect of Character there are four things to be aimed at. First, and most important, it must be good. Now any speech or action that manifests moral purpose of any kind will be expressive of character: the character will be good if the purpose is good. This rule is relative to each class.",
            ref: "15, 1454a16-20",
          },
          terms: [
            t("ἦθος", "ēthos", "character", "What a person's choices reveal about the kind of person they are."),
            t("προαίρεσις", "proairesis", "choice, moral purpose", "Deliberate choice, which speech and action reveal."),
            t("ὁμαλόν", "homalon", "consistent", "Even and steady across the play."),
          ],
          checks: [
            k("What is the first and most important aim in character, according to the passage?", ["It must be consistent", "It must be good", "It must be famous", "It must be lifelike"], 1, "The passage says first, and most important, it must be good."),
            k("When will a character be good?", ["When the purpose shown in speech or action is good", "When the actor is handsome", "When the character wins", "When the character is royal"], 0, "The character will be good if the purpose that speech or action manifests is good."),
          ],
          journal: "What choice you made recently would show a stranger your character?",
        },
      ],
    },
    {
      id: "chapters-20-22",
      title: "Chapters 20-22: Diction",
      bekker: "1456b-1459a",
      line: "Analyses the parts of language, the kinds of word, metaphor, and how a style can be clear and still distinguished.",
      lessons: [
        {
          id: "a-command-of-metaphor",
          title: "A command of metaphor",
          bekker: "1457b1-1459a16",
          minutes: 5,
          summary:
            "Aristotle sorts words into current, strange, metaphorical, ornamental, coined and altered. Metaphor gives a thing a name that belongs to something else: from genus to species, species to genus, species to species, or by analogy, as when old age is called the evening of life. A poet should use each kind fittingly, compound words for dithyramb, strange words for epic, metaphors for iambic verse. But the greatest thing by far is a command of metaphor. It cannot be learned from anyone else and is a sign of natural gift, because making good metaphors means seeing likenesses.",
          passage: {
            text:
              "But the greatest thing by far is to have a command of metaphor. This alone cannot be imparted by another; it is the mark of genius, for to make good metaphors implies an eye for resemblances.",
            ref: "22, 1459a5-8",
          },
          terms: [
            t("μεταφορά", "metaphora", "metaphor", "Applying to a thing a name that belongs to something else."),
            t("ἀναλογία", "analogia", "analogy, proportion", "A relation of four terms: as A is to B, so C is to D."),
            t("εὐφυΐα", "euphyia", "natural gift", "Being well endowed by nature, the source of good metaphors."),
          ],
          checks: [
            k("What is the greatest thing by far, according to the passage?", ["To know many rare words", "To have a command of metaphor", "To write long poems", "To follow the rules of meter"], 1, "The passage says the greatest thing by far is to have a command of metaphor."),
            k("Why is it the mark of genius?", ["Because it can be taught quickly", "Because making good metaphors implies an eye for resemblances", "Because only kings can do it", "Because it uses foreign words"], 1, "To make good metaphors implies an eye for resemblances, and this alone cannot be imparted by another."),
          ],
          journal: "What two unlike things in your life turn out to be alike?",
        },
        {
          id: "clear-without-being-mean",
          title: "Clear without being mean",
          bekker: "1458a18-1458b5",
          minutes: 4,
          summary:
            "The perfection of style is to be clear without being commonplace. The clearest style uses only current words, but it is flat. A style that uses unusual words, strange words, metaphors, lengthened forms, is lofty and raised above the everyday. Yet a style made only of these is a riddle, if it is all metaphor, or jargon, if it is all strange words. So the poet should mix them: unusual words give distinction and keep speech from being ordinary, while current words keep it clear. Aristotle mocks critics who ridicule any departure from ordinary speech, and says that propriety in using each kind is what matters.",
          passage: {
            text:
              "The perfection of style is to be clear without being mean. The clearest style is that which uses only current or proper words; at the same time it is mean- witness the poetry of Cleophon and of Sthenelus. That diction, on the other hand, is lofty and raised above the commonplace which employs unusual words.",
            ref: "22, 1458a18-22",
          },
          terms: [
            t("λέξις", "lexis", "diction, style", "The choice and arrangement of words."),
            t("κύριον ὄνομα", "kyrion onoma", "current word", "The ordinary word everyone uses for a thing."),
          ],
          checks: [
            k("What is the perfection of style, according to the passage?", ["To be as rare as possible", "To be clear without being mean", "To use only current words", "To be long"], 1, "The passage says the perfection of style is to be clear without being mean."),
            k("What is the weakness of a style using only current words?", ["It is unclear", "It is mean, or commonplace", "It is too lofty", "It is a riddle"], 1, "The clearest style uses only current words, but at the same time it is mean."),
          ],
          journal: "In your own writing, where do you lean too far toward plain or toward fancy?",
        },
      ],
    },
    {
      id: "chapters-23-26",
      title: "Chapters 23-26: Epic, criticism and the higher art",
      bekker: "1459a-1462b",
      line: "Compares epic with tragedy, answers critics' objections, and argues that tragedy is the higher art.",
      lessons: [
        {
          id: "probable-impossibilities",
          title: "Probable impossibilities",
          bekker: "1459b7-1460b5",
          minutes: 5,
          summary:
            "Epic shares tragedy's kinds and parts but can be longer and can tell many things happening at once, and its narrative form allows more of the marvellous, since we do not see the absurdities on stage. Homer, Aristotle says, taught poets to tell lies skilfully. He then gives a rule: the poet should prefer probable impossibilities to improbable possibilities. A story should not be built from irrational parts; anything irrational should be kept outside the action, as in Oedipus's ignorance of how Laius died. What matters is that the audience can believe the events follow, not whether they could really happen.",
          passage: {
            text:
              "Accordingly, the poet should prefer probable impossibilities to improbable possibilities. The tragic plot must not be composed of irrational parts. Everything irrational should, if possible, be excluded; or, at all events, it should lie outside the action of the play (as, in the Oedipus, the hero's ignorance as to the manner of Laius' death);",
            ref: "24, 1460a26-30",
          },
          terms: [
            t("ἀδύνατον", "adynaton", "impossible", "What cannot happen, which may still be convincing in a story."),
            t("ἄλογον", "alogon", "irrational", "What does not follow from the rest and should be kept out of the action."),
            t("πιθανόν", "pithanon", "convincing, persuasive", "What an audience can believe."),
          ],
          checks: [
            k("What should the poet prefer, according to the passage?", ["Improbable possibilities to probable impossibilities", "Probable impossibilities to improbable possibilities", "Only true events", "Only events from history"], 1, "The passage says the poet should prefer probable impossibilities to improbable possibilities."),
            k("Where should anything irrational lie, if it cannot be excluded?", ["At the climax", "Outside the action of the play", "In the chorus", "In the final scene"], 1, "Everything irrational should be excluded or lie outside the action of the play."),
          ],
          journal: "What story did you believe though it could never happen, and what made it convincing?",
        },
        {
          id: "tragedy-the-higher-art",
          title: "Why tragedy is the higher art",
          bekker: "1461b26-1462b19",
          minutes: 5,
          summary:
            "Some critics say epic is higher because it appeals to a better audience, while tragedy is vulgar, full of overacting. Aristotle answers that overacting is a fault of performers, not of the art, and tragedy can work its effect even when read. Then he argues that tragedy is superior. It has everything epic has, plus music and spectacle, which give vivid pleasures. It reaches its end in a shorter span, and concentrated effect pleases more than diluted. Epic has less unity, since one epic can supply plots for several tragedies. So tragedy, doing its proper work better, is the higher art. The text breaks off soon after.",
          passage: {
            text:
              "Moreover, the art attains its end within narrower limits for the concentrated effect is more pleasurable than one which is spread over a long time and so diluted. What, for example, would be the effect of the Oedipus of Sophocles, if it were cast into a form as long as the Iliad? Once more, the Epic imitation has less unity; as is shown by this, that any Epic poem will furnish subjects for several tragedies.",
            ref: "26, 1462a18-b7",
          },
          terms: [
            t("ἐποποιία", "epopoiia", "epic poetry", "Narrative poetry in one meter, such as the Iliad and Odyssey."),
            t("ἑνότης", "henotēs", "unity", "Being one whole action, which tragedy achieves more than epic."),
          ],
          checks: [
            k("Why is the concentrated effect of tragedy better, according to the passage?", ["It is cheaper to stage", "It is more pleasurable than one spread over a long time and diluted", "It uses more actors", "It needs no music"], 1, "The concentrated effect is more pleasurable than one which is spread over a long time and so diluted."),
            k("What shows that epic has less unity?", ["It has no hero", "Any epic poem will furnish subjects for several tragedies", "It is written in prose", "It has no plot"], 1, "The passage says any Epic poem will furnish subjects for several tragedies."),
          ],
          journal: "What have you enjoyed more because it was short and concentrated?",
        },
      ],
    },
  ],
};

export const POLITICS_RHETORIC_POETICS: Course[] = [POLITICS, ATHENIANS, RHETORIC, POETICS];
