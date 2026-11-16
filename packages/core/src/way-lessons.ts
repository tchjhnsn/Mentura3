/**
 * A short lesson on each way of learning, shown at the top of the way's page so a person can learn what the way is
 * before using it (Torian, 2026-11-16 19:20Z: "people can learn about dialectics before actually watching
 * dialectics. They may come to realize that they've engaged in dialectics without even knowing it"). Aristotle's own
 * account, given by places (no quotations), then where a person has already done it. Pure: no I/O.
 */
import type { CollectionItem } from "./collections";
import { yt } from "./collections";

export type WayLesson = {
  way: "teaching" | "dialectic" | "imitation" | "practice" | "leisure";
  title: string;
  /** What the way is, in two or three short paragraphs. */
  what: readonly string[];
  /** Where a person has already done it without naming it. */
  already: readonly string[];
  /** The places in Aristotle the lesson rests on. */
  places: readonly string[];
  /** A recording that teaches the way itself, when there is one. */
  primer?: CollectionItem;
};

export const WAY_LESSONS: readonly WayLesson[] = [
  {
    way: "teaching",
    title: "What teaching is",
    what: [
      "For Aristotle, teaching is someone who knows why a thing is so showing you the causes, step by step, from what you already know.",
      "All learning by thought starts from knowledge you already have, so a good teacher begins where you are. And the sign that someone truly knows a thing is that they can teach it.",
    ],
    already: [
      "A friend showed you why a recipe works, not just what to do.",
      "You explained something to someone else and understood it better yourself.",
    ],
    places: ["Posterior Analytics I.1, 71a1–11", "Metaphysics I.1, 981b7–10"],
  },
  {
    way: "dialectic",
    title: "What dialectic is",
    what: [
      "Dialectic is reasoning that starts from opinions people hold: what everyone, most people, or the wise think. Two people test those opinions by question and answer to see which hold up.",
      "Aristotle gives it three uses: it trains the mind, it lets you talk with anyone on their own terms, and it is the way to examine first principles that no science can prove from within. Socrates practised it in Athens, asking people what courage or piety is and finding the exceptions to their answers.",
    ],
    already: [
      "You argued with a friend about whether a rule was fair, and one of you changed your mind.",
      "Someone asked you \"what do you mean by that?\" and your answer got sharper.",
      "You found an exception that broke a claim everyone took for granted.",
    ],
    places: ["Topics I.1, 100a18–b23", "Topics I.2, 101a25–b4", "Plato, Euthyphro"],
    primer: yt("discussion", "YNFF1s_8pMw", "Socrates and Plato", "Myles Burnyeat and Bryan Magee, 1987", "What Socrates asked, and how he asked it."),
  },
  {
    way: "imitation",
    title: "What learning by imitation is",
    what: [
      "Aristotle says imitation is natural to people from childhood, that we learn our first lessons by it, and that we enjoy likenesses: a play, a picture or a story lets us recognise \"this is that\" and so learn.",
      "Poetry shows what such a person would likely do, so a story can teach something general about people, not just what happened once.",
    ],
    already: [
      "A film made you see someone you know in a new way.",
      "You learned how to behave somewhere by watching others first.",
    ],
    places: ["Poetics 4, 1448b4–19", "Poetics 9, 1451a36–b11"],
  },
  {
    way: "practice",
    title: "What learning by practice is",
    what: [
      "Some things are learned only by doing them. We become builders by building and players of an instrument by playing it; in the same way we become just by doing just acts and brave by doing brave ones.",
      "Repeated acts become a settled state, a habit, so what you do over and over is what you become.",
    ],
    already: [
      "You got better at a sport or a skill by doing it every day, not by reading about it.",
      "A habit you kept for months changed what feels easy to you.",
    ],
    places: ["Nicomachean Ethics II.1, 1103a31–b25"],
  },
  {
    way: "leisure",
    title: "What play and leisure are for",
    what: [
      "Aristotle says we play so that we can be serious: amusement is rest, and rest is for the sake of activity.",
      "Leisure (scholē, the name of this part of Reflect) is something higher than play: time free for what is worth doing for its own sake. Music, he says, belongs to it.",
    ],
    already: [
      "A game or a song left you rested and ready for real work.",
      "You spent a free afternoon on something only because it was worth doing.",
    ],
    places: ["Nicomachean Ethics X.6, 1176b27–1177a1", "Politics VIII.3, 1337b28–1338a13"],
  },
];

export const wayLesson = (way: string): WayLesson | undefined => WAY_LESSONS.find((l) => l.way === way);
