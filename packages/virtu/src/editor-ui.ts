// virtu editor, the panel: a theme panel that sits on the site's own page.
// A person changes tokens, the page restyles at once, Virtu's check runs on
// every change, and Publish stays off until it passes. The page is scanned
// too: text whose contrast against what is really behind it falls below WCAG
// 2.2 (4.5:1, or 3:1 for large text) is outlined with a number.
//
// This file imports nothing and touches nothing outside its own shadow root,
// two <style> elements in <head> (the edited virtu.css, and while the panel is
// open on a wide screen a left margin on <html> so the page sits beside it),
// and the data- attributes of the contexts it previews on <html>. It works in any framework: call mountVirtuEditor in
// the browser. The host supplies a transport that answers with the JSON of
// `virtu editor` (src/editor-io.ts), the protocol virtu-editor/1. It can be
// copied into an app unchanged. docs/design/EDITOR.md is the design.

export type VirtuEditorEdit = { token: string; context: { name: string; value: string } | null; value: unknown };

export type VirtuEditorFinding = { severity: "error" | "warning"; layer: string; rule: string; message: string; entities: string[]; permutation?: Record<string, string> };

export type VirtuEditorToken = {
  path: string;
  type: string | null;
  domain: string;
  property: string;
  scope: string | null;
  values: Record<string, { value: unknown; css: string | null }>;
  editable: boolean;
};

export type VirtuEditorState = {
  protocol: "virtu-editor/1";
  system: string;
  contexts: Array<{ name: string; dialect: string | null; values: string[]; default: string | null }>;
  tokens: VirtuEditorToken[];
  swatches: Array<{ path: string; css: string }>;
  verdict: "pass" | "fail";
  findings: VirtuEditorFinding[];
  css: string | null;
  refused: Array<{ edit: VirtuEditorEdit; why: string }>;
  saved?: boolean;
  written?: string[];
  why?: string;
};

/** How the panel reaches the host: preview a list of edits, or publish them. */
export type VirtuEditorTransport = {
  state(edits: VirtuEditorEdit[]): Promise<VirtuEditorState>;
  publish(edits: VirtuEditorEdit[]): Promise<VirtuEditorState>;
};

export type VirtuEditorOptions = {
  /** A URL that takes POST {"edits": [...], "publish": boolean} and answers with the state, or a transport. */
  endpoint: string | VirtuEditorTransport;
  /** Shown on the Publish button and in its result, such as "Publish to your site". */
  publishLabel?: string;
  /** When given, the panel has a Chat tab whose requests go here, with the page's context. */
  ask?: (request: { prompt: string; system: string; edits: VirtuEditorEdit[]; element: string | null; findings: VirtuEditorFinding[] }) => void | Promise<void>;
  /** Open the panel at once instead of showing only the Customize button. */
  open?: boolean;
  /** Called after a publish succeeds. */
  onPublished?: (state: VirtuEditorState) => void;
};

export type VirtuEditorHandle = { open(): void; close(): void; destroy(): void };

/** A transport over fetch: POST JSON to the endpoint. */
export function fetchTransport(endpoint: string): VirtuEditorTransport {
  const call = async (edits: VirtuEditorEdit[], publish: boolean): Promise<VirtuEditorState> => {
    const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ edits, publish }) });
    const body = (await res.json()) as VirtuEditorState | { error: string };
    if ("error" in body) throw new Error(body.error);
    return body;
  };
  return { state: (edits) => call(edits, false), publish: (edits) => call(edits, true) };
}

type Mark = { el: Element; ratio: number; need: number; n: number };

const DOMAIN_LABELS: Record<string, string> = {
  color: "Color",
  typography: "Type",
  space: "Space",
  depth: "Depth",
  motion: "Motion",
  iconography: "Icons",
  semantics: "Words",
};

