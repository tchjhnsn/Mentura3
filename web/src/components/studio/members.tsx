"use client";

// T4 Members and its parts (doc "Mentura console: screens, navigation and teams", 2026-11-25, after Vercel's "Inviting
// a team member"): C43 Invite form, C44 Role menu, C42 Member row and the Pending list. The one action is Invite. Only an
// Owner sees the form, the role menus, Remove and Pending; a Member or Viewer reads the list. Every change is checked
// again on the server (src/server/teams-core.ts), so hiding a control is never the only door.
import { useEffect, useState, useTransition } from "react";
import { CheckIcon, CopyIcon, Loader2Icon, MoreHorizontalIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  changeRoleAction, inviteAction, removeMemberAction, resendInvitationAction, revokeInvitationAction, teamPeopleAction,
} from "@/app/studio/team-actions";
import { INVITE_DAYS, inviteEmailProblem, LAST_OWNER, ROLE_WORDS, roleLabel, TEAM_ROLES, type Invitation, type TeamMember, type TeamPeople, type TeamRole } from "@/server/teams-core";
import type { Invited } from "@/server/teams";

/** Filter and search show once the list holds more than this many people. */
const FILTER_PAST = 8;

const day = (isoDate: string) => new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** C44 Role menu: Owner, Member and Viewer, each with one line on what it can do. */
export function RoleMenu({ value, onChange, disabled, label }: { value: TeamRole; onChange: (role: TeamRole) => void; disabled?: boolean; label: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TeamRole)} disabled={disabled}>
      <SelectTrigger size="sm" className="w-28" aria-label={label}><SelectValue>{roleLabel(value)}</SelectValue></SelectTrigger>
      <SelectContent align="end">
        {TEAM_ROLES.map((r) => (
          <SelectItem key={r} value={r} className="items-start">
            <span className="grid gap-0.5 py-0.5"><span className="font-medium">{roleLabel(r)}</span><span className="text-muted-foreground max-w-56 text-xs whitespace-normal">{ROLE_WORDS[r]}</span></span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** A copy button for one invitation's link. */
function CopyLink({ link, label = "Copy link" }: { link: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(link).then(() => setCopied(true), () => setCopied(false));
    setTimeout(() => setCopied(false), 2000);
  };
  return <Button type="button" variant="outline" size="sm" onClick={copy}>{copied ? <CheckIcon /> : <CopyIcon />}{copied ? "Copied" : label}</Button>;
}

/** What Invite made: a line per address, the link to copy, and whether the email went. */
export function InviteResults({ results }: { results: Invited[] }) {
  if (!results.length) return null;
  return (
    <ul className="grid gap-2" aria-label="Invitations made">
      {results.map((r) => (
        <li key={r.invitation.id} className="bg-muted/40 flex flex-col gap-2 rounded-md p-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{r.invitation.email} <span className="text-muted-foreground font-normal">as a {roleLabel(r.invitation.role)}</span></div>
            <div className="text-muted-foreground text-xs">{r.emailed ? "We emailed the invitation. You can also send the link yourself." : "Email is not set up on this site, so send them this link yourself."}</div>
            <code className="text-muted-foreground mt-1 block truncate text-xs" data-testid="invite-link">{r.link}</code>
          </div>
          <CopyLink link={r.link} />
        </li>
      ))}
    </ul>
  );
}

type Row = { key: number; email: string; role: TeamRole };

/** C43 Invite form: email and role rows, Add more, and Invite, the one filled button. Each address becomes its own
 * invitation; the ones that fail stay in the form with the reason. */
export function InviteForm({ team, onInvited, compact }: { team: string; onInvited?: (made: Invited[]) => void; compact?: boolean }) {
  const [rows, setRows] = useState<Row[]>([{ key: 0, email: "", role: "member" }]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Invited[]>([]);
  const [pending, start] = useTransition();
  const filled = rows.filter((r) => r.email.trim());
  const problem = filled.map((r) => inviteEmailProblem(r.email)).find(Boolean) ?? null;
  const set = (key: number, change: Partial<Row>) => { setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...change } : r))); setErrors((e) => { const n = { ...e }; delete n[key]; return n; }); };

  const invite = () => start(async () => {
    const made: Invited[] = [];
    const failed: Record<number, string> = {};
    for (const r of filled) {
      const res = await inviteAction(team, { email: r.email, role: r.role });
      if (res.ok) made.push(res.value); else failed[r.key] = res.error;
    }
    setResults((x) => [...made, ...x.filter((y) => !made.some((m) => m.invitation.id === y.invitation.id))]);
    const left = rows.filter((r) => failed[r.key] !== undefined);
    setRows(left.length ? left : [{ key: Date.now(), email: "", role: "member" }]);
    setErrors(failed);
    if (made.length) onInvited?.(made);
  });

  return (
    <div className="grid gap-3">
      <form onSubmit={(e) => { e.preventDefault(); if (filled.length && !problem) invite(); }} className="grid gap-2" aria-label="Invite people">
        {rows.map((r, i) => (
          <div key={r.key} className="grid gap-1">
            <div className="flex items-center gap-2">
              <Input type="email" value={r.email} onChange={(e) => set(r.key, { email: e.target.value })} placeholder="name@example.com" aria-label={i ? `Email ${i + 1}` : "Email"} autoFocus={compact && i === 0} aria-invalid={errors[r.key] ? true : undefined} className="min-w-0 flex-1" />
              <RoleMenu value={r.role} onChange={(role) => set(r.key, { role })} label={i ? `Role ${i + 1}` : "Role"} />
              {rows.length > 1 ? <Button type="button" variant="ghost" size="icon" aria-label="Remove this row" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}><XIcon /></Button> : null}
            </div>
            {errors[r.key] ? <p className="text-destructive text-xs" role="alert">{errors[r.key]}</p> : null}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setRows((rs) => [...rs, { key: Date.now(), email: "", role: rs.at(-1)?.role ?? "member" }])}><PlusIcon />Add more</Button>
          <span className="flex-1" />
          {filled.length && problem ? <span className="text-destructive text-xs" role="alert">{problem}</span> : null}
          <Button type="submit" disabled={pending || !filled.length || !!problem}>{pending ? <Loader2Icon className="animate-spin" /> : null}Invite</Button>
        </div>
      </form>
      <InviteResults results={results} />
    </div>
  );
}

/** The person's first letter on a tint drawn from their id. */
function Face({ id, name }: { id: string; name: string }) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: `oklch(0.6 0.1 ${h})` }}>{name.slice(0, 1).toUpperCase()}</span>;
}

