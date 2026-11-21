"use client";

// M3 Chief of staff, after Contra's dashboard assistant (data.ts CONTRA.dashboard): a chat with your chief of staff agent
// about your network. Mock answers by keyword; ?q= sends that question on load.
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpIcon, BotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { EVENTS, ME, PEOPLE } from "@/components/mentura/data";
import { EventRow, Face, Head } from "@/components/mentura/parts";

type Kind = "investors" | "events" | "builders" | "plan";
type Msg = { id: number; from: "me" | "agent"; text: string; kind?: Kind };

const CHIPS = ["Which investors fit my raise?", "What events should I go to?", "Who could be my hardware co-founder?", "What should I do this week?"];

const WHY: Record<string, string> = {
  maya: "Writes first checks in hardware and sports, and saw your vest post.",
  james: "Coached for nine years and backs sports founders. He replied to your post.",
  priya: "Third Coast is looking at sports hardware and asked to talk.",
  dev: "Firmware and haptics, and open to a co-founder role.",
  lena: "Two exits as COO. She helps first-time founders hire well.",
};

function kindOf(q: string): Kind {
  const s = q.toLowerCase();
  if (/investor|raise|fund|money|check/.test(s)) return "investors";
  if (/event|dinner|meetup|demo/.test(s)) return "events";
  if (/cofounder|co-founder|hire|hiring|builder|engineer/.test(s)) return "builders";
  return "plan";
}

const LEAD: Record<Kind, string> = {
  investors: "These investors fit Haptic Plays and its pre-seed raise of $500K.",
  events: "These are coming up near you. You are already going to three.",
  builders: "These people could build Haptic Plays with you.",
  plan: "Here is a short plan for this week.",
};

function Answer({ kind }: { kind: Kind }) {
  if (kind === "investors") return (
    <ul className="mt-3 space-y-3">
      {PEOPLE.filter((p) => p.role === "Investor").map((p) => <li key={p.handle}><Face handle={p.handle} size={32} /><p className="text-muted-foreground mt-1 pl-[42px] text-sm">{WHY[p.handle]}</p></li>)}
    </ul>
  );
  if (kind === "events") return <div className="mt-2 -mx-2 space-y-1">{EVENTS.map((e) => <EventRow key={e.id} ev={e} />)}</div>;
  if (kind === "builders") return (
    <ul className="mt-3 space-y-3">
      {PEOPLE.filter((p) => p.role === "Builder" || p.role === "Operator").map((p) => <li key={p.handle}><Face handle={p.handle} size={32} /><p className="text-muted-foreground mt-1 pl-[42px] text-sm">{WHY[p.handle]}</p></li>)}
    </ul>
  );
  return (
    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed">
      <li>Post the practice video from Lincoln High on Tuesday.</li>
      <li>Send it to Maya Ortiz and ask for a first meeting in December.</li>
      <li>Take the call with Priya Shah and bring your numbers.</li>
      <li>Ask Dev Patel to the hardware night on Dec 9.</li>
    </ol>
  );
}

export default function Agent() {
  return <Suspense><Chat /></Suspense>;
}

function Chat() {
  const params = useSearchParams();
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 1, from: "me", text: "Who should I talk to first this week?" },
    { id: 2, from: "agent", text: "Start with Maya Ortiz. She asked for your practice video, and she takes first meetings in December. Then answer Priya Shah, who asked to message you.", kind: undefined },
  ]);
  const [text, setText] = useState("");
  const sent = useRef<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const send = (q: string) => {
    const t = q.trim();
    if (!t) return;
    const k = kindOf(t);
    setMsgs((m) => [...m, { id: m.length + 1, from: "me", text: t }, { id: m.length + 2, from: "agent", text: LEAD[k], kind: k }]);
    setText("");
  };

  useEffect(() => {
    const q = params.get("q");
    if (q && sent.current !== q) { sent.current = q; send(q); }
  }, [params]);
  useEffect(() => { end.current?.scrollIntoView?.({ block: "end" }); }, [msgs.length]);

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col px-4 pt-5 md:min-h-[calc(100dvh-1rem)] md:px-8">
      <Head n="M3" title="Chief of staff" job="Ask your agent anything about your network, ventures and meetings." />

      <div className="relative mx-auto w-full max-w-2xl flex-1 space-y-4 pb-6">
        <Num n="M3.1" className="absolute -top-2 right-0" />
        {msgs.map((m) => m.from === "me" ? (
          <div key={m.id} className="flex justify-end gap-2">
            <p className="bg-muted max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm">{m.text}</p>
            <Face handle={ME} size={28} name={false} />
          </div>
        ) : (
          <div key={m.id} className="flex gap-2">
            <span aria-hidden className="bg-foreground text-background grid size-7 shrink-0 place-items-center rounded-full"><BotIcon className="size-4" /></span>
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border px-3.5 py-2.5">
              <p className="text-sm leading-relaxed">{m.text}</p>
              {m.kind ? <Answer kind={m.kind} /> : null}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>

      <div className="bg-background sticky bottom-0 -mx-4 border-t px-4 pt-3 pb-4 md:-mx-8 md:px-8">
        <div className="relative mx-auto max-w-2xl">
          <Num n="M3.2" className="absolute -top-5 right-0" />
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {CHIPS.map((c) => <Button key={c} variant="outline" size="xs" className="shrink-0 rounded-full" onClick={() => send(c)}>{c}</Button>)}
          </div>
          <form className="flex items-end gap-2 rounded-xl border p-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder="Ask about your network" aria-label="Ask your chief of staff"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
              className="placeholder:text-muted-foreground max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2 text-sm outline-none" />
            <Button type="submit" size="icon-sm" disabled={!text.trim()} aria-label="Send"><ArrowUpIcon /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}