const STYLE = `
:host { all: initial; }
* { box-sizing: border-box; }
[hidden] { display: none !important; }
.root { font: 13px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #1c1c1e; --line: #e4e2dc; --quiet: #6b6a66; --fill: #fff; --accent: #2457d6; --good: #1f7a3a; --bad: #b42318; }
@media (prefers-color-scheme: dark) { .root { color: #f2f1ee; --line: #3a3936; --quiet: #a3a19b; --fill: #1d1c1a; --accent: #7ea2ff; --good: #5cc27e; --bad: #ff8a7a; } }
button { font: inherit; color: inherit; cursor: pointer; }
.launcher { position: fixed; right: 16px; bottom: 16px; z-index: 2147483646; display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px; border-radius: 20px; border: 1px solid var(--line); background: var(--fill); box-shadow: 0 2px 10px rgb(0 0 0 / 0.15); font-weight: 600; }
.dot { width: 8px; height: 8px; border-radius: 4px; background: var(--quiet); }
.dot.pass { background: var(--good); }
.dot.fail { background: var(--bad); }
.panel { position: fixed; z-index: 2147483646; top: 0; left: 0; bottom: 0; width: 340px; display: flex; flex-direction: column; background: var(--fill); border-right: 1px solid var(--line); box-shadow: 4px 0 24px rgb(0 0 0 / 0.12); }
@media (max-width: 640px) { .panel { top: auto; right: 0; width: auto; height: 62vh; border-right: 0; border-top: 1px solid var(--line); border-radius: 16px 16px 0 0; box-shadow: 0 -4px 24px rgb(0 0 0 / 0.15); } .grab { display: block; } }
.grab { display: none; width: 40px; height: 4px; border-radius: 2px; background: var(--line); margin: 8px auto 0; }
header { display: flex; align-items: center; gap: 6px; padding: 14px 12px 10px 16px; }
h2 { font-size: 15px; margin: 0; flex: 1; }
.chip { white-space: nowrap; height: 24px; padding: 0 10px; border-radius: 12px; border: 1px solid var(--quiet); font-weight: 600; font-size: 12px; background: none; }
.chip.pass { border-color: var(--good); color: var(--good); }
.chip.fail { border-color: var(--bad); color: var(--bad); }
.publish { white-space: nowrap; height: 30px; padding: 0 12px; border-radius: 8px; border: 0; background: var(--accent); color: #fff; font-weight: 600; }
.publish:disabled { opacity: 0.4; cursor: not-allowed; }
.icon { width: 30px; height: 30px; border-radius: 8px; border: 1px solid transparent; background: none; display: inline-flex; align-items: center; justify-content: center; }
.icon:hover, .icon.on { border-color: var(--line); }
.icon.on { background: color-mix(in srgb, var(--accent) 12%, transparent); }
nav { display: flex; gap: 16px; padding: 0 16px; border-bottom: 1px solid var(--line); }
nav button { background: none; border: 0; padding: 8px 0; color: var(--quiet); border-bottom: 2px solid transparent; }
nav button.on { color: inherit; font-weight: 600; border-bottom-color: currentColor; }
.body { flex: 1; overflow: auto; padding: 12px 16px 24px; }
.seg { display: flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; margin-bottom: 8px; }
.seg button { flex: 1; height: 28px; border: 0; background: none; color: var(--quiet); }
.seg button + button { border-left: 1px solid var(--line); }
.seg button.on { color: inherit; font-weight: 600; background: color-mix(in srgb, currentColor 7%, transparent); }
.ctxname { font-size: 11.5px; color: var(--quiet); margin: 4px 0; }
h3 { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--quiet); margin: 18px 0 4px; }
.row { display: flex; align-items: center; gap: 8px; min-height: 36px; border-bottom: 1px solid var(--line); }
.row.hit { background: color-mix(in srgb, var(--accent) 10%, transparent); }
.row .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row .bad { color: var(--bad); font-size: 11.5px; }
.sw { width: 28px; height: 22px; border-radius: 6px; border: 1px solid var(--line); padding: 0; }
input { font: inherit; color: inherit; background: none; border: 1px solid var(--line); border-radius: 6px; height: 26px; padding: 0 6px; }
input[type=number] { width: 72px; }
input.text { width: 140px; }
.ro { color: var(--quiet); font-size: 12px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.swatches { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; padding: 8px 0 10px; }
.swatches button { aspect-ratio: 1; border-radius: 5px; border: 1px solid var(--line); padding: 0; }
.swatches button.on { outline: 2px solid var(--accent); outline-offset: 1px; }
.custom { display: flex; align-items: center; gap: 8px; padding-bottom: 10px; color: var(--quiet); }
.picked { border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
.picked b { display: block; margin-bottom: 4px; }
.picked button { display: flex; width: 100%; justify-content: space-between; background: none; border: 0; padding: 3px 0; }
.picked .v { color: var(--quiet); font-family: ui-monospace, monospace; font-size: 12px; }
.finding { padding: 8px 0; border-bottom: 1px solid var(--line); }
.finding .n { display: inline-flex; width: 20px; height: 20px; border-radius: 10px; align-items: center; justify-content: center; background: var(--bad); color: #fff; font-size: 11px; font-weight: 700; margin-right: 6px; }
.empty { color: var(--quiet); padding: 12px 0; }
pre { font: 12px/1.45 ui-monospace, monospace; white-space: pre-wrap; word-break: break-all; margin: 0; }
.link { background: none; border: 0; padding: 8px 0; color: var(--accent); font-weight: 600; }
textarea { font: inherit; color: inherit; width: 100%; min-height: 72px; border: 1px solid var(--line); border-radius: 8px; padding: 8px; background: none; resize: vertical; }
.note { font-size: 12px; color: var(--quiet); padding: 6px 0; }
.toast { position: fixed; z-index: 2147483647; left: 50%; bottom: 72px; transform: translateX(-50%); background: #1c1c1e; color: #fff; padding: 8px 14px; border-radius: 8px; font-weight: 600; }
.marks { position: fixed; inset: 0; pointer-events: none; z-index: 2147483645; }
.mark { position: fixed; border: 2px solid var(--bad); border-radius: 4px; }
.mark span { position: absolute; top: -10px; left: -10px; min-width: 20px; height: 20px; border-radius: 10px; background: var(--bad); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 5px; }
.hover { position: fixed; border: 2px dashed var(--accent); border-radius: 4px; pointer-events: none; z-index: 2147483645; }
`;

