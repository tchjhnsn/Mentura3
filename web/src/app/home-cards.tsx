"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { checkCardItem, removeCardFromHome } from "./home-card-actions";
import { useDashToast } from "./dashboard/instant";

/** One Home card as the page hands it over: its words already worked out for today. */
export type CardView = {
  id: string;
  title: string;
  tile: string;
  href: string | null;
  kind: "word" | "checklist" | "figure" | "streak";
  /** A word card's word, meaning, example and source; a figure's value and label; a streak's count. */
  lines: string[];
  items: { text: string; done: boolean }[];
  /** A streak card: whether today is marked. */
  marked: boolean;
};

function Card({ c: given }: { c: CardView }) {
  const [busy, start] = useTransition();
  const toast = useDashToast();
  // A tap shows at once (useOptimistic) while it is kept; the page's fresh card replaces it after.
  const [c, tick] = useOptimistic(given, (s, item: number | null) =>
    item === null ? { ...s, marked: !s.marked } : { ...s, items: s.items.map((it, i) => (i === item ? { ...it, done: !it.done } : it)) });
  const [gone, setGone] = useOptimistic(false, (_s, v: boolean) => v);
  const check = (item: number | null) => start(async () => { tick(item); await checkCardItem(c.id, item); });
  const remove = () => start(async () => {
    setGone(true);
    const changeId = await removeCardFromHome(c.id);
    toast({ ok: true, text: `Removed ${c.title} from Home`, changeId });
  });
  if (gone) return null;
  return (
    <li className="bg-card relative grid min-w-0 content-start gap-1.5 rounded-xl border p-4 pr-10">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 size-7" aria-label={`Remove ${c.title} from Home`} title="Remove" disabled={busy} onClick={remove}>
        <XIcon />
      </Button>
      {c.href ? <Link href={c.href} className="text-muted-foreground truncate text-sm font-medium hover:underline">{c.title} · {c.tile}</Link> : <span className="text-muted-foreground truncate text-sm font-medium">{c.title} · {c.tile}</span>}
      {c.kind === "checklist" ? (
        <ul className="grid gap-1">
          {c.items.map((it, i) => (
            <li key={i}>
              <button type="button" disabled={busy} onClick={() => check(i)} aria-pressed={it.done} className="hover:bg-accent flex w-full min-w-0 items-start gap-2 rounded-md px-1 py-0.5 text-left text-sm">
                <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border", it.done && "bg-primary text-primary-foreground border-primary")}>{it.done ? <CheckIcon className="size-3" /> : null}</span>
                <span className={cn("min-w-0 break-words", it.done && "text-muted-foreground line-through")}>{it.text}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {c.lines[0] ? <span className="text-lg leading-snug font-semibold break-words">{c.lines[0]}</span> : null}
          {c.lines.slice(1).map((l, i) => <span key={i} className="text-muted-foreground text-sm break-words">{l}</span>)}
          {c.kind === "streak" ? (
            <button type="button" disabled={busy} onClick={() => check(null)} aria-pressed={c.marked} className="hover:bg-accent flex w-fit items-center gap-2 rounded-md px-1 py-0.5 text-sm">
              <span className={cn("grid size-4 place-items-center rounded border", c.marked && "bg-primary text-primary-foreground border-primary")}>{c.marked ? <CheckIcon className="size-3" /> : null}</span>
              Today
            </button>
          ) : null}
        </>
      )}
    </li>
  );
}

/** Today's Home cards, in a strip above the tiles: one column on a phone, three side by side from small screens up. */
export function HomeCards({ cards }: { cards: CardView[] }) {
  if (!cards.length) return null;
  return (
    <section aria-label="Cards for today" className="mt-6">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => <Card key={c.id} c={c} />)}
      </ul>
    </section>
  );
}
