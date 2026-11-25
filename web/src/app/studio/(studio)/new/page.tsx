"use client";

// S2 New venture: start from an idea, a template, or a folder you already have, then name it, pick a team and a budget.
import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, CheckIcon, FolderIcon, GitBranchIcon, HardDriveIcon, LightbulbIcon, LayoutTemplateIcon, UploadIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Face, Num } from "@/components/studio/bits";
import { PromptBox } from "@/components/studio/prompt-box";
import { ScreenHead } from "@/components/studio/shell";
import { Maker } from "@/components/studio/template-card";
import { PEOPLE, SCREENS, TEMPLATES, ventureHref } from "@/components/studio/data";

const S2 = SCREENS.find((s) => s.id === "S2")!;
type Way = "idea" | "template" | "import";

const WAYS: { id: Way; label: string; line: string; icon: typeof LightbulbIcon }[] = [
  { id: "idea", label: "From an idea", line: "Say it in a sentence, then answer four questions.", icon: LightbulbIcon },
  { id: "template", label: "From a template", line: "Start with folders, agents and decks someone set up.", icon: LayoutTemplateIcon },
  { id: "import", label: "Import a folder or repo", line: "Bring what you have from GitHub, Drive or your computer.", icon: FolderIcon },
];

const QUESTIONS = [
  { id: "exists", label: "Exists", q: "What problem do you think exists?", ph: "Coaches lose plays in the noise of a game and players miss the call." },
  { id: "segment", label: "Segment", q: "Who has it most, specifically?", ph: "High school football coaches with 30 to 60 players and no headsets." },
  { id: "hurts", label: "Hurts", q: "How do you know it hurts them?", ph: "Two coaches said they burn a timeout a game on a missed call." },
  { id: "why-now", label: "Why now", q: "Why is now the time?", ph: "Haptic motors got cheap and thin enough to sew into a practice vest." },
];

const SOURCES = [
  { id: "github", label: "GitHub", icon: GitBranchIcon, items: ["torian/haptic-firmware", "torian/play-caller-app", "torian/notes"] },
  { id: "drive", label: "Google Drive", icon: HardDriveIcon, items: ["Haptic Plays / Interviews", "Haptic Plays / Vendor quotes", "Pitch drafts"] },
  { id: "upload", label: "Upload", icon: UploadIcon, items: ["haptic-plays.zip (14 files)"] },
] as const;

