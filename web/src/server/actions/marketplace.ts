// The person's marketplace connectors in Ask Reflect (2026-11-18): read which are connected and their tools, run a
// tool that only reads, and run any other tool after the person taps Send on a card that names the connector, the tool
// and its arguments. Connecting and disconnecting are taps in the marketplace only.
// Reflect outputs files and never a website's code (Torian, 2026-11-20 03:16Z, "Files out, no site code"): the site
// the person hosts themselves is changed in its own repository, with Claude Code or Virtu. Ask may read that
// repository (site_files); a connector write to it (a GitHub tool, not marked as only reading, whose arguments name the
// repository linked in Settings, Your site) is refused when it is asked for and again at Send. Posts reach it only
// through publish_to_site, which delivers files made through the presentation gate (./presentations.ts).
import { z } from "zod";
import { connectionsOf, callTool, toolsOf } from "../mcp-connections";
import { browseRepo } from "../site-repo";
import { siteOf } from "../site-store";
import { connectedIds, pluginsOf } from "../plugins";
import { pluginReady } from "@reflect/core/marketplace";
import { namesRepo } from "@reflect/core/site-repo";
import { action, type ActionContext } from "./types";

const find = async (userId: string, name: string) => {
  const all = (await connectionsOf(userId)).filter((c) => c.status === "connected");
  const n = name.trim().toLowerCase();
  const c = all.find((x) => x.connector === n || x.name.toLowerCase() === n) ?? all.find((x) => x.name.toLowerCase().includes(n));
  if (!c) throw new Error(all.length ? `No connected connector is called ${name}. Connected: ${all.map((x) => x.name).join(", ")}.` : "Nothing is connected from the marketplace yet (/marketplace).");
  return c;
};

const RUN = z.object({
  connector: z.string().min(1).max(80).describe("The connector's name or id, from connectors"),
  tool: z.string().min(1).max(120).describe("The tool's exact name, from connectors with `connector` set"),
  arguments: z.record(z.string(), z.unknown()).default({}).describe("The tool's arguments, as its input schema asks"),
});

async function toolOf(ctx: ActionContext, connector: string, tool: string) {
  const c = await find(ctx.userId, connector);
  const t = (await toolsOf(ctx.userId, c.id)).find((x) => x.name === tool);
  if (!t) throw new Error(`${c.name} has no tool named ${tool}.`);
  return { c, t };
}

/**
 * The linked site repository a connector run writes to, or null: a GitHub connector's tool that is not marked as only
 * reading, with arguments that name the repository linked in Settings, Your site. A tool with no read-only mark counts
 * as a write. Asked when the run is asked for and again at Send; a failure to read the site or the tools is thrown, so
 * a run is never let through because a lookup failed.
 */
export async function siteRepoWrite(ctx: ActionContext, connector: string, tool: string, args: Record<string, unknown>): Promise<string | null> {
  const c = await find(ctx.userId, connector).catch(() => null);
  if (!c || c.connector !== "github") return null;
  const repo = (await siteOf(ctx.userId)).repo?.repo;
  if (!repo || !namesRepo(args, repo)) return null;
  const t = (await toolsOf(ctx.userId, c.id)).find((x) => x.name === tool);
  return t?.annotations?.readOnlyHint === true ? null : repo;
}

export const connectorsAction = action({
  id: "connectors",
  title: "Read the person's connectors",
  description: "List the accounts the person connected from the marketplace (/marketplace: GitHub, Vercel, Resend, Gmail, Notion and others they added). With `connector`, list that connector's tools: each name, what it does, its input schema and whether it only reads. Use it before connector_read or connector_act.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ connector: z.string().max(80).optional() }),
  run: async ({ userId }, { connector }) => {
    if (!connector) return { href: "/marketplace", connected: (await connectionsOf(userId)).filter((c) => c.status === "connected").map((c) => ({ id: c.connector, name: c.name })) };
    const c = await find(userId, connector);
    const tools = await toolsOf(userId, c.id);
    return { id: c.connector, name: c.name, tools: tools.slice(0, 80).map((t) => ({ name: t.name, description: (t.description ?? "").slice(0, 300), reads_only: t.annotations?.readOnlyHint === true, input: t.inputSchema ?? {} })) };
  },
});

