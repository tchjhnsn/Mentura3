import { describe, expect, it } from "vitest";
import { ADAPTATIONS, adaptationsOf } from "./adaptations";
import { embedOf } from "./media";
import { cite, namedIn, peopleOf, PHILOSOPHERS, philosopherByOl, philosopherNamed, tabsOf } from "./philosophers";
import { workById } from "./topic-pages";

describe("philosophers", () => {
  it("names only works that have pages, and starts with one of their own", () => {
    for (const x of PHILOSOPHERS) {
      expect(workById(x.start), x.id).toBeDefined();
      for (const w of [...x.works, ...x.theatre.plays]) expect(workById(w), `${x.id} ${w}`).toBeDefined();
      for (const n of x.named) {
        expect(workById(n.at.work), `${x.id} ${n.names}`).toBeDefined();
        expect(Boolean(n.work) !== Boolean(n.lost), `${x.id} ${n.names}: a work page or lost, not both`).toBe(true);
        if (n.work) expect(workById(n.work)).toBeDefined();
      }
      for (const a of [...x.music.words, ...x.theatre.words, ...x.music.rules.map((r) => r.at)]) expect(workById(a.work), `${x.id} ${a.at}`).toBeDefined();
    }
  });

  it("quotes only with a translator, and says when a section is rebuilt", () => {
    for (const x of PHILOSOPHERS) {
      for (const a of [...x.music.words, ...x.theatre.words]) expect(a.words && a.tr, `${x.id} ${a.at}`).toBeTruthy();
      for (const s of [x.music, x.theatre]) if (s.stance === "rebuilt") expect(s.note, x.id).toBeTruthy();
    }
  });

  it("marks every across-the-ages playlist as chosen by Reflect's editors, not the philosopher", () => {
    for (const x of PHILOSOPHERS) for (const a of x.music.ages) {
      expect(a.about, `${x.id} ${a.name}`).toMatch(/Reflect's editors/);
      for (const i of a.items) expect(i.why, `${x.id} ${i.title}`).toBeTruthy();
    }
  });

  it("puts Music and Theatre second when they wrote about them, after Read about when rebuilt", () => {
    expect(tabsOf(philosopherNamed("Plato")!)).toEqual(["works", "music", "theatre", "read", "people"]);
    expect(tabsOf(philosopherNamed("marcus aurelius")!)).toEqual(["works", "theatre", "read", "music", "people"]);
  });

  it("finds philosophers by name and author id, and cites passages by title", () => {
    expect(philosopherByOl("OL22105A")?.id).toBe("aristotle");
    expect(cite({ work: "republic", at: "III, 401d" })).toBe("Republic III, 401d");
  });

  it("links a named work back to the passages that name it", () => {
    const clouds = namedIn("clouds");
    expect(clouds.map((c) => c.by.id)).toEqual(["plato"]);
    expect(namedIn("oedipus").map((c) => c.by.id).sort()).toEqual(["aristotle", "marcus-aurelius"]);
  });

  it("shows each contemporary once", () => {
    const names = peopleOf(philosopherNamed("Plato")!).map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("plays one track of an album alone in Apple Music's player", () => {
    const url = "https://music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071?i=6771405574";
    expect(embedOf(url)).toEqual({ kind: "frame", src: "https://embed.music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071?i=6771405574", site: "Apple Music", tall: false });
  });
});

describe("adaptations", () => {
  it("are made from works with pages, each with checked facts", () => {
    for (const a of ADAPTATIONS) {
      expect(workById(a.of), a.item.title).toBeDefined();
      expect(a.facts.length, a.item.title).toBeGreaterThan(0);
    }
  });

  it("lists a work's adaptations most faithful first", () => {
    expect(adaptationsOf("odyssey").map((a) => a.mode)).toEqual(["analogy"]);
    expect(adaptationsOf("nothing")).toEqual([]);
  });
});
