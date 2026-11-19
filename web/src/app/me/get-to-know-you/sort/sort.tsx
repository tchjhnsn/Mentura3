"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COMMITMENT, DEPTH, MODES, SKILL, labelOf, type Commitment, type Depth, type Mode, type Skill } from "@reflect/core/interests";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Cover } from "../../cover";
import { setAreaAction, setInterestAction } from "../../actions";

type Side = { commitment: Commitment | null; skill?: Skill | null; depth?: Depth | null };
export type SortCard = { ref: string; title: string; image: string | null; round: boolean; modes: Mode[]; make: Side; do: Side; know: Side };

/** What landing in a column changes, said on the card (design guide: payoff on every move). */
const PAYOFF: Record<Mode, string> = {
  make: "Make: first projects, makers at work, the tools they use",
  do: "Do: practice plans, technique, people to do it with",
  know: "Know: the history, the people behind it, deeper listening",
};

/** The three columns, the person's picks as cards, and the levels of the card in hand. */
export function Sort({ cards: initial, focus }: { cards: SortCard[]; focus: string | null }) {
  const router = useRouter();
  const [cards, setCards] = useState(initial);
  const [held, setHeld] = useState<string | null>(focus ?? initial[0]?.ref ?? null);
  const [drag, setDrag] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [, start] = useTransition();
  const card = cards.find((c) => c.ref === held) ?? null;

  const patch = (ref: string, f: (c: SortCard) => SortCard, input: Parameters<typeof setInterestAction>[0]) => {
    setCards((cs) => cs.map((c) => (c.ref === ref ? f(c) : c)));
    start(() => setInterestAction(input));
  };
  // Moving a card to a column makes that its only mode; the card in hand can add or drop the others below.
  const moveTo = (ref: string, mode: Mode) => {
    patch(ref, (c) => ({ ...c, modes: [mode] }), { ref, modes: [mode] });
    setHeld(ref); setSaid(PAYOFF[mode]);
  };
  const toggleMode = (c: SortCard, mode: Mode) => {
    const modes = c.modes.includes(mode) ? c.modes.filter((m) => m !== mode) : MODES.map((m) => m.id).filter((m) => m === mode || c.modes.includes(m));
    if (!modes.length) return;
    patch(c.ref, (x) => ({ ...x, modes }), { ref: c.ref, modes });
    if (modes.includes(mode)) setSaid(PAYOFF[mode]);
  };
  const setLevel = (c: SortCard, mode: Mode, key: "commitment" | "skill" | "depth", v: string) => {
    const now = (c[mode] as Record<string, string | null | undefined>)[key];
    const value = now === v ? null : v;
    patch(c.ref, (x) => ({ ...x, [mode]: { ...x[mode], [key]: value } }), { ref: c.ref, [`${mode}_${key}`]: value });
  };
  const finish = () => start(async () => { await setAreaAction({ sorted: true }); router.push("/dashboard"); });

  const levelLine = (c: SortCard, m: Mode) => {
    const s = c[m];
    return [labelOf(COMMITMENT, s.commitment ?? undefined), m === "know" ? labelOf(DEPTH, s.depth ?? undefined) : labelOf(SKILL, s.skill ?? undefined)].filter(Boolean).join(" · ");
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl grid-cols-[minmax(0,1fr)] content-start gap-5 px-4 pt-6 sm:px-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Make, Do, Know</h1>
        <p className="text-muted-foreground text-[15px]">We placed your picks with a first guess. Move what is wrong and your dashboard changes with it.</p>
      </header>

      {cards.length === 0 ? <p className="text-muted-foreground text-sm">Nothing picked yet. Pick a few books or podcasts first.</p> : null}

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {MODES.map((m) => {
          const here = cards.filter((c) => c.modes.includes(m.id));
          return (
            <section
              key={m.id}
              aria-label={m.label}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag) moveTo(drag, m.id); setDrag(null); }}
              onClick={() => { if (held && card && !card.modes.includes(m.id)) moveTo(held, m.id); }}
              className={cn("bg-muted/40 grid min-h-48 content-start gap-2 rounded-xl border p-2 sm:p-3", drag && "border-primary/50 border-dashed")}
            >
              <div className="grid gap-0.5 px-1">
                <h2 className="text-[15px] font-semibold">{m.label}</h2>
                <p className="text-muted-foreground text-xs"><span className="sm:hidden">{(m.line.split(":")[0] ?? m.line).replace("I follow it, study it, appreciate it", "I follow it")}</span><span className="hidden sm:inline">{m.line}</span></p>
              </div>
              {here.map((c) => (
                <button
                  key={c.ref}
                  type="button"
                  draggable
                  onDragStart={() => setDrag(c.ref)}
                  onDragEnd={() => setDrag(null)}
                  onClick={(e) => { e.stopPropagation(); setHeld(c.ref); }}
                  aria-pressed={held === c.ref}
                  className={cn("bg-background grid gap-1.5 rounded-lg border p-1.5 text-left sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-2", held === c.ref && "ring-primary ring-2")}
                >
                  <Cover src={c.image} name={c.title} round={c.round} className="aspect-square w-full sm:size-10" />
                  <span className="grid min-w-0">
                    <span className="line-clamp-2 text-sm leading-tight font-medium sm:line-clamp-1">{c.title}</span>
                    <span className="text-muted-foreground truncate text-xs">{levelLine(c, m.id) || "Set a level"}</span>
                  </span>
                </button>
              ))}
            </section>
          );
        })}
      </div>

      {said ? <p key={said} className="animate-in fade-in text-sm duration-250">{said}</p> : null}

      {card ? (
        <section aria-label={`${card.title} levels`} className="grid gap-5 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <Cover src={card.image} name={card.title} round={card.round} className="size-14" />
            <div className="grid min-w-0 gap-1">
              <h2 className="truncate text-lg font-semibold">{card.title}</h2>
              <div className="flex flex-wrap gap-1.5">
                {MODES.map((m) => (
                  <Chip key={m.id} on={card.modes.includes(m.id)} onClick={() => toggleMode(card, m.id)}>{m.label}</Chip>
                ))}
              </div>
            </div>
          </div>
          {MODES.filter((m) => card.modes.includes(m.id)).map((m) => (
            <div key={m.id} className="grid gap-3">
              <Steps title={`${m.label}: how often`} steps={COMMITMENT} value={card[m.id].commitment} onPick={(v) => setLevel(card, m.id, "commitment", v)} />
              {m.id === "know"
                ? <Steps title="Know: how deep" steps={DEPTH.slice(0, 5)} value={card.know.depth ?? null} onPick={(v) => setLevel(card, "know", "depth", v)} note="Explains it and Teaches it are earned in front of people." />
                : <Steps title={`${m.label}: how skilled`} steps={SKILL} value={card[m.id].skill ?? null} onPick={(v) => setLevel(card, m.id, "skill", v)} />}
            </div>
          ))}
        </section>
      ) : null}

      <footer className="bg-background/95 sticky bottom-0 z-20 -mx-4 mt-4 border-t backdrop-blur sm:-mx-6">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={finish} className="text-muted-foreground hover:text-foreground text-sm">Skip sorting</button>
          <span className="flex-1" />
          <Button onClick={finish}>Done</Button>
        </div>
      </footer>
    </main>
  );
}

function Chip({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" aria-pressed={on} title={title} onClick={onClick} className={cn("rounded-full border px-3 py-1 text-sm", on ? "border-foreground bg-foreground/5 font-medium" : "text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}

function Steps({ title, steps, value, onPick, note }: { title: string; steps: readonly { id: string; label: string; line: string }[]; value: string | null; onPick: (v: string) => void; note?: string }) {
  const at = steps.find((s) => s.id === value);
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {steps.map((s) => <Chip key={s.id} on={value === s.id} title={s.line} onClick={() => onPick(s.id)}>{s.label}</Chip>)}
      </div>
      <span className="text-muted-foreground text-xs">{at ? at.line : note ?? "Tap the one that fits. Tap again to clear it."}</span>
    </div>
  );
}
