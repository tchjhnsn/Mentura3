// The person's marketplace connectors in Ask Reflect (2026-11-18): read which are connected and their tools, run a
// tool that only reads, and run any other tool after the person taps Send on a card that names the connector, the tool
// and its arguments. Connecting and disconnecting are taps in the marketplace only.
// A write to the person's site repository goes public when their host redeploys, so it passes the presentation gate
// (Reflect framework plan, step 6) as publish_to_site does: site_edit always (`publishes: "personal-site"`), and
// connector_act on the runs that write to the linked repository through GitHub (`publishesIf`). Both name a
// presentation record in `presentation`; only the person approves, with Send in Ask, and only once the record passes.
import { z } from "zod";
import { connectionsOf, callTool, toolsOf } from "../mcp-connections";
import { browseRepo, readRepoFile, writeRepoFile } from "../site-repo";
import { siteOf } from "../site-store";
import { connectedIds, pluginsOf } from "../plugins";
import { pluginReady } from "@reflect/core/marketplace";
import { commitSummary, namesRepo } from "@reflect/core/site-repo";
import { action, type ActionContext } from "./types";
import { PRESENTATION_ID, presentationsOf, readySiteRecord, SITE_CHANNEL } from "./presentations";

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
 * a run is never let through ungated because a lookup failed.
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

export const connectorActAction = action({
  id: "connector_act",
  title: "Act through a connector",
  description: "Run one tool of a connected connector that changes something (pushes files, sends an email, opens an issue), only when the person asked for it. It waits for the person to tap Send on a card naming the connector, the tool and the arguments. What it changes outside Reflect cannot be undone from Reflect. A GitHub write to the repository of the person's own site goes public when their host redeploys, so it also needs a presentation record on channel personal-site that passes the gate, named in presentation, as site_edit does; prefer site_edit for one file.",
  tier: "outside",
  on: ["chat", "mcp"],
  publishes: SITE_CHANNEL,
  input: RUN.extend({
    presentation: PRESENTATION_ID.optional().describe("only for a GitHub write to the person's site repository: the id of a ready presentation record on channel personal-site"),
  }),
  publishesIf: async (ctx, { connector, tool, arguments: args }) => (await siteRepoWrite(ctx, connector, tool, args)) !== null,
  preview: async (ctx, { connector, tool, arguments: args, presentation }) => {
    const { c } = await toolOf(ctx, connector, tool);
    const shown = JSON.stringify(args);
    const repo = await siteRepoWrite(ctx, connector, tool, args);
    return [
      `${c.name}: ${tool} with ${shown.length > 400 ? `${shown.slice(0, 400)}...` : shown}`,
      repo ? `It writes to your site's repository, ${repo}; your host deploys it.${presentation ? ` Presentation record: ${presentation}.` : ""}` : null,
    ].filter(Boolean).join("\n");
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
  description: "Read the repository of the site the person hosts themselves (linked in Settings, Your site, Your own site on GitHub): a folder's file list (path empty or ending in /) or one file's text. Use it before site_edit to see the file as it is. `presentation` is the newest presentation record on personal-site that passes the gate now, or null: ask the person whether it covers the change before naming it in site_edit.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ path: z.string().max(400).default("").describe("A path in the repository, such as app/page.tsx; empty for the top folder") }),
  run: async (ctx, { path }) => {
    const [files, presentation] = await Promise.all([browseRepo(ctx.userId, path), readySiteRecord(presentationsOf(ctx)).catch(() => null)]);
    return { ...files, presentation };
  },
});

const EDIT = z.object({
  path: z.string().min(1).max(400).describe("The file's path in the repository"),
  content: z.string().max(200_000).describe("The whole new text of the file"),
  message: z.string().min(1).max(200).describe("The commit message, in plain words"),
  presentation: PRESENTATION_ID.describe("the id of a presentation record on channel personal-site that passes the gate: one the person says covers this change (site_files gives the newest ready one), else one drafted with draft_presentation, such as role site owner and end maintain my site"),
});

export const siteEditAction = action({
  id: "site_edit",
  title: "Change a file of the person's own site",
  description: "Write one file of the site the person hosts themselves, as a commit to its repository's branch, only when the person asked for the change. Read the file first with site_files and send its whole new text. A commit goes public when the host redeploys, so it passes the presentation gate: name a presentation record on channel personal-site in presentation. One record can cover a working session: reuse the newest ready one (from site_files) when the person says it covers this change, else draft one with draft_presentation first (for a change to the site's code or pages, role site owner and end maintain my site, with the audience). It always waits: only the person approves, with Send on its card, and only once the record passes. A commit can be reverted on GitHub, not from Reflect.",
  tier: "outside",
  on: ["chat", "mcp"],
  publishes: SITE_CHANNEL,
  input: EDIT,
  // What will be committed: where, the message, and the lines it changes against the file as it is now. The runner adds
  // the gate's answer under it.
  preview: async ({ userId }, { path, content, message, presentation }) => {
    const site = (await siteOf(userId)).repo;
    const p = path.replace(/^\/+/, "");
    if (!site) return `Commit "${message}" writing ${p} (${content.length} characters). Your site is not linked to a repository yet (/settings/site/repo).`;
    const before = await readRepoFile(userId, site.repo, p, site.branch).then((f) => f?.text ?? null, () => undefined);
    return [
      `Commit "${message}" to ${site.repo} on ${site.branch}; your host deploys it.`,
      before === undefined ? `Writes ${p} (${content.length} characters); the file as it is could not be read.` : commitSummary(p, before, content),
      `Presentation record: ${presentation}.`,
    ].join("\n");
  },
  run: async ({ userId }, { path, content, message }) => writeRepoFile(userId, path.replace(/^\/+/, ""), content, message),
  change: (r, input) => ({ after: { repo: r.repo, path: r.path, presentation: input.presentation } }),
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
