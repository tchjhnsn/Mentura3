// Tests meetings with agents offline (Naive EE-200): a meeting that walks strategy/intake is built from Naive's
// workflow, written through Naive's router as the facilitator and checked against Naive's meeting schema at every step;
// the graph stops on each item that asks a person, works agent items through the worker, skips, hands off, loops back
// to skipped items, closes with a derived outcome and takeaways, and calls the close hook once; a stopped meeting
// resumes from its checkpoint file in a new graph, as from another process. The slash commands drive the same meeting,
// refuse an answer the meeting is not waiting for, and list what is skipped. An agent's memory is rendered from closed
// meetings; the tool rubric rules out a tool that hides activity or locks data in. Nothing here calls a model.
//
//   node agents/meetings-test.ts

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { schemaFailure } from "naive-framework/src/router/write-effects.mjs";
import { naivePath } from "../naive.ts";
import { openMeetingSaver } from "./checkpoint.ts";
import { parseCommand, runCommand, type CommandContext } from "./commands.ts";
import { rankDue } from "./command-host.ts";
import { meetingGraph, questionOf, type Worker } from "./meeting-graph.ts";
import { closeOf, facilitatorEntry, freeMeeting, itemRunId, meetingFromWorkflow, meetingsIn, routerStore, workflowOf, type Meeting } from "./meetings.ts";
import { taskOf } from "./meeting-worker.ts";
import { memoryOf, writeMemory } from "./memory.ts";
import { scoreTools } from "./tool-policy.ts";
import { explain, matches, policy, prerequisitesOf, requiresOf, type Lookup } from "./prerequisites.ts";
import { acceptHeld, markdownOf, printCopy } from "./review.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = "") => { console.log(`${cond ? "pass" : "FAIL"}  ${name}${cond || !detail ? "" : `: ${detail}`}`); if (!cond) failed++; };

// ---- A venture whose team plan staffs the facilitator, written as a person would ----
const ws = mkdtempSync(join(tmpdir(), "mentura-meetings-"));
const init = spawnSync("node", [naivePath("packages/naive/src/engine/init-venture.mjs"), join(ws, "kettle"), "kettle", "--layers", "purpose"], { encoding: "utf8" });
if (init.status !== 0) throw new Error(init.stderr);
const dir = join(ws, "kettle");
process.env.MENTURA_WORKSPACE = ws;
for (const k of ["MENTURA_ACTOR", "MENTURA_ACTOR_ID", "MENTURA_SESSION", "MENTURA_TRACE_ID", "MENTURA_SPAN_ID"]) delete process.env[k];
mkdirSync(join(dir, "operations"), { recursive: true });
writeFileSync(join(dir, "operations/team-plan.json"), JSON.stringify({ venture: "kettle", roles: [{ id: "founder", occupant: "person", needed_by: "discovery", status: "filled" }, { ...facilitatorEntry, needed_by: "discovery", status: "filled" }] }, null, 2));
const store = routerStore({ venture: "kettle", workspace: ws });
const valid = (m: Meeting | null): boolean => m !== null && schemaFailure("meeting.schema.json", m) === null;

// ---- 1. A meeting built from Naive's workflow ----
const wf = workflowOf("strategy", "intake");
const NOW = "2026-11-26T20:00:00.000Z";
const planned = meetingFromWorkflow(wf, { called_by: "torian", person: "torian", now: NOW });
ok("a workflow meeting has one pending item per step, in order, owned by the function's agent", planned.agenda.length === wf.steps.length
  && planned.agenda.every((i, n) => i.step === wf.steps[n].id && i.status === "pending" && i.owner === "strategy-agent"));
ok("an asking step is an item that waits for a person", planned.agenda.filter((i) => i.ask).length === wf.steps.filter((s) => s.ask).length && wf.steps.some((s) => s.ask));
ok("the planned meeting passes Naive's meeting schema", valid(planned), schemaFailure("meeting.schema.json", planned) ?? "");
ok("its id starts with the minute and names the workflow", /^202611262000-strategy-intake$/.test(planned.id), planned.id);
ok("the item run id is a stable UUID per meeting, item and attempt", itemRunId("m", "a", 1) === itemRunId("m", "a", 1) && itemRunId("m", "a", 1) !== itemRunId("m", "a", 2)
  && /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(itemRunId("m", "a", 1)));
