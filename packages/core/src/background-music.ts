/**
 * Background music under an audiobook (Torian, 2026-11-16 06:32Z and 06:36Z): quiet music from the book's era plays
 * under the narration, chosen by Reflect's editors, instrumental only so it never competes with the words. Between
 * chapters it may come forward for a short interlude, as in a radio drama. Free recordings only (Wikimedia Commons),
 * each credited. Pure: no I/O.
 */
import { commons, type CollectionItem } from "./collections";
import { TOPIC_PAGES, WORKS } from "./topic-pages";

/** Instrumental recordings for each era topic, in the order they play (filled by the editors' list). */
export const BACKGROUND: Readonly<Record<string, readonly CollectionItem[]>> = {
  // Commons has no instrumental recording of ancient Greek or Roman music: the one real performance, the Seikilos song, is sung.
  greeks: [],
  romans: [],
  medieval: [
    commons("e/ef", "Chominciamento de Gioia1.ogg", "Chominciamento di gioia", "Anonymous, Italy, 14th century; Ririkuku and players, live at FIMAM 2008", "Ririkuku, CC BY-SA 4.0", "An Italian estampie from a London manuscript (Add MS 29987), played live on two flutes, vielle and percussion."),
    commons("d/d2", "Estampie Retrove Robertsbridge.ogg", "Estampie Retrove", "Anonymous, England, early 14th century; Metzner, organ", "Metzner, CC BY-SA 3.0", "A dance from the Robertsbridge Codex, the oldest surviving keyboard music, recorded at a concert on organ."),
    commons("b/bc", "Bel fiore dança (keyboard).ogg", "Bel fiore dança", "Anonymous, Codex Faenza, early 15th century; Francesco Ariis, keyboard", "Francesco Ariis, CC BY 4.0", "A short Italian dance from the Faenza Codex, played on a keyboard."),
  ],
  renaissance: [
    commons("f/f9", "Orlando Gibbons Pavan MB16.wav", "Pavan (MB 16)", "Orlando Gibbons, early 17th century; David Joseph Stith, harpsichord", "David Joseph Stith, CC0", "A slow, stately pavan by the organist of James I's Chapel Royal, played on a Flemish harpsichord."),
    commons("3/30", "William Byrd (ca.1540-1623) - Prelude & Voluntarie à4 for my Ladye Nevell, My Ladye Nevells Booke, No.26. London. GB-Lbl, MS Mus.1591 (1591).ogg", "Prelude and Voluntarie for My Ladye Nevell", "William Byrd, 1591; Phillip W. Serna, viols", "Phillip W. Serna, CC BY-SA 4.0", "Keyboard music from My Ladye Nevells Booke of 1591, played here by a consort of viols."),
    commons("3/3f", "William Byrd (ca.1540-1623) - Fantasia à3, VdGS No.4, London. Royal College of Music, Ms.2093 (ca.1660).ogg", "Fantasia a 3, No. 4", "William Byrd, late 16th century; Phillip W. Serna, viols", "Phillip W. Serna, CC BY-SA 4.0", "A three-part fantasia for viols by Elizabeth's leading composer, even and unhurried."),
    commons("5/5c", "Orlando Gibbons (bap.1583-1625) - Fantasia à4, No.1 for Treble, Tenor & Bass Viols with Great Bass.oga", "Fantasia a 4, No. 1, with the great double bass", "Orlando Gibbons, early 17th century; Phillip W. Serna, viols", "Phillip W. Serna, CC BY-SA 4.0", "One of Gibbons's consort fantasias for viols with a great double bass, the music of English households of the time."),
    commons("e/ec", "Orlando Gibbons (bap.1583-1625) - Fantasia à3, No.3 for Treble & Bass Viols with Great Bass.ogg", "Fantasia a 3, No. 3, with the great double bass", "Orlando Gibbons, early 17th century; Phillip W. Serna, viols", "Phillip W. Serna, CC BY-SA 4.0", "A three-part viol fantasia, quiet and interwoven, from the same set."),
    commons("a/ac", "Captaine Hume’s Pavan, No.46, the First Part of Ayres (1605).ogg", "Captaine Hume's Pavan", "Tobias Hume, 1605; Phillip W. Serna, viola da gamba", "Phillip W. Serna, CC BY-SA 3.0", "A slow pavan for solo viol from Hume's First Part of Ayres, printed in London in 1605."),
    commons("2/2b", "Robert Parsons (ca.1535-1572) - Ut re mi fa sol la à4 from the Hamond Partbooks, London. GB-Lbl, Add.Ms.30480-4 (ca.1560-90).ogg", "Ut re mi fa sol la", "Robert Parsons, mid 16th century; Phillip W. Serna, viols", "Phillip W. Serna, CC BY-SA 4.0", "A Tudor consort piece built on the rising notes of the hexachord, played on viols."),
    commons("1/1a", "Antonio de Cabezon - Duuiensela.ogg", "Duuiensela", "Antonio de Cabezón, 16th century; Joan Benson, clavichord", "Joan Benson, CC BY-SA 2.0", "Variations by the blind organist of Philip II of Spain, on the soft clavichord."),
    commons("0/0f", "John Dowland (1563-1626) - The King of Denmark Galliard à5, Lachrimae, No.11 for Treble, Tenor & Bass Viols with Great Bass Violone in G.ogg", "The King of Denmark's Galliard", "John Dowland, 1604; Phillip W. Serna, viols", "Phillip W. Serna, CC BY-SA 4.0", "A dance from Dowland's Lachrimae, printed in 1604 for viols, named for the king he served as lutenist."),
    commons("4/49", "Anonymous -- Prelude (Magdalena Tomsinska).ogg", "Prelude", "Anonymous, Renaissance; Magdalena Tomsinska, lute", "Magdalena Tomsinska, CC BY 3.0", "A short prelude on the Renaissance lute, the household instrument of the age."),
    commons("8/84", "Bergeret sans roch.ogg", "Bergeret sans roch", "Tielman Susato, about 1550; Metzner, organ", "Metzner, CC BY-SA 3.0", "A basse danse from Susato's Antwerp dance book, played on organ."),
  ],
  enlightenment: [
    commons("e/e6", "Kimiko Ishizaka - 01 - Aria.ogg", "Goldberg Variations: Aria", "J. S. Bach, 1741; Kimiko Ishizaka, piano", "Kimiko Ishizaka, CC0", "The slow theme of the variations Bach published in 1741."),
    commons("4/49", "Kimiko Ishizaka - 14 - Variatio 13 a 2 Clav.ogg", "Goldberg Variations: Variation 13", "J. S. Bach, 1741; Kimiko Ishizaka, piano", "Kimiko Ishizaka, CC0", "A gentle, ornamented variation from the same set."),
    commons("e/e2", "Johann Sebastian Bach - BWV 997 - Lute Suite No. 2 in C minor - III Sarabande.ogg", "Suite in C minor, BWV 997: Sarabande", "J. S. Bach; Martha Goldstein, lute-harpsichord", "Martha Goldstein, CC BY-SA 2.0", "A slow sarabande Bach is believed to have written for the lute-harpsichord, played on a modern one built to his design."),
    commons("d/d5", "Telemann - Methodical Sonatas - 1. Gmin.ogg", "Methodical Sonata in G minor", "Georg Philipp Telemann, 1728; Felix Skowronek, flute; Martha Goldstein, harpsichord", "Felix Skowronek and Martha Goldstein, CC BY-SA 2.0", "A flute sonata from Telemann's Methodical Sonatas, played on a wooden flute and harpsichord."),
    commons("6/6f", "Johann Joachim Quantz - Sonata Concertate in D.ogg", "Sonata in D, QV 2:14", "Johann Joachim Quantz, 18th century; Alex Murray, flute; Martha Goldstein, harpsichord", "Martha Goldstein, CC BY-SA 2.0", "By Frederick the Great's flute teacher, music of the Prussian court."),
    commons("9/9f", "Vivaldi - Four Seasons 1 Spring mvt 2 Largo - John Harrison violin.oga", "The Four Seasons: Spring, Largo", "Antonio Vivaldi, published 1725; John Harrison, violin", "John Harrison, CC BY-SA 4.0", "The slow movement of Spring, a quiet violin line over soft strings."),
    commons("b/b1", "11 - Vivaldi Winter mvt 2 Largo - John Harrison violin.ogg", "The Four Seasons: Winter, Largo", "Antonio Vivaldi, published 1725; John Harrison, violin", "John Harrison, CC BY-SA 4.0", "The slow movement of Winter, a calm melody over plucked strings."),
    commons("0/01", "Vivaldi - Cello Concerto Gmaj - 2. Largo.ogg", "Cello Concerto in G major, RV 413: Largo", "Antonio Vivaldi; Stephen Balderston, cello; Advent Chamber Orchestra", "Advent Chamber Orchestra, CC BY-SA 2.0", "A slow cello movement by the Venetian composer."),
    commons("e/ea", "L anthologie sonore-30a-as78-m6-83661.ogg", "Pièces de clavecin en concerts, Fifth Concert: La Forqueray", "Jean-Philippe Rameau, 1741; Jean Pasquier, violin; Eva Heinitz, viola da gamba; Pauline Aubert, harpsichord; Curt Sachs, 1936", "L'Anthologie sonore, Public domain", "Chamber music by the leading French composer of the age, recorded on period-style instruments in 1936."),
    commons("4/45", "Haydn - String Quartet, Op. 64 No. 5 in D major 'The Lark' - II. Adagio. Cantabile (Musopen String Quartet).flac", "String Quartet in D major, Op. 64 No. 5, 'The Lark': Adagio cantabile", "Joseph Haydn, 1790; Musopen String Quartet", "Musopen String Quartet, Public domain", "The slow movement of one of Haydn's best-known quartets, a singing line for strings."),
    commons("7/7f", "Mozart - String Quartet No. 19 in C major, K465 'Dissonance' - II. Andante cantabile (Musopen String Quartet).flac", "String Quartet in C major, K. 465: Andante cantabile", "W. A. Mozart, 1785; Musopen String Quartet", "Musopen String Quartet, Public domain", "A slow movement from the quartets Mozart dedicated to Haydn."),
    commons("e/eb", "Mozart Piano Concerto No. 15 in B flat major K450 II. Andante (Mozart) European Archive.ogg", "Piano Concerto No. 15 in B flat, K. 450: Andante", "W. A. Mozart, 1784; European Archive", "European Archive, Public domain", "A slow movement Mozart wrote for his own concerts in Vienna."),
  ],
  founding: [
    commons("8/86", "The United States Army Old Guard Fife and Drum Corps - 03 - The Presidents March.ogg", "The President's March", "Philip Phile, about 1789; The United States Army Old Guard Fife and Drum Corps", "The United States Army Old Guard Fife and Drum Corps, CC0", "A march written around Washington's inauguration, played on fife and drum."),
    commons("8/88", "The United States Army Old Guard Fife and Drum Corps - 10 - Brandywine Quickstep from the Minstrel Boy Show.ogg", "Brandywine Quickstep", "Traditional fife tune; The United States Army Old Guard Fife and Drum Corps", "The United States Army Old Guard Fife and Drum Corps, CC0", "A fife tune named for Brandywine, where Washington's army fought in 1777."),
    commons("7/71", "The United States Army Old Guard Fife and Drum Corps - 09 - Reveille VariationDrum CallSlow ScotchQuick ScotchYankee DoodleMont.ogg", "Reveille and camp calls", "Traditional; The United States Army Old Guard Fife and Drum Corps", "The United States Army Old Guard Fife and Drum Corps, CC0", "Fife and drum calls of the kind that ordered a soldier's day in camp, ending in Yankee Doodle."),
    commons("2/2b", "The United States Army Old Guard Fife and Drum Corps - 11 - Fife Feature Fishers Hornpipe VariationGuilderoyRed Haired Boy.ogg", "Fisher's Hornpipe and other tunes", "Traditional; The United States Army Old Guard Fife and Drum Corps", "The United States Army Old Guard Fife and Drum Corps, CC0", "Dance tunes played on the fife, the instrument that carried music through the Continental Army."),
    commons("e/e9", "The United States Army Old Guard Fife and Drum Corps - 17 - Boismortiers Concerto for Five Flutes No 4 Mvt I Adagio.ogg", "Concerto for Five Flutes No. 4: Adagio", "Joseph Bodin de Boismortier, 1727; The United States Army Old Guard Fife and Drum Corps", "The United States Army Old Guard Fife and Drum Corps, CC0", "A calm slow movement of the 18th century, played by the fifers of the Army's colonial-style corps."),
    commons("e/e8", "Handel's Water Music - 16. Sarabande - Chamber Orchestra - United States Marine Band.opus", "Water Music: Sarabande", "George Frideric Handel, 1717; Marine Chamber Orchestra, United States Marine Band", "United States Marine Band, Public domain", "A slow dance from the Water Music Handel wrote for George I, the king of the colonies' early years."),
    commons("c/c9", "Handel's Water Music - 13. Minuet - Chamber Orchestra - United States Marine Band.opus", "Water Music: Minuet", "George Frideric Handel, 1717; Marine Chamber Orchestra, United States Marine Band", "United States Marine Band, Public domain", "The minuet, the dance of 18th-century assemblies on both sides of the Atlantic."),
    commons("2/24", "Carl Friedrich Abel (1723- 1787) – Sonata in G-Major, WKO155 for Unaccompanied Viola da Gamba for Unaccompanied Viola da Gamba.ogg", "Sonata in G major, WKO 155", "Carl Friedrich Abel, 18th century; Phillip W. Serna, viola da gamba", "Phillip W. Serna, CC BY-SA 3.0", "A sonata for solo viol by a German composer who led London's concert life in the 1760s and 1770s."),
  ],
};

/** How loud the music sits under a voice, as a share of full volume. */
export const LEVELS = [{ id: "quiet", label: "Quiet", gain: 0.08 }, { id: "medium", label: "Medium", gain: 0.16 }, { id: "louder", label: "Louder", gain: 0.3 }] as const;
export type Level = (typeof LEVELS)[number]["id"];
/** How long the music comes forward between chapters, and how loud. */
export const INTERLUDE = { seconds: 12, gain: 0.85 } as const;

/** The era topic a recording belongs to: a work page that plays it, else a topic form that lists it. */
export function topicOfRecording(librivoxId: string): string | null {
  const w = WORKS.find((x) => x.audiobooks.includes(librivoxId));
  if (w) return w.topic;
  const t = TOPIC_PAGES.find((x) => x.forms.some((f) => (f.items ?? []).some((i) => i.kind === "audiobook" && i.id === librivoxId)));
  return t?.id ?? null;
}

/** The background music for an audiobook, or none when its era has no list yet. */
export function backgroundFor(librivoxId: string): { topic: string; items: readonly CollectionItem[] } | null {
  const topic = topicOfRecording(librivoxId);
  const items = topic ? BACKGROUND[topic] ?? [] : [];
  return topic && items.length ? { topic, items } : null;
}
