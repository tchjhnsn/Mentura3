import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PAGE } from "@/components/page-header";
import { Face } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/server/session";
import { hashToken, tokenShaped } from "@/server/connect";
import { userByPersonalHash } from "@/server/connect-store";
import { connectFromQrAction } from "@/app/events/connect-actions";

export const metadata: Metadata = { title: "Connect" };
export const dynamic = "force-dynamic";

/**
 * Where someone's personal QR opens (doc "Events and connections design guide", 2026-11-18): their face and name,
 * and Connect, which sends them a request at the event you are both checked in to.
 */
export default async function ConnectPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/connect/${token}`)}`);
  const owner = tokenShaped(token) ? await userByPersonalHash(hashToken(token)) : null;
  return (
    <main className={PAGE}>
      <div className="mx-auto mt-16 grid max-w-md justify-items-center gap-4 text-center">
        {owner && owner.id !== user.id ? (
          <>
            <Face name={owner.name} size={112} />
            <h1 className="text-xl font-semibold">{owner.name}</h1>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <form action={connectFromQrAction.bind(null, token)}><Button type="submit" size="lg">Connect</Button></form>
            <p className="text-muted-foreground text-sm">You are friends in Reflect once you both tap Connect.</p>
          </>
        ) : owner ? (
          <>
            <h1 className="text-xl font-semibold">This is your own QR</h1>
            <p className="text-muted-foreground text-sm">Show it to someone checked in to the same event.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">This code no longer works</h1>
            <p className="text-muted-foreground text-sm">Ask them to open Your QR again.</p>
            <div><Button asChild variant="outline"><Link href="/v">Village and polis</Link></Button></div>
          </>
        )}
      </div>
    </main>
  );
}
