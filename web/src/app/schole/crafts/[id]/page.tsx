import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTESTS, LEARNED, STAGES, craftOf, discover, groupOf, isAlready } from "@reflect/core/crafts";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { myAnswers, myCraft } from "@/server/crafts-store";
import { lifeActs } from "@/server/life-store";
import { friendsMet } from "@/server/connect-store";
import { hrefOf, MINE } from "@/app/home-tiles";
import { LEARN } from "../../crumbs";
import { craftActAction, keepCraftAction, setCraftStateAction } from "../actions";
import { AddMade, LearnedChoices, StageLine, VouchFaces } from "./parts";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: craftOf((await params).id)?.label ?? "Craft" };
}

const dayOf = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const list = (v: unknown) => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/**
 * A craft (doc "Scholē landing design guide", 2026-11-19). Not yet (drawn to it, trying it, or not kept): what drew
 * the person, Try it once, and I practise this. Already (practising): where they are on the Dreyfus five steps, how
 * they learned it, what they made, which friends vouch, and the way to work in it in Ergon.
 */
export default async function CraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const craft = craftOf(id);
  if (!craft) notFound();
  const group = groupOf(craft.group)!;
  const user = await requireUser();
  const [mine, answers] = await Promise.all([myCraft(user.id, craft.id), myAnswers(user.id)]);
  const [acts, friends] = await Promise.all([mine ? lifeActs(user.id, mine.record.id) : Promise.resolve([]), mine && isAlready(mine.state) ? friendsMet(user.id).catch(() => []) : Promise.resolve([])]);
  const already = isAlready(mine?.state);
  const because = discover(answers).crafts.find((c) => c.craft.id === craft.id)?.because ?? [];
  const why = String(mine?.record.body.why ?? "").trim();
  const tried = acts.filter((a) => a.kind === "tried");
  const made = acts.filter((a) => a.kind === "made");
  const fitness = MINE.find((t) => t.id === "fitness");
  const fitnessHref = fitness ? hrefOf(fitness) : null;
  const contest = CONTESTS.includes(craft.id);

  const crumbs = [LEARN, { label: "Making", href: "/schole/making" }, { label: group.label, href: `/schole/making/${group.id}` }];
  const where = !mine ? "Not kept yet" : already ? "You practise this" : mine.state === "trying" ? "You are trying this" : "You are drawn to this";

  return (
    <main className={PAGE}>
      <ThingHeader back={`/schole/making/${group.id}`} backLabel={group.label} crumbs={crumbs} title={craft.label} />
      <div className="mt-4 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8">
        <div className="grid gap-1">
          <h1 id="page-title" className="text-[28px] leading-tight font-semibold tracking-tight">{craft.label}</h1>
          <p className="text-muted-foreground">{where}. <Link href={`/schole/making/${group.id}`} className="underline-offset-2 hover:underline">{group.label}</Link></p>
        </div>

        {already ? (
          <>
            <section aria-labelledby="stage" className="grid gap-3">
              <h2 id="stage" className="font-semibold">Where you are</h2>
              <StageLine craft={craft.id} stages={STAGES} stage={typeof mine!.record.body.stage === "string" ? mine!.record.body.stage : null} />
            </section>

            <section aria-labelledby="learned" className="grid gap-3">
              <h2 id="learned" className="font-semibold">How you learned it</h2>
              <LearnedChoices craft={craft.id} choices={LEARNED} how={list(mine!.record.body.how)} />
            </section>

            <section aria-labelledby="made" className="grid gap-3">
              <h2 id="made" className="font-semibold">What you have made</h2>
              {made.length ? (
                <ul className="divide-y border-y text-sm">
                  {made.map((a) => <li key={a.id} className="flex items-baseline justify-between gap-3 py-2.5"><span className="min-w-0 truncate">{a.note || "Something you made"}</span><span className="text-muted-foreground shrink-0 text-xs">{dayOf(a.day)}</span></li>)}
                </ul>
              ) : <p className="text-muted-foreground text-sm">Nothing kept yet. Add the things you make, one short name each.</p>}
              <div><AddMade craft={craft.id} label={craft.label} /></div>
            </section>

            <section aria-labelledby="vouch" className="grid gap-3">
              <h2 id="vouch" className="font-semibold">Who vouches for you</h2>
              {friends.length ? (
                <VouchFaces craft={craft.id} friends={friends.map((f) => ({ id: f.id, name: f.name }))} vouch={list(mine!.record.body.vouch)} />
              ) : (
                <div className="grid justify-items-start gap-1.5">
                  <Button type="button" variant="outline" disabled>Ask a friend to vouch</Button>
                  <p className="text-muted-foreground text-sm">Only your Reflect friends can vouch. <Link href="/v/people" className="underline underline-offset-2">Connect with people you know</Link> first.</p>
                </div>
              )}
            </section>

            <section aria-labelledby="work" className="grid gap-1.5">
              <h2 id="work" className="font-semibold">Work in it</h2>
              <p className="text-muted-foreground text-sm">Keep the work you want, or do, in <Link href="/life/work" className="text-foreground underline underline-offset-2">Ergon</Link>.</p>
            </section>
          </>
        ) : (
          <>
            <section aria-labelledby="drew" className="grid gap-3">
              <h2 id="drew" className="font-semibold">What drew you</h2>
              {because.length || why ? (
                <ul className="grid gap-1.5 text-sm">
                  {why ? <li>{why}</li> : null}
                  {because.map((a) => <li key={a.id}>You liked: {a.text.charAt(0).toLowerCase() + a.text.slice(1)}.</li>)}
                </ul>
              ) : <p className="text-muted-foreground text-sm">Nothing yet. <Link href="/schole/discover" className="underline underline-offset-2">Discover crafts</Link> to see what draws you.</p>}
            </section>

            <section aria-labelledby="try" className="grid gap-3">
              <h2 id="try" className="font-semibold">Try it</h2>
              {tried.length ? <p className="text-muted-foreground text-sm">You tried it {tried.length === 1 ? "once" : `${tried.length} times`}, last on {dayOf(tried[0]!.day)}.</p> : <p className="text-muted-foreground text-sm">Try it once, then see if you want more.</p>}
              <div className="flex flex-wrap gap-2">
                <form action={craftActAction.bind(null, craft.id, "tried", undefined)}><Button type="submit">{tried.length ? "I tried it again" : "I tried it once"}</Button></form>
                {mine ? (
                  <form action={setCraftStateAction.bind(null, craft.id, "practising")}><Button type="submit" variant="outline">I practise this</Button></form>
                ) : (
                  <form action={keepCraftAction}><input type="hidden" name="ref" value={craft.id} /><input type="hidden" name="state" value="practising" /><Button type="submit" variant="outline">I practise this</Button></form>
                )}
                {!mine ? (
                  <form action={keepCraftAction}><input type="hidden" name="ref" value={craft.id} /><input type="hidden" name="state" value="drawn" /><Button type="submit" variant="ghost">Keep it for later</Button></form>
                ) : null}
              </div>
            </section>
          </>
        )}

        {contest && fitnessHref ? <p className="text-muted-foreground text-sm">Training for it counts in <Link href={fitnessHref} className="text-foreground underline underline-offset-2">Fitness</Link> too.</p> : null}

        {mine ? (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {already ? <form action={setCraftStateAction.bind(null, craft.id, "trying")}><Button type="submit" variant="ghost" size="sm">I am not practising it now</Button></form> : null}
            <form action={setCraftStateAction.bind(null, craft.id, "let-go")}><Button type="submit" variant="ghost" size="sm">Let it go</Button></form>
          </div>
        ) : null}
      </div>
    </main>
  );
}
