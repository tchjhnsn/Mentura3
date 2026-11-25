"use server";
// The Studio's server actions over Naive (src/server/naive.ts). Each returns a plain result or a sentence the page shows.
// `team` is the team's URL slug from the page's address; src/server/naive.ts checks the person belongs to it before it
// signs anything, so a team slug a page passes is never trusted on its own. Left out, it is the personal team.

import { naive, studioUnavailable, type Docket, type VentureDetail, type VentureSummary } from "@/server/naive";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const attempt = async <T>(f: () => Promise<T>): Promise<Result<T>> => {
  try { return { ok: true, value: await f() }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Naive refused this." }; }
};

/** The signed-in person's ventures, or why the Studio cannot reach them here. */
export async function listVentures(team?: string): Promise<Result<VentureSummary[]>> {
  const why = studioUnavailable();
  if (why) return { ok: false, error: why };
  return attempt(async () => (await naive<{ ventures: VentureSummary[] }>("ventures", {}, team)).ventures);
}

/** Creates a venture from a sentence: the first words name it, the whole sentence is kept as the founder's idea. */
export async function createVenture(idea: string, team?: string): Promise<Result<{ id: string }>> {
  const text = idea.trim();
  if (!text) return { ok: false, error: "Say the business in a sentence first." };
  const name = (text.split(/[.,;:!?]/)[0] ?? text).split(/\s+/).slice(0, 6).join(" ");
  return attempt(async () => ({ id: (await naive<{ id: string }>("create", { name, description: text }, team)).id }));
}

/** One venture: its name, phase, founder and the functions it has turned on. */
export async function ventureDetail(id: string, team?: string): Promise<Result<VentureDetail>> {
  const why = studioUnavailable();
  if (why) return { ok: false, error: why };
  return attempt(() => naive<VentureDetail>("venture", { venture: id }, team));
}

/** One venture and what it needs decided next. */
export async function ventureWithDocket(id: string, team?: string): Promise<Result<{ venture: VentureDetail; docket: Docket }>> {
  return attempt(async () => {
    const [venture, docket] = await Promise.all([naive<VentureDetail>("venture", { venture: id }, team), naive<Docket>("docket", { venture: id }, team)]);
    return { venture, docket };
  });
}

// Each venture's own storage (venture console spec, phase 2): the files/ folder inside the venture, through the bridge.
// Uploads and downloads go through the route at r/[id]/files/raw (with ?team=), since a server action's body is capped at 1 MB.
export type StoredFile = { name: string; path: string; kind: "file" | "folder"; size: number; modified: string; children?: StoredFile[] };

export async function ventureFiles(id: string, team?: string): Promise<Result<{ venture: VentureDetail; files: StoredFile[] }>> {
  return attempt(async () => {
    const [venture, { files }] = await Promise.all([naive<VentureDetail>("venture", { venture: id }, team), naive<{ files: StoredFile[] }>("files", { venture: id }, team)]);
    return { venture, files };
  });
}

export async function newFolder(id: string, path: string, team?: string): Promise<Result<{ path: string }>> {
  return attempt(() => naive<{ path: string }>("fileFolder", { venture: id, path }, team));
}

export async function moveFile(id: string, from: string, to: string, team?: string): Promise<Result<{ from: string; to: string }>> {
  return attempt(() => naive<{ from: string; to: string }>("fileMove", { venture: id, from, to }, team));
}

export async function deleteFile(id: string, path: string, team?: string): Promise<Result<{ path: string }>> {
  return attempt(async () => ({ path: (await naive<{ path: string }>("fileDelete", { venture: id, path }, team)).path }));
}
