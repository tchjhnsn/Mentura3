"use client";

// People to build with and requests to build (doc "Events and connections design guide", 2026-11-18), on People you've
// met (/v/people) since the split of Home and Village and polis (2026-11-19): who wants to build, ranked by the
// interests they share with the person, each a face and a name that opens their profile, why they are shown, the
// interests shared (in the accent) and where they met. Asking someone to build needs one of the person's ventures, so
// it shows only when the page is opened from a venture (`?venture=<id>`); the venture stays on Home and only its id
// travels. Requests to build are answered here with Yes or Not now.
import * as React from "react";
import Link from "next/link";
import { CheckIcon, ClockIcon, HandshakeIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { metLine, type BuildPerson } from "@reflect/core/build";
import type { IncomingBuild } from "@/server/build-store";
import { MemberFace } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { answerBuildFromPage, askToBuildFromPage } from "@/app/life/build-actions";

const messageHref = (id: string) => `/life/friends/messages/${encodeURIComponent(id)}`;
const profile = (id: string) => `/p/${encodeURIComponent(id)}`;

function Builder({ venture, p }: { venture: string | null; p: BuildPerson }) {
  const [status, setStatus] = React.useState(p.status);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const ask = () =>
    start(async () => {
      if (!venture) return;
      const r = await askToBuildFromPage(venture, p.id);
      if (r.error) setError(r.error);
      else { setError(null); setStatus("requested"); }
    });
  const canMessage = status === "yes" || (!venture && p.via === "connection");
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Link href={profile(p.id)} className="flex min-w-0 flex-1 items-center gap-3">
        <MemberFace name={p.name} image={p.image} size={48} />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate font-medium">{p.name}</span>
          <span className="text-muted-foreground text-sm">{p.met ? metLine(p.met) : p.why}</span>
          {p.shared.length ? <span className="text-primary truncate text-sm">{p.shared.join(", ")}</span> : null}
          {error ? <span role="alert" className="text-destructive text-sm">{error}</span> : null}
        </span>
      </Link>
      {canMessage ? (
        <Button asChild variant="ghost" size="icon" aria-label={`Message ${p.name}`} title="Message"><Link href={messageHref(p.id)}><MessageCircleIcon /></Link></Button>
      ) : venture && status === "requested" ? (
        <Button variant="ghost" size="icon" disabled aria-label={`Asked ${p.name} to build`} title="Requested"><ClockIcon /></Button>
      ) : venture ? (
        <Button variant="outline" size="icon" disabled={pending} onClick={ask} aria-label={`Ask ${p.name} to build`} title="Ask to build"><HandshakeIcon /></Button>
      ) : null}
    </li>
  );
}

/** People to build with: one row each, and the way to meet some when there is no one yet. */
export function BuildPeople({ venture, people }: { venture: string | null; people: BuildPerson[] }) {
  return people.length ? (
    <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
      {people.map((p) => <Builder key={p.id} venture={venture} p={p} />)}
    </ul>
  ) : (
    <p className="text-muted-foreground text-sm">No one who builds yet. <Link href="/events" className="text-primary hover:underline">Go to an event</Link> to meet people to build with.</p>
  );
}

function BuildRequest({ r }: { r: IncomingBuild }) {
  const [done, setDone] = React.useState<{ answer: "yes" | "no"; message?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const answer = (a: "yes" | "no") =>
    start(async () => {
      const res = await answerBuildFromPage(r.id, a);
      if (res.error) setError(res.error);
      else { setError(null); setDone({ answer: a, message: res.message }); }
    });
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Link href={profile(r.from.id)} className="flex min-w-0 flex-1 items-center gap-3">
        <MemberFace name={r.from.name} image={r.from.image} size={48} />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate font-medium">{r.from.name}</span>
          <span className="text-muted-foreground text-sm">Asked you to build {r.venture.name}{r.venture.what ? `: ${r.venture.what}` : ""}</span>
          {error ? <span role="alert" className="text-destructive text-sm">{error}</span> : null}
        </span>
      </Link>
      {done ? (
        done.answer === "yes" && done.message ? (
          <Button asChild variant="ghost" size="icon" aria-label={`Message ${r.from.name}`} title="Message"><Link href={done.message}><MessageCircleIcon /></Link></Button>
        ) : <span className="text-muted-foreground text-sm">Not now</span>
      ) : (
        <span className="flex shrink-0 gap-1">
          <Button size="icon" disabled={pending} onClick={() => answer("yes")} aria-label={`Yes, build with ${r.from.name}`} title="Yes"><CheckIcon /></Button>
          <Button variant="ghost" size="icon" disabled={pending} onClick={() => answer("no")} aria-label="Not now" title="Not now"><XIcon /></Button>
        </span>
      )}
    </li>
  );
}

/** Requests to build waiting on the person, as rows in the Requests list. */
export function BuildRequestRows({ requests }: { requests: IncomingBuild[] }) {
  return <>{requests.map((r) => <BuildRequest key={r.id} r={r} />)}</>;
}
