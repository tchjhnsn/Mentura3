import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { getWork } from "@/server/work-store";
import { idealsOf } from "@/server/book-store";
import { subjectNames } from "@/server/subject-domain-store";
import { isPublishable } from "@reflect/core/site";
import { postForWork } from "@/server/site-store";
import { profileSettings } from "@/server/profile-store";
import { profileHref } from "@/server/actions/profiles";
import { Editor } from "./editor";

export const metadata: Metadata = { title: "Journal" };
export const dynamic = "force-dynamic";

/** One work, open to write in. */
export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [work, ideals, subjects] = await Promise.all([getWork(user.id, id), idealsOf(user.id).catch(() => []), subjectNames(user.id).catch(() => [])]);
  if (!work) notFound();
  // An essay, letter, plan or memoir can go on the person's site; the journal's other kinds never show Publish.
  let site: { base: string; post: { slug: string; href: string; updatedAt: string } | null } | null = null;
  if (isPublishable(work.kind)) {
    const [settings, post] = await Promise.all([profileSettings(user.id), postForWork(user.id, work.id).catch(() => null)]);
    const base = profileHref({ id: user.id, handle: settings.handle });
    site = { base, post: post ? { slug: post.slug, href: `${base}/${post.slug}`, updatedAt: post.updatedAt } : null };
  }
  return <Editor work={work} ideals={ideals} subjects={subjects} site={site} />;
}
