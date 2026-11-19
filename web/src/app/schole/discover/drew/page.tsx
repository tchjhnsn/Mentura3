import type { Metadata } from "next";
import Link from "next/link";
import { ENOUGH, HOLLAND, discover } from "@reflect/core/crafts";
import { PAGE } from "@/components/page-header";
import { TaskHeader } from "@/components/headers";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { myAnswers, myCrafts } from "@/server/crafts-store";
import { keepCraftAction } from "../../crafts/actions";

export const metadata: Metadata = { title: "What drew you" };
export const dynamic = "force-dynamic";

/**
 * What drew you (design guide, Discover): the leading interest type in plain words, the two leading craft groups,
 * then the crafts ranked by how many liked activities point at them, each with those activities and a Keep button.
 */
export default async function DrewPage() {
  const user = await requireUser();
  const [answers, mine] = await Promise.all([myAnswers(user.id), myCrafts(user.id)]);
  const result = discover(answers);
  const kept = new Set(mine.map((c) => c.ref));
  const header = <TaskHeader back={{ href: "/schole/discover", label: "Back to Discover crafts" }} title="Discover crafts" position="What drew you" />;

  if (result.answered < ENOUGH) {
    return (
      <main className={PAGE}>
        {header}
        <div className="mx-auto mt-10 grid max-w-xl gap-4">
          <h1 className="text-2xl font-semibold">Not enough answers yet</h1>
          <p className="text-muted-foreground">Answer at least {ENOUGH} activities and this page shows the crafts they point to. You have answered {result.answered}.</p>
          <p><Button asChild><Link href="/schole/discover">Discover crafts</Link></Button></p>
        </div>
      </main>
    );
  }

  const type = result.type ? HOLLAND[result.type] : null;
  return (
    <main className={PAGE}>
      {header}
      <div className="mx-auto mt-6 grid w-full max-w-xl grid-cols-[minmax(0,1fr)] gap-10">
        <section aria-labelledby="drew" className="grid gap-2">
          <h1 id="drew" className="text-2xl font-semibold">What drew you</h1>
          {type ? (
            <p className="text-lg">You lean towards {type.plain}. <span className="text-muted-foreground text-sm">Holland calls this {type.label}.</span></p>
          ) : (
            <p className="text-muted-foreground">Nothing you answered was a like yet. Go back and mark a few activities you would enjoy.</p>
          )}
        </section>

        {result.groups.length ? (
          <section aria-labelledby="groups" className="grid gap-2">
            <h2 id="groups" className="text-muted-foreground text-sm">The kinds of making that came up most</h2>
            <ul className="divide-y border-y">
              {result.groups.map((g) => (
                <li key={g.id}>
                  <Link href={`/schole/making/${g.id}`} className="hover:bg-accent grid gap-0.5 py-3 transition">
                    <span className="font-semibold">{g.label}</span>
                    {g.latin ? <span className="text-muted-foreground text-sm italic" lang="la">{g.latin}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {result.crafts.length ? (
          <section aria-labelledby="crafts" className="grid gap-2">
            <h2 id="crafts" className="font-semibold">Crafts to try</h2>
            <ul className="divide-y border-y">
              {result.crafts.map(({ craft, because }) => (
                <li key={craft.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="grid min-w-0 gap-0.5">
                    <Link href={`/schole/crafts/${craft.id}`} className="font-medium underline-offset-4 hover:underline">{craft.label}</Link>
                    <span className="text-muted-foreground text-sm">Because you would like to {because.map((a) => a.text.charAt(0).toLowerCase() + a.text.slice(1)).join(", and ")}.</span>
                  </div>
                  {kept.has(craft.id) ? (
                    <span className="text-muted-foreground shrink-0 py-1.5 text-sm">Kept</span>
                  ) : (
                    <form action={keepCraftAction} className="shrink-0">
                      <input type="hidden" name="ref" value={craft.id} />
                      <input type="hidden" name="state" value="drawn" />
                      <Button type="submit" variant="outline" size="sm" aria-label={`Keep ${craft.label.toLowerCase()}`}>Keep</Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-sm"><Link href="/schole/discover" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Change your answers</Link></p>
      </div>
    </main>
  );
}
