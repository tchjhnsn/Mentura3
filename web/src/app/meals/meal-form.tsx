import { kindOf } from "@reflect/core/life";
import { FieldInput } from "@/app/life/record";
import { Button } from "@/components/ui/button";

/** A meal's facts: name, what it serves, its ingredients one a line, and how to make it. */
export function MealForm({ action, body, submit }: { action: (form: FormData) => Promise<void>; body: Record<string, string | number | boolean>; submit: string }) {
  const kind = kindOf("home", "meal")!;
  return (
    <form action={action} className="grid gap-4">
      {kind.fields.map((f) => <FieldInput key={f.key} f={f} body={body} />)}
      <div><Button type="submit">{submit}</Button></div>
    </form>
  );
}
