/**
 * Playlists on the ways of questioning the Dialectic page borrows from (Torian, 2026-11-16 20:33Z: "Anything that we
 * are borrowing from, we should turn that into some sort of playlist or course"): stasis and the general and particular
 * question, the Socratic method, Aristotle's dialectic and the tree of kinds, and the medieval disputed question.
 * Every recording was checked to exist (LibriVox catalogue, In Our Time feed, YouTube oEmbed). Object literals only:
 * `collections.ts` imports this. Pure: no I/O.
 */
import type { Collection, CollectionItem } from "./collections";

const ED = "Reflect's editors";
const IOT = { feed: "https://podcasts.files.bbci.co.uk/b006qykl.rss", show: "In Our Time", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/f3/12/e7/f312e703-b626-0091-5bdf-73d79cce25c5/mza_16900938594910783199.jpg/600x600bb.jpg" };
const book = (id: string, title: string, by: string, why: string): CollectionItem => ({ kind: "audiobook", id, title, by, why });
const iot = (key: string, title: string, why: string): CollectionItem => ({ kind: "episode", ...IOT, key, title, by: "Melvyn Bragg and guests", why });
const talk = (id: string, title: string, by: string, why: string): CollectionItem => ({ kind: "find", medium: "lecture", title, by, url: `https://www.youtube.com/watch?v=${id}`, image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, why });

export const DIALECTIC_PLAYLISTS: readonly Collection[] = [
  {
    id: "stasis", name: "Stasis: finding the question at issue", by: ED, for: [],
    about: "How the Greek and Roman teachers of rhetoric found what a dispute is really about: whether a thing happened, what it is, what kind it is, and whether this is the place to judge it. And their line between the general question (a thesis) and the particular case (a hypothesis).",
    items: [
      talk("hDVswvmFczk", "Stasis Theory Explained: Find the Real Point of Disagreement", "Reclaiming Rhetoric", "What stasis theory is and the questions it asks, in order."),
      talk("pFJiq3BqI9Y", "Using Stasis Theory", "University of Texas at Austin Writing Center", "Putting the questions to work on an argument of your own."),
      iot("1uswkh81qkvd9z", "Cicero", "The orator and statesman. His early On Invention names the four kinds of issue: fact, definition, quality and procedure."),
      book("4206", "Institutio Oratoria, Volume 1", "Quintilian", "Book 3 sets the general question beside the particular case (chapter 5) and the status of a case (chapter 6), with the earlier teachers he drew on, Hermagoras among them."),
      talk("-zB6w2SrNH8", "The Progymnasmata: History and Methodology", "Classical Academic Press", "The school exercises of Greece and Rome, which ended with arguing a thesis, a general question."),
      iot("77dshot0t93b", "Rhetoric", "Rhetoric from Gorgias, and Plato's quarrel with it, on."),
      book("4114", "Rhetoric", "Aristotle", "The book later teachers built on. Stasis theory came after it, with Hermagoras in the 2nd century BC."),
    ],
  },
  {
    id: "socratic-method", name: "The Socratic method: from the case to the form", by: ED, for: [],
    about: "Socrates took a question of the day, a lawsuit, a battle, a lesson, and asked what the thing itself is: piety, courage, virtue, knowledge. These dialogues show him moving from the case in front of him to the form behind it.",
    items: [
      talk("4qY0-51hrBc", "What is the Elenchus? (The Socratic Method)", "Carneades.org", "The pattern of a Socratic refutation, step by step."),
      book("275", "Euthyphro", "Plato", "A son is prosecuting his father; Socrates asks what piety is."),
      book("8630", "Laches", "Plato", "Two generals argue over training in arms; Socrates asks what courage is."),
      book("5566", "Meno", "Plato", "Asked whether virtue can be taught, Socrates turns first to what virtue is."),
      iot("1h3h9kpcqjqsw", "Socrates", "Who Socrates was, and why philosophy before him is called pre-Socratic."),
      book("8187", "Theaetetus", "Plato", "What is knowledge? Three answers tried and refuted."),
    ],
  },
  {
    id: "aristotle-dialectic", name: "Aristotle's dialectic and the tree of kinds", by: ED, for: [],
    about: "Aristotle wrote the first handbook of dialectic, on how to argue any question put to you, for and against. With it came the order of kinds, each under a broader one, that later writers drew as Porphyry's tree: the pattern behind questions that are broader and narrower.",
    items: [
      talk("F1pkRWStNM0", "Aristotle on Dialectic", "ProfSheley", "What dialectic was for Aristotle, and how it differs from demonstration."),
      book("4863", "Topics", "Aristotle", "The handbook itself: where arguments are found, and what a problem and a thesis are (Book 1, chapter 11)."),
      book("5109", "Sophistical Refutations", "Aristotle", "The false refutations, and how to answer them."),
      book("4237", "Categories", "Aristotle", "The kinds of thing that can be said, and genus and species."),
      talk("lkHs6y4S__Y", "Aristotle's Logic: Categories and Porphyry's Tree", "Tim Jacobs", "Each kind under a broader one, drawn as a tree."),
      talk("ycjjDaX1rFQ", "Universals and Particulars, Genus and Species (Aquinas 101)", "The Thomistic Institute", "How the medieval schools read genus and species."),
      iot("100o9nlvjg6r4", "Logic", "The history of logic, from Aristotle's syllogism on."),
    ],
  },
  {
    id: "disputed-questions", name: "Disputed questions: how the medieval schools argued", by: ED, for: [],
    about: "In the medieval universities a question was argued in a set order: the objections, an authority on the other side, the master's answer, and a reply to each objection. Aquinas wrote the Summa that way. This is how it worked and where it came from.",
    items: [
      talk("RvXUikzwGf8", "What is a scholastic disputation? Disputatio in the medieval universities", "good to think with", "What a disputation was and who took part."),
      iot("1argen01ya33d3", "The Medieval University", "The first universities, where disputation was taught and examined."),
      iot("1ohmy5t1czeg5w", "Abelard and Heloise", "Abelard, the Paris teacher whose Sic et Non set authorities against each other question by question."),
      talk("FSXIUbiweLo", "How Do You Read an Article of the Summa Theologiae? (Aquinas 101)", "The Thomistic Institute", "The parts of an article, in order."),
      book("2443", "Summa Theologica, Part I: Initial Questions", "Thomas Aquinas", "The articles themselves: whether sacred doctrine is a science, and whether God exists."),
      talk("RY9vokziX3I", "Argument and Dialectic (Aquinas 101)", "The Thomistic Institute", "Why Aquinas argued from what the other side grants."),
      talk("HHHlgLl8pCA", "The Medieval Culture of Disputation", "The Chasing Leviathan Podcast, with Alex Novikoff", "A historian of disputation on how it was taught and performed."),
      iot("1kf8hj6xut2jp", "St Thomas Aquinas", "His life and thought."),
    ],
  },
];
