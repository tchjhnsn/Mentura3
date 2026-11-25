"use client";

// T5 Team settings (was S7): General is real (the team's name, URL and avatar, and Leave team, in
// src/components/studio/team-general.tsx); people have their own page, Members (T4); billing, connectors, keys, limits
// and data controls are still the prototype's samples (OpenAI settings anatomy: a sub-nav on
// the left on wide screens, tabs across the top on a phone).
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CopyIcon, KeyRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Face, Num } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { ConnectorRow } from "@/components/studio/connector-row";
import { businessHref, teamHref } from "@/components/studio/data";
import { TeamGeneral } from "@/components/studio/team-general";
import { useTeam } from "@/components/studio/team";
import { CONNECTORS, SHARED_CONNECTORS } from "@/components/studio/connect-data";

const SECTIONS = ["General", "Billing", "Connectors", "API keys", "Limits", "Data controls"] as const;
type Section = (typeof SECTIONS)[number];

type Key = { id: string; name: string; masked: string; created: string; lastUsed: string; by: string };

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0"><div className="text-sm font-medium">{label}</div>{hint ? <div className="text-muted-foreground text-xs">{hint}</div> : null}</div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}
function Group({ n, title, line, children }: { n: string; title: string; line?: string; children: ReactNode }) {
  return (
    <section className="relative">
      <Num n={n} className="absolute -top-2 right-0" />
      <h2 className="text-base font-semibold">{title}</h2>
      {line ? <p className="text-muted-foreground mb-3 text-sm">{line}</p> : <div className="mb-3" />}
      <ul className="divide-y rounded-lg border">{children}</ul>
    </section>
  );
}

