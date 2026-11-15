import type { KeptShow } from "@reflect/core/podcast-library";
import { listItems, listUnits } from "./ways-store";
import { showFor } from "./podcasts";

/** Every podcast the person keeps, with its feed (from the feed cache) and their place in each episode. A feed that cannot be read is left out. */
export async function keptShows(userId: string): Promise<KeptShow[]> {
  const items = (await listItems(userId)).filter((i) => i.medium === "podcast" && i.url);
  const all = await Promise.all(items.map(async (i): Promise<KeptShow | null> => {
    const [show, units] = await Promise.all([showFor(i.url).catch(() => null), listUnits(userId, i.id)]);
    return show ? { item: i.id, title: i.title, image: i.image ?? show.image ?? null, episodes: show.episodes, units } : null;
  }));
  return all.filter((s): s is KeptShow => s !== null);
}
