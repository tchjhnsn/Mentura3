import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/pool", () => ({ db: () => ({ query: async () => ({ rows: [] }) }) }));
vi.mock("./mcp-connections", () => ({ callTool: vi.fn(), connectedTo: vi.fn(), toolsOf: vi.fn() }));
vi.mock("./mail", () => ({ sendMail: vi.fn() }));

const { deployFiles } = await import("./site-connectors");

describe("deployFiles", () => {
  const files = { "app/page.tsx": "export default 1", "package.json": "{}" };
  it("uses the names the deploy tool's schema gives", () => {
    const tool = { name: "deploy_to_vercel", inputSchema: { properties: { files: { type: "array", items: { properties: { file: {}, data: {} } } } } } };
    expect(deployFiles(tool, files)).toEqual([{ file: "app/page.tsx", data: "export default 1" }, { file: "package.json", data: "{}" }]);
    const other = { name: "deploy_to_vercel", inputSchema: { properties: { files: { items: { properties: { path: {}, content: {} } } } } } };
    expect(deployFiles(other, files)?.[0]).toEqual({ path: "app/page.tsx", content: "export default 1" });
  });
  it("falls back to file and data with no item schema, and refuses names it cannot fill", () => {
    expect(deployFiles({ name: "d" }, files)?.[1]).toEqual({ file: "package.json", data: "{}" });
    expect(deployFiles({ name: "d", inputSchema: { properties: { files: { items: { properties: { blob: {} } } } } } }, files)).toBeNull();
  });
});