const t = taskOf(planned, planned.agenda[1], "To teach founders", "work");
ok("an item's task names the meeting's goal, the step's skill and writes, and the person's answer", t.includes(planned.goal) && t.includes("telos") && t.includes("foundation/goals/[id]") && t.includes("To teach founders"));

// ---- 2. The graph walks it ----
const calls: string[] = [];
const worker: Worker = {
  async work(_m, item, answer) { calls.push(`work ${item.id}${answer ? ` <${answer}>` : ""}`); if (item.id === "read-what-exists" && calls.filter((c) => c.startsWith("work read")).length === 1 && process.env.FAIL_FIRST) throw new Error("model down"); return item.step === "ask-telos" ? { result: `${item.id} worked`, writes: ["foundation/goals/telos (held for a person)"], held: ["foundation/goals/telos"] } : { result: `${item.id} worked`, writes: [] }; },
  async recommend(_m, item) { calls.push(`recommend ${item.id}`); return { recommendation: `Recommend testing ${item.id} with two interviews`, decisions: [`${item.id}-options`] }; },
};
let closedHook = 0;
const accepted: string[] = [];
// Stands in for review.ts acceptHeld: a foundation draft is accepted only by name.
const approve = async (_m: Meeting, _i: unknown, held: string[], _by: string, confirm: string[]): Promise<string[]> => {
  const unnamed = held.filter((r) => r.startsWith("foundation/") && !confirm.includes(r));
  if (unnamed.length) throw new Error(`a foundation record is accepted only by name: ${unnamed.join(" ")}`);
  accepted.push(...held); return held;
};
const none = async () => [];
const base = { store, worker, approve, prerequisites: none, present: async (m: Meeting, i: { id: string }) => `.naive/presentations/${m.id}/${i.id}.md`, now: () => NOW };
const saver = openMeetingSaver(dir);
const graph = meetingGraph({ ...base, checkpointer: saver, closed: async () => { closedHook++; } });
const cfg = { configurable: { thread_id: planned.id }, recursionLimit: 500 };
await store.write(planned);
let out = await graph.invoke({ meeting: planned }, cfg);
let q = questionOf(out);
let rec = await store.read(planned.id);
ok("opening writes the meeting open, through the router, valid", rec?.status === "open" && rec.opened_at === NOW && valid(rec));
ok("the agent item before the first ask is worked without a person, then presented for approval, not done", calls[0] === "work read-what-exists" && rec?.agenda[0].status === "pending" && q?.kind === "review" && q.item.id === "read-what-exists" && q.copy?.endsWith("read-what-exists.md") === true, JSON.stringify(q));
ok("the presentation is in the minutes", (rec?.minutes ?? []).some((n) => n.item === "read-what-exists" && /Presented for approval/.test(n.text)));
out = await graph.invoke(new Command({ resume: { rework: "Also read the competitor records", by: "torian" } }), cfg);
q = questionOf(out);
ok("a rework sends it back to its agent with the note and presents it again", calls.includes("work read-what-exists <Also read the competitor records>") && q?.kind === "review" && q.item.id === "read-what-exists");
out = await graph.invoke(new Command({ resume: { approve: true, by: "torian" } }), cfg);
q = questionOf(out);
rec = await store.read(planned.id);
ok("approving makes it done and moves on", rec?.agenda[0].status === "done" && (rec?.minutes ?? []).some((n) => n.by === "torian" && /^Approved/.test(n.text)));
ok("the graph stops on the first item that asks a person", q?.kind === "item" && q.item.id === "ask-telos", JSON.stringify(q));
ok("the stop is in the record: that item is still pending", rec?.agenda.find((i) => i.id === "ask-telos")?.status === "pending");
saver.close();

