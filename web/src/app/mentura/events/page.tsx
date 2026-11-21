"use client";

// M10 Events, after Contra's home and its event cards: tabs for upcoming, going and hosting, events as large rows with
// the date block, host and who is going, and a dialog to host an event (?new=1 opens it).
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPinIcon, QrCodeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Num } from "@/components/studio/bits";
import { EVENTS, ME, SCREENS, type Event } from "@/components/mentura/data";
import { Face, Faces, Head } from "@/components/mentura/parts";

const TABS = ["Upcoming", "Going", "Hosting"] as const;
type Tab = (typeof TABS)[number];
const job = SCREENS.find((s) => s.id === "M10")?.job;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function EventsPage() {
  return <Suspense><Events /></Suspense>;
}

function Events() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [mine, setMine] = useState<Event[]>([]);
  const [open, setOpen] = useState(() => params.get("new") === "1");

  const all = [...mine, ...EVENTS];
  const shown = all.filter((e) => (tab === "Going" ? e.going.includes(ME) : tab === "Hosting" ? e.host === ME : true));
  const add = (e: Event) => { setMine((m) => [e, ...m]); setTab("Hosting"); setOpen(false); };

  return (
    <div className="px-4 py-5 md:px-8">
      <Head n="M10" title="Events" job={job}>
        <Button size="sm" onClick={() => setOpen(true)}>Host an event</Button>
      </Head>

      <div className="relative flex gap-1 overflow-x-auto border-b pb-px">
        <Num n="M10.1" className="absolute -top-2 right-0" />
        {TABS.map((t) => {
          const count = all.filter((e) => (t === "Going" ? e.going.includes(ME) : t === "Hosting" ? e.host === ME : true)).length;
          return (
            <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t}
              className={cn("-mb-px shrink-0 border-b-2 px-3 py-2 text-sm", tab === t ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent")}>
              {t} <span className="text-muted-foreground text-xs">{count}</span>
            </button>
          );
        })}
      </div>

      <section className="relative mt-5 space-y-3">
        <Num n="M10.2" className="absolute -top-2 right-0" />
        {shown.length ? shown.map((e) => <BigRow key={e.id} ev={e} />) : (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">{tab === "Hosting" ? "You are not hosting anything yet. Host a dinner or a meetup for the people you follow." : "You have not taken a seat yet. Pick one from Upcoming."}</p>
        )}
      </section>

      <p className="text-muted-foreground relative mt-6 flex items-start gap-2 text-sm">
        <Num n="M10.3" className="absolute -top-2 right-0" />
        <QrCodeIcon className="mt-0.5 size-4 shrink-0" />
        <span>Check-in at the door still uses the existing QR check-in. Show your code from the event page.</span>
      </p>

      <HostDialog open={open} onOpenChange={setOpen} onAdd={add} n={mine.length} />
    </div>
  );
}

function BigRow({ ev }: { ev: Event }) {
  const [mon, day] = ev.day.split(" ");
  const left = ev.seats !== undefined ? Math.max(ev.seats - ev.going.length, 0) : undefined;
  return (
    <article className="bg-card hover:border-foreground/30 relative flex gap-4 rounded-xl border p-4 md:p-5">
      <span className="bg-muted grid size-16 shrink-0 place-items-center content-center rounded-xl text-center leading-tight">
        <span className="text-muted-foreground block text-[11px] font-semibold">{mon}</span><span className="block text-2xl font-semibold">{day}</span>
      </span>
      <span className="min-w-0 flex-1 space-y-2">
        <span className="block">
          <span className="text-muted-foreground block text-xs">{ev.kind} · {ev.when}</span>
          <Link href={`/mentura/events/${ev.id}`} className="block text-base font-semibold leading-snug after:absolute after:inset-0 after:rounded-xl hover:underline md:text-lg">{ev.title}</Link>
          <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-sm"><MapPinIcon className="size-3.5 shrink-0" /><span className="truncate">{ev.place}</span></span>
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="relative z-10 min-w-0"><Face handle={ev.host} size={28} sub="Host" /></span>
          <span className="relative z-10 flex items-center gap-2 text-xs"><Faces handles={ev.going} size={22} /><span className="text-muted-foreground">{ev.going.length} going</span></span>
          {left !== undefined ? <span className={cn("text-xs font-medium", left <= 3 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>{left} seats left</span> : <span className="text-muted-foreground text-xs">Open seating</span>}
        </span>
      </span>
    </article>
  );
}

function HostDialog({ open, onOpenChange, onAdd, n }: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (e: Event) => void; n: number }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:30");
  const [place, setPlace] = useState("");
  const [seats, setSeats] = useState("12");
  const ok = title.trim() && date && place.trim();

  const submit = () => {
    if (!ok) return;
    const d = new Date(`${date}T${time || "18:00"}`);
    const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    const when = d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).replace(/, (\d{1,2}:\d{2})/, " · $1");
    const s = parseInt(seats, 10);
    onAdd({ id: `mine-${n}`, title: title.trim(), when, day: label, place: place.trim(), host: ME, going: [ME], seats: Number.isFinite(s) && s > 0 ? s : undefined, kind: "Meetup", about: "" });
    setTitle(""); setDate(""); setPlace(""); setSeats("12");
  };

  const field = "grid gap-1.5 text-sm";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Host an event</DialogTitle>
          <DialogDescription>People who follow you see it on their home and in Events.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <label className={field}><span className="font-medium">Title</span><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Founder breakfast: first customers" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className={field}><span className="font-medium">Date</span><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className={field}><span className="font-medium">Time</span><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          </div>
          <label className={field}><span className="font-medium">Place</span><Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Address, or Online" /></label>
          <label className={field}><span className="font-medium">Seats</span><Input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} /></label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="outline" disabled={!ok}>Add event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
