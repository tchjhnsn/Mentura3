/** Forms added to the Greek, Roman and Stoic topic pages, each id prefixed with its topic ("greeks:music"); one with the same id replaces the old one. Pure: no I/O. */
import type { CollectionItem } from "./collections";
import type { TopicForm } from "./topic-pages";
import { SEIKILOS } from "./people-ancient";

// Gregorio Paniagua and Atrium Musicae de Madrid, in Apple Music's player: previews for everyone, whole tracks for its subscribers.
const PANIAGUA: CollectionItem = {
  kind: "find", medium: "music", title: "Musique de la Grèce antique", by: "Gregorio Paniagua, Atrium Musicae de Madrid",
  url: "https://music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071",
  image: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c7/8d/f4/c78df426-5e97-0b8c-fa50-614f2da09c79/5414939990168_cover.jpg/600x600bb.jpg",
  why: "The surviving fragments of Greek music played on copies of Greek instruments, from a chorus of Euripides' Orestes to the Seikilos song.",
};

export const ANCIENT_FORMS: readonly TopicForm[] = [
  { id: "greeks:music", label: "Music", where: "Greek music that survives with its notes, 5th century BC to 2nd century AD", items: [SEIKILOS, PANIAGUA] },
];
