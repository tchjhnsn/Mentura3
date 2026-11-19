import { describe, expect, it } from "vitest";
import { checkPage, COMPONENTS, homeTemplate, isPagePath, mayShowPart, parsePage, parseSource, parseTag, partsOf, serializePage, serializeTag, writingTemplate, type Props } from "./site-page";

/** One example of every component in the library, with every value it takes. */
const EXAMPLES: Record<string, Props> = {
  Photo: { src: "https://example.com/lake.jpg", alt: "At the lake", caption: "Big Bend, \"spring\"", shape: "round" },
  Gallery: { images: ["https://example.com/a.jpg", "/b.png"], caption: "Two" },
  Video: { src: "https://www.youtube.com/watch?v=abc", caption: "A talk" },
  Audio: { src: "https://example.com/a.mp3", title: "Song" },
  Embed: { url: "https://example.com/post", title: "A post" },
  Quote: { text: "We are what we repeatedly do. {Not code}", cite: "Will Durant" },
  Callout: { text: "Line one\nline two" },
  Divider: {},
  Button: { label: "Write to me", href: "https://example.com/contact" },
  PostList: { limit: 3 },
  ProfileCard: {},
  Links: {},
  Now: { text: "Reading Aristotle in Austin" },
  Part: { source: "adventures/big-bend-2026", view: "card" },
};

describe("site page components", () => {
  it("has an example for every component", () => {
    expect(Object.keys(EXAMPLES).sort()).toEqual(COMPONENTS.map((c) => c.name).sort());
  });

  for (const [name, props] of Object.entries(EXAMPLES)) {
    it(`round-trips <${name}>`, () => {
      const tag = serializeTag(name, props);
      expect(tag.includes("\n")).toBe(false);
      const { component, length } = parseTag(tag);
      expect(length).toBe(tag.length);
      expect(component).toEqual({ name, props });
      expect(serializeTag(component.name, component.props)).toBe(tag);
    });
  }

  it("writes plain words in quotes and the rest in braces", () => {
    expect(serializeTag("Photo", { src: "https://e.com/a.jpg", alt: "Lake" })).toBe('<Photo src="https://e.com/a.jpg" alt="Lake" />');
    expect(serializeTag("PostList", { limit: 3 })).toBe("<PostList limit={3} />");
    expect(serializeTag("Quote", { text: 'She said "go"' })).toBe('<Quote text={"She said \\"go\\""} />');
    expect(serializeTag("Gallery", { images: ["/a.png"] })).toBe('<Gallery images={["/a.png"]} />');
  });

  it("reads the doc's example page", () => {
    const md = '# Torian\n\nI build tools.\n\n<Photo src="https://e.com/8f2c.jpg" alt="At the lake" shape="round" />\n\n## Lately\n\n<PostList limit={3} />\n\n<Part source="household/members" view="card" />\n';
    const { blocks, errors } = parsePage(md);
    expect(errors).toEqual([]);
    expect(blocks.map((b) => (b.kind === "markdown" ? "md" : b.name))).toEqual(["md", "Photo", "md", "PostList", "Part"]);
    expect(serializePage(blocks)).toBe(md);
    expect(partsOf(blocks)).toEqual(["household/members"]);
  });

  it("round-trips every component in one page", () => {
    const md = serializePage(Object.entries(EXAMPLES).flatMap(([name, props]) => [{ kind: "markdown" as const, text: `Before ${name}.` }, { kind: "component" as const, name, props }]));
    const { blocks, errors } = parsePage(md);
    expect(errors).toEqual([]);
    expect(serializePage(blocks)).toBe(md);
  });

  it("reads a tag over several lines", () => {
    const { blocks, errors } = parsePage('<Photo\n  src="https://e.com/a.jpg"\n  alt="A"\n/>');
    expect(errors).toEqual([]);
    expect(blocks).toEqual([{ kind: "component", name: "Photo", props: { src: "https://e.com/a.jpg", alt: "A" } }]);
  });

  it("leaves code fences and lowercase tags as text", () => {
    const md = "```\n<Script src=\"x\" />\nimport x from 'y'\n```\n\n<div>hello</div>";
    const { blocks, errors } = parsePage(md);
    expect(errors).toEqual([]);
    expect(blocks).toEqual([{ kind: "markdown", text: md }]);
  });
});

