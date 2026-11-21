import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { craftOf, craftPhoto, firstProjectOf } from "@reflect/core/crafts";
import { PAGE } from "@/components/page-header";
import { TaskHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { myCraft } from "@/server/crafts-store";
import { Photo } from "../../../discover/photo";
import { DidIt } from "./did-it";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = (await params).id;
  return { title: firstProjectOf(id)?.name ?? craftOf(id)?.label ?? "First project" };
}

/**
 * A craft's first project (picker design guide, Project page): the photo, what it is, how long, what it needs and
 * its steps, then one filled "I did it" that keeps a tried act on the craft and says what changed.
 */
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const craft = craftOf(id);
  if (!craft) notFound();
  const project = firstProjectOf(id);
  if (!project) redirect(`/life/work/crafts/${id}`);
  const user = await requireUser();
  const mine = await myCraft(user.id, id);
  const photo = craftPhoto(id);

  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: `/life/work/crafts/${id}`, label: `Back to ${craft.label}` }} title={craft.label} position="First project" />
      <article className="mx-auto mt-4 grid w-full max-w-xl grid-cols-[minmax(0,1fr)] gap-5">
        <figure className="grid gap-1">
          <Photo src={photo?.src} name={craft.label} eager className="aspect-[16/10] w-full rounded-2xl" />
          {photo ? <figcaption className="text-muted-foreground text-right text-[11px]"><a href={photo.page} target="_blank" rel="noreferrer" className="hover:underline">Photo: Wikipedia</a></figcaption> : null}
        </figure>
        <header className="grid gap-1">
          <p className="text-muted-foreground text-xs">First project, {project.minutes} minutes</p>
          <h1 className="text-xl leading-tight font-bold">{project.name}</h1>
          <p className="text-sm"><span className="text-muted-foreground">You need: </span>{project.needs}</p>
        </header>
        <ol className="grid gap-3">
          {project.steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3">
              <span className="bg-primary/10 text-primary grid size-7 place-items-center rounded-full text-sm font-semibold">{i + 1}</span>
              <span className="pt-0.5 leading-snug">{s}</span>
            </li>
          ))}
        </ol>
        <DidIt craftId={id} label={craft.label} practising={mine?.state === "practising"} />
      </article>
    </main>
  );
}
