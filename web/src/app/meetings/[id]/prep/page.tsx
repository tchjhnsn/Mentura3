import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, ExternalLinkIcon, PencilIcon, SparklesIcon } from "lucide-react";
import { rehearsedCount, stateLine, type MeetingPrep } from "@reflect/core/meetings";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { meetingFor, prepOf, type MeetingView } from "@/server/meetings-store";
import { requireUser } from "@/server/session";
import { draftPrepAction, setPrepMarkAction } from "./actions";
import { prepIsEmpty } from "./draft";
import { editing } from "./kinds";
import { AddItem, EditItem, Field, hostOf, Section } from "./parts";
import { PendingButton } from "./pending-button";

export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export const metadata: Metadata = { title: "Meeting prep" };

/** The checklist moves to the top in the thirty minutes before the start. */
const SOON_MIN = 30;
function startsSoon(m: MeetingView, now: Date): boolean {
  if (!m.startsAt || m.cancelled) return false;
  const start = Date.parse(m.startsAt);
  return now.getTime() >= start - SOON_MIN * 60_000 && now.getTime() < start;
}

/**
 * Meeting prep (design guide "Meeting prep", 2026-11-19), host only: walk into the meeting knowing every point, answer
 * and asset. Key points at the top, then questions and objections with the host's answers (each marked once
 * rehearsed), then assets with presenter notes; facts about the investor, each with its source, on the right on wide
 * screens; the checklist at the foot, or at the top in the thirty minutes before the start. Practice is the one
 * filled button. Each item is edited in place by tapping Edit.
 */
export default async function MeetingPrepPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const m = await meetingFor(user.id, id);
  if (!m || m.role !== "host") notFound();
  const prep = await prepOf(user.id, id);
  const now = new Date();
  const soon = startsSoon(m, now);
  const edit = editing(one(sp.edit));
  const add = one(sp.add);
  const error = one(sp.error) || null;
  const pageError = error && !edit && !add ? error : null;
  const { done, of } = rehearsedCount(prep);
  const empty = prepIsEmpty(prep);
  const ctx: Ctx = { id, prep, edit, add, error };

  const practice = of ? (
    <Button asChild><Link href={`/meetings/${id}/prep/practice`}>Practice</Link></Button>
  ) : <Button disabled title="Add a question first">Practice</Button>;

  return (
    <main className={PAGE}>
      <ThingHeader search={false} crumbs={[{ label: "Meetings", href: "/meetings" }, { label: m.title, href: `/meetings/${id}` }]} title="Prep" />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 id="page-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Prep</h1>
          <p className="text-muted-foreground mt-1 break-words">
            <Link href={`/meetings/${id}`} className="hover:text-foreground underline-offset-2 hover:underline">{m.title}</Link> · {stateLine(m, now)} · Only you see this
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!empty ? (
            <form action={draftPrepAction.bind(null, id)}>
              <PendingButton variant="ghost" pending="Drafting..." title="Adds drafted points, questions and asset notes; nothing you wrote is changed"><SparklesIcon />Draft more</PendingButton>
            </form>
          ) : null}
          {practice}
        </div>
      </div>

      {pageError ? <p role="alert" className="bg-muted mt-4 rounded-lg px-4 py-2 text-sm">{pageError}</p> : null}
      {one(sp.drafted) ? <p className="bg-primary/10 mt-4 rounded-lg px-4 py-2 text-sm">Drafted. Read each part and make it yours; nothing you had written was changed. Facts about the investor are yours to add, each with its source.</p> : null}

      {soon ? <div className="mt-6"><Checklist {...ctx} /></div> : null}

      {empty ? (
        <section aria-label="No prep yet" className="mt-6 grid justify-items-start gap-3 rounded-xl border border-dashed p-6">
          <h2 className="text-lg font-semibold">No prep yet</h2>
          <p className="text-muted-foreground max-w-prose text-sm">Start from a drafted outline: key points, likely questions with first answers, and notes for your assets, written from this meeting&apos;s title and agenda. Or add each part yourself below.</p>
          <form action={draftPrepAction.bind(null, id)}>
            <PendingButton variant="outline" pending="Drafting..."><SparklesIcon />Draft my prep</PendingButton>
          </form>
        </section>
      ) : null}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 content-start gap-10">
          <KeyPoints {...ctx} />
          <Section id="question" title="Questions and objections" side={of ? `${done} of ${of} rehearsed` : null}>
            <Questions {...ctx} />
          </Section>
          <Assets {...ctx} />
          {soon ? null : <Checklist {...ctx} />}
        </div>
        <aside className="min-w-0 lg:border-l lg:pl-6">
          <Investor {...ctx} />
        </aside>
      </div>
    </main>
  );
}

