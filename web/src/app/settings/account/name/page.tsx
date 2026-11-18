import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { Face } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/server/session";
import { NAME_MAX, nameOf } from "@/server/account-store";
import { saveNameAction } from "../actions";

export const metadata: Metadata = { title: "Name and face" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Settings, Account, Name and face: the name people see, over the face it makes. Photos are not built yet. */
export default async function NamePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const name = await nameOf(user.id);
  const error = one(sp.error);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/account" backLabel="Account" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Account", href: "/settings/account" }]} title="Name and face" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Name and face</h1>
        <div className="grid justify-items-center gap-2">
          <Face name={name || "You"} size={96} />
          <p className="text-muted-foreground max-w-xs text-center text-xs">Your face is your initials. Adding a photo is not built yet.</p>
        </div>
        <form action={saveNameAction} className="bg-card grid gap-3 rounded-2xl border p-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Name</span>
            <Input name="name" defaultValue={name} maxLength={NAME_MAX} required autoComplete="name" />
          </label>
          {error ? <p className="text-destructive text-sm">{error}</p> : one(sp.saved) ? <p className="text-muted-foreground text-sm">Saved.</p> : null}
          <Button type="submit" className="justify-self-start">Save</Button>
        </form>
        <p className="text-muted-foreground text-center text-xs">People see this name on your profile and at events.</p>
      </div>
    </main>
  );
}
