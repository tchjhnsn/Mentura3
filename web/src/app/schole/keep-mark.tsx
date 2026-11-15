"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { BookmarkIcon } from "lucide-react";
import type { CatalogEntry } from "@reflect/core/openlibrary";
import { cn } from "@/lib/utils";
import { addFromLibraryAction } from "./actions";

// The one action a card carries (Torian, 2026-11-15): a bookmark on its picture that keeps it for later without
// leaving the page, filled once kept. Everything else is on the thing's own page, which tapping the card opens.

const ROUND = "bg-background/90 text-foreground flex size-8 items-center justify-center rounded-full shadow-sm [&_svg]:size-4";

/** A submit button for a keep form: an empty bookmark, filled while it saves. */
export function KeepButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" aria-label={label} title="Keep for later" disabled={pending} className={cn(ROUND, "hover:bg-background transition")}>
      <BookmarkIcon className={pending ? "fill-current" : ""} />
    </button>
  );
}

/** A filled bookmark: this one is kept. */
export function KeptMark({ label = "On your shelves" }: { label?: string }) {
  return <span role="img" aria-label={label} title={label} className={cn(ROUND, "absolute top-1.5 right-1.5")}><BookmarkIcon className="fill-current" /></span>;
}

/** A book's bookmark: puts it on Want to read without refreshing the page. Reading and Read are on the book's page. */
export function KeepBook({ entry }: { entry: CatalogEntry }) {
  const [kept, setKept] = useState(false);
  const [pending, run] = useTransition();
  if (kept) return <KeptMark label="Want to read" />;
  return (
    <button
      type="button" aria-label={`Want to read ${entry.title}`} title="Want to read" disabled={pending}
      className={cn(ROUND, "hover:bg-background absolute top-1.5 right-1.5 transition")}
      onClick={() => run(async () => {
        const f = new FormData();
        f.set("entry", JSON.stringify(entry));
        f.set("status", "want");
        try { await addFromLibraryAction(f); setKept(true); } catch { /* the bookmark stays empty: not kept */ }
      })}
    >
      <BookmarkIcon className={pending ? "fill-current" : ""} />
    </button>
  );
}
