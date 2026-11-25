// Ask Reflect plan, step 4: whatever a page can do, chat can do. This lists every page server action statically (each
// export of a "use server" file under web/src/app) and fails when one has no registry entry and no listed exclusion,
// when a routed one does not run its entry through runAction (fromPage, ./page.ts), or when the lists go stale.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import * as vaultActions from "@reflect/core/vault-actions";
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
  "settings/site/actions.ts#setTemplateFromSettings": ["set_site_template"],
  // The Publish sheet, through the presentation gate (Reflect framework plan, step 6): draft the record, then publish,
  // which is held and runs only on the person's tap with a record that passes the gate.
  "journal/w/[id]/publish-actions.ts#draftSitePresentationAction": ["draft_presentation"],
  "journal/w/[id]/publish-actions.ts#publishWorkAction": ["publish_to_site"],
  // Settings, Account (Profiles and accounts, 2026-11-18)
  "settings/account/actions.ts#saveHandleAction": ["set_handle"],
  "settings/account/actions.ts#saveNameAction": ["set_name"],
  "settings/account/actions.ts#chooseAudienceAction": ["set_default_audience"],
  // Settings, Dashboard: the morning brief's opt-in (dashboard, 2026-11-18)
  "settings/dashboard/actions.ts#setMorningBriefFromPage": ["set_morning_brief"],
  // Socials (Profiles and accounts, 2026-11-18)
  "settings/profile/socials/actions.ts#addSocialFromPage": ["add_social", "remove_social"],
  "settings/profile/socials/actions.ts#removeSocialFromPage": ["remove_social"],
  "settings/profile/socials/actions.ts#confirmSocialFromPage": ["confirm_social"],
  // Settings, Profile, LinkedIn: keep an export, remove the connections
  "settings/profile/linkedin/actions.ts#keepLinkedinAction": ["import_linkedin"],
  "settings/profile/linkedin/actions.ts#removeLinkedinConnectionsFromPage": ["remove_linkedin_connections"],
  // The dashboard's own taps (move a Today item to the next day, Connect back, Undo in its toast)
  "dashboard/actions.ts#moveToNextDayAction": ["change_event"],
  "dashboard/actions.ts#connectBackFromDashboard": ["connect_with"],
  "dashboard/actions.ts#undoFromDashboard": ["undo_change"],
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
  "schole/qualities/actions.ts#toggleQualityAction": ["toggle_quality"],
  "schole/qualities/actions.ts#takeOffQualityAction": ["take_off_quality"],
  "schole/qualities/actions.ts#writeQualityAction": ["write_quality"],
  // Crafts (Scholē landing design guide, 2026-11-19)
  "life/work/crafts/actions.ts#keepCraftAction": ["keep_craft"],
  "life/work/crafts/actions.ts#saveCraftAnswersAction": ["save_craft_answers"],
  "life/work/crafts/actions.ts#savePicksAction": ["save_craft_picks"],
  "life/work/paths-actions.ts#startPathAction": ["start_path"],
  "life/work/paths-actions.ts#pathStepAction": ["path_step"],
  "life/work/crafts/actions.ts#setCraftStateAction": ["set_craft_state"],
  "life/work/crafts/actions.ts#setCraftStageAction": ["set_craft_stage"],
  "life/work/crafts/actions.ts#setCraftLearnedAction": ["set_craft_learned"],
  "life/work/crafts/actions.ts#craftActAction": ["craft_act"],
  "life/work/crafts/actions.ts#setCraftVouchAction": ["set_craft_vouch"],
  // Get to know you (design guide "Get to know you: person dashboard", 2026-11-19)
  "me/actions.ts#pickAction": ["pick_interest"],
  "me/actions.ts#setInterestAction": ["set_interest"],
  "me/actions.ts#setAreaAction": ["set_interest_area"],
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
  "meetings/[id]/prep/actions.ts#savePrepItemAction": ["set_meeting_prep"],
  "meetings/[id]/prep/actions.ts#removePrepItemAction": ["set_meeting_prep"],
  "meetings/[id]/prep/actions.ts#setPrepMarkAction": ["set_meeting_prep"],
  "meetings/[id]/prep/actions.ts#draftPrepAction": ["set_meeting_prep"],
  "meetings/[id]/prep/actions.ts#practiceRehearsedAction": ["set_meeting_prep"],
  "events/actions.ts#goingAction": ["going_to_event"],
  "events/actions.ts#setPartAction": ["set_event_part"],
  // Meetings: + New meeting
  "meetings/actions.ts#newMeetingAction": ["schedule_meeting"],
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
const SITE_PAGE = "Writing a page of the person's site in the site editor (add, autosave, title, address, remove): pages are public once published, so they are kept to the editor; chat reads them through /api/site/pages.";
const PUBLISH = "Publishing: never offered to a model (tier never), so not a registry entry.";
const READ = "A read for the page's own list or popup; it changes nothing. The chat reads with find_item, search_library, browse_category and show_ways.";
const PLACE = "The reader or player keeping the person's place as they read or listen; not something a person asks for.";
const OTHERS = "Acts where other people see or answer it (debates, rooms, threads, posts, follows of members, comments): the outside tier, which waits for the person's Send, and is not offered until that exists.";
const EXAM = "An examination is between the person and the examiners they invite; joining, attesting and closing reach other people: outside tier, not offered.";
const SETTINGS = "Settings only: the household others share, invitations, where the person lives, their look and their connections are changed in Settings, never by a model.";

