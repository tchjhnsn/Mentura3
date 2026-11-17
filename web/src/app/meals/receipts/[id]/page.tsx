import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { SPEND_KINDS } from "@reflect/core/spending";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { receiptOf } from "@/server/spending-store";
import { receiptDropLineAction, receiptKeepAction, receiptRemoveAction, receiptSpendAction } from "../../actions";

export const metadata: Metadata = { title: "Receipt" };
export const dynamic = "force-dynamic";
const money = (n: number) => `$${n.toFixed(2)}`;
const DAY = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });

/**
 * A receipt, as read (doc "Food design guide", revision 2): the store, the day and the total large, what it counts as
 * with a tap to change, the lines read with a tap to drop a wrong one, and Keep it, the one filled button.
 */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const r = await receiptOf(user.id, (await params).id);
  if (!r) notFound();
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meals" backLabel="Food" crumbs={[{ label: "Food", href: "/meals" }]} title="Receipt" />
      <div className={COLUMN}>
        <div className="grid gap-1">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{r.store}</h1>
          <p className="text-muted-foreground text-sm">{DAY(r.day)}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">{money(r.total)}</p>
        </div>

        <Group title="Counts as" id="kind">
          {SPEND_KINDS.map((k) => (
            <li key={k.id}>
              <form action={receiptSpendAction.bind(null, r.id, k.id)}>
                <button type="submit" aria-pressed={r.kind === k.id} className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left text-base transition">
                  <span className="flex-1">{k.label}</span>
                  {r.kind === k.id ? <CheckIcon aria-label="Chosen" className="text-primary size-5" /> : null}
                </button>
              </form>
            </li>
          ))}
        </Group>

        {!r.confirmed ? <form action={receiptKeepAction.bind(null, r.id)}><Button type="submit" size="lg" className="w-full">Keep it</Button></form> : <p className="text-muted-foreground text-center text-sm">Kept. It counts toward this month&apos;s food.</p>}

        <Group title={`What Reflect read, ${r.items.length} ${r.items.length === 1 ? "line" : "lines"}`} id="lines">
          {r.items.map((i, n) => (
            <li key={n} className="flex items-center">
              <span className="flex min-h-12 flex-1 items-center justify-between gap-4 py-3 pl-4"><span className="text-base">{i.name}</span><span className="text-base tabular-nums">{money(i.price)}</span></span>
              <form action={receiptDropLineAction.bind(null, r.id, n)} className="px-2"><Button type="submit" variant="ghost" size="icon" aria-label={`Drop ${i.name}`}><Trash2Icon /></Button></form>
            </li>
          ))}
          {!r.items.length ? <li className="text-muted-foreground px-4 py-4 text-sm">No lines were read, only the total.</li> : null}
        </Group>
        <p className="text-muted-foreground text-center text-xs">The photo is not kept, only what was read. Line prices help estimate your next grocery run.</p>

        <Group>
          <li><form action={receiptRemoveAction.bind(null, r.id)}><button type="submit" className="hover:bg-accent text-destructive flex min-h-14 w-full items-center px-4 py-3 text-left text-base transition">Take this receipt out</button></form></li>
        </Group>
      </div>
    </main>
  );
}
