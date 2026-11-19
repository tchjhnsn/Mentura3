import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import type { Door } from "@reflect/core/crafts";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { RotatingName } from "./rotating-name";

export type Way = { href: string; label: string; line: string };

/**
 * A door of Scholē that opens onto parts already built (doc "Scholē landing design guide", Doing and Knowing): the
 * door's turning names, what it is about and its source, then the ways in as plain rows.
 */
export function DoorPage({ door, ways }: { door: Door; ways: readonly Way[] }) {
  return (
    <main className={PAGE}>
      <ThingHeader crumbs={[{ label: "Scholē", href: "/schole" }]} title={door.label} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8">
        <div className="grid gap-1.5">
          <h1 id="page-title" className="text-[28px] leading-tight font-semibold tracking-tight">
            <RotatingName names={door.names} labelEn={door.label} />
          </h1>
          <p className="text-muted-foreground">{door.about}</p>
          <p className="text-muted-foreground text-xs">{door.source}</p>
        </div>
        <ul className="divide-y">
          {ways.map((w) => (
            <li key={w.href}>
              <Link href={w.href} className="flex items-center gap-3 py-4">
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="text-base font-semibold">{w.label}</span>
                  <span className="text-muted-foreground text-sm">{w.line}</span>
                </span>
                <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
