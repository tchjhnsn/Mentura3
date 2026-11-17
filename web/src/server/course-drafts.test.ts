import { describe, expect, it, vi } from "vitest";
import type { BookText } from "./texts";
import type { LearnItem } from "./ways-store";

// One book Reflect holds (OL1W, the Apology) and one it does not (OL2W, no free text); one learn item with a transcript.
const ITEM = "11111111-2222-4333-8444-555555555555";
const APOLOGY: BookText = {
  source: { kind: "gutenberg", id: "1656" },
  chapters: [{ title: "Apology", paragraphs: ["", "How you have felt, O men of Athens, I cannot tell.", "The unexamined life is not worth living for a man."] }],
  notes: {},
  credit: { name: "Project Gutenberg", href: "https://www.gutenberg.org/ebooks/1656" },
};
const store = vi.hoisted(() => ({ items: [] as { medium: string; title: string; url?: string; parts?: number }[], notes: [] as { unit?: string | null; quote?: string; note?: string }[] }));

vi.mock("./passages", () => ({ heldText: async (b: { work: string }) => (b.work === "OL1W" ? APOLOGY : null) }));
vi.mock("@reflect/core/openlibrary", async (actual) => ({
  ...(await actual<typeof import("@reflect/core/openlibrary")>()),
  workEntry: async (w: string) => (w === "OL1W" ? { work: "OL1W", title: "Apology", authors: ["Plato"], subjects: [], contents: [] } : w === "OL2W" ? { work: "OL2W", title: "Ulysses", authors: ["James Joyce"], subjects: [], contents: [] } : null),
  searchBooks: async (q: string) => (/ulysses/i.test(q) ? [{ work: "OL2W", title: "Ulysses", authors: ["James Joyce"], subjects: [], contents: [] }] : []),
}));
vi.mock("./site", () => ({ siteUrl: () => "https://reflect.example" }));
vi.mock("./ways-store", () => ({
  addItem: async (_u: string, i: (typeof store.items)[number]) => { store.items.push(i); return "item-1"; },
  addItemNote: async (_u: string, _id: string, n: (typeof store.notes)[number]) => { store.notes.push(n); return "note"; },
  removeItem: async () => undefined,
  listItems: async () => [],
  getItem: async (_u: string, id: string) => (id === ITEM ? { id: ITEM, title: "Lecture on Socrates", by: "Yale", transcriptText: "0:00 Today we read the Apology.\n1:05 Socrates says the unexamined life is not worth living." } : null),
}));

const { coursesOf, draftCourse, excerpt } = await import("./course-drafts");

const lecture = { id: ITEM, medium: "lecture", title: "Lecture on Socrates", by: "Yale", transcript: true } as LearnItem;
const records = { books: [], items: [lecture] };

describe("excerpt", () => {
  it("gives a passage from a held text with its edition, ref and reading-page link", async () => {
    const r = await excerpt("u", records, { work: "OL1W", query: "unexamined life" });
    expect(r.held).toBe(true);
    if (!r.held) return;
    expect(r.source).toContain("Project Gutenberg");
    expect(r.passages[0]).toMatchObject({
      ref: { kind: "book", work: "OL1W", chapter: 1, p: 2 },
      text: "The unexamined life is not worth living for a man.",
      cite: "Plato, Apology, Apology",
      href: "/schole/works/OL1W/read?c=1&find=unexamined%20life&p=2",
    });
  });

  it("gives the passage at a place, skipping an empty paragraph", async () => {
    const r = await excerpt("u", records, { work: "OL1W", chapter: 1 });
    expect(r.held && r.passages[0]!.text).toBe("How you have felt, O men of Athens, I cannot tell.");
  });

  it("refuses a text Reflect does not hold, and a work it cannot find, returning no words", async () => {
    const unheld = await excerpt("u", records, { work: "Ulysses", query: "yes I said yes" });
    expect(unheld).toEqual({ held: false, reason: expect.stringContaining("does not hold the text of Ulysses") });
    expect((await excerpt("u", records, { work: "A book that is nowhere" })).held).toBe(false);
  });

  it("finds words in a transcript the person pasted, at their moment", async () => {
    const r = await excerpt("u", records, { work: "Socrates", query: "unexamined" });
    expect(r.held && r.passages[0]).toMatchObject({ ref: { kind: "transcript", item: ITEM, at: 65 }, cite: "Yale, Lecture on Socrates, at 1:05", href: `/schole/items/${ITEM}` });
  });
});

describe("draft_course", () => {
  const unit = (passages: { ref: unknown; words?: string }[], works: string[] = []) => ({ title: "Socrates on trial", works, passages });

  it("rejects passages that are not places in a held text, and keeps nothing", async () => {
    store.items.length = 0;
    const r = await draftCourse("u", records, {
      title: "Socrates", goal: "Read the Apology closely.",
      units: [unit([{ ref: { kind: "book", work: "OL2W", chapter: 1, p: 0 } }, { ref: { kind: "book", work: "OL1W", chapter: 1, p: 99 } }, { ref: { text: "words the model wrote" } }, { ref: { kind: "book", work: "OL1W", chapter: 1, p: 2 }, words: "not in it" }])],
    });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors).toHaveLength(4);
    expect(store.items).toHaveLength(0);
  });

  it("rejects a work it cannot find", async () => {
    const r = await draftCourse("u", records, { title: "X", goal: "Y", units: [unit([], ["A book that is nowhere"])] });
    expect(!r.ok && r.errors[0]).toMatch(/not a work Reflect holds/);
  });

  it("keeps a course as a learn item with the passages cut from the held text, and gives its page", async () => {
    store.items.length = 0;
    store.notes.length = 0;
    const r = await draftCourse("u", records, {
      title: "Socrates", goal: "Read the Apology closely.",
      units: [unit([{ ref: { kind: "book", work: "OL1W", chapter: 1, p: 2 }, words: "unexamined" }, { ref: { kind: "transcript", item: ITEM, at: 65 } }], ["Ulysses"])],
    });
    expect(r).toMatchObject({ ok: true, title: "Socrates", units: 1, passages: 2 });
    if (!r.ok) return;
    expect(r.href).toMatch(/^\/schole\/courses\/made\/[0-9a-f-]{36}$/);
    expect(store.items[0]).toMatchObject({ medium: "course", title: "Socrates", url: `https://reflect.example${r.href}`, parts: 1 });
    expect(store.notes.map((n) => n.quote).filter(Boolean)).toEqual(["The unexamined life is not worth living for a man.", "Socrates says the unexamined life is not worth living."]);
    const listed = coursesOf([{ id: "item-1", medium: "course", title: "Socrates", url: `https://reflect.example${r.href}`, status: "want" } as LearnItem]);
    expect(listed[0]).toMatchObject({ kind: "drafted", href: r.href });
  });
});
