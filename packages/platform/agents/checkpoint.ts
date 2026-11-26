// A run's graph state on disk, so the same run id can continue after the process stops (local only).
// The file is <venture>/.naive/agent-checkpoints.sqlite for agent runs and <venture>/.naive/meeting-checkpoints.sqlite
// for meetings (meeting-graph.ts). Each file is rewritten whole on every put, so two savers never share one file.
// node:sqlite is in Node 22, so this adds no native addon.
//
// A finished thread is the saved state. A thread with work left is continued. A new thread starts on the task.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import type { Checkpoint, CheckpointMetadata, PendingWrite } from "@langchain/langgraph-checkpoint";
import type { RunnableConfig } from "@langchain/core/runnables";
import { HumanMessage } from "@langchain/core/messages";

const FILE = "agent-checkpoints.sqlite";

interface ThreadState {
  next?: readonly string[],
  values?: { messages?: unknown[] },
}

interface ThreadAgent {
  getState(config: { configurable: { thread_id: string } }): Promise<ThreadState>,
  invoke(input: unknown, config: Record<string, unknown>): Promise<unknown>,
}

function encode(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => v instanceof Uint8Array ? { __bytes: Buffer.from(v).toString("base64") } : v);
}

function decode(text: string): unknown {
  return JSON.parse(text, (_key, v: unknown) => {
    if (v && typeof v === "object" && "__bytes" in (v as Record<string, unknown>) && typeof (v as { __bytes: unknown }).__bytes === "string") {
      return Uint8Array.from(Buffer.from((v as { __bytes: string }).__bytes, "base64"));
    }
    return v;
  });
}

/** MemorySaver keeps a missing parent as undefined. JSON turns that into null. */
function parents(storage: Record<string, Record<string, Record<string, [Uint8Array, Uint8Array, string | undefined]>>>): void {
  for (const thread of Object.values(storage)) {
    for (const ns of Object.values(thread)) {
      for (const row of Object.values(ns)) if (row[2] === null) row[2] = undefined;
    }
  }
}

function nullProto(value: unknown): unknown {
  if (value instanceof Uint8Array || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(nullProto);
  const out = Object.create(null) as Record<string, unknown>;
  for (const [k, v] of Object.entries(value as object)) out[k] = nullProto(v);
  return out;
}

/** The venture's checkpoint file. A new process reads what the last one stored. */
export class SqliteRunSaver extends MemorySaver {
  #db: DatabaseSync;
  #closed = false;

  constructor(dir: string, file: string = FILE) {
    super();
    const folder = join(dir, ".naive");
    mkdirSync(folder, { recursive: true });
    this.#db = new DatabaseSync(join(folder, file));
    this.#db.exec(`CREATE TABLE IF NOT EXISTS saver (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      storage TEXT NOT NULL,
      writes TEXT NOT NULL
    )`);
    const row = this.#db.prepare("SELECT storage, writes FROM saver WHERE id = 1").get() as { storage: string, writes: string } | undefined;
    if (!row) return;
    this.storage = nullProto(decode(row.storage)) as typeof this.storage;
    parents(this.storage);
    this.writes = nullProto(decode(row.writes)) as typeof this.writes;
  }

  override async put(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata): Promise<RunnableConfig> {
    const saved = await super.put(config, checkpoint, metadata);
    this.#flush();
    return saved;
  }

  override async putWrites(config: RunnableConfig, writes: PendingWrite[], taskId: string, taskPath?: string): Promise<void> {
    await super.putWrites(config, writes, taskId, taskPath);
    this.#flush();
  }

  override async deleteThread(threadId: string): Promise<void> {
    await super.deleteThread(threadId);
    this.#flush();
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#db.close();
  }

  #flush(): void {
    if (this.#closed) return;
    this.#db.prepare(`INSERT INTO saver (id, storage, writes) VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET storage = excluded.storage, writes = excluded.writes`).run(encode(this.storage), encode(this.writes));
  }
}

export function openRunSaver(dir: string): SqliteRunSaver {
  return new SqliteRunSaver(dir);
}

/** The venture's meeting checkpoints, a file of their own: a meeting process also runs agents, which save to agent-checkpoints.sqlite. */
export function openMeetingSaver(dir: string): SqliteRunSaver {
  return new SqliteRunSaver(dir, "meeting-checkpoints.sqlite");
}

/**
 * Runs one thread. A saved thread with work left continues, without the task again.
 * A saved thread that finished returns that state, so the model is not called again.
 * Anything else starts on the task.
 */
export async function invokeThread(agent: ThreadAgent, threadId: string, task: string, config: Record<string, unknown>): Promise<unknown> {
  const base = { ...config, configurable: { thread_id: threadId } };
  let state: ThreadState | undefined;
  try { state = await agent.getState({ configurable: { thread_id: threadId } }); }
  catch { state = undefined; }
  if ((state?.next ?? []).length > 0) return agent.invoke(null, base);
  if ((state?.values?.messages?.length ?? 0) > 0) return state?.values;
  return agent.invoke({ messages: [new HumanMessage(task)] }, base);
}
