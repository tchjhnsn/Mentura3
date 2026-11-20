// The connector marketplace (Torian, 2026-11-18 20:31Z: "create a marketplace also"). A connector here is a remote MCP
// server a person signs in to with their own account, so Reflect acts as them: their GitHub to push their site, their
// email provider to send their site's emails, their Vercel to deploy. Reflect's own built-in connections (Plaid,
// calendars, Instacart) stay in `connectors.ts`. This file is the catalog and the pure rules; signing in and calling
// tools are on the server (web/src/server/mcp-connections.ts).

export type MarketCategory = "build" | "email" | "work" | "money" | "design" | "data" | "life";

export const MARKET_CATEGORIES: readonly { id: MarketCategory; label: string }[] = [
  { id: "build", label: "Build and host" },
  { id: "email", label: "Email" },
  { id: "work", label: "Work and notes" },
  { id: "money", label: "Money" },
  { id: "design", label: "Design" },
  { id: "data", label: "Data" },
  { id: "life", label: "Home and life" },
];

/**
 * How a person signs in. "oauth": the server registers Reflect on the spot (dynamic client registration), so anyone
 * can connect today. "oauth-app": the server needs Reflect registered with it once; Reflect's owner sets the two
 * variables named in `clientEnv` and until then the connector says it needs setup.
 */
export type MarketAuth = "oauth" | "oauth-app";

export type MarketUse = "site-push" | "site-email" | "site-deploy";

export type MarketConnector = {
  id: string;
  name: string;
  /** Who makes the server: always the service itself in this catalog. */
  by: string;
  category: MarketCategory;
  url: string;
  auth: MarketAuth;
  /** For "oauth-app": the variables holding Reflect's client id and secret for this server, by name. */
  clientEnv?: readonly [string, string];
  /** One line on what you can do with it, verb first. */
  line: string;
  /** What Reflect does with it, in the person's words. */
  does: readonly string[];
  /** Parts of Reflect that use it. */
  uses?: readonly MarketUse[];
  docs: string;
};

export const USE_LABEL: Record<MarketUse, string> = {
  "site-push": "Push your site to GitHub",
  "site-email": "Send your site's emails",
  "site-deploy": "Deploy your exported site",
};

