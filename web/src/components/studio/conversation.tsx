"use client";

// C5 Conversation: talking to one top-level agent about one venture, the main way to work in the Venture Studio.
// The agent fetches the records it needs and answers with a json-render spec built from them (answer-catalog.ts),
// so the right thing shows at the right time instead of a screen of panels.
import { useEffect, useRef, useState } from "react";
import { DatabaseIcon } from "lucide-react";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { cn } from "@/lib/utils";
import { Face, Num, StatusDot } from "./bits";
import { RUNS, agentOf, ventureOf } from "./data";
import { answerRegistry, specOf } from "./answer-registry";
import { PromptBox } from "./prompt-box";
import { leadOf, nextPhase, phaseLabel, phaseOf, workersOf, type Lead } from "./phase";

type Piece = { type: string; props: Record<string, unknown> };
type Msg = { id: string; who: "you" | "agent"; text: string; fetched?: string[]; pieces?: Piece[]; pending?: boolean };

/** The lead's face: a coloured circle with its initial. Agents are not people, so no photo. */
export function LeadMark({ lead, size = 32 }: { lead: Lead; size?: number }) {
  return <span aria-hidden className="grid shrink-0 place-items-center rounded-lg font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.42, background: `oklch(0.55 0.12 ${lead.hue})` }}>{lead.name[0]}</span>;
}

function answer(slug: string, lead: Lead, ask: string): Omit<Msg, "id" | "who"> {
  const v = ventureOf(slug);
  const s = phaseOf(slug);
  const next = nextPhase(s.phase);
  const q = ask.toLowerCase();
  if (/phase|next|beachhead|validation|discovery|scale|ready/.test(q)) {
    const open = s.criteria.filter((c) => !c.met);
    return {
      text: `${v.name} is in ${phaseLabel(s.phase)}. ${open.length} of ${s.criteria.length} things stand between it and ${next ? phaseLabel(next) : "the end"}. Here they are, and who is on each.`,
      fetched: [`foundation/exit-criteria/${s.phase}.json`, "operations/handoffs/"],
      pieces: [
        { type: "NextPhase", props: { slug } },
        { type: "Plan", props: { title: "What happens next", steps: open.map((c, i) => ({ title: c.statement, who: leadOf(c.owner).name, status: i === 0 ? "Running" : "Next" })) } },
      ],
    };
  }
  if (/deck|pitch|slide|present/.test(q)) {
    return {
      text: `The investor deck is drafted from the one-pager. ${lead.id === "growth-lead" ? "I" : "The Growth lead"} tightened the problem slide. Sharing it waits for you.`,
      fetched: ["marketing/decks/investor.deck", "strategy/one-pager.md"],
      pieces: [
        { type: "Record", props: { slug, path: "marketing/decks/investor.deck", title: "Investor deck", lines: ["6 slides: problem, solution, why now, traction, market, ask.", "Slide 2 now opens with the coach who lost a playoff game to crowd noise."] } },
        { type: "Held", props: { who: "Growth lead", what: "Share the investor deck with Maya Ortiz", detail: "View only link. She asked for it on Tuesday." } },
      ],
    };
  }
  if (/doing|activity|run|agents|working/.test(q)) {
    return { text: "Here is what the agents did in the last few hours. One draft is waiting for you and one run failed, which the Product lead is retrying.", fetched: ["traces/today.jsonl"], pieces: [{ type: "Runs", props: { slug } }] };
  }
  if (/price|decide|decision|should/.test(q)) {
    return {
      text: "This one is yours, because it sets a price in public.",
      fetched: ["decisions/price-the-pilot.json", "finance/budget.sheet"],
      pieces: [{ type: "Choice", props: { question: "Price the ten vest pilot", why: "Two coaches said $40 a player feels fair; parts cost $41 a vest. The Finance lead recommends $45 with the first month free.", options: ["$45 a player, first month free", "$40 a player", "Free pilot, price after"] } }],
    };
  }
  return {
    text: lead.id === "chief-of-staff" ? `I split that between the leads. I will bring you only what needs your call.` : workersOf(lead).length ? `I will take that on with ${workersOf(lead).map((a) => a.name).join(" and ")} and show you the draft first.` : "I will take that on and show you the draft first.",
    fetched: ["strategy/one-pager.md", "operations/week-47.md"],
    pieces: [
      { type: "Plan", props: { title: ask.length > 60 ? `${ask.slice(0, 57)}...` : ask, steps: [
        { title: "Read what the venture already knows", who: lead.name, status: "Done" },
        { title: "Draft it", who: lead.id === "chief-of-staff" ? "Strategy lead" : lead.name, status: "Running" },
        { title: "Your yes before anything leaves the venture", who: "You", status: "Waiting for you" },
      ] } },
    ],
  };
}