// A new graph over the same checkpoint file, as another process would open it.
const saver2 = openMeetingSaver(dir);
const graph2 = meetingGraph({ ...base, checkpointer: saver2, closed: async () => { closedHook++; } });
out = await graph2.invoke(new Command({ resume: { answer: "To teach founders to run a business with agents", by: "torian" } }), cfg);
q = questionOf(out);
ok("a resume from another process works the item with the person's words and presents the held draft", calls.includes("work ask-telos <To teach founders to run a business with agents>") && q?.kind === "review" && q.held.join() === "foundation/goals/telos", JSON.stringify(q));
out = await graph2.invoke(new Command({ resume: { approve: true, by: "torian" } }), cfg);
q = questionOf(out);
rec = await store.read(planned.id);
ok("an approval that does not name a held foundation record accepts nothing and stays in review", q?.kind === "review" && accepted.length === 0 && rec?.agenda.find((i) => i.id === "ask-telos")?.status === "pending" && (rec?.minutes ?? []).some((n) => /Not approved yet: a foundation record is accepted only by name/.test(n.text)));
out = await graph2.invoke(new Command({ resume: { approve: true, by: "torian", confirm: ["foundation/goals/telos"] } }), cfg);
q = questionOf(out);
rec = await store.read(planned.id);
ok("naming it accepts the draft and the item is done", accepted.join() === "foundation/goals/telos" && rec?.agenda.find((i) => i.id === "ask-telos")?.status === "done" && (rec?.minutes ?? []).some((n) => /accepted foundation\/goals\/telos/.test(n.text)));
ok("the person's words and the agent's result are in the minutes", (rec?.minutes ?? []).some((n) => n.by === "torian" && n.item === "ask-telos") && (rec?.minutes ?? []).some((n) => n.by === "strategy-agent" && n.item === "ask-telos"));
ok("held writes are kept on the item", rec?.agenda.find((i) => i.id === "ask-telos")?.writes?.[0] === "foundation/goals/telos (held for a person)");
ok("it stops on the next asking item", q?.kind === "item" && q.item.id === "ask-problem-and-customer", JSON.stringify(q));

out = await graph2.invoke(new Command({ resume: { skip: true, by: "torian", why: "need interviews first" } }), cfg);
q = questionOf(out);
ok("a skip marks the item skipped with why, and moves on", (await store.read(planned.id))?.agenda.find((i) => i.id === "ask-problem-and-customer")?.status === "skipped" && q?.kind === "item" && q.item.id !== "ask-problem-and-customer");
// Hand off the next, skip or answer the rest until the loop-back question.
let guard = 0;
let first = true;
while ((q?.kind === "item" || q?.kind === "review") && guard++ < 20) {
  const answer = q.kind === "review" ? { approve: true as const, by: "torian" } : first ? { handoff: true as const, by: "torian" } : { skip: true as const, by: "torian" };
  if (q.kind === "item") first = false;
  out = await graph2.invoke(new Command({ resume: answer }), cfg);
  q = questionOf(out);
}
rec = await store.read(planned.id);
const handed = rec?.agenda.find((i) => i.status === "handed-off");
ok("a handoff runs the owner's recommendation and records it", !!handed && handed.handed_to === "strategy-agent" && /Recommend testing/.test(handed.recommendation ?? "") && (handed.decisions ?? []).length === 1);
ok("with nothing pending and items skipped, the graph asks to loop back", q?.kind === "loop" && q.skipped.length >= 1, JSON.stringify(q));
ok("the record stays valid while open", valid(rec));

