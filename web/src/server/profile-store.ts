// Profiles and accounts (doc "Profiles and accounts design guide", 2026-11-18; migration 0051): the rows behind a
// person's profile at /p/<handle>. The rules (handles, audiences, links, LinkedIn's export) are in
// @reflect/core/profile; who may see each part is decided in profilePage before anything is returned. Emails are never
// read.
import { traitById, type TraitId } from "@reflect/core/formation";
import { canSee, cleanHandle, handleProblem, isAudience, sectionAudience, SECTIONS, serviceById, type Audience, type ConnectionIn, type ExperienceIn, type SectionId, type Viewer } from "@reflect/core/profile";
import { db } from "@/db/pool";
import { admiredOf } from "./admired";
import { open, seal, sharedTag } from "./crypto";
import { lifeRecords } from "./life-store";

const nameOr = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "A member");
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

export type ProfileSettings = { handle: string | null; audience: Audience; sections: Record<string, Audience>; line: string | null; interests: string[]; builds: boolean };

export async function profileSettings(userId: string): Promise<ProfileSettings> {
  const r = await db().query("SELECT handle, audience, section_audience, line, interests, builds FROM member_profile WHERE user_id = $1", [userId]);
  const x = r.rows[0];
  const sections: Record<string, Audience> = {};
  for (const [k, v] of Object.entries((x?.section_audience as Record<string, unknown> | null) ?? {})) if (isAudience(v)) sections[k] = v;
  return { handle: x?.handle ?? null, audience: isAudience(x?.audience) ? x.audience : "met", sections, line: x?.line ?? null, interests: x?.interests ?? [], builds: x?.builds === true };
}

