/**
 * Dialectic to watch and listen to (Torian, 2026-11-16 18:18Z: "We can not do interactive dialectics. Instead, we can
 * allow you to watch dialectics... videos and audios of dialectic conversations"; 18:26Z: build, in order, browse by
 * question, more shelves, motion and result, your verdict). Recordings of people arguing a question out: debates,
 * conversations with philosophers, discussions, dialogues read aloud and plays that argue. Each YouTube video was found
 * and checked by its id on 2026-11-16, each LibriVox id against the catalogue; every item plays in Scholē.
 */
import { ab, iot, itemKey, yt, type CollectionItem } from "./collections";

export type DialecticShelf = { id: string; title: string; note: string; items: readonly CollectionItem[] };

/*
 * Old and new (Torian, 2026-11-16 19:56Z and card 20:00Z: one old for every new, C.S. Lewis's rule from "On the Reading
 * of Old Books", 1944). An item's era is the era of the argument, when its speakers made it, not of the recording: a
 * 2019 reading of the Gorgias is Ancient, a 1987 interview about Plato is 20th century. Among the old, the Greeks and
 * Romans, the medieval schoolmen, the Renaissance and the Founders come up twice as often as other old things, and the
 * 20th century half as often (it is neither the ancients nor what is argued now).
 */
export type Era = "ancient" | "medieval" | "renaissance" | "founding" | "early-modern" | "twentieth" | "contemporary";
export const ERA_LABEL: Readonly<Record<Era, string>> = {
  ancient: "Ancient", medieval: "Medieval", renaissance: "Renaissance", founding: "Founding era",
  "early-modern": "Early modern", twentieth: "20th century", contemporary: "New",
};
export const ERA_WEIGHT: Readonly<Record<Era, number>> = { ancient: 2, medieval: 2, renaissance: 2, founding: 2, "early-modern": 1, twentieth: 0.5, contemporary: 1 };
const ERAS = new Map<string, { era: Era; year?: string }>();
const at = (i: CollectionItem, era: Era, year?: string): CollectionItem => { ERAS.set(itemKey(i), { era, ...(year ? { year } : {}) }); return i; };

/** An item's era and year, when it is one of Dialectic's; a recording found on a channel's feed is new. */
export const eraOf = (i: CollectionItem): { era: Era; year?: string } | null => ERAS.get(itemKey(i)) ?? null;
/** "New · 2025", "Ancient", "20th century · 1965". */
export const eraLine = (i: CollectionItem): string | null => { const e = eraOf(i); return e ? [ERA_LABEL[e.era], e.year].filter(Boolean).join(" · ") : null; };

/** What a thing is to watch or hear, for the chip on its picture. */
export const formatOf = (i: CollectionItem): "Video" | "Podcast" | "Audiobook" | "Course" =>
  i.kind === "audiobook" ? "Audiobook" : i.kind === "episode" ? "Podcast" : i.kind === "course" ? "Course" : i.kind === "find" && (i.medium === "podcast" || i.medium === "music") ? "Podcast" : "Video";

/** The week number since 2026-01-05 (a Monday), so picks change each Monday and are the same for everyone that week. */
export const weekOf = (d: Date): number => Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(2026, 0, 5)) / (7 * 864e5));

function unit(s: string): number {
  let h = 0x811c9dc5;
  for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 0x01000193) >>> 0;
  return (h + 0.5) / 4294967296;
}

/**
 * The items in Lewis's order for a week: new and old in turn, starting with `start`. Each side is shuffled by the week
 * (the same all week), and the old are drawn by era weight, so a preferred era comes up about twice as often. When one
 * side runs out, the rest of the other follows.
 */
export function mixOldNew(items: readonly CollectionItem[], week: number, start: "new" | "old" = "new"): CollectionItem[] {
  const order = (xs: CollectionItem[]) =>
    xs.map((i) => ({ i, score: -Math.log(unit(`${itemKey(i)}#${week}`)) / ERA_WEIGHT[eraOf(i)?.era ?? "early-modern"] })).sort((a, b) => a.score - b.score).map((x) => x.i);
  const fresh = order(items.filter((i) => (eraOf(i)?.era ?? "contemporary") === "contemporary"));
  const old = order(items.filter((i) => (eraOf(i)?.era ?? "contemporary") !== "contemporary"));
  const [a, b] = start === "new" ? [fresh, old] : [old, fresh];
  const out: CollectionItem[] = [];
  for (let k = 0; k < Math.max(a.length, b.length); k++) { if (a[k]) out.push(a[k]!); if (b[k]) out.push(b[k]!); }
  return out;
}

