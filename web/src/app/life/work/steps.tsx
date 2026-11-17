import type { ReactNode } from "react";
import Link from "next/link";

/** A short list of next steps under a semibold heading: each row a link with a muted reason line. */
export function Steps({ title, empty, rows }: { title: string; empty: ReactNode; rows: { key: string; href: string; label: string; reason: string }[] }) {
  return (
    <div className="grid content-start gap-2">
      <h3 className="font-semibold">{title}</h3>
      {rows.length ? (
        <ul className="divide-y border-y">
          {rows.map((r) => <li key={r.key}><Link href={r.href} className="hover:bg-accent grid gap-0.5 py-2.5 transition"><span className="text-sm font-medium leading-snug">{r.label}</span><span className="text-muted-foreground text-xs">{r.reason}</span></Link></li>)}
        </ul>
      ) : <p className="text-muted-foreground text-sm">{empty}</p>}
    </div>
  );
}

