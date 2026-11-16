import Link from "next/link";
import { WORKS, workById } from "@reflect/core/topic-pages";
import { cn } from "@/lib/utils";
import type { Debate, Person } from "@/server/dialectic-store";
import { DateBlock } from "./client";

/** A person as a face: their picture, else their initial; an empty seat is a dashed ring. */
export function Face({ p, size = 40, ring = false, empty = false, className }: { p?: Person | null; size?: number; ring?: boolean; empty?: boolean; className?: string }) {
  const style = { width: size, height: size };
  if (empty || !p) return <span style={style} className={cn("inline-block shrink-0 rounded-full border border-dashed", className)} aria-hidden />;
  return (
    <span style={style} title={p.name} className={cn("bg-muted text-muted-foreground inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border text-sm font-medium", ring && "ring-primary ring-offset-background ring-[3px] ring-offset-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.image ? <img src={p.image} alt="" className="size-full object-cover" /> : p.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** The work a debate, room or thread is on, linked to its page, with the place in it. */
export function WorkLine({ workId, source, className }: { workId: string | null; source?: string | null; className?: string }) {
  const w = workId ? workById(workId) : undefined;
  if (!w && !source) return null;
  return (
    <p className={cn("text-sm", className)}>
      {w ? <Link href={`/schole/works/${w.id}`} className="underline underline-offset-4">{w.title}</Link> : null}
      {w && source ? ", " : null}{source}
    </p>
  );
}

/** A debate in a list: its date block, the motion, and the work it comes from. */
export function DebateRow({ d }: { d: Debate }) {
  const w = d.workId ? workById(d.workId) : undefined;
  return (
    <li>
      <Link href={`/schole/dialectic/debates/${d.id}`} className="group flex items-center gap-3 py-2">
        <DateBlock iso={d.startsAt} />
        <span className="min-w-0">
          <span className="line-clamp-2 font-medium group-hover:underline group-hover:underline-offset-2">{d.motion}</span>
          {w || d.source ? <span className="text-muted-foreground line-clamp-1 text-sm">{[w?.title, d.source].filter(Boolean).join(", ")}</span> : null}
        </span>
      </Link>
    </li>
  );
}

export const FIELD = "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";

/** Choosing the work something is on: every work with a page in Scholē, by title, or none. */
export function WorkSelect({ name = "work", value }: { name?: string; value?: string }) {
  const works = [...WORKS].sort((a, b) => a.title.localeCompare(b.title));
  return (
    <select id={name} name={name} defaultValue={value ?? ""} className={FIELD}>
      <option value="">No particular work</option>
      {works.map((w) => <option key={w.id} value={w.id}>{w.title}, {w.by}</option>)}
    </select>
  );
}
