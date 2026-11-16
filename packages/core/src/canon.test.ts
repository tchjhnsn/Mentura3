import { describe, expect, it } from "vitest";
import { findAudiobooks } from "./audiobooks";
import { canonAudiobooks } from "./canon";
import { SUBJECTS, subjectRow } from "./subjects";

describe("the editors' canon", () => {
  it("holds the recordings Reflect's pages name, The Prince among them", () => {
    expect(canonAudiobooks().has("368")).toBe(true);
    expect(canonAudiobooks().has("426")).toBe(true);
  });

  it("ranks the canon before more listened recordings, and a search match before both", () => {
    const mk = (id: string, title: string, downloads: number) => ({ id, title, by: "X", downloads, seconds: 3600, readers: 1, dramatic: false, genres: [], language: "English" }) as unknown as Parameters<typeof findAudiobooks>[0][number];
    const all = [mk("1", "Popular Novel", 9e6), mk("2", "Prince", 2e6), mk("3", "Prince Novel", 1e6)];
    const canon = new Set(["2"]);
    expect(findAudiobooks(all, { canon }).map((x) => x.id)).toEqual(["2", "1", "3"]);
    expect(findAudiobooks(all, { canon, q: "novel" }).map((x) => x.id)).toEqual(["1", "3"]);
  });
});

describe("subjects", () => {
  it("have unique ids, Apple show links for their picks, and rows with picks first and no repeats", () => {
    expect(new Set(SUBJECTS.map((s) => s.id)).size).toBe(SUBJECTS.length);
    for (const s of SUBJECTS) for (const f of s.picks) expect(f.url).toMatch(/^https:\/\/podcasts\.apple\.com\/us\/podcast\/[a-z0-9-]+\/id\d+$/);
    const lives = SUBJECTS.find((s) => s.id === "lives")!;
    const row = subjectRow(lives, [{ medium: "podcast", title: "Founders", source: "x" }, { medium: "podcast", title: "Other", source: "x" }]);
    expect(row[0]!.title).toBe("Founders");
    expect(row.filter((f) => f.title === "Founders")).toHaveLength(1);
    expect(row.at(-1)!.title).toBe("Other");
  });
});
