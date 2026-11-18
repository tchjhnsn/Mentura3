// Profiles (doc "Profiles and accounts design guide", 2026-11-18): a person's profile at /p/<handle> as the asking
// person may see it, and who sees each part of their own. The profile page, the JSON at /api/profile and the chat and
// MCP run the same entries. Who may see what is decided in profilePage (../profile-store.ts); emails are never read.
import { z } from "zod";
import { AUDIENCES, SECTIONS, isAudience, isSection, type Audience } from "@reflect/core/profile";
import { ownerOf, profilePage, profileSettings, setSectionAudience, type ProfilePage } from "../profile-store";
import { action } from "./types";

/** A profile's address: its handle once it has one, else the person's id. */
export const profileHref = (p: { id: string; handle: string | null }) => `/p/${encodeURIComponent(p.handle ?? p.id)}`;

/** A profile as the asking person may see it, or null when there is no such person. Parts they may not see are null. */
export async function profileFor(key: string, viewerId: string | null): Promise<(ProfilePage & { href: string }) | null> {
  const owner = await ownerOf(key);
  if (!owner) return null;
  const p = await profilePage(owner.id, viewerId);
  return p ? { ...p, href: profileHref(p) } : null;
}

const AUDIENCE = z.enum(AUDIENCES.map((a) => a.id) as [Audience, ...Audience[]]);
const SECTION = z.enum(SECTIONS.map((s) => s.id) as [(typeof SECTIONS)[number]["id"], ...(typeof SECTIONS)[number]["id"][]]);
const audienceLabel = (a: Audience | null) => (a ? AUDIENCES.find((x) => x.id === a)!.label : null);

export const profilePageAction = action({
  id: "profile_page",
  title: "Read a profile",
  description: "Read a person's profile (/p/<handle>) as the person asking may see it: name, line, socials, what they are building, qualities, experience, events and interests. A part set for people they've met or only its owner is left out (null) for anyone else; the person's own profile shows everything with who sees each part. Never shows an email or LinkedIn connections. Leave `who` out for the person's own profile.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ who: z.string().min(1).max(64).optional().describe("The person's handle (with or without @) or id; leave out for the person's own") }),
  run: async ({ userId }, { who }) => {
    const p = await profileFor(who ? who.replace(/^@/, "") : userId, userId);
    if (!p) throw new Error("No one has that handle.");
    return p;
  },
});

export const setSectionAudienceAction = action({
  id: "set_section_audience",
  title: "Set who sees a part of the profile",
  description: `Set who sees one part of the person's own profile: ${SECTIONS.map((s) => s.id).join(", ")}; audience everyone, met (people they've met: connected, or checked in to the same event) or me (only them); null puts it back to the profile's default. Only when the person asks. Undo puts back what it was.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ section: SECTION, audience: AUDIENCE.nullable() }),
  before: async ({ userId }, { section }) => ({ section, audience: (await profileSettings(userId)).sections[section] ?? null }),
  run: async ({ userId }, { section, audience }) => {
    await setSectionAudience(userId, section, audience);
    const s = await profileSettings(userId);
    const now = s.sections[section] ?? s.audience;
    return { section, audience: now, label: audienceLabel(now), default: audience === null, href: profileHref({ id: userId, handle: s.handle }) };
  },
  change: (_r, _i, before) => ({ before }),
  undo: async ({ userId }, c) => {
    const b = c.before as { section?: unknown; audience?: unknown } | null;
    if (!isSection(b?.section)) throw new Error("This change cannot be undone.");
    await setSectionAudience(userId, b.section, isAudience(b.audience) ? b.audience : null);
  },
});
