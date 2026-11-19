"use client";

import { useEffect, useOptimistic, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { PaletteIcon } from "lucide-react";
import { LookPicker } from "@/components/look-picker";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { setAppearanceButtonAction } from "@/app/settings/appearance/actions";
import type { Look } from "@/lib/themes";
import { cn } from "@/lib/utils";

/*
 * The Appearance button (Torian, 2026-11-19, "Appearance, Virtu and the site editor: plan"). Turned on in Settings,
 * Appearance, a round button sits bottom right on every page and opens Appearance as a sheet: a bottom sheet on a
 * phone, a panel on the right on a wide screen. On Reflect's own pages it holds the same sections as Settings. On the
 * person's own site a "For me / My site" control comes first: For me is the look on this device, My site is the site's
 * design that visitors see (Virtu's sections, checked and published). On someone else's site it holds only the reading
 * look. It hides while the full-screen player plays (globals.css, .appearance-button) and inside the second pane.
 */

export type SiteScope = "app" | "own" | "other";

let scope: SiteScope = "app";
const listeners = new Set<() => void>();
const setScope = (s: SiteScope) => { scope = s; for (const l of listeners) l(); };
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

/** Marks the page as a site: the person's own or someone else's. Mounted by the site's layout (src/app/p/[key]/layout.tsx). */
export function SiteScopeMark({ own }: { own: boolean }) {
  useEffect(() => {
    setScope(own ? "own" : "other");
    return () => setScope("app");
  }, [own]);
  return null;
}

function useWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = matchMedia("(min-width: 640px)");
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

/** The button and its sheet. `site` is the Appearance slot, drawn on the server (src/components/slots.tsx). */
export function AppearanceButton({ look, today, site }: { look: Look; today: string; site: ReactNode }) {
  const where = useSyncExternalStore(subscribe, () => scope, () => "app" as SiteScope);
  const wide = useWide();
  const [open, setOpen] = useState(false);
  const [forWhom, setForWhom] = useState<"me" | "site">("site");
  const [, start] = useTransition();
  useEffect(() => setForWhom("site"), [where]);
  const hide = () => start(async () => {
    setOpen(false);
    await setAppearanceButtonAction(false);
  });
  const mine = <LookPicker look={look} today={today} compact />;
  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger className="appearance-button bg-background text-foreground hover:bg-accent fixed right-4 bottom-4 z-40 grid size-12 place-items-center rounded-full border shadow-lg transition" aria-label="Appearance">
        <PaletteIcon className="size-5" />
      </SheetTrigger>
      <SheetContent side={wide ? "right" : "bottom"} overlay={false} onInteractOutside={(e) => e.preventDefault()}
        className={cn("gap-0 overflow-y-auto", wide ? "w-full sm:max-w-sm" : "max-h-[75svh] rounded-t-2xl")}>
        {wide ? null : <span aria-hidden className="bg-muted mx-auto mt-2 h-1 w-10 rounded-full" />}
        <SheetHeader className="pb-2">
          <SheetTitle>Appearance</SheetTitle>
          <SheetDescription className="sr-only">How Reflect and your site look</SheetDescription>
        </SheetHeader>
        <div className="grid gap-5 px-4 pb-4">
          {where === "own" ? (
            <div className="bg-muted text-muted-foreground grid h-9 grid-cols-2 items-center rounded-lg p-[3px]" role="group" aria-label="Who the change is for">
              {([["me", "For me"], ["site", "My site"]] as const).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={forWhom === id} onClick={() => setForWhom(id)}
                  className={cn("h-full rounded-md text-sm font-medium transition", forWhom === id ? "bg-background text-foreground shadow-sm" : "hover:text-foreground")}>{label}</button>
              ))}
            </div>
          ) : null}
          {where === "own" ? (
            <>
              <div hidden={forWhom !== "me"}>{mine}</div>
              <div hidden={forWhom !== "site"}>{site}</div>
            </>
          ) : where === "other" ? mine : (
            <>
              {mine}
              {site}
            </>
          )}
        </div>
        <div className="text-muted-foreground mt-auto flex items-center justify-between gap-4 border-t px-4 py-3 text-sm">
          <Link href="/marketplace?tab=plugins" onClick={() => setOpen(false)} className="hover:text-foreground underline-offset-4 hover:underline">More from the Marketplace</Link>
          <button type="button" onClick={hide} className="hover:text-foreground underline-offset-4 hover:underline">Hide this button</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Settings, Appearance: the switch for the Appearance button on this device. */
export function AppearanceButtonSwitch({ on }: { on: boolean }) {
  const [now, set] = useOptimistic(on);
  const [, start] = useTransition();
  const flip = (v: boolean) => start(async () => {
    set(v);
    await setAppearanceButtonAction(v);
  });
  return (
    <div className="grid gap-2">
      <label className="bg-card flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3">
        <PaletteIcon className="text-muted-foreground size-5 shrink-0" />
        <span className="grid min-w-0 flex-1">
          <span>Show the Appearance button</span>
          <span className="text-muted-foreground text-sm">A round button on every page that opens these settings</span>
        </span>
        <Switch checked={now} onCheckedChange={flip} aria-label="Show the Appearance button" />
      </label>
      <p className="text-muted-foreground px-4 text-sm">Kept on this device.</p>
    </div>
  );
}
