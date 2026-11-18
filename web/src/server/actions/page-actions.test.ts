// Ask Reflect plan, step 4: whatever a page can do, chat can do. This lists every page server action statically (each
// export of a "use server" file under web/src/app) and fails when one has no registry entry and no listed exclusion,
// when a routed one does not run its entry through runAction (fromPage, ./page.ts), or when the lists go stale.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { actionById } from "./index";

const APP = join(__dirname, "..", "..", "app");

/** Each page server action and the registry entries it runs. */
const ROUTED: Record<string, string[]> = {
  // Adventures
  "adventures/actions.ts#addAdventureAction": ["add_record"],
  "adventures/actions.ts#toggleAdventureTileAction": ["change_record"],
  "adventures/actions.ts#setAdventureWithAction": ["change_record"],
  "adventures/actions.ts#setAdventurePlaceAction": ["change_record"],
  "adventures/actions.ts#setAdventureDatesAction": ["change_record"],
  "adventures/actions.ts#setAdventureBudgetAction": ["change_record"],
  "adventures/actions.ts#keepAdventureDraftAction": ["change_record"],
  "adventures/actions.ts#dropAdventureDraftAction": ["change_record"],
  "adventures/actions.ts#toggleAdventureTaskAction": ["change_record"],
  "adventures/actions.ts#addAdventureTaskAction": ["change_record"],
  "adventures/actions.ts#addAdventurePersonAction": ["change_record"],
  "adventures/actions.ts#removeAdventurePersonAction": ["change_record"],
  "adventures/actions.ts#addAdventureToCalendarAction": ["adventure_to_calendar"],
  "adventures/actions.ts#setAdventureDoneAction": ["set_record_state"],
  "adventures/actions.ts#removeAdventureAction": ["remove_record"],
  "adventures/actions.ts#restoreAdventureAction": ["restore_record"],
  // Calendar
  "calendar/actions.ts#addEventAction": ["add_event"],
  "calendar/actions.ts#saveEventAction": ["change_event"],
  "calendar/actions.ts#removeEventAction": ["remove_event"],
  "calendar/actions.ts#restoreEventAction": ["restore_event"],
  // Cards in the chat
  "chat/actions.ts#addBookFromChat": ["keep_library_book"],
  "chat/actions.ts#keepClaimFromChat": ["keep_claim"],
  "chat/actions.ts#addItemFromChat": ["add_item"],
  "chat/actions.ts#undoFromChat": ["undo_change"],
  "life/messages-actions.ts#sendMessageFromPage": ["send_message"],
  // Events: Connect, Connect back, the kind of a friendship and what people see
  "events/connect-actions.ts#connectAction": ["connect_with"],
  "events/connect-actions.ts#connectFromQrAction": ["connect_with"],
  "events/connect-actions.ts#connectBackAction": ["connect_with"],
  "events/connect-actions.ts#setFriendKindFromPage": ["set_friend_kind"],
  "events/connect-actions.ts#saveProfileAction": ["set_profile"],
  // Profiles: Connect from a profile, and who sees each part
  "p/[key]/actions.ts#connectFromProfile": ["connect_with"],
  "p/[key]/actions.ts#setAudienceFromProfile": ["set_section_audience"],
  // Socials (Profiles and accounts, 2026-11-18)
  "settings/profile/socials/actions.ts#addSocialFromPage": ["add_social", "remove_social"],
  "settings/profile/socials/actions.ts#removeSocialFromPage": ["remove_social"],
  "settings/profile/socials/actions.ts#confirmSocialFromPage": ["confirm_social"],
  // Settings, Profile, LinkedIn: keep an export, remove the connections
  "settings/profile/linkedin/actions.ts#keepLinkedinAction": ["import_linkedin"],
  "settings/profile/linkedin/actions.ts#removeLinkedinConnectionsFromPage": ["remove_linkedin_connections"],
  // Home cards
  "home-card-actions.ts#removeCardFromHome": ["remove_home_card"],
  "home-card-actions.ts#checkCardItem": ["check_home_item"],
  // Journal and the book of beliefs
  "journal/actions.ts#createWorkAction": ["start_work"],
  "journal/actions.ts#saveWorkAction": ["save_work"],
  "journal/actions.ts#beliefFromWorkAction": ["belief_from_work"],
  "journal/actions.ts#sendToLearnAction": ["send_to_learn"],
  "journal/actions.ts#markBeliefAction": ["mark_belief"],
  "journal/actions.ts#fileWorkAction": ["file_work"],
  "journal/actions.ts#placeSubjectAction": ["place_subject"],
  "journal/actions.ts#placeAction": ["place_belief"],
  "journal/actions.ts#compileEditionAction": ["compile_edition"],
  "journal/qualities/actions.ts#toggleQualityAction": ["toggle_quality"],
  "journal/qualities/actions.ts#takeOffQualityAction": ["take_off_quality"],
  "journal/qualities/actions.ts#writeQualityAction": ["write_quality"],
  // The tiles' records, quick logs and dashboards
  "life/actions.ts#addLifeAction": ["add_record"],
  "life/actions.ts#saveLifeAction": ["change_record"],
  "life/actions.ts#stateLifeAction": ["set_record_state"],
  "life/actions.ts#actLifeAction": ["log_act"],
  "life/actions.ts#sleptAction": ["quick_log"],
  "life/actions.ts#removeLifeAction": ["remove_record"],
  "life/actions.ts#restoreLifeAction": ["restore_record"],
  "life/actions.ts#setFieldAction": ["set_record_field"],
  "life/actions.ts#setAmountAction": ["set_record_field"],
  "life/actions.ts#addWayAction": ["add_record"],
  "life/actions.ts#checkedTodayAction": ["quick_log"],
  "life/actions.ts#setWordsAction": ["set_record_field"],
  "life/dash-actions.ts#logHealthAction": ["quick_log"],
  "life/dash-actions.ts#logFitnessAction": ["quick_log"],
  "life/dash-actions.ts#logFriendAction": ["quick_log"],
  "life/dash-actions.ts#logTimeAction": ["quick_log"],
  "life/work/inspire-action.ts#inspireAction": ["add_record", "change_record"],
  "life/work/space-actions.ts#addOwnAction": ["add_record"],
  "life/work/space-actions.ts#writeTowardAction": ["write_toward"],
  "life/work/space-actions.ts#learningTowardAction": ["change_record"],
  "life/work/space-actions.ts#hoursAction": ["add_record", "change_record"],
  "life/work/space-actions.ts#mainAction": ["main_aim"],
  "life/venture-actions.ts#startNaiveAction": ["start_naive_venture"],
  "life/build-actions.ts#askToBuildFromPage": ["ask_to_build"],
  "life/build-actions.ts#answerBuildFromPage": ["answer_build_request"],
  // Events
  "events/actions.ts#newEventAction": ["host_event"],
  "events/actions.ts#goingAction": ["going_to_event"],
  "events/actions.ts#setPartAction": ["set_event_part"],
  // Meals
  "meals/actions.ts#addMealAction": ["add_meal"],
  "meals/actions.ts#saveMealAction": ["change_record"],
  "meals/actions.ts#removeMealAction": ["remove_record"],
  "meals/actions.ts#planMealAction": ["plan_meal"],
  "meals/actions.ts#unplanMealAction": ["unplan_meal"],
  "meals/actions.ts#likeAction": ["set_record_field"],
  "meals/actions.ts#avoidAction": ["set_record_field"],
  "meals/actions.ts#planMyWeekAction": ["plan_week"],
  "meals/actions.ts#basketAction": ["add_to_basket"],
  "meals/actions.ts#takeFromBasketAction": ["remove_record"],
  "meals/actions.ts#keepRecipeAction": ["keep_recipe"],
  "meals/actions.ts#unplanDayAction": ["unplan_meal"],
  "meals/actions.ts#receiptSpendAction": ["set_receipt"],
  "meals/actions.ts#receiptDropLineAction": ["set_receipt"],
  "meals/actions.ts#receiptKeepAction": ["set_receipt"],
  "meals/actions.ts#receiptRemoveAction": ["remove_record"],
  "meals/actions.ts#runDayAction": ["set_record_field"],
  "meals/actions.ts#startPlanAction": ["start_meal_plan"],
  // Steps on Not yet
  "plan/actions.ts#addStepAction": ["add_record"],
  "plan/actions.ts#saveStepAction": ["change_record"],
  "plan/actions.ts#happenedAction": ["set_record_state"],
  "plan/actions.ts#removeStepAction": ["remove_record"],
  // Learn (Scholē)
  "schole/actions.ts#addFromLibraryAction": ["keep_library_book"],
  "schole/actions.ts#setBookStatusAction": ["set_book_status"],
  "schole/actions.ts#keepClaimAction": ["keep_claim"],
  "schole/actions.ts#setStanceAction": ["set_stance"],
  "schole/actions.ts#setFinishedAction": ["set_finished"],
  "schole/actions.ts#rankWantAction": ["order_want"],
  "schole/actions.ts#setGoalAction": ["set_reading_goal"],
  "schole/actions.ts#addExcerptAction": ["keep_excerpt"],
  "schole/actions.ts#removeExcerptAction": ["remove_excerpt"],
  "schole/actions.ts#reviseExcerptAction": ["revise_excerpt"],
  "schole/actions.ts#restateAction": ["revise_excerpt"],
  "schole/actions.ts#highlightsToJournalAction": ["highlights_to_journal"],
  "schole/actions.ts#followListAction": ["follow_list"],
  "schole/actions.ts#addItemAction": ["add_item"],
  "schole/actions.ts#browseAddAction": ["take_up_item"],
  "schole/actions.ts#keepReasonAction": ["keep_reason", "take_up_item"],
  "schole/actions.ts#changeItemAction": ["change_item"],
  "schole/actions.ts#editItemAction": ["change_item"],
  "schole/actions.ts#removeItemAction": ["remove_item"],
  "schole/actions.ts#restoreItemAction": ["restore_item"],
  "schole/actions.ts#setBookWayAction": ["set_book_way"],
  "schole/actions.ts#addFromItemListAction": ["follow_list"],
  "schole/actions.ts#setUnitDoneAction": ["set_unit_done"],
  "schole/actions.ts#addItemNoteAction": ["add_item_note"],
  "schole/actions.ts#removeItemNoteAction": ["remove_item_note"],
  "schole/actions.ts#setTranscriptAction": ["change_item"],
  "schole/actions.ts#setItemDatesAction": ["change_item"],
  "schole/actions.ts#setItemFactsAction": ["change_item"],
  "schole/actions.ts#addSessionAction": ["add_session"],
  "schole/actions.ts#removeSessionAction": ["remove_session"],
  "schole/actions.ts#addItemSubjectsAction": ["add_item_subjects"],
  "schole/actions.ts#removeItemSubjectAction": ["remove_item_subject"],
  "schole/actions.ts#keepItemClaimAction": ["keep_claim"],
  "schole/actions.ts#setItemStanceAction": ["set_stance"],
  "schole/actions.ts#favoriteEpisodeAction": ["favorite_episode"],
  "schole/actions.ts#reactAction": ["set_reaction"],
  "schole/courses/[instrument]/actions.ts#logPracticeAction": ["log_practice"],
  "schole/courses/[instrument]/actions.ts#learnedAction": ["learned_piece"],
  "schole/dialectic/actions.ts#remindAction": ["add_event"],
  "schole/ideas/actions.ts#writePromptAction": ["start_work"],
  "schole/notes/actions.ts#newNoteAction": ["start_work"],
  "schole/people/actions.ts#followPersonAction": ["follow_person"],
  "schole/topics/actions.ts#followTopicAction": ["follow_topic"],
  "schole/topics/actions.ts#makePlaylistAction": ["make_playlist"],
  "schole/topics/actions.ts#saveMadeAction": ["save_playlist"],
};