const back = q?.kind === "loop" ? q.skipped[0].id : "";
out = await graph2.invoke(new Command({ resume: { revisit: [back], by: "torian" } }), cfg);
q = questionOf(out);
ok("revisiting puts the item back on the agenda and stops on it", q?.kind === "item" && q.item.id === back);
out = await graph2.invoke(new Command({ resume: { done: "Founders who run software businesses alone", by: "torian" } }), cfg);
q = questionOf(out);
ok("done with the person's words needs no agent", (await store.read(planned.id))?.agenda.find((i) => i.id === back)?.result === "Founders who run software businesses alone" && !calls.includes(`work ${back}`));
ok("it asks to loop back again over what is still skipped", q?.kind === "loop");
out = await graph2.invoke(new Command({ resume: { end: true, by: "torian" } }), cfg);
rec = await store.read(planned.id);
ok("end closes the meeting: closed_at, outcome partly, valid", rec?.status === "closed" && rec.closed_at === NOW && rec.outcome?.reached === "partly" && valid(rec), schemaFailure("meeting.schema.json", rec) ?? "");
ok("the outcome names the follow-up and the decisions raised", /revisit/.test(rec?.outcome?.follow_up ?? "") && (rec?.outcome?.decisions ?? []).length === 1);
ok("the agent takes away what it worked; the person what waits on them", (rec?.takeaways ?? []).some((x) => x.attendee === "strategy-agent" && /ask-telos/.test(x.text)) && (rec?.takeaways ?? []).some((x) => x.attendee === "torian" && /Waiting on you/.test(x.text)));
ok("the close hook ran once", closedHook === 1, String(closedHook));
ok("the run ended: no question", questionOf(out) === null);
saver2.close();

// ---- 3. closeOf is derived ----
const allDone = { ...planned, agenda: planned.agenda.map((i) => ({ ...i, status: "done" as const, result: "ok" })) };
ok("every item done is reached yes; none done is no", closeOf(allDone).outcome?.reached === "yes" && closeOf({ ...planned, agenda: planned.agenda.map((i) => ({ ...i, status: "skipped" as const })) }).outcome?.reached === "no");

// ---- 4. Memory from closed meetings ----
const mem = memoryOf(meetingsIn(dir), "strategy-agent");
ok("an agent's memory lists its takeaways and every closed meeting's outcome", mem.includes(planned.id) && /What you took away/.test(mem) && /Outcome partly/.test(mem));
ok("another agent sees the closed meeting's outcome but takes away nothing of its own", /Outcome partly/.test(memoryOf(meetingsIn(dir), "finance-agent")) && /Nothing yet/.test(memoryOf(meetingsIn(dir), "finance-agent")));
ok("writeMemory renders it where the /memory/ mount reads", writeMemory(dir, "strategy-agent") === "/memory/MEMORY.md" && existsSync(join(dir, ".naive/agent-memory/strategy-agent/MEMORY.md")));

// ---- 5. Slash commands ----
ok("parse: /meet with and without a workflow", JSON.stringify(parseCommand("/meet strategy")) === JSON.stringify({ kind: "meet", function: "strategy" }) && parseCommand("/meet strategy intake").kind === "meet");
ok("parse: /answer keeps the whole text", (parseCommand("/answer m1 To teach   founders") as { text: string }).text === "To teach   founders");
const ag = parseCommand("/agenda Pricing | Pick a first price | a pricing decision; a test plan | read the market @strategy; ask: what would you pay; draft the test @finance");
ok("parse: /agenda reads owners and asks", ag.kind === "agenda" && ag.items.length === 3 && ag.items[0].owner === "strategy" && ag.items[1].ask === true && ag.items[2].owner === "finance");
ok("parse: an unknown command lists the commands", (() => { try { parseCommand("/fly"); return false; } catch (e) { return /\/meet/.test(String(e)); } })());

const csaver = new MemorySaver();
const locked = (w: string) => w.startsWith("marketing-and-sales/");
const ctx: CommandContext = { venture: "kettle", dir, person: "torian", store, worker, checkpointer: csaver, approve, present: base.present,
  check: async (w) => locked(w) ? { workflow: w, met: false, missing: [{ kind: "meeting", what: "strategy/intake", why: "Strategy comes first.", fix: "/meet strategy intake" }] } : { workflow: w, met: true, missing: [] },
  workflows: () => ["strategy/intake", "marketing-and-sales/intake"],
  due: async () => [{ workflow: "strategy/intake", why: "it has not finished once" }], ask: async (fn, task) => `${fn}: ${task.slice(0, 20)}`, now: () => "2026-11-26T21:00:00.000Z" };
