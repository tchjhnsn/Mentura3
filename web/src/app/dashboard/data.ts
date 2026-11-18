// The dashboard's reads, each cached for one render (React `cache`), so a card's urgency and the card itself share one
// read instead of two.
import { cache } from "react";
import { calendarPart } from "@/server/calendar-tools";
import { incomingRequests } from "@/server/connect-store";
import { threadsOf } from "@/server/messages-store";
import { nextGoing } from "@/server/events-store";
import { planOf } from "@/server/plan";

export const calendarOf = cache((userId: string, from: string, to: string) => calendarPart(userId, from, to));
export const requestsOf = cache((userId: string) => incomingRequests(userId));
export const threadsFor = cache((userId: string) => threadsOf(userId));
export const goingNext = cache((userId: string) => nextGoing(userId));
export const planFor = cache((userId: string) => planOf(userId));
