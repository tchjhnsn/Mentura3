// What a person's own AI can do with their Reflect journal, over MCP. The tools are the registry's MCP actions
// (./actions), each a plain function of the signed-in person, so the same calls are tested without HTTP. The AI
// proposes; the person decides: a reading is kept only when the person has said yes to it in the conversation,
// and nothing here guesses.
import { McpServer } from "@modelcontextprotocol/server";
import type { z } from "zod";
import { actionsOn, describeFor, inputFor, type Action } from "./actions";
import { addEvent, addEventsAction } from "./actions/calendar";
import { connections, household, householdPlan, meals, place } from "./actions/life";
import { piano } from "./actions/schole";
import { coursesAction, draftCourseAction, excerptAction } from "./actions/courses";
import { budget, budgetStep, setBudget } from "./actions/budget";
import { GUIDE } from "./actions/journal";
import { messagesAction, sendMessageAction } from "./actions/messages";
import { HOLD_DAYS, runAction } from "./actions/run";
import { siteUrl } from "./site";

export { GUIDE, toolGetEntry, toolKeepLegacyPlan, toolLegacyStatus, toolListEntries, toolWriteEntry } from "./actions/journal";
export { toolAddBook, toolLearning, toolRecallCheck } from "./actions/learning";

const text = (v: unknown) => ({ content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }] });

const withLinks = <T extends { href: string }>(list: T[]) => list.map((e) => ({ ...e, link: `${siteUrl()}${e.href}` }));

/** How MCP words an action's result where it is not the result itself. */
const reply = <R,>(a: Action<z.ZodType, R>, f: (r: R) => unknown) => [a.id, f as (r: unknown) => unknown] as const;
const REPLIES = new Map<string, (r: unknown) => unknown>([
  reply(householdPlan, (r) => r.part ?? "No such part of the plan."),
  reply(budget, (r) => (r.summary ? { summary: r.summary, part: r.part } : "No such part of the budget.")),
  reply(setBudget, (r) => r.summary),
  reply(budgetStep, (r) => ({ ...r, link: `${siteUrl()}${r.href}` })),
  reply(household, (r) => r ?? "No such part of the household."),
  reply(place, (r) => (r.set ? (r.part ?? "No such part, or the source could not be read.") : "The person has not said where they live.")),
  reply(connections, (r) => r ?? "No such connector."),
  reply(meals, (r) => r ?? "No such part of the meals."),
  reply(piano, (r) => r ?? "No such part of the piano course."),
  reply(addEvent, (r) => withLinks(r)[0]),
  reply(addEventsAction, (r) => withLinks(r)),
  reply(excerptAction, (r) => (r.held ? { ...r, passages: withLinks(r.passages) } : r.reason)),
  reply(draftCourseAction, (r) => (r.ok ? { ...r, link: `${siteUrl()}${r.href}` } : { kept: false, errors: r.errors })),
  reply(coursesAction, (r) => withLinks(r)),
  reply(messagesAction, (r) => (r.kind === "threads" ? withLinks(r.threads) : { ...r, link: `${siteUrl()}${r.href}` })),
  reply(sendMessageAction, (r) => ({ ...r, link: `${siteUrl()}${r.href}` })),
]);

/** One MCP server for one signed-in person. */
export function reflectServer(userId: string): McpServer {
  const server = new McpServer({ name: "reflect", version: "0.1.0" }, { instructions: GUIDE });
  for (const a of actionsOn("mcp")) {
    const input = inputFor(a, "mcp");
    const said = REPLIES.get(a.id) ?? ((r: unknown) => r);
    const config = { title: a.title, description: describeFor(a, "mcp"), inputSchema: input, ...(a.tier === "read" ? { annotations: { readOnlyHint: true } } : {}) };
    // A tool with no input is called with only the request context, so it runs with no input. Every run goes through
    // runAction, which logs a change; one the person can undo names its change id in a second line. A shared or
    // outside action is always held: it does not run, and the result says it waits for a tap inside Reflect.
    const run = async (args: unknown) => {
      const ran = await runAction(a, { userId }, input ? args : {}, "mcp");
      if (ran.held) {
        const tap = a.tier === "outside" ? "Send" : "Keep";
        return text(`Not done yet. This waits for the person to tap ${tap} inside Reflect (Ask, at the top: ${siteUrl()}/chat), for ${HOLD_DAYS} days; nothing happens until they do. Change ${ran.changeId}. What will happen:\n${ran.preview}`);
      }
      const { result, changeId } = ran;
      const out = text(said(result));
      if (changeId && a.tier === "own" && a.undo) out.content.push({ type: "text", text: `Change ${changeId}. The person can undo it for 30 days (undo_change).` });
      return out;
    };
    server.registerTool(a.id, config, run);
  }
  return server;
}
