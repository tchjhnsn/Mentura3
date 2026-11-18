import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarPlusIcon, ChevronRightIcon, MessageCircleIcon, PiggyBankIcon, TicketIcon } from "lucide-react";
import { addDays } from "@reflect/core/calendar";
import { budgetView } from "@reflect/core/budget";
import { CHAT_PROMPT } from "@reflect/core/chat-journal";
import { calendar } from "@/server/calendar-store";
import { friendIds, incomingRequests } from "@/server/connect-store";
import { listEntries } from "@/server/journal-store";
import { threadsOf } from "@/server/messages-store";
import { planOf } from "@/server/plan";
import { safe, type Ctx } from "./parts";

/**
 * Whether the person is new here: nothing on the calendar for the next month, no friends, requests or messages, no
 * budget and no chats. Anything that cannot be read counts as something being there, so a slow or broken store
 * never hides the cards.
 */
export async function isFirstRun(ctx: Ctx): Promise<boolean> {
  const some = true as const;
  const [cal, friends, requests, threads, money, entries] = await Promise.all([
    safe(calendar(ctx.userId, ctx.today, addDays(ctx.today, 30)).then((l) => l.length > 0), some),
    safe(friendIds(ctx.userId).then((s) => s.size > 0), some),
    safe(incomingRequests(ctx.userId).then((l) => l.length > 0), some),
    safe(threadsOf(ctx.userId).then((l) => l.length > 0), some),
    safe(planOf(ctx.userId).then(({ plan, budget }) => budgetView(plan, budget).allotted > 0), some),
    safe(listEntries(ctx.userId, 40).then((l) => l.some((e) => e.promptId === CHAT_PROMPT)), some),
  ]);
  return !(cal || friends || requests || threads || money || entries);
}

const STEPS: { href: string; icon: ReactNode; title: string; sub: string }[] = [
  { href: "/settings/connections/calendars", icon: <CalendarPlusIcon />, title: "Add your calendar", sub: "Bring in Google, Outlook or any calendar you subscribe to" },
  { href: "/plan#budget", icon: <PiggyBankIcon />, title: "Set your budget", sub: "Decide what each part of life gets a month" },
  { href: "/events", icon: <TicketIcon />, title: "Find an event", sub: "See what is on in Austin this week" },
  { href: `/chat?q=${encodeURIComponent("What can you help me with?")}`, icon: <MessageCircleIcon />, title: "Ask Reflect something", sub: "It answers and acts across the app" },
];

/** The first-run dashboard: four steps to start with, in place of a column of empty cards. */
export function StartHere() {
  return (
    <section aria-labelledby="start-here" className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="grid gap-1">
        <h2 id="start-here" className="text-lg font-semibold">Start here</h2>
        <p className="text-muted-foreground text-sm">This page fills in as you use Reflect. Four places to begin:</p>
      </div>
      <ol className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.href}>
            <Link href={s.href} className="bg-card hover:bg-accent group flex h-full items-center gap-4 rounded-xl border p-4 transition">
              <span className="bg-muted text-foreground relative grid size-11 shrink-0 place-items-center rounded-full [&_svg]:size-5">
                {s.icon}
                <span className="bg-background text-muted-foreground absolute -top-1 -right-1 grid size-5 place-items-center rounded-full border text-[11px] font-medium tabular-nums">{i + 1}</span>
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5"><span className="font-medium">{s.title}</span><span className="text-muted-foreground text-sm">{s.sub}</span></span>
              <ChevronRightIcon className="text-muted-foreground size-5 shrink-0 transition group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Shows the cards, or the first-run steps when the person has nothing in Reflect yet. */
export async function Board({ ctx, children }: { ctx: Ctx; children: ReactNode }) {
  return (await safe(isFirstRun(ctx), false)) ? <StartHere /> : <>{children}</>;
}
