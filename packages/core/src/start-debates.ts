/**
 * Courses on the quarrels new art and new inventions start (Torian, 2026-11-16 22:33Z: "courses around subjects of
 * dialectics for art, such as the different schools as they arise with Impressionism in France and the contentious
 * debates that were going on in relation to the more traditional art forms. Likewise, dialectics during the industrial
 * era ... new inventions and new art styles often cause dialectics to arise, which echo very much dialectics from the
 * past").
 *
 * Each course runs from an ancient quarrel to one of today, so the echo can be heard: Plato's "ancient quarrel between
 * philosophy and poetry" (Republic 607b) and Aristotle's answer in the Poetics open the course on art; Plato on writing
 * (Phaedrus 274c-275b) and Aristotle's shuttles that weave by themselves (Politics 1253b33-1254a1) open the course on
 * machines. Each unit is a playlist with the question argued in it, the way the old teachers of dialectic found the
 * question at issue before arguing it.
 *
 * Every recording was checked to exist: LibriVox ids against `web/src/data/audiobooks.txt`, In Our Time keys against
 * the feed, YouTube ids with oEmbed, and the Art Institute of Chicago's works and exhibition histories with its API.
 * Object literals only: `collections.ts` imports this. Pure: no I/O.
 */
import type { Collection, CollectionItem, FindMedium } from "./collections";

