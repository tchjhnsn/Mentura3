import type { ComponentType } from "react";
import type { Ctx } from "../parts";
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

// Every card the dashboard can show, one file each in this folder (Torian, 2026-11-18). A card is an async server
// component that fetches its own data, so each loads on its own behind a skeleton and a broken one leaves the rest.
// `column` is where it sits by default on a wide screen.
export type DashCardDef = { id: string; title: string; column: "main" | "side"; Card: ComponentType<{ ctx: Ctx }> };

export const DASH_CARDS: DashCardDef[] = [
  { id: "today", title: "Today", column: "main", Card: TodayCard },
  { id: "habits", title: "Habits", column: "main", Card: HabitsCard },
  { id: "people", title: "People", column: "main", Card: PeopleCard },
  { id: "ask-cards", title: "From Ask Reflect", column: "main", Card: AskCardsCard },
  { id: "schole", title: "Scholē", column: "main", Card: ScholeCard },
  { id: "journal", title: "Journal", column: "main", Card: JournalCard },
  { id: "venture", title: "Venture", column: "main", Card: VentureCard },
  { id: "money", title: "Money", column: "side", Card: MoneyCard },
  { id: "spending", title: "Spending", column: "side", Card: SpendingCard },
  { id: "food", title: "Food", column: "side", Card: FoodCard },
  { id: "events", title: "Events", column: "side", Card: EventsCard },
  { id: "chats", title: "Recent chats", column: "side", Card: ChatsCard },
];
