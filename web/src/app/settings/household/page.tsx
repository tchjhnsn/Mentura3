import type { Metadata } from "next";
import { LogOutIcon, PlusIcon, Trash2Icon, UserPlusIcon } from "lucide-react";
import { ARRANGEMENT_LABEL, ageOf, arrangement, counts, relationLabel } from "@reflect/core/household";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { householdOf, openInvites } from "@/server/household-store";
import { requireUser } from "@/server/session";
import { inviteAction, leaveHouseholdAction, revokeInviteAction, startHouseholdAction } from "../actions";
import { CopyLink } from "../copy-link";
import { ActionRow, COLUMN, Group, Initials, Row } from "@/components/list-rows";

export const metadata: Metadata = { title: "Household" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Settings, Household: who lives with you, as a list; members join by invite or are added without a login. */
export default async function HouseholdPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const link = one((await searchParams).link).replace(/[^A-Za-z0-9_-]/g, "");
  const [h, invites] = await Promise.all([householdOf(user.id), openInvites(user.id)]);
  const year = new Date().getUTCFullYear();
  const names = new Map((h?.members ?? []).map((m) => [m.id, m.name]));
  const c = h ? counts(h.members, year) : null;
  return (
    <main className={PAGE}>
      <ThingHeader back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Household" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">{h ? ARRANGEMENT_LABEL[arrangement(h.members)] : "Household"}</h1>
          {c ? <p className="text-muted-foreground text-sm">{c.adults} {c.adults === 1 ? "adult" : "adults"}, {c.children} {c.children === 1 ? "child" : "children"}, which your income plan uses</p> : null}
        </div>

        {!h ? (
          <Group>
            <li className="text-muted-foreground px-4 py-4 text-sm">Invite the people you live with so you plan from one household. Anyone who won&apos;t make an account, you can add yourself.</li>
            <ActionRow icon={<UserPlusIcon />} label="Set up your household" action={startHouseholdAction} />
          </Group>
        ) : (
          <>
            {link ? (
              <section aria-labelledby="link" className="bg-card grid gap-2 rounded-2xl border p-4">
                <h2 id="link" className="font-medium">Invite link</h2>
                <p className="text-muted-foreground text-sm">Send this to them. It works once, for 14 days, and is shown only now.</p>
                <CopyLink path={`/household/join/${link}`} />
              </section>
            ) : null}

            <Group title="Members" id="members">
              {h.members.map((m) => {
                const age = ageOf(m, year);
                const sub = [m.relation === "self" ? null : relationLabel(m.relation), age !== null ? `${age}` : null, m.dependent ? "Dependent" : null].filter(Boolean).join(" · ");
                return <Row key={m.id} href={`/settings/member/${m.id}`} icon={<Initials name={m.name} size="size-9 text-sm" />} label={<>{m.name}{m.you ? <span className="text-muted-foreground"> (you)</span> : null}</>} {...(sub ? { sub } : {})} {...(!m.account ? { value: "No login" } : {})} />;
              })}
              <ActionRow icon={<UserPlusIcon />} label="Invite someone" action={inviteAction.bind(null, undefined)} />
              <ActionRow icon={<PlusIcon />} label="Add someone without a login" href="/settings/member/new" />
            </Group>

            {invites.length ? (
              <Group title="Open invites" id="invites">
                {invites.map((i) => (
                  <li key={i.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-base">{i.memberId ? `For ${names.get(i.memberId) ?? "a member"} to claim their record` : "For someone new"}</span>
                      <span className="text-muted-foreground text-sm">Until {new Date(i.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </span>
                    <form action={revokeInviteAction.bind(null, i.id)}><Button type="submit" variant="ghost" size="icon" aria-label="Cancel invite"><Trash2Icon /></Button></form>
                  </li>
                ))}
              </Group>
            ) : null}

            <Group>
              <ActionRow icon={<LogOutIcon />} label="Leave this household" action={leaveHouseholdAction} danger />
            </Group>
          </>
        )}
      </div>
    </main>
  );
}
