import Link from "next/link";
import type { ReactNode } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removePrepItemAction, savePrepItemAction } from "./actions";
import type { PrepKind } from "./kinds";

/** One part of the prep page: a heading (with an anchor the page returns to after a change), a line beside it, and its body. */
export function Section({ id, title, side, children }: { id: string; title: string; side?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-20 gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>
        {side ? <span className="text-muted-foreground shrink-0 text-sm">{side}</span> : null}
      </div>
      {children}
    </section>
  );
}

/** An item's small editor, opened by its Edit link: its fields, Save, Remove and Cancel. */
export function EditItem({ meetingId, kind, itemId, error, children }: { meetingId: string; kind: PrepKind; itemId: string; error: string | null; children: ReactNode }) {
  return (
    <form action={savePrepItemAction.bind(null, meetingId, kind, itemId)} className="bg-muted/40 grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg p-3">
      {children}
      {error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm">Save</Button>
        <Button asChild size="sm" variant="ghost"><Link href={`/meetings/${meetingId}/prep#${kind}`} scroll={false}>Cancel</Link></Button>
        <Button type="submit" size="sm" variant="ghost" className="text-destructive ml-auto" formAction={removePrepItemAction.bind(null, meetingId, kind, itemId)} formNoValidate>Remove</Button>
      </div>
    </form>
  );
}

/** "Add ..." under a part: opens a small form in place (no script needed), open again with its error when one came back. */
export function AddItem({ meetingId, kind, label, open, error, children }: { meetingId: string; kind: PrepKind; label: string; open: boolean; error: string | null; children: ReactNode }) {
  return (
    <details open={open} className="group">
      <summary className="text-muted-foreground hover:text-foreground flex w-fit cursor-pointer list-none items-center gap-1 text-sm [&::-webkit-details-marker]:hidden">
        <PlusIcon className="size-4" />{label}
      </summary>
      <form action={savePrepItemAction.bind(null, meetingId, kind, "")} className="bg-muted/40 mt-2 grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg p-3">
        {children}
        {open && error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}
        <div><Button type="submit" size="sm" variant="outline">Add</Button></div>
      </form>
    </details>
  );
}

/** A field's label, small, above it. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1 text-sm"><span className="text-muted-foreground">{label}</span>{children}</label>;
}

/** A link's host, for a short label ("crunchbase.com"). */
export function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
