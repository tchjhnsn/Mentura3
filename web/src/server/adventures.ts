import { adventureOf, type Adventure } from "@reflect/core/adventures";
import { lifeRecords } from "./life-store";

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
