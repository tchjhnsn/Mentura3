/**
 * Dialectic to watch and listen to (Torian, 2026-11-16 18:18Z: "We can not do interactive dialectics. Instead, we can
 * allow you to watch dialectics... videos and audios of dialectic conversations"; 18:26Z: build, in order, browse by
 * question, more shelves, motion and result, your verdict). Recordings of people arguing a question out: debates,
 * conversations with philosophers, discussions, dialogues read aloud and plays that argue. Each YouTube video was found
 * and checked by its id on 2026-11-16, each LibriVox id against the catalogue; every item plays in Scholē.
 */
import { ab, iot, yt, type CollectionItem } from "./collections";

export type DialecticShelf = { id: string; title: string; note: string; items: readonly CollectionItem[] };

/* ---------- debates ---------- */
const RUSSELL_COPLESTON = yt("debate", "wMsbD1L5IlQ", "Russell and Copleston on the existence of God", "BBC Third Programme, 1948", "A philosopher and a Jesuit priest argue it out on BBC radio.");
const BALDWIN_BUCKLEY = yt("debate", "oFeoS41xe7w", "Baldwin and Buckley at the Cambridge Union", "Cambridge Union, 1965", "On the motion \"The American Dream is at the expense of the American Negro.\"");
const CHOMSKY_FOUCAULT = yt("debate", "3wfNl2L0Gf8", "Chomsky and Foucault on human nature", "Dutch television, 1971", "Is there a human nature, and what would justice be without one?");
const CRAIG_HITCHENS = yt("debate", "0tYm41hb48o", "Does God exist?", "William Lane Craig and Christopher Hitchens, Biola University, 2009", "A philosopher of religion and a polemicist, in timed speeches and rebuttals.");
const IQ2_CHURCH = yt("debate", "JZRcYaAYWg4", "The Catholic Church is a force for good in the world", "Intelligence Squared, 2009", "Two for, two against, and the audience votes before and after.");
const IQ2_RELIGION = yt("debate", "DIR7_X-ahy4", "Would we be better off without religion?", "Intelligence Squared, 2007", "Christopher Hitchens and others on the motion.");
const DEATH_FINAL = yt("debate", "h0YtL5eiBYw", "Is death final?", "Open to Debate", "Whether consciousness survives the death of the body.");
const PETERSON_ZIZEK = yt("debate", "lsWndfzuOc4", "Happiness: capitalism vs. Marxism", "Jordan Peterson and Slavoj Žižek, 2019", "A psychologist and a philosopher on which order makes people happier.");
const MONARCHY = yt("debate", "PTQeMoaupDs", "This house believes the monarchy died with the Queen", "Oxford Union", "A full Union debate, from the opening speeches to the division.");
const FIRING_LINE = yt("debate", "Sb4oQDqpkQ8", "Firing Line: Extremism", "William F. Buckley Jr., Hoover Institution archive", "Buckley's long-running program, where a guest was questioned for an hour.");
const LINCOLN_DOUGLAS = yt("debate", "Zf7RYnCGsA8", "Right Makes Might: the Lincoln–Douglas debates of 1858", "Exploration Films", "The seven Illinois debates on whether slavery should spread.");

/* ---------- conversations with philosophers ---------- */
const MAGEE_PLATO = yt("discussion", "YNFF1s_8pMw", "Socrates and Plato", "Myles Burnyeat and Bryan Magee, 1987", "What Socrates asked, and what Plato made of it.");
const MAGEE_ARISTOTLE = yt("discussion", "pJC9o3bpujI", "Aristotle", "Martha Nussbaum and Bryan Magee, 1987", "His ethics, his science, and why he still matters.");
const MAGEE_MEDIEVAL = yt("discussion", "dpublMuRUAk", "Medieval philosophy", "Anthony Kenny and Bryan Magee, 1987", "Augustine, Aquinas and the schoolmen.");
const MAGEE_HUME = yt("discussion", "PV3U1w4wGPs", "David Hume", "John Passmore and Bryan Magee, 1987", "Reason, the passions and what we can know.");
const MAGEE_KANT = yt("discussion", "wlEMkAkGS1I", "Immanuel Kant", "Geoffrey Warnock and Bryan Magee, 1987", "What the mind brings to experience.");
const MAGEE_POLITICS = yt("discussion", "gySLm3Z1OvA", "Philosophy and politics", "Ronald Dworkin and Bryan Magee, 1977", "What political philosophy is for.");
const MAGEE_FRANKFURT = yt("discussion", "U23Ho0m_Sv0", "The Frankfurt School", "Herbert Marcuse and Bryan Magee, 1977", "Marx, Freud and the critique of society.");

