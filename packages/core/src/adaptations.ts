/**
 * Later works made from a classic, each marked by how close it stays (Torian, 2026-11-16 03:17Z: "highlighting how
 * anachronistic they are versus how accurate they are to the actual work itself"; 03:19Z "go" on the guide
 * "Philosophers and music"). The marks are adaptation studies' standard three (Geoffrey Wagner, The Novel and the
 * Cinema, 1975): a transposition gives the work as written, a commentary alters it on purpose, an analogy tells a new
 * story somewhere else that follows the old one. Under the mark go facts an editor checked, never a grade and never a
 * model's words. Only adaptations that play in Scholē are listed. Pure: no I/O.
 */
import { ab, type CollectionItem } from "./collections";

export type AdaptationMode = "transposition" | "commentary" | "analogy";

export const MODE_LABEL: Record<AdaptationMode, string> = { transposition: "Transposition", commentary: "Commentary", analogy: "Analogy" };
export const MODE_MEANS: Record<AdaptationMode, string> = {
  transposition: "The work as written, as close as it can be done.",
  commentary: "The work altered on purpose, to say something about it.",
  analogy: "A new story set somewhere else that follows the old one.",
};
/** Most faithful first. */
const ORDER: readonly AdaptationMode[] = ["transposition", "commentary", "analogy"];

export type Adaptation = {
  /** The work it is made from (an id in `topic-pages.ts`). */
  of: string;
  item: CollectionItem;
  /** When it was made. */
  when: string;
  mode: AdaptationMode;
  /** What an editor checked: what it keeps, what it changes, where and when it is set. */
  facts: readonly string[];
};

const A = (of: string, item: CollectionItem, when: string, mode: AdaptationMode, facts: string[]): Adaptation => ({ of, item, when, mode, facts });

export const ADAPTATIONS: readonly Adaptation[] = [
  A("iliad", ab("5192", "Troilus and Cressida", "William Shakespeare"), "about 1602", "commentary", [
    "Set at Troy in the seventh year of the war, with Homer's Achilles, Hector, Ajax and Ulysses.",
    "The love story of Troilus and Cressida is medieval (Boccaccio, Chaucer), not Homer's.",
    "Its heroes are vain and its war is over a quarrel; Achilles has Hector killed unarmed.",
  ]),
  A("odyssey", ab("457", "Ulysses", "James Joyce"), "1922", "analogy", [
    "One day in Dublin, 16 June 1904.",
    "Its eighteen episodes follow the Odyssey's: Leopold Bloom is Odysseus, Stephen Dedalus Telemachus, Molly Bloom Penelope.",
    "No gods, no war and no sea voyage; the episode titles were Joyce's, left out of the printed book.",
  ]),
  A("iphigenia", ab("16699", "Iphigenia", "Jean Racine"), "1674", "commentary", [
    "Set at Aulis, as Euripides set it, in five acts of French verse.",
    "Adds Eriphile, a captive who turns out to be another Iphigenia; she dies at the altar and Agamemnon's daughter lives.",
    "Racine's preface says a goddess and a deer at the altar would be too hard for his audience to believe.",
  ]),
  A("tauris", ab("21549", "Iphigenia in Tauris", "Johann Wolfgang von Goethe"), "1787", "commentary", [
    "Keeps Euripides' story: Iphigenia, a priestess among the Taurians, and her brother Orestes, sent to be sacrificed.",
    "Iphigenia wins their freedom by telling King Thoas the truth instead of tricking him.",
    "No goddess ends the play; Thoas lets them go.",
  ]),
  A("medea", ab("18992", "Medea", "Seneca"), "1st century AD", "commentary", [
    "Roman, in Latin verse, written to be read aloud or staged for a few.",
    "Medea kills her children in front of Jason; Euripides kept the killing offstage.",
    "Her magic takes a whole act.",
  ]),
  A("oedipus", ab("20245", "Oedipus", "Seneca"), "1st century AD", "commentary", [
    "Roman, in Latin verse.",
    "Adds a scene where the ghost of Laius is raised from the dead to name his killer.",
    "Jocasta kills herself with a sword in front of Oedipus; in Sophocles she hangs herself offstage.",
  ]),
  A("oresteia", ab("19482", "Agamemnon", "Seneca"), "1st century AD", "commentary", [
    "Roman, in Latin verse; follows only the first play of the trilogy.",
    "Opens with the ghost of Thyestes; Cassandra watches the murder and tells it.",
    "Ends with Electra sending Orestes away to safety, with no trial to come.",
  ]),
];

/** A work's adaptations, most faithful first. */
export function adaptationsOf(work: string): Adaptation[] {
  return ADAPTATIONS.filter((a) => a.of === work).sort((a, b) => ORDER.indexOf(a.mode) - ORDER.indexOf(b.mode));
}
