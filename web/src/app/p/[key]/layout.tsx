import type { ReactNode } from "react";
import { SiteScopeMark } from "@/components/appearance-button";
import { currentUser } from "@/server/session";
import { ownerOf } from "@/server/profile-store";
import { siteDesign } from "@/server/site-design";

/**
 * Every page of a person's site (profile, posts, writing) in the site's own design, made by its owner with Virtu:
 * the --virtu- properties of their design, which .site-design (src/app/globals.css) maps onto the page's colors and
 * type, and its look (shape, ornaments, season). A season calendar draws while the page root has data-virtu-season, so
 * a small script sets today's season before the page paints. The page is marked as the viewer's own site or someone
 * else's, so the Appearance button (src/components/appearance-button.tsx) offers My site only to its owner; the
 * Customize panel it replaced is retired (2026-11-19).
 */
export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ key: string }> }) {
  const owner = await ownerOf((await params).key).catch(() => null);
  if (!owner) return children;
  const [design, user] = await Promise.all([siteDesign(owner.id).catch(() => ({ css: "", season: null })), currentUser().catch(() => null)]);
  const { css, season } = design;
  return (
    <div className="site-design">
      {css ? <style data-site-design="">{css}</style> : null}
      {season ? <script dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.virtuSeason=${JSON.stringify(season)}` }} /> : null}
      {children}
      {user ? <SiteScopeMark own={user.id === owner.id} /> : null}
    </div>
  );
}
