// V24 Connect: what connecting allows before the sign-in at the service, after v0's install checkout and GitBook's
// permissions panel. Continue starts the marketplace's own sign-in and comes back to V23.
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { marketReady } from "@reflect/core/marketplace";
import { Button } from "@/components/ui/button";
import { Logo } from "@/app/marketplace/logos";
import { Num } from "@/components/studio/bits";
import { businessHref } from "@/components/studio/data";
import { integrationOf } from "@/components/studio/integrations";
import { signInFailureFrom } from "@/components/studio/integrations-machines";
import { SignInFailed } from "@/components/studio/integrations-ui";
import { connectIntegration } from "../../actions";
import { integrationsContext } from "../../context";

export const dynamic = "force-dynamic";

export default async function ConnectPage({ params, searchParams }: { params: Promise<{ team: string; slug: string; id: string }>; searchParams: Promise<{ error?: string; failed?: string }> }) {
  const { team, slug, id: raw } = await params;
  const id = decodeURIComponent(raw);
  const c = integrationOf(id);
  if (!c) notFound();
  const [ctx, sp] = await Promise.all([integrationsContext(team, slug), searchParams]);
  const back = businessHref(team, slug, `integrations/${encodeURIComponent(id)}`);
  const ready = marketReady(c, process.env);
  const failed = signInFailureFrom(sp.failed);
  return (
    <div className="mx-auto max-w-lg px-4 pt-8 pb-16" data-virtu-screen="V24">
      <div className="flex items-center gap-2"><Num n="V24" /><span className="text-muted-foreground text-sm">Connecting your {c.by} account</span></div>
      <div className="mt-4 flex items-center gap-3">
        <Logo id={c.id} name={c.name} />
        <h1 className="text-xl font-semibold tracking-tight">Connect {c.name}</h1>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">You sign in at {c.by} with your own account. Mentura keeps the sign-in encrypted and never sees your password.</p>
      <section className="mt-6 rounded-xl border">
        <h2 className="border-b px-4 py-3 text-sm font-medium">What it allows</h2>
        <ul className="space-y-2 px-4 py-3 text-sm">
          {c.does.map((d) => <li key={d} className="flex gap-2"><CheckIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />{d}</li>)}
        </ul>
        <p className="text-muted-foreground border-t px-4 py-3 text-sm">Reads run when you ask. Anything that writes, sends or pays waits for you to tap Send on a card that names it. You can disconnect at any time.</p>
      </section>
      <form action={connectIntegration.bind(null, team, slug, id)}>
        <fieldset className="mt-4 rounded-xl border px-4 py-3 text-sm">
          <legend className="px-1 font-medium">Which businesses can use it</legend>
          <label className="flex items-start gap-2 py-1"><input type="radio" name="scope" value="all" defaultChecked className="mt-1" /><span>All your businesses<span className="text-muted-foreground block">Now and any you start later.</span></span></label>
          <label className="flex items-start gap-2 py-1"><input type="radio" name="scope" value="this" className="mt-1" /><span>Only {ctx.name}<span className="text-muted-foreground block">You can add others on its page later.</span></span></label>
        </fieldset>
        {failed ? <SignInFailed state={failed} message={sp.error} retry={`${back}/connect`} />
          : sp.error ? <p className="text-destructive mt-4 text-sm">{sp.error}</p> : null}
        <div className="mt-6 flex justify-between gap-3">
          <Button variant="outline" asChild><Link href={back}>Cancel</Link></Button>
          {ready ? <Button type="submit">Continue to {c.by}</Button> : <p className="text-muted-foreground text-sm">{c.name} needs Mentura registered with it first.</p>}
        </div>
      </form>
    </div>
  );
}