/* ---------- debates ---------- */
// Recent debates, each found on 2026-11-16 by searching YouTube and checked by its id against YouTube's oEmbed record
// (title and channel); only the channel's own upload or the debate's host. Years only where a source gives one.
const KIRK_CAMBRIDGE = at(yt("debate", "dkiM-z0Mzyg", "Charlie Kirk at the Cambridge Union", "Cambridge Union, 2025", "Kirk takes questions and challenges from Cambridge students in the Union's chamber."), "contemporary", "2025");
const KIRK_SURROUNDED = at(yt("debate", "WV29R1M25n8", "1 Conservative vs 25 Liberal College Students", "Charlie Kirk on Jubilee's Surrounded, 2024", "One man in the middle; students take turns at the chair to argue with him."), "contemporary", "2024");
const OCONNOR_SURROUNDED = at(yt("debate", "VpK8CoWBnq8", "1 Atheist vs 25 Christians", "Alex O'Connor on Jubilee's Surrounded", "An atheist philosopher answers Christians, one at a time."), "contemporary");
const PETERSON_SURROUNDED = at(yt("debate", "Pwk5MPE_6zE", "Jordan Peterson vs 20 Atheists", "Jubilee's Surrounded", "A psychologist who defends religion, questioned by atheists in turn."), "contemporary");
const CRAIG_CARROLL = at(yt("debate", "X0qKZqPy9T8", "God and Cosmology", "William Lane Craig and Sean Carroll, Greer Heard Forum, 2014", "A philosopher of religion and a physicist on whether the universe points to God."), "contemporary", "2014");
const OCONNOR_CRAIG = at(yt("debate", "TAW6-_L4z9M", "O'Connor and Craig: does God exist?", "Alex O'Connor and William Lane Craig, Premier Unbelievable?", "A younger atheist and the best-known Christian debater, on Premier's Big Conversation."), "contemporary");
const BATTLE_REALITY = at(yt("debate", "spiiYYgi9Wg", "Does God exist? Four voices", "William Lane Craig, Rowan Williams, Sabine Hossenfelder and Slavoj Žižek, Premier Unbelievable?", "A philosopher, an archbishop, a physicist and a Marxist on one stage."), "contemporary");
const NO_CONFIDENCE = at(yt("debate", "npiistbomDY", "This House has no confidence in His Majesty's Government", "Oxford Union, 2026", "A full Union debate, from the opening speeches to the division."), "contemporary", "2026");
const MEDIA_ENEMY = at(yt("debate", "6v0pKmmmt-U", "This House believes mainstream media is an enemy of the people", "Oxford Union", "A full Union debate on the press."), "contemporary");
const BIG_TECH = at(yt("debate", "A4ywJj52gSM", "Is Big Tech too powerful to regulate?", "Open to Debate", "Two sides, a moderator and an audience vote."), "contemporary");
const RUSSELL_COPLESTON = at(yt("debate", "wMsbD1L5IlQ", "Russell and Copleston on the existence of God", "BBC Third Programme, 1948", "A philosopher and a Jesuit priest argue it out on BBC radio."), "twentieth", "1948");
const BALDWIN_BUCKLEY = at(yt("debate", "oFeoS41xe7w", "Baldwin and Buckley at the Cambridge Union", "Cambridge Union, 1965", "On the motion \"The American Dream is at the expense of the American Negro.\""), "twentieth", "1965");
const CHOMSKY_FOUCAULT = at(yt("debate", "3wfNl2L0Gf8", "Chomsky and Foucault on human nature", "Dutch television, 1971", "Is there a human nature, and what would justice be without one?"), "twentieth", "1971");
const CRAIG_HITCHENS = at(yt("debate", "0tYm41hb48o", "Does God exist?", "William Lane Craig and Christopher Hitchens, Biola University, 2009", "A philosopher of religion and a polemicist, in timed speeches and rebuttals."), "contemporary", "2009");
const IQ2_CHURCH = at(yt("debate", "JZRcYaAYWg4", "The Catholic Church is a force for good in the world", "Intelligence Squared, 2009", "Two for, two against, and the audience votes before and after."), "contemporary", "2009");
const IQ2_RELIGION = at(yt("debate", "DIR7_X-ahy4", "Would we be better off without religion?", "Intelligence Squared, 2007", "Christopher Hitchens and others on the motion."), "contemporary", "2007");
const DEATH_FINAL = at(yt("debate", "h0YtL5eiBYw", "Is death final?", "Open to Debate", "Whether consciousness survives the death of the body."), "contemporary", "2014");
const PETERSON_ZIZEK = at(yt("debate", "lsWndfzuOc4", "Happiness: capitalism vs. Marxism", "Jordan Peterson and Slavoj Žižek, 2019", "A psychologist and a philosopher on which order makes people happier."), "contemporary", "2019");
const MONARCHY = at(yt("debate", "PTQeMoaupDs", "This house believes the monarchy died with the Queen", "Oxford Union", "A full Union debate, from the opening speeches to the division."), "contemporary");
const FIRING_LINE = at(yt("debate", "Sb4oQDqpkQ8", "Firing Line: Extremism", "William F. Buckley Jr., Hoover Institution archive", "Buckley's long-running program, where a guest was questioned for an hour."), "twentieth");
const LINCOLN_DOUGLAS = at(yt("debate", "Zf7RYnCGsA8", "Right Makes Might: the Lincoln–Douglas debates of 1858", "Exploration Films", "The seven Illinois debates on whether slavery should spread."), "early-modern", "1858");

