import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, Trash2Icon, UserPlusIcon } from "lucide-react";
import { ARRANGEMENT_LABEL, ageOf, arrangement, counts, relationLabel, type Member } from "@reflect/core/household";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Segmented } from "@/components/segmented";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db/pool";
import { householdOf, openInvites } from "@/server/household-store";
import { requireUser } from "@/server/session";
import { inviteAction, leaveHouseholdAction, revokeInviteAction, startHouseholdAction } from "./actions";
import { CopyLink } from "./copy-link";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "account", label: "Account" },
  { id: "household", label: "Household" },
  { id: "connections", label: "Connections" },
  { id: "privacy", label: "Privacy" },
] as const;
type Tab = (typeof TABS)[number]["id"];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Public data Reflect reads today, and what each feeds (doc "Tiles and their connections"). */
const SOURCES: { name: string; url: string; feeds: string }[] = [
  { name: "USDA Food Plans", url: "https://www.fns.usda.gov/cnpp/usda-food-plans-cost-food-monthly-reports", feeds: "Food in your income plan" },
  { name: "IRS tax brackets, tax year 2026", url: "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets", feeds: "Taxes in your income plan" },
  { name: "Project Gutenberg, LibriVox, Open Library", url: "https://openlibrary.org", feeds: "Books and audiobooks in Scholē" },
  { name: "Apple Podcasts search, fyyd, gpodder", url: "https://fyyd.de", feeds: "Podcasts in Scholē" },
];

function Initials({ name }: { name: string }) {
  const s = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return <span aria-hidden="true" className="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold">{s || "?"}</span>;
}

function MemberRow({ m, year }: { m: Member; year: number }) {
  const age = ageOf(m, year);
  const meta = [m.relation === "self" ? null : relationLabel(m.relation), age !== null ? `${age}` : null, m.dependent ? "Dependent" : null].filter(Boolean).join(" · ");
  return (
    <li>
      <Link href={`/settings/member/${m.id}`} className="hover:bg-accent flex items-center gap-3 rounded-lg px-2 py-2 transition">
        <Initials name={m.name} />
        <span className="grid min-w-0 flex-1">
          <span className="truncate font-medium">{m.name}{m.you ? <span className="text-muted-foreground font-normal"> (you)</span> : null}</span>
          {meta ? <span className="text-muted-foreground truncate text-sm">{meta}</span> : null}
        </span>
        {!m.account ? <Badge variant="outline">No login</Badge> : null}
      </Link>
    </li>
  );
}

async function HouseholdTab({ userId, link }: { userId: string; link: string }) {
  const [h, invites] = await Promise.all([householdOf(userId), openInvites(userId)]);
  const year = new Date().getUTCFullYear();
  if (!h) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
        <div className="grid gap-1">
          <p className="font-medium">Who lives with you?</p>
          <p className="text-muted-foreground text-sm">Invite the people you live with so you plan from one household. Anyone who won&apos;t make an account, you can add yourself.</p>
        </div>
        <form action={startHouseholdAction}><Button type="submit"><UserPlusIcon />Set up your household</Button></form>
      </div>
    );
  }
  const c = counts(h.members, year);
  const names = new Map(h.members.map((m) => [m.id, m.name]));
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid">
          <p className="text-xl font-semibold">{ARRANGEMENT_LABEL[arrangement(h.members)]}</p>
          <p className="text-muted-foreground text-sm">{c.adults} {c.adults === 1 ? "adult" : "adults"}, {c.children} {c.children === 1 ? "child" : "children"}, which your income plan uses</p>
        </div>
        <form action={inviteAction.bind(null, undefined)}><Button type="submit"><UserPlusIcon />Invite someone</Button></form>
      </div>

      {link ? (
        <section aria-labelledby="link" className="grid gap-2 rounded-xl border p-4">
          <h2 id="link" className="font-semibold">Invite link</h2>
          <p className="text-muted-foreground text-sm">Send this to them. It works once, for 14 days, and is shown only now.</p>
          <CopyLink path={`/household/join/${link}`} />
        </section>
      ) : null}

      <section aria-labelledby="members" className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 id="members" className="font-semibold">Members</h2>
          <Button asChild variant="outline" size="sm"><Link href="/settings/member/new"><PlusIcon />Add someone without a login</Link></Button>
        </div>
        <ul className="-mx-2 grid">{h.members.map((m) => <MemberRow key={m.id} m={m} year={year} />)}</ul>
      </section>

      {invites.length ? (
        <section aria-labelledby="invites" className="grid gap-2">
          <h2 id="invites" className="font-semibold">Open invites</h2>
          <ul className="divide-y border-y text-sm">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                <span>{i.memberId ? `For ${names.get(i.memberId) ?? "a member"} to claim their record` : "For someone new"}<span className="text-muted-foreground">, until {new Date(i.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></span>
                <form action={revokeInviteAction.bind(null, i.id)}><Button type="submit" variant="ghost" size="icon" aria-label="Cancel invite"><Trash2Icon /></Button></form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form action={leaveHouseholdAction}><Button type="submit" variant="ghost" className="text-muted-foreground">Leave this household</Button></form>
    </div>
  );
}

/** Settings (doc "Tiles and their connections"): account, household, connections and privacy, one tab each. */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const tab: Tab = TABS.some((t) => t.id === one(sp.tab)) ? (one(sp.tab) as Tab) : "account";
  const who = tab === "account" ? (await db().query(`SELECT name, email FROM "user" WHERE id = $1`, [user.id])).rows[0] : null;
  return (
    <main className={PAGE}>
      <ThingHeader back="/" backLabel="Home" crumbs={[{ label: "Home", href: "/" }]} title="Settings" />
      <div className="mt-4 grid max-w-2xl gap-6">
        <h1 id="page-title" className="text-lg font-semibold tracking-tight">Settings</h1>
        <div className="-mx-1 overflow-x-auto px-1"><Segmented label="Settings" items={TABS.map((t) => ({ label: t.label, href: `/settings?tab=${t.id}`, on: t.id === tab }))} /></div>

        {tab === "account" ? (
          <dl className="divide-y border-y text-sm">
            <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{who?.name || "Not given"}</dd></div>
            <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{who?.email || "Not given"}</dd></div>
          </dl>
        ) : null}

        {tab === "household" ? <HouseholdTab userId={user.id} link={one(sp.link).replace(/[^A-Za-z0-9_-]/g, "")} /> : null}

        {tab === "connections" ? (
          <div className="grid gap-6">
            <section aria-labelledby="yours" className="grid gap-1">
              <h2 id="yours" className="font-semibold">Your accounts</h2>
              <p className="text-muted-foreground text-sm">No accounts are connected. Each tile shows the accounts it can use.</p>
            </section>
            <section aria-labelledby="public" className="grid gap-2">
              <h2 id="public" className="font-semibold">Public data Reflect reads</h2>
              <ul className="divide-y border-y text-sm">
                {SOURCES.map((s) => (
                  <li key={s.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
                    <a href={s.url} target="_blank" rel="noreferrer" className="font-medium underline-offset-2 hover:underline">{s.name}</a>
                    <span className="text-muted-foreground">{s.feeds}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {tab === "privacy" ? (
          <div className="grid gap-4 text-sm">
            <p>Your records are sealed with a key of your own. A household&apos;s members are sealed with the household&apos;s key, so only its members can read them.</p>
            <p>Your journal is never published.</p>
            <div><Button asChild variant="outline"><a href="/api/journal/export">Export your journal</a></Button></div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
