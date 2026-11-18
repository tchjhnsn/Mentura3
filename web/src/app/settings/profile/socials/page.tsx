import type { Metadata } from "next";
import { SERVICES } from "@reflect/core/profile";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN } from "@/components/list-rows";
import { requireUser } from "@/server/session";
import { socialsOf } from "@/server/profile-store";
import { canLinkBack, noLinkBackLine } from "@/server/actions/socials";
import { SocialsList, type LinkRow } from "./socials-list";

export const metadata: Metadata = { title: "Socials" };
export const dynamic = "force-dynamic";

/**
 * Socials (doc "Profiles and accounts design guide", 2026-11-18): the links on the person's profile, each opening a
 * one-field sheet (change, Confirm by link-back, Remove), then the services not yet added, then + Add, which
 * recognises the service from a pasted link. Reordering is not built.
 */
export default async function SocialsPage() {
  const user = await requireUser();
  const links = await socialsOf(user.id);
  const rows: LinkRow[] = links.map((s) => ({ id: s.id, service: s.service, label: s.label, url: s.url, handle: s.handle, confirmed: s.confirmedBy !== null, canConfirm: canLinkBack(s.service), noConfirmLine: canLinkBack(s.service) ? null : noLinkBackLine(s.service) }));
  const have = new Set(links.map((s) => s.service));
  const addable = SERVICES.filter((s) => s.id !== "website" && s.id !== "mastodon" && !have.has(s.id)).map((s) => ({ id: s.id as string, label: s.label as string }));
  addable.push({ id: "website", label: "Website" });
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/profile" backLabel="Profile" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Profile", href: "/settings/profile" }]} title="Socials" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Socials</h1>
        <SocialsList links={rows} addable={addable} />
        <p className="text-muted-foreground text-center text-xs">A check means the linked page links back to your profile with rel=&quot;me&quot;.</p>
      </div>
    </main>
  );
}
