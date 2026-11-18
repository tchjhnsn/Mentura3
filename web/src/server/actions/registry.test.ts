import { describe, expect, it } from "vitest";
import { TIERS } from "@reflect/core/actions";
import { ACTIONS, actionById, actionsOn } from "./index";
import { reflectServer } from "../mcp-tools";
import { chatTools } from "@/app/api/chat/tools";
import { META_TOOLS } from "@/app/api/chat/act";
import type { LearnView } from "../learn-store";

// The tools each surface offered before the registry (2026-11-17), since step 2 the change log's two, and since step 4
// pending_changes (step 3), start_plan and plans (step 9), messages (step 10), and every page act (PAGE, in ./index.ts order). Changing what either offers is a change to these lists.
const PAGE = [
  "life", "quick_log", "add_record", "change_record", "set_record_state", "set_record_field", "log_act", "remove_record", "restore_record", "change_event", "remove_event", "restore_event", "add_meal", "plan_meal", "unplan_meal", "plan_week", "start_meal_plan", "add_to_basket", "keep_recipe", "set_receipt", "start_work", "save_work", "file_work", "belief_from_work", "send_to_learn", "mark_belief", "place_subject", "place_belief", "compile_edition", "toggle_quality", "take_off_quality", "write_quality", "write_toward", "main_aim", "adventure_to_calendar", "start_naive_venture", "ask_to_build", "answer_build_request", "going_to_event", "host_event", "set_event_part", "set_handle", "set_name", "set_default_audience", "keep_library_book", "keep_claim", "set_stance", "take_up_item", "change_item", "remove_item", "restore_item", "set_book_way", "keep_excerpt", "revise_excerpt", "remove_excerpt", "set_finished", "order_want", "set_reading_goal", "set_unit_done", "add_item_note", "remove_item_note", "add_session", "remove_session", "add_item_subjects", "remove_item_subject", "set_reaction", "favorite_episode", "follow_list", "keep_reason", "highlights_to_journal", "follow_topic", "follow_person", "make_playlist", "save_playlist", "log_practice", "learned_piece",
];
// A venture's files (2026-11-18): read, draft and write; starting one is a page act (in PAGE).
const VENTURES = ["venture_files", "draft_naive_venture", "write_venture_file"];
// People to build with (Events and connections, 2026-11-18): reading who to ask; asking and answering are page acts (in PAGE).
const BUILD = ["people_to_build_with"];
// Connections made at events (2026-11-18): requests and people met, Connect, the kind of a friendship, what people see.
const CONNECT = ["connect_requests", "connect_with", "set_friend_kind", "profile", "set_profile"];
// Profiles (2026-11-18): read a profile as the asker may see it; who sees each part.
const PROFILES = ["profile_page", "set_section_audience"];
// Socials (Profiles and accounts, 2026-11-18): the profile's links, adding, removing and confirming one by link-back.
const SOCIALS = ["socials", "add_social", "remove_social", "confirm_social"];
// Events (2026-11-18): read the upcoming events and one event; Going, hosting and a hosted event's parts are page acts (in PAGE).
const EVENTS = ["events", "event"];
// LinkedIn's export on a profile (Profiles and accounts, 2026-11-18): keep it, people here you know, your own connections, remove them.
const LINKEDIN = ["import_linkedin", "linkedin_matches", "linkedin_connections", "remove_linkedin_connections"];
// The dashboard (2026-11-18): read its cards; show, hide, move or size one.
const DASHBOARD = ["dashboard", "set_dashboard_card"];
// The chat offers its own tools directly and reaches every other chat action through find_actions and act.
const CHAT_DIRECT = [
  "practice_dialectic", "adventures", "plan_adventure", "calendar", "add_event", "add_events", "household_plan", "budget", "set_budget", "budget_step", "household", "place", "connections", "meals", "piano",
  "show_shelves", "show_ways", "find_item", "quote_transcript", "show_claims", "search_library", "browse_category", "quote_book", "propose_claim",
  "recent_changes", "undo_change", "pending_changes", "start_plan", "plans",
  "home_cards", "add_home_card", "remove_home_card", "check_home_item",
  "excerpt", "draft_course", "courses",
  "lenses", "lens", "apply_lens",
  "messages", "send_message",
];
const CHAT_TOOLS = [...CHAT_DIRECT, "set_book_status", "add_item", ...VENTURES, ...BUILD, ...CONNECT, ...PROFILES, ...SOCIALS, ...EVENTS, ...LINKEDIN, ...DASHBOARD, ...PAGE];
const MCP_TOOLS = [
  "reflect_guide", "household_plan", "budget", "set_budget", "budget_step", "adventures", "plan_adventure", "household", "place", "connections", "meals", "piano", "calendar", "add_event", "add_events",
  "list_entries", "write_entry", "get_entry", "keep_legacy_plan", "legacy_status", "learning", "add_book", "add_book_subjects", "set_book_status", "recall_check",
  "add_courses", "add_credential", "rate_subject", "add_input", "add_item", "add_lesson", "mark_subject", "ideas", "keep_idea",
  "recent_changes", "undo_change", "pending_changes", "start_plan", "plans",
  "home_cards", "add_home_card", "remove_home_card", "check_home_item",
  "excerpt", "draft_course", "courses",
  "lenses", "lens", "apply_lens",
  "messages", "send_message",
  ...VENTURES,
  ...BUILD,
  ...CONNECT,
  ...PROFILES,
  ...SOCIALS,
  ...EVENTS,
  ...LINKEDIN,
  ...DASHBOARD,
  ...PAGE,
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
    for (const n of names.filter((n) => !META_TOOLS.includes(n as (typeof META_TOOLS)[number]))) expect(actionById(n)?.on).toContain("chat");
    expect(names).toEqual([...CHAT_DIRECT, ...META_TOOLS]);
    expect(actionsOn("chat").map((a) => a.id).sort()).toEqual([...CHAT_TOOLS].sort());
  });

  it("reaches every chat action without its own tool through act", () => {
    const act = chatTools({ userId: "u", view, claims: [], items: [], show: () => undefined }).act as unknown as { inputSchema: { shape: { action: { options: string[] } } } };
    expect(act.inputSchema.shape.action.options).toEqual(CHAT_TOOLS.filter((n) => !CHAT_DIRECT.includes(n)));
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
    expect(readOnly).toEqual(["reflect_guide", "household_plan", "budget", "adventures", "household", "place", "connections", "meals", "piano", "calendar", "list_entries", "get_entry", "legacy_status", "learning", "ideas", "recent_changes", "pending_changes", "plans", "home_cards", "excerpt", "courses", "lenses", "lens", "apply_lens", "messages", "venture_files", "draft_naive_venture", "people_to_build_with", "connect_requests", "profile", "profile_page", "socials", "events", "event", "linkedin_matches", "linkedin_connections", "dashboard", "life"]);
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
