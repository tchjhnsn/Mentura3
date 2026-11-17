"use client";

import { useOptimistic, useTransition } from "react";
import { CheckIcon } from "lucide-react";
import { BACKGROUNDS, MODES, THEMES, seasonalTheme, swatchOf, themeOf, themeVars, type Look } from "@/lib/themes";
import { setLookAction } from "@/app/settings/appearance/actions";
import { cn } from "@/lib/utils";

/** Paints a look on the page at once, before the server's next render confirms it. */
function paint(look: Look, today: string) {
  const el = document.documentElement;
  const t = themeOf(look.theme, today);
  for (const [k, v] of Object.entries(themeVars(t))) el.style.setProperty(k, v);
  el.dataset.theme = t.id; el.dataset.bg = look.bg; el.dataset.mode = look.mode;
  el.classList.toggle("dark", look.mode === "dark" || (look.mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
}

/**
 * Picks the theme, light or dark, and the background. Colors only: nothing on the page moves. Used in Settings and in
 * the menu at the foot of Home.
 */
export function LookPicker({ look, today, compact = false }: { look: Look; today: string; compact?: boolean }) {
  const [now, set] = useOptimistic(look, (l: Look, c: Partial<Look>) => ({ ...l, ...c }));
  const [, start] = useTransition();
  const pick = (part: keyof Look, value: string) => start(async () => {
    const next = { ...now, [part]: value };
    set({ [part]: value });
    paint(next, today);
    await setLookAction(part, value);
  });
  const season = seasonalTheme(today);
  const choices = [{ id: "season", label: `Season (${season.label})`, swatch: swatchOf(season) }, ...THEMES.map((t) => ({ id: t.id, label: t.label, swatch: swatchOf(t) }))];
  const head = cn("font-medium", compact ? "text-xs text-muted-foreground" : "text-sm");
  return (
    <div className={cn("grid", compact ? "gap-4" : "gap-6")}>
      <section className="grid gap-2" aria-label="Theme">
        <h3 className={head}>Theme</h3>
        <ul className={cn("grid gap-2", compact ? "grid-cols-5" : "grid-cols-3 sm:grid-cols-5")}>
          {choices.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => pick("theme", c.id)} aria-pressed={now.theme === c.id} title={c.label}
                className={cn("grid w-full justify-items-center gap-1.5 rounded-lg p-1.5 text-center transition hover:bg-accent", now.theme === c.id && "bg-accent")}>
                <span className={cn("relative grid place-items-center rounded-full ring-offset-2 ring-offset-background", compact ? "size-8" : "size-11", now.theme === c.id && "ring-foreground ring-2")}
                  style={{ background: c.id === "season" ? `conic-gradient(${["thanksgiving", "advent", "winter", "spring", "summer", "autumn"].map((id) => swatchOf(THEMES.find((t) => t.id === id)!)).join(",")})` : c.swatch }}>
                  {now.theme === c.id ? <CheckIcon className="size-4 text-white drop-shadow" /> : null}
                </span>
                <span className={cn("w-full truncate leading-tight", compact ? "text-[0.65rem]" : "text-xs")}>{c.id === "season" ? "Season" : c.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-2" aria-label="Light or dark">
        <h3 className={head}>Light or dark</h3>
        <div className="bg-muted inline-flex w-fit rounded-lg p-1">
          {MODES.map((m) => (
            <button key={m.id} type="button" onClick={() => pick("mode", m.id)} aria-pressed={now.mode === m.id}
              className={cn("rounded-md px-3 py-1 text-sm transition", now.mode === m.id ? "bg-background shadow-xs font-medium" : "text-muted-foreground hover:text-foreground")}>{m.label}</button>
          ))}
        </div>
      </section>

      <section className="grid gap-2" aria-label="Background">
        <h3 className={head}>Background</h3>
        <ul className={cn("grid gap-2", compact ? "grid-cols-4" : "grid-cols-4 sm:grid-cols-8")}>
          {BACKGROUNDS.map((b) => (
            <li key={b.id}>
              <button type="button" onClick={() => pick("bg", b.id)} aria-pressed={now.bg === b.id}
                className={cn("grid w-full gap-1 rounded-lg p-1 text-center transition hover:bg-accent", now.bg === b.id && "bg-accent")}>
                <span data-bg={b.id} className={cn("bg-background bg-swatch relative block overflow-hidden rounded-md border", compact ? "h-10" : "h-14", now.bg === b.id && "ring-foreground ring-2")} />
                <span className={cn(compact ? "text-[0.65rem]" : "text-xs")}>{b.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
