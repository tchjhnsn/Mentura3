import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared pieces of the dashboard's cards. Times are Austin's, where Reflect's events are.
export const ZONE = "America/Chicago";
export const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
export const dayIn = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(d);
export const hourIn = (d: Date) => Number(new Intl.DateTimeFormat("en-US", { timeZone: ZONE, hour: "numeric", hourCycle: "h23" }).format(d));
export const clockIn = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", minute: "2-digit" }).format(d);
export const eventWhen = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: ZONE, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
export const longDay = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: ZONE, weekday: "long", month: "long", day: "numeric" }).format(d);
export const safe = <T,>(p: Promise<T>, none: T) => p.catch(() => none);

/** What every card is handed: who is looking and when. */
export type Ctx = { userId: string; now: Date; today: string; tomorrow: string };

/** A card's frame: its title and a link to the page it summarises. */
export function Section({ title, href, more = "All", children, className }: { title: string; href: string; more?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={href} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-sm">{more}<ChevronRightIcon className="size-4" /></Link>
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

/** The rough shape of a card, so its place-holder looks like what loads into it. */
export type SkeletonShape = "hero" | "faces" | "stat" | "rows";

const Bar = ({ className }: { className: string }) => <div className={cn("bg-muted animate-pulse rounded", className)} />;

/** A card's place-holder while its data loads, shaped like the card: a big card with rows, faces, a figure, or rows. */
export function CardSkeleton({ shape = "rows" }: { shape?: SkeletonShape }) {
  return (
    <div className="grid gap-3" aria-hidden="true">
      <div className="flex items-baseline justify-between"><Bar className="h-5 w-24" /><Bar className="h-4 w-14" /></div>
      {shape === "hero" ? (
        <>
          <div className="bg-muted/60 grid animate-pulse gap-2 rounded-xl border p-4"><Bar className="h-4 w-28" /><Bar className="h-6 w-3/5" /></div>
          {[0, 1, 2].map((i) => <div key={i} className="grid grid-cols-[6rem_1fr] gap-3 px-2 py-1.5"><Bar className="h-4 w-14" /><Bar className="h-4 w-4/5" /></div>)}
        </>
      ) : shape === "faces" ? (
        [0, 1].map((i) => <div key={i} className="flex items-center gap-3 px-2 py-2"><div className="bg-muted size-10 shrink-0 animate-pulse rounded-full" /><div className="grid flex-1 gap-1.5"><Bar className="h-4 w-32" /><Bar className="h-3 w-3/4" /></div></div>)
      ) : shape === "stat" ? (
        <div className="grid gap-2 rounded-xl border p-4"><Bar className="h-4 w-36" /><Bar className="h-7 w-24" /><Bar className="h-4 w-48" /></div>
      ) : (
        [0, 1, 2].map((i) => <div key={i} className="grid gap-1.5 px-2 py-1.5"><Bar className="h-4 w-4/5" /><Bar className="h-3 w-2/5" /></div>)
      )}
    </div>
  );
}
