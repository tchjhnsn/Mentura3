"use client";

// D5 Transfer business (doc "Mentura console: screens, navigation and teams", 2026-11-25, after Vercel's "Transferring
// a project"): move a business, with every record and file, to another team you own; it opens in its new team. Opened
// from a business card's More menu on the team home (C40). The teams offered are the person's other teams where they
// are an Owner; the server checks that again (src/server/teams-core.ts) and so does the business store.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { transferBusinessAction } from "@/app/studio/team-actions";
import { transferTargets } from "@/server/teams-core";
import { businessHref } from "./data";
import { refreshTeams, TeamAvatar, useTeams, type Team } from "./team";

export function TransferDialog({ team, business, onClose }: { team: Team; business: { id: string; name: string } | null; onClose: () => void }) {
  const router = useRouter();
  const teams = useTeams();
  const targets = teams ? transferTargets(teams, team.slug) : null;
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const choice = picked ?? (targets?.length === 1 ? targets[0]!.slug : null);
  const to = targets?.find((t) => t.slug === choice) ?? null;

  const close = (open: boolean) => { if (!open && !pending) { setPicked(null); setError(null); onClose(); } };
  const move = () => {
    if (!business || !to) return;
    start(async () => {
      setError(null);
      const r = await transferBusinessAction(team.slug, business.id, to.slug);
      if (!r.ok) { setError(r.error); return; }
      await refreshTeams();
      router.push(businessHref(r.value.team, encodeURIComponent(r.value.venture)));
    });
  };

  return (
    <Dialog open={business !== null} onOpenChange={close}>
      <DialogContent className="sm:max-w-md" data-virtu-screen="D5">
        <DialogHeader>
          <DialogTitle>Transfer {business?.name}</DialogTitle>
          <DialogDescription>
            Move it, with every record and file, to another team you own. People on {team.name} lose access to it, and people on the team you pick get it.
          </DialogDescription>
        </DialogHeader>
        {targets === null ? (
          <div className="grid gap-2" aria-label="Loading your teams">{[0, 1].map((i) => <Skeleton key={i} className="h-11 rounded-lg" />)}</div>
        ) : targets.length === 0 ? (
          <p className="text-muted-foreground text-sm">You are not an Owner of any other team. Make a team from the switcher at the top of the sidebar, then transfer the business to it.</p>
        ) : (
          <div role="radiogroup" aria-label="Team to move it to" className="grid gap-1.5">
            {targets.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={choice === t.slug} disabled={pending} onClick={() => { setPicked(t.slug); setError(null); }}
                className={cn("flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors", choice === t.slug ? "border-foreground" : "hover:bg-accent")}>
                <TeamAvatar name={t.name} seed={t.id} small />
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                {choice === t.slug ? <CheckIcon className="size-4" aria-hidden /> : null}
              </button>
            ))}
          </div>
        )}
        {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)} disabled={pending}>{targets?.length === 0 ? "Close" : "Cancel"}</Button>
          {targets?.length ? (
            <Button onClick={move} disabled={!to || pending}>{pending ? <Loader2Icon className="animate-spin" /> : null}{pending ? "Moving the business" : "Transfer"}</Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
