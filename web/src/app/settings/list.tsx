import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Settings as a vertical list (Torian, 2026-11-17 04:32Z, after the iOS Settings pattern): grouped rows in rounded
// cards, a small heading over each group, an icon, a label, a value on the right, and a chevron where a row opens a page.

const ROW = "flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left";

/** A group of rows under a small heading, in one rounded card with dividers between rows. */
export function Group({ title, children, id }: { title?: string; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={title ? id : undefined} className="grid gap-2">
      {title ? <h2 id={id} className="text-muted-foreground px-4 text-sm">{title}</h2> : null}
      <ul className="bg-card divide-y overflow-hidden rounded-2xl border [&>li]:border-border">{children}</ul>
    </section>
  );
}

/** A row that opens a page: icon, label (with a line under it), value, chevron. */
export function Row({ href, icon, label, sub, value }: { href: string; icon?: ReactNode; label: ReactNode; sub?: ReactNode; value?: ReactNode }) {
  return (
    <li>
      <Link href={href} className={cn(ROW, "hover:bg-accent transition")}>
        {icon ? <span className="text-muted-foreground grid min-w-6 shrink-0 place-items-center [&>svg]:size-5">{icon}</span> : null}
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-base">{label}</span>
          {sub ? <span className="text-muted-foreground truncate text-sm">{sub}</span> : null}
        </span>
        {value ? <span className="text-muted-foreground shrink-0 text-sm">{value}</span> : null}
        <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
      </Link>
    </li>
  );
}

/** A row that does something (invite, add), in the accent color, as a form button or a link. */
export function ActionRow({ icon, label, action, href, danger }: { icon?: ReactNode; label: string; action?: () => Promise<void>; href?: string; danger?: boolean }) {
  const inner = (
    <>
      {icon ? <span className="grid size-6 shrink-0 place-items-center [&_svg]:size-5">{icon}</span> : null}
      <span className="text-base">{label}</span>
    </>
  );
  const cls = cn(ROW, "hover:bg-accent transition", danger ? "text-destructive" : "text-primary");
  return (
    <li>
      {href ? <Link href={href} className={cls}>{inner}</Link> : <form action={action}><button type="submit" className={cls}>{inner}</button></form>}
    </li>
  );
}

/** A row that only shows a fact. */
export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <li className={ROW}>
      <span className="flex-1 text-base">{label}</span>
      <span className="text-muted-foreground min-w-0 truncate text-sm">{value}</span>
    </li>
  );
}

export function Initials({ name, size = "size-10" }: { name: string; size?: string }) {
  const s = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return <span aria-hidden="true" className={cn("bg-muted text-foreground grid shrink-0 place-items-center rounded-full font-semibold", size)}>{s || "?"}</span>;
}

/** The settings frame: back, a centered title, then the groups stacked down a narrow column. */
export const COLUMN = "mx-auto mt-4 grid w-full max-w-xl gap-8 pb-12";
