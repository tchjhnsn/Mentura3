import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, DownloadIcon, GitBranchIcon, RocketIcon } from "lucide-react";
import { deployUrl } from "@reflect/core/site-export";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { canPushToGithub } from "@/server/github-push";
import { connectedTo } from "@/server/mcp-connections";
import { deploySiteAction, pushSiteAction } from "../actions";
import { siteProject } from "@/server/site-export";

export const metadata: Metadata = { title: "Host it yourself" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Host it yourself: deploy the site to the person's own Vercel, push it to their GitHub, or download it, all through their own connectors. */
export default async function ExportSite({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const pushed = one(sp.pushed).startsWith("https://github.com/") ? one(sp.pushed) : null;
  const deployed = one(sp.deployed).startsWith("https://") ? one(sp.deployed) : null;
  const error = one(sp.error);
  const { name, files } = await siteProject(user.id);
  const posts = Object.keys(files).filter((f) => f.startsWith("content/posts/")).length;
  const [github, vercel] = await Promise.all([connectedTo(user.id, "github").catch(() => null), connectedTo(user.id, "vercel").catch(() => null)]);
  const ready = canPushToGithub();
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/site" backLabel="Your site" crumbs={[{ label: "Your site", href: "/settings/site" }]} title="Host it yourself" />
      <div className={COLUMN}>
        <div className="grid justify-items-center gap-2 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">{deployed ? "Deploying on Vercel" : pushed ? "Pushed to GitHub" : "Host it yourself"}</h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            {deployed ? `Vercel is building ${name} on your account. It is live at this address in a minute or two.` : pushed ? "Your site is in your repository. Deploy it on Vercel, or any host that runs Next.js." : `Your site as a Next.js project named ${name}, with ${posts} ${posts === 1 ? "post" : "posts"} as Markdown, on your own accounts. Doing it again updates it.`}
          </p>
        </div>

        {deployed ? (
          <a href={deployed} target="_blank" rel="noreferrer" className="bg-card flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm hover:bg-accent"><CheckIcon className="text-primary size-5" /><span className="truncate">{deployed.replace("https://", "")}</span></a>
        ) : null}
        {vercel ? (
          <form action={deploySiteAction}><Button type="submit" size="lg" variant={deployed || pushed ? "ghost" : "default"} className="w-full"><RocketIcon />{deployed ? "Deploy again" : "Deploy with your Vercel"}</Button></form>
        ) : (
          <Button asChild size="lg" variant={pushed ? "outline" : "default"} className="w-full"><Link href="/marketplace/vercel"><RocketIcon />Connect Vercel to deploy</Link></Button>
        )}

        {pushed ? (
          <div className="grid gap-3">
            <a href={pushed} className="bg-card flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm hover:bg-accent"><CheckIcon className="text-primary size-5" /><span className="truncate">{pushed.replace("https://", "")}</span></a>
            {vercel ? null : <Button asChild variant="outline" className="w-full"><a href={deployUrl(pushed, name)} target="_blank" rel="noreferrer">Deploy on Vercel</a></Button>}
            {github ? <form action={pushSiteAction}><Button type="submit" variant="ghost" className="w-full">Push again</Button></form> : <Button asChild variant="ghost"><Link href="/api/site/github/start">Push again</Link></Button>}
          </div>
        ) : github ? (
          <form action={pushSiteAction}><Button type="submit" variant="outline" className="w-full"><GitBranchIcon />Push with your GitHub</Button></form>
        ) : ready ? (
          <Button asChild variant="outline" className="w-full"><a href="/api/site/github/start"><GitBranchIcon />Sign in to GitHub and push</a></Button>
        ) : (
          <Button asChild variant="outline" className="w-full"><Link href="/marketplace/github"><GitBranchIcon />Connect GitHub to push</Link></Button>
        )}
        {error ? <p className="text-destructive text-center text-sm" role="alert">{error === "github" ? "Pushing to GitHub is not set up yet." : error === "github-state" ? "That sign-in did not match. Try again." : error}</p> : null}

        <Button asChild variant="outline"><a href="/api/site/export" download><DownloadIcon />Download as a zip</a></Button>
        <p className="text-muted-foreground text-center text-xs">Only what you set for Everyone goes in, never your journal. Your GitHub and Vercel sign-ins stay sealed with your key; disconnect them in the marketplace.</p>
      </div>
    </main>
  );
}
