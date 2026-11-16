import type { Metadata } from "next";
import { LIMITS } from "@reflect/core/dialectic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAGE } from "@/components/page-header";
import { TaskHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { createRoomAction } from "../../actions";
import { WorkSelect } from "../../parts";

export const metadata: Metadata = { title: "Open a room" };
export const dynamic = "force-dynamic";

/** Opening a room: a live table on one work or one question. The person who opens it hosts it. */
export default async function NewRoomPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: "/schole/dialectic", label: "Back to Dialectic" }} title="Dialectic" position="Open a room" />
      <div className="mt-6 max-w-xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Open a room</h1>
          <p className="text-muted-foreground">A live table on one work or question. You host it: you let people speak, and you close it.</p>
        </header>
        <form action={createRoomAction} className="space-y-4">
          <div className="space-y-1.5"><label htmlFor="work" className="text-sm font-medium">On the work</label><WorkSelect value={sp.work} /></div>
          <div className="space-y-1.5"><label htmlFor="title" className="text-sm font-medium">Name</label><Input id="title" name="title" maxLength={LIMITS.title[1]} placeholder="Republic II: the ring of Gyges" /><p className="text-muted-foreground text-xs">Leave it empty to use the work&apos;s title.</p></div>
          <div className="space-y-1.5"><label htmlFor="question" className="text-sm font-medium">The question on the table</label><Input id="question" name="question" maxLength={LIMITS.question[1]} placeholder="Would a just person stay just with the ring?" /></div>
          <Button type="submit">Open the room</Button>
        </form>
      </div>
    </main>
  );
}
