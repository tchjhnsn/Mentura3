"use client";

// S7 Studio settings: people, billing, connectors, keys, limits and data controls for the whole studio
// (OpenAI settings anatomy: a sub-nav on the left on wide screens, tabs across the top on a phone).
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CopyIcon, KeyRoundIcon, UserPlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Face, Num } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { ConnectorRow } from "@/components/studio/connector-row";
import { PEOPLE } from "@/components/studio/data";
import { CONNECTORS, SHARED_CONNECTORS } from "@/components/studio/connect-data";

const SECTIONS = ["General", "People", "Billing", "Connectors", "API keys", "Limits", "Data controls"] as const;
type Section = (typeof SECTIONS)[number];

type Key = { id: string; name: string; masked: string; created: string; lastUsed: string; by: string };
const ROLES = ["Owner", "Admin", "Member", "Viewer"];

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
  const [section, setSection] = useState<Section>("General");
  const [saved, setSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const touch = () => { setDirty(true); setSaved(null); };

  const [name, setName] = useState("Torian's studio");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [roles, setRoles] = useState<Record<string, string>>({ torian: "Owner", maya: "Viewer", dev: "Member", ana: "Member" });
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");

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
      <ScreenHead n="S7" title="Studio settings" job="People, billing, connectors, keys and limits for the whole studio.">
        {saved ? <span className="text-muted-foreground text-sm">{saved}</span> : null}
        <Button onClick={() => { setSaved(dirty ? "Saved. Every venture uses the new settings." : "Nothing changed. Settings are up to date."); setDirty(false); }}>Save</Button>
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
            <Group n="S7.2" title="General" line="How the studio shows up for everyone in it.">
              <Row label="Studio name" hint="Shown in the top bar and on invites."><Input value={name} onChange={(e) => { setName(e.target.value); touch(); }} className="sm:w-64" /></Row>
              <Row label="Time zone" hint="Agents schedule calls and weekly plans in this time zone.">
                <Select value={timezone} onValueChange={(v) => { setTimezone(v); touch(); }}>
                  <SelectTrigger className="sm:w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>{["America/Chicago", "America/New_York", "America/Los_Angeles", "Europe/London"].map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                </Select>
              </Row>
              <Row label="Studio id" hint="Used by the Naive CLI to find this studio."><code className="bg-muted rounded px-2 py-1 text-xs">studio_torian_7f3a</code></Row>
            </Group>
          ) : null}

          {section === "People" ? (
            <section className="relative">
              <Num n="S7.3" className="absolute -top-2 right-0" />
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div><h2 className="text-base font-semibold">People</h2><p className="text-muted-foreground text-sm">Who can open the studio and what they may change.</p></div>
                <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}><UserPlusIcon />Invite</Button>
              </div>
              <ul className="divide-y rounded-lg border">
                {PEOPLE.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                    <Face id={p.id} sub={p.role} />
                    <Select value={roles[p.id]} onValueChange={(v) => { setRoles((r) => ({ ...r, [p.id]: v })); touch(); }} disabled={p.id === "torian"}>
                      <SelectTrigger size="sm" className="w-28" aria-label={`Role for ${p.name}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </li>
                ))}
                {invites.map((i) => (
                  <li key={i.email} className="flex items-center justify-between gap-3 p-3">
                    <span className="min-w-0"><span className="block truncate text-sm">{i.email}</span><span className="text-muted-foreground block text-xs">Invited as {i.role}, waiting to accept</span></span>
                    <Button variant="ghost" size="sm" onClick={() => setInvites((x) => x.filter((y) => y.email !== i.email))}>Cancel</Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {section === "Billing" ? (
            <Group n="S7.4" title="Billing" line="The studio pays for agent runs across every venture.">
              <Row label="Plan" hint="Founder plan: unlimited ventures, five people, Power models included.">
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
              <p className="text-muted-foreground mb-3 text-sm">Accounts set up once for the studio. Each venture still chooses which agents may use them, on its own Connectors screen.</p>
              <div className="divide-y rounded-lg border">
                {CONNECTORS.filter((c) => SHARED_CONNECTORS.includes(c.id)).map((c) => <ConnectorRow key={c.id} c={c} />)}
              </div>
              <Link href="/studio/v/haptic-plays/connectors" className="text-muted-foreground hover:text-foreground mt-2 inline-block text-xs underline">Open Haptic Plays connectors</Link>
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
            <Group n="S7.7" title="Limits" line="Caps that hold for every venture. Usage shows spend against them.">
              <Row label="Studio budget a month" hint="Venture budgets sit inside it."><Input inputMode="numeric" value={String(limits.budget)} onChange={(e) => { setLimits((l) => ({ ...l, budget: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })); touch(); }} className="w-28" /></Row>
              <Row label="Most one run may cost" hint="A run that would cost more stops and asks you."><Input inputMode="decimal" value={limits.perRun} onChange={(e) => { setLimits((l) => ({ ...l, perRun: e.target.value.replace(/[^0-9.]/g, "") })); touch(); }} className="w-28" /></Row>
              <Row label="Pause agents at the budget" hint="Held drafts stay held; nothing new starts."><Switch checked={limits.pause} onCheckedChange={(v) => { setLimits((l) => ({ ...l, pause: v })); touch(); }} /></Row>
              <Row label="Power models need a yes" hint="Agents ask before a run on the Power tier."><Switch checked={limits.power} onCheckedChange={(v) => { setLimits((l) => ({ ...l, power: v })); touch(); }} /></Row>
              <li className="p-4 text-xs"><Link href="/studio/usage" className="text-muted-foreground hover:text-foreground underline">See spend on Usage</Link></li>
            </Group>
          ) : null}

          {section === "Data controls" ? (
            <Group n="S7.8" title="Data controls" line="What agents may read. Private records never leave the venture, whatever is on here.">
              <Row label="Venture files" hint="Docs, decks and records in each venture's Files."><Switch checked={data.files} onCheckedChange={(v) => { setData((d) => ({ ...d, files: v })); touch(); }} /></Row>
              <Row label="Email through connected accounts" hint="Only threads with people on a venture's lists."><Switch checked={data.email} onCheckedChange={(v) => { setData((d) => ({ ...d, email: v })); touch(); }} /></Row>
              <Row label="Calendar free and busy" hint="Event titles stay hidden from agents."><Switch checked={data.calendar} onCheckedChange={(v) => { setData((d) => ({ ...d, calendar: v })); touch(); }} /></Row>
              <Row label="Bank and payment details" hint="Totals only when off; line items when on."><Switch checked={data.finance} onCheckedChange={(v) => { setData((d) => ({ ...d, finance: v })); touch(); }} /></Row>
              <Row label="Let model providers train on studio data" hint="Off by default. Private records are never sent either way."><Switch checked={data.training} onCheckedChange={(v) => { setData((d) => ({ ...d, training: v })); touch(); }} /></Row>
            </Group>
          ) : null}
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite someone</DialogTitle>
            <DialogDescription>They get an email with a link to join {name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm"><span>Email</span><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@example.com" /></label>
            <label className="block space-y-1 text-sm"><span>Role</span>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.filter((r) => r !== "Owner").map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button disabled={!/\S+@\S+\.\S+/.test(inviteEmail)} onClick={() => { setInvites((x) => [...x, { email: inviteEmail, role: inviteRole }]); setInviteEmail(""); setInviteOpen(false); }}>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
