import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { planOf } from "@/server/plan";
import { addStepAction } from "../../actions";
import { StepForm } from "../step-form";

export const metadata: Metadata = { title: "Add a step" };
export const dynamic = "force-dynamic";

/** A new step on Not yet, numbered after the last one. */
export default async function NewStepPage() {
  const user = await requireUser();
  const { plan } = await planOf(user.id);
  const order = (plan.steps.at(-1)?.order ?? 0) + 1;
  return (
    <main className={PAGE}>
      <ThingHeader back="/?view=not-yet" backLabel="Not yet" crumbs={[{ label: "Home", href: "/" }, { label: "Not yet", href: "/?view=not-yet" }]} title="Add a step" />
      <div className="mt-4 grid max-w-3xl gap-6">
        <div className="grid gap-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">Add a step</h1>
          <p className="text-muted-foreground">The next thing you want your life to hold, such as married, two children or a house on land.</p>
        </div>
        <StepForm action={addStepAction} body={{ order }} submit="Add the step" />
      </div>
    </main>
  );
}
