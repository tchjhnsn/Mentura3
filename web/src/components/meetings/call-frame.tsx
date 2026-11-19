"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The call on the meeting's live page (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19).
 * CallFrame asks /api/meetings/[id]/call for this person's call and shows Daily Prebuilt in an iframe filling its
 * area; Daily's own prejoin screen handles devices and permissions, its lobby holds guests until the host admits
 * them, and its control bar has Leave. When the answer is an outside link it shows LinkCall instead.
 */
type Call = { kind: "daily"; url: string } | { kind: "link"; url: string };

export function CallFrame({ meetingId, title }: { meetingId: string; title: string }) {
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setCall(null);
    try {
      const r = await fetch(`/api/meetings/${meetingId}/call`, { method: "POST", cache: "no-store" });
      const body = (await r.json().catch(() => null)) as (Call & { error?: string }) | null;
      if (!r.ok || !body || (body.kind !== "daily" && body.kind !== "link")) setError(body?.error ?? "The call could not be opened just now.");
      else setCall({ kind: body.kind, url: body.url });
    } catch {
      setError("The call could not be reached. Check your connection.");
    }
  }, [meetingId]);

  useEffect(() => { void load(); }, [load]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-sm">{error}</p>
        <Button variant="outline" onClick={() => void load()}>Try again</Button>
      </div>
    );
  }
  if (!call) return <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm" role="status">Connecting…</div>;
  if (call.kind === "link") return <LinkCall title={title} url={call.url} />;
  return (
    <iframe
      src={call.url}
      title={`Call: ${title}`}
      allow="camera; microphone; fullscreen; display-capture; autoplay"
      className="block h-full w-full border-0 bg-black"
    />
  );
}

/** The call held on another service: the title, one sentence and one filled button that opens it in a new tab. */
export function LinkCall({ title, url }: { title: string; url: string }) {
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* shown without the host */ }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground max-w-sm">This call runs on {host || "another service"}. It opens in a new tab; keep this page for the agenda.</p>
      <Button asChild size="lg"><a href={url} target="_blank" rel="noreferrer">Open the call<ExternalLinkIcon /></a></Button>
    </div>
  );
}

const MIN = 60_000;

/** Time since the meeting's start ("12:03", "1:02:45"), or how soon it starts while Join is open early. */
export function Elapsed({ startsAt }: { startsAt: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!startsAt || now === null) return null;
  const d = now - Date.parse(startsAt);
  if (d < 0) return <span className="text-muted-foreground text-sm tabular-nums">Starts in {Math.max(1, Math.ceil(-d / MIN))} min</span>;
  const s = Math.floor(d / 1000);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return <span className="text-muted-foreground text-sm tabular-nums" aria-label="Elapsed time">{h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`}</span>;
}
