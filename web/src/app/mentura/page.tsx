import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpIcon, ChevronRightIcon, CircleIcon, PlusIcon, RocketIcon, UsersRoundIcon, VideoIcon } from "lucide-react";
import { stateLine } from "@reflect/core/meetings";
import { APPS } from "@reflect/core/life";
import { MemberFace } from "@/components/dash";
import { PAGE, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { meetingsOf, type MeetingRow } from "@/server/meetings-store";
import { lifeRecords } from "@/server/life-store";
import { profileSettings, selfOf } from "@/server/profile-store";
import { newMeetingAction } from "@/app/meetings/actions";

export const metadata: Metadata = { title: "Mentura" };
export const dynamic = "force-dynamic";

const upcoming = (m: MeetingRow) => m.state === "live" || m.state === "scheduled" || m.state === "draft";
const VENTURE = APPS.find((a) => a.id === "ventures")?.kinds.find((k) => k.id === "venture");
const stateLabel = (s: string | null) => VENTURE?.states?.find((x) => x.id === s)?.label ?? "An idea";

/**
 * Mentura's home (Torian, 2026-11-21: "use the 5-step algorithm on it, then use Contra for reference"). Job: know what
 * to do next with the people and ventures you build with. After Contra's dashboard: a welcome with the main acts, then
 * the chief of staff's action items (worked out from your records, like Contra's Co-Agent) with a box to ask it, then
 * the next meeting and the ventures. The right rail is the profile's completion, as Contra's "Complete profile".
 * New meeting is the one filled button.
 */
type Action = { text: string; href: string };
export default async function MenturaHome() {
  const user = await requireUser();
  const now = new Date();
  const [meetings, ventures, profile, self] = await Promise.all([
    meetingsOf(user.id, now).catch(() => [] as MeetingRow[]),
    lifeRecords(user.id, "ventures").catch(() => []),
    profileSettings(user.id).catch(() => null),
    selfOf(user.id).catch(() => ({ name: "", href: "/settings/profile" })),
  ]);
  const coming = meetings.filter(upcoming);
  const next = coming.find((m) => m.startsAt) ?? coming[0] ?? null;
  const later = coming.filter((m) => m.id !== next?.id).slice(0, 3);
  const mine = ventures.filter((v) => v.kind === "venture");
  const profileParts = profile ? [Boolean(profile.handle), Boolean(profile.line), profile.interests.length > 0] : [];
  const done = profileParts.filter(Boolean).length;
  const pct = profileParts.length ? Math.round((done / profileParts.length) * 100) : 0;
  const first = self.name.split(" ")[0] || "there";

  // What the chief of staff would bring you first, worked out from the records (no model): the profile, the
  // meetings, then each venture.
  const actions: Action[] = [];
  if (profile && !profile.handle) actions.push({ text: "Pick a handle so people can find your page", href: "/settings/profile" });
  if (profile && !profile.line) actions.push({ text: "Add one line about what you make and do", href: "/settings/profile" });
  if (profile && !profile.interests.length) actions.push({ text: "Add the interests people can find you by", href: "/settings/profile" });
  const draft = coming.find((m) => m.state === "draft");
  if (draft) actions.push({ text: `Finish the plan for ${draft.title || "your untitled meeting"}`, href: `/meetings/${draft.id}` });
  if (!coming.length) actions.push({ text: "Book your next meeting with someone you build with", href: "/meetings" });
  if (!mine.length) actions.push({ text: "Start your first venture in the Venture Studio", href: "/life/ventures" });
  for (const v of mine.filter((x) => !x.state).slice(0, 2)) actions.push({ text: `Say what ${String(v.body.name ?? "your venture")} needs now`, href: `/life/ventures/${v.id}` });

  return (
    <main className={PAGE}>
      <PageHeader title={`Welcome, ${first}`} />
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={newMeetingAction}><Button type="submit"><PlusIcon />New meeting</Button></form>
        <Button variant="outline" asChild><Link href="/life/ventures"><RocketIcon />Start a venture</Link></Button>
        <Button variant="outline" asChild><Link href="/v/people"><UsersRoundIcon />Find people</Link></Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 content-start gap-10">
          <section aria-labelledby="cos" className="rounded-xl border p-5">
            <div className="flex items-center gap-2">
              <span aria-hidden className="grid size-6 place-items-center rounded-md bg-[oklch(0.55_0.12_24)] text-xs font-semibold text-white">C</span>
              <h2 id="cos" className="font-medium">Chief of staff</h2>
              <span className="text-muted-foreground text-sm">Action items</span>
              {actions.length ? <span className="bg-foreground text-background rounded-full px-1.5 text-xs font-medium tabular-nums">{actions.length}</span> : null}
            </div>
            {actions.length ? (
              <>
                <p className="mt-3 text-sm">Here is what to do first today.</p>
                <ul className="mt-2 grid gap-1">
                  {actions.map((a) => (
                    <li key={a.text}><Link href={a.href} className="hover:bg-accent -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"><CircleIcon className="text-muted-foreground size-3.5 shrink-0" /><span className="flex-1">{a.text}</span><ChevronRightIcon className="text-muted-foreground size-4 shrink-0" /></Link></li>
                  ))}
                </ul>
              </>
            ) : <p className="text-muted-foreground mt-3 text-sm">Nothing waits for you. Ask about anything in your ventures.</p>}
            <form action="/chat" className="focus-within:ring-ring/50 mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 focus-within:ring-2">
              <label htmlFor="cos-q" className="sr-only">Ask your chief of staff</label>
              <input id="cos-q" name="q" placeholder="Ask about your ventures and meetings" className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none" />
              <Button type="submit" size="icon-sm" variant="ghost" aria-label="Ask"><ArrowUpIcon /></Button>
            </form>
          </section>

          <section aria-labelledby="next">
            <h2 id="next" className="text-muted-foreground text-sm font-medium">Next meeting</h2>
            {next ? (
              <Link href={`/meetings/${next.id}`} className="hover:bg-accent mt-3 flex items-center gap-4 rounded-xl border p-5 transition">
                <span className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg"><VideoIcon className="size-5" /></span>
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="truncate text-lg font-semibold">{next.title || "Untitled meeting"}</span>
                  <span className="text-muted-foreground text-sm">{stateLine(next, now)}</span>
                </span>
                <span className="hidden -space-x-2 sm:flex">{next.people.filter((p) => p.id !== user.id).slice(0, 4).map((p) => <span key={p.id} className="ring-background rounded-full ring-2"><MemberFace name={p.name} image={p.image} size={32} /></span>)}</span>
                <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
              </Link>
            ) : (
              <div className="text-muted-foreground mt-3 rounded-xl border border-dashed p-5 text-sm">No meetings coming up. A new meeting gets a page with notes, guests and the call.</div>
            )}
            {later.length ? (
              <ul className="mt-3 grid gap-1">
                {later.map((m) => (
                  <li key={m.id}><Link href={`/meetings/${m.id}`} className="hover:bg-accent flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"><span className="truncate">{m.title || "Untitled meeting"}</span><span className="text-muted-foreground shrink-0">{stateLine(m, now)}</span></Link></li>
                ))}
              </ul>
            ) : null}
            <Link href="/meetings" className="text-muted-foreground hover:text-foreground mt-2 inline-block text-sm">All meetings</Link>
          </section>

          <section aria-labelledby="studio">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="studio" className="text-muted-foreground text-sm font-medium">Venture Studio</h2>
              <Link href="/life/ventures" className="text-muted-foreground hover:text-foreground text-sm">Open the studio</Link>
            </div>
            {mine.length ? (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {mine.map((v) => (
                  <li key={v.id}>
                    <Link href={`/life/ventures/${v.id}`} className="hover:bg-accent flex h-full items-start gap-3 rounded-xl border p-4 transition">
                      <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg"><RocketIcon className="size-4" /></span>
                      <span className="grid min-w-0 gap-0.5">
                        <span className="truncate font-medium">{String(v.body.name ?? "A venture")}</span>
                        <span className="text-muted-foreground truncate text-sm">{[stateLabel(v.state), v.body.what ? String(v.body.what) : null].filter(Boolean).join(" · ")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Link href="/life/ventures" className="hover:bg-accent mt-3 flex items-center gap-4 rounded-xl border border-dashed p-5 transition">
                <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg"><RocketIcon className="size-4" /></span>
                <span className="grid gap-0.5"><span className="font-medium">Start a venture</span><span className="text-muted-foreground text-sm">A business, a side business, a store or a practice.</span></span>
              </Link>
            )}
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <Link href="/settings/profile" className="hover:bg-accent flex items-center gap-3 rounded-xl border p-4 transition">
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums" style={{ background: `conic-gradient(var(--foreground) ${pct * 3.6}deg, var(--muted) 0)` }}>
              <span className="bg-background grid size-9 place-items-center rounded-full">{pct}%</span>
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="font-medium">{pct === 100 ? "Your profile" : "Complete your profile"}</span>
              <span className="text-muted-foreground truncate text-sm">{profile?.line ?? "So the right people can find you"}</span>
            </span>
          </Link>
          <Link href="/v/people" className="hover:bg-accent flex items-center gap-3 rounded-xl border p-4 transition">
            <UsersRoundIcon className="size-4 shrink-0" />
            <span className="grid flex-1"><span className="font-medium">People</span><span className="text-muted-foreground text-sm">The people you've met and want to build with</span></span>
            <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
          </Link>
        </aside>
      </div>
    </main>
  );
}