/** Routed actions whose page still calls the store itself, and why. */
const DIRECT: Record<string, string> = {
  "journal/actions.ts#saveWorkAction": "The editor's autosave: every save is already a kept version of the work, and logging each would copy the text into the change log many times a minute. The chat saves through save_work.",
};

const IMPORT = "Brings in a file or photo the browser reads; it reaches Reflect only from the page.";
const PUBLISH = "Publishing: never offered to a model (tier never), so not a registry entry.";
const READ = "A read for the page's own list or popup; it changes nothing. The chat reads with find_item, search_library, browse_category and show_ways.";
const PLACE = "The reader or player keeping the person's place as they read or listen; not something a person asks for.";
const OTHERS = "Acts where other people see or answer it (debates, rooms, threads, posts, follows of members, comments): the outside tier, which waits for the person's Send, and is not offered until that exists.";
const EXAM = "An examination is between the person and the examiners they invite; joining, attesting and closing reach other people: outside tier, not offered.";
const SETTINGS = "Settings only: the household others share, invitations, where the person lives, their look and their connections are changed in Settings, never by a model.";

/** Page server actions that are not registry entries, each with its reason. */
const EXCLUDED: Record<string, string> = {
  "events/actions.ts#publishEventAction": "Publishing a hosted event makes it public and makes the door token shown once as the host's check-in QR: a tap on the event's page only, never offered to a model.",
  "events/actions.ts#cancelEventAction": "Cancelling a hosted event reaches everyone who said Going: the outside tier, which waits for the person's tap, so it stays a tap on the event's page.",
  "journal/actions.ts#importWorkAction": IMPORT,
  "meals/actions.ts#readReceiptAction": IMPORT,
  "schole/actions.ts#importGoodreadsAction": IMPORT,
  "schole/actions.ts#importKindleAction": IMPORT,
  "schole/actions.ts#importItemsAction": "Keeps the candidates the person ticked from a file import; part of the import, which reaches Reflect only from the page.",
  "meals/actions.ts#instacartAction": "Sends the shopping list to Instacart and opens its checkout: an outside service where the person pays, so it stays a tap on the page.",
  "schole/actions.ts#publishQuoteAction": PUBLISH,
  "schole/actions.ts#unpublishQuoteAction": PUBLISH,
  "schole/actions.ts#publishLessonAction": PUBLISH,
  "schole/actions.ts#unpublishQuoteFormAction": PUBLISH,
  "schole/actions.ts#defineAction": READ,
  "schole/actions.ts#lookLinkAction": READ,
  "schole/actions.ts#searchItemsAction": READ,
  "schole/browse/actions.ts#moreBooksAction": READ,
  "schole/browse/actions.ts#moreRowsAction": READ,
  "schole/search-action.ts#searchMineAction": READ,
  "schole/actions.ts#keepPlaceAction": PLACE,
  "schole/actions.ts#keepItemPlaceAction": PLACE,
  "schole/actions.ts#keepUnitPlaceAction": PLACE,
  "schole/actions.ts#quizAction": "Writes quiz questions with a model from a transcript; Ask Reflect never writes quizzes (examiners are people).",
  "schole/actions.ts#checkAnswerAction": "The person's own answer to a quiz question; a model never answers for them.",
  "schole/dialectic/practice/actions.ts#playAction": "The person's own marks in a practice round; a model never plays for them.",
  "schole/dialectic/actions.ts#createDebateAction": OTHERS,
  "schole/dialectic/actions.ts#takeSeatAction": OTHERS,
  "schole/dialectic/actions.ts#startDebateAction": OTHERS,
  "schole/dialectic/actions.ts#createRoomAction": OTHERS,
  "schole/dialectic/actions.ts#roomAction": OTHERS,
  "schole/dialectic/actions.ts#createThreadAction": OTHERS,
  "schole/dialectic/actions.ts#postAction": OTHERS,
  "schole/dialectic/actions.ts#removePostAction": OTHERS,
  "schole/dialectic/actions.ts#topicPostAction": OTHERS,
  "schole/dialectic/actions.ts#correctStanceAction": OTHERS,
  "schole/dialectic/actions.ts#regradeAction": OTHERS,
  "schole/dialectic/actions.ts#removeTopicPostAction": OTHERS,
  "schole/dialectic/actions.ts#formDebateAction": OTHERS,
  "schole/dialectic/actions.ts#writeTurnAction": OTHERS,
  "schole/dialectic/actions.ts#repostAction": OTHERS,
  "schole/dialectic/actions.ts#followAction": OTHERS,
  "schole/podcasts/comment-actions.ts#commentAction": OTHERS,
  "schole/podcasts/comment-actions.ts#removeCommentAction": OTHERS,
  "schole/examinations/actions.ts#createExaminationAction": EXAM,
  "schole/examinations/actions.ts#joinExaminationAction": EXAM,
  "schole/examinations/actions.ts#attestAction": EXAM,
  "schole/examinations/actions.ts#closeExaminationAction": EXAM,
  "settings/profile/linkedin/actions.ts#previewLinkedinAction": "Reads the LinkedIn export files the browser unzipped, for the page's preview of what Keep would keep; it saves nothing (import_linkedin keeps them).",
  "settings/actions.ts#startHouseholdAction": SETTINGS,
  "settings/actions.ts#addMemberAction": SETTINGS,
  "settings/actions.ts#saveMemberAction": SETTINGS,
  "settings/actions.ts#removeMemberAction": SETTINGS,
  "settings/actions.ts#leaveHouseholdAction": SETTINGS,
  "settings/actions.ts#inviteAction": SETTINGS,
  "settings/actions.ts#revokeInviteAction": SETTINGS,
  "settings/actions.ts#acceptInviteAction": SETTINGS,
  "settings/actions.ts#savePlaceAction": SETTINGS,
  "settings/actions.ts#chooseWaterAction": SETTINGS,
  "settings/appearance/actions.ts#setLookAction": SETTINGS,
  "settings/connections/actions.ts#addFeedAction": "Connecting a calendar feed fetches an outside address; connections are made in Settings, never by a model.",
  "settings/connections/actions.ts#removeFeedAction": SETTINGS,
  "chat/actions.ts#approveFromChat": "Keep or Send on a held change is the person's tap itself; a model never approves.",
  "chat/actions.ts#declineFromChat": "Decline on a held change is the person's tap itself; a model never declines for them.",
  "life/messages-actions.ts#inviteFriendAction": "An invite link lets another account in; the person makes it on the page, never a model.",
  "life/messages-actions.ts#acceptFriendInviteAction": "Accepting an invite is the invited person's own act while signed in.",
  "events/connect-actions.ts#checkInAction": "Checking in is the person's own tap at the event, while it runs; a model is never at the door.",
  "events/connect-actions.ts#notNowAction": "Not now on a connect request is the person's own answer to another person; a model never turns someone away for them.",
  "settings/connections/actions.ts#disconnectAssistantAction": "Disconnecting an assistant is the person's own act in Settings.",
  "settings/connections/actions.ts#disconnectGoogleAction": "Disconnecting an OAuth connection is the person's own act in Settings.",
  "settings/connections/actions.ts#disconnectMicrosoftAction": "Disconnecting an OAuth connection is the person's own act in Settings.",
};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });
}

