import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { isLifeApp, kindOf } from "@reflect/core/life";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN, Group } from "@/components/list-rows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lifeRecords } from "@/server/life-store";
import { requireUser } from "@/server/session";
import { setAmountAction, setFieldAction } from "../../actions";

export const metadata: Metadata = { title: "Change" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * One fact of a tile, on its own page (doc "Household tiles design guide"): a choice is a list to tap, and an amount
 * is one number. Never a form of many fields.
 */
export default async function SetPage({ params, searchParams }: { params: Promise<{ app: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { app } = await params;
  const sp = await searchParams;
  if (!isLifeApp(app)) notFound();
  const kind = kindOf(app, one(sp.k));
  const f = kind?.one ? kind.fields.find((x) => x.key === one(sp.f)) : undefined;
  if (!kind || !f || !["choice", "money", "number"].includes(f.kind)) notFound();
  const r = (await lifeRecords(user.id, app)).find((x) => x.kind === kind.id);
  const now = r?.body[f.key];
  const to = one(sp.to);
  const back = /^\/(life|meals)(\/|\?|$)/.test(to) ? to : `/life/${app}?k=${kind.id}`;
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back={back} backLabel={kind.hidden ? "Back" : kind.plural} crumbs={[{ label: kind.plural, href: back }]} title={f.label} />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">{f.label}</h1>
        {f.kind === "choice" ? (
          <Group>
            {f.options!.map((o) => (
              <li key={o.id}>
                <form action={setFieldAction.bind(null, app, kind.id, f.key, now === o.id ? null : o.id, back)}>
                  <button type="submit" aria-pressed={now === o.id} className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left text-base transition">
                    <span className="flex-1">{o.label}</span>
                    {now === o.id ? <CheckIcon aria-label="Chosen" className="text-primary size-5" /> : null}
                  </button>
                </form>
              </li>
            ))}
          </Group>
        ) : (
          <form action={setAmountAction.bind(null, app, kind.id, f.key, back)} className="grid justify-items-center gap-6">
            <label className="flex items-baseline gap-1 text-4xl font-semibold">
              {f.kind === "money" ? <span className="text-muted-foreground">$</span> : null}
              <Input name="amount" inputMode="decimal" autoFocus defaultValue={typeof now === "number" ? String(now) : ""} aria-label={f.label} className="h-16 w-48 border-0 text-center text-4xl font-semibold shadow-none focus-visible:ring-0 md:text-4xl" placeholder="0" />
            </label>
            <p className="text-muted-foreground -mt-4 text-sm">{f.kind === "money" ? "a month" : f.label.toLowerCase()}</p>
            <Button type="submit" size="lg" className="w-full">Done</Button>
          </form>
        )}
      </div>
    </main>
  );
}
