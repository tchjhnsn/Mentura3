import Link from "next/link";
import { itemHref, itemKey, nextInCollection } from "@reflect/core/collections";
import { formItems, formSize, playlistsOf, versionLine, workById, workItem, workOf, type TopicPage } from "@reflect/core/topic-pages";
import { hoursOf } from "@reflect/core/audiobooks";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/section-head";
import { artOf, sizeLine } from "@/server/collections";
import type { Face, Made } from "@/server/topics";
import { Art } from "../../art";
import { CoverImg } from "../../cover-img";
import { CollectionCard, Fan, MadeCard, PlaylistRows } from "../../playlists/card";
import { MakeButton, TopicFollow } from "../make";

/** The forms as chips under the title; All by default. A chip filters the page in place (guide "Topics and playlists", point 1). */
function FormChips({ t, on }: { t: TopicPage; on: string | null }) {
  const chip = (href: string, label: string, active: boolean) => (
    <li key={href}><Link href={href} scroll={false} aria-current={active ? "page" : undefined} className={`inline-flex h-8 items-center rounded-full border px-3 text-sm whitespace-nowrap ${active ? "bg-foreground text-background border-foreground" : "hover:bg-muted"}`}>{label}</Link></li>
  );
  return (
    <nav aria-label="Forms" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1.5 pb-1">
        {chip(`/schole/topics/${t.id}`, "All", on === null)}
        {t.forms.map((f) => chip(`/schole/topics/${t.id}?f=${f.id}`, f.label, on === f.id))}
      </ul>
    </nav>
  );
}

