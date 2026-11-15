"use client";

import { useState } from "react";

/** A picture from another site that hides itself when it fails to load, leaving the box under it (no broken-image icon). */
export function CoverImg({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  // eslint-disable-next-line @next/next/no-img-element
  return failed ? null : <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={className} />;
}