const ED = "Reflect's editors";
const IOT = { feed: "https://podcasts.files.bbci.co.uk/b006qykl.rss", show: "In Our Time", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/f3/12/e7/f312e703-b626-0091-5bdf-73d79cce25c5/mza_16900938594910783199.jpg/600x600bb.jpg" };
const book = (id: string, title: string, by: string, why: string): CollectionItem => ({ kind: "audiobook", id, title, by, why });
const iot = (key: string, title: string, why: string): CollectionItem => ({ kind: "episode", ...IOT, key, title, by: "Melvyn Bragg and guests", why });
const yt = (medium: FindMedium, id: string, title: string, by: string, why: string): CollectionItem =>
  ({ kind: "find", medium, title, by, url: `https://www.youtube.com/watch?v=${id}`, image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, why });
const aic = (id: number, image: string, title: string, by: string, why: string): CollectionItem =>
  ({ kind: "find", medium: "art", title, by, url: `https://www.artic.edu/artworks/${id}`, image: `https://www.artic.edu/iiif/2/${image}/full/400,/0/default.jpg`, why });

export const ART_DEBATE_PLAYLISTS: readonly Collection[] = [
  {
    id: "art-plato-poets", name: "Plato's quarrel with the poets", by: ED, for: [],
    about: "The first quarrel over art. Plato would let the poets into his city only if someone could show they did more good than harm; Aristotle answered that imitation is how people learn. Every later fight over a new art repeats one side or the other.",
    items: [
      book("2707", "Republic", "Plato", "Book 10 sends the poets out of the city and calls it an ancient quarrel between philosophy and poetry (607b)."),
      book("1171", "Ion", "Plato", "Socrates asks a reciter of Homer what he knows, and concludes that poets speak by inspiration, not by an art."),
      yt("discussion", "Ywvq__cHtjA", "The Ancient Quarrel Between Philosophy and Poetry", "Michael K. Kellogg and K. Chris Todd, College Year in Athens", "The quarrel itself, from Homer to Plato."),
      book("240", "Poetics", "Aristotle", "The answer: people learn first by imitating, and take pleasure in imitations (chapter 4)."),
      iot("1fz6jno1uhchrz", "Aristotle's Poetics", "What the Poetics argues about tragedy, and why it lasted."),
      book("18997", "Defense of Poesy", "Sir Philip Sidney", "The Renaissance reply, to Stephen Gosson's attack on poets and players, The School of Abuse (1579), and to Plato's banishment."),
    ],
  },
  {
    id: "art-ancients-moderns", name: "The Ancients and the Moderns", by: ED, for: [],
    about: "In the 1680s and 1690s France and England argued whether the moderns could equal the ancients in poetry, art and learning. The Renaissance had already told the story of art as a climb back to the ancients and past them.",
    items: [
      iot("50r40jv9rdtu", "Giorgio Vasari's Lives of the Artists", "The book of 1550 that told art's history as a rebirth after the Middle Ages."),
      book("3175", "Lives of the Most Eminent Painters, Sculptors and Architects, Volume 1", "Giorgio Vasari", "The preface and the first lives, from Cimabue and Giotto: the start of the climb that Vasari ends with Michelangelo."),
      yt("lecture", "THY_pcp72ys", "The Battle of the Books: Context, Summary, Analysis", "The Discourse", "The English side of the quarrel, between Sir William Temple and the scholars Wotton and Bentley."),
      book("13779", "Battle of the Books", "Jonathan Swift", "Swift's satire of 1704: the books in the King's Library go to war, ancients against moderns."),
    ],
  },
  {
    id: "art-impressionism", name: "Impressionism against the Academy and the Salon", by: ED, for: [],
    about: "In Paris the Academy's Salon decided which paintings the public saw. From Courbet's realism to the Salon des Refusés of 1863 and the Impressionists' own exhibitions from 1874, painters of modern life fought its jury and its critics over what a finished painting is and what it may show.",
    items: [
      yt("lecture", "FfehaHSdpD0", "How Impressionism Began", "National Gallery of Art", "The Salon system, and the painters who left it."),
      yt("lecture", "HNZTmnngqrM", "Courbet, A Burial at Ornans, 1849-50", "Smarthistory", "An ordinary village funeral at the size kept for history painting, shown at the Salon of 1850-51. Its critics called it ugly."),
      yt("lecture", "3xBGF8H3bQ4", "Manet, Le Déjeuner sur l'herbe", "Smarthistory", "Rejected by the jury of 1863 and shown at the Salon des Refusés, which Napoleon III ordered after the jury turned down thousands of works."),
      yt("lecture", "bihBbqzL96Y", "Manet, Olympia", "Smarthistory", "Accepted by the Salon of 1865, and the scandal of the year."),
      aic(94841, "48b2de88-ba73-8e19-f448-d1cef4a1c847", "The Song of the Lark", "Jules Breton, 1884", "Shown at the Salon of 1885: the kind of painting the Salon hung."),
      aic(16571, "0f1cc0e0-e42e-be16-3f71-2022da38cb93", "Arrival of the Normandy Train, Gare Saint-Lazare", "Claude Monet, 1877", "Shown at the third Impressionist exhibition, 1877: a train shed, smoke and steam as the subject of a painting."),
      aic(20684, "f8fd76e9-c396-5678-36ed-6a348c904d27", "Paris Street; Rainy Day", "Gustave Caillebotte, 1877", "In the same exhibition: the new boulevards of Paris, at the size of a history painting."),
      yt("lecture", "D9AHDXQm7IM", "The Impressionist Revolution 1874-1886", "National Gallery of Art", "The eight exhibitions the Impressionists held themselves, from 1874 to 1886."),
      aic(27992, "2d484387-2509-5e8e-2c43-22f9981972eb", "A Sunday on La Grande Jatte — 1884", "Georges Seurat, 1884-86", "Shown at the eighth and last Impressionist exhibition, 1886. Monet and Renoir did not take part."),
      book("11267", "His Masterpiece", "Émile Zola", "Zola's novel of 1886 about a painter of modern life, the Salon des Refusés and the jury, by the critic who had defended Manet."),
    ],
  },
  {
    id: "art-whistler-ruskin", name: "Art for art's sake: Whistler against Ruskin", by: ED, for: [],
    about: "In 1877 Ruskin, the most famous critic in England, wrote that Whistler had flung a pot of paint in the public's face. Whistler sued him for libel. The trial of 1878 put the question in court: does a painting have to be useful, true or moral, or is it enough that it is beautiful?",
    items: [
      yt("lecture", "DUL-uANWKkQ", "Whistler's Nocturne in Black and Gold, the Falling Rocket", "Smarthistory", "The painting Ruskin attacked."),
      aic(56905, "50034c7f-ce51-00f1-430e-a6f7efc233fc", "Nocturne: Blue and Gold—Southampton Water", "James McNeill Whistler, 1872", "Another of the nocturnes, named like pieces of music."),
      yt("lecture", "7d5O7SwRRrs", "Whistler v Ruskin: The Trial That Priced a Painting", "The Underdrawing", "The trial: Whistler won and was awarded a farthing in damages."),
      iot("z190j6k2bthl", "John Ruskin", "The critic who championed Turner and made art and architecture a moral question."),
      book("5452", "The Two Paths", "John Ruskin", "Ruskin's lectures of 1858-59 on art, decoration and manufacture, and why art must serve life."),
      book("365", "The Picture of Dorian Gray", "Oscar Wilde", "The preface states the other side: \"All art is quite useless.\""),
    ],
  },
  {
    id: "art-1913", name: "1913: modern art on trial", by: ED, for: [],
    about: "In 1913 a ballet started a fight in a Paris theatre and an exhibition in New York set the American press laughing. Four years later a urinal sent to an exhibition with no jury was refused. Each time the question was whether this was art at all.",
    items: [
      yt("lecture", "8FXA_8LR2IM", "The ballet that incited a riot", "Iseult Gillespie, TED-Ed", "The first night of The Rite of Spring, Paris, 29 May 1913."),
      yt("music", "EkwqPJZe8ms", "The Rite of Spring", "Igor Stravinsky; London Symphony Orchestra, Sir Simon Rattle", "Then hear it."),
      yt("lecture", "apY3mgkzzlk", "The Show That Shook the World", "1913 Armory Show", "The Armory Show, where Americans first saw the Cubists, Duchamp and Matisse in numbers."),
      yt("lecture", "FmjSUyyc-3M", "Duchamp, Fountain", "Smarthistory", "1917: a readymade sent to the Society of Independent Artists, who did not show it."),
      iot("1wesdiauf8wb5", "Dadaism", "Dada, from the Cabaret Voltaire in Zurich in 1916."),
    ],
  },
  {
    id: "art-ai", name: "Machines that make pictures: art and AI", by: ED, for: [],
    about: "In 2022 a picture made with an AI image generator won an art prize at the Colorado State Fair, and the old questions came back: is it art, who made it, and what happens to the people who made pictures before? They were asked of photography in the 1850s.",
    items: [
      yt("lecture", "NiJeB2NJy1A", "The Real Fight Over AI Art", "Cleo Abram", "What the fight is about, from the State Fair prize on."),
      yt("debate", "J5cz-v0j3D0", "Will AI Kill the Future of the Creative Arts?", "Jonathan Taplin and Rebecca Fiebrink, Open to Debate", "A formal debate, for and against."),
      yt("lecture", "DK25AoRhlKk", "AI Hate is 167 Years Old (They Called Cameras Cheating Too)", "Eric Michaud", "The echo: what painters and critics said about the camera."),
      iot("1qmxbsn12aaimy", "The Invention of Photography", "The invention that first made pictures without a painter's hand, 1839."),
      yt("lecture", "blq9sCIyXgA", "Walter Benjamin: The Work of Art in the Age of Mechanical Reproduction", "Then & Now", "Benjamin's essay, first published in 1936, on what copying by machine does to a work of art."),
    ],
  },
];

export const MACHINE_DEBATE_PLAYLISTS: readonly Collection[] = [
  {
    id: "machines-plato-aristotle", name: "Plato on writing, Aristotle on machines", by: ED, for: [],
    about: "The oldest arguments over an invention. In the Phaedrus an Egyptian king refuses the gift of writing because it will make people forgetful. In the Politics Aristotle imagines tools that work by themselves, and what that would do to the need for labour.",
    items: [
      book("2429", "Phaedrus", "Plato", "Theuth offers writing to King Thamus, who answers that it will bring forgetfulness and the look of wisdom without the thing (274c-275b)."),
      yt("lecture", "hSVN7w-8dHg", "Plato and the Technology of Writing: The Myth of Theuth", "Dan Lawrence, Varia Videographica", "The myth, read closely."),
      book("1360", "Politics", "Aristotle", "Book 1, chapter 4: if every tool could do its own work, if shuttles wove by themselves, masters would not need slaves."),
      iot("fpggwoe3emcr", "Automata", "Machines that seem alive, from the Greeks on, and the questions they raised."),
    ],
  },
  {
    id: "machines-printing", name: "The printing press", by: ED, for: [],
    about: "Printing with movable type spread across Europe from the 1450s. It made books cheap, put scribes out of work and let anyone print anything, and people argued over whether there were now too many books and too little control over what they said.",
    items: [
      yt("lecture", "afiR74GZKcY", "The Printing Press Revolution", "Mike Soha", "What printing changed, from Gutenberg on."),
      iot("yqbi9j1pio8ra", "Caxton and the Printing Press", "The merchant who brought printing to England in 1476."),
      yt("discussion", "Q3TkER0k8s0", "History of Information Overload", "TVO Today", "Too many books: a complaint as old as printing."),
    ],
  },
  {
    id: "machines-luddites", name: "The Luddites and the machinery question", by: ED, for: [],
    about: "From 1811 English textile workers broke the machines that were taking their trade, and Parliament made frame-breaking a capital crime. Economists then argued what machines do to wages and work, and Ricardo changed his mind.",
    items: [
      iot("yeppq49zu2cn", "The Industrial Revolution", "Machine looms and steam: how Britain changed between about 1750 and 1830."),
      yt("lecture", "oeFTuD4Mnug", "Rise against the Machines: The Luddites", "The History Guy", "Who the Luddites were and what they broke."),
      yt("discussion", "z6a5pNJ_4tc", "Blood in the Machine: A Conversation with Brian Merchant", "University of San Diego Humanities Center", "A historian of the Luddites on why they fought, and the echo today."),
      iot("1qpezshhcmmts", "David Ricardo", "In the third edition of his Principles (1821) Ricardo added a chapter, On Machinery, granting that machines could harm workers."),
      book("1010", "Capital, Volume 1", "Karl Marx", "Chapter 15, Machinery and Modern Industry, with the Luddites in it."),
    ],
  },
  {
    id: "machines-factory", name: "The factory town", by: ED, for: [],
    about: "By the 1840s the factory towns of England were the new world, and people argued over what they did to the people who lived in them: a report, two novels and a history.",
    items: [
      iot("1bt05qcpm0ebj", "Consequences of the Industrial Revolution", "Health, housing and work in the new towns."),
      book("7345", "Condition of the Working-Class in England in 1844", "Friedrich Engels", "Manchester, street by street, by a mill owner's son."),
      book("845", "Hard Times", "Charles Dickens", "Coketown, and a school that teaches only facts."),
      book("1284", "North and South", "Elizabeth Gaskell", "A southern woman in a northern mill town, between the master and the workers."),
    ],
  },
  {
    id: "machines-ruskin-morris", name: "Ruskin and Morris against the machine", by: ED, for: [],
    about: "Ruskin argued that machine work made the worker a tool, and held up the Gothic carver who was free to make mistakes. Morris took it into design and politics, and the Arts and Crafts movement followed.",
    items: [
      book("6837", "The Stones of Venice, Volume 2", "John Ruskin", "Its chapter The Nature of Gothic, which Morris printed on its own at his Kelmscott Press."),
      yt("lecture", "34LkHJnjc20", "The Nature of the Gothic and the Writings of John Ruskin", "Hillsdale College", "The chapter's argument about work."),
      yt("lecture", "IwIKWuHhWVA", "Ruskin and Morris: The Origins of the Arts and Crafts Movement", "Harry Jonathan", "From Ruskin's books to Morris's workshops."),
      iot("1cv43yseetwnj", "William Morris", "Poet, designer and socialist, who looked back to work before industry."),
      book("11845", "Arts and Crafts Essays", "Various", "Essays by the movement's members, with a preface by Morris."),
      book("5766", "News From Nowhere", "William Morris", "Morris's novel of a future where work is made by hand and is a pleasure."),
    ],
  },
  {
    id: "machines-thinking", name: "Machines that think", by: ED, for: [],
    about: "In the 1870s a novelist imagined machines that would evolve past us; in 1950 Turing asked whether machines can think. Now people argue whether AI will take their work, the Luddites' question again.",
    items: [
      book("1874", "Erewhon", "Samuel Butler", "Chapters 23 to 25, The Book of the Machines: a country that destroyed its machines before they could evolve."),
      book("1134", "The Machine Stops", "E. M. Forster", "A story of 1909 about people who live entirely through a machine."),
      iot("lhk39s1a4vxnv", "Artificial Intelligence", "Can machines think? From Turing on."),
      yt("debate", "zFx5kq0pB0Y", "The robots are coming and they will destroy our livelihoods", "Intelligence Squared", "A debate on the motion."),
      yt("debate", "3lijAXbyMIg", "Is AI Coming for Your Job?", "Open to Debate", "For and against, with the audience's vote."),
    ],
  },
];

/** A course made of playlists, each unit with the question argued in it. */
export type DebateCourse = {
  id: string;
  name: string;
  by: string;
  about: string;
  units: readonly { playlist: string; question: string }[];
};

/**
 * The two courses. The question for each unit is the question at issue, as the stasis teachers would put it; it is
 * read, not answered on the page (writing belongs in the journal).
 */
export const DEBATE_COURSES: readonly DebateCourse[] = [
  {
    id: "art-debates",
    name: "Quarrels over art: new styles against the old",
    by: ED,
    about: "Every new art starts a quarrel, and the quarrels repeat. This course follows them from Plato and the poets to the Ancients and the Moderns, Impressionism against the Salon, Whistler against Ruskin, the scandals of 1913, and the fight over AI art today. Each unit is a playlist to watch and listen to.",
    units: [
      { playlist: "art-plato-poets", question: "Does art do more good than harm to the people who hear and see it?" },
      { playlist: "art-ancients-moderns", question: "Can the moderns equal or surpass the ancients?" },
      { playlist: "art-impressionism", question: "Who decides what a finished painting is, and what it may show?" },
      { playlist: "art-whistler-ruskin", question: "Must art be useful, true or moral, or is beauty enough?" },
      { playlist: "art-1913", question: "Is this art at all?" },
      { playlist: "art-ai", question: "Is a picture made by a machine art, and who made it?" },
    ],
  },
  {
    id: "machine-debates",
    name: "Quarrels over machines: new inventions and the debates they start",
    by: ED,
    about: "Every great invention starts a quarrel over what it will do to us. This course follows them from Plato on writing and Aristotle's self-moving tools to the printing press, the Luddites and the factory towns of the industrial era, Ruskin and Morris against the machine, and the argument over AI and work today. Each unit is a playlist to watch and listen to.",
    units: [
      { playlist: "machines-plato-aristotle", question: "Does a new tool make us wiser, or only seem to?" },
      { playlist: "machines-printing", question: "Is it good that anyone can print anything?" },
      { playlist: "machines-luddites", question: "Do machines take work from people, or make more of it?" },
      { playlist: "machines-factory", question: "What does the factory do to the people who live by it?" },
      { playlist: "machines-ruskin-morris", question: "Does machine work make the worker a tool?" },
      { playlist: "machines-thinking", question: "Can machines think, and what then is left for us to do?" },
    ],
  },
];

export const debateCourse = (id: string): DebateCourse | undefined => DEBATE_COURSES.find((c) => c.id === id);
