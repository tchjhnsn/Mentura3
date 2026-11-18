// The person's site as a Next.js project (doc "Personal site and blog design guide", Export): what everyone may see on
// the profile, and the published posts. Never anything set for people they've met or only them, never the journal.
import { zipSync, strToU8 } from "fflate";
import { exportFiles, exportName, type ExportProfile } from "@reflect/core/site-export";
import { profilePage } from "./profile-store";
import { postsOf, siteOf } from "./site-store";
import { profileHref } from "./actions/profiles";
import { siteUrl } from "./site";

/** The project's files by path, and its folder name. */
export async function siteProject(userId: string): Promise<{ name: string; files: Record<string, string> }> {
  const [p, posts, site] = await Promise.all([profilePage(userId, null), postsOf(userId, 1000), siteOf(userId)]);
  if (!p) throw new Error("No such person.");
  const profile: ExportProfile = {
    name: p.name,
    line: p.line,
    handle: p.handle,
    socials: (p.socials ?? []).map((s) => ({ label: s.handle ?? s.label, url: s.url })),
    building: (p.building ?? []).map((b) => ({ name: b.name, line: b.what, url: null })),
    experience: (p.experience ?? []).map((e) => ({ title: e.title, org: e.organisation, years: [e.starts?.match(/\d{4}/)?.[0], e.ends?.match(/\d{4}/)?.[0] ?? (e.starts ? "now" : null)].filter(Boolean).join(" to ") || null })),
    interests: p.interests ?? [],
  };
  const url = site.domain && site.domainCheckedAt ? `https://${site.domain}` : `${siteUrl()}${profileHref(p)}`;
  const files = exportFiles(profile, posts.map((x) => ({ slug: x.slug, title: x.title, kind: x.kind, body: x.body, publishedAt: x.publishedAt, updatedAt: x.updatedAt })), site.template, url);
  return { name: exportName(profile), files };
}

/** The project as a zip, inside one folder named for it. */
export async function siteZip(userId: string): Promise<{ name: string; zip: Uint8Array }> {
  const { name, files } = await siteProject(userId);
  const entries: Record<string, Uint8Array> = {};
  for (const [path, text] of Object.entries(files)) entries[`${name}/${path}`] = strToU8(text);
  return { name, zip: zipSync(entries, { level: 6 }) };
}
