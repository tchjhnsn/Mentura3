import { describe, expect, it } from "vitest";
import { cleanFolder, cleanRepo, contentPath, DEFAULT_DATA_FOLDER, findPostsPlace, insideContent, namesRepo, pickBranch, repoPostPath } from "./site-repo";

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

  it("names the post's path and the branch", () => {
    expect(repoPostPath({ folder: "app/blog/posts", ext: "mdx" }, "on-craft")).toBe("app/blog/posts/on-craft.mdx");
    expect(pickBranch(["dev", "master"])).toBe("master");
    expect(pickBranch(["main", "master"])).toBe("main");
    expect(pickBranch([])).toBeNull();
  });

  it("tells whether a GitHub tool's arguments name the site's repository", () => {
    expect(namesRepo({ owner: "TchJhnsn", repo: "tcjcafe", path: "a" }, "tchjhnsn/tcjcafe")).toBe(true);
    expect(namesRepo({ repo: "https://github.com/tchjhnsn/tcjcafe.git" }, "tchjhnsn/tcjcafe")).toBe(true);
    expect(namesRepo({ full_name: "tchjhnsn/tcjcafe" }, "tchjhnsn/tcjcafe")).toBe(true);
    expect(namesRepo({ owner: "tchjhnsn", repo: "other" }, "tchjhnsn/tcjcafe")).toBe(false);
    expect(namesRepo({ title: "tchjhnsn/tcjcafe" }, "tchjhnsn/tcjcafe")).toBe(false);
    expect(namesRepo(null, "tchjhnsn/tcjcafe")).toBe(false);
  });

  it("delivers published/ only into the content folders, and refuses any other path", () => {
    const place = { posts: "app/blog/posts", ext: "mdx" as const, data: DEFAULT_DATA_FOLDER };
    expect(contentPath(place, "posts/on-craft.md")).toBe("app/blog/posts/on-craft.mdx");
    expect(contentPath(place, "index.json")).toBe("content/reflect/index.json");
    expect(contentPath(place, "profile.json")).toBe("content/reflect/profile.json");
    for (const p of ["app/page.tsx", "posts/../app/page.tsx", "posts/a/b.md", "notes.json"]) expect(() => contentPath(place, p)).toThrow(/delivers only/);
    expect(insideContent(place, "app/blog/posts/on-craft.mdx")).toBe(true);
    expect(insideContent(place, "content/reflect/index.json")).toBe(true);
    for (const p of ["app/page.tsx", "app/blog/posts/on-craft.md", "app/blog/posts/sub/x.mdx", "app/blog/posts/../page.mdx", "content/reflect/other.json", "package.json"]) expect(insideContent(place, p), p).toBe(false);
    expect(cleanFolder("/content/reflect/")).toBe("content/reflect");
    for (const f of ["", "../x", "a/../b", "a//b", "a b"]) expect(cleanFolder(f), f).toBeNull();
  });
});
