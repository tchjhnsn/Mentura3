"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { APPEARANCE_BUTTON_COOKIE, LOOK_COOKIE, lookOf, type Look } from "@/lib/themes";

/** Keeps one part of the person's look (theme, mode or background) in the cookie the layout reads, for a year. */
export async function setLookAction(part: keyof Look, value: string): Promise<void> {
  const jar = await cookies();
  const look = lookOf(JSON.stringify({ ...lookOf(jar.get(LOOK_COOKIE)?.value), [part]: value }));
  jar.set(LOOK_COOKIE, JSON.stringify(look), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

/** Shows or hides the Appearance button on this device (a cookie, for a year), on every page. */
export async function setAppearanceButtonAction(on: boolean): Promise<void> {
  const jar = await cookies();
  if (on) jar.set(APPEARANCE_BUTTON_COOKIE, "on", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  else jar.delete(APPEARANCE_BUTTON_COOKIE);
  revalidatePath("/", "layout");
}
