"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { acceptInvite, addMember, createInvite, ensureHousehold, leaveHousehold, removeMember, revokeInvite, saveMember } from "@/server/household-store";

// Settings, Household (doc "Tiles and their connections"): members join by invite and keep their own login; a member
// without a login is added and kept by another member.

const HOUSEHOLD = "/settings?tab=household";
function fields(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (!k.startsWith("$")) out[k] = String(v);
  return out;
}
const done = (to = HOUSEHOLD) => {
  revalidatePath("/", "layout");
  redirect(to);
};

export async function startHouseholdAction(): Promise<void> {
  const user = await requireUser();
  await ensureHousehold(user.id);
  done();
}

export async function addMemberAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await addMember(user.id, fields(form));
  done();
}

export async function saveMemberAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await saveMember(user.id, id, fields(form));
  done();
}

export async function removeMemberAction(id: string): Promise<void> {
  const user = await requireUser();
  await removeMember(user.id, id);
  done();
}

export async function leaveHouseholdAction(): Promise<void> {
  const user = await requireUser();
  await leaveHousehold(user.id);
  done();
}

/** Makes an invite link and shows it once; a member id makes it a link for them to claim their record. */
export async function inviteAction(memberId?: string): Promise<void> {
  const user = await requireUser();
  const token = await createInvite(user.id, memberId);
  done(`${HOUSEHOLD}&link=${encodeURIComponent(token)}`);
}

export async function revokeInviteAction(id: string): Promise<void> {
  const user = await requireUser();
  await revokeInvite(user.id, id);
  done();
}

export async function acceptInviteAction(token: string): Promise<void> {
  const user = await requireUser();
  try {
    await acceptInvite(user.id, token);
  } catch (e) {
    redirect(`/household/join/${encodeURIComponent(token)}?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not join.")}`);
  }
  done();
}
