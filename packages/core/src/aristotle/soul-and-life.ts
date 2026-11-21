import type { Course } from "./types";

// Soul (On the Soul; Parva Naturalia) and Living things (History of Animals, Parts of Animals, Movement and
// Progression of Animals, Generation of Animals). Passages are copied from the named public-domain translations:
// Hicks 1907 for On the Soul (archive.org scan of the Cambridge edition), the Oxford translations (1908-1912) for the
// rest, as given by the MIT Internet Classics Archive, and Platt's Generation of Animals from the Oxford volume V scan.

export const SOUL_AND_LIFE: Course[] = [
  {
    id: "on-the-soul",
    title: "On the Soul",
    greek: "Περὶ ψυχῆς",
    latin: "De Anima",
    subject: "soul",
    level: "Start here",
    bekker: "402a-435b",
    about:
      "Aristotle asks what it is to be alive, and answers that the soul is the form of a living body, not a thing lodged inside it. He then works through nutrition, perception, imagination, thought and desire, the powers by which living things live. It is the root of everything he later says about animals, memory, sleep and the good life.",
    before: ["physics"],
    caveat: "",
    translation: {
      translator: "R. D. Hicks",
      year: 1907,
      title: "Aristotle De Anima, with Translation, Introduction and Notes",
      url: "https://archive.org/details/aristotledeanima0000rdhi",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: What earlier thinkers said the soul is",
        bekker: "402a1-411b30",
        line: "Book I sets out why the soul is worth studying, what must be asked about it, and where earlier views fall short.",
        lessons: [
          {
            id: "why-study-the-soul",
            title: "Why the soul is worth studying",
            bekker: "402a1-402b16",
            minutes: 5,
            summary:
              "Aristotle opens by ranking kinds of knowledge. One body of knowledge is worth more than another when it is more exact or when its objects are more important and wonderful, and the study of the soul wins on both counts. It also helps every other inquiry, above all the study of nature, because the soul is in some sense the principle of animal life. He then admits the task is hard. We must first decide what kind of thing the soul is: a substance, a quality or a quantity, something potential or something actual. We must ask whether it has parts, whether all souls are alike, and whether to start from the faculties or from what they do, such as thinking and perceiving. He warns that discussion so far has looked only at the human soul.",
            passage: {
              text: "Cognition is in our eyes a thing of beauty and worth, and this is true of one cognition more than another, either because it is exact or because it relates to more important and remarkable objects. On both these grounds we may with good reason claim a high place for the enquiry concerning the soul.",
              ref: "I.1, 402a1-4",
            },
            terms: [
              { greek: "ψυχή", translit: "psychē", english: "soul", gloss: "What makes a living thing alive; for Aristotle not only the human mind." },
              { greek: "ἀρχή", translit: "archē", english: "principle", gloss: "A starting point or source from which something comes or is explained." },
            ],
            checks: [
              {
                q: "On what two grounds does Aristotle rank the study of the soul highly?",
                options: [
                  "It is exact and its objects are important and remarkable",
                  "It is easy and it is useful for medicine",
                  "It is ancient and it was taught by Plato",
                ],
                answer: 0,
                why: "The passage says one cognition is worth more than another because it is exact or because its objects are more important, and claims the inquiry into soul qualifies on both grounds.",
              },
              {
                q: "Which other study does the summary say knowledge of the soul helps most?",
                options: ["Mathematics", "The study of nature", "Rhetoric", "Politics"],
                answer: 1,
                why: "The summary reports that it helps every inquiry, above all the study of nature, because the soul is the principle of animal life.",
              },
            ],
            journal: "Which kind of knowledge do you value most in your own life, and is it because it is exact or because of what it is about?",
          },
          {
            id: "feelings-belong-to-body-and-soul",
            title: "Feelings belong to soul and body together",
            bekker: "403a3-403b19",
            minutes: 6,
            summary:
              "Are the soul's states its own, or shared with the body? Aristotle notes that anger, confidence, desire and perception all seem to involve the body. Thought is the one candidate for something the soul does alone, but if thinking depends on imagination, even thought needs the body. He adds evidence: sometimes strong provocations leave us calm, while slight ones enrage us when the body is already stirred. So feelings are forms in matter, and should be defined with both. A dialectician defines anger as a desire to pay back pain; a natural scientist as a boiling of the blood around the heart. The full student of nature, he says, gives both the form and the matter, as one defines a house both as a shelter and as stones, bricks and timber.",
            passage: {
              text: "It would appear that in most cases soul neither acts nor is acted upon apart from the body: as, e.g., in anger, confidence, desire and sensation in general. Thought, if anything, would seem to be peculiar to the soul. Yet, if thought is a sort of imagination, or not independent of imagination, it will follow that even thought cannot be independent of the body.",
              ref: "I.1, 403a5-10",
            },
            terms: [
              { greek: "πάθος", translit: "pathos", english: "affection, feeling", gloss: "Something that happens to a thing; here a state like anger or fear." },
              { greek: "λόγος ἔνυλος", translit: "logos enylos", english: "form in matter", gloss: "An account that can only be realised in a body of a certain kind." },
            ],
            checks: [
              {
                q: "Which activity does Aristotle say might be peculiar to the soul?",
                options: ["Anger", "Sensation", "Thought", "Desire"],
                answer: 2,
                why: "The passage says thought, if anything, would seem to be peculiar to the soul, while anger, desire and sensation involve the body.",
              },
              {
                q: "Under what condition would even thought depend on the body?",
                options: [
                  "If thought is a sort of imagination or needs imagination",
                  "If thought is always about bodies",
                  "If thought happens only when we are awake",
                ],
                answer: 0,
                why: "He says that if thought is a sort of imagination, or not independent of it, then even thought cannot be independent of the body.",
              },
              {
                q: "How does the natural scientist define anger, in Aristotle's example?",
                options: [
                  "As a desire to pay back pain",
                  "As a boiling of the blood around the heart",
                  "As a false opinion about an insult",
                ],
                answer: 1,
                why: "The summary gives his contrast: the dialectician names the desire for retaliation, the physicist the heated blood around the heart.",
              },
            ],
            journal: "When did your body's state last change how strongly you felt about something that happened?",
          },
          {
            id: "soul-is-not-a-harmony",
            title: "The soul is not a harmony",
            bekker: "407b27-408a28",
            minutes: 5,
            summary:
              "In Book I Aristotle tests the views he inherited. Some said the soul is what moves; some that it is what perceives and knows, made of the elements so that like may know like; some that it is a kind of harmony. He gives the harmony view a hearing because many find it attractive. On this view the body is made of opposites and the soul is their blend or proportion. Aristotle answers that a harmony is either a ratio of parts or their combination, and the soul is neither. A harmony does not cause motion, yet everyone holds that the soul moves the animal. And the word fits health or bodily fitness better than the soul, since it is hard to see anger or thinking as a ratio. He also mocks the Pythagorean idea that any soul could enter any body.",
            passage: {
              text: "There is yet another opinion concerning soul which has come down to us, commending itself to many minds as readily as any that is put forward, although it has been severely criticised even in the popular discussions of the present day. The soul is asserted to be a kind of harmony, for harmony is on this view a blending or combining of opposites, and the components of the body are opposites.",
              ref: "I.4, 407b27-32",
            },
            terms: [
              { greek: "ἁρμονία", translit: "harmonia", english: "harmony, attunement", gloss: "A fitting together of parts, or the ratio in which they are mixed." },
              { greek: "κίνησις", translit: "kinēsis", english: "motion, change", gloss: "Any change, of place, size or quality; earlier thinkers made the soul its source." },
            ],
            checks: [
              {
                q: "Why do holders of the harmony view call the soul a harmony?",
                options: [
                  "Because the soul enjoys music",
                  "Because harmony blends opposites and the body is made of opposites",
                  "Because the soul is located in the heart",
                ],
                answer: 1,
                why: "The passage says harmony is a blending of opposites, and the components of the body are opposites.",
              },
              {
                q: "Which objection does Aristotle raise against the harmony view?",
                options: [
                  "A harmony does not cause motion, yet the soul does",
                  "A harmony is too large to fit in a body",
                  "Harmonies exist only in mathematics",
                ],
                answer: 0,
                why: "The summary reports that causing motion is no attribute of a harmony, while nearly everyone assigns it to the soul.",
              },
            ],
            journal: "Which picture of yourself do you find most natural: a mover, a knower, or a balance of parts, and what does it leave out?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: The soul as the form of a living body",
        bekker: "412a1-424b18",
        line: "Book II defines the soul, sorts its powers, and studies nutrition and the senses one by one.",
        lessons: [
          {
            id: "first-actuality-of-a-living-body",
            title: "The soul is what a living body is for",
            bekker: "412a1-413a10",
            minutes: 6,
            summary:
              "Aristotle makes a fresh start. Substance can mean matter, form, or the whole made of both; matter is potential and form is actual. Living bodies are substances, and a body is alive by having a soul, so the soul is the form of a natural body that can live. Actuality has two senses, like having knowledge and using it. Since we have a soul even when asleep, the soul is the first actuality, like knowledge possessed. So it is the first actuality of a natural body with organs. It follows that there is no more need to ask whether soul and body are one than to ask whether wax and its imprint are one. If an axe were a natural body, being an axe would be its soul; if the eye were an animal, sight would be its soul.",
            passage: {
              text: "Clearly in this case it is analogous to knowledge: for sleep, as well as waking, implies the presence of soul; and, whilst waking is analogous to the exercise of knowledge, sleep is analogous to the possession of knowledge without its exercise; and in the same individual the possession of knowledge comes in order of time before its exercise. Hence soul is the first actuality of a natural body having in it the capacity of life.",
              ref: "II.1, 412a22-28",
            },
            terms: [
              { greek: "ἐντελέχεια", translit: "entelecheia", english: "actuality", gloss: "Being fully what a thing can be; the soul is the first stage of it." },
              { greek: "εἶδος", translit: "eidos", english: "form", gloss: "What makes some matter the kind of thing it is." },
              { greek: "ὕλη", translit: "hylē", english: "matter", gloss: "What a thing is made of; it is potentially what the form makes it." },
            ],
            checks: [
              {
                q: "Why is the soul compared to possessing knowledge rather than using it?",
                options: [
                  "Because the soul is present even in sleep",
                  "Because the soul is learned from teachers",
                  "Because the soul is always thinking",
                ],
                answer: 0,
                why: "The passage says sleep, as well as waking, implies soul, and sleep is like having knowledge without exercising it.",
              },
              {
                q: "What is Aristotle's definition of the soul here?",
                options: [
                  "A breath that leaves the body at death",
                  "The first actuality of a natural body having in it the capacity of life",
                  "A harmony of hot and cold",
                ],
                answer: 1,
                why: "The passage ends: soul is the first actuality of a natural body having in it the capacity of life.",
              },
              {
                q: "In the eye example, what would be the eye's soul if the eye were an animal?",
                options: ["Its pupil", "Its moisture", "Sight", "Light"],
                answer: 2,
                why: "The summary reports that if the eye were an animal, eyesight would be its soul.",
              },
            ],
            journal: "What are you still, as a person, even when you are asleep and doing nothing?",
          },
          {
            id: "powers-of-living-things",
            title: "Living things differ by their powers",
            bekker: "413a20-415a13",
            minutes: 5,
            summary:
              "We call a thing alive if it has any one of these: thought, perception, movement from place to place, or nutrition with growth and decay. Plants live because they take in food and grow in all directions. Nutrition can exist without the others, as in plants, but in mortal creatures the others never exist without it. Perception is what makes an animal an animal, even one that never moves, and touch is the first sense, found in all animals. Aristotle concludes that the soul is the source of these powers and is defined by them. The powers form a series: as a triangle is contained in a square, each higher kind of soul contains the lower, so animals have nutrition and perception, and humans add thought.",
            passage: {
              text: "It is, then, in virtue of this principle that all living things live, whether animals or plants. But it is sensation primarily which constitutes the animal. For, provided they have sensation, even those creatures which are devoid of movement and do not change their place are called animals and are not merely said to be alive.",
              ref: "II.2, 413b1-4",
            },
            terms: [
              { greek: "δύναμις", translit: "dynamis", english: "power, capacity", gloss: "An ability to act or be acted on, like nutrition or sight." },
              { greek: "θρεπτικόν", translit: "threptikon", english: "nutritive power", gloss: "The power of feeding, growing and reproducing, shared even by plants." },
              { greek: "αἴσθησις", translit: "aisthēsis", english: "perception, sensation", gloss: "The power of sensing; it marks off animals from plants." },
            ],
            checks: [
              {
                q: "What does Aristotle say primarily makes something an animal?",
                options: ["Movement from place to place", "Sensation", "Thought", "Having blood"],
                answer: 1,
                why: "The passage says it is sensation primarily which constitutes the animal, even in creatures that do not move.",
              },
              {
                q: "Which power can exist without the others?",
                options: ["Thought", "Touch", "Nutrition", "Imagination"],
                answer: 2,
                why: "The summary reports that nutrition can be separated from the rest, as plants show, though in mortal creatures the others never exist without it.",
              },
            ],
            journal: "Which of your powers do you use most days without noticing, and which do you think of as most yours?",
          },
          {
            id: "sharing-in-the-eternal",
            title: "Reproduction is a share in the eternal",
            bekker: "415a14-416b31",
            minutes: 5,
            summary:
              "Aristotle begins with the nutritive soul, the first and most widely shared power. Its work is to use food and to reproduce. Producing another like oneself, animal from animal and plant from plant, is the most natural work of a living thing, done so that it may share in the eternal and the divine as far as it can. Since no perishable individual lasts forever, it lasts in the only way open to it, in another like itself, one in kind though not in number. He adds that the soul is a cause of the living body in three ways: as what starts its changes, as what it is for, and as its substance. He also argues against the view that fire is the cause of growth: fire grows without limit, while living things have a set size.",
            passage: {
              text: "For it is the most natural function in all living things, if perfect and not defective or spontaneously generated, to reproduce their species; animal producing animal and plant plant, in order that they may, so far as they can, share in the eternal and the divine. For it is that which all things yearn after, and that is the final cause of all their natural activity.",
              ref: "II.4, 415a26-b2",
            },
            terms: [
              { greek: "τὸ οὗ ἕνεκα", translit: "to hou heneka", english: "that for the sake of which", gloss: "The end or goal of an activity, often called the final cause." },
              { greek: "ἀΐδιος", translit: "aïdios", english: "eternal", gloss: "Always existing; mortal things share in it only through their kind." },
            ],
            checks: [
              {
                q: "According to the passage, why do living things reproduce?",
                options: [
                  "To share, as far as they can, in the eternal and the divine",
                  "To increase the food supply",
                  "Because the elements force them to",
                ],
                answer: 0,
                why: "The passage says they reproduce in order that they may share in the eternal and the divine so far as they can.",
              },
              {
                q: "In what way does a perishable living thing last, according to the summary?",
                options: [
                  "As the very same individual forever",
                  "In another like itself, one in kind but not in number",
                  "As a memory in other animals",
                ],
                answer: 1,
                why: "Since no individual lasts forever, it continues in offspring of the same kind, one in species though not in number.",
              },
            ],
            journal: "What do you hope will continue after you, and is it something like yourself or something you made?",
          },
          {
            id: "perception-takes-form-without-matter",
            title: "Perception takes in form without matter",
            bekker: "424a17-424b18",
            minutes: 5,
            summary:
              "After treating each sense in turn, Aristotle gives a general account. A sense receives the perceptible form of a thing without its matter, as wax takes the shape of a signet ring without the iron or gold. The sense is affected by what has colour, flavour or sound, not as this particular thing but as having a certain quality. The sense organ and the power to perceive are one thing, but differ in account: the organ is a body, the power is a ratio or capacity of that body. This explains why too strong a stimulus destroys a sense: if the motion is too violent, the ratio is upset, as a lyre string struck too hard loses its tune. It also explains why plants do not perceive: they take in heat and cold together with the matter.",
            passage: {
              text: "In regard to all sense generally we must understand that sense is that which is receptive of sensible forms apart from their matter, as wax receives the imprint of the signet-ring apart from the iron or gold of which it is made",
              ref: "II.12, 424a17-20",
            },
            terms: [
              { greek: "αἰσθητήριον", translit: "aisthētērion", english: "sense organ", gloss: "The bodily part, like the eye, in which the power to perceive resides." },
              { greek: "λόγος", translit: "logos", english: "ratio, proportion", gloss: "Here the balanced state of the organ that lets it perceive." },
            ],
            checks: [
              {
                q: "What does the signet ring illustrate?",
                options: [
                  "That senses receive form without the matter",
                  "That senses are made of metal",
                  "That memory fades over time",
                ],
                answer: 0,
                why: "The passage says sense receives sensible forms apart from their matter, as wax takes the ring's imprint apart from its iron or gold.",
              },
              {
                q: "Why, on this account, does a very loud noise damage hearing?",
                options: [
                  "It upsets the ratio that the sense is",
                  "It adds matter to the ear",
                  "It moves the soul out of the body",
                ],
                answer: 0,
                why: "The summary explains that too violent a motion destroys the ratio in the organ, as a string struck too hard loses its tune.",
              },
              {
                q: "Why do plants not perceive, according to the summary?",
                options: [
                  "They have no soul",
                  "They take in qualities together with the matter",
                  "They do not need food",
                ],
                answer: 1,
                why: "Plants are warmed and cooled by matter itself; they cannot receive the form apart from the matter.",
              },
            ],
            journal: "What have you taken in today only as a form, a look or a sound, while leaving the thing itself where it was?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: Imagination, mind and desire",
        bekker: "424b22-435b25",
        line: "Book III treats the common sense, imagination and mind, then asks what moves an animal to act.",
        lessons: [
          {
            id: "imagination",
            title: "Imagination is neither perception nor belief",
            bekker: "427b14-429a9",
            minutes: 6,
            summary:
              "Aristotle asks what imagination is. It is not perception, since we imagine in dreams with our eyes shut, and perception is present when imagination is not. It is not knowledge or understanding, which are always true, while imagination is often false. Nor is it belief, because belief involves being convinced, and many animals imagine but have no reason. It is not belief combined with perception either: the sun appears a foot across, yet we believe it larger than the inhabited world. His positive account is that imagination is a motion produced by actual perception and like it, found only in animals that perceive. Because it lingers after perception, animals act on it, and humans do too when passion, illness or sleep clouds the mind.",
            passage: {
              text: "But there are false imaginings concerning things of which we hold at the same time a true conception. For example, the sun appears only a foot in diameter, but we are convinced that it is larger than the inhabited world",
              ref: "III.3, 428b2-4",
            },
            terms: [
              { greek: "φαντασία", translit: "phantasia", english: "imagination, appearance", gloss: "The power by which something appears to us when not simply perceived." },
              { greek: "δόξα", translit: "doxa", english: "belief, opinion", gloss: "Holding something true; it implies conviction, which animals lack." },
            ],
            checks: [
              {
                q: "What does the example of the sun show?",
                options: [
                  "That imagination and belief can differ about the same thing",
                  "That the sun is a foot across",
                  "That perception is always false",
                ],
                answer: 0,
                why: "The sun appears a foot across while we are convinced it is larger than the inhabited world, so the appearance is not the belief.",
              },
              {
                q: "What is imagination, on Aristotle's positive account?",
                options: [
                  "A kind of knowledge that is always true",
                  "A motion produced by actual perception and like it",
                  "A message sent by the gods",
                ],
                answer: 1,
                why: "The summary reports that imagination is a motion resulting from actual perception and resembling it, found only in perceivers.",
              },
            ],
            journal: "What still appears one way to you even though you are sure it is another?",
          },
          {
            id: "mind-is-nothing-before-it-thinks",
            title: "The mind is nothing before it thinks",
            bekker: "429a10-430a9",
            minutes: 6,
            summary:
              "Thinking, Aristotle suggests, may be like perceiving: being affected by what is thought. If so, the part of the soul that thinks must be unaffected in the ordinary way yet able to receive forms, and potentially like them without being them. Because it can think all things, it must be unmixed, as Anaxagoras said, or its own nature would get in the way. So it is nothing actual before it thinks, and it has no bodily organ. Strong objects dull the senses, but thinking hard about something makes the mind better at lesser things. He compares the mind to a writing tablet with nothing yet written on it. Where objects are without matter, the mind and what it thinks are the same.",
            passage: {
              text: "The mind, then, since it thinks all things, must needs, in the words of Anaxagoras, be unmixed with any, if it is to rule, that is, to know. For by intruding its own form it hinders and obstructs that which is alien to it; hence it has no other nature than this, that it is a capacity. Thus, then, the part of the soul which we call intellect (and by intellect I mean that whereby the soul thinks and conceives) is nothing at all actually before it thinks.",
              ref: "III.4, 429a18-24",
            },
            terms: [
              { greek: "νοῦς", translit: "nous", english: "mind, intellect", gloss: "The power by which the soul thinks and understands." },
              { greek: "ἀμιγής", translit: "amigēs", english: "unmixed", gloss: "Having no nature of its own that would block what it receives." },
            ],
            checks: [
              {
                q: "Why must the mind be unmixed, according to the passage?",
                options: [
                  "Because its own form would hinder what is alien to it",
                  "Because it is made of fire",
                  "Because it lives in the head",
                ],
                answer: 0,
                why: "The passage says that by intruding its own form it would obstruct what is alien to it, so it has no nature but a capacity.",
              },
              {
                q: "What is the intellect before it thinks?",
                options: ["A complete set of ideas", "Nothing at all actually", "A bodily organ", "An image"],
                answer: 1,
                why: "The passage ends: the intellect is nothing at all actually before it thinks.",
              },
              {
                q: "How does the mind differ from the senses after a strong object?",
                options: [
                  "It is dulled, just like the senses",
                  "It is more able to think lesser things",
                  "It stops working entirely",
                ],
                answer: 1,
                why: "The summary reports that strong objects dull the senses, but intense thought leaves the mind better able to think lesser objects.",
              },
            ],
            journal: "When has thinking hard about something difficult made other things easier for you to understand?",
          },
          {
            id: "the-mind-that-makes",
            title: "The mind that makes all things",
            bekker: "430a10-430a25",
            minutes: 6,
            summary:
              "In a very short and much-debated chapter, Aristotle says that in all of nature there is matter, which is potentially everything of a kind, and a cause that makes them all, as a craft is to its material. So in the soul too there is one mind that becomes all things and another that makes all things, like light, which turns colours that are potential into actual colours. This second mind is separable, unaffected, unmixed, and in its being an activity. It alone, when separated, is immortal and eternal, though we do not remember, because the mind that is affected perishes. Readers since antiquity have disagreed whether this making mind is part of each human soul, or is God, as Alexander of Aphrodisias held.",
            passage: {
              text: "And to the one intellect, which answers to this description because it becomes all things, corresponds the other because it makes all things, like a sort of definite quality such as light. For in a manner light, too, converts colours which are potential into actual colours. And it is this intellect which is separable and impassive and unmixed, being in its essential nature an activity.",
              ref: "III.5, 430a14-18",
            },
            terms: [
              { greek: "νοῦς ποιητικός", translit: "nous poiētikos", english: "productive mind", gloss: "A later name for the mind that makes all things; Aristotle does not use the phrase." },
              { greek: "ἐνέργεια", translit: "energeia", english: "activity", gloss: "Being at work; this mind is activity by its very nature." },
              { greek: "χωριστός", translit: "chōristos", english: "separable", gloss: "Able to exist apart, here apart from the body." },
            ],
            checks: [
              {
                q: "What does Aristotle compare the mind that makes all things to?",
                options: ["Light", "Wax", "A tablet", "Fire"],
                answer: 0,
                why: "The passage says it is like light, which converts potential colours into actual colours.",
              },
              {
                q: "Which of these does the passage say about this intellect?",
                options: [
                  "It is separable, impassive and unmixed",
                  "It perishes with the body",
                  "It is located in the heart",
                ],
                answer: 0,
                why: "The passage calls it separable and impassive and unmixed, being in its nature an activity.",
              },
              {
                q: "What do scholars disagree about, according to the summary?",
                options: [
                  "Whether Aristotle wrote the chapter",
                  "Whether this mind is part of each human soul or is God",
                  "Whether light is a body",
                ],
                answer: 1,
                why: "The summary notes the long dispute, from Alexander of Aphrodisias on, over whether the making mind is in each soul or is God.",
              },
            ],
            journal: "What in your life works like light, making things you already had become visible to you?",
          },
          {
            id: "desire-moves-the-animal",
            title: "What moves an animal is desire",
            bekker: "432a15-433b30",
            minutes: 5,
            summary:
              "What makes an animal move from place to place? Not the nutritive power, since plants do not move, nor perception alone, nor mind alone, since people often know what to do and do not do it. Aristotle names two movers, desire and practical thought, if imagination counts as a kind of thinking. Practical thought works out means to an end, and its starting point is the object of desire. So in the end there is one moving cause: the object of desire, which moves without being moved by being thought of or imagined. Mind is always right, but desire and imagination can be right or wrong, which is why the object of desire may be the good or only the apparent good. Conflicts arise when reason looks to the future and appetite to the present.",
            passage: {
              text: "For it is the object of appetency which causes motion; and the reason why thought causes motion is that the object of appetency is the starting point of thought. Again, when imagination moves to action, it does not move to action apart from appetency. Thus there is one single moving cause, the appetitive faculty.",
              ref: "III.10, 433a17-21",
            },
            terms: [
              { greek: "ὄρεξις", translit: "orexis", english: "desire, appetency", gloss: "Any reaching out for something: wish, spirit or appetite." },
              { greek: "ὀρεκτόν", translit: "orekton", english: "object of desire", gloss: "What is desired; it moves the animal without itself moving." },
            ],
            checks: [
              {
                q: "Why, according to the passage, does thought cause motion?",
                options: [
                  "Because the object of desire is the starting point of thought",
                  "Because thought is a kind of fire",
                  "Because thought is always correct",
                ],
                answer: 0,
                why: "The passage says thought causes motion because the object of appetency is its starting point.",
              },
              {
                q: "What does Aristotle conclude is the single moving cause?",
                options: ["The nutritive power", "The appetitive faculty", "Perception", "The heart"],
                answer: 1,
                why: "The passage ends: there is one single moving cause, the appetitive faculty.",
              },
              {
                q: "Why do reason and appetite sometimes conflict, according to the summary?",
                options: [
                  "Reason looks to the future, appetite to the present",
                  "Reason is in the head, appetite in the feet",
                  "Appetite is always right and reason wrong",
                ],
                answer: 0,
                why: "He says intelligence bids us resist because of the future, while appetite regards only the immediate present.",
              },
            ],
            journal: "Think of something you know you should do but have not done: what do you actually desire instead?",
          },
        ],
      },
    ],
  },
  {
    id: "parva-naturalia",
    title: "Parva Naturalia",
    greek: "Μικρὰ φυσικά",
    latin: "Parva Naturalia",
    subject: "soul",
    level: "Intermediate",
    bekker: "436a-480b",
    about:
      "A set of short treatises on what soul and body do together: perceiving, remembering, sleeping, dreaming, growing old, breathing and dying. Aristotle applies the account of the soul from On the Soul to everyday experience, often with sharp observations about dreams and memory that still hold.",
    before: ["on-the-soul"],
    caveat:
      "Parva Naturalia (\"short natural treatises\") is a medieval Latin name for a group of separate works, not a title Aristotle gave. The Oxford translation divides them between two translators: J. I. Beare (sense to divination) and G. R. T. Ross (length of life to breathing).",
    translation: {
      translator: "J. I. Beare and G. R. T. Ross",
      year: 1908,
      title: "Parva Naturalia (The Works of Aristotle, Oxford)",
      url: "https://classics.mit.edu/Browse/browse-Aristotle.html",
    },
    units: [
      {
        id: "sense-and-sensibilia",
        title: "On Sense and the Sensible",
        bekker: "436a1-449a31",
        line: "Why animals have the senses they have, and what colour, sound, smell and flavour are.",
        lessons: [
          {
            id: "what-the-senses-are-for",
            title: "What the senses are for",
            bekker: "436a1-437a17",
            minutes: 5,
            summary:
              "Aristotle opens the series by naming its topics: the states that belong to soul and body together, such as perception, memory, passion and desire, and the pairs waking and sleeping, youth and old age, breathing in and out, life and death. All of these involve perception, which arises in the soul through the body. Touch and taste belong to every animal, taste because it tells pleasant food from harmful. The senses that work through a medium, smell, hearing and sight, belong to animals that move about; they help them find food and avoid danger. In animals with intelligence they serve a higher end too, bringing news of many differences from which knowledge grows. Sight is best for the needs of life, but hearing contributes more to understanding, because speech is heard.",
            passage: {
              text: "The senses which operate through external media, viz. smelling, hearing, seeing, are found in all animals which possess the faculty of locomotion. To all that possess them they are a means of preservation; their final cause being that such creatures may, guided by antecedent perception, both pursue their food, and shun things that are bad or destructive. But in animals which have also intelligence they serve for the attainment of a higher perfection.",
              ref: "1, 436b",
            },
            terms: [
              { greek: "μεταξύ", translit: "metaxy", english: "medium", gloss: "What lies between sense and object, like air or water." },
              { greek: "σωτηρία", translit: "sōtēria", english: "preservation", gloss: "Keeping the animal alive; the first purpose of the senses." },
            ],
            checks: [
              {
                q: "Which animals have the senses that work through a medium?",
                options: ["All animals", "Animals that move from place to place", "Only humans", "Only plants"],
                answer: 1,
                why: "The passage says smell, hearing and sight are found in all animals which possess the faculty of locomotion.",
              },
              {
                q: "What extra purpose do these senses serve in animals with intelligence?",
                options: [
                  "A higher perfection, feeding knowledge",
                  "Better digestion",
                  "Faster movement",
                ],
                answer: 0,
                why: "The passage says they serve for the attainment of a higher perfection, and the summary explains this is knowledge.",
              },
              {
                q: "Why does hearing contribute most to understanding?",
                options: ["Because ears are larger than eyes", "Because speech is heard", "Because sound travels farther"],
                answer: 1,
                why: "The summary reports that sight serves life's needs best, but hearing contributes more to intelligence because speech is heard.",
              },
            ],
            journal: "Which of your senses has taught you the most, and which only keeps you safe?",
          },
        ],
      },
      {
        id: "memory-and-recollection",
        title: "On Memory and Recollection",
        bekker: "449b4-453b11",
        line: "What memory is, why it needs time and a body, and how we search for what we have forgotten.",
        lessons: [
          {
            id: "memory-is-of-the-past",
            title: "Memory is of the past",
            bekker: "449b4-451a17",
            minutes: 6,
            summary:
              "Aristotle begins by separating memory from its neighbours. We do not remember the future, which is for expectation, nor the present, which is for perception. Memory is of the past, so it is neither perception nor thought but a state of one of these after time has passed. Only animals that perceive time remember, and memory belongs to the same part of the soul as imagination. Perception leaves an impression in the soul and body like the stamp of a seal; that is why the very young and the very old, whose bodies are in flux or worn, remember poorly. How can we remember an absent thing by looking at a present impression? Like a picture on a panel, the impression can be seen as itself or as a likeness of something else.",
            passage: {
              text: "Memory is, therefore, neither Perception nor Conception, but a state or affection of one of these, conditioned by lapse of time. As already observed, there is no such thing as memory of the present while present, for the present is object only of perception, and the future, of expectation, but the object of memory is the past. All memory, therefore, implies a time elapsed;",
              ref: "1, 449b",
            },
            terms: [
              { greek: "μνήμη", translit: "mnēmē", english: "memory", gloss: "Having a past perception or thought, as past." },
              { greek: "φάντασμα", translit: "phantasma", english: "image, impression", gloss: "What perception leaves behind; memory looks at it as a likeness." },
            ],
            checks: [
              {
                q: "What is the object of memory, according to the passage?",
                options: ["The present", "The future", "The past", "Universal truths"],
                answer: 2,
                why: "The passage says the present is for perception, the future for expectation, but the object of memory is the past.",
              },
              {
                q: "What does the picture on a panel explain?",
                options: [
                  "How a present impression can be of something absent",
                  "Why painters have good memories",
                  "Why memory is a kind of perception",
                ],
                answer: 0,
                why: "The summary explains that, like a picture, the impression can be viewed as itself or as a likeness of something else.",
              },
            ],
            journal: "Which memory of yours feels most like a picture, and what is it a likeness of?",
          },
          {
            id: "how-recollection-works",
            title: "How we search for what we forgot",
            bekker: "451a18-453b11",
            minutes: 6,
            summary:
              "Recollection is not the same as memory. It is the active search for something we once knew or perceived. Aristotle explains it by habit: one movement in us tends to follow another because they have followed each other before. So when we recollect, we run through earlier movements until we hit the one that is usually followed by what we want. We start from something present, or from something similar, opposite, or next to what we seek. It works best when we start from the beginning of a series. Only humans recollect, he says, because it is a kind of reasoning, a deliberate search. He adds that recollection is bodily: once set going it can run on against our will, as when a tune or a word keeps coming back.",
            passage: {
              text: "Whenever therefore, we are recollecting, we are experiencing certain of the antecedent movements until finally we experience the one after which customarily comes that which we seek. This explains why we hunt up the series (of kineseis) having started in thought either from a present intuition or some other, and from something either similar, or contrary, to what we seek, or else from that which is contiguous with it.",
              ref: "2, 451b",
            },
            terms: [
              { greek: "ἀνάμνησις", translit: "anamnēsis", english: "recollection", gloss: "The active search that recovers something once known." },
              { greek: "ἔθος", translit: "ethos", english: "habit, custom", gloss: "The settled order in which our inner movements follow each other." },
            ],
            checks: [
              {
                q: "From which kinds of starting point does the passage say we hunt up the series?",
                options: [
                  "Something similar, contrary, or contiguous to what we seek",
                  "Only something we see right now",
                  "A random number",
                ],
                answer: 0,
                why: "The passage lists starting from something similar, or contrary, or contiguous with what we seek.",
              },
              {
                q: "Why does Aristotle think only humans recollect?",
                options: [
                  "Because recollection is a kind of reasoning",
                  "Because only humans have memory",
                  "Because animals do not sleep",
                ],
                answer: 0,
                why: "The summary reports his view that recollection is a deliberate search, a kind of reasoning, which only humans have.",
              },
            ],
            journal: "When you last lost a name or a thought, what did you start from to find it again?",
          },
        ],
      },
      {
        id: "sleep-and-waking",
        title: "On Sleep and Waking",
        bekker: "453b11-458a32",
        line: "What sleep is, which animals sleep, and why sleep exists at all.",
        lessons: [
          {
            id: "sleep-is-for-rest",
            title: "Sleep is for the sake of waking",
            bekker: "453b11-458a32",
            minutes: 5,
            summary:
              "Sleep and waking belong to the same part of the soul, the one that perceives, since sleep is a kind of tying up of perception and waking its release. All the senses go idle together because the master sense, the one to which all the others report, is affected. As to why we sleep, Aristotle argues from purpose. Nature acts for an end, and any creature that moves but cannot move continuously with pleasure needs rest. Sleep is that rest, and its end is the preservation of the animal. But waking is the higher end, because perceiving and thinking are best. As to how sleep comes about, he gives a physical account: vapours from digested food rise to the head, cool, and sink back, and we wake when digestion is done.",
            passage: {
              text: "in the first place, then, as we assert that Nature operates for the sake of an end, and that this end is a good; and that to every creature which is endowed by nature with the power to move, but cannot with pleasure to itself move always and continuously, rest is necessary and beneficial; and since, taught by experience, men apply to sleep this metaphorical term, calling it a 'rest' [from the strain of movement implied in sense-perception]: we conclude that its end is the conservation of animals.",
              ref: "2, 455b",
            },
            terms: [
              { greek: "ὕπνος", translit: "hypnos", english: "sleep", gloss: "A binding of the perceiving power, for the sake of rest." },
              { greek: "ἐγρήγορσις", translit: "egrēgorsis", english: "waking", gloss: "The release of perception; for Aristotle the higher state." },
            ],
            checks: [
              {
                q: "What does the passage conclude is the end of sleep?",
                options: ["Dreaming", "The conservation of animals", "Digestion", "Forgetting"],
                answer: 1,
                why: "The passage concludes that the end of sleep is the conservation of animals.",
              },
              {
                q: "Why do all the senses sleep at once?",
                options: [
                  "Because the master sense to which they all report is affected",
                  "Because each sense tires at the same rate",
                  "Because darkness falls on all of them",
                ],
                answer: 0,
                why: "The summary explains that when the controlling sense organ is affected, all its tributaries are affected too.",
              },
            ],
            journal: "Is rest, for you, mainly for the sake of being awake, or do you treat waking as for the sake of rest?",
          },
        ],
      },
      {
        id: "on-dreams",
        title: "On Dreams",
        bekker: "458a33-462b11",
        line: "Dreams are traced to the after-effects of perception, which in sleep go unchecked.",
        lessons: [
          {
            id: "what-a-dream-is",
            title: "What a dream is",
            bekker: "458a33-462b11",
            minutes: 6,
            summary:
              "Aristotle asks which power of the soul dreams, and answers that it is the power of imagination working in sleep. The key fact is that the effects of perception stay in the sense organs after the object has gone, as the eye keeps an afterimage when we look away from the sun. Even awake, we are easily fooled when moved by emotion: the coward sees enemies, the lover his beloved, and a feverish patient sees animals in the patterns on the wall. In sleep, when judgment is idle and the blood is calmer, these lingering movements reach the centre and appear as things. So a dream is an appearance arising from sense impressions that occurs in sleep. True thoughts we have while asleep are not dreams.",
            passage: {
              text: "we are easily deceived respecting the operations of sense-perception when we are excited by emotions, and different persons according to their different emotions; for example, the coward when excited by fear, the amorous person by amorous desire; so that, with but little resemblance to go upon, the former thinks he sees his foes approaching, the latter, that he sees the object of his desire;",
              ref: "2, 460b",
            },
            terms: [
              { greek: "ἐνύπνιον", translit: "enypnion", english: "dream", gloss: "An appearance from sense impressions that comes in sleep." },
              { greek: "φάντασμα", translit: "phantasma", english: "appearance, image", gloss: "What remains of a perception and can appear again." },
            ],
            checks: [
              {
                q: "What does the coward think he sees, in the passage?",
                options: ["The object of his desire", "His foes approaching", "Animals on the wall", "The sun"],
                answer: 1,
                why: "The passage says the coward, excited by fear, thinks he sees his foes approaching.",
              },
              {
                q: "What makes such deceptions easier, according to the passage?",
                options: ["Being excited by emotions", "Having good eyesight", "Being in daylight"],
                answer: 0,
                why: "The passage says we are easily deceived when excited by emotions, and with little resemblance to go on.",
              },
              {
                q: "Which power of the soul dreams, on Aristotle's account?",
                options: ["The nutritive power", "Imagination working in sleep", "Thought"],
                answer: 1,
                why: "The summary reports his answer that dreaming belongs to the imagining power, active during sleep.",
              },
            ],
            journal: "What has a strong feeling of yours made you see that turned out not to be there?",
          },
        ],
      },
      {
        id: "divination-in-sleep",
        title: "On Divination in Sleep",
        bekker: "462b12-464b18",
        line: "Whether dreams can foretell the future, and why most apparent prophecies are coincidence.",
        lessons: [
          {
            id: "do-dreams-foretell",
            title: "Do dreams foretell the future?",
            bekker: "462b12-464b18",
            minutes: 5,
            summary:
              "Aristotle neither dismisses prophetic dreams nor trusts them. Many people believe in them, which counts for something, but there is no clear cause, and it is absurd that a god would send them to ordinary people rather than the best and wisest. He sorts possible links: a dream may be a cause of an event, a sign of it, or a coincidence. Some dreams are signs of bodily states, since small movements in the body that go unnoticed by day are magnified in sleep, which is why physicians pay attention to dreams. Some dreams may cause actions, because what we picture at night can start us acting by day. But most dreams that seem to come true are coincidences, and he notes that it is often the talkative and excitable who report them.",
            passage: {
              text: "Yet the fact of our seeing no probable cause to account for such divination tends to inspire us with distrust. For, in addition to its further unreasonableness, it is absurd to combine the idea that the sender of such dreams should be God with the fact that those to whom he sends them are not the best and wisest, but merely commonplace persons.",
              ref: "1, 462b",
            },
            terms: [
              { greek: "μαντική", translit: "mantikē", english: "divination", gloss: "The art of foretelling, here by dreams." },
              { greek: "σημεῖον", translit: "sēmeion", english: "sign, token", gloss: "Something that indicates another thing without causing it." },
            ],
            checks: [
              {
                q: "Why does Aristotle find it absurd that God sends prophetic dreams?",
                options: [
                  "Because they come to commonplace persons, not the best and wisest",
                  "Because dreams happen only at night",
                  "Because God does not exist",
                ],
                answer: 0,
                why: "The passage says it is absurd that those to whom he sends them are not the best and wisest, but commonplace persons.",
              },
              {
                q: "Why do physicians pay attention to dreams, according to the summary?",
                options: [
                  "Small bodily movements are magnified in sleep",
                  "Dreams reveal the will of the gods",
                  "Dreams cure illness",
                ],
                answer: 0,
                why: "Movements too slight to notice by day seem large in sleep, so dreams can be signs of bodily states.",
              },
            ],
            journal: "When something you expected came true, how could you tell whether it was a sign, a cause, or a coincidence?",
          },
        ],
      },
      {
        id: "length-and-shortness-of-life",
        title: "On Length and Shortness of Life",
        bekker: "464b19-467b9",
        line: "Why some living things live long and others briefly.",
        lessons: [
          {
            id: "why-some-live-longer",
            title: "Why some things live longer",
            bekker: "464b19-467b9",
            minutes: 5,
            summary:
              "Aristotle asks why some animals and plants live long and others briefly, and whether long life and health go together. Everything perishable is destroyed by its contrary, so the question is what keeps a living body from drying out and cooling. A living animal is warm and moist; old age and the corpse are cold and dry. Long life therefore needs moisture that is plentiful and warm enough not to dry up or freeze quickly, which is why large animals and plants tend to live longer, and why fat resists decay. Humans outlive some larger animals because the quality of their moisture makes up for its quantity. He adds that animals of warm climates live longer, and that plants outlive animals because they keep renewing themselves.",
            passage: {
              text: "The following considerations may enable us to understand the reasons for all these facts. We must remember that an animal is by nature humid and warm, and to live is to be of such a constitution, while old age is dry and cold, and so is a corpse. This is plain to observation.",
              ref: "5, 466a17-21",
            },
            terms: [
              { greek: "μακροβιότης", translit: "makrobiotēs", english: "longevity", gloss: "Length of life, as a feature of a kind or an individual." },
              { greek: "ὑγρόν", translit: "hygron", english: "the moist", gloss: "One of the four basic qualities, with hot, cold and dry." },
            ],
            checks: [
              {
                q: "What does the passage say about old age?",
                options: ["It is warm and moist", "It is dry and cold, like a corpse", "It is the same as youth"],
                answer: 1,
                why: "The passage says the animal is humid and warm, while old age is dry and cold, and so is a corpse.",
              },
              {
                q: "Why do large animals tend to live longer, according to the summary?",
                options: [
                  "They contain more moisture, which dries up less easily",
                  "They eat less",
                  "They sleep more",
                ],
                answer: 0,
                why: "A small quantity of moisture is easily dried up, so larger bodies with more of it last longer.",
              },
            ],
            journal: "What in your own habits do you think keeps you, in Aristotle's terms, warm and moist rather than cold and dry?",
          },
        ],
      },
      {
        id: "youth-old-age-life-death-breathing",
        title: "On Youth and Old Age, Life and Death, and Breathing",
        bekker: "467b10-480b30",
        line: "Life depends on a natural heat centred in the heart, and breathing exists to cool it.",
        lessons: [
          {
            id: "the-heart-is-the-centre",
            title: "The heart is the centre of life",
            bekker: "467b10-469b20",
            minutes: 5,
            summary:
              "Aristotle argues that the soul, though not a body, must have its main seat in one part of the body: the middle part between where food comes in and where waste goes out. In blooded animals this is the heart; in bloodless ones, what corresponds to it. The heart forms first in the embryo, the blood vessels start from it, and it does the last work on food, turning it into blood. So both the nutritive and the perceiving soul must have their source there. Touch and taste plainly run to the heart, and so the common sense must be there too. He knows some think the brain is the seat of perception, and says they are misled because some sense organs are in the head. Modern physiology sides with the brain.",
            passage: {
              text: "But it is the heart that has supreme control, exercising an additional and completing function. Hence in sanguineous animals the source both of the sensitive and of the nutritive soul must be in the heart, for the functions relative to nutrition exercised by the other parts are ancillary to the activity of the heart.",
              ref: "3, 469a",
            },
            terms: [
              { greek: "καρδία", translit: "kardia", english: "heart", gloss: "For Aristotle the ruling organ of nutrition, perception and heat." },
              { greek: "αἰσθητήριον κοινόν", translit: "aisthētērion koinon", english: "common sensorium", gloss: "The central organ where all the senses come together." },
            ],
            checks: [
              {
                q: "Where does the passage place the source of the sensitive and nutritive soul?",
                options: ["In the brain", "In the heart", "In the liver", "In the lungs"],
                answer: 1,
                why: "The passage says the source of both the sensitive and the nutritive soul must be in the heart.",
              },
              {
                q: "Why do some people place perception in the brain, according to the summary?",
                options: [
                  "Because some sense organs are in the head",
                  "Because the brain is warm",
                  "Because the brain forms first",
                ],
                answer: 0,
                why: "He says they are misled because some sense organs are situated in the head.",
              },
            ],
            journal: "When you say a feeling comes from the heart, what do you mean, and how close is it to Aristotle's view?",
          },
          {
            id: "life-is-heat-breathing-cools",
            title: "Life is heat, and breathing cools it",
            bekker: "469b21-480b30",
            minutes: 6,
            summary:
              "Life, Aristotle holds, goes with the keeping of a natural heat, and death is its destruction. Like a fire, it can end in two ways: by burning itself out, which is old age, or by being put out, which is violence. A fire needs cooling to last, and so does the heat of life. Water animals are cooled by water through gills; land animals with lungs breathe air. He criticises earlier thinkers, such as Democritus and Plato, for missing the purpose of breathing. Death always comes from some failure of heat in the organ that holds the source of life, the heart in blooded animals. In old age the lung hardens and the heat is a small, weak flame, so death comes gently. Breathing does not in fact serve chiefly to cool, but to bring in oxygen.",
            passage: {
              text: "It is always to some lack of heat that death is due, and in perfect creatures the cause is its failure in the organ containing the source of the creature's essential nature. This member is situate, as has been said, at the junction of the upper and lower parts; in plants it is intermediate between the root and the stem, in sanguineous animals it is the heart, and in those that are bloodless the corresponding part of their body.",
              ref: "On Breathing 17, 478b-479a",
            },
            terms: [
              { greek: "θερμότης φυσική", translit: "thermotēs physikē", english: "natural heat", gloss: "The inner warmth on which life depends, centred in the heart." },
              { greek: "ἀναπνοή", translit: "anapnoē", english: "breathing", gloss: "For Aristotle a means of cooling the heart." },
            ],
            checks: [
              {
                q: "To what does the passage say death is always due?",
                options: ["Some lack of heat", "Too much moisture", "The departure of air atoms", "Fate"],
                answer: 0,
                why: "The passage opens: it is always to some lack of heat that death is due.",
              },
              {
                q: "What is the purpose of breathing, on Aristotle's view?",
                options: ["To make sounds", "To cool the natural heat", "To bring in nutriment"],
                answer: 1,
                why: "The summary reports his view that breathing, like gills in water animals, provides cooling for the heat of life.",
              },
            ],
            journal: "What keeps your own fire burning without letting it burn out?",
          },
        ],
      },
    ],
  },
  {
    id: "history-of-animals",
    title: "History of Animals",
    greek: "Τῶν περὶ τὰ ζῷα ἱστοριῶν",
    latin: "Historia Animalium",
    subject: "life",
    level: "Start here",
    bekker: "486a-638b",
    about:
      "Aristotle's great collection of facts about animals: their parts, their ways of life, their breeding, their characters. It is an inquiry (historia) that gathers what is so before asking why, and it records hundreds of species, many observed with an accuracy not matched for two thousand years.",
    before: [],
    caveat:
      "Book X is doubted by most scholars and is not in D'Arcy Thompson's translation, so this course covers Books I to IX. Some also question parts of Books VII and IX. The work mixes Aristotle's own observations with reports from fishermen, hunters and earlier writers, some of them wrong.",
    translation: {
      translator: "D'Arcy Wentworth Thompson",
      year: 1910,
      title: "Historia Animalium (The Works of Aristotle, Oxford, vol. IV)",
      url: "https://classics.mit.edu/Aristotle/history_anim.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: Parts and differences",
        bekker: "486a-497b",
        line: "Book I sets up the terms of comparison, then begins the survey with the human body.",
        lessons: [
          {
            id: "uniform-and-non-uniform-parts",
            title: "Parts that divide into like parts, and parts that do not",
            bekker: "486a5-487a10",
            minutes: 5,
            summary:
              "Aristotle opens with a distinction that shapes all his biology. Some parts of animals are uniform: divide flesh and you get flesh. Others are non-uniform: divide a hand and you do not get hands. The non-uniform parts, like the head or the arm, are made of uniform ones, like flesh, sinew and bone. Animals of one species have the same parts; animals of one genus, like different birds, have the same parts differing by more and less, longer or shorter beaks, more or fewer feathers. Animals of different genera have parts that correspond only by analogy, as feathers in a bird answer to scales in a fish. This gives him three degrees of likeness to compare animals by.",
            passage: {
              text: "Of the parts of animals some are simple: to wit, all such as divide into parts uniform with themselves, as flesh into flesh; others are composite, such as divide into parts not uniform with themselves, as, for instance, the hand does not divide into hands nor the face into faces.",
              ref: "I.1, 486a5-8",
            },
            terms: [
              { greek: "ὁμοιομερής", translit: "homoiomerēs", english: "uniform", gloss: "Made of parts like the whole, such as flesh, bone or blood." },
              { greek: "ἀνομοιομερής", translit: "anomoiomerēs", english: "non-uniform", gloss: "Made of unlike parts, such as a hand or a face." },
              { greek: "ἀναλογία", translit: "analogia", english: "analogy", gloss: "Likeness of role across genera, as scale is to fish so feather to bird." },
            ],
            checks: [
              {
                q: "Which of these is a uniform part, in the passage's sense?",
                options: ["Flesh", "Hand", "Face", "Head"],
                answer: 0,
                why: "The passage says simple parts divide into parts uniform with themselves, as flesh into flesh.",
              },
              {
                q: "How do the parts of birds of different kinds differ, according to the summary?",
                options: ["Only by analogy", "By more and less", "Not at all"],
                answer: 1,
                why: "Animals of one genus have the same parts differing by excess and defect, such as longer or shorter beaks.",
              },
            ],
            journal: "What in your life is uniform, the same however you divide it, and what is made of unlike parts?",
          },
          {
            id: "begin-with-the-human-body",
            title: "Begin with the animal we know best",
            bekker: "491a19-497b3",
            minutes: 5,
            summary:
              "Before surveying animals Aristotle explains his starting point. Animals differ in their ways of life, their actions, their characters and their parts: some live in water and some on land, some are solitary and some social, some tame and some wild. He then starts with the human body, not because humans are the standard of all animals, but because they are the animal we know best. As every people reckons in the money it is used to, we compare animals by the one most familiar to us. He then describes the human body from head to foot, and notes that some features, like an upright posture and a large brain for its size, set humans apart.",
            passage: {
              text: "To begin with, we must take into consideration the parts of Man. For, just as each nation is wont to reckon by that monetary standard with which it is most familiar, so must we do in other matters. And, of course, man is the animal with which we are all of us the most familiar.",
              ref: "I.6, 491a19-23",
            },
            terms: [
              { greek: "βίος", translit: "bios", english: "way of life", gloss: "How an animal lives: where, on what, alone or in groups." },
              { greek: "γνώριμος", translit: "gnōrimos", english: "familiar, known", gloss: "Better known to us, the right place for inquiry to start." },
            ],
            checks: [
              {
                q: "Why does Aristotle start with the parts of man?",
                options: [
                  "Man is the animal we are most familiar with",
                  "Man is the largest animal",
                  "Man has the simplest body",
                ],
                answer: 0,
                why: "The passage says man is the animal with which we are all most familiar, as each nation reckons by its own money.",
              },
              {
                q: "What does the comparison with money illustrate?",
                options: [
                  "Measuring by the standard one knows best",
                  "That animals can be bought",
                  "That humans are worth more than animals",
                ],
                answer: 0,
                why: "Each nation reckons by the monetary standard most familiar to it, and so we start from the animal most familiar to us.",
              },
            ],
            journal: "What do you use as your familiar standard when you try to understand something strange?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Comparing blooded animals",
        bekker: "497b-509a",
        line: "Book II compares the outer and inner parts of the blooded animals, from quadrupeds to fish and birds.",
        lessons: [
          {
            id: "forelegs-and-hands",
            title: "Forelegs that work like hands",
            bekker: "497b4-499b5",
            minutes: 4,
            summary:
              "Book II compares the parts of blooded animals. Most four-footed animals that bear live young have a head and neck, but the details differ: the lion, he reports, has a neck of a single bone, though inside it resembles the dog. Where humans have arms, quadrupeds have forelegs, and those with toes use them much as hands. He goes on to compare teeth, tongues, stomachs and other parts across kinds, and to note odd cases like the elephant's trunk and the seal's half-formed limbs. The method is the one set out in Book I: find which parts are the same, which differ by more and less, and which correspond only by analogy. Some reports, like the lion's neck bone, are wrong.",
            passage: {
              text: "The quadrupedal vivipara instead of arms have forelegs. This is true of all quadrupeds, but such of them as have toes have, practically speaking, organs analogous to hands; at all events, they use these fore-limbs for many purposes as hands.",
              ref: "II.1, 497b",
            },
            terms: [
              { greek: "ζῳοτόκος", translit: "zōiotokos", english: "viviparous", gloss: "Bearing live young rather than laying eggs." },
              { greek: "τετράπους", translit: "tetrapous", english: "quadruped", gloss: "Four-footed animal." },
            ],
            checks: [
              {
                q: "What do viviparous quadrupeds have instead of arms?",
                options: ["Wings", "Forelegs", "Fins", "Trunks"],
                answer: 1,
                why: "The passage says the quadrupedal vivipara instead of arms have forelegs.",
              },
              {
                q: "Which quadrupeds have organs analogous to hands?",
                options: ["Those with toes", "Those with hooves", "Those that swim"],
                answer: 0,
                why: "The passage says those that have toes have organs analogous to hands and use them as hands.",
              },
            ],
            journal: "What tool or part of you do you use for a purpose it was not first made for?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: Blood, vessels and the uniform parts",
        bekker: "509a-523a",
        line: "Book III treats the generative organs, the blood vessels, and uniform parts such as bone, fat and milk.",
        lessons: [
          {
            id: "why-the-veins-were-hard-to-see",
            title: "Why the veins were hard to see",
            bekker: "511b10-515a26",
            minutes: 5,
            summary:
              "The most widespread uniform part in blooded animals is blood, and its container is the vessel. Aristotle says earlier writers described the vessels badly, and explains why. In a dead animal the main vessels collapse as the blood runs out, so they cannot be traced. In a living animal they are hidden inside. Some earlier writers dissected corpses and missed the main roots; others inferred them from the visible veins of very thin living men. He quotes three of them, Syennesis of Cyprus, Diogenes of Apollonia and Polybus, and then gives his own account, in which the vessels begin from the heart. His account, gained by strangling animals before dissection, is far closer to the truth than theirs, though he does not know the blood circulates.",
            passage: {
              text: "And the cause of the ignorance thus manifested is the extreme difficulty experienced in the way of observation. For in the dead bodies of animals the nature of the chief veins is undiscoverable, owing to the fact that they collapse at once when the blood leaves them; for the blood pours out of them in a stream, like liquid out of a vessel,",
              ref: "III.2, 511b",
            },
            terms: [
              { greek: "φλέψ", translit: "phleps", english: "blood vessel", gloss: "Any vessel carrying blood; Aristotle does not yet separate veins and arteries clearly." },
              { greek: "αἷμα", translit: "haima", english: "blood", gloss: "The most widespread uniform part of blooded animals." },
            ],
            checks: [
              {
                q: "Why can the chief veins not be traced in dead bodies?",
                options: [
                  "They collapse when the blood leaves them",
                  "They turn to bone",
                  "They are too small to see",
                ],
                answer: 0,
                why: "The passage says the chief veins collapse at once when the blood leaves them.",
              },
              {
                q: "Where does Aristotle say the blood vessels begin?",
                options: ["In the head", "In the heart", "In the liver"],
                answer: 1,
                why: "The summary reports that his own account traces the vessels from the heart.",
              },
            ],
            journal: "What have you tried to understand only after it was over, when it could no longer show you how it worked?",
          },
        ],
      },
      {
        id: "book-4",
        title: "Book IV: Bloodless animals, senses and sound",
        bekker: "523a-538b",
        line: "Book IV turns to the bloodless animals, then to senses, voice, sleep and differences of sex.",
        lessons: [
          {
            id: "kinds-of-bloodless-animals",
            title: "Four kinds of bloodless animals",
            bekker: "523a31-525a30",
            minutes: 4,
            summary:
              "Having finished the blooded animals, Aristotle divides the bloodless ones into four great kinds. Molluscs, like the cuttlefish and octopus, have their soft flesh outside and any hard part inside. Crustaceans, like crabs and crayfish, have a hard outer shell that is crushed rather than shattered. Testaceans, like snails and oysters, have a hard outer shell that shatters. Insects, the fourth kind, have bodies notched into segments. This division into blooded and bloodless animals roughly matches the modern one between vertebrates and invertebrates. The book goes on to their parts, then to the senses, voice and sleep in all animals, with careful observations such as the octopus's arms and the cuttlefish's ink.",
            passage: {
              text: "One genus consists of so-called 'molluscs'; and by the term 'mollusc' we mean an animal that, being devoid of blood, has its flesh-like substance outside, and any hard structure it may happen to have, inside-in this respect resembling the red-blooded animals, such as the genus of the cuttle-fish.",
              ref: "IV.1, 523b",
            },
            terms: [
              { greek: "ἄναιμα", translit: "anaima", english: "bloodless animals", gloss: "Animals without red blood; roughly our invertebrates." },
              { greek: "μαλάκια", translit: "malakia", english: "molluscs", gloss: "Soft-bodied animals like the octopus and cuttlefish." },
            ],
            checks: [
              {
                q: "How does the passage define a mollusc?",
                options: [
                  "A bloodless animal with flesh outside and any hard part inside",
                  "A blooded animal with a shell",
                  "An insect that lives in water",
                ],
                answer: 0,
                why: "The passage defines a mollusc as devoid of blood, with its flesh-like substance outside and any hard structure inside.",
              },
              {
                q: "Which modern division does blooded and bloodless roughly match?",
                options: ["Plants and animals", "Vertebrates and invertebrates", "Mammals and birds"],
                answer: 1,
                why: "The summary notes that the blooded and bloodless kinds roughly match vertebrates and invertebrates.",
              },
            ],
            journal: "Is your own hard structure on the outside or on the inside?",
          },
        ],
      },
      {
        id: "book-5",
        title: "Book V: How animals come to be, I",
        bekker: "538b-556b",
        line: "Book V begins the account of breeding, from the simplest animals upward.",
        lessons: [
          {
            id: "spontaneous-generation",
            title: "Animals that seem to arise on their own",
            bekker: "538b25-539b14",
            minutes: 5,
            summary:
              "Book V begins the study of how animals breed. Aristotle reverses his earlier order: having started the account of parts with man, he will treat man last here, and start with the testaceans. He notes something animals share with plants. Some plants grow from seed, others seem to arise on their own from some seed-like principle. So too some animals are born of parents of their kind, while others arise spontaneously, from rotting earth or plants, as some insects do, or inside animals from their secretions. He believed, for example, that some shellfish and eels arise from mud. Spontaneous generation was accepted for two thousand years, until experiments by Redi and Pasteur showed that life comes from life.",
            passage: {
              text: "So with animals, some spring from parent animals according to their kind, whilst others grow spontaneously and not from kindred stock; and of these instances of spontaneous generation some come from putrefying earth or vegetable matter, as is the case with a number of insects, while others are spontaneously generated in the inside of animals out of the secretions of their several organs.",
              ref: "V.1, 539a",
            },
            terms: [
              { greek: "αὐτόματος", translit: "automatos", english: "spontaneous", gloss: "Happening of itself, without a parent of the same kind." },
              { greek: "γένεσις", translit: "genesis", english: "coming to be", gloss: "How an animal comes into being: from parents or otherwise." },
            ],
            checks: [
              {
                q: "From what does the passage say some insects arise spontaneously?",
                options: [
                  "From putrefying earth or vegetable matter",
                  "From the eggs of birds",
                  "From the sun's rays",
                ],
                answer: 0,
                why: "The passage says some instances of spontaneous generation come from putrefying earth or vegetable matter, as with a number of insects.",
              },
              {
                q: "Where does Aristotle place man in the order of Book V?",
                options: ["First", "Last", "In the middle, with birds"],
                answer: 1,
                why: "The summary reports that here, unlike in the account of parts, man is treated last of all.",
              },
            ],
            journal: "What belief of yours might, like spontaneous generation, be a reasonable reading of what you see and still be wrong?",
          },
        ],
      },
      {
        id: "book-6",
        title: "Book VI: How animals come to be, II",
        bekker: "558b-581a",
        line: "Book VI follows breeding in birds, fish and quadrupeds, including the development of the chick.",
        lessons: [
          {
            id: "the-heart-in-the-egg",
            title: "Watching the chick form in the egg",
            bekker: "561a3-562b2",
            minutes: 5,
            summary:
              "Book VI turns to birds, fish and four-footed animals. Its most famous pages describe the chick developing in the hen's egg, day by day. After three days and nights the first sign of the embryo appears, and the heart shows as a speck of blood in the white, beating and moving as if alive. From it two blood vessels run out, and a membrane with bloody fibres wraps the yolk. Soon the body is marked off, small and white, with a large head and swollen eyes. By the tenth day the parts are clear, and around the twentieth the chick moves and chirps inside the shell. The account suggests opening eggs at intervals, and it stayed the best account of the subject until the seventeenth century.",
            passage: {
              text: "With the common hen after three days and three nights there is the first indication of the embryo; with larger birds the interval being longer, with smaller birds shorter. Meanwhile the yolk comes into being, rising towards the sharp end, where the primal element of the egg is situated, and where the egg gets hatched; and the heart appears, like a speck of blood, in the white of the egg. This point beats and moves as though endowed with life,",
              ref: "VI.3, 561a",
            },
            terms: [
              { greek: "ἔμβρυον", translit: "embryon", english: "embryo", gloss: "The young animal as it forms in the egg or womb." },
              { greek: "ᾠόν", translit: "ōion", english: "egg", gloss: "The body in which a bird or fish develops outside the mother." },
            ],
            checks: [
              {
                q: "When does the first sign of the embryo appear in the hen's egg?",
                options: ["After one day", "After three days and three nights", "After ten days", "After twenty days"],
                answer: 1,
                why: "The passage says the first indication appears after three days and three nights.",
              },
              {
                q: "How does the heart first appear, according to the passage?",
                options: ["Like a speck of blood in the white", "Like a small bone", "Like a feather"],
                answer: 0,
                why: "The passage says the heart appears like a speck of blood in the white and beats as though alive.",
              },
            ],
            journal: "What have you watched slowly take shape, day by day, and what did you notice first?",
          },
        ],
      },
      {
        id: "book-7",
        title: "Book VII: Human growth and birth",
        bekker: "581a-588a",
        line: "Book VII describes human puberty, conception, pregnancy, birth and infancy.",
        lessons: [
          {
            id: "signs-of-puberty",
            title: "The signs of puberty",
            bekker: "581a9-582a33",
            minutes: 5,
            summary:
              "Book VII follows a human life from the womb onward. Aristotle describes the changes at about fourteen: in boys the first seed, body hair, and the voice breaking, which people called the bleat of the billy goat; in girls the swelling of the breasts and the start of menstruation. He quotes Alcmaeon of Croton, who compared the first hair to a plant's blossoming before it seeds. He notes that singers who try to keep the voice from breaking can delay it, and that this is a time when young people need watching, since habits formed then last. The book goes on to conception, signs of pregnancy, the length of gestation, birth and the dangers of the first week of life.",
            passage: {
              text: "When twice seven years old, in the most of cases, the male begins to engender seed; and at the same time hair appears upon the pubes, in like manner, so Alcmaeon of Croton remarks, as plants first blossom and then seed. About the same time, the voice begins to alter, getting harsher and more uneven,",
              ref: "VII.1, 581a",
            },
            terms: [
              { greek: "ἥβη", translit: "hēbē", english: "puberty, youth", gloss: "The coming of sexual maturity, around fourteen." },
              { greek: "φωνή", translit: "phōnē", english: "voice", gloss: "Sound made by an animal with a windpipe; it breaks at puberty." },
            ],
            checks: [
              {
                q: "At what age does the passage say the male usually begins to produce seed?",
                options: ["Seven", "Twice seven", "Three times seven", "Twenty"],
                answer: 1,
                why: "The passage says when twice seven years old, in most cases, the male begins to engender seed.",
              },
              {
                q: "What comparison does Alcmaeon make?",
                options: [
                  "Hair appears as plants first blossom and then seed",
                  "The voice breaks like a reed",
                  "Growth is like a river",
                ],
                answer: 0,
                why: "The passage reports Alcmaeon's remark that hair appears as plants first blossom and then seed.",
              },
            ],
            journal: "Which change in your own growing up do you remember as a blossoming before anything came of it?",
          },
        ],
      },
      {
        id: "book-8",
        title: "Book VIII: Ways of life",
        bekker: "588a-608a",
        line: "Book VIII turns to the characters and ways of life of animals: what they eat, where they live, how they migrate.",
        lessons: [
          {
            id: "traces-of-character-in-animals",
            title: "Traces of character in animals",
            bekker: "588a16-588b3",
            minutes: 5,
            summary:
              "Having covered bodies and breeding, Aristotle turns to animals' habits and ways of life, which follow from their character and their food. Most animals show traces of the qualities we see more clearly in humans: gentleness or fierceness, courage or timidity, and something like sagacity. Some of these differ from the human only by more and less; others are analogous, as some animals have a natural power akin to human wisdom. Children show this best: in them we see the seeds of later character, yet for a time a child hardly differs from an animal in soul. So some qualities of humans and animals are the same, some alike, and some only analogous.",
            passage: {
              text: "In the great majority of animals there are traces of psychical qualities or attitudes, which qualities are more markedly differentiated in the case of human beings. For just as we pointed out resemblances in the physical organs, so in a number of animals we observe gentleness or fierceness, mildness or cross temper, courage, or timidity, fear or confidence, high spirit or low cunning, and, with regard to intelligence, something equivalent to sagacity.",
              ref: "VIII.1, 588a18-24",
            },
            terms: [
              { greek: "ἦθος", translit: "ēthos", english: "character", gloss: "Settled disposition, seen in animals as well as people." },
              { greek: "σύνεσις", translit: "synesis", english: "sagacity", gloss: "Quick understanding; animals have something equivalent to it." },
            ],
            checks: [
              {
                q: "Which qualities does the passage say we observe in many animals?",
                options: [
                  "Gentleness or fierceness, courage or timidity",
                  "Justice and piety",
                  "Knowledge of mathematics",
                ],
                answer: 0,
                why: "The passage lists gentleness or fierceness, courage or timidity, and something equivalent to sagacity.",
              },
              {
                q: "Why does Aristotle point to children?",
                options: [
                  "They show the seeds of later character",
                  "They are smaller than adults",
                  "They cannot speak",
                ],
                answer: 0,
                why: "The summary reports that in children we see the traces and seeds of later settled character.",
              },
            ],
            journal: "Which animal's temperament do you most recognise in yourself?",
          },
          {
            id: "nature-proceeds-little-by-little",
            title: "Nature proceeds little by little",
            bekker: "588b4-589a9",
            minutes: 5,
            summary:
              "Aristotle observes that nature passes from lifeless things to animals so gradually that the boundaries cannot be fixed. Plants come after lifeless things, and among plants some seem more alive than others; the whole kind of plants is lifeless compared to animals, but alive compared to other bodies. In the sea there are things one cannot easily call plant or animal: the pinna is rooted and the razor shell dies if pulled from its burrow, and sea anemones and sponges blur the line further. The same gradual ascent shows in their activities, from merely reproducing, to perceiving, to caring for young. This picture of a continuous scale shaped natural history for centuries, though Aristotle did not think species change into one another.",
            passage: {
              text: "Nature proceeds little by little from things lifeless to animal life in such a way that it is impossible to determine the exact line of demarcation, nor on which side thereof an intermediate form should lie. Thus, next after lifeless things in the upward scale comes the plant, and of plants one will differ from another as to its amount of apparent vitality;",
              ref: "VIII.1, 588b4-8",
            },
            terms: [
              { greek: "συνέχεια", translit: "synecheia", english: "continuity", gloss: "Passing without a sharp break from one kind to the next." },
              { greek: "φυτόν", translit: "phyton", english: "plant", gloss: "A living thing with only the nutritive soul." },
            ],
            checks: [
              {
                q: "What does the passage say is impossible to determine?",
                options: [
                  "The exact line between lifeless things and animal life",
                  "The number of species",
                  "The age of the earth",
                ],
                answer: 0,
                why: "The passage says nature proceeds so gradually that it is impossible to determine the exact line of demarcation.",
              },
              {
                q: "Did Aristotle think species change into one another, according to the summary?",
                options: ["Yes, slowly over time", "No", "Only in the sea"],
                answer: 1,
                why: "The summary notes that his continuous scale did not mean that species change into one another.",
              },
            ],
            journal: "Where in your own thinking do you draw a sharp line that might really be a gradual slope?",
          },
        ],
      },
      {
        id: "book-9",
        title: "Book IX: Characters and intelligence",
        bekker: "608a-633b",
        line: "Book IX gathers stories of animal character, friendship, enmity and skill.",
        lessons: [
          {
            id: "the-swallows-nest",
            title: "The swallow builds like a mason",
            bekker: "612b18-613a2",
            minutes: 4,
            summary:
              "Book IX collects observations and reports on the characters of animals: their enmities and friendships, how the sexes differ in temper, and their cleverness. Aristotle notes that many resemblances to human life can be seen, and that intelligence often shows more in small creatures than in large. The swallow mixes mud and chaff as builders do, wets its feathers to make mud when it runs short, lays a bed of straw with hard material below, and sizes the nest to itself. Both parents feed the young and keep track of which chick has been fed. The book mixes careful observation with hearsay, and readers should take some stories, like animals healing themselves with herbs, with caution.",
            passage: {
              text: "In a general way in the lives of animals many resemblances to human life may be observed. Pre-eminent intelligence will be seen more in small creatures than in large ones, as is exemplified in the case of birds by the nest building of the swallow. In the same way as men do, the bird mixes mud and chaff together;",
              ref: "IX.7, 612b18-22",
            },
            terms: [
              { greek: "διάνοια", translit: "dianoia", english: "intelligence", gloss: "Thinking or understanding; animals show something like it." },
              { greek: "τέχνη", translit: "technē", english: "craft, skill", gloss: "Skilled making; the swallow's building resembles it." },
            ],
            checks: [
              {
                q: "Where does the passage say intelligence is seen more?",
                options: ["In large creatures", "In small creatures", "Only in humans"],
                answer: 1,
                why: "The passage says pre-eminent intelligence will be seen more in small creatures than in large ones.",
              },
              {
                q: "What does the swallow mix, as men do?",
                options: ["Mud and chaff", "Sand and lime", "Leaves and honey"],
                answer: 0,
                why: "The passage says that in the same way as men do, the bird mixes mud and chaff together.",
              },
            ],
            journal: "What small creature or small person has shown you more skill than you expected?",
          },
        ],
      },
    ],
  },
  {
    id: "parts-of-animals",
    title: "Parts of Animals",
    greek: "Περὶ ζῴων μορίων",
    latin: "De Partibus Animalium",
    subject: "life",
    level: "Intermediate",
    bekker: "639a-697b",
    about:
      "Where the History of Animals records what animals have, the Parts of Animals asks why they have it. Aristotle explains parts by what they are for and by what they must be made of, and Book I is his clearest statement of how to study living things.",
    before: ["history-of-animals"],
    caveat: "",
    translation: {
      translator: "William Ogle",
      year: 1911,
      title: "De Partibus Animalium (The Works of Aristotle, Oxford, vol. V)",
      url: "https://classics.mit.edu/Aristotle/parts_animals.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: How to study living things",
        bekker: "639a-646a",
        line: "Book I sets out the method of biology: causes, the priority of the end, and the worth of studying every animal.",
        lessons: [
          {
            id: "the-end-comes-first",
            title: "The end comes first in nature",
            bekker: "639a1-640a9",
            minutes: 6,
            summary:
              "Aristotle asks how a student of nature should proceed. Should we first collect the facts about each animal and then seek causes? And which cause comes first? Nature works through more than one cause: the one that starts a process and the one it is for. He argues that the cause it is for comes first, because it is the reason, and the reason is the starting point in art and nature alike. A doctor starts from a picture of health, a builder from a picture of a house, and every step is explained by that. In nature the end is even more dominant than in art. Necessity also plays a part, but in living things it is mostly hypothetical: if there is to be a house, there must be stones.",
            passage: {
              text: "The causes concerned in the generation of the works of nature are, as we see, more than one. There is the final cause and there is the motor cause. Now we must decide which of these two causes comes first, which second. Plainly, however, that cause is the first which we call the final one. For this is the Reason, and the Reason forms the starting-point, alike in the works of art and in works of nature.",
              ref: "I.1, 639b11-16",
            },
            terms: [
              { greek: "τέλος", translit: "telos", english: "end, goal", gloss: "What something is for; it explains the steps toward it." },
              { greek: "ἀνάγκη ἐξ ὑποθέσεως", translit: "anankē ex hypotheseōs", english: "hypothetical necessity", gloss: "What must be the case if a given end is to be reached." },
            ],
            checks: [
              {
                q: "Which cause does Aristotle say comes first?",
                options: ["The motor cause", "The final cause", "The material cause", "Chance"],
                answer: 1,
                why: "The passage says that cause is first which we call the final one, because it is the reason.",
              },
              {
                q: "What example from the crafts does the summary give?",
                options: [
                  "A builder starting from a picture of a house",
                  "A farmer waiting for rain",
                  "A sailor reading the stars",
                ],
                answer: 0,
                why: "The doctor starts from health and the builder from a picture of the house, and each step is explained by it.",
              },
              {
                q: "What is hypothetical necessity?",
                options: [
                  "What must be so if a given end is to come about",
                  "What happens by chance",
                  "What is always true, like geometry",
                ],
                answer: 0,
                why: "The summary's example: if there is to be a house, there must be stones.",
              },
            ],
            journal: "What end are you working toward that explains most of the steps you take each week?",
          },
          {
            id: "every-animal-is-worth-studying",
            title: "There are gods here too",
            bekker: "644b22-645a36",
            minutes: 5,
            summary:
              "Some things in nature, the heavenly bodies, are eternal and divine, but we know little of them. Animals and plants perish, but they live around us and we can learn a great deal about them. Each study has its own charm. Aristotle then defends the study of humble animals. Even creatures with no grace to please the senses give great pleasure to anyone who can trace causes, because they show the design behind them. It would be strange to enjoy paintings of animals for the painter's skill and not enjoy the animals themselves. He recalls Heraclitus, who told visitors hesitating at his kitchen to come in, since there were gods there too. In nature nothing is haphazard and everything serves an end, and that end is a kind of beauty.",
            passage: {
              text: "Every realm of nature is marvellous: and as Heraclitus, when the strangers who came to visit him found him warming himself at the furnace in the kitchen and hesitated to go in, is reported to have bidden them not to be afraid to enter, as even in that kitchen divinities were present, so we should venture on the study of every kind of animal without distaste; for each and all will reveal to us something natural and something beautiful.",
              ref: "I.5, 645a17-23",
            },
            terms: [
              { greek: "θαυμαστός", translit: "thaumastos", english: "marvellous", gloss: "Worth wondering at; wonder is where philosophy starts." },
              { greek: "καλόν", translit: "kalon", english: "beautiful, fine", gloss: "What is well ordered toward an end; nature's works have it." },
            ],
            checks: [
              {
                q: "What did Heraclitus tell the hesitating visitors?",
                options: [
                  "Not to be afraid to enter, since divinities were present even there",
                  "To come back later",
                  "That the kitchen was too hot",
                ],
                answer: 0,
                why: "The passage says he bade them not to be afraid to enter, as even in that kitchen divinities were present.",
              },
              {
                q: "What does Aristotle say every kind of animal will reveal?",
                options: [
                  "Something natural and something beautiful",
                  "The will of the gods",
                  "A lesson about virtue",
                ],
                answer: 0,
                why: "The passage ends: each and all will reveal to us something natural and something beautiful.",
              },
            ],
            journal: "What humble thing near you would repay looking at closely, as Aristotle looked at insects and shellfish?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Uniform parts and the head",
        bekker: "646a-661a",
        line: "Book II explains the uniform parts, blood, fat, bone and flesh, and begins on the parts of the head.",
        lessons: [
          {
            id: "three-levels-of-composition",
            title: "Three levels of composition",
            bekker: "646a8-647b9",
            minutes: 5,
            summary:
              "Aristotle sets out three levels at which an animal is put together. The first is from the elementary powers: hot and cold, wet and dry, on which heaviness, density and the rest depend. The second is the uniform parts, like bone, flesh and blood, made from those powers. The third is the non-uniform parts, like face, hand and foot, made from the uniform ones. In time, matter and process come first; in nature and account, the end comes first, since the house is not for the bricks but the bricks for the house. So the non-uniform parts are prior in nature, and the uniform parts exist for their sake. Uniform parts serve as the stuff of the organs: flesh for touch, bone for support.",
            passage: {
              text: "Now there are three degrees of composition; and of these the first in order, as all will allow, is composition out of what some call the elements, such as earth, air, water, fire. Perhaps, however, it would be more accurate to say composition out of the elementary forces; nor indeed out of all of these, but out of a limited number of them, as defined in previous treatises.",
              ref: "II.1, 646a",
            },
            terms: [
              { greek: "σύνθεσις", translit: "synthesis", english: "composition", gloss: "Putting together; there are three levels in an animal." },
              { greek: "στοιχεῖον", translit: "stoicheion", english: "element", gloss: "Earth, air, water or fire, the simplest bodies." },
              { greek: "δύναμις", translit: "dynamis", english: "power, force", gloss: "Here the elementary qualities: hot, cold, wet and dry." },
            ],
            checks: [
              {
                q: "What is the first degree of composition, according to the passage?",
                options: [
                  "Composition out of the elements or elementary forces",
                  "Composition out of organs",
                  "Composition out of flesh and bone",
                ],
                answer: 0,
                why: "The passage says the first is composition out of the elements, or more accurately the elementary forces.",
              },
              {
                q: "Which comes first in nature, according to the summary?",
                options: [
                  "The non-uniform parts, for whose sake the uniform ones exist",
                  "The elements",
                  "The uniform parts",
                ],
                answer: 0,
                why: "The end is prior in nature, so organs like the hand are prior to the flesh and bone that serve them.",
              },
            ],
            journal: "In some project of yours, what are the bricks and what is the house they are for?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: The organs inside",
        bekker: "661a-675a",
        line: "Book III treats teeth, mouth, neck and the inner organs: heart, lung, liver, spleen and stomach.",
        lessons: [
          {
            id: "the-heart-is-the-source",
            title: "The heart is the source of the vessels",
            bekker: "665a26-667b14",
            minutes: 5,
            summary:
              "Blood is liquid, so it needs containers, and nature has made the blood vessels. They need one source rather than many, and that source is the heart. Aristotle argues from what can be seen: the vessels issue from the heart and do not pass through it; the heart is made like a vessel; and it lies in the ruling place, near the middle of the body, higher rather than lower and forward rather than back. He rejects the view that vessels start in the head: that would make many scattered sources in a cold region, whereas the heart is plainly hot. Only in the heart is there blood outside vessels. He appeals to dissection and to watching embryos develop as confirmation.",
            passage: {
              text: "These, again, must necessarily have one primary source. For it is preferable that there shall be one such, when possible, rather than several. This primary source of the vessels is the heart. For the vessels manifestly issue from it and do not go through it. Moreover, being as it is homogeneous, it has the character of a blood-vessel. Again its position is that of a primary or dominating part.",
              ref: "III.4, 665b",
            },
            terms: [
              { greek: "ἀρχή", translit: "archē", english: "source, principle", gloss: "The starting point from which something issues." },
              { greek: "ἀνατομή", translit: "anatomē", english: "dissection", gloss: "Cutting up to see the parts; Aristotle appeals to it as evidence." },
            ],
            checks: [
              {
                q: "What does the passage name as the primary source of the vessels?",
                options: ["The head", "The liver", "The heart", "The lung"],
                answer: 2,
                why: "The passage says this primary source of the vessels is the heart.",
              },
              {
                q: "Why does Aristotle reject the view that the vessels start in the head?",
                options: [
                  "It would give many scattered sources in a cold region",
                  "The head is too small",
                  "The head has no blood",
                ],
                answer: 0,
                why: "The summary reports that such a view gives many scattered sources in a cold region, whereas the heart is hot.",
              },
            ],
            journal: "What in your life works as a single source from which many other things flow?",
          },
        ],
      },
      {
        id: "book-4",
        title: "Book IV: Bloodless animals and the human hand",
        bekker: "675a-697b",
        line: "Book IV treats the bloodless animals and the outer parts of the blooded, ending with the human body and its hands.",
        lessons: [
          {
            id: "standing-upright",
            title: "Why humans stand upright",
            bekker: "686a24-686b30",
            minutes: 5,
            summary:
              "Aristotle explains why humans have arms and hands where other animals have forelegs. Of all animals, he says, only humans stand upright, in keeping with a nature that is in some way divine. The work of what is divine is to think and to understand, and that is hard under a heavy body pressing down. When the bulk of the body is too great, it must lean toward the ground, and that is why other animals go on four feet. Small children, he adds, are like dwarfs in having a large upper body, and they crawl. This argument depends on his view of a scale of animals with humans at the top, which modern biology does not share.",
            passage: {
              text: "For of all animals man alone stands erect, in accordance with his godlike nature and essence. For it is the function of the god-like to think and to be wise; and no easy task were this under the burden of a heavy body, pressing down from above and obstructing by its weight the motions of the intellect and of the general sense.",
              ref: "IV.10, 686a27-31",
            },
            terms: [
              { greek: "ὀρθός", translit: "orthos", english: "upright", gloss: "Standing straight up; humans alone do so." },
              { greek: "θεῖος", translit: "theios", english: "divine, godlike", gloss: "Like a god; for Aristotle tied to thinking." },
            ],
            checks: [
              {
                q: "What does the passage say is the function of the godlike?",
                options: ["To think and to be wise", "To rule others", "To live forever"],
                answer: 0,
                why: "The passage says it is the function of the god-like to think and to be wise.",
              },
              {
                q: "Why would a heavy body make that function hard?",
                options: [
                  "It presses down and obstructs the motions of the intellect",
                  "It needs too much food",
                  "It makes animals slow",
                ],
                answer: 0,
                why: "The passage says a heavy body pressing from above obstructs the motions of the intellect and the general sense.",
              },
            ],
            journal: "When does your body help your thinking, and when does it weigh it down?",
          },
          {
            id: "hands-follow-intelligence",
            title: "Hands follow intelligence",
            bekker: "687a2-687b25",
            minutes: 5,
            summary:
              "Anaxagoras said humans are the most intelligent animals because they have hands. Aristotle turns this around: humans have hands because they are the most intelligent. Hands are tools, and nature, like a sensible person, gives each tool to the animal that can use it. It is better to give a flute to someone who already plays than to teach the flute to someone who happens to own one. The hand is not one tool but many, a tool for tools, and becomes a claw, a hoof, a horn, a spear or a sword as needed. So the animal able to acquire the most skills has been given the tool useful for the most. Those who say humans are badly equipped, naked and unarmed, are wrong.",
            passage: {
              text: "Now it is the opinion of Anaxagoras that the possession of these hands is the cause of man being of all animals the most intelligent. But it is more rational to suppose that his endowment with hands is the consequence rather than the cause of his superior intelligence. For the hands are instruments or organs, and the invariable plan of nature in distributing the organs is to give each to such animal as can make use of it;",
              ref: "IV.10, 687a7-12",
            },
            terms: [
              { greek: "χείρ", translit: "cheir", english: "hand", gloss: "For Aristotle a tool of tools, able to become many tools." },
              { greek: "ὄργανον", translit: "organon", english: "tool, organ", gloss: "An instrument for some work; body parts are organs in this sense." },
            ],
            checks: [
              {
                q: "What did Anaxagoras think, according to the passage?",
                options: [
                  "Having hands is the cause of human intelligence",
                  "Intelligence is the cause of having hands",
                  "Humans have no special intelligence",
                ],
                answer: 0,
                why: "The passage reports Anaxagoras' opinion that possessing hands is the cause of man being the most intelligent.",
              },
              {
                q: "What is the point of the flute example?",
                options: [
                  "Nature gives a tool to the one who can use it",
                  "Music is natural to humans",
                  "Flutes are like hands",
                ],
                answer: 0,
                why: "The summary explains that it is better to give a flute to one who plays, as nature gives each organ to the animal that can use it.",
              },
              {
                q: "Why does Aristotle call the hand a tool for tools?",
                options: [
                  "It can become a claw, a spear or a sword as needed",
                  "It is used only to make tools",
                  "It has many bones",
                ],
                answer: 0,
                why: "The summary reports that the hand is not one tool but many, becoming whatever tool the need calls for.",
              },
            ],
            journal: "What skill do you have that your hands only serve, and could they serve something else as well?",
          },
        ],
      },
    ],
  },
  {
    id: "movement-and-progression-of-animals",
    title: "Movement and Progression of Animals",
    greek: "Περὶ ζῴων κινήσεως · Περὶ πορείας ζῴων",
    latin: "De Motu Animalium · De Incessu Animalium",
    subject: "life",
    level: "Intermediate",
    bekker: "698a-714b",
    about:
      "Two short treatises on how animals move. Movement of Animals asks what any animal motion requires, from a still point to push against to the desire that starts it; Progression of Animals explains why limbs are arranged and bent as they are. Together they join On the Soul to the anatomy of the Parts of Animals.",
    before: ["on-the-soul", "parts-of-animals"],
    caveat:
      "Movement of Animals was once doubted as a later work, but most scholars since Werner Jaeger and Martha Nussbaum accept it as Aristotle's. The two treatises are separate works, joined here as one course.",
    translation: {
      translator: "A. S. L. Farquharson",
      year: 1912,
      title: "De Motu Animalium and De Incessu Animalium (The Works of Aristotle, Oxford, vol. V)",
      url: "https://classics.mit.edu/Aristotle/motion_animals.html",
    },
    units: [
      {
        id: "movement-of-animals",
        title: "Movement of Animals: What starts an animal moving",
        bekker: "698a1-704b3",
        line: "What every animal motion requires: a still point, an unmoved mover, and desire acting on perception.",
        lessons: [
          {
            id: "something-must-stay-still",
            title: "Something must stay still for anything to move",
            bekker: "698a1-699a11",
            minutes: 5,
            summary:
              "Aristotle recalls from the Physics that every motion goes back to a mover that is itself unmoved. He wants to see the same principle in living things. Nothing can start moving unless something stays at rest. In an animal, when one part moves another must be still, and this is what joints are for. A joint works like a centre: the limb becomes both one and two, straight and bent, and one point in the joint stays still while the other moves. And the animal as a whole needs something outside it at rest to push against, as the ground for walking or the water for swimming. A man in a boat cannot move it by pushing on its mast.",
            passage: {
              text: "For if one of the parts of an animal be moved, another must be at rest, and this is the purpose of their joints; animals use joints like a centre, and the whole member, in which the joint is, becomes both one and two, both straight and bent, changing potentially and actually by reason of the joint.",
              ref: "1, 698a",
            },
            terms: [
              { greek: "καμπή", translit: "kampē", english: "joint, flexion", gloss: "A bending point where one part stays still as another moves." },
              { greek: "ἀκίνητον", translit: "akinēton", english: "unmoved", gloss: "What stays at rest, needed for any motion to begin." },
            ],
            checks: [
              {
                q: "What does the passage say is the purpose of joints?",
                options: [
                  "That one part may be at rest while another moves",
                  "To make the body lighter",
                  "To hold the blood",
                ],
                answer: 0,
                why: "The passage says if one part moves another must be at rest, and this is the purpose of their joints.",
              },
              {
                q: "What does the boat example in the summary show?",
                options: [
                  "An animal needs something outside it at rest to push against",
                  "Boats move by magic",
                  "Masts are joints",
                ],
                answer: 0,
                why: "Pushing on a mast cannot move the boat, because there is no outside point at rest to push against.",
              },
            ],
            journal: "What still point do you push against when you start something new?",
          },
          {
            id: "the-practical-syllogism",
            title: "I want to drink: desire and action",
            bekker: "700b4-702a21",
            minutes: 6,
            summary:
              "All animals move for the sake of something, Aristotle says, and the things that move them are thought, imagination, choice, wish and appetite, all of which come down to mind and desire. He compares the way action follows to an argument. One premise names a good, another says what is possible, and the conclusion is an action. If every man ought to walk and I am a man, I walk at once. Often we skip the obvious premise. Appetite says I want to drink, perception or imagination says this is drink, and straightway I drink. Desire is the last cause of movement, and it follows perception or imagination. He compares animals to automatic puppets set going by a small push.",
            passage: {
              text: "For the actualizing of desire is a substitute for inquiry or reflection. I want to drink, says appetite; this is drink, says sense or imagination or mind: straightway I drink. In this way living creatures are impelled to move and to act, and desire is the last or immediate cause of movement, and desire arises after perception or after imagination and conception.",
              ref: "7, 701a30-36",
            },
            terms: [
              { greek: "συλλογισμός", translit: "syllogismos", english: "syllogism, reasoning", gloss: "Drawing a conclusion from premises; here the conclusion is an action." },
              { greek: "ἐπιθυμία", translit: "epithymia", english: "appetite", gloss: "Desire for the pleasant, such as food and drink." },
            ],
            checks: [
              {
                q: "In the passage, what says 'this is drink'?",
                options: ["Appetite", "Sense or imagination or mind", "The stomach", "Habit"],
                answer: 1,
                why: "The passage says: I want to drink, says appetite; this is drink, says sense or imagination or mind.",
              },
              {
                q: "What does the passage call the last or immediate cause of movement?",
                options: ["Desire", "The heart", "Reason", "The joints"],
                answer: 0,
                why: "The passage says desire is the last or immediate cause of movement.",
              },
            ],
            journal: "Which of your actions today followed straight from an 'I want' and a 'this is it', without any reflection between?",
          },
        ],
      },
      {
        id: "progression-of-animals",
        title: "Progression of Animals: Why limbs are as they are",
        bekker: "704a4-714b23",
        line: "Why animals have the number and shape of limbs they do, explained by what is best for each.",
        lessons: [
          {
            id: "nature-does-nothing-in-vain",
            title: "Nature does nothing in vain",
            bekker: "704a4-704b23",
            minutes: 5,
            summary:
              "Aristotle lists the questions to be answered: how few points of motion an animal needs, why blooded animals move on four points and bloodless ones on more, why humans and birds are two-footed but bend their legs in opposite ways, why quadrupeds move their legs crosswise. The facts come from the History of Animals; now he seeks reasons. He lays down his working principles. First, nature makes nothing without a purpose, but always the best possible for each kind given its essential make-up, so if one way is better, that is the way of nature. Second, there are three pairs of directions: up and down, front and back, right and left. Third, every movement from place to place is a push or a pull.",
            passage: {
              text: "At the beginning of the inquiry we must postulate the principles we are accustomed constantly to use for our scientific investigation of nature, that is we must take for granted principles of this universal character which appear in all Nature's work. Of these one is that Nature creates nothing without a purpose, but always the best possible in each kind of living creature by reference to its essential constitution. Accordingly if one way is better than another that is the way of Nature.",
              ref: "2, 704b",
            },
            terms: [
              { greek: "οὐδὲν μάτην", translit: "ouden matēn", english: "nothing in vain", gloss: "Aristotle's principle that nature makes nothing without a purpose." },
              { greek: "οὐσία", translit: "ousia", english: "essential constitution", gloss: "What a kind of animal is; nature does the best for it." },
            ],
            checks: [
              {
                q: "What principle does the passage say appears in all nature's work?",
                options: [
                  "Nature creates nothing without a purpose",
                  "Nature always repeats itself",
                  "Nature prefers the simplest shape",
                ],
                answer: 0,
                why: "The passage says one principle is that Nature creates nothing without a purpose, but always the best possible.",
              },
              {
                q: "Best possible relative to what?",
                options: [
                  "Each kind's essential constitution",
                  "Human needs",
                  "The gods' wishes",
                ],
                answer: 0,
                why: "The passage says the best possible in each kind of living creature by reference to its essential constitution.",
              },
            ],
            journal: "Where do you assume something in your life has a purpose, and what would change if it did not?",
          },
          {
            id: "pushing-against-the-ground",
            title: "Every step presses against what is below",
            bekker: "705a3-705b8",
            minutes: 4,
            summary:
              "Some animals move the whole body at once, as jumpers do; others move one part and then another, as walkers do. Either way the moving animal changes place by pressing against what lies beneath it. If what is below gives way too fast, as sand or water may, the animal cannot advance, or advances only by effort. So a runner swings the arms, an athlete jumps further holding weights, and a fish presses against water, a bird against air. Aristotle uses this to explain why legs bend and why animals need an even number of points of support. Modern mechanics agrees that a walker moves by pushing back on the ground.",
            passage: {
              text: "Now of animals which change their position some move with the whole body at once, for example jumping animals, others move one part first and then the other, for example walking (and running) animals. In both these changes the moving creature always changes its position by pressing against what lies below it.",
              ref: "3, 705a3-8",
            },
            terms: [
              { greek: "πορεία", translit: "poreia", english: "progression, walking", gloss: "Moving from place to place by limbs." },
              { greek: "ἀπέρεισις", translit: "apereisis", english: "pressing against", gloss: "Pushing on what lies below in order to move." },
            ],
            checks: [
              {
                q: "How, according to the passage, does a moving creature always change its position?",
                options: [
                  "By pressing against what lies below it",
                  "By pulling the air toward it",
                  "By breathing in",
                ],
                answer: 0,
                why: "The passage says the moving creature always changes its position by pressing against what lies below it.",
              },
              {
                q: "Which animals move with the whole body at once?",
                options: ["Jumping animals", "Walking animals", "Swimming animals"],
                answer: 0,
                why: "The passage gives jumping animals as those that move with the whole body at once.",
              },
            ],
            journal: "What ground beneath you gives way too easily when you try to move forward?",
          },
        ],
      },
    ],
  },
  {
    id: "generation-of-animals",
    title: "Generation of Animals",
    greek: "Περὶ ζῴων γενέσεως",
    latin: "De Generatione Animalium",
    subject: "life",
    level: "Advanced",
    bekker: "715a-789b",
    about:
      "Aristotle's account of how animals come to be: sex, seed, the embryo, inheritance and variation. It is the first systematic embryology, full of careful observation, and also the source of claims about women that were wrong and long harmful. Reading it well means taking both seriously.",
    before: ["parts-of-animals"],
    caveat:
      "Some scholars treat Book V, on features that vary within a kind, as a separate treatise added later. The work's account of the female as passive matter and of female offspring as a departure from type is Aristotle's, and modern biology rejects it.",
    translation: {
      translator: "Arthur Platt",
      year: 1910,
      title: "De Generatione Animalium (The Works of Aristotle, Oxford, vol. V)",
      url: "https://archive.org/details/worksofaristotle0005jand",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: Male, female and the seed",
        bekker: "715a-731b",
        line: "Book I treats the organs of generation and asks what each parent contributes.",
        lessons: [
          {
            id: "male-and-female-as-principles",
            title: "Male and female as principles of generation",
            bekker: "715a1-716b12",
            minutes: 5,
            summary:
              "Aristotle begins by naming the four causes and saying that the Parts of Animals treated the end and the matter; now he turns to the cause that starts motion. Male and female are the first principles of generation. By male he means what generates in another, by female what generates in itself. People speak this way of the whole cosmos too, calling earth mother and heaven and sun father. Male and female differ in what they can do, and so in the parts needed for doing it. He takes sex to be widespread but not universal: many plants and some animals, he thinks, are not divided into sexes. Later in Book I he argues that the male supplies the form and the female the matter, a view modern biology does not hold.",
            passage: {
              text: "For by a male animal we mean that which generates in another, and by a female that which generates in itself; wherefore men apply these terms to the macrocosm also, naming Earth mother as being female, but addressing Heaven and the Sun and other like entities as fathers, as causing generation.",
              ref: "I.2, 716a13-17",
            },
            terms: [
              { greek: "ἄρρεν", translit: "arren", english: "male", gloss: "What generates in another, in Aristotle's definition." },
              { greek: "θῆλυ", translit: "thēly", english: "female", gloss: "What generates in itself, in Aristotle's definition." },
            ],
            checks: [
              {
                q: "How does the passage define a male animal?",
                options: [
                  "That which generates in another",
                  "That which generates in itself",
                  "That which is larger",
                ],
                answer: 0,
                why: "The passage says by a male animal we mean that which generates in another.",
              },
              {
                q: "Whom do people call father, according to the passage?",
                options: ["Earth", "Heaven and the Sun", "The sea"],
                answer: 1,
                why: "The passage says men name Earth mother but address Heaven and the Sun as fathers.",
              },
            ],
            journal: "What in your life do you generate in yourself, and what only in others?",
          },
          {
            id: "the-carpenter-and-the-wood",
            title: "The carpenter and the wood",
            bekker: "729a20-730b32",
            minutes: 6,
            summary:
              "What does each parent give? Aristotle answers with an analogy from craft. A bed comes from the carpenter and the wood, but nothing of the carpenter goes into the wood; his art is passed on through the motion of his hands and tools. In the same way, he argues, the male contributes no material part to the embryo, only the form and the motion that shapes it, while the female supplies the matter, the menstrual blood. That is why the embryo forms in the female: the craftsman must stay in touch with his material. He supports this by cases where the male inserts no part of himself. Modern biology shows that both parents contribute material and inheritance alike, through egg and sperm.",
            passage: {
              text: "The male does not emit semen at all in some animals, and where he does this is no part of the resulting embryo; just so no material part comes from the carpenter to the material, i.e. the wood in which he works, nor does any part of the carpenter's art exist within what he makes, but the shape and the form are imparted from him to the material by means of the motion he sets up.",
              ref: "I.22, 730b9-15",
            },
            terms: [
              { greek: "κίνησις", translit: "kinēsis", english: "motion", gloss: "Here the shaping movement the male is said to pass on." },
              { greek: "καταμήνια", translit: "katamēnia", english: "menstrual fluid", gloss: "What Aristotle takes to be the female's material contribution." },
            ],
            checks: [
              {
                q: "In the analogy, what passes from the carpenter to the wood?",
                options: [
                  "The shape and form, by the motion he sets up",
                  "A piece of the carpenter's body",
                  "The carpenter's art itself, inside the bed",
                ],
                answer: 0,
                why: "The passage says no material part comes from the carpenter, but the shape and form are imparted by the motion he sets up.",
              },
              {
                q: "What does Aristotle conclude about the male's contribution?",
                options: [
                  "It is no material part of the embryo",
                  "It is all the matter of the embryo",
                  "It is the same as the female's",
                ],
                answer: 0,
                why: "The passage says that where the male emits semen, this is no part of the resulting embryo.",
              },
              {
                q: "What does modern biology say, according to the summary?",
                options: [
                  "Both parents contribute material and inheritance",
                  "Only the male contributes inheritance",
                  "Only the female contributes material",
                ],
                answer: 0,
                why: "The summary notes that both parents contribute material and inheritance through egg and sperm.",
              },
            ],
            journal: "Where have you shaped something without giving any part of yourself to it, only your motion and your art?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Why there is generation at all",
        bekker: "731b-749a",
        line: "Book II asks why animals reproduce and how the embryo forms, part by part.",
        lessons: [
          {
            id: "eternal-as-a-kind",
            title: "Eternal as a kind, not as an individual",
            bekker: "731b18-732a25",
            minutes: 5,
            summary:
              "Why are there sexes and generation at all? Aristotle answers from what is better. Some things are eternal and divine; others can be or not be. The noble and divine is always the cause of the better in things that admit better and worse. Soul is better than body, the living better than the lifeless, being better than not being. Animals cannot be eternal as individuals, so they are eternal in the only way open to them, as a kind, and this is why generation exists. The sexes are separated, where they are, for the sake of the better, since it is better for the source of motion to be apart from the matter. The thought echoes On the Soul II.4.",
            passage: {
              text: "And (3) soul is better than body, and the living, having soul, is thereby better than the lifeless which has none, and being is better than not being, living than not living. These, then, are the reasons of the generation of animals. For since it is impossible that such a class of things as animals should be of an eternal nature, therefore that which comes into being is eternal in the only way possible.",
              ref: "II.1, 731b",
            },
            terms: [
              { greek: "εἶδος", translit: "eidos", english: "species, kind", gloss: "Here the kind that lasts while individuals perish." },
              { greek: "βέλτιον", translit: "beltion", english: "better", gloss: "The ground of Aristotle's explanation of why generation exists." },
            ],
            checks: [
              {
                q: "Which of these does the passage say is better?",
                options: ["Body than soul", "Being than not being", "The lifeless than the living"],
                answer: 1,
                why: "The passage says being is better than not being, and living than not living.",
              },
              {
                q: "In what way, according to the summary, are animals eternal?",
                options: ["As individuals", "As a kind", "Not at all"],
                answer: 1,
                why: "Animals cannot be eternal as individuals, so they are eternal in the only way possible, as a kind.",
              },
            ],
            journal: "Is it enough for you that something of your kind goes on, or do you want something of you in particular to last?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: Eggs, fish, bees and shellfish",
        bekker: "749a-763b",
        line: "Book III treats animals that lay eggs, the puzzle of bee generation, and spontaneous generation.",
        lessons: [
          {
            id: "observation-over-theory",
            title: "Trust observation over theory",
            bekker: "759a8-761a12",
            minutes: 5,
            summary:
              "Bees puzzled the ancients. No one had seen them mate, and it was unclear which bees were male. Aristotle works through the options with care: do bees fetch their young from flowers, or generate them, and if so which kind generates which? He settles on a view in which the leaders, which he calls kings, generate both themselves and the workers, and the workers generate the drones. We now know the leader is a queen, and he was wrong about much of this. But he ends with a famous rule of method. This is what seems true from argument and from the facts as believed; the facts are not yet grasped well enough, and if they ever are, observation must be trusted over theory, and theory only if it agrees with what is seen.",
            passage: {
              text: "Such appears to be the truth about the generation of bees, judging from theory and from what are believed to be the facts about them; the facts, however, have not yet been sufficiently grasped; if ever they are, then credit must be given rather to observation than to theories, and to theories only if what they affirm agrees with the observed facts.",
              ref: "III.10, 760b27-33",
            },
            terms: [
              { greek: "αἴσθησις", translit: "aisthēsis", english: "observation, perception", gloss: "What the senses show; to be trusted above argument." },
              { greek: "λόγος", translit: "logos", english: "theory, argument", gloss: "Reasoning, which must agree with what is observed." },
            ],
            checks: [
              {
                q: "When the facts are grasped, what does Aristotle say should be trusted more?",
                options: ["Theories", "Observation", "Tradition", "The beekeepers"],
                answer: 1,
                why: "The passage says credit must be given rather to observation than to theories.",
              },
              {
                q: "When should theories be trusted, according to the passage?",
                options: [
                  "Only if what they affirm agrees with the observed facts",
                  "Always, if they are elegant",
                  "Never",
                ],
                answer: 0,
                why: "The passage says theories are to be credited only if what they affirm agrees with the observed facts.",
              },
            ],
            journal: "Which of your theories about someone have you held onto even though what you have seen does not fit it?",
          },
        ],
      },
      {
        id: "book-4",
        title: "Book IV: Sex, likeness and monsters",
        bekker: "763b-778a",
        line: "Book IV asks what makes offspring male or female, why children resemble their parents, and why some are malformed.",
        lessons: [
          {
            id: "why-children-resemble-parents",
            title: "Why children resemble parents, or do not",
            bekker: "767a36-769b10",
            minutes: 6,
            summary:
              "Aristotle lists facts that any account of inheritance must explain: some children resemble their parents and some do not; some take after the father, some the mother, in the whole body or in single parts; they resemble parents more than remote ancestors, and ancestors more than strangers; some resemble no relative, and some are malformed. His explanation is that the male's motions try to master the female's material, and resemblance depends on how far they prevail, or give way to motions from the mother and from more distant ancestors. Strikingly, he counts the birth of a female as the first departure from type, though a necessary one. This was among his most harmful claims, and modern genetics explains both sex and resemblance in other ways.",
            passage: {
              text: "Some, though resembling none of their relations, yet do at any rate resemble a human being, but others are not even like a human being but a monstrosity. For even he who does not resemble his parents is already in a certain sense a monstrosity; for in these cases Nature has in a way departed from the type.",
              ref: "IV.3, 767b3-7",
            },
            terms: [
              { greek: "τέρας", translit: "teras", english: "monstrosity, prodigy", gloss: "A birth that departs from its kind." },
              { greek: "ὁμοιότης", translit: "homoiotēs", english: "resemblance", gloss: "Likeness of offspring to parents or ancestors." },
            ],
            checks: [
              {
                q: "In what sense is a child who does not resemble his parents a monstrosity, according to the passage?",
                options: [
                  "Nature has in a way departed from the type",
                  "He is dangerous",
                  "He is not human",
                ],
                answer: 0,
                why: "The passage says in these cases Nature has in a way departed from the type.",
              },
              {
                q: "How does Aristotle explain resemblance, according to the summary?",
                options: [
                  "By how far the male's motions master the material",
                  "By the parents' diet alone",
                  "By the stars at birth",
                ],
                answer: 0,
                why: "The summary reports that resemblance depends on how far the male's motions prevail or give way to motions from the mother and ancestors.",
              },
            ],
            journal: "In what do you take after a parent or grandparent, and what in you seems to come from no one?",
          },
        ],
      },
      {
        id: "book-5",
        title: "Book V: Features that vary",
        bekker: "778a-789b",
        line: "Book V treats features like eye colour, hair and voice that differ within a kind and are not for any purpose.",
        lessons: [
          {
            id: "not-everything-is-for-something",
            title: "Not everything has a purpose",
            bekker: "778a16-778b19",
            minutes: 5,
            summary:
              "Aristotle turns to features that differ between animals of a kind: blue or dark eyes, high or deep voices, colours of skin, hair and feather, and changes with age such as greying. He makes an important limit on his own method. Where a feature belongs to all animals, or to a whole kind, it exists for some end. But where it varies at random within a kind, as eye colour does in humans, it is not there for any purpose. The eye exists for the sake of seeing, but it is not blue for the sake of anything. Such features must be explained by the matter and the moving cause, as coming about by necessity. Platt, his translator, noted that Darwin and Wallace drew a similar line.",
            passage: {
              text: "For whenever things are not the product of Nature working upon the animal kingdom as a whole, nor yet characteristic of each separate kind, then none of these things is such as it is or is so developed for any final cause. The eye for instance exists for a final cause, but it is not blue for a final cause unless this condition be characteristic of the kind of animal.",
              ref: "V.1, 778a",
            },
            terms: [
              { greek: "ἀνάγκη", translit: "anankē", english: "necessity", gloss: "What follows from matter and motion, without a purpose." },
              { greek: "πάθημα", translit: "pathēma", english: "affection, feature", gloss: "A quality like eye colour or greyness of hair." },
            ],
            checks: [
              {
                q: "According to the passage, is the eye blue for a final cause?",
                options: [
                  "No, unless blueness is characteristic of the kind",
                  "Yes, always",
                  "Yes, to see better",
                ],
                answer: 0,
                why: "The passage says the eye exists for a final cause but is not blue for a final cause unless that is characteristic of the kind.",
              },
              {
                q: "How must features that vary at random be explained, according to the summary?",
                options: [
                  "By the matter and the moving cause, as necessity",
                  "By what they are for",
                  "They cannot be explained",
                ],
                answer: 0,
                why: "He refers such features to the material and the motive cause, as coming about by necessity.",
              },
            ],
            journal: "Which feature of yours have you tried to find a reason for that may simply have no purpose at all?",
          },
        ],
      },
    ],
  },
];
