import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, PencilIcon, PlusIcon, UsersIcon } from "lucide-react";
import { AUDIENCES, type Audience, type SectionId } from "@reflect/core/profile";
import { austinDay, dayLabel } from "@reflect/core/events";
import { Face } from "@/components/dash";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { ServiceIcon } from "@/components/service-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { currentUser } from "@/server/session";
import { incomingRequests, requestedTo } from "@/server/connect-store";
import { ownerOf, profilePage, type Experience, type ProfilePage } from "@/server/profile-store";
import { profileHref } from "@/server/actions/profiles";
import { postsOf, siteOf, type Post } from "@/server/site-store";
import { connectFromProfile, setAudienceFromProfile } from "./actions";
import { SubscribeButton } from "./subscribe";
import { SiteFooter, WritingList } from "./site-parts";

export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const owner = await ownerOf((await params).key).catch(() => null);
  const p = owner ? await profilePage(owner.id, null).catch(() => null) : null;
  if (!p) return { title: "Profile" };
  return { title: p.name, description: p.line ?? undefined, alternates: { types: { "application/rss+xml": `${profileHref(p)}/feed.xml` } } };
}

/** Where the owner adds to an empty part, and the one line it shows. */
const EMPTY: Record<SectionId, { line: string; href: string }> = {
  socials: { line: "Add the accounts you're on.", href: "/settings/profile/socials" },
  building: { line: "Ventures you start show here.", href: "/life/ventures" },
  qualities: { line: "Qualities you keep in Work show here.", href: "/journal/qualities" },
  experience: { line: "Add your experience from LinkedIn.", href: "/settings/profile/linkedin" },
  events: { line: "Events you host or check in to show here.", href: "/events" },
  interests: { line: "Add a few interests.", href: "/settings/profile" },
};
/** Where the owner edits a part that has something in it. */
const EDIT: Partial<Record<SectionId, string>> = { socials: "/settings/profile/socials", experience: "/settings/profile/linkedin", interests: "/settings/profile" };
const TITLE: Record<SectionId, string> = { socials: "Socials", building: "Building", qualities: "Qualities", experience: "Experience", events: "Events", interests: "Interests" };

const year = (s: string | null) => s?.match(/\d{4}/)?.[0] ?? null;
function years(e: Experience): string | null {
  const a = year(e.starts);
  const b = year(e.ends);
  if (!a && !b) return null;
  if (a && !e.ends) return `${a} to now`;
  return a && b && a !== b ? `${a} to ${b}` : (a ?? b);
}
const dayOf = (iso: string | null) => (iso ? dayLabel(austinDay(iso)) : null);

/**
 * A person's profile (doc "Profiles and accounts design guide", 2026-11-18): face, name and line with Connect (the one
 * filled act; a bar at the foot on a phone), then socials, what they are building, qualities and experience, and at
 * the side where you met, their events and interests. Each part shows only to its audience; a part the viewer may not
 * see is left out. The owner sees it as people they've met do, with an eye on each part to set who sees it, or as
 * Everyone. Readable signed out; emails and LinkedIn connections are never shown.
 */
