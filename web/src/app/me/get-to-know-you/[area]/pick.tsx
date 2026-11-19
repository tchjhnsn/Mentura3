"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { AREAS, MIN_PICKS, becauseOf, related, type CatalogItem } from "@reflect/core/interest-catalogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Cover } from "../../cover";
import { pickAction, setAreaAction } from "../../actions";

type Area = (typeof AREAS)[number];

/** The tile grid, the search, and the pinned row that fills as the person taps. */
export function Pick({ area, items, initial }: { area: Area; items: CatalogItem[]; initial: string[] }) {
  const router = useRouter();
  const [picks, setPicks] = useState<string[]>(initial);
  // Related things moved in beside a tapped tile, by the tile they came from; they slide in once, on that tap.
  const [beside, setBeside] = useState<Record<string, string[]>>({});
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [, start] = useTransition();
  const [leaving, setLeaving] = useState(false);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // Grid order: catalogue order, with each tapped tile's related things right after it.
  const order = useMemo(() => {
    const moved = new Set(Object.values(beside).flat());
    const out: CatalogItem[] = [];
    for (const it of items) {
      if (moved.has(it.id)) continue;
      out.push(it);
      for (const r of beside[it.id] ?? []) { const x = byId.get(r); if (x) out.push(x); }
    }
    const t = q.trim().toLowerCase();
    return t ? out.filter((i) => i.title.toLowerCase().includes(t) || i.by.toLowerCase().includes(t) || i.tags.some((g) => g.includes(t))) : out;
  }, [items, beside, byId, q]);

  const toggle = (it: CatalogItem) => {
    const on = !picks.includes(it.id);
    setPicks((p) => (on ? [...p, it.id] : p.filter((x) => x !== it.id)));
    if (on && !beside[it.id]) {
      const shown = new Set([...picks, it.id, ...Object.values(beside).flat(), ...Object.keys(beside)]);
      const next = related(it.id, 3, shown).map((r) => r.id);
      if (next.length) { setBeside((b) => ({ ...b, [it.id]: next })); setFresh(new Set(next)); }
    }
    start(() => pickAction(it.id, on));
  };

  const done = picks.length >= MIN_PICKS;
  const left = MIN_PICKS - picks.length;
  const leave = (as: "done" | "skipped") => {
    setLeaving(true);
    start(async () => { await setAreaAction({ area: area.id, as }); router.push("/dashboard"); });
  };
  const preview = done ? becauseOf(picks, 3) : [];

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl grid-cols-[minmax(0,1fr)] content-start gap-5 px-4 pt-4 pb-56 sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => leave("skipped")} disabled={leaving} className="text-muted-foreground hover:text-foreground text-sm">Skip {area.label.toLowerCase()}</button>
        <span className="flex-1" />
        <label className="relative w-44 sm:w-64">
          <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${area.label.toLowerCase()}`} aria-label={`Search ${area.label.toLowerCase()}`} className="h-9 pl-8" />
        </label>
      </div>

      <header className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{area.pick}</h1>
        <p className="text-muted-foreground text-[15px]">{area.promise}</p>
      </header>

      <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
        {order.map((it) => {
          const on = picks.includes(it.id);
          return (
            <li key={it.id} className={cn(fresh.has(it.id) && "animate-in fade-in slide-in-from-left-3 duration-250")}>
              <button type="button" aria-pressed={on} onClick={() => toggle(it)} className="group grid w-full gap-1.5 text-left">
                <span className="relative block">
                  <Cover src={it.image} name={it.title} round={area.id === "music"} className={cn("aspect-square w-full transition-[box-shadow,opacity]", on ? "ring-primary ring-3 ring-offset-2 ring-offset-background" : "group-hover:opacity-90")} />
                  {on ? <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full shadow"><Check className="size-4" /></span> : null}
                </span>
                <span className="line-clamp-2 text-sm leading-tight font-medium">{it.title}</span>
                {it.by ? <span className="text-muted-foreground -mt-1 line-clamp-1 text-xs">{it.by}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {order.length === 0 ? <p className="text-muted-foreground text-sm">Nothing here by that name yet.</p> : null}

      <footer className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur">
        <div className="mx-auto grid max-w-5xl gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{area.row}</span>
            <span className="text-muted-foreground text-sm tabular-nums">{Math.min(picks.length, MIN_PICKS)} of {MIN_PICKS}{picks.length > MIN_PICKS ? ` (+${picks.length - MIN_PICKS})` : ""}</span>
            <span className="flex-1" />
            <Button variant={done ? "default" : "outline"} disabled={!done || leaving} onClick={() => leave("done")}>
              {done ? "Done" : `Pick ${left} more`}
            </Button>
          </div>
          <div className="flex min-h-14 gap-2 overflow-x-auto">
            {picks.length === 0 ? <span className="text-muted-foreground self-center text-sm">Tap what you love. It lands here.</span> : null}
            {picks.map((id) => {
              const it = byId.get(id);
              return it ? (
                <Link key={id} href={`/me/interests/${id}`} className="animate-in fade-in zoom-in-90 shrink-0 duration-200" title={it.title}>
                  <Cover src={it.image} name={it.title} round={area.id === "music"} className="size-14" />
                </Link>
              ) : null;
            })}
          </div>
          {preview.length ? (
            <div className="animate-in fade-in grid gap-1.5 duration-250">
              <span className="text-muted-foreground text-xs">Coming to your dashboard</span>
              <div className="flex gap-3 overflow-x-auto">
                {preview.map(({ item, because }) => (
                  <div key={item.id} className="flex w-56 shrink-0 items-center gap-2">
                    <Cover src={item.image} name={item.title} round={area.id === "music"} className="size-10" />
                    <span className="grid min-w-0">
                      <span className="truncate text-sm font-medium">{item.title}</span>
                      <span className="text-muted-foreground truncate text-xs">Because you picked {because.title}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </footer>
    </main>
  );
}
