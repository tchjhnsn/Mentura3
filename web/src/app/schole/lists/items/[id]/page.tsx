import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkIcon } from "lucide-react";
import { itemListById, type ListItem } from "@reflect/core/item-lists";
import { courseSite } from "@reflect/core/courses";
import { mediumOf } from "@reflect/core/ways";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { addFromItemListAction } from "../../../actions";
import { ThingHeader } from "@/components/headers";
import { browseCrumbs } from "../../../crumbs";
import { ICON } from "../../../browse/media";
import { KeepButton } from "../../../keep-mark";

export const metadata: Metadata = { title: "List" };
export const dynamic = "force-dynamic";

/** Where a row opens: the person's own item once kept, a course's page, else the find's page (its verb and Save). */
function pageOf(i: ListItem, mine: string | undefined) {
  const q = (k: string, v: string | undefined) => (v ? `&${k}=${encodeURIComponent(v)}` : "");
  if (mine) return `/schole/items/${mine}`;
  if (i.medium === "course" && courseSite(i.url)) return `/schole/courses?u=${encodeURIComponent(i.url!)}${q("t", i.title)}${q("by", i.by)}`;
  return `/schole/find?m=${i.medium}${q("t", i.title)}${q("by", i.by)}${q("u", i.url)}`;
}

/** A list beyond books, in its order: one filled act to keep what is not kept, each row opening its thing, a bookmark to keep one. */
export default async function ItemListPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = (await params).id;
  const list = itemListById(id);
  if (!list) notFound();
  const kept = new Map((await listItems(user.id).catch(() => [])).map((i) => [`${i.medium}|${i.title.toLowerCase()}`, i.id]));
  const left = list.items.filter((i) => !kept.has(`${i.medium}|${i.title.toLowerCase()}`)).length;
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/lists" crumbs={[...browseCrumbs(), { label: "Lists", href: "/schole/lists" }]} title={list.name} />
      <section className="mt-8 space-y-6">
        <div className="space-y-2">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{list.name}</h1>
          <p className="text-muted-foreground text-[13px]">{list.items.length} {list.items.length === 1 ? "item" : "items"} · {list.source}</p>
          <p className="text-muted-foreground line-clamp-3 max-w-prose text-sm">{list.about}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">{list.items.length - left} of {list.items.length} kept</p>
          {left ? (
            <form action={addFromItemListAction}>
              <input type="hidden" name="list" value={list.id} />
              <Button size="sm">Keep the {left} not kept</Button>
            </form>
          ) : <span className="text-muted-foreground text-sm">You keep every one.</span>}
        </div>
        <ol className="-mx-2">
          {list.items.map((i, n) => {
            const mine = kept.get(`${i.medium}|${i.title.toLowerCase()}`);
            return (
              <li key={i.title} className="group hover:bg-muted/60 flex items-center gap-3 rounded-lg p-2">
                <span className="text-muted-foreground w-6 shrink-0 text-right text-[13px] tabular-nums">{n + 1}</span>
                <Link href={pageOf(i, mine)} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-lg border [&_svg]:size-5">{ICON[i.medium]}</span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[15px] leading-snug font-medium group-hover:underline group-hover:underline-offset-2">{i.title}</span>
                    <span className="text-muted-foreground block truncate text-[13px]">{[i.by, mediumOf(i.medium).label].filter(Boolean).join(" · ")}</span>
                  </span>
                </Link>
                {mine ? (
                  <span role="img" aria-label="On your shelves" title="On your shelves" className="flex size-8 shrink-0 items-center justify-center [&_svg]:size-4"><BookmarkIcon className="fill-current" /></span>
                ) : (
                  <form action={addFromItemListAction} className="shrink-0">
                    <input type="hidden" name="list" value={list.id} />
                    <input type="hidden" name="title" value={i.title} />
                    <KeepButton label={`Keep ${i.title} for later`} />
                  </form>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
