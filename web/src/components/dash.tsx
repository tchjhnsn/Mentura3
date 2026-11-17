import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// A tile's dashboard parts (doc "Tile designs", 2026-11-17): a hero with the tile's state and its one filled act,
// cards that each open their own page, rings, bars and faces. Every color is a theme token, so themes recolor them.

/** The hero: the tile's state, largest on the page, with its one filled act. */
export function Hero({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("bg-card grid gap-5 rounded-2xl border p-5 shadow-xs sm:p-6", className)}>{children}</section>;
}

/** A card: a title, its value, a line under it and an optional picture; the whole card opens its page. */
export function DashCard({ href, title, value, sub, tone, children, className }: { href: string; title: string; value?: ReactNode; sub?: ReactNode; tone?: "warn" | "good"; children?: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("bg-card hover:bg-accent grid content-start gap-1.5 rounded-xl border p-4 transition", className)}>
      <span className="text-muted-foreground text-sm font-medium">{title}</span>
      {value !== undefined ? <span className={cn("text-lg leading-snug font-semibold", tone === "warn" && "text-destructive")}>{value}</span> : null}
      {sub ? <span className="text-muted-foreground text-sm">{sub}</span> : null}
      {children ? <span className="mt-2 block">{children}</span> : null}
    </Link>
  );
}

/** A ring filled to a share, in the theme's primary; full when met. */
export function Ring({ value, size = 64, stroke = 7, label, children }: { value: number; size?: number; stroke?: number; label?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value));
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }} role={label ? "img" : undefined} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        {v > 0 ? <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} className="stroke-primary transition-[stroke-dasharray]" /> : null}
      </svg>
      {children ? <span className="absolute inset-0 grid place-items-center">{children}</span> : null}
    </span>
  );
}

/** Bars for a run of days against a line (sleep against seven hours, minutes a day). */
export function Bars({ values, line, max, labels, className }: { values: (number | null)[]; line?: number; max?: number; labels?: string[]; className?: string }) {
  const top = max ?? Math.max(line ?? 0, ...values.map((v) => v ?? 0), 1);
  return (
    <span className={cn("relative flex h-16 items-end gap-1", className)}>
      {line ? <span className="border-foreground/30 absolute inset-x-0 border-t border-dashed" style={{ bottom: `${(line / top) * 100}%` }} aria-hidden="true" /> : null}
      {values.map((v, i) => (
        <span key={i} className="flex h-full flex-1 flex-col justify-end" title={labels?.[i]}>
          <span className={cn("block w-full rounded-sm", v === null ? "bg-muted h-1" : line && v >= line ? "bg-primary" : "bg-primary/45")} style={v === null ? undefined : { height: `${Math.max(4, (v / top) * 100)}%` }} />
        </span>
      ))}
    </span>
  );
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
/** A steady soft tint of the theme's primary per name, so faces differ without photos. */
const TINTS = ["bg-primary/10", "bg-primary/20", "bg-secondary", "bg-primary/15", "bg-accent"];
const tintOf = (name: string) => TINTS[[...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % TINTS.length]!;

/** A face: initials until invitations bring photos, ringed by how much of the wanted time has passed. */
export function Face({ name, size = 48, ring }: { name: string; size?: number; /** Share of the ring left, 1 when just seen, 0 when overdue. */ ring?: number }) {
  const inner = (
    <span className={cn("text-foreground grid place-items-center rounded-full font-semibold", tintOf(name))} style={{ width: size - (ring !== undefined ? 10 : 0), height: size - (ring !== undefined ? 10 : 0), fontSize: size * 0.3 }}>
      {initials(name)}
    </span>
  );
  return ring !== undefined ? <Ring value={ring} size={size} stroke={3}>{inner}</Ring> : inner;
}

/** A section heading in a dashboard, with an optional link on the right. */
export function DashHead({ title, href, more = "See all", children }: { title: string; href?: string; more?: string; children?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children ?? (href ? <Link href={href} className="text-muted-foreground hover:text-foreground text-sm">{more}</Link> : null)}
    </div>
  );
}