export default function StudioSettings() {
  const team = useTeam();
  const [section, setSection] = useState<Section>("General");
  const [saved, setSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const touch = () => { setDirty(true); setSaved(null); };

  const [keys, setKeys] = useState<Key[]>([
    { id: "k1", name: "Naive CLI on laptop", masked: "sk-...a1b2", created: "Oct 3", lastUsed: "Today", by: "torian" },
    { id: "k2", name: "Vest firmware CI", masked: "sk-...9f4c", created: "Oct 28", lastUsed: "2 days ago", by: "dev" },
  ]);
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [limits, setLimits] = useState({ budget: 280, perRun: "2.00", pause: true, power: false });
  const [data, setData] = useState({ files: true, email: true, calendar: true, finance: false, training: false });
  const [billingNote, setBillingNote] = useState<string | null>(null);

  const createKey = () => {
    const tail = Math.random().toString(16).slice(2, 6);
    const full = `sk-mock-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}${tail}`;
    setNewKey(full);
    setKeys((k) => [...k, { id: `k${k.length + 1}`, name: keyName.trim() || "New key", masked: `sk-...${tail}`, created: "Today", lastUsed: "Never", by: "torian" }]);
  };

  return (
    <div className="pb-16">
      <ScreenHead n="T5" title="Team settings" job={team ? `${team.name}: its name and URL, billing, connectors, keys and limits. People are on Members.` : "The team's name and URL, billing, connectors, keys and limits. People are on Members."}>
        {section !== "General" && saved ? <span className="text-muted-foreground text-sm">{saved}</span> : null}
        {section !== "General" ? <Button onClick={() => { setSaved(dirty ? "Saved. Every business uses the new settings." : "Nothing changed. Settings are up to date."); setDirty(false); }}>Save</Button> : null}
      </ScreenHead>

      <div className="flex flex-col gap-6 px-4 md:flex-row md:px-8">
        <nav className="relative md:w-44 md:shrink-0" aria-label="Settings sections">
          <Num n="S7.1" className="absolute -top-2 right-0 md:-right-1" />
          <ul className="-mx-4 flex gap-1 overflow-x-auto border-b px-4 pb-2 md:mx-0 md:flex-col md:border-b-0 md:px-0 md:pb-0">
            {SECTIONS.map((s) => (
              <li key={s} className="shrink-0">
                <button type="button" onClick={() => setSection(s)} aria-current={section === s ? "page" : undefined}
                  className={cn("w-full rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap", section === s ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/50")}>{s}</button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-8">
          {section === "General" ? (
            team ? <TeamGeneral key={`${team.id}:${team.slug}:${team.name}`} team={team} /> : <p className="text-muted-foreground text-sm">Reading the team</p>
          ) : null}

          {section === "Billing" ? (
            <Group n="S7.4" title="Billing" line="The team pays for agent runs across every business.">
              <Row label="Plan" hint="Founder plan: unlimited businesses, five people, Power models included.">
                <Button variant="outline" size="sm" onClick={() => setBillingNote("Plan options sent to your email. Nothing changes until you pick one.")}>Change plan</Button>
              </Row>
              <Row label="Card on file" hint="Mock card for the prototype."><span className="font-mono text-sm">Visa ending 4242, expires 08/28</span></Row>
              <li className="p-4">
                <div className="text-sm font-medium">Invoices</div>
                {billingNote ? <p className="text-muted-foreground mt-1 text-xs">{billingNote}</p> : null}
                <ul className="mt-2 divide-y text-sm">
                  {[["Nov 2026", "Open", "$116.00 so far"], ["Oct 2026", "Paid", "$204.18"], ["Sep 2026", "Paid", "$158.40"]].map(([m, s, a]) => (
                    <li key={m} className="flex items-center justify-between gap-2 py-2">
                      <span>{m}</span><span className="text-muted-foreground text-xs">{s}</span><span className="tabular-nums">{a}</span>
                      <Button variant="ghost" size="xs" onClick={() => setBillingNote(`${m} invoice opened in a new tab (mock).`)}>View</Button>
                    </li>
                  ))}
                </ul>
              </li>
            </Group>
          ) : null}

          {section === "Connectors" ? (
            <section className="relative">
              <Num n="S7.5" className="absolute -top-2 right-0" />
              <h2 className="text-base font-semibold">Shared connectors</h2>
              <p className="text-muted-foreground mb-3 text-sm">Accounts set up once for the team. Each business still chooses which agents may use them, on its own Connectors screen.</p>
              <div className="divide-y rounded-lg border">
                {CONNECTORS.filter((c) => SHARED_CONNECTORS.includes(c.id)).map((c) => <ConnectorRow key={c.id} c={c} />)}
              </div>
              <Link href={businessHref(team?.slug ?? "", "haptic-plays", "integrations")} className="text-muted-foreground hover:text-foreground mt-2 inline-block text-xs underline">Open Haptic Plays integrations</Link>
            </section>
          ) : null}

          {section === "API keys" ? (
            <section className="relative">
              <Num n="S7.6" className="absolute -top-2 right-0" />
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div><h2 className="text-base font-semibold">API keys</h2><p className="text-muted-foreground text-sm">For the Naive CLI, CI and scripts. A key is shown in full only once.</p></div>
                <Button variant="outline" size="sm" onClick={() => { setKeyName(""); setNewKey(null); setCopied(false); setKeyOpen(true); }}><KeyRoundIcon />Create key</Button>
              </div>
              <ul className="divide-y rounded-lg border">
                {keys.map((k) => (
                  <li key={k.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{k.name}</div><div className="text-muted-foreground text-xs">Created {k.created} · Last used {k.lastUsed}</div></div>
                    <code className="bg-muted rounded px-2 py-0.5 text-xs">{k.masked}</code>
                    <Face id={k.by} size={20} showName={false} />
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setKeys((x) => x.filter((y) => y.id !== k.id))}>Revoke</Button>
                  </li>
                ))}
                {!keys.length ? <li className="text-muted-foreground p-3 text-sm">No keys. Create one to use the Naive CLI.</li> : null}
              </ul>
            </section>
          ) : null}

          {section === "Limits" ? (
            <Group n="S7.7" title="Limits" line="Caps that hold for every business. Usage shows spend against them.">
              <Row label="Studio budget a month" hint="Business budgets sit inside it."><Input inputMode="numeric" value={String(limits.budget)} onChange={(e) => { setLimits((l) => ({ ...l, budget: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })); touch(); }} className="w-28" /></Row>
              <Row label="Most one run may cost" hint="A run that would cost more stops and asks you."><Input inputMode="decimal" value={limits.perRun} onChange={(e) => { setLimits((l) => ({ ...l, perRun: e.target.value.replace(/[^0-9.]/g, "") })); touch(); }} className="w-28" /></Row>
              <Row label="Pause agents at the budget" hint="Held drafts stay held; nothing new starts."><Switch checked={limits.pause} onCheckedChange={(v) => { setLimits((l) => ({ ...l, pause: v })); touch(); }} /></Row>
              <Row label="Power models need a yes" hint="Agents ask before a run on the Power tier."><Switch checked={limits.power} onCheckedChange={(v) => { setLimits((l) => ({ ...l, power: v })); touch(); }} /></Row>
              <li className="p-4 text-xs"><Link href={teamHref(team?.slug ?? "", "usage")} className="text-muted-foreground hover:text-foreground underline">See spend on Usage</Link></li>
            </Group>
          ) : null}

          {section === "Data controls" ? (
            <Group n="S7.8" title="Data controls" line="What agents may read. Private records never leave the business, whatever is on here.">
              <Row label="Business files" hint="Docs, decks and records in each business's Files."><Switch checked={data.files} onCheckedChange={(v) => { setData((d) => ({ ...d, files: v })); touch(); }} /></Row>
              <Row label="Email through connected accounts" hint="Only threads with people on a business's lists."><Switch checked={data.email} onCheckedChange={(v) => { setData((d) => ({ ...d, email: v })); touch(); }} /></Row>
              <Row label="Calendar free and busy" hint="Event titles stay hidden from agents."><Switch checked={data.calendar} onCheckedChange={(v) => { setData((d) => ({ ...d, calendar: v })); touch(); }} /></Row>
              <Row label="Bank and payment details" hint="Totals only when off; line items when on."><Switch checked={data.finance} onCheckedChange={(v) => { setData((d) => ({ ...d, finance: v })); touch(); }} /></Row>
              <Row label="Let model providers train on studio data" hint="Off by default. Private records are never sent either way."><Switch checked={data.training} onCheckedChange={(v) => { setData((d) => ({ ...d, training: v })); touch(); }} /></Row>
            </Group>
          ) : null}
        </div>
      </div>

      <Dialog open={keyOpen} onOpenChange={setKeyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newKey ? "Save your key" : "Create a key"}</DialogTitle>
            <DialogDescription>{newKey ? "This is the only time the whole key is shown. Store it somewhere safe." : "Name it after where it will run, so you know what breaks if you revoke it."}</DialogDescription>
          </DialogHeader>
          {newKey ? (
            <div className="flex items-center gap-2">
              <code className="bg-muted min-w-0 flex-1 truncate rounded px-2 py-1.5 text-xs">{newKey}</code>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(newKey).catch(() => {}); setCopied(true); }}><CopyIcon />{copied ? "Copied" : "Copy"}</Button>
            </div>
          ) : (
            <label className="block space-y-1 text-sm"><span>Name</span><Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Naive CLI on desktop" /></label>
          )}
          <DialogFooter>
            {newKey ? <Button onClick={() => setKeyOpen(false)}>Done</Button> : <><Button variant="ghost" onClick={() => setKeyOpen(false)}>Cancel</Button><Button onClick={createKey}>Create key</Button></>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
