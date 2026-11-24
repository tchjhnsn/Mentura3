"use client";

// M15 How you appear, after Contra's Adding profile details (data.ts REFS.editProfile): choose what of your shared profile Mentura shows, and in which words.
// The profile and account are shared with Reflect; this page sets only how Mentura presents them. Founder, investor,
// operator and builder are attributes on the one account, any number at once, not separate workspaces.
import { useState } from "react";
import Link from "next/link";
import { CheckIcon, MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMentura } from "@/components/mentura/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Num } from "@/components/studio/bits";
import { ME, POSTS, personOf, ventureOf, type Role } from "@/components/mentura/data";
import { Face } from "@/components/mentura/parts";

const SHOWS = [
  { key: "line", label: "Your line", hint: "The sentence under your name." },
  { key: "city", label: "City", hint: "Where you are based." },
  { key: "ventures", label: "Ventures", hint: "The ventures you are on the team of." },
  { key: "open", label: "Open to", hint: "What you are open to, in green on your profile." },
  { key: "socials", label: "Socials", hint: "Links to your other profiles." },
  { key: "posts", label: "Posts", hint: "What you made and are doing, on your profile." },
] as const;
type Show = (typeof SHOWS)[number]["key"];
const ROLES: Role[] = ["Founder", "Investor", "Operator", "Builder"];

export default function HowYouAppear() {
  const me = personOf(ME);
  const v = me.venture ? ventureOf(me.venture) : undefined;
  const [show, setShow] = useState<Record<Show, boolean>>({ line: true, city: true, ventures: true, open: true, socials: false, posts: true });
  const [headline, setHeadline] = useState(me.line);
  const [looking, setLooking] = useState(me.open ?? "");
  const { roles: kept, setRoles, say, posts: mine } = useMentura();
  const [roles, setPicked] = useState<Role[]>(kept);
  const [saved, setSaved] = useState(false);
  const change = () => setSaved(false);
  const posts = POSTS.filter((p) => p.by === ME).length + mine.length;

  return (
    <div data-virtu-screen="M15" className="px-4 py-5 md:px-8">
      <div className="pb-5">
        <div className="flex items-center gap-2"><Num n="M15" /><h1 className="text-xl font-semibold tracking-tight md:text-2xl">How you appear</h1></div>
        <p className="text-muted-foreground mt-1 text-sm">Your profile and account are shared with Reflect, and this page sets how Mentura shows them.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section className="relative rounded-xl border p-4 md:p-5">
            <Num n="M15.1" className="absolute -top-2 right-4" />
            <h2 className="font-medium">In your words</h2>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Mentura headline</span>
                <Input value={headline} onChange={(e) => { setHeadline(e.target.value); change(); }} maxLength={120} />
                <span className="text-muted-foreground text-xs">Shown under your name. Reflect keeps its own.</span>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Looking for</span>
                <Input value={looking} onChange={(e) => { setLooking(e.target.value); change(); }} placeholder="A hardware co-founder, a first check, a designer" maxLength={80} />
              </label>
              <div className="grid gap-1.5 text-sm" role="group" aria-labelledby="roles-label">
                <span className="font-medium" id="roles-label">You are</span>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const on = roles.includes(r);
                    return <button key={r} type="button" aria-pressed={on} onClick={() => { setPicked(on ? roles.filter((x) => x !== r) : ROLES.filter((x) => x === r || roles.includes(x))); change(); }} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5", on ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{on ? <CheckIcon className="size-3.5" /> : null}{r}</button>;
                  })}
                </div>
                <span className="text-muted-foreground text-xs">Pick all that are true. A founder who also writes checks is both. People find you by each one in Discover.</span>
              </div>
            </div>
          </section>

          <section className="relative rounded-xl border p-4 md:p-5">
            <Num n="M15.2" className="absolute -top-2 right-4" />
            <h2 className="font-medium">What Mentura shows</h2>
            <p className="text-muted-foreground mt-1 text-sm">Anything you turn off stays in your shared profile. Mentura just does not show it.</p>
            <ul className="mt-3 divide-y">
              {SHOWS.map((s) => (
                <li key={s.key} className="flex items-center gap-4 py-3">
                  <label htmlFor={`show-${s.key}`} className="min-w-0 flex-1 text-sm"><span className="block font-medium">{s.label}</span><span className="text-muted-foreground block text-xs">{s.hint}</span></label>
                  <Switch id={`show-${s.key}`} checked={show[s.key]} onCheckedChange={(on) => { setShow((x) => ({ ...x, [s.key]: on })); change(); }} />
                </li>
              ))}
            </ul>
          </section>

          <div className="relative flex flex-wrap items-center gap-3">
            <Num n="M15.3" className="absolute -top-2 left-0" />
            <Button disabled={!roles.length} onClick={() => { setRoles(roles); setSaved(true); say("Saved. Your profile shows it now."); }}>Save</Button>
            {saved ? <span className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400"><CheckIcon className="size-4" />Saved. Your Mentura profile now shows this.</span> : null}
            <Link href="/settings/account" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline sm:ml-auto">Account settings</Link>
          </div>
        </div>

        <aside className="relative h-fit lg:sticky lg:top-5">
          <Num n="M15.4" className="absolute -top-2 right-4" />
          <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Preview</h2>
          <div className="bg-card overflow-hidden rounded-xl border">
            <div className="h-20" style={{ background: `linear-gradient(135deg, oklch(0.78 0.11 ${v?.hue ?? me.hue}), oklch(0.42 0.13 ${((v?.hue ?? me.hue) + 40) % 360}))` }} />
            <div className="-mt-8 px-4 pb-4">
              <span className="ring-card inline-block rounded-full ring-4"><Face handle={ME} size={64} name={false} /></span>
              <p className="mt-2 text-xs font-medium">{roles.map((r, i) => (i ? r.toLowerCase() : r)).join(" and ")}</p>
              {show.open && looking.trim() ? <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400"><span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />{looking}</p> : null}
              <p className="mt-1 text-lg font-semibold">{me.name}</p>
              {show.line && headline.trim() ? <p className="text-muted-foreground text-sm">{headline}</p> : null}
              {show.city ? <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs"><MapPinIcon className="size-3.5" />{me.city}</p> : null}
              {show.ventures && v ? <p className="mt-3 rounded-lg border p-2 text-xs"><span className="block font-medium">{v.name}</span><span className="text-muted-foreground block">{v.line}</span></p> : null}
              <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {show.posts ? <span>{posts} {posts === 1 ? "post" : "posts"}</span> : null}
                {show.socials ? <span>Socials shown</span> : null}
                <span>{me.followers} followers</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
