"use client";

// The same cards as ../../chat/registry.tsx, drawn with shadcn instead of the app's own CSS.
import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CalendarIcon, GraduationCapIcon, HouseIcon, MessageCircleIcon, MessageSquareIcon, PhoneIcon } from "lucide-react";
import { LIFELINE } from "@reflect/core/crisis";
import { defineRegistry } from "@json-render/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addBookFromChat, keepClaimFromChat, addItemFromChat, undoFromChat, approveFromChat, declineFromChat } from "./actions";
import { catalog } from "./catalog";

function Tap({ label, doneText, already, run }: { label: string; doneText: string; already?: boolean; run: () => Promise<void> }) {
  const [tap, setTap] = useState<"idle" | "busy" | "done" | "failed">(already ? "done" : "idle");
  if (tap === "done") return <Badge variant="secondary">{doneText}</Badge>;
  return (
    <div className="flex items-center gap-2">
      {tap === "failed" ? <span className="text-destructive text-xs">Didn't go through.</span> : null}
      <Button
        size="sm"
        disabled={tap === "busy"}
        onClick={async () => {
          setTap("busy");
          try {
            await run();
            setTap("done");
          } catch {
            setTap("failed");
          }
        }}
      >
        {label}
      </Button>
    </div>
  );
}

/**
 * A held change (Ask Reflect plan, step 3): exactly what will happen, one button for its tier (Keep for a shared
 * record, Send for one that leaves Reflect) and Decline as a small secondary. Nothing happens until a tap.
 */
export function Approval({ change, title, preview, tap, from }: { change: string; title: string; preview: string; tap: "Keep" | "Send"; from?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "kept" | "declined" | "failed">("idle");
  const act = (run: () => Promise<void>, done: "kept" | "declined") => async () => {
    setState("busy");
    try {
      await run();
      setState(done);
    } catch {
      setState("failed");
    }
  };
  return (
    <div className="rounded-lg border bg-card p-4 shadow-xs">
      <div className="text-muted-foreground text-xs">{["Waiting for you", from].filter(Boolean).join(" · ")}</div>
      <div className="mt-1 font-medium">{title}</div>
      <p className="text-muted-foreground mt-1 mb-3 whitespace-pre-line text-sm">{preview}</p>
      {state === "kept" ? <Badge variant="secondary">{tap === "Send" ? "Sent" : "Kept"}</Badge>
        : state === "declined" ? <Badge variant="outline">Declined</Badge>
        : (
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={state === "busy"} onClick={act(() => approveFromChat(change), "kept")}>{tap}</Button>
            <Button size="sm" variant="ghost" disabled={state === "busy"} onClick={act(() => declineFromChat(change), "declined")}>Decline</Button>
            {state === "failed" ? <span className="text-destructive text-xs">Didn't go through.</span> : null}
          </div>
        )}
    </div>
  );
}

export const { registry } = defineRegistry(catalog, {
  components: {
    Stack: ({ children }) => <div className="mt-3 flex flex-col gap-2">{children}</div>,
    Shelf: ({ props }) => (
      <div className="rounded-lg border bg-card p-4 shadow-xs">
        <div className="text-muted-foreground mb-1 flex justify-between text-xs"><span>Shelf</span><span>{props.id}</span></div>
        <div className="font-medium">{props.name}</div>
        <p className="text-muted-foreground mt-1 text-sm">{[...props.books, ...props.subjects].join(", ") || "Empty"}</p>
      </div>
    ),
    LibraryBook: ({ props }) => (
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3 shadow-xs">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{props.title}</div>
          <div className="text-muted-foreground truncate text-xs">{props.by} · {props.shelf}</div>
        </div>
        <Tap label="Add to shelves" doneText="On your shelves" already={props.onShelves} run={() => addBookFromChat(props.entry)} />
      </div>
    ),
    Claim: ({ props }) => (
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3 shadow-xs">
        <div className="min-w-0">
          <div className="text-sm font-medium">{props.text}</div>
          {props.holders ? <div className="text-muted-foreground text-xs">Held by {props.holders}</div> : null}
        </div>
        <Badge variant="outline">{props.stance}</Badge>
      </div>
    ),
    FoundItem: ({ props }) => (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {props.image ? <img src={props.image} alt="" className="h-14 w-14 shrink-0 rounded object-cover" /> : null}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{props.title}</div>
          <div className="text-muted-foreground text-xs">{[props.medium, props.by, props.source].filter(Boolean).join(" · ")}</div>
        </div>
        {props.kept ? <Badge variant="secondary">On your shelves</Badge> : <Tap label="Add" doneText="Added" run={() => addItemFromChat(props.item)} />}
      </div>
    ),
    ProposeClaim: ({ props }) => (
      <div className="rounded-lg border bg-card p-4 shadow-xs">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Proposed claim</span>
          <Badge variant="outline">{props.stance}</Badge>
        </div>
        <div className="font-medium">{props.text}</div>
        <p className="text-muted-foreground mt-1 mb-3 text-sm">{[props.subject ? `Under ${props.subject}` : "", props.holders ? `held by ${props.holders}` : ""].filter(Boolean).join(" · ")}</p>
        <Tap label="Accept" doneText="Kept in Scholē" run={() => keepClaimFromChat(props.claim)} />
      </div>
    ),
    BrowseLink: ({ props }) => (
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={props.href}>{props.label}<ArrowRightIcon /></Link>
      </Button>
    ),
    Quote: ({ props }) => (
      <Link href={props.href} className="hover:bg-muted block rounded-lg border bg-card p-4 shadow-xs">
        <blockquote className="font-serif">{props.text}</blockquote>
        <p className="text-muted-foreground mt-2 text-xs">{props.cite}</p>
      </Link>
    ),
    Course: ({ props }) => (
      <Link href={props.href} className="hover:bg-muted block rounded-lg border bg-card p-4 shadow-xs">
        <div className="text-muted-foreground flex items-center gap-1 text-xs"><GraduationCapIcon className="size-3" />Course in Scholē · {props.units}</div>
        <div className="mt-1 font-medium">{props.title}</div>
        <p className="text-muted-foreground mt-1 text-sm">{props.goal}</p>
      </Link>
    ),
    CalendarEvent: ({ props }) => (
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-xs">
        <div className="min-w-0">
          <div className="text-muted-foreground flex items-center gap-1 text-xs"><CalendarIcon className="size-3" />Added to your calendar</div>
          <div className="truncate text-sm font-medium">{props.title}</div>
          <div className="text-muted-foreground truncate text-xs">{[props.day, props.when, props.tile].filter(Boolean).join(" · ")}</div>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href={props.href}>Open in calendar<ArrowRightIcon /></Link>
        </Button>
      </div>
    ),
    UndoChange: ({ props }) => (
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-muted-foreground text-xs">{props.text}</span>
        <Tap label="Undo" doneText="Undone" run={() => undoFromChat(props.change)} />
      </div>
    ),
    Approval: ({ props }) => <Approval change={props.change} title={props.title} preview={props.preview} tap={props.tap} />,
    HomeCard: ({ props }) => (
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-xs">
        <div className="min-w-0">
          <div className="text-muted-foreground flex items-center gap-1 text-xs"><HouseIcon className="size-3" />On Home · {props.tile} · {props.until}</div>
          <div className="truncate text-sm font-medium">{props.title}</div>
          {props.lines.map((l, i) => <div key={i} className="text-muted-foreground line-clamp-2 text-xs">{l}</div>)}
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href="/">Open Home<ArrowRightIcon /></Link>
        </Button>
      </div>
    ),
    Budget: ({ props }) => (
      <Link href={props.href} className="hover:bg-muted block rounded-lg border bg-card p-4 shadow-xs">
        <div className="font-medium">{props.title}</div>
        <p className="text-muted-foreground text-xs">{props.sub}</p>
        <ul className="mt-3 grid gap-2">
          {props.rows.map((r) => (
            <li key={r.label} className="grid gap-1 text-sm">
              <div className="flex justify-between gap-3"><span>{r.label}</span><span className={r.over ? "text-destructive tabular-nums" : "tabular-nums"}>{r.allot} <span className="text-muted-foreground text-xs">· {r.cost}</span></span></div>
              <div className="bg-muted relative h-2 overflow-hidden rounded-full" aria-hidden="true">
                <div className="bg-primary/60 absolute inset-y-0 left-0 rounded-full" style={{ width: `${r.allotShare * 100}%` }} />
                {r.costShare !== null ? <div className="bg-foreground absolute inset-y-0 w-0.5" style={{ left: `calc(${r.costShare * 100}% - 1px)` }} /> : null}
              </div>
            </li>
          ))}
        </ul>
      </Link>
    ),
    Lens: ({ props }) => (
      <div className="rounded-lg border bg-card p-4 shadow-xs">
        <div className="font-medium">{props.href ? <Link href={props.href} className="hover:underline">{props.title}</Link> : props.title}</div>
        <p className="text-muted-foreground text-xs">{props.works}</p>
        <ul className="mt-2 divide-y">
          {props.ideas.map((i) => (
            <li key={i.text} className="py-2">
              <p className="text-sm">{i.text}</p>
              <p className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 text-xs">
                {i.cites.map((c) => <Link key={c.href} href={c.href} className="underline-offset-4 hover:underline">{c.label}</Link>)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    ),
    Note: ({ props }) => <p className="text-muted-foreground text-sm">{props.text}</p>,
    Lifeline: () => (
      <div className="rounded-lg border bg-card p-4 shadow-xs">
        <div className="font-medium">{LIFELINE.name}</div>
        <p className="text-muted-foreground mt-1 mb-3 text-sm">Free and confidential, any time, in the US.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><a href={LIFELINE.call}><PhoneIcon />Call 988</a></Button>
          <Button asChild size="sm" variant="outline"><a href={LIFELINE.text}><MessageSquareIcon />Text 988</a></Button>
          <Button asChild size="sm" variant="outline"><a href={LIFELINE.chat} target="_blank" rel="noreferrer"><MessageCircleIcon />Chat at 988lifeline.org</a></Button>
        </div>
      </div>
    ),
  },
});
