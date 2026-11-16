import Link from "next/link";
import { ab, COLLECTIONS, type CollectionItem } from "@reflect/core/collections";
import { GROUP_LABEL, topicPageById, workOf, type VersionGroup, type Work } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/section-head";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { audiobookById } from "@/server/audiobooks";
import { artOf } from "@/server/collections";
import { LEARN } from "../../crumbs";
import { Art } from "../../art";
import { CollectionCard, PlaylistRows } from "../../playlists/card";
import { adaptationsOf, MODE_LABEL, MODE_MEANS } from "@reflect/core/adaptations";
import { cite, namedIn, personHref, personNamed } from "@reflect/core/historical-people";
import { ideasIn } from "@reflect/core/great-ideas";
import { DiscussTopic } from "../../dialectic/discussion";

/** A recording as a row: its title and who read it, in how many voices. */
function recording(id: string): CollectionItem | null {
  const a = audiobookById(id);
  if (!a) return null;
  const who = a.dramatic ? "A dramatic reading" : a.readers > 1 ? `Read by ${a.readers} readers` : "Read by one reader";
  return ab(id, a.title, "LibriVox", who);
}

/**
 * A work with every version of it in one place (guide "Topics and playlists", points 7 and 8): its filled button
 * plays the recording to start with; then every recording, and the other versions grouped by what you do with them
 * (understand it, its music, watch it, see it), then the playlists it is in.
 */
export function ClassicWork({ w, have }: { w: Work; have: ReadonlySet<string> }) {
  const t = topicPageById(w.topic)!;
  const form = t.forms.find((f) => f.id === w.form);
  const recordings = w.audiobooks.map(recording).filter((r): r is CollectionItem => r !== null);
  const cover = artOf(recordings[0] ?? ab(w.audiobooks[0]!, w.title, w.by));
  const groups = (Object.keys(GROUP_LABEL) as VersionGroup[]).map((g) => ({ g, items: w.versions.filter((x) => x.group === g).map((x) => x.item) })).filter((x) => x.items.length);
  const playlists = COLLECTIONS.filter((c) => c.items.some((i) => workOf(i)?.id === w.id));
  const formHref = `/schole/topics/${t.id}?f=${w.form}`;
  const author = personNamed(w.by);
  const adaptations = adaptationsOf(w.id);
  const named = namedIn(w.id);
  const ideas = ideasIn(w.id);
  return (
    <main className={PAGE}>
      <ThingHeader back={formHref} crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }, { label: t.name, href: `/schole/topics/${t.id}` }, ...(form ? [{ label: form.label, href: formHref }] : [])]} title={w.title} />
      <div className="mt-8 space-y-8">
        <header className="flex gap-5">
          <Art image={cover.image} kind="Work" title={w.title} className="aspect-square w-28 shrink-0 sm:w-40" />
          <div className="min-w-0 space-y-2">
            <h1 id="page-title" className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{w.title}</h1>
            <p className="text-muted-foreground text-[13px]">{author ? <Link href={personHref(author)} className="text-foreground underline-offset-4 hover:underline">{w.by}</Link> : w.by} · {w.when}</p>
            <p className="text-muted-foreground text-[13px]">{form ? <Link href={formHref} className="text-foreground underline-offset-4 hover:underline">{form.label}</Link> : null} · <Link href={`/schole/topics/${t.id}`} className="text-foreground underline-offset-4 hover:underline">{t.name}</Link></p>
            <p className="hidden max-w-prose sm:block">{w.about}</p>
            {recordings[0] ? <Button asChild size="lg" className="mt-1 h-10 sm:px-8"><Link href={`/schole/audiobooks/${w.audiobooks[0]}`}>Play the audiobook</Link></Button> : null}
          </div>
        </header>
        <p className="max-w-prose sm:hidden">{w.about}</p>
        <section className="space-y-1">
          <SectionHead title="Hear it" note={recordings.length > 1 ? `${recordings.length} recordings, the most listened first; the others are other translations or readers.` : undefined} />
          <PlaylistRows items={recordings} have={have} numbered={false} />
        </section>
        {groups.map(({ g, items }) => (
          <section key={g} className="space-y-1">
            <SectionHead title={GROUP_LABEL[g]} />
            <PlaylistRows items={items} have={have} numbered={false} />
          </section>
        ))}
        {adaptations.length ? (
          <section className="space-y-2">
            <SectionHead title="Adaptations" note="Later works made from it, most faithful first. Facts checked by an editor, not a grade." />
            <ul className="max-w-3xl divide-y">
              {adaptations.map((x) => (
                <li key={x.item.title} className="space-y-1.5 py-3">
                  <PlaylistRows items={[{ ...x.item, why: `${x.when}` }]} have={have} numbered={false} />
                  <p className="text-sm"><span className="rounded-full border px-2 py-0.5 text-xs font-medium">{MODE_LABEL[x.mode]}</span> <span className="text-muted-foreground">{MODE_MEANS[x.mode]}</span></p>
                  <ul className="text-foreground/80 list-disc space-y-0.5 pl-5 text-sm">{x.facts.map((f) => <li key={f}>{f}</li>)}</ul>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {named.length ? (
          <section id="named" className="space-y-2">
            <SectionHead title="Named by" note="People who point to this work, and why." />
            <ul className="max-w-3xl divide-y">
              {named.map(({ by, n }) => (
                <li key={`${by.id}${n.at.at}`} className="py-3">
                  <p><Link href={personHref(by)} className="font-medium hover:underline">{by.name}</Link> <span className="text-muted-foreground text-[13px]">· {cite(n.at)}</span></p>
                  <p className="text-foreground/80 text-sm">{n.names}. {n.why}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="max-w-3xl"><DiscussTopic kind="work" id={w.id} /></section>
        {ideas.length ? (
          <section className="space-y-2">
            <SectionHead title="Ideas in this work" note="Great Ideas it discusses, with the passage." />
            <ul className="max-w-3xl divide-y">
              {ideas.map((i) => (
                <li key={i.id} className="py-3">
                  <p><Link href={`/schole/ideas/${i.id}`} className="font-medium hover:underline">{i.name}</Link> <span className="text-muted-foreground text-[13px]">· {i.passages.filter((x) => x.at.work === w.id).map((x) => cite(x.at)).join("; ")}</span></p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {playlists.length ? (
          <section className="space-y-4">
            <SectionHead title="In playlists" />
            <ul className="grid grid-cols-1 gap-x-5 gap-y-6 min-[420px]:grid-cols-2 lg:grid-cols-3">
              {playlists.map((c) => <li key={c.id}><CollectionCard c={c} /></li>)}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}

