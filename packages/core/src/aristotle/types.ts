// Courses on Aristotle's works, broken down by subject (Torian, 2026-11-21). One course per work, one unit per book
// (or per treatise, or per run of chapters where a work has no books), and short lessons inside each unit, after Uxcel's
// course, level and lesson (Mobbin, "Starting a lesson" and "Read theory"). Every lesson quotes a public-domain English
// translation, verbatim, with its Bekker reference, so the person reads Aristotle and not only about him.
//
// The subjects follow Aristotle's own division of knowledge (Metaphysics VI.1, 1025b18-1026a23; Topics VI.6, 145a15):
// theoretical knowing (nature, soul, living things, first philosophy), practical knowing (ethics, politics), productive
// knowing (rhetoric, poetics), with logic before them all as the instrument (organon) of every inquiry.
// Checks are for the person alone: no score, no points, no grade. Examiners are people (README, "Examinations").

export type SubjectId = "logic" | "nature" | "soul" | "life" | "first-philosophy" | "ethics" | "politics" | "rhetoric" | "poetics";
export type Division = "instrument" | "theoretical" | "practical" | "productive";
export type Level = "Start here" | "Intermediate" | "Advanced";

export type Subject = {
  id: SubjectId;
  title: string;
  /** The Greek name, in Greek letters, then transliterated. */
  greek: string;
  translit: string;
  division: Division;
  /** What the subject studies, in one sentence a newcomer understands. */
  line: string;
  /** The order to read its works in, by course id. */
  path: string[];
};

export type Term = { greek: string; translit: string; english: string; gloss: string };

/** One tap-choice question: what the passage says, never a trick. `answer` is the index into `options`. */
export type Check = { q: string; options: string[]; answer: number; why: string };

export type Passage = {
  /** Verbatim from the translation named on the course, 20 to 90 words. */
  text: string;
  /** Book, chapter and Bekker line, for example "I.1, 1094a1-3". */
  ref: string;
};

export type Lesson = {
  /** Unique inside its course, kebab-case. */
  id: string;
  title: string;
  /** The Bekker range the lesson covers, for example "1094a1-1094b11". */
  bekker: string;
  /** About five minutes of reading. */
  minutes: number;
  /** What Aristotle says here, in plain sentences, 60 to 160 words. Never put words in his mouth. */
  summary: string;
  passage: Passage;
  terms: Term[];
  /** Two or three questions. */
  checks: Check[];
  /** A question to take to the journal. Writing happens only in the journal. */
  journal: string;
};

export type Unit = { id: string; title: string; bekker: string; line: string; lessons: Lesson[] };

export type Translation = { translator: string; year: number; title: string; url: string };

export type Course = {
  /** kebab-case, the work's common English title: "nicomachean-ethics". */
  id: string;
  title: string;
  /** Greek title in Greek letters, and the Latin title scholars cite. */
  greek: string;
  latin: string;
  subject: SubjectId;
  level: Level;
  /** Bekker pages the work fills, for example "1094a-1181b". */
  bekker: string;
  /** Two or three sentences: what the work asks and why it matters. */
  about: string;
  /** Course ids worth reading first; empty when none. */
  before: string[];
  /** Scholars doubt Aristotle wrote it, or it survives only in part: say so plainly. Empty when not. */
  caveat: string;
  translation: Translation;
  units: Unit[];
};
