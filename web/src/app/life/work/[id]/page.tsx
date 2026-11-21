import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PenLineIcon, StarIcon } from "lucide-react";
import { kindOf, titleOf } from "@reflect/core/life";
import { itemHref } from "@reflect/core/collections";
import { recommend } from "@reflect/core/recommend";
import { MEDIA } from "@reflect/core/ways";
import { parseRef, refHref, stemsOf, tasksTouched } from "@reflect/core/work-browse";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { lifeActs, lifeRecord } from "@/server/life-store";
import { signalsOf } from "@/server/recommend";
import { listItems } from "@/server/ways-store";
import { getWork } from "@/server/work-store";
import { jobOf, mainOf, roleOf, WANTED_KINDS, workspace } from "@/server/work-space";
import LifeRecordPage from "../../[app]/[id]/page";
import { RecordForm } from "../../record";
import { actLifeAction, removeLifeAction, stateLifeAction } from "../../actions";
import { learningTowardAction, mainAction, writeTowardAction } from "../space-actions";
import { kindLabel } from "../aims";
import { Steps } from "../steps";

export const metadata: Metadata = { title: "Work" };
export const dynamic = "force-dynamic";
const MEDIUM: Record<string, string> = Object.fromEntries(MEDIA.map((m) => [m.id, m.label]));

/**
 * An aim (doc "Work design guide", Aim page): the aim and its one act, writing toward it; for a role, a link to its
 * people in Scholē's Lives (doc "Qualities design guide"); the path toward it; what was written toward it; and, at the foot,
 * the facts about the work and letting it go. Other Work records open as any record does.
 */
