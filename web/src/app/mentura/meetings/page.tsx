"use client";

// M14 Meetings, after ClickUp's call beside its channel (data.ts REFS.meeting): meetings with people met in Mentura, upcoming and
// past, each with its guests and a line of prep. New meeting opens the real meetings app at /meetings.
import { useState } from "react";
import Link from "next/link";
import { CalendarDaysIcon, NotebookPenIcon, PlusIcon, VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { personOf } from "@/components/mentura/data";
import { Faces, Head } from "@/components/mentura/parts";

type Meeting = { id: string; title: string; when: string; length: string; guests: string[]; prep: string; where: "Call" | "In person" };

const UPCOMING: Meeting[] = [
  { id: "m1", title: "Haptic Plays first look", when: "Tue, Dec 2 · 10:00 AM", length: "30 min", guests: ["maya"], prep: "Bring the Lincoln High practice video and the 80 ms latency numbers.", where: "Call" },
  { id: "m2", title: "Motor driver review", when: "Sat, Dec 6 · 11:00 AM", length: "1 hr", guests: ["dev"], prep: "Send Dev the board files by Thursday so he can look before.", where: "In person" },
  { id: "m3", title: "Third Coast intro", when: "Wed, Dec 10 · 2:00 PM", length: "20 min", guests: ["priya", "maya"], prep: "Priya asked about sports hardware. Have the raise and the pilot schools ready.", where: "Call" },
];
const PAST: Meeting[] = [
  { id: "m4", title: "Hiring your first engineer", when: "Mon, Nov 17 · 4:00 PM", length: "45 min", guests: ["lena"], prep: "Notes: hire for the next six months, not the next six years.", where: "Call" },
  { id: "m5", title: "Coaching staff walk-through", when: "Thu, Nov 13 · 3:30 PM", length: "1 hr", guests: ["james", "sam"], prep: "Notes: James can open doors at two Dallas high schools.", where: "In person" },
];

export default function Meetings() {
  const [tab, setTab] = useState<"Upcoming" | "Past">("Upcoming");
  const rows = tab === "Upcoming" ? UPCOMING : PAST;
  return (
    <div className="px-4 py-5 md:px-8">
      <Head n="M14" title="Meetings" job="Meetings with the people you met here, with notes and the call.">
        <Button asChild><Link href="/meetings"><PlusIcon />New meeting</Link></Button>
      </Head>

      <div className="relative mb-4 flex gap-1" role="tablist">
        <Num n="M14.1" className="absolute -top-2 right-0" />
        {(["Upcoming", "Past"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("rounded-full px-3 py-1.5 text-sm", tab === t ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}>
            {t} <span className="text-muted-foreground tabular-nums">{(t === "Upcoming" ? UPCOMING : PAST).length}</span>
          </button>
        ))}
      </div>

      <ul className="relative divide-y rounded-xl border">
        <Num n="M14.2" className="absolute -top-2 left-4" />
        {rows.map((m) => (
          <li key={m.id}>
            <Link href="/meetings" className="hover:bg-accent/40 flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{m.title}</span>
                <span className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="flex items-center gap-1"><CalendarDaysIcon className="size-3.5" />{m.when}</span>
                  <span>{m.length}</span>
                  <span className="flex items-center gap-1"><VideoIcon className="size-3.5" />{m.where}</span>
                </span>
                <span className="text-muted-foreground mt-2 flex items-start gap-1.5 text-sm"><NotebookPenIcon className="mt-0.5 size-3.5 shrink-0" />{m.prep}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Faces handles={m.guests} size={28} />
                <span className="text-muted-foreground text-xs">{guestLine(m.guests)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground relative mt-4 rounded-xl border border-dashed p-4 text-sm">
        <Num n="M14.3" className="absolute -top-2 left-4" />
        Each meeting page holds the notes, the guests and the call. Open one to prepare, join or read back what was said.
      </p>
    </div>
  );
}

/** First names of the guests, as plain words. */
function guestLine(handles: string[]) {
  const names = handles.map((h) => personOf(h).name.split(" ")[0]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
}
