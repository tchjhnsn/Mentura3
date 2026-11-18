"use client";

import { useEffect } from "react";

// The dashboard's first-party beacon (migration 0054): it records the open, each tap inside an element marked
// `data-dash-card`, and the milliseconds from opening to the first such tap or ask. Nothing goes to anyone but
// Reflect, and the person sees nothing new.
const send = (body: Record<string, unknown>) => {
  try {
    const data = JSON.stringify(body);
    if (navigator.sendBeacon?.("/api/dashboard/event", new Blob([data], { type: "application/json" }))) return;
    void fetch("/api/dashboard/event", { method: "POST", body: data, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => undefined);
  } catch {
    // A beacon that cannot be sent is dropped.
  }
};

export function DashBeacon() {
  useEffect(() => {
    const opened = performance.now();
    let acted = false;
    send({ kind: "open" });
    const act = (card: string) => {
      send({ kind: "tap", card });
      if (!acted) {
        acted = true;
        send({ kind: "first_act", card, ms: Math.round(performance.now() - opened) });
      }
    };
    const onClick = (e: MouseEvent) => {
      const hit = (e.target as Element | null)?.closest?.("a, button");
      // A submit button's tap is counted by its form's submit, once.
      if (!hit || (hit instanceof HTMLButtonElement && hit.type === "submit" && hit.form)) return;
      const card = hit.closest("[data-dash-card]")?.getAttribute("data-dash-card");
      if (card) act(card);
    };
    const onSubmit = (e: SubmitEvent) => {
      const card = (e.target as Element | null)?.closest?.("[data-dash-card]")?.getAttribute("data-dash-card");
      if (card) act(card);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);
  return null;
}
