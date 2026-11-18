import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ownerOf, profilePage } from "@/server/profile-store";
import { confirmSubscriber, leaveSite } from "@/server/site-store";
import { profileHref } from "@/server/actions/profiles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Subscription", robots: { index: false } };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Where the link in a subscriber's email lands: it confirms the subscription, or with leave=1 ends it. */
export default async function SubscribeLink({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const owner = await ownerOf((await params).key);
  const p = owner ? await profilePage(owner.id, null) : null;
  if (!owner || !p) notFound();
  const sp = await searchParams;
  const token = one(sp.t);
  const leaving = one(sp.leave) === "1";
  const site = leaving ? await leaveSite(token) : await confirmSubscriber(token);
  const ok = site === owner.id;
  return (
    <main className={PAGE}>
      <div className="mx-auto mt-24 grid max-w-sm justify-items-center gap-4 text-center">
        <h1 id="page-title" className="text-2xl font-semibold tracking-tight">
          {!ok ? "This link has expired" : leaving ? "You have left" : "You are subscribed"}
        </h1>
        <p className="text-muted-foreground">
          {!ok ? "It was used already or is not a link we sent." : leaving ? `You will not get ${p.name}'s writing by email any more.` : `New posts from ${p.name} come to your email.`}
        </p>
        <Button asChild><Link href={profileHref(p)}>Go to {p.name}&apos;s site</Link></Button>
      </div>
    </main>
  );
}
