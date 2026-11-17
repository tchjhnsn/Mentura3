"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addFeed, removeFeed } from "@/server/calendar-feeds";
import { disconnectGoogle } from "@/server/google-calendar";
import { requireUser } from "@/server/session";

// Settings, Connections: subscribing to a calendar by its address, removing one, and disconnecting Google Calendar.

const CALENDARS = "/settings/connections/calendars";
const done = (to: string) => {
  revalidatePath("/calendar");
  revalidatePath("/settings/connections", "layout");
  redirect(to);
};

export async function addFeedAction(form: FormData): Promise<void> {
  const user = await requireUser();
  let error: string | null = null;
  try {
    await addFeed(user.id, { url: form.get("url"), name: form.get("name"), tile: form.get("tile") });
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not subscribe to that calendar.";
  }
  // The address never goes back into a URL: only the error does, and it names the host at most.
  if (error) redirect(`${CALENDARS}/add?error=${encodeURIComponent(error.slice(0, 200))}`);
  done(CALENDARS);
}

export async function removeFeedAction(id: string): Promise<void> {
  const user = await requireUser();
  await removeFeed(user.id, id);
  done(CALENDARS);
}

export async function disconnectGoogleAction(): Promise<void> {
  const user = await requireUser();
  await disconnectGoogle(user.id);
  done("/settings/connections/google-calendar");
}
