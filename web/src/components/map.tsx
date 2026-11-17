"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export type Pin = { lat: number; lon: number; label: string; href?: string; n?: number };

// OpenFreeMap's Liberty style: OpenStreetMap data, free with no key (openfreemap.org). Attribution shows on the map.
const STYLE = "https://tiles.openfreemap.org/styles/liberty";

/**
 * A map with numbered pins (the Adventures guide: a pin per adventure on the board, a pin per stop on a plan). Fits
 * every pin in view; a pin with a link opens it. Nothing is drawn with no pins: the caller shows its own empty state.
 */
export function PinMap({ pins, className }: { pins: Pin[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(pins);
  useEffect(() => {
    if (!ref.current || !pins.length) return;
    let gone = false;
    let map: { remove: () => void } | null = null;
    void import("maplibre-gl").then(({ default: ml }) => {
      if (gone || !ref.current) return;
      const m = new ml.Map({ container: ref.current, style: STYLE, center: [pins[0]!.lon, pins[0]!.lat], zoom: 7, attributionControl: { compact: true } });
      map = m;
      m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      const bounds = new ml.LngLatBounds();
      for (const p of pins) {
        const el = document.createElement(p.href ? "a" : "div");
        if (p.href) (el as HTMLAnchorElement).href = p.href;
        el.className = "grid size-7 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow ring-2 ring-background";
        el.textContent = p.n ? String(p.n) : "";
        el.title = p.label;
        el.setAttribute("aria-label", p.label);
        new ml.Marker({ element: el }).setLngLat([p.lon, p.lat]).addTo(m);
        bounds.extend([p.lon, p.lat]);
      }
      if (pins.length > 1) m.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 0 });
    });
    return () => { gone = true; map?.remove(); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!pins.length) return null;
  return <div ref={ref} className={className ?? "h-80 w-full overflow-hidden rounded-2xl border"} />;
}
