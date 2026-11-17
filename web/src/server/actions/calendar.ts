// The calendar (Torian: "the AI chat will be central (itineraries, putting things on the calendar)").
import { z } from "zod";
import { addEvents, calendarPart, calendarSchema, eventSchema } from "../calendar-tools";
import { action } from "./types";

export const calendar = action({
  id: "calendar",
  title: "Read the person's calendar",
  description: "Fetch the person's calendar from one day through another (a week when 'to' is left out, at most 92 days): every tile's events, or one tile's, with the days their records hold. Read it before saying when they are free.",
  tier: "read",
  on: ["chat", "mcp"],
  input: calendarSchema,
  mcp: { description: "The person's calendar from one day through another (a week when 'to' is left out, at most 92 days): every tile's events, or one tile's, with the days their records hold (a date, an election, a birthday). Read it before saying when they are free." },
  run: async ({ userId }, { from, to, tile }) => calendarPart(userId, from, to, tile),
});

export const addEvent = action({
  id: "add_event",
  title: "Put an event on the person's calendar",
  description: "Put one event on the person's calendar, only when they ask. Use the day and times they said; ask first when either is unclear. Say the day and time in your reply.",
  tier: "own",
  on: ["chat", "mcp"],
  input: eventSchema,
  mcp: { description: "Add one event, only when the person asks, with the day and times they said; ask first when either is unclear. Returns its id and a link to the calendar at its day. Tell the person the day and time." },
  run: async ({ userId }, e) => addEvents(userId, [e]),
});

export const addEventsAction = action({
  id: "add_events",
  title: "Put several events on the person's calendar",
  description: "Put several events on the person's calendar at once, such as an itinerary, only when they ask. Each is checked before any is added. Say the day and time of each in your reply.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ events: z.array(eventSchema).min(1).max(20) }),
  mcp: { description: "Add an itinerary or several events at once, only when the person asks. Each is checked before any is added. Tell the person the day and time of each." },
  run: async ({ userId }, { events }) => addEvents(userId, events),
});
