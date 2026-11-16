/**
 * The course on argument and speech acts (Torian, 2026-11-16 22:33Z: "I would even like for us to build courses around
 * this subject"): the modern work the dialectic practice is built on. Speech acts (Austin, Searle), argument technology
 * (Reed, Budzynska and the Centre for Argument Technology, whose Inference Anchoring Theory names the practice's acts),
 * agreement between many readers (Krippendorff's content analysis, Dawid's work on observers), then the ancient question
 * at issue (the stasis playlist from the dialectic course). Every recording is one listed on its speaker's page
 * (`scholars.ts`), checked there. Object literals only: `collections.ts` imports this. Pure: no I/O.
 */
import type { Collection, CollectionItem } from "./collections";

const ED = "Reflect's editors";
const talk = (id: string, title: string, by: string, why: string): CollectionItem => ({ kind: "find", medium: "lecture", title, by, url: `https://www.youtube.com/watch?v=${id}`, image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, why });

export const ARGUMENT_PLAYLISTS: readonly Collection[] = [
  {
    id: "speech-acts", name: "Speech acts: doing things with words", by: ED, for: [],
    about: "Saying something is also doing something: asserting, promising, asking, agreeing. Austin's own voice in 1959, then Searle, who sorted the acts into kinds and split what is said (the content) from what the saying counts as (the force).",
    items: [
      talk("JXo0YNZ3WsE", "J. L. Austin Lecture in Sweden (1959), part one", "J. L. Austin", "Austin himself, a year before his death, recorded in Sweden in October 1959."),
      talk("XnWB4-aZAqc", "J. L. Austin Lecture in Sweden (1959), part two", "J. L. Austin", "The rest of the lecture, with the discussion after it."),
      talk("FItTy4yizlw", "The Philosophy of Language: John Searle and Bryan Magee (1977)", "John Searle", "Men of Ideas, BBC, 1977: Searle explains speech acts to a general audience."),
      talk("Uk5pIzCNOzU", "Searle: Philosophy of Language, lecture 1", "John Searle", "The first lecture of his Berkeley course, which goes on through speech acts lecture by lecture."),
      talk("v_hQpvQYhOI", "Wittgenstein's Philosophy: John Searle and Bryan Magee (1987)", "John Searle", "The later Wittgenstein's meaning as use, which Austin's ordinary language philosophy sat beside."),
    ],
  },
  {
    id: "argument-technology", name: "Arguments in dialogue: argument technology", by: ED, for: [],
    about: "How the Centre for Argument Technology at Dundee reads arguments out of real dialogue: what each turn does, and how it supports or attacks another. Their Inference Anchoring Theory gives the practice its list of acts; their annotation of the BBC's Moral Maze is the model for reading Plato's dialogues the same way.",
    items: [
      talk("qmHOeqHhwvg", "Introduction to argumentation theory across disciplines", "Katarzyna Budzynska", "The field from the start: what an argument is to a logician, a linguist and a computer scientist."),
      talk("G46KeuMcptA", "Time for a Good Argument (ICAART 2015)", "Chris Reed", "Keynote on teaching machines to find and weigh arguments."),
      talk("Owpd6_Rxx0M", "ARG-tech, the BBC, Moral Maze and Abortion on Trial", "Chris Reed", "Annotating the arguments of broadcast debates, turn by turn."),
      talk("2T8NvQOw1t8", "The BBC project: recruiting, training and analysis", "Katarzyna Budzynska", "How annotators are trained and their readings checked, the work this practice does too."),
      talk("3OOqWR3CZQs", "Is ad hominem a support? Normative and descriptive models of language use", "Katarzyna Budzynska", "When an attack on the speaker counts as an argument, and how to annotate it."),
    ],
  },
  {
    id: "many-readers", name: "Many readers: when readings agree", by: ED, for: [],
    about: "The practice settles a reading when careful readers agree, and keeps both when they honestly split. Krippendorff measured agreement between readers of a text (his alpha); Dawid, with Skene, worked out how to weigh readers by how often they are right.",
    items: [
      { kind: "episode", feed: "https://feeds.transistor.fm/architects-of-communication-scholarship", key: "1p169egpredc3", show: "Architects of Communication Scholarship", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/b4/10/45/b41045d2-65bd-9583-c83e-f0c0c33154d4/mza_17536224544283203214.jpg/600x600bb.jpg", title: "Klaus Krippendorff on Cybernetics and Content Analysis", by: "Architects of Communication Scholarship", why: "Content analysis, the field his alpha was made for, in his own words (2022)." },
      talk("jYnSbNobc3Y", "Four theories of using language", "Klaus Krippendorff", "What readers take language to do, from a scholar of reading texts."),
      talk("0uFmoytcjHU", "Interview with Philip Dawid", "Philip Dawid", "His work, the 1979 paper with Skene among it, looked back on."),
      talk("MmVB_hMY7ZY", "An Introduction to Bayesian Networks", "Philip Dawid", "The reasoning under weighing readers: evidence that updates a belief."),
    ],
  },
];

/** The people the course reads, by their ids in `scholars.ts`. */
export const ARGUMENT_COURSE = {
  id: "argument",
  name: "Argument: what speakers do with words",
  by: ED,
  about: "The modern work behind the dialectic practice. What a speaker does in saying something, how one statement bears on another, how many readers settle a reading, and the old question of what is at issue. Each unit is a playlist to watch and listen to, then practice on one of Plato's dialogues.",
  units: [
    { playlist: "speech-acts", practice: { work: "euthyphro", note: "Say what each marked sentence does: asserting, asking, agreeing, challenging." } },
    { playlist: "argument-technology", practice: { work: "laches", note: "Say how the words bear on another statement, and which one." } },
    { playlist: "many-readers", practice: null },
    { playlist: "stasis", practice: { work: "meno", note: "Find what is in question at each issue." } },
  ],
  people: ["j-l-austin", "john-searle", "chris-reed", "katarzyna-budzynska", "henry-prakken", "douglas-walton", "klaus-krippendorff", "philip-dawid", "a-m-skene", "quintilian", "w-k-wimsatt", "monroe-beardsley"],
} as const;

/** The courses that read a scholar, for their page. */
export const coursesCiting = (id: string): { title: string; href: string }[] =>
  (ARGUMENT_COURSE.people as readonly string[]).includes(id) ? [{ title: ARGUMENT_COURSE.name, href: `/schole/courses/${ARGUMENT_COURSE.id}` }] : [];
