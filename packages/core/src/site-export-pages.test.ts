import { describe, expect, it } from "vitest";
import { exportFiles } from "./site-export";
import { designCss, MDX_REMOTE, pageFile, pageFileName, type ExportSite } from "./site-export-pages";
import { snapshotId, type PartSnapshot } from "./site-mdx";
import { homeTemplate } from "./site-page";

const PROFILE = { name: "Ann Lee", line: "Builds things", handle: "ann", socials: [{ label: "ann", url: "https://e.com/ann" }], building: [], experience: [], interests: [] };
const POST = { slug: "hi", title: "Hi", kind: "essay", body: "Hello", publishedAt: "2026-11-18T00:00:00.000Z", updatedAt: "2026-11-18T00:00:00.000Z" };
const snap: PartSnapshot = { title: "Big Bend", lines: ["Texas"], items: [] };

const ABOUT = `I write about {things} and <tools>.

<Photo src="https://e.com/lake.jpg" alt="Lake" shape="round" />

<Quote text="Be kind" cite="Ann" frame="holly-corners" />

<Part source="adventures/big-bend" view="card" />

<Part source="household/members" view="card" />
`;

const SITE: ExportSite = {
  pages: [
    { path: "", title: "Home", body: homeTemplate({ line: "Builds things" }) },
    { path: "writing", title: "Writing", body: "<PostList limit={50} />\n" },
    { path: "about", title: "About", body: ABOUT },
  ],
  parts: new Map([["adventures/big-bend", snap]]),
  css: ":root { --virtu-color-role-foreground: #111; }\n.virtu-block-shape-round { --shape-radius-card: 18px; }",
  edged: ["pill", "round", "sharp"],
};

describe("the exported site's pages", () => {
  const files = exportFiles(PROFILE, [POST], "plain", "https://r.test/p/ann", SITE);

  it("lists every file the pages add", () => {
    const pageFilesList = Object.keys(files).filter((f) => /^(content\/(pages|parts)|components\/reflect|lib\/pages|app\/(design\.css|writing))/.test(f)).sort();
    expect(pageFilesList).toEqual([
      "app/design.css",
      "app/writing/page.tsx",
      "components/reflect/index.tsx",
      "components/reflect/look.tsx",
      "components/reflect/mdx-page.tsx",
      "components/reflect/media.tsx",
      "components/reflect/part.tsx",
      "components/reflect/writing.tsx",
      "components/reflect/you.tsx",
      "content/pages/about.mdx",
      "content/pages/index.mdx",
      "content/pages/writing.mdx",
      `content/parts/${snapshotId(snap)}.json`,
      "lib/pages.ts",
    ]);
  });

  it("writes a sample page as MDX: prose escaped, components as tags, a part as its snapshot, a part not allowed dropped", () => {
    expect(files["content/pages/about.mdx"]).toBe(pageFile("About", `I write about \\{things\\} and \\<tools>.

<Photo src="https://e.com/lake.jpg" alt="Lake" shape="round" />

<Quote text="Be kind" cite="Ann" frame="holly-corners" />

<Part snapshot="${snapshotId(snap)}" view="card" />
`));
    expect(files["content/pages/about.mdx"]).not.toContain("household");
    expect(JSON.parse(files[`content/parts/${snapshotId(snap)}.json`]!)).toEqual(snap);
    expect(files["content/pages/index.mdx"]).toContain("<ProfileCard />");
    expect(pageFileName("")).toBe("index.mdx");
  });

  it("installs next-mdx-remote at an exact version and renders pages with the component map", () => {
    expect(JSON.parse(files["package.json"]!).dependencies["next-mdx-remote"]).toBe(MDX_REMOTE);
    expect(MDX_REMOTE).toMatch(/^\d+\.\d+\.\d+$/);
    expect(files["components/reflect/mdx-page.tsx"]).toContain('from "next-mdx-remote/rsc"');
    for (const name of ["Photo", "Gallery", "Video", "Audio", "Embed", "Quote", "Callout", "Divider", "Button", "PostList", "ProfileCard", "Links", "Now", "Part"]) {
      expect(files["components/reflect/index.tsx"]).toMatch(new RegExp(`\\b${name}\\b`));
    }
    expect(files["app/page.tsx"]).toContain('page("")');
    expect(files["app/[slug]/page.tsx"]).toContain("pages()");
  });

  it("carries the design and the shapes that draw an edge", () => {
    expect(files["app/design.css"]).toContain(".virtu-block-shape-round");
    expect(files["app/design.css"]).toContain("body.site-design");
    expect(files["app/layout.tsx"]).toContain('import "./design.css"');
    expect(files["app/layout.tsx"]).toContain('profile.template + " site-design"');
    expect(files["components/reflect/look.tsx"]).toContain('["pill","round","sharp"]');
  });

  it("still exports a site with no pages and no design", () => {
    const plain = exportFiles(PROFILE, [POST], "plain", "https://r.test/p/ann");
    expect(Object.keys(plain).filter((f) => f.startsWith("content/pages/"))).toEqual([]);
    expect(plain["app/layout.tsx"]).toContain("className={profile.template}");
    expect(designCss("")).toContain("No design was set");
  });
});
