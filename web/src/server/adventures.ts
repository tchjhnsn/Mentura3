import { adventureOf, cleanChecklist, cleanPlan, type Adventure } from "@reflect/core/adventures";
import { geocode } from "./geocode";
import { addLifeRecord, lifeRecord, lifeRecords, saveLifeRecord } from "./life-store";

/** The person's adventures (`@reflect/core/adventures`), Not yet first, newest first within each. */
export async function adventuresOf(userId: string): Promise<Adventure[]> {
  const recs = (await lifeRecords(userId, "legacy")).filter((r) => r.kind === "adventure");
  return recs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(adventureOf).sort((a, b) => Number(a.done) - Number(b.done));
}

/** One part of the adventures, for the chat and the MCP server: '' (all), 'not-yet', 'already', a tile id, or an adventure id. */
export async function adventuresPart(userId: string, path: string): Promise<unknown> {
  const all = await adventuresOf(userId);
  const p = path.replace(/^\/+|\/+$/g, "");
  if (!p) return { notYet: all.filter((a) => !a.done), already: all.filter((a) => a.done) };
  if (p === "not-yet") return all.filter((a) => !a.done);
  if (p === "already") return all.filter((a) => a.done);
  const one = all.find((a) => a.id === p);
  if (one) return one;
  return all.filter((a) => a.tiles.includes(p));
}

/** What the chat or an MCP client drafts for an adventure. Every field is cleaned again by the core before it is kept. */
export type AdventureDraft = {
  id?: string; name?: string; place?: string; start?: string; end?: string; budget?: number;
  days?: { day?: string; title?: string; stops: { time?: string; title: string; note?: string; link?: string; lat?: number; lon?: number }[] }[];
  checklist?: string[];
};

/**
 * Saves a plan drafted by the chat or an MCP client onto an adventure (or a new one), marked drafted so the person
 * keeps or changes it on the adventure's page. The place is put on the map with OpenStreetMap. Returns the adventure.
 */
export async function planAdventure(userId: string, d: AdventureDraft): Promise<{ id: string; href: string; adventure: Adventure }> {
  const recs = (await lifeRecords(userId, "legacy")).filter((r) => r.kind === "adventure");
  const old = d.id ? recs.find((r) => r.id === d.id) : d.name ? recs.find((r) => String(r.body.name ?? "").toLowerCase() === d.name!.trim().toLowerCase()) : undefined;
  if (d.id && !old) throw new Error("No such adventure.");
  const body: Record<string, unknown> = { ...(old?.body ?? {}) };
  if (d.name && !old) body.name = d.name.trim();
  if (!body.name) throw new Error("Give the adventure a name.");
  if (d.place && d.place !== body.place) {
    const hit = await geocode(d.place);
    body.place = d.place; body.lat = hit?.lat; body.lon = hit?.lon;
  }
  if (d.start) body.start = d.start;
  if (d.end) body.end = d.end;
  if (typeof d.budget === "number") body.budget = d.budget;
  if (d.days?.length) { body.plan = JSON.stringify(cleanPlan(d.days)); body.drafted = true; }
  if (d.checklist?.length) body.checklist = JSON.stringify(cleanChecklist(d.checklist.map((text) => ({ text, done: false }))));
  const id = old ? (await saveLifeRecord(userId, old.id, body), old.id) : await addLifeRecord(userId, "legacy", "adventure", body, "not-yet");
  const r = await lifeRecord(userId, id);
  return { id, href: `/adventures/${id}`, adventure: adventureOf(r!) };
}
