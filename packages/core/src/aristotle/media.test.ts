import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { COURSES } from "./index";
import { MEDIA, mediaOf, unitMediaOf } from "./media";

const here = dirname(fileURLToPath(import.meta.url));
const audiobookIds = new Set(
  readFileSync(resolve(here, "../../../../web/src/data/audiobooks.txt"), "utf8")
    .split("\n")
    .map((line) => line.split("|")[0]?.trim())
    .filter((id): id is string => !!id),
);

const urlsOf = (m: { episodes?: { url: string }[]; lectures?: { url: string }[] }) => [...(m.episodes ?? []), ...(m.lectures ?? [])].map((x) => x.url);

describe("Aristotle media", () => {
  it("keys every entry by a real course and its real units", () => {
    for (const [id, media] of Object.entries(MEDIA)) {
      const course = COURSES.find((c) => c.id === id);
      expect(course, id).toBeDefined();
      const units = new Set(course!.units.map((u) => u.id));
      for (const unit of Object.keys(media.units)) expect(units.has(unit), `${id}/${unit}`).toBe(true);
    }
  });

  it("uses https for every link", () => {
    for (const media of Object.values(MEDIA)) {
      for (const url of [...urlsOf(media), ...Object.values(media.units).flatMap(urlsOf)]) expect(url, url).toMatch(/^https:\/\//);
    }
  });

  it("gives chapters as positive integers", () => {
    for (const [id, media] of Object.entries(MEDIA)) {
      for (const [unit, m] of Object.entries(media.units)) {
        for (const n of m.chapters ?? []) expect(Number.isInteger(n) && n > 0, `${id}/${unit}: ${n}`).toBe(true);
      }
    }
  });

  it("names only audiobooks in the catalogue", () => {
    for (const [id, media] of Object.entries(MEDIA)) {
      if (media.audiobook) expect(audiobookIds.has(media.audiobook), `${id}: ${media.audiobook}`).toBe(true);
    }
  });

  it("looks media up by course and unit", () => {
    expect(mediaOf("poetics")?.audiobook).toBe("240");
    expect(mediaOf("no-such-course")).toBeNull();
    expect(unitMediaOf("nicomachean-ethics", "book-1")?.chapters).toEqual([1]);
    expect(unitMediaOf("nicomachean-ethics", "no-such-unit")).toBeNull();
  });
});