/* ---------- conversations with philosophers ---------- */
const MAGEE_PLATO = at(yt("discussion", "YNFF1s_8pMw", "Socrates and Plato", "Myles Burnyeat and Bryan Magee, 1987", "What Socrates asked, and what Plato made of it."), "twentieth", "1987");
const MAGEE_ARISTOTLE = at(yt("discussion", "pJC9o3bpujI", "Aristotle", "Martha Nussbaum and Bryan Magee, 1987", "His ethics, his science, and why he still matters."), "twentieth", "1987");
const MAGEE_MEDIEVAL = at(yt("discussion", "dpublMuRUAk", "Medieval philosophy", "Anthony Kenny and Bryan Magee, 1987", "Augustine, Aquinas and the schoolmen."), "twentieth", "1987");
const MAGEE_HUME = at(yt("discussion", "PV3U1w4wGPs", "David Hume", "John Passmore and Bryan Magee, 1987", "Reason, the passions and what we can know."), "twentieth", "1987");
const MAGEE_KANT = at(yt("discussion", "wlEMkAkGS1I", "Immanuel Kant", "Geoffrey Warnock and Bryan Magee, 1987", "What the mind brings to experience."), "twentieth", "1987");
const MAGEE_POLITICS = at(yt("discussion", "gySLm3Z1OvA", "Philosophy and politics", "Ronald Dworkin and Bryan Magee, 1977", "What political philosophy is for."), "twentieth", "1977");
const MAGEE_FRANKFURT = at(yt("discussion", "U23Ho0m_Sv0", "The Frankfurt School", "Herbert Marcuse and Bryan Magee, 1977", "Marx, Freud and the critique of society."), "twentieth", "1977");

/* ---------- discussions (In Our Time, on air since 1998) ---------- */
const iotNew = (key: string, title: string, why: string) => at(iot(key, title, why), "contemporary");
const IOT_SOCRATES = iotNew("1h3h9kpcqjqsw", "Socrates", "The man who wrote nothing and questioned everyone.");
const IOT_PRISON = iotNew("14qr1rch1j87v", "Socrates in Prison", "The Crito and the Phaedo: why he would not escape.");
const IOT_SYMPOSIUM = iotNew("1jr6q6dn2whpg", "Plato's Symposium", "A dinner party of speeches on love.");
const IOT_ETHICS = iotNew("1ft00r2ap8dq9", "Aristotle's Nicomachean Ethics", "What the good life is, and how habit makes us.");
const IOT_POLITICS = iotNew("13l26u21glddl9", "Aristotle's Politics", "The city, the citizen and the best regime.");
const IOT_AQUINAS = iotNew("1kf8hj6xut2jp", "St Thomas Aquinas", "Faith and reason in one system.");
const IOT_MACHIAVELLI = iotNew("bozpdmkmjkt1", "Machiavelli and the Italian City States", "The Prince, and the world it was written for.");
const IOT_CICERO = iotNew("1uswkh81qkvd9z", "Cicero", "Orator, consul and philosopher of duty.");
const IOT_CONTRACT = iotNew("1dxsvffa7g5tm", "The Social Contract", "Hobbes, Locke and Rousseau on why we obey.");
const IOT_EMILE = iotNew("17v5pm8i1pmvv", "Rousseau on Education", "Emile, and a childhood left to nature.");
const IOT_HUME = iotNew("1py8m78145uyif", "David Hume", "The sceptic who said reason serves the passions.");
const IOT_FEDERALIST = iotNew("129acml1xnj748", "The Federalist Papers", "The case for the Constitution, and who wrote which.");

