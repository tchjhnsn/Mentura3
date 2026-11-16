import { describe, expect, it } from "vitest";
import { ADAPTATIONS, adaptationsOf } from "./adaptations";
import { embedOf } from "./media";
import { workById } from "./topic-pages";

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

describe("Apple Music", () => {
  it("plays one track of an album alone in Apple Music's player", () => {
    const url = "https://music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071?i=6771405574";
    expect(embedOf(url)).toEqual({ kind: "frame", src: "https://embed.music.apple.com/us/album/musique-de-la-gr%C3%A8ce-antique/6771405071?i=6771405574", site: "Apple Music", tall: false });
  });
});
