/**
 * The dialogues practice runs on, their issues, and the settled answers drafted for them. Torian chose (2026-11-16
 * 20:56Z, card) that Reflect drafts settled answers for Euthyphro and he confirms the list before any counts: an entry
 * counts only once `confirmed` names who confirmed it. Redrafted for the second guidelines (22:33Z): units are numbered
 * "turn.unit" as `unitsOf` cuts Jowett's translation (Project Gutenberg 1642, 1584, 1643). Pure: no I/O.
 */
import type { Issue, Kind } from "./argument-practice";

export const DIALOGUES = [
  { id: "euthyphro", title: "Euthyphro", question: "What is piety?", audiobook: "275" },
  { id: "laches", title: "Laches", question: "What is courage?", audiobook: "8630" },
  { id: "meno", title: "Meno", question: "Can virtue be taught?", audiobook: "5566" },
] as const;

export type DialogueId = (typeof DIALOGUES)[number]["id"];
export const isDialogue = (s: unknown): s is DialogueId => DIALOGUES.some((d) => d.id === s);

/**
 * A drafted settled answer. `at` is a unit ("40.2"), an issue id for stasis, or a unit and critical question
 * ("40.2~analogy.0"). A target's answer is a unit, or "none". `also` holds other answers accepted where readers split.
 */
export type Draft = { work: DialogueId; at: string; kind: Kind; answer: string; also?: readonly string[]; why: string; confirmed?: string };

const E = "euthyphro" as const;
const act = (at: string, answer: string, why: string, also?: string[]): Draft => ({ work: E, at, kind: "act", answer, why, ...(also ? { also } : {}) });
const rel = (at: string, answer: string, why: string, also?: string[]): Draft => ({ work: E, at, kind: "relation", answer, why, ...(also ? { also } : {}) });
const target = (at: string, answer: string, why: string): Draft => ({ work: E, at, kind: "target", answer, why });
const stasis = (at: string, answer: string, why: string, also?: string[]): Draft => ({ work: E, at, kind: "stasis", answer, why, ...(also ? { also } : {}) });
const scheme = (at: string, answer: string, why: string, also?: string[]): Draft => ({ work: E, at, kind: "scheme", answer, why, ...(also ? { also } : {}) });
const cq = (at: string, answer: string, why: string): Draft => ({ work: E, at, kind: "cq", answer, why });

/** The questions in dispute in each dialogue, where they are raised. Stasis is asked of these. */
export const ISSUES: Record<DialogueId, readonly Issue[]> = {
  euthyphro: [
    { id: "suit", question: "Whom is Euthyphro prosecuting, and for what?", at: 17 },
    { id: "justly", question: "Was the labourer's death a wrong that ought to be prosecuted?", at: 32 },
    { id: "son", question: "Is a son the right person to prosecute his own father?", at: 32 },
    { id: "piety", question: "What is piety?", at: 39 },
    { id: "stories", question: "Are the stories told of the gods true?", at: 43 },
    { id: "gods-agree", question: "Would all the gods agree that Euthyphro's father should be punished?", at: 84 },
    { id: "dilemma", question: "Is the pious loved by the gods because it is pious, or pious because it is loved?", at: 107 },
  ],
  laches: [],
  meno: [],
};

