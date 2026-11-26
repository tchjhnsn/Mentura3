// The local checkpoint: a second opener reads the file the first wrote, and a node that already finished does not run again.
//
//   node agents/checkpoint-test.ts

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { END, START, StateGraph, Annotation } from "@langchain/langgraph";
import { openRunSaver } from "./checkpoint.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = "") => { console.log(`${cond ? "pass" : "FAIL"}  ${name}${cond || !detail ? "" : `: ${detail}`}`); if (!cond) failed++; };

const State = Annotation.Root({ step: Annotation<string> });
const dir = mkdtempSync(join(tmpdir(), "mentura-checkpoint-"));

let runs = 0;
let crash = true;
const graph = (saver: ReturnType<typeof openRunSaver>) => new StateGraph(State)
  .addNode("first", () => ({ step: "first" }))
  .addNode("second", () => {
    runs += 1;
    if (crash) throw new Error("stopped");
    return { step: "second" };
  })
  .addEdge(START, "first")
  .addEdge("first", "second")
  .addEdge("second", END)
  .compile({ checkpointer: saver });

const thread = { configurable: { thread_id: "run-1" } };
const first = openRunSaver(dir);
let threw = false;
try { await graph(first).invoke({ step: "" }, thread); }
catch (e) { threw = (e as Error).message.includes("stopped"); }
first.close();
ok("the first run stops in the second node", threw && runs === 1, String(runs));

crash = false;
runs = 0;
const second = openRunSaver(dir);
let step = "";
try {
  const out = await graph(second).invoke(null, thread);
  step = out.step;
} catch (e) { step = (e as Error).message; }
second.close();
ok("the next opener finishes the second node and does not repeat it", step === "second" && runs === 1, `${step} runs=${runs}`);

rmSync(dir, { recursive: true, force: true });
console.log(failed ? `${failed} failed` : "checkpoint: all passing");
process.exit(failed ? 1 : 0);
