import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckIcon, QrCodeIcon } from "lucide-react";
import { sharedInterests } from "@reflect/core/events";
import { PAGE } from "@/components/page-header";
import { Face } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { hereState, type HerePerson } from "@/server/connect";
import { checkedIn, connectedAt, eventDoor, friendIds, isCheckedIn, profileOf, requestedAt } from "@/server/connect-store";
import { connectAction } from "../../connect-actions";

export const metadata: Metadata = { title: "Here" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type Status = "none" | "requested" | "friends";

/** Connect, then Requested after the tap, then a check and In Friends once both tapped. */
function ConnectState({ eventId, person, status, small }: { eventId: string; person: HerePerson; status: Status; small?: boolean }) {
  if (status === "friends") return <span className={cn("text-primary inline-flex items-center gap-1 font-medium", small ? "text-xs" : "text-sm")}><CheckIcon className="size-4" />In Friends</span>;
  if (status === "requested") return <span className={cn("text-muted-foreground", small ? "text-xs" : "text-sm")}>Requested</span>;
  return (
    <form action={connectAction.bind(null, eventId, person.id)}>
      <Button type="submit" variant="outline" size={small ? "sm" : "default"} className={small ? "h-7 px-2.5 text-xs" : ""} aria-label={`Connect with ${person.name}`}>Connect</Button>
    </form>
  );
}

/**
 * Here (doc "Events and connections design guide", 2026-11-18): who else is checked in, only for people checked in
 * and only while the event runs. People who share your interests come first, large, with their line and the shared
 * interests; then everyone here, small; then who you connected with tonight. For two hours after the end only
 * Connected tonight shows.
 */
export default async function HerePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const e = await eventDoor(id);
  if (!e) redirect("/events");
  const state = hereState(e, await isCheckedIn(id, user.id));
  if (state === "closed") redirect(`/events/${id}`);
  const error = one(sp.error);
  const [tonight, everyone, mine, requested, friends] = await Promise.all([
    connectedAt(user.id, id),
    state === "open" ? checkedIn(id) : Promise.resolve([] as HerePerson[]),
    profileOf(user.id),
    requestedAt(user.id, id),
    friendIds(user.id),
  ]);
  const others = everyone.filter((p) => p.id !== user.id);
  const statusOf = (p: HerePerson): Status => (friends.has(p.id) ? "friends" : requested.has(p.id) ? "requested" : "none");
  const shares = others.map((p) => ({ p, shared: sharedInterests(mine.interests, p.interests) })).filter((x) => x.shared.length > 0).sort((a, b) => b.shared.length - a.shared.length);
  return (
    <main className={PAGE}>
      <div className="mx-auto grid w-full max-w-3xl gap-10 pb-16">
        <header className="grid gap-1 text-center">
          <Link href={`/events/${id}`} className="text-muted-foreground hover:text-foreground text-sm">{e.title}</Link>
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{state === "ended" ? "Tonight" : "Here"}</h1>
        </header>
        {error ? <p className="text-destructive text-center text-sm">{error}</p> : null}

        {state === "open" && !others.length ? (
          <section className="grid justify-items-center gap-3 text-center">
            {e.hostName ? <Face name={e.hostName} size={96} /> : null}
            <h2 className="text-xl font-semibold">You&apos;re early</h2>
            <p className="text-muted-foreground max-w-sm text-sm">{e.hostName ? `${e.hostName} is hosting. ` : ""}People show here as they check in.</p>
          </section>
        ) : null}

        {state === "open" && shares.length ? (
          <section aria-labelledby="shares" className="grid gap-4">
            <h2 id="shares" className="text-lg font-semibold">Shares your interests</h2>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shares.map(({ p, shared }) => (
                <li key={p.id} className="grid justify-items-center gap-2 text-center">
                  <Face name={p.name} size={112} />
                  <span className="text-lg font-semibold">{p.name}</span>
                  {p.line ? <span className="text-muted-foreground max-w-xs text-sm">{p.line}</span> : null}
                  {p.builds ? <span className="text-muted-foreground text-xs">Wants to build something</span> : null}
                  <span className="text-primary max-w-xs text-sm font-medium">{shared.join(", ")}</span>
                  <ConnectState eventId={id} person={p} status={statusOf(p)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {state === "open" && others.length ? (
          <section aria-labelledby="everyone" className="grid gap-4">
            <h2 id="everyone" className="text-lg font-semibold">Everyone here</h2>
            <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-6">
              {others.map((p) => (
                <li key={p.id} className="grid justify-items-center gap-1 text-center">
                  <Face name={p.name} size={56} />
                  <span className="w-full truncate text-sm">{p.name}</span>
                  <ConnectState eventId={id} person={p} status={statusOf(p)} small />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="tonight" className="grid gap-4">
          <h2 id="tonight" className="text-lg font-semibold">Connected tonight</h2>
          {tonight.length ? (
            <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-6">
              {tonight.map((p) => (
                <li key={p.id}>
                  <Link href={`/life/friends/messages/${encodeURIComponent(p.id)}`} className="grid justify-items-center gap-1 text-center">
                    <Face name={p.name} size={56} />
                    <span className="w-full truncate text-sm">{p.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground text-sm">{state === "ended" ? "Nobody you connected with tonight." : "When you and someone both tap Connect, they show here and in Friends."}</p>}
        </section>

        {state === "open" ? (
          <footer className="grid justify-items-center gap-3 border-t pt-6">
            <Button asChild size="lg"><Link href={`/events/${id}/here/qr`}><QrCodeIcon />Your QR</Link></Button>
            <Link href={`/settings/profile?back=${encodeURIComponent(`/events/${id}/here`)}`} className="text-muted-foreground hover:text-foreground text-sm">What people see</Link>
          </footer>
        ) : null}
      </div>
    </main>
  );
}