type PageAction = { key: string; name: string; body: string; file: string };
/** Every exported function of every "use server" file under app/, with its body (up to the next export). */
function pageActions(): { list: PageAction[]; helpers: Map<string, string> } {
  const list: PageAction[] = [];
  const helpers = new Map<string, string>();
  for (const p of files(APP)) {
    const src = readFileSync(p, "utf8");
    if (!/^\s*["']use server["']/.test(src)) continue;
    const file = relative(APP, p).split("\\").join("/");
    const starts = [...src.matchAll(/^(export )?(async )?function (\w+)|^const (\w+) = /gm)];
    starts.forEach((m, i) => {
      const body = src.slice(m.index!, starts[i + 1]?.index ?? src.length);
      const name = m[3] ?? m[4]!;
      if (m[1] && m[2]) list.push({ key: `${file}#${name}`, name, body, file });
      else helpers.set(`${file}#${name}`, body);
    });
  }
  return { list, helpers };
}

describe("every page action is on the registry", () => {
  const { list, helpers } = pageActions();
  const keys = list.map((a) => a.key);

  it("finds the page server actions", () => {
    expect(list.length).toBeGreaterThan(150);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("leaves no page action unmapped: each has a registry entry or a listed exclusion", () => {
    const unmapped = keys.filter((k) => !(k in ROUTED) && !(k in EXCLUDED));
    expect(unmapped).toEqual([]);
  });

  it("keeps the lists exact: no stale key, none both routed and excluded, every exclusion with its reason", () => {
    for (const k of [...Object.keys(ROUTED), ...Object.keys(EXCLUDED), ...Object.keys(DIRECT)]) expect(keys).toContain(k);
    for (const k of Object.keys(ROUTED)) expect(EXCLUDED[k]).toBeUndefined();
    for (const k of Object.keys(DIRECT)) expect(ROUTED[k]).toBeDefined();
    for (const r of Object.values(EXCLUDED)) expect(r.length).toBeGreaterThan(20);
  });

  it("maps each to registry entries a model is offered", () => {
    for (const [k, ids] of Object.entries(ROUTED)) {
      expect(ids.length, k).toBeGreaterThan(0);
      for (const id of ids) {
        const a = actionById(id);
        expect(a, `${k} -> ${id}`).toBeDefined();
        expect(a!.tier, id).not.toBe("never");
        expect(a!.on, id).toContain("chat");
      }
    }
  });

  it("runs each routed page action through its entry (fromPage, so runAction with source page)", () => {
    // A page action routes when its body calls fromPage, a helper of its file that does, or another routed page action.
    const routes = (body: string, file: string, seen = new Set<string>()): boolean => {
      if (/\bfromPage\(/.test(body)) return true;
      for (const [hk, hb] of helpers) if (hk.startsWith(`${file}#`) && !seen.has(hk) && new RegExp(`\\b${hk.split("#")[1]}\\(`).test(body) && routes(hb, file, new Set([...seen, hk]))) return true;
      return list.some((o) => body !== o.body && new RegExp(`\\b${o.name}\\(`).test(body) && o.key in ROUTED && /\bfromPage\(/.test(o.body));
    };
    const skipped = list.filter((a) => a.key in ROUTED && !(a.key in DIRECT) && !routes(a.body, a.file)).map((a) => a.key);
    expect(skipped).toEqual([]);
    for (const k of Object.keys(DIRECT)) expect(routes(list.find((a) => a.key === k)!.body, k.split("#")[0]!)).toBe(false);
  });

  it("names exactly the entries each page action runs", () => {
    // Registry entries by their exported name, from the files of this folder.
    const idOf = new Map<string, string>();
    for (const f of readdirSync(__dirname).filter((n) => n.endsWith(".ts") && !n.endsWith(".test.ts"))) {
      for (const m of readFileSync(join(__dirname, f), "utf8").matchAll(/export const (\w+) = action\(\{\s*id: "(\w+)"/g)) idOf.set(m[1]!, m[2]!);
    }
    for (const a of list.filter((x) => x.key in ROUTED && !(x.key in DIRECT))) {
      const src = readFileSync(join(APP, a.file), "utf8");
      // The file's imports from the registry: local name to exported name.
      const local = new Map<string, string>();
      for (const m of src.matchAll(/import \{([^}]+)\} from "@\/server\/actions\/[\w-]+"/g)) {
        for (const part of m[1]!.split(",").map((x) => x.trim()).filter(Boolean)) {
          const [exp, as] = part.split(/\s+as\s+/);
          local.set((as ?? exp)!, exp!);
        }
      }
      // What the action runs: its own fromPage calls, those of its file's helpers, and of a routed page action it calls.
      const bodies = [a.body, ...[...helpers].filter(([hk]) => hk.startsWith(`${a.file}#`) && new RegExp(`\\b${hk.split("#")[1]}\\(`).test(a.body)).map(([, hb]) => hb)];
      const ran = new Set(bodies.flatMap((b) => [...b.matchAll(/fromPage\((\w+)/g)].map((m) => idOf.get(local.get(m[1]!) ?? m[1]!) ?? `?${m[1]}`)));
      if (!ran.size) continue; // routed through another page action, checked above
      expect([...ran].sort(), a.key).toEqual([...ROUTED[a.key]!].sort());
    }
  });
});