/** Page server actions that are not registry entries, each with its reason. */
const EXCLUDED: Record<string, string> = {
  "m/[token]/actions.ts#acceptInviteAction": "Accepting an invite ties the signed-in account to a meeting and may mark it a guest account: only the invitee's own tap on the invite page, never a model.",
  "meetings/[id]/actions.ts#setPartAction": "The host sets one part of the meeting from its row on the page (store setMeetingPart); the chat's equivalent is set_meeting_part.",
  "meetings/[id]/actions.ts#setCancelledAction": "Cancelling or restoring a meeting reaches every guest, so it stays a tap on the meeting page.",
  "meetings/[id]/actions.ts#inviteGuestAction": "Inviting a guest emails an outside person a link that opens the meeting: a tap on the page only.",
  "meetings/[id]/actions.ts#removeGuestAction": "Removing a guest stops their link from opening the meeting, which affects another person: a tap on the page only.",
  "meetings/[id]/actions.ts#setNotesAction": "The host saves the notes from the page's textarea (store setNotes); the chat's equivalent is set_meeting_notes.",
  "meetings/[id]/actions.ts#setNotesSharedAction": "Sharing notes, or taking them back, shows sealed notes and follow-ups to guests: a tap on the page only.",
  "meetings/[id]/actions.ts#addFollowupAction": "The host adds a follow-up from the page's form; the chat's equivalent is add_meeting_followup.",
  "meetings/[id]/actions.ts#setFollowupDoneAction": "Ticking a follow-up done, or unticking it, from its box on the meeting page.",
  "meetings/[id]/actions.ts#removeFollowupAction": "Removing a follow-up from its row on the meeting page.",
  "dashboard/actions.ts#refreshBriefAction": "Writes the dashboard's morning brief again with a model from the person's own records and keeps it for the day; it changes no record, and the chat answers the same question from its own reads.",
  "events/actions.ts#publishEventAction": "Publishing a hosted event makes it public and makes the door token shown once as the host's check-in QR: a tap on the event's page only, never offered to a model.",
  "site/pages/actions.ts#addPageAction": SITE_PAGE,
  "site/pages/actions.ts#savePageAction": SITE_PAGE,
  "site/pages/actions.ts#setPageTitleAction": SITE_PAGE,
  "site/pages/actions.ts#setPagePathAction": SITE_PAGE,
  "site/pages/actions.ts#removePageAction": SITE_PAGE,
  "site/pages/actions.ts#publishPageAction": "Publishing a site page makes it public: a tap on Publish in the site editor only, never offered to a model, like publishing a post.",
  "site/pages/actions.ts#unpublishPageAction": "Taking a site page down is the counterpart of Publish, which stays the person's own tap in the site editor.",
  "site/pages/actions.ts#partsForLibraryAction": "Reads the parts the person may put on their site when the editor's library opens; it changes nothing, and chat reads the same through /api/site/pages/parts.",
  "site/pages/actions.ts#shareOnSiteAction": "Sharing a part of a tile or the household on the person's public site makes it public: the owner confirms it in the library, never a model.",
  "site/pages/actions.ts#unshareOnSiteAction": "Stops showing a part on the person's public site; the counterpart of sharing, which stays the owner's tap.",
  "site/pages/actions.ts#okHouseholdPartAction": "The household's creator gives their OK for a member's household part to go on that member's public site: a person's own tap on Settings, Household, never a model.",
  "events/actions.ts#cancelEventAction": "Cancelling a hosted event reaches everyone who said Going: the outside tier, which waits for the person's tap, so it stays a tap on the event's page.",
  "journal/actions.ts#importWorkAction": IMPORT,
  "meals/actions.ts#readReceiptAction": IMPORT,
  "schole/actions.ts#importGoodreadsAction": IMPORT,
  "schole/actions.ts#importKindleAction": IMPORT,
  "schole/actions.ts#importItemsAction": "Keeps the candidates the person ticked from a file import; part of the import, which reaches Reflect only from the page.",
  "meals/actions.ts#instacartAction": "Sends the shopping list to Instacart and opens its checkout: an outside service where the person pays, so it stays a tap on the page.",
  "p/[key]/actions.ts#subscribeToSite": "A visitor asks for someone's writing by email on that person's site; it is the visitor's act on someone else's page and changes no record of the person asking, so no model is offered it.",
  "settings/site/actions.ts#saveDomainAction": "Your own domain's steps: they save a domain name, check public DNS and add it to the host, outside services read from this page only, so they stay taps on Settings.",
  "settings/site/actions.ts#removeDomainAction": "Your own domain's steps: they save a domain name, check public DNS and add it to the host, outside services read from this page only, so they stay taps on Settings.",
  "settings/site/actions.ts#checkDomainAction": "Your own domain's steps: they save a domain name, check public DNS and add it to the host, outside services read from this page only, so they stay taps on Settings.",
  "marketplace/actions.ts#connectAction": "A connector's sign-in happens in the person's own browser at the service, and disconnecting clears that sign-in, which only a new sign-in brings back; both stay taps on the marketplace.",
  "marketplace/actions.ts#addCustomAction": "A connector's sign-in happens in the person's own browser at the service, and disconnecting clears that sign-in, which only a new sign-in brings back; both stay taps on the marketplace.",
  "marketplace/actions.ts#disconnectAction": "A connector's sign-in happens in the person's own browser at the service, and disconnecting clears that sign-in, which only a new sign-in brings back; both stay taps on the marketplace.",
  "studio/v/[slug]/integrations/actions.ts#connectIntegration": "The business console's Connect (V24) is the same sign-in in the person's own browser at the service as the marketplace's connectAction, so it stays a tap.",
  "studio/v/[slug]/integrations/actions.ts#connectAnother": "Connect another account (V26) is a second sign-in in the person's own browser at the service, as Connect is, so it stays a tap.",
  "studio/v/[slug]/integrations/actions.ts#disconnectIntegration": "The business console's Disconnect (V26) clears the sign-in as the marketplace's disconnectAction does, which only a new sign-in brings back, so it stays a tap.",
  "studio/v/[slug]/integrations/explain.ts#explainRecommendation": "Reads only: a model restates the factors behind one recommendation, citing each; it changes nothing, and the chat can already read the catalog.",
  "studio/v/[slug]/integrations/actions.ts#saveBusinesses": "Chooses which of the person's businesses may use a connection they signed in to; ticks beside the connection in the business console, so a model never widens its own reach.",
  "studio/v/[slug]/integrations/actions.ts#useHere": "Adds this business to a connection the person kept to others; a tap on the integration's page, so a model never widens its own reach.",
  "settings/site/actions.ts#pushSiteAction": "Pushes the person's site to their own GitHub through their GitHub connector, an outside service; it stays a tap on the page.",
  "settings/site/actions.ts#linkRepoAction": "Reads the person's own repository through their GitHub connector to link their self-hosted site; a tap on the Your own site on GitHub page.",
  "settings/site/actions.ts#unlinkRepoAction": "Stops committing posts to the person's linked repository; a setting tapped on the Your own site on GitHub page.",
  "settings/site/actions.ts#setDataFolderAction": "Names the folder of the linked repository that gets profile.json and index.json; a setting typed on the Your own site on GitHub page.",
  "marketplace/actions.ts#addPluginAction": "Adds a plugin, whose skill then shapes every answer of Ask Reflect; the person chooses it on the plugin's page, never a model.",
  "marketplace/actions.ts#removePluginAction": "Removes a plugin the person added; a tap on the plugin's page, beside Add, so a model never changes its own instructions.",
  "marketplace/actions.ts#saveSkillAction": "Writes a skill that shapes every answer of Ask Reflect; the person writes it on the skill's page, so a model never writes its own instructions.",
  "marketplace/actions.ts#toggleSkillAction": "Turns one of the person's skills on or off; a switch beside the skill, so a model never changes its own instructions.",
  "marketplace/actions.ts#removeSkillAction": "Removes one of the person's skills; a tap on the skill's page, so a model never changes its own instructions.",
  "settings/site/actions.ts#deploySiteAction": "Deploys the person's site to their own Vercel through their Vercel connector, an outside service; it stays a tap on the page.",
  "journal/w/[id]/publish-actions.ts#unpublishWorkAction": "Taking a post down from the person's site removes what is public; it stays the person's tap on the work's page and is not gated, since nothing new goes before others.",
  "journal/w/[id]/publish-actions.ts#republishAction": "Undo of Unpublish puts back the post the person approved through the presentation gate before; it stays a tap on the toast.",
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
  "settings/appearance/actions.ts#setAppearanceButtonAction": SETTINGS,
  "settings/connections/actions.ts#addFeedAction": "Connecting a calendar feed fetches an outside address; connections are made in Settings, never by a model.",
  "settings/connections/actions.ts#removeFeedAction": SETTINGS,
  "chat/actions.ts#approveFromChat": "Keep or Send on a held change is the person's tap itself; a model never approves.",
  "chat/actions.ts#declineFromChat": "Decline on a held change is the person's tap itself; a model never declines for them.",
  "life/messages-actions.ts#inviteFriendAction": "An invite link lets another account in; the person makes it on the page, never a model.",
  "life/messages-actions.ts#acceptFriendInviteAction": "Accepting an invite is the invited person's own act while signed in.",
  "events/connect-actions.ts#checkInAction": "Checking in is the person's own tap at the event, while it runs; a model is never at the door.",
  "dashboard/actions.ts#notNowFromDashboard": "Not now on a connect request is the person's own answer to another person; a model never turns someone away for them.",
  "dashboard/actions.ts#saveLayoutAction": "Saves the dashboard's layout straight to its store for now; the registry entry set_dashboard_card is the dashboard inline builder's, and this moves onto it once that lands.",
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
      const src = readFileSync(join(__dirname, f), "utf8");
      for (const m of src.matchAll(/export const (\w+) = action\(\{\s*id: "(\w+)"/g)) idOf.set(m[1]!, m[2]!);
      // An entry built from a core declaration (@reflect/core/vault-actions), such as draft_presentation, by its spread.
      for (const m of src.matchAll(/export const (\w+) = action\(\{\s*\.\.\.(\w+),/g)) {
        const decl = (vaultActions as Record<string, unknown>)[m[2]!] as { id?: string } | undefined;
        if (decl?.id) idOf.set(m[1]!, decl.id);
      }
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
