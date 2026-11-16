import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { commons, type CollectionItem } from "./collections";
import { ERAS, REL_ORDER } from "./historical";
import { audioOf } from "./media";
import { cite, hasWorks, namedIn, PEOPLE, personByOl, personNamed, relationsOf, tabsOf } from "./historical-people";
import { TOPIC_PAGES, topicPageById, workById } from "./topic-pages";

/** Every recording named anywhere on a person's page. */
const itemsOf = (x: (typeof PEOPLE)[number]): CollectionItem[] => [
  ...(typeof x.start === "string" ? [] : [x.start]), ...(x.by ?? []), ...(x.aboutThem ?? []), ...x.from, ...x.later,
  ...x.read.flatMap((r) => (r.item ? [r.item] : [])), ...(x.music?.time ?? []), ...(x.music?.ages.flatMap((a) => a.items) ?? []),
];

// The LibriVox catalogue Scholē plays from (id|title|author|...).
const CATALOGUE = new Set(readFileSync(new URL("../../../web/src/data/audiobooks.txt", import.meta.url), "utf8").split("\n").map((l) => l.split("|")[0]));

describe("people in history", () => {
  it("have unique ids and names, an era, and topics with pages", () => {
    expect(new Set(PEOPLE.map((x) => x.id)).size).toBe(PEOPLE.length);
    expect(new Set(PEOPLE.map((x) => x.name.toLowerCase())).size).toBe(PEOPLE.length);
    for (const x of PEOPLE) {
      expect(ERAS.some((e) => e.id === x.era), x.id).toBe(true);
      expect(x.topics.length, x.id).toBeGreaterThan(0);
      for (const t of x.topics) expect(topicPageById(t), `${x.id} ${t}`).toBeDefined();
      // A name the people route accepts.
      expect(x.name, x.id).toMatch(/^[\p{L}][\p{L}'’. -]{2,79}$/u);
    }
  });

  it("names only works that have pages, and starts with one of theirs or one about them", () => {
    for (const x of PEOPLE) {
      if (typeof x.start === "string") expect(workById(x.start), x.id).toBeDefined();
      for (const w of [...x.works, ...(x.aboutWorks ?? []), ...(x.theatre?.plays ?? [])]) expect(workById(w), `${x.id} ${w}`).toBeDefined();
      for (const n of x.named ?? []) {
        expect(Boolean(n.work) !== Boolean(n.lost), `${x.id} ${n.names}: a work page or lost, not both`).toBe(true);
        if (n.work) expect(workById(n.work), `${x.id} ${n.work}`).toBeDefined();
      }
      for (const r of x.read) if (r.work) expect(workById(r.work), `${x.id} ${r.title}`).toBeDefined();
      expect(hasWorks(x) || (x.aboutWorks?.length ?? 0) + (x.aboutThem?.length ?? 0) > 0, `${x.id}: something by or about them`).toBe(true);
    }
  });

  it("plays only recordings in the catalogue", () => {
    const ids = [...PEOPLE.flatMap(itemsOf), ...TOPIC_PAGES.flatMap((t) => t.forms.flatMap((f) => f.items ?? []))].flatMap((i) => (i.kind === "audiobook" ? [i.id] : []));
    for (const id of ids) expect(CATALOGUE.has(id), id).toBe(true);
  });

  it("gives every free recording its credit", () => {
    const free = [...PEOPLE.flatMap(itemsOf), ...TOPIC_PAGES.flatMap((t) => t.forms.flatMap((f) => f.items ?? []))].filter((i) => i.kind === "find" && audioOf(i.url));
    expect(free.length).toBeGreaterThan(0);
    for (const i of free) expect(i.kind === "find" && i.credit, i.title).toBeTruthy();
  });

  it("proves each book they read with a passage, and ties each relation with a line of fact", () => {
    for (const x of PEOPLE) {
      for (const r of x.read) { expect(r.at.work && r.at.at, `${x.id} ${r.title}`).toBeTruthy(); expect(r.note, `${x.id} ${r.title}`).toBeTruthy(); }
      for (const r of x.relations) { expect(REL_ORDER).toContain(r.rel); expect(r.note, `${x.id} ${r.name}`).toBeTruthy(); }
    }
  });

  it("quotes only with a translator, and says when a section is rebuilt", () => {
    for (const x of PEOPLE) {
      for (const a of [...(x.music?.words ?? []), ...(x.theatre?.words ?? []), ...x.read.map((r) => r.at)]) if (a.words) expect(a.tr || a.en, `${x.id} ${a.at}: a translator, or written in English`).toBeTruthy();
      for (const s of [x.music, x.theatre]) if (s?.stance === "rebuilt") expect(s.note, x.id).toBeTruthy();
    }
  });

  it("marks every across-the-ages playlist as chosen by Reflect's editors", () => {
    for (const x of PEOPLE) for (const a of x.music?.ages ?? []) {
      expect(a.about, `${x.id} ${a.name}`).toMatch(/Reflect's editors/);
      for (const i of a.items) expect(i.why, `${x.id} ${i.title}`).toBeTruthy();
    }
  });

  it("orders tabs: works, their own sections, people, reading, read about, then their time", () => {
    expect(tabsOf(personNamed("Plato")!)).toEqual(["works", "music", "theatre", "people", "read", "about"]);
    expect(tabsOf(personNamed("marcus aurelius")!)).toEqual(["works", "theatre", "people", "read", "about", "music"]);
    expect(tabsOf(personNamed("Socrates")!).at(-1)).toBe("time");
  });

  it("finds people by name and author id, and cites passages by title", () => {
    expect(personByOl("OL22105A")?.id).toBe("aristotle");
    expect(cite({ work: "republic", at: "III, 401d" })).toBe("Republic III, 401d");
    expect(cite({ work: "Cratylus", at: "402a" })).toBe("Cratylus 402a");
  });

  it("groups who they knew by the tie", () => {
    expect(relationsOf(personNamed("Plato")!).map((g) => g.rel)).toEqual(["teacher", "student", "friend", "ruler", "contemporary"]);
  });

  it("links a named work back to the passages that name it", () => {
    expect(namedIn("clouds").map((c) => c.by.id)).toEqual(["plato"]);
    expect(namedIn("oedipus").map((c) => c.by.id).sort()).toEqual(["aristotle", "marcus-aurelius"]);
  });
});

describe("free recordings", () => {
  it("play the MP3 copy Commons makes, with the file's page for its licence", () => {
    const i = commons("b/b6", "Epitaph of Seikilos.ogg", "Seikilos", "Marcus Harvey", "CC BY-SA 2.5");
    expect(i.kind === "find" && i.credit).toBe("CC BY-SA 2.5");
    expect(audioOf(i.kind === "find" ? i.url : null)).toEqual({
      src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b6/Epitaph_of_Seikilos.ogg/Epitaph_of_Seikilos.ogg.mp3",
      page: "https://commons.wikimedia.org/wiki/File:Epitaph_of_Seikilos.ogg",
      file: "Epitaph_of_Seikilos.ogg",
    });
    expect(audioOf("https://upload.wikimedia.org/wikipedia/commons/3/33/Chester.mp3")?.src).toBe("https://upload.wikimedia.org/wikipedia/commons/3/33/Chester.mp3");
    expect(audioOf("https://music.apple.com/us/album/x/1")).toBeNull();
    expect(audioOf("https://upload.wikimedia.org/wikipedia/commons/b/c6/x.ogg")).toBeNull();
  });
});
