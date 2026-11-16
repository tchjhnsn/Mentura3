/** Playlists for the medieval topic, its Start here first. Object literals only: `collections.ts` imports this. Pure: no I/O. */
import type { Collection } from "./collections";

export const MEDIEVAL_PLAYLISTS: readonly Collection[] = [
  {
    id: "medieval", name: "The Middle Ages", by: "Reflect's editors", for: [], topics: ["medieval"],
    about: "A path from Augustine to Chaucer: a conversion, a prisoner's philosophy, an emperor's life, an abbess's song, a friar's questions and Dante's journey, with a podcast between the books.",
    items: [
      { kind: "audiobook", id: "754", title: "Confessions", by: "Augustine", why: "Augustine's life up to his conversion in 386, told as a prayer." },
      { kind: "audiobook", id: "85", title: "Consolation of Philosophy", by: "Boethius", why: "Written in prison in 524 and read in every century after." },
      { kind: "audiobook", id: "5571", title: "Rule of St. Benedict", by: "Benedict of Nursia", why: "The short rule most monasteries of the West lived by." },
      { kind: "audiobook", id: "1536", title: "Life of Charlemagne", by: "Einhard", why: "The emperor as a man of his court remembered him." },
      { kind: "find", medium: "music", title: "O frondens virga", by: "Hildegard of Bingen, 12th century; sung by Makemi", url: "https://upload.wikimedia.org/wikipedia/commons/a/ad/O_frondens_2.ogg", credit: "Makemi, Public domain", why: "A song by the 12th-century abbess of Rupertsberg, whose songs survive with their melodies." },
      { kind: "episode", feed: "https://podcasts.files.bbci.co.uk/b006qykl.rss", show: "In Our Time", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/f3/12/e7/f312e703-b626-0091-5bdf-73d79cce25c5/mza_16900938594910783199.jpg/600x600bb.jpg", key: "1argen01ya33d3", title: "The Medieval University", by: "Melvyn Bragg and guests", why: "The first universities, among them Paris, where Aquinas taught." },
      { kind: "audiobook", id: "2443", title: "Summa Theologica, Part I", by: "Thomas Aquinas", why: "The opening questions: what theology is, and whether God exists." },
      { kind: "audiobook", id: "67", title: "Divine Comedy", by: "Dante Alighieri", why: "Hell, Purgatory and Paradise, with the people of his age in each." },
      { kind: "audiobook", id: "342", title: "Canterbury Tales", by: "Geoffrey Chaucer", why: "Pilgrims of every rank telling stories on the road, at the end of the 14th century." },
    ],
  },
];
