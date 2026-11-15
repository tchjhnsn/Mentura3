"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A picture from another site that hides itself when it fails to load, leaving the box under it (no broken-image
 * icon). A picture that failed before the page woke up is caught on mount, since its error event has already passed.
 */
export function CoverImg({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  // eslint-disable-next-line @next/next/no-img-element
  return failed ? null : <img ref={ref} src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={className} />;
}
