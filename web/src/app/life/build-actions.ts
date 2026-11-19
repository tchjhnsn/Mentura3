"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { answerBuildRequestAction, askToBuildAction } from "@/server/actions/build";

// People to build with (Events and connections, 2026-11-18): Ask to build on a venture's page and Yes or Not now on the
// Ventures tile run the same registry entries the chat and MCP run, so each is in the change log.

const said = (e: unknown, or: string) => (e instanceof Error ? e.message : or);

export async function askToBuildFromPage(venture: string, person: string): Promise<{ error?: string }> {
  const user = await requireUser();
  try {
    await fromPage(askToBuildAction, user.id, { venture, person });
  } catch (e) {
    return { error: said(e, "That could not be asked.") };
  }
  revalidatePath(`/life/ventures/${venture}`);
  revalidatePath("/v/people");
  return {};
}

export async function answerBuildFromPage(request: string, answer: "yes" | "no"): Promise<{ error?: string; message?: string }> {
  const user = await requireUser();
  let message: string | undefined;
  try {
    const r = await fromPage(answerBuildRequestAction, user.id, { request, answer });
    message = "message_href" in r ? r.message_href : undefined;
  } catch (e) {
    return { error: said(e, "That could not be answered.") };
  }
  // Not revalidated: the row stays with its answer (Message after a yes) until the person leaves the tile.
  return message ? { message } : {};
}
