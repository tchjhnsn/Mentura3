import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, DownloadIcon, GitBranchIcon } from "lucide-react";
import { deployUrl } from "@reflect/core/site-export";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { canPushToGithub } from "@/server/github-push";
import { siteProject } from "@/server/site-export";

export const metadata: Metadata = { title: "Push to GitHub" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Push to GitHub, then Deploy on Vercel: the site as a repository of the person's own, hosted where they choose. */
export default async function ExportSite({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const pushed = one(sp.pushed).startsWith("https://github.com/") ? one(sp.pushed) : null;
  const error = one(sp.error);
  const { name, files } = await siteProject(user.id);
  const posts = Object.keys(files).filter((f) => f.startsWith("content/posts/")).length;
  const ready = canPushToGithub();
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/site" backLabel="Your site" crumbs={[{ label: "Your site", href: "/settings/site" }]} title="Push to GitHub" />
      <div className={COLUMN}>
        <div className="grid justify-items-center gap-2 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">{pushed ? "Pushed to GitHub" : "Push to GitHub"}</h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            {pushed ? "Your site is in your repository. Deploy it on Vercel, or any host that runs Next.js." : `Your site goes to a repository named ${name} on your GitHub account, with ${posts} ${posts === 1 ? "post" : "posts"} as Markdown. Pushing again updates it.`}
          </p>
        </div>

        {pushed ? (
          <div className="grid gap-3">
            <a href={pushed} className="bg-card flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm hover:bg-accent"><CheckIcon className="text-primary size-5" /><span className="truncate">{pushed.replace("https://", "")}</span></a>
            <Button asChild size="lg" className="w-full"><a href={deployUrl(pushed, name)} target="_blank" rel="noreferrer">Deploy on Vercel</a></Button>
            <Button asChild variant="ghost"><Link href="/api/site/github/start">Push again</Link></Button>
          </div>
        ) : ready ? (
          <Button asChild size="lg" className="w-full"><a href="/api/site/github/start"><GitBranchIcon />Sign in to GitHub and push</a></Button>
        ) : (
          <div className="bg-muted/50 grid gap-1 rounded-2xl border p-4 text-sm">
            <p className="font-medium">Pushing to GitHub is not set up on this Reflect yet.</p>
            <p className="text-muted-foreground">It needs a GitHub app for Reflect (GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET). Until then, download the zip and push it yourself.</p>
          </div>
        )}
        {error ? <p className="text-destructive text-center text-sm" role="alert">{error === "github" ? "Pushing to GitHub is not set up yet." : error === "github-state" ? "That sign-in did not match. Try again." : error}</p> : null}

        <Button asChild variant="outline"><a href="/api/site/export" download><DownloadIcon />Download as a zip</a></Button>
        <p className="text-muted-foreground text-center text-xs">Only what you set for Everyone goes in, never your journal. Reflect keeps no GitHub token after the push.</p>
      </div>
    </main>
  );
}
