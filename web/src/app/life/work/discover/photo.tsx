"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A craft or world photo (Wikipedia lead images, free licence). Missing or failed = a tile tinted in primary with
 * the name's initial (picker design guide: a missing photo is a tinted tile, never a broken image).
 */
export function Photo({ src, name, className, eager }: { src?: string; name: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span aria-hidden className={cn("bg-primary/15 text-primary/70 grid place-items-center overflow-hidden font-semibold select-none", className)}>
        <span className="text-[min(2.5rem,40%)] leading-none">{name.charAt(0)}</span>
      </span>
    );
  }
  return (
    // Remote thumbnails from Wikimedia, already sized at 330px; next/image would only proxy them.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} className={cn("bg-muted object-cover", className)} />
  );
}
