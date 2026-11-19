import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { requireUser } from "@/server/session";
import { SkillForm } from "../skill-form";

export const metadata: Metadata = { title: "Write a skill" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Write a skill for Ask Reflect (Torian, 2026-11-18 22:54Z). */
export default async function NewSkill({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const error = one((await searchParams).error);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/marketplace?tab=skills" backLabel="Skills" crumbs={[{ label: "Marketplace", href: "/marketplace?tab=skills" }]} title="Write a skill" />
      <div className={COLUMN}>
        <div className="grid gap-1">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight">Write a skill</h1>
          <p className="text-muted-foreground text-sm">Tell Reflect how you want something done. It follows the skill whenever a request fits, and still waits for your Send before it changes anything.</p>
        </div>
        <SkillForm skill={null} error={error} />
      </div>
    </main>
  );
}
