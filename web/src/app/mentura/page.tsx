import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, PlusIcon, RocketIcon, UsersRoundIcon, VideoIcon } from "lucide-react";
import { stateLine } from "@reflect/core/meetings";
import { APPS } from "@reflect/core/life";
import { MemberFace } from "@/components/dash";
import { PAGE, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { meetingsOf, type MeetingRow } from "@/server/meetings-store";
import { lifeRecords } from "@/server/life-store";
import { profileSettings } from "@/server/profile-store";
import { newMeetingAction } from "@/app/meetings/actions";

export const metadata: Metadata = { title: "Mentura" };
export const dynamic = "force-dynamic";

const upcoming = (m: MeetingRow) => m.state === "live" || m.state === "scheduled" || m.state === "draft";
const VENTURE = APPS.find((a) => a.id === "ventures")?.kinds.find((k) => k.id === "venture");
const stateLabel = (s: string | null) => VENTURE?.states?.find((x) => x.id === s)?.label ?? "An idea";

/**
 * Mentura's home (Torian, 2026-11-21: build Mentura looking at Contra). Job: pick up the work you do with others. The
 * next meeting leads, then the Venture Studio's ventures; a right rail holds what people see of you and the people
 * you've met. New meeting is the one filled button.
 */
export default async function MenturaHome() {
  const user = await requireUser();
  const now = new Date();
  const [meetings, ventures, profile] = await Promise.all([
    meetingsOf(user.id, now).catch(() => [] as MeetingRow[]),
    lifeRecords(user.id, "ventures").catch(() => []),
    profileSettings(user.id).catch(() => null),
  ]);
  const coming = meetings.filter(upcoming);
  const next = coming.find((m) => m.startsAt) ?? coming[0] ?? null;
  const later = coming.filter((m) => m.id !== next?.id).slice(0, 3);
  const mine = ventures.filter((v) => v.kind === "venture");
  const profileParts = profile ? [Boolean(profile.handle), Boolean(profile.line), profile.interests.length > 0] : [];
  const done = profileParts.filter(Boolean).length;

  return (
    <main className={PAGE}>
      <PageHeader title="Mentura">
        <form action={newMeetingAction}><Button type="submit"><PlusIcon />New meeting</Button></form>
      </PageHeader>
      <p className="text-muted-foreground mt-1 max-w-prose">Your ventures, your meetings and the people you build with.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 content-start gap-10">
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
          <Link href="/settings/profile" className="hover:bg-accent grid gap-3 rounded-xl border p-4 transition">
            <span className="font-medium">What people see</span>
            <span className="text-muted-foreground text-sm">{profile?.line ?? "Add a line about what you make and do, and the interests people can find you by."}</span>
            {profileParts.length ? (
              <span className="flex items-center gap-2 text-sm">
                <span className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"><span className="bg-foreground block h-full" style={{ width: `${Math.round((done / profileParts.length) * 100)}%` }} /></span>
                <span className="text-muted-foreground tabular-nums">{done} of {profileParts.length}</span>
              </span>
            ) : null}
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
