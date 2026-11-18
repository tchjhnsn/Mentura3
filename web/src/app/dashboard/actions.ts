"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { changeEvent } from "@/server/actions/calendar-events";
import { connectWithAction } from "@/server/actions/connections";
import { undoChangeAction } from "@/server/actions/changes";
import { eventOf } from "@/server/calendar-store";
import { declineRequest } from "@/server/connect-store";
import { layoutOf, putLayout } from "@/server/dashboard-layout";
import { briefOf, type Brief } from "@/server/dashboard-brief";
import { cleanLayout, fromEdit, movable, nextDay } from "./urgency";
import { dayIn } from "./parts";

// The dashboard's own taps. Each returns what happened instead of redirecting, so the card can update in place and
// the toast can offer Undo with the change's id. Moving, connecting and Undo run the registry's entries (fromPage).

/** What a tap returns: a line for the toast, the change to undo when it can be undone, or what went wrong. */
export type Done = { ok: true; text: string; changeId: string | null } | { ok: false; error: string };
const failed = (e: unknown, fallback: string): Done => ({ ok: false, error: e instanceof Error ? e.message : fallback });

/** Moves one of the person's own one-off events on Today to the next day (change_event, which Undo puts back). */
export async function moveToNextDayAction(id: string): Promise<Done> {
  const user = await requireUser();
  try {
    const e = await eventOf(user.id, String(id));
    if (!e || !movable({ id: String(id), repeat: e.repeat })) throw new Error("Only your own one-off events move from here.");
    const day = nextDay(e.day);
    const ran = await fromPage(changeEvent, user.id, {
      id: String(id), title: e.title, day,
      ...(e.starts ? { starts: e.starts } : {}), ...(e.ends ? { ends: e.ends } : {}), ...(e.tile ? { tile: e.tile } : {}), ...(e.note ? { note: e.note } : {}),
    } as Parameters<typeof changeEvent.run>[1], { change: true });
    revalidatePath("/dashboard");
    return { ok: true, text: `Moved ${e.title} to tomorrow`, changeId: ran.changeId };
  } catch (err) {
    return failed(err, "Could not move it.");
  }
}

/** Connect back on a request in the People card (connect_with). It makes the two friends, which is not undone here. */
export async function connectBackFromDashboard(fromUser: string): Promise<Done> {
  const user = await requireUser();
  try {
    const r = await fromPage(connectWithAction, user.id, { to: String(fromUser) });
    revalidatePath("/dashboard");
    return { ok: true, text: r.state === "connected" ? `You and ${r.to} are connected` : `Asked ${r.to} to connect`, changeId: null };
  } catch (err) {
    return failed(err, "Could not connect.");
  }
}

/** Not now on a request in the People card. The other person is not told. */
export async function notNowFromDashboard(requestId: string): Promise<Done> {
  const user = await requireUser();
  try {
    await declineRequest(user.id, String(requestId));
    revalidatePath("/dashboard");
    return { ok: true, text: "Request set aside", changeId: null };
  } catch (err) {
    return failed(err, "Could not set it aside.");
  }
}

/** Undo in the dashboard's toast (undo_change). */
export async function undoFromDashboard(changeId: string): Promise<Done> {
  const user = await requireUser();
  try {
    const r = await fromPage(undoChangeAction, user.id, { change_id: String(changeId) });
    revalidatePath("/dashboard");
    return { ok: true, text: `Undone: ${r.title}`, changeId: null };
  } catch (err) {
    return failed(err, "Could not undo it.");
  }
}

/** Done in Edit dashboard: keeps the order (or none, to order by urgency), the hidden cards and the sizes. */
export async function saveLayoutAction(raw: unknown): Promise<Done> {
  const user = await requireUser();
  try {
    await putLayout(user.id, fromEdit(cleanLayout(raw), await layoutOf(user.id)));
    revalidatePath("/dashboard");
    return { ok: true, text: "Dashboard saved", changeId: null };
  } catch (err) {
    return failed(err, "Could not save the dashboard.");
  }
}

/** The brief's Refresh: writes today's brief again from the person's records and keeps it. */
export async function refreshBriefAction(): Promise<Brief> {
  const user = await requireUser();
  return briefOf(user.id, dayIn(new Date()), { fresh: true });
}
