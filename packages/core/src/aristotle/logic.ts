import type { Course } from "./types";

// The subject "logic": the six works of the Organon, in the order of the subject's path in subjects.ts.
// Every passage is copied from the Oxford translations (1928) as the MIT Internet Classics Archive gives them.

export const LOGIC: Course[] = [
  {
    id: "categories",
    title: "Categories",
    greek: "Κατηγορίαι",
    latin: "Categoriae",
    subject: "logic",
    level: "Start here",
    bekker: "1a-15b",
    about:
      "The Categories asks what kinds of thing there are to be said, and sorts every simple expression under ten heads, with individual substance at the base. It is the shortest way into Aristotle's vocabulary: subject and predicate, substance and quality, contraries and opposites.",
    before: [],
    caveat:
      "Some scholars, ancient and modern, have doubted that Aristotle wrote the Categories, and chapters 10 to 15 (the so-called Postpredicaments) may have been joined to the first nine by a later editor.",
    translation: {
      translator: "E. M. Edghill",
      year: 1928,
      title: "Categories",
      url: "https://classics.mit.edu/Aristotle/categories.html",
    },
    units: [
      {
        id: "words-and-kinds",
        title: "Chapters 1-4: Words and the kinds of thing said",
        bekker: "1a1-2a10",
        line: "Aristotle sorts names by how they share meaning, sorts things by how they relate to a subject, and lists the ten categories.",
        lessons: [
          {
            id: "same-name-different-meaning",
            title: "Same name, different meaning",
            bekker: "1a1-1a15",
            minutes: 4,
            summary:
              "The work opens with three ways names relate to things. Things are named equivocally when they share a name but the definition that goes with the name differs: a real man and a man in a picture are both called an animal, but in different senses. Things are named univocally when they share both the name and the definition: a man and an ox are both animals in exactly the same sense. Things are named derivatively when their name comes from another name with a changed ending, as the grammarian takes his name from grammar and the courageous man from courage. Before asking what something is, Aristotle asks whether a shared word really means one thing.",
            passage: {
              text: "Things are said to be named 'equivocally' when, though they have a common name, the definition corresponding with the name differs for each. Thus, a real man and a figure in a picture can both lay claim to the name 'animal'; yet these are equivocally so named, for, though they have a common name, the definition corresponding with the name differs for each.",
              ref: "1, 1a1-6",
            },
            terms: [
              { greek: "ὁμώνυμα", translit: "homōnyma", english: "equivocals", gloss: "Things that share a name but not the definition that goes with it." },
              { greek: "συνώνυμα", translit: "synōnyma", english: "univocals", gloss: "Things that share both the name and its definition." },
              { greek: "παρώνυμα", translit: "parōnyma", english: "derivatives", gloss: "Things named from another name with a change of ending." },
            ],
            checks: [
              {
                q: "Why are a real man and a man in a picture named 'equivocally'?",
                options: [
                  "They share the name 'animal' but the definition differs for each",
                  "They share both the name and the definition",
                  "One takes its name from the other with a different ending",
                  "Neither can properly be called an animal",
                ],
                answer: 0,
                why: "The passage says they have a common name, but 'the definition corresponding with the name differs for each.'",
              },
              {
                q: "A man and an ox are both called 'animal'. How are they named?",
                options: ["Equivocally", "Univocally", "Derivatively"],
                answer: 1,
                why: "Both the name and the definition of 'animal' are the same for each, which is what Aristotle calls univocal naming.",
              },
            ],
            journal: "Which word in an argument you care about is being used in two senses without anyone noticing?",
          },
          {
            id: "said-of-and-present-in",
            title: "Said of a subject, or present in one",
            bekker: "1a20-1b24",
            minutes: 5,
            summary:
              "Aristotle sorts things by two relations to a subject. Some things are said of a subject: 'man' is said of the individual man. Some are present in a subject, meaning they cannot exist apart from it, though not as a part is in a whole: a particular whiteness is in a body. Combining the two gives four classes. Some things are said of a subject but are in none, like 'man'. Some are in a subject but said of none, like a particular bit of grammatical knowledge. Some are both, like knowledge, which is in the mind and said of grammar. And some are neither, like the individual man or horse. He adds that whatever is said of a predicate is also said of its subject.",
            passage: {
              text: "Some things, again, are present in a subject, but are never predicable of a subject. For instance, a certain point of grammatical knowledge is present in the mind, but is not predicable of any subject; or again, a certain whiteness may be present in the body (for colour requires a material basis), yet it is never predicable of anything.",
              ref: "2, 1a",
            },
            terms: [
              { greek: "ὑποκείμενον", translit: "hypokeimenon", english: "subject", gloss: "What underlies: that of which things are said, or in which they are." },
              { greek: "καθ᾽ ὑποκειμένου", translit: "kath' hypokeimenou", english: "said of a subject", gloss: "Predicated of a subject as its kind, as 'man' of Socrates." },
              { greek: "ἐν ὑποκειμένῳ", translit: "en hypokeimenōi", english: "present in a subject", gloss: "Unable to exist apart from the subject it is in, as a colour in a body." },
            ],
            checks: [
              {
                q: "What does Aristotle mean by 'present in a subject'?",
                options: [
                  "Being a part of a whole",
                  "Being incapable of existing apart from the subject",
                  "Being predicated of the subject as its kind",
                  "Being named after the subject",
                ],
                answer: 1,
                why: "He says he does not mean present as a part in a whole, but 'incapable of existence apart from the said subject.'",
              },
              {
                q: "Which example does the passage give of something present in a subject but never predicable of one?",
                options: ["The species 'man'", "A certain whiteness in a body", "The genus 'animal'", "The individual horse"],
                answer: 1,
                why: "A particular whiteness is in a body, since colour needs a material basis, yet it is never said of anything.",
              },
            ],
            journal: "What in you exists only in you, the way a colour exists only in a body?",
          },
          {
            id: "ten-categories",
            title: "Ten kinds of thing we say",
            bekker: "1b25-2a10",
            minutes: 5,
            summary:
              "Every expression that is not combined with others signifies one of ten things: substance, quantity, quality, relation, place, time, position, state, action or affection. Aristotle gives examples: 'man' or 'horse' for substance, 'two cubits long' for quantity, 'white' for quality, 'double' for relation, 'in the Lyceum' for place, 'yesterday' for time, 'sitting' for position, 'armed' for state, 'to cauterize' for action, 'to be cauterized' for affection. None of these on its own affirms anything. Only when terms are combined does a statement arise, and only a statement can be true or false. 'Man' or 'runs' alone is neither.",
            passage: {
              text: "Expressions which are in no way composite signify substance, quantity, quality, relation, place, time, position, state, action, or affection. To sketch my meaning roughly, examples of substance are 'man' or 'the horse', of quantity, such terms as 'two cubits long' or 'three cubits long', of quality, such attributes as 'white', 'grammatical'.",
              ref: "4, 1b25-28",
            },
            terms: [
              { greek: "κατηγορία", translit: "katēgoria", english: "category, predication", gloss: "One of the highest kinds of thing that can be said of something." },
              { greek: "ποσόν", translit: "poson", english: "quantity", gloss: "How much or how many: 'two cubits long'." },
              { greek: "ποιόν", translit: "poion", english: "quality", gloss: "What sort: 'white', 'grammatical'." },
            ],
            checks: [
              {
                q: "According to the passage, what does 'two cubits long' signify?",
                options: ["Substance", "Quality", "Quantity", "Relation"],
                answer: 2,
                why: "The passage gives 'two cubits long' and 'three cubits long' as examples of quantity.",
              },
              {
                q: "Can an uncombined expression such as 'man' or 'runs' be true or false?",
                options: [
                  "Yes, always",
                  "No, truth and falsity arise only when terms are combined",
                  "Only if it names a substance",
                ],
                answer: 1,
                why: "Aristotle says no term by itself involves an affirmation; statements arise from combining terms, and only they are true or false.",
              },
            ],
            journal: "If you described yourself today using only a few of the ten categories, which would you reach for first, and what would that leave out?",
          },
        ],
      },
      {
        id: "substance",
        title: "Chapter 5: Substance",
        bekker: "2a11-4b19",
        line: "Aristotle sets out what substance is, separates primary from secondary substance, and finds its most distinctive mark.",
        lessons: [
          {
            id: "primary-and-secondary-substance",
            title: "The individual comes first",
            bekker: "2a11-3a6",
            minutes: 5,
            summary:
              "Substance in the primary and strictest sense is what is neither said of a subject nor present in one: this man, this horse. Species and genera that contain these individuals are substances in a secondary sense: 'man' and 'animal'. Everything else is either said of primary substances or present in them, so if primary substances did not exist, nothing else could. Of the secondary substances, the species is more truly substance than the genus, because it tells us more about the individual: calling someone a man says more than calling him an animal. Only species and genera are called secondary substances, since only they say what an individual is; being white or running does not.",
            passage: {
              text: "Substance, in the truest and primary and most definite sense of the word, is that which is neither predicable of a subject nor present in a subject; for instance, the individual man or horse. But in a secondary sense those things are called substances within which, as species, the primary substances are included; also those which, as genera, include the species.",
              ref: "5, 2a11-16",
            },
            terms: [
              { greek: "οὐσία", translit: "ousia", english: "substance", gloss: "What a thing is in its own right; in the Categories, first of all the individual." },
              { greek: "πρώτη οὐσία", translit: "prōtē ousia", english: "primary substance", gloss: "The individual: neither said of nor present in a subject." },
              { greek: "δευτέρα οὐσία", translit: "deutera ousia", english: "secondary substance", gloss: "The species and genus that say what an individual is." },
            ],
            checks: [
              {
                q: "What is substance in the primary sense?",
                options: [
                  "The genus 'animal'",
                  "The individual man or horse",
                  "Any quality present in a body",
                  "The species 'man'",
                ],
                answer: 1,
                why: "The passage says primary substance is neither said of nor present in a subject, 'for instance, the individual man or horse.'",
              },
              {
                q: "Why is the species more truly substance than the genus?",
                options: [
                  "It is older",
                  "It is closer to the individual and tells us more about it",
                  "It is present in more subjects",
                ],
                answer: 1,
                why: "Aristotle says stating the species gives a more instructive account of an individual than stating the genus, which is too general.",
              },
            ],
            journal: "When someone asks what you are, which answer says the most about you, and which only sounds informative?",
          },
          {
            id: "substance-admits-contraries",
            title: "What stays the same through change",
            bekker: "3b24-4b19",
            minutes: 5,
            summary:
              "Aristotle lists marks of substance. It has no contrary: nothing is the contrary of this man. It does not admit of more and less: one man is not more a man than another, though one white thing can be whiter than another. Its most distinctive mark is that, while remaining one and the same, it can take on contrary qualities: the same person is warm at one time and cold at another, good at one time and bad at another. No colour can be both white and black. Someone might object that a statement can be true and later false, but Aristotle answers that the statement itself does not change; the facts do.",
            passage: {
              text: "The most distinctive mark of substance appears to be that, while remaining numerically one and the same, it is capable of admitting contrary qualities. From among things other than substance, we should find ourselves unable to bring forward any which possessed this mark. Thus, one and the same colour cannot be white and black.",
              ref: "5, 4a",
            },
            terms: [
              { greek: "ἐναντία", translit: "enantia", english: "contraries", gloss: "Opposites at the far ends of one range, as hot and cold or good and bad." },
              { greek: "ἓν ἀριθμῷ", translit: "hen arithmōi", english: "one in number", gloss: "One and the same individual, counted once." },
            ],
            checks: [
              {
                q: "What does Aristotle call the most distinctive mark of substance?",
                options: [
                  "It has no contrary",
                  "It can admit contrary qualities while remaining one and the same",
                  "It is present in a subject",
                  "It admits of more and less",
                ],
                answer: 1,
                why: "The passage names this as the most distinctive mark: remaining 'numerically one and the same' while admitting contraries.",
              },
              {
                q: "How does Aristotle answer the objection that a statement can be both true and false?",
                options: [
                  "He grants that statements are substances",
                  "He says the statement itself does not change; the facts change",
                  "He denies that any statement is ever false",
                ],
                answer: 1,
                why: "He says the truth or falsity of a statement depends on facts, not on any change in the statement itself.",
              },
            ],
            journal: "What in you has stayed one and the same while you have been, at different times, contrary things?",
          },
        ],
      },
      {
        id: "quantity-relation-quality",
        title: "Chapters 6-9: Quantity, relation and quality",
        bekker: "4b20-11b14",
        line: "Aristotle examines three of the other categories in turn and tests each against the marks he found for substance.",
        lessons: [
          {
            id: "relatives",
            title: "Things known only by reference to another",
            bekker: "6a36-8b24",
            minutes: 5,
            summary:
              "Quantity is either discrete, like number, or continuous, like a line or time, and it does not admit of more and less. Relatives are things explained by reference to something else: the superior is superior to something, the double is double of something. Habit, disposition, perception and knowledge are also relatives, since knowledge is always knowledge of something. Aristotle notes that relatives usually reciprocate, as master and slave or double and half, and that many come into being together. He tests whether any substance could be a relative and concludes that a relative is something whose being is just its being related to another.",
            passage: {
              text: "Those things are called relative, which, being either said to be of something else or related to something else, are explained by reference to that other thing. For instance, the word 'superior' is explained by reference to something else, for it is superiority over something else that is meant.",
              ref: "7, 6a36-b2",
            },
            terms: [
              { greek: "πρός τι", translit: "pros ti", english: "relative", gloss: "Literally 'toward something': what is what it is in relation to another." },
              { greek: "ποσόν", translit: "poson", english: "quantity", gloss: "Discrete like number, or continuous like a line." },
            ],
            checks: [
              {
                q: "How is a relative explained?",
                options: [
                  "By reference to something else",
                  "By listing its parts",
                  "By naming its genus",
                  "By saying when it exists",
                ],
                answer: 0,
                why: "The passage defines relatives as things 'explained by reference to that other thing.'",
              },
              {
                q: "Which of these does Aristotle count as a relative?",
                options: ["Knowledge, since it is knowledge of something", "The individual horse", "Two cubits long"],
                answer: 0,
                why: "He lists knowledge among relatives, explaining that knowledge is always knowledge of something.",
              },
            ],
            journal: "Which of the ways you describe yourself only make sense in relation to someone else?",
          },
          {
            id: "habit-and-disposition",
            title: "Lasting habits and passing conditions",
            bekker: "8b25-11a38",
            minutes: 5,
            summary:
              "Quality is that in virtue of which things are said to be such and such, and it has several kinds. The first is habit or disposition. A habit is more lasting and firmly settled: knowledge and the virtues, such as justice and self-restraint, are hard to dislodge. A disposition is easily changed: heat, cold, health and disease come and go. Every habit is also a disposition, but not every disposition is a habit. Other kinds of quality are natural capacities, affective qualities like sweetness or a pale complexion, and shape. Qualities admit contraries and often admit of more and less, and things are called alike in respect of quality.",
            passage: {
              text: "Quality is a term that is used in many senses. One sort of quality let us call 'habit' or 'disposition'. Habit differs from disposition in being more lasting and more firmly established. The various kinds of knowledge and of virtue are habits, for knowledge, even when acquired only in a moderate degree, is, it is agreed, abiding in its character and difficult to displace",
              ref: "8, 8b",
            },
            terms: [
              { greek: "ἕξις", translit: "hexis", english: "habit, state", gloss: "A settled condition, hard to dislodge, such as a virtue." },
              { greek: "διάθεσις", translit: "diathesis", english: "disposition", gloss: "A condition easily changed, such as being warm or ill." },
              { greek: "ποιότης", translit: "poiotēs", english: "quality", gloss: "That in virtue of which things are said to be such and such." },
            ],
            checks: [
              {
                q: "How does a habit differ from a disposition?",
                options: [
                  "A habit is more lasting and firmly established",
                  "A habit is easily changed",
                  "A habit is a relative and a disposition a substance",
                ],
                answer: 0,
                why: "The passage says habit differs from disposition 'in being more lasting and more firmly established.'",
              },
              {
                q: "Which of these is an example of a habit in the passage?",
                options: ["Being warm", "Knowledge", "Being ill", "Being cold"],
                answer: 1,
                why: "Knowledge and the virtues are given as habits because they are abiding and difficult to displace.",
              },
            ],
            journal: "Which of your good qualities is a settled habit, and which is still only a passing disposition?",
          },
        ],
      },
      {
        id: "opposites-priority-change",
        title: "Chapters 10-15: Opposites, priority and change",
        bekker: "11b15-15b33",
        line: "Aristotle sorts the senses of opposite, prior, simultaneous, movement and having.",
        lessons: [
          {
            id: "four-kinds-of-opposite",
            title: "Four ways things are opposed",
            bekker: "11b15-13b35",
            minutes: 6,
            summary:
              "Things are opposed in four ways: as correlatives, like double and half; as contraries, like good and bad; as privation and possession, like blindness and sight; and as affirmation and denial, like 'he sits' and 'he does not sit'. Correlatives are explained by reference to each other; contraries are not. Some contraries have an intermediate, like grey between white and black. A privation is the absence of what is natural to a subject at the time it should be present. Only with affirmation and denial is it always the case that one is true and the other false: if Socrates does not exist, 'Socrates is ill' is false and 'Socrates is not ill' is true.",
            passage: {
              text: "We must next explain the various senses in which the term 'opposite' is used. Things are said to be opposed in four senses: (i) as correlatives to one another, (ii) as contraries to one another, (iii) as privatives to positives, (iv) as affirmatives to negatives.",
              ref: "10, 11b",
            },
            terms: [
              { greek: "ἀντικείμενα", translit: "antikeimena", english: "opposites", gloss: "Things set against each other, in any of four ways." },
              { greek: "στέρησις", translit: "sterēsis", english: "privation", gloss: "The lack of what a subject would naturally have, as blindness of sight." },
              { greek: "ἀντίφασις", translit: "antiphasis", english: "contradiction", gloss: "An affirmation and its denial, of which one must be true." },
            ],
            checks: [
              {
                q: "Blindness and sight are opposed in which way?",
                options: ["As correlatives", "As contraries", "As privative to positive", "As affirmation to denial"],
                answer: 2,
                why: "Aristotle gives blindness and sight as his example of privatives and positives.",
              },
              {
                q: "For which kind of opposites must one always be true and the other false?",
                options: ["Contraries", "Correlatives", "Affirmation and denial"],
                answer: 2,
                why: "He says that only with affirmation and denial does the rule hold that one of the pair must be true and the other false, whether or not the subject exists.",
              },
            ],
            journal: "In a disagreement you are in, are the two positions true contraries, or could both be false?",
          },
          {
            id: "senses-of-prior",
            title: "What comes first, and how",
            bekker: "14a26-15b33",
            minutes: 5,
            summary:
              "Aristotle distinguishes senses of 'prior'. First and most properly, prior in time: older. Second, prior as what the other depends on when the dependence cannot be reversed: if there are two, there is one, but not the reverse. Third, prior in an order, as the elements come before the propositions in geometry. Fourth, the better and more honoured is said to be prior, a sense he calls the most far-fetched. He adds a fifth: of two things that imply each other, the cause is prior by nature. He goes on to the senses of 'simultaneous', the six kinds of movement (generation, destruction, increase, diminution, alteration, change of place) and the senses of 'having'.",
            passage: {
              text: "Secondly, one thing is said to be 'prior' to another when the sequence of their being cannot be reversed. In this sense 'one' is 'prior' to 'two'. For if 'two' exists, it follows directly that 'one' must exist, but if 'one' exists, it does not follow necessarily that 'two' exists",
              ref: "12, 14a",
            },
            terms: [
              { greek: "πρότερον", translit: "proteron", english: "prior", gloss: "Before: in time, in dependence, in order, in honour, or as a cause." },
              { greek: "κίνησις", translit: "kinēsis", english: "movement, change", gloss: "Of six kinds, from coming to be to change of place." },
            ],
            checks: [
              {
                q: "Why is 'one' prior to 'two' in the second sense?",
                options: [
                  "One is older than two",
                  "If two exists, one must exist, but not the reverse",
                  "One is more honourable than two",
                ],
                answer: 1,
                why: "The passage says the sequence cannot be reversed: two implies one, but one does not imply two.",
              },
              {
                q: "Which sense of 'prior' does Aristotle call the most far-fetched?",
                options: ["Prior in time", "Prior in order", "The better and more honourable being called prior"],
                answer: 2,
                why: "He says the sense in which what is better and more honoured comes first 'is perhaps the most far-fetched.'",
              },
            ],
            journal: "What in your life does everything else depend on, in the sense that it could exist without the rest but not the rest without it?",
          },
        ],
      },
    ],
  },
  {
    id: "on-interpretation",
    title: "On Interpretation",
    greek: "Περὶ ἑρμηνείας",
    latin: "De Interpretatione",
    subject: "logic",
    level: "Intermediate",
    bekker: "16a-24b",
    about:
      "On Interpretation studies the statement: what a noun, a verb and a sentence are, how an affirmation is opposed to a denial, and when one of a pair must be true. Its ninth chapter, on tomorrow's sea-fight, is the first sustained argument about whether statements about the future are already true.",
    before: ["categories"],
    caveat: "",
    translation: {
      translator: "E. M. Edghill",
      year: 1928,
      title: "On Interpretation",
      url: "https://classics.mit.edu/Aristotle/interpretation.html",
    },
    units: [
      {
        id: "names-verbs-statements",
        title: "Chapters 1-6: Names, verbs and statements",
        bekker: "16a1-17a37",
        line: "Aristotle defines the parts of speech a statement is made from and picks out the statement as the sentence that is true or false.",
        lessons: [
          {
            id: "words-are-symbols",
            title: "Words are signs of thoughts",
            bekker: "16a1-16a18",
            minutes: 4,
            summary:
              "Spoken words are symbols of what is in the mind, and written words are symbols of spoken words. Writing and speech sounds differ from people to people, but the mental experiences they signify are the same for all, and so are the things those experiences are likenesses of. As some thoughts are neither true nor false and others must be one or the other, so it is in speech: truth and falsity need combination and separation. A noun or verb alone, like 'man' or 'white', is not yet true or false. Even 'goat-stag' means something, but it is neither true nor false until 'is' or 'is not' is added.",
            passage: {
              text: "Spoken words are the symbols of mental experience and written words are the symbols of spoken words. Just as all men have not the same writing, so all men have not the same speech sounds, but the mental experiences, which these directly symbolize, are the same for all, as also are those things of which our experiences are the images.",
              ref: "1, 16a3-8",
            },
            terms: [
              { greek: "σύμβολον", translit: "symbolon", english: "symbol", gloss: "A token that stands for something by agreement." },
              { greek: "παθήματα τῆς ψυχῆς", translit: "pathēmata tēs psychēs", english: "affections of the soul", gloss: "What is in the mind: the thoughts words stand for." },
            ],
            checks: [
              {
                q: "What do written words symbolize, according to the passage?",
                options: ["Mental experiences directly", "Spoken words", "Things in the world directly", "Nothing at all"],
                answer: 1,
                why: "The passage says 'written words are the symbols of spoken words.'",
              },
              {
                q: "What is the same for all people, though speech differs?",
                options: [
                  "Their writing",
                  "Their speech sounds",
                  "The mental experiences the words symbolize",
                ],
                answer: 2,
                why: "Aristotle says speech and writing differ, but the mental experiences they symbolize 'are the same for all.'",
              },
            ],
            journal: "When you struggle to put something into words, is the thought already clear and only the words missing?",
          },
          {
            id: "only-statements-are-true-or-false",
            title: "Only statements are true or false",
            bekker: "16a19-17a37",
            minutes: 5,
            summary:
              "A noun is a sound that signifies by convention, without reference to time, no part of which signifies on its own. A verb also carries the notion of time and is always a sign of something said of something else. 'Not-man' is an indefinite noun, not a noun proper. A sentence is speech with meaning whose parts have meaning, and it signifies by convention, not by nature. But not every sentence is a statement: only sentences in which there is truth or falsity are. A prayer is a sentence but neither true nor false. Other kinds of sentence belong to rhetoric or poetry. A simple statement affirms or denies something of something.",
            passage: {
              text: "Every sentence has meaning, not as being the natural means by which a physical faculty is realized, but, as we have said, by convention. Yet every sentence is not a proposition; only such are propositions as have in them either truth or falsity. Thus a prayer is a sentence, but is neither true nor false.",
              ref: "4, 17a",
            },
            terms: [
              { greek: "ὄνομα", translit: "onoma", english: "noun, name", gloss: "A sound meaningful by convention, without reference to time." },
              { greek: "ῥῆμα", translit: "rhēma", english: "verb", gloss: "A word that also signifies time and is said of something else." },
              { greek: "ἀπόφανσις", translit: "apophansis", english: "statement, proposition", gloss: "A sentence that is true or false." },
            ],
            checks: [
              {
                q: "Why is a prayer not a proposition?",
                options: [
                  "It has no meaning",
                  "It is neither true nor false",
                  "It contains no nouns",
                  "It signifies by nature, not convention",
                ],
                answer: 1,
                why: "The passage says only sentences with truth or falsity are propositions, and 'a prayer is a sentence, but is neither true nor false.'",
              },
              {
                q: "How does a sentence have meaning, according to Aristotle?",
                options: ["By nature", "By convention", "Only when it is true"],
                answer: 1,
                why: "He says every sentence has meaning 'by convention', not as a natural means.",
              },
            ],
            journal: "How much of what you say in a day is neither true nor false, like a prayer, and what does that speech do for you?",
          },
        ],
      },
      {
        id: "contraries-and-contradictories",
        title: "Chapters 7-8: Contraries and contradictories",
        bekker: "17a38-18a27",
        line: "Aristotle sets out how universal and particular statements are opposed, and which pairs cannot both be true or both false.",
        lessons: [
          {
            id: "contrary-and-contradictory",
            title: "Contrary and contradictory statements",
            bekker: "17a38-18a12",
            minutes: 6,
            summary:
              "Some terms are universal, said of many, like 'man'; others individual, like 'Callias'. 'Every man is white' and 'no man is white' are contraries: both universal, so both cannot be true, though both can be false. 'Every man is white' and 'not every man is white' are contradictories, as are 'no man is white' and 'some men are white': of these, one must be true and the other false. With an individual subject, as in 'Socrates is white' and 'Socrates is not white', one is true and one false. Each affirmation has exactly one denial proper to it. If a word has two meanings, the statement is not single.",
            passage: {
              text: "The affirmation 'every man is white' is the contradictory of the denial 'not every man is white', or again, the proposition 'no man is white' is the contradictory of the proposition 'some men are white'. But propositions are opposed as contraries when both the affirmation and the denial are universal, as in the sentences 'every man is white', 'no man is white'",
              ref: "7, 17b",
            },
            terms: [
              { greek: "καθόλου", translit: "katholou", english: "universal", gloss: "Said of many, or said of all of something." },
              { greek: "κατάφασις", translit: "kataphasis", english: "affirmation", gloss: "Saying that something belongs to something." },
              { greek: "ἀπόφασις", translit: "apophasis", english: "denial", gloss: "Saying that something does not belong to something." },
            ],
            checks: [
              {
                q: "What is the contradictory of 'every man is white'?",
                options: ["No man is white", "Not every man is white", "Some men are white"],
                answer: 1,
                why: "The passage says 'every man is white' is the contradictory of 'not every man is white.'",
              },
              {
                q: "'Every man is white' and 'no man is white' are what kind of pair?",
                options: [
                  "Contradictories: one must be true",
                  "Contraries: both universal, both cannot be true",
                  "Not opposed at all",
                ],
                answer: 1,
                why: "They are contraries because both the affirmation and the denial are universal; Aristotle adds that both cannot be true.",
              },
            ],
            journal: "When you reject a sweeping claim, do you tend to assert the opposite sweeping claim, or only deny that it holds every time?",
          },
        ],
      },
      {
        id: "sea-fight",
        title: "Chapter 9: Tomorrow's sea-fight",
        bekker: "18a28-19b4",
        line: "Aristotle asks whether statements about future particular events are already true, and argues that deliberation shows they are not all necessary.",
        lessons: [
          {
            id: "if-every-statement-is-fixed",
            title: "If every prediction is already true",
            bekker: "18a28-18b25",
            minutes: 6,
            summary:
              "For what is or has been, an affirmation or its denial must be true. Aristotle asks whether the same holds for individual future events. If one person says something will happen and another denies it, and one of them must already be right, then it seems everything happens of necessity and nothing by chance. If it is white now, it was always true to say it would be white. It does not help to say that neither prediction is true, for that has its own absurd results. If all this followed, Aristotle says, there would be no need to deliberate or take trouble, since what was truly predicted ten thousand years before would come about.",
            passage: {
              text: "Now if this be so, nothing is or takes place fortuitously, either in the present or in the future, and there are no real alternatives; everything takes place of necessity and is fixed. For either he that affirms that it will take place or he that denies this is in correspondence with fact",
              ref: "9, 18b",
            },
            terms: [
              { greek: "ἀνάγκη", translit: "anankē", english: "necessity", gloss: "What cannot be otherwise." },
              { greek: "τὸ ὁπότερ᾽ ἔτυχεν", translit: "to hopoter' etychen", english: "as chance has it", gloss: "What may turn out either way." },
            ],
            checks: [
              {
                q: "What follows, on the view Aristotle is examining, if every prediction is already true or false?",
                options: [
                  "Some events happen by chance",
                  "Everything takes place of necessity and is fixed",
                  "No statement is ever true",
                ],
                answer: 1,
                why: "The passage says that if this were so, 'there are no real alternatives; everything takes place of necessity and is fixed.'",
              },
              {
                q: "Which consequence does Aristotle draw from that view?",
                options: [
                  "There would be no need to deliberate",
                  "Predictions would always be false",
                  "Only universal statements could be true",
                ],
                answer: 0,
                why: "He says that on this supposition 'there would be no need to deliberate or to take trouble.'",
              },
            ],
            journal: "Is there a choice ahead of you that you treat as already settled, and what would change if you saw it as open?",
          },
          {
            id: "the-sea-fight",
            title: "A sea-fight tomorrow",
            bekker: "18b26-19b4",
            minutes: 6,
            summary:
              "Aristotle rejects the conclusion. Deliberation and action do bring about future things, and many things can either be or not be: a coat may be cut in half, or it may wear out first. What is must be when it is, but that is different from saying that whatever is, is necessary. It is necessary that a sea-fight either will or will not take place tomorrow, but it is not necessary that it will, nor necessary that it will not. Aristotle seems to conclude that for such open future events one of the pair will be true, but neither is yet determinately true; scholars still dispute exactly what he means.",
            passage: {
              text: "A sea-fight must either take place to-morrow or not, but it is not necessary that it should take place to-morrow, neither is it necessary that it should not take place, yet it is necessary that it either should or should not take place to-morrow.",
              ref: "9, 19a30-33",
            },
            terms: [
              { greek: "δύναμις", translit: "dynamis", english: "potentiality", gloss: "The capacity to be or not to be, to happen or not happen." },
              { greek: "βουλεύεσθαι", translit: "bouleuesthai", english: "to deliberate", gloss: "To weigh what to do; for Aristotle a cause of future events." },
            ],
            checks: [
              {
                q: "What does Aristotle say is necessary about tomorrow's sea-fight?",
                options: [
                  "That it will take place",
                  "That it will not take place",
                  "That it either will or will not take place",
                ],
                answer: 2,
                why: "The passage says neither outcome is necessary, 'yet it is necessary that it either should or should not take place to-morrow.'",
              },
              {
                q: "What example does Aristotle use to show that things can go either way?",
                options: [
                  "A coat that may be cut in half or wear out first",
                  "Two being double of one",
                  "The sun's eclipse",
                ],
                answer: 0,
                why: "He says it is possible that the coat may be cut in half, and yet it may wear out first.",
              },
            ],
            journal: "What will happen tomorrow that is up to you, and what makes it genuinely open rather than already decided?",
          },
        ],
      },
      {
        id: "negation-and-modality",
        title: "Chapters 10-14: Negation and modality",
        bekker: "19b5-24b9",
        line: "Aristotle works out how statements with 'not', and statements of possibility and necessity, are denied.",
        lessons: [
          {
            id: "denying-possible-and-necessary",
            title: "How to deny 'possible' and 'necessary'",
            bekker: "21a34-23a26",
            minutes: 6,
            summary:
              "The contradictory of 'man is white' is 'man is not white', not 'man is not-white'. The negation goes with the verb. Applying this to possibility raises a puzzle: what may be cut may also not be cut, so 'it may be' and 'it may not be' can both be true and are not contradictories. The contradictory of 'it may be' is 'it cannot be'. Likewise the contradictory of 'it is necessary that it should be' is 'it is not necessary that it should be', not 'it is necessary that it should not be'. Aristotle then sets out which modal statements follow from which, and notes that what is necessary is also possible in one sense.",
            passage: {
              text: "The propositions which have to do with necessity are governed by the same principle. The contradictory of 'it is necessary that it should be', is not 'it is necessary that it should not be,' but 'it is not necessary that it should be', and the contradictory of 'it is necessary that it should not be' is 'it is not necessary that it should not be'.",
              ref: "12, 22a",
            },
            terms: [
              { greek: "ἀναγκαῖον", translit: "anankaion", english: "necessary", gloss: "What cannot be otherwise." },
              { greek: "δυνατόν", translit: "dynaton", english: "possible", gloss: "What may be, and in many cases may also not be." },
              { greek: "ἐνδεχόμενον", translit: "endechomenon", english: "contingent", gloss: "What admits of being and of not being." },
            ],
            checks: [
              {
                q: "What is the contradictory of 'it is necessary that it should be'?",
                options: [
                  "It is necessary that it should not be",
                  "It is not necessary that it should be",
                  "It may be",
                ],
                answer: 1,
                why: "The passage says its contradictory is 'it is not necessary that it should be', not 'it is necessary that it should not be.'",
              },
              {
                q: "Why is 'it may not be' not the contradictory of 'it may be'?",
                options: [
                  "Because both can be true of the same thing",
                  "Because neither can ever be true",
                  "Because 'may' is not a verb",
                ],
                answer: 0,
                why: "Aristotle says what may be cut may also not be cut, so both are true together, which contradictories cannot be.",
              },
            ],
            journal: "When you tell yourself 'I have to', is it true that you could not do otherwise, or only that you would rather not?",
          },
        ],
      },
    ],
  },
  {
    id: "prior-analytics",
    title: "Prior Analytics",
    greek: "Ἀναλυτικὰ πρότερα",
    latin: "Analytica Priora",
    subject: "logic",
    level: "Intermediate",
    bekker: "24a-70b",
    about:
      "The Prior Analytics is the first formal logic: it defines the syllogism, sorts valid forms into three figures, and shows how to find premisses for any conclusion. Book II tests arguments for faults and places induction, signs and examples within the same theory.",
    before: ["categories", "on-interpretation"],
    caveat: "",
    translation: {
      translator: "A. J. Jenkinson",
      year: 1928,
      title: "Prior Analytics",
      url: "https://classics.mit.edu/Aristotle/prior.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: The syllogism and how to find one",
        bekker: "24a10-52b34",
        line: "Aristotle defines the syllogism, works through the three figures and their modal forms, and teaches how to find premisses.",
        lessons: [
          {
            id: "what-a-syllogism-is",
            title: "What follows of necessity",
            bekker: "24a10-24b30",
            minutes: 5,
            summary:
              "Aristotle says the inquiry is about demonstration. A premiss is a sentence affirming or denying one thing of another, and it is universal, particular or indefinite. A term is what a premiss is resolved into: the predicate and that of which it is predicated. A syllogism is discourse in which, certain things being stated, something other than what is stated follows of necessity from their being so, needing no further term from outside. A syllogism is perfect when nothing more is needed to make plain what follows, and imperfect when one or more propositions that follow from the premisses must still be stated.",
            passage: {
              text: "A syllogism is discourse in which, certain things being stated, something other than what is stated follows of necessity from their being so. I mean by the last phrase that they produce the consequence, and by this, that no further term is required from without in order to make the consequence necessary.",
              ref: "I.1, 24b18-22",
            },
            terms: [
              { greek: "συλλογισμός", translit: "syllogismos", english: "syllogism, deduction", gloss: "An argument whose conclusion follows of necessity from what is stated." },
              { greek: "πρότασις", translit: "protasis", english: "premiss", gloss: "A sentence affirming or denying one thing of another." },
              { greek: "ὅρος", translit: "horos", english: "term", gloss: "What a premiss resolves into: subject or predicate." },
            ],
            checks: [
              {
                q: "What makes something a syllogism, according to the passage?",
                options: [
                  "Its conclusion is something other than what is stated and follows of necessity",
                  "Its premisses are all true",
                  "It repeats one of its premisses as its conclusion",
                  "It persuades the listener",
                ],
                answer: 0,
                why: "The passage defines a syllogism as discourse in which 'something other than what is stated follows of necessity.'",
              },
              {
                q: "What does Aristotle mean by saying the premisses 'produce the consequence'?",
                options: [
                  "That no further term is needed from outside",
                  "That the conclusion is probable",
                  "That the listener must agree",
                ],
                answer: 0,
                why: "He explains the phrase as meaning 'no further term is required from without in order to make the consequence necessary.'",
              },
            ],
            journal: "Which of your firm conclusions would you find, on inspection, rests on a premiss you never stated?",
          },
          {
            id: "first-figure",
            title: "The perfect form: the first figure",
            bekker: "25b26-26b33",
            minutes: 6,
            summary:
              "When three terms are related so that the last is contained in the middle as in a whole, and the middle is contained in or excluded from the first, there is a perfect syllogism. The middle term is the one contained in another and containing another. If A is predicated of all B, and B of all C, then A must be predicated of all C. If A belongs to no B, and B to all C, then no C is A. Aristotle also shows which arrangements give no syllogism, using sets of example terms, such as animal, man, horse, to show that nothing necessary follows. The second and third figures are made perfect by reducing them to the first.",
            passage: {
              text: "If A is predicated of all B, and B of all C, A must be predicated of all C: we have already explained what we mean by 'predicated of all'. Similarly also, if A is predicated of no B, and B of all C, it is necessary that no C will be A.",
              ref: "I.4, 25b37-26a2",
            },
            terms: [
              { greek: "μέσος ὅρος", translit: "mesos horos", english: "middle term", gloss: "The term that links the two extremes and drops out of the conclusion." },
              { greek: "σχῆμα", translit: "schēma", english: "figure", gloss: "An arrangement of the middle term relative to the extremes." },
              { greek: "τέλειος", translit: "teleios", english: "perfect, complete", gloss: "Needing nothing further to show that the conclusion follows." },
            ],
            checks: [
              {
                q: "If A is predicated of all B, and B of all C, what follows?",
                options: ["A is predicated of all C", "C is predicated of all A", "A is predicated of no C", "Nothing follows"],
                answer: 0,
                why: "The passage says 'A must be predicated of all C.'",
              },
              {
                q: "If A belongs to no B, and B to all C, what follows?",
                options: ["All C is A", "No C is A", "Some C is A"],
                answer: 1,
                why: "The passage says 'it is necessary that no C will be A.'",
              },
            ],
            journal: "What general rule do you apply to yourself, and what does it force you to conclude in a particular case you would rather avoid?",
          },
          {
            id: "finding-premisses",
            title: "How to hunt for premisses",
            bekker: "43a20-46a30",
            minutes: 5,
            summary:
              "Knowing what a syllogism is does not give the power to make one. Aristotle notes that some things, like Callias, are predicated of nothing, while others are predicated of them. To argue for or against a claim, one should collect for each term what follows it, what it follows, and what cannot belong to it, and then look for a term linking the two. The method, he says, is the same in philosophy and in every art or study. In seeking truth one starts from premisses that match how things are; in dialectic one starts from what is generally accepted. Much of the material in each science comes from experience.",
            passage: {
              text: "The method is the same in all cases, in philosophy, in any art or study. We must look for the attributes and the subjects of both our terms, and we must supply ourselves with as many of these as possible, and consider them by means of the three terms, refuting statements in one way, confirming them in another",
              ref: "I.30, 46a",
            },
            terms: [
              { greek: "ἐπόμενα", translit: "hepomena", english: "consequents", gloss: "What follows from a term: the things that belong to it." },
              { greek: "ἐμπειρία", translit: "empeiria", english: "experience", gloss: "Repeated acquaintance with particulars, the source of each science's premisses." },
            ],
            checks: [
              {
                q: "Where does Aristotle say this method applies?",
                options: [
                  "Only in geometry",
                  "In all cases: philosophy and any art or study",
                  "Only in debates with opponents",
                ],
                answer: 1,
                why: "The passage opens: 'The method is the same in all cases, in philosophy, in any art or study.'",
              },
              {
                q: "What should we gather for both our terms?",
                options: [
                  "Their attributes and their subjects, as many as possible",
                  "Only their definitions",
                  "Only what others have said about them",
                ],
                answer: 0,
                why: "He says we must look for 'the attributes and the subjects of both our terms' and supply ourselves with as many as possible.",
              },
            ],
            journal: "For a question you keep circling, what do you actually know about each side of it, written down as a list?",
          },
          {
            id: "division-is-a-weak-syllogism",
            title: "Why division cannot prove",
            bekker: "46a31-46b39",
            minutes: 4,
            summary:
              "Aristotle criticizes the method of division used in Plato's school, which defines something by splitting a genus into kinds and choosing one side each time. Division, he says, is a weak syllogism: it begs what it ought to prove and always establishes something more general than what was sought. Those who used it thought they could demonstrate a thing's essence by it, and did not see what can and cannot be proved this way. In a demonstration the middle term must be narrower than the major term, but division works the other way, taking the universal as its middle.",
            passage: {
              text: "It is easy to see that division into classes is a small part of the method we have described: for division is, so to speak, a weak syllogism; for what it ought to prove, it begs, and it always establishes something more general than the attribute in question.",
              ref: "I.31, 46a31-34",
            },
            terms: [
              { greek: "διαίρεσις", translit: "diairesis", english: "division", gloss: "Splitting a genus into kinds, as a method of definition." },
              { greek: "αἰτεῖσθαι", translit: "aiteisthai", english: "to beg, to ask for", gloss: "To assume what should have been proved." },
            ],
            checks: [
              {
                q: "Why does Aristotle call division a weak syllogism?",
                options: [
                  "It begs what it ought to prove and establishes something too general",
                  "It uses too many terms",
                  "It always reaches a false conclusion",
                ],
                answer: 0,
                why: "The passage says 'what it ought to prove, it begs, and it always establishes something more general than the attribute in question.'",
              },
              {
                q: "How does division relate to the method Aristotle has described?",
                options: ["It is a small part of it", "It replaces it", "It has nothing to do with it"],
                answer: 0,
                why: "He says 'division into classes is a small part of the method we have described.'",
              },
            ],
            journal: "Where do you sort things into neat categories and then treat the sorting as if it proved something?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Testing arguments",
        bekker: "52b38-70b38",
        line: "Aristotle examines what syllogisms can and cannot do, the faults they fall into, and how induction, example and signs fit the theory.",
        lessons: [
          {
            id: "truth-from-falsehood",
            title: "True conclusions from false premisses",
            bekker: "53b4-57b17",
            minutes: 5,
            summary:
              "Premisses can be true, false, or one of each, and the conclusion is either true or false. From true premisses a false conclusion cannot follow. But a true conclusion can follow from false premisses: assume that every stone is an animal and every man a stone, and it follows that every man is an animal, which is true. Such a conclusion is true only as a fact, not because of the reason given; the reason cannot be established from false premisses. Aristotle works through the figures to show which combinations of false premisses can still yield a true conclusion.",
            passage: {
              text: "It is possible for the premisses of the syllogism to be true, or to be false, or to be the one true, the other false. The conclusion is either true or false necessarily. From true premisses it is not possible to draw a false conclusion, but a true conclusion may be drawn from false premisses, true however only in respect to the fact, not to the reason.",
              ref: "II.2, 53b4-9",
            },
            terms: [
              { greek: "ἀληθής", translit: "alēthēs", english: "true", gloss: "Saying of what is that it is." },
              { greek: "ψευδής", translit: "pseudēs", english: "false", gloss: "Saying of what is that it is not, or of what is not that it is." },
            ],
            checks: [
              {
                q: "Can a false conclusion follow from true premisses?",
                options: ["Yes, often", "No, it is not possible", "Only in the third figure"],
                answer: 1,
                why: "The passage says 'From true premisses it is not possible to draw a false conclusion.'",
              },
              {
                q: "When a true conclusion follows from false premisses, in what sense is it true?",
                options: [
                  "Only in respect of the fact, not the reason",
                  "In respect of both fact and reason",
                  "It is not really true",
                ],
                answer: 0,
                why: "Aristotle says it is 'true however only in respect to the fact, not to the reason.'",
              },
            ],
            journal: "Which belief of yours is true, but held for a reason that would not survive scrutiny?",
          },
          {
            id: "begging-the-question",
            title: "Begging the question",
            bekker: "64b28-65a37",
            minutes: 5,
            summary:
              "Failing to demonstrate can happen in many ways: not reasoning at all, reasoning from premisses less known than the conclusion, or proving the antecedent from its consequents. Begging the question is a distinct failure. Some things are known through themselves, the first principles, and others through something else. Whenever someone tries to prove what is not self-evident by means of itself, he begs the original question. This happens when a premiss is as uncertain as the conclusion because it is the same claim, or a claim convertible with it, in another form.",
            passage: {
              text: "Now begging the question is none of these: but since we get to know some things naturally through themselves, and other things by means of something else (the first principles through themselves, what is subordinate to them through something else), whenever a man tries to prove what is not self-evident by means of itself, then he begs the original question.",
              ref: "II.16, 64b",
            },
            terms: [
              { greek: "τὸ ἐν ἀρχῇ αἰτεῖσθαι", translit: "to en archēi aiteisthai", english: "begging the question", gloss: "Asking for, or assuming, the very point at issue." },
              { greek: "ἀρχή", translit: "archē", english: "principle, starting point", gloss: "What is known through itself and from which proof begins." },
            ],
            checks: [
              {
                q: "When does someone beg the original question?",
                options: [
                  "When he proves what is not self-evident by means of itself",
                  "When he starts from first principles",
                  "When his conclusion is false",
                  "When he uses three terms",
                ],
                answer: 0,
                why: "The passage says this happens 'whenever a man tries to prove what is not self-evident by means of itself.'",
              },
              {
                q: "What, according to the passage, is known through itself?",
                options: ["Everything", "The first principles", "Only conclusions"],
                answer: 1,
                why: "Aristotle says first principles are known through themselves, and what is subordinate to them through something else.",
              },
            ],
            journal: "In an argument you have made recently, did your premiss quietly say the same thing as your conclusion?",
          },
          {
            id: "induction",
            title: "Induction: from cases to the universal",
            bekker: "68b8-68b37",
            minutes: 5,
            summary:
              "Every belief comes either through syllogism or through induction. Induction proves the major term of the middle by means of the particular cases. Aristotle's example: man, horse and mule are long-lived; man, horse and mule are bileless; if the bileless animals are just these, then whatever is bileless is long-lived. Induction establishes first, immediate premisses, where there is no middle term to argue through. Syllogism through the middle is prior and better known by nature, but induction is clearer to us.",
            passage: {
              text: "Such is the syllogism which establishes the first and immediate premiss: for where there is a middle term the syllogism proceeds through the middle term; when there is no middle term, through induction. And in a way induction is opposed to syllogism: for the latter proves the major term to belong to the third term by means of the middle, the former proves the major to belong to the middle by means of the third.",
              ref: "II.23, 68b",
            },
            terms: [
              { greek: "ἐπαγωγή", translit: "epagōgē", english: "induction", gloss: "Leading from particular cases to a universal." },
              { greek: "ἄμεσος", translit: "amesos", english: "immediate", gloss: "Having no middle term between subject and predicate." },
            ],
            checks: [
              {
                q: "How is a premiss established when there is no middle term?",
                options: ["Through induction", "Through division", "It cannot be established"],
                answer: 0,
                why: "The passage says 'when there is no middle term, through induction.'",
              },
              {
                q: "Which is clearer to us, according to Aristotle?",
                options: [
                  "Syllogism through the middle term",
                  "Syllogism through induction",
                  "Neither is clearer",
                ],
                answer: 1,
                why: "He says syllogism through the middle is prior by nature, but syllogism through induction is clearer to us.",
              },
            ],
            journal: "What general truth about people did you learn from a handful of cases, and have you checked whether those cases were all there are?",
          },
          {
            id: "probabilities-and-signs",
            title: "Probabilities and signs",
            bekker: "70a2-70b38",
            minutes: 4,
            summary:
              "The book ends with arguments from probabilities and signs, the stuff of rhetorical enthymemes. A probability is a generally approved proposition, what people know happens for the most part, such as that the envious hate. A sign is a proposition, necessary or generally approved, that indicates something else: if one thing is or has happened, another is or has happened. Signs can be arranged in each of the three figures. Only a sign in the first figure is irrefutable, as when having milk shows that a woman is with child. Aristotle adds that one could read character from bodily features, if body and soul change together.",
            passage: {
              text: "A probability and a sign are not identical, but a probability is a generally approved proposition: what men know to happen or not to happen, to be or not to be, for the most part thus and thus, is a probability, e.g. 'the envious hate', 'the beloved show affection'.",
              ref: "II.27, 70a",
            },
            terms: [
              { greek: "εἰκός", translit: "eikos", english: "probability", gloss: "What is generally known to happen for the most part." },
              { greek: "σημεῖον", translit: "sēmeion", english: "sign", gloss: "A proposition that points to something else being so." },
              { greek: "ἐνθύμημα", translit: "enthymēma", english: "enthymeme", gloss: "A syllogism from probabilities or signs, used in rhetoric." },
            ],
            checks: [
              {
                q: "What is a probability, according to the passage?",
                options: [
                  "A necessary truth",
                  "A generally approved proposition about what happens for the most part",
                  "Any sign",
                ],
                answer: 1,
                why: "The passage says a probability is 'a generally approved proposition: what men know to happen ... for the most part.'",
              },
              {
                q: "Which example of a probability does the passage give?",
                options: ["The envious hate", "Every man is an animal", "Two is double of one"],
                answer: 0,
                why: "'The envious hate' and 'the beloved show affection' are the examples given.",
              },
            ],
            journal: "Which signs do you read in other people as if they were proofs, when they only hold for the most part?",
          },
        ],
      },
    ],
  },
  {
    id: "posterior-analytics",
    title: "Posterior Analytics",
    greek: "Ἀναλυτικὰ ὕστερα",
    latin: "Analytica Posteriora",
    subject: "logic",
    level: "Advanced",
    bekker: "71a-100b",
    about:
      "The Posterior Analytics asks what scientific knowledge is: knowing the cause, through demonstration from first principles that are themselves known without proof. Book II turns to definition and ends by explaining how perception, memory and experience lead to the grasp of first principles.",
    before: ["prior-analytics"],
    caveat: "",
    translation: {
      translator: "G. R. G. Mure",
      year: 1928,
      title: "Posterior Analytics",
      url: "https://classics.mit.edu/Aristotle/posterior.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: Demonstration",
        bekker: "71a1-89b20",
        line: "Aristotle defines scientific knowledge and demonstration, and works out what their premisses must be like.",
        lessons: [
          {
            id: "learning-from-what-we-know",
            title: "All learning starts from what we already know",
            bekker: "71a1-71b8",
            minutes: 5,
            summary:
              "All teaching and learning by argument starts from knowledge already there. This holds for mathematics and the other sciences, for syllogism and induction, and even for rhetoric, which uses examples and enthymemes. What we must know beforehand is sometimes that a thing is, sometimes what a word means, sometimes both. Aristotle uses this to answer the puzzle in Plato's Meno, that one either learns nothing or only what one already knows: a student may know universally that every triangle has angles equal to two right angles, and yet not know it of this triangle until it is shown to him.",
            passage: {
              text: "All instruction given or received by way of argument proceeds from pre-existent knowledge. This becomes evident upon a survey of all the species of such instruction. The mathematical sciences and all other speculative disciplines are acquired in this way, and so are the two forms of dialectical reasoning, syllogistic and inductive",
              ref: "I.1, 71a",
            },
            terms: [
              { greek: "μάθησις", translit: "mathēsis", english: "learning", gloss: "Coming to know, always from something known before." },
              { greek: "προϋπάρχουσα γνῶσις", translit: "prohyparchousa gnōsis", english: "pre-existent knowledge", gloss: "What a learner must already know for teaching to work." },
            ],
            checks: [
              {
                q: "What does all instruction by argument proceed from?",
                options: ["Pre-existent knowledge", "Sense-perception alone", "Divine inspiration", "Nothing at all"],
                answer: 0,
                why: "The passage opens: 'All instruction given or received by way of argument proceeds from pre-existent knowledge.'",
              },
              {
                q: "Which puzzle does Aristotle answer with the example of the triangle?",
                options: [
                  "The puzzle in the Meno, that one learns either nothing or what one already knows",
                  "The puzzle of the sea-fight",
                  "The puzzle about the infinite regress of proofs",
                ],
                answer: 0,
                why: "He names the dilemma in the Meno and answers it by distinguishing knowing universally from knowing this particular case.",
              },
            ],
            journal: "What did you already know that made the last important thing you learned possible?",
          },
          {
            id: "knowing-the-cause",
            title: "To know is to know the cause",
            bekker: "71b9-72b4",
            minutes: 6,
            summary:
              "We have scientific knowledge of something, not in the accidental way the sophist does, when we know the cause on which the fact depends, as its cause, and know that the fact could not be otherwise. Demonstration is a syllogism that produces such knowledge. Its premisses must be true, primary, immediate, better known than the conclusion, prior to it, and causes of it. They must be true because what is not cannot be known. They must be primary and indemonstrable, or they would need proof themselves. And we must know them better than the conclusion, since our knowledge of the conclusion depends on them.",
            passage: {
              text: "We suppose ourselves to possess unqualified scientific knowledge of a thing, as opposed to knowing it in the accidental way in which the sophist knows, when we think that we know the cause on which the fact depends, as the cause of that fact and of no other, and, further, that the fact could not be other than it is.",
              ref: "I.2, 71b9-12",
            },
            terms: [
              { greek: "ἐπιστήμη", translit: "epistēmē", english: "scientific knowledge", gloss: "Knowing a fact through its cause, as something that cannot be otherwise." },
              { greek: "ἀπόδειξις", translit: "apodeixis", english: "demonstration", gloss: "A syllogism that produces scientific knowledge." },
              { greek: "αἰτία", translit: "aitia", english: "cause", gloss: "What a fact depends on; the answer to 'why?'." },
            ],
            checks: [
              {
                q: "When do we have unqualified scientific knowledge of a thing?",
                options: [
                  "When we know the cause on which the fact depends and that it could not be otherwise",
                  "When many people agree with us",
                  "When we have seen it ourselves",
                ],
                answer: 0,
                why: "The passage says we know when we know 'the cause on which the fact depends' and that 'the fact could not be other than it is.'",
              },
              {
                q: "Which of these is not one of the conditions Aristotle sets for the premisses of a demonstration?",
                options: ["True", "Better known than the conclusion", "Generally accepted by the many", "Prior to the conclusion"],
                answer: 2,
                why: "He requires premisses that are true, primary, immediate, better known, prior and causes; being generally accepted belongs to dialectic, not demonstration.",
              },
            ],
            journal: "Is there something you are sure of without knowing why it is so, and would knowing the cause change how you hold it?",
          },
          {
            id: "not-everything-is-proved",
            title: "Not everything can be proved",
            bekker: "72b5-73a20",
            minutes: 5,
            summary:
              "Two views are rejected. One says there is no scientific knowledge, since proof would go back forever, or stop at premisses that cannot be known. The other says everything can be demonstrated, because proof can go in a circle. Aristotle answers that not all knowledge is demonstrative: the immediate premisses are known without demonstration, because the regress must end somewhere. There is also a source of knowledge beyond science by which we grasp definitions. Circular proof fails, because the same thing cannot be both prior and posterior to another, and it reduces to saying that if A is, A is.",
            passage: {
              text: "Our own doctrine is that not all knowledge is demonstrative: on the contrary, knowledge of the immediate premisses is independent of demonstration. (The necessity of this is obvious; for since we must know the prior premisses from which the demonstration is drawn, and since the regress must end in immediate truths, those truths must be indemonstrable.)",
              ref: "I.3, 72b",
            },
            terms: [
              { greek: "ἄμεσος", translit: "amesos", english: "immediate", gloss: "With no middle term: not provable from anything prior." },
              { greek: "ἀναπόδεικτος", translit: "anapodeiktos", english: "indemonstrable", gloss: "Not able to be proved by demonstration." },
            ],
            checks: [
              {
                q: "What is Aristotle's own doctrine about knowledge?",
                options: [
                  "All knowledge is demonstrative",
                  "Not all knowledge is demonstrative; the immediate premisses are known without demonstration",
                  "There is no knowledge at all",
                ],
                answer: 1,
                why: "The passage says 'not all knowledge is demonstrative' and 'knowledge of the immediate premisses is independent of demonstration.'",
              },
              {
                q: "Why must the immediate truths be indemonstrable?",
                options: [
                  "Because the regress of proofs must end somewhere",
                  "Because they are false",
                  "Because no one has tried to prove them",
                ],
                answer: 0,
                why: "He says the regress must end in immediate truths, so those truths must be indemonstrable.",
              },
            ],
            journal: "What do you take as a starting point you cannot prove, and how did you come to trust it?",
          },
          {
            id: "fact-and-reason-why",
            title: "Knowing that, and knowing why",
            bekker: "78a22-79a16",
            minutes: 6,
            summary:
              "Knowing the fact differs from knowing the reason why. Aristotle gives two pairs of examples. The planets are near because they do not twinkle: this proves the fact, but gets the cause backwards, since they do not twinkle because they are near. Reverse the terms and the proof gives the reason. Likewise the moon is spherical because it waxes as it does proves only the fact; it waxes so because it is spherical. The difference also appears between sciences: the observer knows the fact, while the mathematician, as in optics and harmonics, knows the reason, sometimes without knowing the fact.",
            passage: {
              text: "Put in this form, the syllogism turns out to be proof of the fact, but if the middle and major be reversed it is proof of the reasoned fact; since the moon is not spherical because it waxes in a certain manner, but waxes in such a manner because it is spherical.",
              ref: "I.13, 78b",
            },
            terms: [
              { greek: "τὸ ὅτι", translit: "to hoti", english: "the fact", gloss: "That something is so." },
              { greek: "τὸ διότι", translit: "to dioti", english: "the reasoned fact", gloss: "Why something is so: the fact through its cause." },
            ],
            checks: [
              {
                q: "Why does the moon wax in the way it does, according to the passage?",
                options: [
                  "Because it is spherical",
                  "Because it does not twinkle",
                  "Because it is near",
                ],
                answer: 0,
                why: "The passage says the moon 'waxes in such a manner because it is spherical.'",
              },
              {
                q: "What turns a proof of the fact into a proof of the reasoned fact here?",
                options: [
                  "Reversing the middle and major terms",
                  "Adding a fourth term",
                  "Observing the moon more often",
                ],
                answer: 0,
                why: "He says 'if the middle and major be reversed it is proof of the reasoned fact.'",
              },
            ],
            journal: "Where in your life have you mistaken a sign of something for its cause?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Definition and first principles",
        bekker: "89b23-100b17",
        line: "Aristotle ties inquiry to the search for a middle term, works out how definition relates to demonstration, and explains how first principles are grasped.",
        lessons: [
          {
            id: "four-questions",
            title: "The four questions we ask",
            bekker: "89b23-89b35",
            minutes: 4,
            summary:
              "There are as many kinds of question as kinds of thing we know, and they are four. Whether a thing has an attribute: does the sun suffer eclipse? Why it has it: what is the reason for the eclipse? Whether a thing exists at all: is there a centaur, or a god? What it is: what is a god, what is a man? The first two concern a thing and its attribute; the last two concern the thing simply. Once we know the fact, we ask the reason; once we know the thing exists, we ask what it is. Our knowledge consists in the answers to these questions.",
            passage: {
              text: "The kinds of question we ask are as many as the kinds of things which we know. They are in fact four:-(1) whether the connexion of an attribute with a thing is a fact, (2) what is the reason of the connexion, (3) whether a thing exists, (4) What is the nature of the thing.",
              ref: "II.1, 89b23-25",
            },
            terms: [
              { greek: "ζήτησις", translit: "zētēsis", english: "inquiry", gloss: "Seeking: asking one of the four questions." },
              { greek: "τί ἐστι", translit: "ti esti", english: "what it is", gloss: "The nature or essence of a thing." },
            ],
            checks: [
              {
                q: "How many kinds of question does Aristotle say we ask?",
                options: ["Two", "Three", "Four", "Ten"],
                answer: 2,
                why: "The passage says the kinds of question 'are in fact four.'",
              },
              {
                q: "'Is there a centaur?' asks which question?",
                options: [
                  "Whether a thing exists",
                  "What the reason of a connexion is",
                  "Whether an attribute belongs to a thing",
                ],
                answer: 0,
                why: "Aristotle gives whether there is a centaur or a god as an example of asking whether a thing exists without qualification.",
              },
            ],
            journal: "On a question that troubles you, which of the four are you actually asking: whether, why, if it exists, or what it is?",
          },
          {
            id: "the-middle-is-the-cause",
            title: "The middle term is the cause",
            bekker: "89b36-90a34",
            minutes: 5,
            summary:
              "To ask whether something is so, or whether it exists, is to ask whether there is a middle term; to ask why, or what it is, is to ask what the middle term is. The middle is the cause, and the cause is what we seek in every inquiry. 'Does the moon suffer eclipse?' asks whether there is a cause of eclipse; next we ask what the cause is. What eclipse is and why it happens have one answer: the privation of the moon's light by the interposition of the earth. If we stood on the moon, Aristotle says, we would see fact and reason at once.",
            passage: {
              text: "We conclude that in all our inquiries we are asking either whether there is a 'middle' or what the 'middle' is: for the 'middle' here is precisely the cause, and it is the cause that we seek in all our inquiries.",
              ref: "II.2, 90a",
            },
            terms: [
              { greek: "μέσον", translit: "meson", english: "middle", gloss: "The middle term of a demonstration, which states the cause." },
              { greek: "αἰτία", translit: "aitia", english: "cause", gloss: "What we seek in every inquiry." },
            ],
            checks: [
              {
                q: "What is the 'middle', according to the passage?",
                options: ["Precisely the cause", "The conclusion", "The first premiss", "An example"],
                answer: 0,
                why: "The passage says 'the middle here is precisely the cause.'",
              },
              {
                q: "What single answer does Aristotle give to both 'what is eclipse?' and 'why does the moon suffer eclipse?'",
                options: [
                  "The privation of the moon's light by the interposition of the earth",
                  "The moon's failure to twinkle",
                  "The sun's waning",
                ],
                answer: 0,
                why: "He says the nature of eclipse and its reason are identical: privation of light by the earth's interposition.",
              },
            ],
            journal: "What are you trying to understand right now, and what would its cause have to be for the question to be answered?",
          },
          {
            id: "kinds-of-definition",
            title: "Three kinds of definition",
            bekker: "93b29-94a19",
            minutes: 5,
            summary:
              "A definition states what a thing is. One kind states what a name means, as when we say what 'triangle' signifies. Another states the cause of a thing's existence; it is like a demonstration of the essence, differing only in how its terms are arranged. Thunder is an example: 'because fire is quenched in the clouds' says why it thunders, while 'the noise of fire being quenched in the clouds' says what thunder is. A third kind is the conclusion of such a demonstration: thunder is noise in the clouds. And the definition of immediate things is an indemonstrable statement of what they are.",
            passage: {
              text: "For there is a difference between stating why it thunders, and stating what is the essential nature of thunder; since the first statement will be 'Because fire is quenched in the clouds', while the statement of what the nature of thunder is will be 'The noise of fire being quenched in the clouds'.",
              ref: "II.10, 94a",
            },
            terms: [
              { greek: "ὁρισμός", translit: "horismos", english: "definition", gloss: "A statement of what a thing is." },
              { greek: "τὸ τί ἦν εἶναι", translit: "to ti ēn einai", english: "essence", gloss: "Literally 'what it was to be' a thing: its essential nature." },
            ],
            checks: [
              {
                q: "In the passage, which statement says what thunder is?",
                options: [
                  "Because fire is quenched in the clouds",
                  "The noise of fire being quenched in the clouds",
                  "Noise that frightens animals",
                ],
                answer: 1,
                why: "The passage gives 'The noise of fire being quenched in the clouds' as the statement of the nature of thunder.",
              },
              {
                q: "How does a causal definition differ from a demonstration?",
                options: [
                  "Only in the arrangement of its terms",
                  "It has no cause in it",
                  "It is always false",
                ],
                answer: 0,
                why: "Aristotle calls it a quasi-demonstration of essential nature, 'differing from demonstration in the arrangement of its terms.'",
              },
            ],
            journal: "Take a word you use often about yourself: does your definition of it only say what the word means, or also why the thing is so?",
          },
          {
            id: "how-first-principles-are-known",
            title: "From perception to first principles",
            bekker: "99b15-100b17",
            minutes: 6,
            summary:
              "How are first principles known? If we had them from birth, we would possess knowledge more accurate than demonstration without noticing it; if we acquired them from nothing, we would learn without prior knowledge. So we have a capacity of some kind. Animals perceive; in some, perception leaves memory; from many memories of the same thing comes experience; from experience comes the universal, the starting point of art and science. Aristotle compares this to a rout in battle halted when one soldier makes a stand, then another. We know first principles by induction, and the state that grasps them is intuition (nous).",
            passage: {
              text: "We conclude that these states of knowledge are neither innate in a determinate form, nor developed from other higher states of knowledge, but from sense-perception. It is like a rout in battle stopped by first one man making a stand and then another, until the original formation has been restored. The soul is so constituted as to be capable of this process.",
              ref: "II.19, 100a",
            },
            terms: [
              { greek: "νοῦς", translit: "nous", english: "intuition, intellect", gloss: "The state by which first principles are grasped." },
              { greek: "αἴσθησις", translit: "aisthēsis", english: "perception", gloss: "The capacity that begins the ascent to the universal." },
              { greek: "ἐμπειρία", translit: "empeiria", english: "experience", gloss: "What comes from many memories of the same thing." },
            ],
            checks: [
              {
                q: "From what do the states that know first principles develop?",
                options: [
                  "From sense-perception",
                  "From higher states of knowledge",
                  "They are innate in a determinate form",
                ],
                answer: 0,
                why: "The passage says they are 'neither innate in a determinate form, nor developed from other higher states of knowledge, but from sense-perception.'",
              },
              {
                q: "What image does Aristotle use for this process?",
                options: [
                  "A rout in battle stopped as one man after another makes a stand",
                  "A ship reaching harbour",
                  "A seed growing into a tree",
                ],
                answer: 0,
                why: "He says it is 'like a rout in battle stopped by first one man making a stand and then another.'",
              },
            ],
            journal: "What principle do you live by that formed in you slowly, from many experiences, before you could ever put it into words?",
          },
        ],
      },
    ],
  },
  {
    id: "topics",
    title: "Topics",
    greek: "Τοπικά",
    latin: "Topica",
    subject: "logic",
    level: "Intermediate",
    bekker: "100a-164b",
    about:
      "The Topics is a handbook for dialectic: arguing by question and answer from generally accepted opinions. It gives commonplace rules (topoi) for testing claims about accident, genus, property and definition, and ends with advice on how to question, how to answer and how to practise.",
    before: ["categories"],
    caveat: "",
    translation: {
      translator: "W. A. Pickard-Cambridge",
      year: 1928,
      title: "Topics",
      url: "https://classics.mit.edu/Aristotle/topics.html",
    },
    units: [
      {
        id: "book-1",
        title: "Book I: What dialectic is and what it is for",
        bekker: "100a18-108b33",
        line: "Aristotle defines dialectical reasoning, gives its uses, and sets out the four predicables every problem falls under.",
        lessons: [
          {
            id: "what-dialectic-is",
            title: "Reasoning from accepted opinions",
            bekker: "100a18-101a24",
            minutes: 5,
            summary:
              "The treatise aims to find a method for reasoning from generally accepted opinions about any problem, and for defending a position without saying anything that undermines it. Reasoning is an argument in which, certain things being laid down, something else follows necessarily through them. It is demonstration when it starts from true and primary premisses, and dialectical when it starts from generally accepted opinions: those accepted by everyone, or by most people, or by the wise. Aristotle also marks off contentious reasoning, which starts from opinions that only seem accepted, or only seems to reason at all.",
            passage: {
              text: "Our treatise proposes to find a line of inquiry whereby we shall be able to reason from opinions that are generally accepted about every problem propounded to us, and also shall ourselves, when standing up to an argument, avoid saying anything that will obstruct us.",
              ref: "I.1, 100a18-21",
            },
            terms: [
              { greek: "διαλεκτική", translit: "dialektikē", english: "dialectic", gloss: "Reasoning by question and answer from accepted opinions." },
              { greek: "ἔνδοξα", translit: "endoxa", english: "accepted opinions", gloss: "What everyone, most people or the wise hold to be so." },
            ],
            checks: [
              {
                q: "What does the treatise propose to find?",
                options: [
                  "A method of reasoning from generally accepted opinions about any problem",
                  "A list of true first principles",
                  "A way to win every argument by trickery",
                ],
                answer: 0,
                why: "The passage says it aims at a line of inquiry 'to reason from opinions that are generally accepted about every problem.'",
              },
              {
                q: "When is reasoning dialectical rather than demonstrative?",
                options: [
                  "When it starts from generally accepted opinions",
                  "When it starts from true and primary premisses",
                  "When it has no conclusion",
                ],
                answer: 0,
                why: "Aristotle says reasoning is dialectical 'if it reasons from opinions that are generally accepted.'",
              },
            ],
            journal: "On a question you care about, what do most people believe, what do the wise believe, and where do the two part ways?",
          },
          {
            id: "uses-of-dialectic",
            title: "Three uses of dialectic",
            bekker: "101a25-101b4",
            minutes: 4,
            summary:
              "Dialectic is useful in three ways. It is a training: having a method makes it easier to argue about any subject. It helps in meeting people, since by gathering what most people think we can argue with them on the basis of their own convictions. And it serves the philosophical sciences, because raising difficulties on both sides of a question helps us see where truth and error lie. It has a further use: the first principles of each science cannot be discussed from within that science, so they must be examined through accepted opinions, and this is the work of dialectic, which Aristotle calls a process of criticism leading to the principles of all inquiries.",
            passage: {
              text: "For the study of the philosophical sciences it is useful, because the ability to raise searching difficulties on both sides of a subject will make us detect more easily the truth and error about the several points that arise. It has a further use in relation to the ultimate bases of the principles used in the several sciences.",
              ref: "I.2, 101a",
            },
            terms: [
              { greek: "γυμνασία", translit: "gymnasia", english: "training", gloss: "Exercise, as of the mind in argument." },
              { greek: "διαπορῆσαι", translit: "diaporēsai", english: "to raise difficulties", gloss: "To work through the puzzles on both sides of a question." },
            ],
            checks: [
              {
                q: "Why is dialectic useful for the philosophical sciences?",
                options: [
                  "Raising difficulties on both sides helps us detect truth and error",
                  "It replaces observation",
                  "It proves first principles by demonstration",
                ],
                answer: 0,
                why: "The passage says the ability to raise difficulties on both sides 'will make us detect more easily the truth and error.'",
              },
              {
                q: "Why must the first principles of a science be discussed through accepted opinions?",
                options: [
                  "They cannot be discussed from the principles of that science itself",
                  "They are always false",
                  "Scientists refuse to discuss them",
                ],
                answer: 0,
                why: "Aristotle says it is impossible to discuss them from the science's own principles, since they are prior to everything else in it.",
              },
            ],
            journal: "On a belief you hold strongly, can you state the best difficulty against it as well as its defenders could?",
          },
          {
            id: "four-predicables",
            title: "Definition, property, genus, accident",
            bekker: "101b11-103b19",
            minutes: 6,
            summary:
              "Every proposition and problem indicates one of four things. A definition is a phrase signifying a thing's essence. A property does not signify the essence but belongs to that thing alone and is convertible with it: if something is a man, it is capable of learning grammar, and if it is capable of learning grammar, it is a man. A genus is what is said, in reply to 'what is it?', of many things that differ in kind, as 'animal' of man and ox. An accident is what can belong or not belong to one and the same thing, like sitting or being white. Aristotle then lists the ten categories and the tools for finding arguments.",
            passage: {
              text: "A 'property' is a predicate which does not indicate the essence of a thing, but yet belongs to that thing alone, and is predicated convertibly of it. Thus it is a property of man to-be-capable of learning grammar: for if A be a man, then he is capable of learning grammar, and if he be capable of learning grammar, he is a man.",
              ref: "I.5, 102a18-22",
            },
            terms: [
              { greek: "ἴδιον", translit: "idion", english: "property", gloss: "What belongs to one kind alone and converts with it, but is not its essence." },
              { greek: "γένος", translit: "genos", english: "genus", gloss: "What is said of many things differing in kind, in reply to 'what is it?'." },
              { greek: "συμβεβηκός", translit: "symbebēkos", english: "accident", gloss: "What may belong or not belong to one and the same thing." },
            ],
            checks: [
              {
                q: "What makes something a property rather than a definition?",
                options: [
                  "It belongs to the thing alone and converts with it, but does not indicate its essence",
                  "It belongs to many kinds of thing",
                  "It may belong or not belong to the same thing",
                ],
                answer: 0,
                why: "The passage says a property 'does not indicate the essence of a thing, but yet belongs to that thing alone, and is predicated convertibly of it.'",
              },
              {
                q: "Being in a sitting posture is an example of what?",
                options: ["A genus", "A property", "An accident"],
                answer: 2,
                why: "Aristotle gives the sitting posture as something that may belong or not belong to the same thing, which is an accident.",
              },
            ],
            journal: "What is true of you alone without being what you most essentially are?",
          },
        ],
      },
      {
        id: "book-2",
        title: "Book II: Testing claims about accident",
        bekker: "109a1-115b35",
        line: "Aristotle gives commonplace rules for establishing and overthrowing the claim that something belongs to something as an accident.",
        lessons: [
          {
            id: "define-the-terms",
            title: "Define the terms and test the claim",
            bekker: "109a1-110a9",
            minutes: 5,
            summary:
              "Problems are universal, like 'every pleasure is good', or particular, like 'some pleasure is good'. One commonplace rule is to check whether someone has stated as an accident what belongs in another way, as when he says white happens to be a colour, though colour is its genus. Another is to look at a universal claim species by species. Another is to define both the accident and its subject and see whether anything false appears. To test whether a god can be wronged, ask what it is to wrong: if it is to injure deliberately, a god cannot be wronged, since a god cannot be injured.",
            passage: {
              text: "Another rule is to make definitions both of an accident and of its subject, either of both separately or else of one of them, and then look and see if anything untrue has been assumed as true in the definitions. Thus (e.g.) to see if it is possible to wrong a god, ask what is 'to wrong'?",
              ref: "II.2, 109b",
            },
            terms: [
              { greek: "τόπος", translit: "topos", english: "commonplace rule", gloss: "A general strategy for finding an argument for or against a claim." },
              { greek: "συμβεβηκός", translit: "symbebēkos", english: "accident", gloss: "What belongs to a thing without being its genus, property or definition." },
            ],
            checks: [
              {
                q: "What does this rule tell us to do?",
                options: [
                  "Define the accident and its subject, and check the definitions for anything untrue",
                  "Count how many people accept the claim",
                  "Replace every term with a metaphor",
                ],
                answer: 0,
                why: "The passage says to make definitions of the accident and its subject and 'see if anything untrue has been assumed as true.'",
              },
              {
                q: "Why does Aristotle say a god cannot be wronged, if to wrong is to injure deliberately?",
                options: ["Because a god cannot be injured", "Because gods do not exist", "Because no one acts deliberately"],
                answer: 0,
                why: "He says that if wronging is deliberate injury, a god cannot be wronged, since it is impossible that a god should be injured.",
              },
            ],
            journal: "Pick an accusation someone made against you, or you against yourself: what happens to it when you define its key word carefully?",
          },
        ],
      },
      {
        id: "book-3",
        title: "Book III: Which is better",
        bekker: "116a1-120b11",
        line: "Aristotle gives rules for judging which of two closely matched things is more desirable.",
        lessons: [
          {
            id: "which-is-more-desirable",
            title: "Choosing between two goods",
            bekker: "116a1-117b2",
            minutes: 5,
            summary:
              "The question which of two things is better applies to things that are close, not to things far apart: nobody doubts whether happiness or wealth is better. For close cases Aristotle offers rules. What is more lasting or secure is more desirable. So is what the prudent person, the good person or the right law would choose, or what experts in the field would choose. What is desirable in itself is more desirable than what is desirable by accident: justice in our friends more than justice in our enemies. And what is in itself the cause of good, like virtue, is more desirable than what is so by accident, like luck.",
            passage: {
              text: "First, then, that which is more lasting or secure is more desirable than that which is less so: and so is that which is more likely to be chosen by the prudent or by the good man or by the right law, or by men who are good in any particular line, when they make their choice as such",
              ref: "III.1, 116a",
            },
            terms: [
              { greek: "αἱρετώτερον", translit: "hairetōteron", english: "more desirable", gloss: "More worth choosing." },
              { greek: "φρόνιμος", translit: "phronimos", english: "prudent person", gloss: "One with practical wisdom, whose choice is a standard." },
            ],
            checks: [
              {
                q: "Which is more desirable, according to the first rule?",
                options: [
                  "What is more lasting or secure",
                  "What is newer",
                  "What is more pleasant at the moment",
                ],
                answer: 0,
                why: "The passage says 'that which is more lasting or secure is more desirable than that which is less so.'",
              },
              {
                q: "Whose choice does Aristotle treat as a guide?",
                options: [
                  "The prudent or good man, the right law, or experts in the field",
                  "Whoever is loudest",
                  "Anyone at random",
                ],
                answer: 0,
                why: "He names what would be chosen 'by the prudent or by the good man or by the right law, or by men who are good in any particular line.'",
              },
            ],
            journal: "Between two good options you face, which would a wise person you know choose, and which is more lasting?",
          },
        ],
      },
      {
        id: "book-4",
        title: "Book IV: Testing a genus",
        bekker: "120b12-128b9",
        line: "Aristotle gives rules for testing whether something has been placed in its right genus.",
        lessons: [
          {
            id: "testing-a-genus",
            title: "Is it really the genus?",
            bekker: "120b12-121a19",
            minutes: 5,
            summary:
              "Genus and property are parts of definition but are often argued about on their own. To test a proposed genus, look at everything in the same genus as the thing and see whether the genus fails to apply to any of them. If 'good' is said to be the genus of pleasure, see whether some pleasure is not good; if so, good is not its genus, since a genus is predicated of every member of its species. Check too whether the proposed genus fits the definition of accident, something that can belong and not belong: then it is an accident, not a genus. A species must also share in its genus.",
            passage: {
              text: "If, then, a genus be suggested for something that is, first take a look at all objects which belong to the same genus as the thing mentioned, and see whether the genus suggested is not predicated of one of them, as happens in the case of an accident: e.g. if 'good' be laid down to be the genus of 'pleasure', see whether some particular pleasure be not good",
              ref: "IV.1, 120b",
            },
            terms: [
              { greek: "γένος", translit: "genos", english: "genus", gloss: "The wider kind under which a species falls, predicated of all its members." },
              { greek: "εἶδος", translit: "eidos", english: "species", gloss: "A narrower kind within a genus." },
            ],
            checks: [
              {
                q: "If 'good' is proposed as the genus of pleasure, what should we check?",
                options: [
                  "Whether some particular pleasure is not good",
                  "Whether most people enjoy pleasure",
                  "Whether pleasure has a contrary",
                ],
                answer: 0,
                why: "The passage says 'see whether some particular pleasure be not good.'",
              },
              {
                q: "If a proposed genus can belong and also not belong to a thing, what is it?",
                options: ["A genus", "An accident", "A definition"],
                answer: 1,
                why: "Aristotle says such an attribute fits the definition of accident, so it is not the genus.",
              },
            ],
            journal: "What larger category do you put yourself in, and is there a part of you it does not fit at all?",
          },
        ],
      },
      {
        id: "book-5",
        title: "Book V: Testing a property",
        bekker: "128b14-139a20",
        line: "Aristotle distinguishes kinds of property and gives rules for testing whether a stated property is rightly given.",
        lessons: [
          {
            id: "kinds-of-property",
            title: "Permanent and passing properties",
            bekker: "128b14-129a16",
            minutes: 5,
            summary:
              "A property is rendered either as essential and permanent or as relative and temporary. It is an essential property of man to be by nature a civilized animal. A relative property is like that of the soul relative to the body, the one fitted to command and the other to obey. A permanent property is like being an immortal living being, which belongs to God. A temporary property is like walking in the gymnasium, which belongs to a particular man at a time. Aristotle then gives rules: a property should be stated in terms more intelligible than the subject, should not use a term with more than one sense, and should belong to the subject alone.",
            passage: {
              text: "Any 'property' rendered is always either essential and permanent or relative and temporary: e.g. it is an 'essential property' of man to be 'by nature a civilized animal': a 'relative property' is one like that of the soul in relation to the body, viz. that the one is fitted to command, and the other to obey",
              ref: "V.1, 128b",
            },
            terms: [
              { greek: "ἴδιον", translit: "idion", english: "property", gloss: "What belongs to one kind alone, whether always or at a time." },
              { greek: "καθ᾽ αὑτό", translit: "kath' hauto", english: "essential, in itself", gloss: "Belonging to a thing by its own nature." },
            ],
            checks: [
              {
                q: "What example of an essential property does the passage give?",
                options: [
                  "Man being by nature a civilized animal",
                  "Walking in the gymnasium",
                  "The soul commanding the body",
                ],
                answer: 0,
                why: "The passage says it is an essential property of man 'to be by nature a civilized animal.'",
              },
              {
                q: "Walking in the gymnasium is what kind of property?",
                options: ["Permanent", "Temporary", "Essential"],
                answer: 1,
                why: "Aristotle gives it as a temporary property of a particular man.",
              },
            ],
            journal: "Which of the things that mark you out are permanent, and which belong only to this season of your life?",
          },
        ],
      },
      {
        id: "book-6",
        title: "Book VI: Testing a definition",
        bekker: "139a24-151b23",
        line: "Aristotle sets out the five ways a definition can fail and the rules for clarity and correct genus and differentia.",
        lessons: [
          {
            id: "five-ways-a-definition-fails",
            title: "Five ways a definition fails",
            bekker: "139a24-139b18",
            minutes: 5,
            summary:
              "There are five ways to attack a definition. Show that it is not true of everything the term applies to: the definition of man must be true of every man. Show that it fails to put the thing in its genus, or in the right one, since the genus is the main mark of essence. Show that it is not peculiar to the thing, since a definition must belong to it alone. Show that, even if all this is observed, it does not state the essence. Or show that it states the essence but badly. The first three are tested by the rules for accident, genus and property.",
            passage: {
              text: "The discussion of Definitions falls into five parts. For you have to show either (1) that it is not true at all to apply the expression as well to that to which the term is applied (for the definition of Man ought to be true of every man); or (2) that though the object has a genus, he has failed to put the object defined into the genus, or to put it into the appropriate genus",
              ref: "VI.1, 139a",
            },
            terms: [
              { greek: "ὅρος", translit: "horos", english: "definition", gloss: "A phrase that signifies a thing's essence." },
              { greek: "διαφορά", translit: "diaphora", english: "differentia", gloss: "What divides a genus into its species." },
            ],
            checks: [
              {
                q: "What must the definition of man be true of?",
                options: ["Every man", "Most men", "The best men"],
                answer: 0,
                why: "The passage says 'the definition of Man ought to be true of every man.'",
              },
              {
                q: "Which of these is one of the ways a definition can fail?",
                options: [
                  "Failing to put the object into its appropriate genus",
                  "Being too short",
                  "Using a common word",
                ],
                answer: 0,
                why: "Aristotle lists failing to put the object into the genus, or the appropriate genus, as the second way.",
              },
            ],
            journal: "How would you define a word that matters to you, such as friend or success, and does your definition fit every case you would call by that name?",
          },
          {
            id: "metaphor-is-obscure",
            title: "Why a metaphor is a bad definition",
            bekker: "139b19-140a17",
            minutes: 5,
            summary:
              "A definition should be clear. One test is whether it uses an ambiguous term: 'health is the balance of hot and cold' leaves 'balance' unclear. Another is whether it uses a metaphor, as defining knowledge as 'unsupplantable', the earth as a 'nurse', or temperance as a 'harmony'. A metaphor is always obscure, and one can argue against it as if it were meant literally: harmony is found between notes, not in a soul. Worse still are phrases that are neither literal nor metaphorical, like calling law the 'measure' or 'image' of what is just by nature, since there is no likeness to give them sense.",
            passage: {
              text: "Another rule is, See if he has used a metaphorical expression, as, for instance, if he has defined knowledge as 'unsupplantable', or the earth as a 'nurse', or temperance as a 'harmony'. For a metaphorical expression is always obscure.",
              ref: "VI.2, 139b",
            },
            terms: [
              { greek: "μεταφορά", translit: "metaphora", english: "metaphor", gloss: "Carrying a word over from its own thing to another." },
              { greek: "ἀσάφεια", translit: "asapheia", english: "obscurity", gloss: "Lack of clarity, a fault in a definition." },
            ],
            checks: [
              {
                q: "Why is a metaphor a fault in a definition?",
                options: [
                  "A metaphorical expression is always obscure",
                  "Metaphors are always false",
                  "Metaphors are too long",
                ],
                answer: 0,
                why: "The passage says 'a metaphorical expression is always obscure.'",
              },
              {
                q: "Which of these is given as a metaphorical definition?",
                options: [
                  "Temperance as a 'harmony'",
                  "Man as a two-footed animal",
                  "Thunder as noise in the clouds",
                ],
                answer: 0,
                why: "Aristotle lists defining temperance as a 'harmony' among his examples of metaphor.",
              },
            ],
            journal: "What metaphor do you use for your own life, and what would you have to say plainly if you could not use it?",
          },
        ],
      },
      {
        id: "book-7",
        title: "Book VII: Same and different",
        bekker: "151b28-155a37",
        line: "Aristotle gives rules for deciding whether two things are the same, and notes which rules serve to overthrow and which to establish a definition.",
        lessons: [
          {
            id: "same-or-different",
            title: "Testing whether two things are the same",
            bekker: "151b28-152b35",
            minutes: 5,
            summary:
              "Whether two things are the same in the strictest sense, numerically one, can be tested by their inflected forms, their coordinates and their opposites. If justice is the same as courage, then the just man is the same as the brave man, and 'justly' the same as 'bravely'. If two things are the same, their opposites are the same too. If they are not both the same as some third thing, they are not the same as each other. And whatever is true of one must be true of the other. Aristotle notes that the rules for overthrowing sameness also serve to overthrow a definition, but the rules for establishing it are not enough to establish one.",
            passage: {
              text: "Whether two things are 'the same' or 'different', in the most literal of the meanings ascribed to 'sameness' (and we said' that 'the same' applies in the most literal sense to what is numerically one), may be examined in the light of their inflexions and coordinates and opposites. For if justice be the same as courage, then too the just man is the same as the brave man, and 'justly' is the same as 'bravely'.",
              ref: "VII.1, 151b",
            },
            terms: [
              { greek: "ταὐτόν", translit: "tauton", english: "the same", gloss: "In the strictest sense, what is one in number." },
              { greek: "σύστοιχα", translit: "systoicha", english: "coordinates", gloss: "Words of one family, as just, justly, justice." },
            ],
            checks: [
              {
                q: "If justice were the same as courage, what else would follow?",
                options: [
                  "The just man would be the same as the brave man",
                  "Justice would have no opposite",
                  "Courage would be a genus of justice",
                ],
                answer: 0,
                why: "The passage says 'then too the just man is the same as the brave man, and justly is the same as bravely.'",
              },
              {
                q: "In what sense does 'the same' apply most literally?",
                options: ["To what is numerically one", "To what is alike in colour", "To what is in the same genus"],
                answer: 0,
                why: "Aristotle says 'the same' applies most literally 'to what is numerically one.'",
              },
            ],
            journal: "Which two things do you treat as the same, such as being busy and being useful, that this test would pull apart?",
          },
        ],
      },
      {
        id: "book-8",
        title: "Book VIII: Questioning, answering and practice",
        bekker: "155b3-164b19",
        line: "Aristotle advises the questioner on arranging questions and the answerer on what to grant, and ends with how to practise.",
        lessons: [
          {
            id: "arranging-questions",
            title: "How a questioner plans",
            bekker: "155b3-156a22",
            minutes: 5,
            summary:
              "The questioner must first choose the ground of attack, then frame and arrange the questions privately, and then put them to the other party. Choosing the ground is common to the philosopher and the dialectician, but arranging questions belongs to the dialectician alone, since it involves another person. The philosopher reasoning by himself does not care if his premisses are close to the question and obvious; he may even want them so, since science is built on such axioms. Besides the necessary premisses, the questioner may secure others for four purposes: to win the universal by induction, to lend weight, to conceal the conclusion, or to make the argument clearer.",
            passage: {
              text: "Any one who intends to frame questions must, first of all, select the ground from which he should make his attack; secondly, he must frame them and arrange them one by one to himself; thirdly and lastly, he must proceed actually to put them to the other party.",
              ref: "VIII.1, 155b",
            },
            terms: [
              { greek: "ἐρώτησις", translit: "erōtēsis", english: "questioning", gloss: "Putting premisses to the answerer for assent." },
              { greek: "τάξις", translit: "taxis", english: "arrangement", gloss: "The order in which questions are put." },
            ],
            checks: [
              {
                q: "What is the first thing a questioner must do?",
                options: [
                  "Select the ground from which to attack",
                  "Put the questions to the other party",
                  "Concede the opponent's thesis",
                ],
                answer: 0,
                why: "The passage says he must 'first of all, select the ground from which he should make his attack.'",
              },
              {
                q: "Why does arranging questions concern the dialectician and not the philosopher?",
                options: [
                  "It involves reference to another party",
                  "Philosophers never ask questions",
                  "Dialecticians do not need premisses",
                ],
                answer: 0,
                why: "Aristotle says arranging questions concerns the dialectician because a reference to another party is involved.",
              },
            ],
            journal: "Before a hard conversation, what is the ground you want to stand on, and in what order would you raise your points?",
          },
          {
            id: "how-to-practise",
            title: "Practise both sides",
            bekker: "163a29-164b19",
            minutes: 5,
            summary:
              "The book ends with advice on training. Get in the habit of converting arguments: take the opposite of the conclusion with the other premisses and see which premiss falls. For any thesis, look for arguments both for and against, and then for the answers to them; this trains one in asking and answering at once. If there is no one else, argue with yourself. Know by heart arguments on common questions and a stock of definitions, as one knows a multiplication table. Aristotle adds that such skill serves knowledge and wisdom, since seeing the consequences of each side helps one choose rightly.",
            passage: {
              text: "Always, in dealing with any proposition, be on the look-out for a line of argument both pro and con: and on discovering it at once set about looking for the solution of it: for in this way you will soon find that you have trained yourself at the same time in both asking questions and answering them. If we cannot find any one else to argue with, we should argue with ourselves.",
              ref: "VIII.14, 163a",
            },
            terms: [
              { greek: "γυμνασία", translit: "gymnasia", english: "training", gloss: "Practice in argument, like exercise for the body." },
              { greek: "ἀντιστροφή", translit: "antistrophē", english: "conversion", gloss: "Taking the opposite of a conclusion to see which premiss falls." },
            ],
            checks: [
              {
                q: "What does Aristotle advise when there is no one else to argue with?",
                options: ["Argue with ourselves", "Stop arguing", "Read the arguments of others only"],
                answer: 0,
                why: "The passage says 'If we cannot find any one else to argue with, we should argue with ourselves.'",
              },
              {
                q: "What does looking for arguments both pro and con train us in?",
                options: [
                  "Both asking questions and answering them",
                  "Only in winning",
                  "Only in memorising definitions",
                ],
                answer: 0,
                why: "He says that in this way 'you have trained yourself at the same time in both asking questions and answering them.'",
              },
            ],
            journal: "On a view you hold, what is the strongest argument against it, and what would your answer to it be?",
          },
        ],
      },
    ],
  },
  {
    id: "sophistical-refutations",
    title: "Sophistical Refutations",
    greek: "Περὶ σοφιστικῶν ἐλέγχων",
    latin: "De Sophisticis Elenchis",
    subject: "logic",
    level: "Intermediate",
    bekker: "164a-184b",
    about:
      "Sophistical Refutations studies arguments that only seem to refute: it sorts fallacies into those that depend on language and those that do not, and shows how to answer them. It closes with Aristotle's claim that before him there was no art of reasoning at all.",
    before: ["topics"],
    caveat: "",
    translation: {
      translator: "W. A. Pickard-Cambridge",
      year: 1928,
      title: "On Sophistical Refutations",
      url: "https://classics.mit.edu/Aristotle/sophist_refut.html",
    },
    units: [
      {
        id: "real-and-apparent",
        title: "Chapters 1-3: Real and apparent refutation",
        bekker: "164a20-165b22",
        line: "Aristotle separates genuine refutations from sham ones and sets out what the sophist aims at.",
        lessons: [
          {
            id: "seeming-wise",
            title: "Arguments that only look sound",
            bekker: "164a20-165a37",
            minutes: 5,
            summary:
              "Some reasonings are genuine and others only seem to be, just as some people are fit and others only look it, and some metal is silver while some only looks like silver. The inexperienced cannot tell them apart. The main cause is words: we use names as symbols for things and suppose that what follows in the names follows in the things, as people who are not clever with their counters are taken in by experts. For some people it pays better to seem wise than to be wise without seeming so. The sophist, Aristotle says, makes money from an apparent but unreal wisdom, so he needs arguments that appear to refute.",
            passage: {
              text: "Now for some people it is better worth while to seem to be wise, than to be wise without seeming to be (for the art of the sophist is the semblance of wisdom without the reality, and the sophist is one who makes money from an apparent but unreal wisdom); for them, then, it is clearly essential also to seem to accomplish the task of a wise man rather than to accomplish it without seeming to do so.",
              ref: "1, 165a",
            },
            terms: [
              { greek: "σοφιστής", translit: "sophistēs", english: "sophist", gloss: "In Aristotle's sense, one who makes money from apparent wisdom." },
              { greek: "ἔλεγχος", translit: "elenchos", english: "refutation", gloss: "Reasoning to the contradictory of an opponent's thesis." },
            ],
            checks: [
              {
                q: "How does the passage describe the art of the sophist?",
                options: [
                  "The semblance of wisdom without the reality",
                  "The highest form of wisdom",
                  "The study of first principles",
                ],
                answer: 0,
                why: "The passage says 'the art of the sophist is the semblance of wisdom without the reality.'",
              },
              {
                q: "Why do some people need arguments that only seem sound?",
                options: [
                  "For them it is more worth while to seem wise than to be wise",
                  "Because sound arguments do not exist",
                  "Because they want to learn the truth",
                ],
                answer: 0,
                why: "He says for some people 'it is better worth while to seem to be wise, than to be wise without seeming to be.'",
              },
            ],
            journal: "Where in your work are you tempted to seem to know rather than to know?",
          },
          {
            id: "kinds-of-argument-and-aims",
            title: "Four kinds of argument, five aims",
            bekker: "165a38-165b22",
            minutes: 4,
            summary:
              "Arguments in question and answer are of four classes. Didactic arguments reason from the principles proper to a subject. Dialectical arguments reason from generally accepted premisses to the contradictory of a thesis. Examination arguments reason from premisses the answerer accepts and that anyone claiming knowledge must know. Contentious arguments reason, or only seem to reason, from premisses that only seem accepted. Those who argue as rivals aim at five things: to refute, to show a fallacy, to lead into paradox, to make the opponent commit a solecism, or to make him babble, repeating himself. Or they aim to seem to do these.",
            passage: {
              text: "First we must grasp the number of aims entertained by those who argue as competitors and rivals to the death. These are five in number, refutation, fallacy, paradox, solecism, and fifthly to reduce the opponent in the discussion to babbling-i.e. to constrain him to repeat himself a number of times: or it is to produce the appearance of each of these things without the reality.",
              ref: "3, 165b",
            },
            terms: [
              { greek: "ἐριστικός", translit: "eristikos", english: "contentious", gloss: "Arguing to win rather than to learn." },
              { greek: "πειραστική", translit: "peirastikē", english: "examination", gloss: "Testing whether someone has the knowledge they claim." },
              { greek: "σολοικισμός", translit: "soloikismos", english: "solecism", gloss: "An ungrammatical expression." },
            ],
            checks: [
              {
                q: "Which of these is not among the five aims of contentious arguers?",
                options: ["Refutation", "Paradox", "Teaching the truth", "Solecism"],
                answer: 2,
                why: "The passage lists refutation, fallacy, paradox, solecism and babbling; teaching is not among them.",
              },
              {
                q: "What does 'babbling' mean in the passage?",
                options: [
                  "Making the opponent repeat himself a number of times",
                  "Speaking in a foreign language",
                  "Refusing to answer",
                ],
                answer: 0,
                why: "Aristotle explains it as constraining the opponent 'to repeat himself a number of times.'",
              },
            ],
            journal: "In your last heated argument, were you aiming to find out the truth or to make the other person look wrong?",
          },
        ],
      },
      {
        id: "kinds-of-fallacy",
        title: "Chapters 4-11: The kinds of fallacy",
        bekker: "165b23-172b8",
        line: "Aristotle lists six fallacies that depend on language and seven that do not, and traces them all to ignorance of what a refutation is.",
        lessons: [
          {
            id: "fallacies-of-language",
            title: "Fallacies that come from words",
            bekker: "165b23-166b19",
            minutes: 5,
            summary:
              "Refutations either depend on language or do not. Those that depend on language are six: ambiguity, amphiboly, combination, division, accent and form of expression. Ambiguity is a word with two senses: 'those learn who know' trades on 'learn' meaning both to understand and to acquire knowledge. Amphiboly is an ambiguous phrase. Combination and division join or separate words wrongly, as in 'a man can walk while sitting'. Accent matters most in written texts and poetry. Form of expression misleads when different things are expressed alike, as 'flourishing' looks like an action word such as 'cutting' but names a condition.",
            passage: {
              text: "There are two styles of refutation: for some depend on the language used, while some are independent of language. Those ways of producing the false appearance of an argument which depend on language are six in number: they are ambiguity, amphiboly, combination, division of words, accent, form of expression.",
              ref: "4, 165b23-27",
            },
            terms: [
              { greek: "ὁμωνυμία", translit: "homōnymia", english: "ambiguity", gloss: "One word with more than one meaning." },
              { greek: "ἀμφιβολία", translit: "amphibolia", english: "amphiboly", gloss: "A phrase whose construction can be read two ways." },
              { greek: "παραλογισμός", translit: "paralogismos", english: "fallacy", gloss: "A false reasoning that looks valid." },
            ],
            checks: [
              {
                q: "How many fallacies dependent on language does Aristotle list?",
                options: ["Four", "Six", "Seven", "Ten"],
                answer: 1,
                why: "The passage says those that depend on language 'are six in number.'",
              },
              {
                q: "Which of these is a fallacy of language?",
                options: ["Accent", "Begging the question", "False cause"],
                answer: 0,
                why: "Accent is on the list of six; begging the question and false cause are independent of language.",
              },
            ],
            journal: "Which word in a current debate is doing two jobs at once, and what changes when you split it into two words?",
          },
          {
            id: "fallacies-outside-language",
            title: "Fallacies outside words",
            bekker: "166b20-168a16",
            minutes: 6,
            summary:
              "Fallacies independent of language are seven: accident; taking what holds in a certain respect as holding absolutely; ignorance of what a refutation is; the consequent; begging the original point; treating as a cause what is not a cause; and making several questions into one. The fallacy of the consequent comes from supposing that consequence converts: because if A then B, people suppose that if B then A. This is how the senses deceive, as when bile is taken for honey because both are yellow, or wet ground is taken to show it has rained. Rhetoricians use it too, arguing from signs.",
            passage: {
              text: "The refutation which depends upon the consequent arises because people suppose that the relation of consequence is convertible. For whenever, suppose A is, B necessarily is, they then suppose also that if B is, A necessarily is.",
              ref: "5, 167b",
            },
            terms: [
              { greek: "παρὰ τὸ ἑπόμενον", translit: "para to hepomenon", english: "from the consequent", gloss: "Assuming that if A implies B, then B implies A." },
              { greek: "τὸ μὴ αἴτιον ὡς αἴτιον", translit: "to mē aition hōs aition", english: "false cause", gloss: "Treating as a cause what is not a cause." },
            ],
            checks: [
              {
                q: "What mistake lies behind the fallacy of the consequent?",
                options: [
                  "Supposing that if A implies B, then B implies A",
                  "Using a word in two senses",
                  "Asking two questions as one",
                ],
                answer: 0,
                why: "The passage says people 'suppose that the relation of consequence is convertible.'",
              },
              {
                q: "Which example of this fallacy does Aristotle give?",
                options: [
                  "Supposing the ground is wet, so it has rained",
                  "Calling a planetree a man",
                  "Defining temperance as a harmony",
                ],
                answer: 0,
                why: "He says that since rain makes the ground wet, we suppose wet ground means rain, though that does not necessarily follow.",
              },
            ],
            journal: "What do you infer from a sign in someone's behaviour that could just as well have another cause?",
          },
        ],
      },
      {
        id: "answering",
        title: "Chapters 12-33: Questioning and answering",
        bekker: "172b9-183a26",
        line: "Aristotle turns from the sophist's tricks to the answerer: why the study of fallacies is useful and how each kind is solved.",
        lessons: [
          {
            id: "why-study-fallacies",
            title: "Why study fallacies",
            bekker: "175a1-175a30",
            minutes: 5,
            summary:
              "Fallacious arguments are useful for philosophy in two ways. Since most depend on words, they make us better at seeing in how many senses a term is used, and what likenesses and differences hold between things and between names. And they help in one's own inquiries, since someone easily misled by another is likely to mislead himself. They also add to one's reputation. But knowing the sources of fallacies is not the same as meeting one quickly under questioning: what we know in one context we often fail to see in another, and speed comes only with practice.",
            passage: {
              text: "In the second place they are useful for one's own personal researches; for the man who is easily committed to a fallacy by some one else, and does not perceive it, is likely to incur this fate of himself also on many occasions.",
              ref: "16, 175a",
            },
            terms: [
              { greek: "λύσις", translit: "lysis", english: "solution", gloss: "Untying an argument by showing where it goes wrong." },
              { greek: "φιλοσοφία", translit: "philosophia", english: "philosophy", gloss: "The love and pursuit of wisdom." },
            ],
            checks: [
              {
                q: "Why are fallacies useful for one's own research, according to the passage?",
                options: [
                  "Someone easily misled by another is likely to mislead himself",
                  "They make one rich",
                  "They replace the need for evidence",
                ],
                answer: 0,
                why: "The passage says the man easily committed to a fallacy by someone else 'is likely to incur this fate of himself also on many occasions.'",
              },
              {
                q: "What does Aristotle say about knowing fallacies and meeting them in discussion?",
                options: [
                  "They are not the same; speed in answering needs practice",
                  "Knowing them is enough",
                  "Meeting them is impossible",
                ],
                answer: 0,
                why: "He says it is not the same thing to solve an argument at leisure as to meet it quickly under questioning, and that speed comes with training.",
              },
            ],
            journal: "What faulty argument have you fallen for from others that you also use on yourself?",
          },
          {
            id: "draw-the-distinction",
            title: "Draw the distinction",
            bekker: "175b1-176a18",
            minutes: 5,
            summary:
              "Against contentious opponents, one sometimes solves arguments in the general estimation rather than according to the truth, aiming to remove the appearance of refutation. When a question is ambiguous, the answerer has the right to distinguish its senses, and should use it. To grant the question simply, without distinguishing, is a mistake, because then the argument looks refuted even if the person is not. People often hesitate to draw distinctions for fear of seeming obstructive when many such questions are put, and then find themselves faced with a paradox. So Aristotle advises not to hesitate.",
            passage: {
              text: "All the same, since if a man does not distinguish the senses of an amphiboly, it is not clear whether he has been confuted or has not been confuted, and since in arguments the right to distinguish them is granted, it is evident that to grant the question simply without drawing any distinction is a mistake, so that, even if not the man himself, at any rate his argument looks as though it had been refuted.",
              ref: "17, 175b",
            },
            terms: [
              { greek: "διαιρεῖν", translit: "diairein", english: "to distinguish", gloss: "To separate the senses of an ambiguous question before answering." },
              { greek: "ἀμφιβολία", translit: "amphibolia", english: "amphiboly", gloss: "A question or phrase that can be read two ways." },
            ],
            checks: [
              {
                q: "What should an answerer do with an ambiguous question?",
                options: [
                  "Distinguish its senses rather than grant it simply",
                  "Grant it simply to avoid seeming obstructive",
                  "Refuse to answer anything",
                ],
                answer: 0,
                why: "The passage says that 'to grant the question simply without drawing any distinction is a mistake,' since the argument then looks refuted.",
              },
              {
                q: "Why do people often fail to draw distinctions?",
                options: [
                  "They fear seeming obstructive when many such questions are put",
                  "They do not know the rules",
                  "Distinctions are forbidden in debate",
                ],
                answer: 0,
                why: "He says people hesitate 'in order that they may not be thought to be obstructionists at every turn.'",
              },
            ],
            journal: "When were you last asked a loaded yes-or-no question, and what distinction would have let you answer honestly?",
          },
        ],
      },
      {
        id: "epilogue",
        title: "Chapter 34: A new inquiry",
        bekker: "183a27-184b8",
        line: "Aristotle sums up the work and claims that the art of reasoning had no predecessors.",
        lessons: [
          {
            id: "nothing-existed-at-all",
            title: "An art with no predecessors",
            bekker: "183a27-184b8",
            minutes: 5,
            summary:
              "Aristotle restates the aim: to find a way of reasoning about any theme from the most generally accepted premisses, and of defending a thesis in the same way. He observes that most arts, like rhetoric, grew bit by bit from small beginnings, each generation adding to the last. With reasoning, he says, it was different: nothing existed before. The paid teachers of argument handed out speeches to memorize, like someone who promises to cure sore feet and hands out shoes instead of teaching shoemaking. He asks his hearers to pardon the work's shortcomings and to give thanks for its discoveries.",
            passage: {
              text: "Moreover, on the subject of Rhetoric there exists much that has been said long ago, whereas on the subject of reasoning we had nothing else of an earlier date to speak of at all, but were kept at work for a long time in experimental researches.",
              ref: "34, 184b",
            },
            terms: [
              { greek: "τέχνη", translit: "technē", english: "art, craft", gloss: "Teachable know-how that understands its own causes." },
              { greek: "ἀρχή", translit: "archē", english: "beginning", gloss: "The start, which Aristotle says is the hardest and most important part." },
            ],
            checks: [
              {
                q: "What does Aristotle say existed before him on the subject of reasoning?",
                options: [
                  "Nothing of an earlier date to speak of",
                  "A long tradition, like rhetoric",
                  "A complete art he only summarized",
                ],
                answer: 0,
                why: "The passage says 'on the subject of reasoning we had nothing else of an earlier date to speak of at all.'",
              },
              {
                q: "What does his comparison with shoes criticize?",
                options: [
                  "Teaching people the products of an art instead of the art",
                  "Teaching shoemaking to philosophers",
                  "Charging too little for lessons",
                ],
                answer: 0,
                why: "He says the paid teachers imparted 'not the art but its products', like handing out shoes instead of teaching shoemaking.",
              },
            ],
            journal: "In something you are learning, are you collecting finished answers like shoes, or learning the craft that makes them?",
          },
        ],
      },
    ],
  },
];
