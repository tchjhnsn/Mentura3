/**
 * People in history (Torian, 2026-11-16 04:02Z and 04:07Z, on the guide tab "People and eras"): a page for each person,
 * not each philosopher, because Socrates and Alexander wrote nothing and are known only from what others wrote about
 * them, and kings and leaders belong beside the writers. A page holds what they made (By them) and what was made about
 * them (About them), as a library catalogue keeps creator and subject apart; who they knew; what they read; and
 * their time.
 *
 * Every relation is a fact a source gives, said in a line, never a judgment of who agreed with whom (that is a separate
 * piece, chosen by editors, not built). Every book in What they read has the passage that shows they read it: their
 * own words where they say so, else the earliest account. Rulers appear only beside people who dealt with them.
 * Quotations are from translations in the public domain. Pure: no I/O.
 */
import type { CollectionItem } from "./collections";
import type { TopicPerson } from "./topic-pages";

/**
 * A place in a work: the work (an id in `topic-pages.ts`, or a plain title when it has no page), where in it, and
 * its words in a public-domain translation.
 */
export type Passage = { work: string; at: string; words?: string; tr?: string; /** Written in English, so quoted with no translator. */ en?: true };

export const p = (work: string, at: string, words?: string, tr?: string): Passage => ({ work, at, ...(words ? { words } : {}), ...(tr ? { tr } : {}) });
/** A passage written in English, quoted as written. */
export const en = (work: string, at: string, words: string): Passage => ({ work, at, words, en: true });

/** Whether a section starts in the person's own words, or is rebuilt from their time. */
export type Stance = "own" | "rebuilt";

/** One thing a person kept or warned against: a mode, an instrument or a kind of song, with the passage that says so. */
export type Rule = { what: string; kind: "mode" | "instrument" | "song"; verdict: "kept" | "warned"; why: string; at: Passage };

export type Contemporary = TopicPerson & { note: string };

/** A playlist across the ages chosen by Reflect's editors in a person's spirit. */
export type Ages = { name: string; about: string; items: readonly CollectionItem[] };

export type MusicSection = {
  stance: Stance;
  /** The one line said above a rebuilt section. */
  note?: string;
  words: readonly Passage[];
  rules: readonly Rule[];
  /** Music of their time, what survives, played by people who reconstruct it, or their own. */
  time: readonly CollectionItem[];
  timeNote: string;
  people: readonly Contemporary[];
  ages: readonly Ages[];
};

export type TheatreSection = {
  stance: Stance;
  note?: string;
  words: readonly Passage[];
  /** Plays of their time with work pages (ids in `topic-pages.ts`). */
  plays: readonly string[];
  people: readonly Contemporary[];
};

/** A song, poem or play a person names, and where it is now: a work page, or lost with what remains. */
export type Named = { at: Passage; names: string; why: string; work?: string; lost?: string };

/** A Wikipedia article read inside Scholē, by its page title. */
export type Article = { title: string; note: string };

/** The periods Scholē groups people by, each with its topic page. */
export type Era = "ancient" | "medieval" | "renaissance" | "enlightenment" | "founding";
export const ERAS: readonly { id: Era; label: string; when: string; topics: readonly string[] }[] = [
  { id: "ancient", label: "Greece and Rome", when: "5th century BC to 2nd century AD", topics: ["greeks", "romans", "stoics"] },
  { id: "medieval", label: "The Middle Ages", when: "5th to 14th century", topics: ["medieval"] },
  { id: "renaissance", label: "The Renaissance", when: "15th and 16th centuries", topics: ["renaissance"] },
  { id: "enlightenment", label: "The Enlightenment", when: "Late 17th and 18th centuries", topics: ["enlightenment"] },
  { id: "founding", label: "The American founding", when: "1760s to 1800s", topics: ["founding"] },
];

/**
 * How two people were tied, by the kinds biographies and Wikidata use (student of, family, employer, position held).
 * `ruler` is a ruler the person served or dealt with; `served` is someone who served the person, for rulers.
 */
export type Rel = "teacher" | "student" | "family" | "friend" | "patron" | "ruler" | "served" | "contemporary";
export const REL_LABEL: Record<Rel, string> = {
  teacher: "Teachers", student: "Students", family: "Family", friend: "Friends and correspondents", patron: "Patrons",
  ruler: "Rulers they dealt with", served: "Who served them", contemporary: "Others they knew",
};
export const REL_ORDER: readonly Rel[] = ["teacher", "student", "family", "friend", "patron", "ruler", "served", "contemporary"];

/** A person they knew: what the tie was, and one line of fact on it. */
export type Relation = TopicPerson & { rel: Rel; note: string };

/**
 * A work they read, and the passage that shows it: where they say so themselves, or the earliest account. `work` is a
 * work page, `item` a recording, when Scholē has it.
 */
export type Read = { title: string; by: string; work?: string; item?: CollectionItem; at: Passage; note: string };

export type Person = {
  id: string;
  name: string;
  wiki: string;
  ol?: string;
  born: string;
  died: string;
  place: string;
  what: string;
  about: string;
  era: Era;
  topics: readonly string[];
  /** What most people should hear first: a work page id, or a recording. */
  start: string | CollectionItem;
  /** Their works with pages, in reading order. */
  works: readonly string[];
  /** Their works without pages: recordings of their books, their own music. */
  by?: readonly CollectionItem[];
  /** Works about them with pages (a play, a dialogue). */
  aboutWorks?: readonly string[];
  /** Works about them without pages: lives, histories, lectures. */
  aboutThem?: readonly CollectionItem[];
  relations: readonly Relation[];
  read: readonly Read[];
  music?: MusicSection;
  theatre?: TheatreSection;
  named?: readonly Named[];
  /** Read and hear more, written in their time. */
  from: readonly CollectionItem[];
  /** Read and hear more, written later about the time. */
  later: readonly CollectionItem[];
  articles: readonly Article[];
};