function Faces({ faces }: { faces: readonly Face[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-3">
      {faces.map((f) => {
        const face = (
          <>
            <span className="bg-muted relative block size-14 overflow-hidden rounded-full border">
              <span className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm font-medium">{f.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
              {f.image ? <CoverImg src={f.image} className="absolute inset-0 size-full object-cover object-top" /> : null}
            </span>
            <span className="mt-1 block w-16 text-center text-xs leading-tight">{f.name}</span>
          </>
        );
        return <li key={f.name} className="flex flex-col items-center">{f.href ? <Link href={f.href} className="flex flex-col items-center hover:underline">{face}</Link> : face}</li>;
      })}
    </ul>
  );
}

/**
 * A topic (guide "Topics and playlists"): its title with Follow at the top right, what it holds, and its forms as
 * chips. With All chosen: Start here, a playlist chosen by a person, holds the page's one filled button; then other
 * people's playlists, the person's own made ones and a quiet Make one for me, the forms as tiles, and the people.
 * With a form chosen: where and when, its works (each saying which versions it has), its other things, the playlists
 * that use it and its people.
 */
export function TopicView({ t, form, following, have, made, faces }: { t: TopicPage; form: string | null; following: boolean; have: ReadonlySet<string>; made: readonly Made[]; faces: readonly Face[] }) {
  const f = form ? t.forms.find((x) => x.id === form) ?? null : null;
  const playlists = playlistsOf(t);
  const [start, ...others] = playlists;
  const next = start ? nextInCollection(start, have) ?? start.items[0]! : null;
  const begun = start ? start.items.some((i) => have.has(itemKey(i))) : false;
  return (
    <div className="mt-6 space-y-8">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">{t.name}</h1>
          <TopicFollow topic={t.id} following={following} />
        </div>
        <p className="text-muted-foreground max-w-prose">{t.about}</p>
        <FormChips t={t} on={f?.id ?? null} />
      </header>

      {f ? <FormView t={t} f={f} have={have} faces={faces} /> : (
        <>
          {start && next ? (
            <section aria-labelledby="start-here" className="grid gap-5 rounded-xl border p-4 sm:grid-cols-[15rem_1fr] sm:p-5">
              <Link href={`/schole/playlists/${start.id}`} aria-hidden tabIndex={-1}><Fan items={start.items} className="h-36" /></Link>
              <div className="min-w-0 space-y-2">
                <p id="start-here" className="text-muted-foreground text-xs">Start here</p>
                <h2 className="text-xl leading-tight font-semibold tracking-tight"><Link href={`/schole/playlists/${start.id}`} className="hover:underline hover:underline-offset-4">{start.name}</Link></h2>
                <p className="text-muted-foreground text-[13px]">Chosen by {start.by} · {sizeLine(start.items)}</p>
                <p className="text-muted-foreground line-clamp-2 max-w-prose text-sm">{start.about}</p>
                <Button asChild size="lg" className="mt-1 h-10 w-full sm:w-auto sm:px-8"><Link href={itemHref(next)} className="min-w-0"><span className="truncate">{begun ? `Continue with ${next.title}` : "Start here"}</span></Link></Button>
              </div>
            </section>
          ) : null}

          {others.length ? (
            <section className="space-y-4">
              <SectionHead title="Chosen by people" />
              <ul className="grid grid-cols-1 gap-x-5 gap-y-6 min-[420px]:grid-cols-2 lg:grid-cols-3">
                {others.map((c) => <li key={c.id}><CollectionCard c={c} /></li>)}
              </ul>
            </section>
          ) : null}

          <section className="space-y-3">
            <SectionHead title="Made for you" note="Reflect picks from what is here, for what you are working toward. Only when you ask." />
            {made.length ? (
              <ul className="grid grid-cols-1 gap-x-5 gap-y-6 min-[420px]:grid-cols-2 lg:grid-cols-3">
                {made.slice(0, 3).map((m) => <li key={m.id}><MadeCard id={m.id} name={m.name} items={m.items} /></li>)}
              </ul>
            ) : null}
            <MakeButton topic={t.id} label={made.length ? "Make another" : "Make one for me"} />
          </section>

          <section className="space-y-3">
            <SectionHead title="Forms" />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {t.forms.map((x) => {
                const items = formItems(x);
                return (
                  <li key={x.id}>
                    <Link href={`/schole/topics/${t.id}?f=${x.id}`} scroll={false} className="hover:bg-muted/60 block space-y-2 rounded-lg border p-3">
                      <span className="flex gap-1">{items.slice(0, 3).map((i) => { const a = artOf(i); return <Art key={itemKey(i)} image={a.image} kind={a.kind} title={i.title} tiny className="size-9 rounded-md" />; })}</span>
                      <span className="block text-sm font-semibold">{x.label}</span>
                      <span className="text-muted-foreground block text-xs">{formSize(x)} {x.works?.length ? (formSize(x) === 1 ? "work" : "works") : (formSize(x) === 1 ? "thing" : "things")}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="space-y-3">
            <SectionHead title="People" />
            <Faces faces={faces} />
          </section>
        </>
      )}
    </div>
  );
}

function FormView({ t, f, have, faces }: { t: TopicPage; f: TopicPage["forms"][number]; have: ReadonlySet<string>; faces: readonly Face[] }) {
  const works = (f.works ?? []).map(workById).filter((w) => w !== undefined);
  const keys = new Set(formItems(f).map(itemKey));
  const uses = playlistsOf(t).filter((p) => p.items.some((i) => keys.has(itemKey(i)) || (f.works && workOf(i) && f.works.includes(workOf(i)!.id))));
  const authors = new Set([...works.map((w) => w.by), ...(f.items ?? []).map((i) => i.by)]);
  const people = faces.filter((p) => authors.has(p.name));
  return (
    <>
      {f.where ? <p className="text-muted-foreground -mt-4 text-sm">{f.where}</p> : null}
      {works.length ? (
        <section className="space-y-2">
          <SectionHead title="Works" />
          <ul className="max-w-3xl divide-y">
            {works.map((w) => {
              const a = artOf(workItem(w));
              return (
                <li key={w.id}>
                  <Link href={`/schole/works/${w.id}`} className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3">
                    <Art image={a.image} kind="Work" title={w.title} tiny className="size-14 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{w.title}</span>
                      <span className="text-muted-foreground block truncate text-[13px]">{w.by} · {w.when}{a.seconds ? ` · ${hoursOf(a.seconds)}` : ""}</span>
                      <span className="text-muted-foreground block truncate text-xs">{versionLine(w)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      {f.items?.length ? (
        <section className="space-y-2">
          {works.length ? <SectionHead title="And more" /> : null}
          <PlaylistRows items={f.items} have={have} numbered={false} />
        </section>
      ) : null}
      {uses.length ? (
        <section className="space-y-4">
          <SectionHead title={`Playlists with ${f.label.toLowerCase()}`} />
          <ul className="grid grid-cols-1 gap-x-5 gap-y-6 min-[420px]:grid-cols-2 lg:grid-cols-3">
            {uses.map((c) => <li key={c.id}><CollectionCard c={c} /></li>)}
          </ul>
        </section>
      ) : null}
      {people.length ? (
        <section className="space-y-3">
          <SectionHead title="People" />
          <Faces faces={people} />
        </section>
      ) : null}
    </>
  );
}
