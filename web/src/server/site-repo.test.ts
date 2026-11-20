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
  siteDataFolder: async () => "content/reflect",
}));

const { contentPlaceOf, deleteContentFile, inspectRepo, publishToRepo, unpublishFromRepo, writeContentFile } = await import("./site-repo");
const { defaultPolicy, draftPresentation } = await import("@reflect/core/presentation");
const { parseIndex, publishedProblems } = await import("@reflect/core/published");
const post = { id: "p1", workId: "w", slug: "on-craft", kind: "essay", title: "On craft", body: "The work is the thing.", publishedAt: "2026-11-18T20:00:00.000Z", updatedAt: "2026-11-18T20:00:00.000Z" };
const at = new Date("2026-11-18T20:00:00.000Z");
const policy = defaultPolicy("Torian");
const record = draftPresentation(policy, null, { channel: "personal-site", role: "writer", end: "share what I have thought through", audience: "readers" }, { id: "2026-11-18-personal-site", now: at });
const approval = { policy, record, channel: "personal-site", at };

/** The repository's content as a published/ folder, to check it with the core's check. */
const asPublished = () =>
  new Map(Object.entries(files).flatMap(([k, v]): [string, string][] => (k.startsWith("content/reflect/") ? [[k.slice("content/reflect/".length), v]] : k.startsWith("app/blog/posts/") && k !== "app/blog/posts/the-everything-ecosystem.mdx" ? [[`posts/${k.slice("app/blog/posts/".length).replace(/\.mdx$/, ".md")}`, v]] : [])));

describe("site repository through the GitHub connector", () => {
  beforeEach(() => { calls.length = 0; });

  it("links a repository: its branch and posts folder", async () => {
    expect(await inspectRepo("u", "https://github.com/tchjhnsn/tcjcafe")).toEqual({ repo: "tchjhnsn/tcjcafe", branch: "main", folder: "app/blog/posts", ext: "mdx" });
  });

  it("delivers the post file and the manifest into the content folders, moves it on a new slug, and takes both out on unpublish", async () => {
    expect(await publishToRepo("u", post, approval)).toBe("app/blog/posts/on-craft.mdx");
    expect(files["app/blog/posts/on-craft.mdx"]).toContain('title: "On craft"\ndate: "2026-11-18T20:00:00.000Z"');
    expect(files["app/blog/posts/on-craft.mdx"]).toContain('presentation: "2026-11-18-personal-site"\nchannel: "personal-site"\n---\n\nThe work is the thing.\n');
    expect(parseIndex(files["content/reflect/index.json"]!).index?.entries.map((e) => [e.path, e.presentation, e.approved_by])).toEqual([["posts/on-craft.md", "2026-11-18-personal-site", "person"]]);
    expect(publishedProblems(asPublished())).toEqual([]);
    const written = calls.filter((c) => c.name === "create_or_update_file").map((c) => c.args.path);
    expect(written).toEqual(["app/blog/posts/on-craft.mdx", "content/reflect/index.json"]);
    expect(calls.find((c) => c.name === "create_or_update_file")!.args).toMatchObject({ owner: "tchjhnsn", repo: "tcjcafe", branch: "main", message: 'Publish "On craft" from Reflect' });

    await publishToRepo("u", { ...post, slug: "craft" }, approval);
    expect(Object.keys(files).sort()).toEqual(["app/blog/posts/craft.mdx", "app/blog/posts/the-everything-ecosystem.mdx", "content/reflect/index.json"]);
    expect(publishedProblems(asPublished())).toEqual([]);
    await unpublishFromRepo("u", post);
    expect(Object.keys(files).sort()).toEqual(["app/blog/posts/the-everything-ecosystem.mdx", "content/reflect/index.json"]);
    expect(parseIndex(files["content/reflect/index.json"]!).index?.entries).toEqual([]);
    expect(repoPathOf).toBeNull();
  });

  it("refuses a publish whose record does not pass the gate, and writes nothing", async () => {
    await expect(publishToRepo("u", post, { ...approval, record: null })).rejects.toMatchObject({ reason: "not-presented" });
    expect(calls.filter((c) => c.name === "create_or_update_file")).toEqual([]);
  });

  it("refuses to write or remove any path outside the content folders", async () => {
    const { site, place } = (await contentPlaceOf("u"))!;
    for (const path of ["app/page.tsx", "package.json", "app/blog/posts/../page.mdx", "content/reflect/other.json", ".github/workflows/deploy.yml"]) {
      await expect(writeContentFile("u", site, place, path, "x", "edit"), path).rejects.toThrow(/Reflect writes only its content in tchjhnsn\/tcjcafe.*Your site's code lives in its own repository/);
      await expect(deleteContentFile("u", site, place, path, "remove"), path).rejects.toThrow(/is outside them/);
    }
    expect(calls.filter((c) => c.name === "create_or_update_file" || c.name === "delete_file")).toEqual([]);
  });
});
