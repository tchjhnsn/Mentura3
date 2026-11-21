import type { Course } from "./types";

// First philosophy: the Metaphysics, one unit per book, all fourteen books (Alpha to Nu).
// Passages are verbatim from W. D. Ross's Oxford translation (1908), as given by the MIT Internet Classics Archive,
// with the archive's paragraph-opening quotation marks left out. Where a Bekker line was not certain, only the page
// and column are given.

export const FIRST_PHILOSOPHY: Course[] = [
  {
    id: "metaphysics",
    title: "Metaphysics",
    greek: "Τὰ μετὰ τὰ φυσικά",
    latin: "Metaphysica",
    subject: "first-philosophy",
    level: "Advanced",
    bekker: "980a-1093b",
    about:
      "The Metaphysics asks what wisdom is and finds it in a science of being as being: what it is for anything to be at all. It works through substance, essence, matter and form, potential and actuality, and ends with a first mover that moves the heavens by being loved. Much of later philosophy, ancient, medieval and modern, argues with this book.",
    before: ["categories", "physics"],
    caveat:
      "The Metaphysics is not one finished book. Editors after Aristotle's death gathered separate treatises under a title that means 'the books after the Physics'. Some ancient readers gave Book II (little alpha) to Pasicles of Rhodes, Book V is a free-standing dictionary, and Book XI (Kappa) repeats Books III, IV and VI and then excerpts the Physics, so many scholars doubt its first half and treat its second as a compilation.",
    translation: {
      translator: "W. D. Ross",
      year: 1908,
      title: "Metaphysica (The Works of Aristotle Translated into English, vol. VIII)",
      url: "https://classics.mit.edu/Aristotle/metaphysics.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I (Alpha): Wisdom and the causes",
        bekker: "980a21-993a27",
        line: "Wisdom is knowledge of first causes, and the earlier thinkers each saw some of the four.",
        lessons: [
          {
            id: "all-desire-to-know",
            title: "Everyone wants to know",
            bekker: "980a21-981b10",
            minutes: 5,
            summary:
              "Aristotle opens with a claim about human nature: all people by nature desire to know. The sign is that we enjoy our senses for their own sake, and sight most of all, because it shows us the most differences between things. He then traces a ladder. Animals have sensation; some also have memory; from many memories of the same thing people gain experience; and from experience comes art (technē) when a person grasps one universal judgment that covers all similar cases. A person of experience may cure as well as a doctor, but the one with the art knows why the cure works, and so we think them wiser.",
            passage: {
              text: "ALL men by nature desire to know. An indication of this is the delight we take in our senses; for even apart from their usefulness they are loved for themselves; and above all others the sense of sight. For not only with a view to action, but even when we are not going to do anything, we prefer seeing (one might say) to everything else.",
              ref: "I.1, 980a21-26",
            },
            terms: [
              { greek: "ἐμπειρία", translit: "empeiria", english: "experience", gloss: "Practical familiarity built from many memories of the same kind of case." },
              { greek: "τέχνη", translit: "technē", english: "art, craft", gloss: "Knowing a universal rule and its reason, so that one can teach it." },
            ],
            checks: [
              {
                q: "What does Aristotle give as a sign that people desire to know?",
                options: ["We enjoy our senses even apart from their usefulness", "We obey teachers willingly", "We remember everything we see", "We prefer action to seeing"],
                answer: 0,
                why: "The passage says the senses 'are loved for themselves' even apart from their usefulness, which shows the desire to know.",
              },
              {
                q: "Why does Aristotle rank the sense of sight above the others?",
                options: ["It is the most useful for survival", "It makes us know and shows many differences between things", "It is the only sense humans share with gods", "It works without memory"],
                answer: 1,
                why: "He says sight, most of all the senses, 'makes us know and brings to light many differences between things'.",
              },
            ],
            journal: "What do you want to know for no reason except that you want to know it?",
          },
          {
            id: "wisdom-begins-in-wonder",
            title: "Wisdom begins in wonder",
            bekker: "981b10-983a23",
            minutes: 5,
            summary:
              "If the person who knows causes is wiser than the person of mere experience, then wisdom (sophia) is knowledge of certain principles and causes. Aristotle collects what people commonly think about the wise: they know all things as far as possible, they know hard things, they are exact, and they can teach. These marks fit best a knowledge of first causes, pursued for its own sake. That such knowledge is not for production is shown by how philosophy began: in wonder. People first wondered at small puzzles, then at the moon, the sun, the stars and the origin of the whole. To wonder is to feel ignorant, and they philosophized to escape ignorance, not for any use.",
            passage: {
              text: "For it is owing to their wonder that men both now begin and at first began to philosophize; they wondered originally at the obvious difficulties, then advanced little by little and stated difficulties about the greater matters, e.g. about the phenomena of the moon and those of the sun and of the stars, and about the genesis of the universe.",
              ref: "I.2, 982b12-17",
            },
            terms: [
              { greek: "σοφία", translit: "sophia", english: "wisdom", gloss: "The highest knowledge: of first principles and causes, sought for its own sake." },
              { greek: "θαυμάζειν", translit: "thaumazein", english: "to wonder", gloss: "To be struck by a puzzle and feel one does not understand." },
            ],
            checks: [
              {
                q: "According to the passage, how did philosophy begin?",
                options: ["With the need to build better tools", "With wonder at obvious difficulties, then greater ones", "With laws handed down by rulers", "With the study of medicine"],
                answer: 1,
                why: "The passage says people began to philosophize 'owing to their wonder', first at obvious difficulties and then at greater matters.",
              },
              {
                q: "Which of these does the passage name as a greater matter people came to wonder about?",
                options: ["The price of grain", "The genesis of the universe", "The rules of grammar", "The training of horses"],
                answer: 1,
                why: "After the moon, sun and stars, the passage names 'the genesis of the universe'.",
              },
            ],
            journal: "When did a puzzle last stop you in your tracks, and did you follow it or move on?",
          },
          {
            id: "four-causes-and-first-thinkers",
            title: "The four causes and the first thinkers",
            bekker: "983a24-988b21",
            minutes: 6,
            summary:
              "To know a thing is to know its first cause, and causes are said in four senses: the essence, the matter, the source of change, and the end or good for whose sake a thing is. Aristotle reviews earlier thinkers to see whether they found any other kind. Most of the first philosophers named only a material principle. Thales said it is water, perhaps because nourishment and seeds are moist. Others named air or fire. Later thinkers added a source of motion, such as Love and Strife or Mind, and the Pythagoreans and Plato pointed toward form. No one, he concludes, found a cause beyond his four, though each grasped them dimly.",
            passage: {
              text: "Evidently we have to acquire knowledge of the original causes (for we say we know each thing only when we think we recognize its first cause), and causes are spoken of in four senses. In one of these we mean the substance, i.e. the essence (for the 'why' is reducible finally to the definition, and the ultimate 'why' is a cause and principle); in another the matter or substratum, in a third the source of the change",
              ref: "I.3, 983a24-30",
            },
            terms: [
              { greek: "αἰτία", translit: "aitia", english: "cause", gloss: "What answers the question 'why?' about a thing." },
              { greek: "ἀρχή", translit: "archē", english: "principle, starting-point", gloss: "That from which something is, comes to be, or is known." },
              { greek: "ὕλη", translit: "hylē", english: "matter", gloss: "That out of which a thing is made." },
            ],
            checks: [
              {
                q: "When does Aristotle say we know a thing?",
                options: ["When we can name it", "When we think we recognize its first cause", "When we have seen it many times", "When others agree with us"],
                answer: 1,
                why: "The passage says 'we know each thing only when we think we recognize its first cause'.",
              },
              {
                q: "Which principle did Thales name?",
                options: ["Fire", "Number", "Water", "Mind"],
                answer: 2,
                why: "The summary reports that Thales said the principle is water, perhaps because nourishment and seeds are moist.",
              },
            ],
            journal: "Pick one thing you made recently: what was its matter, its form, its maker and its purpose?",
          },
          {
            id: "against-the-forms",
            title: "Why the Forms explain nothing",
            bekker: "988b22-993a27",
            minutes: 6,
            summary:
              "Aristotle turns criticism on the Platonists, among whom he counts himself ('we'). He grants that Plato saw the need for something beyond changing sensible things, but argues that separate Forms do no work. They cause no motion or change in things. They do not help us know things, since they are not in them, and they do not account for their being. To call the Forms patterns that things share in is, he says, empty words and poetical metaphor: nothing looks to the Ideas while making. He ends the book by noting that all earlier thinkers sought his four causes, but vaguely, as if philosophy were still learning to speak.",
            passage: {
              text: "But, further, all other things cannot come from the Forms in any of the usual senses of 'from'. And to say that they are patterns and the other things share in them is to use empty words and poetical metaphors. For what is it that works, looking to the Ideas?",
              ref: "I.9, 991a19-23",
            },
            terms: [
              { greek: "εἶδος", translit: "eidos", english: "form", gloss: "For Plato a separate eternal pattern; for Aristotle the form is in the thing." },
              { greek: "μέθεξις", translit: "methexis", english: "participation", gloss: "Plato's word for how sensible things share in the Forms." },
            ],
            checks: [
              {
                q: "What does Aristotle call the claim that the Forms are patterns things share in?",
                options: ["A useful hypothesis", "Empty words and poetical metaphors", "The best account so far", "A proof by induction"],
                answer: 1,
                why: "He says it 'is to use empty words and poetical metaphors'.",
              },
              {
                q: "What question does he ask to press the objection?",
                options: ["Who taught Plato?", "What is it that works, looking to the Ideas?", "How many Forms are there?", "Why do Forms move?"],
                answer: 1,
                why: "The passage ends: 'For what is it that works, looking to the Ideas?', meaning nothing actually makes things by copying Forms.",
              },
            ],
            journal: "Is there an idea you lean on that sounds deep but, when pressed, does no work?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II (little alpha): Truth and the limits of causes",
        bekker: "993a30-995a20",
        line: "A short book on how truth is found together and why chains of causes must stop.",
        lessons: [
          {
            id: "truth-hard-and-easy",
            title: "Truth is hard alone and easy together",
            bekker: "993a30-993b31",
            minutes: 5,
            summary:
              "The search for truth is hard in one way and easy in another. No one reaches it fully, yet no one misses it wholly: each says something true, and together a great deal is gathered. The difficulty may lie less in things than in us: as bats' eyes are to daylight, so is our reason to what is by nature most evident. We should be grateful not only to those we agree with but also to those whose views were shallow, since they too trained our thinking. Philosophy is rightly called knowledge of the truth, and we know a truth only when we know its cause.",
            passage: {
              text: "THE investigation of the truth is in one way hard, in another easy. An indication of this is found in the fact that no one is able to attain the truth adequately, while, on the other hand, we do not collectively fail, but every one says something true about the nature of things, and while individually we contribute little or nothing to the truth, by the union of all a considerable amount is amassed.",
              ref: "II.1, 993a30-b",
            },
            terms: [
              { greek: "ἀλήθεια", translit: "alētheia", english: "truth", gloss: "What philosophy seeks; known fully only with its cause." },
            ],
            checks: [
              {
                q: "In what way is the investigation of truth easy?",
                options: ["Every one says something true, and together much is amassed", "Any one person can reach it fully", "The senses give it directly", "It needs no causes"],
                answer: 0,
                why: "The passage says 'every one says something true' and 'by the union of all a considerable amount is amassed'.",
              },
              {
                q: "Where does Aristotle suggest the difficulty may lie?",
                options: ["In the facts themselves", "In us, as bats' eyes are dazzled by daylight", "In the lack of books", "In the gods' will"],
                answer: 1,
                why: "The summary reports his image: as bats' eyes are to the blaze of day, so is our reason to what is most evident.",
              },
            ],
            journal: "Whose view, which you think shallow, has nonetheless sharpened your own thinking?",
          },
          {
            id: "causes-cannot-go-on-forever",
            title: "Causes cannot go on forever",
            bekker: "994a1-995a20",
            minutes: 5,
            summary:
              "There is a first principle, Aristotle argues, and causes do not run on without end, in number or in kind. Matter cannot come from matter forever, nor can movers be moved by movers forever, nor ends serve further ends forever, nor can definitions regress forever. If there were no first term, there would be no cause at all, and if there were no final end, there would be no reason in what we do. An infinite series could not be gone through, so nothing could be known by it. The book closes on method: what an audience finds clear depends on habit, and one should not demand mathematical exactness in everything.",
            passage: {
              text: "But evidently there is a first principle, and the causes of things are neither an infinite series nor infinitely various in kind. For neither can one thing proceed from another, as from matter, ad infinitum (e.g. flesh from earth, earth from air, air from fire, and so on without stopping), nor can the sources of movement form an endless series",
              ref: "II.2, 994a1-6",
            },
            terms: [
              { greek: "ἄπειρον", translit: "apeiron", english: "the unlimited, infinite", gloss: "What has no end and so cannot be gone through." },
              { greek: "τέλος", translit: "telos", english: "end", gloss: "That for the sake of which; a final cause." },
            ],
            checks: [
              {
                q: "What example does the passage give of an endless material series?",
                options: ["Flesh from earth, earth from air, air from fire", "Father from son", "Number from unit", "Health from walking"],
                answer: 0,
                why: "The passage gives 'flesh from earth, earth from air, air from fire, and so on without stopping' as the series that cannot go on forever.",
              },
              {
                q: "What does Aristotle conclude about causes?",
                options: ["They are infinite in number", "There is a first principle; causes are not an infinite series", "Only material causes exist", "Causes cannot be known"],
                answer: 1,
                why: "The passage opens: 'evidently there is a first principle, and the causes of things are neither an infinite series nor infinitely various in kind'.",
              },
            ],
            journal: "If you keep asking 'and why do I want that?' about your plans, where does the chain stop?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III (Beta): The puzzles",
        bekker: "995a24-1003a17",
        line: "Before answering, Aristotle lays out the hard questions first philosophy must face.",
        lessons: [
          {
            id: "untie-the-knot",
            title: "You cannot untie a knot you cannot see",
            bekker: "995a24-995b4",
            minutes: 5,
            summary:
              "Aristotle begins Book III by explaining his method. Anyone who wants to get clear must first go through the difficulties (aporiai) well. A puzzle in thought is like a knot in a rope: thinking is bound and cannot go forward, and you cannot untie a knot you do not know is there. Someone who inquires without stating the difficulties is like a traveller who does not know where to go, and cannot even tell when the goal is found. And someone who has heard all the opposed arguments, like a judge who has heard both parties, is in a better position to decide.",
            passage: {
              text: "For those who wish to get clear of difficulties it is advantageous to discuss the difficulties well; for the subsequent free play of thought implies the solution of the previous difficulties, and it is not possible to untie a knot of which one does not know. But the difficulty of our thinking points to a 'knot' in the object; for in so far as our thought is in difficulties, it is in like case with those who are bound",
              ref: "III.1, 995a27-32",
            },
            terms: [
              { greek: "ἀπορία", translit: "aporia", english: "puzzle, impasse", gloss: "A point where thought is stuck between arguments on both sides." },
              { greek: "εὐπορία", translit: "euporia", english: "way through", gloss: "The free movement of thought once a puzzle is solved." },
            ],
            checks: [
              {
                q: "Why should one discuss the difficulties well first?",
                options: ["It is impossible to untie a knot one does not know", "It impresses the audience", "It avoids having to find causes", "It is required by law"],
                answer: 0,
                why: "The passage says 'it is not possible to untie a knot of which one does not know'.",
              },
              {
                q: "What does the difficulty in our thinking point to?",
                options: ["A lack of effort", "A 'knot' in the object", "A mistake in grammar", "Nothing at all"],
                answer: 1,
                why: "The passage says 'the difficulty of our thinking points to a 'knot' in the object'.",
              },
            ],
            journal: "What problem in your life have you been trying to solve before stating clearly what makes it hard?",
          },
          {
            id: "the-great-questions",
            title: "The questions first philosophy must answer",
            bekker: "995b4-1003a17",
            minutes: 6,
            summary:
              "Aristotle lists about fourteen puzzles and argues both sides of each. Does one science study all the causes, or several? Does it study the axioms of proof, such as that one cannot assert and deny the same thing at once? Are there substances besides sensible ones? Are genera the principles of things, or their parts? Are principles universal or individual, potential or actual? Are numbers, lines and points substances? He does not settle these here. He shows, for example, that if principles are universal they will not be substances, but if they are individual they cannot be known. Much of the rest of the Metaphysics returns to these puzzles.",
            passage: {
              text: "Again (12) we ask whether the principles are universal or like individual things, and (13) whether they exist potentially or actually, and further, whether they are potential or actual in any other sense than in reference to movement; for these questions also would present much difficulty.",
              ref: "III.1, 996a",
            },
            terms: [
              { greek: "καθόλου", translit: "katholou", english: "universal", gloss: "Said of many things at once, such as 'human' or 'animal'." },
              { greek: "καθ᾽ ἕκαστον", translit: "kath' hekaston", english: "individual, particular", gloss: "This one thing, such as Socrates." },
            ],
            checks: [
              {
                q: "Which pair of options does puzzle (12) set against each other?",
                options: ["Matter or form", "Universal or individual principles", "Fire or water", "Pleasure or pain"],
                answer: 1,
                why: "The passage asks 'whether the principles are universal or like individual things'.",
              },
              {
                q: "Does Aristotle settle these puzzles in Book III?",
                options: ["Yes, each one in turn", "No, he argues both sides and leaves them open for later books", "He declares them meaningless", "He leaves them to the Pythagoreans"],
                answer: 1,
                why: "The summary says he argues both sides of each and does not settle them here; later books return to them.",
              },
            ],
            journal: "Which question about your own life could you argue on both sides with equal force?",
          },
        ],
      },
      {
        id: "book-4",
        title: "Book IV (Gamma): Being as being",
        bekker: "1003a21-1012b31",
        line: "There is one science of being as being, and its firmest principle is non-contradiction.",
        lessons: [
          {
            id: "science-of-being-as-being",
            title: "A science of being as such",
            bekker: "1003a21-1003a32",
            minutes: 5,
            summary:
              "Aristotle announces a science that studies being as being, and whatever belongs to being in virtue of itself. It differs from every special science. Mathematics, for example, cuts off one part of being, quantity, and studies the attributes of that part. The science of being as being does not cut off a part but asks what belongs to anything just because it is. Since we seek the first principles and highest causes, these must be principles of being itself. Aristotle says the earlier thinkers who sought the elements of things were, in effect, seeking these same principles.",
            passage: {
              text: "THERE is a science which investigates being as being and the attributes which belong to this in virtue of its own nature. Now this is not the same as any of the so-called special sciences; for none of these others treats universally of being as being. They cut off a part of being and investigate the attribute of this part; this is what the mathematical sciences for instance do.",
              ref: "IV.1, 1003a21-26",
            },
            terms: [
              { greek: "τὸ ὂν ᾗ ὄν", translit: "to on hēi on", english: "being as being", gloss: "Whatever is, considered only in so far as it is." },
              { greek: "ἐπιστήμη", translit: "epistēmē", english: "science, knowledge", gloss: "Ordered knowledge of a subject through its causes." },
            ],
            checks: [
              {
                q: "How do the special sciences differ from the science of being as being?",
                options: ["They cut off a part of being and study that part", "They study nothing real", "They use no reasoning", "They study only the gods"],
                answer: 0,
                why: "The passage says the special sciences 'cut off a part of being and investigate the attribute of this part'.",
              },
              {
                q: "Which sciences does the passage give as an example of a special science?",
                options: ["Medicine", "The mathematical sciences", "Rhetoric", "Politics"],
                answer: 1,
                why: "It says 'this is what the mathematical sciences for instance do'.",
              },
            ],
            journal: "What would change if you asked of something not what use it is, but simply what it is?",
          },
          {
            id: "being-said-many-ways",
            title: "Being is said in many ways, all pointing to one",
            bekker: "1003a33-1005a18",
            minutes: 6,
            summary:
              "'Being' has many senses, but they are not a mere pun: all are related to one central thing. Aristotle's model is 'healthy'. A diet is healthy because it preserves health, a medicine because it produces it, a complexion because it is a sign of it, and a body because it is capable of it. Each use points to health. In the same way some things are said to be because they are substances, others because they are qualities, quantities or changes of a substance. So the science of being can be one science, and it will study above all substance, on which the rest depend.",
            passage: {
              text: "There are many senses in which a thing may be said to 'be', but all that 'is' is related to one central point, one definite kind of thing, and is not said to 'be' by a mere ambiguity. Everything which is healthy is related to health, one thing in the sense that it preserves health, another in the sense that it produces it",
              ref: "IV.2, 1003a33-b1",
            },
            terms: [
              { greek: "πρὸς ἕν", translit: "pros hen", english: "related to one", gloss: "Many senses of a word that all point to one central sense." },
              { greek: "οὐσία", translit: "ousia", english: "substance, being", gloss: "The primary kind of being, on which qualities and quantities depend." },
            ],
            checks: [
              {
                q: "What example does Aristotle use to show many senses related to one?",
                options: ["'Healthy', related to health", "'Bank', a river or a treasury", "'Large', compared with small", "'Red', a colour"],
                answer: 0,
                why: "The passage says 'Everything which is healthy is related to health', in different ways.",
              },
              {
                q: "Is 'being' said by a mere ambiguity?",
                options: ["Yes, its senses have nothing in common", "No, all senses relate to one central point", "Only in Greek", "Only for gods"],
                answer: 1,
                why: "The passage says all that is 'is related to one central point ... and is not said to 'be' by a mere ambiguity'.",
              },
            ],
            journal: "Which word in your own life, like 'healthy', has many uses that all point back to one thing?",
          },
          {
            id: "principle-of-non-contradiction",
            title: "The firmest principle of all",
            bekker: "1005a19-1006a5",
            minutes: 5,
            summary:
              "The philosopher must also study the axioms every science uses. The firmest principle is one about which no one can be mistaken, which is not hypothetical, and which anyone needs to know anything at all. Aristotle states it: the same attribute cannot at once belong and not belong to the same subject in the same respect. This is the principle of non-contradiction. No one can truly believe that the same thing is and is not, though some say Heraclitus did; what a person says is not always what he believes. Every demonstration, he adds, rests finally on this principle.",
            passage: {
              text: "It is, that the same attribute cannot at the same time belong and not belong to the same subject and in the same respect; we must presuppose, to guard against dialectical objections, any further qualifications which might be added. This, then, is the most certain of all principles",
              ref: "IV.3, 1005b19-23",
            },
            terms: [
              { greek: "ἀξίωμα", translit: "axiōma", english: "axiom", gloss: "A starting-point every science uses and none proves." },
              { greek: "ἀντίφασις", translit: "antiphasis", english: "contradiction", gloss: "A pair of statements, one affirming and one denying the same thing." },
            ],
            checks: [
              {
                q: "Which statement matches the principle Aristotle gives?",
                options: ["Everything changes", "The same attribute cannot at the same time belong and not belong to the same subject in the same respect", "Every effect has a cause", "The whole is greater than the part"],
                answer: 1,
                why: "That is the principle stated in the passage, which he calls 'the most certain of all principles'.",
              },
              {
                q: "Why does he add 'in the same respect' and further qualifications?",
                options: ["To guard against dialectical objections", "To make it weaker", "Because Heraclitus required it", "To allow exceptions in mathematics"],
                answer: 0,
                why: "The passage says the qualifications are presupposed 'to guard against dialectical objections'.",
              },
            ],
            journal: "Where do you hold two beliefs that cannot both be true in the same respect?",
          },
          {
            id: "defending-the-principle",
            title: "Defending what cannot be proved",
            bekker: "1006a5-1012b31",
            minutes: 6,
            summary:
              "Some demand a proof of the principle, but Aristotle says this shows a lack of education: not everything can be proved, or proof would regress forever. Yet the principle can be defended by refutation. The opponent need only say something that means something to himself and to another. If he says nothing, there is no arguing with him, and he is no better than a plant. If he says something definite, he has already used the principle, since a word that signifies something excludes its opposite. The rest of the book argues against those, like followers of Protagoras, who say all appearances are true.",
            passage: {
              text: "We can, however, demonstrate negatively even that this view is impossible, if our opponent will only say something; and if he says nothing, it is absurd to seek to give an account of our views to one who cannot give an account of anything, in so far as he cannot do so. For such a man, as such, is from the start no better than a vegetable.",
              ref: "IV.4, 1006a11-15",
            },
            terms: [
              { greek: "ἀπόδειξις", translit: "apodeixis", english: "demonstration", gloss: "Proof from prior premises; it cannot reach the first principles themselves." },
              { greek: "ἐλεγκτικῶς", translit: "elenktikōs", english: "by refutation", gloss: "Showing a denial defeats itself once the opponent speaks." },
            ],
            checks: [
              {
                q: "What must the opponent do for the negative demonstration to work?",
                options: ["Agree with Aristotle", "Say something", "Prove his own view", "Stay silent"],
                answer: 1,
                why: "The passage says it works 'if our opponent will only say something'.",
              },
              {
                q: "What does Aristotle say about someone who says nothing at all?",
                options: ["He is the wisest", "He is no better than a vegetable, as such", "He has refuted the principle", "He must be persuaded by force"],
                answer: 1,
                why: "The passage says such a man 'is from the start no better than a vegetable'.",
              },
            ],
            journal: "What do you rely on that you could never prove, yet could not stop using without falling silent?",
          },
        ],
      },
      {
        id: "book-5",
        title: "Book V (Delta): A dictionary of terms",
        bekker: "1012b34-1025a34",
        line: "Thirty key words, each sorted into its senses: principle, cause, nature, substance and more.",
        lessons: [
          {
            id: "cause-in-four-senses",
            title: "Cause, sorted into its senses",
            bekker: "1012b34-1014a25",
            minutes: 5,
            summary:
              "Book V works like a philosophical dictionary. It takes about thirty terms and separates the ways each is used. After 'principle', Aristotle defines 'cause'. A cause is the material a thing comes from, as bronze is of a statue; the form or pattern, the definition of the essence, as the ratio 2:1 is of the octave; the source of change or rest, as an adviser is of an action or a father of a child; and the end, that for whose sake, as health is of walking. One thing can have several causes, and things can be causes of each other: exercise of good condition, good condition of exercise, though not in the same way.",
            passage: {
              text: "(3) That from which the change or the resting from change first begins; e.g. the adviser is a cause of the action, and the father a cause of the child, and in general the maker a cause of the thing made and the change-producing of the changing. (4) The end, i.e. that for the sake of which a thing is; e.g. health is the cause of walking.",
              ref: "V.2, 1013a",
            },
            terms: [
              { greek: "αἴτιον", translit: "aition", english: "cause", gloss: "What a thing is due to; said in four ways." },
              { greek: "οὗ ἕνεκα", translit: "hou heneka", english: "that for the sake of which", gloss: "The end or purpose of a thing or action." },
            ],
            checks: [
              {
                q: "In the passage, which is given as an example of the end?",
                options: ["The father of a child", "Health as the cause of walking", "Bronze for a statue", "The ratio 2:1"],
                answer: 1,
                why: "The passage says 'The end, i.e. that for the sake of which a thing is; e.g. health is the cause of walking'.",
              },
              {
                q: "Which kind of cause is the adviser of an action?",
                options: ["The matter", "The form", "That from which the change first begins", "The end"],
                answer: 2,
                why: "The adviser is listed under (3), 'That from which the change or the resting from change first begins'.",
              },
            ],
            journal: "What is the 'for the sake of which' of the thing you are doing right now?",
          },
          {
            id: "substance-in-two-senses",
            title: "Substance: the underlying thing and the form",
            bekker: "1017b10-1017b26",
            minutes: 5,
            summary:
              "Aristotle lists what is called substance (ousia). Simple bodies such as earth, fire and water, and the animals and things made of them, are called substances because they are not said of anything else, while everything else is said of them. The soul is called substance because it is the cause of an animal's being. Some say limits like planes, lines and numbers are substances. And the essence, whose formula is a definition, is called the substance of each thing. He sums up two senses: the ultimate subject, not said of anything further, and that which is a 'this' and separable, the shape or form of each thing. Book VII takes up this question.",
            passage: {
              text: "It follows, then, that 'substance' has two senses, (A) ultimate substratum, which is no longer predicated of anything else, and (B) that which, being a 'this', is also separable and of this nature is the shape or form of each thing.",
              ref: "V.8, 1017b23-26",
            },
            terms: [
              { greek: "ὑποκείμενον", translit: "hypokeimenon", english: "substratum, subject", gloss: "What underlies and has things said of it." },
              { greek: "τόδε τι", translit: "tode ti", english: "a 'this'", gloss: "A definite individual one can point to." },
            ],
            checks: [
              {
                q: "What is sense (A) of substance in the passage?",
                options: ["The ultimate substratum, not predicated of anything else", "A number", "A quality like white", "A place"],
                answer: 0,
                why: "The passage gives (A) as 'ultimate substratum, which is no longer predicated of anything else'.",
              },
              {
                q: "What does the passage say sense (B) is?",
                options: ["The matter of each thing", "The shape or form of each thing, a separable 'this'", "The cause of motion", "An accident"],
                answer: 1,
                why: "Sense (B) is 'that which, being a 'this', is also separable and of this nature is the shape or form of each thing'.",
              },
            ],
            journal: "When you say 'that is who I am', do you mean what underlies you or the shape you have taken?",
          },
        ],
      },
      {
        id: "book-6",
        title: "Book VI (Epsilon): The sciences and the kinds of being",
        bekker: "1025b3-1028a6",
        line: "First philosophy is set among the sciences, and two senses of being are put aside.",
        lessons: [
          {
            id: "three-theoretical-sciences",
            title: "Three ways of knowing for its own sake",
            bekker: "1025b3-1026a32",
            minutes: 5,
            summary:
              "Every science seeks principles and causes, but most study one kind of thing and take its essence for granted. Thought is practical, productive or theoretical. Among theoretical sciences, physics studies things that change and are not separate, mathematics studies things that do not change but are perhaps not separate, and a first science studies what is both separate and unchanging. Aristotle calls this theology, since the divine, if anywhere, is found there. It is the highest, and if there is no unchanging substance, physics would be first. If there is one, its science is first and universal because it is first.",
            passage: {
              text: "There must, then, be three theoretical philosophies, mathematics, physics, and what we may call theology, since it is obvious that if the divine is present anywhere, it is present in things of this sort. And the highest science must deal with the highest genus.",
              ref: "VI.1, 1026a18-21",
            },
            terms: [
              { greek: "θεολογική", translit: "theologikē", english: "theology", gloss: "The science of what is separate and unchanging; first philosophy." },
              { greek: "θεωρητική", translit: "theōrētikē", english: "theoretical", gloss: "Pursued for the sake of contemplating the truth." },
            ],
            checks: [
              {
                q: "Which three theoretical philosophies does the passage name?",
                options: ["Ethics, politics, rhetoric", "Mathematics, physics, and theology", "Logic, poetics, physics", "Medicine, music, astronomy"],
                answer: 1,
                why: "The passage names 'mathematics, physics, and what we may call theology'.",
              },
              {
                q: "Why is the third called theology?",
                options: ["Because priests teach it", "Because if the divine is present anywhere, it is present in things of this sort", "Because it uses myths", "Because it is the easiest"],
                answer: 1,
                why: "The passage says 'if the divine is present anywhere, it is present in things of this sort'.",
              },
            ],
            journal: "Which of your pursuits do you follow only for the sake of understanding?",
          },
          {
            id: "no-science-of-the-accidental",
            title: "There is no science of the accidental",
            bekker: "1026a33-1028a6",
            minutes: 5,
            summary:
              "Being has several senses: by accident, as true, by the categories, and as potential and actual. Aristotle sets two aside. Accidental being, like a builder who happens to heal, has no science, because science is of what happens always or for the most part, and the accidental is exactly what happens otherwise. Its cause is indeterminate. Being as true is also set aside: truth and falsity are not in things but in thought, which joins or separates them. Both depend on the remaining kind of being, so first philosophy must study being in itself, as divided by the categories.",
            passage: {
              text: "but that there is no science of the accidental is obvious; for all science is either of that which is always or of that which is for the most part. (For how else is one to learn or to teach another? The thing must be determined as occurring either always or for the most part",
              ref: "VI.2, 1027a20-24",
            },
            terms: [
              { greek: "συμβεβηκός", translit: "symbebēkos", english: "accident", gloss: "What belongs to a thing, but neither always nor for the most part." },
              { greek: "ὡς ἐπὶ τὸ πολύ", translit: "hōs epi to poly", english: "for the most part", gloss: "What usually happens, though not always." },
            ],
            checks: [
              {
                q: "What is all science about, according to the passage?",
                options: ["What happens always or for the most part", "What happens by chance", "Only what is eternal", "Only what we see"],
                answer: 0,
                why: "The passage says 'all science is either of that which is always or of that which is for the most part'.",
              },
              {
                q: "Where does Aristotle place truth and falsity?",
                options: ["In things", "In thought", "In the stars", "In the senses only"],
                answer: 1,
                why: "The summary reports that truth and falsity are not in things but in thought, which joins or separates.",
              },
            ],
            journal: "Which event in your life was accidental, and what did you try to learn from it anyway?",
          },
        ],
      },
      {
        id: "book-7",
        title: "Book VII (Zeta): Substance",
        bekker: "1028a10-1041b33",
        line: "What is substance? Not matter, not the universal, but essence and form, the cause of being.",
        lessons: [
          {
            id: "what-is-substance",
            title: "The oldest question is about substance",
            bekker: "1028a10-1028b32",
            minutes: 5,
            summary:
              "Being is said in as many ways as the categories, but first of all it means what a thing is, its substance. Qualities and quantities exist only as belonging to some substance: walking and sitting are always of someone. So substance is first in definition, in knowledge and in time. Aristotle then turns the old question 'what is being?' into the question 'what is substance?'. Thinkers disagreed on whether there is one substance or many, few or unlimited. People agree that bodies are substances; some add limits, numbers or Forms. Aristotle sets out to decide which claims are right.",
            passage: {
              text: "And indeed the question which was raised of old and is raised now and always, and is always the subject of doubt, viz. what being is, is just the question, what is substance? For it is this that some assert to be one, others more than one, and that some assert to be limited in number, others unlimited.",
              ref: "VII.1, 1028b2-6",
            },
            terms: [
              { greek: "οὐσία", translit: "ousia", english: "substance", gloss: "What a thing most of all is; the primary kind of being." },
              { greek: "κατηγορία", translit: "katēgoria", english: "category", gloss: "A highest kind of what can be said: substance, quality, quantity, and so on." },
            ],
            checks: [
              {
                q: "Into what question does Aristotle turn 'what is being?'",
                options: ["What is number?", "What is substance?", "What is motion?", "What is the good?"],
                answer: 1,
                why: "The passage says the question 'what being is, is just the question, what is substance?'.",
              },
              {
                q: "How does the passage describe this question?",
                options: ["Newly invented by Aristotle", "Raised of old, now and always, and always doubted", "Already settled by Plato", "Of little importance"],
                answer: 1,
                why: "He calls it 'the question which was raised of old and is raised now and always, and is always the subject of doubt'.",
              },
            ],
            journal: "What is the one question you keep returning to, year after year?",
          },
          {
            id: "matter-is-not-substance",
            title: "Why matter cannot be substance",
            bekker: "1028b33-1029b12",
            minutes: 6,
            summary:
              "Substance is said in four main ways: the essence, the universal, the genus, and the underlying subject. Aristotle tests the subject first. If substance is what everything else is said of, then strip away qualities, quantities and even length and breadth, and only matter seems left: something that in itself is no particular thing, of no quantity, in no category. That would make matter substance. But this is impossible, he says, since being separable and being a 'this' belong most of all to substance. So form and the compound of form and matter are more substance than matter is. He resolves to study form, the most puzzling, starting from sensible things that are more knowable to us.",
            passage: {
              text: "If we adopt this point of view, then, it follows that matter is substance. But this is impossible; for both separability and 'thisness' are thought to belong chiefly to substance. And so form and the compound of form and matter would be thought to be substance, rather than matter.",
              ref: "VII.3, 1029a26-30",
            },
            terms: [
              { greek: "χωριστόν", translit: "chōriston", english: "separable", gloss: "Able to exist on its own, not only as a feature of something else." },
              { greek: "ὕλη", translit: "hylē", english: "matter", gloss: "What is left when every feature is stripped off; in itself no definite thing." },
            ],
            checks: [
              {
                q: "Why does Aristotle reject matter as substance?",
                options: ["Matter is invisible", "Separability and 'thisness' belong chiefly to substance", "Matter does not exist", "Plato rejected it"],
                answer: 1,
                why: "The passage says 'both separability and 'thisness' are thought to belong chiefly to substance', which matter lacks.",
              },
              {
                q: "What would be thought substance rather than matter?",
                options: ["Number and the point", "Form and the compound of form and matter", "The accidents", "The void"],
                answer: 1,
                why: "The passage concludes 'form and the compound of form and matter would be thought to be substance, rather than matter'.",
              },
            ],
            journal: "If everything about you were stripped away but the stuff you are made of, would anything of you remain?",
          },
          {
            id: "essence-what-you-are-in-yourself",
            title: "Essence: what you are by your very nature",
            bekker: "1029b13-1034b19",
            minutes: 6,
            summary:
              "Aristotle next examines essence, 'what it was to be' a thing. The essence of each thing is what it is said to be in itself. Being you is not being musical, since you are not musical by your very nature. Strictly, only substances have essences and definitions in the primary sense; other things have them in a secondary way. Each primary thing is the same as its essence. He then studies coming to be: in nature, in art and by chance, a thing comes from something and by something into something. No one makes the form itself: a craftsman makes bronze into a sphere, but makes neither the bronze nor the sphere-shape.",
            passage: {
              text: "The essence of each thing is what it is said to be propter se. For being you is not being musical, since you are not by your very nature musical. What, then, you are by your very nature is your essence.",
              ref: "VII.4, 1029b13-16",
            },
            terms: [
              { greek: "τὸ τί ἦν εἶναι", translit: "to ti ēn einai", english: "essence", gloss: "Literally 'the what it was to be': what a thing is in itself." },
              { greek: "ὁρισμός", translit: "horismos", english: "definition", gloss: "The formula that states a thing's essence." },
              { greek: "καθ᾽ αὑτό", translit: "kath' hauto", english: "in itself", gloss: "Belonging to a thing by its own nature, rendered 'propter se' by Ross." },
            ],
            checks: [
              {
                q: "Why is being musical not part of your essence, according to the passage?",
                options: ["Music is not real", "You are not by your very nature musical", "Only gods are musical", "Music is a substance"],
                answer: 1,
                why: "The passage says 'being you is not being musical, since you are not by your very nature musical'.",
              },
              {
                q: "What does the passage say your essence is?",
                options: ["What you are by your very nature", "What others say of you", "What you happen to do", "What you are made of"],
                answer: 0,
                why: "It says 'What, then, you are by your very nature is your essence'.",
              },
            ],
            journal: "Which things people know about you are accidents, and which belong to you by your nature?",
          },
          {
            id: "substance-as-cause",
            title: "Substance is the cause of being",
            bekker: "1038b1-1041b33",
            minutes: 6,
            summary:
              "Aristotle argues that no universal is a substance. The substance of a thing is proper to it, while a universal is common to many; and substance is not said of a subject, while a universal always is. So Plato's Forms, taken as separate universals, fail. In the last chapter he makes a new start: substance is a principle and cause. To ask why something is, is to ask why this matter is this thing: why are these bricks a house? A syllable is not just its letters, nor flesh just fire and earth; there is something else that makes them one. That is the substance of each thing, the primary cause of its being, a nature that is a principle, not an element.",
            passage: {
              text: "And this is the substance of each thing (for this is the primary cause of its being); and since, while some things are not substances, as many as are substances are formed in accordance with a nature of their own and by a process of nature, their substance would seem to be this kind of 'nature', which is not an element but a principle.",
              ref: "VII.17, 1041b",
            },
            terms: [
              { greek: "στοιχεῖον", translit: "stoicheion", english: "element", gloss: "A component present in a thing as its matter, like a letter in a syllable." },
              { greek: "φύσις", translit: "physis", english: "nature", gloss: "An inner principle of a thing's being and growth." },
            ],
            checks: [
              {
                q: "What does the passage call the substance of each thing?",
                options: ["The primary cause of its being", "Its largest part", "Its matter", "Its name"],
                answer: 0,
                why: "The passage says 'this is the substance of each thing (for this is the primary cause of its being)'.",
              },
              {
                q: "The substance of natural things is said to be a 'nature' that is what?",
                options: ["An element", "Not an element but a principle", "A number", "A Form apart from them"],
                answer: 1,
                why: "The passage says their substance is 'this kind of 'nature', which is not an element but a principle'.",
              },
              {
                q: "Why is no universal a substance, as the summary reports?",
                options: ["A universal is common to many, but substance is proper to its thing", "Universals are too small", "Universals change too often", "Universals are matter"],
                answer: 0,
                why: "The substance of a thing is peculiar to it, while a universal belongs to more than one thing.",
              },
            ],
            journal: "What makes a group you belong to more than a heap of its members?",
          },
        ],
      },
      {
        id: "book-8",
        title: "Book VIII (Eta): Matter and form in sensible things",
        bekker: "1042a3-1045b23",
        line: "Sensible substances are matter and form together, and that is why each is one.",
        lessons: [
          {
            id: "form-as-differentia",
            title: "What makes a threshold a threshold",
            bekker: "1042a3-1044a14",
            minutes: 5,
            summary:
              "Aristotle sums up Book VII and turns to the sensible substances everyone accepts. Their matter is potentially a 'this'; their form is what makes them actually so. Things differ in many ways: by composition, like honey-water; by being bound or glued, like a book; by position, like a threshold and a lintel; by time, like dinner and breakfast; by place, like the winds. So 'is' has as many senses as there are such differences. A threshold is because it lies in a certain position. Definitions that state the matter only give potential, those that state the form give actuality, and the best give both.",
            passage: {
              text: "Clearly, then, the word 'is' has just as many meanings; a thing is a threshold because it lies in such and such a position, and its being means its lying in that position, while being ice means having been solidified in such and such a way.",
              ref: "VIII.2, 1042b",
            },
            terms: [
              { greek: "διαφορά", translit: "diaphora", english: "differentia", gloss: "The difference that marks a thing off within its kind." },
              { greek: "θέσις", translit: "thesis", english: "position", gloss: "Placement, the differentia that makes a stone a threshold." },
            ],
            checks: [
              {
                q: "Why is a thing a threshold, according to the passage?",
                options: ["Because it is made of stone", "Because it lies in such and such a position", "Because it is old", "Because someone named it"],
                answer: 1,
                why: "The passage says 'a thing is a threshold because it lies in such and such a position'.",
              },
              {
                q: "What does being ice mean, in the passage?",
                options: ["Being cold water", "Having been solidified in such and such a way", "Lying in a position", "Being white"],
                answer: 1,
                why: "The passage says 'being ice means having been solidified in such and such a way'.",
              },
            ],
            journal: "What in your life is the same material arranged differently, and so a different thing?",
          },
          {
            id: "matter-and-form-are-one",
            title: "Why a thing is one and not a heap",
            bekker: "1044a15-1045b23",
            minutes: 5,
            summary:
              "Every thing that comes to be has a proximate matter: not just earth, but the right matter for that thing. Aristotle ends the book with a puzzle: what makes a definition, and the thing defined, one rather than many? Why is 'two-footed animal' one thing and not two? Others invent links such as participation or a bond. But the puzzle dissolves, he says, once we see that the proximate matter and the form are one and the same, the one potentially and the other actually. Asking why they are one is like asking why anything is one. The only further cause needed is whatever moved the thing from potency to actuality.",
            passage: {
              text: "But, as has been said, the proximate matter and the form are one and the same thing, the one potentially, and the other actually. Therefore it is like asking what in general is the cause of unity and of a thing's being one; for each thing is a unity, and the potential and the actual are somehow one.",
              ref: "VIII.6, 1045b17-21",
            },
            terms: [
              { greek: "δύναμις", translit: "dynamis", english: "potency, potentiality", gloss: "Being able to be or become something." },
              { greek: "ἐνέργεια", translit: "energeia", english: "actuality", gloss: "Being the thing at work, not merely able to be it." },
            ],
            checks: [
              {
                q: "How are the proximate matter and the form related, according to the passage?",
                options: ["They are two separate things joined by a bond", "They are one and the same, one potentially and the other actually", "The form is a part of the matter", "They have nothing in common"],
                answer: 1,
                why: "The passage says they 'are one and the same thing, the one potentially, and the other actually'.",
              },
              {
                q: "What further cause of unity does Aristotle allow?",
                options: ["Participation in a Form", "Whatever caused the movement from potency into actuality", "A separate bond", "Number"],
                answer: 1,
                why: "The summary reports that the only further cause is what moved the thing from potency to actuality.",
              },
            ],
            journal: "What are you now only potentially that you hope to become actually?",
          },
        ],
      },
      {
        id: "book-9",
        title: "Book IX (Theta): Potential and actuality",
        bekker: "1045b27-1052a11",
        line: "What it is to be able, what it is to be at work, and why being at work comes first.",
        lessons: [
          {
            id: "against-the-megarians",
            title: "Being able when you are not doing",
            bekker: "1045b27-1047b2",
            minutes: 5,
            summary:
              "Aristotle first studies potency as a source of change: a power to act on something else, or to be acted on. Some powers are rational and can produce opposites, as medicine can make sick or well; others are not, as heat only heats. Then he answers the Megarians, who said that a thing can act only when it is acting. On their view a builder who is not building is not a builder, someone who is not seeing is blind, and nothing could be cold or sweet unless sensed. That would abolish change and coming to be. So potency and actuality are distinct, and a thing may be capable of being without being.",
            passage: {
              text: "There are some who say, as the Megaric school does, that a thing 'can' act only when it is acting, and when it is not acting it 'cannot' act, e.g. that he who is not building cannot build, but only he who is building, when he is building; and so in all other cases.",
              ref: "IX.3, 1046b29-32",
            },
            terms: [
              { greek: "δύναμις", translit: "dynamis", english: "power, capacity", gloss: "A source of change in another, or in oneself as other." },
              { greek: "ἕξις", translit: "hexis", english: "having, settled state", gloss: "A capacity possessed even while not in use, like a learned art." },
            ],
            checks: [
              {
                q: "What does the Megaric school claim?",
                options: ["Everything can do anything", "A thing can act only when it is acting", "Builders never build", "Powers are eternal"],
                answer: 1,
                why: "The passage reports they say 'a thing 'can' act only when it is acting'.",
              },
              {
                q: "What absurdity does Aristotle draw from their view?",
                options: ["A builder not building would not be a builder", "Houses build themselves", "No one could ever stop building", "All builders are gods"],
                answer: 0,
                why: "The summary reports that on their view a builder who is not building is not a builder.",
              },
            ],
            journal: "What can you do that you are not doing right now, and how do you know you still can?",
          },
          {
            id: "what-actuality-is",
            title: "Actuality is grasped by analogy",
            bekker: "1048a25-1048b36",
            minutes: 5,
            summary:
              "What is actuality? Aristotle says we should not seek a definition of everything, but grasp it by analogy from cases. Actuality is to potency as building is to being able to build, waking to sleeping, seeing to having sight with eyes shut, the shaped statue to the wood. Some cases are as motion to a capacity, others as substance to matter. He also distinguishes motions from activities. A motion such as building or slimming is incomplete until it ends. An activity such as seeing, thinking or living well is complete at every moment: one sees and has seen at once.",
            passage: {
              text: "we must not seek a definition of everything but be content to grasp the analogy, that it is as that which is building is to that which is capable of building, and the waking to the sleeping, and that which is seeing to that which has its eyes shut but has sight",
              ref: "IX.6, 1048a-b",
            },
            terms: [
              { greek: "ἐνέργεια", translit: "energeia", english: "actuality, activity", gloss: "Being at work; a thing actually being what it can be." },
              { greek: "ἀναλογία", translit: "analogia", english: "analogy", gloss: "A sameness of ratio: A is to B as C is to D." },
            ],
            checks: [
              {
                q: "How does Aristotle say we should grasp actuality?",
                options: ["By a strict definition", "By analogy from cases", "By counting", "By asking the poets"],
                answer: 1,
                why: "The passage says 'we must not seek a definition of everything but be content to grasp the analogy'.",
              },
              {
                q: "Which pair is given as actuality to potency?",
                options: ["The waking to the sleeping", "The young to the old", "The hot to the cold", "The large to the small"],
                answer: 0,
                why: "The passage lists 'the waking to the sleeping' among the analogies.",
              },
            ],
            journal: "What in your days is an activity complete in itself, and what is only a process toward something else?",
          },
          {
            id: "actuality-comes-first",
            title: "Being at work comes first",
            bekker: "1049b4-1052a11",
            minutes: 6,
            summary:
              "Actuality is prior to potency in definition, in being, and in a sense in time. In definition, because 'able to build' means able to do the actual building. In time, because although this seed comes before this plant, a mature member of the kind always comes first, since a human comes from a human. And in being, because the end is actuality, and the potency is for the sake of it. Animals do not see in order to have sight; they have sight in order to see. Eternal things, which are wholly actual, are prior to perishable ones. The book ends with truth as the highest sense of being.",
            passage: {
              text: "For animals do not see in order that they may have sight, but they have sight that they may see. And similarly men have the art of building that they may build, and theoretical science that they may theorize; but they do not theorize that they may have theoretical science",
              ref: "IX.8, 1050a10-14",
            },
            terms: [
              { greek: "πρότερον", translit: "proteron", english: "prior", gloss: "First, in definition, in time or in being." },
              { greek: "ἐντελέχεια", translit: "entelecheia", english: "complete reality, fulfilment", gloss: "Having one's end within; Aristotle's coinage, close to actuality." },
            ],
            checks: [
              {
                q: "According to the passage, why do animals have sight?",
                options: ["In order that they may see", "In order to have sight", "By chance", "To please the gods"],
                answer: 0,
                why: "The passage says 'they have sight that they may see'.",
              },
              {
                q: "What does this show about potency and actuality?",
                options: ["The potency is for the sake of the actuality", "The actuality is for the sake of the potency", "They are unrelated", "Potency is always better"],
                answer: 0,
                why: "The capacity exists for the activity, which is the end, so actuality is prior.",
              },
            ],
            journal: "Which of your abilities do you keep only having, instead of using?",
          },
        ],
      },
      {
        id: "book-10",
        title: "Book X (Iota): Unity",
        bekker: "1052a15-1059a14",
        line: "What 'one' means, how the one is a measure, and how sameness, difference and contrariety work.",
        lessons: [
          {
            id: "one-as-measure",
            title: "To be one is to be a measure",
            bekker: "1052a15-1054a19",
            minutes: 5,
            summary:
              "'One' is said in several ways: the continuous, the whole, the individual, and the universal, all because something is indivisible. But above all, Aristotle says, to be one is to be the first measure of a kind, most strictly of quantity. A measure is that by which quantity is known, and number is known by the unit. From this the idea spreads: in length, weight and speed we take some indivisible unit as a measure. He also argues, against Platonists and Pythagoreans, that the one is not a substance on its own. It is always one something, as being is always some kind of being.",
            passage: {
              text: "but it means especially 'to be the first measure of a kind', and most strictly of quantity; for it is from this that it has been extended to the other categories. For measure is that by which quantity is known; and quantity qua quantity is known either by a 'one' or by a number, and all number is known by a 'one'.",
              ref: "X.1, 1052b",
            },
            terms: [
              { greek: "ἕν", translit: "hen", english: "one, unity", gloss: "What is indivisible; above all, the first measure of a kind." },
              { greek: "μέτρον", translit: "metron", english: "measure", gloss: "That by which a quantity is known." },
            ],
            checks: [
              {
                q: "What does 'one' mean especially, according to the passage?",
                options: ["The largest thing", "The first measure of a kind", "The first number after zero", "A substance on its own"],
                answer: 1,
                why: "The passage says it means especially 'to be the first measure of a kind'.",
              },
              {
                q: "What is a measure, according to the passage?",
                options: ["That by which quantity is known", "A kind of substance", "A ratio of two numbers", "A tool for building"],
                answer: 0,
                why: "The passage says 'measure is that by which quantity is known'.",
              },
            ],
            journal: "What unit do you measure your days by, and does it measure what matters?",
          },
          {
            id: "contrariety-greatest-difference",
            title: "Contraries are the greatest difference",
            bekker: "1054a20-1059a14",
            minutes: 5,
            summary:
              "The one and the many are opposed, and from them come the same and the other, the like and the unlike. Things that differ differ in something, within a genus or across genera. Aristotle argues that contrariety is the greatest difference within a kind, and so complete difference. Things in different genera are too far apart to compare, but within one genus the extremes between which change happens are contraries, like white and black. One thing has one contrary. He then shows how species differ by contrariety within a genus, and why male and female, though contrary, do not make different species.",
            passage: {
              text: "Since things which differ may differ from one another more or less, there is also a greatest difference, and this I call contrariety. That contrariety is the greatest difference is made clear by induction.",
              ref: "X.4, 1055a3-6",
            },
            terms: [
              { greek: "ἐναντιότης", translit: "enantiotēs", english: "contrariety", gloss: "The greatest difference between things in one genus." },
              { greek: "ἑτερότης", translit: "heterotēs", english: "otherness", gloss: "Simply being other, with or without a shared kind." },
            ],
            checks: [
              {
                q: "What does Aristotle call the greatest difference?",
                options: ["Contradiction", "Contrariety", "Otherness", "Privation"],
                answer: 1,
                why: "The passage says 'there is also a greatest difference, and this I call contrariety'.",
              },
              {
                q: "How is it shown that contrariety is the greatest difference?",
                options: ["By induction", "By a myth", "By definition alone", "By counting votes"],
                answer: 0,
                why: "The passage says it 'is made clear by induction'.",
              },
            ],
            journal: "Which two things you feel are opposites are really two ends of one kind?",
          },
        ],
      },
      {
        id: "book-11",
        title: "Book XI (Kappa): A digest of earlier inquiries",
        bekker: "1059a18-1069a14",
        line: "A summary of Books III, IV and VI, then excerpts on change from the Physics.",
        lessons: [
          {
            id: "wisdom-recapitulated",
            title: "The puzzles of wisdom, again",
            bekker: "1059a18-1065a26",
            minutes: 5,
            summary:
              "The first eight chapters of Book XI cover again, more briefly, the puzzles of Book III, the science of being and the principle of non-contradiction from Book IV, and the sciences and accidental being from Book VI. It asks whether wisdom is one science or several, whether it studies the principles of proof, whether it studies all substances, and whether its principles are genera or individuals. Scholars disagree whether this part is Aristotle's early draft or a student's summary. Read side by side with the fuller books, it shows the outline of the whole inquiry in a few pages.",
            passage: {
              text: "THAT Wisdom is a science of first principles is evident from the introductory chapters, in which we have raised objections to the statements of others about the first principles; but one might ask the question whether Wisdom is to be conceived as one science or as several.",
              ref: "XI.1, 1059a18-21",
            },
            terms: [
              { greek: "σοφία", translit: "sophia", english: "wisdom", gloss: "The science of first principles." },
              { greek: "ἀπορία", translit: "aporia", english: "puzzle", gloss: "A question with strong arguments on both sides." },
            ],
            checks: [
              {
                q: "What does the passage say is evident from the introductory chapters?",
                options: ["That Wisdom is a science of first principles", "That Wisdom is impossible", "That there is no first principle", "That Wisdom is a craft"],
                answer: 0,
                why: "The passage opens: 'THAT Wisdom is a science of first principles is evident from the introductory chapters'.",
              },
              {
                q: "What question does it then raise?",
                options: ["Whether Wisdom is one science or several", "Whether Wisdom can be taught by poets", "Whether Wisdom is pleasant", "Whether Wisdom is a substance"],
                answer: 0,
                why: "It asks 'whether Wisdom is to be conceived as one science or as several'.",
              },
            ],
            journal: "If you had to say what you are seeking in a few pages, what would stay and what would go?",
          },
          {
            id: "change-as-actuality",
            title: "Change is the actuality of the potential",
            bekker: "1065a27-1069a14",
            minutes: 5,
            summary:
              "The last chapters of Book XI gather passages from the Physics on chance, change, the infinite and motion. The central definition is that change is the actuality of what is potential, as such. When the buildable, just as buildable, is actual, it is being built, and that is building. The bronze is potentially a statue, but change is not the actuality of the bronze as bronze; it is its actuality as able to be moved. The book also argues that there is no actually infinite body, and that change happens only in quality, quantity and place, not in substance.",
            passage: {
              text: "There being a distinction in each class of things between the potential and the completely real, I call the actuality of the potential as such, movement. That what we say is true, is plain from the following facts. When the 'buildable', in so far as it is what we mean by 'buildable', exists actually, it is being built, and this is the process of building.",
              ref: "XI.9, 1065b16-21",
            },
            terms: [
              { greek: "κίνησις", translit: "kinēsis", english: "movement, change", gloss: "The actuality of what is potential, as potential." },
            ],
            checks: [
              {
                q: "How does the passage define movement?",
                options: ["The actuality of the potential as such", "The absence of rest", "Change of place only", "A kind of substance"],
                answer: 0,
                why: "The passage says 'I call the actuality of the potential as such, movement'.",
              },
              {
                q: "What is happening when the buildable, as buildable, exists actually?",
                options: ["It is being built", "It is finished", "It is destroyed", "It is at rest"],
                answer: 0,
                why: "The passage says 'it is being built, and this is the process of building'.",
              },
            ],
            journal: "What are you in the middle of becoming, so that your change is visible only while it lasts?",
          },
        ],
      },
      {
        id: "book-12",
        title: "Book XII (Lambda): The unmoved mover",
        bekker: "1069a18-1076a4",
        line: "From changing substances to an eternal mover that moves by being loved and thinks itself.",
        lessons: [
          {
            id: "three-kinds-of-substance",
            title: "Three kinds of substance",
            bekker: "1069a18-1071b2",
            minutes: 5,
            summary:
              "The inquiry is about substance, since substance is the first part of the whole. Aristotle names three kinds: sensible and perishable, like plants and animals; sensible and eternal, the heavenly bodies; and unmoving, which some say exists apart. The first two belong to physics because they change; the third belongs to another science. Change needs three principles: form, privation and matter. Bronze becomes a sphere; something comes from something, by something, into something. The causes of all things are the same by analogy, though different for each: the matter, the form, the moving cause, and finally the first cause of all.",
            passage: {
              text: "There are three kinds of substance-one that is sensible (of which one subdivision is eternal and another is perishable; the latter is recognized by all men, and includes e.g. plants and animals), of which we must grasp the elements, whether one or many; and another that is immovable",
              ref: "XII.1, 1069a30-34",
            },
            terms: [
              { greek: "στέρησις", translit: "sterēsis", english: "privation", gloss: "The lack of a form that a thing could have." },
              { greek: "ἀκίνητος", translit: "akinētos", english: "unmoving", gloss: "Not subject to change of any kind." },
            ],
            checks: [
              {
                q: "Which kind of substance does the passage say all men recognize?",
                options: ["The perishable sensible kind, like plants and animals", "The immovable kind", "The eternal sensible kind", "The mathematical kind"],
                answer: 0,
                why: "The passage says the perishable kind 'is recognized by all men, and includes e.g. plants and animals'.",
              },
              {
                q: "Which three principles of change does the summary name?",
                options: ["Form, privation and matter", "Earth, air and fire", "Love, strife and mind", "One, two and many"],
                answer: 0,
                why: "The summary reports that change needs form, privation and matter.",
              },
            ],
            journal: "What in your life is perishable, what lasts much longer, and what do you think never changes?",
          },
          {
            id: "a-substance-that-is-pure-actuality",
            title: "A substance whose essence is actuality",
            bekker: "1071b3-1072a18",
            minutes: 6,
            summary:
              "There must be an eternal unmoving substance, Aristotle argues. If all substances perished, everything would perish. But motion and time cannot have begun or ceased, for there would be no before and after without time. So there is an eternal, continuous motion, which can only be circular motion in place. Something must cause it. Forms like Plato's would not do, since they do not cause motion, and even an active cause would not do if its essence were potency, for what is potential might not act. So there must be a principle whose very essence is actuality, without matter, since it is eternal.",
            passage: {
              text: "There must, then, be such a principle, whose very essence is actuality. Further, then, these substances must be without matter; for they must be eternal, if anything is eternal. Therefore they must be actuality.",
              ref: "XII.6, 1071b19-22",
            },
            terms: [
              { greek: "ἀΐδιος", translit: "aidios", english: "eternal", gloss: "Always existing, without beginning or end." },
              { greek: "ἐνέργεια", translit: "energeia", english: "actuality", gloss: "Being fully at work, with nothing merely potential." },
            ],
            checks: [
              {
                q: "What must the principle's very essence be?",
                options: ["Potency", "Actuality", "Matter", "Number"],
                answer: 1,
                why: "The passage says 'There must, then, be such a principle, whose very essence is actuality'.",
              },
              {
                q: "Why must these substances be without matter?",
                options: ["Because they must be eternal", "Because matter is evil", "Because they are small", "Because Plato said so"],
                answer: 0,
                why: "The passage says they 'must be without matter; for they must be eternal'.",
              },
            ],
            journal: "What in you is always only potential, and what would it mean to be fully at work?",
          },
          {
            id: "moving-by-being-loved",
            title: "It moves things as the beloved moves",
            bekker: "1072a19-1074b14",
            minutes: 6,
            summary:
              "The first heaven moves eternally in a circle, so something moves it. Since what is moved and moves is in between, there is something that moves without being moved: eternal, substance and actuality. Aristotle explains how: as the object of desire and the object of thought move. They move us without being moved. The first mover moves as being loved, and other things move by being moved. On such a principle the heavens and nature depend. Its life is like the best we enjoy for a short time, and it enjoys always: thinking, which is pleasure. Chapter 8 then counts the movers needed for the heavenly spheres.",
            passage: {
              text: "And since that which moves and is moved is intermediate, there is something which moves without being moved, being eternal, substance, and actuality. And the object of desire and the object of thought move in this way; they move without being moved.",
              ref: "XII.7, 1072a24-27",
            },
            terms: [
              { greek: "κινοῦν ἀκίνητον", translit: "kinoun akinēton", english: "unmoved mover", gloss: "What causes motion without itself being moved." },
              { greek: "ὀρεκτόν", translit: "orekton", english: "object of desire", gloss: "What draws a desire toward itself." },
              { greek: "ἐρώμενον", translit: "erōmenon", english: "the beloved", gloss: "What is loved; the first mover moves 'as being loved'." },
            ],
            checks: [
              {
                q: "How do the object of desire and the object of thought move things?",
                options: ["By pushing them", "Without being moved", "By being moved first", "By chance"],
                answer: 1,
                why: "The passage says 'the object of desire and the object of thought move in this way; they move without being moved'.",
              },
              {
                q: "What three things does the passage say the unmoved mover is?",
                options: ["Eternal, substance, and actuality", "Material, large and hot", "Potential, many and changing", "Visible, near and small"],
                answer: 0,
                why: "It says there is something that moves without being moved, 'being eternal, substance, and actuality'.",
              },
            ],
            journal: "What do you love that moves you without ever moving toward you?",
          },
          {
            id: "thought-thinking-itself",
            title: "Thinking that thinks itself",
            bekker: "1074b15-1076a4",
            minutes: 6,
            summary:
              "What does the divine mind think? If it thought something other than itself, its worth would depend on that object, and some things are better not seen at all. So, since it is the most excellent of things, it must think itself, and its thinking is a thinking on thinking. Readers disagree whether this means it knows nothing of the world or knows the world in knowing itself. In the last chapter Aristotle asks how the universe holds the good. Probably in two ways, as an army does: in its order and, more, in its general, for the order depends on him. All things are ordered together toward one end.",
            passage: {
              text: "Therefore it must be of itself that the divine thought thinks (since it is the most excellent of things), and its thinking is a thinking on thinking.",
              ref: "XII.9, 1074b33-35",
            },
            terms: [
              { greek: "νόησις νοήσεως", translit: "noēsis noēseōs", english: "thinking of thinking", gloss: "The divine mind's activity, whose object is itself." },
              { greek: "νοῦς", translit: "nous", english: "mind, intellect", gloss: "The power of understanding; in god, pure actuality." },
            ],
            checks: [
              {
                q: "What does the divine thought think, according to the passage?",
                options: ["The world", "Itself", "Numbers", "Nothing"],
                answer: 1,
                why: "The passage says 'it must be of itself that the divine thought thinks'.",
              },
              {
                q: "How does the universe hold the good, in Aristotle's army image?",
                options: ["Only in its order", "In its order and, more, in its leader", "Only by chance", "In each soldier alone"],
                answer: 1,
                why: "The summary reports that an army's good is found in its order and more in its leader, on whom the order depends.",
              },
            ],
            journal: "When you think about your own thinking, what do you find there?",
          },
        ],
      },
      {
        id: "book-13",
        title: "Book XIII (Mu): Mathematical objects and the Forms",
        bekker: "1076a8-1087a25",
        line: "What mathematical objects are, and how the theory of Forms arose and where it fails.",
        lessons: [
          {
            id: "how-mathematics-exists",
            title: "How mathematical objects exist",
            bekker: "1076a8-1078b6",
            minutes: 5,
            summary:
              "Are there unchanging mathematical objects besides sensible things? Aristotle argues they are neither separate substances nor in sensible things as parts. Rather, the mathematician studies sensible things, but only as quantities, lines and planes, setting aside everything else, as a doctor studies a body only as healthy or sick. So mathematical objects exist, but in a qualified way. He adds that those who say mathematics says nothing of the beautiful are wrong. The chief forms of beauty are order, symmetry and definiteness, which the mathematical sciences show above all.",
            passage: {
              text: "The chief forms of beauty are order and symmetry and definiteness, which the mathematical sciences demonstrate in a special degree. And since these (e.g. order and definiteness) are obviously causes of many things, evidently these sciences must treat this sort of causative principle also (i.e. the beautiful) as in some sense a cause.",
              ref: "XIII.3, 1078a-b",
            },
            terms: [
              { greek: "καλόν", translit: "kalon", english: "beautiful, fine", gloss: "What is admirable for its order and proportion." },
              { greek: "τάξις", translit: "taxis", english: "order", gloss: "Arrangement; one of the chief forms of beauty." },
              { greek: "συμμετρία", translit: "symmetria", english: "symmetry, proportion", gloss: "Parts measured well against one another." },
            ],
            checks: [
              {
                q: "What are the chief forms of beauty, according to the passage?",
                options: ["Order, symmetry and definiteness", "Colour, size and brightness", "Pleasure, use and novelty", "Wealth, fame and power"],
                answer: 0,
                why: "The passage says 'The chief forms of beauty are order and symmetry and definiteness'.",
              },
              {
                q: "Does mathematics say anything about the beautiful?",
                options: ["No, nothing at all", "Yes, it demonstrates its chief forms in a special degree", "Only geometry does", "Only by accident"],
                answer: 1,
                why: "The passage says the mathematical sciences demonstrate order, symmetry and definiteness 'in a special degree'.",
              },
            ],
            journal: "Where have you seen order and proportion make something beautiful?",
          },
          {
            id: "socrates-and-the-forms",
            title: "Where the theory of Forms came from",
            bekker: "1078b7-1087a25",
            minutes: 6,
            summary:
              "Aristotle tells how the theory of Forms arose. Its holders believed Heraclitus that sensible things are always flowing, so knowledge must be of something else. Socrates sought universal definitions in ethics, and two things may fairly be credited to him: inductive arguments and universal definition, both concerned with the starting-point of knowledge. But Socrates did not make universals exist apart. The Platonists did, and called them Ideas. Aristotle compares this to a man who could not count a few things and so multiplied them before counting. He then argues at length against ideal numbers.",
            passage: {
              text: "for two things may be fairly ascribed to Socrates-inductive arguments and universal definition, both of which are concerned with the starting-point of science):-but Socrates did not make the universals or the definitions exist apart: they, however, gave them separate existence, and this was the kind of thing they called Ideas.",
              ref: "XIII.4, 1078b27-32",
            },
            terms: [
              { greek: "ἐπακτικοὶ λόγοι", translit: "epaktikoi logoi", english: "inductive arguments", gloss: "Reasoning from cases to a general claim." },
              { greek: "ἰδέα", translit: "idea", english: "Idea, Form", gloss: "The Platonists' name for a universal given separate existence." },
            ],
            checks: [
              {
                q: "Which two things does Aristotle ascribe to Socrates?",
                options: ["Inductive arguments and universal definition", "Ideal numbers and the One", "Atoms and the void", "Rhetoric and poetry"],
                answer: 0,
                why: "The passage says 'two things may be fairly ascribed to Socrates-inductive arguments and universal definition'.",
              },
              {
                q: "What did Socrates not do, according to the passage?",
                options: ["Seek definitions", "Make the universals or definitions exist apart", "Use induction", "Ask questions"],
                answer: 1,
                why: "The passage says 'Socrates did not make the universals or the definitions exist apart'.",
              },
            ],
            journal: "Which general idea that you use have you started to treat as a thing in its own right?",
          },
        ],
      },
      {
        id: "book-14",
        title: "Book XIV (Nu): Numbers as first principles",
        bekker: "1087a29-1093b29",
        line: "Against making contraries and numbers the first principles and causes of things.",
        lessons: [
          {
            id: "first-principles-as-contraries",
            title: "Can contraries be first principles?",
            bekker: "1087a29-1090a1",
            minutes: 5,
            summary:
              "All earlier philosophers made the first principles contraries, the Platonists too, who set the One against the Great and Small or the unequal. Aristotle objects that contraries are always said of some underlying subject; none exists on its own. So if the first principle were a contrary, its subject would be prior to it, and it would not be first. Nothing can be prior to the first principle of all. He also argues that the One is a measure, so it cannot be a principle in the way the Platonists claim, and that their accounts of how numbers are generated fail.",
            passage: {
              text: "All philosophers make the first principles contraries: as in natural things, so also in the case of unchangeable substances. But since there cannot be anything prior to the first principle of all things, the principle cannot be the principle and yet be an attribute of something else.",
              ref: "XIV.1, 1087a29-33",
            },
            terms: [
              { greek: "ἐναντία", translit: "enantia", english: "contraries", gloss: "Opposites within one kind, like hot and cold." },
              { greek: "ἀρχή", translit: "archē", english: "first principle", gloss: "What nothing is prior to." },
            ],
            checks: [
              {
                q: "What do all philosophers make the first principles, according to the passage?",
                options: ["Numbers", "Contraries", "Atoms", "Gods"],
                answer: 1,
                why: "The passage says 'All philosophers make the first principles contraries'.",
              },
              {
                q: "Why can the first principle not be an attribute of something else?",
                options: ["Because nothing can be prior to the first principle of all things", "Because attributes are invisible", "Because it is a number", "Because it changes"],
                answer: 0,
                why: "The passage says 'there cannot be anything prior to the first principle of all things', and an attribute's subject would be prior.",
              },
            ],
            journal: "What do you treat as basic in your life that in fact depends on something else?",
          },
          {
            id: "nature-is-not-episodic",
            title: "Nature is not a string of episodes",
            bekker: "1090a2-1093b29",
            minutes: 5,
            summary:
              "Aristotle ends the Metaphysics by pressing the Platonists and Pythagoreans on numbers. If numbers, lines, planes and solids were separate substances with nothing linking them, each level would contribute nothing to the next, and the world would be like a bad tragedy made of loose episodes. But the facts show that nature is not like that. Numbers do not cause things by being their matter, form or end. Likenesses between numbers and things, such as seven vowels or seven strings, are coincidences. The book closes by suggesting that mathematical objects are not separate from sensible things and are not first principles.",
            passage: {
              text: "But the observed facts show that nature is not a series of episodes, like a bad tragedy. As for the believers in the Ideas, this difficulty misses them; for they construct spatial magnitudes out of matter and number",
              ref: "XIV.3, 1090b19-22",
            },
            terms: [
              { greek: "ἐπεισοδιώδης", translit: "epeisodiōdēs", english: "episodic", gloss: "Made of loose parts that do not follow from one another." },
              { greek: "ἀριθμός", translit: "arithmos", english: "number", gloss: "For the Pythagoreans the stuff of things; for Aristotle a measure of them." },
            ],
            checks: [
              {
                q: "What do the observed facts show, according to the passage?",
                options: ["Nature is a series of episodes", "Nature is not a series of episodes, like a bad tragedy", "Nature is made of numbers", "Nature has no order"],
                answer: 1,
                why: "The passage says 'the observed facts show that nature is not a series of episodes, like a bad tragedy'.",
              },
              {
                q: "What does Aristotle say about likenesses such as seven vowels and seven strings?",
                options: ["They prove numbers are causes", "They are coincidences", "They are laws of nature", "They are Forms"],
                answer: 1,
                why: "The summary reports that he treats such likenesses as coincidences.",
              },
            ],
            journal: "Does your own life read as one story or as a series of episodes, and what would connect them?",
          },
        ],
      },
    ],
  },
];
