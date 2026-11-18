import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: { name: string; args: Record<string, unknown> }[] = [];
const files: Record<string, string> = {
  "app/blog/posts/the-everything-ecosystem.mdx": "---\ntitle: 'The Everything Ecosystem'\npublishedAt: '2026-03-23'\nsummary: 'Ecosystems.'\n---\n\nText\n",
};
let repoPathOf: string | null = null;

vi.mock("./mcp-connections", () => ({
  connectedTo: async () => ({ id: "c1", connector: "github", name: "GitHub" }),
  toolsOf: async () => [{ name: "get_repository_tree" }, { name: "get_file_contents" }],
  callToolTexts: async (_u: string, _c: string, name: string, args: Record<string, unknown>) => {
    calls.push({ name, args });
    if (name === "list_branches") return { texts: [JSON.stringify([{ name: "dev" }, { name: "main" }])], resources: [], structured: null };
    if (name === "get_repository_tree") return { texts: [JSON.stringify({ tree: [...Object.keys(files), "README.md", "app/page.tsx"].map((path) => ({ path, type: "blob" })) })], resources: [], structured: null };
    if (name === "get_file_contents") {
      const p = String(args.path);
      if (p.endsWith("/")) return { texts: [JSON.stringify(Object.keys(files).filter((f) => f.startsWith(p)).map((path) => ({ path, type: "file" })))], resources: [], structured: null };
      if (!(p in files)) throw new Error("Not Found");
      return { texts: [`successfully downloaded text file (SHA: ${"a".repeat(40)})`], resources: [files[p]!], structured: null };
    }
    if (name === "create_or_update_file") files[String(args.path)] = String(args.content);
    if (name === "delete_file") delete files[String(args.path)];
    return { texts: ["ok"], resources: [], structured: null };
  },
}));
vi.mock("./site-store", () => ({
  siteOf: async () => ({ repo: { repo: "tchjhnsn/tcjcafe", branch: "main", folder: "app/blog/posts", ext: "mdx" } }),
  postRepoPath: async () => repoPathOf,
  setPostRepoPath: async (_u: string, _p: string, path: string | null) => { repoPathOf = path; },
}));

const { inspectRepo, publishToRepo, unpublishFromRepo } = await import("./site-repo");
const post = { id: "p1", workId: "w", slug: "on-craft", kind: "essay", title: "On craft", body: "The work is the thing.", publishedAt: "2026-11-18T20:00:00.000Z", updatedAt: "2026-11-18T20:00:00.000Z" };

describe("site repository through the GitHub connector", () => {
  beforeEach(() => { calls.length = 0; });

  it("links a repository: its branch and posts folder", async () => {
    expect(await inspectRepo("u", "https://github.com/tchjhnsn/tcjcafe")).toEqual({ repo: "tchjhnsn/tcjcafe", branch: "main", folder: "app/blog/posts", ext: "mdx" });
  });

  it("publishes a post written like the others, moves it on a new slug, and removes it on unpublish", async () => {
    expect(await publishToRepo("u", post)).toBe("app/blog/posts/on-craft.mdx");
    expect(files["app/blog/posts/on-craft.mdx"]).toBe("---\ntitle: 'On craft'\npublishedAt: '2026-11-18'\nsummary: 'The work is the thing.'\n---\n\nThe work is the thing.\n");
    const write = calls.find((c) => c.name === "create_or_update_file")!;
    expect(write.args).toMatchObject({ owner: "tchjhnsn", repo: "tcjcafe", branch: "main", message: 'Publish "On craft" from Reflect' });
    expect(write.args.sha).toBeUndefined();
    await publishToRepo("u", { ...post, slug: "craft" });
    expect(Object.keys(files).sort()).toEqual(["app/blog/posts/craft.mdx", "app/blog/posts/the-everything-ecosystem.mdx"]);
    await unpublishFromRepo("u", post);
    expect(Object.keys(files)).toEqual(["app/blog/posts/the-everything-ecosystem.mdx"]);
    expect(repoPathOf).toBeNull();
  });
});