export const connectorReadAction = action({
  id: "connector_read",
  title: "Read through a connector",
  description: "Run one tool of a connected connector that only reads (its reads_only is true in connectors), such as listing repositories or reading a page. A tool that changes anything is refused here; use connector_act.",
  tier: "read",
  on: ["chat", "mcp"],
  input: RUN,
  run: async (ctx, { connector, tool, arguments: args }) => {
    const { c, t } = await toolOf(ctx, connector, tool);
    if (t.annotations?.readOnlyHint !== true) throw new Error(`${tool} can change things in ${c.name}; use connector_act so the person can tap Send.`);
    const r = await callTool(ctx.userId, c.id, tool, args);
    return { connector: c.name, tool, text: r.text, structured: r.structured };
  },
});

/** What the person reads when a connector write would change their site's repository. */
export const SITE_CODE_ELSEWHERE = (repo: string) =>
  `${repo} is your site's repository, and Reflect does not change your site's code. Your site's code lives in its own repository: change it there with Claude Code or Virtu. Reflect delivers only your published posts and its manifest, with Publish.`;

/** Refuses a connector run that writes to the linked site repository. */
async function refuseSiteWrite(ctx: ActionContext, connector: string, tool: string, args: Record<string, unknown>): Promise<void> {
  const repo = await siteRepoWrite(ctx, connector, tool, args);
  if (repo) throw new Error(SITE_CODE_ELSEWHERE(repo));
}

export const connectorActAction = action({
  id: "connector_act",
  title: "Act through a connector",
  description: "Run one tool of a connected connector that changes something (sends an email, opens an issue, creates a page), only when the person asked for it. It waits for the person to tap Send on a card naming the connector, the tool and the arguments. What it changes outside Reflect cannot be undone from Reflect. Never offer to change the code or pages of the site the person hosts themselves: a write to its repository is refused, because the site's code lives in its own repository (Claude Code or Virtu change it there). Posts reach it only with publish_to_site.",
  tier: "outside",
  on: ["chat", "mcp"],
  input: RUN,
  preview: async (ctx, { connector, tool, arguments: args }) => {
    await refuseSiteWrite(ctx, connector, tool, args);
    const { c } = await toolOf(ctx, connector, tool);
    const shown = JSON.stringify(args);
    return `${c.name}: ${tool} with ${shown.length > 400 ? `${shown.slice(0, 400)}...` : shown}`;
  },
  run: async (ctx, { connector, tool, arguments: args }) => {
    await refuseSiteWrite(ctx, connector, tool, args);
    const { c } = await toolOf(ctx, connector, tool);
    const r = await callTool(ctx.userId, c.id, tool, args);
    return { connector: c.name, tool, text: r.text, structured: r.structured };
  },
  change: (r) => ({ after: { connector: r.connector, tool: r.tool } }),
});

// A site the person hosts themselves, through their GitHub connector (Torian, 2026-11-18 20:47Z): Ask may read its
// files. Linking the repository is a tap in Settings, Your site. Changing the site's code is not Reflect's.

export const siteFilesAction = action({
  id: "site_files",
  title: "Read the person's own site",
  description: "Read the repository of the site the person hosts themselves (linked in Settings, Your site, Your own site on GitHub): a folder's file list (path empty or ending in /) or one file's text. It only reads. Never offer to change the site's code or pages: that is done in the site's own repository, with Claude Code or Virtu. Reflect delivers only the person's published posts and its manifest there, with publish_to_site.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ path: z.string().max(400).default("").describe("A path in the repository, such as app/page.tsx; empty for the top folder") }),
  run: async (ctx, { path }) => browseRepo(ctx.userId, path),
});

export const pluginsAction = action({
  id: "plugins",
  title: "Read the person's plugins",
  description: "List the plugins the person added from the marketplace (/marketplace?tab=plugins), each with its skill: instructions to follow when a request is about it, and whether its connectors are connected. MCP clients should read it at the start of a session.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => {
    const [added, on] = await Promise.all([pluginsOf(userId), connectedIds(userId)]);
    return { href: "/marketplace?tab=plugins", plugins: added.map((p) => ({ id: p.id, name: p.name, skill: p.skill, works: pluginReady(p, on).works, connectors: p.connectors })) };
  },
});
