import { describe, expect, it } from "vitest";
import { cleanDomain, cleanEmail, excerpt, freeSlug, headings, isPublishable, markdownToHtml, readingMinutes, rssXml, slugify, subscribersCsv } from "./site";
import { exportFiles, postFile } from "./site-export";

describe("the personal site", () => {
  it("publishes essays, letters, plans and memoirs, never the journal's own kinds", () => {
    for (const k of ["essay", "letter", "plan", "memoir"]) expect(isPublishable(k)).toBe(true);
    for (const k of ["entry", "examination", "exercise", "decision", "x"]) expect(isPublishable(k)).toBe(false);
  });

  it("makes slugs from titles and keeps them free", () => {
    expect(slugify("On Friendship: Book VIII & IX")).toBe("on-friendship-book-viii-and-ix");
    expect(slugify("Été à Montréal")).toBe("ete-a-montreal");
    expect(slugify("!!!")).toBe("post");
    expect(slugify("RSS")).toBe("post");
    expect(slugify("a".repeat(80))).toHaveLength(60);
    expect(freeSlug("letters", ["letters", "letters-2"])).toBe("letters-3");
    expect(freeSlug("new", [])).toBe("new");
  });

  it("counts minutes to read and opens a post with its first words", () => {
    expect(readingMinutes("word ".repeat(10))).toBe(1);
    expect(readingMinutes("word ".repeat(1150))).toBe(5);
    expect(excerpt("## Heading\n\nSome **bold** and [a link](https://x.test).")).toBe("Heading Some bold and a link.");
    expect(excerpt("one two three four five", 12)).toBe("one two...");
  });

  it("renders Markdown and escapes everything else", () => {
    const html = markdownToHtml("# Title\n\nHello *you* and **all**.\n\n<script>alert(1)</script>\n\n> quoted\n\n- a\n- b\n\n1. one\n\n[x](javascript:alert(1)) [y](https://ok.test)\n\n```\n<b>\n```");
    expect(html).toContain('<h2 id="title">Title</h2>');
    expect(html).toContain("<em>you</em>");
    expect(html).toContain("<strong>all</strong>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<blockquote><p>quoted</p></blockquote>");
    expect(html).toContain("<ul><li>a</li><li>b</li></ul>");
    expect(html).toContain("<ol><li>one</li></ol>");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('<a href="https://ok.test" rel="nofollow">y</a>');
    expect(html).toContain("<pre><code>&lt;b&gt;</code></pre>");
    expect(headings("## One\n\ntext\n\n## Two")).toEqual([{ id: "one", text: "One" }, { id: "two", text: "Two" }]);
  });

  it("writes an RSS feed with each post's link and full text", () => {
    const xml = rssXml({ title: "Ann & Co", link: "https://r.test/p/ann/", description: "d" }, [{ slug: "hi", title: "Hi <there>", body: "Hello **world**", publishedAt: "2026-11-18T12:00:00Z" }]);
    expect(xml).toContain("<title>Ann &amp; Co</title>");
    expect(xml).toContain("<link>https://r.test/p/ann/hi</link>");
    expect(xml).toContain("Hi &lt;there&gt;");
    expect(xml).toContain("<![CDATA[<p>Hello <strong>world</strong></p>]]>");
  });

  it("checks emails and domains", () => {
    expect(cleanEmail(" Ann@Example.COM ")).toBe("ann@example.com");
    expect(cleanEmail("not an email")).toBeNull();
    expect(cleanDomain("https://Ann.Example.com/blog")).toBe("ann.example.com");
    expect(cleanDomain("localhost")).toBeNull();
    expect(subscribersCsv([{ email: "a@b.co", confirmedAt: "2026-11-18" }])).toBe("email,subscribed_at\na@b.co,2026-11-18\n");
  });

  it("exports a Next.js project with posts as Markdown files", () => {
    const files = exportFiles(
      { name: "Ann Lee", line: "Builds things", handle: "ann", socials: [], building: [], experience: [], interests: [] },
      [{ slug: "hi", title: 'Say "hi"', kind: "essay", body: "Hello", publishedAt: "2026-11-18T00:00:00.000Z", updatedAt: "2026-11-18T00:00:00.000Z" }],
      "notebook",
      "https://r.test/p/ann",
    );
    expect(Object.keys(files)).toEqual(expect.arrayContaining(["package.json", "app/page.tsx", "app/[slug]/page.tsx", "app/feed.xml/route.ts", "content/posts/hi.md", "content/profile.json", "README.md"]));
    expect(JSON.parse(files["package.json"]!).name).toBe("ann-site");
    expect(files["content/posts/hi.md"]).toBe(postFile({ slug: "hi", title: 'Say "hi"', kind: "essay", body: "Hello", publishedAt: "2026-11-18T00:00:00.000Z", updatedAt: "2026-11-18T00:00:00.000Z" }));
    expect(files["content/posts/hi.md"]).toContain('title: "Say \\"hi\\""');
    expect(JSON.parse(files["content/profile.json"]!).template).toBe("notebook");
  });
});
