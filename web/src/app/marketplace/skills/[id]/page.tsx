import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { skillOf } from "@/server/skills";
import { removeSkillAction, toggleSkillAction } from "../../actions";
import { SkillForm } from "../skill-form";

export const metadata: Metadata = { title: "Skill" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** One of the person's skills: its fields, on or off, and Remove. */
export default async function SkillPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const s = await skillOf(user.id, (await params).id);
  if (!s) notFound();
  const sp = await searchParams;
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/marketplace?tab=skills" backLabel="Skills" crumbs={[{ label: "Marketplace", href: "/marketplace?tab=skills" }]} title={s.name} />
      <div className={COLUMN}>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{s.name}</h1>
            <p className="text-muted-foreground text-sm">{s.enabled ? "On. Reflect follows it when a request fits." : "Off. Reflect does not use it."}</p>
          </div>
          <form action={toggleSkillAction.bind(null, s.id, !s.enabled)}><Button type="submit" variant="outline" size="sm">{s.enabled ? "Turn off" : "Turn on"}</Button></form>
        </div>
        {one(sp.saved) ? <p className="bg-muted rounded-xl px-4 py-3 text-sm" role="status">Saved. Reflect uses it from your next message.</p> : null}
        <SkillForm skill={s} error={one(sp.error)} />
        <form action={removeSkillAction.bind(null, s.id)}><Button type="submit" variant="ghost" className="text-destructive px-0">Remove skill</Button></form>
      </div>
    </main>
  );
}
