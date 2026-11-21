import type { Metadata } from "next";
import Link from "next/link";
import { ScissorsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Head, PAGE } from "@/components/schole/parts";
import { requireUser } from "@/server/session";
import { listSnips } from "@/server/snips-store";
import { SnipRow } from "./snip-row";

export const metadata: Metadata = { title: "Snips" };
export const dynamic = "force-dynamic";

/** Snips (schole.inventory.json), after Snipd's: the moments the person marked while listening, newest first. Each
 * plays from its moment, opens the page it came from, or opens a journal entry about it. */
export default async function SnipsPage() {
  const user = await requireUser();
  const snips = await listSnips(user.id).catch(() => []);
  return (
    <div className={PAGE}>
      <Head n="A16" title="Snips" job="Moments you marked while listening. Play one from where you marked it, or write what you made of it in your journal." />
      {snips.length ? (
        <ul className="divide-y rounded-xl border">{snips.map((s) => <li key={s.id}><SnipRow s={s} /></li>)}</ul>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <ScissorsIcon className="text-muted-foreground mx-auto size-6" />
          <p className="mt-2 font-medium">No snips yet</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">While a podcast or audiobook plays, tap the scissors in the player to keep that moment here.</p>
          <Button asChild variant="outline" className="mt-4"><Link href="/schole/browse?m=podcast">Find something to listen to</Link></Button>
        </div>
      )}
    </div>
  );
}
