/**
 * Dialectic to watch and listen to (Torian, 2026-11-16 18:18Z: "We can not do interactive dialectics. Instead, we can
 * allow you to watch dialectics... videos and audios of dialectic conversations"). Recordings of people arguing a
 * question out: debates, conversations with philosophers, discussions, and Plato's dialogues read aloud. Each YouTube
 * video was found and checked by its id on 2026-11-16; every item plays in Scholē.
 */
import { ab, iot, yt, type CollectionItem } from "./collections";

export type DialecticShelf = { id: string; title: string; note: string; items: readonly CollectionItem[] };

export const DIALECTIC_SHELVES: readonly DialecticShelf[] = [
  {
    id: "debates", title: "Famous debates", note: "Two sides, one question, argued in front of an audience.",
    items: [
      yt("debate", "wMsbD1L5IlQ", "Russell and Copleston on the existence of God", "BBC Third Programme, 1948", "A philosopher and a Jesuit priest argue it out on BBC radio."),
      yt("debate", "oFeoS41xe7w", "Baldwin and Buckley at the Cambridge Union", "Cambridge Union, 1965", "\"The American Dream is at the expense of the American Negro\": the motion carried 544 to 164."),
      yt("debate", "3wfNl2L0Gf8", "Chomsky and Foucault on human nature", "Dutch television, 1971", "Is there a human nature, and what would justice be without one?"),
      yt("debate", "JZRcYaAYWg4", "The Catholic Church is a force for good in the world", "Intelligence Squared, 2009", "Two for, two against, and the audience votes before and after."),
      yt("debate", "DIR7_X-ahy4", "Would we be better off without religion?", "Intelligence Squared, 2007", "Christopher Hitchens and others on the motion."),
      yt("debate", "lsWndfzuOc4", "Happiness: capitalism vs. Marxism", "Jordan Peterson and Slavoj Žižek, 2019", "A psychologist and a philosopher on which order makes people happier."),
      yt("debate", "Sb4oQDqpkQ8", "Firing Line: Extremism", "William F. Buckley Jr., Hoover Institution archive", "Buckley's long-running program, where a guest was questioned for an hour."),
    ],
  },
  {
    id: "philosophers", title: "Conversations with philosophers", note: "Bryan Magee questions a philosopher on one thinker, for the BBC.",
    items: [
      yt("discussion", "YNFF1s_8pMw", "Socrates and Plato", "Myles Burnyeat and Bryan Magee, 1987", "What Socrates asked, and what Plato made of it."),
      yt("discussion", "pJC9o3bpujI", "Aristotle", "Martha Nussbaum and Bryan Magee, 1987", "His ethics, his science, and why he still matters."),
      yt("discussion", "dpublMuRUAk", "Medieval philosophy", "Anthony Kenny and Bryan Magee, 1987", "Augustine, Aquinas and the schoolmen."),
      yt("discussion", "PV3U1w4wGPs", "David Hume", "John Passmore and Bryan Magee, 1987", "Reason, the passions and what we can know."),
      yt("discussion", "wlEMkAkGS1I", "Immanuel Kant", "Geoffrey Warnock and Bryan Magee, 1987", "What the mind brings to experience."),
      yt("discussion", "gySLm3Z1OvA", "Philosophy and politics", "Ronald Dworkin and Bryan Magee, 1977", "What political philosophy is for."),
      yt("discussion", "U23Ho0m_Sv0", "The Frankfurt School", "Herbert Marcuse and Bryan Magee, 1977", "Marx, Freud and the critique of society."),
    ],
  },
  {
    id: "discussions", title: "Discussions", note: "Melvyn Bragg and three scholars on one subject, for BBC Radio 4's In Our Time.",
    items: [
      iot("1h3h9kpcqjqsw", "Socrates", "The man who wrote nothing and questioned everyone."),
      iot("14qr1rch1j87v", "Socrates in Prison", "The Crito and the Phaedo: why he would not escape."),
      iot("1jr6q6dn2whpg", "Plato's Symposium", "A dinner party of speeches on love."),
      iot("1ft00r2ap8dq9", "Aristotle's Nicomachean Ethics", "What the good life is, and how habit makes us."),
      iot("13l26u21glddl9", "Aristotle's Politics", "The city, the citizen and the best regime."),
      iot("1kf8hj6xut2jp", "St Thomas Aquinas", "Faith and reason in one system."),
      iot("bozpdmkmjkt1", "Machiavelli and the Italian City States", "The Prince, and the world it was written for."),
      iot("1dxsvffa7g5tm", "The Social Contract", "Hobbes, Locke and Rousseau on why we obey."),
      iot("129acml1xnj748", "The Federalist Papers", "The case for the Constitution, and who wrote which."),
    ],
  },
  {
    id: "dialogues", title: "Plato's dialogues, read aloud", note: "The first written dialectic: Socrates questioning, recorded by LibriVox volunteers.",
    items: [
      ab("275", "Euthyphro", "Plato", "On his way to court, Socrates asks a priest what piety is."),
      ab("1268", "Apology", "Plato", "Socrates' defence of the examined life to the jury that condemns him."),
      ab("5566", "Meno", "Plato", "Can virtue be taught?"),
      ab("6991", "Gorgias", "Plato", "Is it better to suffer wrong than to do it?"),
      ab("3485", "Symposium", "Plato", "Each guest praises love, until Alcibiades arrives."),
      ab("4421", "Phaedo", "Plato", "His last day, arguing that the soul outlives the body."),
      ab("2707", "Republic", "Plato", "What justice is, asked by building a city in words."),
    ],
  },
];
