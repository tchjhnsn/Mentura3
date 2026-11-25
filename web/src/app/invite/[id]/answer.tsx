"use client";

// A3's buttons: Accept (the one filled button) and Decline, and Switch account when the invitation is for another
// address. Accept and Decline are checked again on the server (src/server/teams-core.ts).
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { acceptInvitationAction, declineInvitationAction } from "@/app/studio/team-actions";

export function InvitationAnswer({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [doing, setDoing] = useState<"accept" | "decline" | null>(null);
  const [pending, start] = useTransition();
  const answer = (kind: "accept" | "decline") => start(async () => {
    setDoing(kind);
    setError(null);
    if (kind === "accept") {
      const r = await acceptInvitationAction(id);
      if (r.ok) { router.replace(`/studio/${r.value.team}`); return; }
      setError(r.error);
    } else {
      const r = await declineInvitationAction(id);
      if (r.ok) { router.replace(r.value.home ? `/studio/${r.value.home}` : "/"); return; }
      setError(r.error);
    }
    setDoing(null);
  });
  return (
    <div className="grid w-full gap-2">
      {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => answer("decline")} disabled={pending}>{pending && doing === "decline" ? <Loader2Icon className="animate-spin" /> : null}Decline</Button>
        <Button onClick={() => answer("accept")} disabled={pending}>{pending && doing === "accept" ? <Loader2Icon className="animate-spin" /> : null}Accept</Button>
      </div>
    </div>
  );
}

/** Signs out, then opens Sign in, which comes back to this invitation. */
export function SwitchAccount({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const go = async () => {
    setPending(true);
    await authClient.signOut().catch(() => undefined);
    window.location.href = `/sign-in?mode=sign-in&next=${encodeURIComponent(next)}`;
  };
  return <Button onClick={() => void go()} disabled={pending}>{pending ? <Loader2Icon className="animate-spin" /> : null}Switch account</Button>;
}
