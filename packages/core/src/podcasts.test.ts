import { describe, expect, it } from "vitest";
import { duration, episodeChapters, episodeKey, episodeTranscript, feedOf, readChapters, readFeed, showOf } from "./podcasts";

const FEED = `<?xml version="1.0"?><rss><channel><title>Philosophize This!</title>
<item><title><![CDATA[Episode #2 ... Plato]]></title><guid>ep-2</guid><pubDate>Tue, 27 Oct 2026 10:00:00 GMT</pubDate><itunes:duration>36:04</itunes:duration>
<enclosure url="https://cdn.example/ep2.mp3?a=1&amp;b=2" type="audio/mpeg"/><description>Plato &amp; the Forms</description>
<podcast:transcript url="https://cdn.example/ep2.vtt" type="text/vtt"/></item>
<item><title>Episode #1 ... Socrates</title><guid>ep-1</guid><pubDate>Mon, 20 Oct 2026 10:00:00 GMT</pubDate><itunes:duration>3600</itunes:duration><enclosure url="http://cdn.example/ep1.mp3" type="audio/mpeg"/></item>
<item><title>No audio</title></item>
</channel></rss>`;

describe("podcasts heard in Reflect", () => {
  it("reads a feed into episodes, newest first, with audio and a transcript when published", () => {
    const s = readFeed(FEED, "https://feed.example/rss");
    expect(s.title).toBe("Philosophize This!");
    expect(s.episodes.map((e) => [e.title, e.date, e.seconds])).toEqual([["Episode #2 ... Plato", "2026-10-27", 2164], ["Episode #1 ... Socrates", "2026-10-20", 3600]]);
    expect(s.episodes[0]).toMatchObject({ audio: "https://cdn.example/ep2.mp3?a=1&b=2", about: "Plato & the Forms", transcript: { url: "https://cdn.example/ep2.vtt", type: "text/vtt" }, key: episodeKey("ep-2") });
    expect(s.episodes[1]!.audio).toBe("https://cdn.example/ep1.mp3");
    expect(episodeKey("ep-2")).not.toBe(episodeKey("ep-1"));
    expect(duration("1:00:00")).toBe(3600);
    expect(duration("nonsense")).toBeNull();
  });

  it("finds a show's feed from its Apple Podcasts link and reads its transcript", async () => {
    const pages: Record<string, string> = {
      "https://itunes.apple.com/lookup?id=659155419&entity=podcast": JSON.stringify({ results: [{ feedUrl: "https://feed.example/rss" }] }),
      "https://feed.example/rss": FEED,
      "https://cdn.example/ep2.vtt": "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nWelcome.\n",
    };
    const f = async (u: string) => pages[u] ?? null;
    expect(await feedOf("https://podcasts.apple.com/us/podcast/philosophize-this/id659155419", f)).toBe("https://feed.example/rss");
    const s = await showOf("https://podcasts.apple.com/us/podcast/philosophize-this/id659155419", f);
    expect(s?.episodes).toHaveLength(2);
    expect(await episodeTranscript(s!.episodes[0]!, f)).toEqual([{ at: 1, heading: false, who: null, text: "Welcome." }]);
    expect(await showOf("https://example.com/not-a-feed", f)).toBeNull();
    expect(await feedOf("javascript:alert(1)", f)).toBeNull();
  });
});

const RICH = `<rss xmlns:podcast="x" xmlns:psc="y"><channel><title>The Partially Examined Life</title><itunes:author>Mark Linsenmayer</itunes:author>
<itunes:image href="https://img.example/show.jpg"/><itunes:category text="Society &amp; Culture"><itunes:category text="Philosophy"/></itunes:category>
<podcast:person role="host" href="https://pel.example/mark" img="https://img.example/mark.jpg">Mark Linsenmayer</podcast:person>
<podcast:funding url="https://patreon.example/pel">Become a citizen</podcast:funding>
<item><title>Ep. 300: Aristotle on Friendship</title><guid>e300</guid><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate>
<itunes:season>3</itunes:season><itunes:episode>300</itunes:episode><itunes:episodeType>full</itunes:episodeType><itunes:image href="https://img.example/300.jpg"/>
<enclosure url="https://cdn.example/300.mp4" type="video/mp4"/>
<content:encoded><![CDATA[<p>We read <a href="https://openlibrary.org/works/OL1W">Nicomachean Ethics</a> books 8 and 9.</p><ul><li>Guest: <b>Jane Doe</b></li><li><a href="javascript:alert(1)">bad</a></li></ul><script>x()</script>]]></content:encoded>
<podcast:person role="guest">Jane Doe</podcast:person>
<psc:chapters><psc:chapter start="00:00:00" title="Intro"/><psc:chapter start="00:12:30.5" title="Book 8"/></psc:chapters>
</item>
<item><title>Trailer</title><guid>t</guid><itunes:episodeType>trailer</itunes:episodeType><enclosure url="https://cdn.example/t.mp3" type="audio/mpeg"/><description>&lt;p&gt;Hello &amp;amp; welcome&lt;/p&gt;</description><podcast:chapters url="https://cdn.example/t.json" type="application/json+chapters"/></item>
</channel></rss>`;

describe("reading a feed fully", () => {
  it("reads the show's art, author, categories, people and funding", () => {
    const s = readFeed(RICH, "https://feed.example/pel");
    expect(s).toMatchObject({ image: "https://img.example/show.jpg", author: "Mark Linsenmayer", categories: ["Society & Culture", "Philosophy"], funding: [{ url: "https://patreon.example/pel", text: "Become a citizen" }] });
    expect(s.people).toEqual([{ name: "Mark Linsenmayer", role: "host", href: "https://pel.example/mark", image: "https://img.example/mark.jpg" }]);
  });

  it("reads each episode's season, number, type, art, video, people, chapters and notes with their links", () => {
    const [e, t] = readFeed(RICH, "https://feed.example/pel").episodes;
    expect(e).toMatchObject({ season: 3, number: 300, type: "full", image: "https://img.example/300.jpg", kind: "video", people: [{ name: "Jane Doe", role: "guest", href: null, image: null }], chapters: [{ at: 0, title: "Intro" }, { at: 750, title: "Book 8" }], chaptersUrl: null });
    expect(e!.notes).toEqual([
      { list: false, parts: [{ text: "We read" }, { text: "Nicomachean Ethics", href: "https://openlibrary.org/works/OL1W" }, { text: "books 8 and 9." }] },
      { list: true, parts: [{ text: "Guest: Jane Doe" }] },
      { list: true, parts: [{ text: "bad" }] },
    ]);
    expect(t).toMatchObject({ type: "trailer", kind: "audio", chaptersUrl: "https://cdn.example/t.json", notes: [{ list: false, parts: [{ text: "Hello & welcome" }] }] });
  });

  it("reads a chapters file", async () => {
    const t = readFeed(RICH, "https://feed.example/pel").episodes[1]!;
    const f = async () => JSON.stringify({ version: "1.2.0", chapters: [{ startTime: 61.2, title: "Two" }, { startTime: 0, title: "One", url: "https://x.example" }, { startTime: 90, title: "Hidden", toc: false }] });
    expect(await episodeChapters(t, f)).toEqual([{ at: 0, title: "One", href: "https://x.example", image: null }, { at: 61, title: "Two", href: null, image: null }]);
    expect(readChapters("not json")).toEqual([]);
  });
});
