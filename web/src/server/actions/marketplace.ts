// The person's marketplace connectors in Ask Reflect (2026-11-18): read which are connected and their tools, run a
// tool that only reads, and run any other tool after the person taps Send on a card that names the connector, the tool
// and its arguments. Connecting and disconnecting are taps in the marketplace only.
import { z } from "zod";
import { connectionsOf, callTool, toolsOf } from "../mcp-connections";
import { browseRepo, writeRepoFile } from "../site-repo";
import { siteOf } from "../site-store";
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

export const connectorActAction = action({
  id: "connector_act",
  title: "Act through a connector",
  description: "Run one tool of a connected connector that changes something (pushes files, sends an email, opens an issue), only when the person asked for it. It waits for the person to tap Send on a card naming the connector, the tool and the arguments. What it changes outside Reflect cannot be undone from Reflect.",
  tier: "outside",
  on: ["chat", "mcp"],
  input: RUN,
  preview: async (ctx, { connector, tool, arguments: args }) => {
    const { c } = await toolOf(ctx, connector, tool);
    const shown = JSON.stringify(args);
    return `${c.name}: ${tool} with ${shown.length > 400 ? `${shown.slice(0, 400)}...` : shown}`;
  },
  run: async (ctx, { connector, tool, arguments: args }) => {
    const { c } = await toolOf(ctx, connector, tool);
    const r = await callTool(ctx.userId, c.id, tool, args);
    return { connector: c.name, tool, text: r.text, structured: r.structured };
  },
  change: (r) => ({ after: { connector: r.connector, tool: r.tool } }),
});

// A site the person hosts themselves, through their GitHub connector (Torian, 2026-11-18 20:47Z): read its files,
// and change one after the person taps Send. Linking the repository is a tap in Settings, Your site.

export const siteFilesAction = action({
  id: "site_files",
  title: "Read the person's own site",
  description: "Read the repository of the site the person hosts themselves (linked in Settings, Your site, Your own site on GitHub): a folder's file list (path empty or ending in /) or one file's text. Use it before site_edit to see the file as it is.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ path: z.string().max(400).default("").describe("A path in the repository, such as app/page.tsx; empty for the top folder") }),
  run: async ({ userId }, { path }) => browseRepo(userId, path),
});

const EDIT = z.object({
  path: z.string().min(1).max(400).describe("The file's path in the repository"),
  content: z.string().max(200_000).describe("The whole new text of the file"),
  message: z.string().min(1).max(200).describe("The commit message, in plain words"),
});

export const siteEditAction = action({
  id: "site_edit",
  title: "Change a file of the person's own site",
  description: "Write one file of the site the person hosts themselves, as a commit to its repository's branch, only when the person asked for the change. Read the file first with site_files and send its whole new text. It waits for the person to tap Send; their host deploys it on push. A commit can be reverted on GitHub, not from Reflect.",
  tier: "outside",
  on: ["chat", "mcp"],
  input: EDIT,
  preview: async ({ userId }, { path, content, message }) => `${(await siteOf(userId)).repo?.repo ?? "Your site"}: commit "${message}" writing ${path} (${content.length} characters)`,
  run: async ({ userId }, { path, content, message }) => writeRepoFile(userId, path.replace(/^\/+/, ""), content, message),
  change: (r) => ({ after: { repo: r.repo, path: r.path } }),
});
