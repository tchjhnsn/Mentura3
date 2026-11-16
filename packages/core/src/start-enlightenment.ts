/** Playlists for the enlightenment topic, its Start here first. Object literals only: `collections.ts` imports this. Pure: no I/O. */
import type { Collection } from "./collections";

export const ENLIGHTENMENT_PLAYLISTS: readonly Collection[] = [
  {
    id: "enlightenment", name: "The Enlightenment", by: "Reflect's editors", for: [], topics: ["enlightenment"],
    about: "A path from Locke to Adam Smith: government by consent, the separation of powers, a satire on optimism, the social contract, a philosopher's doubts and the case for free trade, with a podcast between the books.",
    items: [
      { kind: "audiobook", id: "2361", title: "Two Treatises of Government", by: "John Locke", why: "Government by consent, written in the years of the Glorious Revolution." },
      { kind: "audiobook", id: "14476", title: "Letters on England", by: "Voltaire", why: "A Frenchman's three years in England, and what he learned there from Locke and Newton." },
      { kind: "audiobook", id: "5055", title: "Spirit of Laws (Volume 1)", by: "Montesquieu", why: "Laws and the peoples they fit, and the separation of powers the American framers cited." },
      { kind: "audiobook", id: "801", title: "Candide", by: "Voltaire", why: "A short, fast satire on the claim that all is for the best." },
      { kind: "audiobook", id: "2230", title: "Social Contract", by: "Jean-Jacques Rousseau", why: "How a people can be free under laws they give themselves." },
      { kind: "episode", feed: "https://podcasts.files.bbci.co.uk/b006qykl.rss", show: "In Our Time", image: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/f3/12/e7/f312e703-b626-0091-5bdf-73d79cce25c5/mza_16900938594910783199.jpg/600x600bb.jpg", key: "ec0accbc56tz", title: "The Enlightenment in Scotland", by: "Melvyn Bragg and guests", why: "Edinburgh and Glasgow, where Hume and Smith worked." },
      { kind: "audiobook", id: "944", title: "Enquiry Concerning Human Understanding", by: "David Hume", why: "Why we expect the future to be like the past." },
      { kind: "audiobook", id: "1756", title: "Wealth of Nations, Book 1", by: "Adam Smith", why: "The division of labour, published in 1776." },
    ],
  },
];
