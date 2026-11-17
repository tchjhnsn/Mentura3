import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { lifeRecord } from "@/server/life-store";
import { happenedAction, removeStepAction, saveStepAction } from "../../actions";
import { StepForm } from "../step-form";

export const metadata: Metadata = { title: "Step" };
export const dynamic = "force-dynamic";

/** A step's page: change it, mark that it happened (it joins Already), or take it off. */
export default async function StepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const r = await lifeRecord(user.id, id);
  if (!r || r.kind !== "step") notFound();
  const name = typeof r.body.name === "string" && r.body.name ? r.body.name : "A step";
  return (
    <main className={PAGE}>
      <ThingHeader back={`/?view=not-yet&step=${id}`} backLabel="Not yet" crumbs={[{ label: "Home", href: "/" }, { label: "Not yet", href: "/?view=not-yet" }]} title={name} />
      <div className="mt-4 grid max-w-3xl gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight first-letter:uppercase">{name}</h1>
          {r.state !== "happened" ? <form action={happenedAction.bind(null, id)}><Button type="submit" variant="outline">It happened</Button></form> : <p className="text-muted-foreground text-sm">It happened</p>}
        </div>
        <StepForm action={saveStepAction.bind(null, id)} body={r.body} submit="Save" />
        <form action={removeStepAction.bind(null, id)} className="border-t pt-4"><Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">Take it off</Button></form>
      </div>
    </main>
  );
}
