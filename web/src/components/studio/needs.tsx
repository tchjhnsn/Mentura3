// "Needs you" and briefings for a real business (round 5, doc "Mentura console: screens, navigation and teams", "Person
// and agent: what changes on screen"): the business home leads with the decisions waiting on the person, in the order
// of Naive's decision index, then "Done by agents" as a briefing per function (Naive's levels 1 and 2, EE-180). Each
// function page opens with its own briefing and its activities, marked as the person's or an agent's. Server components
// over src/app/studio/actions.ts.
import Link from "next/link";
import type { ReactNode } from "react";
import { functionBriefing, ventureHome } from "@/app/studio/actions";
import { Button } from "@/components/ui/button";
import type { FunctionBriefing, Needs, NeedsDecision, RuledActivity } from "@/server/naive";
import type { TeamRole } from "@/server/teams-core";
import { businessHref, fnOf, type FunctionId } from "./data";
import { actionable, briefingLine, doneByLine, dueLine, functionLabel, sourceLine, unlocksLine } from "./needs-format";
import { ScreenHead } from "./shell";

/** Where a decision opens: its row on the business's Decisions page. */
export const decisionHref = (team: string, slug: string, id: string) => `${businessHref(team, slug, "decisions")}#decision-${encodeURIComponent(id)}`;