/* ---------- discussions (In Our Time) ---------- */
const IOT_SOCRATES = iot("1h3h9kpcqjqsw", "Socrates", "The man who wrote nothing and questioned everyone.");
const IOT_PRISON = iot("14qr1rch1j87v", "Socrates in Prison", "The Crito and the Phaedo: why he would not escape.");
const IOT_SYMPOSIUM = iot("1jr6q6dn2whpg", "Plato's Symposium", "A dinner party of speeches on love.");
const IOT_ETHICS = iot("1ft00r2ap8dq9", "Aristotle's Nicomachean Ethics", "What the good life is, and how habit makes us.");
const IOT_POLITICS = iot("13l26u21glddl9", "Aristotle's Politics", "The city, the citizen and the best regime.");
const IOT_AQUINAS = iot("1kf8hj6xut2jp", "St Thomas Aquinas", "Faith and reason in one system.");
const IOT_MACHIAVELLI = iot("bozpdmkmjkt1", "Machiavelli and the Italian City States", "The Prince, and the world it was written for.");
const IOT_CICERO = iot("1uswkh81qkvd9z", "Cicero", "Orator, consul and philosopher of duty.");
const IOT_CONTRACT = iot("1dxsvffa7g5tm", "The Social Contract", "Hobbes, Locke and Rousseau on why we obey.");
const IOT_EMILE = iot("17v5pm8i1pmvv", "Rousseau on Education", "Emile, and a childhood left to nature.");
const IOT_HUME = iot("1py8m78145uyif", "David Hume", "The sceptic who said reason serves the passions.");
const IOT_FEDERALIST = iot("129acml1xnj748", "The Federalist Papers", "The case for the Constitution, and who wrote which.");

/* ---------- dialogues read aloud (LibriVox) ---------- */
const EUTHYPHRO = ab("275", "Euthyphro", "Plato", "On his way to court, Socrates asks a priest what piety is.");
const APOLOGY = ab("1268", "Apology", "Plato", "Socrates' defence of the examined life to the jury that condemns him.");
const MENO = ab("5566", "Meno", "Plato", "Can virtue be taught?");
const PROTAGORAS = ab("7416", "Protagoras", "Plato", "Socrates and the great sophist on whether virtue is one thing and can be taught.");
const GORGIAS = ab("6991", "Gorgias", "Plato", "Is it better to suffer wrong than to do it?");
const PHAEDRUS = ab("2429", "Phaedrus", "Plato", "A walk outside the walls: on love, the soul and the art of speaking.");
const SYMPOSIUM = ab("3485", "Symposium", "Plato", "Each guest praises love, until Alcibiades arrives.");
const PHAEDO = ab("4421", "Phaedo", "Plato", "His last day, arguing that the soul outlives the body.");
const REPUBLIC = ab("2707", "Republic", "Plato", "What justice is, asked by building a city in words.");
const CICERO_FRIENDSHIP = ab("13377", "Treatises on Friendship and Old Age", "Cicero", "Two Roman dialogues: Laelius on friendship, Cato on growing old.");
const CONSOLATION = ab("85", "The Consolation of Philosophy", "Boethius", "In prison, a man argues with Philosophy herself about fortune and the good.");
const BERKELEY = ab("3455", "Three Dialogues between Hylas and Philonous", "George Berkeley", "Does matter exist apart from being perceived?");
const HUME_DIALOGUES = ab("1093", "Dialogues Concerning Natural Religion", "David Hume", "Three friends test the argument from design.");

