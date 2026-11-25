"use client";

// V13 Outreach: people to reach, sequences, and every send held for your yes.
import { use, useState } from "react";
import { CheckIcon, AtSignIcon, MailIcon, SendIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Face, HeldCard, Num } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { ventureOf } from "@/components/studio/data";
import { CONTACTS, HELD_SENDS, INBOX, SEQUENCE, STAGES, type Contact, type Segment, type Stage } from "@/components/studio/activity-data";
import { cn } from "@/lib/utils";

const SEGMENTS: { id: "all" | Segment; label: string }[] = [
  { id: "all", label: "Everyone" }, { id: "coaches", label: "Coaches" }, { id: "athletic directors", label: "Athletic directors" }, { id: "funders", label: "Funders" },
];
const STAGE_TONE: Record<Stage, string> = {
  "to reach": "text-muted-foreground", contacted: "text-foreground", replied: "text-sky-600 dark:text-sky-400", meeting: "text-emerald-600 dark:text-emerald-400", "not now": "text-muted-foreground/70",
};

export default function OutreachPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const venture = ventureOf(slug);
  const [tab, setTab] = useState("people");
  const [sent, setSent] = useState<string[]>([]);
  const [returned, setReturned] = useState<string[]>([]);
  const waiting = HELD_SENDS.filter((s) => !sent.includes(s.id) && !returned.includes(s.id));

  return (
    <div className="pb-10">
      <ScreenHead n="V13" title="Outreach" job={`People ${venture.name} should reach, the sequences that reach them, and every send held for your yes.`}>
        <Button onClick={() => { setSent((s) => [...s, ...waiting.map((w) => w.id)]); setTab("sequences"); }} disabled={!waiting.length}>
          <SendIcon />{waiting.length ? `Approve and send ${waiting.length}` : "All sends approved"}
        </Button>
      </ScreenHead>

      <div className="px-4 md:px-8">
        <Tabs value={tab} onValueChange={setTab} className="relative">
          <Num n="V13.1" className="absolute -top-2 left-0 z-10" />
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="sequences">Sequences{waiting.length ? <span className="rounded-full bg-fuchsia-600 px-1.5 text-[10px] text-white">{waiting.length}</span> : null}</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
          </TabsList>
          <TabsContent value="people" className="mt-4"><People /></TabsContent>
          <TabsContent value="sequences" className="mt-4">
            <Sequences waiting={waiting} sent={sent} returned={returned}
              onYes={(id) => setSent((s) => [...s, id])} onNo={(id) => setReturned((r) => [...r, id])} />
          </TabsContent>
          <TabsContent value="inbox" className="mt-4"><Inbox /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function People() {
  const [segment, setSegment] = useState<"all" | Segment>("all");
  const [contacts, setContacts] = useState<Contact[]>(CONTACTS);
  const [note, setNote] = useState<string | null>(null);
  const shown = contacts.filter((c) => segment === "all" || c.segment === segment);
  const cycle = (id: string) => setContacts((cs) => cs.map((c) => c.id === id ? { ...c, stage: STAGES[(STAGES.indexOf(c.stage) + 1) % STAGES.length]! } : c));
  const counts = STAGES.map((s) => ({ s, n: contacts.filter((c) => c.stage === s).length }));

  return (
    <div className="space-y-4">
      {/* V13.2 Segment filter and import */}
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <Num n="V13.2" className="absolute -top-2 right-0 z-10" />
        <div className="flex flex-wrap gap-1">
          {SEGMENTS.map((s) => (
            <button key={s.id} type="button" aria-pressed={segment === s.id} onClick={() => setSegment(s.id)}
              className={cn("rounded-md px-2.5 py-1 text-sm", segment === s.id ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-accent")}>{s.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setNote("Reading linkedin-connections.csv. 212 rows found; the Marketing agent is matching them to coaches and athletic directors.")}><UploadIcon />LinkedIn CSV</Button>
          <Button variant="outline" size="sm" onClick={() => setNote("Gmail connected for reading. The agent found 37 people you have written to about sports and is adding them as 'to reach'.")}><MailIcon />From Gmail</Button>
        </div>
      </div>
      {note ? <p className="rounded-md border px-3 py-2 text-sm">{note}</p> : null}

      <p className="text-muted-foreground text-xs">{counts.map((c) => `${c.n} ${c.s}`).join(" · ")}. Tap a stage to move someone along.</p>

      {/* V13.3 Contacts: list on a phone, table on wide screens */}
      <section className="relative rounded-lg border">
        <Num n="V13.3" className="absolute -top-2 right-2 z-10" />
        <div className="text-muted-foreground hidden grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_8rem_minmax(0,1.5fr)] gap-3 border-b px-3 py-2 text-xs md:grid">
          <span>Person</span><span>Organization</span><span>Stage</span><span>Last touch</span>
        </div>
        <ul className="divide-y">
          {shown.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_8rem_minmax(0,1.5fr)]">
              <span className="min-w-0 flex-1"><Face id={c.name} sub={c.role} /></span>
              <span className="text-muted-foreground hidden truncate text-sm md:block">{c.org}</span>
              <button type="button" onClick={() => cycle(c.id)} title="Move to the next stage"
                className={cn("hover:bg-accent shrink-0 rounded-md px-2 py-1 text-left text-xs font-medium capitalize", STAGE_TONE[c.stage])}>{c.stage}</button>
              <span className="text-muted-foreground hidden truncate text-xs md:block">{c.last}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Sequences({ waiting, sent, returned, onYes, onNo }: {
  waiting: typeof HELD_SENDS; sent: string[]; returned: string[]; onYes: (id: string) => void; onNo: (id: string) => void;
}) {
  const [steps, setSteps] = useState(SEQUENCE.steps);
  const [added, setAdded] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* V13.4 Sequence */}
      <section className="relative min-w-0 rounded-lg border p-4">
        <Num n="V13.4" className="absolute -top-2 right-2" />
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">{SEQUENCE.name}</h2>
            <p className="text-muted-foreground text-xs">Drafted by the {SEQUENCE.by} · {SEQUENCE.enrolled} people enrolled</p>
          </div>
          <div className="flex gap-4 text-sm">
            <span><span className="font-semibold tabular-nums">{SEQUENCE.openRate}%</span> <span className="text-muted-foreground text-xs">opened</span></span>
            <span><span className="font-semibold tabular-nums">{SEQUENCE.replyRate}%</span> <span className="text-muted-foreground text-xs">replied</span></span>
          </div>
        </div>
        <ol className="mt-4 space-y-3 border-l pl-5">
          {steps.map((s, i) => (
            <li key={i} className="relative">
              <span className="bg-background absolute top-0.5 -left-[30px] grid size-5 place-items-center rounded-full border">
                {s.channel === "Email" ? <MailIcon className="size-3" /> : <AtSignIcon className="size-3" />}
              </span>
              <div className="text-muted-foreground text-xs">Day {s.day} · {s.channel}</div>
              <div className="text-sm">{s.label}</div>
            </li>
          ))}
        </ol>
        <Button variant="ghost" size="sm" className="mt-3" disabled={added}
          onClick={() => { setSteps((st) => [...st, { day: 9, channel: "Email", label: "Last note: offer the six week pilot, then stop" }]); setAdded(true); }}>
          {added ? "Step added on day 9" : "Ask the agent for one more step"}
        </Button>
      </section>

      {/* V13.5 Held sends */}
      <section className="relative min-w-0">
        <Num n="V13.5" className="absolute -top-2 right-0" />
        <h2 className="mb-2 text-sm font-medium">{waiting.length ? `${waiting.length} ${waiting.length === 1 ? "email" : "emails"} ready to send` : "Nothing waiting to send"}</h2>
        <div className="space-y-3">
          {waiting.map((s) => (
            <HeldCard key={s.id} who="Marketing agent" what={`${s.subject}, to ${s.to}`} detail={`${s.step} · ${s.org}`} onYes={() => onYes(s.id)} onNo={() => onNo(s.id)} />
          ))}
        </div>
        {sent.length || returned.length ? (
          <ul className="mt-4 space-y-1.5">
            {HELD_SENDS.filter((s) => sent.includes(s.id) || returned.includes(s.id)).map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                {sent.includes(s.id) ? <CheckIcon className="size-4 text-emerald-600" /> : <span className="text-muted-foreground w-4 text-center">↺</span>}
                <span className="min-w-0 truncate">{sent.includes(s.id) ? "Sent to" : "Sent back, for"} {s.to}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function Inbox() {
  const [state, setState] = useState<Record<string, "editing" | "sent">>({});
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(INBOX.map((m) => [m.id, m.suggested])));
  return (
    <section className="relative space-y-3">
      <Num n="V13.6" className="absolute -top-2 right-0 z-10" />
      {INBOX.map((m) => (
        <article key={m.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-2">
            <Face id={m.from} sub={m.org} />
            <span className="text-muted-foreground shrink-0 text-xs">{m.when}</span>
          </div>
          <p className="mt-3 text-sm">{m.text}</p>
          <div className="bg-muted/40 mt-3 rounded-md p-3">
            <div className="text-muted-foreground mb-1 text-xs">{state[m.id] === "sent" ? "You replied" : "The Marketing agent suggests"}</div>
            {state[m.id] === "editing" ? (
              <Textarea value={drafts[m.id]} onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))} className="bg-background min-h-24 text-sm" aria-label={`Reply to ${m.from}`} />
            ) : <p className="text-sm">{drafts[m.id]}</p>}
          </div>
          {state[m.id] === "sent" ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium"><CheckIcon className="size-3.5 text-emerald-600" />Sent. {m.from} moves to replied.</p>
          ) : (
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setState((s) => ({ ...s, [m.id]: "sent" }))}>{state[m.id] === "editing" ? "Send my version" : "Accept"}</Button>
              {state[m.id] !== "editing" ? <Button variant="ghost" size="sm" onClick={() => setState((s) => ({ ...s, [m.id]: "editing" }))}>Edit</Button> : null}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
