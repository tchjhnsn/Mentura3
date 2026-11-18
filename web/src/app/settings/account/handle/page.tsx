import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { requireUser } from "@/server/session";
import { profileSettings } from "@/server/profile-store";
import { saveHandleAction } from "../actions";
import { HandleField } from "./handle-field";

export const metadata: Metadata = { title: "Handle" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Settings, Account, Handle: one field, checked as the person types. */
export default async function HandlePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { handle } = await profileSettings(user.id);
  const want = one(sp.want);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/account" backLabel="Account" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Account", href: "/settings/account" }]} title="Handle" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Handle</h1>
        <HandleField key={`${handle ?? ""}:${want}`} initial={want || handle || ""} current={handle} action={saveHandleAction} error={one(sp.error) || null} />
        {one(sp.saved) ? <p className="text-muted-foreground text-center text-sm">Saved.</p> : null}
        <p className="text-muted-foreground text-center text-xs">Your profile&apos;s address is /p/{handle ?? "your-handle"}. When you change it, your old handle keeps working for 30 days.</p>
      </div>
    </main>
  );
}