export const MARKET: readonly MarketConnector[] = [
  {
    id: "github", name: "GitHub", by: "GitHub", category: "build", url: "https://api.githubcopilot.com/mcp/", auth: "oauth-app", clientEnv: ["GITHUB_MCP_CLIENT_ID", "GITHUB_MCP_CLIENT_SECRET"],
    line: "Push your site, read issues and open pull requests.",
    does: ["Push your site to a repository of yours", "Read and open issues and pull requests when you ask"],
    uses: ["site-push"], docs: "https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/set-up-the-github-mcp-server",
  },
  {
    id: "vercel", name: "Vercel", by: "Vercel", category: "build", url: "https://mcp.vercel.com", auth: "oauth",
    line: "Deploy sites and read builds, logs and domains.",
    does: ["Deploy your exported site", "Check a domain and read your deployments when you ask"],
    uses: ["site-deploy"], docs: "https://vercel.com/docs/mcp/vercel-mcp",
  },
  {
    id: "cloudflare", name: "Cloudflare", by: "Cloudflare", category: "build", url: "https://mcp.cloudflare.com/mcp", auth: "oauth",
    line: "Manage DNS, Workers and your domains.", does: ["Add the DNS record for your own domain when you ask"], docs: "https://developers.cloudflare.com/agents/model-context-protocol/",
  },
  {
    id: "supabase", name: "Supabase", by: "Supabase", category: "data", url: "https://mcp.supabase.com/mcp", auth: "oauth",
    line: "Query your projects, tables and logs.", does: ["Read your projects and tables when you ask"], docs: "https://supabase.com/docs/guides/getting-started/mcp",
  },
  {
    id: "neon", name: "Neon", by: "Neon", category: "data", url: "https://mcp.neon.tech/mcp", auth: "oauth",
    line: "Run queries and manage your Postgres projects.", does: ["Read your projects and run queries when you ask"], docs: "https://neon.com/docs/ai/neon-mcp-server",
  },
  {
    id: "resend", name: "Resend", by: "Resend", category: "email", url: "https://mcp.resend.com/mcp", auth: "oauth",
    line: "Send email from your own domain.", does: ["Send your site's confirmation and post emails from your address"],
    uses: ["site-email"], docs: "https://resend.com/changelog/mcp",
  },
  {
    id: "gmail", name: "Gmail", by: "Google", category: "email", url: "https://gmailmcp.googleapis.com/mcp/v1", auth: "oauth-app", clientEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    line: "Send, draft and search your email. In preview at Google.", does: ["Send your site's emails from your Gmail", "Draft an email when you ask"],
    uses: ["site-email"], docs: "https://developers.google.com/workspace/gmail",
  },
  {
    id: "google-drive", name: "Google Drive", by: "Google", category: "work", url: "https://drivemcp.googleapis.com/mcp/v1", auth: "oauth-app", clientEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    line: "Find, read and add files in your Drive.", does: ["Find and read a file when you ask", "Save a file to your Drive when you tap Send"], docs: "https://developers.google.com/workspace/guides/configure-mcp-servers",
  },
  {
    id: "google-docs", name: "Google Docs", by: "Google", category: "work", url: "https://docsmcp.googleapis.com/mcp/v1", auth: "oauth-app", clientEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    line: "Read and write your documents.", does: ["Read a document when you ask", "Write one when you tap Send"], docs: "https://developers.google.com/workspace/guides/configure-mcp-servers",
  },
  {
    id: "google-sheets", name: "Google Sheets", by: "Google", category: "work", url: "https://sheetsmcp.googleapis.com/mcp/v1", auth: "oauth-app", clientEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    line: "Read and update your spreadsheets.", does: ["Read a sheet when you ask", "Add rows when you tap Send"], docs: "https://developers.google.com/workspace/guides/configure-mcp-servers",
  },
  {
    id: "slack", name: "Slack", by: "Slack", category: "work", url: "https://mcp.slack.com/mcp", auth: "oauth-app", clientEnv: ["SLACK_MCP_CLIENT_ID", "SLACK_MCP_CLIENT_SECRET"],
    line: "Search channels and send messages.", does: ["Search your messages when you ask", "Send a message when you tap Send"], docs: "https://docs.slack.dev/ai/mcp-server",
  },
  {
    id: "atlassian", name: "Atlassian", by: "Atlassian", category: "work", url: "https://mcp.atlassian.com/v1/mcp/authv2", auth: "oauth",
    line: "Read and update Jira issues and Confluence pages.", does: ["Read issues and pages when you ask", "Open an issue or write a page when you tap Send"], docs: "https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/",
  },
  {
    id: "monday", name: "monday.com", by: "monday.com", category: "work", url: "https://mcp.monday.com/mcp", auth: "oauth",
    line: "Read and update your boards and items.", does: ["Read your boards when you ask", "Add or change an item when you tap Send"], docs: "https://developer.monday.com/apps/docs/mondaycom-mcp-integration",
  },
  {
    id: "intercom", name: "Intercom", by: "Intercom", category: "work", url: "https://mcp.intercom.com/mcp", auth: "oauth",
    line: "Search conversations and contacts.", does: ["Read your customers' conversations when you ask"], docs: "https://developers.intercom.com/docs/guides/mcp",
  },
  {
    id: "zapier", name: "Zapier", by: "Zapier", category: "build", url: "https://mcp.zapier.com/api/mcp/mcp", auth: "oauth",
    line: "Run actions in thousands of apps you set up in Zapier.", does: ["Run an action you set up in Zapier when you tap Send"], docs: "https://zapier.com/mcp",
  },
  {
    id: "notion", name: "Notion", by: "Notion", category: "work", url: "https://mcp.notion.com/mcp", auth: "oauth",
    line: "Search, read and add pages and databases.", does: ["Read and add pages when you ask"], docs: "https://developers.notion.com/docs/mcp",
  },
  {
    id: "linear", name: "Linear", by: "Linear", category: "work", url: "https://mcp.linear.app/mcp", auth: "oauth",
    line: "Read, open and update issues and projects.", does: ["Read and open issues when you ask"], docs: "https://linear.app/docs/mcp",
  },
  {
    id: "sentry", name: "Sentry", by: "Sentry", category: "build", url: "https://mcp.sentry.dev/mcp", auth: "oauth",
    line: "Find and explain errors in your apps.", does: ["Read your issues and errors when you ask"], docs: "https://docs.sentry.io/product/sentry-mcp/",
  },
  {
    id: "stripe", name: "Stripe", by: "Stripe", category: "money", url: "https://mcp.stripe.com", auth: "oauth",
    line: "Read payments and balance, and make payment links.", does: ["Read your balance and payments when you ask", "Make a payment link when you tap Send"], docs: "https://docs.stripe.com/mcp",
  },
  {
    id: "canva", name: "Canva", by: "Canva", category: "design", url: "https://mcp.canva.com/mcp", auth: "oauth",
    line: "Find, create and export designs.", does: ["Find and make designs when you ask"], docs: "https://www.canva.dev/docs/connect/canva-mcp-server-setup/",
  },
  {
    id: "figma", name: "Figma", by: "Figma", category: "design", url: "https://mcp.figma.com/mcp", auth: "oauth",
    line: "Read designs and turn them into code.", does: ["Read a design when you ask"], docs: "https://help.figma.com/hc/en-us/articles/32132100833559",
  },
  {
    id: "huggingface", name: "Hugging Face", by: "Hugging Face", category: "data", url: "https://huggingface.co/mcp", auth: "oauth",
    line: "Search models, datasets, papers and Spaces.", does: ["Search models and papers when you ask"], docs: "https://huggingface.co/settings/mcp",
  },
];

