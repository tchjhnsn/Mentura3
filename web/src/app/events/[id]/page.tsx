import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarIcon, CheckIcon, ChevronRightIcon, ExternalLinkIcon, MapPinIcon, MoreHorizontalIcon, QrCodeIcon } from "lucide-react";
import { austinDay, dayLabel, EDDY, type EventOut } from "@reflect/core/events";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { austinLocal, canPublish, DRAFT_TITLE, eventById, isEventPart, isGoing, isPast, knownGoing, personOf, tagLine, type EventPart } from "@/server/events-store";
import { cancelEventAction, goingAction, publishEventAction, setPartAction } from "../actions";
import { Avatar, Cover, timeSpan } from "../parts";

export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  return { title: (await eventById(id, user.id).catch(() => null))?.title ?? "Event" };
}

/** Each part the host sets by tapping it, with its label and the words shown when it is not set. */
const PARTS: { id: EventPart; label: string; empty: string }[] = [
  { id: "title", label: "Name", empty: "Name it" },
  { id: "starts_at", label: "Starts", empty: "Pick the date and time" },
  { id: "ends_at", label: "Ends", empty: "Add an end" },
  { id: "venue", label: "Place", empty: "Add the place" },
  { id: "address", label: "Address", empty: "Add the address" },
  { id: "cover_url", label: "Cover", empty: "Add a cover picture's link" },
  { id: "for_whom", label: "Who it is for", empty: "Say who it is for" },
  { id: "description", label: "About", empty: "Say what it is about" },
  { id: "tags", label: "Tags", empty: "Add tags" },
];

const whenOf = (e: EventOut) => (e.startsAt ? `${dayLabel(austinDay(e.startsAt))}, ${timeSpan(e)}` : null);
const mapHref = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/** A part's value as its row shows it. */
function shown(e: EventOut, part: EventPart): string | null {
  switch (part) {
    case "title": return e.title === DRAFT_TITLE ? null : e.title;
    case "starts_at": return e.startsAt ? whenOf(e) : null;
    case "ends_at": return e.endsAt ? timeSpan({ startsAt: e.endsAt, endsAt: null }) : null;
    case "venue": return e.venue;
    case "address": return e.address;
    case "cover_url": return e.coverUrl ? "Set" : null;
    case "for_whom": return e.forWhom;
    case "description": return e.description;
    case "tags": return e.tags.length ? e.tags.join(", ") : null;
  }
}

/** A part's value as its small editor starts. */
function editValue(e: EventOut, part: EventPart): string {
  switch (part) {
    case "title": return e.title === DRAFT_TITLE ? "" : e.title;
    case "starts_at": return e.startsAt ? austinLocal(e.startsAt) : "";
    case "ends_at": return e.endsAt ? austinLocal(e.endsAt) : e.startsAt ? austinLocal(new Date(Date.parse(e.startsAt) + 2 * 3600_000).toISOString()) : "";
    case "venue": return e.venue ?? "";
    case "address": return e.address ?? "";
    case "cover_url": return e.coverUrl ?? "";
    case "for_whom": return e.forWhom ?? "";
    case "description": return e.description ?? "";
    case "tags": return e.tags.join(", ");
  }
}

/**
 * One event (doc "Events and connections design guide", per page 2): the cover, the title with Going as the one
 * filled act (Register first when it lives on another site), when and where, who you know is going, about, the host
 * and where it is from. The host's own event opens in edit mode: each part is set by tapping it, then Publish.
 */
