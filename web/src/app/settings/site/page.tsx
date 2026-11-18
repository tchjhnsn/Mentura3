import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, ChevronRightIcon, DownloadIcon, ExternalLinkIcon, GitBranchIcon, GlobeIcon, MailIcon, SendIcon } from "lucide-react";
import { TEMPLATES, type TemplateId } from "@reflect/core/site";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { profileSettings } from "@/server/profile-store";
import { postsOf, siteOf, subscribersOf } from "@/server/site-store";
import { siteCanSend } from "@/server/site-connectors";
import { profileHref } from "@/server/actions/profiles";
import { CopyLink } from "../copy-link";
import { setTemplateFromSettings } from "./actions";

export const metadata: Metadata = { title: "Your site" };
export const dynamic = "force-dynamic";

/** A small drawing of each template: where the face, writing and building sit, and which face the text is in. */
function Thumb({ id }: { id: TemplateId }) {
  const line = (w: string, cls = "bg-foreground/25") => <span className={cn("block h-1 rounded-full", cls)} style={{ width: w }} />;
  const writing = <span className="grid gap-1">{line("80%", "bg-foreground/60")}{line("55%")}{line("70%", "bg-foreground/60")}{line("45%")}</span>;
  const building = <span className="grid grid-cols-2 gap-1"><span className="bg-foreground/15 h-4 rounded" /><span className="bg-foreground/15 h-4 rounded" /></span>;
  return (
    <span className={cn("bg-background grid aspect-[3/4] w-full content-start gap-2 rounded-lg border p-2", id === "notebook" && "font-serif")}>
      <span className="flex items-center gap-1"><span className="bg-foreground/30 size-3 rounded-full" />{line("50%", "bg-foreground/70")}</span>
      {id === "builder" ? <>{building}{writing}</> : id === "notebook" ? <><span className="text-[9px] leading-none italic">Writing</span>{writing}{writing}</> : <>{writing}{building}</>}
    </span>
  );
}

/** Settings, Your site (doc "Personal site and blog design guide", page 4): template, address, export and subscribers. */
export default async function SiteSettings() {
  const user = await requireUser();
  const [settings, site, posts, subs, mail] = await Promise.all([profileSettings(user.id), siteOf(user.id), postsOf(user.id), subscribersOf(user.id), siteCanSend(user.id).catch(() => ({ via: null }))]);
  const href = profileHref({ id: user.id, handle: settings.handle });
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Your site" />
      <div className={COLUMN}>
        <div className="grid justify-items-center gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Your site</h1>
          <p className="text-muted-foreground text-sm">Your profile is your site. {posts.length ? `${posts.length} ${posts.length === 1 ? "post" : "posts"} published.` : "Publish from your journal to start your blog."}</p>
          <Link href={href} className="text-primary mt-1 inline-flex items-center gap-1 text-sm font-medium">View your site <ExternalLinkIcon className="size-3.5" /></Link>
        </div>

        <section aria-labelledby="template" className="grid gap-2">
          <h2 id="template" className="text-muted-foreground px-4 text-sm">Template</h2>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((t) => {
              const on = site.template === t.id;
              return (
                <form key={t.id} action={setTemplateFromSettings.bind(null, t.id)}>
                  <button type="submit" aria-pressed={on} className={cn("grid w-full gap-2 rounded-2xl border p-2 text-left transition", on ? "border-primary ring-primary/30 ring-2" : "hover:bg-accent")}>
                    <Thumb id={t.id} />
                    <span className="flex items-center gap-1 px-1 text-sm font-medium">{t.label}{on ? <CheckIcon className="text-primary size-4" aria-label="In use" /> : null}</span>
                  </button>
                </form>
              );
            })}
          </div>
          <p className="text-muted-foreground px-4 text-xs">{TEMPLATES.find((t) => t.id === site.template)!.line}</p>
        </section>

        <Group title="Address" id="address">
          <li className="grid gap-2 px-4 py-3"><CopyLink path={href} /></li>
          <Row href="/settings/site/domain" icon={<GlobeIcon />} label="Use your own domain" value={site.domain ? (site.domainCheckedAt ? site.domain : `${site.domain}, not connected`) : undefined} />
        </Group>

        <Group title="Export" id="export">
          <li>
            <a href="/api/site/export" download className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 transition">
              <DownloadIcon className="text-muted-foreground size-5" />
              <span className="grid flex-1"><span>Download as a zip</span><span className="text-muted-foreground text-sm">A Next.js project with your posts as Markdown</span></span>
            </a>
          </li>
          <Row href="/settings/site/export" icon={<GitBranchIcon />} label="Push to GitHub" sub="Then deploy it on Vercel" />
        </Group>

        <Group title="Subscribers" id="subscribers">
          <li className="flex min-h-14 items-center gap-4 px-4 py-3">
            <MailIcon className="text-muted-foreground size-5" />
            <span className="flex-1">{subs.confirmed.length} {subs.confirmed.length === 1 ? "subscriber" : "subscribers"}</span>
            {subs.waiting ? <span className="text-muted-foreground text-sm">{subs.waiting} not confirmed</span> : null}
          </li>
          <Row href="/marketplace?c=email" icon={<SendIcon />} label={mail.via ? `Emails go out through ${mail.via}` : "Connect an email account"} sub={mail.via ? undefined : "Gmail or Resend, to send confirmations and new posts"} />
          {subs.confirmed.length ? (
            <li>
              <a href="/api/site/subscribers" download className="hover:bg-accent text-primary flex min-h-14 items-center gap-4 px-4 py-3 transition">
                <DownloadIcon className="size-5" /><span className="flex-1">Download as CSV</span><ChevronRightIcon className="text-muted-foreground size-4" />
              </a>
            </li>
          ) : null}
        </Group>
        <p className="text-muted-foreground text-center text-xs">Your site shows only what you set for Everyone. Your journal is never published.</p>
      </div>
    </main>
  );
}
