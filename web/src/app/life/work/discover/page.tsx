import type { Metadata } from "next";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { myPicks } from "@/server/crafts-store";
import { Picker } from "./picker";

export const metadata: Metadata = { title: "Find your crafts" };
export const dynamic = "force-dynamic";

/**
 * Find your crafts (Scholē picker design guide): worlds, then crafts (?step=crafts), then three matches. The picks
 * kept so far are read here, so the picker opens with them checked.
 */
export default async function DiscoverPage() {
  const user = await requireUser();
  const { worlds, picks } = await myPicks(user.id);
  return (
    <main className={PAGE}>
      <Picker initialWorlds={worlds} initialPicks={picks} />
    </main>
  );
}
