"use server";

import { requireUser } from "@/server/session";
import { briefOf, type Brief } from "@/server/dashboard-brief";
import { dayIn } from "./parts";

/** The brief's Refresh: writes today's brief again from the person's records and keeps it. */
export async function refreshBriefAction(): Promise<Brief> {
  const user = await requireUser();
  return briefOf(user.id, dayIn(new Date()), { fresh: true });
}
