// The person's account (doc "Profiles and accounts design guide", 2026-11-18): their handle (the address of their
// profile, /p/<handle>), the name people see, and who sees their profile by default. Settings, Account runs the same
// entries, so each change is in the change log and can be undone.
import { z } from "zod";
import { AUDIENCES, cleanHandle, isAudience } from "@reflect/core/profile";
import { handleSuggestions, profileSettings, setDefaultAudience, setHandle } from "../profile-store";
import { NAME_MAX, setName } from "../account-store";
import { action } from "./types";

const profileHref = (handle: string | null, id: string) => `/p/${encodeURIComponent(handle ?? id)}`;

export const setHandleAction = action({
  id: "set_handle",
  title: "Set the person's handle",
  description:
    "Set the person's handle, the address of their profile (/p/<handle>): 3 to 30 lower-case letters, digits and hyphens, starting and ending with a letter or digit; null clears it. The old handle keeps sending people to them for 30 days. A taken handle is refused with two free ones near it. Only the handle the person asks for.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ handle: z.string().min(1).max(40).nullable() }),
  before: async ({ userId }) => ({ handle: (await profileSettings(userId)).handle }),
  run: async ({ userId }, { handle }) => {
    try {
      const was = await setHandle(userId, handle);
      const now = handle === null ? null : cleanHandle(handle);
      return { handle: now, was, href: profileHref(now, userId) };
    } catch (e) {
      if (handle !== null && e instanceof Error && /taken/.test(e.message)) {
        const free = await handleSuggestions(handle);
        throw new Error(free.length ? `That handle is taken. Free: ${free.map((s) => `@${s}`).join(", ")}.` : e.message);
      }
      throw e;
    }
  },
  change: (r, _i, before) => ({ before, after: { handle: r.handle } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { handle?: unknown } | null;
    if (!b || !("handle" in b)) throw new Error("This change cannot be undone.");
    await setHandle(userId, typeof b.handle === "string" ? b.handle : null);
  },
});

export const setNameAction = action({
  id: "set_name",
  title: "Set the person's name",
  description: `Set the name the person shows on their profile and at events (up to ${NAME_MAX} characters). Only the name they ask for, in their words.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ name: z.string().min(1).max(NAME_MAX) }),
  run: async ({ userId }, { name }) => {
    const was = await setName(userId, name);
    return { name: name.replace(/\s+/g, " ").trim(), was, href: "/settings/account/name" };
  },
  change: (r) => ({ before: { name: r.was }, after: { name: r.name } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { name?: unknown } | null;
    if (typeof b?.name !== "string" || !b.name.trim()) throw new Error("This change cannot be undone.");
    await setName(userId, b.name);
  },
});

const AUDIENCE = z.enum(["everyone", "met", "me"]);

export const setDefaultAudienceAction = action({
  id: "set_default_audience",
  title: "Set who sees the person's profile",
  description: `Set who sees the person's profile by default: ${AUDIENCES.map((a) => `${a.id} (${a.label})`).join(", ")}. "met" means people they connected with or checked in to the same event as. A section given its own audience keeps it. Only when the person asks.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ audience: AUDIENCE }),
  run: async ({ userId }, { audience }) => {
    const was = await setDefaultAudience(userId, audience);
    return { audience: AUDIENCES.find((a) => a.id === audience)!.label, id: audience, was, href: "/settings/account/audience" };
  },
  change: (r) => ({ before: { audience: r.was }, after: { audience: r.id } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { audience?: unknown } | null;
    if (!isAudience(b?.audience)) throw new Error("This change cannot be undone.");
    await setDefaultAudience(userId, b.audience);
  },
});
