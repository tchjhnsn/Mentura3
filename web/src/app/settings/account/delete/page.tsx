import type { Metadata } from "next";
import Link from "next/link";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { requireUser, OWNER_ID } from "@/server/session";
import { accountDeletionPlan } from "@/server/moving";
import type { AccountPlan, Team } from "@/server/teams";
import { DeleteAccountForm } from "./delete-form";

export const metadata: Metadata = { title: "Delete account" };
export const dynamic = "force-dynamic";
// Removing every team only this person is on, and their businesses, can take a while.
export const maxDuration = 300;

function Teams({ title, line, teams, members }: { title: string; line: string; teams: Team[]; members?: boolean }) {
  if (!teams.length) return null;
  return (
    <section className="grid gap-2" aria-label={title}>
      <h2 className="px-4 text-sm font-semibold">{title}</h2>
      <p className="text-muted-foreground px-4 text-sm">{line}</p>
      <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
        {teams.map((t) => (
          <li key={t.id} className="flex min-h-12 items-center gap-3 px-4 py-2">
            <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
            {members ? <Link href={`/studio/${t.slug}/members`} className="text-muted-foreground hover:text-foreground shrink-0 text-xs underline-offset-4 hover:underline">Open Members</Link> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A4 Delete account (doc "Mentura console: screens, navigation and teams", 2026-11-25): what goes with the account and
 * what stays, team by team, then the email address typed and one destructive button. A team the person alone owns with
 * other people on it holds the deletion back until someone else is an Owner or the team is deleted. */
export default async function DeleteAccountPage() {
  const user = await requireUser();
  const crumbs = [{ label: "Settings", href: "/settings" }, { label: "Account", href: "/settings/account" }];
  let body;
  if (user.id === OWNER_ID) {
    body = <p className="text-muted-foreground text-center text-sm">This site runs without sign-in, as its owner, and the owner account cannot be deleted.</p>;
  } else {
    let read: { email: string; plan: AccountPlan } | null = null;
    let error: string | null = null;
    try { read = await accountDeletionPlan(); } catch (e) { error = e instanceof Error ? e.message : "Your teams could not be read."; }
    body = !read ? (
      <p className="text-destructive text-center text-sm" role="alert">{error} Try again in a moment.</p>
    ) : (
      <>
        <p className="text-muted-foreground text-center text-sm">Your sign-in methods, your sessions, your command line sign-ins and the services you connected go, and nobody can sign in as you again. This cannot be undone.</p>
        <Teams title="Deleted with your account" line="Each of these goes with every business in it. To keep a business, transfer it to a team someone else owns first." teams={read.plan.remove} />
        <Teams title="Teams you leave" line="These carry on without you." teams={read.plan.leave} />
        <Teams title="Before you can delete your account" line="You are the only Owner of these teams and other people are on them. Make someone else an Owner on Members, or delete the team." teams={read.plan.blocked} members />
        <p className="text-muted-foreground px-4 text-xs">What you wrote for yourself is kept in history that is never rewritten, where no one can open it. What you shared with other people stays where you shared it, under the name Deleted account.</p>
        <DeleteAccountForm email={read.email} blocked={read.plan.blocked.length > 0} />
      </>
    );
  }
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/account" backLabel="Account" crumbs={crumbs} title="Delete account" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Delete account</h1>
        {body}
      </div>
    </main>
  );
}
