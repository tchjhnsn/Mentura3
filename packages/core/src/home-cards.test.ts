import { describe, expect, it } from "vitest";
import { cardLines, cardsToday, cardSummary, cleanContent, HOME_CARD_TILES, markToday, newCard, readCard, streakOf, toggleItem, wordToday, type HomeCard } from "./home-cards";

const today = "2026-11-17";
const words = [{ word: "laconic", meaning: "using few words" }, { word: "sanguine", meaning: "hopeful" }, { word: "pellucid", meaning: "clear" }];
const card = (id: string, created: string, start = "2026-11-01", end = "2026-11-30", content: HomeCard["content"] = { kind: "figure", value: "3", label: "books" }): HomeCard =>
  ({ id, tile: "learn", title: id, start, end, schedule: null, content, created });

describe("home cards", () => {
  it("belong to Home's tiles", () => {
    expect(HOME_CARD_TILES).toContain("learn");
    expect(HOME_CARD_TILES).toContain("friends");
    expect(newCard({ tile: "nowhere", title: "x", content: { kind: "figure", value: "1", label: "a" } }, today, "a", "t")).toHaveProperty("error");
  });

  it("start today and show for thirty days unless told otherwise", () => {
    const c = newCard({ tile: "learn", title: "Words", content: { kind: "word", words }, schedule: "daily" }, today, "a", "2026-11-17T10:00:00Z");
    expect(c).toMatchObject({ start: today, end: "2026-12-16", schedule: "daily" });
    expect(newCard({ tile: "learn", title: "W", content: { kind: "word", words: words.slice(0, 1) }, schedule: "daily" }, today, "a", "t")).toMatchObject({ schedule: null });
    expect(newCard({ tile: "learn", title: "W", content: { kind: "word", words }, end: "2026-11-01" }, today, "a", "t")).toHaveProperty("error");
    expect(newCard({ tile: "learn", title: "W", content: { kind: "word", words }, end: "2028-01-01" }, today, "a", "t")).toHaveProperty("error");
  });

  it("keep a source only when one is given, and drop words with no meaning", () => {
    expect(cleanContent({ kind: "word", words: [{ word: "a", meaning: "b", source: "Merriam-Webster" }, { word: "c" }] })).toEqual({ kind: "word", words: [{ word: "a", meaning: "b", source: "Merriam-Webster" }] });
    expect(cleanContent({ kind: "checklist", items: ["one", { text: "two", done: true }, ""] })).toEqual({ kind: "checklist", items: [{ text: "one", done: false }, { text: "two", done: true }] });
    expect(cleanContent({ kind: "figure", value: 12, label: "miles" })).toEqual({ kind: "figure", value: "12", label: "miles" });
    expect(cleanContent({ kind: "other" })).toBeNull();
  });

  it("show at most three, newest first, and none that ended or have not started", () => {
    const list = [card("old", "2026-11-01T00:00:00Z"), card("ended", "2026-11-16T00:00:00Z", "2026-11-01", "2026-11-16"), card("later", "2026-11-16T00:00:00Z", "2026-11-18"),
      card("b", "2026-11-10T00:00:00Z"), card("c", "2026-11-12T00:00:00Z"), card("d", "2026-11-15T00:00:00Z"), card("last", "2026-11-17T00:00:00Z", "2026-11-01", today)];
    expect(cardsToday(list, today).map((c) => c.id)).toEqual(["last", "d", "c"]);
  });

  it("give one word a day from the list, going round", () => {
    expect(wordToday(words, "2026-11-15", "2026-11-15")?.word).toBe("laconic");
    expect(wordToday(words, "2026-11-15", "2026-11-16")?.word).toBe("sanguine");
    expect(wordToday(words, "2026-11-15", "2026-11-18")?.word).toBe("laconic");
    expect(wordToday(words, "2026-11-15", "2026-11-18", null)?.word).toBe("laconic");
    expect(wordToday([], "2026-11-15", today)).toBeNull();
  });

  it("toggle one checklist item and leave the rest", () => {
    const c = card("x", "t", undefined, undefined, { kind: "checklist", items: [{ text: "a", done: false }, { text: "b", done: false }] });
    const once = toggleItem(c, 1);
    expect(once.content).toEqual({ kind: "checklist", items: [{ text: "a", done: false }, { text: "b", done: true }] });
    expect(toggleItem(once, 1).content).toEqual(c.content);
    expect(toggleItem(c, 5)).toBe(c);
  });

  it("count a streak ending today or yesterday", () => {
    const s = card("s", "t", undefined, undefined, { kind: "streak", label: "Read", days: ["2026-11-15", "2026-11-16"] });
    expect(streakOf(["2026-11-15", "2026-11-16"], today)).toBe(2);
    const marked = markToday(s, today);
    expect(marked.content.kind === "streak" && streakOf(marked.content.days, today)).toBe(3);
    expect(markToday(marked, today).content).toEqual(s.content);
    expect(streakOf(["2026-11-10"], today)).toBe(0);
  });

  it("read back only what is a card, and say each in a line", () => {
    const c = newCard({ tile: "learn", title: "Words", content: { kind: "word", words }, schedule: "daily", start: "2026-11-16" }, today, "a", "t") as HomeCard;
    expect(readCard(JSON.parse(JSON.stringify(c)))).toEqual(c);
    expect(readCard({ id: "a" })).toBeNull();
    expect(cardSummary(c, today)).toBe("Words (word, learn, 2026-11-16 to 2026-12-15, one a day from 3): sanguine, hopeful");
    expect(cardLines(c, today)).toEqual(["sanguine: hopeful"]);
    expect(cardLines(card("f", "t", undefined, undefined, { kind: "figure", value: "12", label: "miles", source: "Strava" }), today)).toEqual(["12 miles", "Source: Strava"]);
  });
});
