import { PrepPanel } from "@/components/meetings/prep-panel";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarIcon, CheckIcon, ChevronRightIcon, NotebookPenIcon, XIcon } from "lucide-react";
import { agendaItems, DRAFT_MEETING_TITLE, isMeetingPart, stateLine, type Followup, type MeetingPart } from "@reflect/core/meetings";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { austinLocal } from "@/server/events-store";
import { inviteLinkOf, meetingFor, type MeetingView } from "@/server/meetings-store";
import {
  addFollowupAction, inviteGuestAction, removeFollowupAction, removeGuestAction, setCancelledAction, setFollowupDoneAction,
  setNotesAction, setNotesSharedAction, setPartAction,
} from "./actions";
import { CopyField, MoreMenu } from "./more-menu";
import { Avatar, dueLabel, joinOpensLabel, Section, whenLine } from "./parts";

export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  return { title: (await meetingFor(user.id, id).catch(() => null))?.title ?? "Meeting" };
}

/** Each part the host sets by tapping its row, with its label and the words shown when it is not set. The agenda is
 * set the same way from its own section. */
const PARTS: { id: MeetingPart; label: string; empty: string }[] = [
  { id: "title", label: "Name", empty: "Name it" },
  { id: "starts_at", label: "Starts", empty: "Pick a time" },
  { id: "minutes", label: "Length", empty: "Say how long" },
  { id: "call_url", label: "Call link (Meet or Zoom)", empty: "Add the call's link" },
];

/** A part's value as its row shows it. */
function shown(m: MeetingView, part: MeetingPart): string | null {
  switch (part) {
    case "title": return m.title === DRAFT_MEETING_TITLE ? null : m.title;
    case "starts_at": return whenLine(m);
    case "minutes": return `${m.minutes} minutes`;
    case "call_url": try { return m.callUrl ? new URL(m.callUrl).hostname.replace(/^www\./, "") : null; } catch { return m.callUrl; }
    case "agenda": return m.agenda;
    case "venture_id": return m.ventureId;
  }
}

/** A part's value as its small editor starts. */
function editValue(m: MeetingView, part: MeetingPart): string {
  switch (part) {
    case "title": return m.title === DRAFT_MEETING_TITLE ? "" : m.title;
    case "starts_at": return m.startsAt ? austinLocal(m.startsAt) : "";
    case "minutes": return String(m.minutes);
    case "call_url": return m.callUrl ?? "";
    case "agenda": return m.agenda ?? "";
    case "venture_id": return m.ventureId ?? "";
  }
}

/**
 * One meeting (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19): the title, where it stands,
 * and one filled act (Join while it is live, Share notes for the host once it ended with notes kept); who is in it,
 * as faces with names; the agenda; notes and follow-ups. The host sets each part by tapping it, invites guests by
 * email, and keeps the notes, which guests see only once shared.
 */
