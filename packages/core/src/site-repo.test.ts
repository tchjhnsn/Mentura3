import { describe, expect, it } from "vitest";
import { cleanRepo, findPostsPlace, frontMatterStyle, pickBranch, repoPostFile, repoPostPath } from "./site-repo";

const post = { slug: "on-craft", title: "On craft", kind: "essay", body: "The work.\n", summary: "About the work.", publishedAt: "2026-11-18T20:00:00.000Z", updatedAt: "2026-11-18T21:00:00.000Z" };

describe("site repository", () => {
  it("cleans a repository name or address", () => {
    expect(cleanRepo("tchjhnsn/tcjcafe")).toBe("tchjhnsn/tcjcafe");
    expect(cleanRepo("https://github.com/tchjhnsn/tcjcafe.git")).toBe("tchjhnsn/tcjcafe");
    expect(cleanRepo("tcjcafe")).toBeNull();
    expect(cleanRepo("a/b/c")).toBeNull();
    expect(cleanRepo("me/..")).toBeNull();
  });

  it("finds where the posts live", () => {
    const tcj = ["README.md", "app/blog/page.tsx", "app/blog/posts/the-everything-ecosystem.mdx", "app/research/papers/specs-as-source-survey.mdx", "archive/2026-04/x.md"];
    expect(findPostsPlace(tcj)).toEqual({ folder: "app/blog/posts", ext: "mdx" });
    expect(findPostsPlace(["content/posts/a.md", "content/posts/b.md", "docs/x.md"])).toEqual({ folder: "content/posts", ext: "md" });
    expect(findPostsPlace(["src/pages/writing/a.md"])).toEqual({ folder: "src/pages/writing", ext: "md" });
    expect(findPostsPlace(["README.md", "docs/guide.md"])).toBeNull();
  });

  it("writes a post the way the repository writes its posts", () => {
    const sample = "---\ntitle: 'The Everything Ecosystem'\nsubtitle: 'A treatise'\npublishedAt: '2026-03-23'\nsummary: 'Ecosystems.'\nstatus: 'version 2.0'\n---\n\nText";
    expect(frontMatterStyle(sample)).toEqual({ keys: ["title", "subtitle", "publishedAt", "summary", "status"], quote: "'" });
    expect(repoPostFile({ ...post, title: "It's craft" }, sample)).toBe("---\ntitle: 'It''s craft'\npublishedAt: '2026-11-18'\nsummary: 'About the work.'\n---\n\nThe work.\n");
    expect(repoPostFile(post, null)).toBe('---\ntitle: "On craft"\nkind: essay\npublished: 2026-11-18T20:00:00.000Z\nupdated: 2026-11-18T21:00:00.000Z\n---\n\nThe work.\n');
    expect(repoPostFile(post, "---\ndate: \"x\"\n---\n")).toBe('---\ntitle: "On craft"\ndate: "2026-11-18"\n---\n\nThe work.\n');
  });

  it("names the post's path and the branch", () => {
    expect(repoPostPath({ folder: "app/blog/posts", ext: "mdx" }, "on-craft")).toBe("app/blog/posts/on-craft.mdx");
    expect(pickBranch(["dev", "master"])).toBe("master");
    expect(pickBranch(["main", "master"])).toBe("main");
    expect(pickBranch([])).toBeNull();
  });
});
