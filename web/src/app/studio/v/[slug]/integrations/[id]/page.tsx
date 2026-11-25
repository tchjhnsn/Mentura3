// V23 Integration detail, and V26 when it is connected: after Vercel's integration page, the overview on the left and
// the facts on the right; Connect leads to V24, Disconnect clears the sign-in.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { marketReady } from "@reflect/core/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/app/marketplace/logos";
import { Num } from "@/components/studio/bits";
import { fnOf, ventureHref } from "@/components/studio/data";
import { ACCOUNT_LABEL_MAX, CAPABILITIES, SERVICE_CAPABILITIES, categoriesOf, functionsOf, integrationOf } from "@/components/studio/integrations";
import { Fact, FitBadge, Reasons, SignInFailed } from "@/components/studio/integrations-ui";
import { M1, failureAction, signInFailureFrom } from "@/components/studio/integrations-machines";
import { WhyThis } from "@/components/studio/integrations-why";
import { recommend } from "@/components/studio/recommend";
import { listVentures } from "@/app/studio/actions";
import { connectAnother, connectIntegration, disconnectIntegration, saveBusinesses, useHere } from "../actions";
import { integrationsContext, usableBy } from "../context";

export const dynamic = "force-dynamic";

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export default async function IntegrationPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ connected?: string; disconnected?: string; saved?: string; error?: string; failed?: string }> }) {
  const { slug, id: raw } = await params;
  const id = decodeURIComponent(raw);
  const c = integrationOf(id);
  if (!c) notFound();
  const [ctx, sp] = await Promise.all([integrationsContext(slug), searchParams]);
  // Every account of this service the person holds, the unnamed first account first (R18, P26).
  const accounts = ctx.connections.filter((x) => x.connector === id && (x.status === "connected" || x.status === "expired")).sort((a, b) => Number(a.account !== null) - Number(b.account !== null));
  const here = accounts.filter((x) => usableBy(x, ctx.id));
  const mine = here[0] ?? accounts[0];
  // Connected here only when this business may use it; a connection kept to other businesses offers Use it here.
  const conn = mine && usableBy(mine, ctx.id) ? mine : undefined;
  const others = mine && !conn ? mine : undefined;
  const ventures = conn ? await listVentures() : null;
  const choices = [...new Map([[ctx.id, ctx.name], ...(ventures?.ok ? ventures.value.map((v): [string, string] => [v.id, v.name]) : [])]).entries()];
  const ready = marketReady(c, process.env);
  const cats = categoriesOf(id);
  const fns = [...new Set(cats.flatMap(functionsOf))];
  const failed = signInFailureFrom(sp.failed);
  const reconnect = failureAction(M1, "expired");
  const recs = recommend({ ...ctx.profile, connected: ctx.connected }).filter((r) => cats.some((k) => k.id === r.category.id));
  return (
    <div className="pb-16" data-virtu-screen={conn ? "V26" : "V23"}>
      <div className="px-4 pt-5 md:px-8 md:pt-8">
        <Link href={ventureHref(slug, "integrations")} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"><ArrowLeftIcon className="size-4" />Back to Integrations</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Num n={conn ? "V26" : "V23"} />
            <Logo id={c.id} name={c.name} />
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{c.name}</h1>
              <p className="text-muted-foreground text-sm">{c.line}</p>
            </div>
          </div>
          {conn?.status === "expired" ? <form action={connectIntegration.bind(null, slug, id)}><input type="hidden" name="account" value={conn.account ?? ""} /><Button type="submit">{reconnect}</Button></form>
            : conn ? <Badge variant="secondary" className="font-normal">Connected</Badge>
            : others ? <form action={useHere.bind(null, slug, id, others.id, others.businesses ?? [])}><Button type="submit">Use it in {ctx.name}</Button></form>
            : ready ? <Button asChild><Link href={ventureHref(slug, `integrations/${encodeURIComponent(id)}/connect`)}>Connect</Link></Button>
            : <Badge variant="outline" className="font-normal">Needs setup by Reflect</Badge>}
        </div>
        {conn?.status === "expired" ? <p className="bg-muted mt-4 rounded-lg px-3 py-2 text-sm">{c.name} stopped accepting Reflect&apos;s sign-in. Reconnect with the same account and every business that used it keeps it.</p> : null}
        {sp.connected ? <p className="bg-muted mt-4 rounded-lg px-3 py-2 text-sm">{c.name} is connected. Reflect reads it when you ask, and anything that writes or sends waits for your Send.</p> : null}
        {others ? <p className="bg-muted mt-4 rounded-lg px-3 py-2 text-sm">You have connected {c.name}, but kept it to your other businesses.</p> : null}
        {sp.saved ? <p className="bg-muted mt-4 rounded-lg px-3 py-2 text-sm">Saved which businesses can use {c.name}.</p> : null}
        {sp.disconnected ? <p className="bg-muted mt-4 rounded-lg px-3 py-2 text-sm">{c.name} is disconnected. Reflect no longer holds your sign-in.</p> : null}
        {failed ? <SignInFailed state={failed} message={sp.error} retry={ventureHref(slug, `integrations/${encodeURIComponent(id)}/connect`)} />
          : sp.error ? <p className="text-destructive mt-4 text-sm">{sp.error}</p> : null}
      </div>
      <div className="mt-6 grid max-w-5xl gap-8 px-4 md:grid-cols-[1fr_16rem] md:px-8">
        <div className="space-y-8">
          <section>
            <h2 className="font-semibold">What Reflect does with it</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{c.does.map((d) => <li key={d}>{d}</li>)}</ul>
            <p className="text-muted-foreground mt-3 text-sm">Reads run when you ask. Anything that writes, sends or pays waits for you to tap Send on a card that names it.</p>
          </section>
          {recs.length ? (
            <section>
              <h2 className="font-semibold">Why {ctx.name} would use it</h2>
              <ul className="mt-2 divide-y rounded-xl border">
                {recs.map((r) => (
                  <li key={r.category.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">{r.category.name}{r.later ? <Badge variant="outline" className="text-muted-foreground font-normal">Later</Badge> : <FitBadge fit={r.fit} />}</div>
                    <div className="mt-2"><Reasons slug={slug} r={r} /></div>
                    <p className="text-muted-foreground mt-2 text-xs">For {r.functions.map((f) => fnOf(f).label).join(", ")}</p>
                    <div className="mt-1"><WhyThis slug={slug} category={r.category.id} /></div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {conn ? (
            <section className="rounded-xl border p-4">
              <h2 className="font-semibold">Accounts</h2>
              <p className="text-muted-foreground mt-1 text-sm">Each account is its own sign-in at {c.name}. Connect another to use, say, a work and a personal account side by side.</p>
              <ul className="mt-3 divide-y rounded-lg border text-sm">
                {here.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <span className="flex-1 font-medium">{a.account ?? "First account"}</span>
                    {a.status === "expired" ? <Badge variant="destructive" className="font-normal">Needs reconnect</Badge> : <span className="text-muted-foreground">Connected {day(a.connectedAt)}</span>}
                    {a.status === "expired" ? <form action={connectIntegration.bind(null, slug, id)}><input type="hidden" name="account" value={a.account ?? ""} /><Button size="sm" type="submit">{reconnect}</Button></form> : null}
                    {a.id !== conn.id ? <form action={disconnectIntegration.bind(null, slug, id, a.id)}><Button size="sm" variant="outline" type="submit">Disconnect</Button></form> : null}
                  </li>
                ))}
              </ul>
              <form action={connectAnother.bind(null, slug, id)} className="mt-3 flex flex-wrap items-center gap-2">
                <label htmlFor="account" className="sr-only">Name for the other account</label>
                <input id="account" name="account" required maxLength={ACCOUNT_LABEL_MAX} placeholder="Name it, such as Work" className="border-input bg-background h-8 min-w-0 flex-1 rounded-md border px-2 text-sm" />
                <Button size="sm" variant="outline" type="submit">Connect another account</Button>
              </form>
              <p className="text-muted-foreground mt-2 text-xs">A new account starts kept to {ctx.name}. Tick other businesses for it once it is connected.</p>
            </section>
          ) : null}
          {conn ? (
            <section className="rounded-xl border p-4">
              <h2 className="font-semibold">Which businesses can use it</h2>
              <form action={saveBusinesses.bind(null, slug, id, conn.id)} className="mt-2 space-y-1 text-sm">
                <label className="flex items-center gap-2 py-1"><input type="checkbox" name="all" defaultChecked={conn.businesses === null} />All your businesses, now and later</label>
                <div className="text-muted-foreground pt-1 text-xs">Or only these:</div>
                {choices.map(([bid, bname]) => (
                  <label key={bid} className="flex items-center gap-2 py-1"><input type="checkbox" name="business" value={bid} defaultChecked={conn.businesses?.includes(bid) ?? false} />{bname}</label>
                ))}
                <Button type="submit" size="sm" variant="outline" className="mt-2">Save</Button>
              </form>
            </section>
          ) : null}
          {conn ? (
            <section className="rounded-xl border p-4">
              <h2 className="font-semibold">Disconnect</h2>
              <p className="text-muted-foreground mt-1 text-sm">Reflect forgets your sign-in. Every business that uses it loses it, not only {ctx.name}.</p>
              <form action={disconnectIntegration.bind(null, slug, id, conn.id)} className="mt-3"><Button variant="destructive" size="sm" type="submit">Disconnect {c.name}</Button></form>
            </section>
          ) : null}
        </div>
        <aside className="divide-y text-sm">
          {conn ? <Fact label="Connected">{day(conn.connectedAt)}</Fact> : null}
          <Fact label="Categories">
            <div className="flex flex-wrap gap-1">{cats.map((k) => <Link key={k.id} href={ventureHref(slug, `integrations/category/${k.id}`)}><Badge variant="outline" className="font-normal hover:underline">{k.name}</Badge></Link>)}</div>
          </Fact>
          {SERVICE_CAPABILITIES[id]?.length ? <Fact label="What it can do">{SERVICE_CAPABILITIES[id].map((k) => CAPABILITIES[k]).join(", ")}</Fact> : null}
          <Fact label="Functions it serves">{fns.map((f) => fnOf(f).label).join(", ")}</Fact>
          <Fact label="Sign in">With your own {c.by} account</Fact>
          <Fact label="Made by">{c.by}</Fact>
          <Fact label="Resources"><a href={c.docs} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">Documentation<ExternalLinkIcon className="size-3" /></a></Fact>
        </aside>
      </div>
    </div>
  );
}
