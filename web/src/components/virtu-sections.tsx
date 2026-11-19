"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { fetchTransport, type VirtuEditorEdit, type VirtuEditorLookChoice, type VirtuEditorState, type VirtuEditorToken } from "@reflect/virtu/editor-ui";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/*
 * Virtu's sections in Appearance (Torian, 2026-11-19, "Appearance, Virtu and the site editor: plan"): Shape, Type,
 * Colour and Looks, each a group a host draws on its own, all editing the person's site design. They hold no design
 * logic: every change goes to the Virtu editor's endpoint (POST /api/site/design, protocol virtu-editor/1), where
 * Virtu's engine previews it and checks it (src/server/site-design.ts), and Publish saves only a design that passes,
 * as the Customize panel did. The panel's own transport and types come from packages/virtu/src/editor-ui.ts.
 *
 * While the sections are drawn, the design being edited is painted on the page: on the person's own site, in place of
 * the saved one; elsewhere, on the sample of their site at the top.
 */

type Virtu = {
  state: VirtuEditorState | null;
  error: string | null;
  look: VirtuEditorLookChoice | null;
  value: (path: string) => { value: unknown; css: string | null } | null;
  setEdit: (path: string, value: unknown) => void;
  setLook: (change: Partial<VirtuEditorLookChoice>) => void;
  changed: boolean;
};

const VirtuContext = createContext<Virtu | null>(null);

/**
 * Set by a host whose screen already has its own filled button (the site editor's Publish): Virtu's Publish is then
 * an outline button, so the screen keeps one filled button.
 */
export const VirtuInlinePublish = createContext(false);

function useVirtu(): Virtu {
  const v = useContext(VirtuContext);
  if (!v) throw new Error("Virtu's sections need VirtuDesign around them.");
  return v;
}

const OPEN_KEY = "reflect:appearance-open";

/** The group that was open last on this device, so it opens again. */
function useLastOpen(): [string | null, (id: string | null) => void] {
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    try { setOpen(window.localStorage.getItem(OPEN_KEY)); } catch { /* storage blocked: all collapsed */ }
  }, []);
  return [open, (id) => {
    setOpen(id);
    try { if (id) window.localStorage.setItem(OPEN_KEY, id); else window.localStorage.removeItem(OPEN_KEY); } catch { /* storage blocked */ }
  }];
}

const OpenContext = createContext<[string | null, (id: string | null) => void]>([null, () => undefined]);

/**
 * Holds the design being edited for the sections inside it, and paints it on the page. Ends with the check's verdict and
 * Publish, the one filled button.
 */
