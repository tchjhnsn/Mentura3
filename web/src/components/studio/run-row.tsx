import Link from "next/link";
import { cn } from "@/lib/utils";
import { Num } from "./bits";
import { agentOf, ventureHref, type Run } from "./data";

const TONE: Record<Run["status"], string> = { running: "bg-emerald-500 animate-pulse", done: "bg-muted-foreground/40", held: "bg-fuchsia-600", failed: "bg-red-500" };
const WORD: Record<Run["status"], string> = { running: "Running", done: "Done", held: "Held for you", failed: "Failed" };

/** C12 Run row: one agent run, linking to its page (V10). */
export function RunRow({ run, numbered }: { run: Run; numbered?: boolean }) {
  return (
    <Link href={ventureHref(run.venture, `activity/${run.id}`)} className="hover:bg-accent/50 relative flex items-center gap-3 px-3 py-2.5">
      {numbered ? <Num n="C12" className="absolute top-0.5 right-1" /> : null}
      <span className={cn("size-2 shrink-0 rounded-full", TONE[run.status])} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{run.title}</span>
        <span className="text-muted-foreground block truncate text-xs">{agentOf(run.agent).name} · {run.started}</span>
      </span>
      <span className={cn("hidden shrink-0 text-xs sm:block", run.status === "held" ? "font-medium text-fuchsia-600" : "text-muted-foreground")}>{WORD[run.status]}</span>
      <span className="text-muted-foreground w-12 shrink-0 text-right text-xs tabular-nums">${run.cost.toFixed(2)}</span>
    </Link>
  );
}
