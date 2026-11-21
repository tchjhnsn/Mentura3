"use client";

// M9 Discover, after Contra's Discover (data.ts REFS.discover): a search, tabs for people, investors, builders and
// ventures, filters (city, tags), and people as rows with Follow and Message. Roles are attributes, so a person who is
// both a founder and an investor shows under People and Investors.
import { useState } from "react";
import Link from "next/link";
import { SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Num } from "@/components/studio/bits";
import { ME, PEOPLE, SCREENS, VENTURES, isA, messageHref, roleLine, type Person } from "@/components/mentura/data";
import { Face, FollowButton, Head, VentureCard } from "@/components/mentura/parts";

const TABS = ["People", "Investors", "Builders", "Ventures"] as const;
type Tab = (typeof TABS)[number];
const job = SCREENS.find((s) => s.id === "M9")?.job;

export default function Discover() {
  const [tab, setTab] = useState<Tab>("People");
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("All cities");
  const [tags, setTags] = useState<string[]>([]);

  const others = PEOPLE.filter((p) => p.handle !== ME);
  const cities = ["All cities", ...Array.from(new Set(others.map((p) => p.city)))];
  const pool: Person[] = tab === "Investors" ? others.filter((p) => isA(p, "Investor")) : tab === "Builders" ? others.filter((p) => isA(p, "Builder") || isA(p, "Operator")) : others;
  const allTags = Array.from(new Set((tab === "Ventures" ? [] : pool).flatMap((p) => p.tags)));
  const needle = q.trim().toLowerCase();

  const people = pool.filter((p) => {
    if (city !== "All cities" && p.city !== city) return false;
    if (tags.length && !tags.some((t) => p.tags.includes(t))) return false;
    if (!needle) return true;
    return [p.name, p.line, ...p.tags].some((s) => s.toLowerCase().includes(needle));
  });

  const ventures = VENTURES.filter((v) => !needle || [v.name, v.line, v.phase].some((s) => s.toLowerCase().includes(needle)));
  const toggle = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const switchTab = (t: Tab) => { setTab(t); setTags([]); };

  return (
    <div className="px-4 py-5 md:px-8">
      <Head n="M9" title="Discover" job={job}>
        <Button size="sm" asChild><Link href="/mentura/discovered">Get discovered</Link></Button>
      </Head>

      <div className="relative flex gap-1 overflow-x-auto border-b pb-px">
        <Num n="M9.1" className="absolute -top-2 right-0" />
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => switchTab(t)} aria-pressed={tab === t}
            className={cn("-mb-px shrink-0 border-b-2 px-3 py-2 text-sm", tab === t ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent")}>{t}</button>
        ))}
      </div>

      <section className="relative mt-4 space-y-3">
        <Num n="M9.2" className="absolute -top-2 right-0" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <span className="sr-only">Search</span>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "Ventures" ? "Search ventures by name or what they make" : "Search by name, what they do or a tag"} className="pl-9" />
          </label>
          {tab !== "Ventures" ? (
            <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City"
              className="border-input bg-background dark:bg-input/30 h-9 rounded-md border px-3 text-sm shadow-xs">
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : null}
        </div>
        {allTags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((t) => (
              <button key={t} type="button" onClick={() => toggle(t)} aria-pressed={tags.includes(t)}
                className={cn("rounded-md border px-2 py-1 text-xs", tags.includes(t) ? "bg-accent border-foreground/30 font-medium" : "text-muted-foreground hover:text-foreground")}>{t}</button>
            ))}
            {tags.length || city !== "All cities" || q ? (
              <Button variant="ghost" size="xs" onClick={() => { setTags([]); setCity("All cities"); setQ(""); }}><XIcon />Clear</Button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="relative mt-5">
        <Num n="M9.3" className="absolute -top-2 right-0" />
        {tab === "Ventures" ? (
          <div className="grid gap-3 md:grid-cols-2">
            {ventures.length ? ventures.map((v, i) => <VentureCard key={v.slug} v={v} first={i === 0} />) : <Empty />}
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-2 text-xs">{people.length} {people.length === 1 ? "person" : "people"}</p>
            <ul className="space-y-3">
              {people.length ? people.map((p) => <ResultRow key={p.handle} p={p} />) : <Empty />}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function ResultRow({ p }: { p: Person }) {
  return (
    <li className="bg-card hover:border-foreground/30 rounded-xl border p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1"><Face handle={p.handle} size={44} sub={`${roleLine(p)} · ${p.city}`} /></div>
        <div className="flex shrink-0 items-center gap-2">
          <FollowButton handle={p.handle} />
          <Button variant="outline" size="sm" asChild><Link href={messageHref(p.handle)}>Message</Link></Button>
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed">{p.line}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="bg-muted rounded-md px-2 py-0.5 text-xs">{t}</span>)}</div>
      {p.open ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Open to: </span>{p.open.replace(/^open to /i, "")}</p> : null}
    </li>
  );
}

function Empty() {
  return <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No one matches yet. Try fewer filters or another word.</p>;
}
