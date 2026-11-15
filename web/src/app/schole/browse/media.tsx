import Link from "next/link";
import { SectionHead } from "@/components/section-head";
import type { ReactNode } from "react";
import { BookOpenIcon, FilmIcon, GraduationCapIcon, ImageIcon, MicIcon, MusicIcon, PresentationIcon, Gamepad2Icon, MessagesSquareIcon, TvIcon, DramaIcon } from "lucide-react";
import { browseWay, playsHere, type BrowseMedium } from "@reflect/core/browse-media";
import { courseSite } from "@reflect/core/courses";
import type { Found } from "@reflect/core/lookup";
import { WAYS, mediumOf, type Medium } from "@reflect/core/ways";
import { KeepButton, KeptMark } from "../keep-mark";
import { browseAddAction } from "../actions";
import { LocalDay } from "../items/local-day";

const ICON: Record<Medium | "books", ReactNode> = {
  books: <BookOpenIcon />, course: <GraduationCapIcon />, lecture: <PresentationIcon />, debate: <MessagesSquareIcon />, discussion: <MessagesSquareIcon />,
  podcast: <MicIcon />, film: <FilmIcon />, series: <TvIcon />, theatre: <DramaIcon />, music: <MusicIcon />, art: <ImageIcon />, game: <Gamepad2Icon />, article: <BookOpenIcon />,
};
export const wayLabel = (m: BrowseMedium) => { const w = browseWay(m); return w === "leisure" ? "Play" : WAYS.find((x) => x.id === w)!.label; };

export type Find = Found & { here?: boolean };
/** A find from a catalog or a list, keyed as the person's own items are (medium and title). */
export const keyOf = (f: { medium: string; title: string }) => `${f.medium}|${f.title.toLowerCase()}`;

/**
 * One find as a card (Torian, 2026-11-15: tapping a thing opens it, words only for a page's own act): its picture,
 * title and maker, its medium and way of learning, and Here when it can be done in Reflect. Tapping it opens its page
 * (a course's or a show's, the person's own item once kept, else the find's page, which holds Start here and Keep for
 * later); the bookmark on its picture keeps it for later without leaving, and shows filled once kept.
 */
function MediaCard({ f, mine, showMedium }: { f: Find; mine: Map<string, string>; showMedium: boolean }) {
  const id = mine.get(keyOf(f));
  const here = f.here ?? playsHere(f);
  const m = mediumOf(f.medium);
  const square = f.medium === "music" || f.medium === "podcast" || f.medium === "art";
  const q = (k: string, v: string | null | undefined) => (v ? `&${k}=${encodeURIComponent(v)}` : "");
  // A course or a show has its own page in Reflect to explore before keeping it.
  const page = f.medium === "course" && courseSite(f.url) ? `/schole/courses?u=${encodeURIComponent(f.url!)}${q("t", f.title)}${q("by", f.by)}`
    : f.medium === "podcast" && f.url && playsHere(f) ? `/schole/podcasts?u=${encodeURIComponent(f.url)}${q("t", f.title)}${q("by", f.by)}${q("i", f.image)}`
    : id ? `/schole/items/${id}`
    : `/schole/find?m=${f.medium}${q("t", f.title)}${q("by", f.by)}${q("u", f.url)}${q("i", f.image)}${q("y", f.year ? String(f.year) : null)}${here ? "&h=1" : ""}`;
  return (
    <li className="group relative flex min-w-0 flex-col gap-2">
      <Link href={page} className="flex flex-col gap-2">
        <div className={`bg-muted text-muted-foreground relative flex items-center justify-center overflow-hidden rounded-lg border transition group-hover:opacity-90 [&_svg]:size-8 ${square ? "aspect-square" : f.medium === "course" || f.medium === "lecture" || f.medium === "debate" ? "aspect-video" : "aspect-[2/3]"}`}>
          {f.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.image} alt="" loading="lazy" className="size-full object-cover" />
          ) : ICON[f.medium]}
          {here ? <span className="bg-background/90 text-foreground absolute top-1.5 left-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium" title="Can be done in Reflect">Here</span> : null}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="line-clamp-2 text-sm font-medium group-hover:underline group-hover:underline-offset-2">{f.title}</p>
          {f.by ? <p className="text-muted-foreground line-clamp-1 text-xs">{f.by}</p> : null}
          <p className="text-muted-foreground text-[11px]">{[showMedium ? m.label : null, wayLabel(f.medium), f.year].filter(Boolean).join(" · ")}</p>
        </div>
      </Link>
      {id ? <KeptMark /> : (
        <form action={browseAddAction} className="absolute top-1.5 right-1.5">
          <input type="hidden" name="medium" value={f.medium} /><input type="hidden" name="title" value={f.title} />
          {f.by ? <input type="hidden" name="by" value={f.by} /> : null}{f.url ? <input type="hidden" name="url" value={f.url} /> : null}{f.image ? <input type="hidden" name="image" value={f.image} /> : null}
          <LocalDay />
          <KeepButton label={`Keep ${f.title} for later`} />
        </form>
      )}
    </li>
  );
}

export function MediaGrid({ finds, mine, showMedium = false, row = false }: { finds: Find[]; mine: Map<string, string>; showMedium?: boolean; row?: boolean }) {
  return (
    <ul className={row ? "-mx-6 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&>li]:w-36 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-auto" : "grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6"}>
      {finds.map((f) => <MediaCard key={`${keyOf(f)}|${f.url ?? ""}`} f={f} mine={mine} showMedium={showMedium} />)}
    </ul>
  );
}

/** A titled row of finds, with a link to see the whole medium. */
export function MediaRow({ title, finds, mine, href, showMedium, note }: { title: ReactNode; finds: Find[] | null; mine: Map<string, string>; href?: string; showMedium?: boolean; note?: ReactNode }) {
  if (!finds?.length) return null;
  return (
    <section className="space-y-4">
      <SectionHead title={title} note={note} href={href} className="pt-2" />
      <MediaGrid finds={finds} mine={mine} showMedium={showMedium} row />
    </section>
  );
}