function seed(slug: string, lead: Lead): Msg[] {
  if (lead.id === "chief-of-staff") {
    const ask = `What does ${ventureOf(slug).name} need to reach the next phase?`;
    const a = answer(slug, lead, "next phase");
    const v = ventureOf(slug);
    return [
      { id: "s1", who: "you", text: ask },
      { id: "s2", who: "agent", ...a },
      { id: "s3", who: "agent", text: `One thing is waiting for you today.`, pieces: [{ type: "Held", props: { who: "Growth lead", what: slug === "pattern-language" ? "Send interview invites to five architects" : slug === "founder-raise" ? "Send the deck to three funders" : "Send the coach outreach email to Lincoln High", detail: `${v.needNow}` } }] },
    ];
  }
  const opener: Record<string, Piece[]> = {
    "strategy-lead": [{ type: "Record", props: { slug, path: "strategy/one-pager.md", title: "One-pager", lines: ["Who it is for, the problem in their words, and why now.", "'Why now' is still untested. I am looking for the league rule change that makes it urgent."] } }],
    "product-lead": [{ type: "Record", props: { slug, path: "products/interview-notes/coach-1.md", title: "Interview notes: coach 1", lines: ["He lost a playoff game when the quarterback could not hear the call.", "He would try a vest in practice if it takes under ten minutes to set up."] } }],
    "growth-lead": [{ type: "Record", props: { slug, path: "marketing/outreach/coaches-v2.md", title: "Coach outreach, draft 2", lines: ["Short email to three coaches at Lincoln High, offering a practice with the vest."] } }, { type: "Held", props: { who: "Growth lead", what: "Send the coach outreach email", detail: "Goes to Coach Reyes and two assistants." } }],
    "finance-lead": [{ type: "Record", props: { slug, path: "finance/budget.sheet", title: "Budget, November", lines: ["$41 spent of $120 this month.", "Vest parts are the biggest line; agent runs cost $18."] } }],
  };
  const STEP = { running: "Running", done: "Done", held: "Waiting for you", failed: "Next" } as const;
  const mine = RUNS.filter((r) => r.agent === lead.id);
  const runs: Piece[] = mine.length ? [{ type: "Plan", props: { title: "What I am on", steps: mine.map((r) => ({ title: r.title, who: lead.name, status: STEP[r.status] })) } }] : [];
  return [{ id: "s1", who: "agent", text: `${lead.covers}. Here is where my side of ${ventureOf(slug).name} stands.`, fetched: mine.length ? ["traces/today.jsonl"] : [], pieces: opener[lead.id] ?? runs }];
}

export function Conversation({ slug, leadId }: { slug: string; leadId: string }) {
  const lead = leadOf(leadId);
  const [msgs, setMsgs] = useState<Msg[]>(() => seed(slug, lead));
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { setMsgs(seed(slug, lead)); }, [slug, lead.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const seeded = useRef(msgs.length);
  // Scroll only for new messages, so the venture opens at the top with the phase bar in view.
  useEffect(() => { if (msgs.length > seeded.current) end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs.length]);
  const send = (text: string) => {
    const id = `m${Date.now()}`;
    setMsgs((m) => [...m, { id: `${id}y`, who: "you", text }, { id, who: "agent", text: "", pending: true }]);
    setTimeout(() => setMsgs((m) => m.map((x) => (x.id === id ? { id, who: "agent", ...answer(slug, lead, text) } : x))), 1100);
  };
  const s = phaseOf(slug);
  const chips = lead.id === "chief-of-staff"
    ? [`What do we need for ${phaseLabel(nextPhase(s.phase) ?? s.phase)}?`, "What are the agents doing?", "Show me the deck", "What should I decide today?"]
    : ["What are you working on?", "What needs my call?", "Show me the deck"];
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <Num n="C5" className="absolute top-0 left-0 z-10" />
      <div className="min-h-0 flex-1 space-y-6 py-4">
        {msgs.map((m) => m.who === "you" ? (
          <div key={m.id} className="flex justify-end"><p className="bg-muted max-w-[85%] rounded-2xl px-3.5 py-2 text-sm">{m.text}</p></div>
        ) : (
          <div key={m.id} className="flex gap-3">
            <LeadMark lead={lead} size={28} />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="text-muted-foreground text-xs font-medium">{lead.name}</div>
              {m.pending ? <p className="text-muted-foreground animate-pulse text-sm">Reading the venture's records...</p> : (
                <>
                  {m.fetched?.length ? <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs"><DatabaseIcon className="size-3" />Read {m.fetched.join(", ")}</p> : null}
                  {m.text ? <p className="text-sm leading-relaxed">{m.text}</p> : null}
                  {m.pieces?.length ? <JSONUIProvider registry={answerRegistry}><Renderer spec={specOf(m.pieces)} registry={answerRegistry} /></JSONUIProvider> : null}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="bg-background sticky bottom-0 pt-2 pb-4">
        <PromptBox placeholder={`Ask ${lead.name}`} suggestions={chips} onSubmit={send} />
      </div>
    </div>
  );
}

/** The header over a conversation: who you are talking to and who works under them. */
export function LeadHeader({ leadId }: { leadId: string }) {
  const lead = leadOf(leadId);
  const workers = workersOf(lead);
  return (
    <div className="flex items-start gap-3">
      <LeadMark lead={lead} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><h1 className="truncate text-lg font-semibold">{lead.name}</h1><StatusDot status={lead.status} /></div>
        <p className="text-muted-foreground text-sm">{lead.covers}.</p>
        {workers.length ? <p className={cn("text-muted-foreground mt-0.5 text-xs")}>Works with {workers.map((a) => agentOf(a.id).name).join(", ")}</p> : <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">Reports to <Face id="torian" size={16} showName={false} /> you</p>}
      </div>
    </div>
  );
}