type Ctx = { id: string; prep: MeetingPrep; edit: { kind: string; id: string } | null; add: string; error: string | null };

const isEditing = (c: Ctx, kind: string, itemId: string) => c.edit?.kind === kind && c.edit.id === itemId;
const editHref = (c: Ctx, kind: string, itemId: string) => `/meetings/${c.id}/prep?edit=${kind}:${itemId}#${kind}`;

function EditLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild size="icon" variant="ghost" className="size-8 shrink-0">
      <Link href={href} scroll={false} aria-label={label}><PencilIcon className="size-4" /></Link>
    </Button>
  );
}

function KeyPoints(c: Ctx) {
  const { keyPoints } = c.prep;
  return (
    <Section id="point" title="Key points" side={keyPoints.length ? null : "Three to five"}>
      {keyPoints.length ? (
        <ol className="grid gap-4">
          {keyPoints.map((p, i) => (
            <li key={i} className="flex items-start gap-4">
              <span aria-hidden className="text-muted-foreground w-8 shrink-0 text-3xl leading-none font-bold tabular-nums">{i + 1}</span>
              {isEditing(c, "point", String(i)) ? (
                <div className="min-w-0 flex-1">
                  <EditItem meetingId={c.id} kind="point" itemId={String(i)} error={c.error}>
                    <Textarea name="text" rows={2} defaultValue={p} autoFocus aria-label={`Point ${i + 1}`} required maxLength={500} />
                  </EditItem>
                </div>
              ) : (
                <>
                  <p className="min-w-0 flex-1 text-lg leading-snug font-medium break-words sm:text-xl">{p}</p>
                  <EditLink href={editHref(c, "point", String(i))} label={`Edit point ${i + 1}`} />
                </>
              )}
            </li>
          ))}
        </ol>
      ) : <p className="text-muted-foreground text-sm">The points you must make before the call ends.</p>}
      {keyPoints.length < 10 ? (
        <AddItem meetingId={c.id} kind="point" label="Add a point" open={c.add === "point"} error={c.error}>
          <Textarea name="text" rows={2} aria-label="The point" placeholder="We have twelve paying customers and grow 20% a month." required maxLength={500} />
        </AddItem>
      ) : null}
    </Section>
  );
}

