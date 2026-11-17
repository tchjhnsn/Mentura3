// The action registry (Ask Reflect plan, step 1): every action a model can take in Reflect, once. The chat
// (app/api/chat/tools.ts) and the person's own AI over MCP (../mcp-tools.ts) are both built from it, so they
// cannot drift; `on` says which of them offers each action, and `tier` what it asks of the person.
import type { Action, Surface } from "./types";
import { GUIDE, getEntry, keepLegacyPlan, legacyStatusAction, listEntriesAction, reflectGuide, writeEntry } from "./journal";
import { adventures, connections, household, householdPlan, meals, place, planAdventureAction } from "./life";
import { addEvent, addEventsAction, calendar } from "./calendar";
import { browseCategory, findItem, piano, practiceDialectic, quoteBook, quoteTranscript, searchLibrary, showShelves, showWays } from "./schole";
import { addBookAction, addBookSubjects, addCoursesAction, addCredentialAction, addInputAction, addItemAction, addLesson, learning, markSubjectAction, rateSubjectAction, recallCheck, setBookStatusAction } from "./learning";
import { ideas, keepIdeaAction, proposeClaim, showClaims } from "./ideas";
import { recentChanges, undoChangeAction } from "./changes";
import { addHomeCardAction, checkHomeItemAction, homeCardsAction, removeHomeCardAction } from "./home-cards";

export type { Action, ActionContext, ChangeLog, LoggedChange, Source, Surface } from "./types";
export { describeFor, inputFor } from "./types";
export { GUIDE };

/** Every action, in the order MCP lists them, then the chat's own. */
export const ACTIONS: readonly Action[] = [
  reflectGuide, householdPlan, adventures, planAdventureAction, household, place, connections, meals, piano, calendar, addEvent, addEventsAction,
  listEntriesAction, writeEntry, getEntry, keepLegacyPlan, legacyStatusAction,
  learning, addBookAction, addBookSubjects, setBookStatusAction, recallCheck, addCoursesAction, addCredentialAction, rateSubjectAction, addInputAction, addItemAction, addLesson, markSubjectAction,
  ideas, keepIdeaAction,
  recentChanges, undoChangeAction,
  practiceDialectic, showShelves, showWays, findItem, quoteTranscript, showClaims, searchLibrary, browseCategory, quoteBook, proposeClaim,
  homeCardsAction, addHomeCardAction, removeHomeCardAction, checkHomeItemAction,
];

export const actionById = (id: string) => ACTIONS.find((a) => a.id === id);
/** The actions one surface offers, in registry order. Never-tier actions are never offered. */
export const actionsOn = (on: Surface) => ACTIONS.filter((a) => a.on.includes(on) && a.tier !== "never");
