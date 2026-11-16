/** Playlists for the Renaissance topic, its Start here first. Object literals only: `collections.ts` imports this. Pure: no I/O. */
import type { Collection } from "./collections";

export const RENAISSANCE_PLAYLISTS: readonly Collection[] = [
  {
    id: "renaissance", name: "Start here: the Renaissance", by: "Reflect's editors", for: [], topics: ["renaissance"],
    about: "Six books in the order they were written, from a joke dedicated to a friend to the plays of Elizabeth's London, with the music of the Chapel Royal between them.",
    items: [
      { kind: "audiobook", id: "2628", title: "The Praise of Folly", by: "Desiderius Erasmus", why: "Written in Thomas More's house in 1509 and dedicated to him: the humanists laughing at their own world." },
      { kind: "audiobook", id: "993", title: "Utopia", by: "Thomas More", why: "More's answer, seven years later: an island where no one owns anything." },
      { kind: "audiobook", id: "368", title: "The Prince", by: "Niccolò Machiavelli", why: "Written in 1513 by a Florentine put out of office, on how states are taken and kept." },
      { kind: "audiobook", id: "18859", title: "Selected Essays", by: "Michel de Montaigne", why: "A magistrate who retired to his tower to write about himself, and so about everyone." },
      { kind: "find", medium: "music", title: "If ye love me", by: "Thomas Tallis; Coro Santa Pazienza", url: "https://upload.wikimedia.org/wikipedia/commons/2/29/Tallis_-_If_ye_love_me.ogg", credit: "Coro Santa Pazienza, CC BY 3.0", why: "An English anthem by the organist of Elizabeth's chapel." },
      { kind: "audiobook", id: "2626", title: "Queen Elizabeth", by: "Jacob Abbott", why: "The queen whose reign gave England its stage." },
      { kind: "audiobook", id: "346", title: "Hamlet", by: "William Shakespeare", why: "The play of a student prince, written about 1600." },
    ],
  },
];
