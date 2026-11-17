// The life tiles a model reads part by part: the household plan, the household, where the person lives, their
// connections, meals and adventures. Each returns the part asked for, or null when there is no such part.
import { z } from "zod";
import { PLAN_PATHS, partSummary, planPart } from "@reflect/core/plan";
import { HOUSEHOLD_PATHS } from "@reflect/core/household";
import { PLACE_PATHS, placePart } from "@reflect/core/public-data";
import { CONNECTIONS_PATHS } from "@reflect/core/connectors";
import { MEALS_PATHS } from "@reflect/core/meals";
import { planOf } from "../plan";
import { householdPartOf } from "../household-store";
import { placeFacts } from "../public-data";
import { connectionsPartOf } from "../connections-store";
import { mealsPartOf } from "../meals-store";
import { adventureFor, adventuresPart, planAdventure } from "../adventures";
import { removeLifeRecord, saveLifeRecord } from "../life-store";
import { action } from "./types";

const path = z.object({ path: z.string().max(200).default("") });
const pathSuchAs = (such: string) => z.object({ path: z.string().max(200).default("").describe(such) });

// The household plan is a tree of small parts (doc "Already and Not yet design guide"): fetch only the one asked about.
export const householdPlan = action({
  id: "household_plan",
  title: "Read one part of the household plan",
  description: `Fetch one part of the person's household plan: what life costs now, each step still to be reached, its costs, taxes, household and what must be earned. Fetch the smallest part that answers. Paths: ${PLAN_PATHS}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: pathSuchAs("Such as 'next/costs/food' or 'already/household'"),
  mcp: { description: `One part of the person's household plan: what life costs now (Already), each step still to be reached (Not yet), and what must be earned. Fetch only the part asked about. Paths: ${PLAN_PATHS}.`, input: path },
  run: async ({ userId }, { path }) => {
    const { plan } = await planOf(userId);
    return { summary: partSummary(plan, path), part: planPart(plan, path) };
  },
});

// The Adventures lens (2026-11-17): what the person wants to do, across the tiles each touches.
export const adventures = action({
  id: "adventures",
  title: "Read the person's adventures",
  description: "Fetch the person's adventures (camping, a league, travel, a game night...): each with the tiles it touches, who it is with, and whether it is done. Paths: '' (all), 'not-yet', 'already', a tile id such as 'friends', or an adventure id.",
  tier: "read",
  on: ["chat", "mcp"],
  input: path,
  mcp: { description: "The person's adventures (camping, a league, travel, a game night...): each with the tiles it touches, who it is with, and whether it is done. Fetch only the part asked about. Paths: '' (all), 'not-yet', 'already', a tile id such as 'friends', or an adventure id." },
  run: async ({ userId }, { path }) => adventuresPart(userId, path),
});

export const planAdventureAction = action({
  id: "plan_adventure",
  title: "Draft a plan for an adventure",
  description: "Draft a plan for one of the person's adventures, or a new one: the place, dates, a day-by-day plan of stops (with coordinates when known, so they show on the map), a packing checklist and a budget. It is saved as a draft the person keeps or changes on the adventure's page. Give links only to real pages; never invent coordinates.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    id: z.string().max(60).optional().describe("The adventure's id, to plan one that exists"),
    name: z.string().max(140).optional().describe("Its name, to start a new one (or find one by name)"),
    place: z.string().max(200).optional().describe("Where, as a place name OpenStreetMap can find"),
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    budget: z.number().min(0).max(1e7).optional().describe("Total cost in dollars"),
    days: z.array(z.object({ day: z.string().optional().describe("YYYY-MM-DD"), title: z.string().max(100).optional(), stops: z.array(z.object({ time: z.string().optional().describe("HH:MM"), title: z.string().max(140), note: z.string().max(300).optional(), link: z.string().max(500).optional().describe("https link out, such as the trail on AllTrails or the campsite on Recreation.gov"), lat: z.number().optional(), lon: z.number().optional() })).max(12) })).max(14).optional(),
    checklist: z.array(z.string().max(140)).max(60).optional().describe("What to pack or do before"),
  }),
  run: async ({ userId }, d) => planAdventure(userId, d),
  // Undo removes an adventure the plan started, or puts back the fields of one it changed.
  before: async ({ userId }, d) => {
    const old = await adventureFor(userId, d);
    return old ? { id: old.id, body: old.body } : null;
  },
  change: (r, _d, before) => ({ before, after: { id: r.id, created: before === null } }),
  undo: async ({ userId }, c) => {
    const after = c.after as { id?: unknown; created?: unknown } | null;
    const before = c.before as { id?: unknown; body?: unknown } | null;
    if (typeof after?.id !== "string") throw new Error("This change cannot be undone.");
    if (after.created === true) await removeLifeRecord(userId, after.id);
    else if (before && before.id === after.id && before.body && typeof before.body === "object") await saveLifeRecord(userId, after.id, before.body as Record<string, unknown>);
    else throw new Error("This change cannot be undone.");
  },
});