export default async function MeetingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const m = await meetingFor(user.id, id);
  if (!m) notFound();
  const host = m.role === "host";
  const cancelled = m.state === "cancelled";
  const editing = host && !cancelled;
  const editParam = one(sp.edit);
  const edit = editing && isMeetingPart(editParam) ? editParam : null;
  const error = one(sp.error) || null;
  const shared = !!m.notesSharedAt;
  const shareFirst = host && m.state === "ended" && !!m.notes && !shared;

  const invited = host && one(sp.invited) ? await inviteLinkOf(user.id, id, one(sp.invited)).catch(() => null) : null;
  const links = host ? await Promise.all(m.guests.map(async (g) => ({ guestId: g.id, label: g.person?.name ?? g.name ?? g.email, url: await inviteLinkOf(user.id, id, g.id).catch(() => "") }))) : [];

  const opens = joinOpensLabel(m);
  const primary = cancelled ? null
    : shareFirst ? <form action={setNotesSharedAction.bind(null, id, true)}><Button type="submit">Share notes</Button></form>
    : m.state === "live" ? <Button asChild><Link href={`/meetings/${id}/live`}>Join</Link></Button>
    : m.state === "scheduled" && opens ? <Button disabled>Join opens at {opens}</Button>
    : null;

  const items = agendaItems(m.agenda);
  const followups = m.followups ?? [];

  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meetings" backLabel="Meetings" crumbs={[{ label: "Meetings", href: "/meetings" }]} title={m.title} action={primary} />

      <article className="mt-4 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-6">
        {cancelled ? <p className="bg-muted rounded-lg px-4 py-2 text-sm">This meeting was cancelled.{host ? " Restore it from More." : ""}</p> : null}

        <div className="grid gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="grid min-w-0 gap-1">
              <h1 id="page-title" className="min-w-0 text-2xl font-bold tracking-tight break-words sm:text-3xl">{m.title}</h1>
              <p className={cn("text-sm", m.state === "live" ? "text-primary font-medium" : "text-muted-foreground")}>{stateLine(m)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* CALL_SLOT */}
              {primary}
              {host ? (
                <MoreMenu links={links.filter((l) => l.url)} cancelled={cancelled} onCancel={setCancelledAction.bind(null, id, !cancelled)}
                  notesShared={shared} onUnshare={setNotesSharedAction.bind(null, id, false)} />
              ) : null}
            </div>
          </div>
          {!host && whenLine(m) ? <p className="flex items-center gap-2 text-sm"><CalendarIcon className="text-muted-foreground size-4 shrink-0" />{whenLine(m)}</p> : null}
          {host ? (
            <div>
              <Button asChild variant="outline" size="sm"><Link href={`/meetings/${id}/prep`}><NotebookPenIcon />Prep</Link></Button>
            </div>
          ) : null}
        </div>

        {/* The host's private prep mounts here, inside `host ? ... : null` (prep/ builds it). */}
        {host && (m.state === "scheduled" || m.state === "live") ? <PrepPanel meetingId={id} hostId={user.id} /> : null}

        {invited ? (
          <div className="bg-primary/10 grid gap-2 rounded-lg px-4 py-3 text-sm">
            <p>Invited. {one(sp.emailed) === "1" ? "We emailed them this link too." : "Email is not set up here, so send them this link yourself."}</p>
            <CopyField url={invited} />
          </div>
        ) : null}

        {editing ? (
          <section aria-label="Parts" className="min-w-0">
            <ul className="divide-y rounded-xl border">
              {PARTS.map((p) => (
                <li key={p.id}>
                  {edit === p.id ? <PartEditor m={m} part={p.id} label={p.label} error={error} /> : (
                    <Link href={`?edit=${p.id}`} scroll={false} className="hover:bg-accent flex items-center gap-3 px-4 py-3 transition">
                      <span className="text-muted-foreground w-28 shrink-0 text-sm sm:w-48">{p.label}</span>
                      <span className={cn("min-w-0 flex-1 truncate", !shown(m, p.id) && "text-muted-foreground")}>{shown(m, p.id) ?? p.empty}</span>
                      <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Section title="People">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            <li className="flex items-center gap-2">
              <Avatar p={m.host} />
              <span className="grid leading-tight"><span className="font-medium">{m.host.name}</span><span className="text-muted-foreground text-xs">Host</span></span>
            </li>
            {m.guests.map((g) => {
              const name = g.person?.name ?? g.name ?? (g.email || "A guest");
              return (
                <li key={g.id} className="flex items-center gap-2">
                  <Avatar p={{ name, image: g.person?.image ?? null }} muted={!g.person} />
                  <span className="grid leading-tight">
                    <span className={cn(g.person ? "font-medium" : "text-muted-foreground")}>{name}</span>
                    {!g.person ? <span className="text-muted-foreground text-xs">invited</span> : null}
                  </span>
                  {editing ? (
                    <form action={removeGuestAction.bind(null, id, g.id)}>
                      <Button type="submit" variant="ghost" size="icon-xs" aria-label={`Remove ${name}`} title={`Remove ${name}`}><XIcon /></Button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {editing ? (
            <form action={inviteGuestAction.bind(null, id)} className="grid grid-cols-[minmax(0,1fr)] gap-2 pt-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Input name="email" type="email" required placeholder="Email" aria-label="Guest's email" autoComplete="off" />
              <Input name="name" placeholder="Name (if you like)" aria-label="Guest's name" autoComplete="off" />
              <Button type="submit" variant="outline">Invite</Button>
            </form>
          ) : null}
          {editing && one(sp.inviteError) ? <p className="text-destructive text-sm">{one(sp.inviteError)}</p> : null}
        </Section>

        {editing || items.length ? (
          <Section title="Agenda" aside={editing && edit !== "agenda" && items.length ? <Link href="?edit=agenda" scroll={false} className="hover:text-foreground underline underline-offset-2">Edit</Link> : null}>
            {edit === "agenda" ? <div className="overflow-hidden rounded-xl border"><PartEditor m={m} part="agenda" label="Agenda" error={error} /></div>
              : items.length ? (
                <ol className="grid list-decimal gap-1 pl-6">
                  {items.map((t, i) => <li key={i}>{t}</li>)}
                </ol>
              ) : (
                <Link href="?edit=agenda" scroll={false} className="hover:bg-accent text-muted-foreground flex items-center justify-between rounded-xl border px-4 py-3 transition">
                  Add the agenda, one item per line<ChevronRightIcon className="size-4 shrink-0" />
                </Link>
              )}
          </Section>
        ) : null}

        {host ? (
          <Section title="Notes" aside={shared ? "Shared with guests" : "Only you see these"}>
            <form action={setNotesAction.bind(null, id)} className="grid gap-2">
              <Textarea name="notes" rows={8} defaultValue={m.notes ?? ""} placeholder="What was said and decided." aria-label="Notes" />
              <div className="flex items-center gap-3">
                <Button type="submit" variant="outline" size="sm">Save notes</Button>
                {one(sp.saved) === "notes" ? <span className="text-muted-foreground text-sm">Saved.</span> : null}
              </div>
            </form>
            {m.notes && !shared && !shareFirst ? (
              <form action={setNotesSharedAction.bind(null, id, true)}>
                <Button type="submit" variant="ghost" size="sm">Share notes with guests</Button>
              </form>
            ) : null}
          </Section>
        ) : m.notes ? (
          <Section title="Notes"><p className="whitespace-pre-line">{m.notes}</p></Section>
        ) : m.state === "ended" ? (
          <Section title="Notes"><p className="text-muted-foreground">The host has not shared notes yet.</p></Section>
        ) : null}

        {host ? (
          <Section title="Follow-ups">
            {followups.length ? <ul className="divide-y">{followups.map((f) => <FollowupRow key={f.id} id={id} f={f} host />)}</ul> : null}
            <form action={addFollowupAction.bind(null, id)} className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto]">
              <Input name="text" required placeholder="What is to be done" aria-label="Follow-up" autoComplete="off" />
              <Input name="owner" placeholder="Who" aria-label="Who does it" autoComplete="off" />
              <Input name="due" type="date" aria-label="Due day" className="sm:w-40" />
              <Button type="submit" variant="outline">Add</Button>
            </form>
            {one(sp.followupError) ? <p className="text-destructive text-sm">{one(sp.followupError)}</p> : null}
          </Section>
        ) : m.followups && followups.length ? (
          <Section title="Follow-ups">
            <ul className="divide-y">{followups.map((f) => <FollowupRow key={f.id} id={id} f={f} host={false} />)}</ul>
          </Section>
        ) : null}

        {shared ? <p className="text-muted-foreground border-t pt-4 text-xs">Prepared and held on Mentura</p> : null}
      </article>
    </main>
  );
}

/** One follow-up: a tick box (the host's to tick), what is to be done, who and by when, and Remove for the host. */
function FollowupRow({ id, f, host }: { id: string; f: Followup; host: boolean }) {
  const box = (
    <span className={cn("grid size-5 place-items-center rounded border", f.done ? "bg-primary border-primary text-primary-foreground" : "border-input")}>
      {f.done ? <CheckIcon className="size-3.5" /> : null}
    </span>
  );
  const meta = [f.owner, f.due ? `by ${dueLabel(f.due)}` : null].filter(Boolean).join(", ");
  return (
    <li className="flex items-center gap-3 py-2">
      {host ? (
        <form action={setFollowupDoneAction.bind(null, id, f.id, !f.done)} className="flex">
          <button type="submit" role="checkbox" aria-checked={f.done} aria-label={f.done ? `Mark not done: ${f.text}` : `Mark done: ${f.text}`} className="rounded">{box}</button>
        </form>
      ) : <span role="checkbox" aria-checked={f.done} aria-disabled="true" aria-label={f.text}>{box}</span>}
      <span className="grid min-w-0 flex-1">
        <span className={cn("break-words", f.done && "text-muted-foreground line-through")}>{f.text}</span>
        {meta ? <span className="text-muted-foreground text-sm">{meta}</span> : null}
      </span>
      {host ? (
        <form action={removeFollowupAction.bind(null, id, f.id)}>
          <Button type="submit" variant="ghost" size="icon-sm" aria-label={`Remove ${f.text}`}><XIcon /></Button>
        </form>
      ) : null}
    </li>
  );
}

/** One part's small editor, opened by tapping the part: one field, Save, and Cancel back to the meeting. */
function PartEditor({ m, part, label, error }: { m: MeetingView; part: MeetingPart; label: string; error: string | null }) {
  const value = editValue(m, part);
  const field = part === "agenda" ? <Textarea name="value" rows={6} defaultValue={value} autoFocus aria-label={label} placeholder={"Introductions\nWhere the round stands\nQuestions"} />
    : part === "starts_at" ? <Input type="datetime-local" name="value" defaultValue={value} autoFocus aria-label={label} className="w-full sm:w-64" />
    : part === "minutes" ? <Input type="number" name="value" min={5} max={480} step={5} defaultValue={value} autoFocus aria-label={label} className="w-full sm:w-32" />
    : <Input name="value" defaultValue={value} autoFocus aria-label={label} type={part === "call_url" ? "url" : "text"} placeholder={part === "call_url" ? "https://meet.google.com/..." : undefined} />;
  return (
    <form action={setPartAction.bind(null, m.id, part)} className="bg-muted/40 grid grid-cols-[minmax(0,1fr)] gap-2 px-4 py-3">
      <span className="text-sm font-medium">{label}{part === "starts_at" ? <span className="text-muted-foreground font-normal"> (Austin time)</span> : part === "minutes" ? <span className="text-muted-foreground font-normal"> (minutes)</span> : part === "agenda" ? <span className="text-muted-foreground font-normal"> (one item per line)</span> : null}</span>
      {field}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="outline">Save</Button>
        <Button asChild size="sm" variant="ghost"><Link href={`/meetings/${m.id}`} scroll={false}>Cancel</Link></Button>
      </div>
    </form>
  );
}