export function VirtuDesign({ children, endpoint = "/api/site/design" }: { children: ReactNode; endpoint?: string }) {
  const router = useRouter();
  const transport = useRef(fetchTransport(endpoint)).current;
  const [state, setState] = useState<VirtuEditorState | null>(null);
  const [edits, setEdits] = useState<VirtuEditorEdit[]>([]);
  const [look, setLookState] = useState<VirtuEditorLookChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const open = useLastOpen();
  const asked = useRef(0);
  const inline = useContext(VirtuInlinePublish);

  // Ask Virtu for the state of the saved design plus the changes, a moment after the last change.
  useEffect(() => {
    const n = ++asked.current;
    const t = window.setTimeout(async () => {
      try {
        const next = look === null ? await transport.state(edits) : await transport.state(edits, look);
        if (n === asked.current) { setState(next); setError(null); }
      } catch (e) {
        if (n === asked.current) setError(e instanceof Error ? e.message : "Virtu could not be reached.");
      }
    }, state ? 150 : 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits, look, transport]);

  // Paint the design being edited. The saved one (style[data-site-design], on the person's own site) is switched off
  // meanwhile, and the season the look draws is set on <html>; both come back when the sections go.
  useEffect(() => {
    const css = [state?.css ?? "", state?.looks?.css ?? ""].filter(Boolean).join("\n");
    if (!css) return;
    const style = document.createElement("style");
    style.setAttribute("data-appearance-preview", "");
    style.textContent = css;
    document.head.appendChild(style);
    const saved = [...document.querySelectorAll<HTMLStyleElement>("style[data-site-design]")];
    for (const s of saved) s.media = "not all";
    const html = document.documentElement;
    const season = html.dataset.virtuSeason;
    if (look !== null) {
      const today = look.season ? (state?.looks?.today ?? null) : null;
      if (today) html.dataset.virtuSeason = today; else delete html.dataset.virtuSeason;
    }
    return () => {
      style.remove();
      for (const s of saved) s.media = "";
      if (season === undefined) delete html.dataset.virtuSeason; else html.dataset.virtuSeason = season;
    };
  }, [state, look]);

  const value = useCallback((path: string) => state?.tokens.find((t) => t.path === path)?.values[""] ?? null, [state]);
  const setEdit = useCallback((path: string, v: unknown) => {
    setNote(null);
    setEdits((old) => [...old.filter((e) => e.token !== path), { token: path, context: null, value: v }]);
  }, []);
  const setLook = useCallback((change: Partial<VirtuEditorLookChoice>) => {
    setNote(null);
    setLookState((old) => {
      const cur = old ?? state?.looks?.choice ?? { shape: null, ornaments: {}, season: null };
      return { shape: cur.shape, ornaments: { ...cur.ornaments }, season: cur.season, ...change };
    });
  }, [state]);
  const changed = edits.length > 0 || look !== null;
  const why = whyNot(state);
  const canPublish = changed && !busy && state !== null && why === null;

  async function publish() {
    if (!canPublish) return;
    setBusy(true);
    try {
      const r = look === null ? await transport.publish(edits) : await transport.publish(edits, look);
      setState(r);
      if (r.saved) {
        setEdits([]);
        setLookState(null);
        setNote("Published to your site.");
        router.refresh();
      } else setNote(r.why ?? "Not published.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Not published.");
    }
    setBusy(false);
  }

  function discard() {
    setEdits([]);
    setLookState(null);
    setNote(null);
  }

  return (
    <VirtuContext.Provider value={{ state, error, look, value, setEdit, setLook, changed }}>
      <OpenContext.Provider value={open}>
        <div className="grid gap-3" data-virtu-sections="">
          <SiteSample />
          {error && !state ? <p className="text-muted-foreground px-1 text-sm">{error}</p> : null}
          <div className="bg-card divide-y overflow-hidden rounded-xl border">{children}</div>
          <div className="flex min-h-9 flex-wrap items-center gap-2 px-4">
            <p className={cn("min-w-0 flex-1 text-sm", why && changed ? "text-destructive" : "text-muted-foreground")} role="status" aria-live="polite">
              {note ?? (state === null ? "Checking…" : why && changed ? why : changed ? "Checked by Virtu. Publish to show it to visitors." : "Your site's design. Every change is checked by Virtu.")}
            </p>
            {changed ? <Button variant="ghost" size="sm" onClick={discard} disabled={busy}>Discard</Button> : null}
            {changed ? <Button size="sm" variant={inline ? "outline" : "default"} onClick={publish} disabled={!canPublish}>{busy ? "Publishing…" : "Publish"}</Button> : null}
          </div>
        </div>
      </OpenContext.Provider>
    </VirtuContext.Provider>
  );
}

/** Why the design can't be published, in one line, or null when it can. */
export function whyNot(state: Pick<VirtuEditorState, "verdict" | "findings" | "refused" | "looks"> | null): string | null {
  if (!state) return null;
  if (state.refused.length > 0) return `Not applied: ${state.refused[0]!.why}`;
  if ((state.looks?.refused.length ?? 0) > 0) return `Not in the catalog: ${state.looks!.refused[0]}`;
  if (state.verdict === "fail") return state.findings.find((f) => f.severity === "error")?.message ?? "Virtu's check fails.";
  return null;
}

/** A small sample of the person's site in the design being edited, where the page itself is not their site. */
function SiteSample() {
  const { state } = useVirtu();
  const [onSite, setOnSite] = useState(true);
  useEffect(() => setOnSite(document.querySelector("style[data-site-design]") !== null || document.querySelector(".site-design:not([data-sample])") !== null), []);
  if (onSite || !state) return null;
  return (
    <div data-sample="" className="site-design virtu-slot-card virtu-shape-card virtu-edge !min-h-0 overflow-hidden rounded-xl border p-4" aria-label="Your site in this design">
      <h3 className="text-lg">Your site</h3>
      <p className="text-sm">A line of writing, with <a href="#" onClick={(e) => e.preventDefault()}>a link</a> in it.</p>
      <p className="text-muted-foreground mt-1 text-xs">Muted text</p>
      <span className="bg-primary text-primary-foreground virtu-shape-control mt-3 inline-block rounded-md px-3 py-1 text-xs">Subscribe</span>
    </div>
  );
}

/** One collapsible group, its name in semibold. */
function Group({ id, title, value, children }: { id: string; title: string; value?: string | null; children: ReactNode }) {
  const [open, setOpen] = useContext(OpenContext);
  return (
    <Collapsible open={open === id} onOpenChange={(o) => setOpen(o ? id : null)}>
      <CollapsibleTrigger className="hover:bg-accent flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left transition">
        <span className="flex-1 font-semibold">{title}</span>
        {value ? <span className="text-muted-foreground truncate text-sm">{value}</span> : null}
        <ChevronDownIcon className={cn("text-muted-foreground size-4 shrink-0 transition", open === id && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-4 px-4 pt-1 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** A plain name for a catalog name: "holly-corners" is "Holly corners". */
export const plainName = (name: string) => (name.charAt(0).toUpperCase() + name.slice(1)).replace(/-/g, " ");

function Chips<T extends string | null>({ label, options, value, onPick }: { label: string; options: { id: T; label: string }[]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={String(o.id)} type="button" aria-pressed={o.id === value} onClick={() => onPick(o.id)}
            className={cn("rounded-full border px-3 py-1 text-sm transition", o.id === value ? "bg-accent border-foreground font-medium" : "hover:bg-accent")}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

/** Shape: the corners and edges of cards, controls and photos on the site. */
export function VirtuShape() {
  const { state, look, setLook } = useVirtu();
  const L = state?.looks;
  const cur = (look ?? L?.choice)?.shape ?? null;
  const options = [{ name: null as string | null, card: "6px", label: "None" }, ...(L?.shapes ?? []).map((s) => ({ name: s.name as string | null, card: s.card, label: plainName(s.name) }))];
  return (
    <Group id="virtu:shape" title="Shape" value={cur ? plainName(cur) : "None"}>
      <ul className="grid grid-cols-3 gap-2" role="group" aria-label="Shape">
        {options.map((o) => (
          <li key={String(o.name)}>
            <button type="button" aria-pressed={cur === o.name} onClick={() => setLook({ shape: o.name })}
              title={L?.shapes.find((s) => s.name === o.name)?.description ?? undefined}
              className={cn("grid w-full justify-items-center gap-1.5 rounded-lg p-2 text-xs transition hover:bg-accent", cur === o.name && "bg-accent")}>
              <span className={cn("bg-muted relative grid h-10 w-14 place-items-center border", cur === o.name && "ring-foreground ring-2 ring-offset-2 ring-offset-background")} style={{ borderRadius: o.card }}>
                {cur === o.name ? <CheckIcon className="size-4" /> : null}
              </span>
              {o.label}
            </button>
          </li>
        ))}
      </ul>
    </Group>
  );
}

const FAMILIES: { id: string; label: string; value: string[] }[] = [
  { id: "sans", label: "Sans", value: ["ui-sans-serif", "system-ui", "sans-serif"] },
  { id: "serif", label: "Serif", value: ["ui-serif", "Georgia", "serif"] },
  { id: "rounded", label: "Rounded", value: ["ui-rounded", "system-ui", "sans-serif"] },
  { id: "mono", label: "Mono", value: ["ui-monospace", "SFMono-Regular", "monospace"] },
];
const WEIGHTS = [{ id: "400", label: "Regular" }, { id: "500", label: "Medium" }, { id: "600", label: "Semibold" }, { id: "700", label: "Bold" }];

const familyOf = (v: unknown) => FAMILIES.find((f) => JSON.stringify(f.value) === JSON.stringify(v))?.id ?? "";

/** Type: the faces of headings and text, and how heavy headings are. */
export function VirtuType() {
  const { value, setEdit } = useVirtu();
  const body = familyOf(value("type.family.body")?.value);
  const display = familyOf(value("type.family.display")?.value);
  const weight = String(value("type.weight.heading")?.value ?? "");
  const pick = (path: string) => (id: string) => setEdit(path, FAMILIES.find((f) => f.id === id)!.value);
  const name = (id: string) => FAMILIES.find((f) => f.id === id)?.label;
  return (
    <Group id="virtu:type" title="Type" value={[name(display), name(body)].filter(Boolean).join(", ") || null}>
      <Chips label="Headings" options={FAMILIES} value={display} onPick={pick("type.family.display")} />
      <Chips label="Text" options={FAMILIES} value={body} onPick={pick("type.family.body")} />
      <Chips label="Heading weight" options={WEIGHTS} value={weight} onPick={(w) => setEdit("type.weight.heading", Number(w))} />
    </Group>
  );
}

const ROLE_LABELS: Record<string, string> = {
  background: "Background",
  foreground: "Text",
  muted: "Muted background",
  "muted-foreground": "Muted text",
  primary: "Buttons",
  "primary-foreground": "Text on buttons",
  link: "Links",
  border: "Borders",
};
const ROLE_ORDER = ["background", "foreground", "primary", "primary-foreground", "link", "muted", "muted-foreground", "border"];

/** Colour: each colour role of the site, picked from the site's palette. */
export function VirtuColour() {
  const { state, value, setEdit } = useVirtu();
  const [openRole, setOpenRole] = useState<string | null>(null);
  const roles = (state?.tokens ?? []).filter((t) => t.domain === "color" && t.editable && t.path.startsWith("color.role."))
    .sort((a, b) => ROLE_ORDER.indexOf(a.path.slice(11)) - ROLE_ORDER.indexOf(b.path.slice(11)));
  const failing = new Set((state?.findings ?? []).filter((f) => f.severity === "error").flatMap((f) => f.entities));
  return (
    <Group id="virtu:colour" title="Colour" value={roles.length ? `${roles.length} roles` : null}>
      <ul className="-mx-2 grid">
        {roles.map((t: VirtuEditorToken) => {
          const role = t.path.slice(11);
          const cur = value(t.path);
          const alias = typeof cur?.value === "string" ? cur.value : "";
          return (
            <li key={t.path}>
              <button type="button" onClick={() => setOpenRole(openRole === t.path ? null : t.path)} aria-expanded={openRole === t.path}
                className="hover:bg-accent flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm transition">
                <span className="size-6 shrink-0 rounded-md border" style={{ background: cur?.css ?? "transparent" }} />
                <span className="flex-1">{ROLE_LABELS[role] ?? plainName(role)}</span>
                {failing.has(t.path) ? <span className="text-destructive text-xs">Too little contrast</span> : null}
                <ChevronDownIcon className={cn("text-muted-foreground size-4 transition", openRole === t.path && "rotate-180")} />
              </button>
              {openRole === t.path ? (
                <div className="grid grid-cols-8 gap-1.5 px-2 pt-1 pb-3" role="group" aria-label={`Colour for ${ROLE_LABELS[role] ?? role}`}>
                  {(state?.swatches ?? []).map((s) => (
                    <button key={s.path} type="button" title={plainName(s.path.split(".").slice(1).join(" "))} aria-label={s.path} aria-pressed={alias === `{${s.path}}`}
                      onClick={() => setEdit(t.path, `{${s.path}}`)}
                      className={cn("aspect-square rounded-md border", alias === `{${s.path}}` && "ring-foreground ring-2 ring-offset-1 ring-offset-background")} style={{ background: s.css }} />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Group>
  );
}

const SLOT_LABELS: Record<string, string> = { card: "On cards", avatar: "On your photo" };

/** Looks: ornaments on the site's cards and photo, and the season calendar they follow. */
export function VirtuLooks() {
  const { state, look, setLook } = useVirtu();
  const L = state?.looks;
  const c = look ?? L?.choice ?? { shape: null, ornaments: {}, season: null };
  const ornaments = [{ id: "", label: "None" }, ...(L?.ornaments ?? []).map((o) => ({ id: o.name, label: plainName(o.name) }))];
  const seasons = [{ id: "", label: "None" }, ...(L?.seasons ?? []).map((s) => ({ id: s.name, label: plainName(s.name) }))];
  const count = Object.keys(c.ornaments).length + (c.season ? 1 : 0);
  return (
    <Group id="virtu:looks" title="Looks" value={count ? `${count} on` : "None"}>
      {(L?.slots ?? []).map((slot) => (
        <Chips key={slot} label={SLOT_LABELS[slot] ?? plainName(slot)} options={ornaments} value={c.ornaments[slot] ?? ""}
          onPick={(id) => { const o = { ...c.ornaments }; if (id) o[slot] = id; else delete o[slot]; setLook({ ornaments: o }); }} />
      ))}
      <Chips label="Seasons" options={seasons} value={c.season ?? ""} onPick={(id) => setLook({ season: id || null })} />
      {c.season && L?.today ? <p className="text-muted-foreground text-xs">Today: {plainName(L.today)}</p> : null}
    </Group>
  );
}

/** The site editor's Design panel (the editor.panel slot): Virtu's four sections together, always on the person's site. */
export function VirtuDesignSections() {
  return (
    <>
      <VirtuShape />
      <VirtuType />
      <VirtuColour />
      <VirtuLooks />
    </>
  );
}
