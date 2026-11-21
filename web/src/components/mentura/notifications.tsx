"use client";

// The notifications list, after Contra's notifications panel (data.ts REFS.notifications): a title with an Unread switch
// and a menu holding Mark all as read, the tabs All, Social and Work each with a dot while something in it is unread,
// and rows that open what they are about. It sits in the C14 panel beside the sidebar and on the M4 page on a phone.
import { useState } from "react";
import Link from "next/link";
import { CheckIcon, EllipsisIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { NOTES, personOf, postOf } from "./data";
import { Face } from "./parts";
import { useMentura } from "./store";

type Tab = "All" | "Social" | "Work";

export function NotificationList({ onGo, panel }: { onGo?: () => void; panel?: boolean }) {
  const { read, markRead } = useMentura();
  const [tab, setTab] = useState<Tab>("All");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const isUnread = (id: string, u: boolean) => u && !read.includes(id);
  const dot = (t: Tab) => NOTES.some((n) => (t === "All" || n.kind === t) && isUnread(n.id, n.unread));
  const rows = NOTES.filter((n) => (tab === "All" || n.kind === tab) && (!unreadOnly || isUnread(n.id, n.unread)));

  return (
    <div>
      <div className={cn("flex items-center gap-3 px-4 pt-4", !panel && "px-0")}>
        <h2 className={cn("flex-1 font-semibold", panel ? "text-base" : "sr-only")}>Notifications</h2>
        <label className="text-muted-foreground flex items-center gap-2 text-sm">Unread<Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} /></label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="More"><EllipsisIcon /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => markRead(NOTES.map((n) => n.id))}><CheckIcon />Mark all as read</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div role="tablist" className={cn("mt-2 flex gap-4 border-b px-4 text-sm", !panel && "px-0")}>
        {(["All", "Social", "Work"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("-mb-px flex items-center gap-1 border-b-2 pb-2", tab === t ? "border-foreground font-medium" : "text-muted-foreground border-transparent hover:text-foreground")}>
            {t}{dot(t) ? <span aria-hidden className="size-1.5 rounded-full bg-rose-500" /> : null}
          </button>
        ))}
      </div>
      <ul className="divide-y">
        {rows.length ? rows.map((n) => {
          const unread = isUnread(n.id, n.unread);
          const post = n.href.startsWith("/mentura/post/") ? postOf(n.href.split("/").pop()!) : null;
          return (
            <li key={n.id}>
              <Link href={n.href} onClick={() => { markRead([n.id]); onGo?.(); }} className={cn("hover:bg-accent/50 flex gap-3 py-3", panel ? "px-4" : "px-1")}>
                <Face handle={n.who} size={36} name={false} plain />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="flex items-start gap-1.5">
                    {unread ? <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500" /> : null}
                    <span className={cn(!unread && "text-muted-foreground")}><span className="text-foreground font-semibold">{personOf(n.who).name}</span> {n.text}</span>
                  </span>
                  {post ? <span className="text-muted-foreground mt-1.5 line-clamp-2 block rounded-lg border p-2 text-xs">{post.text}</span> : null}
                  <span className="text-muted-foreground mt-1 block text-xs">{n.when} ago · {n.kind}</span>
                </span>
              </Link>
            </li>
          );
        }) : <li className="text-muted-foreground flex items-center gap-2 p-6 text-sm"><CheckIcon className="size-4" />You are all caught up.</li>}
      </ul>
    </div>
  );
}
