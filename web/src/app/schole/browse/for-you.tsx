import Link from "next/link";
import { COLLECTIONS, itemHref, itemKey, nextInCollection, suggestCollections, type CollectionItem } from "@reflect/core/collections";
import { SectionHead } from "@/components/section-head";
import { aimsOf, artOf, haveKeys } from "@/server/collections";
import { listItems } from "@/server/ways-store";
import { Art } from "../art";
import { CollectionCard, Fan } from "../playlists/card";
import { formItems, TOPIC_PAGES } from "@reflect/core/topic-pages";
import { ROW_LINE } from "../row-line";

type Pick = { item: CollectionItem; reason: string };

/**
 * Browse's first rows (guide "Home, browse and library", points 6 and 7). For you: the next thing in each collection
 * the person began, then things from the collections serving what they want in Work, each saying why; nothing is
 * ranked by what strangers clicked, and with no reason to give the row is not drawn. Then every collection chosen by
 * people, those serving the person's aims first.
 */
export async function ForYouRows({ userId }: { userId: string }) {
  const [items, aims] = await Promise.all([listItems(userId).catch(() => []), aimsOf(userId)]);
  const have = haveKeys(items);
  const picks: Pick[] = [];
  const seen = new Set<string>();
  const add = (item: CollectionItem, reason: string) => { if (!seen.has(itemKey(item)) && !have.has(itemKey(item))) { seen.add(itemKey(item)); picks.push({ item, reason }); } };
  for (const c of COLLECTIONS) if (c.items.some((i) => have.has(itemKey(i)))) { const n = nextInCollection(c, have); if (n) add(n, `Next in ${c.name}`); }
  const suggested = suggestCollections(aims);
  for (const s of suggested) if (s.reason) for (const i of s.collection.items) add(i, s.reason);
  return (
    <div className="space-y-8">
      {picks.length ? (
        <section className="space-y-4">
          <SectionHead title="For you" className="pt-2" />
          <ul className={ROW_LINE}>
            {picks.slice(0, 12).map(({ item, reason }) => {
              const a = artOf(item);
              return (
                <li key={itemKey(item)}>
                  <Link href={itemHref(item)} className="group block space-y-1.5">
                    <Art image={a.image} kind={a.kind} title={item.title} className="aspect-square w-full transition-opacity group-hover:opacity-90" />
                    <span className="line-clamp-2 text-sm leading-tight font-medium group-hover:underline">{item.title}</span>
                    <span className="text-muted-foreground line-clamp-2 block text-xs">{reason}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <section className="space-y-4">
        <SectionHead title="Topics" note="Wide places to discover, each with playlists through it." className="pt-2" />
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [&>li]:w-60 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[calc((100%-2.5rem)/3)] lg:[&>li]:w-[calc((100%-3.75rem)/4)]">
          {TOPIC_PAGES.map((t) => (
            <li key={t.id}>
              <Link href={`/schole/topics/${t.id}`} className="group block space-y-2">
                <Fan items={t.forms.flatMap(formItems).filter((i) => i.kind !== "course").slice(0, 4)} />
                <span className="block leading-snug font-semibold group-hover:underline group-hover:underline-offset-2">{t.name}</span>
                <span className="text-muted-foreground line-clamp-2 block text-[13px]">{t.forms.map((f) => f.label).join(", ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-4">
        <SectionHead title="Playlists" href="/schole/playlists" note="Chosen by people, each saying who chose it." className="pt-2" />
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [&>li]:w-60 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[calc((100%-2.5rem)/3)] lg:[&>li]:w-[calc((100%-3.75rem)/4)]">
          {suggested.map(({ collection, reason }) => <li key={collection.id}><CollectionCard c={collection} reason={reason} /></li>)}
        </ul>
      </section>
    </div>
  );
}
