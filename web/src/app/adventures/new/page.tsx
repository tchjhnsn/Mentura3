import type { Metadata } from "next";
import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { addAdventureAction } from "../actions";
import { Ideas } from "../parts";

export const metadata: Metadata = { title: "Add an adventure" };
export const dynamic = "force-dynamic";

/** Adding an adventure: name it, pick an idea's photo tile, or hand it to the chat to plan. */
export default async function NewAdventurePage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/adventures" backLabel="Adventures" crumbs={[{ label: "Adventures", href: "/adventures" }]} title="Add an adventure" />
      <div className="mt-6 grid max-w-5xl gap-8">
        <div className="grid gap-3">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight">What do you want to do?</h1>
          <form action={addAdventureAction.bind(null, null)} className="flex max-w-xl items-center gap-2">
            <input name="name" autoFocus placeholder="Climb Mount Whitney, see the northern lights" aria-label="Name" className="border-input bg-background h-11 flex-1 rounded-lg border px-4" />
            <Button type="submit" size="lg">Add</Button>
          </form>
          <Link href={`/chat?q=${encodeURIComponent("Help me plan an adventure.")}`} className="text-primary flex items-center gap-1.5 text-sm"><SparklesIcon className="size-4" />Not sure yet? Plan it with Reflect</Link>
        </div>
        <section aria-labelledby="ideas" className="grid gap-3">
          <h2 id="ideas" className="text-lg font-semibold">Ideas</h2>
          <Ideas />
        </section>
      </div>
    </main>
  );
}
