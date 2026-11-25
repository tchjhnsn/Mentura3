// The parts of the Integrations screens (V20 to V26), after Vercel's Marketplace: a card per integration with its
// category, a section per category, a recommendation card that says Needed or Helpful and why. No hooks, so server
// pages render them directly; the search on V20 is the one client part (./integrations-search.tsx).
import Link from "next/link";
import type { MarketConnector } from "@reflect/core/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/app/marketplace/logos";
import { cn } from "@/lib/utils";
import { fnOf, isSample, ventureHref, type FunctionId } from "./data";
import { categoriesOf, forFunction, membersOf, type Category, type Recommendation } from "./integrations";
import { M2, WAIT_ACTIONS, failureAction, type SignInState } from "./integrations-machines";
import { WhyThis } from "./integrations-why";
import type { Alternative, Scored } from "./recommend";
import { toolOf, toolPath } from "./tools";

/** One integration in the grid: its category, mark, name and line; Connected when the person has it. */
export function IntegrationCard({ slug, c, connected }: { slug: string; c: MarketConnector; connected: boolean }) {
  const cat = categoriesOf(c.id)[0];
  return (
    <Link href={ventureHref(slug, `integrations/${c.id}`)} className="hover:bg-accent/50 flex flex-col gap-3 rounded-xl border p-4 transition-colors">
      <div className="flex items-center justify-between gap-2">
        {cat ? <Badge variant="outline" className="font-normal">{cat.name}</Badge> : <span />}
        {connected ? <Badge variant="secondary" className="font-normal">Connected</Badge> : null}
      </div>
      <div className="flex items-center gap-3">
        <Logo id={c.id} name={c.name} size="size-9" glyph="size-5" />
        <span className="font-medium">{c.name}</span>
      </div>
      <p className="text-muted-foreground text-sm">{c.line}</p>
    </Link>
  );
}

export function Grid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}

/** A category's heading and its cards; an empty category says so and offers the way to add one's own server. */
export function CategorySection({ slug, category, connected, head = true }: { slug: string; category: Category; connected: ReadonlySet<string>; head?: boolean }) {
  const members = membersOf(category);
  return (
    <section id={category.id} className="scroll-mt-20">
      {head ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">
            <Link href={ventureHref(slug, `integrations/category/${category.id}`)} className="hover:underline">{category.name}</Link>
          </h2>
          <span className="text-muted-foreground text-xs tabular-nums">{members.length}</span>
        </div>
      ) : null}
      {members.length ? (
        <Grid>{members.map((c) => <IntegrationCard key={c.id} slug={slug} c={c} connected={connected.has(c.id)} />)}</Grid>
      ) : <NotYet />}
    </section>
  );
}

/** A category with nothing in the catalog: say so, and offer adding any MCP server by its address. */
export function NotYet() {
  return (
    <div className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
      Not in the catalog yet. <Link href="/marketplace/add" className="text-foreground underline">Add your own server</Link> by its address.
    </div>
  );
}

export function FitBadge({ fit }: { fit: Recommendation["fit"] }) {
  return fit === "needed"
    ? <Badge className="font-normal">Needed</Badge>
    : <Badge variant="outline" className="font-normal">Helpful</Badge>;
}

/** A row of facts in a detail page's right column, as Vercel's Details list. */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

