/**
 * Subjects for discovery (Torian, 2026-11-16 07:23Z and 07:33Z: more subjects than philosophy, including the lives of
 * founders, leaders and athletes, communication, strategy, psychology, economics and the sciences). Each subject has
 * the shows Reflect's editors put first (decision card 08:24Z: "Editors' canon, then listens"), checked on Apple
 * Podcasts on 2026-11-16, and the words a search for more shows uses. Apple's results follow the editors' picks.
 */
import type { Found } from "./lookup";

export type Subject = { id: string; label: string; search: string; picks: readonly Found[] };

const apple = (title: string, by: string, id: string, image: string): Found => ({
  medium: "podcast", title, by, url: `https://podcasts.apple.com/us/podcast/${id}`, image: `https://is1-ssl.mzstatic.com/image/thumb/${image}/600x600bb.jpg`, source: "Apple Podcasts",
});

export const SUBJECTS: readonly Subject[] = [
  {
    id: "lives", label: "Lives of founders and leaders", search: "biography",
    picks: [
      apple("Founders", "David Senra", "founders/id1141877104", "Podcasts211/v4/ed/71/4f/ed714f67-f095-a4ef-f38e-d8c02300666a/mza_11432355988627368701.jpg"),
      apple("How to Take Over the World", "Ben Wilson", "how-to-take-over-the-world/id1333158713", "Podcasts116/v4/fc/d5/a9/fcd5a9ec-a5f3-d891-f29b-28f32849e305/mza_18078634687205454841.jpeg"),
      apple("Acquired", "Ben Gilbert and David Rosenthal", "acquired/id1050462261", "Podcasts211/v4/a8/e1/de/a8e1deff-9f88-4e55-a541-b0dc793c0cdc/mza_11539673419613154037.jpg"),
    ],
  },
  {
    id: "philosophy", label: "Philosophy", search: "philosophy",
    picks: [
      apple("In Our Time: Philosophy", "BBC Radio 4", "in-our-time-philosophy/id463701671", "Podcasts115/v4/15/c5/24/15c52417-28ea-924c-9961-51a05b69e128/mza_17935685102172733383.jpg"),
      apple("History of Philosophy Without Any Gaps", "Peter Adamson", "history-of-philosophy-without-any-gaps/id396903391", "Podcasts115/v4/01/76/52/01765219-d70c-a243-1924-0c5651c8604d/mza_11881655681855403902.jpg"),
      apple("Philosophize This!", "Stephen West", "philosophize-this/id659155419", "Podcasts211/v4/c1/b7/51/c1b751eb-ab38-f11c-d6c1-0a9de79b7061/mza_12134548126279202007.jpg"),
      apple("The Partially Examined Life Philosophy Podcast", "Mark Linsenmayer, Wes Alwan, Seth Paskin, Dylan Casey", "the-partially-examined-life-philosophy-podcast/id318345767", "Podcasts114/v4/32/eb/a9/32eba9ac-dfb0-618b-e874-6696c69ea59d/mza_257738567509116492.jpeg"),
    ],
  },
  {
    id: "history", label: "History", search: "history",
    picks: [
      apple("The Rest Is History", "Goalhanger", "the-rest-is-history/id1537788786", "Podcasts211/v4/12/e4/4e/12e44e6e-f250-0621-75c4-668fda6c48a3/mza_9347628783012573828.jpg"),
      apple("Dan Carlin's Hardcore History", "Dan Carlin", "dan-carlins-hardcore-history/id173001861", "Podcasts115/v4/49/b7/eb/49b7eb32-8f08-6fac-aadb-2f002131fe5f/mza_15196161972010256532.jpg"),
      apple("Revolutions", "Mike Duncan", "revolutions/id703889772", "Podcasts/v4/fc/90/04/fc9004c7-afd6-4b5e-5033-0fb3dfd6c3a3/mza_7623711418780898276.jpg"),
    ],
  },
  {
    id: "strategy", label: "Strategy and systems thinking", search: "strategy",
    picks: [
      apple("The Knowledge Project", "Shane Parrish", "the-knowledge-project/id990149481", "Podcasts211/v4/4a/9c/e2/4a9ce2fd-ddf6-0d00-8760-4e7167378ecf/mza_16600443422050351456.jpeg"),
      apple("Invest Like the Best with Patrick O'Shaughnessy", "Colossus", "invest-like-the-best-with-patrick-oshaughnessy/id1154105909", "Podcasts211/v4/61/ae/be/61aebe7a-06e8-7390-3ae5-f2fc5889e36c/mza_10827489189939068066.jpg"),
    ],
  },
  {
    id: "character", label: "Communication, character and manners", search: "communication",
    picks: [apple("The Art of Manliness", "The Art of Manliness", "the-art-of-manliness/id332516054", "Podcasts221/v4/7c/2b/1a/7c2b1a54-a822-aafc-389b-1c9db4af258b/mza_15033168542205507721.jpeg")],
  },
  {
    id: "psychology", label: "Psychology", search: "psychology",
    picks: [apple("Hidden Brain", "Hidden Brain, Shankar Vedantam", "hidden-brain/id1028908750", "Podcasts221/v4/e2/18/b8/e218b838-b790-3a33-441f-c3772d9abbbf/mza_6896085647855199484.jpg")],
  },
  {
    id: "economics", label: "Economics", search: "economics",
    picks: [
      apple("EconTalk", "Russ Roberts", "econtalk/id135066958", "Podcasts115/v4/a0/13/c5/a013c54f-362a-670d-a75c-1c5486dfc40f/mza_6055952261821533990.jpg"),
      apple("Planet Money", "NPR", "planet-money/id290783428", "Podcasts211/v4/85/df/53/85df5334-0fae-28a9-2bc4-b97b81061d0e/mza_10839245066228881011.jpg"),
    ],
  },
  {
    id: "science", label: "Natural philosophy and science", search: "science history",
    picks: [apple("In Our Time: Science", "BBC Radio 4", "in-our-time-science/id463701000", "Podcasts115/v4/fc/5c/d3/fc5cd3ed-c802-2e8f-bf34-07e1ed1ef27e/mza_8694686899046451441.jpg")],
  },
  { id: "conflict", label: "Conflict resolution", search: "conflict resolution", picks: [] },
  { id: "marriage", label: "Marriage and family", search: "marriage family", picks: [] },
];

/** A subject's row: the editors' picks first, then the shows a search found, each once, up to a limit. */
export function subjectRow(s: Subject, found: readonly Found[], limit = 12): Found[] {
  const seen = new Set<string>();
  const key = (f: Found) => f.title.toLowerCase();
  return [...s.picks, ...found].filter((f) => (seen.has(key(f)) ? false : (seen.add(key(f)), true))).slice(0, limit);
}
