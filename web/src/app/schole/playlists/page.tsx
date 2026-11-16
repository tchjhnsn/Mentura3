import type { Metadata } from "next";
import { suggestCollections } from "@reflect/core/collections";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { aimsOf } from "@/server/collections";
import { browseCrumbs } from "../crumbs";
import { CollectionCard } from "./card";

export const metadata: Metadata = { title: "Playlists" };
export const dynamic = "force-dynamic";

/** Every playlist chosen by people, those serving what the person is working toward first, each saying why. */
export default async function CollectionsPage() {
  const user = await requireUser();
  const list = suggestCollections(await aimsOf(user.id));
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse" crumbs={browseCrumbs()} title="Playlists" />
      <section className="mt-8 space-y-6">
        <div className="space-y-1">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Playlists</h1>
          <p className="text-muted-foreground text-[13px]">Things to hear and watch, chosen by people, each with who chose it and why.</p>
        </div>
        <ul className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(({ collection, reason }) => <li key={collection.id}><CollectionCard c={collection} reason={reason} /></li>)}
        </ul>
      </section>
    </main>
  );
}
