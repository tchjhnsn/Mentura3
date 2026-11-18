"use client";

// People to build with (doc "Events and connections design guide", 2026-11-18), under Files on a venture's page: who
// wants to build, ranked by shared interests, each with a face, a name, why they are shown, the interests shared (in
// the accent), where they met, and one outline act: Ask to build, Requested (after asking) or Message (after a yes).
import * as React from "react";
import Link from "next/link";
import { askedLine, metLine, type BuildPerson } from "@reflect/core/build";
import type { IncomingBuild } from "@/server/build-store";
import { Face } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { answerBuildFromPage, askToBuildFromPage } from "./build-actions";

/** A member's face: their picture when they have one, else their initials in a circle. */
export function MemberFace({ name, image, size = 44 }: { name: string; image: string | null; size?: number }) {
  // A plain img: the picture comes from the member's sign-in provider, on any host.
  return image ? <img src={image} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} /> : <Face name={name} size={size} />;
}

function Row({ venture, p }: { venture: string; p: BuildPerson }) {
  const [status, setStatus] = React.useState(p.status);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <MemberFace name={p.name} image={p.image} />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate font-medium">{p.name}</span>
        <span className="text-muted-foreground text-xs">{p.why}</span>
        {p.shared.length ? <span className="text-primary text-sm">{p.shared.join(", ")}</span> : null}
        {p.met ? <span className="text-muted-foreground text-sm">{metLine(p.met)}</span> : null}
        {error ? <span role="alert" className="text-destructive text-sm">{error}</span> : null}
      </div>
      {status === "yes" ? (
        <Button asChild variant="outline" size="sm" className="shrink-0"><Link href={`/life/friends/messages/${encodeURIComponent(p.id)}`}>Message</Link></Button>
      ) : status === "requested" ? (
        <Button variant="outline" size="sm" className="shrink-0" disabled>Requested</Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await askToBuildFromPage(venture, p.id);
              if (r.error) setError(r.error);
              else { setError(null); setStatus("requested"); }
            })
          }
        >
          Ask to build
        </Button>
      )}
    </li>
  );
}

export function BuildPeople({ venture, people }: { venture: string; people: BuildPerson[] }) {
  return (
    <section aria-labelledby="build-title" className="grid gap-3">
      <h2 id="build-title" className="text-lg font-semibold">People to build with</h2>
      {people.length ? (
        <ul className="bg-card divide-y overflow-hidden rounded-lg border">
          {people.map((p) => <Row key={p.id} venture={venture} p={p} />)}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-sm">
          <Link href="/events" className="text-primary hover:underline">Go to an event to meet people to build with</Link>
        </p>
      )}
    </section>
  );
}

function Request({ r }: { r: IncomingBuild }) {
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
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <MemberFace name={r.from.name} image={r.from.image} size={40} />
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <span className="font-medium">{askedLine(r.venture.name, r.from.name)}</span>
        {r.venture.what ? <span className="text-muted-foreground truncate text-sm">{r.venture.what}</span> : null}
        {error ? <span role="alert" className="text-destructive text-sm">{error}</span> : null}
      </div>
      {done ? (
        done.answer === "yes" && done.message ? (
          <Button asChild variant="outline" size="sm"><Link href={done.message}>Message</Link></Button>
        ) : <span className="text-muted-foreground text-sm">Not now</span>
      ) : (
        <span className="flex gap-2">
          <Button size="sm" disabled={pending} onClick={() => answer("yes")}>Yes</Button>
          <Button variant="outline" size="sm" disabled={pending} onClick={() => answer("no")}>Not now</Button>
        </span>
      )}
    </li>
  );
}

/** Requests to build waiting on the person, on the Ventures tile; shown only when there are some. */
export function BuildRequests({ requests }: { requests: IncomingBuild[] }) {
  return (
    <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
      {requests.map((r) => <Request key={r.id} r={r} />)}
    </ul>
  );
}
