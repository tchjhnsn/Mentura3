import { RELATIONS, type MemberBody } from "@reflect/core/household";
import type { Field } from "@reflect/core/life";
import { FieldInput } from "@/app/life/record";
import { Button } from "@/components/ui/button";

/** A member's facts, for one without a login or for correcting your own. Relation is fixed for the householder. */
export function MemberForm({ action, body, submit, self }: { action: (form: FormData) => Promise<void>; body: Partial<MemberBody>; submit: string; self?: boolean }) {
  const fields: Field[] = [
    { key: "name", label: "Name", kind: "text" },
    ...(self ? [] : [{ key: "relation", label: "Relationship to you", kind: "choice" as const, options: RELATIONS.filter((r) => r.id !== "self").map((r) => ({ id: r.id, label: r.label })) }]),
    { key: "born", label: "Year born", kind: "number", hint: "1958" },
    { key: "dependent", label: "Claimed as a dependent for taxes", kind: "check" },
  ];
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">{fields.map((f) => <FieldInput key={f.key} f={f} body={body as Record<string, string | number | boolean>} />)}</div>
      <div><Button type="submit">{submit}</Button></div>
    </form>
  );
}
