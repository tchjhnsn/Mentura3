/**
 * The modern authors Reflect's practice and courses borrow from (Torian, 2026-11-16 22:33Z: "make sure that we have
 * all of these authors that you're mentioning, as well as all of their works, whether articles or books, or if they
 * were on any audio, video appearances"). Each has their books and key articles, talks where they themselves speak,
 * and podcast episodes with them. Every id, year and title was checked on 2026-11-16 against Open Library, ORCID,
 * Crossref, YouTube's oEmbed, Apple's podcast search, LibriVox or Wikipedia; what could not be checked was left out.
 * A person's full book list is their Open Library author page (`ol`, best record first); a full article list comes from
 * their ORCID record where they have one. Object literals only. Pure: no I/O.
 */
import type { CollectionItem } from "./collections";

export type ScholarBook = { title: string; year: number | null; ol?: string; doi?: string; note?: string };
export type ScholarArticle = { title: string; year: number | null; venue?: string; doi?: string; note?: string };

export type Scholar = {
  id: string;
  name: string;
  wiki?: string;
  born?: string;
  died?: string;
  what: string;
  /** Why the practice or course draws on them, in a line. */
  role: string;
  /** Open Library author records that hold their books, best first. */
  ol: readonly string[];
  orcid?: string;
  books: readonly ScholarBook[];
  articles: readonly ScholarArticle[];
  /** Recordings where they speak. */
  talks: readonly CollectionItem[];
  /** Podcast episodes with them, and lectures of theirs published as podcasts. */
  audio: readonly CollectionItem[];
  /** Recordings of their books. */
  listen?: readonly CollectionItem[];
};

const talk = (id: string, title: string, by: string, why: string): CollectionItem => ({ kind: "find", medium: "lecture", title, by, url: `https://www.youtube.com/watch?v=${id}`, image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, why });