const ICON_PICK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>';
const ICON_CLOSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';

const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Mounts the panel on the current page. */
export function mountVirtuEditor(options: VirtuEditorOptions): VirtuEditorHandle {
  const transport = typeof options.endpoint === "string" ? fetchTransport(options.endpoint) : options.endpoint;
  const host = document.createElement("div");
  host.setAttribute("data-virtu-editor", "");
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>${STYLE}</style><div class="root"><div class="marks"></div><div class="hover" hidden></div><button class="launcher" type="button"><span class="dot"></span>Customize</button><section class="panel" hidden role="dialog" aria-label="Customize"></section></div>`;
  document.body.appendChild(host);
  const q = <T extends Element>(sel: string): T => {
    const el = shadow.querySelector<T>(sel);
    if (!el) throw new Error(`virtu editor: missing ${sel}`);
    return el;
  };
  const launcher = q<HTMLButtonElement>(".launcher");
  const panel = q<HTMLElement>(".panel");
  const marksLayer = q<HTMLElement>(".marks");
  const hoverBox = q<HTMLElement>(".hover");
  const preview = document.createElement("style");
  preview.setAttribute("data-virtu-editor-preview", "");
  // On a wide screen the page moves over while the panel is open, so the panel sits beside it rather than on it.
  const frameStyle = document.createElement("style");
  frameStyle.setAttribute("data-virtu-editor-frame", "");
  frameStyle.textContent = "@media (min-width: 641px) { html { margin-left: 340px !important; } }";

  let state: VirtuEditorState | null = null;
  let edits: VirtuEditorEdit[] = [];
  let tab: "theme" | "check" | "chat" | "code" = "theme";
  let picking = false;
  let picked: Element | null = null;
  let openSwatches: string | null = null;
  let marks: Mark[] = [];
  let busy = false;
  let error: string | null = null;
  let timer: number | undefined;
  let destroyed = false;
  const original = new Map<string, string | null>();

  // Probes and caches for reading what the browser computes.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rgbaCache = new Map<string, [number, number, number, number] | null>();
  const rgba = (css: string): [number, number, number, number] | null => {
    const hit = rgbaCache.get(css);
    if (hit !== undefined) return hit;
    let out: [number, number, number, number] | null = null;
    if (ctx && css && css !== "transparent") {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      out = [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0, (d[3] ?? 0) / 255];
    } else if (css === "transparent") out = [0, 0, 0, 0];
    rgbaCache.set(css, out);
    return out;
  };

  function viewing(context: string): string {
    const c = state?.contexts.find((x) => x.name === context);
    const v = document.documentElement.getAttribute(`data-${context}`);
    return v !== null && c?.values.includes(v) ? v : (c?.default ?? c?.values[0] ?? "");
  }

  function currentValue(t: VirtuEditorToken): { value: unknown; css: string | null } {
    const key = t.scope === null ? "" : viewing(t.scope);
    return t.values[key] ?? { value: null, css: null };
  }

  function setEdit(t: VirtuEditorToken, value: unknown): void {
    const context = t.scope === null ? null : { name: t.scope, value: viewing(t.scope) };
    edits = edits.filter((e) => !(e.token === t.path && e.context?.name === context?.name && e.context?.value === context?.value));
    edits.push({ token: t.path, context, value });
    schedule();
  }

  function schedule(): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void refresh(), 150);
  }

  async function refresh(): Promise<void> {
    try {
      const next = await transport.state(edits);
      if (destroyed) return;
      state = next;
      error = null;
      applyCss();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    render();
    requestAnimationFrame(() => {
      scan();
      drawMarks();
    });
  }

  function applyCss(): void {
    if (!state?.css) return;
    preview.textContent = state.css;
    if (!preview.isConnected || document.head.lastElementChild !== preview) document.head.appendChild(preview);
  }

  async function publish(): Promise<void> {
    if (busy || !state || state.verdict !== "pass" || edits.length === 0) return;
    busy = true;
    render();
    try {
      const r = await transport.publish(edits);
      state = r;
      if (r.saved) {
        edits = [];
        toast(r.written && r.written.length > 0 ? `Published: ${r.written.join(", ")}` : "Published");
        options.onPublished?.(r);
      } else toast(r.why ?? "Not published");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Not published");
    }
    busy = false;
    render();
  }

  function toast(text: string): void {
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    q(".root").appendChild(t);
    window.setTimeout(() => t.remove(), 2600);
  }

  // The page scan: text whose real contrast falls below WCAG 2.2.
  function lum(c: [number, number, number, number]): number {
    const ch = (v: number): number => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  const over = (top: [number, number, number, number], under: [number, number, number, number]): [number, number, number, number] => {
    const a = top[3];
    return [top[0] * a + under[0] * (1 - a), top[1] * a + under[1] * (1 - a), top[2] * a + under[2] * (1 - a), 1];
  };
  function backdrop(el: Element): [number, number, number, number] | null {
    const layers: Array<[number, number, number, number]> = [];
    for (let at: Element | null = el; at; at = at.parentElement) {
      const cs = getComputedStyle(at);
      if (cs.backgroundImage !== "none") return null;
      const c = rgba(cs.backgroundColor);
      if (c && c[3] > 0) {
        layers.push(c);
        if (c[3] >= 1) break;
      }
    }
    let out: [number, number, number, number] = [255, 255, 255, 1];
    for (const l of layers.reverse()) out = over(l, out);
    return out;
  }
  function scan(): void {
    marks = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();
    for (let n = walker.nextNode(); n && seen.size < 1500; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || seen.has(el) || !n.textContent?.trim() || host.contains(el)) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility !== "visible" || Number(cs.opacity) === 0) continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      const fg = rgba(cs.color);
      const bg = backdrop(el);
      if (!fg || !bg || fg[3] === 0) continue;
      const shown = over(fg, bg);
      const [hi, lo] = [lum(shown), lum(bg)].sort((x, y) => y - x) as [number, number];
      const ratio = (hi + 0.05) / (lo + 0.05);
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      const need = large ? 3 : 4.5;
      if (ratio < need) marks.push({ el, ratio, need, n: 0 });
      if (marks.length >= 40) break;
    }
    marks.forEach((m, i) => (m.n = i + 1));
  }
  function drawMarks(): void {
    if (panel.hidden) {
      marksLayer.innerHTML = "";
      return;
    }
    marksLayer.innerHTML = marks
      .map((m) => {
        const r = m.el.getBoundingClientRect();
        return `<div class="mark" style="left:${r.left - 3}px;top:${r.top - 3}px;width:${r.width + 6}px;height:${r.height + 6}px" title="${m.ratio.toFixed(2)}:1, needs ${m.need}:1"><span>${m.n}</span></div>`;
      })
      .join("");
  }
  let frame = 0;
  const onMove = (): void => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(drawMarks);
  };

  // The element picker.
  function describe(el: Element): string {
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("aria-label") ?? el.getAttribute("role");
    return `${tag}${role ? ` (${role})` : ""}${text ? `: "${text}${(el.textContent ?? "").trim().length > 40 ? "…" : ""}"` : ""}`;
  }
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0";
  function tokensOf(el: Element): Array<{ token: VirtuEditorToken; prop: string; css: string }> {
    if (!state) return [];
    const cs = getComputedStyle(el);
    const out: Array<{ token: VirtuEditorToken; prop: string; css: string }> = [];
    el.appendChild(probe);
    const colorProps = ["color", "background-color", "border-top-color", "outline-color"];
    const sizeProps = ["font-size", "padding-top", "padding-right", "padding-bottom", "padding-left", "row-gap", "column-gap", "margin-top", "margin-bottom", "border-top-left-radius", "line-height"];
    for (const t of state.tokens) {
      const v = getComputedStyle(probe).getPropertyValue(t.property).trim();
      if (!v) continue;
      if (t.type === "color") {
        const tc = rgba(v);
        for (const p of colorProps) {
          const c = rgba(cs.getPropertyValue(p));
          if (tc && c && c[3] > 0 && tc.every((x, i) => Math.abs(x - (c[i] ?? 0)) < (i === 3 ? 0.02 : 1.5))) out.push({ token: t, prop: p, css: v });
        }
      } else if (t.type === "dimension") {
        probe.style.width = `var(${t.property})`;
        const px = getComputedStyle(probe).width;
        probe.style.width = "0";
        for (const p of sizeProps) if (cs.getPropertyValue(p) === px && px !== "0px") out.push({ token: t, prop: p, css: v });
      } else if (t.type === "fontFamily") {
        const norm = (s: string): string => s.replace(/["']/g, "").replace(/\s*,\s*/g, ",").toLowerCase();
        if (norm(cs.fontFamily) === norm(v)) out.push({ token: t, prop: "font-family", css: v });
      } else if (t.type === "fontWeight") {
        if (cs.fontWeight === v) out.push({ token: t, prop: "font-weight", css: v });
      }
    }
    probe.remove();
    return out;
  }
  const onPointerMove = (ev: PointerEvent): void => {
    if (!picking) return;
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    if (!el || host.contains(el) || el === host) {
      hoverBox.hidden = true;
      return;
    }
    const r = el.getBoundingClientRect();
    hoverBox.hidden = false;
    hoverBox.style.cssText = `left:${r.left - 2}px;top:${r.top - 2}px;width:${r.width + 4}px;height:${r.height + 4}px`;
  };
  const onClickCapture = (ev: MouseEvent): void => {
    if (!picking) return;
    const target = ev.composedPath()[0];
    if (target instanceof Node && host.contains(target)) return;
    if (ev.target === host) return;
    ev.preventDefault();
    ev.stopPropagation();
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    if (!el || el === host) return;
    picked = el;
    picking = false;
    hoverBox.hidden = true;
    tab = "theme";
    render();
  };
  const onKey = (ev: KeyboardEvent): void => {
    if (ev.key !== "Escape") return;
    if (picking) {
      picking = false;
      hoverBox.hidden = true;
      render();
    } else if (!panel.hidden) close();
  };

  // Rendering.
  function control(t: VirtuEditorToken): string {
    const cur = currentValue(t);
    const id = esc(t.path);
    if (!t.editable) return `<span class="ro" title="${esc(String(cur.css ?? ""))}">${esc(String(cur.css ?? "none"))}</span>`;
    switch (t.type) {
      case "color":
        return `<button class="sw" type="button" data-sw="${id}" style="background:${esc(cur.css ?? "transparent")}" aria-label="Change ${id}, now ${esc(String(cur.css ?? ""))}"></button>`;
      case "dimension": {
        const v = cur.value;
        let n = "";
        let unit = "px";
        if (typeof v === "object" && v !== null && "value" in v) {
          const dim = v as { value?: unknown; unit?: unknown };
          n = String(dim.value);
          unit = String(dim.unit ?? "px");
        } else if (typeof v === "string") {
          const m = /^(-?[\d.]+)(px|rem)$/.exec(v);
          if (m) [n, unit] = [m[1] ?? "", m[2] ?? "px"];
        }
        return `<input type="number" step="any" data-dim="${id}" data-unit="${esc(unit)}" value="${esc(n)}" aria-label="${id} in ${esc(unit)}"><span class="note">${esc(unit)}</span>`;
      }
      case "duration": {
        const v = cur.value as { value?: number; unit?: string } | null;
        const ms = v && typeof v === "object" && typeof v.value === "number" ? (v.unit === "s" ? v.value * 1000 : v.value) : "";
        return `<input type="number" step="10" data-dur="${id}" value="${esc(String(ms))}" aria-label="${id} in milliseconds"><span class="note">ms</span>`;
      }
      case "fontFamily": {
        const v = cur.value;
        const text = Array.isArray(v) ? v.join(", ") : String(v ?? "");
        return `<input class="text" data-font="${id}" value="${esc(text)}" aria-label="${id}">`;
      }
      case "fontWeight":
      case "number":
        return `<input type="number" step="any" data-num="${id}" value="${esc(String(typeof cur.value === "number" ? cur.value : (cur.css ?? "")))}" aria-label="${id}">`;
      default:
        return `<span class="ro">${esc(String(cur.css ?? ""))}</span>`;
    }
  }

  function badTokens(): Set<string> {
    const out = new Set<string>();
    for (const f of state?.findings ?? []) if (f.severity === "error") for (const e of f.entities) out.add(e);
    return out;
  }

  function themeTab(): string {
    if (!state) return `<p class="empty">${error ? esc(error) : "Loading…"}</p>`;
    const parts: string[] = [];
    if (picked) {
      const hits = tokensOf(picked);
      parts.push(`<div class="picked"><b>${esc(describe(picked))}</b>${hits.length === 0 ? '<span class="note">No token of this system matches this element.</span>' : hits.map((h) => `<button type="button" data-goto="${esc(h.token.path)}"><span>${esc(h.token.path)} <span class="note">${esc(h.prop)}</span></span><span class="v">${esc(h.css)}</span></button>`).join("")}</div>`);
    }
    for (const c of state.contexts) {
      const cur = viewing(c.name);
      parts.push(`<div class="ctxname">${esc(c.name)}</div><div class="seg" role="group" aria-label="${esc(c.name)}">${c.values.map((v) => `<button type="button" data-ctx="${esc(c.name)}" data-val="${esc(v)}" class="${v === cur ? "on" : ""}" aria-pressed="${v === cur}">${esc(v)}</button>`).join("")}</div>`);
    }
    const bad = badTokens();
    const domains = [...new Set(state.tokens.map((t) => t.domain))];
    for (const d of domains) {
      parts.push(`<h3>${esc(DOMAIN_LABELS[d] ?? d)}</h3>`);
      for (const t of state.tokens.filter((x) => x.domain === d)) {
        const name = t.path.split(".").slice(1).join(".") || t.path;
        const scope = t.scope ? ` <span class="note">${esc(viewing(t.scope))}</span>` : "";
        parts.push(`<div class="row" data-row="${esc(t.path)}"><span class="name" title="${esc(t.path)}">${esc(name)}${scope}${bad.has(t.path) ? ' <span class="bad">fails</span>' : ""}</span>${control(t)}</div>`);
        if (openSwatches === t.path) {
          const cur = currentValue(t);
          const alias = typeof cur.value === "string" ? cur.value : "";
          parts.push(`<div class="swatches">${state.swatches.map((s) => `<button type="button" data-pick="${esc(t.path)}" data-alias="${esc(s.path)}" class="${alias === `{${s.path}}` ? "on" : ""}" style="background:${esc(s.css)}" title="${esc(s.path)}" aria-label="${esc(s.path)}"></button>`).join("")}</div><label class="custom">Custom <input type="color" data-custom="${esc(t.path)}" value="${esc(toHex(cur.css))}"></label>`);
        }
      }
    }
    return parts.join("");
  }

  function checkTab(): string {
    if (!state) return "";
    const errs = state.findings.filter((f) => f.severity === "error");
    const parts: string[] = [`<h3>In the system</h3>`];
    if (errs.length === 0) parts.push(`<p class="empty">Every rule holds under every context.</p>`);
    for (const f of errs) {
      const where = f.permutation ? ` <span class="note">${esc(Object.entries(f.permutation).map(([k, v]) => `${k}=${v}`).join(", "))}</span>` : "";
      parts.push(`<div class="finding">${esc(f.message)}${where}</div>`);
    }
    for (const r of state.refused) parts.push(`<div class="finding">Not applied: ${esc(r.edit.token)}: ${esc(r.why)}</div>`);
    parts.push(`<h3>On this page</h3>`);
    if (marks.length === 0) parts.push(`<p class="empty">All text on this page reaches its contrast minimum.</p>`);
    for (const m of marks) parts.push(`<div class="finding"><span class="n">${m.n}</span>${esc(describe(m.el))}: ${m.ratio.toFixed(2)}:1, needs ${m.need}:1</div>`);
    return parts.join("");
  }

  function codeTab(): string {
    if (edits.length === 0) return `<p class="empty">No changes yet. Publish writes the token files your changes touch.</p>`;
    return `<pre>${esc(JSON.stringify(edits, null, 2))}</pre><button class="link" type="button" data-discard>Discard changes</button>`;
  }

  function chatTab(): string {
    return `<p class="note">Ask Claude to change the design. It gets this system, your changes so far${picked ? ", the element you picked" : ""}, and what fails.</p><textarea data-prompt placeholder="Make the headings warmer and keep the contrast"></textarea><button class="publish" type="button" data-ask>Send to Claude</button>`;
  }

  function render(): void {
    const verdict = state?.verdict;
    const dot = launcher.querySelector(".dot");
    if (dot) dot.className = `dot ${verdict ?? ""}`;
    if (panel.hidden) return;
    const errors = state?.findings.filter((f) => f.severity === "error").length ?? 0;
    const chip = verdict === "pass" ? "Passes" : verdict === "fail" ? `${errors} fail${errors === 1 ? "s" : ""}` : "…";
    const canPublish = verdict === "pass" && edits.length > 0 && !busy && (state?.refused.length ?? 0) === 0;
    const tabs: Array<[typeof tab, string]> = [["theme", "Theme"], ["check", `Check${marks.length > 0 ? ` (${marks.length})` : ""}`], ...(options.ask ? ([["chat", "Chat"]] as Array<[typeof tab, string]>) : []), ["code", "Code"]];
    const scroll = shadow.querySelector(".body")?.scrollTop ?? 0;
    panel.innerHTML = `<div class="grab"></div><header><h2>Customize</h2><button type="button" class="chip ${verdict ?? ""}" data-tab="check">${chip}</button><button type="button" class="publish" data-publish ${canPublish ? "" : "disabled"} title="${verdict === "fail" ? "Fix what fails first" : edits.length === 0 ? "No changes yet" : ""}">${busy ? "Publishing…" : esc(options.publishLabel ?? "Publish")}</button><button type="button" class="icon ${picking ? "on" : ""}" data-picker aria-label="Pick an element on the page" aria-pressed="${picking}">${ICON_PICK}</button><button type="button" class="icon" data-close aria-label="Close">${ICON_CLOSE}</button></header><nav>${tabs.map(([k, l]) => `<button type="button" data-tab="${k}" class="${tab === k ? "on" : ""}">${esc(l)}</button>`).join("")}</nav><div class="body">${tab === "theme" ? themeTab() : tab === "check" ? checkTab() : tab === "chat" ? chatTab() : codeTab()}</div>`;
    const body = shadow.querySelector(".body");
    if (body) body.scrollTop = scroll;
  }

  function token(path: string | undefined): VirtuEditorToken | undefined {
    return state?.tokens.find((t) => t.path === path);
  }

  panel.addEventListener("click", (ev) => {
    const el = (ev.target as Element).closest("button");
    if (!el) return;
    const d = el.dataset;
    if (d["tab"]) tab = d["tab"] as typeof tab;
    else if ("publish" in d) void publish();
    else if ("close" in d) close();
    else if ("picker" in d) {
      picking = !picking;
      if (!picking) hoverBox.hidden = true;
    } else if (d["ctx"] && d["val"]) {
      if (!original.has(d["ctx"])) original.set(d["ctx"], document.documentElement.getAttribute(`data-${d["ctx"]}`));
      document.documentElement.setAttribute(`data-${d["ctx"]}`, d["val"]);
      requestAnimationFrame(() => {
        scan();
        drawMarks();
        render();
      });
    } else if (d["sw"]) openSwatches = openSwatches === d["sw"] ? null : d["sw"];
    else if (d["pick"] && d["alias"]) {
      const t = token(d["pick"]);
      if (t) setEdit(t, `{${d["alias"]}}`);
    } else if (d["goto"]) {
      tab = "theme";
      render();
      const row = shadow.querySelector(`[data-row="${CSS.escape(d["goto"])}"]`);
      row?.classList.add("hit");
      row?.scrollIntoView({ block: "center" });
      return;
    } else if ("discard" in d) {
      edits = [];
      void refresh();
    } else if ("ask" in d && options.ask && state) {
      const area = shadow.querySelector<HTMLTextAreaElement>("[data-prompt]");
      const prompt = area?.value.trim() ?? "";
      if (prompt) {
        void options.ask({ prompt, system: state.system, edits, element: picked ? describe(picked) : null, findings: state.findings.filter((f) => f.severity === "error") });
        if (area) area.value = "";
        toast("Sent to Claude");
      }
      return;
    }
    render();
  });
  panel.addEventListener("change", (ev) => {
    const el = ev.target as HTMLInputElement;
    const d = el.dataset;
    const path = d["dim"] ?? d["dur"] ?? d["font"] ?? d["num"] ?? d["custom"];
    const t = token(path);
    if (!t) return;
    if (d["dim"]) {
      const n = Number(el.value);
      if (el.value !== "" && Number.isFinite(n)) setEdit(t, { value: n, unit: d["unit"] ?? "px" });
    } else if (d["dur"]) {
      const n = Number(el.value);
      if (el.value !== "" && Number.isFinite(n) && n >= 0) setEdit(t, { value: n, unit: "ms" });
    } else if (d["font"]) {
      const list = el.value.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      if (list.length > 0) setEdit(t, list.length === 1 ? list[0] : list);
    } else if (d["num"]) {
      const n = Number(el.value);
      if (el.value !== "" && Number.isFinite(n)) setEdit(t, n);
    } else if (d["custom"]) setEdit(t, el.value);
  });

  function open(): void {
    document.head.appendChild(frameStyle);
    panel.hidden = false;
    launcher.hidden = true;
    render();
    if (!state) void refresh();
    else requestAnimationFrame(() => {
      scan();
      drawMarks();
    });
  }
  function close(): void {
    frameStyle.remove();
    panel.hidden = true;
    launcher.hidden = false;
    picking = false;
    hoverBox.hidden = true;
    drawMarks();
    render();
  }
  function destroy(): void {
    destroyed = true;
    window.clearTimeout(timer);
    window.removeEventListener("scroll", onMove, true);
    window.removeEventListener("resize", onMove);
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("click", onClickCapture, true);
    document.removeEventListener("keydown", onKey);
    for (const [name, v] of original) {
      if (v === null) document.documentElement.removeAttribute(`data-${name}`);
      else document.documentElement.setAttribute(`data-${name}`, v);
    }
    preview.remove();
    frameStyle.remove();
    host.remove();
  }

  launcher.addEventListener("click", open);
  window.addEventListener("scroll", onMove, true);
  window.addEventListener("resize", onMove);
  document.addEventListener("pointermove", onPointerMove, true);
  document.addEventListener("click", onClickCapture, true);
  document.addEventListener("keydown", onKey);
  void refresh();
  if (options.open) open();
  return { open, close, destroy };
}

function toHex(css: string | null): string {
  if (css && /^#[0-9a-f]{6}$/i.test(css)) return css;
  if (css && /^#[0-9a-f]{3}$/i.test(css)) return `#${[...css.slice(1)].map((c) => c + c).join("")}`;
  return "#000000";
}
