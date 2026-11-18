// The connector marketplace (Torian, 2026-11-18 20:31Z: "create a marketplace also"). A connector here is a remote MCP
// server a person signs in to with their own account, so Reflect acts as them: their GitHub to push their site, their
// email provider to send their site's emails, their Vercel to deploy. Reflect's own built-in connections (Plaid,
// calendars, Instacart) stay in `connectors.ts`. This file is the catalog and the pure rules; signing in and calling
// tools are on the server (web/src/server/mcp-connections.ts).

export type MarketCategory = "build" | "email" | "work" | "money" | "design" | "data";

export const MARKET_CATEGORIES: readonly { id: MarketCategory; label: string }[] = [
  { id: "build", label: "Build and host" },
  { id: "email", label: "Email" },
  { id: "work", label: "Work and notes" },
  { id: "money", label: "Money" },
  { id: "design", label: "Design" },
  { id: "data", label: "Data" },
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
  /** One line on what connecting lets Reflect do. */
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
    line: "Your repositories, issues and pull requests.",
    does: ["Push your site to a repository of yours", "Read and open issues and pull requests when you ask"],
    uses: ["site-push"], docs: "https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/set-up-the-github-mcp-server",
  },
  {
    id: "vercel", name: "Vercel", by: "Vercel", category: "build", url: "https://mcp.vercel.com", auth: "oauth",
    line: "Your Vercel projects, deployments and domains.",
    does: ["Deploy your exported site", "Check a domain and read your deployments when you ask"],
    uses: ["site-deploy"], docs: "https://vercel.com/docs/mcp/vercel-mcp",
  },
  {
    id: "cloudflare", name: "Cloudflare", by: "Cloudflare", category: "build", url: "https://mcp.cloudflare.com/mcp", auth: "oauth",
    line: "Your Cloudflare account: DNS, Workers and more.", does: ["Add the DNS record for your own domain when you ask"], docs: "https://developers.cloudflare.com/agents/model-context-protocol/",
  },
  {
    id: "supabase", name: "Supabase", by: "Supabase", category: "data", url: "https://mcp.supabase.com/mcp", auth: "oauth",
    line: "Your Supabase projects and databases.", does: ["Read your projects and tables when you ask"], docs: "https://supabase.com/docs/guides/getting-started/mcp",
  },
  {
    id: "neon", name: "Neon", by: "Neon", category: "data", url: "https://mcp.neon.tech/mcp", auth: "oauth",
    line: "Your Neon Postgres projects.", does: ["Read your projects and run queries when you ask"], docs: "https://neon.com/docs/ai/neon-mcp-server",
  },
  {
    id: "resend", name: "Resend", by: "Resend", category: "email", url: "https://mcp.resend.com/mcp", auth: "oauth",
    line: "Send email from your own domain.", does: ["Send your site's confirmation and post emails from your address"],
    uses: ["site-email"], docs: "https://resend.com/changelog/mcp",
  },
  {
    id: "gmail", name: "Gmail", by: "Google", category: "email", url: "https://gmailmcp.googleapis.com/mcp/v1", auth: "oauth-app", clientEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    line: "Your Gmail. In preview at Google.", does: ["Send your site's emails from your Gmail", "Draft an email when you ask"],
    uses: ["site-email"], docs: "https://developers.google.com/workspace/gmail",
  },
  {
    id: "notion", name: "Notion", by: "Notion", category: "work", url: "https://mcp.notion.com/mcp", auth: "oauth",
    line: "Your Notion pages and databases.", does: ["Read and add pages when you ask"], docs: "https://developers.notion.com/docs/mcp",
  },
  {
    id: "linear", name: "Linear", by: "Linear", category: "work", url: "https://mcp.linear.app/mcp", auth: "oauth",
    line: "Your Linear issues and projects.", does: ["Read and open issues when you ask"], docs: "https://linear.app/docs/mcp",
  },
  {
    id: "sentry", name: "Sentry", by: "Sentry", category: "build", url: "https://mcp.sentry.dev/mcp", auth: "oauth",
    line: "Errors from your apps.", does: ["Read your issues and errors when you ask"], docs: "https://docs.sentry.io/product/sentry-mcp/",
  },
  {
    id: "stripe", name: "Stripe", by: "Stripe", category: "money", url: "https://mcp.stripe.com", auth: "oauth",
    line: "Your Stripe account: customers, payments, links.", does: ["Read your balance and payments when you ask", "Make a payment link when you tap Send"], docs: "https://docs.stripe.com/mcp",
  },
  {
    id: "canva", name: "Canva", by: "Canva", category: "design", url: "https://mcp.canva.com/mcp", auth: "oauth",
    line: "Your Canva designs.", does: ["Find and make designs when you ask"], docs: "https://www.canva.dev/docs/connect/canva-mcp-server-setup/",
  },
  {
    id: "figma", name: "Figma", by: "Figma", category: "design", url: "https://mcp.figma.com/mcp", auth: "oauth",
    line: "Your Figma files.", does: ["Read a design when you ask"], docs: "https://help.figma.com/hc/en-us/articles/32132100833559",
  },
  {
    id: "huggingface", name: "Hugging Face", by: "Hugging Face", category: "data", url: "https://huggingface.co/mcp", auth: "oauth",
    line: "Models, datasets and Spaces.", does: ["Search models and papers when you ask"], docs: "https://huggingface.co/settings/mcp",
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
