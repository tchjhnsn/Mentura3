import Link from "next/link";
import { ChevronRightIcon, UsersRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One row on a Home tile that opens People you've met on Village and polis (/v/people; doc "Private and shared Reflect
 * plan", 2026-11-19, step 6): the Friends tile and the Ventures tile keep only this row for the shared part (people
 * met at events, Connect requests, people to build with), with the number of requests waiting when there are some.
 */
export function PeopleRow({ href = "/v/people", title, sub, waiting = 0 }: { href?: string; title: string; sub: string; waiting?: number }) {
  return (
    <Link href={href} className="bg-card hover:bg-accent flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 transition">
      <span className="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"><UsersRoundIcon className="size-5" /></span>
      <span className="grid min-w-0 flex-1">
        <span className="truncate font-medium">{title}</span>
        <span className={cn("truncate text-sm", waiting ? "text-primary font-medium" : "text-muted-foreground")}>{waiting ? `${waiting} ${waiting === 1 ? "request" : "requests"} waiting` : sub}</span>
      </span>
      <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
    </Link>
  );
}