/** C42 Member row: face, name, email, role menu (an Owner's view) and More with Remove. */
function MemberRow({ m, owner, lastOwner, busy, onRole, onRemove }: {
  m: TeamMember; owner: boolean; lastOwner: boolean; busy: boolean; onRole: (role: TeamRole) => void; onRemove: () => void;
}) {
  // Why this row's role and Remove are locked, shown on hover.
  const locked = m.kept ? "This is their personal team, so they stay its Owner." : lastOwner && m.role === "owner" ? LAST_OWNER : null;
  return (
    <li className="flex items-center gap-3 p-3" aria-label={m.name}>
      <Face id={m.userId} name={m.name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{m.name}{m.you ? <span className="text-muted-foreground font-normal"> (you)</span> : null}</div>
        <div className="text-muted-foreground truncate text-xs">{m.email}</div>
      </div>
      {owner ? (
        locked ? (
          <Tooltip>
            <TooltipTrigger asChild><span tabIndex={0}><RoleMenu value={m.role} onChange={onRole} disabled label={`Role for ${m.name}`} /></span></TooltipTrigger>
            <TooltipContent>{locked}</TooltipContent>
          </Tooltip>
        ) : <RoleMenu value={m.role} onChange={onRole} disabled={busy} label={`Role for ${m.name}`} />
      ) : <span className="text-muted-foreground text-sm">{roleLabel(m.role)}</span>}
      {owner && !m.you && !locked ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`More for ${m.name}`} disabled={busy}><MoreHorizontalIcon /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onSelect={onRemove}>Remove from team</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      ) : owner ? <span className="w-9" aria-hidden /> : null}
    </li>
  );
}

