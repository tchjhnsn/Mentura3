// LinkedIn's own export on a profile (doc "Profiles and accounts design guide", 2026-11-18): keep positions and
// schools from it as Experience and the first-degree connections, sealed and private to the person; read the people
// here they know on LinkedIn (a mutual match of two exports) and their own list of connections; remove that list.
// The page at /settings/profile/linkedin runs the same entries. Skills are only listed back, never kept.
import { z } from "zod";
import { LINKEDIN_FILES, readLinkedin, type ExperienceIn, type LinkedinFiles } from "@reflect/core/profile";
import { addExperience, connectionsOf, keepConnections, linkedinMatches, removeConnections, removeExperience } from "../profile-store";
import { action, idsIn } from "./types";

const HREF = "/settings/profile/linkedin";
/** One export file's text; Connections.csv for many thousands of connections stays well under this. */
const TEXT = z.string().max(3_000_000).optional();
const FILES = z.object({ "Positions.csv": TEXT, "Education.csv": TEXT, "Skills.csv": TEXT, "Connections.csv": TEXT, "Profile.csv": TEXT });
const ROWS = z.array(z.number().int().min(0).max(999)).max(500).optional();

/** The rows of a list picked by index (in the order read), or every row when no pick is given. */
export function picked<T>(rows: readonly T[], pick: readonly number[] | undefined): T[] {
  if (pick === undefined) return [...rows];
  return [...new Set(pick)].filter((i) => i < rows.length).sort((a, b) => a - b).map((i) => rows[i]!);
}

/** What an upload holds, read from the export's file texts, before anything is kept. Unknown file names are ignored. */
export function exportPreview(files: LinkedinFiles) {
  const known: LinkedinFiles = {};
  for (const f of LINKEDIN_FILES) if (typeof files[f] === "string") known[f] = files[f];
  const x = readLinkedin(known);
  return { positions: x.positions, schools: x.schools, skills: x.skills, connections: x.connections.length, headline: x.headline, files: Object.keys(known) };
}

/** The connection tags a run added, for its change; kept off the result, which the chat and MCP read. */
const addedTags = new WeakMap<object, string[]>();

export const importLinkedinAction = action({
  id: "import_linkedin",
  title: "Keep a LinkedIn export",
  description:
    "Keep what the person's own LinkedIn export holds (the files Positions.csv, Education.csv, Skills.csv, Connections.csv and Profile.csv from LinkedIn's Download your data, as text): positions and schools become Experience on their profile, and their first-degree connections are kept sealed and private to them (never shown on a profile or to anyone else). `keep.positions` and `keep.schools` are the row numbers to keep, counted from 0 in the order the files list them; left out, every row is kept. Skills are listed back, not kept. Only when the person asks, with their own export. Undo removes the experience rows and connections this run added.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    files: FILES,
    keep: z.object({ positions: ROWS, schools: ROWS, connections: z.boolean().default(true) }).default({ connections: true }),
  }),
  logged: ({ files, keep }) => ({ files: Object.fromEntries(Object.entries(files).filter(([, v]) => typeof v === "string").map(([k, v]) => [k, `${(v as string).length} characters`])), keep }),
  run: async ({ userId }, { files, keep }) => {
    const x = readLinkedin(files);
    const rows: ExperienceIn[] = [...picked(x.positions, keep.positions), ...picked(x.schools, keep.schools)];
    const ids = rows.length ? await addExperience(userId, rows, "linkedin") : [];
    const tags = keep.connections && x.connections.length ? await keepConnections(userId, x.connections) : [];
    const out = {
      experience_kept: rows.length,
      experience_added: ids.length,
      experience_ids: ids,
      connections_kept: keep.connections ? x.connections.length : 0,
      connections_added: tags.length,
      skills: x.skills,
      href: HREF,
    };
    addedTags.set(out, tags);
    return out;
  },
  change: (r) => ({ after: { experience: r.experience_ids, connections: addedTags.get(r) ?? [] } }),
  undo: async ({ userId }, c) => {
    const exp = idsIn(c.after, "experience");
    const tags = idsIn(c.after, "connections");
    if (exp.length) await removeExperience(userId, exp);
    if (tags.length) await removeConnections(userId, tags);
  },
});

const profileHref = (m: { id: string; handle: string | null }) => `/p/${encodeURIComponent(m.handle ?? m.id)}`;

export const linkedinMatchesAction = action({
  id: "linkedin_matches",
  title: "Read people here you know on LinkedIn",
  description:
    "Read the people in Reflect the person is connected with on LinkedIn: only by mutual agreement of two exports (each put their LinkedIn link on their profile, and each one's export lists the other). Never matched from one side alone. Never shows anyone's email.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => ({ people: (await linkedinMatches(userId)).map((m) => ({ name: m.name, href: profileHref(m) })), href: HREF }),
});

export const linkedinConnectionsAction = action({
  id: "linkedin_connections",
  title: "Read your LinkedIn connections",
  description:
    "Read the person's own LinkedIn connections from the export they kept: name, company, position and when they connected, newest first; `company` narrows to one company (any part of its name). Private to the person: never shown to anyone else, never put on a profile, and only for the person's own questions.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ company: z.string().max(200).optional(), limit: z.number().int().min(1).max(2000).default(200) }),
  run: async ({ userId }, { company, limit }) => {
    const all = await connectionsOf(userId, 30000);
    const want = company?.trim().toLowerCase();
    const hits = want ? all.filter((c) => c.company?.toLowerCase().includes(want)) : all;
    return { total: all.length, matching: hits.length, connections: hits.slice(0, limit).map((c) => ({ name: c.name, company: c.company, position: c.position, connected_on: c.connectedOn })), href: HREF };
  },
});

export const removeLinkedinConnectionsAction = action({
  id: "remove_linkedin_connections",
  title: "Remove your LinkedIn connections",
  description:
    "Remove every LinkedIn connection the person kept from their export. This cannot be undone: the removed list is not kept anywhere, not even for Undo, so bringing it back means uploading the export again. Positions and schools on their profile stay. Only when the person asks.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => ({ removed: await removeConnections(userId, "all"), href: HREF }),
  change: (r) => ({ after: { removed: r.removed } }),
});
