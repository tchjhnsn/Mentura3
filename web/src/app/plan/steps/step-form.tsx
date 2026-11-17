import { kindOf, type Body } from "@reflect/core/life";
import { Button } from "@/components/ui/button";
import { FieldInput } from "@/app/life/record";

const STEP = kindOf("home", "step")!;
const ABOUT = ["name", "order", "year", "where", "adults", "children", "food"];

/** A step's fields: what it is and who is in the household first, then what each thing would cost a month. An empty cost is carried from the step before. */
export function StepForm({ action, body, submit }: { action: (form: FormData) => Promise<void>; body: Body; submit: string }) {
  const about = STEP.fields.filter((f) => ABOUT.includes(f.key));
  const costs = STEP.fields.filter((f) => !ABOUT.includes(f.key));
  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">{about.map((f) => <FieldInput key={f.key} f={f} body={body} />)}</div>
      <section className="grid gap-3">
        <h2 className="font-semibold">What it would cost</h2>
        <p className="text-muted-foreground text-sm">Leave a cost empty to carry it from the step before. Food is estimated from the USDA food plans unless you give a figure.</p>
        <div className="grid gap-4 sm:grid-cols-2">{costs.map((f) => <FieldInput key={f.key} f={f} body={body} />)}</div>
      </section>
      <div><Button type="submit">{submit}</Button></div>
    </form>
  );
}