/* ---------- plays that argue (LibriVox) ---------- */
const CLOUDS = ab("9998", "Clouds", "Aristophanes", "Socrates mocked: the Better and the Worse Argument fight it out on stage.");
const ANTIGONE = ab("4632", "Antigone", "Sophocles", "The law of the city against the law of the gods.");
const JULIUS_CAESAR = ab("3620", "Julius Caesar", "William Shakespeare", "Brutus and Antony make their cases to the crowd in the Forum.");
const ENEMY = ab("7252", "An Enemy of the People", "Henrik Ibsen", "One doctor against a town that would rather not know.");
const MAJOR_BARBARA = ab("6348", "Major Barbara", "George Bernard Shaw", "The Salvation Army against the arms maker: which saves souls?");
const DON_JUAN = ab("6476", "Don Juan in Hell", "George Bernard Shaw", "The dream scene from Man and Superman: a debate in Hell about heaven, love and the Life Force.");

export const DIALECTIC_SHELVES: readonly DialecticShelf[] = [
  {
    id: "debates", title: "Famous debates", note: "Two sides, one question, argued in front of an audience.",
    items: [RUSSELL_COPLESTON, BALDWIN_BUCKLEY, CHOMSKY_FOUCAULT, CRAIG_HITCHENS, IQ2_CHURCH, IQ2_RELIGION, DEATH_FINAL, PETERSON_ZIZEK, MONARCHY, FIRING_LINE, LINCOLN_DOUGLAS],
  },
  {
    id: "philosophers", title: "Conversations with philosophers", note: "Bryan Magee questions a philosopher on one thinker, for the BBC.",
    items: [MAGEE_PLATO, MAGEE_ARISTOTLE, MAGEE_MEDIEVAL, MAGEE_HUME, MAGEE_KANT, MAGEE_POLITICS, MAGEE_FRANKFURT],
  },
  {
    id: "discussions", title: "Discussions", note: "Melvyn Bragg and three scholars on one subject, for BBC Radio 4's In Our Time.",
    items: [IOT_SOCRATES, IOT_PRISON, IOT_SYMPOSIUM, IOT_ETHICS, IOT_POLITICS, IOT_AQUINAS, IOT_MACHIAVELLI, IOT_CONTRACT, IOT_HUME, IOT_FEDERALIST],
  },
  {
    id: "dialogues", title: "Dialogues, read aloud", note: "Arguments written as conversations, from Plato to Hume, recorded by LibriVox volunteers.",
    items: [EUTHYPHRO, APOLOGY, MENO, PROTAGORAS, GORGIAS, PHAEDRUS, SYMPOSIUM, PHAEDO, REPUBLIC, CICERO_FRIENDSHIP, CONSOLATION, BERKELEY, HUME_DIALOGUES],
  },
  {
    id: "plays", title: "Plays that argue", note: "Drama built on a dispute, read by LibriVox casts.",
    items: [CLOUDS, ANTIGONE, JULIUS_CAESAR, ENEMY, MAJOR_BARBARA, DON_JUAN],
  },
];

/**
 * The recordings that argue each curated question (`@reflect/core/dialectics`), debates first, then conversations,
 * discussions, dialogues and plays.
 */
export const QUESTION_MEDIA: Readonly<Record<string, readonly CollectionItem[]>> = {
  "virtue-taught": [MAGEE_PLATO, MAGEE_ARISTOTLE, IOT_ETHICS, IOT_EMILE, MENO, PROTAGORAS],
  "suffer-injustice": [MAGEE_PLATO, IOT_SOCRATES, IOT_PRISON, GORGIAS, REPUBLIC, APOLOGY],
  "feared-or-loved": [IOT_MACHIAVELLI, IOT_CICERO, IOT_POLITICS, JULIUS_CAESAR],
  "education-for": [MAGEE_PLATO, IOT_EMILE, IOT_POLITICS, REPUBLIC, CLOUDS],
  "who-should-rule": [MONARCHY, LINCOLN_DOUGLAS, MAGEE_POLITICS, IOT_POLITICS, IOT_CONTRACT, IOT_FEDERALIST, REPUBLIC, ENEMY],
  "reason-or-feeling": [MAGEE_HUME, MAGEE_KANT, MAGEE_MEDIEVAL, IOT_HUME, IOT_AQUINAS, IOT_ETHICS],
  "god-exists": [RUSSELL_COPLESTON, CRAIG_HITCHENS, IQ2_RELIGION, IQ2_CHURCH, MAGEE_MEDIEVAL, IOT_AQUINAS, HUME_DIALOGUES, DON_JUAN],
  "human-nature": [CHOMSKY_FOUCAULT, MAGEE_FRANKFURT, IOT_CONTRACT, IOT_EMILE],
};
