import { describe, expect, it } from "vitest";
import { escapeMdxProse, looksUsed, pageToMdx, snapshotId, type PartSnapshot } from "./site-mdx";
import { parsePage } from "./site-page";

describe("prose made safe for MDX", () => {
  it("escapes braces and angle brackets in ordinary text", () => {
    expect(escapeMdxProse("Costs {about} $5 < $10 and <div>hi</div>")).toBe("Costs \\{about\\} $5 \\< $10 and \\<div>hi\\</div>");
  });

  it("leaves inline code and fenced code as they are", () => {
    expect(escapeMdxProse("Use `a{b}<c>` here {x}")).toBe("Use `a{b}<c>` here \\{x\\}");
    const fenced = "```ts\nconst a = { b: <T,>() => 1 };\n```\nafter {y}";
    expect(escapeMdxProse(fenced)).toBe("```ts\nconst a = { b: <T,>() => 1 };\n```\nafter \\{y\\}");
    expect(escapeMdxProse("~~~\n{x}\n~~~")).toBe("~~~\n{x}\n~~~");
  });

  it("keeps a lone backtick and a backslash as the characters they are", () => {
    expect(escapeMdxProse("a ` b {c}")).toBe("a ` b \\{c\\}");
    expect(escapeMdxProse("a \\{ b \\ c")).toBe("a \\\\\\{ b \\ c");
  });

  it("leaves Markdown that is not code alone", () => {
    const md = "# Title\n\n**Bold** and _italic_, a [link](https://e.com) and > a quote.\n\n- one\n- two";
    expect(escapeMdxProse(md)).toBe(md);
  });
});

describe("a page as MDX", () => {
  const snap: PartSnapshot = { title: "Big Bend", lines: ["Texas", "March 2026"], items: ["Torian", "Sam"] };

  it("writes components as tags, a shared part as its snapshot, and drops a part not allowed", () => {
    const body = '# Hello {world}\n\n<Photo src="https://e.com/a.jpg" alt="Lake" shape="round" />\n\n<Part source="adventures/big-bend" view="card" frame="holly-corners" />\n\n<Part source="household/members" view="card" />\n\n<Quote text="Be {kind}" frame="holly-corners" />\n';
    const { mdx, parts } = pageToMdx(body, new Map([["adventures/big-bend", snap]]));
    const id = snapshotId(snap);
    expect(mdx).toBe(`# Hello \\{world\\}\n\n<Photo src="https://e.com/a.jpg" alt="Lake" shape="round" />\n\n<Part snapshot="${id}" view="card" frame="holly-corners" />\n\n<Quote text={"Be {kind}"} frame="holly-corners" />\n`);
    expect(parts).toEqual({ [id]: snap });
    expect(mdx).not.toContain("household/members");
  });

  it("leaves out a line the strict parser refuses, as the renderer does", () => {
    const { mdx } = pageToMdx('Text\n\n<Photo src="https://e.com/a.jpg" shape="star" />\n\n<Script />\n', new Map());
    expect(mdx).toBe("Text\n");
  });

  it("names a snapshot by its content", () => {
    expect(snapshotId(snap)).toMatch(/^[0-9a-f]{16}$/);
    expect(snapshotId({ ...snap })).toBe(snapshotId(snap));
    expect(snapshotId({ ...snap, title: "Other" })).not.toBe(snapshotId(snap));
  });

  it("lists the shapes and frames a page names", () => {
    const { blocks } = parsePage('<Photo src="/a.jpg" shape="round" frame="sprig-corners" />\n\n<Quote text="x" frame="holly-corners" />\n\n<Callout text="y" shape="round" />');
    expect(looksUsed(blocks)).toEqual({ shapes: ["round"], frames: ["holly-corners", "sprig-corners"] });
  });
});
