import { episodeDay } from "@reflect/core/podcasts";
import { newEpisodes } from "@reflect/core/podcast-library";
import type { NewCard } from "@/app/schole/podcasts/new-episodes";
import { keptShows } from "./podcast-library";
import { favoritesOf } from "./favorite-store";

/** Episodes of the shows the person keeps, out on or after `since` and not yet begun, as cards with their favorites. */
export async function newEpisodeCards(userId: string, since: string, today: string, opts: { perShow?: number; limit?: number } = {}): Promise<NewCard[]> {
  const fresh = newEpisodes(await keptShows(userId).catch(() => []), since, opts);
  const favs = new Map(await Promise.all([...new Set(fresh.map((e) => e.item))].map(async (id) => [id, await favoritesOf(userId, id)] as const)));
  return fresh.map((e) => ({ ...e, day: episodeDay(e.date, today) ?? e.date, favorite: favs.get(e.item)?.has(e.key) ?? false }));
}
