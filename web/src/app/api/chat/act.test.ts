import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Action } from "@/server/actions";
import { actionsOn } from "@/server/actions";
import { actTools, findActions } from "./act";

// find_actions and act: the chat reaches every action without its own tool by searching, then acting by id.
const fake = (id: string, title: string, description: string): Action =>
  ({ id, title, description, tier: "own", on: ["chat"], input: z.object({ text: z.string() }), run: async () => null }) as unknown as Action;

describe("find_actions and act", () => {
  it("finds an action by the words of the ask, the id and title counting most", () => {
    const list = [fake("plan_meal", "Plan a meal", "Put a recipe on a day."), fake("quick_log", "Log something", "Log sleep, water or a workout.")];
    expect(findActions(list, "log my sleep")[0]!.id).toBe("quick_log");
    expect(findActions(list, "plan dinner on friday")[0]!.id).toBe("plan_meal");
    expect(findActions(list, "zzz qqq")).toEqual([]);
  });

  it("finds the real page acts in the registry", () => {
    const ids = findActions(actionsOn("chat"), "log sleep").map((a) => a.id);
    expect(ids).toContain("quick_log");
  });

  it("runs only an input that fits the action's schema", async () => {
    const ran: unknown[] = [];
    const tools = Object.fromEntries(actTools([fake("quick_log", "Log something", "Log sleep.")], () => async (input) => (ran.push(input), "Done.")));
    const act = tools.act as unknown as { execute: (i: unknown, o: unknown) => Promise<unknown> };
    expect(await act.execute({ action: "quick_log", input: { text: 3 } }, {})).toMatch(/does not fit quick_log/);
    expect(ran).toEqual([]);
    expect(await act.execute({ action: "quick_log", input: { text: "slept 7 hours" } }, {})).toBe("Done.");
    expect(ran).toEqual([{ text: "slept 7 hours" }]);
  });
});
