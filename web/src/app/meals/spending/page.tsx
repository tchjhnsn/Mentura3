import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { foodMoney } from "@/server/spending-store";
import { ReceiptPicker } from "../receipt-picker";

export const metadata: Metadata = { title: "Spending" };
export const dynamic = "force-dynamic";
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const DAY = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const MONTH = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Spending on food: each month's groceries and eating out, and every receipt kept, newest first. */
export default async function SpendingPage() {
  const user = await requireUser();
  const f = await foodMoney(user.id, new Date().toISOString().slice(0, 7));
  const months = [...new Set(f.receipts.map((r) => r.day.slice(0, 7)))];
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meals" backLabel="Food" crumbs={[{ label: "Food", href: "/meals" }]} title="Spending" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Spending</h1>
        <Group><ReceiptPicker /></Group>
        {months.map((m) => {
          const list = f.receipts.filter((r) => r.day.startsWith(m));
          const kept = list.filter((r) => r.confirmed);
          const g = kept.filter((r) => r.kind === "groceries").reduce((s, r) => s + r.total, 0);
          const o = kept.filter((r) => r.kind === "eating-out").reduce((s, r) => s + r.total, 0);
          return (
            <Group key={m} title={`${MONTH(m)}: groceries ${money(g)}, eating out ${money(o)}`} id={`m-${m}`}>
              {list.map((r) => <Row key={r.id} href={`/meals/receipts/${r.id}`} label={r.store} sub={`${DAY(r.day)}, ${r.kind === "groceries" ? "groceries" : "eating out"}${r.confirmed ? "" : ", not kept yet"}`} value={`$${r.total.toFixed(2)}`} />)}
            </Group>
          );
        })}
        {!months.length ? <p className="text-muted-foreground text-center text-sm">Add a receipt from a store or a restaurant and it shows here, split into groceries and eating out.</p> : null}
      </div>
    </main>
  );
}
