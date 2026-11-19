"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { cookieDomain } from "@/server/site";
import { APPEARANCE_BUTTON_COOKIE, LOOK_COOKIE, lookOf, type Look } from "@/lib/themes";

// Both sides share the look when they have their own hosts (doc "Private and shared Reflect plan", 2026-11-19).
const both = () => { const d = cookieDomain(); return d ? { domain: d } : {}; };

/** Keeps one part of the person's look (theme, mode or background) in the cookie the layout reads, for a year. */
export async function setLookAction(part: keyof Look, value: string): Promise<void> {
  const jar = await cookies();
  const look = lookOf(JSON.stringify({ ...lookOf(jar.get(LOOK_COOKIE)?.value), [part]: value }));
  jar.set(LOOK_COOKIE, JSON.stringify(look), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", ...both() });
  revalidatePath("/", "layout");
}

/** Shows or hides the Appearance button on this device (a cookie, for a year), on every page. */
export async function setAppearanceButtonAction(on: boolean): Promise<void> {
  const jar = await cookies();
  if (on) jar.set(APPEARANCE_BUTTON_COOKIE, "on", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", ...both() });
  else jar.set(APPEARANCE_BUTTON_COOKIE, "", { path: "/", maxAge: 0, ...both() });
  revalidatePath("/", "layout");
}