export default async function ProfileRoute({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { key } = await params;
  const sp = await searchParams;
  const owner = await ownerOf(key);
  if (!owner) notFound();
  const as = one(sp.as) === "everyone" ? "everyone" : null;
  if (owner.redirect || (owner.handle && decodeURIComponent(key) !== owner.handle)) redirect(`${profileHref(owner)}${as ? "?as=everyone" : ""}`);
  const user = await currentUser().catch(() => null);
  const isOwner = user?.id === owner.id;
  const preview = isOwner && as === "everyone";
  const p = await profilePage(owner.id, preview ? null : (user?.id ?? null));
  if (!p) notFound();
  const href = profileHref(p);
  const editing = isOwner && !preview;
  const error = one(sp.error) || null;
  // The profile is the person's site (doc "Personal site and blog design guide", 2026-11-18): their writing comes
  // first, and once there is any, Subscribe is the one filled act for everyone else.
  const [site, posts] = await Promise.all([siteOf(owner.id).catch(() => ({ template: "plain" as const })), postsOf(owner.id, 20).catch((): Post[] => [])]);
  const template = site.template;
  const subscribe = !isOwner && posts.length ? <SubscribeButton ownerId={p.id} name={p.name} className="flex-1 sm:flex-none" /> : null;
  const quiet = subscribe ? "outline" : "default";

  // The main act: Edit on your own page; Sign in to connect signed out; In Friends once connected; Connect for someone
  // you've met or who asked you; Requested after the tap; nothing for anyone else.
  let act: ReactNode = null;
  let bar = false;
  if (isOwner) act = <Button asChild variant="outline"><Link href="/settings/profile"><PencilIcon />Edit</Link></Button>;
  else if (!user) { act = <Button asChild variant={quiet} className="flex-1 sm:flex-none"><Link href={`/sign-in?next=${encodeURIComponent(href)}`}>Sign in to connect</Link></Button>; bar = true; }
  else if (p.connected) { act = <Button asChild variant="outline" className="flex-1 sm:flex-none"><Link href={`/life/friends/messages/${encodeURIComponent(p.id)}`}><UsersIcon />In Friends</Link></Button>; bar = true; }
  else {
    const [asked, requested] = await Promise.all([incomingRequests(user.id).then((r) => r.some((q) => q.from.id === p.id)), requestedTo(user.id, p.id)]);
    if (requested) { act = <Button variant="outline" disabled className="flex-1 sm:flex-none">Requested</Button>; bar = true; }
    else if (p.viewer === "met" || asked) {
      act = <form action={connectFromProfile.bind(null, p.id, href)} className="flex flex-1 sm:flex-none"><Button type="submit" variant={quiet} className="w-full">Connect</Button></form>;
      bar = true;
    }
  }

  if (subscribe) {
    act = <>{act}{subscribe}</>;
    bar = true;
  }

  const section = (id: SectionId, has: boolean, body: ReactNode) => {
    const audience = p.audiences?.[id] ?? null;
    if (!editing) return has ? <Section key={id} title={TITLE[id]}>{body}</Section> : null;
    return (
      <Section key={id} title={TITLE[id]} dim={audience === "me"}
        tools={<>
          {audience ? <AudienceMenu section={id} audience={audience} back={href} /> : null}
          {has && EDIT[id] ? <Button asChild variant="ghost" size="icon" className="size-8" aria-label={`Edit ${TITLE[id]}`}><Link href={EDIT[id]!}><PencilIcon /></Link></Button> : null}
        </>}>
        {has ? body : <EmptyLine line={EMPTY[id].line} href={EMPTY[id].href} label={`Add to ${TITLE[id]}`} />}
      </Section>
    );
  };

  const positions = (p.experience ?? []).filter((e) => e.kind === "position");
  const schools = (p.experience ?? []).filter((e) => e.kind === "school");
  const notebook = template === "notebook";
  const shown = notebook ? posts.slice(0, 10) : posts.slice(0, 3);
  const writing = posts.length || editing ? (
    <Section key="writing" title="Writing" tools={editing ? <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Your site's settings"><Link href="/settings/site"><PencilIcon /></Link></Button> : undefined}>
      {posts.length ? (
        <div className="grid gap-3">
          <WritingList posts={shown} href={href} serif={notebook} />
          {posts.length > shown.length ? <Link href={`${href}/writing`} className="text-sm font-medium hover:underline">All writing</Link> : null}
        </div>
      ) : (
        <EmptyLine line="Publish an essay, letter, plan or memoir from your journal." href="/journal" label="Go to your journal" />
      )}
    </Section>
  ) : null;
  const building = section("building", p.building !== null && (p.building.length > 0 || p.wantsBuilders), <Building p={p} owner={isOwner} />);
  const main = [
    ...(template === "builder" ? [building, writing] : [writing, building]),
    section("socials", !!p.socials?.length, <Socials p={p} />),
    section("qualities", !!p.qualities?.length, <Chips items={(p.qualities ?? []).map((q) => q.label)} />),
    section("experience", !!p.experience?.length, <div className="grid gap-4"><ExperienceList rows={positions} />{schools.length ? <ExperienceList rows={schools} /> : null}</div>),
  ].filter(Boolean);
  const side = [
    !isOwner && p.met ? (
      <Section key="met" title="Met at">
        <Link href={`/events/${p.met.eventId}`} className="hover:underline">{p.met.title}</Link>
        {dayOf(p.met.startsAt) ? <p className="text-muted-foreground text-sm">{dayOf(p.met.startsAt)}</p> : null}
      </Section>
    ) : null,
    section("events", !!p.events?.length, (
      <ul className="grid gap-2">
        {(p.events ?? []).map((e) => (
          <li key={e.id} className="min-w-0">
            <Link href={`/events/${e.id}`} className="block truncate hover:underline">{e.title}</Link>
            <p className="text-muted-foreground text-sm">{[dayOf(e.startsAt), e.hosted ? "Hosted" : null].filter(Boolean).join(" · ")}</p>
          </li>
        ))}
      </ul>
    )),
    section("interests", !!p.interests?.length, <Chips items={p.interests ?? []} />),
  ].filter(Boolean);

  return (
    <main className={cn(PAGE, bar && "pb-24 sm:pb-6")}>
      <ThingHeader search={!!user} back="/" backLabel="Back" crumbs={[{ label: "Profile" }]} title={p.name} action={bar ? (subscribe ?? act) : undefined} />

      {isOwner ? (
        <div className="bg-muted text-muted-foreground mt-4 flex items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm">
          <span>{preview ? "This is how everyone sees you" : "This is how people you've met see you"}</span>
          <Link href={preview ? href : `${href}?as=everyone`} role="switch" aria-checked={preview} className="flex shrink-0 items-center gap-2 text-foreground">
            <span>Everyone</span>
            <span className={cn("relative h-5 w-9 rounded-full transition", preview ? "bg-primary" : "bg-input")}>
              <span className={cn("bg-background absolute top-0.5 size-4 rounded-full shadow transition-all", preview ? "left-4.5" : "left-0.5")} />
            </span>
          </Link>
        </div>
      ) : null}

      <section aria-label="Who" className="mt-6 flex items-start gap-4">
        <Face name={p.name} size={80} />
        <div className="min-w-0 flex-1 pt-1">
          <h1 id="page-title" className={cn("text-3xl font-bold tracking-tight break-words", notebook && "font-serif")}>{p.name}</h1>
          {p.handle ? <p className="text-muted-foreground text-sm">@{p.handle}</p> : null}
          {p.line ? <p className="mt-2 max-w-prose">{p.line}</p> : editing ? <EmptyLine line="Add one line about you." href="/settings/profile" label="Add your line" /> : null}
        </div>
        {act ? <div className={cn("flex shrink-0 gap-2", bar && "hidden sm:flex")}>{act}</div> : null}
      </section>

      {error ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid content-start gap-8">{main}</div>
        {side.length ? <aside className="md:bg-muted/40 grid content-start gap-6 border-t pt-6 md:rounded-xl md:border-t-0 md:p-5">{side}</aside> : null}
      </div>

      <SiteFooter href={href} />

      {bar && act ? <div className="bg-background/95 fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t px-4 py-3 backdrop-blur sm:hidden">{act}</div> : null}
    </main>
  );
}

function Section({ title, tools, dim, children }: { title: string; tools?: ReactNode; dim?: boolean; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-3">
      <div className="flex min-h-8 items-center gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {dim ? <span className="text-muted-foreground ml-1 text-xs">Only you</span> : null}
        {tools ? <div className="ml-auto flex items-center">{tools}</div> : null}
      </div>
      <div className={cn("min-w-0", dim && "opacity-60")}>{children}</div>
    </section>
  );
}

/** The owner's eye on a part: who sees it. */
function AudienceMenu({ section, audience, back }: { section: SectionId; audience: Audience; back: string }) {
  const label = AUDIENCES.find((a) => a.id === audience)!.label;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Who sees this: ${label}`} title={label}>{audience === "me" ? <EyeOffIcon /> : <EyeIcon />}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Who sees this</DropdownMenuLabel>
        {AUDIENCES.map((a) => (
          <form key={a.id} action={setAudienceFromProfile.bind(null, section, a.id, back)}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <CheckIcon className={cn(a.id === audience ? "opacity-100" : "opacity-0")} />{a.label}
              </button>
            </DropdownMenuItem>
          </form>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyLine({ line, href, label }: { line: string; href: string; label: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <span>{line}</span>
      <Button asChild variant="ghost" size="icon" className="size-8" aria-label={label}><Link href={href}><PlusIcon /></Link></Button>
    </div>
  );
}

function Socials({ p }: { p: ProfilePage }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {(p.socials ?? []).map((s) => (
        <li key={s.id}>
          <a href={s.url} target="_blank" rel="me noreferrer" title={s.confirmedBy ? `${s.label}, confirmed` : s.label}
            className="hover:bg-accent relative flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition">
            <ServiceIcon service={s.service} className="text-muted-foreground" />
            <span>{s.handle ?? s.label}</span>
            {s.confirmedBy ? <CheckIcon className="text-primary size-3.5" aria-label="Confirmed" /> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Building({ p, owner }: { p: ProfilePage; owner: boolean }) {
  return (
    <div className="grid gap-3">
      {(p.building ?? []).map((v) => (
        <div key={v.id} className="min-w-0">
          {owner ? <Link href={`/life/ventures/${v.id}`} className="font-semibold hover:underline">{v.name}</Link> : <p className="font-semibold">{v.name}</p>}
          {v.what ? <p className="text-muted-foreground text-sm">{v.what}</p> : null}
        </div>
      ))}
      {p.wantsBuilders ? <Badge variant="secondary">Wants people to build with</Badge> : null}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return <ul className="flex flex-wrap gap-2">{items.map((t) => <li key={t}><Badge variant="outline" className="text-sm font-normal">{t}</Badge></li>)}</ul>;
}

/** Newest first: what is still going on, then by the year it started. */
const newest = (a: Experience, b: Experience) => Number(!!a.ends) - Number(!!b.ends) || Number(year(b.starts) ?? 0) - Number(year(a.starts) ?? 0);

function ExperienceList({ rows }: { rows: Experience[] }) {
  return (
    <ul className="grid gap-3">
      {[...rows].sort(newest).map((e) => (
        <li key={e.id} className="min-w-0">
          <p className="font-semibold">{e.title ?? e.organisation}</p>
          <p className="text-muted-foreground text-sm">{[e.title ? e.organisation : null, years(e)].filter(Boolean).join(" · ")}</p>
        </li>
      ))}
    </ul>
  );
}
