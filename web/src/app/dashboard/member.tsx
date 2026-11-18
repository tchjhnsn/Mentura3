import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Face } from "@/components/dash";
import { Badge } from "@/components/ui/badge";
import { memberView } from "@/server/dashboard-today";
import { dayIn, Empty, Section } from "./parts";

const dayName = (day: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

/**
 * The dashboard of a member without a login, such as an elder or a child (`/dashboard?for=<member id>`): the next
 * two weeks of the person's calendar items that name them and the person's records that name them. Anyone else's
 * member, or one with their own login, is not found.
 */
export async function MemberDashboard({ userId, memberId }: { userId: string; memberId: string }) {
  const v = await memberView(userId, memberId).catch(() => null);
  if (!v) notFound();
  const { member, next } = v;
  const rest = v.items.filter((e) => e !== next);
  return (
    <main className="mx-auto grid min-h-screen max-w-3xl grid-cols-[minmax(0,1fr)] content-start gap-8 px-4 py-6 sm:px-6">
      <header className="flex items-center gap-3">
        <Link href="/dashboard?view=household" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"><ArrowLeftIcon className="size-4" />Household</Link>
      </header>
      <section className="flex min-w-0 items-center gap-4">
        <Face name={member.name} size={64} />
        <div className="grid min-w-0">
          <h1 className="truncate text-3xl font-semibold tracking-tight">{member.name}</h1>
          <span className="text-muted-foreground text-sm">{member.relation}{member.born ? `, born ${member.born}` : ""}{member.dependent ? ", dependent" : ""}</span>
        </div>
      </section>

      <Section title="Coming up" href={`/calendar?day=${dayIn(new Date())}`} more="Calendar">
        {next ? (
          <Link href={next.href} className="bg-card hover:bg-accent grid gap-1 rounded-xl border p-4 transition">
            <span className="text-muted-foreground text-sm font-medium">{dayName(next.day)}{next.starts ? ` · ${next.when}` : " · All day"}</span>
            <span className="text-xl font-semibold">{next.title}</span>
          </Link>
        ) : <Empty>Nothing on your calendar names {member.name} in the next two weeks.</Empty>}
        {rest.length ? (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
            {rest.slice(0, 8).map((e) => (
              <li key={`${e.id}-${e.day}`}><Link href={e.href} className="hover:bg-accent grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-1.5 text-sm"><span className="text-muted-foreground truncate">{dayName(e.day)}{e.starts ? ` ${e.when}` : ""}</span><span className="truncate">{e.title}</span></Link></li>
            ))}
          </ul>
        ) : null}
      </Section>

      <Section title="Records you keep for them" href={`/settings/member/${member.id}`} more="Their record">
        {v.records.length ? (
          <ul className="flex flex-wrap gap-2">
            {v.records.map((r) => <li key={r.id}><Link href={r.href}><Badge variant="secondary" className="max-w-64 truncate px-3 py-1 text-sm">{r.title}</Badge></Link></li>)}
          </ul>
        ) : <Empty>None of your records name {member.name} yet.</Empty>}
      </Section>
    </main>
  );
}
