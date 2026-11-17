import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { QUESTIONS } from "@reflect/core/recipes";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { lifeRecords } from "@/server/life-store";
import { requireUser } from "@/server/session";
import { avoidAction, likeAction } from "../actions";

export const metadata: Metadata = { title: "How you eat" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Food's first questions (doc "Food design guide"), one to a page: a tap answers and goes on to the next. Asked for
 * one question alone (from the Food page), a tap answers it and goes back.
 */
export default async function StartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const i = Math.max(0, QUESTIONS.findIndex((q) => q.key === one(sp.q)));
  const q = QUESTIONS[i]!;
  const alone = one(sp.one) === "1";
  const next = alone || i === QUESTIONS.length - 1 ? "/meals" : `/meals/start?q=${QUESTIONS[i + 1]!.key}`;
  const here = `/meals/start?q=${q.key}${alone ? "&one=1" : ""}`;
  const b = (await lifeRecords(user.id, "home")).find((r) => r.kind === "food-likes")?.body ?? {};
  const many = "many" in q && q.many;
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meals" backLabel="Food" crumbs={[{ label: "Food", href: "/meals" }]} title="How you eat" />
      <div className={COLUMN}>
        <div className="grid gap-2 text-center">
          {!alone ? <p className="text-muted-foreground text-sm">{i + 1} of {QUESTIONS.length}</p> : null}
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{q.label}</h1>
          {many ? <p className="text-muted-foreground text-sm">Tap all that apply.</p> : null}
        </div>
        <Group>
          {q.options.map(([id, label]) => {
            const on = many ? b[`avoid-${id}`] === true : b[q.key] === id;
            const act = many ? avoidAction.bind(null, id, !on, here) : likeAction.bind(null, q.key, on && alone ? null : id, next);
            return (
              <li key={id}>
                <form action={act}>
                  <button type="submit" aria-pressed={on} className="hover:bg-accent flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left text-lg transition">
                    <span className="flex-1">{label}</span>
                    {on ? <CheckIcon aria-label="Chosen" className="text-primary size-5" /> : null}
                  </button>
                </form>
              </li>
            );
          })}
        </Group>
        {many ? <Button asChild size="lg" className="w-full"><Link href={next}>{alone || i === QUESTIONS.length - 1 ? "Done" : "Next"}</Link></Button> : null}
        {!alone ? <Link href={next} className="text-muted-foreground hover:text-foreground justify-self-center text-sm underline-offset-2 hover:underline">Skip</Link> : null}
      </div>
    </main>
  );
}
