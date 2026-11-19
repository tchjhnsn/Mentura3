import type { ReactNode } from "react";
import { SiteDesignEditor } from "@/components/site-design-editor";
import { currentUser } from "@/server/session";
import { ownerOf } from "@/server/profile-store";
import { siteCss } from "@/server/site-design";

/**
 * Every page of a person's site (profile, posts, writing) in the site's own design, made by its owner with the Virtu
 * editor: the --virtu- properties of their design, which .site-design (src/app/globals.css) maps onto the page's
 * colors and type. The owner gets the editor; nobody else does.
 */
export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ key: string }> }) {
  const owner = await ownerOf((await params).key).catch(() => null);
  if (!owner) return children;
  const [css, user] = await Promise.all([siteCss(owner.id).catch(() => ""), currentUser().catch(() => null)]);
  return (
    <div className="site-design">
      {css ? <style data-site-design="">{css}</style> : null}
      {children}
      {user?.id === owner.id ? <SiteDesignEditor /> : null}
    </div>
  );
}
