// Listening and watching beside the reading (Torian, 2026-11-21): for each course, the LibriVox audiobook of the work, and
// for each unit the audiobook sections that cover it, plus podcast episodes and lectures where real ones exist.
// Every URL here was fetched and its title checked against the work on 2026-11-21. Section numbers are the 1-based
// positions of the sections as the LibriVox API lists them (https://librivox.org/api/feed/audiobooks/?id=<id>&extended=1).
// A unit has no `chapters` when its sections could not be matched cleanly. Nothing here is guessed.

export type Episode = { show: string; title: string; url: string; minutes?: number };
export type Lecture = { title: string; by: string; url: string; minutes?: number };
export type UnitMedia = { chapters?: number[]; episodes?: Episode[]; lectures?: Lecture[] };
export type CourseMedia = { audiobook?: string; episodes?: Episode[]; lectures?: Lecture[]; units: Record<string, UnitMedia> };

const HOP = "History of Philosophy Without Any Gaps";
const hop = (slug: string, title: string): Episode => ({ show: HOP, title, url: `https://historyofphilosophy.net/podcast/classical-greek/aristotle/${slug}` });
const IOT = "In Our Time (BBC Radio 4)";
const iot = (pid: string, title: string, minutes: number): Episode => ({ show: IOT, title, url: `https://www.bbc.co.uk/programmes/${pid}`, minutes });

const HOP_LOGIC = hop("aristotle-logic", "35 - The Philosopher's Toolkit: Aristotle's Logical Works");
const HOP_SUBSTANCE = hop("aristotle-substance", "38 - Down to Earth: Aristotle on Substance");
const HOP_MIND_GOD = hop("aristotle-mind-god", "47 - God Only Knows: Aristotle on Mind and God");
const HOP_BIOLOGY = hop("aristotle-biology", "43 - Classified Information: Aristotle's Biology");
const HOP_FRIENDSHIP = hop("aristotle-friendship", "45 - The Second Self: Aristotle On Pleasure And Friendship");
const HOP_RHET_POET = hop("aristotle-rhetoric-poetics", "49 - Stage Directions: Aristotle's Rhetoric and Poetics");
const IOT_BIOLOGY = iot("m0002cfd", "Aristotle's Biology", 50);

const smith = (n: number, title: string): Lecture => ({ title: `Lecture ${n} - ${title}`, by: "Steven B. Smith, Yale (PLSC 114)", url: `https://oyc.yale.edu/political-science/plsc-114/lecture-${n}` });
const gendler = (n: number, title: string): Lecture => ({ title: `Lecture ${n} - ${title}`, by: "Tamar Gendler, Yale (PHIL 181)", url: `https://oyc.yale.edu/philosophy/phil-181/lecture-${n}` });
const sandel = (slug: string, title: string): Lecture => ({ title, by: "Michael Sandel, Harvard (Justice)", url: `https://justiceharvard.org/${slug}/` });
const SMITH_7 = smith(7, "The Mixed Regime and the Rule of Law: Aristotle, Politics, I, III");
const GENDLER_VIRTUE_1 = gendler(9, "Virtue and Habit I");
const GENDLER_VIRTUE_2 = gendler(10, "Virtue and Habit II");

