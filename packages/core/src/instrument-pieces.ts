/**
 * The piano course's graded pieces (`./instruments`), easiest first. Every piece is in the public domain; every
 * recording was checked to exist on Wikimedia Commons (its file and licence read from the Commons API on 2026-11-17)
 * and every score page on IMSLP (its API, the same day). Human performances were chosen over notation-program
 * renderings where Commons has one. Commons has no recording of Burgmüller's Op. 100 or of Schumann's Album for the
 * Young, so neither is here yet. Grades are approximate, after the ABRSM and RCM graded syllabuses. Pure: no I/O.
 */
import { commons } from "./collections";
import type { Piece } from "./instruments";

const imslp = (title: string) => `https://imslp.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
const rec = (path: string, file: string, by: string, credit: string) => commons(path, file, by, by, credit) as Piece["recording"];
const NOTEBOOK = imslp("Notebooks for Anna Magdalena Bach (Bach, Johann Sebastian)");

export const PIANO_PIECES: readonly Piece[] = [
  {
    id: "minuet-g", title: "Minuet in G major, BWV Anh. 114", composer: "Christian Petzold", year: "1725", era: "Baroque", grade: 1,
    from: "the Notebook for Anna Magdalena Bach", imslp: NOTEBOOK,
    recording: rec("2/25", "Minuet in G major, Anh. 114 - Notebook for Anna Magdalena Bach.ogg", "Aaron Dunn, piano", "Aaron Dunn, Public domain"),
    why: "The first piece in many piano books: a dance in three, a tune in the right hand over a simple line in the left. It was long thought to be Bach's.",
  },
  {
    id: "march-d", title: "March in D major, BWV Anh. 122", composer: "Carl Philipp Emanuel Bach", year: "about 1725", era: "Baroque", grade: 2,
    from: "the Notebook for Anna Magdalena Bach", imslp: NOTEBOOK,
    recording: rec("d/d3", "Bach, JS - March in D (Piano Performance by eldüendesüarez).wav", "eldüendesüarez, piano", "eldüendesüarez, CC BY-SA 4.0"),
    why: "A march in two parts by Bach's son, copied into his stepmother's notebook: both hands busy, with crisp, detached notes.",
  },
  {
    id: "musette-d", title: "Musette in D major, BWV Anh. 126", composer: "Anonymous", year: "about 1725", era: "Baroque", grade: 2,
    from: "the Notebook for Anna Magdalena Bach", imslp: NOTEBOOK,
    recording: rec("5/5a", "Bach, JS - Musette in D (Piano Performance by eldüendesüarez).wav", "eldüendesüarez, piano", "eldüendesüarez, CC BY-SA 4.0"),
    why: "A musette imitates the drone of a bagpipe: the left hand leaps between octaves while the right hand dances above it.",
  },
  {
    id: "clementi-36-1", title: "Sonatina in C major, Op. 36 No. 1: Allegro", composer: "Muzio Clementi", year: "1797", era: "Classical", grade: 3,
    from: "Clementi's Six Sonatinas, Op. 36", imslp: imslp("6 Piano Sonatinas, Op.36 (Clementi, Muzio)"),
    recording: rec("e/e7", "Clementi, Sonatina N.1 - 1 Mov. Allegro.ogg", "Alessio Cesaroni, piano", "Alessio Cesaroni, CC0"),
    why: "The first movement of the sonatina every piano student meets: scales, broken chords and a sonata's shape in miniature.",
  },
  {
    id: "fur-elise", title: "Für Elise, WoO 59", composer: "Ludwig van Beethoven", year: "1810", era: "Classical", grade: 5,
    from: "a bagatelle printed in 1867", imslp: imslp("Für Elise, WoO 59 (Beethoven, Ludwig van)"),
    recording: rec("1/15", "For Elise (Für Elise) Beethoven JMC Han.ogg", "Jason M. C. Han, piano", "Jason M. C. Han, CC BY-SA 4.0"),
    why: "The most famous piano piece of all: a rocking tune passed between the hands, with two busier episodes to learn between its returns.",
  },
  {
    id: "chopin-28-4", title: "Prelude in E minor, Op. 28 No. 4", composer: "Frédéric Chopin", year: "1839", era: "Romantic", grade: 5,
    from: "Chopin's 24 Preludes, Op. 28", imslp: imslp("Preludes, Op.28 (Chopin, Frédéric)"),
    recording: rec("a/a2", "Ivan Ilić-Chopin Prelude Opus 28 n.4.ogg", "Ivan Ilić, piano", "Ivan Ilić, CC BY 3.0"),
    why: "A slow melody over chords that slip down a note at a time: a lesson in quiet, even playing and in the pedal.",
  },
  {
    id: "bach-846", title: "Prelude in C major, BWV 846", composer: "Johann Sebastian Bach", year: "1722", era: "Baroque", grade: 5,
    from: "The Well-Tempered Clavier, Book 1", imslp: imslp("Das wohltemperierte Klavier I, BWV 846-869 (Bach, Johann Sebastian)"),
    recording: rec("b/b6", "Kimiko Ishizaka - Bach - Well-Tempered Clavier, Book 1 - 01 Prelude No. 1 in C major, BWV 846.ogg", "Kimiko Ishizaka, piano", "Kimiko Ishizaka, CC0"),
    why: "One broken-chord pattern through a whole journey of harmony: the hands learn a shape once and the ear follows where it goes.",
  },
  {
    id: "satie-gymnopedie-1", title: "Gymnopédie No. 1", composer: "Erik Satie", year: "1888", era: "Romantic", grade: 5,
    from: "Satie's Trois Gymnopédies", imslp: imslp("3 Gymnopédies (Satie, Erik)"),
    recording: rec("9/90", "Erik Satie - gymnopedies - la 1 ere. lent et douloureux.ogg", "Robin Alciatore, piano", "Robin Alciatore, Public domain"),
    why: "Slow and spare: a left hand that swings from a low note to a chord, and a melody that floats above it. Every note can be heard.",
  },
  {
    id: "burgmuller-109-7", title: "Berceuse, Op. 109 No. 7", composer: "Friedrich Burgmüller", year: "1858", era: "Romantic", grade: 6,
    from: "Burgmüller's 18 Études, Op. 109", imslp: imslp("18 Études, Op.109 (Burgmüller, Friedrich)"),
    recording: rec("4/4f", "Berceuse Burgmuller.ogg", "BastienM, piano", "BastienM, CC BY-SA 3.0"),
    why: "A lullaby from the teacher's book of studies that follows his 25 easy pieces: a singing tune over a gently rocking left hand.",
  },
  {
    id: "bach-772", title: "Invention No. 1 in C major, BWV 772", composer: "Johann Sebastian Bach", year: "1723", era: "Baroque", grade: 6,
    from: "Bach's Inventions and Sinfonias", imslp: imslp("15 Inventions, BWV 772-786 (Bach, Johann Sebastian)"),
    recording: rec("5/53", "01 - Invention à 2 voix BWV 772 en do majeur.ogg", "Marcelle Meyer, piano", "Marcelle Meyer, Public domain"),
    why: "Written, Bach said, to teach playing cleanly in two parts: one short idea answered between the hands, each hand its own voice.",
  },
  {
    id: "mozart-545-1", title: "Piano Sonata No. 16 in C major, K. 545: Allegro", composer: "Wolfgang Amadeus Mozart", year: "1788", era: "Classical", grade: 7,
    from: "the sonata Mozart called 'for beginners'", imslp: imslp("Piano Sonata No.16 in C major, K.545 (Mozart, Wolfgang Amadeus)"),
    recording: rec("3/38", "Wolfgang Amadeus Mozart - sonata no. 16 in c major, k.545 'sonata facile' - i. allegro.ogg", "Pianist not named", "Pianist not named, Public domain"),
    why: "Mozart wrote it for beginners, and it asks for everything so far: an even Alberti bass, fast scales and a clear tune.",
  },
];
