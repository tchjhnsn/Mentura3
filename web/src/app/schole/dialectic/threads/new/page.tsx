import type { Metadata } from "next";
import { LIMITS } from "@reflect/core/dialectic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PAGE } from "@/components/page-header";
import { TaskHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { createThreadAction } from "../../actions";
import { WorkSelect } from "../../parts";

export const metadata: Metadata = { title: "Ask a question" };
export const dynamic = "force-dynamic";

/** Asking a question for people to answer in writing, on a work or on its own. */
export default async function NewThreadPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: "/schole/dialectic", label: "Back to Dialectic" }} title="Dialectic" position="Ask a question" />
      <div className="mt-6 max-w-xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Ask a question</h1>
        <form action={createThreadAction} className="space-y-4">
          <div className="space-y-1.5"><label htmlFor="question" className="text-sm font-medium">Question</label><Input id="question" name="question" required minLength={LIMITS.question[0]} maxLength={LIMITS.question[1]} placeholder="Is moral hazard a failure of character or of rules?" /></div>
          <div className="space-y-1.5"><label htmlFor="work" className="text-sm font-medium">On the work</label><WorkSelect value={sp.work} /></div>
          <div className="space-y-1.5"><label htmlFor="body" className="text-sm font-medium">What you think so far</label><Textarea id="body" name="body" rows={5} maxLength={LIMITS.body} /></div>
          <Button type="submit">Ask</Button>
        </form>
      </div>
    </main>
  );
}
