import type { Course } from "./types";

// The subject "nature": Physics, On the Heavens, On Generation and Corruption, Meteorology.
// Passages are verbatim from the Oxford translations as given by the MIT Internet Classics Archive. Bekker references
// were checked against the marginal numbers of the Oxford volume II (1930) where it could be read; where a line was not
// certain, only the page and column are given.

export const NATURE: Course[] = [
  {
    id: "physics",
    title: "Physics",
    greek: "Φυσικὴ ἀκρόασις",
    latin: "Physica",
    subject: "nature",
    level: "Start here",
    bekker: "184a-267b",
    about:
      "Lectures on nature in general: what the principles of natural things are, what a cause is, and what motion, the infinite, place, void and time are. It ends by arguing that motion has always been and depends on a first mover that is itself unmoved. The rest of Aristotle's natural science builds on it.",
    before: [],
    caveat:
      "Book VII survives in two versions and reads like an earlier draft that fits loosely with the rest of the work; most scholars still take it as Aristotle's.",
    translation: {
      translator: "R. P. Hardie and R. K. Gaye",
      year: 1930,
      title: "Physica (The Works of Aristotle, vol. II)",
      url: "https://classics.mit.edu/Aristotle/physics.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: The principles of natural things",
        bekker: "184a-192b",
        line: "Book I asks how many principles change requires and answers three: an underlying thing, a form and its privation.",
        lessons: [
          {
            id: "start-from-what-is-clearer-to-us",
            title: "Start from what is clearer to us",
            bekker: "184a10-184b14",
            minutes: 5,
            summary:
              "Aristotle opens with a claim about knowledge: we think we know a thing when we grasp its principles, causes and elements. So the study of nature must begin by asking what its principles are. But the route matters. We should start from what is more knowable and obvious to us and move toward what is clearer and more knowable by nature. What strikes us first is often a confused whole; analysis then breaks it into its elements and principles. He compares this to the way a child first calls all men father and only later tells them apart. The method of the whole Physics follows from this: begin with what we see and say about changing things, then work back to what explains them.",
            passage: {
              text: "The natural way of doing this is to start from the things which are more knowable and obvious to us and proceed towards those which are clearer and more knowable by nature; for the same things are not 'knowable relatively to us' and 'knowable' without qualification. So in the present inquiry we must follow this method and advance from what is more obscure by nature, but clearer to us, towards what is more clear and more knowable by nature.",
              ref: "I.1, 184a16-21",
            },
            terms: [
              { greek: "ἀρχή", translit: "archē", english: "principle", gloss: "A starting point: that from which a thing is, comes to be or is known." },
              { greek: "γνωριμώτερον", translit: "gnōrimōteron", english: "more knowable", gloss: "Better known, either to us or by nature; the two orders run in opposite directions." },
            ],
            checks: [
              {
                q: "Where does Aristotle say the inquiry into nature should start?",
                options: [
                  "From what is more knowable and obvious to us",
                  "From what is clearest by nature",
                  "From the definitions of the first principles",
                  "From the opinions of the wise",
                ],
                answer: 0,
                why: "The passage says to start from what is more knowable and obvious to us and proceed towards what is clearer by nature.",
              },
              {
                q: "Why do the two starting points differ?",
                options: [
                  "Because nature cannot be known at all",
                  "Because what is knowable to us is not the same as what is knowable without qualification",
                  "Because the senses always deceive",
                  "Because principles are learned only by tradition",
                ],
                answer: 1,
                why: "He says the same things are not 'knowable relatively to us' and 'knowable' without qualification.",
              },
            ],
            journal: "When you learned something hard, did you begin with the principle or with the confused example, and what moved you from one to the other?",
          },
          {
            id: "principles-are-contraries",
            title: "The principles are contraries",
            bekker: "188a19-189a10",
            minutes: 5,
            summary:
              "Aristotle surveys his predecessors and finds a common thread: all of them, in one way or another, make contraries their principles, such as hot and cold, dense and rare, the full and the empty. He thinks they are right to do so. A first principle must not come from another principle or from anything else, while everything else must come from it. The primary contraries meet that test. They come from nothing else because they are primary, and not from each other because they are contraries. He adds that change is never from just anything to anything: the musical comes to be from the unmusical, white from not-white, so what comes to be comes from its contrary or something between.",
            passage: {
              text: "It is plain then that they all in one way or another identify the contraries with the principles. And with good reason. For first principles must not be derived from one another nor from anything else, while everything has to be derived from them. But these conditions are fulfilled by the primary contraries, which are not derived from anything else because they are primary, nor from each other because they are contraries.",
              ref: "I.5, 188a",
            },
            terms: [
              { greek: "ἐναντία", translit: "enantia", english: "contraries", gloss: "Opposites within one kind, like hot and cold, between which change runs." },
              { greek: "ἀρχή", translit: "archē", english: "principle", gloss: "What is first, and from which other things are derived." },
            ],
            checks: [
              {
                q: "What test does Aristotle say a first principle must pass?",
                options: [
                  "It must be visible to the senses",
                  "It must not be derived from another thing, while everything is derived from it",
                  "It must be a single element such as water",
                  "It must be accepted by every earlier thinker",
                ],
                answer: 1,
                why: "The passage says first principles must not be derived from one another nor from anything else, while everything has to be derived from them.",
              },
              {
                q: "Why are the primary contraries not derived from each other?",
                options: ["Because they are equal in size", "Because they are contraries", "Because they are eternal", "Because they are numbers"],
                answer: 1,
                why: "He says they are not derived from each other because they are contraries.",
              },
            ],
            journal: "Which change in your own life is best described as a movement from one contrary to the other, and what stayed the same through it?",
          },
          {
            id: "something-always-underlies",
            title: "Something always underlies change",
            bekker: "189b30-191a22",
            minutes: 6,
            summary:
              "Contraries alone cannot explain change, because one contrary does not act on the other. Something must underlie the change. Aristotle uses the example of a man who becomes musical. The man was unmusical and becomes musical. One part survives the change, the man, and one does not, the unmusical. So what becomes is one thing in number but two in account: the man and the not-musical are the same subject described in different ways. He concludes that change needs three things: the underlying subject, the form it acquires, and the privation it loses. This is the core of Aristotle's answer to the Eleatic claim that nothing can come to be.",
            passage: {
              text: "there must always be an underlying something, namely that which becomes, and that this, though always one numerically, in form at least is not one. (By that I mean that it can be described in different ways.) For 'to be man' is not the same as 'to be unmusical'. One part survives, the other does not: what is not an opposite survives (for 'man' survives), but 'not-musical' or 'unmusical' does not survive, nor does the compound of the two, namely 'unmusical man'.",
              ref: "I.7, 190a",
            },
            terms: [
              { greek: "ὑποκείμενον", translit: "hypokeimenon", english: "underlying thing", gloss: "The subject that persists through a change and receives the new form." },
              { greek: "στέρησις", translit: "sterēsis", english: "privation", gloss: "The lack of a form in something that could have it." },
              { greek: "εἶδος", translit: "eidos", english: "form", gloss: "What a thing comes to have when the change is complete." },
            ],
            checks: [
              {
                q: "When a man becomes musical, what survives the change?",
                options: ["The unmusical", "The man", "The compound 'unmusical man'", "Nothing survives"],
                answer: 1,
                why: "The passage says 'man' survives, while 'unmusical' and the compound 'unmusical man' do not.",
              },
              {
                q: "In what sense is the underlying thing 'not one'?",
                options: [
                  "It is many things in number",
                  "It can be described in different ways",
                  "It is made of several elements",
                  "It changes into something else entirely",
                ],
                answer: 1,
                why: "It is one numerically, but not one in form, which Aristotle explains as being describable in different ways.",
              },
            ],
            journal: "In a change you have been through, what was the 'man' that survived and what was the 'unmusical' that did not?",
          },
          {
            id: "matter-does-not-perish",
            title: "Matter does not simply pass away",
            bekker: "191b35-192b4",
            minutes: 5,
            summary:
              "Aristotle distinguishes matter from privation. Matter is not-being only by an attribute it happens to have; privation is not-being in its own nature. Matter is close to being substance, while privation is not substance in any way. He criticises the Platonists for lumping their Great and Small together as not-being. What desires the form, he says, is matter, as the female desires the male. Then he asks whether matter comes to be and passes away. As what contains the privation, it ceases to be in a sense, since the privation ceases within it. As potentiality, it does not cease to be. If matter came to be, something would have to underlie it, which is absurd.",
            passage: {
              text: "The matter comes to be and ceases to be in one sense, while in another it does not. As that which contains the privation, it ceases to be in its own nature, for what ceases to be-the privation-is contained within it. But as potentiality it does not cease to be in its own nature, but is necessarily outside the sphere of becoming and ceasing to be.",
              ref: "I.9, 192a25-29",
            },
            terms: [
              { greek: "ὕλη", translit: "hylē", english: "matter", gloss: "What underlies change and can take on form; literally 'wood' or 'timber'." },
              { greek: "δύναμις", translit: "dynamis", english: "potentiality", gloss: "The capacity to become or to be otherwise." },
            ],
            checks: [
              {
                q: "In which sense does matter not cease to be?",
                options: ["As privation", "As potentiality", "As form", "As a compound"],
                answer: 1,
                why: "The passage says that as potentiality it does not cease to be in its own nature.",
              },
              {
                q: "How does Aristotle tell matter and privation apart?",
                options: [
                  "Matter is not-being only by an attribute; privation is not-being in its own nature",
                  "Matter is pure not-being; privation is substance",
                  "They are the same thing under two names",
                  "Privation persists, matter perishes",
                ],
                answer: 0,
                why: "The summary reports his distinction: matter is not-being by an attribute it has, while privation is not-being in its own nature.",
              },
            ],
            journal: "What in you has stayed as potential through many changes, never used up by what you became?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Nature and its causes",
        bekker: "192b-200b",
        line: "Book II defines nature, sets out the four kinds of cause, places chance and spontaneity, and argues that nature acts for an end.",
        lessons: [
          {
            id: "what-nature-is",
            title: "What nature is",
            bekker: "192b8-193b21",
            minutes: 5,
            summary:
              "Some things exist by nature, like animals, plants and the simple bodies; others exist from other causes, like beds and coats made by art. The difference is that natural things have within themselves a principle of motion and of rest, whether in place, in growth and decrease, or in alteration. A bed, as a bed, has no innate impulse to change. It moves downward only because it is made of wood or stone, which do have such an impulse. So nature is a source or cause of being moved and of being at rest in that to which it belongs primarily, in virtue of itself. Aristotle goes on to ask whether nature is the matter or the form, and leans toward form.",
            passage: {
              text: "But in so far as they happen to be composed of stone or of earth or of a mixture of the two, they do have such an impulse, and just to that extent which seems to indicate that nature is a source or cause of being moved and of being at rest in that to which it belongs primarily, in virtue of itself and not in virtue of a concomitant attribute.",
              ref: "II.1, 192b19-23",
            },
            terms: [
              { greek: "φύσις", translit: "physis", english: "nature", gloss: "An inner source of a thing's own motion and rest." },
              { greek: "τέχνη", translit: "technē", english: "art, craft", gloss: "Making whose source lies in the maker, not in the thing made." },
            ],
            checks: [
              {
                q: "According to the passage, what is nature?",
                options: [
                  "The sum of all things that exist",
                  "A source or cause of being moved and of being at rest in that to which it belongs primarily",
                  "Whatever has not been touched by human hands",
                  "The material a thing is made of, and nothing else",
                ],
                answer: 1,
                why: "The passage gives this definition: a source or cause of being moved and of being at rest in that to which it belongs primarily.",
              },
              {
                q: "Why does a wooden bed fall when dropped?",
                options: [
                  "Because it is a bed",
                  "Because its maker intended it",
                  "Because it is made of a material that has such an impulse",
                  "Because all artifacts tend downward",
                ],
                answer: 2,
                why: "Artifacts have an impulse to change only in so far as they are composed of stone, earth or a mixture, as the passage says.",
              },
            ],
            journal: "Which of your habits moves from a source inside you, and which only moves because of what it happens to be made of?",
          },
          {
            id: "four-ways-to-be-a-cause",
            title: "Four ways to be a cause",
            bekker: "194b16-195b30",
            minutes: 6,
            summary:
              "We think we know a thing when we grasp its why, so the student of nature must know the causes. Aristotle lists four senses of 'cause'. First, that out of which a thing comes to be and which persists in it, like the bronze of a statue. Second, the form or pattern, the account of what it is, like the ratio 2:1 for the octave. Third, the primary source of the change or rest, like the person who gave advice or the father of a child. Fourth, the end, that for the sake of which, as health is the cause of walking about. Later tradition named these the material, formal, efficient and final causes. One thing can have several causes at once.",
            passage: {
              text: "Again (4) in the sense of end or 'that for the sake of which' a thing is done, e.g. health is the cause of walking about. ('Why is he walking about?' we say. 'To be healthy', and, having said that, we think we have assigned the cause.)",
              ref: "II.3, 194b32-35",
            },
            terms: [
              { greek: "αἰτία", translit: "aitia", english: "cause", gloss: "What answers the question 'why'; there are four kinds." },
              { greek: "τὸ οὗ ἕνεκα", translit: "to hou heneka", english: "that for the sake of which", gloss: "The end or purpose, the fourth cause." },
            ],
            checks: [
              {
                q: "In the passage, what is the cause of walking about in the sense of end?",
                options: ["The legs", "Health", "The person who advised it", "The ground"],
                answer: 1,
                why: "The passage says health is the cause of walking about, in the sense of 'that for the sake of which'.",
              },
              {
                q: "Which example does Aristotle give for the cause 'out of which a thing comes to be'?",
                options: ["The father of a child", "The bronze of a statue", "The ratio 2:1 of the octave", "Health"],
                answer: 1,
                why: "The bronze of the statue is his example of the first cause, the one out of which a thing comes to be and which persists.",
              },
            ],
            journal: "Pick one thing you did today: what was it made of, what was its shape, who or what started it, and what was it for?",
          },
          {
            id: "chance-is-an-incidental-cause",
            title: "Chance is an incidental cause",
            bekker: "195b31-198a13",
            minutes: 5,
            summary:
              "People say many things happen by chance or spontaneously, so Aristotle asks what these are. Chance concerns events that are not always or usually so, and that could have been done for an end. His example is a man who goes to the market for another reason and happens to meet a debtor who is collecting money, so he gets his money back. Had he known, he would have gone for that purpose. So chance is an incidental cause in the sphere of actions done for the sake of something that involve choice. Spontaneity is the wider class: it covers animals and lifeless things too. Both are secondary to nature and thought, which are causes in their own right.",
            passage: {
              text: "It is clear then that chance is an incidental cause in the sphere of those actions for the sake of something which involve purpose. Intelligent reflection, then, and chance are in the same sphere, for purpose implies intelligent reflection.",
              ref: "II.5, 197a5-8",
            },
            terms: [
              { greek: "τύχη", translit: "tychē", english: "chance, luck", gloss: "An incidental cause among actions that could have been chosen for an end." },
              { greek: "αὐτόματον", translit: "automaton", english: "spontaneity", gloss: "The wider class of incidental causes, found also in animals and lifeless things." },
            ],
            checks: [
              {
                q: "In what sphere does Aristotle place chance?",
                options: [
                  "Among things that always happen the same way",
                  "Among actions for the sake of something that involve purpose",
                  "Among the motions of the heavens",
                  "Among mathematical truths",
                ],
                answer: 1,
                why: "The passage says chance is an incidental cause in the sphere of actions for the sake of something which involve purpose.",
              },
              {
                q: "What does chance share a sphere with?",
                options: ["Necessity", "Intelligent reflection", "Nature alone", "Matter"],
                answer: 1,
                why: "He says intelligent reflection and chance are in the same sphere, since purpose implies intelligent reflection.",
              },
            ],
            journal: "What lucky meeting in your life would you have arranged on purpose, if you had known?",
          },
          {
            id: "nature-acts-for-an-end",
            title: "Nature acts for an end",
            bekker: "198b10-199b33",
            minutes: 6,
            summary:
              "Aristotle states a strong objection to purpose in nature. Perhaps nature works like rain: it falls of necessity, not in order to make the corn grow, and if it spoils a harvest that was not its aim either. Why not say the same of teeth, that sharp front teeth and broad molars just happened, and the forms that happened to suit survived? He replies that teeth and other natural things come about always or for the most part in a given way, while chance results do not. What happens regularly is either by coincidence or for an end; it is not by coincidence; so it is for an end. Art imitates nature, and both act for the sake of something.",
            passage: {
              text: "A difficulty presents itself: why should not nature work, not for the sake of something, nor because it is better so, but just as the sky rains, not in order to make the corn grow, but of necessity? What is drawn up must cool, and what has been cooled must become water and descend, the result of this being that the corn grows.",
              ref: "II.8, 198b16-21",
            },
            terms: [
              { greek: "τέλος", translit: "telos", english: "end", gloss: "What a process is for, and where it is complete." },
              { greek: "ἀνάγκη", translit: "anankē", english: "necessity", gloss: "What happens because the material must behave so." },
            ],
            checks: [
              {
                q: "What does the rain example in the passage stand for?",
                options: [
                  "A process that happens of necessity, not in order to make the corn grow",
                  "Proof that the gods care for farmers",
                  "An example of art imitating nature",
                  "A case of chance meeting purpose",
                ],
                answer: 0,
                why: "The objection says the sky rains not in order to make the corn grow, but of necessity.",
              },
              {
                q: "What is Aristotle's main reply to the objection?",
                options: [
                  "Rain does fall in order to help the corn",
                  "Natural things come about always or for the most part in a given way, which chance results do not",
                  "Nature never acts by necessity",
                  "Teeth are made by art",
                ],
                answer: 1,
                why: "The summary reports his reply: what is regular is not a coincidence, so it is for an end.",
              },
            ],
            journal: "Is there something in your life you explain as mere necessity that might better be explained by what it is for?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: Motion and the infinite",
        bekker: "200b-208a",
        line: "Book III defines motion as the actuality of what is potential, as such, and argues that the infinite exists only potentially.",
        lessons: [
          {
            id: "what-motion-is",
            title: "Motion is a potential being fulfilled",
            bekker: "200b12-201b15",
            minutes: 6,
            summary:
              "Nature is a principle of motion, so we must understand motion, or we will not understand nature. Aristotle notes that some things are only actual and others are both potential and actual, and that motion falls in several categories: substance, quality, quantity and place. He then defines motion as the fulfilment of what exists potentially, in so far as it exists potentially. The bricks and timber that can become a house are being built while the building goes on. Once the house exists, the potential as such is gone and so is the motion. So motion is neither simply potential nor simply actual. It is the actual state of something potential, while it is still on the way.",
            passage: {
              text: "Def. The fulfilment of what exists potentially, in so far as it exists potentially, is motion-namely, of what is alterable qua alterable, alteration: of what can be increased and its opposite what can be decreased (there is no common name), increase and decrease: of what can come to be and can pass away, coming to he and passing away: of what can be carried along, locomotion.",
              ref: "III.1, 201a10-15",
            },
            terms: [
              { greek: "κίνησις", translit: "kinēsis", english: "motion, change", gloss: "Any change: of place, of quality, of size, or of coming to be." },
              { greek: "ἐντελέχεια", translit: "entelecheia", english: "fulfilment, actuality", gloss: "Being at work toward or in completion." },
              { greek: "δύναμις", translit: "dynamis", english: "potentiality", gloss: "The capacity to be otherwise than one now is." },
            ],
            checks: [
              {
                q: "How does the passage define motion?",
                options: [
                  "The fulfilment of what exists potentially, in so far as it exists potentially",
                  "The passing of time",
                  "A change of place only",
                  "The completed state of a thing",
                ],
                answer: 0,
                why: "The definition reads: the fulfilment of what exists potentially, in so far as it exists potentially, is motion.",
              },
              {
                q: "What does the passage call the motion of what can be carried along?",
                options: ["Alteration", "Increase", "Locomotion", "Coming to be"],
                answer: 2,
                why: "It ends: of what can be carried along, locomotion.",
              },
            ],
            journal: "What are you in the middle of becoming, so that your present state is neither the start nor the finish?",
          },
          {
            id: "one-actuality-of-mover-and-moved",
            title: "Mover and moved share one activity",
            bekker: "202a13-202b29",
            minutes: 5,
            summary:
              "Where is a motion, in the mover or in the moved? Aristotle answers that it is in the moved. The motion is the fulfilment of the movable's potential, brought about by what can cause motion. The actuality of the mover is not something other than the actuality of the movable. A thing can move another because it is able to; it is a mover because it actually does so; but it acts on the movable. So there is a single actuality of both, as the interval from one to two is the same as from two to one, and the road uphill is the road downhill. Teaching and learning, he adds, are one activity, though to be teaching is not the same as to be learning.",
            passage: {
              text: "A thing is capable of causing motion because it can do this, it is a mover because it actually does it. But it is on the movable that it is capable of acting. Hence there is a single actuality of both alike, just as one to two and two to one are the same interval, and the steep ascent and the steep descent are one",
              ref: "III.3, 202a",
            },
            terms: [
              { greek: "κινοῦν", translit: "kinoun", english: "mover", gloss: "What causes a motion." },
              { greek: "ἐνέργεια", translit: "energeia", english: "activity, actuality", gloss: "Being at work; here one activity shared by mover and moved." },
            ],
            checks: [
              {
                q: "What image does the passage use for the single actuality of mover and moved?",
                options: [
                  "A river and its banks",
                  "The steep ascent and the steep descent",
                  "A seed and a tree",
                  "Two hands clapping",
                ],
                answer: 1,
                why: "It compares the case to one to two and two to one, and to the steep ascent and the steep descent being one.",
              },
              {
                q: "On what, according to the passage, is the mover capable of acting?",
                options: ["On itself", "On the movable", "On time", "On the void"],
                answer: 1,
                why: "The passage says: it is on the movable that it is capable of acting.",
              },
            ],
            journal: "Think of something you taught someone: was your teaching a separate act from their learning, or one activity seen from two sides?",
          },
          {
            id: "the-infinite-is-potential",
            title: "The infinite exists only potentially",
            bekker: "206a9-207a32",
            minutes: 6,
            summary:
              "There are reasons to think the infinite exists: time seems endless, magnitudes can be divided without end, and numbers never stop. Yet Aristotle has argued that no body is actually infinite. His solution is that the infinite exists potentially. But 'potential' here does not mean what it means for a statue, which will one day be actual. The infinite is like a day or the Olympic games: it is, in the sense that one thing after another keeps coming into being. Then he reverses the common view. The infinite is not what has nothing outside it; it is what always has something outside it. What has nothing outside it is whole and complete, which the infinite never is.",
            passage: {
              text: "But the phrase 'potential existence' is ambiguous. When we speak of the potential existence of a statue we mean that there will be an actual statue. It is not so with the infinite. There will not be an actual infinite. The word 'is' has many senses, and we say that the infinite 'is' in the sense in which we say 'it is day' or 'it is the games', because one thing after another is always coming into existence.",
              ref: "III.6, 206a18-24",
            },
            terms: [
              { greek: "ἄπειρον", translit: "apeiron", english: "infinite, unlimited", gloss: "What always has something outside it; never complete." },
            ],
            checks: [
              {
                q: "How is the infinite's potential existence unlike a statue's?",
                options: [
                  "There will one day be an actual infinite",
                  "There will not be an actual infinite",
                  "The infinite is made of bronze",
                  "The statue never becomes actual",
                ],
                answer: 1,
                why: "The passage contrasts the statue, which will be actual, with the infinite: there will not be an actual infinite.",
              },
              {
                q: "To what does Aristotle compare the way the infinite 'is'?",
                options: ["A stone", "'It is day' or 'it is the games'", "A circle", "A number already counted"],
                answer: 1,
                why: "He says the infinite 'is' in the sense in which we say 'it is day' or 'it is the games', because one thing after another keeps coming.",
              },
              {
                q: "In the summary, how does Aristotle reverse the common view of the infinite?",
                options: [
                  "It is what has nothing outside it",
                  "It is what always has something outside it",
                  "It is a complete whole",
                  "It is a kind of place",
                ],
                answer: 1,
                why: "He says it is not what has nothing outside it, but what always has something outside it.",
              },
            ],
            journal: "What in your life is infinite only in Aristotle's sense, always one more and never finished?",
          },
        ],
      },
      {
        id: "book-4",
        title: "Book IV: Place, void and time",
        bekker: "208a-223b",
        line: "Book IV asks what place is, argues that there is no void, and defines time as the number of motion.",
        lessons: [
          {
            id: "place-is-a-boundary",
            title: "Place is the boundary of what contains",
            bekker: "210b32-212a30",
            minutes: 6,
            summary:
              "Aristotle considers four candidates for place: a thing's shape, its matter, an interval between the containing surfaces, or the boundary of the containing body. Shape and matter belong to the thing and move with it, but place can be left behind. The interval view fails too. So place is the boundary of what contains. But a boat on a river is contained by moving water. Aristotle answers that place must be motionless, like a vessel that cannot be carried about. So the whole river, which as a whole stays put, is the boat's place rather than the water flowing past it. His definition: place is the innermost motionless boundary of what contains.",
            passage: {
              text: "Just, in fact, as the vessel is transportable place, so place is a non-portable vessel. So when what is within a thing which is moved, is moved and changes its place, as a boat on a river, what contains plays the part of a vessel rather than that of place. Place on the other hand is rather what is motionless: so it is rather the whole river that is place, because as a whole it is motionless. Hence we conclude that the innermost motionless boundary of what contains is place.",
              ref: "IV.4, 212a14-21",
            },
            terms: [
              { greek: "τόπος", translit: "topos", english: "place", gloss: "The innermost motionless boundary of what contains a body." },
              { greek: "πέρας", translit: "peras", english: "limit, boundary", gloss: "The edge at which a thing ends." },
            ],
            checks: [
              {
                q: "In the boat example, what is the boat's place?",
                options: ["The water flowing past it", "The whole river", "The boat's own shape", "The air above it"],
                answer: 1,
                why: "The passage says it is rather the whole river that is place, because as a whole it is motionless.",
              },
              {
                q: "How does the passage relate a vessel to place?",
                options: [
                  "A vessel is transportable place; place is a non-portable vessel",
                  "A vessel and place are the same thing",
                  "Place is a kind of matter inside the vessel",
                  "A vessel has no place",
                ],
                answer: 0,
                why: "It says: as the vessel is transportable place, so place is a non-portable vessel.",
              },
            ],
            journal: "What is the motionless boundary that holds you, the 'whole river' in which your days move?",
          },
          {
            id: "there-is-no-void",
            title: "There is no void",
            bekker: "214b12-216a26",
            minutes: 5,
            summary:
              "The atomists held that motion needs empty space. Aristotle argues the opposite: a void would make motion impossible to explain. In a void there would be no natural directions, since a void has no differences, so nothing would move up rather than down. Speed depends on the resistance of the medium, and a void offers none, so motion through it would have no ratio to any other motion. And no one could say why a thing set moving in a void should stop anywhere rather than anywhere else: it would rest or move forever unless something stronger got in its way. Readers often note that this last point anticipates the principle of inertia, which Aristotle takes as absurd.",
            passage: {
              text: "Further, no one could say why a thing once set in motion should stop anywhere; for why should it stop here rather than here? So that a thing will either be at rest or must be moved ad infinitum, unless something more powerful get in its way.",
              ref: "IV.8, 215a19-22",
            },
            terms: [
              { greek: "κενόν", translit: "kenon", english: "void", gloss: "Empty space with no body in it, which Aristotle denies." },
            ],
            checks: [
              {
                q: "According to the passage, what would a thing set in motion in a void do?",
                options: [
                  "Stop as soon as the push ended",
                  "Be at rest or be moved ad infinitum, unless something more powerful got in its way",
                  "Return to its natural place",
                  "Move in a circle",
                ],
                answer: 1,
                why: "The passage says it will either be at rest or must be moved ad infinitum, unless something more powerful get in its way.",
              },
              {
                q: "Does Aristotle use this point to show that a void exists?",
                options: [
                  "Yes, it proves the void",
                  "No, he uses it as one reason why there is no void",
                  "He leaves the question open",
                  "He says the void is a kind of place",
                ],
                answer: 1,
                why: "The argument belongs to his case that there is no void: motion in it could not be explained.",
              },
            ],
            journal: "What would you keep doing forever, if nothing stronger ever got in the way?",
          },
          {
            id: "time-is-the-number-of-motion",
            title: "Time is the number of motion",
            bekker: "218b21-220a26",
            minutes: 6,
            summary:
              "Time is not motion, since motion is fast or slow and is only in the thing moving, while time is everywhere alike and fast and slow are defined by it. But time is not without motion either. When we notice no change in our minds, as the sleepers in the old story, no time seems to have passed. We notice time when we mark a before and an after in a motion. So time is the number of motion in respect of before and after. It is number in the sense of what is counted, not what we count with. The 'now' divides and joins time, as a point divides and joins a line.",
            passage: {
              text: "When, therefore, we perceive the 'now' one, and neither as before and after in a motion nor as an identity but in relation to a 'before' and an 'after', no time is thought to have elapsed, because there has been no motion either. On the other hand, when we do perceive a 'before' and an 'after', then we say that there is time. For time is just this-number of motion in respect of 'before' and 'after'.",
              ref: "IV.11, 219a30-b2",
            },
            terms: [
              { greek: "χρόνος", translit: "chronos", english: "time", gloss: "The number of motion with respect to before and after." },
              { greek: "νῦν", translit: "nyn", english: "now", gloss: "The present instant, which divides and joins past and future." },
              { greek: "ἀριθμός", translit: "arithmos", english: "number", gloss: "Here what is counted, not that with which we count." },
            ],
            checks: [
              {
                q: "How does the passage define time?",
                options: [
                  "The motion of the heavens",
                  "Number of motion in respect of 'before' and 'after'",
                  "A series of indivisible nows",
                  "Whatever a clock shows",
                ],
                answer: 1,
                why: "The passage ends: time is just this, number of motion in respect of 'before' and 'after'.",
              },
              {
                q: "When do we say there is time?",
                options: [
                  "When we perceive a 'before' and an 'after'",
                  "Only when the sun moves",
                  "When nothing changes",
                  "Only when we count aloud",
                ],
                answer: 0,
                why: "The passage says: when we do perceive a 'before' and an 'after', then we say that there is time.",
              },
            ],
            journal: "When did time last seem to stop for you, and what had stopped changing then?",
          },
        ],
      },
      {
        id: "book-5",
        title: "Book V: Kinds of change",
        bekker: "224a-231a",
        line: "Book V sorts changes by their terms and defines the words for how things stand to one another in space.",
        lessons: [
          {
            id: "three-kinds-of-change",
            title: "Change runs between opposites",
            bekker: "224a21-225b9",
            minutes: 5,
            summary:
              "Every change, as the Greek word metabolē says, is from something to something. Aristotle counts four possible pairs of terms: from subject to subject, from subject to non-subject, from non-subject to subject, and from non-subject to non-subject, where 'subject' means what is affirmed. The last is not change, because the two terms are not opposed at all. So there are three kinds. Change from non-subject to subject is coming to be; from subject to non-subject is passing away. Change from subject to subject, between contraries, is motion in the strict sense. He goes on to show that motion in this strict sense occurs only in quality, quantity and place.",
            passage: {
              text: "that which changes must change in one of four ways: from subject to subject, from subject to nonsubject, from non-subject to subject, or from non-subject to non-subject, where by 'subject' I mean what is affirmatively expressed.",
              ref: "V.1, 225a",
            },
            terms: [
              { greek: "μεταβολή", translit: "metabolē", english: "change", gloss: "Any passage from one term to another; motion is one kind." },
              { greek: "γένεσις", translit: "genesis", english: "coming to be", gloss: "Change from non-subject to subject." },
            ],
            checks: [
              {
                q: "What does Aristotle mean by 'subject' in the passage?",
                options: ["What is affirmatively expressed", "A person who obeys", "The matter of a thing", "Whatever is in motion"],
                answer: 0,
                why: "The passage ends: by 'subject' I mean what is affirmatively expressed.",
              },
              {
                q: "Why is the fourth pair, from non-subject to non-subject, not a change?",
                options: [
                  "Because it is too slow",
                  "Because its two terms are not opposed",
                  "Because it happens only in the heavens",
                  "Because it is the same as coming to be",
                ],
                answer: 1,
                why: "As the summary says, there is no opposition between the two terms, so there is no change.",
              },
            ],
            journal: "What change in your life was really a coming to be, and what was only a movement between contraries?",
          },
          {
            id: "continuous-contiguous-in-succession",
            title: "Continuous, contiguous, in succession",
            bekker: "226b18-227b2",
            minutes: 5,
            summary:
              "To discuss motion precisely Aristotle defines a set of spatial words. Things are together in place when they are in one primary place, and in contact when their extremities are together. A thing is in succession to another when nothing of the same kind lies between them. Contiguous means in succession and touching. Continuous is a kind of contiguous: the touching limits of each become one and the same. So continuity belongs to things that by their contact naturally form a unity, held together by a rivet, glue, contact or organic union. These definitions do work in Book VI, where they show that nothing continuous can be made of indivisible parts.",
            passage: {
              text: "A thing that is in succession and touches is 'contiguous'. The 'continuous' is a subdivision of the contiguous: things are called continuous when the touching limits of each become one and the same and are, as the word implies, contained in each other: continuity is impossible if these extremities are two.",
              ref: "V.3, 227a",
            },
            terms: [
              { greek: "συνεχές", translit: "synechēs", english: "continuous", gloss: "Held together so that the touching limits are one and the same." },
              { greek: "ἐχόμενον", translit: "echomenon", english: "contiguous", gloss: "In succession and touching." },
              { greek: "ἁφή", translit: "haphē", english: "contact", gloss: "Having extremities together." },
            ],
            checks: [
              {
                q: "When are things called continuous?",
                options: [
                  "When nothing of their kind lies between them",
                  "When the touching limits of each become one and the same",
                  "When they are in the same place",
                  "When they move together",
                ],
                answer: 1,
                why: "The passage says things are continuous when the touching limits of each become one and the same.",
              },
              {
                q: "What does 'contiguous' mean in the passage?",
                options: ["In succession and touching", "Far apart", "Made of the same matter", "Fused into one"],
                answer: 0,
                why: "It says: a thing that is in succession and touches is 'contiguous'.",
              },
            ],
            journal: "Which of your relationships are continuous, sharing one boundary, and which are only contiguous?",
          },
        ],
      },
      {
        id: "book-6",
        title: "Book VI: The continuous and Zeno",
        bekker: "231a-241b",
        line: "Book VI shows that magnitude, time and motion are continuous and not built from indivisibles, and answers Zeno's paradoxes.",
        lessons: [
          {
            id: "no-line-is-made-of-points",
            title: "No line is made of points",
            bekker: "231a21-231b18",
            minutes: 5,
            summary:
              "Using the definitions from Book V, Aristotle argues that nothing continuous can be composed of indivisibles. A line cannot be made of points. Points have no parts, so they have no extremities distinct from the rest of them. Their extremities cannot be one, as continuity would need, nor even together, as contact would need. And points cannot be in succession either, since between any two points there is always a line. So every continuous thing is divisible into parts that are themselves always divisible. The same holds for magnitude, time and motion together: if one were made of indivisibles, the others would be too.",
            passage: {
              text: "nothing that is continuous can be composed 'of indivisibles': e.g. a line cannot be composed of points, the line being continuous and the point indivisible. For the extremities of two points can neither be one (since of an indivisible there can be no extremity as distinct from some other part) nor together (since that which has no parts can have no extremity, the extremity and the thing of which it is the extremity being distinct).",
              ref: "VI.1, 231a",
            },
            terms: [
              { greek: "ἀδιαίρετον", translit: "adiaireton", english: "indivisible", gloss: "What has no parts, like a point." },
              { greek: "στιγμή", translit: "stigmē", english: "point", gloss: "An indivisible with position; the limit of a line, not its part." },
            ],
            checks: [
              {
                q: "Why can two points not be continuous with each other?",
                options: [
                  "Because points are too small to see",
                  "Because an indivisible has no extremity distinct from another part, so their extremities cannot be one",
                  "Because points always move",
                  "Because there are too many of them",
                ],
                answer: 1,
                why: "The passage says the extremities of two points cannot be one, since of an indivisible there can be no extremity distinct from some other part.",
              },
              {
                q: "What example does the passage give of something continuous?",
                options: ["A point", "A line", "A number", "A heap"],
                answer: 1,
                why: "It gives the line as continuous and the point as indivisible.",
              },
            ],
            journal: "Is your life made of separate moments, or is each moment only a limit on something continuous?",
          },
          {
            id: "zenos-paradoxes",
            title: "Zeno's paradoxes",
            bekker: "239b5-240b7",
            minutes: 6,
            summary:
              "Aristotle sets out Zeno's four arguments against motion. The dichotomy says a runner must reach the half-way point before the goal, and so on without end. Achilles can never catch the tortoise, since he must first reach where it was. The arrow is at rest, since at each moment it occupies a space equal to itself. The moving rows says half a time equals its double. Aristotle replies that the first two rest on treating a continuous distance as an actual infinity of parts that must be counted out in a finite time; time is divisible in the same way. The arrow fails because time is not composed of indivisible moments, any more than a line is of points.",
            passage: {
              text: "Zeno's reasoning, however, is fallacious, when he says that if everything when it occupies an equal space is at rest, and if that which is in locomotion is always occupying such a space at any moment, the flying arrow is therefore motionless. This is false, for time is not composed of indivisible moments any more than any other magnitude is composed of indivisibles.",
              ref: "VI.9, 239b5-9",
            },
            terms: [
              { greek: "παραλογισμός", translit: "paralogismos", english: "fallacy", gloss: "An argument that seems valid but is not." },
              { greek: "νῦν", translit: "nyn", english: "now, moment", gloss: "A limit of time, not a part of it." },
            ],
            checks: [
              {
                q: "Why does Aristotle say the arrow argument is false?",
                options: [
                  "Because arrows move too fast to measure",
                  "Because time is not composed of indivisible moments",
                  "Because Zeno never saw an arrow",
                  "Because space is a void",
                ],
                answer: 1,
                why: "The passage says this is false, for time is not composed of indivisible moments.",
              },
              {
                q: "What does Zeno conclude about the flying arrow?",
                options: ["It is motionless", "It moves in a circle", "It never existed", "It is always speeding up"],
                answer: 0,
                why: "The passage reports his conclusion that the flying arrow is therefore motionless.",
              },
            ],
            journal: "Where have you talked yourself out of starting something by dividing it into endless steps?",
          },
        ],
      },
      {
        id: "book-7",
        title: "Book VII: Everything moved is moved by something",
        bekker: "241b-250b",
        line: "Book VII argues that every motion has a mover, that the chain of movers must stop at a first, and that mover and moved are in contact.",
        lessons: [
          {
            id: "the-series-of-movers-must-stop",
            title: "The chain of movers must stop",
            bekker: "241b34-242b53",
            minutes: 5,
            summary:
              "Everything in motion is moved by something. If it is moved by another thing that is itself in motion, and that by another, the series cannot go on to infinity. Aristotle's argument is that the motions of all the members happen at the same time, since mover and moved move together. An infinite series of such motions would add up to an infinite motion in a finite time, which is impossible. So there must be a first mover. This book reads as a first attempt at arguments Book VIII makes more carefully, and it survives in two versions in the manuscripts.",
            passage: {
              text: "Since everything that is in motion must be moved by something, let us take the case in which a thing is in locomotion and is moved by something that is itself in motion, and that again is moved by something else that is in motion, and that by something else, and so on continually: then the series cannot go on to infinity, but there must be some first movent.",
              ref: "VII.1, 242a",
            },
            terms: [
              { greek: "τὸ πρῶτον κινοῦν", translit: "to prōton kinoun", english: "the first mover", gloss: "The mover at the head of a series, not moved by another in it." },
            ],
            checks: [
              {
                q: "What does the passage conclude about a series of moved movers?",
                options: [
                  "It goes on to infinity",
                  "It cannot go on to infinity, and there must be some first movent",
                  "It forms a circle",
                  "It has no members",
                ],
                answer: 1,
                why: "The passage concludes that the series cannot go on to infinity, but there must be some first movent.",
              },
              {
                q: "What does the passage take as its starting assumption?",
                options: [
                  "Some things move without any cause",
                  "Everything that is in motion must be moved by something",
                  "Only animals move",
                  "Motion is an illusion",
                ],
                answer: 1,
                why: "It begins: since everything that is in motion must be moved by something.",
              },
            ],
            journal: "Trace one of your choices back through its causes: where does the chain seem to stop?",
          },
          {
            id: "mover-and-moved-are-together",
            title: "Mover and moved are together",
            bekker: "243a3-245b2",
            minutes: 5,
            summary:
              "The first mover of a thing, in the sense of the source of its motion, is always together with what it moves: nothing lies between them. Aristotle checks this for each kind of motion, starting with locomotion, the primary one. Things that move themselves contain their mover, so the point is plain. Things moved by another are moved in one of four ways: pulling, pushing, carrying and twirling, and every kind of locomotion reduces to these. In each, the mover touches the moved. He then shows the same for alteration and for growth.",
            passage: {
              text: "Let us begin with locomotion, for this is the primary motion. Everything that is in locomotion is moved either by itself or by something else. In the case of things that are moved by themselves it is evident that the moved and the movent are together: for they contain within themselves their first movent, so that there is nothing in between.",
              ref: "VII.2, 243a",
            },
            terms: [
              { greek: "φορά", translit: "phora", english: "locomotion", gloss: "Motion from place to place, the primary kind." },
              { greek: "ἅμα", translit: "hama", english: "together", gloss: "With nothing in between." },
            ],
            checks: [
              {
                q: "Why are mover and moved together in things moved by themselves?",
                options: [
                  "Because they contain their first movent within themselves",
                  "Because they are very small",
                  "Because they move in circles",
                  "Because they never touch anything",
                ],
                answer: 0,
                why: "The passage says they contain within themselves their first movent, so that there is nothing in between.",
              },
              {
                q: "Which motion does the passage call primary?",
                options: ["Alteration", "Growth", "Locomotion", "Coming to be"],
                answer: 2,
                why: "It begins: let us begin with locomotion, for this is the primary motion.",
              },
            ],
            journal: "What moves you most directly, with nothing in between?",
          },
        ],
      },
      {
        id: "book-8",
        title: "Book VIII: The eternal motion and the first mover",
        bekker: "250b-267b",
        line: "Book VIII argues that motion never began or ends and that it depends on a first mover that is unmoved, eternal and without magnitude.",
        lessons: [
          {
            id: "motion-always-was",
            title: "Motion always was and always will be",
            bekker: "250b11-252b6",
            minutes: 6,
            summary:
              "Aristotle asks whether motion ever came to be or will cease, or whether it always was and always will be, a kind of life in all natural things. He argues that it is everlasting. Motion is the actuality of the movable, so movable things must exist before any motion. If they came to be, that coming to be was itself a motion before the first motion. If they always existed at rest, something must have changed to start them moving, and that change was a motion before the first. Time also points the same way: there is no time without a now, and every now is a middle between before and after, so time, and motion with it, has no first moment.",
            passage: {
              text: "It remains to consider the following question. Was there ever a becoming of motion before which it had no being, and is it perishing again so as to leave nothing in motion? Or are we to say that it never had any becoming and is not perishing, but always was and always will be? Is it in fact an immortal never-failing property of things that are, a sort of life as it were to all naturally constituted things?",
              ref: "VIII.1, 250b11-15",
            },
            terms: [
              { greek: "ἀΐδιος", translit: "aidios", english: "everlasting", gloss: "Always existing, without beginning or end." },
              { greek: "κίνησις", translit: "kinēsis", english: "motion", gloss: "Here the motion of the whole world, which Aristotle holds never began." },
            ],
            checks: [
              {
                q: "What does the passage suggest motion might be to natural things?",
                options: ["A disease", "A sort of life", "An illusion", "A punishment"],
                answer: 1,
                why: "It asks whether motion is a sort of life as it were to all naturally constituted things.",
              },
              {
                q: "Which conclusion does Aristotle reach in this chapter?",
                options: [
                  "Motion began at a first moment",
                  "Motion always was and always will be",
                  "Motion will one day cease",
                  "Motion exists only in animals",
                ],
                answer: 1,
                why: "As the summary says, he argues that motion is everlasting, since any first motion would need a motion before it.",
              },
            ],
            journal: "What in your life has felt less like something you started and more like something you joined, already moving?",
          },
          {
            id: "an-unmoved-first-mover",
            title: "There must be an unmoved first mover",
            bekker: "258b10-260a19",
            minutes: 6,
            summary:
              "Since motion is continuous and never fails, something must first impart it, and that first mover must be unmoved. Aristotle grants that some unmoved movers, such as the souls of animals, may come and go. But their coming and going cannot explain why change goes on forever without a break. That requires something that comprehends them all, apart from each of them, and that is eternal and always the same. Because it is unchanging, it causes one simple, unvarying motion. Things moved by it directly, he says, are always in motion; things moved through changing intermediaries are sometimes moving and sometimes at rest.",
            passage: {
              text: "Since there must always be motion without intermission, there must necessarily be something, one thing or it may be a plurality, that first imparts motion, and this first movent must be unmoved.",
              ref: "VIII.6, 258b10-12",
            },
            terms: [
              { greek: "ἀκίνητον", translit: "akinēton", english: "unmoved", gloss: "Not itself in motion, even while it causes motion." },
              { greek: "τὸ πρῶτον κινοῦν", translit: "to prōton kinoun", english: "the first mover", gloss: "The source of the world's everlasting motion." },
            ],
            checks: [
              {
                q: "Why must there be a first mover, according to the passage?",
                options: [
                  "Because motion sometimes stops",
                  "Because there must always be motion without intermission",
                  "Because the gods demand it",
                  "Because the void requires one",
                ],
                answer: 1,
                why: "The passage begins: since there must always be motion without intermission, there must be something that first imparts motion.",
              },
              {
                q: "Does the passage commit to exactly one first mover?",
                options: [
                  "Yes, it says there is exactly one",
                  "No, it says one thing or it may be a plurality",
                  "No, it says there are none",
                  "Yes, and it names it Zeus",
                ],
                answer: 1,
                why: "It leaves this open here: 'one thing or it may be a plurality'.",
              },
            ],
            journal: "Is there something in your life that stays the same and so keeps the rest of it moving?",
          },
          {
            id: "the-first-mover-has-no-magnitude",
            title: "The first mover has no parts or size",
            bekker: "266a10-267b26",
            minutes: 5,
            summary:
              "In the last chapter Aristotle argues that the first mover has no parts and no magnitude. He has shown that a finite magnitude cannot have an infinite power, and that nothing can move a thing for an infinite time by a finite power. He has also shown, in Book III, that there is no infinite magnitude. But the first mover causes an eternal motion over infinite time. So it cannot be a magnitude of either kind. It is indivisible, without parts and without size. He ends by placing it at the circumference of the world, where motion is fastest.",
            passage: {
              text: "But the first movent causes a motion that is eternal and does cause it during an infinite time. It is clear, therefore, that the first movent is indivisible and is without parts and without magnitude.",
              ref: "VIII.10, 267b",
            },
            terms: [
              { greek: "μέγεθος", translit: "megethos", english: "magnitude", gloss: "Size; extension in space." },
              { greek: "ἀμερές", translit: "ameres", english: "without parts", gloss: "Having no parts into which it could be divided." },
            ],
            checks: [
              {
                q: "What follows, in the passage, from the first mover causing motion for infinite time?",
                options: [
                  "It is very large",
                  "It is indivisible and without parts and without magnitude",
                  "It must be made of fire",
                  "It must itself be moving",
                ],
                answer: 1,
                why: "The passage concludes that the first movent is indivisible and is without parts and without magnitude.",
              },
              {
                q: "Why can the first mover not be a finite magnitude?",
                options: [
                  "A finite magnitude cannot have the infinite power needed for eternal motion",
                  "A finite magnitude would be too heavy",
                  "Finite things cannot exist",
                  "It would be visible",
                ],
                answer: 0,
                why: "As the summary says, he has shown a finite magnitude cannot have an infinite power, yet the first mover moves for infinite time.",
              },
            ],
            journal: "What has power over you that has no size at all, like an idea or a love?",
          },
        ],
      },
    ],
  },
  {
    id: "on-the-heavens",
    title: "On the Heavens",
    greek: "Περὶ οὐρανοῦ",
    latin: "De Caelo",
    subject: "nature",
    level: "Intermediate",
    bekker: "268a-313b",
    about:
      "Aristotle's cosmology: the heavens are made of a fifth body that moves in circles and never changes, the earth is a sphere at rest in the middle, and the four elements below the moon move up or down to their natural places. It was the standard picture of the universe in Europe and the Islamic world for nearly two thousand years.",
    before: ["physics"],
    caveat: "",
    translation: {
      translator: "J. L. Stocks",
      year: 1922,
      title: "De Caelo (The Works of Aristotle, vol. II)",
      url: "https://classics.mit.edu/Aristotle/heavens.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: The first body and the one heaven",
        bekker: "268a-283b",
        line: "Book I argues for a fifth simple body that moves in a circle and shows that the heaven is one, finite, ungenerated and indestructible.",
        lessons: [
          {
            id: "a-body-that-moves-in-a-circle",
            title: "A body that moves in a circle",
            bekker: "268b11-269b17",
            minutes: 6,
            summary:
              "Simple bodies, Aristotle says, have a principle of movement in their own nature, and simple movements belong to simple bodies. There are two simple movements: straight, either toward or away from the centre, and circular. Earth moves to the centre and fire away from it. But circular movement is simple too, so there must be a simple body whose natural movement is circular. It is different from the four elements below and prior to them, since the circle is complete and the straight line is not. This first body is what the heavens are made of.",
            passage: {
              text: "Supposing, then, that there is such a thing as simple movement, and that circular movement is an instance of it, and that both movement of a simple body is simple and simple movement is of a simple body (for if it is movement of a compound it will be in virtue of a prevailing simple element), then there must necessarily be some simple body which revolves naturally and in virtue of its own nature with a circular movement.",
              ref: "I.2, 268b-269a",
            },
            terms: [
              { greek: "κύκλῳ φορά", translit: "kyklōi phora", english: "circular movement", gloss: "Movement around a centre, which never reaches an end." },
              { greek: "ἁπλοῦν σῶμα", translit: "haploun sōma", english: "simple body", gloss: "An element, with its own natural movement." },
            ],
            checks: [
              {
                q: "What does the passage conclude must exist?",
                options: [
                  "A void beyond the heavens",
                  "A simple body that revolves naturally with a circular movement",
                  "A fifth kind of straight motion",
                  "An infinite body",
                ],
                answer: 1,
                why: "It concludes there must be some simple body which revolves naturally and in virtue of its own nature with a circular movement.",
              },
              {
                q: "Which pairing does the argument rely on?",
                options: [
                  "Simple movement belongs to a simple body",
                  "Every body moves in a circle",
                  "Compounds have no movement",
                  "Fire moves in a circle",
                ],
                answer: 0,
                why: "The passage assumes that movement of a simple body is simple and simple movement is of a simple body.",
              },
            ],
            journal: "Is there a pattern in your life that returns on itself like a circle, never reaching an end and never needing one?",
          },
          {
            id: "the-unchanging-heaven",
            title: "The heaven does not age or change",
            bekker: "269b18-270b31",
            minutes: 5,
            summary:
              "The first body has no contrary, since circular movement has no contrary motion. What has no contrary does not come to be or perish, so this body is ungenerated and indestructible, and it neither grows nor alters. Aristotle says this agrees with experience and with common belief. Everyone who believes in gods gives the highest place to the divine, linking the immortal with the immortal. And in all recorded time no change has been seen in the outermost heaven or its parts. The old name aither, he says, comes from 'running always'; he faults Anaxagoras for using it to mean fire.",
            passage: {
              text: "For in the whole range of time past, so far as our inherited records reach, no change appears to have taken place either in the whole scheme of the outermost heaven or in any of its proper parts.",
              ref: "I.3, 270b13-16",
            },
            terms: [
              { greek: "αἰθήρ", translit: "aithēr", english: "ether", gloss: "The first body of the heavens; Aristotle derives the name from 'running always'." },
              { greek: "ἀγένητον", translit: "agenēton", english: "ungenerated", gloss: "Never having come to be." },
            ],
            checks: [
              {
                q: "What evidence does the passage give that the heavens do not change?",
                options: [
                  "A mathematical proof",
                  "In all recorded time no change appears in the outermost heaven or its parts",
                  "The heavens are too far away to see",
                  "The gods said so",
                ],
                answer: 1,
                why: "The passage cites inherited records: no change appears to have taken place in the outermost heaven or any of its parts.",
              },
              {
                q: "Why is the first body ungenerated, according to the summary?",
                options: [
                  "It has no contrary",
                  "It is very old",
                  "It is made of fire",
                  "It is at the centre",
                ],
                answer: 0,
                why: "Circular movement has no contrary, and what has no contrary does not come to be or perish.",
              },
            ],
            journal: "What in your life looks unchanging only because your records do not reach back far enough?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: The heaven, the stars and the earth",
        bekker: "283b-298a",
        line: "Book II treats the heaven's shape and motion, the stars, and the earth's position, rest and shape.",
        lessons: [
          {
            id: "the-earth-at-the-centre",
            title: "The earth is at the centre",
            bekker: "293a15-294a10",
            minutes: 5,
            summary:
              "Most people, Aristotle says, place the earth at the centre. The Pythagoreans disagree: they put fire at the centre, make the earth one of the stars circling it to produce night and day, and add a counter-earth. He criticises their method. They are not seeking theories to explain what is observed, but forcing observations to fit theories of their own. Some reason that the most precious place belongs to the most precious thing, fire. Aristotle replies that the centre of a magnitude is not the same as the natural centre, and goes on to argue that the earth rests at the centre of the whole.",
            passage: {
              text: "But the Italian philosophers known as Pythagoreans take the contrary view. At the centre, they say, is fire, and the earth is one of the stars, creating night and day by its circular motion about the centre. They further construct another earth in opposition to ours to which they give the name counterearth. In all this they are not seeking for theories and causes to account for observed facts, but rather forcing their observations and trying to accommodate them to certain theories and opinions of their own.",
              ref: "II.13, 293a20-27",
            },
            terms: [
              { greek: "ἀντίχθων", translit: "antichthōn", english: "counter-earth", gloss: "A second earth the Pythagoreans placed opposite ours." },
              { greek: "μέσον", translit: "meson", english: "centre, middle", gloss: "The middle of the universe, toward which heavy bodies move." },
            ],
            checks: [
              {
                q: "What do the Pythagoreans place at the centre?",
                options: ["The earth", "Fire", "The moon", "Water"],
                answer: 1,
                why: "The passage says: at the centre, they say, is fire.",
              },
              {
                q: "What is Aristotle's complaint about their method?",
                options: [
                  "They rely too much on observation",
                  "They force observations to fit their own theories",
                  "They refuse to use numbers",
                  "They copy the Egyptians",
                ],
                answer: 1,
                why: "He says they are not seeking theories to account for observed facts, but forcing their observations to fit their own theories.",
              },
            ],
            journal: "Where have you bent what you saw to fit what you already believed?",
          },
          {
            id: "the-earth-is-a-sphere",
            title: "The earth is a sphere",
            bekker: "297a8-298a20",
            minutes: 6,
            summary:
              "Aristotle argues that the earth is spherical. Heavy parts moving to the centre from all sides would gather into a sphere, and heavy bodies fall at equal angles rather than in parallel. The senses agree. In eclipses of the moon the edge of the shadow is always curved, and since the earth's interposition causes the eclipse, the earth's surface must be spherical. And a short journey north or south changes which stars are overhead; some stars seen in Egypt and Cyprus are not seen further north. So the earth is not only round but not very large. He reports that mathematicians put its circumference at 400,000 stades.",
            passage: {
              text: "How else would eclipses of the moon show segments shaped as we see them? As it is, the shapes which the moon itself each month shows are of every kind straight, gibbous, and concave-but in eclipses the outline is always curved: and, since it is the interposition of the earth that makes the eclipse, the form of this line will be caused by the form of the earth's surface, which is therefore spherical.",
              ref: "II.14, 297b23-30",
            },
            terms: [
              { greek: "σφαιροειδής", translit: "sphairoeidēs", english: "spherical", gloss: "Shaped like a ball." },
              { greek: "ἔκλειψις", translit: "ekleipsis", english: "eclipse", gloss: "The darkening of the moon or sun when a body passes between." },
            ],
            checks: [
              {
                q: "What feature of lunar eclipses shows the earth is spherical?",
                options: [
                  "They happen every month",
                  "The outline of the shadow is always curved",
                  "The moon turns red",
                  "They last a long time",
                ],
                answer: 1,
                why: "The passage says that in eclipses the outline is always curved, and the earth causes the eclipse.",
              },
              {
                q: "How does this differ from the moon's monthly phases, in the passage?",
                options: [
                  "The phases show shapes of every kind, the eclipse only a curve",
                  "The phases are always curved too",
                  "The phases are caused by the earth",
                  "There is no difference",
                ],
                answer: 0,
                why: "The passage contrasts the monthly shapes, straight, gibbous and concave, with the always curved outline in eclipses.",
              },
            ],
            journal: "What everyday sight could show you something large about the world, if you looked at it as carefully as Aristotle looked at an eclipse?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: Coming to be and the elements",
        bekker: "298a-307b",
        line: "Book III asks whether there is coming to be at all, criticises building bodies from planes, and asks what an element is.",
        lessons: [
          {
            id: "is-there-coming-to-be",
            title: "Is there coming to be at all?",
            bekker: "298b6-300a19",
            minutes: 5,
            summary:
              "Having treated the first body, which does not come to be, Aristotle turns to the elements below, where coming to be happens if anywhere. Earlier thinkers disagreed. Melissus and Parmenides denied coming to be altogether; they may have seen rightly that knowledge needs unchanging things, but wrongly transferred this to things perceived, so they do not speak as students of nature. Hesiod and the early physicists made everything come to be. Others, as in Plato's Timaeus, build bodies out of planes. Aristotle says this last view conflicts with mathematics, and with the result of the Physics that there is no indivisible length.",
            passage: {
              text: "Nothing that is, they said, is generated or destroyed, and our conviction to the contrary is an illusion. So maintained the school of Melissus and Parmenides. But however excellent their theories may otherwise be, anyhow they cannot be held to speak as students of nature. There may be things not subject to generation or any kind of movement, but if so they belong to another and a higher inquiry than the study of nature.",
              ref: "III.1, 298b",
            },
            terms: [
              { greek: "γένεσις", translit: "genesis", english: "coming to be", gloss: "A thing's beginning to exist." },
              { greek: "φθορά", translit: "phthora", english: "passing away", gloss: "A thing's ceasing to exist." },
            ],
            checks: [
              {
                q: "Why does Aristotle say Melissus and Parmenides do not speak as students of nature?",
                options: [
                  "They studied only animals",
                  "They denied generation and destruction, which nature involves",
                  "They wrote in verse",
                  "They thought everything is water",
                ],
                answer: 1,
                why: "They held that nothing is generated or destroyed, and he says that view cannot be held to speak as students of nature.",
              },
              {
                q: "Where does the passage place things not subject to generation or movement, if there are any?",
                options: [
                  "In the study of nature",
                  "In another and higher inquiry",
                  "Among illusions",
                  "Inside the earth",
                ],
                answer: 1,
                why: "It says they belong to another and a higher inquiry than the study of nature.",
              },
            ],
            journal: "Which of your convictions would you defend even if someone called your experience an illusion?",
          },
          {
            id: "what-an-element-is",
            title: "What an element is",
            bekker: "302a10-302b9",
            minutes: 5,
            summary:
              "To know which bodies are elements, Aristotle first says what an element is. An element is a body into which other bodies can be analysed, present in them potentially or actually, and not itself divisible into bodies different in form. That, he says, is what everyone means by the word. So there must be such bodies: flesh and wood contain fire and earth potentially, as we see when these are given off from them, while fire is not composed of flesh or wood. He then argues that the elements are not infinite in number and not one, and that they come to be from one another.",
            passage: {
              text: "An element, we take it, is a body into which other bodies may be analysed, present in them potentially or in actuality (which of these, is still disputable), and not itself divisible into bodies different in form. That, or something like it, is what all men in every case mean by element.",
              ref: "III.3, 302a15-19",
            },
            terms: [
              { greek: "στοιχεῖον", translit: "stoicheion", english: "element", gloss: "A body other bodies analyse into, not itself divisible into bodies of another form." },
            ],
            checks: [
              {
                q: "Which feature belongs to an element, according to the passage?",
                options: [
                  "It cannot be divided into bodies different in form",
                  "It is always invisible",
                  "It is only in the heavens",
                  "It is made of triangles",
                ],
                answer: 0,
                why: "The passage says an element is not itself divisible into bodies different in form.",
              },
              {
                q: "What does Aristotle leave open in the definition?",
                options: [
                  "Whether elements are bodies",
                  "Whether elements are present in other bodies potentially or in actuality",
                  "Whether there are any elements",
                  "Whether flesh is a body",
                ],
                answer: 1,
                why: "He says they are present potentially or in actuality, and 'which of these, is still disputable'.",
              },
            ],
            journal: "What are the elements of your own character, the things you cannot break down any further?",
          },
        ],
      },
      {
        id: "book-4",
        title: "Book IV: Heavy and light",
        bekker: "307b-313b",
        line: "Book IV explains heavy and light as natural tendencies to move down to the centre or up to the extremity.",
        lessons: [
          {
            id: "heavy-and-light-without-qualification",
            title: "Heavy and light without qualification",
            bekker: "307b28-308a33",
            minutes: 5,
            summary:
              "Earlier thinkers spoke only of relative weight: of wood and bronze, one is lighter, the other heavier. Aristotle wants an absolute sense too. Some things by their constant nature move away from the centre, others toward it. Movement away from the centre is upward and toward it downward, and he rejects the view that there is no up or down in the heaven. So the absolutely light is what moves up to the extremity, like fire, and the absolutely heavy what moves down to the centre, like earth. The relatively light is the one of two weighted bodies, equal in bulk, that falls more slowly.",
            passage: {
              text: "By absolutely light, then, we mean that which moves upward or to the extremity, and by absolutely heavy that which moves downward or to the centre. By lighter or relatively light we mean that one, of two bodies endowed with weight and equal in bulk, which is exceeded by the other in the speed of its natural downward movement.",
              ref: "IV.1, 308a29-33",
            },
            terms: [
              { greek: "βαρύ", translit: "barys", english: "heavy", gloss: "Tending by nature to move down toward the centre." },
              { greek: "κοῦφον", translit: "kouphon", english: "light", gloss: "Tending by nature to move up toward the extremity." },
            ],
            checks: [
              {
                q: "What does the passage mean by 'absolutely light'?",
                options: [
                  "Whatever is smaller",
                  "That which moves upward or to the extremity",
                  "Whatever floats on water",
                  "That which has no weight at all and no movement",
                ],
                answer: 1,
                why: "It says: by absolutely light we mean that which moves upward or to the extremity.",
              },
              {
                q: "How does the passage define 'relatively light'?",
                options: [
                  "Of two bodies equal in bulk, the one slower in its natural downward movement",
                  "Any body that rises",
                  "A body made of fire",
                  "The larger of two bodies",
                ],
                answer: 0,
                why: "It is the one, of two weighted bodies equal in bulk, exceeded by the other in the speed of its downward movement.",
              },
            ],
            journal: "What in you tends upward and what tends downward, without anyone pushing?",
          },
          {
            id: "each-body-moves-to-its-own-place",
            title: "Each body moves to its own place",
            bekker: "310a14-311a14",
            minutes: 5,
            summary:
              "Why does fire rise and earth fall? Aristotle compares this motion with other changes: what can be healed moves toward health, what can grow toward its size. In the same way, what is potentially heavy or light moves to its own place, and that movement is a movement toward its own form. He reinterprets the old saying that like moves to like. If the earth were moved to where the moon is, its fragments would not move toward it but toward the place where it now is. So bodies move to their natural places, the centre and the extremity, not toward bodies like themselves.",
            passage: {
              text: "Now, that which produces upward and downward movement is that which produces weight and lightness, and that which is moved is that which is potentially heavy or light, and the movement of each body to its own place is motion towards its own form.",
              ref: "IV.3, 310a",
            },
            terms: [
              { greek: "οἰκεῖος τόπος", translit: "oikeios topos", english: "proper place", gloss: "The region to which a body naturally moves and where it rests." },
              { greek: "εἶδος", translit: "eidos", english: "form", gloss: "What a thing is when complete; here reaching one's own place." },
            ],
            checks: [
              {
                q: "What is the movement of each body to its own place, according to the passage?",
                options: ["Motion towards its own form", "Motion caused by the void", "A random motion", "Motion towards like bodies"],
                answer: 0,
                why: "The passage says the movement of each body to its own place is motion towards its own form.",
              },
              {
                q: "What would earth's fragments do if the earth were moved to where the moon is, according to the summary?",
                options: [
                  "Follow the earth to the moon",
                  "Move toward the place where the earth now is",
                  "Float in the air",
                  "Turn into fire",
                ],
                answer: 1,
                why: "He says they would move not toward the earth but to the place in which it now is.",
              },
            ],
            journal: "Where is your own place, the one you move toward when nothing holds you back?",
          },
        ],
      },
    ],
  },
  {
    id: "on-generation-and-corruption",
    title: "On Generation and Corruption",
    greek: "Περὶ γενέσεως καὶ φθορᾶς",
    latin: "De Generatione et Corruptione",
    subject: "nature",
    level: "Intermediate",
    bekker: "314a-338b",
    about:
      "A short treatise on coming to be and passing away: how it differs from alteration and growth, what mixture is, how the four elements arise from hot, cold, dry and moist, and why coming to be never stops. It links the Physics to the study of the elements in Meteorology and the biology.",
    before: ["physics"],
    caveat: "",
    translation: {
      translator: "H. H. Joachim",
      year: 1922,
      title: "De Generatione et Corruptione (The Works of Aristotle, vol. II)",
      url: "https://classics.mit.edu/Aristotle/gener_corr.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: Coming to be, alteration and mixture",
        bekker: "314a-328b",
        line: "Book I separates coming to be from alteration and growth and explains contact, action and mixture.",
        lessons: [
          {
            id: "coming-to-be-is-not-alteration",
            title: "Coming to be is not alteration",
            bekker: "319b6-320a7",
            minutes: 5,
            summary:
              "Some early thinkers held that all coming to be is alteration of one underlying stuff. Aristotle separates the two. There is alteration when a perceptible substratum persists and changes only in its properties: the body is healthy and then ill, the bronze is round and then angular, yet the same body and the same bronze remain. But when nothing perceptible persists as the substratum and the thing changes as a whole, as when seed becomes blood or water becomes air, that is not alteration. It is the coming to be of one substance and the passing away of another. Change in size is growth or diminution, and change of place is locomotion.",
            passage: {
              text: "The body, e.g. although persisting as the same body, is now healthy and now ill; and the bronze is now spherical and at another time angular, and yet remains the same bronze. But when nothing perceptible persists in its identity as a substratum, and the thing changes as a whole (when e.g. the seed as a whole is converted into blood, or water into air, or air as a whole into water), such an occurrence is no longer 'alteration'.",
              ref: "I.4, 319b",
            },
            terms: [
              { greek: "ἀλλοίωσις", translit: "alloiōsis", english: "alteration", gloss: "Change of quality in a subject that persists." },
              { greek: "γένεσις", translit: "genesis", english: "coming to be", gloss: "A change of the whole, where no perceptible subject persists." },
            ],
            checks: [
              {
                q: "Which example in the passage is alteration?",
                options: [
                  "Water converted into air",
                  "The bronze, now spherical and later angular",
                  "Seed converted into blood",
                  "Air converted into water",
                ],
                answer: 1,
                why: "The bronze remains the same bronze while its shape changes, which is alteration.",
              },
              {
                q: "When is a change no longer alteration?",
                options: [
                  "When it is quick",
                  "When nothing perceptible persists as a substratum and the thing changes as a whole",
                  "When it happens to a living thing",
                  "When it is reversible",
                ],
                answer: 1,
                why: "The passage says that then such an occurrence is no longer 'alteration'.",
              },
            ],
            journal: "Has anything in you changed as a whole, rather than in one property, and what made it more than an alteration?",
          },
          {
            id: "mixture-is-a-new-unity",
            title: "Mixture makes a new unity",
            bekker: "327a30-328b22",
            minutes: 5,
            summary:
              "Is mixture possible? If the ingredients survive unchanged, they are only set side by side; if one is destroyed, it is not mixed but gone. Aristotle answers that ingredients can exist potentially in the mixture: they are neither destroyed nor actually present. Mixing needs things that can act on each other and that are easily divided and shaped, like liquids. A drop of wine in a great deal of water is not mixed but turns into water. When the two are balanced in power, each alters the other toward a middle, and the result is one uniform thing. So mixture is the union of the mixables after they have been altered.",
            passage: {
              text: "On the contrary: anything is 'combinable' which, being readily adaptable in shape, is such as to suffer action and to act; and it is 'combinable with' another thing similarly characterized (for the 'combinable' is relative to the 'combinable'); and 'combination' is unification of the 'combinables', resulting from their 'alteration'.",
              ref: "I.10, 328b20-22",
            },
            terms: [
              { greek: "μίξις", translit: "mixis", english: "mixture, combination", gloss: "The union of ingredients that alter each other into one uniform body." },
            ],
            checks: [
              {
                q: "How does the passage define 'combination'?",
                options: [
                  "Placing small pieces side by side",
                  "Unification of the 'combinables', resulting from their 'alteration'",
                  "The destruction of one ingredient by another",
                  "Any change of place",
                ],
                answer: 1,
                why: "It says 'combination' is unification of the 'combinables', resulting from their 'alteration'.",
              },
              {
                q: "What makes a thing 'combinable'?",
                options: [
                  "Being hard and unchanging",
                  "Being readily adaptable in shape and able to suffer action and to act",
                  "Being made of fire",
                  "Being very large",
                ],
                answer: 1,
                why: "The passage says a thing is combinable which, being readily adaptable in shape, is such as to suffer action and to act.",
              },
            ],
            journal: "In a friendship or partnership you know, did each of you alter the other into something new, or did you only sit side by side?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: The elements and the cycle of coming to be",
        bekker: "328b-338b",
        line: "Book II derives the four elements from pairs of contrary qualities and explains why coming to be goes on forever.",
        lessons: [
          {
            id: "four-elements-from-four-qualities",
            title: "Four elements from four qualities",
            bekker: "329b7-331a6",
            minutes: 5,
            summary:
              "Aristotle reduces the many tangible qualities to two pairs of contraries: hot and cold, dry and moist. Four qualities can form six pairs, but contraries cannot be paired, since nothing is both hot and cold. That leaves four pairs, and they belong to the four simple bodies. Fire is hot and dry, air hot and moist, water cold and moist, earth cold and dry. Because each element shares a quality with its neighbours, the elements can change into one another, and change is quickest between those that share one quality, as when fire becomes air by the moist overcoming the dry.",
            passage: {
              text: "Hence it is evident that the 'couplings' of the elementary qualities will be four: hot with dry and moist with hot, and again cold with dry and cold with moist. And these four couples have attached themselves to the apparently 'simple' bodies (Fire, Air, Water, and Earth) in a manner consonant with theory. For Fire is hot and dry, whereas Air is hot and moist (Air being a sort of aqueous vapour); and Water is cold and moist, while Earth is cold and dry.",
              ref: "II.3, 330a30-b5",
            },
            terms: [
              { greek: "θερμόν", translit: "thermon", english: "hot", gloss: "One of the two active qualities." },
              { greek: "ὑγρόν", translit: "hygron", english: "moist, fluid", gloss: "What is easily bounded by another, not by its own limit." },
              { greek: "ξηρόν", translit: "xēron", english: "dry", gloss: "What is bounded by its own limit." },
            ],
            checks: [
              {
                q: "According to the passage, which qualities belong to water?",
                options: ["Hot and dry", "Hot and moist", "Cold and moist", "Cold and dry"],
                answer: 2,
                why: "The passage says water is cold and moist.",
              },
              {
                q: "Why are there only four couplings and not six?",
                options: [
                  "Because there are only four elements",
                  "Because contraries cannot be coupled",
                  "Because air and fire are the same",
                  "Because moist and dry are one quality",
                ],
                answer: 1,
                why: "Contraries refuse to be coupled, since nothing is both hot and cold or moist and dry, so two of the six pairs drop out.",
              },
            ],
            journal: "Which of your qualities do you share with the people closest to you, and does that make it easier to change toward them?",
          },
          {
            id: "the-sun-and-the-cycle",
            title: "The sun's inclined path and the cycle of coming to be",
            bekker: "336a13-338b19",
            minutes: 6,
            summary:
              "Coming to be and passing away never stop, so they need an eternal cause. The daily motion of the whole heaven is continuous but one and the same, so it cannot cause two opposite processes. Aristotle points to the sun's motion along the inclined circle of the ecliptic. Its continuity comes from the motion of the whole; its inclination makes the sun come near and go away. Its approach brings coming to be, and its retreat passing away. So the cycles of generation follow the seasons and periods of life. Since not everything can always exist, he says, God made coming to be uninterrupted, the closest approach to eternal being.",
            passage: {
              text: "Now the continuity of this movement is caused by the motion of the whole: but the approaching and retreating of the moving body are caused by the inclination. For the consequence of the inclination is that the body becomes alternately remote and near; and since its distance is thus unequal, its movement will be irregular.",
              ref: "II.10, 336b",
            },
            terms: [
              { greek: "λοξὸς κύκλος", translit: "loxos kyklos", english: "inclined circle", gloss: "The ecliptic, the sun's yearly path, tilted to the celestial equator." },
              { greek: "ἥλιος", translit: "hēlios", english: "sun", gloss: "Whose approach and retreat drive coming to be and passing away." },
            ],
            checks: [
              {
                q: "What causes the sun to come alternately near and far, according to the passage?",
                options: ["The motion of the whole", "The inclination", "The moon", "The void"],
                answer: 1,
                why: "The passage says the approaching and retreating of the moving body are caused by the inclination.",
              },
              {
                q: "What causes the continuity of the movement?",
                options: ["The inclination", "The motion of the whole", "The earth's rest", "Chance"],
                answer: 1,
                why: "It says the continuity of this movement is caused by the motion of the whole.",
              },
            ],
            journal: "What seasons of approach and retreat shape what grows and what fades in your own life?",
          },
        ],
      },
    ],
  },
  {
    id: "meteorology",
    title: "Meteorology",
    greek: "Μετεωρολογικά",
    latin: "Meteorologica",
    subject: "nature",
    level: "Intermediate",
    bekker: "338a-390b",
    about:
      "An account of what happens between the moon and the earth: meteors, comets and the Milky Way, rain and winds, rivers and the sea, earthquakes, thunder, halos and rainbows, and in Book IV the properties of mixed bodies. Much of it is wrong by modern lights, but it shows Aristotle reasoning from observation to causes with care.",
    before: ["physics", "on-the-heavens", "on-generation-and-corruption"],
    caveat:
      "Book IV reads like a separate treatise on the properties of materials, and its authenticity and place in the work have been doubted; some scholars assigned it to Theophrastus or Strato, though many now accept it as Aristotle's.",
    translation: {
      translator: "E. W. Webster",
      year: 1923,
      title: "Meteorologica",
      url: "https://classics.mit.edu/Aristotle/meteorology.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: The upper region, rivers and the changing sea",
        bekker: "338a-353a",
        line: "Book I sets out the subject and explains meteors, comets, the Milky Way, rain and rivers, and the slow exchange of land and sea.",
        lessons: [
          {
            id: "what-meteorology-studies",
            title: "What meteorology studies",
            bekker: "338a20-339a10",
            minutes: 4,
            summary:
              "Aristotle places this study in his series of works on nature. He has treated the first causes and motion, the heavens, and the elements and their changes into one another. What remains is what his predecessors called meteorology. It concerns natural events less regular than the motion of the first element, happening in the region nearest the stars: the Milky Way, comets and meteors. It also covers what is common to air and water, the parts of the earth, winds and earthquakes, thunderbolts and whirlwinds. After this he plans to treat animals and plants, which would complete the whole undertaking.",
            passage: {
              text: "It is concerned with events that are natural, though their order is less perfect than that of the first of the elements of bodies. They take place in the region nearest to the motion of the stars. Such are the milky way, and comets, and the movements of meteors.",
              ref: "I.1, 338a",
            },
            terms: [
              { greek: "μετέωρα", translit: "meteōra", english: "things aloft", gloss: "Events in the sky and the air, from which 'meteorology' is named." },
            ],
            checks: [
              {
                q: "How does the order of these events compare with that of the first element?",
                options: ["It is more perfect", "It is less perfect", "It is the same", "They have no order at all"],
                answer: 1,
                why: "The passage says their order is less perfect than that of the first of the elements of bodies.",
              },
              {
                q: "Which of these does the passage name as a subject of meteorology?",
                options: ["Comets", "The souls of animals", "The unmoved mover", "Numbers"],
                answer: 0,
                why: "It names the milky way, comets, and the movements of meteors.",
              },
            ],
            journal: "What in your days is natural but less regular than the turning of the sky?",
          },
          {
            id: "land-and-sea-change-places",
            title: "Land and sea change places",
            bekker: "351a19-353a27",
            minutes: 5,
            summary:
              "The same parts of the earth are not always wet or dry. As rivers arise and dry up, sea becomes land and land becomes sea. Aristotle thinks these changes follow an order and a cycle, driven by heat and cold that wax and wane with the sun. Like a living body, the earth's interior grows and decays, but by parts rather than as a whole. The changes are so slow that they go unnoticed, and whole peoples perish or migrate before anyone records them. He gives Egypt as an example: the land seems to have been made by the Nile's silt. So the earth is not destroyed; its regions take turns.",
            passage: {
              text: "The same parts of the earth are not always moist or dry, but they change according as rivers come into existence and dry up. And so the relation of land to sea changes too and a place does not always remain land or sea throughout all time, but where there was dry land there comes to be sea, and where there is now sea, there one day comes to be dry land. But we must suppose these changes to follow some order and cycle.",
              ref: "I.14, 351a19-26",
            },
            terms: [
              { greek: "θάλαττα", translit: "thalatta", english: "sea", gloss: "Its bounds shift over long ages, Aristotle holds." },
              { greek: "περίοδος", translit: "periodos", english: "cycle, period", gloss: "A regular round that returns on itself." },
            ],
            checks: [
              {
                q: "What does the passage say about places that are now sea?",
                options: [
                  "They will always be sea",
                  "There one day comes to be dry land",
                  "They were created by the gods",
                  "They are slowly drying for good",
                ],
                answer: 1,
                why: "It says: where there is now sea, there one day comes to be dry land.",
              },
              {
                q: "What does Aristotle suppose about these changes?",
                options: ["They are random", "They follow some order and cycle", "They happen overnight", "They never happen"],
                answer: 1,
                why: "The passage ends: we must suppose these changes to follow some order and cycle.",
              },
            ],
            journal: "What change in your world is too slow for you to notice, but would be plain to someone watching for a thousand years?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: The sea, winds and earthquakes",
        bekker: "353a-370a",
        line: "Book II explains why the sea is salt, what winds are, and how earthquakes come from wind inside the earth.",
        lessons: [
          {
            id: "why-the-sea-is-salt",
            title: "Why the sea is salt",
            bekker: "357b24-359b26",
            minutes: 5,
            summary:
              "Saltness, Aristotle argues, comes from something mixed in. In animals what is least digested, like urine and sweat, is salt and bitter; in burned things what heat does not take up is ash. That is why some say burnt earth made the sea salt. He thinks that is absurd as stated, but something like burnt earth is true. Everything that grows leaves an earthy residue like ash, carried in the dry exhalation. Since the dry and moist exhalations mix, some of this stuff is always taken into the clouds and comes down in rain, which explains the saltness of the sea and why some rains are brackish.",
            passage: {
              text: "What heat fails to assimilate becomes the excrementary residue in animal bodies, and, in things burnt, ashes. That is why some people say that it was burnt earth that made the sea salt. To say that it was burnt earth is absurd; but to say that it was something like burnt earth is true.",
              ref: "II.3, 358a",
            },
            terms: [
              { greek: "ἀναθυμίασις", translit: "anathymiasis", english: "exhalation", gloss: "Vapour drawn up by the sun's heat, either moist or dry and smoky." },
            ],
            checks: [
              {
                q: "What does Aristotle say about the claim that burnt earth made the sea salt?",
                options: [
                  "It is exactly right",
                  "It is absurd as stated, but something like burnt earth is true",
                  "It is a myth with no truth in it",
                  "He does not discuss it",
                ],
                answer: 1,
                why: "The passage says: to say that it was burnt earth is absurd; but to say that it was something like burnt earth is true.",
              },
              {
                q: "What does heat fail to assimilate in things burnt?",
                options: ["Smoke", "Ashes", "Water", "Air"],
                answer: 1,
                why: "The passage says what heat fails to assimilate becomes, in things burnt, ashes.",
              },
            ],
            journal: "What residue do your days leave behind that slowly flavours everything else?",
          },
          {
            id: "earthquakes-come-from-wind",
            title: "Earthquakes come from wind",
            bekker: "365a14-369a9",
            minutes: 5,
            summary:
              "Aristotle reviews earlier theories of earthquakes and offers his own. The earth is dry by nature, but rain soaks it, and the sun and its own heat produce a great deal of wind both outside and inside it. The body with the most force is the one that moves fastest and passes most easily through others, and that is wind. So earthquakes are caused not by water or earth but by wind, the external exhalation rushing into the earth. Because the exhalation tends to flow all one way, the greatest earthquakes often come in calm weather; when they come with wind, the cause is divided and they are weaker.",
            passage: {
              text: "Hence, since the evaporation generally follows in a continuous body in the direction in which it first started, and either all of it flows inwards or all outwards, most earthquakes and the greatest are accompanied by calm. It is true that some take place when a wind is blowing, but this presents no difficulty. We sometimes find several winds blowing simultaneously. If one of these enters the earth we get an earthquake attended by wind. Only these earthquakes are less severe because their source and cause is divided.",
              ref: "II.8, 366a",
            },
            terms: [
              { greek: "σεισμός", translit: "seismos", english: "earthquake", gloss: "A shaking of the earth, which Aristotle traces to wind inside it." },
              { greek: "πνεῦμα", translit: "pneuma", english: "wind, breath", gloss: "Moving air or exhalation, the most forceful body." },
            ],
            checks: [
              {
                q: "Why are most of the greatest earthquakes accompanied by calm, according to the passage?",
                options: [
                  "Because the evaporation all flows one way, here inwards",
                  "Because storms prevent earthquakes",
                  "Because the gods are resting",
                  "Because water fills the earth",
                ],
                answer: 0,
                why: "The passage says the evaporation flows all inwards or all outwards, so most earthquakes and the greatest are accompanied by calm.",
              },
              {
                q: "Why are earthquakes that come with wind less severe?",
                options: [
                  "Because their source and cause is divided",
                  "Because the wind cools the earth",
                  "Because they happen at sea",
                  "Because they are shorter",
                ],
                answer: 0,
                why: "The passage says these earthquakes are less severe because their source and cause is divided.",
              },
            ],
            journal: "When has a calm on the surface hidden the strongest force at work underneath?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: Storms, halos and rainbows",
        bekker: "370b-378b",
        line: "Book III treats hurricanes and thunderbolts and explains the halo, the rainbow and mock suns as reflections.",
        lessons: [
          {
            id: "the-rainbow",
            title: "The rainbow is a reflection",
            bekker: "371b18-375b15",
            minutes: 6,
            summary:
              "Aristotle explains the halo, the rainbow, mock suns and rods by one cause: they are all reflections of sight toward the sun or another bright object, differing in the surface and manner of reflection. He first records the facts about the rainbow. It never forms more than a semicircle; it is smallest and its arc largest at sunrise and sunset. There are never more than two at once. Each has three colours, the same in both, but in the outer bow they are fainter and in reverse order: the inner bow's outermost band is red, the outer bow's innermost. He notes that painters cannot make these colours by mixing.",
            passage: {
              text: "There are never more than two rainbows at one time. Each of them is three-coloured; the colours are the same in both and their number is the same, but in the outer rainbow they are fainter and their position is reversed. In the inner rainbow the first and largest band is red; in the outer rainbow the band that is nearest to this one and smallest is of the same colour: the other bands correspond on the same principle.",
              ref: "III.2, 371b-372a",
            },
            terms: [
              { greek: "ἶρις", translit: "iris", english: "rainbow", gloss: "A coloured arc caused, Aristotle says, by reflection from a cloud." },
              { greek: "ἀνάκλασις", translit: "anaklasis", english: "reflection", gloss: "The bending back of sight from a smooth surface." },
            ],
            checks: [
              {
                q: "How do the colours of the outer rainbow differ from the inner, in the passage?",
                options: [
                  "They are brighter and in the same order",
                  "They are fainter and their position is reversed",
                  "There are more of them",
                  "They are all red",
                ],
                answer: 1,
                why: "The passage says in the outer rainbow they are fainter and their position is reversed.",
              },
              {
                q: "What is the first and largest band of the inner rainbow?",
                options: ["Green", "Purple", "Red", "Blue"],
                answer: 2,
                why: "The passage says: in the inner rainbow the first and largest band is red.",
              },
            ],
            journal: "What have you seen many times without ever recording its facts as carefully as Aristotle records the rainbow?",
          },
        ],
      },
      {
        id: "book-4",
        title: "Book IV: Active and passive qualities",
        bekker: "378b-390b",
        line: "Book IV studies how heat and cold work on the moist and the dry: concoction, hardening, melting and the uniform materials of bodies.",
        lessons: [
          {
            id: "active-and-passive-qualities",
            title: "Hot and cold act, dry and moist are acted on",
            bekker: "378b10-379b9",
            minutes: 5,
            summary:
              "The four qualities that make up the elements fall into two groups. Hot and cold are active; dry and moist are passive. Aristotle appeals to instances: in every case heat and cold determine, join and change things, moistening, drying, hardening and softening them, while dry and moist things are what undergo these effects. Definitions say the same: we call a thing easy or hard to determine because of how it is acted on. From this he turns to the works of the active qualities: true coming to be and natural change are their work, and the passing away of things is rotting, when a thing's own heat is overcome.",
            passage: {
              text: "Two of the qualities, the hot and the cold, are active; two, the dry and the moist, passive. We can satisfy ourselves of this by looking at instances. In every case heat and cold determine, conjoin, and change things of the same kind and things of different kinds, moistening, drying, hardening, and softening them.",
              ref: "IV.1, 378b10-14",
            },
            terms: [
              { greek: "ποιητικά", translit: "poiētika", english: "active", gloss: "Qualities that act: the hot and the cold." },
              { greek: "παθητικά", translit: "pathētika", english: "passive", gloss: "Qualities that are acted on: the dry and the moist." },
            ],
            checks: [
              {
                q: "Which qualities does the passage call active?",
                options: ["The dry and the moist", "The hot and the cold", "The heavy and the light", "All four equally"],
                answer: 1,
                why: "The passage says: the hot and the cold, are active; the dry and the moist, passive.",
              },
              {
                q: "How does Aristotle say we can satisfy ourselves of this?",
                options: ["By looking at instances", "By a proof in geometry", "By consulting the poets", "By measuring weights"],
                answer: 0,
                why: "The passage says: we can satisfy ourselves of this by looking at instances.",
              },
            ],
            journal: "In your own life, what plays the part of heat and cold, acting, and what plays the part of the moist and dry, being shaped?",
          },
          {
            id: "concoction-perfects-a-thing",
            title: "Concoction perfects a thing",
            bekker: "379b10-381b23",
            minutes: 5,
            summary:
              "Heat produces concoction and cold produces its failure, inconcoction. The kinds of concoction are ripening, boiling and broiling; Aristotle warns that these words are borrowed and only roughly fit. Concoction is the process in which a thing's own natural heat perfects its passive qualities, which are its proper matter. When it has happened, we say the thing has been perfected and has become itself. Outside heat can help, as warm baths help digestion, but the thing's own heat does the work. Concoction happens when the moisture, the matter, is mastered by the heat. Ripening fruit is his clearest example.",
            passage: {
              text: "Concoction is a process in which the natural and proper heat of an object perfects the corresponding passive qualities, which are the proper matter of any given object. For when concoction has taken place we say that a thing has been perfected and has come to be itself.",
              ref: "IV.2, 379b",
            },
            terms: [
              { greek: "πέψις", translit: "pepsis", english: "concoction", gloss: "Ripening or cooking by a thing's own heat until it is complete." },
              { greek: "ὠμότης", translit: "ōmotēs", english: "rawness", gloss: "A kind of inconcoction, the failure of heat to master the matter." },
            ],
            checks: [
              {
                q: "What perfects the passive qualities in concoction, according to the passage?",
                options: [
                  "The natural and proper heat of the object",
                  "Cold from outside",
                  "Pressure",
                  "The passing of time alone",
                ],
                answer: 0,
                why: "The passage says the natural and proper heat of an object perfects the corresponding passive qualities.",
              },
              {
                q: "What do we say of a thing once concoction has taken place?",
                options: [
                  "That it has decayed",
                  "That it has been perfected and has come to be itself",
                  "That it has become cold",
                  "That it has changed into another element",
                ],
                answer: 1,
                why: "The passage says we say that a thing has been perfected and has come to be itself.",
              },
            ],
            journal: "What in you is still ripening by its own heat, and what would it mean for it to come to be itself?",
          },
        ],
      },
    ],
  },
];