const ensureRow = (userId: string) => db().query("INSERT INTO member_profile (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);

/** Whether someone else has the handle, or had it in the last 30 days. */
export async function handleTaken(handle: string, userId: string): Promise<boolean> {
  const r = await db().query(
    "SELECT 1 FROM member_profile WHERE handle = $1 AND user_id <> $2 UNION SELECT 1 FROM handle_redirect WHERE handle = $1 AND user_id <> $2 AND until > now()",
    [handle, userId],
  );
  return r.rows.length > 0;
}

/** Sets the person's handle (null clears it). The old one sends people to them for 30 days. Returns the old handle. */
export async function setHandle(userId: string, raw: string | null): Promise<string | null> {
  const handle = raw === null ? null : cleanHandle(raw);
  if (handle !== null) {
    const p = handleProblem(handle);
    if (p) throw new Error(p);
  }
  const before = (await profileSettings(userId)).handle;
  if (before === handle) return before;
  if (handle && (await handleTaken(handle, userId))) throw new Error("That handle is taken.");
  await ensureRow(userId);
  await db().query("UPDATE member_profile SET handle = $2, updated_at = now() WHERE user_id = $1", [userId, handle]);
  if (handle) await db().query("DELETE FROM handle_redirect WHERE handle = $1", [handle]);
  if (before) await db().query("INSERT INTO handle_redirect (handle, user_id) VALUES ($1, $2) ON CONFLICT (handle) DO UPDATE SET user_id = $2, until = now() + interval '30 days'", [before, userId]);
  return before;
}

/** Two free handles near a wanted one, for the "taken" line. */
export async function handleSuggestions(want: string): Promise<string[]> {
  const base = cleanHandle(want).replace(/[^a-z0-9-]/g, "").slice(0, 24) || "member";
  const out: string[] = [];
  for (const s of [`${base}-${new Date().getFullYear() % 100}`, `${base}-atx`, `${base}2`, `${base}-${Math.floor(Math.random() * 900 + 100)}`]) {
    if (handleProblem(s)) continue;
    const r = await db().query("SELECT 1 FROM member_profile WHERE handle = $1 UNION SELECT 1 FROM handle_redirect WHERE handle = $1 AND until > now()", [s]);
    if (!r.rows.length) out.push(s);
    if (out.length === 2) break;
  }
  return out;
}

/** Whose profile a /p/<key> address is: a handle, an old handle (redirect), or a user id. */
export async function ownerOf(key: string): Promise<{ id: string; handle: string | null; redirect: boolean } | null> {
  const k = decodeURIComponent(key).trim();
  if (!k || k.length > 64) return null;
  const byHandle = await db().query("SELECT user_id, handle FROM member_profile WHERE handle = $1", [k.toLowerCase()]);
  if (byHandle.rows[0]) return { id: byHandle.rows[0].user_id, handle: byHandle.rows[0].handle, redirect: false };
  const old = await db().query("SELECT r.user_id, p.handle FROM handle_redirect r LEFT JOIN member_profile p ON p.user_id = r.user_id WHERE r.handle = $1 AND r.until > now()", [k.toLowerCase()]);
  if (old.rows[0]) return { id: old.rows[0].user_id, handle: old.rows[0].handle ?? null, redirect: true };
  const byId = await db().query(`SELECT u.id, p.handle FROM "user" u LEFT JOIN member_profile p ON p.user_id = u.id WHERE u.id = $1`, [k]);
  if (byId.rows[0]) return { id: byId.rows[0].id, handle: byId.rows[0].handle ?? null, redirect: !!byId.rows[0].handle };
  return null;
}

/** How a viewer stands to a profile's owner: the owner, someone they've met (connected, or checked in to one event together), signed in, or anyone. */
export async function viewerOf(ownerId: string, viewerId: string | null): Promise<Viewer> {
  if (!viewerId) return "anyone";
  if (viewerId === ownerId) return "owner";
  const r = await db().query(
    `SELECT 1 FROM friend_link WHERE (user_a, user_b) = (LEAST($1, $2), GREATEST($1, $2))
     UNION SELECT 1 FROM event_checkin a JOIN event_checkin b ON b.event_id = a.event_id WHERE a.user_id = $1 AND b.user_id = $2 LIMIT 1`,
    [ownerId, viewerId],
  );
  return r.rows.length ? "met" : "signed-in";
}

/** Sets who sees one section; null puts it back to the profile's default. Returns what it was (null for the default). */
export async function setSectionAudience(userId: string, section: SectionId, audience: Audience | null): Promise<Audience | null> {
  const s = await profileSettings(userId);
  const was = s.sections[section] ?? null;
  await ensureRow(userId);
  await db().query(
    audience ? "UPDATE member_profile SET section_audience = section_audience || jsonb_build_object($2::text, $3::text), updated_at = now() WHERE user_id = $1" : "UPDATE member_profile SET section_audience = section_audience - $2::text, updated_at = now() WHERE user_id = $1",
    audience ? [userId, section, audience] : [userId, section],
  );
  return was;
}

/** Sets the profile's default audience. Returns what it was. */
export async function setDefaultAudience(userId: string, audience: Audience): Promise<Audience> {
  const was = (await profileSettings(userId)).audience;
  await ensureRow(userId);
  await db().query("UPDATE member_profile SET audience = $2, updated_at = now() WHERE user_id = $1", [userId, audience]);
  return was;
}

export type Social = { id: string; service: string; label: string; url: string; handle: string | null; confirmedBy: string | null; position: number };

export async function socialsOf(userId: string): Promise<Social[]> {
  const r = await db().query("SELECT id, service, url, handle, confirmed_by, position FROM social_link WHERE user_id = $1 ORDER BY position, created_at", [userId]);
  return r.rows.map((x) => ({ id: x.id, service: x.service, label: serviceById(x.service)?.label ?? "Link", url: x.url, handle: x.handle ?? null, confirmedBy: x.confirmed_by ?? null, position: x.position }));
}

/** Adds a link (or, for a url already kept, returns it). One link per service for the named services, so a new one replaces the old. */
export async function addSocial(userId: string, link: { service: string; url: string; handle: string | null }): Promise<{ added: Social; replaced: Social | null }> {
  const all = await socialsOf(userId);
  const same = all.find((s) => s.url === link.url);
  if (same) return { added: same, replaced: null };
  const replaced = link.service !== "website" && link.service !== "mastodon" ? (all.find((s) => s.service === link.service) ?? null) : null;
  if (replaced) await db().query("DELETE FROM social_link WHERE id = $1 AND user_id = $2", [replaced.id, userId]);
  if (all.length - (replaced ? 1 : 0) >= 20) throw new Error("A profile keeps at most 20 links.");
  const position = replaced?.position ?? (all.length ? Math.max(...all.map((s) => s.position)) + 1 : 0);
  const r = await db().query("INSERT INTO social_link (user_id, service, url, handle, position) VALUES ($1, $2, $3, $4, $5) RETURNING id", [userId, link.service, link.url, link.handle, position]);
  return { added: { id: r.rows[0].id, service: link.service, label: serviceById(link.service)?.label ?? "Link", url: link.url, handle: link.handle, confirmedBy: null, position }, replaced };
}

export async function removeSocial(userId: string, id: string): Promise<Social | null> {
  const s = (await socialsOf(userId)).find((x) => x.id === id) ?? null;
  if (s) await db().query("DELETE FROM social_link WHERE id = $1 AND user_id = $2", [id, userId]);
  return s;
}

/** Puts a removed link back as it was. */
export async function restoreSocial(userId: string, s: Social): Promise<void> {
  await db().query(
    "INSERT INTO social_link (id, user_id, service, url, handle, confirmed_by, confirmed_at, position) VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6::text IS NULL THEN NULL ELSE now() END, $7) ON CONFLICT DO NOTHING",
    [s.id, userId, s.service, s.url, s.handle, s.confirmedBy, s.position],
  );
}

export async function setConfirmed(userId: string, id: string, by: "rel-me" | "linkedin-mutual" | null): Promise<void> {
  await db().query("UPDATE social_link SET confirmed_by = $3, confirmed_at = CASE WHEN $3::text IS NULL THEN NULL ELSE now() END WHERE id = $1 AND user_id = $2", [id, userId, by]);
}

export type Experience = ExperienceIn & { id: string; source: "typed" | "linkedin" };

export async function experienceOf(userId: string): Promise<Experience[]> {
  const r = await db().query("SELECT id, kind, organisation, title, starts, ends, source FROM experience WHERE user_id = $1 ORDER BY kind, created_at", [userId]);
  return r.rows.map((x) => ({ id: x.id, kind: x.kind, organisation: x.organisation, title: x.title ?? null, starts: x.starts ?? null, ends: x.ends ?? null, source: x.source }));
}

/** Adds rows of experience; one already there (same kind, place, title and start) is left alone. Returns the ids added. */
export async function addExperience(userId: string, rows: readonly ExperienceIn[], source: "typed" | "linkedin"): Promise<string[]> {
  const ids: string[] = [];
  for (const e of rows.slice(0, 100)) {
    const r = await db().query(
      "INSERT INTO experience (user_id, kind, organisation, title, starts, ends, source) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING RETURNING id",
      [userId, e.kind, e.organisation.slice(0, 200), e.title?.slice(0, 200) ?? null, e.starts?.slice(0, 40) ?? null, e.ends?.slice(0, 40) ?? null, source],
    );
    if (r.rows[0]) ids.push(r.rows[0].id);
  }
  return ids;
}

export async function removeExperience(userId: string, ids: readonly string[]): Promise<Experience[]> {
  const was = (await experienceOf(userId)).filter((e) => ids.includes(e.id));
  if (was.length) await db().query("DELETE FROM experience WHERE user_id = $1 AND id = ANY($2::uuid[])", [userId, was.map((e) => e.id)]);
  return was;
}

export async function restoreExperience(userId: string, rows: readonly Experience[]): Promise<void> {
  for (const e of rows) await db().query("INSERT INTO experience (id, user_id, kind, organisation, title, starts, ends, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING", [e.id, userId, e.kind, e.organisation, e.title, e.starts, e.ends, e.source]);
}

/** The keyed hash a LinkedIn profile link is kept as (by its /in/ slug), shared across people so two exports can be compared. */
export const linkedinTag = (slug: string) => sharedTag("linkedin", slug.toLowerCase());

/** Keeps the person's LinkedIn connections, sealed; a connection already kept is updated. Returns the tags added. Written 500 at a time. */
export async function keepConnections(userId: string, rows: readonly ConnectionIn[]): Promise<string[]> {
  const byTag = new Map<string, ConnectionIn>();
  for (const c of rows.slice(0, 30000)) byTag.set(linkedinTag(c.slug), c);
  const all = [...byTag];
  const added: string[] = [];
  for (let i = 0; i < all.length; i += 500) {
    const part = all.slice(i, i + 500);
    const r = await db().query(
      `INSERT INTO linkedin_connection (user_id, link_hash, name_ct, company_ct, position_ct, connected_on)
       SELECT $1, t.h, t.n, t.c, t.p, t.d FROM unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::date[]) AS t(h, n, c, p, d)
       ON CONFLICT (user_id, link_hash) DO UPDATE SET name_ct = EXCLUDED.name_ct, company_ct = EXCLUDED.company_ct, position_ct = EXCLUDED.position_ct, connected_on = EXCLUDED.connected_on
       RETURNING link_hash, (xmax = 0) AS fresh`,
      [
        userId,
        part.map(([t]) => t),
        part.map(([, c]) => seal(userId, c.name)),
        part.map(([, c]) => (c.company ? seal(userId, c.company) : null)),
        part.map(([, c]) => (c.position ? seal(userId, c.position) : null)),
        part.map(([, c]) => c.connectedOn),
      ],
    );
    for (const x of r.rows) if (x.fresh) added.push(x.link_hash);
  }
  return added;
}

export async function removeConnections(userId: string, tags: readonly string[] | "all"): Promise<number> {
  const r = tags === "all" ? await db().query("DELETE FROM linkedin_connection WHERE user_id = $1", [userId]) : await db().query("DELETE FROM linkedin_connection WHERE user_id = $1 AND link_hash = ANY($2::text[])", [userId, tags]);
  return r.rowCount ?? 0;
}

export type KeptConnection = { name: string; company: string | null; position: string | null; connectedOn: string | null };

/** The person's LinkedIn connections, opened, for them only: newest connection first. */
export async function connectionsOf(userId: string, limit = 2000): Promise<KeptConnection[]> {
  const r = await db().query("SELECT name_ct, company_ct, position_ct, connected_on FROM linkedin_connection WHERE user_id = $1 ORDER BY connected_on DESC NULLS LAST LIMIT $2", [userId, limit]);
  return r.rows.map((x) => ({ name: open(userId, x.name_ct), company: x.company_ct ? open(userId, x.company_ct) : null, position: x.position_ct ? open(userId, x.position_ct) : null, connectedOn: x.connected_on ? new Date(x.connected_on).toISOString().slice(0, 10) : null }));
}

/** What the person has kept from LinkedIn: experience rows from it, connections, and when they last kept an upload. */
export async function linkedinKept(userId: string): Promise<{ positions: number; schools: number; connections: number; lastUpload: string | null }> {
  const r = await db().query(
    `SELECT (SELECT count(*) FROM experience WHERE user_id = $1 AND source = 'linkedin' AND kind = 'position')::int AS positions,
            (SELECT count(*) FROM experience WHERE user_id = $1 AND source = 'linkedin' AND kind = 'school')::int AS schools,
            (SELECT count(*) FROM linkedin_connection WHERE user_id = $1)::int AS connections,
            (SELECT max(created_at) FROM action_change WHERE user_id = $1 AND action_id = 'import_linkedin' AND status = 'done') AS last`,
    [userId],
  );
  const x = r.rows[0] ?? {};
  return { positions: x.positions ?? 0, schools: x.schools ?? 0, connections: x.connections ?? 0, lastUpload: iso(x.last) };
}

export type Tally = { label: string; count: number };

/** The most common companies and positions among the person's LinkedIn connections, for them alone (opened here, never kept). */
export async function connectionTallies(userId: string, top = 5): Promise<{ total: number; companies: Tally[]; positions: Tally[] }> {
  const all = await connectionsOf(userId, 30000);
  const tally = (pick: (c: KeptConnection) => string | null): Tally[] => {
    const m = new Map<string, Tally>();
    for (const c of all) {
      const v = pick(c)?.trim();
      if (!v) continue;
      const k = v.toLowerCase();
      const t = m.get(k);
      if (t) t.count++;
      else m.set(k, { label: v, count: 1 });
    }
    return [...m.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, top);
  };
  return { total: all.length, companies: tally((c) => c.company), positions: tally((c) => c.position) };
}

export type Match = { id: string; name: string; handle: string | null };

/**
 * People here who are the person's LinkedIn connections, by mutual agreement of two exports: each put a LinkedIn link
 * on their profile, the person's export lists the other's link and the other's export lists the person's. Both
 * LinkedIn links are then confirmed. Nothing is matched from one side alone.
 */
export async function linkedinMatches(userId: string): Promise<Match[]> {
  const mine = (await socialsOf(userId)).find((s) => s.service === "linkedin" && s.handle);
  if (!mine?.handle) return [];
  const myTag = linkedinTag(mine.handle);
  const r = await db().query(
    `SELECT u.id, u.name, p.handle, s.id AS their_link FROM social_link s
       JOIN "user" u ON u.id = s.user_id LEFT JOIN member_profile p ON p.user_id = u.id
       JOIN linkedin_connection theirs ON theirs.user_id = s.user_id AND theirs.link_hash = $2
     WHERE s.service = 'linkedin' AND s.handle IS NOT NULL AND s.user_id <> $1`,
    [userId, myTag],
  );
  const out: Match[] = [];
  for (const x of r.rows) {
    const theirLink = await db().query("SELECT handle FROM social_link WHERE id = $1", [x.their_link]);
    const t = theirLink.rows[0]?.handle as string | undefined;
    if (!t) continue;
    const listed = await db().query("SELECT 1 FROM linkedin_connection WHERE user_id = $1 AND link_hash = $2", [userId, linkedinTag(t)]);
    if (!listed.rows.length) continue;
    await setConfirmed(userId, mine.id, "linkedin-mutual");
    await setConfirmed(x.id, x.their_link, "linkedin-mutual");
    out.push({ id: x.id, name: nameOr(x.name), handle: x.handle ?? null });
  }
  return out;
}

export type ProfilePage = {
  id: string;
  name: string;
  handle: string | null;
  line: string | null;
  viewer: Viewer;
  socials: Social[] | null;
  building: { id: string; name: string; what: string | null }[] | null;
  wantsBuilders: boolean;
  qualities: { id: string; label: string }[] | null;
  experience: Experience[] | null;
  events: { id: string; title: string; startsAt: string | null; hosted: boolean }[] | null;
  interests: string[] | null;
  met: { title: string; startsAt: string | null; eventId: string } | null;
  connected: boolean;
  /** Each section's audience, for the owner's eye icons only. */
  audiences: Record<SectionId, Audience> | null;
};

/** A profile as one viewer may see it: a section the viewer may not see is null and is left off the page. */
export async function profilePage(ownerId: string, viewerId: string | null): Promise<ProfilePage | null> {
  const u = await db().query(`SELECT id, name FROM "user" WHERE id = $1`, [ownerId]);
  if (!u.rows[0]) return null;
  const [s, viewer] = await Promise.all([profileSettings(ownerId), viewerOf(ownerId, viewerId)]);
  const aud = (id: SectionId) => sectionAudience(id, s.sections, s.audience);
  const sees = (id: SectionId) => canSee(aud(id), viewer);
  const [socials, ventures, admired, experience, events] = await Promise.all([
    sees("socials") ? socialsOf(ownerId) : null,
    sees("building") ? lifeRecords(ownerId, "ventures").catch(() => []) : null,
    sees("qualities") ? admiredOf(ownerId) : null,
    sees("experience") ? experienceOf(ownerId) : null,
    sees("events")
      ? db().query(
          `SELECT e.id, e.title, e.starts_at, e.host_user = $1 AS hosted FROM event e
           WHERE e.status = 'published' AND (e.host_user = $1 OR EXISTS (SELECT 1 FROM event_checkin c WHERE c.event_id = e.id AND c.user_id = $1))
           ORDER BY e.starts_at DESC NULLS LAST LIMIT 6`,
          [ownerId],
        ).then((r) => r.rows.map((x) => ({ id: x.id as string, title: x.title as string, startsAt: iso(x.starts_at), hosted: x.hosted === true })))
      : null,
  ]);
  const traits = admired ? [...new Set(admired.flatMap((a) => a.traits))].map((t: TraitId) => ({ id: t, label: traitById(t)?.name ?? t })) : null;
  let met: ProfilePage["met"] = null;
  let connected = false;
  if (viewerId && viewer !== "owner") {
    const f = await db().query(
      "SELECT f.met_event, e.title, e.starts_at FROM friend_link f LEFT JOIN event e ON e.id = f.met_event WHERE (f.user_a, f.user_b) = (LEAST($1, $2), GREATEST($1, $2))",
      [ownerId, viewerId],
    );
    connected = f.rows.length > 0;
    if (f.rows[0]?.met_event) met = { eventId: f.rows[0].met_event, title: f.rows[0].title, startsAt: iso(f.rows[0].starts_at) };
  }
  return {
    id: ownerId,
    name: nameOr(u.rows[0].name),
    handle: s.handle,
    line: s.line,
    viewer,
    socials,
    building: ventures ? ventures.filter((r) => r.kind === "venture" && r.state !== "closed").map((r) => ({ id: r.id, name: String(r.body.name ?? "Venture"), what: typeof r.body.what === "string" && r.body.what.trim() ? r.body.what.trim() : null })) : null,
    wantsBuilders: s.builds,
    qualities: traits,
    experience,
    events,
    interests: sees("interests") ? s.interests : null,
    met,
    connected,
    audiences: viewer === "owner" ? (Object.fromEntries(SECTIONS.map((x) => [x.id, aud(x.id)])) as Record<SectionId, Audience>) : null,
  };
}
