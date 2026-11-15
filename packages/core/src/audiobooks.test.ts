import { describe, expect, it } from "vitest";
import { appleChart, audiobookTopics, findAudiobooks, podcastTopic, readAudiobook, usualLength } from "./audiobooks";

const a = (line: string) => readAudiobook(line)!;
const all = [
  a("1|The Republic|Plato|36000|1|0|900|Philosophy;Classics (Greek & Latin Antiquity)|English|republic_lv"),
  a("2|Tom Sawyer|Mark Twain|25000|8|0|5000|Children's Fiction;Humorous Fiction|English|tom_lv"),
  a("3|Hamlet|William Shakespeare|11000|12|1|3000|Plays;Tragedy|English|hamlet_lv"),
  a("4|Historical tale|Anon|5000|1|0|10|Historical Fiction|English|x"),
  a("5|Faust|Goethe|20000|1|0|400|Plays|German|faust_lv"),
];

describe("audiobooks", () => {
  it("reads a catalog line", () => {
    expect(all[0]).toMatchObject({ id: "1", by: "Plato", seconds: 36000, readers: 1, dramatic: false, downloads: 900, language: "English", item: "republic_lv" });
    expect(readAudiobook("x|y")).toBeNull();
  });
  it("puts genres under topics, never a story under history", () => {
    expect(audiobookTopics(["Philosophy"])).toEqual(["philosophy"]);
    expect(audiobookTopics(["Historical Fiction"])).toEqual(["fiction"]);
    expect(audiobookTopics(["Children's Fiction", "Humorous Fiction"]).sort()).toEqual(["children", "comedy", "fiction"]);
  });
  it("finds by topic, length, readers and language, most downloaded first", () => {
    expect(findAudiobooks(all, {}).map((x) => x.id)).toEqual(["4", "2", "3", "1"].sort((p, q) => all.find((x) => x.id === q)!.downloads - all.find((x) => x.id === p)!.downloads));
    expect(findAudiobooks(all, { topic: "poetry" }).map((x) => x.id)).toEqual(["3"]);
    expect(findAudiobooks(all, { readers: "cast" }).map((x) => x.id)).toEqual(["3"]);
    expect(findAudiobooks(all, { readers: "one", length: "long" }).map((x) => x.id)).toEqual(["1"]);
    expect(findAudiobooks(all, { language: "German" }).map((x) => x.id)).toEqual(["5"]);
    expect(findAudiobooks(all, { q: "twain" }).map((x) => x.id)).toEqual(["2"]);
  });
  it("maps Apple categories to topics", () => {
    expect(podcastTopic(["Religion & Spirituality", "Christianity"])).toBe("religion");
    expect(podcastTopic(["Unknown"])).toBeNull();
  });
  it("gives a show's usual length", () => {
    expect(usualLength([3600, 1800, null, 4000])).toBe(3600);
    expect(usualLength([3600])).toBeNull();
  });
});

describe("appleChart", () => {
  it("reads Apple's top podcasts in a genre", () => {
    const text = JSON.stringify({ feed: { entry: [
      { "im:name": { label: "Philosophize This!" }, "im:artist": { label: "Stephen West" }, "im:image": [{ label: "https://x/a.jpg/55x55bb.png" }, { label: "https://x/a.jpg/170x170bb.png" }], link: { attributes: { href: "https://podcasts.apple.com/us/podcast/philosophize-this/id659155419?uo=2" } } },
      { "im:name": { label: "No link" } },
    ] } });
    expect(appleChart(text)).toEqual([{ medium: "podcast", title: "Philosophize This!", by: "Stephen West", url: "https://podcasts.apple.com/us/podcast/philosophize-this/id659155419", image: "https://x/a.jpg/600x600bb.jpg", source: "Apple Podcasts" }]);
    expect(appleChart("not json")).toEqual([]);
  });
});
