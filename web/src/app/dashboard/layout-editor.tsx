"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon, GripVerticalIcon, RectangleHorizontalIcon, Settings2Icon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CardSize } from "./urgency";
import { saveLayoutAction } from "./actions";
import { useDashToast } from "./instant";
import { moveTo } from "./urgency";

// Edit dashboard: move (drag the handle, or arrow keys on it), hide and resize cards, kept per person when Done is
// tapped. The page hands over every card, hidden ones without their content; a card brought back from the tray shows
// once saved. Also the live refresh: every 60 seconds while the tab is visible and nothing is being edited.

export type GridCard = { id: string; title: string; node: ReactNode };
type Start = { order: string[]; ranked: string[]; hidden: string[]; size: Record<string, CardSize>; lead: string | null; custom: boolean };

type Editor = {
  editing: boolean;
  start: () => void;
  done: () => void;
  byUrgency: () => void;
  custom: boolean;
  busy: boolean;
  grid: () => ReactNode;
};
const EditorContext = createContext<Editor | null>(null);

const REFRESH_MS = 60_000;

export function LayoutEditor({ cards, initial, children }: { cards: GridCard[]; initial: Start; children: ReactNode }) {
  const router = useRouter();
  const toast = useDashToast();
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState(initial.order);
  const [hidden, setHidden] = useState(initial.hidden);
  const [size, setSize] = useState(initial.size);
  const [custom, setCustom] = useState(initial.custom);
  const [dragging, setDragging] = useState<string | null>(null);
  const [busy, startSave] = useTransition();

  // A fresh layout from the server (after a save or a refresh) replaces the local one while not editing.
  const key = JSON.stringify(initial);
  const [seen, setSeen] = useState(key);
  if (key !== seen && !editing) {
    setSeen(key);
    setOrder(initial.order);
    setHidden(initial.hidden);
    setSize(initial.size);
    setCustom(initial.custom);
  }

  // Live updates: a new message or request shows within a minute without a reload.
  const last = useRef(0);
  useEffect(() => {
    last.current = Date.now();
    const tick = () => {
      if (editing || document.visibilityState !== "visible" || Date.now() - last.current < REFRESH_MS - 1000) return;
      last.current = Date.now();
      router.refresh();
    };
    const timer = setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [editing, router]);

  const byId = new Map(cards.map((c) => [c.id, c]));
  const move = (id: string, over: string) => { setOrder((o) => moveTo(o, id, over)); setCustom(true); };
  const step = (id: string, by: -1 | 1) => {
    const i = order.indexOf(id);
    const over = order[i + by];
    if (over) move(id, over);
  };
  const hide = (id: string) => { setHidden((h) => [...h, id]); setOrder((o) => o.filter((x) => x !== id)); };
  const show = (id: string) => { setHidden((h) => h.filter((x) => x !== id)); setOrder((o) => [...o, id]); };

  const editor: Omit<Editor, "grid"> = {
    editing,
    busy,
    custom,
    start: () => setEditing(true),
    byUrgency: () => { setCustom(false); setOrder(initial.ranked.filter((id) => !hidden.includes(id))); },
    done: () => startSave(async () => {
      const r = await saveLayoutAction({ order: custom ? order : [], hidden, size });
      if (!r.ok) toast(r);
      setEditing(false);
    }),
  };

  const onDown = (id: string) => (e: PointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(id); };
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-dash-card]")?.getAttribute("data-dash-card");
    if (over && over !== dragging) move(dragging, over);
  };
  const onKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); step(id, -1); }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); step(id, 1); }
  };

  const grid = () => (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-flow-row-dense lg:grid-cols-2">
      {editing && hidden.length ? (
        <section aria-label="Hidden cards" className="bg-muted/50 grid min-w-0 gap-2 rounded-2xl p-4 lg:col-span-2">
          <h2 className="text-muted-foreground text-sm font-medium">Hidden cards</h2>
          <ul className="flex flex-wrap gap-2">
            {hidden.map((id) => (
              <li key={id}><Button variant="outline" size="sm" className="rounded-full" onClick={() => show(id)}><EyeIcon />{byId.get(id)?.title ?? id}</Button></li>
            ))}
          </ul>
        </section>
      ) : null}
      {order.map((id) => {
        const c = byId.get(id);
        if (!c) return null;
        const wide = size[id] === "wide";
        return (
          <div
            key={id}
            data-dash-card={id}
            className={cn(
              "relative min-w-0",
              wide && "lg:col-span-2",
              // The most urgent card leads on a phone, right after the ask bar, whatever the order.
              id === initial.lead && !editing && "max-lg:order-first",
              !editing && "has-[>[data-body]:empty]:hidden",
              editing && "rounded-2xl border border-dashed p-3 pt-12",
              dragging === id && "border-primary bg-accent/40",
            )}
          >
            {editing ? (
              <div className="absolute inset-x-2 top-2 flex items-center gap-1">
                <button type="button" aria-label={`Move ${c.title}`} title="Drag to move, or use the arrow keys" onPointerDown={onDown(id)} onPointerMove={onMove} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)} onKeyDown={onKey(id)}
                  className="hover:bg-accent focus-visible:ring-ring/50 grid size-8 cursor-grab touch-none place-items-center rounded-md outline-none focus-visible:ring-[3px] active:cursor-grabbing">
                  <GripVerticalIcon className="size-4" />
                </button>
                <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs font-medium">{c.title}</span>
                <Button variant="ghost" size="icon" className="size-8 max-lg:hidden" aria-label={wide ? `Make ${c.title} normal` : `Make ${c.title} wide`} title={wide ? "Normal" : "Wide"} onClick={() => setSize((s) => ({ ...s, [id]: wide ? "normal" : "wide" }))}>
                  {wide ? <SquareIcon /> : <RectangleHorizontalIcon />}
                </Button>
                <Button variant="ghost" size="icon" className="size-8" aria-label={`Hide ${c.title}`} title="Hide" onClick={() => hide(id)}><EyeOffIcon /></Button>
              </div>
            ) : null}
            <div data-body="" inert={editing || undefined} className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)]", editing && "pointer-events-none opacity-60 select-none")}>
              {c.node ?? (editing ? <p className="text-muted-foreground text-sm">Shows when you tap Done.</p> : null)}
            </div>
          </div>
        );
      })}
    </div>
  );

  return <EditorContext.Provider value={{ ...editor, grid }}>{children}</EditorContext.Provider>;
}

/** The cards, in the order and sizes being shown or edited. */
export function DashGrid() {
  return useContext(EditorContext)?.grid() ?? null;
}

/** The header's Edit dashboard button; while editing, Order by urgency (when the order is the person's) and Done. */
export function EditButton() {
  const e = useContext(EditorContext);
  if (!e) return null;
  if (!e.editing) {
    return <Button variant="ghost" size="icon" className="ml-auto" aria-label="Edit dashboard" title="Edit dashboard" onClick={e.start}><Settings2Icon /></Button>;
  }
  return (
    <div className="ml-auto flex items-center gap-1">
      {e.custom ? <Button variant="ghost" size="sm" onClick={e.byUrgency} disabled={e.busy}>Order by urgency</Button> : null}
      <Button variant="secondary" size="sm" onClick={e.done} disabled={e.busy}>Done</Button>
    </div>
  );
}
