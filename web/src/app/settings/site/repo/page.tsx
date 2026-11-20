import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, ExternalLinkIcon, GitBranchIcon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/server/session";
import { siteDataFolder, siteOf } from "@/server/site-store";
import { connectedTo } from "@/server/mcp-connections";
import { myRepos } from "@/server/site-repo";
import { linkRepoAction, setDataFolderAction, unlinkRepoAction } from "../actions";

export const metadata: Metadata = { title: "Your own site on GitHub" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Your own site on GitHub (Torian, 2026-11-18 20:47Z): a site the person hosts themselves, in its own repository.
 * Pick the repository; Publish then delivers each post file into its posts folder and Reflect's manifest into the data
 * folder, through the person's GitHub connector, and their host deploys it. Reflect never edits the site's code
 * (2026-11-20, "Files out, no site code").
 */
export default async function RepoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const error = one(sp.error);
  const [site, github, dataFolder] = await Promise.all([siteOf(user.id), connectedTo(user.id, "github").catch(() => null), siteDataFolder(user.id).catch(() => "content/reflect")]);
  const linked = site.repo;
  const repos = github && !linked ? await myRepos(user.id).catch(() => []) : [];
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/site" backLabel="Your site" crumbs={[{ label: "Your site", href: "/settings/site" }]} title="Your own site on GitHub" />
      <div className={COLUMN}>
        <div className="grid justify-items-center gap-2 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Your own site on GitHub</h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            {linked ? "What you publish from your journal is committed to this repository as Markdown files. Your host deploys it on each push." : "Host your site yourself and keep publishing from Reflect. Pick its repository; each post you publish is committed there as a Markdown file, with Reflect's manifest beside it."}
          </p>
        </div>

        {linked ? (
          <div className="grid gap-3">
            <a href={`https://github.com/${linked.repo}`} target="_blank" rel="noreferrer" className="bg-card grid gap-1 rounded-2xl border px-4 py-3 hover:bg-accent">
              <span className="flex items-center gap-2 font-medium"><CheckIcon className="text-primary size-4" />{linked.repo}<ExternalLinkIcon className="text-muted-foreground size-3.5" /></span>
              <span className="text-muted-foreground text-sm">Posts go to <code className="font-mono text-xs">{linked.folder || "the top folder"}/</code> as .{linked.ext} on {linked.branch}.</span>
            </a>
            <form action={setDataFolderAction} className="grid gap-2">
              <label htmlFor="data-folder" className="text-muted-foreground px-1 text-sm">Folder for profile.json and index.json</label>
              <div className="flex gap-2">
                <Input id="data-folder" name="folder" defaultValue={dataFolder} autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
                <Button type="submit" variant="outline">Save</Button>
              </div>
            </form>
            <form action={linkRepoAction}><input type="hidden" name="repo" value={linked.repo} /><Button type="submit" variant="outline" className="w-full">Check the repository again</Button></form>
            <form action={unlinkRepoAction}><Button type="submit" variant="ghost" className="w-full">Stop publishing here</Button></form>
            <p className="text-muted-foreground text-center text-xs">Reflect can read any file in it and writes only these folders. Your site&apos;s code stays in its own repository: change it there with Claude Code or Virtu.</p>
          </div>
        ) : !github ? (
          <Button asChild size="lg" className="w-full"><Link href="/marketplace/github"><GitBranchIcon />Connect GitHub</Link></Button>
        ) : (
          <div className="grid gap-4">
            <form action={linkRepoAction} className="grid gap-2">
              <Input name="repo" placeholder="owner/name" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label="Repository" required />
              <Button type="submit" size="lg" className="w-full">Use this repository</Button>
            </form>
            {repos.length ? (
              <section aria-labelledby="yours" className="grid gap-2">
                <h2 id="yours" className="text-muted-foreground px-4 text-sm">Your repositories</h2>
                <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
                  {repos.map((r) => (
                    <li key={r}>
                      <form action={linkRepoAction}>
                        <input type="hidden" name="repo" value={r} />
                        <button type="submit" className="hover:bg-accent flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left text-sm"><GitBranchIcon className="text-muted-foreground size-4" />{r}</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
        {error ? <p className="text-destructive text-center text-sm" role="alert">{error}</p> : null}
      </div>
    </main>
  );
}
