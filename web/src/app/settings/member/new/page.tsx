import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { addMemberAction } from "../../actions";
import { MemberForm } from "../../member-form";

export const metadata: Metadata = { title: "Add someone" };
export const dynamic = "force-dynamic";

/** Someone who lives with you and won't make an account, such as an elder parent or a young child. You keep their record. */
export default async function NewMemberPage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <ThingHeader back="/settings?tab=household" backLabel="Household" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Household", href: "/settings?tab=household" }]} title="Add someone" />
      <div className="mt-4 grid max-w-2xl gap-4">
        <h1 id="page-title" className="text-lg font-semibold tracking-tight">Add someone without a login</h1>
        <p className="text-muted-foreground text-sm">You keep their record. If they make an account later, you can send them a link to claim it.</p>
        <MemberForm action={addMemberAction} body={{}} submit="Add them" />
      </div>
    </main>
  );
}