/** On a function's Overview (V12): the kinds of software it should connect, Needed first, and a link to V22. */
export function FunctionIntegrationsCard({ slug, fn }: { slug: string; fn: FunctionId }) {
  const recs = forFunction(fn).slice(0, 4);
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Recommended integrations</h2>
        <Link href={ventureHref(slug, `integrations/function/${fn}`)} className="text-muted-foreground hover:text-foreground text-xs underline">See all</Link>
      </div>
      {recs.length ? (
        <ul className="mt-2 divide-y rounded-lg border">
          {recs.map((r) => (
            <li key={r.category.id}>
              <Link href={ventureHref(slug, `integrations/category/${r.category.id}`)} className="hover:bg-accent flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm">{r.category.name}</span>
                <FitBadge fit={r.fit} />
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="text-muted-foreground mt-2 rounded-lg border p-3 text-sm">Nothing in the catalog serves this function&apos;s work yet.</p>}
    </section>
  );
}

/** Where an alternative opens: the built-in tool's page in this business, or the connected integration's page. */
export function alternativeHref(slug: string, a: Alternative): string {
  if (a.integration) return ventureHref(slug, `integrations/${a.integration}`);
  const t = a.tool ? toolOf(a.tool) : undefined;
  return ventureHref(slug, t ? toolPath(t, !isSample(slug)) : "integrations");
}

/** The reasons a category scores what it does: each factor that moved it, and the ways to do the work without it. */
export function Reasons({ slug, r }: { slug: string; r: Scored }) {
  const reasons = r.factors.filter((f) => f.points !== 0);
  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-1">
        {reasons.map((f) => (
          <li key={f.id} className="flex gap-2">
            <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", f.points > 0 ? "bg-foreground" : "bg-muted-foreground/50")} aria-hidden />
            <span className={f.points > 0 ? undefined : "text-muted-foreground"}>{f.text}</span>
          </li>
        ))}
      </ul>
      {r.alternatives.length ? (
        <div>
          <div className="text-muted-foreground text-xs">Or use what you have</div>
          <ul className="mt-1 space-y-1">
            {r.alternatives.map((a) => (
              <li key={`${a.kind}-${a.tool ?? a.integration}`}>
                <Link href={alternativeHref(slug, a)} className="font-medium hover:underline">{a.label}</Link>
                <span className="text-muted-foreground"> · {a.how.replace(/\.$/, "")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** A scored recommendation: the category, Needed, Helpful or Later, its reasons and alternatives, its integrations, and
 * "Why this?", which has AI explain the reasons. */
export function ScoredCard({ slug, r }: { slug: string; r: Scored }) {
  const members = membersOf(r.category);
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={ventureHref(slug, `integrations/category/${r.category.id}`)} className="font-medium hover:underline">{r.category.name}</Link>
        {r.connected ? <Badge variant="secondary" className="font-normal">Connected</Badge> : r.later ? <Badge variant="outline" className="text-muted-foreground font-normal">Later</Badge> : <FitBadge fit={r.fit} />}
      </div>
      <Reasons slug={slug} r={r} />
      <div className="mt-auto flex flex-wrap gap-2">
        {members.length ? members.map((c) => (
          <Link key={c.id} href={ventureHref(slug, `integrations/${c.id}`)} className="hover:bg-accent flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
            <Logo id={c.id} name={c.name} size="size-5" glyph="size-3.5" />{c.name}
          </Link>
        )) : <span className="text-muted-foreground text-sm">Not in the catalog yet. <Link href="/marketplace/add" className="text-foreground underline">Add your own server</Link></span>}
      </div>
      <WhyThis slug={slug} category={r.category.id} />
    </div>
  );
}

/** A featured integration: the best one in a top category, with the reason that weighed most. */
export function FeaturedCard({ slug, c, r }: { slug: string; c: MarketConnector; r: Scored }) {
  const top = [...r.factors].sort((a, b) => b.points - a.points)[0];
  return (
    <Link href={ventureHref(slug, `integrations/${c.id}`)} className="hover:bg-accent/50 flex flex-col gap-3 rounded-xl border p-4 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="font-normal">{r.category.name}</Badge>
        <FitBadge fit={r.fit} />
      </div>
      <div className="flex items-center gap-3">
        <Logo id={c.id} name={c.name} size="size-9" glyph="size-5" />
        <span className="font-medium">{c.name}</span>
      </div>
      {top ? <p className="text-muted-foreground text-sm">{top.text}</p> : null}
    </Link>
  );
}

/** A sign-in that ended in a failure state of M2: what happened, then that state's one next action (P31), as a button
 * to `retry` when it can be done now and as words when it only waits (WAIT_ACTIONS). */
export function SignInFailed({ state, message, retry }: { state: SignInState; message?: string; retry: string }) {
  const action = failureAction(M2, state);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm" data-machine-state={`M2:${state}`}>
      <span className="text-destructive flex-1">{message || "The sign-in did not finish."}</span>
      {action && WAIT_ACTIONS.includes(action) ? <span className="text-muted-foreground">{action}</span>
        : action ? <Button size="sm" variant="outline" asChild><Link href={retry}>{action}</Link></Button> : null}
    </div>
  );
}
