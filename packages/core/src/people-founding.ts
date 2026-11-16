/**
 * The American founding (Torian, 2026-11-16 04:02Z, people and eras): seven people who made the United States, with
 * Washington as its leader. They wrote in English, so quotations are in their own words as first printed (`en`), with
 * the spelling of the edition checked: the Project Gutenberg texts of Franklin's Autobiography (ed. Montgomery, 1906),
 * the Federalist, Paine's Writings (ed. Conway) and Jefferson's Writings (ed. Washington, 1854). Where a letter could
 * not be checked word for word, the page gives the citation alone. Franklin wrote about music and made an instrument,
 * so his page has a Music section of his own; the others show the founding topic's Music form as Their time.
 * Pure: no I/O.
 */
import { ab } from "./collections";
import { en, p, type Person } from "./historical";
import {
  ALLIANCE_IOT, ARMONICA, BURKE_IOT, DEISM_IOT, FEDERALIST_IOT, FRANKLIN_IOT, MONTESQUIEU_IOT, PAINE_IOT, REPUBLICANISM_IOT, WASHINGTON_IOT,
} from "./topic-founding";

const AUTO = "franklin-autobiography";
const LEE = "Letter to Henry Lee";
const THOUGHTS = "Thoughts on Government";
const MS_WARREN = ab("15424", "History of the Rise, Progress and Termination of the American Revolution, Vol. 1", "Mercy Otis Warren", "The war told by a writer who knew the Adamses and lived through it, published in 1805.");

