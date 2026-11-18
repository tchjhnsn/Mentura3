// Socials (doc "Profiles and accounts design guide", 2026-11-18): the links on a person's profile, and confirming one
// by link-back (rel="me", ../link-back.ts). Settings, Profile, Socials runs the same entries. A LinkedIn link is
// confirmed only by the mutual match of two LinkedIn exports, never here.
import { z } from "zod";
import { NO_LINK_BACK, normalizeLink, type ServiceId } from "@reflect/core/profile";
import { checkLinkBack, relMeLine } from "../link-back";
import { addSocial, profileSettings, removeSocial, restoreSocial, setConfirmed, socialsOf, type Social } from "../profile-store";
import { action, type ActionContext, type LoggedChange } from "./types";

const HREF = "/settings/profile/socials";

export const canLinkBack = (service: string) => !NO_LINK_BACK.includes(service as ServiceId);

/** The line shown where Confirm is not offered. */
export const noLinkBackLine = (service: string) =>
  service === "linkedin" ? "LinkedIn gets its check when someone you're connected with there also uploads their export." : "This one cannot be confirmed yet.";

const out = (s: Social) => ({ id: s.id, service: s.service, label: s.label, url: s.url, handle: s.handle, confirmed: s.confirmedBy !== null, confirmed_by: s.confirmedBy, can_confirm: canLinkBack(s.service) });

/** One of the person's links, by its id, its service ("github") or its url. */
async function socialOf(userId: string, which: string): Promise<Social> {
  const w = which.trim();
  const all = await socialsOf(userId);
  const norm = normalizeLink(w);
  const hit = all.find((s) => s.id === w) ?? all.find((s) => s.url === w || (norm && s.url === norm.url)) ?? (() => {
    const byService = all.filter((s) => s.service === w.toLowerCase() || s.label.toLowerCase() === w.toLowerCase());
    if (byService.length > 1) throw new Error(`There is more than one ${byService[0]!.label} link. Name it by its link.`);
    return byService[0];
  })();
  if (!hit) throw new Error("No such link on your profile.");
  return hit;
}

const isSocial = (v: unknown): v is Social => !!v && typeof v === "object" && typeof (v as Social).id === "string" && typeof (v as Social).url === "string" && typeof (v as Social).service === "string";

export const socialsAction = action({
  id: "socials",
  title: "Read the person's socials",
  description: "Read the links on the person's profile (LinkedIn, GitHub, a website and so on), in the order shown, each with whether it is confirmed (a check: the linked page links back with rel=\"me\", or for LinkedIn a mutual match of two LinkedIn exports) and whether it can be confirmed by link-back.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => ({ socials: (await socialsOf(userId)).map(out), href: HREF }),
});

export const addSocialAction = action({
  id: "add_social",
  title: "Add a link to the profile",
  description: "Add a link to the person's profile from a pasted link or handle: the service (LinkedIn, X, Instagram, GitHub, YouTube, TikTok, Bluesky, Threads, Facebook, Substack, Mastodon, a website) is recognised from the link, or named with `service` for a bare handle. One link per named service, so a new LinkedIn link replaces the old one. Only a link the person gives. Undo removes it and puts back one it replaced.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    link: z.string().min(1).max(300).describe("A link (github.com/ana) or, with service, a handle (ana)"),
    service: z.string().max(20).optional().describe("The service a bare handle belongs to, such as linkedin or github"),
  }),
  run: async ({ userId }, { link, service }) => {
    const n = normalizeLink(link, service);
    if (!n) throw new Error("That is not a link Reflect can keep. Paste the whole address, such as github.com/yourname.");
    const r = await addSocial(userId, n);
    return { added: out(r.added), replaced: r.replaced, href: HREF };
  },
  change: (r) => ({ before: r.replaced, after: { id: r.added.id } }),
  undo: async ({ userId }: ActionContext, c: LoggedChange) => {
    const a = c.after as { id?: unknown } | null;
    if (typeof a?.id !== "string") throw new Error("This change cannot be undone.");
    await removeSocial(userId, a.id);
    if (isSocial(c.before)) await restoreSocial(userId, c.before);
  },
});

export const removeSocialAction = action({
  id: "remove_social",
  title: "Remove a link from the profile",
  description: "Remove one link from the person's profile, named by its service (github), its link or its id (see socials). Only when the person asks. Undo puts it back as it was, check and place included.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ link: z.string().min(1).max(300).describe("The service, the link, or the id from socials") }),
  run: async ({ userId }, { link }) => {
    const s = await socialOf(userId, link);
    const removed = await removeSocial(userId, s.id);
    if (!removed) throw new Error("No such link on your profile.");
    return { removed, href: HREF };
  },
  change: (r) => ({ before: r.removed }),
  undo: async ({ userId }, c) => {
    if (!isSocial(c.before)) throw new Error("This change cannot be undone.");
    await restoreSocial(userId, c.before);
  },
});

export type ConfirmResult = { id: string; label: string; confirmed: boolean; was: string | null; reason: string | null; line: string; href: string };

export const confirmSocialAction = action({
  id: "confirm_social",
  title: "Confirm a link by link-back",
  description: "Check that a link on the person's profile is theirs: Reflect fetches the linked page (https only) and looks for a rel=\"me\" link back to the person's Reflect profile (/p/<handle or id>). On success the link shows a check. When it fails, the result has the exact line to add to their page. LinkedIn, Instagram, TikTok, Facebook, Threads and X cannot be confirmed this way. Undo clears the check.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ link: z.string().min(1).max(300).describe("The service, the link, or the id from socials") }),
  run: async ({ userId }, { link }): Promise<ConfirmResult> => {
    const s = await socialOf(userId, link);
    if (!canLinkBack(s.service)) throw new Error(noLinkBackLine(s.service));
    const { handle } = await profileSettings(userId);
    const line = relMeLine(handle ?? userId);
    let ok = false;
    let reason: string | null = null;
    try {
      ok = await checkLinkBack(s.url, { userId, handle });
      if (!ok) reason = "That page has no rel=\"me\" link to your profile yet.";
    } catch (e) {
      reason = e instanceof Error ? e.message : "That page could not be read.";
    }
    if (ok) await setConfirmed(userId, s.id, "rel-me");
    return { id: s.id, label: s.label, confirmed: ok, was: s.confirmedBy, reason, line, href: HREF };
  },
  change: (r) => ({ before: { id: r.id, confirmedBy: r.was }, after: { confirmed: r.confirmed } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; confirmedBy?: unknown } | null;
    if (typeof b?.id !== "string") throw new Error("This change cannot be undone.");
    const was = b.confirmedBy === "rel-me" || b.confirmedBy === "linkedin-mutual" ? b.confirmedBy : null;
    await setConfirmed(userId, b.id, was);
  },
});
