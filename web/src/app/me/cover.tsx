"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A book cover or show artwork from the catalogue. Missing or failed is a tile tinted in primary with
 * the name's initial, never a broken image. Faces and covers are cropped to fill the box.
 */
export function Cover({ src, name, className, eager, round }: { src?: string | null; name: string; className?: string; eager?: boolean; round?: boolean }) {
  const [failed, setFailed] = useState(false);
  const shape = round ? "rounded-full" : "rounded-md";
  if (!src || failed) {
    return (
      <span aria-hidden className={cn("bg-primary/15 text-primary/70 grid place-items-center overflow-hidden font-semibold select-none", shape, className)}>
        <span className="text-[min(2.5rem,40%)] leading-none">{name.charAt(0)}</span>
      </span>
    );
  }
  return (
    // Remote covers from Open Library, Apple Podcasts and Wikimedia, already small; next/image would only proxy them.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} className={cn("bg-muted object-cover", shape, className)} />
  );
}