export default async function AimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const record = await lifeRecord(user.id, id);
  if (!record || record.app !== "work") notFound();
  if (!WANTED_KINDS.has(record.kind)) return LifeRecordPage({ params: Promise.resolve({ app: "work", id }) });
  const kind = kindOf("work", record.kind)!;
  const title = titleOf(kind, record.body);
  const back = `/life/work/${id}`;
  const job = jobOf(record);
  const role = roleOf(record);
  const ref = typeof record.body.ref === "string" ? parseRef(record.body.ref) : null;
  const letGo = record.state === "let-go";

  const [s, signals, acts, items] = await Promise.all([workspace(user.id), signalsOf(user.id), lifeActs(user.id, id), listItems(user.id)]);
  const isMain = !letGo && mainOf(s.wanted)?.record.id === id;
  const entries = (await Promise.all(acts.filter((a) => a.kind === "wrote" && a.note).map(async (a) => ({ a, w: await getWork(user.id, a.note!) })))).filter((x) => x.w);
  const talked = acts.filter((a) => a.kind === "talked");
  // Only what serves this aim: its playlists, the traits of its people, and not what the person's other marks suggest.
  const learn = recommend({ ...signals, aims: [title] }, undefined, 40).filter((p) => /^(For |Where )/.test(p.reason)).slice(0, 5);
  const chosen = new Set(typeof record.body.learning === "string" && record.body.learning ? record.body.learning.split(",") : []);
  const offered = items.filter((i) => chosen.has(i.id) || i.status !== "done" || i.subjects.length);
  const learning = items.filter((i) => chosen.has(i.id) || i.status === "doing" || i.status === "want");
  const tasks = job ? tasksTouched(job.tasks, stemsOf(learning.flatMap((i) => [i.title, ...i.subjects.map((x) => x.name)]))) : [];
  const first = (body: string) => body.replace(/^>.*\n+/, "").trim().split("\n")[0]?.replace(/^#+\s*/, "").slice(0, 120) || "Not written yet";
  const today = new Date().toISOString().slice(0, 10);
  const states = (kind.states ?? []).filter((x) => x.id !== "let-go");
  const draws = typeof record.body.draws === "string" ? record.body.draws : "";

  // A role is a bundle of qualities: its people and their qualities are in Scholē's Lives (doc "Qualities design guide").
  const people = role ? (
    <p className="text-sm"><Link href={`/schole/browse#lives-${role.id}`} className="text-muted-foreground hover:text-foreground underline underline-offset-2">{role.plural} in Scholē, and the qualities they name</Link></p>
  ) : null;

  return (
    <main className={PAGE}>
      <ThingHeader back="/life/work" backLabel="Work" crumbs={[{ label: "Home", href: "/" }, { label: "Work", href: "/life/work" }]} title={title} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8">
        {letGo ? (
          <div className="bg-muted flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm">
            <span>You let this aim go.</span>
            <form action={stateLifeAction.bind(null, id, kind.states?.find((x) => x.active)?.id ?? kind.states![0]!.id, back)}><Button type="submit" variant="outline" size="sm">Take it up again</Button></form>
          </div>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid min-w-0 gap-2">
            <p className="text-muted-foreground text-xs">{kindLabel({ record, job })}{isMain ? " · Main aim" : ""}</p>
            <div className="flex items-center gap-2">
              <h1 id="page-title" className="scroll-mt-20 text-[32px] leading-tight font-semibold tracking-tight first-letter:uppercase">{title}</h1>
              {letGo ? null : (
                <form action={mainAction.bind(null, id)}>
                  <Button type="submit" variant="ghost" size="icon" aria-pressed={isMain} aria-label={isMain ? "Main aim" : "Make it the main aim"} title={isMain ? "Main aim" : "Make it the main aim"} disabled={isMain}><StarIcon className={cn(isMain && "fill-foreground")} /></Button>
                </form>
              )}
            </div>
            {states.length && !letGo ? (
              <div className="flex flex-wrap gap-1" role="group" aria-label="State">
                {states.map((x) => (
                  <form key={x.id} action={stateLifeAction.bind(null, id, x.id, back)}>
                    <button type="submit" aria-pressed={record.state === x.id} className={cn("rounded-full border px-2.5 py-0.5 text-xs transition", record.state === x.id ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground")}>{x.label}</button>
                  </form>
                ))}
              </div>
            ) : null}
            {draws ? <p className="text-muted-foreground max-w-2xl text-sm">{draws}</p> : null}
            {people}
          </div>
          {letGo ? null : <form action={writeTowardAction.bind(null, id)}><Button type="submit"><PenLineIcon />Write toward it</Button></form>}
        </div>

        <div className="grid max-w-4xl gap-8">
          <div className="grid content-start gap-8">

            <section aria-labelledby="path" className="grid gap-3">
              <h2 id="path" className="text-lg font-semibold tracking-tight">The path</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <Steps title="Learn toward it" empty={<>Nothing in Scholē chosen for this yet. <Link href={`/schole/browse?q=${encodeURIComponent(title)}`} className="underline underline-offset-2">Find something</Link>.</>} rows={learn.map((p) => ({ key: `${p.item.kind}:${p.item.title}`, href: itemHref(p.item), label: p.item.title, reason: p.reason }))} />
                <Steps title="Work it leads to" empty="Add what you are learning in Scholē, and the work it leads to shows here." rows={s.later.slice(0, 5).map((x) => ({ key: x.job.code, href: `/life/work/jobs/${x.job.code}`, label: x.job.title, reason: x.why[0] ?? "" }))} />
              </div>
              <div id="talked" className="grid scroll-mt-20 gap-2">
                <h3 className="font-semibold">People talked with</h3>
                {talked.length ? (
                  <ul className="divide-y border-y">{talked.map((a) => <li key={a.id} className="grid gap-0.5 py-2.5"><span className="text-sm">{a.note ?? "Talked with someone doing it"}</span><span className="text-muted-foreground text-xs">{a.day}</span></li>)}</ul>
                ) : <p className="text-muted-foreground text-sm">No one yet. Talk with someone who does this work, and keep who and what you learned.</p>}
                {letGo ? null : (
                  <form action={actLifeAction.bind(null, id)} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="kind" value="talked" /><input type="hidden" name="$back" value={`${back}#talked`} />
                    <Input name="note" placeholder="Who, and what you learned" aria-label="Who, and what you learned" className="h-8 min-w-48 flex-1" />
                    <Input name="day" type="date" defaultValue={today} aria-label="Day" className="h-8 w-40" />
                    <Button type="submit" size="sm" variant="outline">Keep it</Button>
                  </form>
                )}
              </div>
            </section>

            <section aria-labelledby="entries" className="grid gap-2">
              <h2 id="entries" className="text-lg font-semibold tracking-tight">Entries toward it</h2>
              {entries.length ? (
                <ul className="divide-y border-y text-sm">
                  {entries.map(({ a, w }) => <li key={a.id}><Link href={`/journal/w/${w!.id}`} className="hover:bg-accent flex items-baseline justify-between gap-3 py-2.5"><span className="min-w-0 truncate">{w!.title || first(w!.body)}</span><span className="text-muted-foreground shrink-0 text-xs">{a.day}</span></Link></li>)}
                </ul>
              ) : <p className="text-muted-foreground text-sm">Nothing written yet.</p>}
            </section>
          </div>
        </div>

        <div className="grid gap-3 border-t pt-4">
          <details className="group">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">About this work</summary>
            <div className="mt-4 grid max-w-3xl gap-6">
              {job ? (
                <div className="grid gap-2 text-sm">
                  <p>{job.about}</p>
                  {job.pay ? <p className="text-muted-foreground">National median pay ${Math.round(job.pay).toLocaleString("en-US")} a year.</p> : null}
                  {tasks.length ? (
                    <>
                      <p className="text-muted-foreground">Its tasks, from O*NET; {tasks.filter((t) => t.touched).length} of {tasks.length} meet what you are learning.</p>
                      <ul className="grid gap-1">{tasks.map((t) => <li key={t.task} className="flex gap-2"><span aria-hidden className={t.touched ? "" : "text-muted-foreground"}>{t.touched ? "●" : "○"}</span><span className={t.touched ? "" : "text-muted-foreground"}>{t.task}<span className="sr-only">{t.touched ? ", meets what you are learning" : ""}</span></span></li>)}</ul>
                    </>
                  ) : null}
                </div>
              ) : null}
              {ref ? <p className="text-sm"><Link href={refHref(ref)} className="underline underline-offset-2">Its page in Work</Link></p> : null}
              {offered.length ? (
                <form action={learningTowardAction.bind(null, id, back)} className="grid gap-2">
                  <p className="text-sm font-medium">What you learn toward it</p>
                  <div className="flex flex-wrap gap-2">
                    {offered.slice(0, 40).map((i) => (
                      <label key={i.id} className="has-[:checked]:border-foreground has-[:checked]:bg-accent cursor-pointer rounded-full border px-3 py-1 text-sm">
                        <input type="checkbox" name="learning" value={i.id} defaultChecked={chosen.has(i.id)} className="sr-only" />
                        <span className="text-muted-foreground">{MEDIUM[i.medium] ?? i.medium}: </span>{i.title}
                      </label>
                    ))}
                  </div>
                  <div><Button type="submit" size="sm" variant="outline">Save</Button></div>
                </form>
              ) : null}
              <div className="grid gap-2">
                <p className="text-sm font-medium">{record.kind === "imagined" ? "What it is" : "Why it inspires you"}</p>
                <RecordForm app="work" kind={kind} record={record} back={back} quiet />
              </div>
            </div>
          </details>
          {letGo ? null : <form action={kind.states?.some((x) => x.id === "let-go") ? stateLifeAction.bind(null, id, "let-go", "/life/work") : removeLifeAction.bind(null, id)}><Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">Let it go</Button></form>}
        </div>
      </div>
    </main>
  );
}
