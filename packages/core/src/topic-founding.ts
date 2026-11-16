/**
 * The founding topic's works and forms (Torian, 2026-11-16 04:02Z, people and eras). The topic page itself stays in
 * `topic-pages.ts`; this file gives its texts pages of their own, so the founders' pages can link what they wrote and
 * what they read, and rebuilds its forms around them. The Music form holds free recordings Reflect plays itself, from
 * Wikimedia Commons, each with its performer and licence: it is "Their time" on the page of every founder who did not
 * write about music. Pure: no I/O.
 */
import { ab, commons, iot, type CollectionItem } from "./collections";
import type { TopicForm, TopicPage, VersionGroup, Work } from "./topic-pages";

const W = (id: string, title: string, by: string, when: string, form: string, about: string, audiobooks: string[], versions: Work["versions"] = []): Work =>
  ({ id, title, by, when, topic: "founding", form, about, audiobooks, versions });
const v = (group: VersionGroup, item: CollectionItem) => ({ group, item });

export const PAINE_IOT = iot("1n7msw51v8zus", "Thomas Paine's Common Sense", "Why it sold so many copies, and what it argued.");
export const FEDERALIST_IOT = iot("129acml1xnj748", "The Federalist Papers", "Who wrote which, and what they feared.");
export const FRANKLIN_IOT = iot("xe1hst1n9n0qg", "Benjamin Franklin", "His science, his diplomacy and his doubts.");
export const WASHINGTON_IOT = iot("ta7zc2119fai9", "Washington and the American Revolution", "The general, the war and the army he held together.");
export const MONTESQUIEU_IOT = iot("1vlxo631kxjuc2", "Montesquieu", "The author the Federalist calls the oracle on the separation of powers.");
export const ALLIANCE_IOT = iot("c8ccse1eoexyd", "The Franco-American Alliance 1778", "The treaty Franklin made in Paris, and what it cost France.");
export const DEISM_IOT = iot("5v6rpf1ywryui", "Deism", "The belief in a creator without revelation, held in different forms by Franklin, Jefferson and Paine.");
export const REPUBLICANISM_IOT = iot("1vcue1317i7frq", "Republicanism", "The idea of the free citizen and the common good that the founders took from Rome and England.");
export const BURKE_IOT = iot("3wftuw11ybi0b", "Edmund Burke", "The writer Paine answered in Rights of Man.");

export const FOUNDING_WORKS: readonly Work[] = [
  W("common-sense", "Common Sense", "Thomas Paine", "January 1776", "arguments", "The pamphlet that argued for independence in plain words, months before the Declaration.", ["1126"], [v("understand", PAINE_IOT)]),
  W("american-crisis", "The American Crisis", "Thomas Paine", "1776 to 1783", "arguments", "Pamphlets written through the war, the first in December 1776: \"These are the times that try men's souls.\"", ["8543"]),
  W("declaration", "Declaration of Independence", "Thomas Jefferson", "4 July 1776", "arguments", "Drafted by Jefferson for a committee of five, revised by Congress: the reasons the colonies gave for leaving the empire.", ["170"]),
  W("us-constitution", "Constitution of the United States", "The Constitutional Convention, for the United States Government", "1787", "arguments", "The frame of government written in Philadelphia in the summer of 1787 and ratified by the states in 1788.", ["465"]),
  W("federalist", "The Federalist Papers", "Alexander Hamilton, James Madison and John Jay", "1787 to 1788", "arguments", "Eighty-five essays signed Publius, written to persuade New York to ratify the Constitution.", ["670", "17195"], [v("understand", FEDERALIST_IOT)]),
  W("anti-federalist", "Anti-Federalist Papers", "Anti-Federalist writers, among them Patrick Henry", "1787 to 1788", "arguments", "Essays and speeches against ratification, collected later; their demands led to the Bill of Rights.", ["1085"]),
  W("rights-of-man", "Rights of Man", "Thomas Paine", "1791 to 1792", "arguments", "Paine's reply to Burke's Reflections on the Revolution in France, defending the French Revolution and the rights it declared.", ["9294"], [v("understand", BURKE_IOT)]),
  W("franklin-autobiography", "Autobiography of Benjamin Franklin", "Benjamin Franklin", "written 1771 to 1790", "lives", "His own account of his life to 1757: the runaway apprentice, the printer, the books he read and the habits he tried to keep.", ["1143"], [v("understand", FRANKLIN_IOT)]),
  W("abigail-adams-letters", "Letters of Mrs. Adams", "Abigail Adams", "published 1840", "lives", "Her letters, many to John Adams while he was away in Congress and in Europe, edited by her grandson Charles Francis Adams.", ["5395"]),
  W("poor-richard", "Poor Richard's Almanack", "Benjamin Franklin", "1732 to 1758", "writings", "The yearly almanac Franklin printed under the name Richard Saunders, full of proverbs.", ["10414"]),
  W("annual-messages", "State of the Union Addresses, 1790 to 1816", "George Washington, John Adams, Thomas Jefferson and James Madison", "1790 to 1816", "writings", "The yearly messages the first four presidents sent to Congress, as the Constitution asks.", ["11000"]),
  W("age-of-reason", "The Age of Reason", "Thomas Paine", "1794 to 1807", "writings", "Paine's case for deism and against revealed religion, begun in Paris during the Terror.", ["1794"], [v("understand", DEISM_IOT)]),
  W("jefferson-bible", "The Life and Morals of Jesus of Nazareth", "Thomas Jefferson", "about 1820", "writings", "The Gospels as Jefferson cut and pasted them, keeping the teachings and leaving out the miracles.", ["11677"]),
  W("addison-cato", "Cato, a Tragedy", "Joseph Addison", "1713", "theatre", "A London play about Cato the Younger's last stand against Caesar, which the founders quoted and Washington's army staged at Valley Forge.", ["18300"]),
];

