import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mergeShowFinds, podcastIndexHeaders, readPodcastIndex } from "./podcastindex";

describe("Podcast Index", () => {
  it("signs each request with the SHA-1 of key, secret and time", async () => {
    const h = await podcastIndexHeaders("K", "S", 1700000000);
    expect(h).toMatchObject({ "X-Auth-Key": "K", "X-Auth-Date": "1700000000", Authorization: createHash("sha1").update("KS1700000000").digest("hex") });
  });
  it("reads shows by their feeds, leaving out dead ones", () => {
    const body = { feeds: [
      { title: "Philosophize This!", url: "https://feeds.example.com/pt.xml", author: "Stephen West", artwork: "http://img.example.com/a.jpg" },
      { title: "Gone", url: "https://x.example.com/f", dead: 1 },
      { title: "", url: "https://y.example.com/f" },
    ] };
    expect(readPodcastIndex(body)).toEqual([{ medium: "podcast", title: "Philosophize This!", by: "Stephen West", url: "https://feeds.example.com/pt.xml", image: "https://img.example.com/a.jpg", source: "Podcast Index" }]);
    expect(readPodcastIndex(null)).toEqual([]);
  });
  it("adds only the shows Apple did not find", () => {
    const a = [{ medium: "podcast" as const, title: "Show", source: "Apple Podcasts" }];
    const i = [{ medium: "podcast" as const, title: "show", source: "Podcast Index" }, { medium: "podcast" as const, title: "Other", source: "Podcast Index" }];
    expect(mergeShowFinds(a, i).map((f) => f.title)).toEqual(["Show", "Other"]);
  });
});
