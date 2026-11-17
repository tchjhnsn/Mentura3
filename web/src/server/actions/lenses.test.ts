import { describe, expect, it } from "vitest";
import { ASK_SYSTEM } from "@reflect/core/ask";
import { catalog } from "@/app/chat/catalog";
import { buildSpec } from "@/app/chat/spec";
import { applyLens, lensAction, lensesAction } from "./lenses";
import { actionById } from "./index";

const ctx = { userId: "u" };

describe("thinker lens actions", () => {
  it("are read-tier, offered in the chat and over MCP", () => {
    for (const id of ["lenses", "lens", "apply_lens"]) {
      expect(actionById(id)?.tier).toBe("read");
      expect(actionById(id)?.on).toEqual(["chat", "mcp"]);
    }
  });

  it("lists every lens", async () => {
    const list = await lensesAction.run(ctx, {});
    expect(list.map((l) => l.id)).toEqual(["marcus-aurelius", "epictetus", "seneca", "benjamin-franklin"]);
    expect(list.every((l) => !l.living && l.ideas > 0 && l.works.length > 0)).toBe(true);
  });

  it("reads one lens, or one idea by path, each idea cited inside Reflect", async () => {
    const all = await lensAction.run(ctx, { path: "epictetus" });
    expect(all?.ideas.length).toBeGreaterThan(1);
    const one = await lensAction.run(ctx, { path: "benjamin-franklin/daily-record" });
    expect(one?.person).toBe("/schole/people/Benjamin%20Franklin");
    expect(one?.ideas).toHaveLength(1);
    expect(one?.ideas[0]!.cites).toHaveLength(2);
    for (const c of one!.ideas[0]!.cites) expect(c.href).toMatch(/^\/schole\/works\/OL26492W\/read\?t=148&/);
    expect(await lensAction.run(ctx, { path: "nobody" })).toBeNull();
  });

  it("applies a lens with guidance, and never speaks as someone it has no lens for", async () => {
    const r = await applyLens.run(ctx, { thinker: "Marcus Aurelius" });
    expect(r.lens?.id).toBe("marcus-aurelius");
    expect(r.guidance).toContain("Reflect's own voice");
    const none = await applyLens.run(ctx, { thinker: "Tony Robbins" });
    expect(none.lens).toBeNull();
    expect(none.guidance).toContain("Do not speak as Tony Robbins");
  });

  it("tells the chat model to cite ideas in Reflect's voice and never speak as anyone", () => {
    expect(ASK_SYSTEM).toContain("apply_lens(thinker)");
    expect(ASK_SYSTEM).toContain('say "ideas from <book>"');
  });

  it("draws a lens card the catalog accepts, with internal links only", async () => {
    const r = (await applyLens.run(ctx, { thinker: "seneca" })).lens!;
    const spec = buildSpec([{ kind: "lens", name: r.name, works: r.works, living: r.living, href: r.person, ideas: r.ideas.map((i) => ({ text: i.text, cites: i.cites.map((c) => ({ label: c.label, href: c.href })) })) }])!;
    const card = spec.elements.e0!;
    expect(card.type).toBe("Lens");
    expect(card.props).toMatchObject({ title: "Ideas from Seneca", works: "Minor Dialogues", href: null });
    expect(catalog.data.components.Lens.props.safeParse(card.props).success).toBe(true);
    expect(catalog.data.components.Lens.props.safeParse({ ...card.props, href: "https://example.com" }).success).toBe(false);
    expect(buildSpec([{ kind: "lens", name: "An Author", works: ["A Book"], living: true, href: null, ideas: [{ text: "Small steps add up.", cites: [{ label: "A Book, Chapter 3", href: "/schole/browse?q=A%20Book" }] }] }])!.elements.e0!.props).toMatchObject({ title: "Ideas from A Book", works: "An Author" });
  });
});
