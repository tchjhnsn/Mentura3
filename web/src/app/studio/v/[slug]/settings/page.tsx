"use client";

// V16 Venture settings: team, budget, approvals and publishing for this venture.
import { use, useState, type ReactNode } from "react";
import { CheckIcon, MailIcon, UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Face, Num, SpendMeter } from "@/components/studio/bits";
import { AGENTS, PEOPLE, personOf, ventureOf } from "@/components/studio/data";
import { ScreenHead } from "@/components/studio/shell";

function Section({ n, title, about, children, danger }: { n: string; title: string; about?: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className="relative grid gap-3 py-6 md:grid-cols-[220px_1fr] md:gap-8">
      <Num n={n} className="absolute top-2 right-0" />
      <div>
        <h2 className={danger ? "text-sm font-semibold text-red-600" : "text-sm font-semibold"}>{title}</h2>
        {about ? <p className="text-muted-foreground mt-1 text-xs">{about}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1"><div className="text-sm">{label}</div>{sub ? <div className="text-muted-foreground text-xs">{sub}</div> : null}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const APPROVALS = [
  { id: "email", label: "Send email", sub: "Outreach, replies and follow ups." },
  { id: "spend", label: "Spend money", sub: "Any purchase or new subscription." },
  { id: "publish", label: "Publish", sub: "The venture site, posts and public templates." },
  { id: "sign", label: "Sign", sub: "Contracts, terms and agreements." },
] as const;

export default function VentureSettings({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const v = ventureOf(slug);
  const [name, setName] = useState(v.name);
  const [oneLine, setOneLine] = useState(v.oneLine);
  const [team, setTeam] = useState<{ id: string; role: string }[]>(() => v.team.map((id) => ({ id, role: id === "torian" ? "Owner" : "Editor" })));
  const [invites, setInvites] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [budget, setBudget] = useState(String(v.budgetMonth));
  const [caps, setCaps] = useState<Record<string, string>>(() => Object.fromEntries(AGENTS.slice(0, 5).map((a) => [a.id, a.model === "Power" ? "40" : "20"])));
  // true means held for you; false means the agent may do it alone.
  const [held, setHeld] = useState<Record<string, boolean>>({ email: true, spend: true, publish: true, sign: true });
  const [smallSpend, setSmallSpend] = useState(true);
  const [site, setSite] = useState(v.slug === "founder-raise");
  const [template, setTemplate] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archived, setArchived] = useState(false);
  const [saved, setSaved] = useState(false);
  const touch = () => setSaved(false);

  const budgetNum = Number(budget) || v.budgetMonth;

  return (
    <div className="pb-10">
      <ScreenHead n="V16" title="Venture settings" job={`Team, budget, approvals and publishing for ${v.name}.`}>
        <span className="relative">
          <Num n="V16.7" className="absolute -top-2 -left-2 z-10" />
          <Button onClick={() => setSaved(true)}>{saved ? <><CheckIcon />Saved</> : "Save changes"}</Button>
        </span>
      </ScreenHead>

      <div className="divide-y px-4 md:px-8">
        <Section n="V16.1" title="General" about="How the venture shows across the studio.">
          <div className="space-y-3">
            <label className="block"><span className="text-muted-foreground text-xs">Name</span><Input value={name} onChange={(e) => { setName(e.target.value); touch(); }} className="mt-1" /></label>
            <label className="block"><span className="text-muted-foreground text-xs">One line</span><Input value={oneLine} onChange={(e) => { setOneLine(e.target.value); touch(); }} className="mt-1" /></label>
          </div>
        </Section>

        <Section n="V16.2" title="Team" about="People who can open this venture and what they may change.">
          <div className="divide-y rounded-lg border">
            {team.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <Face id={m.id} sub={personOf(m.id).role} />
                {m.role === "Owner" ? <span className="text-muted-foreground text-xs">Owner</span> : (
                  <Select value={m.role} onValueChange={(r) => { setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, role: r } : x))); touch(); }}>
                    <SelectTrigger size="sm" className="w-28" aria-label={`Role for ${personOf(m.id).name}`}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Editor">Editor</SelectItem><SelectItem value="Viewer">Viewer</SelectItem></SelectContent>
                  </Select>
                )}
              </div>
            ))}
            {invites.map((e) => (
              <div key={e} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2 text-sm"><MailIcon className="text-muted-foreground size-4 shrink-0" /><span className="truncate">{e}</span></span>
                <span className="text-muted-foreground shrink-0 text-xs">Invite sent</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setInviteOpen(true)}><UserPlusIcon />Invite</Button>
          <div className="text-muted-foreground mt-3 text-xs">Also in the studio:</div>
          <div className="mt-2 flex flex-wrap gap-4">
            {PEOPLE.filter((p) => !team.some((m) => m.id === p.id)).map((p) => (
              <button key={p.id} type="button" className="hover:bg-accent rounded-md p-1" onClick={() => { setTeam((t) => [...t, { id: p.id, role: "Viewer" }]); touch(); }} title={`Add ${p.name} as a viewer`}>
                <Face id={p.id} size={24} sub="Add as viewer" />
              </button>
            ))}
          </div>
        </Section>

        <Section n="V16.3" title="Budget and limits" about="Agents stop and ask you when they reach a cap.">
          <div className="space-y-4">
            <div className="relative"><Num n="C15" className="absolute -top-3 left-0" /><SpendMeter spent={v.spendMonth} budget={budgetNum} /></div>
            <label className="block max-w-48"><span className="text-muted-foreground text-xs">Monthly budget, dollars</span>
              <Input inputMode="numeric" value={budget} onChange={(e) => { setBudget(e.target.value.replace(/[^0-9]/g, "")); touch(); }} className="mt-1" />
            </label>
            <div className="divide-y rounded-lg border">
              {AGENTS.slice(0, 5).map((a) => (
                <Row key={a.id} label={a.name} sub={`${a.model} mode · ${a.runsToday} runs today`}>
                  <span className="flex items-center gap-1 text-sm"><span className="text-muted-foreground">$</span>
                    <Input inputMode="numeric" aria-label={`Monthly cap for ${a.name}`} value={caps[a.id] ?? ""} onChange={(e) => { setCaps((c) => ({ ...c, [a.id]: e.target.value.replace(/[^0-9]/g, "") })); touch(); }} className="h-8 w-16" />
                    <span className="text-muted-foreground text-xs">a month</span>
                  </span>
                </Row>
              ))}
            </div>
          </div>
        </Section>

        <Section n="V16.4" title="Approvals" about="Switch on to hold the action for your yes. Switch off to let agents do it alone.">
          <div className="divide-y rounded-lg border">
            {APPROVALS.map((a) => (
              <Row key={a.id} label={a.label} sub={`${a.sub} ${held[a.id] ? "Held for you." : "Agents do it alone."}`}>
                <Switch checked={held[a.id]} onCheckedChange={(c) => { setHeld((h) => ({ ...h, [a.id]: c })); touch(); }} aria-label={`Hold ${a.label} for you`} disabled={a.id === "sign"} />
              </Row>
            ))}
            <Row label="Let agents spend under $5 alone" sub="Small purchases like a domain renewal skip the hold.">
              <Switch checked={smallSpend} onCheckedChange={(c) => { setSmallSpend(c); touch(); }} aria-label="Let agents spend under $5 alone" />
            </Row>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">Signing is always held. It is a one-way door and is never delegated.</p>
        </Section>

        <Section n="V16.5" title="Publishing" about="What the world can see.">
          <div className="divide-y rounded-lg border">
            <Row label="Venture site" sub={site ? `Live at ${v.slug}.mentura.site` : "Off. Nothing about this venture is public."}>
              <Switch checked={site} onCheckedChange={(c) => { setSite(c); touch(); }} aria-label="Venture site" />
            </Row>
            <Row label="Share as a public template" sub={template ? "Listed in the community library, without your records." : "Others cannot copy this venture's setup."}>
              <Switch checked={template} onCheckedChange={(c) => { setTemplate(c); touch(); }} aria-label="Share as a public template" />
            </Row>
          </div>
        </Section>

        <Section n="V16.6" title="Danger zone" danger about="Archiving stops every agent and hides the venture. Records are kept.">
          {archived ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span>{v.name} is archived. Agents are stopped.</span>
              <Button variant="ghost" size="sm" onClick={() => setArchived(false)}>Restore</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="border-red-600/40 text-red-600 hover:text-red-600" onClick={() => setArchiveOpen(true)}>Archive venture</Button>
          )}
        </Section>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to {v.name}</DialogTitle>
            <DialogDescription>They join as an editor. You can change their role after they accept.</DialogDescription>
          </DialogHeader>
          <Input type="email" placeholder="name@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} autoFocus />
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button variant="outline" disabled={!inviteEmail.includes("@")} onClick={() => { setInvites((i) => [...i, inviteEmail.trim()]); setInviteEmail(""); setInviteOpen(false); touch(); }}>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive {v.name}?</DialogTitle>
            <DialogDescription>{v.agentsRunning} running agents stop now. Files, decisions and history are kept, and you can restore it later.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Keep it</Button></DialogClose>
            <Button variant="destructive" onClick={() => { setArchived(true); setArchiveOpen(false); }}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
