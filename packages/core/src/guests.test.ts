import { describe, expect, it } from "vitest";
import { appleAppearances, bareName, episodeBooks, episodeGuests, sameBook, showBooks, showGuests, wikiBio } from "./guests";
import type { NoteBlock } from "./podcasts";

const p = (text: string, href?: string) => (href ? { text, href } : { text });
const line = (...parts: { text: string; href?: string }[]): NoteBlock => ({ list: false, parts });
const show = { title: "Lex Fridman Podcast", author: "Lex Fridman", people: [] };
const ep = (title: string, notes: NoteBlock[], key = title) => ({ key, title, notes, people: [] });

describe("episodeGuests", () => {
  it("finds the guest in the title when the notes name them too", () => {
    const e = ep("#499 – Gary Gallagher: American Civil War, Slavery, Lincoln", [line(p("Gary Gallagher is a historian of the American Civil War.")), line(p("Gary’s Wikipedia:"), p("https://en.wikipedia.org/wiki/Gary_W._Gallagher", "https://en.wikipedia.org/wiki/Gary_W._Gallagher"))]);
    expect(episodeGuests(e, show)).toEqual([{ name: "Gary Gallagher", wiki: "https://en.wikipedia.org/wiki/Gary_W._Gallagher" }]);
  });
  it("reads a show's pipe form and the notes' opening, never the host", () => {
    expect(episodeGuests(ep("Access the Sublime | Robert Greene", []), { title: "Huberman Lab", author: "Scicomm Media", people: [] }).map((g) => g.name)).toEqual(["Robert Greene"]);
    expect(episodeGuests(ep("Ten-year trends", [line(p("Kevin Ryan is one of the leading entrepreneurs in New York."))]), show).map((g) => g.name)).toEqual(["Kevin Ryan"]);
    expect(episodeGuests(ep("#1 – Lex Fridman: a solo episode", [line(p("Lex Fridman is the host."))]), show)).toEqual([]);
  });
  it("does not take a phrase in the title for a name", () => {
    expect(episodeGuests(ep("#880: Relationship Tools That Work — Esther Perel, Brené Brown", []), show)).toEqual([]);
    expect(episodeGuests(ep("#886: The Random Show — AI Super Assistants", []), show)).toEqual([]);
  });
  it("collects a show's guests with their episodes", () => {
    const s = { ...show, episodes: [ep("A | Dr. Anna Lembke", [], "a"), ep("B | Anna Lembke", [], "b")] };
    expect(showGuests(s)).toEqual([{ name: "Dr. Anna Lembke", episodes: ["a", "b"] }]);
    expect(bareName("Dr. Anna Lembke")).toBe("Anna Lembke");
  });
});

describe("episodeBooks", () => {
  it("reads books from store links, marked lines and authors", () => {
    const notes: NoteBlock[] = [
      line(p("The Union War (book):"), p("https://amzn.to/3QT1jED", "https://amzn.to/3QT1jED")),
      line(p("Range", "https://bookshop.org/p/range"), p(" by David Epstein")),
      line(p("Upwork: hiring."), p("https://amzn.to/x", "https://amzn.to/x")),
      line(p("Audible: get 30-day free trial", "https://audible.com/lex")),
    ];
    expect(episodeBooks(notes)).toEqual([
      { title: "The Union War", href: "https://amzn.to/3QT1jED" },
      { title: "Range", author: "David Epstein", href: "https://bookshop.org/p/range" },
    ]);
  });
  it("counts a show's most mentioned books", () => {
    const b = line(p("Dear Reader (book):"), p("https://amzn.to/a", "https://amzn.to/a"));
    expect(showBooks({ episodes: [ep("1", [b], "1"), ep("2", [b], "2")] })).toEqual([{ title: "Dear Reader", href: "https://amzn.to/a", count: 2 }]);
  });
  it("matches a catalog title", () => {
    expect(sameBook("The Union War", "The Union War")).toBe(true);
    expect(sameBook("Lee and His Generals", "Lee and His Generals in War and Memory")).toBe(true);
    expect(sameBook("Great", "The Great Gatsby")).toBe(false);
  });
});

describe("appearances and bios", () => {
  it("keeps Apple's episodes that name the person", () => {
    const text = JSON.stringify({ results: [
      { trackName: "Robert Greene on power", collectionName: "Show A", feedUrl: "https://a.example/feed", episodeGuid: "g1", releaseDate: "2026-01-02T00:00:00Z", trackTimeMillis: 3600000, artworkUrl600: "https://img/a.jpg", collectionId: 1 },
      { trackName: "Something else", description: "nothing", collectionName: "Show B", feedUrl: "https://b.example/feed", episodeGuid: "g2" },
    ] });
    expect(appleAppearances(text, "Robert Greene")).toEqual([{ title: "Robert Greene on power", show: "Show A", feed: "https://a.example/feed", guid: "g1", date: "2026-01-02", seconds: 3600, image: "https://img/a.jpg", collection: "1" }]);
  });
  it("reads a person's Wikipedia summary and refuses a disambiguation", () => {
    const page = { type: "standard", title: "Gary W. Gallagher", description: "American historian", extract: "Gary William Gallagher is an American historian.", thumbnail: { source: "https://up/g.jpg" }, content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Gary_W._Gallagher" } } };
    expect(wikiBio(JSON.stringify(page))).toEqual({ name: "Gary W. Gallagher", about: "Gary William Gallagher is an American historian.", description: "American historian", image: "https://up/g.jpg", href: "https://en.wikipedia.org/wiki/Gary_W._Gallagher" });
    expect(wikiBio(JSON.stringify({ ...page, type: "disambiguation" }))).toBeNull();
  });

  it("leaves out segments named for the show or an event", () => {
    const show = { title: "All-In with Chamath, Jason, Sacks & Friedberg", author: "All-In Podcast, LLC", people: [] };
    const ep = (title: string) => ({ title, notes: [], people: [] });
    expect(episodeGuests(ep("All-In Summit: Tucker Carlson"), show).map((g) => g.name)).not.toContain("All-In Summit");
    expect(episodeGuests({ title: "Trump's week with Ben Shapiro", notes: [{ parts: [{ text: "We talk with Ben Shapiro about the week." }] }] as never, people: [] }, show).map((g) => g.name)).toEqual(["Ben Shapiro"]);
    expect(episodeGuests({ title: "x", notes: [], people: [{ name: "All-In DC", role: "guest", href: null, image: null }, { name: "Sam Altman", role: "guest", href: null, image: "https://i.example/s.jpg" }] }, show)).toEqual([{ name: "Sam Altman", image: "https://i.example/s.jpg" }]);
    expect(episodeGuests({ title: "x", notes: [], people: [{ name: "Liquidity IPO Panel", role: "guest", href: null, image: null }] }, show)).toEqual([]);
  });

  it("does not count the hosts a show's description names as its guests", () => {
    const people = (name: string) => [{ name, role: "guest", href: null, image: null }];
    const show = { title: "All-In", author: null, about: "Besties Chamath Palihapitiya, Jason Calacanis, David Sacks & David Friedberg.", people: [], episodes: [{ key: "a", title: "x", notes: [], people: people("David Sacks") }, { key: "b", title: "y", notes: [], people: people("Sam Altman") }] };
    expect(showGuests(show).map((g) => g.name)).toEqual(["Sam Altman"]);
  });
});
