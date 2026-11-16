/**
 * The editors' canon, which ranks first in discovery (Torian, 2026-11-16 08:24Z, decision card "How should discovery
 * rank books, podcasts and courses?": "Editors' canon, then listens"). A recording is in the canon when Reflect's own
 * pages name it: a work page, a playlist, a topic's forms, or an idea or term. Listen counts order the rest and break
 * ties inside the canon. Nobody's clicks move a thing into it.
 */
import { COLLECTIONS, type CollectionItem } from "./collections";
import { TERMS } from "./great-ideas";
import { TOPIC_PAGES, WORKS, formItems } from "./topic-pages";

let audiobookIds: ReadonlySet<string> | null = null;

const audiobooksIn = (items: readonly CollectionItem[]): string[] => items.flatMap((i) => (i.kind === "audiobook" ? [i.id] : []));

/** LibriVox ids Reflect's pages name, read once. */
export function canonAudiobooks(): ReadonlySet<string> {
  audiobookIds ??= new Set([
    ...WORKS.flatMap((w) => w.audiobooks),
    ...COLLECTIONS.flatMap((c) => audiobooksIn(c.items)),
    ...TOPIC_PAGES.flatMap((t) => audiobooksIn(t.forms.flatMap(formItems))),
    ...TERMS.flatMap((t) => [...audiobooksIn(t.listen), ...t.stories.flatMap((s) => (s.audiobook ? [s.audiobook] : []))]),
  ]);
  return audiobookIds;
}
