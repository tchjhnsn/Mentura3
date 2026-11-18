// The site on the person's own connectors (Torian, 2026-11-18 20:29Z): Push to GitHub runs through their GitHub
// connector, and the site's emails (a subscriber's confirmation link, a new post) go out through their email connector
// (Resend or Gmail from the marketplace), as them. Reflect's own Resend keys stay only as a fallback.
import { emailArgs, marketFor, sendTool, type ToolLike } from "@reflect/core/marketplace";
import { db } from "@/db/pool";
import { callTool, connectedTo, toolsOf, type Connection } from "./mcp-connections";
import { sendMail } from "./mail";

/** The person's connected email connector, in catalog order, or null. */
export async function emailConnector(userId: string): Promise<Connection | null> {
  for (const c of marketFor("site-email")) {
    const conn = await connectedTo(userId, c.id).catch(() => null);
    if (conn) return conn;
  }
  return null;
}

const accountEmail = async (userId: string) => ((await db().query(`SELECT email FROM "user" WHERE id = $1`, [userId])).rows[0]?.email as string | undefined) ?? null;

/**
 * Sends one email for the site of `ownerId`: through their email connector when they have one, else through Reflect's
 * own sender when the deployment has one. Returns how it went out, or null when it could not be sent.
 */
export async function sendSiteMail(ownerId: string, mail: { to: string; subject: string; text: string }): Promise<"connector" | "reflect" | null> {
  const conn = await emailConnector(ownerId);
  if (conn) {
    try {
      const tool = sendTool(await toolsOf(ownerId, conn.id));
      const args = tool ? emailArgs(tool, { ...mail, from: await accountEmail(ownerId) }) : null;
      if (tool && args) {
        await callTool(ownerId, conn.id, tool.name, args);
        return "connector";
      }
    } catch {
      // Falls through to Reflect's own sender.
    }
  }
  return (await sendMail(mail.to, mail.subject, mail.text)) ? "reflect" : null;
}

/** Whether the person's site can send email at all: an email connector, or Reflect's own sender. */
export async function siteCanSend(ownerId: string): Promise<{ via: string | null }> {
  const conn = await emailConnector(ownerId);
  if (conn) return { via: conn.name };
  return { via: process.env.RESEND_API_KEY && process.env.REFLECT_MAIL_FROM ? "Reflect" : null };
}

const json = (text: string): Record<string, unknown> | null => {
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};
const has = (tools: ToolLike[], name: string) => tools.some((t) => t.name === name);

/**
 * Pushes the site's files to <their login>/<name> through the person's GitHub connector: the repository is made when
 * missing, then one commit with every file. Returns the repository's address.
 */
export async function pushWithGithubConnector(userId: string, name: string, files: Record<string, string>, description: string): Promise<string> {
  const conn = await connectedTo(userId, "github");
  if (!conn) throw new Error("Connect GitHub first.");
  const tools = await toolsOf(userId, conn.id);
  if (!has(tools, "get_me") || !has(tools, "push_files")) throw new Error("Your GitHub connector does not offer pushing files.");
  const me = await callTool(userId, conn.id, "get_me", {});
  const login = ((me.structured as { login?: string } | null)?.login ?? json(me.text)?.login) as string | undefined;
  if (!login) throw new Error("GitHub did not say who you are.");
  if (has(tools, "create_repository")) {
    await callTool(userId, conn.id, "create_repository", { name, description, private: false, autoInit: true }).catch((e: unknown) => {
      if (!(e instanceof Error && /exist|already|name already/i.test(e.message))) throw e;
    });
  }
  await callTool(userId, conn.id, "push_files", {
    owner: login, repo: name, branch: "main", message: "Update the site from Reflect",
    files: Object.entries(files).map(([path, content]) => ({ path, content })),
  });
  return `https://github.com/${login}/${name}`;
}
