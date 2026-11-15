"use client";

import { useEffect, useState } from "react";
import { CheckIcon, DownloadIcon, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Saved episodes: the recording kept in this browser (Cache Storage), played from there by public/episodes-sw.js, so
// an episode keeps playing when the network drops. Nothing is sent to Reflect's server.
const CACHE = "reflect-episodes";
const canSave = () => typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;

let registered: Promise<unknown> | null = null;
function register() {
  registered ??= navigator.serviceWorker.register("/episodes-sw.js").catch(() => null);
  return registered;
}

async function isSaved(src: string) {
  return Boolean(await (await caches.open(CACHE)).match(src));
}

/** Keeps the recording: read with CORS when the host allows it (so it can be played in parts), else as it comes. */
async function save(src: string) {
  await register();
  void navigator.storage?.persist?.().catch(() => false);
  const r = await fetch(src, { mode: "cors" }).catch(() => fetch(src, { mode: "no-cors" }));
  if (r.type !== "opaque" && !r.ok) throw new Error(`the host answered ${r.status}`);
  await (await caches.open(CACHE)).put(src, r);
}

async function unsave(src: string) {
  await (await caches.open(CACHE)).delete(src);
}

/** An icon to save an episode in this browser, and to take it out again once saved. Hidden where browsers can't keep it. */
export function SaveEpisode({ src }: { src: string }) {
  const [state, setState] = useState<"unknown" | "no" | "saving" | "yes" | "failed">("unknown");
  useEffect(() => {
    if (!canSave()) return;
    void register();
    isSaved(src).then((y) => setState(y ? "yes" : "no")).catch(() => setState("no"));
  }, [src]);
  if (state === "unknown") return null;
  if (state === "saving") return <Button size="icon" variant="ghost" disabled aria-label="Saving for offline"><LoaderIcon className="animate-spin" /></Button>;
  if (state === "yes") {
    return <Button size="icon" variant="ghost" aria-label="Saved for offline; take it out" title="Saved in this browser. Tap to take it out." onClick={() => unsave(src).then(() => setState("no"))}><CheckIcon /></Button>;
  }
  return (
    <Button
      size="icon" variant="ghost" aria-label={state === "failed" ? "Could not save; try again" : "Save for offline"} title={state === "failed" ? "The show's host refused; try again" : "Save in this browser to play without the network"}
      onClick={() => { setState("saving"); save(src).then(() => setState("yes"), () => setState("failed")); }}
    >
      <DownloadIcon className={state === "failed" ? "text-destructive" : ""} />
    </Button>
  );
}
