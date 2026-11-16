import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { collectionById, itemKey } from "./collections";
import { formItems, playlistsOf, TOPIC_PAGES, topicCandidates, topicPageById, versionLine, workById, workOf, WORKS } from "./topic-pages";
import { embedOf } from "./media";
import { playsHere } from "./browse-media";

const catalogue = new Map(readFileSync(new URL("../../../web/src/data/audiobooks.txt", import.meta.url), "utf8").split("\n").map((l) => { const f = l.split("|"); return [f[0], f] as const; }));

describe("topic pages", () => {
  it("start each topic with a playlist chosen by a person, and every form holds something", () => {
    const ids = new Set<string>();
    for (const t of TOPIC_PAGES) {
      expect(ids.has(t.id), t.id).toBe(false); ids.add(t.id);
      const start = collectionById(t.start);
      expect(start, t.id).toBeTruthy();
      expect(playlistsOf(t)[0]!.id).toBe(t.start);
      for (const f of t.forms) expect(formItems(f).length, `${t.id}/${f.id}`).toBeGreaterThan(0);
      expect(t.people.length).toBeGreaterThan(2);
    }
  });

  it("puts The Greeks' playlists inside it: Homer to Socrates first, then the others", () => {
    const g = topicPageById("greeks")!;
    expect(playlistsOf(g).map((c) => c.id)).toEqual(["greeks", "socrates", "atreus", "thebes"]);
    expect(g.forms.map((f) => f.label)).toEqual(["Epic", "Tragedy", "Comedy", "Dialogues", "Treatises", "Histories and lives", "Music", "Art", "Lectures", "Podcasts"]);
  });

  it("names each work once, under a form of its topic, with recordings by the same author in the catalogue", () => {
    const seen = new Set<string>();
    for (const w of WORKS) {
      expect(seen.has(w.id), w.id).toBe(false); seen.add(w.id);
      const t = topicPageById(w.topic)!;
      expect(t.forms.find((f) => f.id === w.form)?.works, w.id).toContain(w.id);
      for (const id of w.audiobooks) {
        const line = catalogue.get(id);
        expect(line, `${w.id}: ${id}`).toBeTruthy();
        expect(line![2]!.toLowerCase(), `${w.id}: ${id}`).toContain(w.by.split(" ").at(-1)!.toLowerCase());
      }
    }
  });

  it("says which versions a work has, and finds the work a recording or version belongs to", () => {
    const iliad = workById("iliad")!;
    expect(versionLine(iliad)).toBe("listen · podcast · art");
    expect(workOf({ kind: "audiobook", id: "5513", title: "Iliad", by: "Homer" })?.id).toBe("iliad");
    expect(workOf({ kind: "audiobook", id: "1", title: "x", by: "y" })).toBeUndefined();
  });

  it("offers each thing once to a playlist made for you", () => {
    const keys = topicCandidates(topicPageById("greeks")!).map(itemKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("audiobook:663");
    expect(keys).toContain("music|musique de la grèce antique");
  });

  it("plays an Apple Music album here, in a player tall enough for its tracks", () => {
    const url = "https://music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071";
    expect(embedOf(url)).toEqual({ kind: "frame", src: "https://embed.music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071", site: "Apple Music", tall: false, list: true });
    expect(playsHere({ medium: "music", url })).toBe(true);
  });
});
