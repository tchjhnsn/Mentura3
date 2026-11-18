// Plugins a person added from the marketplace (migration 0059; Torian, 2026-11-18 21:11Z): connectors plus a skill.
// While a plugin is added, its skill joins Ask Reflect's instructions (web/src/app/api/chat/route.ts) and the
// `plugins` action gives it to MCP clients. Adding and removing are taps on the plugin's page.
import { randomBytes } from "node:crypto";
import { PLUGINS, pluginById, pluginSkills, type MarketPlugin } from "@reflect/core/marketplace";
import { db } from "@/db/pool";
import { connectionsOf } from "./mcp-connections";

/** The plugins the person added, in catalog order. */
export async function pluginsOf(userId: string): Promise<MarketPlugin[]> {
  const ids = new Set((await db().query("SELECT plugin FROM plugin_install WHERE user_id = $1 AND removed_at IS NULL", [userId])).rows.map((r) => r.plugin as string));
  return PLUGINS.filter((p) => ids.has(p.id));
}

/** Adds a catalog plugin. Adding one already added does nothing. */
export async function addPlugin(userId: string, id: string): Promise<MarketPlugin> {
  const p = pluginById(id);
  if (!p) throw new Error("No such plugin.");
  await db().query("INSERT INTO plugin_install (id, user_id, plugin) VALUES ($1, $2, $3) ON CONFLICT (user_id, plugin) WHERE removed_at IS NULL DO NOTHING", [randomBytes(9).toString("base64url"), userId, p.id]);
  return p;
}

/** Removes a plugin; its connectors stay connected. */
export async function removePlugin(userId: string, id: string): Promise<void> {
  await db().query("UPDATE plugin_install SET removed_at = now() WHERE user_id = $1 AND plugin = $2 AND removed_at IS NULL", [userId, id]);
}

/** The catalog ids of the person's connected connectors. */
export async function connectedIds(userId: string): Promise<Set<string>> {
  return new Set((await connectionsOf(userId).catch(() => [])).filter((c) => c.status === "connected").map((c) => c.connector));
}

/** The added plugins' skills, for Ask Reflect's instructions; "" when none. */
export async function pluginSystem(userId: string): Promise<string> {
  const added = await pluginsOf(userId).catch(() => []);
  return added.length ? pluginSkills(added, await connectedIds(userId)) : "";
}
