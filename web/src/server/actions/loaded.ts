// The records an action reads, taken from what the caller already read for this request when it has them.
import { learnView } from "../learn-store";
import { listItems } from "../ways-store";
import { listClaims } from "../claims-store";
import type { ActionContext } from "./types";

export const viewOf = async (ctx: ActionContext) => ctx.loaded?.view ?? learnView(ctx.userId);
export const itemsOf = async (ctx: ActionContext) => ctx.loaded?.items ?? listItems(ctx.userId).catch(() => []);
/** The person's claims, or null when claims are not set up here. */
export const claimsOf = async (ctx: ActionContext) => (ctx.loaded?.claims !== undefined ? ctx.loaded.claims : listClaims(ctx.userId).catch(() => null));
