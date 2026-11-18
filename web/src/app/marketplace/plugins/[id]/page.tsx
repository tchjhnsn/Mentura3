import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { marketById, pluginById, pluginReady } from "@reflect/core/marketplace";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { connectedIds, pluginsOf } from "@/server/plugins";
import { addPluginAction, removePluginAction } from "../../actions";
import { Mark } from "../../parts";

export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: pluginById((await params).id)?.name ?? "Plugin" };
}

/**
 * One plugin (Torian, 2026-11-18 21:11Z): what it does, Add as the one filled act, the connectors it works through with
 * their state, and its skill word for word, so the person sees exactly what Ask Reflect is told.
 */
export default async function PluginPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const p = pluginById((await params).id);
  if (!p) notFound();
  const sp = await searchParams;
  const [added, on] = await Promise.all([pluginsOf(user.id).catch(() => []), connectedIds(user.id)]);
  const isAdded = added.some((a) => a.id === p.id);
  const ready = pluginReady(p, on);
  return (
    <main className={PAGE}>
      <ThingHeader back="/marketplace?tab=plugins" backLabel="Plugins" crumbs={[{ label: "Marketplace", href: "/marketplace?tab=plugins" }]} title={p.name} />
      <div className="mx-auto mt-6 grid w-full max-w-2xl gap-8 pb-16">
        <section className="flex flex-wrap items-start gap-4">
          <Mark id={`plugin:${p.id}`} name={p.name} size="size-16 text-2xl" />
          <div className="grid min-w-0 flex-1 gap-1">
            <h1 id="page-title" className="text-3xl font-bold tracking-tight">{p.name}</h1>
            <p className="text-muted-foreground text-sm">Plugin by {p.by}</p>
            <p className="mt-1">{p.line}</p>
          </div>
          <div className="grid w-full gap-2 sm:w-auto">
            {isAdded ? (
              <>
                <span className="text-primary inline-flex items-center gap-1.5 text-sm font-medium"><CheckIcon className="size-4" />Added</span>
                <form action={removePluginAction.bind(null, p.id)}><Button type="submit" variant="ghost" size="sm" className="text-muted-foreground px-0">Remove</Button></form>
              </>
            ) : (
              <form action={addPluginAction.bind(null, p.id)}><Button type="submit" size="lg" className="w-full sm:w-auto">Add</Button></form>
            )}
          </div>
        </section>

        {one(sp.added) ? <p className="bg-muted rounded-xl px-4 py-3 text-sm" role="status">{ready.works ? `${p.name} is added. Ask Reflect follows it from your next message.` : `${p.name} is added. Connect ${p.connectors.map((c) => marketById(c)?.name ?? c).join(" or ")} below for it to work.`}</p> : null}

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">What Ask Reflect does with it</h2>
          <ul className="grid list-disc gap-1 pl-5">{p.does.map((d) => <li key={d}>{d}</li>)}</ul>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">Works through</h2>
          <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
            {p.connectors.map((id) => {
              const c = marketById(id)!;
              const isOn = on.has(id);
              return (
                <li key={id}>
                  <Link href={`/marketplace/${id}`} className="hover:bg-accent flex min-h-14 items-center gap-3 px-4 py-2">
                    <Mark id={id} name={c.name} size="size-8 text-sm" />
                    <span className="grid flex-1"><span>{c.name}</span><span className="text-muted-foreground text-sm">{c.line}</span></span>
                    <span className={isOn ? "text-primary inline-flex items-center gap-1 text-sm" : "text-muted-foreground text-sm"}>{isOn ? <><CheckIcon className="size-4" />Connected</> : "Connect"}</span>
                    <ChevronRightIcon className="text-muted-foreground size-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground text-xs">{p.connectors.length > 1 ? "Any one of these is enough." : "It works once this is connected."}</p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">Its skill</h2>
          <p className="bg-muted/40 rounded-2xl border px-4 py-3 text-sm leading-relaxed">{p.skill}</p>
          <p className="text-muted-foreground text-xs">While it is added, Ask Reflect follows this. Anything that changes something in your accounts still waits for your Send.</p>
        </section>
      </div>
    </main>
  );
}
