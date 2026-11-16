import type { Metadata } from "next";
import { FORMATS, LIMITS } from "@reflect/core/dialectic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAGE } from "@/components/page-header";
import { TaskHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { createDebateAction } from "../../actions";
import { TzField } from "../../client";
import { FIELD, WorkSelect } from "../../parts";

export const metadata: Metadata = { title: "Host a debate" };
export const dynamic = "force-dynamic";

/** Hosting a debate: the motion, the work it comes from, the format, the time, and whether the host takes a side. */
export default async function NewDebatePage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: "/schole/dialectic", label: "Back to Dialectic" }} title="Dialectic" position="Host a debate" />
      <div className="mt-6 max-w-xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Host a debate</h1>
          <p className="text-muted-foreground">Put a motion, choose a format and a time. You keep the format and the floor; two people take the sides.</p>
        </header>
        <form action={createDebateAction} className="space-y-4">
          <TzField />
          <div className="space-y-1.5">
            <label htmlFor="motion" className="text-sm font-medium">Motion</label>
            <Input id="motion" name="motion" required minLength={LIMITS.motion[0]} maxLength={LIMITS.motion[1]} placeholder="Should a prince be feared rather than loved?" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label htmlFor="work" className="text-sm font-medium">From the work</label><WorkSelect /></div>
            <div className="space-y-1.5"><label htmlFor="source" className="text-sm font-medium">Where in it</label><Input id="source" name="source" maxLength={LIMITS.source} placeholder="chapter XVII" /></div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Format</legend>
            {FORMATS.map((f, i) => (
              <label key={f.id} className="has-checked:border-primary flex gap-3 rounded-lg border p-3">
                <input type="radio" name="format" value={f.id} defaultChecked={i === 0} className="mt-1" />
                <span><span className="font-medium">{f.label}</span><span className="text-muted-foreground block text-sm">{f.about}</span></span>
              </label>
            ))}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label htmlFor="when" className="text-sm font-medium">When</label><Input id="when" name="when" type="datetime-local" required /></div>
            <div className="space-y-1.5">
              <label htmlFor="side" className="text-sm font-medium">Your part</label>
              <select id="side" name="side" defaultValue="" className={FIELD}><option value="">Host only</option><option value="for">Host and argue for</option><option value="against">Host and argue against</option></select>
            </div>
          </div>
          <Button type="submit">Schedule the debate</Button>
        </form>
      </div>
    </main>
  );
}
