import { describe, expect, it, vi } from "vitest";

// Over MCP a shared or outside action is always held (Ask Reflect plan, step 3): the person's own AI gets back that it
// waits for a tap inside Reflect, and nothing runs. The change log and the legacy store are stand-ins here.
const m = vi.hoisted(() => ({ held: [] as { actionId: string; source: string; preview: string }[], kept: 0 }));
vi.mock("./action-change-store", () => ({
  postgresChanges: { hold: async (c: { actionId: string; source: string; preview: string }) => (m.held.push(c), "00000000-0000-4000-8000-000000000001") },
}));
vi.mock("./legacy-store", async (importOriginal) => ({ ...(await importOriginal<typeof import("./legacy-store")>()), keepPlan: async () => (m.kept++, { trustees: [], gifts: 0 }) }));

const { reflectServer } = await import("./mcp-tools");

type Tools = Record<string, { handler: (args: unknown, extra: unknown) => Promise<{ content: { text: string }[] }> }>;

describe("held changes over MCP", () => {
  it("holds keep_legacy_plan and says it waits for the person's Send inside Reflect", async () => {
    const tools = (reflectServer("u1") as unknown as { _registeredTools: Tools })._registeredTools;
    const plan = { confirmations: 1, wait_days: 10, trustees: [{ name: "Ann", contact: "ann@example.test" }], gifts: [{ to: "Cy", contact: "cy@example.test", items: [{ title: "Letter", text: "Dear Cy." }] }] };
    const out = await tools.keep_legacy_plan!.handler(plan, {});
    const said = out.content.map((c) => c.text).join("\n");
    expect(said).toMatch(/^Not done yet\. This waits for the person to tap Send inside Reflect/);
    expect(said).toContain("Dear Cy.");
    expect(said).toContain("00000000-0000-4000-8000-000000000001");
    expect(m.kept).toBe(0);
    expect(m.held).toMatchObject([{ actionId: "keep_legacy_plan", source: "mcp" }]);
  });
});
