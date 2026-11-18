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
import { pendingChangesAction } from "./approvals";
import { addHomeCardAction, checkHomeItemAction, homeCardsAction, removeHomeCardAction } from "./home-cards";
import { coursesAction, draftCourseAction, excerptAction } from "./courses";
import { budget, budgetStep, setBudget } from "./budget";
import { applyLens, lensAction, lensesAction } from "./lenses";
import { plansAction, startPlan } from "./workflows";
import { messagesAction, sendMessageAction } from "./messages";
import { addRecord, changeRecord, lifeAction, logAct, quickLog, removeRecord, restoreRecord, setRecordField, setRecordState } from "./records";
import { changeEvent, removeEventAction, restoreEventAction } from "./calendar-events";
import { addMealAction, addToBasketAction, keepRecipeAction, planMealAction, planWeekAction, setReceiptAction, startMealPlanAction, unplanMealAction } from "./meal-plans";
import { beliefFromWorkAction, compileEditionAction, fileWorkAction, markBeliefAction, placeBeliefAction, placeSubjectAction, saveWorkAction, sendToLearnAction, startWork } from "./journal-works";
import { mainAim, takeOffQuality, toggleQuality, writeQuality, writeToward } from "./work-life";
import { adventureToCalendar } from "./adventure-calendar";
import { draftNaiveVenture, startNaiveVenture, ventureFilesAction, writeVentureFile } from "./ventures";
import { answerBuildRequestAction, askToBuildAction, peopleToBuildWithAction } from "./build";
import { eventAction, eventsAction, goingToEvent, hostEvent, setEventPartAction } from "./events";
import {
  addItemNoteAction, addItemSubjectsAction, addSessionAction, changeItemAction, favoriteEpisodeAction, followListAction, followPerson, followTopic, highlightsToJournal, keepClaimAction, keepExcerpt,
  keepLibraryBook, keepReasonAction, learnedPiece, logPracticeAction, makePlaylistAction, orderWantAction, removeExcerptAction, removeItemAction, removeItemNoteAction, removeItemSubjectAction,
  removeSessionAction, restoreItemAction, reviseExcerptAction, savePlaylist, setBookWayAction, setFinishedAction, setReactionAction, setReadingGoal, setStanceAction, setUnitDoneAction, takeUpItem,
} from "./learn-page";

/** Every page act's entry (Ask Reflect plan, step 4), grouped by area: what a page can do, the chat and MCP can do. */
export const PAGE_ACTIONS: readonly Action[] = [
  lifeAction, quickLog, addRecord, changeRecord, setRecordState, setRecordField, logAct, removeRecord, restoreRecord,
  changeEvent, removeEventAction, restoreEventAction,
  addMealAction, planMealAction, unplanMealAction, planWeekAction, startMealPlanAction, addToBasketAction, keepRecipeAction, setReceiptAction,
  startWork, saveWorkAction, fileWorkAction, beliefFromWorkAction, sendToLearnAction, markBeliefAction, placeSubjectAction, placeBeliefAction, compileEditionAction,
  toggleQuality, takeOffQuality, writeQuality, writeToward, mainAim,
  adventureToCalendar,
  startNaiveVenture, askToBuildAction, answerBuildRequestAction,
  goingToEvent, hostEvent, setEventPartAction,
  keepLibraryBook, keepClaimAction, setStanceAction, takeUpItem, changeItemAction, removeItemAction, restoreItemAction, setBookWayAction,
  keepExcerpt, reviseExcerptAction, removeExcerptAction, setFinishedAction, orderWantAction, setReadingGoal,
  setUnitDoneAction, addItemNoteAction, removeItemNoteAction, addSessionAction, removeSessionAction, addItemSubjectsAction, removeItemSubjectAction,
  setReactionAction, favoriteEpisodeAction, followListAction, keepReasonAction, highlightsToJournal, followTopic, followPerson, makePlaylistAction, savePlaylist,
  logPracticeAction, learnedPiece,
];

export type { Action, ActionContext, ChangeLog, LoggedChange, Source, Surface } from "./types";
export { describeFor, inputFor } from "./types";
export { GUIDE };

/** Every action, in the order MCP lists them, then the chat's own. */
export const ACTIONS: readonly Action[] = [
  reflectGuide, householdPlan, budget, setBudget, budgetStep, adventures, planAdventureAction, household, place, connections, meals, piano, calendar, addEvent, addEventsAction,
  listEntriesAction, writeEntry, getEntry, keepLegacyPlan, legacyStatusAction,
  learning, addBookAction, addBookSubjects, setBookStatusAction, recallCheck, addCoursesAction, addCredentialAction, rateSubjectAction, addInputAction, addItemAction, addLesson, markSubjectAction,
  ideas, keepIdeaAction,
  recentChanges, undoChangeAction, pendingChangesAction, startPlan, plansAction,
  practiceDialectic, showShelves, showWays, findItem, quoteTranscript, showClaims, searchLibrary, browseCategory, quoteBook, proposeClaim,
  homeCardsAction, addHomeCardAction, removeHomeCardAction, checkHomeItemAction,
  excerptAction, draftCourseAction, coursesAction,
  lensesAction, lensAction, applyLens,
  messagesAction, sendMessageAction,
  ventureFilesAction, draftNaiveVenture, writeVentureFile,
  peopleToBuildWithAction,
  eventsAction, eventAction,
  ...PAGE_ACTIONS,
];

export const actionById = (id: string) => ACTIONS.find((a) => a.id === id);
/** The actions one surface offers, in registry order. Never-tier actions are never offered. */
export const actionsOn = (on: Surface) => ACTIONS.filter((a) => a.on.includes(on) && a.tier !== "never");