export const household = action({
  id: "household",
  title: "Read one part of the household",
  description: `Fetch one part of the person's household: who lives there, how each is related, ages, dependents, and whether it is a family household. Fetch the smallest part that answers. Paths: ${HOUSEHOLD_PATHS}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: pathSuchAs("Such as 'members' or 'counts'"),
  mcp: { description: `Who lives in the person's household: members, how they are related, ages, who is a dependent, and whether it is a family household. Fetch only the part asked about. Paths: ${HOUSEHOLD_PATHS}.`, input: path },
  run: async ({ userId }, { path }) => householdPartOf(userId, path),
});

export const place = action({
  id: "place",
  title: "Read public data about where the person lives",
  description: `Fetch what public data says about where the person lives: FEMA's natural hazard rating for their county and the EPA record of their water system. Fetch the smallest part that answers, and name the source. Paths: ${PLACE_PATHS}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: pathSuchAs("Such as 'hazards' or 'water'"),
  mcp: { description: `FEMA's natural hazard rating for the person's county and the EPA record of their water system. Fetch only the part asked about, and name the source. Paths: ${PLACE_PATHS}.`, input: path },
  /** `set` is false when the person has not said where they live; `part` is null when there is no such part or the source could not be read. */
  run: async ({ userId }, { path }): Promise<{ set: boolean; part: unknown }> => {
    const p = await placeFacts(userId);
    return p.set ? { set: true, part: placePart(p, path) } : { set: false, part: null };
  },
});

export const connections = action({
  id: "connections",
  title: "Read the person's connections",
  description: `Fetch the person's connections: what they have connected, what each connector reads and never does, which tiles use it, and why one cannot be connected yet. Never connect anything: to connect, send the person to Settings, Connections, then the connector's page (/settings/connections/<id>). Paths: ${CONNECTIONS_PATHS}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: pathSuchAs("Such as 'connected' or 'plaid'"),
  mcp: { description: `What the person has connected, what each connector reads and never does, which tiles use it, and why one cannot be connected yet. Read only; connecting happens on the connector's page in Reflect. Paths: ${CONNECTIONS_PATHS}.`, input: path },
  run: async ({ userId }, { path }) => connectionsPartOf(userId, path),
});

export const meals = action({
  id: "meals",
  title: "Read one part of meal planning",
  description: `Fetch one part of the person's meal planning: their meals and ingredients, this week's meals by day, and the shopping list scaled to the household. Fetch the smallest part that answers. Paths: ${MEALS_PATHS}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: pathSuchAs("Such as 'week' or 'list'"),
  mcp: { description: `The person's meals and their ingredients, this week's meals by day, and the shopping list scaled to the household. Fetch only the part asked about. Paths: ${MEALS_PATHS}.`, input: path },
  run: async ({ userId }, { path }) => mealsPartOf(userId, path),
});