export const DRAFTS: readonly Draft[] = [
  act("0.0", "pure-questioning", "He asks why Socrates is at the court, committing to nothing."),
  act("0.1", "assertive-questioning", "He asks, and in asking says he thinks Socrates has no suit before the King.", ["rhetorical-questioning"]),
  act("2.1", "asserting", "He says he supposes someone is prosecuting Socrates, and gives his reason in the same sentence."),
  act("3.0", "agreeing", "A plain yes to Euthyphro's belief that Socrates prosecutes no one."),
  target("3.0", "2.1", "It agrees that Socrates is not the prosecutor."),
  act("4.0", "assertive-questioning", "He draws the conclusion and asks Socrates to confirm it."),
  act("5.0", "agreeing", "Yes."),
  target("5.0", "4.0", "It answers \"Then some one else has been prosecuting you?\""),
  act("6.0", "pure-questioning", "He asks who it is."),
  act("7.0", "asserting", "He says who Meletus is."),
  act("8.1", "pure-questioning", "He asks what the charge is."),
  act("9.0", "restating", "He repeats Euthyphro's question before answering it.", ["none"]),
  act("9.3", "asserting", "The words commit him to Meletus being wise, even though the irony is plain: the question is what the words do, not what Socrates privately meant."),
  act("10.0", "disagreeing", "He fears the opposite of what Socrates said will prove true."),
  rel("10.0", "rebuts", "It says Socrates' conclusion, that Meletus will be a public benefactor, will turn out false."),
  target("10.0", "9.6", "It answers the claim that Meletus will be a great public benefactor."),
  act("10.1", "asserting", "He gives his opinion of what Meletus is doing."),
  rel("10.1", "supports", "It is his reason for fearing the opposite."),
  target("10.1", "10.0", "It supports his fear just before it."),
  act("21.0", "none", "A joke on \"pursuer\": is the man he pursues a fugitive with wings?", ["rhetorical-questioning"]),
  act("29.1", "asserting", "He says such a man must be far advanced in wisdom."),
  act("30.0", "agreeing", "Euthyphro accepts the praise."),
  target("30.0", "29.1", "It agrees that such a man must be wise."),
  act("31.0", "asserting", "He supposes the dead man was a relative, and gives a reason."),
  act("32.0", "disagreeing", "He rejects the distinction between relatives and strangers.", ["asserting"]),
  rel("32.0", "undermines", "It attacks what Socrates' guess rested on, that one would prosecute only for a relative.", ["rebuts"]),
  target("32.0", "31.0", "It attacks Socrates' supposition."),
  act("32.10", "asserting", "He says his family know little of what the gods think."),
  rel("32.10", "rebuts", "It says his family's view, that a son who prosecutes his father is impious, is false."),
  target("32.10", "32.9", "It answers what his family say."),
  act("33.0", "challenging", "He asks on what grounds Euthyphro is so sure he is not doing something impious himself.", ["assertive-questioning"]),
  target("33.0", "32.10", "It asks for the grounds of Euthyphro's claim to know what the gods think."),
  act("34.1", "rhetorical-questioning", "It asks nothing; it says he would be good for nothing without his knowledge."),
  act("37.4", "assertive-questioning", "He asks, and commits himself, that piety is always the same in every action."),
  act("38.0", "agreeing", "To be sure."),
  target("38.0", "37.4", "It agrees that piety is always the same."),
  act("39.0", "pure-questioning", "The dialogue's question: what is piety?"),
  act("40.0", "asserting", "His first definition: piety is doing as he is doing."),
  act("40.2", "asserting", "He states what men believe of Zeus and Cronos."),
  rel("40.2", "supports", "It is the proof he promised for his principle."),
  target("40.2", "40.1", "It supports the principle he has just promised to prove."),
  scheme("40.2", "analogy", "Zeus punished his father for wrongdoing, so a son may rightly prosecute his.", ["example"]),
  cq("40.2~analogy.0", "yes", "The cases differ: Zeus is a god, and a god's acts may not be a measure for a man's."),
  cq("40.2~analogy.1", "cannot-tell", "Whether Zeus did so is the question; Socrates asks at once whether Euthyphro really believes the stories (41.3, 43.2)."),
  act("47.0", "assertive-questioning", "He grants Euthyphro's answer and asks him to admit there are other pious acts."),
  act("54.0", "asserting", "His second definition: piety is what is dear to the gods."),
  act("81.0", "assertive-questioning", "He asks Euthyphro to accept the consequence, committing himself to it."),
  rel("81.0", "rebuts", "If the same things are both pious and impious, the definition that piety is what is dear to the gods fails.", ["undermines"]),
  target("81.0", "54.0", "It attacks the second definition."),
  act("84.0", "disagreeing", "He believes all the gods would agree about punishing a murderer.", ["asserting"]),
  rel("84.0", "rebuts", "It denies that some gods may disapprove of what he is doing."),
  target("84.0", "83.2", "It answers the claim that his act may please Zeus and displease Cronos."),
  act("91.0", "assertive-questioning", "He asks Euthyphro to accept that men dispute who did wrong, not whether wrong should be punished. This is stasis itself: a dispute of fact, not of quality."),
  act("97.0", "challenging", "He asks for proof that all the gods approve."),
  target("97.0", "84.0", "It asks for the grounds of Euthyphro's belief that all the gods would agree."),
  act("102.0", "rhetorical-questioning", "\"Why not?\" asks nothing; it accepts the amended definition.", ["agreeing"]),
  act("107.1", "pure-questioning", "The famous question, asked without committing to either side."),
  act("109.0", "asserting", "He gives examples: carrying and being carried, leading and being led, seeing and being seen."),
  rel("109.0", "supports", "The examples are offered to show his general point."),
  target("109.0", "117.1", "They support the general claim he draws from them, that a state follows from an act."),
  scheme("109.0", "example", "Cases are offered to show a general claim.", ["analogy"]),
  act("126.0", "agreeing", "\"No, that is the reason\": he accepts that piety is loved because it is pious."),
  target("126.0", "125.0", "It answers \"Because it is pious or holy, or for some other reason?\""),
  act("131.0", "asserting", "He concludes that what is dear to the gods and what is holy are different."),
  rel("131.0", "rebuts", "It says the amended definition is false."),
  target("131.0", "101.3", "It attacks the definition as amended: what all the gods love is pious."),
  act("137.3", "asserting", "He says Euthyphro has given an attribute of piety, not its essence."),
  rel("137.3", "undercuts", "It grants that the pious may be loved by all the gods, but denies that this says what piety is."),
  target("137.3", "101.3", "It answers the amended definition."),
  act("139.0", "none", "A joke: his words walk away like the statues of Daedalus.", ["asserting"]),
  stasis("suit", "fact", "Who is suing whom, and on what charge, is a question of fact."),
  stasis("justly", "quality", "Whether the killing was just is a question of quality; his family also deny the father killed him (32.9), a question of fact.", ["fact"]),
  stasis("son", "procedure", "Whether a son is the right person to bring the charge is a question of procedure: the right person to decide it.", ["quality"]),
  stasis("piety", "definition", "It asks what piety is."),
  stasis("stories", "fact", "Whether the gods did these things is a question of fact."),
  stasis("gods-agree", "fact", "Whether all the gods agree is a question of fact."),
  stasis("dilemma", "definition", "It asks what piety is in itself, whether being loved is its essence or an attribute."),
];

/** The settled answers that count: only those confirmed by a person. */
export const confirmedDrafts = (work: DialogueId) => DRAFTS.filter((d) => d.work === work && d.confirmed);