export const marketById = (id: string) => MARKET.find((c) => c.id === id);

/** The connectors that can do one job on the site, in catalog order. */
export const marketFor = (use: MarketUse) => MARKET.filter((c) => c.uses?.includes(use));

/** Whether a catalog entry can be connected on this deployment: always for "oauth"; for "oauth-app" once its two variables are set. */
export function marketReady(c: MarketConnector, env: Record<string, string | undefined>): boolean {
  return c.auth === "oauth" || !!(c.clientEnv && env[c.clientEnv[0]] && env[c.clientEnv[1]]);
}

/** A remote MCP server's address someone typed, cleaned: https, a host name with a dot, no user or password. Null when not. */
export function cleanServerUrl(raw: unknown): string | null {
  let u: URL;
  try {
    u = new URL(String(raw ?? "").trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".") || /^[\d.]+$/.test(u.hostname) || u.hostname.startsWith("[")) return null;
  u.hash = "";
  return u.toString();
}

/** A name for a custom connector from its address: the host without www or mcp. */
export function nameFromUrl(url: string): string {
  const h = new URL(url).hostname.replace(/^(www|mcp|api)\./, "");
  const base = h.split(".").slice(0, -1).join(" ") || h;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export type ToolLike = { name: string; description?: string; inputSchema?: { properties?: Record<string, unknown>; required?: string[] }; annotations?: { readOnlyHint?: boolean } };

/** The tool on an email connector that sends one email, by its name. */
export function sendTool(tools: readonly ToolLike[]): ToolLike | null {
  const named = (re: RegExp) => tools.find((t) => re.test(t.name));
  return named(/^send[-_]?e?mail$/i) ?? named(/^send[-_]?message$/i) ?? named(/send.*(e?mail|message)/i) ?? null;
}

/**
 * Arguments for an email tool from what it asks for: the recipient, subject and text under the names its schema uses.
 * Null when the tool asks for something this cannot fill.
 */
export function emailArgs(tool: ToolLike, mail: { to: string; subject: string; text: string; from?: string | null }): Record<string, unknown> | null {
  const props = tool.inputSchema?.properties ?? {};
  const keys = Object.keys(props);
  const pick = (...names: string[]) => keys.find((k) => names.includes(k.toLowerCase()));
  const toKey = pick("to", "recipient", "recipients", "to_email", "email");
  const subjectKey = pick("subject", "title");
  const textKey = pick("text", "body", "content", "message", "plain_text", "plaintext");
  if (!toKey || !subjectKey || !textKey) return null;
  const toSchema = props[toKey] as { type?: string } | undefined;
  const args: Record<string, unknown> = { [toKey]: toSchema?.type === "array" ? [mail.to] : mail.to, [subjectKey]: mail.subject, [textKey]: mail.text };
  const fromKey = pick("from", "sender");
  if (fromKey && mail.from) args[fromKey] = mail.from;
  const missing = (tool.inputSchema?.required ?? []).filter((r) => !(r in args));
  return missing.length ? null : args;
}

// Plugins (Torian, 2026-11-18 21:11Z, "Skills first, apps later"): a plugin bundles connectors from the catalog with a
// skill, instructions Ask Reflect follows while the plugin is added, as Claude's plugins bundle skills and MCP servers.
// Apps (plugins with their own pages, made by others) are not built.
//
// Slots (Torian, 2026-11-19, "Appearance, Virtu and the site editor: plan"): a plugin may also fill named places in
// Reflect's interface. Only plugins whose code ships inside Reflect fill them (web/src/components/slots.tsx); a
// third-party plugin drawing its own interface would be an App, which is not built.

/** A named place in Reflect's interface that a plugin can fill. */
export type SlotName = "appearance.section" | "editor.panel" | "editor.component-option";

export const SLOT_NAMES: readonly SlotName[] = ["appearance.section", "editor.panel", "editor.component-option"];

export type MarketPlugin = {
  id: string;
  name: string;
  /** Who made it: Reflect for every plugin in this catalog. */
  by: string;
  category: MarketCategory;
  /** One line on what adding it does. */
  line: string;
  /** Catalog connectors it works through; it works once any one of them is connected. */
  connectors: readonly string[];
  /** What Ask Reflect does with it, in the person's words. */
  does: readonly string[];
  /** The skill: instructions Ask Reflect follows while the plugin is added. */
  skill: string;
  /** The sections it draws in each slot it fills, in order. Absent: it fills none. */
  slots?: Partial<Record<SlotName, readonly string[]>>;
};

export const PLUGINS: readonly MarketPlugin[] = [
  {
    id: "own-site", name: "Your own site", by: "Reflect", category: "build", connectors: ["github"],
    line: "Work on the site you host yourself from Ask Reflect.",
    does: ["Read your site's files and explain them", "Change a page, a style or a post when you ask, after you tap Send"],
    skill: "When the person asks about or wants to change the site they host themselves, read it with site_files (start at the top folder, then the file). Make the smallest change that does what they asked, keep the site's own style and conventions, and write it with site_edit with the file's whole new text, a plain commit message and a presentation record on personal-site that passes the gate (the ready one site_files gives, when they say it covers this change, else one drafted with draft_presentation, such as role site owner and end maintain my site); it waits for their Send. Posts are published from the journal with Publish, not written here. If no repository is linked, point them to Settings, Your site, Your own site on GitHub (/settings/site/repo).",
  },
  {
    id: "site-launch", name: "Launch your site", by: "Reflect", category: "build", connectors: ["vercel", "cloudflare"],
    line: "Deploy your site, check its builds and point your domain at it.",
    does: ["Deploy your exported site to your Vercel", "Read a failed build's logs and say what broke", "Add your domain's DNS record when you ask"],
    skill: "When the person asks to put their site online or why it is down, use their Vercel connector through connectors and connector_read: list their projects and deployments and read a failed build's logs before explaining what broke in plain words. Deploying is a tap on Host it yourself (/settings/site/export). Changing DNS or anything else in their account goes through connector_act and waits for Send.",
  },
  {
    id: "newsletter", name: "Newsletter", by: "Reflect", category: "email", connectors: ["resend", "gmail"],
    line: "Send your posts to your subscribers from your own address.",
    does: ["Email a new post to your subscribers when you publish", "Draft a note to your subscribers when you ask"],
    skill: "When the person wants to write to their site's subscribers, draft the email in their voice from what they have published (site), short and plain, and send it through their email connector with connector_act, which waits for Send. Sending a post happens with Email it to subscribers on Publish. Never email anyone who has not subscribed.",
  },
  {
    id: "venture-tracker", name: "Venture tracker", by: "Reflect", category: "work", connectors: ["linear", "notion"],
    line: "Turn what you decide in Ventures into issues and pages.",
    does: ["Open an issue or a page from a decision or an idea when you ask", "Read what is open before you plan your week"],
    skill: "When the person asks to track work from their ventures or ideas, read what is already open in their Linear or Notion with connector_read before adding anything, so nothing is doubled. Write each issue or page with a title they would recognise and the reason in one line, through connector_act, which waits for Send. Never copy journal text into another service unless they ask for that text.",
  },
  {
    id: "money-in", name: "Money in", by: "Reflect", category: "money", connectors: ["stripe"],
    line: "See what your work earns next to your budget.",
    does: ["Read your Stripe balance and payments into your plan when you ask", "Make a payment link after you tap Send"],
    skill: "When the person asks what their work earns, read their Stripe balance and recent payments with connector_read and set them beside their budget and income plan (budget, life) in plain numbers, saying the dates covered. Making a payment link or anything that charges or refunds goes through connector_act, waits for Send, and is never done unasked.",
  },
  {
    id: "design-help", name: "Design help", by: "Reflect", category: "design", connectors: ["figma", "canva"],
    line: "Bring your designs into what you are making.",
    does: ["Read a Figma design when you ask", "Find or start a Canva design for a post or an event"],
    skill: "When the person asks about a design, read it through their Figma or Canva connector with connector_read and describe what matters for their task. Making or changing a design goes through connector_act and waits for Send.",
  },
  {
    id: "virtu", name: "Virtu", by: "Reflect", category: "design", connectors: [],
    line: "Design system for your site: shape, type, colour roles and looks.",
    does: ["Add Shape, Type, Colour and Looks to Appearance", "Check every change to your site's design before it is saved", "Change your site's design from Ask Reflect when you ask"],
    skill: "When the person asks to change how their site looks, read its design with site_design and change it with set_site_design: colour roles, type, shape, ornaments and season. Every change is checked by Virtu and saved only when the check passes; when it fails, say why in plain words and suggest a change that passes. They can also change it themselves in Settings, Appearance.",
    slots: { "appearance.section": ["shape", "type", "colour", "looks"], "editor.panel": ["design"], "editor.component-option": ["shape", "frame"] },
  },
];

export const pluginById = (id: string) => PLUGINS.find((p) => p.id === id);

/** The plugin's connectors that are connected, and whether it can work (any one is, or it needs none). */
export function pluginReady(p: MarketPlugin, connected: ReadonlySet<string>): { connected: string[]; works: boolean } {
  const on = p.connectors.filter((c) => connected.has(c));
  return { connected: on, works: p.connectors.length === 0 || on.length > 0 };
}

/**
 * What to draw in one slot: each added plugin that fills it and whose code ships in Reflect (`shipped`), with its
 * sections, in catalog order.
 */
export function slotFill(added: readonly MarketPlugin[], slot: SlotName, shipped: ReadonlySet<string>): { plugin: string; sections: string[] }[] {
  return PLUGINS.filter((p) => added.some((a) => a.id === p.id) && shipped.has(p.id) && (p.slots?.[slot]?.length ?? 0) > 0)
    .map((p) => ({ plugin: p.id, sections: [...p.slots![slot]!] }));
}

/** The skills of the added plugins as one block for Ask Reflect's instructions; "" when none are added. */
export function pluginSkills(added: readonly MarketPlugin[], connected: ReadonlySet<string>): string {
  const lines = added.map((p) => {
    const r = pluginReady(p, connected);
    return `- ${p.name}${r.works ? "" : ` (not working yet: connect ${p.connectors.map((c) => marketById(c)?.name ?? c).join(" or ")} at /marketplace)`}: ${p.skill}`;
  });
  return lines.length ? `Plugins the person added from the marketplace. Follow each one's skill when the request is about it:\n${lines.join("\n")}` : "";
}
