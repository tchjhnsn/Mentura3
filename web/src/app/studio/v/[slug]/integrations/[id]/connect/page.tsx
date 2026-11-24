// V24 Connect: what connecting allows before the sign-in at the service, after v0's install checkout and GitBook's
// permissions panel. Continue starts the marketplace's own sign-in and comes back to V23.
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { marketReady } from "@reflect/core/marketplace";
import { Button } from "@/components/ui/button";
import { Logo } from "@/app/marketplace/logos";
import { Num } from "@/components/studio/bits";
import { ventureHref } from "@/components/studio/data";
import { integrationOf } from "@/components/studio/integrations";
import { connectIntegration } from "../../actions";
import { integrationsContext } from "../../context";

export const dynamic = "force-dynamic";

export default async function ConnectPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug, id: raw } = await params;
  const id = decodeURIComponent(raw);
  const c = integrationOf(id);
  if (!c) notFound();
  const [ctx, sp] = await Promise.all([integrationsContext(slug), searchParams]);
  const back = ventureHref(slug, `integrations/${encodeURIComponent(id)}`);
  const ready = marketReady(c, process.env);
  return (
    <div className="mx-auto max-w-lg px-4 pt-8 pb-16" data-virtu-screen="V24">
      <div className="flex items-center gap-2"><Num n="V24" /><span className="text-muted-foreground text-sm">Connecting to your account, for {ctx.name} and your other businesses</span></div>
      <div className="mt-4 flex items-center gap-3">
        <Logo id={c.id} name={c.name} />
        <h1 className="text-xl font-semibold tracking-tight">Connect {c.name}</h1>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">You sign in at {c.by} with your own account. Reflect keeps the sign-in encrypted and never sees your password.</p>
      <section className="mt-6 rounded-xl border">
        <h2 className="border-b px-4 py-3 text-sm font-medium">What it allows</h2>
        <ul className="space-y-2 px-4 py-3 text-sm">
          {c.does.map((d) => <li key={d} className="flex gap-2"><CheckIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />{d}</li>)}
        </ul>
        <p className="text-muted-foreground border-t px-4 py-3 text-sm">Reads run when you ask. Anything that writes, sends or pays waits for you to tap Send on a card that names it. You can disconnect at any time.</p>
      </section>
      <section className="mt-4 rounded-xl border px-4 py-3 text-sm">
        <h2 className="font-medium">Which businesses can use it</h2>
        <p className="text-muted-foreground mt-1">All of yours. Choosing them one by one is not built yet.</p>
      </section>
      {sp.error ? <p className="text-destructive mt-4 text-sm">{sp.error}</p> : null}
      <div className="mt-6 flex justify-between gap-3">
        <Button variant="outline" asChild><Link href={back}>Cancel</Link></Button>
        {ready ? (
          <form action={connectIntegration.bind(null, slug, id)}><Button type="submit">Continue to {c.by}</Button></form>
        ) : <p className="text-muted-foreground text-sm">{c.name} needs Reflect registered with it first.</p>}
      </div>
    </div>
  );
}