/* ---------- dialogues read aloud (LibriVox) ---------- */
const EUTHYPHRO = at(ab("275", "Euthyphro", "Plato", "On his way to court, Socrates asks a priest what piety is."), "ancient");
const APOLOGY = at(ab("1268", "Apology", "Plato", "Socrates' defence of the examined life to the jury that condemns him."), "ancient");
const MENO = at(ab("5566", "Meno", "Plato", "Can virtue be taught?"), "ancient");
const PROTAGORAS = at(ab("7416", "Protagoras", "Plato", "Socrates and the great sophist on whether virtue is one thing and can be taught."), "ancient");
const GORGIAS = at(ab("6991", "Gorgias", "Plato", "Is it better to suffer wrong than to do it?"), "ancient");
const PHAEDRUS = at(ab("2429", "Phaedrus", "Plato", "A walk outside the walls: on love, the soul and the art of speaking."), "ancient");
const SYMPOSIUM = at(ab("3485", "Symposium", "Plato", "Each guest praises love, until Alcibiades arrives."), "ancient");
const PHAEDO = at(ab("4421", "Phaedo", "Plato", "His last day, arguing that the soul outlives the body."), "ancient");
const REPUBLIC = at(ab("2707", "Republic", "Plato", "What justice is, asked by building a city in words."), "ancient");
const TACITUS_ORATORY = at(ab("4154", "Dialogue Concerning Oratory", "Tacitus", "Romans argue over why eloquence has declined."), "ancient");
const CICERO_FRIENDSHIP = at(ab("13377", "Treatises on Friendship and Old Age", "Cicero", "Two Roman dialogues: Laelius on friendship, Cato on growing old."), "ancient");
const CONSOLATION = at(ab("85", "The Consolation of Philosophy", "Boethius", "In prison, a man argues with Philosophy herself about fortune and the good."), "medieval");
const CUR_DEUS_HOMO = at(ab("20108", "Cur Deus Homo? (Why God Became Man)", "Anselm of Canterbury", "Anselm answers his pupil Boso's objections, one by one."), "medieval");
const UTOPIA = at(ab("993", "Utopia", "Thomas More", "Over dinner, a traveller argues with More about the best commonwealth."), "renaissance");
const BERKELEY = at(ab("3455", "Three Dialogues between Hylas and Philonous", "George Berkeley", "Does matter exist apart from being perceived?"), "early-modern");
const HUME_DIALOGUES = at(ab("1093", "Dialogues Concerning Natural Religion", "David Hume", "Three friends test the argument from design."), "early-modern");

/* ---------- the Founders argue (LibriVox) ---------- */
const FEDERALIST = at(ab("670", "The Federalist Papers", "Alexander Hamilton, John Jay and James Madison", "Essays to New York, 1787 to 1788, for ratifying the Constitution."), "founding", "1787");
const ANTI_FEDERALIST = at(ab("1085", "The Anti-Federalist Papers", "Patrick Henry and others", "The other side: why the Constitution should not be ratified as written."), "founding", "1787");
const COMMON_SENSE = at(ab("1126", "Common Sense", "Thomas Paine", "The case for independence, 1776."), "founding", "1776");
const RIGHTS_OF_MAN = at(ab("9294", "Rights of Man", "Thomas Paine", "Paine's answer to Burke on the French Revolution, 1791."), "founding", "1791");
const AREOPAGITICA = at(ab("2267", "Areopagitica", "John Milton", "A speech to Parliament against licensing the press, 1644."), "renaissance", "1644");

