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

/** A card's place-holder while its data loads. */
export function CardSkeleton() {
  return (
    <div className="grid gap-3" aria-hidden="true">
      <div className="bg-muted h-5 w-24 animate-pulse rounded" />
      <div className="bg-muted h-20 animate-pulse rounded-xl" />
    </div>
  );
}
