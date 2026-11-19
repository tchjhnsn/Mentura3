import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HOME, WRITING } from "@reflect/core/site-page";
import { requireUser } from "@/server/session";
import { profileSettings } from "@/server/profile-store";
import { profileHref } from "@/server/actions/profiles";
import { ensureFixedPage, pageById } from "@/server/site-pages";
import { publishableParts } from "@/server/part-share";
import { blockCss, CATALOG, EDGED_SHAPES, siteTokensCss } from "@/server/site-design";
import { componentOptions, Slot, slotSections } from "@/components/slots";
import { blockNames } from "@reflect/virtu/blocks";
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
  const [parts, panel, options] = await Promise.all([publishableParts(user.id).catch(() => []), slotSections(user.id, "editor.panel"), componentOptions(user.id)]);
  // With the Virtu plugin added: the Design panel (editor.panel) and a block's Shape and Frame (editor.component-option),
  // drawn in the editor with Virtu's CSS for every shape and frame in the catalog, on the site's own colours.
  const names = blockNames(CATALOG);
  const looks = options.length ? [await siteTokensCss(user.id).catch(() => ""), blockCss(names)].filter(Boolean).join("\n") : "";
  return (
    <>
      {looks ? <style data-block-looks="">{looks}</style> : null}
      <PageEditor
        page={{ id: page.id, path: page.path, title: page.title, body: page.body, version: page.version, published: page.publishedBody !== null, changed: page.publishedBody !== page.body, fixed: page.fixed }}
        base={base} parts={parts}
        design={panel.length ? <Slot userId={user.id} name="editor.panel" /> : null}
        looks={options.length ? { options, shapes: names.shapes, frames: names.frames, edged: EDGED_SHAPES } : null}
      />
    </>
  );
}
