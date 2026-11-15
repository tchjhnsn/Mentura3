import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mergeShowFinds, podcastIndexHeaders, readFyyd, readGpodder, readPodcastIndex } from "./podcastindex";

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
    expect(mergeShowFinds(a, [i, [{ medium: "podcast" as const, title: "OTHER", source: "fyyd" }]]).map((f) => f.title)).toEqual(["Show", "Other"]);
  });
  it("reads fyyd's English shows with working feeds", () => {
    const body = { data: [
      { title: "The Partially Examined Life", xmlURL: "https://rss.libsyn.com/x.xml", author: "Mark Linsenmayer", imgURL: "https://static.libsyn.com/a.jpg", status: 200, language: "en" },
      { title: "Avec philosophie", xmlURL: "https://r.example.fr/f.xml", language: "fr", status: 200 },
      { title: "Broken", xmlURL: "https://b.example.com/f.xml", status: 404 },
    ] };
    expect(readFyyd(body)).toEqual([{ medium: "podcast", title: "The Partially Examined Life", by: "Mark Linsenmayer", url: "https://rss.libsyn.com/x.xml", image: "https://static.libsyn.com/a.jpg", source: "fyyd" }]);
  });
  it("reads gpodder.net's shows, most followed first, without the owner's email", () => {
    const body = [
      { title: "Small", url: "http://s.example.com/f.xml", subscribers: 3 },
      { title: "Big", url: "http://b.example.com/f.xml", author: "France Culture (podcast@radiofrance.com)", subscribers: 120, logo_url: "https://img.example.com/l.jpg" },
    ];
    expect(readGpodder(body)).toEqual([
      { medium: "podcast", title: "Big", by: "France Culture", url: "http://b.example.com/f.xml", image: "https://img.example.com/l.jpg", source: "gpodder.net" },
      { medium: "podcast", title: "Small", url: "http://s.example.com/f.xml", source: "gpodder.net" },
    ]);
  });
});
