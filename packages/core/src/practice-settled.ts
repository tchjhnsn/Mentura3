/**
 * The dialogues practice runs on, and the settled answers drafted for them. Torian chose (2026-11-16 20:56Z, card) that
 * Reflect drafts about 30 settled answers for Euthyphro and he confirms the list before any counts: an entry counts only
 * once `confirmed` names who confirmed it. Turns are numbered as `parseTurns` cuts Jowett's translation (Project
 * Gutenberg 1642, 1584, 1643). Pure: no I/O.
 */
import type { Kind } from "./argument-practice";

export const DIALOGUES = [
  { id: "euthyphro", title: "Euthyphro", question: "What is piety?", audiobook: "275" },
  { id: "laches", title: "Laches", question: "What is courage?", audiobook: "8630" },
  { id: "meno", title: "Meno", question: "Can virtue be taught?", audiobook: "5566" },
] as const;

export type DialogueId = (typeof DIALOGUES)[number]["id"];
export const isDialogue = (s: unknown): s is DialogueId => DIALOGUES.some((d) => d.id === s);

/** A drafted settled answer. For a target question, `answer` is the number of the turn it answers, or "none". */
export type Draft = { work: DialogueId; n: number; kind: Kind; answer: string; why: string; confirmed?: string };

const move = (n: number, answer: string, why: string): Draft => ({ work: "euthyphro", n, kind: "move", answer, why });
const target = (n: number, answer: number | "none", why: string): Draft => ({ work: "euthyphro", n, kind: "target", answer: String(answer), why });
const stasis = (n: number, answer: string, why: string): Draft => ({ work: "euthyphro", n, kind: "stasis", answer, why });

export const DRAFTS: readonly Draft[] = [
  move(0, "question", "He asks why Socrates is at the court."),
  move(5, "grant", "A plain yes to what Euthyphro asked."),
  target(5, 4, "It answers \"Then some one else has been prosecuting you?\""),
  move(17, "question", "He asks whether Euthyphro brings the suit or answers it."),
  stasis(17, "fact", "Who is suing whom is a question of fact."),
  move(26, "grant", "Yes: he confirms it is his father."),
  target(26, 25, "It answers \"Your father!\""),
  move(33, "question", "He asks whether Euthyphro is sure enough to prosecute his father."),
  stasis(33, "quality", "Whether prosecuting one's father is pious is a question of quality."),
  move(39, "question", "The question of the dialogue: what piety is."),
  stasis(39, "definition", "What piety is, is a question of definition."),
  move(40, "claim", "His first answer: piety is prosecuting the wrongdoer."),
  stasis(40, "definition", "He offers a definition of piety."),
  move(47, "question", "He asks whether there are other pious acts."),
  move(48, "grant", "He grants there are."),
  target(48, 47, "It answers the question just asked."),
  move(54, "claim", "His second answer: piety is what is dear to the gods."),
  stasis(54, "definition", "A second definition."),
  move(56, "grant", "Of course: he grants Socrates may examine it."),
  target(56, 55, "It answers Socrates's turn before it."),
  move(61, "question", "He asks Euthyphro to grant that the gods were said to quarrel."),
  move(75, "question", "He asks whether every man loves what he thinks just."),
  move(79, "question", "He draws a conclusion and asks Euthyphro to grant it."),
  move(80, "grant", "True: he grants it."),
  target(80, 79, "It grants the turn before it."),
  move(81, "question", "He asks whether the same things would then be pious and impious."),
  move(82, "grant", "He grants it, reluctantly."),
  target(82, 81, "It grants the turn before it."),
  move(91, "question", "He asks Euthyphro to grant that people dispute the facts, not the rule."),
  stasis(91, "fact", "Who did it, what he did and when: Socrates names the stasis of fact."),
  move(104, "claim", "His third answer: piety is what all the gods love."),
  stasis(104, "definition", "A third definition."),
  move(107, "question", "The famous question: is the pious loved because it is pious, or pious because it is loved?"),
  stasis(107, "definition", "It asks what piety is in itself."),
  move(113, "question", "He asks why a carried thing is carried."),
  move(123, "question", "He asks whether piety is loved by all the gods."),
  move(125, "question", "He asks why it is loved."),
  move(127, "question", "He asks Euthyphro to grant it is loved because it is holy."),
  move(131, "rebut", "He concludes that what is dear to the gods and what is holy are two different things, against Euthyphro's definition."),
  target(131, "none", "It attacks the definition of turn 104, further back than the three turns offered."),
];

/** The settled answers that count: only those confirmed by a person. */
export const confirmedDrafts = (work: DialogueId) => DRAFTS.filter((d) => d.work === work && d.confirmed);
