"use client";

// T1 Team home (doc "Mentura console: screens, navigation and teams", 2026-11-25; was S1). The one action is Start:
// say a business in a sentence. An empty team shows the prompt in a hero with suggestions and four templates; once the
// team has businesses the prompt sits above their cards and the templates move behind "See the library". The prompt
// creates a real Naive business in this team and the cards are the team's businesses, through src/server/naive.ts,
// which checks the person belongs to the team in the URL before it reads or writes anything. A Viewer sees the cards
// and no prompt. Each card (C40) has a More menu for an Owner: Open, and Transfer (D5, src/components/studio/transfer.tsx).
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowRightIcon, Loader2Icon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PromptBox } from "@/components/studio/prompt-box";
import { TemplateCard } from "@/components/studio/template-card";
import { TransferDialog } from "@/components/studio/transfer";
import { businessHref, teamHref, TEMPLATES } from "@/components/studio/data";
import { useTeam, useTeamSlug } from "@/components/studio/team";
import { createVenture, listVentures, type Result } from "@/app/studio/actions";
import type { VentureSummary } from "@/server/naive";

const SUGGESTIONS = [
  "A wearable that lets coaches call plays by touch",
  "A paid newsletter about building codes",
  "A grant-funded after school robotics club",
  "Bookkeeping for small design studios",
];

export default function TeamHome() {
  const slug = useTeamSlug() ?? "";
  const known = useTeam();
  const team = known?.name ?? "";
  const viewer = known?.role === "viewer";
  const owner = known?.role === "owner";
  const [moving, setMoving] = useState<{ id: string; name: string } | null>(null);
  const realHref = (id: string) => businessHref(slug, encodeURIComponent(id));
  const [idea, setIdea] = useState<string | null>(null);
  const [made, setMade] = useState<Result<{ id: string }> | null>(null);
  const [ventures, setVentures] = useState<Result<VentureSummary[]> | null>(null);
  const [pending, startTransition] = useTransition();

  const load = () => { setVentures(null); void listVentures(slug).then(setVentures); };
  useEffect(load, [slug]);

  const start = (text: string) => {
    setIdea(text);
    setMade(null);
    startTransition(async () => {
      const r = await createVenture(text, slug);
      setMade(r);
      if (r.ok) setVentures(await listVentures(slug));
    });
  };

  const list = ventures?.ok ? ventures.value : null;
  const empty = list !== null && list.length === 0;
  const unreachable = ventures !== null && !ventures.ok;

  const prompt = viewer ? (
    <p className="text-muted-foreground text-sm">You can view this team&apos;s businesses.</p>
  ) : idea === null ? (
    <PromptBox autoFocus placeholder="Describe the business, who it is for, and what hurts today" suggestions={empty ? SUGGESTIONS : []} onSubmit={unreachable ? undefined : start} />
  ) : (
    <div className="bg-card rounded-xl border p-4" aria-live="polite">
      <div className="text-muted-foreground text-xs">Your idea</div>
      <p className="mt-0.5 text-sm font-medium">{idea}</p>
      {pending || !made ? (
        <div className="mt-4 flex items-center gap-2 text-sm"><Loader2Icon className="size-4 animate-spin" />Setting up the business</div>
      ) : made.ok ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Your business is ready</span>
          <Button asChild><Link href={realHref(made.value.id)}>Open the business<ArrowRightIcon /></Link></Button>
          <Button variant="ghost" onClick={() => setIdea(null)}>Start another</Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm">{made.error}</span>
          <Button variant="ghost" onClick={() => setIdea(null)}>Try again</Button>
        </div>
      )}
    </div>
  );

  return (
    <div data-virtu-screen="T1" className="pb-16">
      <div className="px-4 pt-5 md:px-8 md:pt-8">
        <p className="text-muted-foreground text-sm">{team ? <><span className="text-foreground font-medium">{team}</span> · </> : null}Businesses in this team</p>
      </div>

      {/* P1: the question and the prompt. A hero on an empty team, top left above the cards otherwise. */}
      <section className={empty || ventures === null ? "mx-auto mt-10 max-w-2xl px-4 md:mt-16" : "mt-4 max-w-2xl px-4 md:px-8"}>
        <h1 className={`${empty || ventures === null ? "text-center" : ""} text-2xl font-bold tracking-tight md:text-[30px] md:leading-tight`}>What business do you want to work on?</h1>
        {empty ? <p className="text-muted-foreground mt-2 text-center text-sm">Say it in a sentence. Mentura sets up the business, its agents and its first questions.</p> : null}
        <div className="mt-6">{prompt}</div>
      </section>

      {unreachable ? (
        <section className="mt-8 px-4 md:px-8" role="alert">
          <p className="text-sm">Mentura can&apos;t reach this team&apos;s businesses right now.</p>
          <p className="text-muted-foreground mt-1 text-xs">{ventures.error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>Try again</Button>
        </section>
      ) : ventures === null ? (
        <section className="mt-10 grid gap-3 px-4 md:grid-cols-2 md:px-8 xl:grid-cols-3" aria-label="Loading businesses">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </section>
      ) : empty ? (
        <section className="mx-auto mt-12 max-w-5xl px-4 md:px-8">
          <h2 className="text-sm font-semibold">Or start from a template</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {TEMPLATES.filter((t) => t.kind === "venture").slice(0, 4).map((t) => <TemplateCard key={t.id} t={t} />)}
          </div>
        </section>
      ) : (
        <section className="mt-10 px-4 md:px-8">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Businesses</h2>
            <Link href={teamHref(slug, "library")} className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline">See the library</Link>
          </div>
          <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Businesses in this team">
            {list!.map((v) => (
              <li key={v.id} className="relative">
                <Link href={realHref(v.id)} className={`bg-card hover:border-foreground/30 group flex min-w-0 flex-col rounded-xl border p-4 transition-colors${owner ? " pr-12" : ""}`}>
                  <span className="truncate text-[15px] font-semibold group-hover:underline">{v.name}</span>
                  <span className="text-muted-foreground mt-1 text-[13px] capitalize">{v.phase}</span>
                </Link>
                {owner ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2" aria-label={`More for ${v.name}`}><MoreHorizontalIcon /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link href={realHref(v.id)}>Open</Link></DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setMoving({ id: v.id, name: v.name })}>Transfer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}
      {known ? <TransferDialog team={known} business={moving} onClose={() => setMoving(null)} /> : null}
    </div>
  );
}
