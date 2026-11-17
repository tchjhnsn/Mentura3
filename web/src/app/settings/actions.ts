"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { isState } from "@reflect/core/public-data";
import { addLifeRecord, saveLifeRecord } from "@/server/life-store";
import { countyRisk, placeRecord } from "@/server/public-data";
import { acceptInvite, addMember, createInvite, ensureHousehold, leaveHousehold, removeMember, revokeInvite, saveMember } from "@/server/household-store";

// Settings, Household (doc "Tiles and their connections"): members join by invite and keep their own login; a member
// without a login is added and kept by another member.

const HOUSEHOLD = "/settings/household";
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
  done(`${HOUSEHOLD}?link=${encodeURIComponent(token)}`);
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

const PLACE = "/settings/place";

/** Where the person lives, a county checked against FEMA's index; a new county clears the water system chosen. */
export async function savePlaceAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const state = String(form.get("state") ?? "").toUpperCase();
  const county = String(form.get("county") ?? "");
  if (!isState(state)) redirect(`${PLACE}?error=${encodeURIComponent("Choose your state.")}`);
  const risk = await countyRisk(state, county);
  if (!risk) redirect(`${PLACE}?error=${encodeURIComponent(`No county named ${county.trim() || "that"} in ${state}.`)}`);
  const had = await placeRecord(user.id);
  const body = { county: risk.county, state: risk.state, ...(had?.county === risk.county && had.state === risk.state ? { pwsid: had.pwsid, water: had.water, served: had.served } : {}) };
  if (had) await saveLifeRecord(user.id, had.id, body);
  else await addLifeRecord(user.id, "home", "place", body);
  done(PLACE);
}

/** The water system that serves the person, from those EPA lists for their county. */
export async function chooseWaterAction(pwsid: string, name: string, served: number | null): Promise<void> {
  const user = await requireUser();
  const had = await placeRecord(user.id);
  if (!had) redirect(PLACE);
  await saveLifeRecord(user.id, had.id, { county: had.county, state: had.state, pwsid, water: name, served: served ?? undefined });
  done(PLACE);
}