export const MEDIA: Record<string, CourseMedia> = {
  // Logic
  categories: {
    audiobook: "4237",
    episodes: [HOP_LOGIC],
    units: {
      "words-and-kinds": { chapters: [1] },
      substance: { chapters: [1] },
      "quantity-relation-quality": { chapters: [1, 2] },
      "opposites-priority-change": { chapters: [2] },
    },
  },
  "on-interpretation": {
    audiobook: "4262",
    units: {
      "names-verbs-statements": { chapters: [1] },
      "contraries-and-contradictories": { chapters: [1] },
      "sea-fight": { chapters: [1], episodes: [HOP_LOGIC] },
      "negation-and-modality": { chapters: [1, 2] },
    },
  },
  "prior-analytics": {
    audiobook: "4448",
    episodes: [HOP_LOGIC],
    units: {
      "book-1": { chapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      "book-2": { chapters: [11, 12, 13, 14, 15, 16, 17] },
    },
  },
  "posterior-analytics": {
    audiobook: "4733",
    episodes: [hop("aristotle-epistemology", "36 - A Principled Stand: Aristotle's Epistemology")],
    units: {
      "book-1": { chapters: [1, 2, 3, 4, 5, 6, 7] },
      "book-2": { chapters: [8, 9, 10, 11] },
    },
  },
  topics: {
    audiobook: "4863",
    units: {
      "book-1": { chapters: [1, 2, 3] },
      "book-2": { chapters: [4, 5] },
      "book-3": { chapters: [6] },
      "book-4": { chapters: [7, 8] },
      "book-5": { chapters: [9, 10, 11] },
      "book-6": { chapters: [12, 13, 14] },
      "book-7": { chapters: [15] },
      "book-8": { chapters: [16, 17, 18] },
    },
  },
  "sophistical-refutations": {
    audiobook: "5109",
    units: {
      "real-and-apparent": { chapters: [1] },
      "kinds-of-fallacy": { chapters: [1, 2, 3] },
      answering: { chapters: [3, 4, 5, 6, 7] },
      epilogue: { chapters: [7] },
    },
  },

  // Nature
  physics: {
    audiobook: "7322",
    episodes: [hop("aristotle-physics", "40 - Let's Get Physical: Aristotle's Natural Philosophy")],
    units: {
      "book-1": { chapters: [1, 2, 3] },
      "book-2": { chapters: [4, 5], episodes: [hop("aristotle-four-causes", "39 - Form and Function: Aristotle's Four Causes")] },
      "book-3": { chapters: [6, 7] },
      "book-4": { chapters: [8, 9, 10], episodes: [hop("aristotle-sorabji", "41 - Richard Sorabji on Time and Eternity in Aristotle")] },
      "book-5": { chapters: [11, 12] },
      "book-6": { chapters: [13, 14] },
      "book-7": { chapters: [15] },
      "book-8": { chapters: [16, 17, 18] },
    },
  },
  "on-the-heavens": {
    audiobook: "6043",
    units: {
      "book-1": { chapters: [1, 2, 3, 4, 5] },
      "book-2": { chapters: [6, 7, 8, 9] },
      "book-3": { chapters: [10, 11] },
      "book-4": { chapters: [12, 13] },
    },
  },
  "on-generation-and-corruption": {
    audiobook: "6227",
    units: {
      "book-1": { chapters: [1, 2, 3, 4, 5] },
      "book-2": { chapters: [6, 7, 8] },
    },
  },
  meteorology: {
    // Recorded with On the Universe and On Breath; sections 1-16 are the Meteorology.
    audiobook: "18153",
    units: {
      "book-1": { chapters: [1, 2, 3, 4] },
      "book-2": { chapters: [5, 6, 7, 8, 9] },
      "book-3": { chapters: [10, 11, 12] },
      "book-4": { chapters: [13, 14, 15, 16] },
    },
  },

  // Soul and life
  "on-the-soul": {
    audiobook: "5726",
    episodes: [hop("aristotle-soul", "42 - Soul Power: Aristotle's De Anima")],
    units: {
      "book-1": { chapters: [1, 2] },
      "book-2": { chapters: [3, 4, 5] },
      "book-3": { chapters: [6, 7, 8], episodes: [HOP_MIND_GOD] },
    },
  },
  "parva-naturalia": {
    audiobook: "5876",
    units: {
      "sense-and-sensibilia": { chapters: [1, 2, 3, 4] },
      "memory-and-recollection": { chapters: [5] },
      "sleep-and-waking": { chapters: [6] },
      "on-dreams": { chapters: [7] },
      "divination-in-sleep": { chapters: [8] },
      "length-and-shortness-of-life": { chapters: [9] },
      "youth-old-age-life-death-breathing": { chapters: [10, 11, 12, 13, 14] },
    },
  },
  "history-of-animals": {
    audiobook: "16257",
    episodes: [HOP_BIOLOGY, IOT_BIOLOGY],
    units: {
      "book-1": { chapters: [2, 3, 4, 5] },
      "book-2": { chapters: [6, 7, 8, 9] },
      "book-3": { chapters: [10, 11, 12, 13, 14] },
      "book-4": { chapters: [15, 16, 17, 18, 19, 20] },
      "book-5": { chapters: [21, 22, 23, 24, 25, 26, 27] },
      "book-6": { chapters: [28, 29, 30, 31, 32, 33, 34] },
      "book-7": { chapters: [35, 36, 37] },
      "book-8": { chapters: [38, 39, 40, 41, 42, 43] },
      "book-9": { chapters: [44, 45, 46, 47, 48, 49, 50, 51] },
    },
  },
  "parts-of-animals": {
    audiobook: "13281",
    episodes: [HOP_BIOLOGY, IOT_BIOLOGY],
    units: {
      "book-1": { chapters: [3] },
      "book-2": { chapters: [4, 5] },
      "book-3": { chapters: [6, 7] },
      "book-4": { chapters: [8, 9, 10] },
    },
  },
  "movement-and-progression-of-animals": {
    audiobook: "17639",
    units: {
      "movement-of-animals": { chapters: [1, 2, 3] },
      "progression-of-animals": { chapters: [4, 5, 6, 7] },
    },
  },
  "generation-of-animals": {
    audiobook: "17705",
    episodes: [HOP_BIOLOGY, IOT_BIOLOGY],
    units: {
      "book-1": { chapters: [1, 2, 3, 4, 5] },
      "book-2": { chapters: [6, 7, 8, 9, 10] },
      "book-3": { chapters: [11, 12, 13, 14, 15] },
      "book-4": { chapters: [16, 17, 18, 19, 20] },
      "book-5": { chapters: [21, 22, 23] },
    },
  },

  // First philosophy. The LibriVox reading counts little alpha as "Book I (the Less)", so its Book II is Beta (III here),
  // and so on to its Book XIII, which is Nu (XIV here).
  metaphysics: {
    audiobook: "5224",
    units: {
      "book-1": { chapters: [1, 2, 3] },
      "book-2": { chapters: [4] },
      "book-3": { chapters: [5, 6] },
      "book-4": { chapters: [7, 8, 9] },
      "book-5": { chapters: [10, 11, 12] },
      "book-6": { chapters: [13] },
      "book-7": { chapters: [14, 15, 16, 17], episodes: [HOP_SUBSTANCE] },
      "book-8": { chapters: [18], episodes: [HOP_SUBSTANCE] },
      "book-9": { chapters: [19, 20] },
      "book-10": { chapters: [21, 22] },
      "book-11": { chapters: [23, 24, 25] },
      "book-12": { chapters: [26, 27], episodes: [HOP_MIND_GOD] },
      "book-13": { chapters: [28, 29, 30] },
      "book-14": { chapters: [31, 32] },
    },
  },

  // Ethics
  "nicomachean-ethics": {
    audiobook: "3733",
    episodes: [
      hop("aristotle-ethics", "44 - The Goldilocks Theory: Aristotle's Ethics"),
      hop("scott-aristotle-ethics", "46 - Dominic Scott on Aristotle's Ethics"),
      iot("m001rylh", "Aristotle's Nicomachean Ethics", 52),
      { show: "Philosophize This!", title: "Episode #005 - Aristotle Part 1", url: "https://www.philosophizethis.org/podcast/aristotle-part-1-8z586" },
    ],
    units: {
      "book-1": { chapters: [1] },
      "book-2": { chapters: [2], lectures: [GENDLER_VIRTUE_1, GENDLER_VIRTUE_2] },
      "book-3": { chapters: [3] },
      "book-4": { chapters: [4] },
      "book-5": { chapters: [5] },
      "book-6": { chapters: [6] },
      "book-7": { chapters: [7], lectures: [gendler(11, "Weakness of the Will and Procrastination")] },
      "book-8": { chapters: [8], episodes: [HOP_FRIENDSHIP] },
      "book-9": { chapters: [9] },
      "book-10": { chapters: [10], episodes: [HOP_FRIENDSHIP] },
    },
  },
  "eudemian-ethics": {
    audiobook: "7854",
    units: {
      "book-1": { chapters: [1] },
      "book-2": { chapters: [2, 3] },
      "book-3": { chapters: [4] },
      "book-7": { chapters: [5, 6, 7] },
    },
  },
  "magna-moralia": {
    audiobook: "8044",
    units: {
      "book-1": { chapters: [1, 2, 3] },
      "book-2": { chapters: [4, 5, 6] },
    },
  },

  // Politics, rhetoric, poetics
  politics: {
    audiobook: "1360",
    episodes: [hop("aristotle-politics", "48 - Constitutional Conventions: Aristotle's Political Philosophy"), iot("b00f8530", "Aristotle's Politics", 45)],
    units: {
      "book-1": { chapters: [1, 2, 3], lectures: [SMITH_7, sandel("lecture-20-freedom-vs-fit", "Lecture 20: Freedom vs. Fit")] },
      "book-2": { chapters: [4, 5, 6, 7, 8] },
      "book-3": {
        chapters: [9, 10, 11, 12],
        lectures: [SMITH_7, sandel("lecture-18-whats-the-purpose", "Lecture 18: What's the Purpose?"), sandel("lecture-19-the-good-citizen", "Lecture 19: The Good Citizen")],
      },
      "book-4": { chapters: [13, 14, 15, 16], lectures: [smith(8, "The Mixed Regime and the Rule of Law: Aristotle, Politics, IV")] },
      "book-5": { chapters: [17, 18, 19, 20, 21] },
      "book-6": { chapters: [22, 23] },
      "book-7": { chapters: [24, 25, 26, 27, 28], lectures: [smith(9, "The Mixed Regime and the Rule of Law: Aristotle, Politics, VII")] },
      "book-8": { chapters: [29, 30] },
    },
  },
  "constitution-of-the-athenians": {
    // The English reading (7628) over the Greek one (11476). It ends at chapter 63.
    audiobook: "7628",
    units: {
      "draco-and-solon": { chapters: [1] },
      "pisistratus-and-cleisthenes": { chapters: [2, 3] },
      "eleven-changes": { chapters: [3, 4] },
      "the-constitution-today": { chapters: [5, 6] },
    },
  },
  rhetoric: {
    audiobook: "4114",
    episodes: [HOP_RHET_POET],
    units: {
      "book-1": { chapters: [1, 2, 3] },
      "book-2": { chapters: [4, 5, 6] },
      "book-3": { chapters: [7, 8, 9] },
    },
  },
  poetics: {
    audiobook: "240",
    episodes: [HOP_RHET_POET, iot("b00xw210", "Aristotle's Poetics", 45)],
    units: {
      "chapters-1-5": { chapters: [2, 3] },
      "chapters-6-9": { chapters: [4, 5] },
      "chapters-10-19": { chapters: [5, 6, 7, 8] },
      "chapters-20-22": { chapters: [9, 10] },
      "chapters-23-26": { chapters: [10, 11] },
    },
  },
};

export const mediaOf = (course: string): CourseMedia | null => MEDIA[course] ?? null;
export const unitMediaOf = (course: string, unit: string): UnitMedia | null => MEDIA[course]?.units[unit] ?? null;
