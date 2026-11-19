import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HOME, WRITING } from "@reflect/core/site-page";
import { requireUser } from "@/server/session";
import { profileSettings } from "@/server/profile-store";
import { profileHref } from "@/server/actions/profiles";
import { ensureFixedPage, pageById } from "@/server/site-pages";
import { publishableParts } from "@/server/part-share";
import { PageEditor } from "./editor";

export const metadata: Metadata = { title: "Edit page" };
export const dynamic = "force-dynamic";

/**
 * A page of the person's site in the editor (plan "Appearance, Virtu and the site editor", "The Markdown site
 * editor"). /site/pages/home and /site/pages/writing open Home and Writing, made from their templates the first time.
 */
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const settings = await profileSettings(user.id);
  if (id === "home" || id === "writing") redirect(`/site/pages/${await ensureFixedPage(user.id, id === "home" ? HOME : WRITING, settings.line ?? null)}`);
  const page = await pageById(user.id, id);
  if (!page) notFound();
  const base = profileHref({ id: user.id, handle: settings.handle });
  const parts = await publishableParts(user.id).catch(() => []);
  return (
    <PageEditor
      page={{ id: page.id, path: page.path, title: page.title, body: page.body, version: page.version, published: page.publishedBody !== null, changed: page.publishedBody !== page.body, fixed: page.fixed }}
      base={base} parts={parts}
    />
  );
}