/* ---------- plays that argue (LibriVox) ---------- */
const CLOUDS = at(ab("9998", "Clouds", "Aristophanes", "Socrates mocked: the Better and the Worse Argument fight it out on stage."), "ancient");
const ANTIGONE = at(ab("4632", "Antigone", "Sophocles", "The law of the city against the law of the gods."), "ancient");
const JULIUS_CAESAR = at(ab("3620", "Julius Caesar", "William Shakespeare", "Brutus and Antony make their cases to the crowd in the Forum."), "renaissance", "1599");
const ENEMY = at(ab("7252", "An Enemy of the People", "Henrik Ibsen", "One doctor against a town that would rather not know."), "early-modern", "1882");
const MAJOR_BARBARA = at(ab("6348", "Major Barbara", "George Bernard Shaw", "The Salvation Army against the arms maker: which saves souls?"), "twentieth", "1905");
const DON_JUAN = at(ab("6476", "Don Juan in Hell", "George Bernard Shaw", "The dream scene from Man and Superman: a debate in Hell about heaven, love and the Life Force."), "twentieth", "1903");

export const DIALECTIC_SHELVES: readonly DialecticShelf[] = [
  {
    id: "debates", title: "Debates", note: "Two sides, one question, argued in front of an audience. A new one, then an old argument, in turn.",
    items: [KIRK_CAMBRIDGE, KIRK_SURROUNDED, OCONNOR_SURROUNDED, PETERSON_SURROUNDED, CRAIG_CARROLL, OCONNOR_CRAIG, BATTLE_REALITY, NO_CONFIDENCE, MEDIA_ENEMY, BIG_TECH, CRAIG_HITCHENS, IQ2_CHURCH, IQ2_RELIGION, DEATH_FINAL, PETERSON_ZIZEK, MONARCHY, RUSSELL_COPLESTON, BALDWIN_BUCKLEY, CHOMSKY_FOUCAULT, FIRING_LINE, LINCOLN_DOUGLAS],
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
    id: "founders", title: "The Founders argue", note: "Ratification and revolution argued in print, read aloud by LibriVox volunteers.",
    items: [FEDERALIST, ANTI_FEDERALIST, COMMON_SENSE, RIGHTS_OF_MAN, AREOPAGITICA],
  },
  {
    id: "dialogues", title: "Dialogues, read aloud", note: "Arguments written as conversations, from Plato to Hume, recorded by LibriVox volunteers.",
    items: [EUTHYPHRO, APOLOGY, MENO, PROTAGORAS, GORGIAS, PHAEDRUS, SYMPOSIUM, PHAEDO, REPUBLIC, TACITUS_ORATORY, CICERO_FRIENDSHIP, CONSOLATION, CUR_DEUS_HOMO, UTOPIA, BERKELEY, HUME_DIALOGUES],
  },
  {
    id: "plays", title: "Plays that argue", note: "Drama built on a dispute, read by LibriVox casts.",
    items: [CLOUDS, ANTIGONE, JULIUS_CAESAR, ENEMY, MAJOR_BARBARA, DON_JUAN],
  },
];

/**
 * The old arguments that take the old turns among the debates (Lewis's rule needs old debates, and few were filmed):
 * a dialogue that is a contest, the Founders' two sides, a speech to Parliament, a play's speeches to the crowd.
 */
export const OLD_ARGUMENTS: readonly CollectionItem[] = [GORGIAS, APOLOGY, PROTAGORAS, REPUBLIC, CONSOLATION, CUR_DEUS_HOMO, UTOPIA, JULIUS_CAESAR, AREOPAGITICA, FEDERALIST, ANTI_FEDERALIST, CLOUDS, ANTIGONE];

/**
 * The recordings that argue each curated question (`@reflect/core/dialectics`), debates first, then conversations,
 * discussions, dialogues and plays.
 */
