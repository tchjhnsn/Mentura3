"use client";

import { useState } from "react";
import { craftOf, craftPhoto, worldPhoto } from "@reflect/core/crafts";
import { cn } from "@/lib/utils";

/** One soft tint per world, for a craft or world with no photo (or one that fails to load). */
const TINT: Record<string, string> = {
  food: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  growing: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  building: "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
  materials: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  textiles: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  "fine-arts": "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  technical: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  healing: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  trade: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  performance: "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-200",
};

/**
 * A craft's or a world's lead photo (packages/core/src/craft-photos.json, from Wikipedia), filling its box. With no
 * photo, or one that fails to load, a tile tinted by the world with the initial. A plain lazy img, so remote hosts need
 * no next.config entry. Size and shape come from className (e.g. "aspect-square w-full rounded-xl"). Pass sizes for a
 * large photo: the browser may then take Wikimedia's 960px thumbnail instead of the 330px one.
 */
export function CraftPhoto({ id, world, alt, className, sizes }: { id?: string; world?: string; alt: string; className?: string; sizes?: string }) {
  const [broken, setBroken] = useState(false);
  const photo = id ? craftPhoto(id) : world ? worldPhoto(world) : undefined;
  const group = world ?? (id ? craftOf(id)?.group : undefined) ?? "";
  if (!photo || broken) {
    return (
      <span {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })} className={cn("flex items-center justify-center overflow-hidden text-2xl font-semibold", TINT[group] ?? "bg-muted text-muted-foreground", className)}>
        <span aria-hidden>{(alt.trim()[0] ?? "").toUpperCase()}</span>
      </span>
    );
  }
  return (
    <img src={photo.src} srcSet={sizes && photo.src.includes("/330px-") ? `${photo.src} 330w, ${photo.src.replace("/330px-", "/960px-")} 960w` : undefined} sizes={sizes} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={cn("bg-muted block object-cover", className)} />
  );
}
