import { strToU8, zipSync } from "fflate";
import { currentUser } from "@/server/session";
import { nameOf } from "@/server/account-store";
import { connectionsOf, experienceOf, profileSettings, socialsOf } from "@/server/profile-store";
import { loadMe } from "@/server/me-store";
import { lifeActs, lifeRecords, lifeStateChanges } from "@/server/life-store";
import { exportJournal } from "@/server/journal-store";
import { events } from "@/server/calendar-store";

export const dynamic = "force-dynamic";

/**
 * Download your data (Settings, Account): the person's own rows, opened, as JSON files in one zip. Their profile, links,
 * experience and LinkedIn connections, what they told Reflect about themselves, their life records, their journal and
 * works, and the events they keep in their calendar. Only their own; nothing of anyone else's.
 */
export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const id = user.id;
  const [name, profile, socials, experience, connections, me, records, acts, states, journal, calendar] = await Promise.all([
    nameOf(id), profileSettings(id), socialsOf(id), experienceOf(id), connectionsOf(id, 100_000), loadMe(id),
    lifeRecords(id), lifeActs(id), lifeStateChanges(id), exportJournal(id), events(id, "0001-01-01", "9999-12-31"),
  ]);
  const day = new Date().toISOString().slice(0, 10);
  const folder = `reflect-${day}`;
  const json = (v: unknown) => strToU8(JSON.stringify(v, null, 2));
  const files: Record<string, Uint8Array> = {
    "README.txt": strToU8(`Your data from Reflect, ${day}.\n\nprofile.json: your name, handle, line, interests and who sees your profile\nsocials.json: the links on your profile\nexperience.json: your positions and schools\nlinkedin-connections.json: the LinkedIn connections you uploaded (only you can see these)\nabout-you.json: what you told Reflect about yourself\nlife-records.json, life-acts.json, life-states.json: your life records and what you logged on them\njournal.json: your journal entries and works\ncalendar.json: the events in your calendar\n`),
    "profile.json": json({ name, ...profile }),
    "socials.json": json(socials),
    "experience.json": json(experience),
    "linkedin-connections.json": json(connections),
    "about-you.json": json(me),
    "life-records.json": json(records),
    "life-acts.json": json(acts),
    "life-states.json": json(states),
    "journal.json": json(journal),
    "calendar.json": json(calendar),
  };
  const zip = zipSync(Object.fromEntries(Object.entries(files).map(([p, b]) => [`${folder}/${p}`, b])));
  return new Response(zip as unknown as BodyInit, {
    headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${folder}.zip"`, "cache-control": "no-store" },
  });
}