let r = await runCommand(parseCommand("/next"), ctx);
ok("/next lists what is due with its /meet command", r.ok && "text" in r && r.text.startsWith("/meet strategy intake"));
r = await runCommand(parseCommand("/meet strategy"), ctx);
const mid = r.ok && "meeting" in r ? r.meeting.id : "";
ok("/meet with no workflow opens what is due and stops for approval of the first agent item", r.ok && "meeting" in r && r.meeting.status === "open" && r.waiting?.kind === "review" && mid.endsWith("strategy-intake"), JSON.stringify(r));
r = await runCommand(parseCommand(`/end ${mid}`), ctx);
ok("/end is refused while the meeting waits on approval, naming the print copy", !r.ok && "error" in r && /waits on your approval of read-what-exists \(read .naive\/presentations\//.test(r.error), JSON.stringify(r));
r = await runCommand(parseCommand(`/approve ${mid}`), ctx);
ok("/approve goes on to the first ask, and offers the next commands", r.ok && "waiting" in r && r.waiting?.kind === "item" && r.waiting.item.id === "ask-telos" && (r.next ?? []).some((h) => h.startsWith(`/answer ${mid}`)));
r = await runCommand(parseCommand(`/approve ${mid}`), ctx);
ok("/approve is refused while the meeting waits on an item, not a review", !r.ok && "error" in r && /waits on ask-telos/.test(r.error), JSON.stringify(r));
r = await runCommand(parseCommand(`/skip ${mid} later`), ctx);
ok("/skip moves to the next item", r.ok && "waiting" in r && r.waiting?.kind === "item" && r.waiting.item.id !== "ask-telos");
const before = (await store.read(mid))?.agenda.find((i) => i.status === "pending");
r = await runCommand(parseCommand(`/answer ${mid} Founders alone`), ctx);
ok("an agent's answered item waits on /approve, with the approve command offered", r.ok && "waiting" in r && r.waiting?.kind === "review" && (r.next ?? []).some((h) => h.startsWith(`/approve ${mid}`)), JSON.stringify(r));
r = await runCommand(parseCommand(`/approve ${mid}`), ctx);
ok("/approve marks it done and goes on", r.ok && (await store.read(mid))?.agenda.find((i) => i.id === before?.id)?.status === "done");
r = await runCommand(parseCommand(`/abandon ${mid} wrong week`), ctx);
ok("/abandon ends the meeting as abandoned, valid", r.ok && "meeting" in r && r.meeting.status === "abandoned" && valid(await store.read(mid)));
r = await runCommand(parseCommand("/skipped"), ctx);
ok("/skipped lists skipped and handed-off items across meetings", r.ok && "text" in r && r.text.includes(planned.id) && /handed-off: Recommend/.test(r.text));
r = await runCommand(parseCommand("/meet marketing-and-sales intake"), ctx);
ok("/meet on a locked workflow is refused, saying what to finish first, and writes nothing", !r.ok && "error" in r && /locked until/.test(r.error) && /\/meet strategy intake/.test(r.error) && !meetingsIn(dir).some((m) => m.workflow === "marketing-and-sales/intake"), JSON.stringify(r));
r = await runCommand(parseCommand("/blocked"), ctx);
ok("/blocked lists each locked workflow and what unlocks it", r.ok && "text" in r && /marketing-and-sales\/intake is locked/.test(r.text) && !/strategy\/intake is locked/.test(r.text));
// The graph checks again on open: a meeting written by any other path still does not open while locked.
const sneaky = meetingFromWorkflow(workflowOf("marketing-and-sales", "intake"), { called_by: "torian", now: NOW });
const lockedGraph = meetingGraph({ ...base, checkpointer: new MemorySaver(), prerequisites: async () => [{ kind: "meeting" as const, what: "strategy/intake", why: "Strategy comes first.", fix: "/meet strategy intake" }] });
await store.write(sneaky);
let threw = "";
try { await lockedGraph.invoke({ meeting: sneaky }, { configurable: { thread_id: sneaky.id } }); } catch (err) { threw = String((err as Error).message); }
ok("the graph refuses to open a locked meeting and it stays planned", /locked until/.test(threw) && (await store.read(sneaky.id))?.status === "planned", threw);
r = await runCommand(parseCommand("/agenda Pricing | Pick a first price | a pricing decision | read the market @strategy; ask: what would you pay"), ctx);
const fid = r.ok && "meeting" in r ? r.meeting.id : "";
ok("/agenda opens a free meeting: the agent item is worked and waits on approval", r.ok && "waiting" in r && r.waiting?.kind === "review" && r.waiting.item.title === "read the market");
r = await runCommand(parseCommand(`/approve ${fid}`), ctx);
ok("then the asking item waits", r.ok && "waiting" in r && r.waiting?.kind === "item" && r.waiting.item.title === "what would you pay");
r = await runCommand(parseCommand("/tools record sales calls with leads"), ctx);
ok("/tools asks the IT agent with the tooling skill", r.ok && "text" in r && r.text.startsWith("it: Recommend tooling"));
r = await runCommand(parseCommand("/meetings"), ctx);
ok("/meetings lists each meeting with what it waits on", r.ok && "text" in r && /waits on/.test(r.text) && /abandoned/.test(r.text));
ok("a free meeting passes the schema", valid(freeMeeting({ title: "T", goal: "G", outcome_expected: ["x"], items: [{ title: "a" }], called_by: "torian", functions: ["strategy"], now: NOW })));

// ---- 5b. Prerequisites fail closed ----
ok("patterns: * matches any function or workflow", matches("*/intake", "it/intake") && !matches("*/intake", "it/quarterly-access-review") && matches("*/*", "a/b") && matches("strategy/*", "strategy/intake"));
const P = policy();
const req = (w: string) => requiresOf(w, undefined, P).map((r) => `${r.kind}:${r.what}`);
ok("strategy's intake needs nothing: strategy comes first", req("strategy/intake").length === 0, req("strategy/intake").join());
ok("every other intake needs strategy's intake meeting and the foundation records", ["meeting:strategy/intake", "record:foundation/problem", "record:foundation/icp/*"].every((x) => req("finance/intake").includes(x)), req("finance/intake").join());
ok("any other workflow needs its own function's intake first, and never its own meeting", req("finance/monthly-spend-review").includes("meeting:finance/intake") && !req("finance/intake").includes("meeting:finance/intake"));
ok("marketing work needs an approved brand and publication policy", ["record:marketing/brand", "record:governance/publication-policy"].every((x) => req("marketing-and-sales/weekly-pipeline-review").includes(x)));
ok("a workflow's own requires in Naive is added", requiresOf("it/intake", { decisions: ["it-budget"] }, P).some((r) => r.kind === "decision" && r.what === "it-budget"));
const closedYes = { ...planned, status: "closed" as const, workflow: "strategy/intake", outcome: { reached: "yes" as const, summary: "", records: [], decisions: [], handoffs: [] } };
const look = (o: { meetings?: Meeting[], live?: string[], drafts?: string[], decided?: string[], broken?: boolean }): Lookup => ({
  async record(route) { if (o.broken) throw new Error("store down"); return o.live?.includes(route) ? "live" : o.drafts?.includes(route) ? "draft" : "none"; },
  meetings: () => o.meetings ?? [],
  async decision(id) { return o.decided?.includes(id) ? "decided" : null; },
});
let c = await prerequisitesOf("finance/intake", look({}));
ok("with nothing done, finance's intake is locked and every missing piece is named", !c.met && c.missing.length === 4 && /never met/.test(c.missing[0].why) && /\/meet strategy intake/.test(explain(c)), explain(c));
c = await prerequisitesOf("finance/intake", look({ meetings: [{ ...closedYes, outcome: { ...closedYes.outcome, reached: "partly" } }], live: ["foundation/problem", "foundation/icp/*", "foundation/goals/*"] }));
ok("a meeting closed with its outcome only partly reached does not unlock", !c.met && c.missing.length === 1 && /outcome partly/.test(c.missing[0].why));
c = await prerequisitesOf("finance/intake", look({ meetings: [closedYes], live: ["foundation/problem", "foundation/goals/*"], drafts: ["foundation/icp/*"] }));
ok("a held draft is not a record: it waits on approval", !c.met && c.missing.length === 1 && /no person has approved it/.test(c.missing[0].why) && /approve/.test(c.missing[0].fix));
c = await prerequisitesOf("finance/intake", look({ meetings: [closedYes], live: ["foundation/problem", "foundation/icp/*", "foundation/goals/*"] }));
ok("with the meeting closed and the records approved, it may start", c.met && c.missing.length === 0);
c = await prerequisitesOf("finance/intake", look({ meetings: [closedYes], broken: true }));
ok("what cannot be checked counts as missing", !c.met && c.missing.every((m) => /could not be checked/.test(m.why)));
c = await prerequisitesOf("finance/intake", look({}), { policy: undefined, own: undefined }).then(() => prerequisitesOf("strategy/intake", look({}), { policy: { rules: "x" } as never }));
ok("a policy that cannot be read locks everything", !c.met && c.missing[0].kind === "policy");
ok("the real accept refuses a foundation draft not named, before touching anything", await acceptHeld({ venture: "kettle", workspace: ws }, ["foundation/problem (held for a person)"], "torian", []).then(() => false, (err) => /accepted only by name: \/approve <meeting> foundation\/problem/.test(String(err))));
const copyPath = await printCopy({ venture: "kettle", workspace: ws }, dir, planned, { ...planned.agenda[1], result: "drafted the telos" }, ["foundation/goals/none (held for a person)"]);
const copyText = readFileSync(join(dir, copyPath), "utf8");
ok("a print copy is a Markdown file under .naive/presentations, with the result, each drafted route and the approve command", copyPath === `.naive/presentations/${planned.id}/ask-telos.md` && copyText.includes("drafted the telos") && copyText.includes("## foundation/goals/none") && copyText.includes(`/approve ${planned.id}`), copyText);
ok("a print copy renders a record as headings and bullets", markdownOf({ statement: "Founders run alone", evidence: ["two interviews"], owner: { id: "torian" } }) === "**statement:** Founders run alone\n\n### evidence\n\n- two interviews\n\n### owner\n\n**id:** torian");

// ---- 6. Ranking what is due ----
const e = (workflow: string, kind: "intake" | "schedule", in_phase: boolean) => ({ workflow, function: workflow.split("/")[0], title: "", role: "", trigger: { kind }, status: "due" as const, why: "w", last_done: null, last_failed: null, next_due: null, in_phase, time_box: null });
const ranked = rankDue([e("finance/review", "schedule", true), e("strategy/strategy-review", "schedule", true), e("products/intake", "intake", true), e("it/intake", "intake", false)], { strategy: 0.3, finance: 0.1, products: 0.2 });
ok("due work ranks in-phase first, intakes first, then the phase's function weight", ranked.map((x) => x.workflow).join() === "products/intake,strategy/strategy-review,finance/review,it/intake", ranked.map((x) => x.workflow).join());

// ---- 7. The tool rubric ----
const scored = scoreTools([
  { id: "records-everything", scores: { visibility: 4, ownership: 3, fit: 3, cost: 2, learning: 3 } },
  { id: "pretty-silo", scores: { visibility: 0, ownership: 4, fit: 4, cost: 4, learning: 4 } },
  { id: "ok", scores: { visibility: 2, ownership: 2, fit: 2, cost: 2, learning: 2 } },
]);
ok("a tool that hides activity is ruled out whatever else it scores", scored.at(-1)?.id === "pretty-silo" && scored.at(-1)?.out === "visibility");
ok("the rest rank by weighted total", scored[0].id === "records-everything" && scored[0].total > scored[1].total);
ok("a score outside 0 to 4 is refused", (() => { try { scoreTools([{ id: "x", scores: { visibility: 5, ownership: 1, fit: 1, cost: 1, learning: 1 } }]); return false; } catch { return true; } })());
ok("the tooling, meetings, ownership, hierarchy and documents skills ship with frontmatter names", ["tooling", "meetings", "ownership", "information-hierarchy", "documents"].every((n) => readFileSync(new URL(`./skills/${n}/SKILL.md`, import.meta.url), "utf8").includes(`name: ${n}`)));

rmSync(ws, { recursive: true, force: true });
if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("all passing");