/** One open invitation on Pending: email, role, sent date or Expired, Send again, and More with Revoke. */
function PendingRow({ inv, busy, onAgain, onRevoke, link }: { inv: Invitation; busy: boolean; onAgain: () => void; onRevoke: () => void; link: string | null }) {
  const expired = inv.state === "expired";
  return (
    <li className="flex flex-wrap items-center gap-3 p-3" aria-label={inv.email}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{inv.email}</div>
        <div className="text-muted-foreground text-xs">{roleLabel(inv.role)} · {expired ? <span className="text-destructive">Expired</span> : `Sent ${day(inv.sentAt)}`}</div>
      </div>
      {link ? <CopyLink link={link} /> : null}
      <Button variant="ghost" size="sm" onClick={onAgain} disabled={busy}>Send again</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`More for ${inv.email}`} disabled={busy}><MoreHorizontalIcon /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onSelect={onRevoke}>Revoke invitation</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/** T4 Members. */
export function Members({ team }: { team: string }) {
  const [people, setPeople] = useState<{ ok: true; value: TeamPeople } | { ok: false; error: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [find, setFind] = useState("");
  const [only, setOnly] = useState<TeamRole | "all">("all");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("members");

  const load = () => { void teamPeopleAction(team).then(setPeople); };
  useEffect(load, [team]);

  const act = async (run: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string) => {
    setBusy(true);
    setNote(null);
    const r = await run();
    setBusy(false);
    setNote(r.ok ? { ok: true, text: done } : { ok: false, text: r.error });
    load();
  };

  if (people === null) {
    return (
      <div className="grid gap-3 px-4 md:px-8" aria-label="Loading members">
        <Skeleton className="h-28 rounded-lg" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
    );
  }
  if (!people.ok) {
    return (
      <section className="px-4 md:px-8" role="alert">
        <p className="text-sm">Mentura can&apos;t read this team&apos;s people right now.</p>
        <p className="text-muted-foreground mt-1 text-xs">{people.error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => { setPeople(null); load(); }}>Try again</Button>
      </section>
    );
  }

  const { team: t, members, invitations } = people.value;
  const owner = t.role === "owner";
  const owners = members.filter((m) => m.role === "owner").length;
  const q = find.trim().toLowerCase();
  const shown = members.filter((m) => (only === "all" || m.role === only) && (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)));
  const alone = members.length === 1;

  const list = (
    <div className="grid gap-3">
      {members.length > FILTER_PAST ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search people" aria-label="Search people" className="h-8 w-56" />
          <Select value={only} onValueChange={(v) => setOnly(v as TeamRole | "all")}>
            <SelectTrigger size="sm" className="w-32" aria-label="Filter by role"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Every role</SelectItem>{TEAM_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      ) : null}
      <ul className="divide-y rounded-lg border" aria-label="People on this team">
        {shown.map((m) => (
          <MemberRow key={m.id} m={m} owner={owner} lastOwner={owners === 1} busy={busy}
            onRole={(role) => void act(() => changeRoleAction(team, m.id, role), `${m.name} is now a ${roleLabel(role)}.`)}
            onRemove={() => setRemoving(m)} />
        ))}
        {!shown.length ? <li className="text-muted-foreground p-3 text-sm">Nobody matches.</li> : null}
      </ul>
      {alone && owner ? <p className="text-muted-foreground text-sm">Invite someone to work on these businesses with you.</p> : null}
    </div>
  );

  return (
    <div className="grid gap-6 px-4 md:px-8">
      {owner ? (
        <section className="rounded-lg border p-4" aria-labelledby="invite-title">
          <h2 id="invite-title" className="text-base font-semibold">Invite people</h2>
          <p className="text-muted-foreground mb-3 text-sm">They get a link that lasts {INVITE_DAYS} days. Each person joins with the role you choose.</p>
          <InviteForm team={team} onInvited={(made) => { setLinks((l) => ({ ...l, ...Object.fromEntries(made.map((m) => [m.invitation.id, m.link])) })); load(); }} />
        </section>
      ) : (
        <p className="text-muted-foreground text-sm">You are a {roleLabel(t.role)} of this team. Only an Owner can invite people or change roles.</p>
      )}

      {note ? <p className={note.ok ? "text-muted-foreground text-sm" : "text-destructive text-sm"} role={note.ok ? "status" : "alert"}>{note.text}</p> : null}

      {owner ? (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="members">Members <span className="text-muted-foreground ml-1 tabular-nums">{members.length}</span></TabsTrigger>
            <TabsTrigger value="pending">Pending <span className="text-muted-foreground ml-1 tabular-nums">{invitations.length}</span></TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="mt-3">{list}</TabsContent>
          <TabsContent value="pending" className="mt-3">
            {invitations.length ? (
              <ul className="divide-y rounded-lg border" aria-label="Pending invitations">
                {invitations.map((inv) => (
                  <PendingRow key={inv.id} inv={inv} busy={busy} link={links[inv.id] ?? null}
                    onAgain={() => void act(async () => {
                      const r = await resendInvitationAction(team, inv.id);
                      if (r.ok) setLinks((l) => ({ ...l, [inv.id]: r.value.link }));
                      return r.ok ? { ok: true } : r;
                    }, `Sent again to ${inv.email}. The link lasts ${INVITE_DAYS} more days.`)}
                    onRevoke={() => void act(() => revokeInvitationAction(team, inv.id), `The invitation for ${inv.email} is revoked.`)} />
                ))}
              </ul>
            ) : <p className="text-muted-foreground rounded-lg border p-3 text-sm">No invitations are waiting.</p>}
          </TabsContent>
        </Tabs>
      ) : list}

      <Dialog open={!!removing} onOpenChange={(o) => { if (!o) setRemoving(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}?</DialogTitle>
            <DialogDescription>They lose access to {t.name} and every business in it at once. They can join again only if an Owner invites them.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={() => { const m = removing; setRemoving(null); if (m) void act(() => removeMemberAction(team, m.id), `${m.name} is off the team.`); }}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
