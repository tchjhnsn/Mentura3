import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { stateWord, type Connection, type Connector } from "@reflect/core/connectors";
import { cn } from "@/lib/utils";
import { Initials } from "./list-rows";

// One connector as a row (design guide "Connections interface", Pages 1 and 3): its name, who provides it, and its
// state on the right. Connect is in the accent color; Connected has a green dot; what cannot be connected is muted.

export function ConnectorRow({ c, s }: { c: Connector; s: Connection | undefined }) {
  const state = s?.state ?? "not-connected";
  const word = stateWord(c, state);
  return (
    <li>
      <Link href={`/settings/connections/${c.id}`} className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition">
        <Initials name={c.by.split(" ")[0]!} size="size-8 text-xs" />
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-base">{c.name}</span>
          <span className="text-muted-foreground truncate text-sm">{state === "connected" && s?.detail ? s.detail : c.by}</span>
        </span>
        <span className={cn("flex shrink-0 items-center gap-1.5 text-sm", word === "Connect" ? "text-primary font-medium" : "text-muted-foreground")}>
          {state === "connected" ? <span aria-hidden="true" className="size-2 rounded-full bg-green-600" /> : null}
          {word}
        </span>
        <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
      </Link>
    </li>
  );
}
