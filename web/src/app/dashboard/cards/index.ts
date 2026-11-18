import type { ComponentType } from "react";
import type { Ctx, SkeletonShape } from "../parts";
import { TodayCard } from "./today";
import { PeopleCard } from "./people";
import { AskCardsCard } from "./ask-cards";
import { MoneyCard } from "./money";
import { EventsCard } from "./events";
import { ChatsCard } from "./chats";
import { HabitsCard } from "./habits";
import { VentureCard } from "./venture";
import { ScholeCard } from "./schole";
import { JournalCard } from "./journal";
import { FoodCard } from "./food";
import { SpendingCard } from "./spending";
import { HealthCard } from "./health";
import { WeatherCard } from "./weather";
import { PeopleToSeeCard } from "./people-to-see";
import { WeekCard } from "./week";
import { ApprovalsCard } from "./approvals";
import { eventsUrgency, moneyUrgency, peopleUrgency, todayUrgency } from "../urgent";

// Every card the dashboard can show, one file each in this folder (Torian, 2026-11-18). A card is an async server
// component that fetches its own data, so each loads on its own behind a skeleton and a broken one leaves the rest.
// `column` is where it sits by default on a wide screen; `skeleton` is the rough shape of its place-holder.
// `urgency` (optional) scores how soon the card needs the person, 0 to 100 (pure functions in ../urgency.ts, reads in
// ../data.ts shared with the card); cards are ordered by it unless the person set their own order in Edit dashboard.
export type DashCardDef = { id: string; title: string; column: "main" | "side"; skeleton?: SkeletonShape; Card: ComponentType<{ ctx: Ctx }>; urgency?: (ctx: Ctx) => Promise<number> };

export const DASH_CARDS: DashCardDef[] = [
  { id: "approvals", title: "Waiting for you", column: "main", Card: ApprovalsCard },
  { id: "today", title: "Today", column: "main", skeleton: "hero", Card: TodayCard, urgency: todayUrgency },
  { id: "people", title: "People", column: "main", skeleton: "faces", Card: PeopleCard, urgency: peopleUrgency },
  { id: "ask-cards", title: "From Ask Reflect", column: "main", Card: AskCardsCard },
  { id: "habits", title: "Habits", column: "main", Card: HabitsCard },
  { id: "schole", title: "Scholē", column: "main", Card: ScholeCard },
  { id: "journal", title: "Journal", column: "main", Card: JournalCard },
  { id: "venture", title: "Venture", column: "main", Card: VentureCard },
  { id: "week", title: "This week", column: "main", Card: WeekCard },
  { id: "money", title: "Money", column: "side", skeleton: "stat", Card: MoneyCard, urgency: moneyUrgency },
  { id: "spending", title: "Spending", column: "side", Card: SpendingCard },
  { id: "food", title: "Food", column: "side", Card: FoodCard },
  { id: "events", title: "Events for you", column: "side", Card: EventsCard, urgency: eventsUrgency },
  { id: "chats", title: "Recent chats", column: "side", Card: ChatsCard },
  { id: "weather", title: "Weather and when to leave", column: "side", Card: WeatherCard },
  { id: "people-to-see", title: "People to see", column: "main", Card: PeopleToSeeCard },
  { id: "health", title: "Health and fitness", column: "side", Card: HealthCard },
];
