import type { ComponentType } from "react";
import type { Ctx, SkeletonShape } from "../parts";
import { TodayCard } from "./today";
import { PeopleCard } from "./people";
import { AskCardsCard } from "./ask-cards";
import { MoneyCard } from "./money";
import { EventsCard } from "./events";
import { ChatsCard } from "./chats";

// Every card the dashboard can show, one file each in this folder (Torian, 2026-11-18). A card is an async server
// component that fetches its own data, so each loads on its own behind a skeleton and a broken one leaves the rest.
// `column` is where it sits by default on a wide screen; `skeleton` is the rough shape of its place-holder.
export type DashCardDef = { id: string; title: string; column: "main" | "side"; skeleton?: SkeletonShape; Card: ComponentType<{ ctx: Ctx }> };

export const DASH_CARDS: DashCardDef[] = [
  { id: "today", title: "Today", column: "main", skeleton: "hero", Card: TodayCard },
  { id: "people", title: "People", column: "main", skeleton: "faces", Card: PeopleCard },
  { id: "ask-cards", title: "From Ask Reflect", column: "main", Card: AskCardsCard },
  { id: "money", title: "Money", column: "side", skeleton: "stat", Card: MoneyCard },
  { id: "events", title: "Events", column: "side", Card: EventsCard },
  { id: "chats", title: "Recent chats", column: "side", Card: ChatsCard },
];