export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const e = await eventById(id, user.id);
  if (!e) notFound();
  const host = e.hostUser === user.id;
  const editing = host && e.status !== "cancelled";
  const edit = editing && isEventPart(one(sp.edit)) ? (one(sp.edit) as EventPart) : null;
  const [going, known, hostPerson] = await Promise.all([isGoing(user.id, id), knownGoing(user.id, [id]), e.hostUser ? personOf(e.hostUser) : Promise.resolve(null)]);
  const people = known.get(id) ?? [];
  const past = isPast(e);
  const canGo = e.status === "published" && !past;
  const where = [e.venue, e.address].filter(Boolean).join(", ");

  const goingButton = canGo ? (
    <form action={goingAction.bind(null, id, !going)}>
      <Button type="submit" variant={going ? "secondary" : e.url ? "outline" : "default"} aria-pressed={going} title={going ? "Tap to take it back" : undefined} className="w-full sm:w-auto">{going ? <CheckIcon /> : null}Going</Button>
    </form>
  ) : null;
  const acts = canGo ? (
    <>
      {e.url ? <Button asChild className="flex-1 sm:flex-none"><a href={e.url} target="_blank" rel="noreferrer">Register<ExternalLinkIcon /></a></Button> : null}
      <div className="flex-1 sm:flex-none">{goingButton}</div>
    </>
  ) : null;

  return (
    <main className={cn(PAGE, canGo && "pb-24 sm:pb-6")}>
      <ThingHeader search={false} back="/events" backLabel="Events" crumbs={[{ label: "Events", href: "/events" }]} title={e.title} />

      <article className="mt-4 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-6">
        {editing && !e.coverUrl ? null : <Cover e={e} className="aspect-[2/1] w-full rounded-2xl" />}

        {e.status === "cancelled" ? <p className="bg-muted rounded-lg px-4 py-2 text-sm">This event was cancelled.</p> : null}
        {past && e.status === "published" ? <p className="text-muted-foreground text-sm">This event is over.</p> : null}
        {host && e.status === "draft" ? <p className="bg-muted rounded-lg px-4 py-2 text-sm">A draft only you see. Tap each part to set it, then Publish.</p> : null}
        {host && one(sp.published) ? <p className="bg-primary/10 rounded-lg px-4 py-2 text-sm">Published. People can find it in Events now. At the door, open Check-in and show its code.</p> : null}

        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-4">
            <h1 id="page-title" className="min-w-0 text-2xl font-bold tracking-tight break-words sm:text-3xl">{e.title}</h1>
            {acts ? <div className="hidden shrink-0 items-center gap-2 sm:flex">{acts}</div> : null}
            {host && e.status === "draft" ? (
              canPublish(e) ? <form action={publishEventAction.bind(null, id)} className="shrink-0"><Button type="submit">Publish</Button></form>
                : <Button disabled className="shrink-0" title="Name it and pick its start first">Publish</Button>
            ) : null}
            {/* Check in (events-connect) */}
          </div>
          {whenOf(e) ? <p className="flex items-center gap-2"><CalendarIcon className="text-muted-foreground size-4 shrink-0" />{whenOf(e)}</p> : null}
          {where ? <p className="flex items-start gap-2"><MapPinIcon className="text-muted-foreground mt-1 size-4 shrink-0" /><span className="min-w-0">{where}{e.address ? <> · <a href={mapHref(e.address)} target="_blank" rel="noreferrer" className="text-muted-foreground text-sm underline underline-offset-2">Map</a></> : null}</span></p> : null}
          {tagLine(e) ? <p className="text-muted-foreground text-sm">{tagLine(e)}</p> : null}
        </div>

        {host && e.status === "published" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline"><Link href={`/events/${id}/door`}><QrCodeIcon />Check-in</Link></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="More"><MoreHorizontalIcon /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <form action={cancelEventAction.bind(null, id)}>
                  <DropdownMenuItem asChild variant="destructive"><button type="submit" className="w-full">Cancel the event</button></DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        {editing ? (
          <section aria-label="Parts" className="min-w-0">
            <ul className="divide-y rounded-xl border">
              {PARTS.map((p) => (
                <li key={p.id}>
                  {edit === p.id ? <PartEditor e={e} part={p.id} label={p.label} error={one(sp.error) || null} /> : (
                    <Link href={`?edit=${p.id}`} scroll={false} className="hover:bg-accent flex items-center gap-3 px-4 py-3 transition">
                      <span className="text-muted-foreground w-28 shrink-0 text-sm">{p.label}</span>
                      <span className={cn("min-w-0 flex-1 truncate", !shown(e, p.id) && "text-muted-foreground")}>{shown(e, p.id) ?? p.empty}</span>
                      <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {people.length ? (
          <Section title="Going that you know">
            <ul className="flex flex-wrap gap-3">
              {people.map((p) => <li key={p.id} className="flex items-center gap-2 text-sm"><Avatar p={p} />{p.name}</li>)}
            </ul>
          </Section>
        ) : null}

        {!editing && e.forWhom ? <Section title="Who it is for"><p>{e.forWhom}</p></Section> : null}
        {!editing && e.description ? <Section title="About"><p className="whitespace-pre-line">{e.description}</p></Section> : null}

        {hostPerson && !host ? (
          <Section title="Host">
            <p className="flex items-center gap-2"><Avatar p={hostPerson} />{hostPerson.name}</p>
          </Section>
        ) : null}

        <p className="text-muted-foreground border-t pt-4 text-xs">
          {e.source === "eddy" ? <a href={EDDY.href} target="_blank" rel="noreferrer" className="hover:text-foreground underline underline-offset-2">From Eddy&apos;s Austin events</a> : "Hosted in Reflect"}
          {e.url ? <> · <a href={e.url} target="_blank" rel="noreferrer" className="hover:text-foreground underline underline-offset-2">{new URL(e.url).hostname.replace(/^www\./, "")}</a></> : null}
        </p>
      </article>

      {acts ? (
        <div className="bg-background/95 fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t px-4 py-3 backdrop-blur sm:hidden">{acts}</div>
      ) : null}
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** One part's small editor, opened by tapping the part: one field, Save, and Cancel back to the event. */
function PartEditor({ e, part, label, error }: { e: EventOut; part: EventPart; label: string; error: string | null }) {
  const value = editValue(e, part);
  const field = part === "description" ? <Textarea name="value" rows={5} defaultValue={value} autoFocus aria-label={label} />
    : part === "starts_at" || part === "ends_at" ? <Input type="datetime-local" name="value" defaultValue={value} autoFocus aria-label={label} className="w-full sm:w-64" />
    : <Input name="value" defaultValue={value} autoFocus aria-label={label} type={part === "cover_url" ? "url" : "text"}
        placeholder={part === "cover_url" ? "https://..." : part === "tags" ? "Founders, AI, Free" : part === "for_whom" ? "Looking for a co-founder" : undefined} />;
  return (
    <form action={setPartAction.bind(null, e.id, part)} className="bg-muted/40 grid grid-cols-[minmax(0,1fr)] gap-2 px-4 py-3">
      <span className="text-sm font-medium">{label}{part === "starts_at" || part === "ends_at" ? <span className="text-muted-foreground font-normal"> (Austin time)</span> : null}</span>
      {field}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="outline">Save</Button>
        <Button asChild size="sm" variant="ghost"><Link href={`/events/${e.id}`} scroll={false}>Cancel</Link></Button>
      </div>
    </form>
  );
}