export default function NewVenture() {
  const [way, setWay] = useState<Way>("idea");
  const [idea, setIdea] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [template, setTemplate] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [team, setTeam] = useState<string[]>(["torian"]);
  const [budget, setBudget] = useState("120");
  const [created, setCreated] = useState(false);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const src = SOURCES.find((s) => s.id === source);
  const ventureName = name.trim() || "Haptic Plays";

  if (created) {
    return (
      <div className="pb-16">
        <ScreenHead n="S2" title={S2.title} job={S2.job} />
        <div className="relative mx-4 max-w-xl rounded-2xl border p-6 md:mx-8" aria-live="polite">
          <Num n="S2.6" className="absolute top-2 right-2" />
          <span className="grid size-10 place-items-center rounded-full bg-emerald-600 text-white"><CheckIcon className="size-5" /></span>
          <h2 className="mt-3 text-lg font-semibold">{ventureName} is set up</h2>
          <p className="text-muted-foreground mt-1 text-sm">It starts at explore with a ${budget} monthly budget. Mentura is planning the first week and will ask you before anything goes out.</p>
          <div className="mt-3 flex flex-wrap gap-3">{team.map((id) => <Face key={id} id={id} size={24} />)}</div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild><Link href={ventureHref("haptic-plays")}>Open {ventureName}<ArrowRightIcon /></Link></Button>
            <Button variant="ghost" onClick={() => setCreated(false)}>Back to the form</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <ScreenHead n="S2" title={S2.title} job={S2.job} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 md:px-8">
        <section className="relative">
          <Num n="S2.1" className="absolute -top-2 right-0" />
          <h2 className="text-sm font-semibold">How do you want to start?</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="How to start">
            {WAYS.map((w) => (
              <button key={w.id} type="button" role="radio" aria-checked={way === w.id} onClick={() => setWay(w.id)}
                className={cn("rounded-xl border p-3 text-left transition-colors", way === w.id ? "border-foreground ring-foreground ring-1" : "hover:border-foreground/30")}>
                <w.icon className="size-4" />
                <div className="mt-2 text-sm font-medium">{w.label}</div>
                <div className="text-muted-foreground text-xs">{w.line}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="relative">
          <Num n="S2.2" className="absolute -top-2 right-0" />
          {way === "idea" ? (
            <div className="space-y-4">
              {idea ? (
                <div className="bg-muted/60 flex items-start justify-between gap-2 rounded-lg p-3">
                  <div className="min-w-0"><div className="text-muted-foreground text-xs">Your idea</div><p className="text-sm">{idea}</p></div>
                  <Button variant="ghost" size="sm" onClick={() => setIdea("")}>Change</Button>
                </div>
              ) : (
                <PromptBox placeholder="What is the business, in a sentence?" suggestions={["Coaches call plays by touch on a wearable vest", "Fund a founder's time, not one idea"]}
                  onSubmit={(t) => { setIdea(t); if (!name) setName(t.split(" ").slice(0, 3).join(" ")); }} />
              )}
              <div>
                <h3 className="text-sm font-semibold">Four questions the evidence will test</h3>
                <p className="text-muted-foreground text-xs">Your answers become the four assumptions. Each starts untested until an interview or a number supports it.</p>
                <ol className="mt-3 space-y-3">
                  {QUESTIONS.map((q, i) => (
                    <li key={q.id}>
                      <label className="text-sm font-medium" htmlFor={`q-${q.id}`}><span className="text-muted-foreground mr-1.5">{i + 1}.</span>{q.q} <span className="text-muted-foreground font-normal">({q.label})</span></label>
                      <Textarea id={`q-${q.id}`} rows={2} className="mt-1" placeholder={q.ph} value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                    </li>
                  ))}
                </ol>
                <p className="text-muted-foreground mt-2 text-xs">{Object.values(answers).filter((a) => a.trim()).length} of 4 answered. You can leave any blank and the strategy agent will ask later.</p>
              </div>
            </div>
          ) : way === "template" ? (
            <div>
              <h3 className="text-sm font-semibold">Pick a template</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Template">
                {TEMPLATES.filter((t) => t.kind === "venture").map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={template === t.id} onClick={() => setTemplate(t.id)}
                    className={cn("min-w-0 rounded-xl border p-3 text-left transition-colors", template === t.id ? "border-foreground ring-foreground ring-1" : "hover:border-foreground/30")}>
                    <div className="flex items-center gap-2">
                      <span className="size-4 shrink-0 rounded" style={{ background: `oklch(0.62 0.13 ${t.hue})` }} />
                      <span className="truncate text-sm font-medium">{t.title}</span>
                      {template === t.id ? <CheckIcon className="ml-auto size-4 shrink-0" /> : null}
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{t.oneLine}</p>
                    <div className="mt-2"><Maker maker={t.maker} size={18} /></div>
                  </button>
                ))}
              </div>
              <p className="text-muted-foreground mt-2 text-xs">{template ? `Using ${TEMPLATES.find((t) => t.id === template)?.title}. ` : "Nothing picked yet. "}<Link href="/studio/library" className="underline underline-offset-4">Browse the whole library</Link></p>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold">Where is it now?</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {SOURCES.map((s) => (
                  <button key={s.id} type="button" aria-pressed={source === s.id} onClick={() => { setSource(s.id); setPicked([]); }}
                    className={cn("flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition-colors", source === s.id ? "border-foreground ring-foreground ring-1" : "hover:border-foreground/30")}>
                    <s.icon className="size-5" /><span className="text-center text-xs font-medium sm:text-sm">{s.label}</span>
                  </button>
                ))}
              </div>
              {src ? (
                <div className="mt-3 rounded-xl border">
                  <div className="text-muted-foreground border-b px-3 py-2 text-xs">Connected to {src.label} as Torian Johnson. Pick what to bring in.</div>
                  <ul className="divide-y">
                    {src.items.map((it) => (
                      <li key={it}>
                        <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                          <input type="checkbox" checked={picked.includes(it)} onChange={() => setPicked(toggle(picked, it))} className="size-4" />
                          <FolderIcon className="text-muted-foreground size-4 shrink-0" /><span className="min-w-0 truncate">{it}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="text-muted-foreground border-t px-3 py-2 text-xs">{picked.length ? `${picked.length} picked. Files stay where they are; the business points to them.` : "Nothing picked yet."}</div>
                </div>
              ) : <p className="text-muted-foreground mt-2 text-xs">Pick a source to connect it.</p>}
            </div>
          )}
        </section>

        <section className="relative">
          <Num n="S2.3" className="absolute -top-2 right-0" />
          <label htmlFor="v-name" className="text-sm font-semibold">Name</label>
          <Input id="v-name" className="mt-1" placeholder="Haptic Plays" value={name} onChange={(e) => setName(e.target.value)} />
        </section>

        <section className="relative">
          <Num n="S2.4" className="absolute -top-2 right-0" />
          <h2 className="text-sm font-semibold">Team</h2>
          <p className="text-muted-foreground text-xs">Tap a person to add or remove them.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PEOPLE.map((p) => {
              const on = team.includes(p.id);
              return (
                <button key={p.id} type="button" aria-pressed={on} onClick={() => setTeam(p.id === "torian" ? team : toggle(team, p.id))}
                  className={cn("flex items-center justify-between gap-2 rounded-lg border p-2 text-left transition-colors", on ? "border-foreground/60 bg-accent/50" : "hover:border-foreground/30")}>
                  <Face id={p.id} size={28} sub={p.id === "torian" ? "Founder, always on the team" : p.role} />
                  {on ? <CheckIcon className="size-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="relative">
          <Num n="S2.5" className="absolute -top-2 right-0" />
          <h2 className="text-sm font-semibold">Monthly budget for agents</h2>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["30", "60", "120", "250", "500"].map((b) => <SelectItem key={b} value={b}>${b} a month</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-xs">Agents pause and ask you at 85 percent.</span>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t pt-6">
          <Button size="lg" onClick={() => setCreated(true)}>Create business</Button>
          <span className="text-muted-foreground text-xs">{ventureName}, {team.length} {team.length === 1 ? "person" : "people"}, ${budget} a month.</span>
        </div>
      </div>
    </div>
  );
}
