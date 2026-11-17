import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { relationLabel } from "@reflect/core/household";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { householdOf } from "@/server/household-store";
import { requireUser } from "@/server/session";
import { inviteAction, removeMemberAction, saveMemberAction } from "../../actions";
import { MemberForm } from "../../member-form";

export const metadata: Metadata = { title: "Member" };
export const dynamic = "force-dynamic";

/** One member of the household. Their own record, or one you keep, can be changed here; others only by them. */
export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const h = await householdOf(user.id);
  const m = h?.members.find((x) => x.id === id);
  if (!h || !m) notFound();
  const admin = h.members.find((x) => x.you)?.role === "admin";
  const canEdit = m.you || m.keptBy === user.id || admin;
  return (
    <main className={PAGE}>
      <ThingHeader back="/settings?tab=household" backLabel="Household" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Household", href: "/settings?tab=household" }]} title={m.name} />
      <div className="mt-4 grid max-w-2xl gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid">
            <h1 id="page-title" className="text-lg font-semibold tracking-tight">{m.name}</h1>
            <p className="text-muted-foreground text-sm">{m.relation === "self" ? "Householder" : relationLabel(m.relation)}{m.account ? "" : ", no login"}</p>
          </div>
          {!m.account && canEdit ? <form action={inviteAction.bind(null, m.id)}><Button type="submit" variant="outline">Invite them to claim it</Button></form> : null}
        </div>
        {canEdit ? <MemberForm action={saveMemberAction.bind(null, m.id)} body={m} submit="Save" self={m.relation === "self"} /> : <p className="text-muted-foreground text-sm">Only {m.name} can change their own record.</p>}
        {canEdit && !m.account ? <form action={removeMemberAction.bind(null, m.id)}><Button type="submit" variant="ghost" className="text-muted-foreground">Take them out of the household</Button></form> : null}
      </div>
    </main>
  );
}
