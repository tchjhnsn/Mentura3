import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import type { Reaction } from "@/server/reaction-store";
import { cn } from "@/lib/utils";
import { reactAction } from "./actions";

/**
 * Like and Dislike as one round control, the way video sites draw it (Torian, 2026-11-16 19:25Z, card): private,
 * used to steer Up next and For you, never shown as a count. Pressing the chosen one again takes it off.
 */
export function Reactions({ reactionKey, current, back }: { reactionKey: string; current: Reaction | null; back: string }) {
  const button = (r: Reaction, label: string, icon: React.ReactNode, edge: string) => (
    <button
      name="reaction" value={current === r ? "none" : r} aria-pressed={current === r} aria-label={current === r ? `Take off ${label.toLowerCase()}` : label} title={label}
      className={cn("hover:bg-muted/70 inline-flex h-9 items-center px-3.5 transition [&_svg]:size-4", edge, current === r && "[&_svg]:fill-current")}
    >
      {icon}
    </button>
  );
  return (
    <form action={reactAction} className="bg-muted inline-flex items-center rounded-full">
      <input type="hidden" name="key" value={reactionKey} /><input type="hidden" name="back" value={back} />
      {button("like", "Like", <ThumbsUpIcon />, "rounded-l-full")}
      <span aria-hidden className="bg-foreground/15 h-5 w-px" />
      {button("dislike", "Dislike", <ThumbsDownIcon />, "rounded-r-full")}
    </form>
  );
}
