import { describe, expect, it } from "vitest";
import { MARKET, cleanServerUrl, emailArgs, marketFor, marketReady, nameFromUrl, sendTool } from "./marketplace";

describe("the connector marketplace", () => {
  it("lists each connector once, over https, with what Reflect does", () => {
    const ids = MARKET.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of MARKET) {
      expect(c.url.startsWith("https://")).toBe(true);
      expect(c.does.length).toBeGreaterThan(0);
      if (c.auth === "oauth-app") expect(c.clientEnv).toHaveLength(2);
    }
    expect(marketFor("site-push").map((c) => c.id)).toEqual(["github"]);
    expect(marketFor("site-email").map((c) => c.id)).toEqual(["resend", "gmail"]);
  });

  it("is ready to connect once a server that needs Reflect registered has its two variables", () => {
    const gh = MARKET.find((c) => c.id === "github")!;
    expect(marketReady(gh, {})).toBe(false);
    expect(marketReady(gh, { GITHUB_MCP_CLIENT_ID: "a", GITHUB_MCP_CLIENT_SECRET: "b" })).toBe(true);
    expect(marketReady(MARKET.find((c) => c.id === "vercel")!, {})).toBe(true);
  });

  it("takes only an https server address on a named host", () => {
    expect(cleanServerUrl(" https://mcp.example.com/mcp#x ")).toBe("https://mcp.example.com/mcp");
    for (const bad of ["http://mcp.example.com", "https://localhost/mcp", "https://10.0.0.1/mcp", "https://u:p@example.com/mcp", "nope"]) expect(cleanServerUrl(bad)).toBeNull();
    expect(nameFromUrl("https://mcp.acme.io/mcp")).toBe("Acme");
  });

  it("finds an email tool and fills it from its schema", () => {
    const tools = [{ name: "list_emails" }, { name: "send-email", inputSchema: { properties: { to: { type: "array" }, subject: {}, text: {}, from: {} }, required: ["to", "subject", "from"] } }];
    const t = sendTool(tools)!;
    expect(t.name).toBe("send-email");
    expect(emailArgs(t, { to: "a@b.co", subject: "Hi", text: "Hello", from: "me@x.co" })).toEqual({ to: ["a@b.co"], subject: "Hi", text: "Hello", from: "me@x.co" });
    expect(emailArgs(t, { to: "a@b.co", subject: "Hi", text: "Hello" })).toBeNull();
    expect(sendTool([{ name: "send_message" }])?.name).toBe("send_message");
    expect(emailArgs({ name: "x", inputSchema: { properties: { recipient: {}, title: {}, body: {} } } }, { to: "a@b.co", subject: "S", text: "T" })).toEqual({ recipient: "a@b.co", title: "S", body: "T" });
  });
});
