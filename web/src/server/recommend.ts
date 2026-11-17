import { canonAudiobooks } from "@reflect/core/canon";
import type { Signals } from "@reflect/core/recommend";
import { admiredOf } from "./admired";
import { aimsOf, haveKeys } from "./collections";
import { followed } from "./people";
import { reactionsOf } from "./reaction-store";
import { listItems } from "./ways-store";

/**
 * Everything the ranker reads about a person (doc "Scholē subjects by ICP and recommendations"): what they want in
 * Work, the people and traits they chose, whom they follow, what they keep and finished, and what they like and
 * dislike. Each part reads as empty when its store is not there yet.
 */
export async function signalsOf(userId: string): Promise<Signals> {
  const [aims, admired, follows, items, reactions] = await Promise.all([
    aimsOf(userId), admiredOf(userId), followed(userId), listItems(userId).catch(() => []), reactionsOf(userId),
  ]);
  return {
    aims,
    admired: admired.map(({ exemplar, traits }) => ({ exemplar, traits })),
    follows: follows.map((f) => f.name),
    kept: haveKeys(items.filter((i) => i.status !== "done")),
    finished: haveKeys(items.filter((i) => i.status === "done")),
    liked: reactions.liked,
    disliked: reactions.disliked,
    canon: canonAudiobooks(),
  };
}
