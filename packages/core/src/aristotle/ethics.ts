import type { Course } from "./types";

// Ethics: the Nicomachean Ethics (W. D. Ross, 1908, from the MIT Internet Classics Archive), the Eudemian Ethics
// (J. Solomon, 1915) and the Magna Moralia (St. George Stock, 1915), both from the Oxford translation, volume IX, as
// scanned on archive.org. Passages are copied verbatim from those texts; the OCR of volume IX was checked by eye and
// only its scanning errors (broken hyphens, margin numbers, footnote marks) were removed.

const ROSS = { translator: "W. D. Ross", year: 1908, title: "The Nicomachean Ethics", url: "https://classics.mit.edu/Aristotle/nicomachaen.html" };
const OXFORD_IX = "https://archive.org/details/worksofaristotle0009wdro_l1v5";

export const ETHICS: Course[] = [
  {
    id: "nicomachean-ethics",
    title: "Nicomachean Ethics",
    greek: "Ἠθικὰ Νικομάχεια",
    latin: "Ethica Nicomachea",
    subject: "ethics",
    level: "Start here",
    bekker: "1094a-1181b",
    about:
      "What is the best life for a human being, and how does a person come to live it? Aristotle answers with an account of happiness as the activity of the soul in accordance with virtue, and works through character, choice, justice, practical wisdom, weakness of will, friendship and pleasure. It is the most read work of moral philosophy in the Western tradition, and the natural first work in this subject.",
    before: [],
    caveat: "",
    translation: ROSS,
    units: [
      {
        id: "book-1",
        title: "Book I: The good for a human being",
        bekker: "1094a1-1103a10",
        line: "Aristotle asks what the highest human good is and argues that it is happiness, an activity of the soul in accordance with virtue.",
        lessons: [
          {
            id: "every-action-aims-at-some-good",
            title: "Every action aims at some good",
            bekker: "1094a1-1094b11",
            minutes: 5,
            summary:
              "Aristotle opens by noting that every art, inquiry, action and choice seems to aim at some good. Some ends are activities and some are products beyond the activity, as health is the end of medicine and a ship the end of shipbuilding. Many arts serve higher ones: bridle-making serves riding, and riding serves strategy. If there is some end we want for its own sake, and want everything else for the sake of it, that end would be the chief good. Knowing it would help us in life, as archers do better with a target. Aristotle assigns the study of this good to political science, the master art that orders which sciences a city needs, because the good of a city is greater and more complete than the good of one person.",
            passage: {
              text: "Every art and every inquiry, and similarly every action and pursuit, is thought to aim at some good; and for this reason the good has rightly been declared to be that at which all things aim.",
              ref: "I.1, 1094a1-3",
            },
            terms: [
              { greek: "ἀγαθόν", translit: "agathon", english: "good", gloss: "That for the sake of which something is done or sought." },
              { greek: "τέλος", translit: "telos", english: "end", gloss: "The goal an activity is for; a complete end is sought for itself." },
            ],
            checks: [
              {
                q: "According to the passage, what has the good rightly been declared to be?",
                options: ["Whatever the city commands", "That at which all things aim", "The pleasure that follows an action", "A product separate from every activity"],
                answer: 1,
                why: "The passage says the good \"has rightly been declared to be that at which all things aim.\"",
              },
              {
                q: "Which science does Aristotle say studies the highest human good?",
                options: ["Medicine", "Strategy", "Political science", "Economics"],
                answer: 2,
                why: "He calls political science the master art, because it orders the other sciences and aims at the good of the whole city.",
              },
            ],
            journal: "What is one thing you pursue for its own sake, and what do you pursue only for the sake of it?",
          },
          {
            id: "precision-fits-the-subject",
            title: "Ask only the precision the subject allows",
            bekker: "1094b11-1095b13",
            minutes: 5,
            summary:
              "Before he begins, Aristotle warns that ethics cannot be as exact as mathematics. Fine and just actions admit of much variety, and even goods such as wealth and courage have ruined some people. So the conclusions of ethics hold only roughly and for the most part. An educated person looks for as much precision as the subject allows, no more and no less. For this reason a young person is not a good student of political science: the young lack experience of life and tend to follow their feelings, so the study would be of no use to them, since its aim is not knowledge but action. Aristotle adds that we should start from what is known to us, which is why a good upbringing matters.",
            passage: {
              text: "for it is the mark of an educated man to look for precision in each class of things just so far as the nature of the subject admits; it is evidently equally foolish to accept probable reasoning from a mathematician and to demand from a rhetorician scientific proofs.",
              ref: "I.3, 1094b23-27",
            },
            terms: [
              { greek: "ἀκρίβεια", translit: "akribeia", english: "precision", gloss: "Exactness; it varies with the subject studied." },
              { greek: "πολιτική", translit: "politikē", english: "political science", gloss: "The study of the human good for the individual and the city." },
            ],
            checks: [
              {
                q: "What does Aristotle say is the mark of an educated person?",
                options: ["Demanding proofs in every subject", "Looking for precision only as far as the subject admits", "Trusting rhetoricians over mathematicians", "Avoiding subjects that are not exact"],
                answer: 1,
                why: "The passage says the educated look \"for precision in each class of things just so far as the nature of the subject admits.\"",
              },
              {
                q: "Why is a young person not a good student of ethics, in Aristotle's view?",
                options: ["The young cannot do mathematics", "The young lack experience of life and follow their feelings", "The young are already virtuous", "The subject is too exact for them"],
                answer: 1,
                why: "He says the young lack experience of the actions of life and tend to follow their passions, so the study, which aims at action, does them no good.",
              },
            ],
            journal: "Where in your own life have you wanted more certainty than the question could give?",
          },
          {
            id: "three-lives-and-the-function-of-a-human",
            title: "Happiness and the human function",
            bekker: "1095b14-1098b8",
            minutes: 6,
            summary:
              "Everyone agrees that the highest good is happiness, but people disagree about what happiness is. Aristotle reviews three prominent lives: the life of enjoyment, which he finds fit for cattle; the political life of honour, which depends too much on those who give the honour; and the contemplative life, which he will examine later. Happiness must be complete and self-sufficient, chosen always for itself. To say what it is, he asks about the function of a human being. Nutrition and growth we share with plants and perception with animals, so the human function is an activity of the soul that involves reason. A good human being does this well, so the human good is activity of soul in accordance with virtue, and over a complete life.",
            passage: {
              text: "human good turns out to be activity of soul in accordance with virtue, and if there are more than one virtue, in accordance with the best and most complete. But we must add 'in a complete life.' For one swallow does not make a summer, nor does one day;",
              ref: "I.7, 1098a16-19",
            },
            terms: [
              { greek: "εὐδαιμονία", translit: "eudaimonia", english: "happiness", gloss: "Living well and doing well; the highest human good." },
              { greek: "ἔργον", translit: "ergon", english: "function", gloss: "The characteristic work or activity of a thing." },
              { greek: "ἀρετή", translit: "aretē", english: "virtue, excellence", gloss: "What makes a thing do its function well." },
            ],
            checks: [
              {
                q: "What does the passage say the human good turns out to be?",
                options: ["Pleasure in a complete life", "Honour given by the city", "Activity of soul in accordance with virtue", "Wealth used wisely"],
                answer: 2,
                why: "The passage states that \"human good turns out to be activity of soul in accordance with virtue.\"",
              },
              {
                q: "What is the point of the saying about one swallow?",
                options: ["Happiness needs a complete life, not a short time", "Birds have a function too", "Summer is the happiest season", "One good act makes a person virtuous"],
                answer: 0,
                why: "Aristotle adds \"in a complete life\" and uses the swallow to show that one day or a short time does not make a person happy.",
              },
              {
                q: "Why does Aristotle reject the life of honour as the highest good?",
                options: ["Honour is a bodily pleasure", "Honour depends more on those who give it than on the one honoured", "Honour is impossible to get", "Honour belongs only to gods"],
                answer: 1,
                why: "He says honour seems too superficial, since it rests with those who confer it rather than with the person honoured.",
              },
            ],
            journal: "If someone looked at your days, which of the three lives would they say you are living?",
          },
          {
            id: "happiness-and-fortune",
            title: "Happiness, fortune and the parts of the soul",
            bekker: "1098b9-1103a10",
            minutes: 6,
            summary:
              "Aristotle tests his definition against common opinions. Happiness needs some external goods, such as friends, wealth and good birth, because it is hard to act finely without resources. It also needs a complete life, since great misfortune can strike even the prosperous, as it struck Priam of Troy. Yet the good person bears misfortune nobly and makes the best of circumstances, as a good general uses the army he has, so he will never become miserable, though he may fall short of blessedness. Because happiness is activity of soul in accordance with virtue, Aristotle turns to the soul. One part lacks reason; of this, the nutritive part has no share in reason, while the appetitive part can listen to reason. This gives two kinds of virtue: intellectual and moral.",
            passage: {
              text: "For there is required, as we said, not only complete virtue but also a complete life, since many changes occur in life, and all manner of chances, and the most prosperous may fall into great misfortunes in old age, as is told of Priam in the Trojan Cycle; and one who has experienced such chances and has ended wretchedly no one calls happy.",
              ref: "I.9, 1100a4-9",
            },
            terms: [
              { greek: "τύχη", translit: "tychē", english: "fortune, chance", gloss: "What happens to us beyond our control." },
              { greek: "ψυχή", translit: "psychē", english: "soul", gloss: "The life of a living thing; it has a rational and a non-rational part." },
            ],
            checks: [
              {
                q: "Why does Aristotle mention Priam in the passage?",
                options: ["As a model of virtue", "To show that a prosperous man can meet great misfortune in old age", "To show that kings cannot be happy", "To prove that happiness is pleasure"],
                answer: 1,
                why: "Priam is the example of how \"the most prosperous may fall into great misfortunes in old age.\"",
              },
              {
                q: "Besides complete virtue, what does the passage say happiness requires?",
                options: ["A complete life", "Noble birth alone", "Honour from the gods", "Freedom from all emotion"],
                answer: 0,
                why: "The passage says there is required \"not only complete virtue but also a complete life.\"",
              },
            ],
            journal: "What would it mean for you to bear a misfortune nobly rather than be ruined by it?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Virtue of character",
        bekker: "1103a14-1109b26",
        line: "Aristotle shows that virtue of character comes from habit and defines it as a settled state of choosing the mean.",
        lessons: [
          {
            id: "we-become-just-by-doing-just-acts",
            title: "We become just by doing just acts",
            bekker: "1103a14-1104b3",
            minutes: 5,
            summary:
              "Intellectual virtue grows mostly through teaching, but virtue of character comes from habit, which is why its Greek name, ēthikē, is close to ethos, habit. No virtue of character is in us by nature, since nothing natural can be trained otherwise: a stone cannot be taught to rise. We are fitted by nature to receive the virtues, and they are completed by habit. We get them, as we get the arts, by first doing their acts. Builders become builders by building, and people become just by doing just acts. Legislators make citizens good by forming habits in them. So it matters a great deal how we are trained from youth; it makes all the difference. Aristotle adds that the point of this study is not to know what virtue is but to become good.",
            passage: {
              text: "For the things we have to learn before we can do them, we learn by doing them, e.g. men become builders by building and lyreplayers by playing the lyre; so too we become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.",
              ref: "II.1, 1103a32-b2",
            },
            terms: [
              { greek: "ἔθος", translit: "ethos", english: "habit", gloss: "Custom formed by repeated action." },
              { greek: "ἦθος", translit: "ēthos", english: "character", gloss: "The settled disposition that habit forms." },
            ],
            checks: [
              {
                q: "How, according to the passage, do we become just?",
                options: ["By being born just", "By studying definitions of justice", "By doing just acts", "By obeying the gods"],
                answer: 2,
                why: "The passage says \"we become just by doing just acts,\" as builders become builders by building.",
              },
              {
                q: "Why does Aristotle say no virtue of character is in us by nature?",
                options: ["Because nothing natural can be trained to behave otherwise, as a stone cannot learn to rise", "Because nature is evil", "Because only gods have virtue", "Because children cannot act"],
                answer: 0,
                why: "He argues that what is by nature cannot be habituated otherwise, like a stone that will not rise however often it is thrown up.",
              },
            ],
            journal: "What habit are you forming right now by repetition, whether you meant to or not?",
          },
          {
            id: "acting-as-the-virtuous-person-acts",
            title: "Doing the act is not yet having the virtue",
            bekker: "1104b3-1106a13",
            minutes: 5,
            summary:
              "Pleasure and pain are signs of character: a person who enjoys giving up bodily pleasures is temperate, while one who resents it is not. Then a puzzle: if we become just by doing just acts, must we not already be just to do them? Aristotle answers that an act can be just in outward form without the agent being just. To act virtuously a person must know what he is doing, choose the act for its own sake, and act from a firm and unchanging character. Many people take refuge in argument and think they are being philosophers, like patients who listen to the doctor and do nothing he says. Virtue, he concludes, is not a feeling or a capacity but a state of character.",
            passage: {
              text: "Actions, then, are called just and temperate when they are such as the just or the temperate man would do; but it is not the man who does these that is just and temperate, but the man who also does them as just and temperate men do them.",
              ref: "II.4, 1105b5-9",
            },
            terms: [
              { greek: "ἕξις", translit: "hexis", english: "state, disposition", gloss: "A settled condition from which a person acts and feels." },
              { greek: "πάθος", translit: "pathos", english: "feeling, passion", gloss: "Something we undergo, such as anger, fear or pity." },
            ],
            checks: [
              {
                q: "According to the passage, who is just and temperate?",
                options: ["Anyone who does just acts once", "The one who also does them as just and temperate people do them", "The one who talks well about justice", "The one who feels no desire at all"],
                answer: 1,
                why: "The passage says it is \"the man who also does them as just and temperate men do them.\"",
              },
              {
                q: "What does Aristotle compare people who only argue about virtue to?",
                options: ["Builders without tools", "Patients who listen to the doctor but do nothing he says", "Archers without a target", "Children at play"],
                answer: 1,
                why: "He says such people are like patients who listen carefully to their doctors but follow none of their orders.",
              },
            ],
            journal: "Is there a good act you do outwardly but not yet from the heart, and what would change if you did?",
          },
          {
            id: "virtue-is-a-mean",
            title: "Virtue is a mean relative to us",
            bekker: "1106a14-1108b10",
            minutes: 6,
            summary:
              "Every excellence makes its bearer good and do its work well. In anything continuous we can take more, less or an equal amount. The mean of the thing is fixed, like six between ten and two, but the mean relative to us differs by person: a trainer will not order six pounds of food for every athlete. Virtue aims at the intermediate in feelings and actions: to feel fear, anger or pity at the right times, about the right things, towards the right people, for the right end and in the right way. So virtue is a state concerned with choice, lying in a mean relative to us, fixed by reason as the person of practical wisdom would fix it. Some acts, such as murder or adultery, have no mean; they are bad in themselves.",
            passage: {
              text: "Virtue, then, is a state of character concerned with choice, lying in a mean, i.e. the mean relative to us, this being determined by a rational principle, and by that principle by which the man of practical wisdom would determine it.",
              ref: "II.6, 1106b36-1107a2",
            },
            terms: [
              { greek: "μεσότης", translit: "mesotēs", english: "mean", gloss: "The intermediate between excess and deficiency, relative to us." },
              { greek: "προαίρεσις", translit: "prohairesis", english: "choice", gloss: "Deliberate desire for something in our power." },
              { greek: "φρόνιμος", translit: "phronimos", english: "person of practical wisdom", gloss: "The one whose judgement sets the mean." },
            ],
            checks: [
              {
                q: "By whose judgement, according to the definition, is the mean determined?",
                options: ["The majority of citizens", "The man of practical wisdom", "The gods", "Each person's feelings"],
                answer: 1,
                why: "The definition says the mean is determined \"by that principle by which the man of practical wisdom would determine it.\"",
              },
              {
                q: "Why does a trainer not order six pounds of food for every athlete?",
                options: ["Because six is too much for anyone", "Because the mean relative to us differs from person to person", "Because food is not a virtue", "Because athletes should fast"],
                answer: 1,
                why: "The example shows that the mean relative to us is not the same for everyone, unlike the arithmetic mean.",
              },
            ],
            journal: "In which feeling, anger, fear or desire, do you most often miss the mean, and in which direction?",
          },
          {
            id: "it-is-hard-to-be-good",
            title: "Why it is hard to be good",
            bekker: "1108b11-1109b26",
            minutes: 5,
            summary:
              "Each virtue sits between two vices, and the extremes are more opposed to each other than to the mean: the brave person looks rash beside the coward and cowardly beside the rash. Sometimes one extreme is closer to the mean, as rashness is closer to courage. Hitting the mean is hard, as finding the centre of a circle is a task for one who knows. Anyone can get angry or spend money, but doing it to the right person, to the right extent, at the right time, for the right reason and in the right way is rare and noble. Aristotle gives practical advice: avoid the extreme more opposed to the mean, notice the errors we are prone to and drag ourselves the other way, and be most on guard against pleasure.",
            passage: {
              text: "For in everything it is no easy task to find the middle, e.g. to find the middle of a circle is not for every one but for him who knows; so, too, any one can get angry- that is easy- or give or spend money; but to do this to the right person, to the right extent, at the right time, with the right motive, and in the right way, that is not for every one, nor is it easy;",
              ref: "II.9, 1109a24-28",
            },
            terms: [
              { greek: "ὑπερβολή", translit: "hyperbolē", english: "excess", gloss: "Too much of a feeling or action." },
              { greek: "ἔλλειψις", translit: "elleipsis", english: "deficiency", gloss: "Too little of a feeling or action." },
            ],
            checks: [
              {
                q: "What does the passage say is easy?",
                options: ["Finding the middle of a circle", "Getting angry or spending money", "Acting with the right motive", "Being angry at the right time"],
                answer: 1,
                why: "The passage says \"any one can get angry- that is easy- or give or spend money.\"",
              },
              {
                q: "What practical advice does Aristotle give for reaching the mean?",
                options: ["Always choose the exact middle", "Drag yourself away from the errors you are prone to", "Avoid all pleasure forever", "Follow whatever others do"],
                answer: 1,
                why: "He advises noticing the errors we tend towards and pulling ourselves the other way, as people straighten bent wood.",
              },
            ],
            journal: "Which error are you most prone to, and what would it look like to pull yourself the other way this week?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: Choice and responsibility",
        bekker: "1109b30-1119b18",
        line: "Aristotle explains voluntary action, choice and deliberation, argues that we are responsible for our characters, and treats courage and temperance.",
        lessons: [
          {
            id: "voluntary-and-involuntary",
            title: "What makes an act voluntary",
            bekker: "1109b30-1111b3",
            minutes: 6,
            summary:
              "Praise and blame go to voluntary acts; pardon and sometimes pity go to involuntary ones. So the student of virtue, and the lawmaker, must know the difference. An act is involuntary when it is done under compulsion or through ignorance. It is compulsory when its moving principle is outside the agent and he contributes nothing, as when a wind carries him off. Acts done from fear of a greater evil, such as throwing cargo overboard in a storm, are mixed, but more like voluntary acts, since the agent chooses them at the moment. An act done through ignorance of the particular circumstances is involuntary if the agent regrets it afterwards. The voluntary, then, is what has its moving principle in the agent, who knows the particular circumstances of the action.",
            passage: {
              text: "and that is compulsory of which the moving principle is outside, being a principle in which nothing is contributed by the person who is acting or is feeling the passion, e.g. if he were to be carried somewhere by a wind, or by men who had him in their power.",
              ref: "III.1, 1110a1-4",
            },
            terms: [
              { greek: "ἑκούσιον", translit: "hekousion", english: "voluntary", gloss: "Done with its origin in the agent, who knows the circumstances." },
              { greek: "ἀκούσιον", translit: "akousion", english: "involuntary", gloss: "Done under compulsion or through ignorance." },
            ],
            checks: [
              {
                q: "According to the passage, when is an act compulsory?",
                options: ["When the agent feels fear", "When its moving principle is outside and the agent contributes nothing", "When the law forbids it", "When the agent regrets it"],
                answer: 1,
                why: "The passage defines the compulsory as that \"of which the moving principle is outside,\" with nothing contributed by the agent.",
              },
              {
                q: "How does Aristotle classify throwing cargo overboard in a storm?",
                options: ["Wholly involuntary", "Mixed, but more like voluntary", "Compulsory, like being blown away", "Not an action at all"],
                answer: 1,
                why: "He calls such acts mixed but more like voluntary, since the agent chooses them at the time they are done.",
              },
            ],
            journal: "Is there something you excuse yourself for as forced on you that was really, in Aristotle's sense, your own choice?",
          },
          {
            id: "we-deliberate-about-means",
            title: "Choice and deliberation",
            bekker: "1111b4-1113b2",
            minutes: 5,
            summary:
              "Choice is voluntary, but not everything voluntary is chosen: children and animals act voluntarily without choosing. Choice is not appetite, anger, wish or opinion. It involves reason and thought, and follows deliberation. We deliberate only about what is in our power and can be done, not about eternal things or about what happens by chance. And we deliberate not about ends but about what leads to them. A doctor does not deliberate whether to heal, but how. We take the end as given and work back through the means until we reach the first step we can take now. So choice is deliberate desire of things in our power. Wish, by contrast, is for the end, and the good person wishes for what is truly good.",
            passage: {
              text: "We deliberate not about ends but about means. For a doctor does not deliberate whether he shall heal, nor an orator whether he shall persuade, nor a statesman whether he shall produce law and order, nor does any one else deliberate about his end.",
              ref: "III.3, 1112b11-15",
            },
            terms: [
              { greek: "βούλευσις", translit: "bouleusis", english: "deliberation", gloss: "Reasoning about how to bring about an end." },
              { greek: "βούλησις", translit: "boulēsis", english: "wish", gloss: "Rational desire for an end." },
            ],
            checks: [
              {
                q: "What does the passage say we deliberate about?",
                options: ["Ends", "Means", "Eternal truths", "Chance events"],
                answer: 1,
                why: "The passage opens: \"We deliberate not about ends but about means.\"",
              },
              {
                q: "What does a doctor not deliberate about, according to the passage?",
                options: ["Which medicine to give", "Whether he shall heal", "How to heal", "When to operate"],
                answer: 1,
                why: "The passage says \"a doctor does not deliberate whether he shall heal\"; healing is his end.",
              },
            ],
            journal: "Which of your ends have you never deliberated about, and should you?",
          },
          {
            id: "we-are-responsible-for-our-characters",
            title: "We are responsible for our characters",
            bekker: "1113b3-1115a6",
            minutes: 5,
            summary:
              "If acting well and badly is in our power, then being good or bad is in our power too. Lawgivers punish wrongdoers and honour those who act well, which shows they think such acts voluntary. They even punish ignorance when a person is responsible for it, as when he is drunk. Someone might say he simply is careless by nature. Aristotle answers that people become unjust and self-indulgent by acting unjustly and indulgently, and that it is foolish to say a person does not know that activity forms character. Once a character is formed it may be hard to change, as a stone once thrown cannot be called back, but it was in our power to throw it. So our states of character are voluntary in a way our single acts are not quite.",
            passage: {
              text: "Now if it is in our power to do noble or base acts, and likewise in our power not to do them, and this was what being good or bad meant, then it is in our power to be virtuous or vicious.",
              ref: "III.5, 1113b11-14",
            },
            terms: [
              { greek: "ἐφ᾽ ἡμῖν", translit: "eph' hēmin", english: "in our power", gloss: "Up to us to do or not to do." },
              { greek: "ἀρχή", translit: "archē", english: "origin, principle", gloss: "A human being is the origin of his own actions." },
            ],
            checks: [
              {
                q: "What follows, according to the passage, if noble and base acts are in our power?",
                options: ["That virtue is a gift of the gods", "That it is in our power to be virtuous or vicious", "That no one is responsible for anything", "That only the law makes us good"],
                answer: 1,
                why: "The passage concludes \"then it is in our power to be virtuous or vicious.\"",
              },
              {
                q: "What does the image of the thrown stone show?",
                options: ["That character cannot be formed", "That once formed a character is hard to change, though forming it was in our power", "That stones have no function", "That anger passes quickly"],
                answer: 1,
                why: "Aristotle says a stone once thrown cannot be recovered, yet throwing it was in our power; the same holds for character.",
              },
            ],
            journal: "Which part of your character did you make by what you kept doing?",
          },
          {
            id: "courage-and-temperance",
            title: "Courage and temperance",
            bekker: "1115a6-1119b18",
            minutes: 6,
            summary:
              "Aristotle now treats the virtues one by one, beginning with courage, the mean concerning fear and confidence. Not every fear concerns courage: fearing disgrace is right, and being unafraid of it is shameless. Courage is about the greatest fearful thing, death, and above all death in battle. The brave person fears what he should, as he should and when he should, and endures for the sake of what is noble. Aristotle also describes states that resemble courage, such as the citizen soldier's, the experienced soldier's and courage from anger or hope. Temperance is the mean concerning bodily pleasures, especially of touch and taste. The self-indulgent person craves them too much; the temperate person desires them moderately, as is right.",
            passage: {
              text: "Properly, then, he will be called brave who is fearless in face of a noble death, and of all emergencies that involve death; and the emergencies of war are in the highest degree of this kind.",
              ref: "III.6, 1115a32-35",
            },
            terms: [
              { greek: "ἀνδρεία", translit: "andreia", english: "courage", gloss: "The mean concerning fear and confidence." },
              { greek: "σωφροσύνη", translit: "sōphrosynē", english: "temperance", gloss: "The mean concerning bodily pleasures." },
              { greek: "καλόν", translit: "kalon", english: "the noble, the fine", gloss: "What is beautiful in action; virtue acts for its sake." },
            ],
            checks: [
              {
                q: "Who, according to the passage, will properly be called brave?",
                options: ["One who fears nothing at all", "One who is fearless in face of a noble death", "One who avoids every danger", "One who fears disgrace"],
                answer: 1,
                why: "The passage says the brave man is \"fearless in face of a noble death, and of all emergencies that involve death.\"",
              },
              {
                q: "Which pleasures is temperance concerned with?",
                options: ["Pleasures of learning", "Bodily pleasures, especially of touch and taste", "The pleasure of honour", "All pleasures equally"],
                answer: 1,
                why: "Aristotle limits temperance to bodily pleasures, chiefly those of touch and taste.",
              },
            ],
            journal: "What is the fear you most need courage for, and what noble thing would facing it serve?",
          },
        ],
      },
      {
        id: "book-4",
        title: "Book IV: The virtues of everyday life",
        bekker: "1119b22-1128b35",
        line: "Aristotle describes the virtues concerning money, honour, anger and social life, each a mean between two vices.",
        lessons: [
          {
            id: "liberality-and-magnificence",
            title: "Generosity with money",
            bekker: "1119b22-1123a33",
            minutes: 5,
            summary:
              "Liberality, or generosity, is the mean concerning the giving and taking of wealth, especially giving. The liberal person gives to the right people, the right amounts, at the right time, and gives with pleasure, or at least without pain. He takes only from the right sources and cares for his property so that he can give. Prodigality gives too much and takes too little; meanness gives too little and takes too much. Aristotle judges the prodigal easier to cure than the mean person, since age and poverty can correct him. Magnificence is a related virtue concerning great expenditure, such as public works or festivals, done tastefully and for the sake of the noble. Its vices are tastelessness and niggardliness.",
            passage: {
              text: "Liberality, then, being a mean with regard to giving and taking of wealth, the liberal man will both give and spend the right amounts and on the right objects, alike in small things and in great, and that with pleasure; he will also take the right amounts and from the right sources.",
              ref: "IV.1, 1120b27-31",
            },
            terms: [
              { greek: "ἐλευθεριότης", translit: "eleutheriotēs", english: "liberality", gloss: "Generosity: the mean in giving and taking wealth." },
              { greek: "μεγαλοπρέπεια", translit: "megaloprepeia", english: "magnificence", gloss: "Fitting expense on a great scale." },
            ],
            checks: [
              {
                q: "How, according to the passage, does the liberal man give?",
                options: ["Reluctantly but generously", "The right amounts on the right objects, and with pleasure", "Everything he has", "Only to his friends"],
                answer: 1,
                why: "The passage says he will \"give and spend the right amounts and on the right objects... and that with pleasure.\"",
              },
              {
                q: "Which vice does Aristotle think easier to cure?",
                options: ["Meanness", "Prodigality", "Both equally", "Neither"],
                answer: 1,
                why: "He says the prodigal can be cured by age and lack of means, while meanness is incurable and more natural to people.",
              },
            ],
            journal: "When did you last give gladly, and what made it glad?",
          },
          {
            id: "greatness-of-soul",
            title: "Greatness of soul",
            bekker: "1123a34-1125b25",
            minutes: 6,
            summary:
              "The great-souled or proud person thinks himself worthy of great things and is worthy of them. One who claims more than he deserves is vain; one who claims less is unduly humble. The greatest external good is honour, so greatness of soul concerns honour above all. Because the great-souled person must be good in the highest degree, this virtue seems to be a kind of crown of the virtues, which cannot exist without them. He is moderate towards wealth, power and fortune, neither overjoyed by good luck nor crushed by bad. Aristotle draws his portrait: he gives benefits but is ashamed to receive them, speaks openly, does not bear grudges, and does not run after small honours. Readers have long disputed how far Aristotle admires this portrait.",
            passage: {
              text: "Now the man is thought to be proud who thinks himself worthy of great things, being worthy of them; for he who does so beyond his deserts is a fool, but no virtuous man is foolish or silly.",
              ref: "IV.3, 1123b1-4",
            },
            terms: [
              { greek: "μεγαλοψυχία", translit: "megalopsychia", english: "greatness of soul, pride", gloss: "Rightly claiming great honour when one deserves it." },
              { greek: "τιμή", translit: "timē", english: "honour", gloss: "The greatest of external goods, in Aristotle's account." },
            ],
            checks: [
              {
                q: "Who is proud, according to the passage?",
                options: ["One who thinks himself worthy of great things, being worthy of them", "One who claims more than he deserves", "One who seeks no honour at all", "One who is worthy but claims little"],
                answer: 0,
                why: "The passage says the proud man \"thinks himself worthy of great things, being worthy of them.\"",
              },
              {
                q: "What does Aristotle call one who claims less than he deserves?",
                options: ["Vain", "Unduly humble", "Temperate", "Great-souled"],
                answer: 1,
                why: "He names the one who thinks himself worthy of less than he deserves unduly humble.",
              },
            ],
            journal: "Do you tend to claim more or less than you are worth, and how do you know?",
          },
          {
            id: "virtues-of-social-life",
            title: "Temper, truthfulness and wit",
            bekker: "1125b26-1128b35",
            minutes: 5,
            summary:
              "Several virtues concern anger and life with others. Good temper is the mean concerning anger: the good-tempered person is angry at the right things and people, as he should, when and for as long as he should. Friendliness is the mean between flattering everyone and quarrelling with everyone. Truthfulness about oneself is the mean between boastfulness, which claims more than one has, and mock modesty, which claims less. Ready wit is the mean between the buffoon, who will say anything for a laugh, and the boor, who can neither make a joke nor bear one. Some of these means have no name in Greek, and Aristotle names them as he goes. Shame, he adds, is more a feeling than a virtue, fitting for the young.",
            passage: {
              text: "The boastful man, then, is thought to be apt to claim the things that bring glory, when he has not got them, or to claim more of them than he has, and the mock-modest man on the other hand to disclaim what he has or belittle it, while the man who observes the mean is one who calls a thing by its own name, being truthful both in life and in word, owning to what he has, and neither more nor less.",
              ref: "IV.7, 1127a20-26",
            },
            terms: [
              { greek: "πραότης", translit: "praotēs", english: "good temper", gloss: "The mean concerning anger." },
              { greek: "εὐτραπελία", translit: "eutrapelia", english: "ready wit", gloss: "Tactful humour between buffoonery and boorishness." },
            ],
            checks: [
              {
                q: "How does the passage describe the man who observes the mean in truthfulness?",
                options: ["He disclaims what he has", "He claims things that bring glory", "He calls a thing by its own name, owning neither more nor less than he has", "He stays silent about himself"],
                answer: 2,
                why: "The passage says he \"calls a thing by its own name... owning to what he has, and neither more nor less.\"",
              },
              {
                q: "Who is the buffoon, in Aristotle's account of wit?",
                options: ["One who cannot take a joke", "One who will say anything to raise a laugh", "One who jokes tactfully", "One who never speaks"],
                answer: 1,
                why: "He describes the buffoon as a slave to his sense of humour, sparing no one if he can raise a laugh.",
              },
            ],
            journal: "In conversation, do you lean toward boasting or toward belittling yourself, and what does that protect?",
          },
        ],
      },
      {
        id: "book-5",
        title: "Book V: Justice",
        bekker: "1129a3-1138b14",
        line: "Aristotle distinguishes justice as the whole of virtue toward others from particular justice in distribution and exchange, and treats natural justice and equity.",
        lessons: [
          {
            id: "justice-as-complete-virtue",
            title: "Justice as complete virtue toward others",
            bekker: "1129a3-1130b5",
            minutes: 5,
            summary:
              "The word just has two main senses: the lawful and the fair. In the first sense, laws command acts of every virtue: not to desert one's post, not to commit adultery, not to strike another. So justice in this sense is complete virtue, but exercised towards others. That is why justice is often thought the greatest of the virtues, finer than the evening or morning star. Many people can be virtuous in their own affairs but not towards their neighbour, which is why the saying goes that office will show the man. The worst person is the one who is wicked towards himself and his friends; the best is the one who is good towards others, which is hard. Aristotle then turns to justice in the narrower sense, a part of virtue.",
            passage: {
              text: "This form of justice, then, is complete virtue, but not absolutely, but in relation to our neighbour. And therefore justice is often thought to be the greatest of virtues, and 'neither evening nor morning star' is so wonderful; and proverbially 'in justice is every virtue comprehended'.",
              ref: "V.1, 1129b25-30",
            },
            terms: [
              { greek: "δικαιοσύνη", translit: "dikaiosynē", english: "justice", gloss: "Virtue as it is exercised towards others." },
              { greek: "νόμιμον", translit: "nomimon", english: "the lawful", gloss: "One sense of just: what the laws require." },
            ],
            checks: [
              {
                q: "In what relation, according to the passage, is this form of justice complete virtue?",
                options: ["Absolutely, in every respect", "In relation to our neighbour", "In relation to the gods", "In relation to oneself alone"],
                answer: 1,
                why: "The passage says it is complete virtue \"not absolutely, but in relation to our neighbour.\"",
              },
              {
                q: "What does the saying \"office will show the man\" point to?",
                options: ["That rulers are always just", "That holding power with others tests whether one is virtuous towards them", "That offices should be elected", "That justice is a feeling"],
                answer: 1,
                why: "Aristotle quotes it because a ruler acts towards others and the community, which reveals his justice.",
              },
            ],
            journal: "Where are you good in your own affairs but less good towards others?",
          },
          {
            id: "distributive-and-corrective-justice",
            title: "Fair shares and fair corrections",
            bekker: "1130b6-1134a16",
            minutes: 6,
            summary:
              "Particular justice concerns the fair. One kind is distributive: honours and wealth are shared among citizens in proportion to merit, though people dispute what counts as merit, free birth for democrats, wealth for oligarchs, excellence for aristocrats. The just here is a proportion, and the unjust is what violates it. A second kind is corrective: in transactions, voluntary like a sale or involuntary like theft, the law looks only at the harm and treats the parties as equal. The judge restores equality, taking from the one who has too much the amount by which he exceeds the middle. Aristotle also discusses exchange, where money serves as a measure that makes different goods commensurable, and holds the community together.",
            passage: {
              text: "Now the judge restores equality; it is as though there were a line divided into unequal parts, and he took away that by which the greater segment exceeds the half, and added it to the smaller segment. And when the whole has been equally divided, then they say they have 'their own'-i.e. when they have got what is equal.",
              ref: "V.4, 1132a24-29",
            },
            terms: [
              { greek: "ἀνάλογον", translit: "analogon", english: "proportion", gloss: "Equality of ratios; the just in distribution." },
              { greek: "διορθωτικόν", translit: "diorthōtikon", english: "corrective", gloss: "Justice that restores equality in transactions." },
            ],
            checks: [
              {
                q: "What does the judge do, according to the passage?",
                options: ["Punishes both parties equally", "Restores equality by taking the excess from the greater part and adding it to the smaller", "Gives everything to the more worthy party", "Divides the line at random"],
                answer: 1,
                why: "The passage says the judge \"took away that by which the greater segment exceeds the half, and added it to the smaller segment.\"",
              },
              {
                q: "In distributive justice, how are goods shared?",
                options: ["Exactly equally, regardless of merit", "In proportion to merit", "By lot", "By the will of the strongest"],
                answer: 1,
                why: "Aristotle says distributive justice follows proportion to merit, though people disagree about what merit is.",
              },
            ],
            journal: "In a dispute you know of, would fairness mean equal shares or shares by merit?",
          },
          {
            id: "natural-and-legal-justice",
            title: "What is just by nature and by law",
            bekker: "1134a17-1136a9",
            minutes: 5,
            summary:
              "Political justice is found among free and equal people living under law. Of political justice, part is natural and part is legal. The natural has the same force everywhere and does not depend on what people think. The legal is at first indifferent, but once laid down it binds: that a ransom shall be one mina, or that a goat and not two sheep shall be sacrificed. Some think all justice is conventional, because they see rules change while fire burns both here and in Persia. Aristotle grants that among us everything is changeable, yet still holds that some things are just by nature. He compares conventional rules to measures, which are larger in wholesale than in retail markets.",
            passage: {
              text: "Of political justice part is natural, part legal, natural, that which everywhere has the same force and does not exist by people's thinking this or that; legal, that which is originally indifferent, but when it has been laid down is not indifferent, e.g. that a prisoner's ransom shall be a mina, or that a goat and not two sheep shall be sacrificed,",
              ref: "V.7, 1134b18-22",
            },
            terms: [
              { greek: "φυσικὸν δίκαιον", translit: "physikon dikaion", english: "natural justice", gloss: "What is just everywhere, whatever people think." },
              { greek: "νομικὸν δίκαιον", translit: "nomikon dikaion", english: "legal justice", gloss: "What is just because it has been laid down." },
            ],
            checks: [
              {
                q: "How does the passage define what is naturally just?",
                options: ["What a city's law decides", "What everywhere has the same force, whatever people think", "What the majority prefers", "What the gods command in sacrifices"],
                answer: 1,
                why: "The passage says the natural is \"that which everywhere has the same force and does not exist by people's thinking this or that.\"",
              },
              {
                q: "Which is given as an example of legal justice?",
                options: ["Not killing the innocent", "That a prisoner's ransom shall be a mina", "Honouring parents", "Keeping promises"],
                answer: 1,
                why: "The passage gives the ransom of a mina and the sacrifice of a goat as rules that bind only once laid down.",
              },
            ],
            journal: "Name one rule you follow that is only convention and one you think would hold anywhere: what makes the difference?",
          },
          {
            id: "equity-corrects-the-law",
            title: "Equity corrects the law",
            bekker: "1136a10-1138b14",
            minutes: 5,
            summary:
              "Aristotle asks whether a person can be wronged willingly and whether one can wrong oneself, and answers no to both in the strict sense. Then he turns to equity. The equitable is just, yet better than one kind of justice. Law is always universal, but some cases cannot be covered correctly by a universal rule. When a case arises that the law did not foresee, it is right to correct the omission and to say what the lawgiver himself would have said if he had been present. So equity is a correction of law where it fails because of its generality. It is like the leaden rule of Lesbian builders, which bends to the shape of the stone. The equitable person does not insist on the letter of his rights.",
            passage: {
              text: "And this is the nature of the equitable, a correction of law where it is defective owing to its universality. In fact this is the reason why all things are not determined by law, that about some things it is impossible to lay down a law, so that a decree is needed.",
              ref: "V.10, 1137b26-29",
            },
            terms: [
              { greek: "ἐπιείκεια", translit: "epieikeia", english: "equity, reasonableness", gloss: "Correcting a law where its generality makes it fail." },
              { greek: "ψήφισμα", translit: "psēphisma", english: "decree", gloss: "A decision fitted to a particular case." },
            ],
            checks: [
              {
                q: "What does the passage say the equitable is?",
                options: ["A replacement for all law", "A correction of law where it is defective owing to its universality", "The strict letter of the law", "Mercy without justice"],
                answer: 1,
                why: "The passage defines the equitable as \"a correction of law where it is defective owing to its universality.\"",
              },
              {
                q: "What is the point of the leaden rule of Lesbian builders?",
                options: ["Measures should never change", "A rule that adapts to the shape of the case, as equity does", "Lead is a soft metal", "Builders should follow the law"],
                answer: 1,
                why: "The leaden rule bends to the shape of the stone, as a decree fits the particular case.",
              },
            ],
            journal: "When have you seen a fair rule work unfairly in a particular case, and what would equity have done?",
          },
        ],
      },
      {
        id: "book-6",
        title: "Book VI: Intellectual virtue",
        bekker: "1138b18-1145a11",
        line: "Aristotle sets out the virtues of thought and shows how practical wisdom and virtue of character need each other.",
        lessons: [
          {
            id: "five-ways-the-soul-grasps-truth",
            title: "Five ways the soul grasps truth",
            bekker: "1138b18-1140a23",
            minutes: 5,
            summary:
              "The definition of virtue said the mean is set by right reason, so Aristotle must say what right reason is. The rational part of the soul has two parts: one knows things that cannot be otherwise, the other things that can. In practical thought, the reasoning must be true and the desire right, if choice is to be good. He lists five states by which the soul reaches truth in affirming or denying: art, scientific knowledge, practical wisdom, philosophic wisdom and intuitive reason. Scientific knowledge concerns what is necessary and eternal and can be demonstrated. Art concerns making, a reasoned state of producing things, and differs from acting, whose end is the action itself.",
            passage: {
              text: "Let it be assumed that the states by virtue of which the soul possesses truth by way of affirmation or denial are five in number, i.e. art, scientific knowledge, practical wisdom, philosophic wisdom, intuitive reason; we do not include judgement and opinion because in these we may be mistaken.",
              ref: "VI.3, 1139b15-18",
            },
            terms: [
              { greek: "ἐπιστήμη", translit: "epistēmē", english: "scientific knowledge", gloss: "Demonstrable knowledge of what cannot be otherwise." },
              { greek: "τέχνη", translit: "technē", english: "art, craft", gloss: "A reasoned state concerned with making." },
              { greek: "νοῦς", translit: "nous", english: "intuitive reason", gloss: "The grasp of first principles." },
            ],
            checks: [
              {
                q: "Why does the passage leave out judgement and opinion?",
                options: ["Because they are not in the soul", "Because in these we may be mistaken", "Because they are the same as art", "Because only gods have them"],
                answer: 1,
                why: "The passage says \"we do not include judgement and opinion because in these we may be mistaken.\"",
              },
              {
                q: "Which of these is on the passage's list of five?",
                options: ["Opinion", "Memory", "Practical wisdom", "Perception"],
                answer: 2,
                why: "The five are art, scientific knowledge, practical wisdom, philosophic wisdom and intuitive reason.",
              },
            ],
            journal: "In what part of your life do you rely on opinion where you could seek something firmer?",
          },
          {
            id: "practical-wisdom",
            title: "Practical wisdom",
            bekker: "1140a24-1141b22",
            minutes: 6,
            summary:
              "We find out what practical wisdom is by looking at whom we call wise in this way: people who deliberate well about what is good for themselves, not in some narrow respect such as health, but for living well in general. It is not scientific knowledge, since its objects can be otherwise, nor art, since acting is not making. It is a true and reasoned state of capacity to act with regard to things that are good or bad for a human being. Pericles is an example. Philosophic wisdom is different: it combines intuitive reason and scientific knowledge of the highest things. That is why Thales and Anaxagoras are called wise but not practically wise, since they know remarkable things but do not seek human goods.",
            passage: {
              text: "Now it is thought to be the mark of a man of practical wisdom to be able to deliberate well about what is good and expedient for himself, not in some particular respect, e.g. about what sorts of thing conduce to health or to strength, but about what sorts of thing conduce to the good life in general.",
              ref: "VI.5, 1140a25-28",
            },
            terms: [
              { greek: "φρόνησις", translit: "phronēsis", english: "practical wisdom", gloss: "The ability to deliberate well about living well." },
              { greek: "σοφία", translit: "sophia", english: "philosophic wisdom", gloss: "Knowledge of the highest things by nature." },
            ],
            checks: [
              {
                q: "What does the person of practical wisdom deliberate well about, according to the passage?",
                options: ["Only health and strength", "What conduces to the good life in general", "Mathematical truths", "How to make things"],
                answer: 1,
                why: "The passage says he deliberates about \"what sorts of thing conduce to the good life in general.\"",
              },
              {
                q: "Why are Thales and Anaxagoras called wise but not practically wise?",
                options: ["They knew nothing remarkable", "They know remarkable things but do not seek human goods", "They were poor statesmen in Athens", "They refused to study nature"],
                answer: 1,
                why: "Aristotle says they know things remarkable, difficult and divine but useless, because it is not human goods they seek.",
              },
            ],
            journal: "Who do you know who deliberates well about how to live, and what do they do that you could learn?",
          },
          {
            id: "wisdom-needs-experience",
            title: "Practical wisdom needs experience",
            bekker: "1141b23-1143b17",
            minutes: 5,
            summary:
              "Practical wisdom is concerned not only with universals but also with particulars, since action deals with particulars. This is why some people who lack knowledge are more practical than those who have it, especially those with experience: one who knows that light meats are healthy but not which meats are light will heal less well than one who knows that chicken is healthy. For the same reason the young can become geometers and mathematicians, but a young person of practical wisdom is not found, because such wisdom needs experience, and experience takes time. Aristotle also treats related qualities: good deliberation, understanding, and judgement or consideration, which belong to the practically wise person.",
            passage: {
              text: "What has been said is confirmed by the fact that while young men become geometricians and mathematicians and wise in matters like these, it is thought that a young man of practical wisdom cannot be found. The cause is that such wisdom is concerned not only with universals but with particulars, which become familiar from experience, but a young man has no experience, for it is length of time that gives experience;",
              ref: "VI.8, 1142a11-16",
            },
            terms: [
              { greek: "ἐμπειρία", translit: "empeiria", english: "experience", gloss: "Familiarity with particulars gained over time." },
              { greek: "καθ᾽ ἕκαστον", translit: "kath' hekaston", english: "the particular", gloss: "The individual case that action must deal with." },
            ],
            checks: [
              {
                q: "According to the passage, why is a young person of practical wisdom not found?",
                options: ["The young cannot learn mathematics", "Practical wisdom concerns particulars, which become familiar only with experience", "The young have no desires", "Practical wisdom is a gift of birth"],
                answer: 1,
                why: "The passage says such wisdom concerns particulars \"which become familiar from experience,\" and the young lack experience.",
              },
              {
                q: "What can young people become, according to the passage?",
                options: ["Statesmen", "Geometricians and mathematicians", "Judges", "Generals"],
                answer: 1,
                why: "The passage says \"young men become geometricians and mathematicians and wise in matters like these.\"",
              },
            ],
            journal: "What have you understood only after living through it, that no book could have taught you?",
          },
          {
            id: "virtue-and-wisdom-need-each-other",
            title: "Virtue and practical wisdom need each other",
            bekker: "1143b18-1145a11",
            minutes: 5,
            summary:
              "What use is practical wisdom? Aristotle answers that virtue makes the goal right and practical wisdom makes right what leads to it. Cleverness is the ability to find means to any goal; it becomes practical wisdom only when the goal is good, and knavery when it is bad. Likewise there is natural virtue, good dispositions present from birth, and virtue in the strict sense, which requires practical wisdom. Socrates was partly right and partly wrong: wrong to think the virtues are forms of knowledge, right to think they require wisdom. So one cannot be good in the strict sense without practical wisdom, nor practically wise without virtue of character. This also explains why a person who has practical wisdom will have all the virtues.",
            passage: {
              text: "It is clear, then, from what has been said, that it is not possible to be good in the strict sense without practical wisdom, nor practically wise without moral virtue.",
              ref: "VI.13, 1144b30-32",
            },
            terms: [
              { greek: "δεινότης", translit: "deinotēs", english: "cleverness", gloss: "Skill at finding means to any end, good or bad." },
              { greek: "φυσικὴ ἀρετή", translit: "physikē aretē", english: "natural virtue", gloss: "Good dispositions present from birth, without wisdom." },
            ],
            checks: [
              {
                q: "What does the passage say is not possible?",
                options: ["To be good in the strict sense without practical wisdom", "To be clever without virtue", "To have natural virtue", "To know mathematics when young"],
                answer: 0,
                why: "The passage says \"it is not possible to be good in the strict sense without practical wisdom, nor practically wise without moral virtue.\"",
              },
              {
                q: "Where did Socrates go wrong, according to Aristotle?",
                options: ["In thinking virtue requires wisdom", "In thinking all the virtues are forms of knowledge", "In praising courage", "In denying that the soul exists"],
                answer: 1,
                why: "Aristotle says Socrates was wrong to think the virtues are forms of practical wisdom but right that they imply it.",
              },
            ],
            journal: "Where has your cleverness served a goal you would not, on reflection, call good?",
          },
        ],
      },
      {
        id: "book-7",
        title: "Book VII: Weakness of will and pleasure",
        bekker: "1145a15-1154b34",
        line: "Aristotle asks how a person can know the better and do the worse, and then defends pleasure against those who call it bad.",
        lessons: [
          {
            id: "the-puzzle-of-incontinence",
            title: "How can anyone act against what they know?",
            bekker: "1145a15-1146b5",
            minutes: 5,
            summary:
              "Besides vice and virtue there are two other states: incontinence, or weakness of will, and continence, or self-control. Aristotle follows his method: set out the appearances, work through the puzzles, and keep as many reputable opinions as possible. The incontinent person knows that what he does is bad but does it from passion; the continent person knows his appetites are bad and does not follow them. Socrates held that there is no such thing as incontinence: no one acts against what he judges best, except through ignorance. It would be strange, he thought, if knowledge could be mastered and dragged about like a slave. Aristotle says this view plainly contradicts the observed facts, and asks what sort of ignorance could be involved.",
            passage: {
              text: "For Socrates was entirely opposed to the view in question, holding that there is no such thing as incontinence; no one, he said, when he judges acts against what he judges best-people act so only by reason of ignorance. Now this view plainly contradicts the observed facts,",
              ref: "VII.2, 1145b25-28",
            },
            terms: [
              { greek: "ἀκρασία", translit: "akrasia", english: "incontinence, weakness of will", gloss: "Acting against one's judgement through passion." },
              { greek: "ἐγκράτεια", translit: "enkrateia", english: "continence, self-control", gloss: "Holding to one's judgement against bad appetites." },
            ],
            checks: [
              {
                q: "What did Socrates hold, according to the passage?",
                options: ["That incontinence is common", "That there is no such thing as incontinence; people act so only through ignorance", "That knowledge is always mastered by passion", "That continence is a vice"],
                answer: 1,
                why: "The passage says Socrates held \"there is no such thing as incontinence... people act so only by reason of ignorance.\"",
              },
              {
                q: "What is Aristotle's first response to Socrates' view?",
                options: ["He accepts it fully", "He says it plainly contradicts the observed facts", "He says it is a matter for the gods", "He says only children are incontinent"],
                answer: 1,
                why: "The passage ends: \"this view plainly contradicts the observed facts.\"",
              },
            ],
            journal: "When did you last do something while knowing you should not, and what were you telling yourself at the time?",
          },
          {
            id: "knowing-and-not-using",
            title: "Having knowledge without using it",
            bekker: "1146b6-1152a36",
            minutes: 6,
            summary:
              "Aristotle distinguishes ways of knowing. A person may have knowledge but not use it, as someone asleep, mad or drunk has it. Passion puts people in a similar state: anger and sexual desire even alter the body. That the incontinent can say the right words proves nothing, for people under passion can recite proofs and verses of Empedocles, as actors speak lines, and beginners string together phrases they do not yet understand. Practical reasoning ends in a perception of the particular case, and it is this last step that passion overpowers. So in a way Socrates' position seems to result. Aristotle adds that incontinence is less bad than vice: the incontinent regrets and can be cured, like epilepsy, while vice is like a chronic disease.",
            passage: {
              text: "The fact that men use the language that flows from knowledge proves nothing; for even men under the influence of these passions utter scientific proofs and verses of Empedocles, and those who have just begun to learn a science can string together its phrases, but do not yet know it; for it has to become part of themselves, and that takes time;",
              ref: "VII.3, 1147a18-22",
            },
            terms: [
              { greek: "ἔχειν", translit: "echein", english: "to have", gloss: "Possessing knowledge without necessarily using it." },
              { greek: "θεωρεῖν", translit: "theōrein", english: "to contemplate, use", gloss: "Actively attending to what one knows." },
            ],
            checks: [
              {
                q: "What does the passage say about people who use the language of knowledge?",
                options: ["It proves they know", "It proves nothing, since even people under passion can recite proofs", "It proves they are virtuous", "It proves they are actors"],
                answer: 1,
                why: "The passage says \"the fact that men use the language that flows from knowledge proves nothing.\"",
              },
              {
                q: "What does knowledge need, according to the passage, before a person truly knows?",
                options: ["To be written down", "To become part of themselves, which takes time", "To be taught by Socrates", "To be recited aloud"],
                answer: 1,
                why: "The passage says knowledge \"has to become part of themselves, and that takes time.\"",
              },
            ],
            journal: "What do you know in words that has not yet become part of you?",
          },
          {
            id: "pleasure-is-not-bad",
            title: "Pleasure is not bad",
            bekker: "1152b1-1154b34",
            minutes: 5,
            summary:
              "Some say no pleasure is good, some that most are bad, some that pleasure cannot be the chief good. Aristotle answers each. Pleasure is not a process of coming to be, as these thinkers assume, but an activity of our natural state, and it should be called unimpeded rather than perceptible. Some pleasant things are unhealthy, but that no more makes pleasure bad than it makes health bad that some healthy things are bad for making money. If each disposition has its unimpeded activity, and happiness is such an activity, then the chief good could be some pleasure. That is why everyone thinks the happy life pleasant. Bodily pleasures are pursued to excess because they relieve pain, and God enjoys one simple pleasure forever.",
            passage: {
              text: "This is why it is not right to say that pleasure is perceptible process, but it should rather be called activity of the natural state, and instead of 'perceptible' 'unimpeded'.",
              ref: "VII.12, 1153a13-15",
            },
            terms: [
              { greek: "ἡδονή", translit: "hēdonē", english: "pleasure", gloss: "In Book VII, the unimpeded activity of a natural state." },
              { greek: "ἐνέργεια", translit: "energeia", english: "activity", gloss: "Being at work; complete at every moment, unlike a process." },
            ],
            checks: [
              {
                q: "What does the passage say pleasure should rather be called?",
                options: ["A perceptible process", "Activity of the natural state, and unimpeded", "A kind of pain relieved", "A coming into being"],
                answer: 1,
                why: "The passage says pleasure \"should rather be called activity of the natural state, and instead of 'perceptible' 'unimpeded'.\"",
              },
              {
                q: "Why do some unhealthy pleasant things not show that pleasure is bad?",
                options: ["Because health does not matter", "Because the same argument would make healthy things bad, since some are bad for making money", "Because unhealthy things are not pleasant", "Because doctors disagree"],
                answer: 1,
                why: "Aristotle says that argument is like saying healthy things are bad because some are bad for money-making.",
              },
            ],
            journal: "Which of your pleasures comes from an activity going well, and which only from relief?",
          },
        ],
      },
      {
        id: "book-8",
        title: "Book VIII: Friendship and its kinds",
        bekker: "1155a3-1163b28",
        line: "Aristotle argues that no one would choose to live without friends and distinguishes friendships of utility, of pleasure and of the good.",
        lessons: [
          {
            id: "no-one-would-choose-to-live-without-friends",
            title: "No one would choose to live without friends",
            bekker: "1155a3-1155b16",
            minutes: 5,
            summary:
              "Friendship comes next, Aristotle says, because it is a virtue or involves virtue, and because it is most necessary for living. No one would choose to live without friends even if he had every other good. The rich and powerful need friends to do good to and to guard their fortune; the poor and unfortunate see friends as their only refuge. Friends keep the young from error, help the old, and spur those in their prime to noble deeds: two going together are better able to think and act. Friendship also holds cities together, and lawgivers care more for it than for justice, since friends have no need of justice while the just still need friendship. Friendship is not only necessary but noble.",
            passage: {
              text: "For without friends no one would choose to live, though he had all other goods; even rich men and those in possession of office and of dominating power are thought to need friends most of all; for what is the use of such prosperity without the opportunity of beneficence, which is exercised chiefly and in its most laudable form towards friends?",
              ref: "VIII.1, 1155a5-9",
            },
            terms: [
              { greek: "φιλία", translit: "philia", english: "friendship", gloss: "Mutual, recognized goodwill and affection; wider than modern friendship, it includes family and civic bonds." },
              { greek: "ὁμόνοια", translit: "homonoia", english: "concord, unanimity", gloss: "Agreement about the common good; a kind of civic friendship." },
            ],
            checks: [
              {
                q: "According to the passage, who are thought to need friends most of all?",
                options: ["The poor", "The young", "Rich men and those in office and power", "Philosophers"],
                answer: 2,
                why: "The passage says \"rich men and those in possession of office and of dominating power are thought to need friends most of all.\"",
              },
              {
                q: "Why do lawgivers care more for friendship than for justice?",
                options: ["Because friends have no need of justice, while the just still need friendship", "Because friendship is easier to enforce", "Because justice is a vice", "Because cities have no laws"],
                answer: 0,
                why: "Aristotle says that when people are friends they have no need of justice, while when they are just they need friendship as well.",
              },
            ],
            journal: "If you had every other good but no friends, what exactly would be missing?",
          },
          {
            id: "three-kinds-of-friendship",
            title: "Three kinds of friendship",
            bekker: "1155b17-1156b6",
            minutes: 6,
            summary:
              "Things are lovable because they are good, pleasant or useful. We do not call love of wine friendship, since the wine cannot return it and we do not wish it well for its own sake. Friendship is goodwill that is mutual and recognized: each wishes the other well, and each knows it. Since there are three lovable things, there are three kinds of friendship. Friends of utility love each other not for themselves but for the good they get from each other; friends of pleasure love each other because they find each other pleasant, as we enjoy witty people. These friendships are incidental and easily dissolved when one party stops being useful or pleasant. Utility friendship is common among the old; pleasure friendship among the young, who fall in and out of friendship quickly.",
            passage: {
              text: "Now those who love each other for their utility do not love each other for themselves but in virtue of some good which they get from each other. So too with those who love for the sake of pleasure; it is not for their character that men love ready-witted people, but because they find them pleasant.",
              ref: "VIII.3, 1156a10-14",
            },
            terms: [
              { greek: "φιλητόν", translit: "philēton", english: "the lovable", gloss: "What can be loved: the good, the pleasant or the useful." },
              { greek: "χρήσιμον", translit: "chrēsimon", english: "the useful", gloss: "The ground of friendships of utility." },
              { greek: "εὔνοια", translit: "eunoia", english: "goodwill", gloss: "Wishing another well for his sake; friendship when mutual and known." },
            ],
            checks: [
              {
                q: "According to the passage, what do friends of utility love in each other?",
                options: ["Each other's character", "Some good they get from each other", "Each other's wit", "Nothing at all"],
                answer: 1,
                why: "The passage says they love \"in virtue of some good which they get from each other,\" not for themselves.",
              },
              {
                q: "Why are friendships of utility and pleasure easily dissolved?",
                options: ["Because the parties are wicked", "Because they last only as long as each party stays useful or pleasant", "Because the law forbids them", "Because they require living together"],
                answer: 1,
                why: "Aristotle says these friendships are incidental, so when one party is no longer useful or pleasant the other stops loving him.",
              },
              {
                q: "What does Aristotle add to goodwill to make it friendship?",
                options: ["That it be mutual and recognized by both", "That it be written in a contract", "That it be felt for a wine", "That it be felt only once"],
                answer: 0,
                why: "He says goodwill becomes friendship when it is reciprocated and each knows the other bears it.",
              },
            ],
            journal: "Think of three friends: which of the three kinds is each friendship mostly, and is that enough for you?",
          },
          {
            id: "friendship-of-the-good",
            title: "Friendship of the good",
            bekker: "1156b7-1157b5",
            minutes: 6,
            summary:
              "Perfect friendship is between people who are good and alike in virtue. Each wishes the other well for the other's own sake, because of who the other is, not incidentally. So the friendship lasts as long as both stay good, and goodness lasts. Such friends are also useful and pleasant to each other, so this friendship contains what the other kinds offer. It is rare, because such people are rare, and it takes time and familiarity: as the proverb says, people cannot know each other until they have eaten salt together. The wish for friendship comes quickly, but friendship does not. Only good people can be friends for each other's sake, and only their friendship is proof against slander, since each trusts the other he has tested.",
            passage: {
              text: "Perfect friendship is the friendship of men who are good, and alike in virtue; for these wish well alike to each other qua good, and they are good themselves. Now those who wish well to their friends for their sake are most truly friends",
              ref: "VIII.3, 1156b7-10",
            },
            terms: [
              { greek: "τελεία φιλία", translit: "teleia philia", english: "perfect, complete friendship", gloss: "Friendship of good people, each loving the other for himself." },
              { greek: "ἐκείνου ἕνεκα", translit: "ekeinou heneka", english: "for his sake", gloss: "Wishing good to a friend for the friend's own sake." },
            ],
            checks: [
              {
                q: "Between whom is perfect friendship, according to the passage?",
                options: ["Men who are useful to each other", "Men who are good and alike in virtue", "Young people who share pleasures", "Rulers and subjects"],
                answer: 1,
                why: "The passage says \"perfect friendship is the friendship of men who are good, and alike in virtue.\"",
              },
              {
                q: "Why is friendship of the good rare?",
                options: ["It is forbidden by law", "Good people are rare, and it takes time and familiarity", "It brings no pleasure", "It ends quickly"],
                answer: 1,
                why: "Aristotle says such men are rare and that friendship needs time: they must have \"eaten salt together.\"",
              },
              {
                q: "Who, according to the passage, are most truly friends?",
                options: ["Those who wish well to their friends for their friends' sake", "Those who get the most from each other", "Those who live far apart", "Those who agree about everything"],
                answer: 0,
                why: "The passage says \"those who wish well to their friends for their sake are most truly friends.\"",
              },
            ],
            journal: "Who in your life do you wish well purely for their own sake, and who would say the same of you?",
          },
          {
            id: "loving-and-being-loved",
            title: "Loving more than being loved",
            bekker: "1157b6-1163b28",
            minutes: 6,
            summary:
              "Some friendships are between unequals, such as parent and child or ruler and ruled. In these the better party should be loved more than he loves, so that love in proportion to merit makes a kind of equality. If the gap grows too great, as between humans and gods, friendship ends. Most people, out of ambition, would rather be loved than love, which is why they enjoy flattery. Yet friendship seems to consist more in loving than in being loved, as mothers show, who love their children and are content to see them do well even if not loved in return. Aristotle then ties friendship to community: in every association there is some justice and some friendship, and their extent is the same. What friends have is common.",
            passage: {
              text: "But it seems to lie in loving rather than in being loved, as is indicated by the delight mothers take in loving; for some mothers hand over their children to be brought up, and so long as they know their fate they love them and do not seek to be loved in return (if they cannot have both), but seem to be satisfied if they see them prospering;",
              ref: "VIII.8, 1159a27-32",
            },
            terms: [
              { greek: "φιλεῖν", translit: "philein", english: "to love", gloss: "The active side of friendship, which Aristotle ranks above being loved." },
              { greek: "κοινωνία", translit: "koinōnia", english: "community, association", gloss: "Every partnership has its own justice and its own friendship." },
            ],
            checks: [
              {
                q: "According to the passage, what does friendship seem to lie in?",
                options: ["Being loved rather than loving", "Loving rather than being loved", "Receiving honour", "Getting equal returns"],
                answer: 1,
                why: "The passage says friendship \"seems to lie in loving rather than in being loved.\"",
              },
              {
                q: "What do the mothers in the passage seem satisfied with?",
                options: ["Being loved in return", "Seeing their children prospering", "Receiving gifts", "Being honoured by the city"],
                answer: 1,
                why: "The passage says they \"seem to be satisfied if they see them prospering.\"",
              },
            ],
            journal: "Do you more often seek to be loved or to love, and what would change if you reversed it?",
          },
        ],
      },
      {
        id: "book-9",
        title: "Book IX: The friend as another self",
        bekker: "1163b32-1172a15",
        line: "Aristotle treats the duties and endings of friendship, finds its source in a good person's relation to himself, and argues that even the happy need friends.",
        lessons: [
          {
            id: "when-friendships-end",
            title: "When a friendship should end",
            bekker: "1163b32-1165b36",
            minutes: 5,
            summary:
              "Disputes arise when friends want different things, as when one loves for pleasure and the other for profit. Aristotle asks hard questions: should one obey a father in all things, and should one repay a benefactor or help a friend? Such questions cannot be settled with precision; we should give each person what is fitting. Then he asks when friendships may be broken off. There is nothing strange in ending a friendship of utility or pleasure when its ground is gone. But if one accepts another as good and he becomes bad, one cannot still love him, since only the good is lovable. If he can be reformed, one should help him, rather than leave. Even after a break, one owes some remembrance of the former friendship.",
            passage: {
              text: "But if one accepts another man as good, and he turns out badly and is seen to do so, must one still love him? Surely it is impossible, since not everything can be loved, but only what is good. What is evil neither can nor should be loved;",
              ref: "IX.3, 1165b13-15",
            },
            terms: [
              { greek: "διάλυσις", translit: "dialysis", english: "dissolution", gloss: "The ending of a friendship." },
              { greek: "ἀγαθόν", translit: "agathon", english: "the good", gloss: "Only what is good can be loved for itself." },
            ],
            checks: [
              {
                q: "Why does the passage say one cannot still love a friend who turns out badly?",
                options: ["Because the law forbids it", "Because not everything can be loved, only what is good", "Because he stopped being useful", "Because friends must be equals"],
                answer: 1,
                why: "The passage says \"not everything can be loved, but only what is good.\"",
              },
              {
                q: "What should one do, in Aristotle's view, if a friend who has gone wrong can be reformed?",
                options: ["Break off at once", "Help his character rather than leave him", "Report him to the city", "Pretend nothing happened"],
                answer: 1,
                why: "Aristotle says that if friends can be reformed we should rather come to the help of their character.",
              },
            ],
            journal: "Is there a friendship you have outgrown, and what remembrance do you still owe it?",
          },
          {
            id: "the-friend-is-another-self",
            title: "The friend is another self",
            bekker: "1166a1-1168a27",
            minutes: 6,
            summary:
              "The marks of friendship seem to come from a person's relation to himself. A friend wishes and does good to his friend for the friend's sake, wishes him to live, spends time with him, shares his tastes, and grieves and rejoices with him. All of these belong to the good person's relation to himself. His soul is of one mind: he wishes himself what is good, wants to live, enjoys his own company and memories, and has nothing to repent. He is related to his friend as to himself, for the friend is another self. Bad people, by contrast, are at war with themselves and flee their own company. Aristotle also treats goodwill, an inactive friendship, and concord, a civic friendship about shared goals.",
            passage: {
              text: "Therefore, since each of these characteristics belongs to the good man in relation to himself, and he is related to his friend as to himself (for his friend is another self), friendship too is thought to be one of these attributes, and those who have these attributes to be friends.",
              ref: "IX.4, 1166a29-33",
            },
            terms: [
              { greek: "ἄλλος αὐτός", translit: "allos autos", english: "another self", gloss: "The friend, related to one as one is related to oneself." },
              { greek: "εὔνοια", translit: "eunoia", english: "goodwill", gloss: "The beginning of friendship, but not yet friendship." },
            ],
            checks: [
              {
                q: "How is the good man related to his friend, according to the passage?",
                options: ["As a master to a servant", "As to himself, for his friend is another self", "As a creditor to a debtor", "As a stranger"],
                answer: 1,
                why: "The passage says \"he is related to his friend as to himself (for his friend is another self).\"",
              },
              {
                q: "Why does Aristotle say bad people cannot be friendly even to themselves?",
                options: ["They are at odds with themselves and have nothing lovable in them", "They have too many friends", "They are too rich", "They never act"],
                answer: 0,
                why: "He says bad people are at variance with themselves, shun their own company, and have nothing lovable in them.",
              },
            ],
            journal: "Do you enjoy your own company, and what would make you a better friend to yourself?",
          },
          {
            id: "true-and-false-self-love",
            title: "True and false self-love",
            bekker: "1168a28-1169b2",
            minutes: 6,
            summary:
              "Should one love oneself most, or someone else? People blame self-lovers, yet they also say one should love one's best friend most, and each person is his own best friend. Aristotle resolves this by asking what self-love means. In the reproachful sense, self-lovers grab the larger share of money, honours and bodily pleasures. But someone who always tried to act justly and temperately would never be blamed, though he is more truly a lover of self, since he gratifies the most authoritative part of himself, his reason. Such a person will act for his friends and country and die for them if needed, choosing a short time of noble life over a long one of trivial life. In this sense he takes the greater share of what is noble.",
            passage: {
              text: "Therefore the good man should be a lover of self (for he will both himself profit by doing noble acts, and will benefit his fellows), but the wicked man should not; for he will hurt both himself and his neighbours, following as he does evil passions.",
              ref: "IX.8, 1169a11-15",
            },
            terms: [
              { greek: "φίλαυτος", translit: "philautos", english: "lover of self", gloss: "Blamed when it means grasping goods; praised when it means loving one's reason." },
              { greek: "τὸ κυριώτατον", translit: "to kyriōtaton", english: "the most authoritative part", gloss: "Reason, which Aristotle calls the person himself." },
            ],
            checks: [
              {
                q: "According to the passage, why should the good man be a lover of self?",
                options: ["Because he deserves more wealth", "Because doing noble acts profits him and benefits his fellows", "Because others will love him less", "Because pleasure is the good"],
                answer: 1,
                why: "The passage says \"he will both himself profit by doing noble acts, and will benefit his fellows.\"",
              },
              {
                q: "What part of himself does the true self-lover gratify?",
                options: ["His appetites", "His reason, the most authoritative part", "His love of honour", "His body"],
                answer: 1,
                why: "Aristotle says the true lover of self gratifies and obeys the most authoritative element in him, which is reason.",
              },
            ],
            journal: "When do you love yourself in the grasping sense, and when in the sense Aristotle praises?",
          },
          {
            id: "the-happy-need-friends",
            title: "Even the happy need friends",
            bekker: "1169b3-1172a15",
            minutes: 6,
            summary:
              "Some say the happy and self-sufficient need no friends. Aristotle replies that it is strange to give the happy person every good but friends, the greatest of external goods, and to make him a solitary, since a human being is political and lives with others. Happiness is an activity, and it is easier to be continuously active with others. Life is perceiving and thinking, and perceiving that one lives is pleasant. As the good person is to himself, he is to his friend, for the friend is another self. So he needs to be conscious of his friend's existence too, which happens by living together and sharing talk and thought. The number of such friends is limited to those one can live with, and the famous friendships are pairs.",
            passage: {
              text: "He needs, therefore, to be conscious of the existence of his friend as well, and this will be realized in their living together and sharing in discussion and thought; for this is what living together would seem to mean in the case of man, and not, as in the case of cattle, feeding in the same place.",
              ref: "IX.9, 1170b10-14",
            },
            terms: [
              { greek: "συζῆν", translit: "syzēn", english: "living together", gloss: "Sharing in talk and thought; the chief mark of friendship." },
              { greek: "αὐτάρκεια", translit: "autarkeia", english: "self-sufficiency", gloss: "Lacking nothing; Aristotle denies it excludes friends." },
            ],
            checks: [
              {
                q: "According to the passage, what does living together mean for human beings?",
                options: ["Feeding in the same place", "Sharing in discussion and thought", "Owning property in common", "Living in the same city"],
                answer: 1,
                why: "The passage says living together means \"sharing in discussion and thought,\" not feeding in the same place as cattle do.",
              },
              {
                q: "Why does Aristotle limit the number of close friends?",
                options: ["Friendship is expensive", "One can live together with only a few people", "The law sets a number", "Good people dislike crowds"],
                answer: 1,
                why: "He says the number is limited to those one can live with, since one cannot divide oneself among many.",
              },
            ],
            journal: "With whom do you share discussion and thought, not only space and time?",
          },
        ],
      },
      {
        id: "book-10",
        title: "Book X: Pleasure and the highest happiness",
        bekker: "1172a19-1181b23",
        line: "Aristotle completes his account of pleasure, argues that the highest happiness is contemplation, and turns from ethics to legislation.",
        lessons: [
          {
            id: "pleasure-completes-the-activity",
            title: "Pleasure completes the activity",
            bekker: "1172a19-1176a29",
            minutes: 6,
            summary:
              "Aristotle reviews the views of Eudoxus, who held pleasure to be the good, and of those who call it bad. Then he gives his own account. Seeing is complete at every moment, and so is pleasure: it is not a movement that takes time to finish. Pleasure arises when a sense or the mind is at its best and active towards its best object. It completes the activity, not as the activity's own state does, but as a supervening end, like the bloom of youth on those in their prime. Since activities differ in kind, so do their pleasures, and the pleasure proper to an activity intensifies it, while an alien pleasure hinders it. The good person is the measure: what is pleasant to him is truly pleasant.",
            passage: {
              text: "Pleasure completes the activity not as the corresponding permanent state does, by its immanence, but as an end which supervenes as the bloom of youth does on those in the flower of their age.",
              ref: "X.4, 1174b31-33",
            },
            terms: [
              { greek: "ἡδονή", translit: "hēdonē", english: "pleasure", gloss: "In Book X, what completes an activity as a supervening end." },
              { greek: "τελειοῦν", translit: "teleioun", english: "to complete, perfect", gloss: "What pleasure does to an activity." },
            ],
            checks: [
              {
                q: "To what does the passage compare the way pleasure completes the activity?",
                options: ["A wage paid after work", "The bloom of youth on those in the flower of their age", "A tool used by a craftsman", "A medicine curing an illness"],
                answer: 1,
                why: "The passage says pleasure supervenes \"as the bloom of youth does on those in the flower of their age.\"",
              },
              {
                q: "Whose pleasures does Aristotle take as the measure of what is truly pleasant?",
                options: ["The majority's", "The good person's", "Children's", "The sick person's"],
                answer: 1,
                why: "He says virtue and the good person are the measure, so what seems pleasant to him is truly pleasant.",
              },
            ],
            journal: "Which activity of yours is most complete in itself, so that its pleasure needs nothing added?",
          },
          {
            id: "the-contemplative-life",
            title: "The life of contemplation",
            bekker: "1176a30-1178a8",
            minutes: 6,
            summary:
              "Happiness is not amusement, which is for the sake of rest, but activity in accordance with virtue. If so, the highest happiness is activity in accordance with the highest virtue, that of the best thing in us, which Aristotle calls reason, something divine or the most divine part of us. Its activity is contemplation. It is the best activity, the most continuous, the most pleasant, the most self-sufficient, loved for its own sake, and found in leisure. Such a life would be more than human, lived by something divine in us. Yet we should not follow those who say mortals should think only mortal thoughts. We should, as far as we can, make ourselves immortal and live by the best thing in us, for that seems to be each person himself.",
            passage: {
              text: "If happiness is activity in accordance with virtue, it is reasonable that it should be in accordance with the highest virtue; and this will be that of the best thing in us. Whether it be reason or something else that is this element which is thought to be our natural ruler and guide and to take thought of things noble and divine,",
              ref: "X.7, 1177a12-15",
            },
            terms: [
              { greek: "θεωρία", translit: "theōria", english: "contemplation", gloss: "The activity of reason studying the highest truths." },
              { greek: "σχολή", translit: "scholē", english: "leisure", gloss: "Free time for what is worth doing for itself; the root of school." },
            ],
            checks: [
              {
                q: "In accordance with which virtue, according to the passage, should happiness be?",
                options: ["Courage", "Justice", "The highest virtue, that of the best thing in us", "Generosity"],
                answer: 2,
                why: "The passage says happiness should be \"in accordance with the highest virtue; and this will be that of the best thing in us.\"",
              },
              {
                q: "What does Aristotle advise, instead of thinking only mortal thoughts?",
                options: ["To make ourselves immortal as far as we can and live by the best thing in us", "To avoid thinking about the gods", "To seek honour above all", "To live for amusement"],
                answer: 0,
                why: "He says we must, so far as we can, make ourselves immortal and strain every nerve to live by the best thing in us.",
              },
            ],
            journal: "When do you have leisure for something you love purely for itself, and what fills that time?",
          },
          {
            id: "the-second-happiest-life",
            title: "The life of virtue in action",
            bekker: "1178a9-1179a32",
            minutes: 5,
            summary:
              "In a secondary degree, the life of moral virtue is happy. Just and brave acts and the other virtues concern our dealings with each other and our feelings, and they are typically human. Practical wisdom is bound up with virtue of character. This life needs more external goods than the contemplative life: the generous person needs money, the just person means to repay, the brave person power. The gods are thought most blessed, but it would be absurd to picture them making contracts or being brave; their activity is contemplation. Human beings need some external goods, but only moderate ones, since one can do noble deeds without ruling land and sea. Solon and Anaxagoras both describe the happy person as having moderate means.",
            passage: {
              text: "But in a secondary degree the life in accordance with the other kind of virtue is happy; for the activities in accordance with this befit our human estate. Just and brave acts, and other virtuous acts, we do in relation to each other, observing our respective duties with regard to contracts and services and all manner of actions and with regard to passions; and all of these seem to be typically human.",
              ref: "X.8, 1178a9-14",
            },
            terms: [
              { greek: "ἠθικὴ ἀρετή", translit: "ēthikē aretē", english: "virtue of character", gloss: "The virtues of feeling and action, formed by habit." },
              { greek: "τὰ ἐκτὸς ἀγαθά", translit: "ta ektos agatha", english: "external goods", gloss: "Wealth, friends, power: needed in moderation." },
            ],
            checks: [
              {
                q: "Why, according to the passage, is the life of the other kind of virtue happy in a secondary degree?",
                options: ["Because its activities befit our human estate", "Because it is the life of the gods", "Because it needs no external goods", "Because it avoids all passion"],
                answer: 0,
                why: "The passage says \"the activities in accordance with this befit our human estate.\"",
              },
              {
                q: "How much external good does the happy person need, in Aristotle's view?",
                options: ["As much as possible", "None at all", "Moderate means", "Rule over land and sea"],
                answer: 2,
                why: "He says one can do noble deeds without ruling land and sea, so moderate means are enough.",
              },
            ],
            journal: "What is the least you would need, in money and power, to act well?",
          },
          {
            id: "from-ethics-to-legislation",
            title: "Arguments alone do not make people good",
            bekker: "1179a33-1181b23",
            minutes: 5,
            summary:
              "In practical matters the end is not to know but to act, so knowing about virtue is not enough. If arguments could make people good, they would deserve great rewards. But arguments move only the generous young who already love what is noble; the many obey fear, not shame, and live by passion. Character must be prepared beforehand, as soil is prepared for seed. So people need good upbringing and habits, which require laws, since most obey necessity and punishment rather than argument. Where cities neglect this, each person should help his own children and friends to virtue, and for that he needs some knowledge of legislation. Aristotle ends by proposing to study constitutions, which leads on to the Politics.",
            passage: {
              text: "Now if arguments were in themselves enough to make men good, they would justly, as Theognis says, have won very great rewards, and such rewards should have been provided; but as things are, while they seem to have power to encourage and stimulate the generous-minded among our youth,",
              ref: "X.9, 1179b4-8",
            },
            terms: [
              { greek: "νόμος", translit: "nomos", english: "law", gloss: "What shapes habits in those whom argument does not move." },
              { greek: "παιδεία", translit: "paideia", english: "upbringing, education", gloss: "The training of character from youth." },
            ],
            checks: [
              {
                q: "What does the passage say arguments can do?",
                options: ["Make everyone good", "Encourage and stimulate the generous-minded among the young", "Replace the law", "Cure every vice"],
                answer: 1,
                why: "The passage says arguments \"seem to have power to encourage and stimulate the generous-minded among our youth.\"",
              },
              {
                q: "Why does Aristotle say laws are needed for virtue?",
                options: ["Because most people obey necessity and punishment rather than argument", "Because arguments are false", "Because the young need no training", "Because virtue is natural"],
                answer: 0,
                why: "He says the many obey fear rather than shame, so habits must be formed by laws backed by compulsion.",
              },
            ],
            journal: "What in your own upbringing prepared you, or failed to prepare you, to love what is noble?",
          },
        ],
      },
    ],
  },
  {
    id: "eudemian-ethics",
    title: "Eudemian Ethics",
    greek: "Ἠθικὰ Εὐδήμεια",
    latin: "Ethica Eudemia",
    subject: "ethics",
    level: "Intermediate",
    bekker: "1214a-1249b",
    about:
      "Aristotle's other complete course on the good life, probably earlier than the Nicomachean Ethics and named, it seems, after his student Eudemus, who may have edited it. It covers the same ground in its own way, with a sharper account of friendship and a closing standard for every choice: whatever best serves the contemplation of God. Reading it beside the Nicomachean Ethics shows how Aristotle reworked his own ideas.",
    before: ["nicomachean-ethics"],
    caveat:
      "Books IV to VI of the Eudemian Ethics are the same text as Books V to VII of the Nicomachean Ethics, and scholars still dispute which work they first belonged to; this course leaves them to the Nicomachean course. Solomon's translation, following the older numbering, prints the last three chapters as Book VII, chapters 13 to 15; modern editions call them Book VIII, as here. Most scholars now accept the work as Aristotle's own.",
    translation: { translator: "J. Solomon", year: 1915, title: "Ethica Eudemia (The Works of Aristotle, vol. IX)", url: OXFORD_IX },
    units: [
      {
        id: "book-1",
        title: "Book I: What happiness is and how to aim at it",
        bekker: "1214a1-1218b27",
        line: "Aristotle claims that happiness is the finest, best and most pleasant thing, urges each person to set a goal for life, and asks where happiness lies.",
        lessons: [
          {
            id: "finest-best-and-most-pleasant",
            title: "The finest, the best and the most pleasant",
            bekker: "1214a1-1214b5",
            minutes: 5,
            summary:
              "The work opens with an inscription at Delos, which ranked justice as most beautiful, health as best and getting what one desires as pleasantest, as if these belonged to different things. Aristotle disagrees: happiness is at once the most beautiful, the best and the most pleasant of all things. He then asks how happiness comes to us: by nature, by learning, by training, by divine favour, or by luck. Many identify it with good luck. He notes that people place happiness mainly in three things: practical wisdom, virtue or pleasure, and they argue over how much each contributes. The question of what happiness is, and how it is gained, sets the course for the whole inquiry.",
            passage: {
              text: "The man who stated his judgement in the god's precinct in Delos made an inscription on the propylaeum to the temple of Leto, in which he separated from one another the good, the beautiful, and the pleasant as not all properties of the same thing; he wrote, 'Most beautiful is what is most just, but best is health, and pleasantest the obtaining of what one desires.' But let us disagree with him; for happiness is at once the most beautiful and best of all things and also the pleasantest.",
              ref: "I.1, 1214a1-8",
            },
            terms: [
              { greek: "εὐδαιμονία", translit: "eudaimonia", english: "happiness", gloss: "Living well; here the finest, best and most pleasant thing." },
              { greek: "καλόν", translit: "kalon", english: "the beautiful, the noble", gloss: "What is fine and worthy of praise." },
            ],
            checks: [
              {
                q: "What did the Delian inscription do, according to the passage?",
                options: ["It joined the good, the beautiful and the pleasant in happiness", "It separated the good, the beautiful and the pleasant as belonging to different things", "It praised luck above virtue", "It denied that health is good"],
                answer: 1,
                why: "The passage says the inscription \"separated from one another the good, the beautiful, and the pleasant.\"",
              },
              {
                q: "What does Aristotle say about happiness against the inscription?",
                options: ["It is only the pleasantest thing", "It is at once the most beautiful, the best and the pleasantest", "It is the same as health", "It cannot be known"],
                answer: 1,
                why: "He says \"happiness is at once the most beautiful and best of all things and also the pleasantest.\"",
              },
            ],
            journal: "Do the finest, the best and the most pleasant things in your life come apart, or do they meet somewhere?",
          },
          {
            id: "set-a-goal-for-your-life",
            title: "Set a goal for your life",
            bekker: "1214b6-1218b27",
            minutes: 6,
            summary:
              "Everyone who can live by his own choice should set up some aim for the good life, such as honour, reputation, wealth or culture, and do all his acts with that in view, since not to order one's life to some end is a mark of great folly. Above all he should work out what happiness consists in, and separate it from the conditions without which it cannot exist, as health differs from the conditions of health. Aristotle reviews the lives of pleasure, politics and philosophy. He then criticizes Plato's Form of the Good: even if it exists, it is not a good that can be done or possessed, so it is of no use for action. The good we seek is the human good, the end of political science.",
            passage: {
              text: "First then about these things we must enjoin every one that has the power to live according to his own choice to set up for himself some object for the beautiful life to aim at, (whether honour or reputation or wealth or culture), with reference to which he will then do all his acts, since not to have one's life organized in view of some end is a mark of much folly.",
              ref: "I.2, 1214b6-11",
            },
            terms: [
              { greek: "σκοπός", translit: "skopos", english: "target, aim", gloss: "The goal a person sets for his whole life." },
              { greek: "ἰδέα τοῦ ἀγαθοῦ", translit: "idea tou agathou", english: "Form of the Good", gloss: "Plato's Good itself, which Aristotle says is useless for action." },
            ],
            checks: [
              {
                q: "What does the passage urge everyone who can live by his own choice to do?",
                options: ["Obey the laws of his city", "Set up some object for the beautiful life to aim at", "Seek pleasure above all", "Avoid honour and wealth"],
                answer: 1,
                why: "The passage urges each to \"set up for himself some object for the beautiful life to aim at.\"",
              },
              {
                q: "What does the passage call a mark of much folly?",
                options: ["Pursuing wealth", "Not having one's life organized in view of some end", "Studying philosophy", "Seeking reputation"],
                answer: 1,
                why: "It says \"not to have one's life organized in view of some end is a mark of much folly.\"",
              },
            ],
            journal: "If you named one aim that orders your whole life, what would it be, and does your week show it?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Virtue and voluntary action",
        bekker: "1218b31-1228a19",
        line: "Aristotle defines happiness, divides virtue into two kinds, and shows that a human being is the source of his own voluntary actions.",
        lessons: [
          {
            id: "two-kinds-of-virtue",
            title: "Two kinds of virtue",
            bekker: "1218b31-1221b26",
            minutes: 5,
            summary:
              "Every good is either in the soul or outside it, and the goods of the soul are best. The work of the soul is living, and the work of its excellence a good life. Since an activity is better than a state, and happiness is complete, Aristotle defines happiness as the activity of a complete life in accordance with complete virtue. The soul has two parts that share in reason, one by commanding and the other by obeying. So virtue is of two kinds: intellectual virtue belongs to the commanding part, and virtue of character to the part that is not rational but can obey reason. Virtue of character is a mean in feelings, and Aristotle lists pairs of opposed vices, such as irascibility and spiritlessness, rashness and cowardice.",
            passage: {
              text: "But since the intellectual virtues involve reason, they belong to that rational part of the soul which governs the soul by its possession of reason, while the moral belong to the part which is irrational but by its nature obedient to the part possessing reason; for we do not describe the character of a man by saying that he is wise or clever, but by saying that he is gentle or bold.",
              ref: "II.1, 1220a8-13",
            },
            terms: [
              { greek: "ἠθικὴ ἀρετή", translit: "ēthikē aretē", english: "virtue of character", gloss: "Excellence of the part that can obey reason." },
              { greek: "διανοητικὴ ἀρετή", translit: "dianoētikē aretē", english: "intellectual virtue", gloss: "Excellence of the part that has reason." },
            ],
            checks: [
              {
                q: "To which part of the soul do the moral virtues belong, according to the passage?",
                options: ["The part that governs by reason", "The irrational part that by nature obeys reason", "The nutritive part", "No part of the soul"],
                answer: 1,
                why: "The passage says the moral virtues \"belong to the part which is irrational but by its nature obedient to the part possessing reason.\"",
              },
              {
                q: "How do we describe a person's character, according to the passage?",
                options: ["By saying he is wise or clever", "By saying he is gentle or bold", "By naming his city", "By his wealth"],
                answer: 1,
                why: "The passage says we describe character \"by saying that he is gentle or bold,\" not wise or clever.",
              },
            ],
            journal: "If a friend described your character in two words, would they be words of intellect or of character?",
          },
          {
            id: "a-human-being-is-a-source-of-action",
            title: "A human being is a source of action",
            bekker: "1222b15-1228a19",
            minutes: 6,
            summary:
              "Every substance is a kind of principle that produces things like itself, but among animals only a human being is also a principle of actions. Aristotle compares this to principles in mathematics: change the principle, and what follows from it changes. What depends on a human being can happen or not happen, and he is its cause. We praise and blame only for what we ourselves cause, not for what comes from necessity, chance or nature, so virtue and vice concern voluntary acts. Aristotle then works out what the voluntary is: not acting from appetite, nor from wish, but acting with knowledge and without force. Choice is narrower: a deliberate desire, following deliberation, for things in our power that lead to an end.",
            passage: {
              text: "Every substance is by nature a sort of principle; therefore each can produce many similar to itself, as man man, animals in general animals, and plants plants. But in addition to this man alone of animals is also the source of certain actions; for no other animal would be said to act.",
              ref: "II.6, 1222b15-20",
            },
            terms: [
              { greek: "ἀρχή", translit: "archē", english: "principle, source", gloss: "That from which something begins or follows." },
              { greek: "προαίρεσις", translit: "prohairesis", english: "choice", gloss: "Deliberate desire for what is in our power." },
            ],
            checks: [
              {
                q: "What does the passage say a human being alone of animals is?",
                options: ["A substance", "The source of certain actions", "A principle of growth", "Like a plant"],
                answer: 1,
                why: "The passage says \"man alone of animals is also the source of certain actions.\"",
              },
              {
                q: "For what, according to Aristotle, do we praise and blame people?",
                options: ["For what comes from chance", "For what they themselves cause", "For what nature gives them", "For what is necessary"],
                answer: 1,
                why: "He says we praise or blame only for what we ourselves are causes of, not for necessity, chance or nature.",
              },
            ],
            journal: "What is one thing in your life that happens only because you start it?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: The virtues one by one",
        bekker: "1228a23-1234b13",
        line: "Aristotle treats courage, temperance, gentleness, liberality, greatness of soul and magnificence, and some praiseworthy means that are not virtues.",
        lessons: [
          {
            id: "courage-follows-reason",
            title: "Courage follows reason toward the noble",
            bekker: "1228a23-1230a36",
            minutes: 5,
            summary:
              "The brave person seems fearless, but is he incapable of fear? Aristotle answers that courage means following reason, and reason bids us choose the noble. A person who endures terrible things for any other reason is either out of his wits or merely confident. The coward fears even what he should not; the over-confident person is confident even when he should not be; the brave person fears and is confident when he should, and so is a mean. Reason does not bid anyone to endure great pain or destruction unless it is noble. Aristotle also sorts the false kinds of courage: the soldier's through shame or compulsion, the expert's through experience, and courage from inexperience, hope or passion.",
            passage: {
              text: "For bravery consists in following reason, and reason bids one choose the noble. Therefore the man who endures the terrible from any other cause than this is either out of his wits or confident; but the man who does so for the sake of the noble is alone fearless and brave.",
              ref: "III.1, 1229a1-4",
            },
            terms: [
              { greek: "ἀνδρεία", translit: "andreia", english: "courage", gloss: "Fearing and daring as reason bids, for the sake of the noble." },
              { greek: "λόγος", translit: "logos", english: "reason", gloss: "What the brave person follows." },
            ],
            checks: [
              {
                q: "What does bravery consist in, according to the passage?",
                options: ["Feeling no fear", "Following reason, which bids one choose the noble", "Enduring every pain", "Obeying commanders"],
                answer: 1,
                why: "The passage says \"bravery consists in following reason, and reason bids one choose the noble.\"",
              },
              {
                q: "Who, according to the passage, is alone fearless and brave?",
                options: ["The man who endures out of anger", "The man who endures for the sake of the noble", "The man who is out of his wits", "The man who hopes to win"],
                answer: 1,
                why: "The passage says \"the man who does so for the sake of the noble is alone fearless and brave.\"",
              },
            ],
            journal: "When you have endured something hard, was it for the noble, or for some other reason?",
          },
          {
            id: "praiseworthy-feelings-that-are-not-virtues",
            title: "Praiseworthy feelings that are not virtues",
            bekker: "1233b16-1234b13",
            minutes: 5,
            summary:
              "At the end of his list Aristotle treats several means in feeling: righteous indignation between envy and spite, modesty between shamelessness and bashfulness, friendliness, dignity, truthfulness and wit. The witty person, for example, accepts some jokes and not others as reason directs, and pleases a good judge even when the joke is on himself. These mean states are praiseworthy, but they are not virtues, and their extremes are not vices, because they do not involve choice. They are feelings, natural states that tend towards the natural virtues; envy, for instance, tends towards injustice. Each virtue, Aristotle says, exists both naturally and in the full form that includes thought.",
            passage: {
              text: "All of them occur in the classifications of affections, for each is an affection. But since they are natural, they tend to the natural virtues; for, as will be said later, each virtue is found both naturally and also otherwise, viz. as including thought.",
              ref: "III.7, 1234a",
            },
            terms: [
              { greek: "πάθος", translit: "pathos", english: "affection, feeling", gloss: "Something undergone, not chosen." },
              { greek: "νέμεσις", translit: "nemesis", english: "righteous indignation", gloss: "Pain at undeserved good fortune; a mean between envy and spite." },
            ],
            checks: [
              {
                q: "What does the passage say each of these mean states is?",
                options: ["A virtue", "An affection", "A vice", "A deliberate choice"],
                answer: 1,
                why: "The passage says \"each is an affection.\"",
              },
              {
                q: "Why are these mean states not virtues, in Aristotle's account?",
                options: ["Because they are blameworthy", "Because they do not involve choice", "Because they are too rare", "Because they concern money"],
                answer: 1,
                why: "He says these states are praiseworthy without being virtues because they do not involve deliberate choice.",
              },
            ],
            journal: "Which of your good qualities came to you by nature, and which have you made your own by choice?",
          },
        ],
      },
      {
        id: "book-7",
        title: "Book VII: Friendship",
        bekker: "1234b18-1246a25",
        line: "Aristotle sets out primary friendship, the friendship of the good, and asks why even a self-sufficient person needs friends.",
        lessons: [
          {
            id: "primary-friendship",
            title: "Primary friendship",
            bekker: "1234b18-1238b14",
            minutes: 6,
            summary:
              "Friendship is said in three ways, through virtue, through usefulness and through pleasure, but these are not one kind nor merely three unrelated things. They are related to one primary sense, as the medical knife and the medical man are related to medicine. The primary friendship is that of good people, a mutual choice of what is good and pleasant without qualification, loving the friend as himself and not for something else. The other friendships are called friendships because they resemble it. Only primary friendship is stable, since it rests on a settled decision. There is no stable friendship without trust, and trust needs time: as Theognis says, you cannot know a person's mind until you have tried him.",
            passage: {
              text: "This then is primary friendship, and all admit it to be friendship. It is through it that the other friendships seem friendships to some, but are doubted to be such by others. For friendship seems something stable, and this alone is stable. For a formed decision is stable, and where we do not act quickly or easily, we get the decision right. There is no stable friendship without confidence, but confidence needs time.",
              ref: "VII.2, 1237b8-13",
            },
            terms: [
              { greek: "πρώτη φιλία", translit: "prōtē philia", english: "primary friendship", gloss: "Friendship of the good, to which the other kinds are related." },
              { greek: "πίστις", translit: "pistis", english: "confidence, trust", gloss: "What stable friendship needs, and what takes time." },
            ],
            checks: [
              {
                q: "Why is primary friendship stable, according to the passage?",
                options: ["Because it is quick and easy", "Because it rests on a formed decision", "Because the law protects it", "Because it brings profit"],
                answer: 1,
                why: "The passage says \"a formed decision is stable,\" and primary friendship rests on it.",
              },
              {
                q: "What does the passage say confidence needs?",
                options: ["Wealth", "Time", "Many friends", "Agreement on everything"],
                answer: 1,
                why: "The passage ends: \"There is no stable friendship without confidence, but confidence needs time.\"",
              },
            ],
            journal: "Whose trust have you earned over time, and how long did it take?",
          },
          {
            id: "to-perceive-a-friend-is-to-know-oneself",
            title: "To perceive a friend is to know oneself",
            bekker: "1244b1-1246a25",
            minutes: 6,
            summary:
              "If God, who is self-sufficient, needs no friend, why should a self-sufficient person need one? Aristotle grants the argument some truth but says it misleads. Life is perceiving and knowing, and to live is pleasant, so perceiving and knowing oneself is most desirable. A friend is, as the proverb says, another Heracles, a second self, yet separate, and to perceive a friend is in a way to perceive and know oneself. That is why even ordinary shared pleasures are sweeter with a friend, and still more the higher ones. Friends should share in what belongs to the end: they should contemplate together and feast together, not on food alone. God's good is not like ours, since he is his own well-being; ours involves another.",
            passage: {
              text: "But none the less does a friend wish to be as it were a separate self. Therefore to perceive a friend must be in a way to perceive one's self and to know one's self. So that even the vulgar forms of pleasure and life in the society of a friend are naturally pleasant (for perception of the friend always takes place at the same time), but still more the communion in the diviner pleasures.",
              ref: "VII.12, 1245a34-39",
            },
            terms: [
              { greek: "ἕτερος αὐτός", translit: "heteros autos", english: "a second self", gloss: "The friend: another self, yet a separate one." },
              { greek: "συναισθάνεσθαι", translit: "synaisthanesthai", english: "to perceive together", gloss: "Shared awareness of each other's life." },
            ],
            checks: [
              {
                q: "What does the passage say perceiving a friend is, in a way?",
                options: ["A distraction from oneself", "To perceive one's self and to know one's self", "A merely useful pleasure", "Something only gods do"],
                answer: 1,
                why: "The passage says \"to perceive a friend must be in a way to perceive one's self and to know one's self.\"",
              },
              {
                q: "Which pleasures are pleasanter still in a friend's company, according to the passage?",
                options: ["Only the vulgar ones", "The diviner pleasures", "Pleasures of food alone", "None at all"],
                answer: 1,
                why: "The passage says vulgar pleasures are pleasant with a friend, \"but still more the communion in the diviner pleasures.\"",
              },
            ],
            journal: "What have you learned about yourself only by watching a friend?",
          },
        ],
      },
      {
        id: "book-8",
        title: "Book VIII: Good luck and nobility",
        bekker: "1246a26-1249b25",
        line: "Aristotle asks where good luck comes from, defines nobility and goodness as complete virtue, and gives a standard for choosing natural goods.",
        lessons: [
          {
            id: "good-luck-and-the-divine",
            title: "Good luck and the divine in us",
            bekker: "1246b37-1248b7",
            minutes: 6,
            summary:
              "Some foolish people succeed again and again. Is this by nature, by divine favour, or by chance? Aristotle notes that some people have a fortunate natural endowment, like those who sing well without having learned, and move towards the good without reasoning. He then asks what starts movement in the soul. Thinking does not begin from earlier thinking forever, so there must be a starting point. As in the universe, so in the soul, God moves everything; the divine in us moves all. The starting point of reasoning is something greater than reasoning. This is why the lucky succeed without reasoning well, and why some have a gift of divination. He concludes that there are two kinds of good luck, one divine and lasting, the other not.",
            passage: {
              text: "The answer is clear: as in the universe, so in the soul, God moves everything. For in a sense the divine element in us moves everything. The starting-point of reasoning is not reasoning, but something greater. What, then, could be greater even than knowledge and intellect but God? Not virtue, for virtue is an instrument of the intellect.",
              ref: "VIII.2, 1248a",
            },
            terms: [
              { greek: "εὐτυχία", translit: "eutychia", english: "good luck, good fortune", gloss: "Success without reasoning; one kind is divine and lasting." },
              { greek: "θεῖον", translit: "theion", english: "the divine", gloss: "The element in us that starts movement in the soul." },
            ],
            checks: [
              {
                q: "According to the passage, what is the starting point of reasoning?",
                options: ["Reasoning itself", "Something greater than reasoning", "Virtue", "Chance"],
                answer: 1,
                why: "The passage says \"the starting-point of reasoning is not reasoning, but something greater.\"",
              },
              {
                q: "Why is virtue not that greater thing, according to the passage?",
                options: ["Because virtue is a vice", "Because virtue is an instrument of the intellect", "Because virtue comes by luck", "Because virtue belongs to animals"],
                answer: 1,
                why: "The passage says \"Not virtue, for virtue is an instrument of the intellect.\"",
              },
            ],
            journal: "Where has something in you led you well before you could give reasons for it?",
          },
          {
            id: "nobility-and-goodness",
            title: "Nobility and goodness",
            bekker: "1248b8-1249b25",
            minutes: 6,
            summary:
              "Aristotle now describes the virtue that arises from all the virtues together, nobility and goodness. A good person is one for whom natural goods such as honour, wealth and health are good; they harm the foolish and unjust. A noble and good person also has noble things for their own sake and does what is noble for its own sake. Some, like the Spartans, have virtue only for the sake of natural goods; they are good but not noble and good. Finally he gives a standard for choosing natural goods: whatever choice or possession of them will most promote the contemplation and service of God is best, and whatever hinders it is bad. This, he says, is the best standard for the soul.",
            passage: {
              text: "A man is noble and good because those goods which are noble are possessed by him for themselves, and because he practises the noble and for its own sake, the noble being the virtues and the acts that proceed from virtue.",
              ref: "VIII.3, 1248b34-37",
            },
            terms: [
              { greek: "καλοκἀγαθία", translit: "kalokagathia", english: "nobility and goodness", gloss: "Complete virtue, which loves the noble for its own sake." },
              { greek: "ὅρος", translit: "horos", english: "standard", gloss: "The measure for choosing goods: what best serves the contemplation of God." },
            ],
            checks: [
              {
                q: "Why is a man noble and good, according to the passage?",
                options: ["Because he has great wealth", "Because he has noble goods for themselves and practises the noble for its own sake", "Because he follows custom", "Because he is lucky"],
                answer: 1,
                why: "The passage says he has noble goods \"for themselves\" and \"practises the noble and for its own sake.\"",
              },
              {
                q: "What standard does Aristotle give for choosing natural goods?",
                options: ["Whatever brings the most pleasure", "Whatever most promotes the contemplation and service of God", "Whatever the city honours", "Whatever is rarest"],
                answer: 1,
                why: "He says the choice of natural goods that most produces the contemplation of God is best, and what hinders it is bad.",
              },
            ],
            journal: "Is there a good you pursue only for what it brings you, that you could learn to love for itself?",
          },
        ],
      },
    ],
  },
  {
    id: "magna-moralia",
    title: "Magna Moralia",
    greek: "Ἠθικὰ Μεγάλα",
    latin: "Magna Moralia",
    subject: "ethics",
    level: "Advanced",
    bekker: "1181a-1213b",
    about:
      "The Great Ethics, so called for its two long books, is a compact course in Aristotelian ethics: happiness, virtue as a mean, choice, the virtues, weakness of will, pleasure, good fortune and friendship. It is plainer and shorter than the other two ethical works, and its famous image of the friend as a mirror in which we see ourselves is found only here.",
    before: ["nicomachean-ethics", "eudemian-ethics"],
    caveat:
      "Scholars disagree about whether Aristotle wrote the Magna Moralia. Many hold that it is a later summary of his ethics by a member of his school; some, notably Hans von Arnim and John M. Cooper, have argued that it preserves an early course of Aristotle's, written up by a student. Read it as Aristotelian ethics, not certainly as Aristotle's own words.",
    translation: { translator: "St. George Stock", year: 1915, title: "Magna Moralia (The Works of Aristotle, vol. IX)", url: OXFORD_IX },
    units: [
      {
        id: "book-1",
        title: "Book I: Happiness and virtue",
        bekker: "1181a24-1198b23",
        line: "The author places ethics within statecraft, defines happiness as living by the virtues, treats virtue as a mean and purpose as deliberate impulse, and goes through the virtues.",
        lessons: [
          {
            id: "ethics-is-part-of-statecraft",
            title: "Ethics is part of statecraft",
            bekker: "1181a24-1183b18",
            minutes: 5,
            summary:
              "The work begins by asking what the study of character belongs to, and answers that it is part of statecraft, since no one can act in public affairs without being good. So the whole subject might rightly be called politics rather than ethics. We must learn what virtue is and how it comes about, because we want not only to know but to become good. The author reviews earlier thinkers: Pythagoras made the virtues numbers, Socrates made them forms of knowledge and so left out the irrational part of the soul, and Plato rightly divided the soul but mixed virtue with the study of the Good. The good to be studied is the best good for us, not the Idea of Good.",
            passage: {
              text: "Since our purpose is to speak about ethics, we must first inquire of what moral character is a branch. To speak concisely, then, it would seem to be a branch of nothing else than statecraft. For it is not possible to act at all in affairs of state unless one is of a certain kind, to wit, good.",
              ref: "I.1, 1181a24-28",
            },
            terms: [
              { greek: "πολιτική", translit: "politikē", english: "statecraft", gloss: "The art of the city, of which ethics is a part." },
              { greek: "ἦθος", translit: "ēthos", english: "character", gloss: "What ethics studies." },
            ],
            checks: [
              {
                q: "According to the passage, of what is moral character a branch?",
                options: ["Medicine", "Statecraft", "Mathematics", "Rhetoric"],
                answer: 1,
                why: "The passage says it is \"a branch of nothing else than statecraft.\"",
              },
              {
                q: "Why does the author say Socrates was wrong to make the virtues sciences?",
                options: ["Because it left out the irrational part of the soul", "Because sciences are useless", "Because virtues are numbers", "Because only Plato knew the Good"],
                answer: 0,
                why: "He says that putting all the virtues in the rational part does away with the irrational part, and so with passion and character.",
              },
            ],
            journal: "What would change in public life if no one could take part in it without being good?",
          },
          {
            id: "happiness-is-living-by-the-virtues",
            title: "Happiness is living by the virtues",
            bekker: "1183b19-1185a39",
            minutes: 5,
            summary:
              "The author divides goods several ways: some are honourable, some praiseworthy, some capacities; some are ends and some means; some complete and some not. Happiness is the complete good and cannot be counted together with other goods as if it were one among them. Goods are of the soul, of the body or external, and those of the soul are best. Happiness is living and doing well, and that means using the virtues, not merely having them. So happiness consists in living in accordance with the virtues. It needs a complete person and a complete time, which is why a child is not happy. And it must be an activity: no one would call happy someone who slept through his whole life.",
            passage: {
              text: "But that it is an activity can be seen also from the following consideration. For supposing some one to be asleep all his life, we should hardly consent to call such a man happy. Life indeed he has, but life in accordance with the virtues he has not, and it was in this that we made the activity to consist.",
              ref: "I.4, 1185a9-13",
            },
            terms: [
              { greek: "ἐνέργεια", translit: "energeia", english: "activity", gloss: "Using a capacity, not merely having it." },
              { greek: "τέλειον", translit: "teleion", english: "complete", gloss: "Happiness is complete, needing a full life and a full person." },
            ],
            checks: [
              {
                q: "Why would someone asleep all his life not be called happy, according to the passage?",
                options: ["Because he has no life", "Because he has life but not life in accordance with the virtues", "Because sleep is painful", "Because he has no wealth"],
                answer: 1,
                why: "The passage says \"life indeed he has, but life in accordance with the virtues he has not.\"",
              },
              {
                q: "Why does the author say a child is not happy?",
                options: ["Because happiness needs a complete person and a complete time", "Because children are wicked", "Because children feel no pleasure", "Because children cannot sleep"],
                answer: 0,
                why: "He says happiness is found in what is complete: a man, not a child, and a complete period of life.",
              },
            ],
            journal: "Which of your virtues do you possess but rarely use?",
          },
          {
            id: "virtue-is-destroyed-by-too-much-and-too-little",
            title: "Virtue is destroyed by too much and too little",
            bekker: "1185b1-1187a4",
            minutes: 5,
            summary:
              "The soul has a rational and an irrational part, and moral virtue belongs to the irrational part as it obeys reason. Moral virtue is destroyed by excess and defect, as strength is ruined by too much or too little exercise and health by too much or too little food. A man who fears nothing, not even the gods, is not brave but mad, and a man who fears everything is a coward. So the same things increase and destroy virtue. Moral virtue also concerns pleasures and pains, since we do bad things for pleasure and avoid good things for fear of pain. It does not come by nature; habit forms it, which is why the word ēthikē comes from ethos, habit.",
            passage: {
              text: "The same is the case with temperance and courage and the rest of the virtues. For if you make a man too fearless, so as not even to fear the Gods, he is not brave but mad, but if you make him afraid of everything, he is a coward. To be brave, then, a man must not either fear everything or nothing.",
              ref: "I.5, 1185b21-27",
            },
            terms: [
              { greek: "μεσότης", translit: "mesotēs", english: "mean", gloss: "The state between excess and defect." },
              { greek: "ἔθος", translit: "ethos", english: "habit", gloss: "What forms moral virtue." },
            ],
            checks: [
              {
                q: "What is a man who fears not even the gods, according to the passage?",
                options: ["Brave", "Mad", "Temperate", "Wise"],
                answer: 1,
                why: "The passage says such a man \"is not brave but mad.\"",
              },
              {
                q: "What must a brave man not do, according to the passage?",
                options: ["Fear anything at all", "Either fear everything or nothing", "Fight in war", "Trust reason"],
                answer: 1,
                why: "The passage says \"a man must not either fear everything or nothing.\"",
              },
            ],
            journal: "Where in your life has too much of a good thing become a fault?",
          },
          {
            id: "purpose-is-deliberate-impulse",
            title: "Purpose is deliberate impulse",
            bekker: "1187a5-1190b9",
            minutes: 6,
            summary:
              "A human being begets his actions as he begets children, and their source is purpose, so it is in our power to be good or bad, though no one can become better than his nature by wishing. The voluntary is roughly what is not done by force. Its source is impulse, which takes three forms: appetite, passion and wish. Purpose is not any one of these, nor is it thought, since we think about things in India without purposing them. Purpose concerns means, not the end, and things in our power. So purpose is an impulse to act that follows thinking and deliberating. Not everything voluntary is purposed: we sit down and stand up voluntarily without thinking about it.",
            passage: {
              text: "Since, then, purpose is a deliberate impulse attended with thought, the voluntary is not necessarily done on purpose. For there are many acts which we do voluntarily before thinking and deliberating about them; for instance, we sit down and rise up, and do many other things of the same sort voluntarily but without having thought about them, whereas every act done on purpose was found to be attended with thought.",
              ref: "I.17, 1189a31-36",
            },
            terms: [
              { greek: "προαίρεσις", translit: "prohairesis", english: "purpose, choice", gloss: "An impulse to act that follows deliberation." },
              { greek: "ὁρμή", translit: "hormē", english: "impulse", gloss: "The source of action: appetite, passion or wish." },
            ],
            checks: [
              {
                q: "What is purpose, according to the passage?",
                options: ["Any impulse at all", "A deliberate impulse attended with thought", "A thought with no impulse", "An act done by force"],
                answer: 1,
                why: "The passage says \"purpose is a deliberate impulse attended with thought.\"",
              },
              {
                q: "Which acts does the passage give as voluntary but not done on purpose?",
                options: ["Making a contract", "Sitting down and rising up", "Choosing a friend", "Voting in the assembly"],
                answer: 1,
                why: "The passage gives sitting down and rising up as voluntary acts done without having thought about them.",
              },
            ],
            journal: "What did you do today voluntarily but without purpose, and what did you do on purpose?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Self-control, fortune and friendship",
        bekker: "1198b24-1213b30",
        line: "The author treats equity, self-control, pleasure, good fortune and right reason, and ends with a long account of friendship and self-sufficiency.",
        lessons: [
          {
            id: "the-wise-cannot-be-incontinent",
            title: "The wise cannot be incontinent",
            bekker: "1200a11-1204a19",
            minutes: 5,
            summary:
              "The author works through puzzles about self-control and its lack. The incontinent person knows what is right and is not deceived in his reasoning, yet acts against it from passion. The intemperate person is bad by nature, the incontinent by habit, so the intemperate is harder to cure, since one habit can drive out another but nothing drives out nature. Can the wise person be incontinent? No: the wise person is not only one in whom right reason exists, but one who does what right reason shows to be best. A clever person, though, can be incontinent, because cleverness and wisdom work in the same sphere but only the wise does what he ought.",
            passage: {
              text: "Now if the wise man does what is best, the wise man will not be incontinent; but an incontinent man may be clever. For we distinguished above between the clever and the wise as being different. For though their spheres are the same, yet the one does what he ought and the other does not.",
              ref: "II.6, 1204a12-16",
            },
            terms: [
              { greek: "ἀκρασία", translit: "akrasia", english: "incontinence", gloss: "Acting against right reason through passion." },
              { greek: "δεινότης", translit: "deinotēs", english: "cleverness", gloss: "Skill without the right aim; compatible with incontinence." },
            ],
            checks: [
              {
                q: "Who, according to the passage, may be incontinent?",
                options: ["The wise man", "The clever man", "Neither", "Both equally"],
                answer: 1,
                why: "The passage says \"the wise man will not be incontinent; but an incontinent man may be clever.\"",
              },
              {
                q: "How do the clever and the wise differ, according to the passage?",
                options: ["They work in different spheres", "The wise does what he ought and the clever does not", "The clever knows more", "The wise has no reason"],
                answer: 1,
                why: "The passage says \"though their spheres are the same, yet the one does what he ought and the other does not.\"",
              },
            ],
            journal: "Where are you clever about what is right without yet doing it?",
          },
          {
            id: "good-fortune-comes-from-nature",
            title: "Where good fortune comes from",
            bekker: "1206b30-1207b19",
            minutes: 5,
            summary:
              "Since happiness seems to need good fortune, the author asks what fortune is. It is not nature, which acts regularly, while fortune is disorderly. It is not mind or right reason, where there is order rather than chance. Nor is it the care of the gods, since then God would be a bad or unjust judge, giving good things to the bad. Nature is left as most closely connected with good fortune. Fortune shows itself in things not in our power, which is why no one calls the just or the brave man fortunate for being just or brave. Good fortune, the author concludes, is an irrational nature, and the fortunate person is one with a bent toward good things apart from reason.",
            passage: {
              text: "Nature, then, only is left as being most connected with good fortune. And good fortune and fortune generally displays itself in things that are not in our own power, and of which we are not masters nor able to bring them about. For which reason no one calls the just man, in so far as he is just, fortunate, nor yet the brave man, nor any other virtuous character.",
              ref: "II.8, 1207a16-21",
            },
            terms: [
              { greek: "εὐτυχία", translit: "eutychia", english: "good fortune", gloss: "Success in what is not in our power." },
              { greek: "φύσις", translit: "physis", english: "nature", gloss: "What the author finds most connected with good fortune." },
            ],
            checks: [
              {
                q: "In what kind of things does good fortune display itself, according to the passage?",
                options: ["Things in our own power", "Things not in our own power", "Acts of justice", "Acts of courage"],
                answer: 1,
                why: "The passage says fortune \"displays itself in things that are not in our own power.\"",
              },
              {
                q: "Why is the just man not called fortunate for being just?",
                options: ["Because justice is in our power to have", "Because the just are unlucky", "Because justice is a gift of the gods", "Because the just are poor"],
                answer: 0,
                why: "The author says the virtues are in our power to have or not, while fortune concerns what is not.",
              },
            ],
            journal: "What good in your life do you owe to fortune, and what to your own doing?",
          },
          {
            id: "acting-by-right-reason",
            title: "Acting by right reason",
            bekker: "1207b20-1208b2",
            minutes: 5,
            summary:
              "The author describes nobility and goodness as complete virtue, the state of a person for whom the goods that are good by nature are both good and noble. Then he returns to a phrase used throughout: acting in accordance with right reason. Someone might ask what that is and where right reason is to be found. The answer: we act by right reason when the irrational part of the soul does not hinder the rational part from doing its own work. The worse exists for the sake of the better, as the body for the soul, and the body is in good state when it helps rather than hinders. Asked what state the passions must be in, he admits it is hard to say, as with a doctor's instructions.",
            passage: {
              text: "To act, then, in accordance with right reason is when the irrational part of the soul does not prevent the rational from displaying its own activity. For then only will the action be in accordance with right reason.",
              ref: "II.10, 1208a9-12",
            },
            terms: [
              { greek: "ὀρθὸς λόγος", translit: "orthos logos", english: "right reason", gloss: "Reason acting without hindrance from the passions." },
              { greek: "ἄλογον", translit: "alogon", english: "the irrational part", gloss: "The part of the soul with appetites and passions." },
            ],
            checks: [
              {
                q: "When, according to the passage, does one act in accordance with right reason?",
                options: ["When the passions are destroyed", "When the irrational part does not prevent the rational from its activity", "When one follows the law", "When one feels no pleasure"],
                answer: 1,
                why: "The passage says it is \"when the irrational part of the soul does not prevent the rational from displaying its own activity.\"",
              },
              {
                q: "What comparison does the author use for the relation of the worse to the better?",
                options: ["A ship and its pilot", "The body for the sake of the soul", "A city and its walls", "A tool and its maker"],
                answer: 1,
                why: "He says the worse is for the sake of the better, as the body is for the sake of the soul.",
              },
            ],
            journal: "Which feeling most often keeps your reason from doing its work?",
          },
          {
            id: "the-friend-as-a-mirror",
            title: "The friend as a mirror",
            bekker: "1208b3-1213b30",
            minutes: 6,
            summary:
              "The last chapters treat friendship: its three kinds, friendship between unequals, self-love, and whether the self-sufficient person needs friends. Some argue that God, who is self-sufficient, needs no friend, so neither does the self-sufficient person. The author answers that the question concerns human self-sufficiency, not God's. To know oneself is both very hard and very pleasant, but we cannot see ourselves well from within: we blame others for faults we do not notice in ourselves, blinded by favour or passion. As we see our face by looking in a mirror, so we come to know ourselves by looking at a friend, who is a second self. So the self-sufficient person needs friendship to know himself, to do good and to live with others.",
            passage: {
              text: "as then when we wish to see our own face, we do so by looking into the mirror, in the same way when we wish to know ourselves we can obtain that knowledge by looking at our friend. For the friend is, as we assert, a second self. If, then, it is pleasant to know oneself, and it is not possible to know this without having some one else for a friend, the self-sufficing man will require friendship in order to know himself.",
              ref: "II.15, 1213a20-26",
            },
            terms: [
              { greek: "ἕτερος ἐγώ", translit: "heteros egō", english: "a second self", gloss: "The friend, in whom we see ourselves." },
              { greek: "αὐτάρκεια", translit: "autarkeia", english: "self-sufficiency", gloss: "Lacking nothing; still in need of friends, for a human being." },
            ],
            checks: [
              {
                q: "How, according to the passage, can we obtain knowledge of ourselves?",
                options: ["By looking into a mirror", "By looking at our friend", "By living alone", "By studying the gods"],
                answer: 1,
                why: "The passage says \"when we wish to know ourselves we can obtain that knowledge by looking at our friend.\"",
              },
              {
                q: "Why does the self-sufficing man require friendship, according to the passage?",
                options: ["To gain wealth", "In order to know himself", "To win honour", "To escape the law"],
                answer: 1,
                why: "The passage concludes that he \"will require friendship in order to know himself.\"",
              },
            ],
            journal: "What has a friend shown you about yourself that you could not see alone?",
          },
        ],
      },
    ],
  },
];
