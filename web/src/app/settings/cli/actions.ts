"use server";

// Settings, Command line: taking back one command line's sign-in (device sign-in, RFC 8628; offline sync, EE-174).
// The command line holding that token is signed out at its next sync call.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revokeCliToken } from "@/server/device-auth";
import { requireUser } from "@/server/session";

export async function revokeCliTokenAction(id: string): Promise<void> {
  const user = await requireUser();
  await revokeCliToken(user.id, id);
  revalidatePath("/settings/cli");
  redirect("/settings/cli");
}