export const SCHOLARS: readonly Scholar[] = [
  {
    id: "j-l-austin", name: "J. L. Austin", wiki: "J._L._Austin", born: "1911", died: "1960",
    what: "English philosopher of language and ordinary language philosopher who developed speech act theory.",
    role: "Founded speech act theory: saying something is also doing something.",
    ol: ["OL1690885A","OL7795955A","OL11459268A","OL12492166A"],
    books: [
      { title: "Philosophical Papers", year: 1961, ol: "OL6408871W", note: "ed. J. O. Urmson and G. J. Warnock; posthumous" },
      { title: "How to Do Things with Words", year: 1962, ol: "OL6408872W", note: "William James Lectures, Harvard 1955; 2nd ed. 1975 with Marina Sbisà" },
      { title: "Sense and Sensibilia", year: 1962, ol: "OL6408870W", note: "reconstructed by G. J. Warnock; posthumous" },
      { title: "The Foundations of Arithmetic (translation of Frege)", year: 1950, ol: "OL31545317W", note: "translation; OL work is under a separate record OL11486790A (Frege and Austin)" },
    ],
    articles: [
      { title: "Are There A Priori Concepts?", year: 1939, venue: "Aristotelian Society Supplementary Volume 18", doi: "10.1093/aristoteliansupp/18.1.49", note: "symposium contribution" },
      { title: "Other Minds", year: 1946, venue: "Aristotelian Society Supplementary Volume 20", doi: "10.1093/aristoteliansupp/20.1.122", note: "symposium with John Wisdom and A. J. Ayer; Crossref spells the author 'Austen'" },
      { title: "Truth", year: 1950, venue: "Aristotelian Society Supplementary Volume 24", doi: "10.1093/aristoteliansupp/24.1.111", note: "symposium with P. F. Strawson" },
      { title: "How to Talk: Some Simple Ways", year: 1953, venue: "Proceedings of the Aristotelian Society 53", doi: "10.1093/aristotelian/53.1.227" },
      { title: "Ifs and Cans", year: 1956, venue: "Proceedings of the British Academy", note: "no DOI found; reprinted in Philosophical Papers" },
      { title: "A Plea for Excuses", year: 1957, venue: "Proceedings of the Aristotelian Society 57", doi: "10.1093/aristotelian/57.1.1", note: "Presidential Address" },
      { title: "Pretending", year: 1958, venue: "Aristotelian Society Supplementary Volume 32", doi: "10.1093/aristoteliansupp/32.1.261" },
      { title: "Three Ways of Spilling Ink", year: 1966, venue: "The Philosophical Review 75(4)", doi: "10.2307/2183222", note: "posthumous" },
    ],
    talks: [
      talk("JXo0YNZ3WsE", "J. L. Austin Lecture in Sweden (1959) part one", "Harvard Philosophy Department", "Recording of Austin lecturing in Sweden, October 1959 (linked from his Wikipedia page)."),
      talk("XnWB4-aZAqc", "J. L. Austin Lecture in Sweden (1959) part two", "Harvard Philosophy Department", "Second part of the same 1959 lecture, with discussion."),
    ],
    audio: [

    ],
  },
  {
    id: "john-searle", name: "John Searle", wiki: "John_Searle", born: "1932", died: "2025",
    what: "American philosopher of language, mind and society, known for speech act theory and the Chinese room argument.",
    role: "Systematized speech acts: force and content, and the kinds of illocutionary act.",
    ol: ["OL55033A"],
    books: [
      { title: "Speech Acts: An Essay in the Philosophy of Language", year: 1969, ol: "OL697938W" },
      { title: "The Campus War: A Sympathetic Look at the University in Agony", year: 1971, ol: "OL697928W" },
      { title: "The Philosophy of Language", year: 1971, ol: "OL697933W", note: "edited anthology; reprints 'What is a speech act?'" },
      { title: "Expression and Meaning: Studies in the Theory of Speech Acts", year: 1979, ol: "OL697906W" },
      { title: "Speech Act Theory and Pragmatics", year: 1980, ol: "OL27347525W", doi: "10.1007/978-94-009-8964-1", note: "edited volume" },
      { title: "Intentionality: An Essay in the Philosophy of Mind", year: 1983, ol: "OL697910W" },
      { title: "Minds, Brains and Science (1984 Reith Lectures)", year: 1984, ol: "OL697918W" },
      { title: "Foundations of Illocutionary Logic", year: 1985, ol: "OL697907W", note: "with Daniel Vanderveken" },
      { title: "(On) Searle on Conversation", year: 1992, ol: "OL697921W" },
      { title: "The Rediscovery of the Mind", year: 1992, ol: "OL697934W" },
      { title: "The Construction of Social Reality", year: 1995, ol: "OL697903W" },
      { title: "The Mystery of Consciousness", year: 1997, ol: "OL697932W" },
      { title: "Mind, Language and Society: Philosophy in the Real World", year: 1998, ol: "OL697937W" },
      { title: "Rationality in Action", year: 2001, ol: "OL697923W" },
      { title: "Consciousness and Language", year: 2002, ol: "OL697929W" },
      { title: "Freedom and Neurobiology", year: 2004, ol: "OL697930W" },
      { title: "Mind: A Brief Introduction", year: 2004, ol: "OL697931W" },
      { title: "Philosophy in a New Century: Selected Essays", year: 2008, ol: "OL697922W" },
      { title: "Making the Social World: The Structure of Human Civilization", year: 2010, ol: "OL697916W" },
      { title: "Seeing Things As They Are: A Theory of Perception", year: 2015, ol: "OL17781321W" },
    ],
    articles: [
      { title: "Proper Names", year: 1958, venue: "Mind 67(266)", doi: "10.1093/mind/lxvii.266.166" },
      { title: "How to Derive 'Ought' from 'Is'", year: 1964, venue: "The Philosophical Review 73(1)", doi: "10.2307/2183201" },
      { title: "What is a Speech Act?", year: 1965, venue: "Philosophy in America, ed. Max Black (Allen & Unwin / Cornell UP), pp. 221-239", note: "no DOI; reprinted in The Philosophy of Language (1971)" },
      { title: "Austin on Locutionary and Illocutionary Acts", year: 1968, venue: "The Philosophical Review 77", doi: "10.2307/2183008" },
      { title: "Indirect Speech Acts", year: 1975, venue: "Speech Acts (edited volume, 1975)", doi: "10.1163/9789004368811_004" },
      { title: "The Logical Status of Fictional Discourse", year: 1975, venue: "New Literary History 6", doi: "10.2307/468422" },
      { title: "A Classification of Illocutionary Acts", year: 1976, venue: "Language in Society 5(1)", doi: "10.1017/s0047404500006837" },
      { title: "Minds, Brains, and Programs", year: 1980, venue: "Behavioral and Brain Sciences 3", doi: "10.1017/S0140525X00005756" },
    ],
    talks: [
      talk("FItTy4yizlw", "The Philosophy of Language - John Searle & Bryan Magee (1977)", "Philosophy Overdose", "Men of Ideas (BBC, 1977) episode with Bryan Magee on philosophy of language."),
      talk("v_hQpvQYhOI", "Ludwig Wittgenstein's Philosophy - John Searle & Bryan Magee (1987)", "Philosophy Overdose", "The Great Philosophers (BBC, 1987) episode with Bryan Magee on Wittgenstein."),
      talk("Uk5pIzCNOzU", "Searle: Philosophy of Language, lecture 1", "SocioPhilosophy", "First lecture of his Berkeley Philosophy of Language course (series on the same channel, at least 27 lectures)."),
      talk("zi7Va_4ekko", "Searle: Philosophy of Mind, lecture 1", "SocioPhilosophy", "First lecture of his Berkeley Philosophy of Mind course (series on the same channel)."),
      talk("rHKwIYsPXLg", "Consciousness in Artificial Intelligence | John Searle | Talks at Google", "Talks at Google", "Talk on consciousness and AI at Google."),
      talk("vCyKNtocdZE", "Reflections on Free Will, Language, and Political Power | John Searle | Talks at Google", "Talks at Google", "Second Talks at Google appearance."),
      talk("eqDgt12m26c", "John Searle: Our shared condition -- consciousness", "TED", "TED talk (2013 per his Wikipedia page)."),
      talk("6nTQnvGxEXw", "Professor John Searle : Consciousness as a Problem in Philosophy and Neurobiology", "CRASSH Cambridge", "Lecture at CRASSH, University of Cambridge."),
    ],
    audio: [
      { kind: "episode", feed: "https://rss.libsyn.com/shows/19421/destinations/16399.xml", key: "1h8q9w6qn83dd", show: "The Partially Examined Life Philosophy Podcast", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts114/v4/32/eb/a9/32eba9ac-dfb0-618b-e874-6696c69ea59d/mza_257738567509116492.jpeg/600x600bb.jpg", title: "Episode 138: Guest John Searle on Perception", by: "The Partially Examined Life Philosophy Podcast", why: "Guest, 2016." },
      { kind: "episode", feed: "https://publicfeeds.net/f/15207/feed-rss.xml", key: "1pvjzdn1huh11q", show: "Philosophy Talk", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/37/b3/ae/37b3ae9e-2974-8d38-060d-af7182a4767b/mza_15759602466202991807.jpg/600x600bb.jpg", title: "The Mystery of Mind", by: "Philosophy Talk", why: "Guest, 2005." },
      { kind: "episode", feed: "https://publicfeeds.net/f/15207/feed-rss.xml", key: "6elyvs1aae123", show: "Philosophy Talk", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/37/b3/ae/37b3ae9e-2974-8d38-060d-af7182a4767b/mza_15759602466202991807.jpg/600x600bb.jpg", title: "Social Reality", by: "Philosophy Talk", why: "Guest, 2010." },
      { kind: "episode", feed: "https://4thdegree.org/7thAvenueProject/podcast.xml", key: "1tm92g818ema8j", show: "The 7th Avenue Project", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts4/v4/42/ba/7d/42ba7d15-c415-be73-4b7a-108f53617252/mza_454045314044624624.jpg/600x600bb.jpg", title: "Philosopher John Searle on Perception, Mind, Matter and Consciousness", by: "The 7th Avenue Project", why: "Guest, 2015." },
      { kind: "episode", feed: "https://podcasts.files.bbci.co.uk/b00729d9.rss", key: "1ub8sap68lwd0", show: "The Reith Lectures", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/1a/73/9d/1a739dcb-471e-896a-a93a-aa9cca5a50ce/mza_14978815171596890626.jpg/600x600bb.jpg", title: "A Froth on Reality", by: "John Searle", why: "Reith Lecture, 1984." },
      { kind: "episode", feed: "https://podcasts.files.bbci.co.uk/b00729d9.rss", key: "i00x0lhbn0jw", show: "The Reith Lectures", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/1a/73/9d/1a739dcb-471e-896a-a93a-aa9cca5a50ce/mza_14978815171596890626.jpg/600x600bb.jpg", title: "Beer Cans & Meat Machines", by: "John Searle", why: "Reith Lecture, 1984." },
      { kind: "episode", feed: "https://podcasts.files.bbci.co.uk/b00729d9.rss", key: "18zq8vt1gygcgo", show: "The Reith Lectures", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/1a/73/9d/1a739dcb-471e-896a-a93a-aa9cca5a50ce/mza_14978815171596890626.jpg/600x600bb.jpg", title: "Grandmother Knew Best", by: "John Searle", why: "Reith Lecture, 1984." },
      { kind: "episode", feed: "https://podcasts.files.bbci.co.uk/b00729d9.rss", key: "9eczqcl0hc7z", show: "The Reith Lectures", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/1a/73/9d/1a739dcb-471e-896a-a93a-aa9cca5a50ce/mza_14978815171596890626.jpg/600x600bb.jpg", title: "Walk to Patagonia", by: "John Searle", why: "Reith Lecture, 1984." },
      { kind: "episode", feed: "https://podcasts.files.bbci.co.uk/b00729d9.rss", key: "1w98iss1t13oxz", show: "The Reith Lectures", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/1a/73/9d/1a739dcb-471e-896a-a93a-aa9cca5a50ce/mza_14978815171596890626.jpg/600x600bb.jpg", title: "A Changing Reality", by: "John Searle", why: "Reith Lecture, 1984." },
      { kind: "episode", feed: "https://podcasts.files.bbci.co.uk/b00729d9.rss", key: "a649qsm0mylj", show: "The Reith Lectures", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/1a/73/9d/1a739dcb-471e-896a-a93a-aa9cca5a50ce/mza_14978815171596890626.jpg/600x600bb.jpg", title: "The Freedom of the Will", by: "John Searle", why: "Reith Lecture, 1984." },
    ],
  },
  {
    id: "w-k-wimsatt", name: "W. K. Wimsatt", wiki: "William_K._Wimsatt", born: "1907", died: "1975",
    what: "American literary theorist and critic at Yale associated with New Criticism.",
    role: "With Beardsley, named the intentional fallacy: judge the words, not a guess at what the author meant.",
    ol: ["OL1873231A","OL4452374A","OL7709563A","OL11416918A","OL10830863A","OL11528193A","OL5973401A"],
    books: [
      { title: "The Prose Style of Samuel Johnson", year: 1941, ol: "OL6835301W" },
      { title: "Philosophic Words: A Study of Style and Meaning in the Rambler and Dictionary of Samuel Johnson", year: 1948, ol: "OL6835297W" },
      { title: "English Stage Comedy", year: 1955, ol: "OL6835300W", note: "edited (English Institute Essays); OL first-publish year 1954" },
      { title: "The Verbal Icon: Studies in the Meaning of Poetry", year: 1954, ol: "OL6835302W", note: "with two essays by Monroe Beardsley" },
      { title: "Literary Criticism: A Short History", year: 1957, ol: "OL12470832W", note: "with Cleanth Brooks" },
      { title: "Explication as Criticism", year: 1963, ol: "OL9348919W", note: "edited" },
      { title: "Hateful Contraries: Studies in Literature and Criticism", year: 1965, ol: "OL6835288W", note: "Wikipedia gives 1965; OL first-publish year 1966" },
      { title: "The Portraits of Alexander Pope", year: 1965, ol: "OL6835290W" },
      { title: "The Idea of Comedy: Essays in Prose and Verse", year: 1969, ol: "OL6835289W", note: "edited" },
      { title: "Dr Johnson on Shakespeare", year: 1969, ol: "OL10672657W", note: "edited; OL year" },
      { title: "Versification: Major Language Types", year: 1972, ol: "OL6835292W", note: "edited; OL year" },
      { title: "Day of the Leopards", year: 1976, ol: "OL6835286W", note: "OL year" },
    ],
    articles: [
      { title: "The Intentional Fallacy", year: 1946, venue: "Sewanee Review 54, pp. 468-488", note: "with Monroe Beardsley; revised in The Verbal Icon (1954); no DOI found" },
      { title: "The Affective Fallacy", year: 1949, venue: "Sewanee Review 57(1), pp. 31-55", note: "with Monroe Beardsley; citation from the Wikipedia 'Affective fallacy' article as shown in search results; no DOI found" },
      { title: "The Game of Ombre in The Rape of the Lock", year: 1950, venue: "The Review of English Studies I(1)", doi: "10.1093/res/i.1.136" },
      { title: "The Concept of Meter: An Exercise in Abstraction", year: 1959, venue: "PMLA 74", doi: "10.2307/460509", note: "with Monroe Beardsley" },
    ],
    talks: [

    ],
    audio: [

    ],
  },
  {
    id: "monroe-beardsley", name: "Monroe Beardsley", wiki: "Monroe_Beardsley", born: "1915", died: "1985",
    what: "American philosopher of art and author of logic and critical-thinking textbooks.",
    role: "With Wimsatt, named the intentional fallacy; wrote textbooks on diagramming arguments.",
    ol: ["OL1461918A","OL10615116A","OL2286650A","OL3383573A","OL5548385A","OL6226389A"],
    books: [
      { title: "Practical Logic", year: 1950, ol: "OL5918846W" },
      { title: "Thinking Straight: Principles of Reasoning for Readers and Writers", year: 1950, ol: "OL5918853W" },
      { title: "Aesthetics: Problems in the Philosophy of Criticism", year: 1958, ol: "OL5918848W", note: "2nd ed. 1981" },
      { title: "The European Philosophers from Descartes to Nietzsche", year: 1960, ol: "OL5918851W", note: "edited anthology; OL year" },
      { title: "Theme and Form", year: 1962, ol: "OL5918849W", note: "OL year" },
      { title: "Philosophical Thinking", year: 1965, ol: "OL5918852W", note: "OL year" },
      { title: "Aesthetics from Classical Greece to the Present: A Short History", year: 1966, ol: "OL5918850W" },
      { title: "Modes of Argument", year: 1967, ol: "OL5918842W", note: "OL year" },
      { title: "Aesthetic Inquiry: Essays on Art Criticism and the Philosophy of Art", year: 1967, ol: "OL10420776W", note: "edited with Herbert Schueller; OL year" },
      { title: "Literature and Aesthetics", year: 1968, ol: "OL5918841W", note: "OL year" },
      { title: "The Possibility of Criticism", year: 1970, ol: "OL5918845W" },
      { title: "Writing with Reason", year: 1976, ol: "OL5918843W", note: "OL year" },
      { title: "The Aesthetic Point of View: Selected Essays", year: 1982, ol: "OL5918844W", note: "OL year" },
    ],
    articles: [
      { title: "The Intentional Fallacy", year: 1946, venue: "Sewanee Review 54, pp. 468-488", note: "with W. K. Wimsatt; no DOI found" },
      { title: "The Affective Fallacy", year: 1949, venue: "Sewanee Review 57(1), pp. 31-55", note: "with W. K. Wimsatt; no DOI found" },
      { title: "The Concept of Meter: An Exercise in Abstraction", year: 1959, venue: "PMLA 74", doi: "10.2307/460509", note: "with W. K. Wimsatt" },
      { title: "The Metaphorical Twist", year: 1962, venue: "Philosophy and Phenomenological Research 22", doi: "10.2307/2104415" },
      { title: "Aesthetic Experience Regained", year: 1969, venue: "The Journal of Aesthetics and Art Criticism 28", doi: "10.2307/428903" },
      { title: "Metaphorical Senses", year: 1978, venue: "Noûs 12", doi: "10.2307/2214651" },
    ],
    talks: [

    ],
    audio: [

    ],
  },
  {
    id: "douglas-walton", name: "Douglas Walton", wiki: "Douglas_N._Walton", born: "1942", died: "2020",
    what: "Canadian scholar of argumentation, fallacies and informal logic.",
    role: "Catalogued the kinds of argument and the critical questions each must answer.",
    ol: ["OL20721A"], orcid: "0000-0003-0728-1370",
    books: [
      { title: "Logical Dialogue-Games and Fallacies", year: 1984, ol: "OL14852701W" },
      { title: "Informal Fallacies", year: 1987, ol: "OL14852699W" },
      { title: "Informal Logic: A Handbook for Critical Argumentation", year: 1989, ol: "OL14852718W", note: "2nd ed. 2008 (Informal Logic: A Pragmatic Approach)" },
      { title: "Practical Reasoning: Goal-Driven, Knowledge-Based, Action-Guiding Argumentation", year: 1990, ol: "OL14852709W" },
      { title: "Begging the Question: Circular Reasoning as a Tactic of Argumentation", year: 1991, ol: "OL14852716W" },
      { title: "Slippery Slope Arguments", year: 1992, ol: "OL14852713W" },
      { title: "Commitment in Dialogue: Basic Concepts of Interpersonal Reasoning", year: 1995, ol: "OL14852695W", note: "with Erik C. W. Krabbe" },
      { title: "A Pragmatic Theory of Fallacy", year: 1995, ol: "OL14852710W" },
      { title: "Argumentation Schemes for Presumptive Reasoning", year: 1996, ol: "OL14852691W" },
      { title: "Arguments from Ignorance", year: 1996, ol: "OL14852692W" },
      { title: "The New Dialectic", year: 1998, ol: "OL14852704W", doi: "10.3138/9781442681859" },
      { title: "Ad Hominem Arguments", year: 1998, ol: "OL14852686W" },
      { title: "Fundamentals of Critical Argumentation", year: 2006, ol: "OL14852698W", doi: "10.1017/cbo9780511807039", note: "Wikipedia 2006; Crossref and OL give 2005" },
      { title: "Argumentation Schemes", year: 2008, ol: "OL14852690W", note: "with Chris Reed and Fabrizio Macagno" },
      { title: "Methods of Argumentation", year: 2013, ol: "OL20363836W", doi: "10.1017/cbo9781139600187" },
    ],
    articles: [
      { title: "Burden of Proof", year: 1988, venue: "Argumentation 2", doi: "10.1007/bf00178024" },
      { title: "Dialogue Theory for Critical Thinking", year: 1989, venue: "Argumentation 3", doi: "10.1007/bf00128147" },
      { title: "Commitment, Types of Dialogue, and Fallacies", year: 1992, venue: "Informal Logic 14(2)", doi: "10.22329/il.v14i2.2532" },
      { title: "Argumentation Schemes and Historical Origins of the Circumstantial Ad Hominem Argument", year: 2004, venue: "Argumentation 18", doi: "10.1023/b:argu.0000046706.45919.83" },
      { title: "Argument Diagramming in Logic, Law and Artificial Intelligence", year: 2007, venue: "The Knowledge Engineering Review 22", doi: "10.1017/s0269888907001051", note: "with Chris Reed and Fabrizio Macagno" },
      { title: "The Carneades Model of Argument and Burden of Proof", year: 2007, venue: "Artificial Intelligence 171", doi: "10.1016/j.artint.2007.04.010", note: "with Thomas F. Gordon and Henry Prakken" },
      { title: "Visualization Tools, Argumentation Schemes and Expert Opinion Evidence in Law", year: 2007, venue: "Law, Probability and Risk 6", doi: "10.1093/lpr/mgm033" },
    ],
    talks: [

    ],
    audio: [

    ],
  },
  {
    id: "henry-prakken", name: "Henry Prakken",
    what: "Researcher in AI and law and formal models of argumentation at Utrecht University.",
    role: "Set out the three ways to attack an argument: rebut, undermine, undercut.",
    ol: ["OL395560A","OL5927710A"], orcid: "0000-0002-3431-7757",
    books: [
      { title: "Logical Tools for Modelling Legal Argument: A Study of Defeasible Reasoning in Law", year: 1997, ol: "OL2705443W", doi: "10.1007/978-94-015-8975-8", note: "1993 thesis version is OL13016448W under OL5927710A 'Hendrik Prakken'" },
      { title: "Logical Models of Legal Argumentation", year: 1997, ol: "OL20800264W", doi: "10.1007/978-94-011-5668-4", note: "edited with Giovanni Sartor; OL gives 2012" },
      { title: "Legal Knowledge Based Systems (JURIX)", year: 1994, ol: "OL18834148W", note: "edited proceedings; OL year" },
      { title: "Norms, Logics and Information Systems", year: 1999, ol: "OL19482421W", note: "edited with Paul McNamara; OL year" },
    ],
    articles: [
      { title: "A Dialectical Model of Assessing Conflicting Arguments in Legal Reasoning", year: 1996, venue: "Artificial Intelligence and Law 4", doi: "10.1007/bf00118496", note: "with Giovanni Sartor" },
      { title: "Logics for Defeasible Argumentation", year: 2001, venue: "Handbook of Philosophical Logic (2nd ed.)", doi: "10.1007/978-94-017-0456-4_3", note: "with Gerard Vreeswijk" },
      { title: "Coherence and Flexibility in Dialogue Games for Argumentation", year: 2005, venue: "Journal of Logic and Computation 15", doi: "10.1093/logcom/exi046" },
      { title: "Formal Systems for Persuasion Dialogue", year: 2006, venue: "The Knowledge Engineering Review 21", doi: "10.1017/s0269888906000865" },
      { title: "The Carneades Model of Argument and Burden of Proof", year: 2007, venue: "Artificial Intelligence 171", doi: "10.1016/j.artint.2007.04.010", note: "with Gordon and Walton" },
      { title: "An Abstract Framework for Argumentation with Structured Arguments", year: 2010, venue: "Argument & Computation 1", doi: "10.1080/19462160903564592", note: "ASPIC+" },
      { title: "A General Account of Argumentation with Preferences", year: 2013, venue: "Artificial Intelligence 195", doi: "10.1016/j.artint.2012.10.008", note: "with Sanjay Modgil" },
      { title: "The ASPIC+ Framework for Structured Argumentation: A Tutorial", year: 2014, venue: "Argument & Computation 5", doi: "10.1080/19462166.2013.869766", note: "with Sanjay Modgil" },
    ],
    talks: [
      talk("YgxM2LbjV-0", "Prof. Henry Prakken | On how expert witnesses can give useful Bayesian analyses of complex criminal", "INI Seminar Room 1", "Seminar at the Isaac Newton Institute, Cambridge."),
      talk("g-5MQz76oEM", "On the relevance of algorithmicdecision predictors for judicial decision making | Prakken, Henry", "IAAIL - International Association for AI and Law", "Talk on the IAAIL (ICAIL conference) channel."),
    ],
    audio: [

    ],
  },
  {
    id: "chris-reed", name: "Chris Reed",
    what: "Professor of Computer Science and Philosophy at the University of Dundee and director of the Centre for Argument Technology (ARG-tech).",
    role: "Directs the Centre for Argument Technology at Dundee; co-author of the Argument Interchange Format and Inference Anchoring Theory.",
    ol: [], orcid: "0000-0002-6849-1374",
    books: [
      { title: "Argumentation Machines: New Frontiers in Argument and Computation", year: 2003, ol: "OL18536962W", note: "edited with Timothy J. Norman; OL year (2004 edition also OL19827774W)" },
      { title: "Argumentation Schemes", year: 2008, ol: "OL14852690W", note: "with Douglas Walton and Fabrizio Macagno" },
      { title: "Argumentation in Multi-Agent Systems", year: null, ol: "OL20706099W", note: "edited with Iyad Rahwan and Pavlos Moraitis (ArgMAS proceedings); OL gives 2008, year not confirmed" },
      { title: "Dialectics, Dialogue and Argumentation: An Examination of Douglas Walton's Theories of Reasoning and Argument", year: 2010, note: "edited with C. W. Tindale; per Walton's Wikipedia page" },
    ],
    articles: [
      { title: "Araucaria: Software for Argument Analysis, Diagramming and Representation", year: 2004, venue: "International Journal on Artificial Intelligence Tools 13", doi: "10.1142/s0218213004001922", note: "with Glenn Rowe" },
      { title: "On Argumentation Schemes and the Natural Classification of Arguments", year: 2004, venue: "Argumentation 18", doi: "10.1023/b:argu.0000024044.34360.82", note: "with Joel Katzav" },
      { title: "Towards an Argument Interchange Format", year: 2006, venue: "The Knowledge Engineering Review 21", doi: "10.1017/s0269888906001044", note: "Chesñevar, McGinnis, Modgil, Rahwan, Reed et al." },
      { title: "Argument Diagramming in Logic, Law and Artificial Intelligence", year: 2007, venue: "The Knowledge Engineering Review 22", doi: "10.1017/s0269888907001051", note: "with Walton and Macagno" },
      { title: "Implementing the Argument Web", year: 2013, venue: "Communications of the ACM 56", doi: "10.1145/2500891", note: "Bex, Lawrence, Snaith, Reed" },
      { title: "OVA+: An Argument Analysis Interface", year: 2014, venue: "COMMA 2014 (Frontiers in AI and Applications)", doi: "10.3233/978-1-61499-436-7-463", note: "with Janier and Lawrence" },
      { title: "Argument Mining: A Survey", year: 2020, venue: "Computational Linguistics 45(4)", doi: "10.1162/coli_a_00364", note: "with John Lawrence; Crossref issued date 2020, volume 45 (2019)" },
      { title: "Argumentum Ad Alia: Argument Structure of Arguing about What Others Have Said", year: 2023, venue: "Synthese 201", doi: "10.1007/s11229-023-04058-w", note: "with Katarzyna Budzynska" },
    ],
    talks: [
      talk("G46KeuMcptA", "“Time for a Good Argument” Prof. Chris Reed (ICAART 2015)", "YoutubeINSTICC", "Keynote at ICAART 2015."),
      talk("Owpd6_Rxx0M", "Professor Chris Reed - ARG-tech Director, BBC Project, Moral Maze & Abortion on Trial", "ARG-tech", "On ARG-tech's work with the BBC (Moral Maze)."),
      talk("KzMKBzmF6vo", "Spotlight Video Series - Chris Reed", "ARG-tech", "ARG-tech spotlight interview."),
      talk("i9DV2S2cLUs", "An Insider's Guide to Artificial Intelligence with Professor Chris Reed, University of Dundee", "ContactEngine", "Talk/interview on AI."),
      talk("mZvnbi4MpPY", "Arg Tech: The Missing Layer for Decisions in AI Era | AI 시대 의사결정의 핵심, 논증 기술 | Chris Reed x DeepSkill", "DeepSkill", "Interview on argument technology."),
    ],
    audio: [

    ],
  },
  {
    id: "katarzyna-budzynska", name: "Katarzyna Budzynska",
    what: "Researcher in argumentation at Cardinal Stefan Wyszynski University in Warsaw, working with the Centre for Argument Technology on argument mining and ethos.",
    role: "Developed Inference Anchoring Theory, which ties what speakers do to the arguments they make.",
    ol: [], orcid: "0000-0001-9674-9902",
    books: [

    ],
    articles: [
      { title: "Argument Analysis: Components of Interpersonal Argumentation", year: 2010, venue: "COMMA 2010 (Frontiers in AI and Applications)", doi: "10.3233/978-1-60750-619-5-135" },
      { title: "Introduction: Argument Studies in Poland", year: 2014, venue: "Argumentation 28", doi: "10.1007/s10503-014-9319-1", note: "with Marcin Koszowy" },
      { title: "Towards Argument Mining from Dialogue", year: 2014, venue: "COMMA 2014 (Frontiers in AI and Applications)", doi: "10.3233/978-1-61499-436-7-185", note: "with Janier, Kang, Reed et al." },
      { title: "Mining Ethos in Political Debate", year: 2016, venue: "COMMA 2016 (Frontiers in AI and Applications)", doi: "10.3233/978-1-61499-686-6-299", note: "with Rory Duthie and Chris Reed" },
      { title: "A Deep Modular RNN Approach for Ethos Mining", year: 2018, venue: "Proceedings of IJCAI 2018", doi: "10.24963/ijcai.2018/562", note: "with Rory Duthie" },
      { title: "Advances in Argument Mining", year: 2019, venue: "Proceedings of ACL 2019 (tutorial abstracts)", doi: "10.18653/v1/p19-4008", note: "with Chris Reed" },
      { title: "Argumentation in the 2016 US Presidential Elections: Annotated Corpora of Television Debates and Social Media Reaction", year: 2019, venue: "Language Resources and Evaluation 54", doi: "10.1007/s10579-019-09446-8", note: "Visser, Konat, Duthie, Koszowy, Budzynska, Reed" },
      { title: "Argumentum Ad Alia: Argument Structure of Arguing about What Others Have Said", year: 2023, venue: "Synthese 201", doi: "10.1007/s11229-023-04058-w", note: "with Chris Reed" },
    ],
    talks: [
      talk("2T8NvQOw1t8", "Dr. Hab. Katarzyna Budzynska - BBC Project, Recruiting, Training & Analysis", "ARG-tech", "On ARG-tech's BBC debate analysis project."),
      talk("qmHOeqHhwvg", "Katarzyna Budzyńska: Introduction to argumentation theory across disciplines", "International Center for Formal Ontology", "Lecture introducing argumentation theory."),
      talk("3OOqWR3CZQs", "Katarzyna Budzynska: Is ad hominem a support? Normative vs. descriptive models of language use", "Katedra logiky a metodológie vied", "Talk at a Slovak university logic department."),
      talk("fRGICLi5zoA", "UMAP'20 ExUM workshop opening and keynote by Katarzyna Budzynska: Computational Ethos", "ACM SIGCHI", "Keynote on computational ethos, 2020."),
    ],
    audio: [

    ],
  },
  {
    id: "klaus-krippendorff", name: "Klaus Krippendorff", wiki: "Klaus_Krippendorff", born: "1932", died: "2022",
    what: "German-American cyberneticist and communication scholar at the Annenberg School, known for content analysis and Krippendorff's alpha.",
    role: "Gave the measure of agreement between readers that practice reports, Krippendorff's alpha.",
    ol: ["OL1196521A","OL10744609A"], orcid: "0000-0001-8043-608X",
    books: [
      { title: "Communication and Control in Society", year: 1979, ol: "OL18260682W", note: "OL year" },
      { title: "Content Analysis: An Introduction to Its Methodology", year: 1980, ol: "OL5282413W", note: "3rd ed. 2012" },
      { title: "A Dictionary of Cybernetics", year: 1986 },
      { title: "Information Theory: Structural Models for Qualitative Data", year: 1986, ol: "OL5282412W" },
      { title: "Design: A Discourse on Meaning", year: 1994 },
      { title: "The Semantic Turn: A New Foundation for Design", year: 2006, ol: "OL5282411W", note: "Wikipedia 2006; OL 2005" },
      { title: "The Content Analysis Reader", year: 2009, ol: "OL18594803W", note: "edited with Mary Angela Bock" },
      { title: "On Communicating: Otherness, Meaning, and Information", year: 2009, ol: "OL25202071W", note: "ed. Fernando Bermejo" },
      { title: "Die Semantische Wende", year: 2013, ol: "OL25656941W" },
      { title: "The Reliability of Generating Data", year: 2022, ol: "OL22151901W", doi: "10.1201/9781003112020", note: "OL gives 2020; Crossref 2022" },
    ],
    articles: [
      { title: "Estimating the Reliability, Systematic Error and Random Error of Interval Data", year: 1970, venue: "Educational and Psychological Measurement 30", doi: "10.1177/001316447003000105" },
      { title: "On Generating Data in Communication Research", year: 1970, venue: "Journal of Communication 20", doi: "10.1111/j.1460-2466.1970.tb00883.x" },
      { title: "On the Essential Contexts of Artifacts or on the Proposition That 'Design Is Making Sense (of Things)'", year: 1989, venue: "Design Issues 5", doi: "10.2307/1511512" },
      { title: "Reliability in Content Analysis: Some Common Misconceptions and Recommendations", year: 2004, venue: "Human Communication Research 30", doi: "10.1111/j.1468-2958.2004.tb00738.x" },
      { title: "Answering the Call for a Standard Reliability Measure for Coding Data", year: 2007, venue: "Communication Methods and Measures 1", doi: "10.1080/19312450709336664", note: "with Andrew F. Hayes" },
      { title: "Systematic and Random Disagreement and the Reliability of Nominal Data", year: 2008, venue: "Communication Methods and Measures 2", doi: "10.1080/19312450802467134" },
      { title: "Agreement and Information in the Reliability of Coding", year: 2011, venue: "Communication Methods and Measures 5", doi: "10.1080/19312458.2011.568376" },
    ],
    talks: [
      talk("Xi10xX_Kw1Y", "Professor Klaus Krippendorff on the Key Concepts of The Semantic Turn", "Annenberg School for Communication", "On the ideas of The Semantic Turn."),
      talk("MCAm_1EiMYc", "Klaus Krippendorff Lecture at Annenberg West", "Annenberg School for Communication", "Lecture at Annenberg West."),
      talk("V9sbKEtlvls", "Klaus Krippendorff with David Raizman, The Drexel InterView (Season 13)", "The Drexel InterView", "TV interview."),
      talk("jYnSbNobc3Y", "Klaus Krippendorff: Four theories of using language", "Club of Remy", "Talk to the Club of Remy."),
      talk("Y9BqQ1tIzSk", "Klaus Krippendorff: Why Problem-Solving Becomes A Problem?", "Club of Remy", "Talk to the Club of Remy."),
      talk("c4pgxj8krTs", "Klaus Krippendorff: Conversations and their Pathologies", "Club of Remy", "Talk to the Club of Remy."),
      talk("_rgkmrYe6m8", "Klaus Krippendorff: Seven Complexities of Social Organizations", "Club of Remy", "Talk to the Club of Remy."),
    ],
    audio: [
      { kind: "episode", feed: "https://feeds.transistor.fm/architects-of-communication-scholarship", key: "1p169egpredc3", show: "Architects of Communication Scholarship", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/b4/10/45/b41045d2-65bd-9583-c83e-f0c0c33154d4/mza_17536224544283203214.jpg/600x600bb.jpg", title: "Architects of Communication Scholarship - Klaus Krippendorff on Cybernetics and Content Analysis", by: "Architects of Communication Scholarship", why: "Guest, 2022." },
    ],
  },
  {
    id: "philip-dawid", name: "Philip Dawid", wiki: "Philip_Dawid", born: "1946",
    what: "British statistician working on Bayesian inference, probabilistic expert systems, causal inference and forensic statistics.",
    role: "With Skene, showed how to weigh many readers' answers by how often each is right (1979).",
    ol: ["OL2684148A","OL3381779A"], orcid: "0000-0002-7410-6882",
    books: [
      { title: "Probabilistic Networks and Expert Systems", year: 1999, ol: "OL18302418W", note: "with Cowell, Lauritzen and Spiegelhalter; 2001 DeGroot Prize" },
      { title: "Evidence, Inference and Enquiry", year: 2011, ol: "OL16652755W", note: "edited with William Twining and Mimi Vasilaki" },
    ],
    articles: [
      { title: "Marginalization Paradoxes in Bayesian and Structural Inference", year: 1973, venue: "Journal of the Royal Statistical Society B 35", doi: "10.1111/j.2517-6161.1973.tb00952.x", note: "with M. Stone and J. V. Zidek" },
      { title: "Maximum Likelihood Estimation of Observer Error-Rates Using the EM Algorithm", year: 1979, venue: "Applied Statistics 28(1), p. 20-28", doi: "10.2307/2346806", note: "with Allan M. Skene; the Dawid-Skene model" },
      { title: "Conditional Independence in Statistical Theory", year: 1979, venue: "Journal of the Royal Statistical Society B 41", doi: "10.1111/j.2517-6161.1979.tb01052.x" },
      { title: "The Well-Calibrated Bayesian", year: 1982, venue: "Journal of the American Statistical Association 77", doi: "10.1080/01621459.1982.10477856" },
      { title: "Present Position and Potential Developments: Some Personal Views: Statistical Theory: The Prequential Approach", year: 1984, venue: "Journal of the Royal Statistical Society A 147", doi: "10.2307/2981683" },
      { title: "Applications of a General Propagation Algorithm for Probabilistic Expert Systems", year: 1992, venue: "Statistics and Computing 2", doi: "10.1007/bf01890546" },
      { title: "Hyper Markov Laws in the Statistical Analysis of Decomposable Graphical Models", year: 1993, venue: "The Annals of Statistics 21", doi: "10.1214/aos/1176349260", note: "with Steffen Lauritzen" },
      { title: "Causal Inference without Counterfactuals", year: 2000, venue: "Journal of the American Statistical Association 95", doi: "10.1080/01621459.2000.10474210" },
    ],
    talks: [
      talk("MmVB_hMY7ZY", "Prof. Philip Dawid | An Introduction to Bayesian Networks", "INI Seminar Room 1", "Isaac Newton Institute lecture."),
      talk("5S02EAP9Mzk", "Philip Dawid - DeFinetti Lecture - ISBA World Meeting 2018", "ISBA - International Society of Bayesian Analysis", "de Finetti Lecture, 2018."),
      talk("0uFmoytcjHU", "Interview with Philip Dawid", "Online Causal Inference Seminar", "Interview."),
      talk("F_nOhX-Vn1U", "Philip Dawid - Causal Inference Is Just Bayesian Decision Theory", "Bayesian Causal Inference", "Talk on decision-theoretic causal inference."),
      talk("BKIgZ90I4W0", "Philip Dawid - Asymptotic Behaviour of Prediction Markets", "DIMACS CCICADA", "Talk at DIMACS."),
    ],
    audio: [

    ],
  },
  {
    id: "a-m-skene", name: "A. M. Skene",
    what: "Statistician, co-author with A. P. Dawid of the 1979 paper on estimating observer error rates with the EM algorithm.",
    role: "With Dawid, showed how to weigh many readers' answers by how often each is right (1979).",
    ol: [],
    books: [

    ],
    articles: [
      { title: "Maximum Likelihood Estimation of Observer Error-Rates Using the EM Algorithm", year: 1979, venue: "Applied Statistics 28(1), p. 20-28", doi: "10.2307/2346806", note: "with A. P. Dawid" },
      { title: "Comparison of Discrimination Techniques Applied to a Complex Data Set of Head Injured Patients", year: 1981, venue: "Journal of the Royal Statistical Society A 144", doi: "10.2307/2981918", note: "Titterington, Murray, Murray et al.; Skene listed as co-author by MaRDI portal" },
      { title: "The Implementation of the Bayesian Paradigm", year: 1985, venue: "Communications in Statistics - Theory and Methods 14", doi: "10.1080/03610928508828963", note: "Smith, Skene, Shaw et al." },
      { title: "Bayesian Modelling and Sensitivity Analysis", year: 1986, venue: "The Statistician 35", doi: "10.2307/2987533", note: "with J. E. H. Shaw and T. D. Lee" },
      { title: "The Evaluation of Fibre Transfer Evidence in Forensic Science: A Case Study in Statistical Modelling", year: 1991, venue: "Applied Statistics 40", doi: "10.2307/2347526", note: "Wakefield, Skene, Smith et al." },
    ],
    talks: [

    ],
    audio: [

    ],
  },
  {
    id: "quintilian", name: "Quintilian",
    listen: [
      { kind: "audiobook", id: "4206", title: "Institutio Oratoria, volume 1", by: "Quintilian", why: "Books 1 to 3 in H. E. Butler's translation; the issues (stasis) are Book 3, chapter 6, in sections 22 and 23." },
      { kind: "audiobook", id: "14728", title: "Institutio Oratoria, volume 2", by: "Quintilian", why: "Books 4 to 6." },
    ], wiki: "Quintilian", born: "c. 35", died: "c. 100",
    what: "Roman rhetorician from Hispania, author of the Institutio Oratoria, a twelve-book textbook on the training of an orator.",
    role: "Taught the issues (stasis) in Book 3 of the Institutio Oratoria.",
    ol: ["OL117020A","OL10395564A","OL10558737A"],
    books: [
      { title: "Institutio Oratoria", year: 95, ol: "OL10314048W", note: "written c. 95 AD; twelve books; only surviving work" },
      { title: "Declamationes Maiores (attributed)", year: null, ol: "OL26514564W", note: "authorship disputed; OL work is Loeb 'Major Declamations, Volume I'" },
      { title: "Declamationes Minores (attributed)", year: null, ol: "OL9278132W", note: "authorship disputed" },
    ],
    articles: [

    ],
    talks: [

    ],
    audio: [

    ],
  },];

/** A scholar by id or by name, as person pages are addressed. */
export const scholarNamed = (s: string): Scholar | undefined => {
  const k = s.trim().toLowerCase();
  return SCHOLARS.find((x) => x.id === k || x.name.toLowerCase() === k);
};

export const scholarHref = (x: Pick<Scholar, "name">) => `/schole/people/${encodeURIComponent(x.name)}`;
