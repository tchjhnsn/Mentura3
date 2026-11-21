import type { Subject } from "./types";

/** The nine subjects, in the order Scholē shows them: the instrument first, then theoretical, practical, productive. */
export const SUBJECTS: Subject[] = [
  { id: "logic", title: "Logic", greek: "ὄργανον", translit: "organon", division: "instrument", line: "How to define, divide, reason and prove: the instrument every other inquiry uses.", path: ["categories", "on-interpretation", "prior-analytics", "posterior-analytics", "topics", "sophistical-refutations"] },
  { id: "nature", title: "Nature", greek: "φύσις", translit: "physis", division: "theoretical", line: "What change, motion, place and time are, and how the heavens and the elements behave.", path: ["physics", "on-the-heavens", "on-generation-and-corruption", "meteorology"] },
  { id: "soul", title: "Soul", greek: "ψυχή", translit: "psychē", division: "theoretical", line: "What it is to be alive: nutrition, sensation, imagination, memory and thought.", path: ["on-the-soul", "parva-naturalia"] },
  { id: "life", title: "Living things", greek: "ζῷα", translit: "zōia", division: "theoretical", line: "Animals observed: their parts, how they move, how they come to be, and why.", path: ["history-of-animals", "parts-of-animals", "movement-and-progression-of-animals", "generation-of-animals"] },
  { id: "first-philosophy", title: "First philosophy", greek: "πρώτη φιλοσοφία", translit: "prōtē philosophia", division: "theoretical", line: "Being as being: substance, cause, potential and act, and the first unmoved mover.", path: ["metaphysics"] },
  { id: "ethics", title: "Ethics", greek: "ἠθικά", translit: "ēthika", division: "practical", line: "The good life for a human being: happiness, virtue, choice, friendship and pleasure.", path: ["nicomachean-ethics", "eudemian-ethics", "magna-moralia"] },
  { id: "politics", title: "Politics", greek: "πολιτικά", translit: "politika", division: "practical", line: "The household, the city and its constitutions, and the best way for people to live together.", path: ["politics", "constitution-of-the-athenians"] },
  { id: "rhetoric", title: "Rhetoric", greek: "ῥητορική", translit: "rhētorikē", division: "productive", line: "Finding the available means of persuasion: character, emotion, argument, style and arrangement.", path: ["rhetoric"] },
  { id: "poetics", title: "Poetics", greek: "ποιητική", translit: "poiētikē", division: "productive", line: "How tragedy and epic are made: plot, character, imitation, pity, fear and catharsis.", path: ["poetics"] },
];

export const DIVISIONS = [
  { id: "instrument", title: "The instrument", line: "Logic comes first because every inquiry reasons." },
  { id: "theoretical", title: "Knowing", line: "Studied for the sake of the truth alone (Metaphysics VI.1)." },
  { id: "practical", title: "Doing", line: "Studied for the sake of acting well, alone and together." },
  { id: "productive", title: "Making", line: "Studied for the sake of a thing made: a speech, a play." },
] as const;

export const subjectOf = (id: string): Subject | undefined => SUBJECTS.find((s) => s.id === id);