describe("what a page cannot hold", () => {
  const refused: [string, RegExp][] = [
    ['<Script src="https://e.com/x.js" />', /not in the library/],
    ["<Photo src={url} />", /not a literal/],
    ['<Photo src={"https://e.com/a.jpg" + x} />', /not a literal/],
    ["<PostList limit={1 + 2} />", /not a literal/],
    ["<PostList limit={(() => 3)()} />", /not a literal/],
    ['<Photo src="https://e.com/a.jpg" {...props} />', /Spreading/],
    ['<Photo src="javascript:alert(1)" />', /https/],
    ['<Photo src="//evil.com/a.jpg" />', /https/],
    ['<Photo src="https://e.com/a.jpg" onClick="x" />', /no onClick/],
    ['<Photo src="https://e.com/a.jpg" style={{"color":"red"}} />', /no style|literal/],
    ["<Photo alt=\"No address\" />", /needs address/],
    ['<Quote text="Hi">inside</Quote>', /close itself/],
    ['<Photo src="https://e.com/a.jpg" src="https://e.com/b.jpg" />', /twice/],
    ['<PostList limit={500} />', /from 1 to 50/],
    ['<PostList limit="3" />', /whole number/],
    ['<Part source="bank/accounts" />', /not a part/],
    ['<Photo src="https://e.com/a.jpg" shape="star" />', /one of/],
    ['<Divider /> and more', /own line/],
    ["<Photo src=\"https://e.com/a.jpg\"", /not closed/],
    ["import X from './x'", /import or export/],
    ["export const a = 1", /import or export/],
    ['<div onClick={() => go()}>x</div>', /Braces/],
  ];
  for (const [md, why] of refused) {
    it(`refuses ${md}`, () => {
      const errors = checkPage(`Text\n\n${md}\n`);
      expect(errors).toHaveLength(1);
      expect(errors[0]!.line).toBe(3);
      expect(errors[0]!.message).toMatch(why);
    });
  }

  it("refuses serializing what it would refuse to read", () => {
    expect(() => serializeTag("Script", {})).toThrow();
    expect(() => serializeTag("Photo", { src: "javascript:x" })).toThrow();
  });
});

describe("pages", () => {
  it("starts Home with the profile layout's parts", () => {
    const md = homeTemplate({ line: "I build tools for founders in Austin." });
    const { blocks, errors } = parsePage(md);
    expect(errors).toEqual([]);
    expect(blocks.map((b) => (b.kind === "markdown" ? b.text : b.name))).toEqual(["ProfileCard", "I build tools for founders in Austin.\n\n## Writing", "PostList", "Links"]);
    expect(blocks.find((b) => b.kind === "component" && b.name === "PostList")).toMatchObject({ props: { limit: 3 } });
    expect(parsePage(homeTemplate()).blocks.map((b) => (b.kind === "markdown" ? b.text : b.name))).toEqual(["ProfileCard", "## Writing", "PostList", "Links"]);
    expect(checkPage(writingTemplate())).toEqual([]);
  });

  it("keeps the site's own addresses for itself", () => {
    expect(isPagePath("about")).toBe(true);
    expect(isPagePath("now-2026")).toBe(true);
    for (const p of ["", "writing", "home", "parts", "feed.xml", "subscribe", "About", "a/b", "-x"]) expect(isPagePath(p)).toBe(false);
  });
});

describe("sharing parts on a site", () => {
  const owner = "u1";
  const creator = "u2";
  it("reads sources", () => {
    expect(parseSource("adventures/abc-1")).toEqual({ domain: "adventures", path: "abc-1" });
    expect(parseSource("household")).toEqual({ domain: "household", path: "" });
    for (const s of ["bank/x", "adventures/../x", "Adventures/x", "", 3]) expect(parseSource(s)).toBeNull();
  });

  it("shows a part only when its owner shared it", () => {
    expect(mayShowPart("adventures/a", owner, [], null)).toBe(false);
    expect(mayShowPart("adventures/a", owner, [{ ownerId: owner, source: "adventures/a", createdBy: owner }], null)).toBe(true);
    expect(mayShowPart("adventures/a", owner, [{ ownerId: owner, source: "adventures/b", createdBy: owner }], null)).toBe(false);
    expect(mayShowPart("adventures/a", owner, [{ ownerId: "u9", source: "adventures/a", createdBy: "u9" }], null)).toBe(false);
    expect(mayShowPart("bank/a", owner, [{ ownerId: owner, source: "bank/a", createdBy: owner }], null)).toBe(false);
  });

  it("needs the household creator's OK too for a household part", () => {
    const mine = { ownerId: owner, source: "household/members", createdBy: owner };
    const theirs = { ownerId: owner, source: "household/members", createdBy: creator };
    expect(mayShowPart("household/members", owner, [mine], creator)).toBe(false);
    expect(mayShowPart("household/members", owner, [theirs], creator)).toBe(false);
    expect(mayShowPart("household/members", owner, [mine, theirs], creator)).toBe(true);
    expect(mayShowPart("household/members", owner, [mine], owner)).toBe(true);
    expect(mayShowPart("household/members", owner, [mine], null)).toBe(false);
  });
});