/** V1 Home for a real business. */
export async function RealHome({ id, team }: { id: string; team: string }) {
  const r = await ventureHome(id, team);
  if (!r.ok) return <p className="px-4 pt-8 text-sm md:px-8">{r.error}</p>;
  const { venture, needs, briefing, role } = r.value;
  const slug = encodeURIComponent(id);
  return (
    <div className="pb-16">
      <ScreenHead n="V1" title={venture.name} job={`${venture.phase[0]?.toUpperCase() ?? ""}${venture.phase.slice(1)} phase${venture.founder ? `, founded by ${venture.founder}` : ""}.`} />
      <div className="max-w-3xl space-y-10 px-4 md:px-8">
        <NeedsYou needs={needs} role={role} team={team} slug={slug} title="Needs you" filled />
        <section aria-labelledby="done-by-agents">
          <h2 id="done-by-agents" className="text-sm font-semibold">Done by agents</h2>
          {briefing.briefing.length ? (
            <ul className="mt-2 divide-y rounded-xl border">
              {briefing.briefing.map((f) => (
                <li key={f.function}>
                  <Link href={businessHref(team, slug, `functions/${f.function}`)} className="hover:bg-accent block px-4 py-3">
                    <span className="text-sm font-medium">{functionLabel(f.function)}</span>
                    <span className="text-muted-foreground block text-sm">{briefingLine(f)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">No functions are turned on for this business yet, so there is no work to hand to agents.</p>
          )}
        </section>
      </div>
    </div>
  );
}

/** The decisions waiting on the person. On the home the top one carries the screen's one filled button. */
function NeedsYou({ needs, role, team, slug, title, filled, only }: { needs: Needs; role: TeamRole; team: string; slug: string; title: string; filled?: boolean; only?: (d: NeedsDecision) => boolean }) {
  const all = only ? needs.decisions.filter(only) : needs.decisions;
  const mine = actionable(all, role);
  return (
    <section aria-labelledby="needs-you">
      <h2 id="needs-you" className="text-sm font-semibold">{title}</h2>
      {mine.length ? (
        <ol className="mt-2 divide-y rounded-xl border" aria-label="Decisions waiting on you">
          {mine.map((d, i) => <NeedsRow key={d.id} d={d} href={decisionHref(team, slug, d.id)} top={filled && i === 0} />)}
        </ol>
      ) : (
        <div className="mt-2 rounded-xl border px-4 py-3 text-sm">
          <p className="font-medium">Nothing needs you.</p>
          <p className="text-muted-foreground mt-0.5">
            {role === "viewer" && all.length
              ? `You are a Viewer here, so the ${all.length === 1 ? "decision" : `${all.length} decisions`} waiting go to the team's Owners and Members.`
              : needs.last_decided ? `The last thing you decided: ${needs.last_decided.question}` : "Decisions show here when one waits on you."}
          </p>
        </div>
      )}
      {mine.length && needs.held && !only ? <p className="text-muted-foreground mt-2 text-xs">{needs.held} more wait until one of these is settled.</p> : null}
    </section>
  );
}

function NeedsRow({ d, href, top }: { d: NeedsDecision; href: string; top?: boolean }) {
  const due = dueLine(d.due);
  const body = (
    <>
      <span className="text-muted-foreground block text-xs">{functionLabel(d.function)}{due ? ` · ${due}` : ""}</span>
      <span className="mt-0.5 block text-sm font-medium">{d.question}</span>
      <span className="text-muted-foreground mt-0.5 block text-sm">{unlocksLine(d)}</span>
    </>
  );
  if (top) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">{body}</div>
        <Button asChild><Link href={href}>Open decision</Link></Button>
      </li>
    );
  }
  return <li><Link href={href} className="hover:bg-accent block px-4 py-3">{body}</Link></li>;
}

/** The top of a real business's function page (V12): what needs the person in this function, then its activities, each
 * the person's or an agent's with who approves. */
export async function FunctionBrief({ id, team, fn }: { id: string; team: string; fn: FunctionId }) {
  const r = await functionBriefing(id, fn, team);
  if (!r.ok) return <p className="text-sm">{r.error}</p>;
  const { needs, briefing, role } = r.value;
  const slug = encodeURIComponent(id);
  const f = briefing.briefing[0];
  return (
    <div className="space-y-8">
      <NeedsYou needs={needs} role={role} team={team} slug={slug} title={`Needs you in ${fnOf(fn).label}`} only={(d) => d.function === fn} />
      {f ? <Activities f={f} activities={briefing.activities ?? []} listed={briefing.listed.includes(fn)} /> : null}
    </div>
  );
}

function Activities({ f, activities, listed }: { f: FunctionBriefing; activities: RuledActivity[]; listed: boolean }) {
  const yours = activities.filter((a) => a.performer === "person");
  const agents = activities.filter((a) => a.performer !== "person");
  const groupName = new Map(f.process_groups.map((g) => [g.id, g.name]));
  const unruled = f.process_groups.filter((g) => g.agent > 0);
  return (
    <section aria-labelledby="activities">
      <h2 id="activities" className="text-sm font-semibold">Activities</h2>
      <p className="text-muted-foreground mt-1 text-xs">{briefingLine(f)}{listed ? "" : " This function is not turned on for this business yet."}</p>
      <Group label="Yours" count={yours.length}>
        {yours.length ? yours.map((a) => <ActivityRow key={a.id} a={a} group={groupName.get(a.process_group)} />)
          : <li className="text-muted-foreground px-4 py-3 text-sm">No activity here needs you.</li>}
      </Group>
      <Group label="Done by agents" count={agents.length + unruled.reduce((n, g) => n + g.agent, 0)} muted>
        {agents.map((a) => <ActivityRow key={a.id} a={a} group={groupName.get(a.process_group)} muted />)}
        {unruled.map((g) => (
          <li key={g.id} className="text-muted-foreground px-4 py-2.5 text-sm">
            <span className="block">{g.name}</span>
            <span className="block text-xs">{g.agent} {g.agent === 1 ? "activity" : "activities"}. Done by an agent. No approval needed.</span>
          </li>
        ))}
      </Group>
    </section>
  );
}

function Group({ label, count, muted, children }: { label: string; count: number; muted?: boolean; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className={`text-xs font-medium ${muted ? "text-muted-foreground" : ""}`}>{label} <span className="text-muted-foreground font-normal">{count}</span></h3>
      <ul className={`mt-1.5 divide-y rounded-xl border ${muted ? "bg-muted/30" : ""}`} aria-label={label}>{children}</ul>
    </div>
  );
}

function ActivityRow({ a, group, muted }: { a: RuledActivity; group?: string; muted?: boolean }) {
  return (
    <li className={`px-4 py-2.5 ${muted ? "text-muted-foreground" : ""}`}>
      <span className={`block text-sm ${muted ? "" : "font-medium"}`}>{a.statement}</span>
      <span className="text-muted-foreground block text-xs">{[group, doneByLine(a), sourceLine(a)].filter(Boolean).join(" · ")}</span>
    </li>
  );
}
