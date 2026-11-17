import { describe, expect, it } from "vitest";
import { TIERS } from "@reflect/core/actions";
import { ACTIONS, actionById, actionsOn } from "./index";
import { reflectServer } from "../mcp-tools";
import { chatTools } from "@/app/api/chat/tools";
import type { LearnView } from "../learn-store";

// The tools each surface offered before the registry (2026-11-17), since step 2 the change log's two, and since step 3 pending_changes. Changing what
// either offers is a change to these lists.
const CHAT_TOOLS = [
  "practice_dialectic", "adventures", "plan_adventure", "calendar", "add_event", "add_events", "household_plan", "budget", "set_budget", "budget_step", "household", "place", "connections", "meals", "piano",
  "show_shelves", "show_ways", "find_item", "quote_transcript", "show_claims", "search_library", "browse_category", "quote_book", "propose_claim",
  "recent_changes", "undo_change", "pending_changes",
  "home_cards", "add_home_card", "remove_home_card", "check_home_item",
  "excerpt", "draft_course", "courses",
  "lenses", "lens", "apply_lens",
  "messages", "send_message",
];
const MCP_TOOLS = [
  "reflect_guide", "household_plan", "budget", "set_budget", "budget_step", "adventures", "plan_adventure", "household", "place", "connections", "meals", "piano", "calendar", "add_event", "add_events",
  "list_entries", "write_entry", "get_entry", "keep_legacy_plan", "legacy_status", "learning", "add_book", "add_book_subjects", "set_book_status", "recall_check",
  "add_courses", "add_credential", "rate_subject", "add_input", "add_item", "add_lesson", "mark_subject", "ideas", "keep_idea",
  "recent_changes", "undo_change", "pending_changes",
  "home_cards", "add_home_card", "remove_home_card", "check_home_item",
  "excerpt", "draft_course", "courses",
  "lenses", "lens", "apply_lens",
  "messages", "send_message",
];

const view: LearnView = { known: [], shown: [], vouched: [], suggested: [], books: [] };
const chatNames = () => Object.keys(chatTools({ userId: "u", view, claims: [], items: [], show: () => undefined }));
type Registered = Record<string, { annotations?: { readOnlyHint?: boolean } }>;
const mcpTools = () => (reflectServer("u") as unknown as { _registeredTools: Registered })._registeredTools;

describe("the action registry", () => {
  it("names every action once, in snake_case, with a known tier, a title and a description", () => {
    const ids = ACTIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACTIONS) {
      expect(a.id).toMatch(/^[a-z]+(_[a-z]+)*$/);
      expect(TIERS.map((t) => t.id)).toContain(a.tier);
      expect(a.title && a.description).toBeTruthy();
      expect(a.on.length).toBeGreaterThan(0);
    }
  });

  it("builds the chat's tools from registry entries, exactly today's set", () => {
    const names = chatNames();
    for (const n of names) expect(actionById(n)?.on).toContain("chat");
    expect(names).toEqual(CHAT_TOOLS);
    expect(actionsOn("chat").map((a) => a.id).sort()).toEqual([...CHAT_TOOLS].sort());
  });

  it("registers MCP's tools from registry entries, exactly today's set and order", () => {
    const names = Object.keys(mcpTools());
    for (const n of names) expect(actionById(n)?.on).toContain("mcp");
    expect(names).toEqual(MCP_TOOLS);
    expect(actionsOn("mcp").map((a) => a.id)).toEqual(MCP_TOOLS);
  });

  it("marks read only in MCP exactly the read-tier actions", () => {
    const tools = mcpTools();
    const readOnly = Object.keys(tools).filter((n) => tools[n]!.annotations?.readOnlyHint === true);
    expect(readOnly).toEqual(actionsOn("mcp").filter((a) => a.tier === "read").map((a) => a.id));
    expect(readOnly).toEqual(["reflect_guide", "household_plan", "budget", "adventures", "household", "place", "connections", "meals", "piano", "calendar", "list_entries", "get_entry", "legacy_status", "learning", "ideas", "recent_changes", "pending_changes", "home_cards", "excerpt", "courses", "lenses", "lens", "apply_lens", "messages"]);
  });

  it("offers the Home card actions on both surfaces, reading for free and changing only the person's own record", () => {
    const tiers = Object.fromEntries(["home_cards", "add_home_card", "remove_home_card", "check_home_item"].map((id) => [id, actionById(id)?.tier]));
    expect(tiers).toEqual({ home_cards: "read", add_home_card: "own", remove_home_card: "own", check_home_item: "own" });
    for (const id of Object.keys(tiers)) expect(actionById(id)?.on).toEqual(["chat", "mcp"]);
    expect(actionById("add_home_card")?.description).toMatch(/never name one you do not have/);
  });

  it("offers the budget's actions on both surfaces, reading as read and changing the person's own records", () => {
    expect(["budget", "set_budget", "budget_step"].map((id) => [id, actionById(id)?.tier, actionById(id)?.on])).toEqual([
      ["budget", "read", ["chat", "mcp"]], ["set_budget", "own", ["chat", "mcp"]], ["budget_step", "own", ["chat", "mcp"]],
    ]);
    for (const id of ["budget", "set_budget", "budget_step"]) expect(actionById(id)!.description).toContain("not a licensed financial advisor");
  });

  it("lists every action some surface offers", () => {
    expect(ACTIONS.map((a) => a.id).sort()).toEqual([...new Set([...CHAT_TOOLS, ...MCP_TOOLS])].sort());
  });
});
