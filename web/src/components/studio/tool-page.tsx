"use client";

// V18 A tool's page when it has no screen of its own yet: what it does, which records it keeps in Naive, and the process
// groups it serves, from Naive's tool catalog (./tools.ts). Its one action asks an agent to start the tool's work.
import { BotIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreenHead, useChat } from "./shell";
import { groupOf, statusOf, type Tool } from "./tools";

const KIND: Record<Tool["kind"], string> = {
  view: "Shows records and what they add up to", editor: "Creates and edits one kind of record", workflow: "Moves items through stages",
  storage: "Keeps the business's files", connection: "Links an outside service",
};
const words = (id: string) => id.replace(/-/g, " ");

export function ToolPage({ tool }: { tool: Tool }) {
  const chat = useChat();
  const status = statusOf(tool);
  const kept = [...new Set([...tool.writes, ...tool.reads])].filter((r) => r !== "*");
  return (
    <div className="pb-16">
      <ScreenHead n={tool.function === null ? "V19" : "V18"} title={tool.title} job={tool.about}>
        <Button onClick={() => chat.setOpen(true)}><BotIcon />Ask an agent to start it</Button>
      </ScreenHead>
      <div className="grid max-w-3xl gap-6 px-4 md:px-8">
        <section className="rounded-xl border p-4">
          <h2 className="text-sm font-medium">{status === "ready" ? "Naive keeps every record it needs" : "Naive keeps some of its records"}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {KIND[tool.kind]}, from the {tool.phase} phase on.
            {status === "partial" && tool.proposes?.length ? ` Still to come: ${tool.proposes.map(words).join(", ")}.` : ""}
          </p>
          {kept.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {kept.map((r) => <Badge key={r} variant="secondary">{words(r)}{tool.writes.includes(r) ? "" : " (reads)"}</Badge>)}
            </div>
          ) : null}
          {tool.paths?.length ? <p className="text-muted-foreground mt-3 text-xs">Keeps {tool.paths.join(", ")}</p> : null}
        </section>
        {tool.process_groups.length ? (
          <section>
            <h2 className="text-sm font-medium">The work it serves</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {tool.process_groups.map((g) => <li key={g} className="flex gap-2"><span className="text-muted-foreground w-10 shrink-0 tabular-nums">{g}</span><span>{groupOf(g)?.name ?? g}</span></li>)}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
