import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { buildSpec } from "./spec";

vi.mock("./actions", () => ({ addBookFromChat: async () => {}, keepClaimFromChat: async () => {} }));
const { registry } = await import("./registry");

describe("chat cards render", () => {
  it("renders library and claim cards from a spec, with Add only for books not yet on the shelves", () => {
    const spec = buildSpec([
      { kind: "library", label: "x", kept: new Set(["OL2W"]), books: [
        { work: "OL1W", title: "Wiring", authors: ["A. Writer"], subjects: [], contents: [], lcc: ["TK-1"] },
        { work: "OL2W", title: "Kept", authors: [], subjects: [], contents: [] },
      ] },
      { kind: "propose_claim", text: "Virtue is a mean", stance: "belief", holders: [{ name: "Aristotle" }] },
    ])!;
    const html = renderToStaticMarkup(
      <JSONUIProvider registry={registry}>
        <Renderer spec={spec} registry={registry} />
      </JSONUIProvider>,
    );
    expect(html).toContain("Wiring");
    expect(html).toContain("Electronics");
    expect(html.match(/Add to shelves/g)).toHaveLength(1);
    expect(html).toContain("On your shelves");
    expect(html).toContain("Accept");
    expect(html).toContain("held by Aristotle");
  });

  it("renders an Approval as a Confirmation with the preview, its one button and Decline", () => {
    const spec = buildSpec([{ kind: "approval", change: "00000000-0000-4000-8000-000000000001", title: "Keep the legacy release plan", preview: "Cy receives:\nLetter: Dear Cy.", tier: "outside" }])!;
    const html = renderToStaticMarkup(
      <JSONUIProvider registry={registry}>
        <Renderer spec={spec} registry={registry} />
      </JSONUIProvider>,
    );
    expect(html).toContain("Keep the legacy release plan");
    expect(html).toContain("Letter: Dear Cy.");
    expect(html).toContain(">Send<");
    expect(html).toContain(">Decline<");
    expect(html).not.toContain(">Keep<");
  });

  it("renders a Plan as a Trace with how far it got and each step's status", () => {
    const spec = buildSpec([{ kind: "plan", title: "Three things", status: "failed", note: "Stopped: you declined step 2.", steps: [{ title: "One", status: "done" }, { title: "Two", status: "declined" }, { title: "Three", status: "not_started" }] }])!;
    const html = renderToStaticMarkup(
      <JSONUIProvider registry={registry}>
        <Renderer spec={spec} registry={registry} />
      </JSONUIProvider>,
    );
    expect(html).toContain("Plan: Three things");
    expect(html).toContain("Stopped · 1 of 3 done");
    expect(html).toContain("Declined");
    expect(html).toContain("Not started");
    expect(html).toContain("Stopped: you declined step 2.");
  });
});