export const QUESTION_MEDIA: Readonly<Record<string, readonly CollectionItem[]>> = {
  "virtue-taught": [MAGEE_PLATO, MAGEE_ARISTOTLE, IOT_ETHICS, IOT_EMILE, MENO, PROTAGORAS],
  "suffer-injustice": [MAGEE_PLATO, IOT_SOCRATES, IOT_PRISON, GORGIAS, REPUBLIC, APOLOGY],
  "feared-or-loved": [IOT_MACHIAVELLI, IOT_CICERO, IOT_POLITICS, JULIUS_CAESAR],
  "education-for": [MAGEE_PLATO, IOT_EMILE, IOT_POLITICS, REPUBLIC, CLOUDS],
  "who-should-rule": [NO_CONFIDENCE, MONARCHY, FEDERALIST, ANTI_FEDERALIST, LINCOLN_DOUGLAS, MAGEE_POLITICS, IOT_POLITICS, IOT_CONTRACT, IOT_FEDERALIST, REPUBLIC, ENEMY],
  "reason-or-feeling": [MAGEE_HUME, MAGEE_KANT, MAGEE_MEDIEVAL, IOT_HUME, IOT_AQUINAS, IOT_ETHICS],
  "god-exists": [RUSSELL_COPLESTON, CRAIG_CARROLL, OCONNOR_CRAIG, BATTLE_REALITY, OCONNOR_SURROUNDED, PETERSON_SURROUNDED, CONSOLATION, CRAIG_HITCHENS, IQ2_RELIGION, IQ2_CHURCH, MAGEE_MEDIEVAL, IOT_AQUINAS, HUME_DIALOGUES, DON_JUAN],
  "human-nature": [CHOMSKY_FOUCAULT, MAGEE_FRANKFURT, IOT_CONTRACT, IOT_EMILE],
};

/**
 * What a debate argued, who took each side, and how it ended, where a source says so (Torian, 2026-11-16 18:26Z:
 * "motion and result"). Only what was checked on 2026-11-16 is here: a debate without a vote has no result, and a vote
 * no source gives is left out. `for` and `against` are the sides of the motion or question, in speaking order.
 */
export type DebateRecord = {
  motion: string;
  /** The motion as a question, or as a resolution moved in a chamber. */
  form: "motion" | "question";
  when: string;
  where: string;
  /** The sides, when the debate had two; a conversation that took no sides names its speakers instead. */
  for?: readonly string[];
  against?: readonly string[];
  speakers?: readonly string[];
  result?: string;
  source: { label: string; url: string };
};

const urlOf = (i: CollectionItem) => (i.kind === "find" ? i.url ?? "" : "");
const wiki = (title: string) => ({ label: "Wikipedia", url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}` });

export const DEBATE_RECORDS: Readonly<Record<string, DebateRecord>> = {
  [urlOf(RUSSELL_COPLESTON)]: {
    motion: "Does God exist?", form: "question", when: "28 January 1948", where: "BBC Third Programme",
    for: ["Frederick Copleston"], against: ["Bertrand Russell"], source: wiki("Copleston–Russell debate"),
  },
  [urlOf(BALDWIN_BUCKLEY)]: {
    motion: "The American dream is at the expense of the American Negro.", form: "motion", when: "18 February 1965", where: "Cambridge Union, broadcast by the BBC",
    for: ["David Heycock", "James Baldwin"], against: ["Jeremy Burford", "William F. Buckley Jr."],
    result: "Carried, 544 to 164", source: wiki("Baldwin–Buckley debate"),
  },
  [urlOf(CHOMSKY_FOUCAULT)]: {
    motion: "Is there a human nature, independent of experience?", form: "question", when: "22 October 1971", where: "Eindhoven University of Technology, broadcast 28 November 1971",
    speakers: ["Noam Chomsky", "Michel Foucault"], source: wiki("Chomsky–Foucault debate"),
  },
  [urlOf(IQ2_CHURCH)]: {
    motion: "The Catholic Church is a force for good in the world.", form: "motion", when: "2009", where: "Intelligence Squared, London",
    for: ["John Onaiyekan", "Ann Widdecombe"], against: ["Christopher Hitchens", "Stephen Fry"],
    result: "Defeated: the side against won the audience vote", source: wiki("Ann Widdecombe"),
  },
  [urlOf(DEATH_FINAL)]: {
    motion: "Death is not final.", form: "motion", when: "2014", where: "Intelligence Squared US, now Open to Debate",
    for: ["Eben Alexander", "Raymond Moody"], against: ["Sean Carroll", "Steven Novella"], source: wiki("Sean M. Carroll"),
  },
};

/** The record of a debate by its recording's link, when one was checked. */
export const debateRecord = (url: string | null | undefined): DebateRecord | null => (url ? DEBATE_RECORDS[url] ?? null : null);
