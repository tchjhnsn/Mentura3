import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SKILL_LIMITS, type UserSkill } from "@/server/skills";
import { saveSkillAction } from "../actions";

/** A skill's three fields, as in Claude's Skills: its name, when Ask Reflect should use it, and what to do. */
export function SkillForm({ skill, error }: { skill: UserSkill | null; error: string }) {
  return (
    <form action={saveSkillAction.bind(null, skill?.id ?? null)} className="grid gap-5">
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Name</span>
        <Input name="name" required maxLength={SKILL_LIMITS.name} defaultValue={skill?.name ?? ""} placeholder="Weekly review" />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Use it when</span>
        <Input name="description" required maxLength={SKILL_LIMITS.description} defaultValue={skill?.description ?? ""} placeholder="I ask to plan or look back on my week" />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">What Reflect should do</span>
        <Textarea name="instructions" required rows={10} maxLength={SKILL_LIMITS.instructions} defaultValue={skill?.instructions ?? ""}
          placeholder={"Start with what I finished, from my calendar and journal.\nThen the three things that matter most next week, each with a time.\nKeep it under ten lines."} />
      </label>
      {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full sm:w-auto sm:justify-self-start">{skill ? "Save" : "Add skill"}</Button>
    </form>
  );
}
