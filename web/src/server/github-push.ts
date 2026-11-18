// Push the person's site to a GitHub repository of theirs (doc "Personal site and blog design guide", Export). Their
// own GitHub sign-in (an OAuth app named by GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET) gives a token for one push; the
// token is used in that request and never kept. A repository named for the site is made when missing; an existing one
// gets a new commit that replaces the exported files and keeps anything else in it.

export const GITHUB_ENV = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"] as const;
export const canPushToGithub = () => GITHUB_ENV.every((k) => !!process.env[k]);

type Fetch = typeof fetch;
const API = "https://api.github.com";

/** Trades the sign-in code for a token. */
export async function githubToken(code: string, f: Fetch = fetch): Promise<string> {
  const r = await f("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
  });
  const j = (await r.json()) as { access_token?: string };
  if (!j.access_token) throw new Error("GitHub did not sign you in.");
  return j.access_token;
}

/** Pushes the files to <login>/<name> and returns the repository's address. */
export async function pushSite(token: string, name: string, files: Record<string, string>, description: string, f: Fetch = fetch): Promise<string> {
  const gh = async (path: string, init?: { method?: string; body?: unknown }) => {
    const r = await f(`${API}${path}`, {
      method: init?.method ?? "GET",
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "reflect-app", ...(init?.body ? { "content-type": "application/json" } : {}) },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
    return { status: r.status, json: (r.status === 204 ? {} : await r.json().catch(() => ({}))) as Record<string, unknown> };
  };
  const me = await gh("/user");
  const login = me.json.login as string | undefined;
  if (!login) throw new Error("GitHub did not say who you are.");
  let repo = await gh(`/repos/${login}/${name}`);
  if (repo.status === 404) {
    repo = await gh("/user/repos", { method: "POST", body: { name, description, private: false, auto_init: true } });
    if (repo.status >= 300) throw new Error("GitHub would not make the repository.");
  }
  const branch = (repo.json.default_branch as string | undefined) ?? "main";
  const ref = await gh(`/repos/${login}/${name}/git/ref/heads/${branch}`);
  const parent = (ref.json.object as { sha?: string } | undefined)?.sha;
  if (!parent) throw new Error("The repository has no branch to push to.");
  const commit = await gh(`/repos/${login}/${name}/git/commits/${parent}`);
  const baseTree = (commit.json.tree as { sha?: string } | undefined)?.sha;
  const tree = await gh(`/repos/${login}/${name}/git/trees`, {
    method: "POST",
    body: { base_tree: baseTree, tree: Object.entries(files).map(([path, content]) => ({ path, mode: "100644", type: "blob", content })) },
  });
  if (!tree.json.sha) throw new Error("GitHub would not take the files.");
  const made = await gh(`/repos/${login}/${name}/git/commits`, { method: "POST", body: { message: "Update the site from Reflect", tree: tree.json.sha, parents: [parent] } });
  if (!made.json.sha) throw new Error("GitHub would not make the commit.");
  const moved = await gh(`/repos/${login}/${name}/git/refs/heads/${branch}`, { method: "PATCH", body: { sha: made.json.sha } });
  if (moved.status >= 300) throw new Error("GitHub would not move the branch.");
  return `https://github.com/${login}/${name}`;
}