function Questions(c: Ctx) {
  const { questions } = c.prep;
  return (
    <>
      {questions.length ? (
        <ul className="divide-y rounded-xl border">
          {questions.map((q) => (
            <li key={q.id} className="grid gap-2 px-4 py-3">
              {isEditing(c, "question", q.id) ? (
                <EditItem meetingId={c.id} kind="question" itemId={q.id} error={c.error}>
                  <Field label="Question or objection"><Input name="question" defaultValue={q.question} autoFocus required maxLength={1000} /></Field>
                  <Field label="Your answer"><Textarea name="answer" rows={4} defaultValue={q.answer} maxLength={4000} /></Field>
                </EditItem>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 font-medium break-words">{q.question}</p>
                    <EditLink href={editHref(c, "question", q.id)} label="Edit this question" />
                  </div>
                  {q.answer ? <p className="text-muted-foreground text-sm whitespace-pre-line break-words">{q.answer}</p> : <p className="text-muted-foreground text-sm italic">No answer yet.</p>}
                  <form action={setPrepMarkAction.bind(null, c.id, "question", q.id, !q.rehearsed)}>
                    <Button type="submit" size="sm" variant={q.rehearsed ? "secondary" : "outline"} aria-pressed={q.rehearsed} title={q.rehearsed ? "Tap to take it back" : undefined}>
                      {q.rehearsed ? <><CheckIcon />Rehearsed</> : "Mark rehearsed"}
                    </Button>
                  </form>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="text-muted-foreground text-sm">The questions and objections you expect, each with your answer.</p>}
      <AddItem meetingId={c.id} kind="question" label="Add a question" open={c.add === "question"} error={c.error}>
        <Field label="Question or objection"><Input name="question" placeholder="Why now?" required maxLength={1000} /></Field>
        <Field label="Your answer"><Textarea name="answer" rows={3} maxLength={4000} /></Field>
      </AddItem>
    </>
  );
}

function Assets(c: Ctx) {
  const { assets } = c.prep;
  return (
    <Section id="asset" title="Assets">
      {assets.length ? (
        <ul className="divide-y rounded-xl border">
          {assets.map((a) => (
            <li key={a.id} className="grid gap-1 px-4 py-3">
              {isEditing(c, "asset", a.id) ? (
                <EditItem meetingId={c.id} kind="asset" itemId={a.id} error={c.error}>
                  <Field label="Name"><Input name="name" defaultValue={a.name} autoFocus required maxLength={200} /></Field>
                  <Field label="Link (optional)"><Input name="url" type="url" defaultValue={a.url ?? ""} placeholder="https://..." /></Field>
                  <Field label="Presenter notes"><Textarea name="notes" rows={3} defaultValue={a.notes} maxLength={4000} /></Field>
                </EditItem>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 font-medium break-words">
                      {a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-2 hover:underline">{a.name}<ExternalLinkIcon className="size-3.5" /></a> : a.name}
                    </p>
                    <EditLink href={editHref(c, "asset", a.id)} label={`Edit ${a.name}`} />
                  </div>
                  {a.notes ? <p className="text-muted-foreground text-sm whitespace-pre-line break-words">{a.notes}</p> : null}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="text-muted-foreground text-sm">What you will show: the deck, a one-pager, use of funds, a demo.</p>}
      <AddItem meetingId={c.id} kind="asset" label="Add an asset" open={c.add === "asset"} error={c.error}>
        <Field label="Name"><Input name="name" placeholder="Deck" required maxLength={200} /></Field>
        <Field label="Link (optional)"><Input name="url" type="url" placeholder="https://..." /></Field>
        <Field label="Presenter notes"><Textarea name="notes" rows={2} maxLength={4000} /></Field>
      </AddItem>
    </Section>
  );
}

function Investor(c: Ctx) {
  const { about } = c.prep;
  return (
    <Section id="fact" title="The investor">
      {about.length ? (
        <ul className="grid gap-3">
          {about.map((f) => (
            <li key={f.id} className="grid gap-1">
              {isEditing(c, "fact", f.id) ? (
                <EditItem meetingId={c.id} kind="fact" itemId={f.id} error={c.error}>
                  <Field label="Fact"><Textarea name="fact" rows={2} defaultValue={f.fact} autoFocus required maxLength={1000} /></Field>
                  <Field label="Source link"><Input name="source" type="url" defaultValue={f.source} required placeholder="https://..." /></Field>
                </EditItem>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 text-sm break-words">
                    {f.fact}{" "}
                    <a href={f.source} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground whitespace-nowrap underline underline-offset-2">{hostOf(f.source)}</a>
                  </p>
                  <EditLink href={editHref(c, "fact", f.id)} label="Edit this fact" />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="text-muted-foreground text-sm">What you know about them, each with the link it comes from: their fund, recent deals, what they have said in public.</p>}
      <AddItem meetingId={c.id} kind="fact" label="Add a fact" open={c.add === "fact"} error={c.error}>
        <Field label="Fact"><Textarea name="fact" rows={2} required maxLength={1000} /></Field>
        <Field label="Source link"><Input name="source" type="url" required placeholder="https://..." /></Field>
        <p className="text-muted-foreground text-xs">A fact needs its source. Without one it is not kept.</p>
      </AddItem>
    </Section>
  );
}

function Checklist(c: Ctx) {
  const { checklist } = c.prep;
  return (
    <Section id="checklist" title="Prep checklist" side={checklist.length ? `${checklist.filter((x) => x.done).length} of ${checklist.length} done` : null}>
      {checklist.length ? (
        <ul className="grid gap-1">
          {checklist.map((x) => (
            <li key={x.id}>
              {isEditing(c, "checklist", x.id) ? (
                <EditItem meetingId={c.id} kind="checklist" itemId={x.id} error={c.error}>
                  <Input name="text" defaultValue={x.text} autoFocus required maxLength={200} aria-label="Checklist item" />
                </EditItem>
              ) : (
                <div className="flex items-center gap-2">
                  <form action={setPrepMarkAction.bind(null, c.id, "checklist", x.id, !x.done)} className="min-w-0 flex-1">
                    <button type="submit" aria-pressed={x.done} className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-2 py-2 text-left">
                      <span aria-hidden className={cn("flex size-5 shrink-0 items-center justify-center rounded border", x.done && "bg-primary border-primary text-primary-foreground")}>{x.done ? <CheckIcon className="size-3.5" /> : null}</span>
                      <span className={cn("min-w-0 break-words", x.done && "text-muted-foreground line-through")}>{x.text}</span>
                    </button>
                  </form>
                  <EditLink href={editHref(c, "checklist", x.id)} label={`Edit ${x.text}`} />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      <AddItem meetingId={c.id} kind="checklist" label="Add an item" open={c.add === "checklist"} error={c.error}>
        <Input name="text" aria-label="Checklist item" placeholder="Water on the desk" required maxLength={200} />
      </AddItem>
    </Section>
  );
}
