import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { BriefcaseIcon } from "lucide-react";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { Face } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/db/pool";
import { requireUser } from "@/server/session";
import { profileOf } from "@/server/connect-store";
import { saveProfileAction } from "@/app/events/connect-actions";

export const metadata: Metadata = { title: "What people see" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * What people see (doc "Events and connections design guide", 2026-11-18): what a member shows people checked in to
 * the same event. Name and face always; a line, interests and "I want to build something" only once written here.
 */
export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const raw = one(sp.back);
  const back = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/settings";
  const [p, who] = await Promise.all([profileOf(user.id), db().query(`SELECT name FROM "user" WHERE id = $1`, [user.id]).then((r) => r.rows[0] as { name?: string } | undefined)]);
  const name = who?.name?.trim() || "You";
  const error = one(sp.error);
  const fromHere = back.startsWith("/events/");
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back={back} backLabel={fromHere ? "Here" : "Settings"} crumbs={[{ label: fromHere ? "Here" : "Settings", href: back }]} title="What people see" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">What people see</h1>
        <section aria-label="As others see you" className="grid justify-items-center gap-2 text-center">
          <Face name={name} size={96} />
          <span className="text-lg font-semibold">{name}</span>
          {p.line ? <span className="text-muted-foreground max-w-xs text-sm">{p.line}</span> : null}
          {p.builds ? <span className="text-muted-foreground text-xs">Wants to build something</span> : null}
          {p.interests.length ? <span className="text-primary max-w-xs text-sm font-medium">{p.interests.join(", ")}</span> : null}
        </section>
        <form action={saveProfileAction.bind(null, back)} className="bg-card grid gap-5 rounded-2xl border p-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Your line</span>
            <Input name="line" defaultValue={p.line ?? ""} maxLength={120} placeholder="What you are working on, in a sentence" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Interests</span>
            <Input name="interests" defaultValue={p.interests.join(", ")} placeholder="climbing, urban planning, jazz" />
            <span className="text-muted-foreground text-xs">Separate with commas. People checked in with you see the ones you share.</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="builds" defaultChecked={p.builds} className="accent-primary size-5" />
            <span className="text-sm">I want to build something</span>
          </label>
          {error ? <p className="text-destructive text-sm">{error}</p> : one(sp.saved) ? <p className="text-muted-foreground text-sm">Saved.</p> : null}
          <Button type="submit" className="justify-self-start">Save</Button>
        </form>
        <Group>
          <Row href="/settings/profile/linkedin" icon={<BriefcaseIcon />} label="LinkedIn" sub="Experience and connections from your export" />
        </Group>
        <p className="text-muted-foreground text-center text-xs">Only people checked in to the same event see this, and only while it runs. Your email is never shown.</p>
      </div>
    </main>
  );
}
