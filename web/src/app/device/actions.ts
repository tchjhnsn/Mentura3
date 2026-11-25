"use server";

// The person's two taps on /device (device sign-in, RFC 8628; offline sync, EE-174): Approve, which scopes the
// command line's token to one business, and Deny. Both are the person's own tap while signed in to Mentura; the
// command line gets its token on its next poll.
import { redirect } from "next/navigation";
import { approveDeviceCode, denyDeviceCode, type DecideProblem } from "@/server/device-auth";
import { requireUser } from "@/server/session";

const WHY: Record<DecideProblem, string> = {
  "no-such-code": "That code is not one of ours. Check it and type it again.",
  expired: "That code has expired. Ask the command line for a new one.",
  "already-decided": "That code was already answered.",
  "no-business": "Choose which business the command line may use.",
};

const back = (code: string, problem: DecideProblem): never => redirect(`/device?user_code=${encodeURIComponent(code)}&error=${encodeURIComponent(WHY[problem])}`);

export async function approveDeviceAction(code: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const business = String(form.get("business") ?? "").trim();
  if (!business) back(code, "no-business");
  const r = await approveDeviceCode(code, user.id, business);
  if (r !== "approved") back(code, r);
  redirect("/device?done=approved");
}

export async function denyDeviceAction(code: string): Promise<void> {
  const user = await requireUser();
  const r = await denyDeviceCode(code, user.id);
  if (r !== "denied") back(code, r);
  redirect("/device?done=denied");
}