/** Free recordings of the founders' music, on Wikimedia Commons. */
export const CHESTER = commons("3/33", "\"Chester\" performed by the USMC Band.mp3", "Chester", "William Billings, 1770, arranged by William Schuman; United States Marine Band", "United States Marine Band, Public domain", "Billings's hymn tune, sung and played in the war: \"Let tyrants shake their iron rod.\"");
export const YANKEE_DOODLE = commons("c/c4", "Yankee Doodle (choral).ogg", "Yankee Doodle", "Traditional; United States Army Chorus", "United States Army Chorus, Public domain", "A song British soldiers sang to mock the colonists, which the Continental Army took up as its own.");
export const PRESIDENTS_MARCH = commons("8/86", "The United States Army Old Guard Fife and Drum Corps - 03 - The Presidents March.ogg", "The President's March", "Philip Phile, about 1789; The United States Army Old Guard Fife and Drum Corps", "The United States Army Old Guard Fife and Drum Corps, CC0", "A march written for Washington's presidency, played on fifes and drums as the Continental Army played; its tune later carried the words of Hail, Columbia.");
export const GRENADIERS = commons("0/09", "British Grenadiers.ogg", "The British Grenadiers", "Traditional; United States Army Strings", "United States Army Strings, Public domain", "The march of the British regiments the Continental Army fought.");
export const HALLELUJAH = commons("9/90", "Messiah Hallelujah Chorus 1916.ogg", "Hallelujah, from Messiah", "George Frideric Handel, 1741; a chorus recorded by Edison, 1916", "Edison Records, Public domain", "Handel's oratorio, first heard in part in America in New York in 1770.");
export const ARMONICA = commons("5/51", "Stars-GlassArmonica.ogg", "The Fixed Stars, the Frontier to the Beyond", "William Zeitler, glass armonica, 2003", "William Zeitler, CC BY-SA 2.5", "A modern piece played on the glass armonica, the instrument Franklin made in 1761, so you can hear its sound.");

export const FOUNDING_FORMS: readonly TopicForm[] = [
  { id: "founding:arguments", label: "Arguments", where: "The thirteen colonies and states, 1776 to 1792", works: ["common-sense", "american-crisis", "declaration", "us-constitution", "federalist", "anti-federalist", "rights-of-man"] },
  { id: "founding:lives", label: "Lives and letters", works: ["franklin-autobiography", "abigail-adams-letters"], items: [
    ab("6503", "George Washington", "Calista McCabe Courtenay", "A short life of Washington, for young readers."),
    ab("7093", "Alexander Hamilton", "Charles A. Conant", "A life of Hamilton, from the West Indies to the Treasury."),
    ab("13479", "Abigail Adams and Her Times", "Laura E. Howe Richards", "A life of Abigail Adams."),
    ab("15424", "History of the Rise, Progress and Termination of the American Revolution, Vol. 1", "Mercy Otis Warren", "A history of the war by a writer who lived through it, published in 1805."),
  ] },
  { id: "founding:writings", label: "Other writings", works: ["poor-richard", "annual-messages", "age-of-reason", "jefferson-bible"] },
  { id: "founding:theatre", label: "Theatre", where: "London, 1713, and Valley Forge, 1778", works: ["addison-cato"] },
  { id: "founding:music", label: "Music", where: "The colonies and the war, 1770 to 1790", items: [CHESTER, YANKEE_DOODLE, GRENADIERS, PRESIDENTS_MARCH, HALLELUJAH, ARMONICA] },
  { id: "founding:podcasts", label: "Podcasts", items: [PAINE_IOT, FEDERALIST_IOT, FRANKLIN_IOT, WASHINGTON_IOT, ALLIANCE_IOT, MONTESQUIEU_IOT, REPUBLICANISM_IOT, DEISM_IOT, BURKE_IOT] },
];

/** The topic page itself, or null while it has none (the founding topic lives in `topic-pages.ts`). */
export const FOUNDING_TOPIC: TopicPage | null = null;
