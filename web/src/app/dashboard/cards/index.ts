import type { ComponentType } from "react";
import type { Ctx } from "../parts";
import { TodayCard } from "./today";
import { PeopleCard } from "./people";
import { AskCardsCard } from "./ask-cards";
import { MoneyCard } from "./money";
import { EventsCard } from "./events";
import { ChatsCard } from "./chats";
import { eventsUrgency, moneyUrgency, peopleUrgency, todayUrgency } from "../urgent";

// Every card the dashboard can show, one file each in this folder (Torian, 2026-11-18). A card is an async server
// component that fetches its own data, so each loads on its own behind a skeleton and a broken one leaves the rest.
// `column` is where it sits by default on a wide screen: a main card is wide (both columns), a side card normal (one).
// `urgency` (optional) scores how soon the card needs the person, 0 to 100, with the pure functions in ../urgency.ts;
// cards are ordered by it unless the person set their own order. It reads through ../data.ts so the card shares the read.
export type DashCardDef = { id: string; title: string; column: "main" | "side"; Card: ComponentType<{ ctx: Ctx }>; urgency?: (ctx: Ctx) => Promise<number> };

export const DASH_CARDS: DashCardDef[] = [
  { id: "today", title: "Today", column: "main", Card: TodayCard, urgency: todayUrgency },
  { id: "people", title: "People", column: "main", Card: PeopleCard, urgency: peopleUrgency },
  { id: "ask-cards", title: "From Ask Reflect", column: "main", Card: AskCardsCard },
  { id: "money", title: "Money", column: "side", Card: MoneyCard, urgency: moneyUrgency },
  { id: "events", title: "Events", column: "side", Card: EventsCard, urgency: eventsUrgency },
  { id: "chats", title: "Recent chats", column: "side", Card: ChatsCard },
];
