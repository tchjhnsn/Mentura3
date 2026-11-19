// New debates from the approved channels' public YouTube feeds, read at most once an hour. Nothing here calls a model.
import { DEBATE_CHANNELS, feedUrl, newestDebates, readChannelFeed } from "@reflect/core/debate-channels";
import type { CollectionItem } from "@reflect/core/collections";
import { outsideFetch } from "@/server/outside";

export async function newDebates(now = new Date()): Promise<CollectionItem[]> {
  const feeds = await Promise.all(DEBATE_CHANNELS.map(async (c) => {
    try {
      const r = await outsideFetch({ timeoutMs: 6000 })(feedUrl(c), { next: { revalidate: 3600 } });
      return readChannelFeed(r.ok ? await r.text() : null, c);
    } catch {
      return [];
    }
  }));
  return newestDebates(feeds, now);
}
