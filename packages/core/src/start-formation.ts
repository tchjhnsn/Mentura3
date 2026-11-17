/**
 * Playlists for the subjects Scholē was missing, by ICP (doc "Scholē subjects by ICP and recommendations"; Torian,
 * 2026-11-17 00:26Z: "go ahead and build"): founders in their own words, the household and the land, raising and
 * teaching children, friendship, manners and character, and athletes. Every item is a LibriVox recording in the
 * catalogue, by its id. Traits in `formation.ts` point here. Object literals only: `collections.ts` imports this.
 * Pure: no I/O.
 */
import type { Collection, CollectionItem } from "./collections";

const ED = "Reflect's editors";
const ab = (id: string, title: string, by: string, why: string): CollectionItem => ({ kind: "audiobook", id, title, by, why });

export const FORMATION_PLAYLISTS: readonly Collection[] = [
  {
    id: "founders-own-words", name: "Founders in their own words", by: ED,
    for: ["founder", "entrepreneur", "business", "owner", "chief execut", "ceo", "start", "venture", "manag"],
    about: "People who built lasting enterprises, telling how in their own books: what they practised, what they refused, and what they did with what they made.",
    items: [
      ab("1143", "Autobiography of Benjamin Franklin", "Benjamin Franklin", "The printer who listed thirteen virtues and practised one a week."),
      ab("7181", "Autobiography of Andrew Carnegie", "Andrew Carnegie", "From bobbin boy to steel, and why he put all good eggs in one basket."),
      ab("6858", "Random Reminiscences of Men and Events", "John D. Rockefeller", "Short and plain: keeping accounts from boyhood, then getting and giving."),
      ab("4431", "My Life and Work", "Henry Ford", "The principles he says his company ran on, service before profit first."),
      ab("2632", "Up from Slavery", "Booker T. Washington", "Born enslaved, he founded Tuskegee and built it brick by brick with his students."),
      ab("5295", "Art of Money Getting", "P. T. Barnum", "A showman's short rules for business, one page each."),
      ab("16476", "Thrift", "Samuel Smiles", "The Victorian book on saving and independence that founders of his age read."),
    ],
  },
  {
    id: "household-and-land", name: "The household and the land", by: ED,
    for: ["farm", "agricult", "garden", "ranch", "homestead", "grow", "landscap", "homemak", "household", "housekeep"],
    about: "How the ancients and their heirs kept a farm and a home: Hesiod's seasons of work, Virgil's poem of the land, Aristotle on the household, Thoreau's cabin, and the book that ran a Victorian house.",
    items: [
      ab("10196", "Works and Days", "Hesiod", "The oldest farmer's almanac in Greek: when to plough, and why work is no disgrace."),
      ab("15045", "Georgics", "Virgil", "Four books on fields, vines, herds and bees."),
      ab("9077", "Economics", "Aristotle", "On managing a household: the original meaning of economics."),
      ab("549", "Walden", "Henry David Thoreau", "Two years in a cabin he built himself, to live deliberately."),
      ab("1319", "Book of Household Management", "Mrs. Isabella Beeton", "The mistress of a house as the leader of an enterprise."),
      ab("601", "Natural History of Selborne", "Gilbert White", "A parson's letters on the birds and seasons of his parish."),
      ab("22950", "Letters from an American Farmer", "J. Hector St. John de Crèvecoeur", "A farmer in the colonies on what America made of the people who came."),
    ],
  },
  {
    id: "raising-children", name: "Raising and teaching children", by: ED,
    for: ["mother", "father", "parent", "child", "nann", "teach", "tutor", "homeschool"],
    about: "Charlotte Mason's lectures to mothers on habit and the living education of children, a teacher who reached a girl who could not see or hear, and a family of sisters growing up.",
    items: [
      ab("11200", "Home Education", "Charlotte Mason", "Lectures to mothers: habit, out-of-door life, and lessons for children under nine."),
      ab("14299", "Parents and Children", "Charlotte Mason", "The second volume: the family as the child's first school."),
      ab("884", "The Story of My Life", "Helen Keller", "How her teacher, Anne Sullivan, gave her language."),
      ab("628", "Little Women", "Louisa May Alcott", "Four sisters and their mother through a hard year of the Civil War."),
    ],
  },
  {
    id: "friendship", name: "On friendship", by: ED, for: [],
    about: "What friends are for, from the two works that shaped every later book on it: Cicero's dialogue and Aristotle's books on friendship in the Ethics.",
    items: [
      ab("13377", "Treatises on Friendship and Old Age", "Marcus Tullius Cicero", "Friendship can only exist between good men, says his Laelius."),
      ab("3733", "Nicomachean Ethics", "Aristotle", "Books VIII and IX: the three kinds of friendship and why the best is rare."),
      ab("14766", "Memorable Thoughts of Socrates", "Xenophon", "Socrates on choosing friends and being worth having as one."),
    ],
  },
  {
    id: "manners-and-character", name: "Manners and character", by: ED, for: [],
    about: "Books written to form a young man or woman: a father's letters on the art of living among people, and a Victorian on character.",
    items: [
      ab("3907", "Letters to His Son", "Lord Chesterfield", "A father's letters on manners, attention and being at ease in company."),
      ab("14909", "Character", "Samuel Smiles", "Character as the habits a person builds, with lives for examples."),
      ab("7359", "Character Building", "Booker T. Washington", "His Sunday evening talks to the students of Tuskegee."),
      ab("18903", "On the Shortness of Life", "Seneca", "Life is long enough, if you know how to use it."),
    ],
  },
  {
    id: "athletes-own-words", name: "Athletes in their own words", by: ED,
    for: ["athlet", "coach", "sport", "trainer", "fitness", "umpire", "referee"],
    about: "A pitcher on the battle of wits in baseball, and the strongman who began modern physical culture, each in his own book.",
    items: [
      ab("7974", "Pitching in a Pinch", "Christy Mathewson", "The Giants' great pitcher on signals, nerve and thinking in the game."),
      ab("17483", "Strength and How to Obtain It", "Eugen Sandow", "Exercise as training of the will as much as the muscle."),
    ],
  },
];
