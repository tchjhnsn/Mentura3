import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { feed, following, personPage, pointsOf } from "@/server/discussion-store";
import { LEARN } from "../../../crumbs";
import { followAction } from "../../actions";
import { Feed } from "../../discussion";
import { Face } from "../../parts";

export const metadata: Metadata = { title: "Dialectic" };
export const dynamic = "force-dynamic";

/** A person in Dialectic: their face and name, Follow in line with the name, their points, and their posts and reposts. */
export default async function PersonFeedPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [who, items, points, mine] = await Promise.all([personPage(id), feed(user.id, { author: id }), pointsOf(id), following(user.id)]);
  if (!who) notFound();
  const self = id === user.id;
  const on = mine.has(id);
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/dialectic" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }]} title={who.who.name} />
      <div className="mx-auto mt-6 max-w-xl">
        <header className="flex items-center gap-4 border-b pb-4">
          <Face p={who.who} size={64} />
          <div className="min-w-0 flex-1">
            <h1 id="page-title" className="truncate text-2xl font-semibold tracking-tight">{who.who.name}</h1>
            <p className="text-muted-foreground text-sm"><span className="text-foreground font-medium tabular-nums">{points.points}</span> points · <span className="text-foreground font-medium tabular-nums">{who.followers}</span> followers · <span className="text-foreground font-medium tabular-nums">{who.follows}</span> following</p>
          </div>
          {self ? null : (
            <form action={followAction}>
              <input type="hidden" name="user" value={id} /><input type="hidden" name="on" value={on ? "0" : "1"} />
              <Button type="submit" variant={on ? "outline" : "default"} className="rounded-full">{on ? "Following" : "Follow"}</Button>
            </form>
          )}
        </header>
        <Feed items={items} path={`/schole/dialectic/u/${id}`} empty={self ? "You haven't posted yet." : "No posts yet."} />
      </div>
    </main>
  );
}
