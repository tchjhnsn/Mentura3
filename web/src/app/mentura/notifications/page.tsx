"use client";

// M4 Notifications, after Contra's notifications on home (data.ts CONTRA.home): tabs All, Social and Work, an unread only
// switch, and rows of replies, follows, requests and invitations, each linking to what it is about.
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Num } from "@/components/studio/bits";
import { NOTES, personOf } from "@/components/mentura/data";
import { Face, Head } from "@/components/mentura/parts";

type Tab = "All" | "Social" | "Work";

export default function Notifications() {
  const [tab, setTab] = useState<Tab>("All");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [read, setRead] = useState<Set<string>>(new Set());
  const isUnread = (id: string, u: boolean) => u && !read.has(id);
  const rows = NOTES.filter((n) => (tab === "All" || n.kind === tab) && (!unreadOnly || isUnread(n.id, n.unread)));
  const requests = NOTES.filter((n) => n.href.includes("tab=requests")).length;

  return (
    <div className="px-4 py-5 md:px-8">
      <Head n="M4" title="Notifications" job="Replies, follows, requests and invitations, split into social and work.">
        <Button size="sm" asChild><Link href="/mentura/messages?tab=requests">Review {requests} request{requests === 1 ? "" : "s"}</Link></Button>
      </Head>

      <div className="mx-auto max-w-2xl">
        <div className="relative flex flex-wrap items-center justify-between gap-3 pb-3">
          <Num n="M4.1" className="absolute -top-3 left-0" />
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>{(["All", "Social", "Work"] as const).map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}</TabsList>
          </Tabs>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm"><Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} />Unread only</label>
            <Button variant="ghost" size="sm" onClick={() => setRead(new Set(NOTES.map((n) => n.id)))}>Mark all read</Button>
          </div>
        </div>

        <ul className="relative divide-y rounded-xl border">
          <Num n="M4.2" className="absolute -top-2 right-3" />
          {rows.length ? rows.map((n) => {
            const unread = isUnread(n.id, n.unread);
            return (
              <li key={n.id} className="flex items-center gap-3 px-3 py-3">
                <Face handle={n.who} size={36} name={false} />
                <Link href={n.href} onClick={() => setRead((s) => new Set(s).add(n.id))} className={cn("min-w-0 flex-1 text-sm", !unread && "text-muted-foreground")}>
                  <span className="text-foreground font-semibold">{personOf(n.who).name}</span> {n.text}
                  <span className="text-muted-foreground block text-xs">{n.when} · {n.kind}</span>
                </Link>
                {unread ? <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-rose-500" /> : <span className="size-2 shrink-0" />}
              </li>
            );
          }) : <li className="text-muted-foreground p-6 text-sm">You are all caught up.</li>}
        </ul>
      </div>
    </div>
  );
}
