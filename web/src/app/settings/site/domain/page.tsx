import type { Metadata } from "next";
import { CheckIcon } from "lucide-react";
import { CNAME_TARGET } from "@reflect/core/site";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { siteOf } from "@/server/site-store";
import { checkDomainAction, removeDomainAction, saveDomainAction } from "../actions";

export const metadata: Metadata = { title: "Your own domain" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const CHECK: Record<string, string> = {
  dns: "The record does not point here yet. DNS changes can take up to a day; check again later.",
  "no-keys": "The record points here, but this Reflect cannot add domains to its host yet (VERCEL_TOKEN and VERCEL_PROJECT_ID).",
  refused: "The record points here, but the host would not add the domain. Try again in a minute.",
};

/** Your own domain in three steps (doc "Personal site and blog design guide", page 4): the name, the record, the check. */
export default async function DomainPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const site = await siteOf(user.id);
  const step = site.domainCheckedAt ? 3 : site.domain ? 2 : 1;
  const check = one(sp.check);
  const error = one(sp.error);
  const apex = site.domain ? site.domain.split(".").length === 2 : false;
  const Step = ({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) => (
    <li className={cn("grid grid-cols-[2rem_minmax(0,1fr)] gap-3", n > step && "opacity-50")}>
      <span className={cn("grid size-8 place-items-center rounded-full border text-sm font-medium", n < step && "bg-primary text-primary-foreground border-primary")}>{n < step ? <CheckIcon className="size-4" /> : n}</span>
      <div className="grid gap-3 pt-1"><p className="font-medium">{title}</p>{n === step ? children : null}</div>
    </li>
  );
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/site" backLabel="Your site" crumbs={[{ label: "Your site", href: "/settings/site" }]} title="Your own domain" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Your own domain</h1>
        <ol className="grid gap-6">
          <Step n={1} title={site.domain ? site.domain : "The domain you own"}>
            <form action={saveDomainAction} className="grid gap-2">
              <Input name="domain" placeholder="ann.example.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label="Your domain" defaultValue={site.domain ?? ""} />
              {error ? <p className="text-destructive text-sm">{error}</p> : null}
              <Button type="submit" className="justify-self-start">Next</Button>
            </form>
          </Step>
          <Step n={2} title="Add a record where you bought it">
            <p className="text-muted-foreground text-sm">In your domain&apos;s DNS settings, add this record, then check.</p>
            <div className="bg-card grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-xl border p-3 font-mono text-xs">
              <span className="text-muted-foreground">Type</span><span>{apex ? "A" : "CNAME"}</span>
              <span className="text-muted-foreground">Name</span><span>{apex ? "@" : site.domain?.split(".")[0]}</span>
              <span className="text-muted-foreground">Value</span><span className="break-all">{apex ? "76.76.21.21" : CNAME_TARGET}</span>
            </div>
            {check && CHECK[check] ? <p className="text-sm">{CHECK[check]}</p> : null}
            <div className="flex gap-2">
              <form action={checkDomainAction}><Button type="submit">Check</Button></form>
              <form action={removeDomainAction}><Button type="submit" variant="ghost">Use another domain</Button></form>
            </div>
          </Step>
          <Step n={3} title="Connected">
            <p className="text-sm">Your site is at <a className="text-primary font-medium" href={`https://${site.domain}`}>{site.domain}</a>. Your Reflect address still works.</p>
            <form action={removeDomainAction}><Button type="submit" variant="ghost" className="text-muted-foreground px-0">Stop using this domain</Button></form>
          </Step>
        </ol>
      </div>
    </main>
  );
}
