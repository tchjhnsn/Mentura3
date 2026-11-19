"use client";

import { useEffect, useState } from "react";
import { ExternalLinkIcon, GlobeIcon, MonitorIcon, RotateCwIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/** Widths the site can be shown at, to see how it looks on a phone or a tablet. */
const DEVICES = [
  { id: "full", label: "Full width", width: null, Icon: MonitorIcon },
  { id: "tablet", label: "Tablet, 768 wide", width: 768, Icon: TabletIcon },
  { id: "phone", label: "Phone, 390 wide", width: 390, Icon: SmartphoneIcon },
] as const;

type Shown = { state: "idle" } | { state: "checking" } | { state: "ok"; url: string } | { state: "refused"; url: string; reason: string } | { state: "bad"; reason: string };

/**
 * The pane's browser tab (Panes design guide, The browser pane; PR 3): an address bar, the site in a frame, widths
 * for phone and tablet, and Open in a new tab. Before framing a site it asks /api/frame-check whether the site allows
 * being framed; one that does not shows why, with Open in a new tab as the main act. Only public http(s) sites. The
 * frame is sandboxed, and a site's own sign-in rarely works inside it (browsers keep its cookies apart), which is why
 * Open in a new tab is always there.
 */
export function BrowserTab({ url, onUrl }: { url: string | null; onUrl: (url: string, title: string) => void }) {
  const [typed, setTyped] = useState(url ?? "");
  const [shown, setShown] = useState<Shown>({ state: "idle" });
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("full");
  const [reload, setReload] = useState(0);

  const go = async (address: string) => {
    if (!address.trim()) return;
    setShown({ state: "checking" });
    try {
      const r = await fetch(`/api/frame-check?url=${encodeURIComponent(address)}`);
      const v = (await r.json()) as { ok: boolean; url?: string; reason?: string };
      if (!v.url) return setShown({ state: "bad", reason: v.reason ?? "That is not a public website address." });
      setTyped(v.url);
      onUrl(v.url, new URL(v.url).hostname.replace(/^www\./, ""));
      setShown(v.ok ? { state: "ok", url: v.url } : { state: "refused", url: v.url, reason: v.reason ?? "" });
    } catch {
      setShown({ state: "bad", reason: "Reflect could not reach that site just now." });
    }
  };
  // A tab opened with an address (Alt-click on an outside link) goes there at once.
  useEffect(() => {
    if (url) void go(url);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const width = DEVICES.find((d) => d.id === device)?.width ?? null;
  const at = shown.state === "ok" || shown.state === "refused" ? shown.url : null;
  return (
    <div className="flex h-full flex-col">
      <form className="flex shrink-0 items-center gap-1 border-b px-2 py-1.5" onSubmit={(e) => { e.preventDefault(); void go(typed); }}>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Reload" title="Reload" disabled={shown.state !== "ok"} onClick={() => setReload((n) => n + 1)}><RotateCwIcon /></Button>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type a website address" aria-label="Website address" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} autoFocus={!url}
          className="bg-muted placeholder:text-muted-foreground focus-visible:ring-ring/50 h-8 min-w-0 flex-1 rounded-md px-3 text-sm outline-none focus-visible:ring-2" />
        <div className="hidden items-center sm:flex" role="group" aria-label="Width">
          {DEVICES.map((d) => (
            <Button key={d.id} type="button" variant="ghost" size="icon-sm" aria-label={d.label} title={d.label} aria-pressed={device === d.id} className={cn(device === d.id && "bg-muted")} onClick={() => setDevice(d.id)}><d.Icon /></Button>
          ))}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Open in a new tab" title="Open in a new tab" disabled={!at} onClick={() => at && window.open(at, "_blank", "noopener,noreferrer")}><ExternalLinkIcon /></Button>
      </form>
      <div className="bg-muted/40 min-h-0 flex-1 overflow-auto">
        {shown.state === "ok" ? (
          <iframe key={reload} src={shown.url} title={new URL(shown.url).hostname} referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            style={width ? { width } : undefined}
            className={cn("bg-background mx-auto block h-full border-0 [html[data-pane-drag]_&]:pointer-events-none", width ? "border-x shadow-sm" : "w-full")} />
        ) : (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon"><GlobeIcon /></EmptyMedia>
              <EmptyTitle>{shown.state === "checking" ? "Opening" : shown.state === "refused" ? "This site does not allow being shown inside Reflect" : shown.state === "bad" ? "That site cannot open here" : "Open a website beside your page"}</EmptyTitle>
              <EmptyDescription>
                {shown.state === "refused" ? `${new URL(shown.url).hostname} asks browsers not to show it inside other apps (${shown.reason}). It opens fine in its own tab.` : shown.state === "bad" ? shown.reason : shown.state === "checking" ? "Checking whether the site can be shown here." : "Type an address above, or Alt-click a link to an outside site. Some sites only open in their own tab."}
              </EmptyDescription>
            </EmptyHeader>
            {shown.state === "refused" ? <Button onClick={() => window.open(shown.url, "_blank", "noopener,noreferrer")}><ExternalLinkIcon />Open in a new tab</Button> : null}
          </Empty>
        )}
      </div>
    </div>
  );
}
