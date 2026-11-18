"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { startNaiveVenture } from "@/server/actions/ventures";

// A venture's files (2026-11-18): Keep on the "Start in Naive" draft runs the same registry entry the chat and MCP
// run, so the start is in the change log and can be undone.

export async function startNaiveAction(venture: string): Promise<{ error?: string }> {
  const user = await requireUser();
  try {
    await fromPage(startNaiveVenture, user.id, { venture });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "That could not be kept." };
  }
  revalidatePath(`/life/ventures/${venture}`);
  return {};
}