export const FOUNDING: readonly Person[] = [
  {
    id: "george-washington", name: "George Washington", wiki: "George_Washington", ol: "OL17013A", born: "22 February 1732", died: "14 December 1799", place: "Virginia, New York and Philadelphia",
    what: "Commander of the Continental Army, president of the Constitutional Convention, first President of the United States",
    about: "A Virginia planter and surveyor who commanded the Continental Army through eight years of war, presided over the convention that wrote the Constitution, and served two terms as the first president before going home to Mount Vernon. He left few writings beyond letters, orders and addresses.",
    era: "founding", topics: ["founding"],
    start: ab("6503", "George Washington", "Calista McCabe Courtenay", "A short life to begin with."),
    works: ["annual-messages"],
    aboutThem: [
      ab("6503", "George Washington", "Calista McCabe Courtenay", "A short life, for young readers."),
      ab("14734", "Washington and His Colleagues", "Henry Jones Ford", "His two terms as president and the men around him (Chronicles of America, 1918)."),
      WASHINGTON_IOT,
    ],
    relations: [
      { name: "Martha Washington", wiki: "Martha_Washington", rel: "family", note: "A widow with two children when they married in January 1759; she joined him at the army's winter camps." },
      { name: "Marquis de Lafayette", wiki: "Marquis_de_Lafayette", rel: "friend", note: "A French volunteer who served under him from 1777 and named his son George Washington Lafayette." },
      { name: "George III", wiki: "George_III", rel: "ruler", note: "The king whose forces he commanded the Continental Army against from 1775 to 1783." },
      { name: "Alexander Hamilton", wiki: "Alexander_Hamilton", ol: "OL363754A", rel: "served", note: "His aide-de-camp from 1777 to 1781, and his first Secretary of the Treasury." },
      { name: "Thomas Jefferson", wiki: "Thomas_Jefferson", ol: "OL47870A", rel: "served", note: "His first Secretary of State, from 1790 to 1793." },
      { name: "John Adams", wiki: "John_Adams", ol: "OL30776A", rel: "contemporary", note: "His vice president for both terms, 1789 to 1797, and the president after him." },
    ],
    read: [
      { title: "Cato, a Tragedy", by: "Joseph Addison", work: "addison-cato", at: p("Letter to Benedict Arnold", "5 December 1775"), note: "He quotes a line of the play in this letter; the play was staged for his army at Valley Forge in 1778." },
    ],
    from: [
      ab("8543", "The American Crisis", "Thomas Paine", "Pamphlets written for his army through the war."),
      MS_WARREN,
    ],
    later: [WASHINGTON_IOT, REPUBLICANISM_IOT],
    articles: [
      { title: "Valley Forge", note: "The winter camp of 1777 and 1778." },
      { title: "Cato, a Tragedy", note: "The play he quoted and his army staged." },
      { title: "George Washington's Farewell Address", note: "His letter to the country on leaving office in 1796." },
      { title: "Mount Vernon", note: "His Virginia estate, worked by enslaved people, whom his will freed after Martha's death." },
    ],
  },
  {
    id: "benjamin-franklin", name: "Benjamin Franklin", wiki: "Benjamin_Franklin", ol: "OL26170A", born: "17 January 1706", died: "17 April 1790", place: "Boston, Philadelphia, London and Paris",
    what: "Printer, writer, scientist and diplomat; signer of the Declaration and the Constitution",
    about: "A Boston candlemaker's son who ran away to Philadelphia, made a fortune as a printer, showed that lightning is electricity, spent most of twenty-five years in London and Paris as an agent and diplomat, and signed both the Declaration of Independence and the Constitution.",
    era: "founding", topics: ["founding"],
    start: AUTO,
    works: [AUTO, "poor-richard"],
    aboutThem: [
      ab("7862", "Life of Benjamin Franklin", "Samuel G. Goodrich", "A nineteenth-century life."),
      ab("10416", "Many-Sided Franklin", "Paul Leicester Ford", "His trades, science, writing and politics, a chapter each (1899)."),
      FRANKLIN_IOT,
    ],
    music: {
      stance: "own",
      words: [
        p("Letter to Giambatista Beccaria", "13 July 1762"),
        p("Letter to Lord Kames", "2 June 1765"),
      ],
      rules: [
        { what: "Glass armonica", kind: "instrument", verdict: "kept", why: "He made it in 1761 from glass bowls turned on a rod and touched with wet fingers, and described it in this letter.", at: p("Letter to Giambatista Beccaria", "13 July 1762") },
      ],
      time: [ARMONICA],
      timeNote: "No music of his own survives for certain. This is the instrument he made, in a modern piece.",
      people: [
        { name: "Marianne Davies", wiki: "Marianne_Davies", note: "An English musician who toured Europe playing his armonica in the 1760s." },
        { name: "Wolfgang Amadeus Mozart", wiki: "Wolfgang_Amadeus_Mozart", note: "Wrote an Adagio and Rondo for the armonica in 1791, for the player Marianne Kirchgessner." },
      ],
      ages: [],
    },
    relations: [
      { name: "Deborah Read", wiki: "Deborah_Read", rel: "family", note: "His wife by common-law marriage from 1730 until her death in 1774 (Autobiography)." },
      { name: "William Franklin", wiki: "William_Franklin", rel: "family", note: "His son, to whom the Autobiography is addressed; the last royal governor of New Jersey, he stayed loyal to the Crown." },
      { name: "Thomas Paine", wiki: "Thomas_Paine", ol: "OL31439A", rel: "friend", note: "Franklin gave him letters of introduction when he sailed from London to Philadelphia in 1774." },
      { name: "John Adams", wiki: "John_Adams", ol: "OL30776A", rel: "contemporary", note: "Served with him as an American commissioner in France from 1778, and with Jay negotiated the peace of 1783." },
      { name: "Thomas Jefferson", wiki: "Thomas_Jefferson", ol: "OL47870A", rel: "contemporary", note: "They sat on the committee of five that drafted the Declaration; Jefferson succeeded him as minister to France in 1785." },
      { name: "Voltaire", wiki: "Voltaire", rel: "contemporary", note: "They met in Paris in 1778, and embraced in public at the Academy of Sciences that April." },
    ],
    read: [
      { title: "The Pilgrim's Progress", by: "John Bunyan", item: ab("366", "Pilgrim's Progress", "John Bunyan"), at: en(AUTO, "Part One", "Pleased with the Pilgrim's Progress, my first collection was of John Bunyan's works in separate little volumes."), note: "The first books he bought as a boy." },
      { title: "Parallel Lives", by: "Plutarch", work: "plutarch", at: en(AUTO, "Part One", "Plutarch's Lives there was in which I read abundantly, and I still think that time spent to great advantage."), note: "In his father's small library." },
      { title: "An Essay upon Projects", by: "Daniel Defoe", at: p(AUTO, "Part One"), note: "He says this book and Mather's may have given him a turn of thinking that shaped events later in his life." },
      { title: "Essays to Do Good", by: "Cotton Mather", at: p(AUTO, "Part One"), note: "Named with Defoe's book in the same sentence." },
      { title: "The Spectator", by: "Joseph Addison and Richard Steele", item: ab("13487", "Days With Sir Roger de Coverley", "Joseph Addison, Richard Steele", "Papers from the Spectator."), at: en(AUTO, "Part One", "About this time I met with an odd volume of the Spectator. It was the third. I had never before seen any of them. I bought it, read it over and over, and was much delighted with it."), note: "He taught himself to write by rewriting its essays from notes and comparing them with the original." },
      { title: "Memorable Thoughts of Socrates", by: "Xenophon", work: "memorabilia", at: en(AUTO, "Part One", "I was charm'd with it, adopted it, dropt my abrupt contradiction and positive argumentation, and put on the humble inquirer and doubter."), note: "He took up the Socratic method of argument from it." },
      { title: "An Essay Concerning Human Understanding", by: "John Locke", work: "locke-understanding", at: p(AUTO, "Part One"), note: "He read it in his teens, with the Port-Royal Logic." },
    ],
    from: [
      ab("10414", "Poor Richard's Almanack", "Benjamin Franklin", "His almanac's proverbs."),
    ],
    later: [FRANKLIN_IOT, ALLIANCE_IOT, DEISM_IOT],
    articles: [
      { title: "The Autobiography of Benjamin Franklin", note: "How it was written, in four parts over nineteen years." },
      { title: "Glass harmonica", note: "The instrument he made." },
      { title: "Lightning rod", note: "His invention, from his experiments with electricity." },
      { title: "Franco-American alliance", note: "The treaties he signed in Paris in 1778." },
      { title: "The Spectator (1711)", note: "The paper he taught himself to write from." },
    ],
  },
  {
    id: "john-adams", name: "John Adams", wiki: "John_Adams", ol: "OL30776A", born: "30 October 1735", died: "4 July 1826", place: "Braintree, Massachusetts, Philadelphia, Paris and London",
    what: "Lawyer, delegate to the Continental Congress, diplomat, second President of the United States",
    about: "A Massachusetts lawyer who argued for independence in Congress, served as a diplomat in France, the Netherlands and Britain, drafted the Massachusetts constitution of 1780, and was vice president under Washington and then the second president.",
    era: "founding", topics: ["founding"],
    start: "abigail-adams-letters",
    works: ["annual-messages"],
    aboutWorks: ["abigail-adams-letters"],
    aboutThem: [ab("13479", "Abigail Adams and Her Times", "Laura E. Howe Richards", "A life of his wife, and of their family.")],
    relations: [
      { name: "Abigail Adams", wiki: "Abigail_Adams", rel: "family", note: "His wife from 1764; their letters while he was away in Congress and in Europe survive." },
      { name: "John Quincy Adams", wiki: "John_Quincy_Adams", rel: "family", note: "Their son, who went with him to Europe as a boy and became the sixth president." },
      { name: "Thomas Jefferson", wiki: "Thomas_Jefferson", ol: "OL47870A", rel: "friend", note: "They wrote to each other from 1812 until both died on 4 July 1826." },
      { name: "George III", wiki: "George_III", rel: "ruler", note: "Received him in 1785 as the first American minister to Britain." },
      { name: "Benjamin Franklin", wiki: "Benjamin_Franklin", ol: "OL26170A", rel: "contemporary", note: "A fellow commissioner in France from 1778." },
      { name: "George Washington", wiki: "George_Washington", ol: "OL17013A", rel: "contemporary", note: "Adams proposed him to Congress as commander in 1775 and served as his vice president." },
    ],
    read: [
      { title: "Discourses Concerning Government", by: "Algernon Sidney", at: p(THOUGHTS, "1776"), note: "He names Sidney first among the English writers on government." },
      { title: "The Commonwealth of Oceana", by: "James Harrington", at: p(THOUGHTS, "1776"), note: "Named in the same list." },
      { title: "Two Treatises of Government", by: "John Locke", work: "two-treatises", at: p(THOUGHTS, "1776"), note: "Named in the same list, with Milton, Nedham, Neville, Burnet and Hoadly." },
    ],
    from: [ab("5395", "Letters of Mrs. Adams, the Wife of John Adams, Vol. 1", "Abigail Adams", "Her side of their letters."), MS_WARREN],
    later: [REPUBLICANISM_IOT],
    articles: [
      { title: "Thoughts on Government", note: "His 1776 pamphlet on how the new states should be governed." },
      { title: "Abigail Adams", note: "His wife and correspondent." },
      { title: "Republicanism in the United States", note: "The ideas of government he wrote about." },
    ],
  },
  {
    id: "thomas-jefferson", name: "Thomas Jefferson", wiki: "Thomas_Jefferson", ol: "OL47870A", born: "13 April 1743", died: "4 July 1826", place: "Virginia, Philadelphia and Paris",
    what: "Author of the Declaration of Independence, minister to France, third President of the United States",
    about: "A Virginia lawyer and planter who drafted the Declaration of Independence, wrote Virginia's statute for religious freedom, served as minister to France, Secretary of State and president, and founded the University of Virginia. He held more than six hundred people in slavery over his life.",
    era: "founding", topics: ["founding"],
    start: "declaration",
    works: ["declaration", "annual-messages", "jefferson-bible"],
    aboutThem: [ab("14825", "Jefferson and His Colleagues", "Allen Johnson", "His presidency and Madison's (Chronicles of America, 1921).")],
    relations: [
      { name: "William Small", wiki: "William_Small", rel: "teacher", note: "His professor of mathematics and natural philosophy at the College of William and Mary (Autobiography, 1821)." },
      { name: "George Wythe", wiki: "George_Wythe", rel: "teacher", note: "The lawyer under whom he studied law from 1762 (Autobiography, 1821)." },
      { name: "Martha Jefferson", wiki: "Martha_Jefferson", rel: "family", note: "His wife from 1772 until her death in 1782." },
      { name: "James Madison", wiki: "James_Madison", ol: "OL240767A", rel: "friend", note: "His friend and ally for fifty years, his Secretary of State, and the president after him." },
      { name: "John Adams", wiki: "John_Adams", ol: "OL30776A", rel: "friend", note: "They wrote to each other from 1812 until both died on 4 July 1826." },
      { name: "Thomas Paine", wiki: "Thomas_Paine", ol: "OL31439A", rel: "friend", note: "As president he offered Paine passage home from France; Paine returned in 1802." },
      { name: "George III", wiki: "George_III", rel: "ruler", note: "The Declaration he drafted lists the king's acts as the reasons for independence." },
      { name: "George Washington", wiki: "George_Washington", ol: "OL17013A", rel: "contemporary", note: "He served as Washington's first Secretary of State." },
      { name: "Sally Hemings", wiki: "Sally_Hemings", rel: "contemporary", note: "An enslaved woman at Monticello, half-sister of his late wife; the Thomas Jefferson Foundation concludes he was most likely the father of her six children." },
    ],
    read: [
      { title: "Two Treatises of Government", by: "John Locke", work: "two-treatises", at: en(LEE, "8 May 1825", "All its authority rests then on the harmonizing sentiments of the day, whether expressed in conversation, in letters, printed essays, or in the elementary books of public right, as Aristotle, Cicero, Locke, Sidney, &c."), note: "Of the Declaration, near the end of his life." },
      { title: "Politics", by: "Aristotle", work: "politics", at: p(LEE, "8 May 1825"), note: "Aristotle is first in the same list." },
      { title: "Discourses Concerning Government", by: "Algernon Sidney", at: p(LEE, "8 May 1825"), note: "Sidney is last in the same list." },
    ],
    from: [ab("1794", "Age of Reason", "Thomas Paine", "His friend's case for deism.")],
    later: [DEISM_IOT, REPUBLICANISM_IOT],
    articles: [
      { title: "United States Declaration of Independence", note: "How it was drafted and revised." },
      { title: "Virginia Statute for Religious Freedom", note: "His law of 1786, one of three things he asked to be named on his grave." },
      { title: "Jefferson Bible", note: "The Gospels as he cut them." },
      { title: "Monticello", note: "The house he designed, and the people enslaved there." },
      { title: "Jefferson–Hemings controversy", note: "The evidence on his relationship with Sally Hemings." },
    ],
  },
  {
    id: "james-madison", name: "James Madison", wiki: "James_Madison", ol: "OL240767A", born: "16 March 1751", died: "28 June 1836", place: "Virginia, Philadelphia and Washington",
    what: "Delegate to the Constitutional Convention, co-author of the Federalist, fourth President of the United States",
    about: "A Virginia planter who helped draw up the Virginia Plan the Constitutional Convention started from, kept the fullest notes of its debates, wrote twenty-nine of the Federalist papers, drafted the Bill of Rights in the first Congress, and was Jefferson's Secretary of State and then president.",
    era: "founding", topics: ["founding"],
    start: "federalist",
    works: ["federalist", "annual-messages"],
    aboutThem: [ab("14825", "Jefferson and His Colleagues", "Allen Johnson", "Jefferson's presidency and his.")],
    relations: [
      { name: "John Witherspoon", wiki: "John_Witherspoon", rel: "teacher", note: "President of the College of New Jersey, now Princeton, where Madison graduated in 1771 and stayed on a year to study with him." },
      { name: "Dolley Madison", wiki: "Dolley_Madison", rel: "family", note: "His wife from 1794." },
      { name: "Thomas Jefferson", wiki: "Thomas_Jefferson", ol: "OL47870A", rel: "friend", note: "His friend and ally for fifty years; Madison served as his Secretary of State." },
      { name: "Alexander Hamilton", wiki: "Alexander_Hamilton", ol: "OL363754A", rel: "contemporary", note: "They wrote the Federalist with John Jay in 1787 and 1788." },
      { name: "John Jay", wiki: "John_Jay", rel: "contemporary", note: "The third author of the Federalist." },
    ],
    read: [
      { title: "The Spirit of the Laws", by: "Montesquieu", work: "spirit-of-laws", at: en("federalist", "No. 47", "The oracle who is always consulted and cited on this subject is the celebrated Montesquieu."), note: "On the separation of powers, which he goes on to read closely." },
    ],
    from: [ab("1085", "Anti-Federalist Papers", "Patrick Henry", "The writings against the Constitution he answered.")],
    later: [FEDERALIST_IOT, MONTESQUIEU_IOT, REPUBLICANISM_IOT],
    articles: [
      { title: "Constitutional Convention (United States)", note: "The convention of 1787 and his notes of it." },
      { title: "The Federalist Papers", note: "Who wrote which." },
      { title: "United States Bill of Rights", note: "The amendments he drafted in 1789." },
      { title: "Separation of powers", note: "The idea Federalist 47 takes from Montesquieu." },
    ],
  },
  {
    id: "alexander-hamilton", name: "Alexander Hamilton", wiki: "Alexander_Hamilton", ol: "OL363754A", born: "11 January 1755 or 1757", died: "12 July 1804", place: "Nevis, St. Croix and New York",
    what: "Aide to Washington, co-author of the Federalist, first Secretary of the Treasury",
    about: "Born in the West Indies, he came to New York as a student, served as Washington's aide-de-camp, wrote most of the Federalist papers, and as the first Secretary of the Treasury set up the national debt, a national bank and the Revenue Cutter Service. He died after a duel with Aaron Burr.",
    era: "founding", topics: ["founding"],
    start: "federalist",
    works: ["federalist"],
    aboutThem: [
      ab("7093", "Alexander Hamilton", "Charles A. Conant", "A life, from the West Indies to the Treasury."),
      ab("12752", "Hamilton", "George Arliss, Mary P. Hamlin", "A play of 1917 about his years at the Treasury."),
    ],
    relations: [
      { name: "Elizabeth Schuyler Hamilton", wiki: "Elizabeth_Schuyler_Hamilton", rel: "family", note: "His wife from 1780." },
      { name: "George Washington", wiki: "George_Washington", ol: "OL17013A", rel: "patron", note: "Took him on as aide-de-camp in 1777 and made him the first Secretary of the Treasury in 1789." },
      { name: "John Jay", wiki: "John_Jay", rel: "friend", note: "A fellow New Yorker who wrote five of the Federalist papers." },
      { name: "Marquis de Lafayette", wiki: "Marquis_de_Lafayette", rel: "friend", note: "A fellow officer close to Washington; Hamilton led the attack on Redoubt 10 at Yorktown in 1781 under him." },
      { name: "James Madison", wiki: "James_Madison", ol: "OL240767A", rel: "contemporary", note: "They wrote the Federalist with Jay in 1787 and 1788." },
      { name: "Aaron Burr", wiki: "Aaron_Burr", rel: "contemporary", note: "Burr shot him in a duel at Weehawken, New Jersey, on 11 July 1804; he died the next day." },
    ],
    read: [
      { title: "The Spirit of the Laws", by: "Montesquieu", work: "spirit-of-laws", at: en("federalist", "No. 9", "So far are the suggestions of Montesquieu from standing in opposition to a general Union of the States, that he explicitly treats of a confederate republic as the expedient for extending the sphere of popular government"), note: "He then quotes Montesquieu's chapter on the confederate republic at length." },
      { title: "Essays, Moral and Political", by: "David Hume", at: p("federalist", "No. 85"), note: "He quotes Hume's essay on the rise of the arts and sciences, and names it in a footnote." },
    ],
    from: [ab("18347", "Collection of the Facts and Documents Relative to the Death of Major-General Alexander Hamilton", "William Coleman", "Gathered in 1804 by the editor of the newspaper Hamilton founded.")],
    later: [FEDERALIST_IOT, MONTESQUIEU_IOT],
    articles: [
      { title: "The Federalist Papers", note: "The fifty-one papers he wrote." },
      { title: "Report on Manufactures", note: "His 1791 report to Congress." },
      { title: "Burr–Hamilton duel", note: "How it came about and how it ended." },
    ],
  },
  {
    id: "thomas-paine", name: "Thomas Paine", wiki: "Thomas_Paine", ol: "OL31439A", born: "9 February 1737", died: "8 June 1809", place: "Thetford, Philadelphia, London and Paris",
    what: "Writer of Common Sense, The American Crisis, Rights of Man and The Age of Reason",
    about: "An English corset-maker and excise officer who came to Philadelphia in 1774, wrote Common Sense and The American Crisis in the war, defended the French Revolution in Rights of Man, sat in the French National Convention, was imprisoned in the Terror, and wrote The Age of Reason.",
    era: "founding", topics: ["founding"],
    start: "common-sense",
    works: ["common-sense", "american-crisis", "rights-of-man", "age-of-reason"],
    aboutThem: [ab("14897", "Ingersoll on Thomas Paine", "Robert G. Ingersoll", "A nineteenth-century lecture defending him."), PAINE_IOT],
    relations: [
      { name: "Benjamin Franklin", wiki: "Benjamin_Franklin", ol: "OL26170A", rel: "friend", note: "Franklin gave him letters of introduction when he sailed for Philadelphia in 1774." },
      { name: "Marquis de Lafayette", wiki: "Marquis_de_Lafayette", rel: "friend", note: "Gave him the key of the Bastille in 1790 to send to Washington." },
      { name: "Thomas Jefferson", wiki: "Thomas_Jefferson", ol: "OL47870A", rel: "friend", note: "As president, offered him passage home from France; Paine returned in 1802." },
      { name: "George Washington", wiki: "George_Washington", ol: "OL17013A", rel: "contemporary", note: "Paine dedicated the first part of Rights of Man to him in 1791." },
      { name: "Edmund Burke", wiki: "Edmund_Burke", rel: "contemporary", note: "Rights of Man (1791) is written as a reply to his Reflections on the Revolution in France." },
    ],
    read: [
      { title: "Reflections on the Revolution in France", by: "Edmund Burke", item: ab("6727", "Reflections on the Revolution in France", "Edmund Burke"), at: en("rights-of-man", "Part One, opening", "Among the incivilities by which nations or individuals provoke and irritate each other, Mr. Burke's pamphlet on the French Revolution is an extraordinary instance."), note: "The book Rights of Man answers, from its first sentence." },
      { title: "The Bible", by: "Many authors", at: p("age-of-reason", "Part Two"), note: "The second part goes through the books of the Old and New Testaments one by one." },
    ],
    from: [ab("6727", "Reflections on the Revolution in France", "Edmund Burke", "The book he answered."), ab("15476", "A Vindication of the Rights of Men", "Mary Wollstonecraft", "Another reply to Burke, published in 1790, before his.")],
    later: [PAINE_IOT, BURKE_IOT, DEISM_IOT],
    articles: [
      { title: "Common Sense", note: "How it was written and sold." },
      { title: "The American Crisis", note: "The wartime pamphlets." },
      { title: "Rights of Man", note: "Both parts, and the trial for seditious libel it brought him in England." },
      { title: "Revolution Controversy", note: "The pamphlet war over the French Revolution that Burke began." },
      { title: "The Age of Reason", note: "His book on religion." },
    ],
  },
];
