import { createHash, randomUUID } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { CATALOG_VERSION, LOCAL_FIXTURE, LOCAL_FIXTURE_ID, isStoreConnectorId, type ProviderDefinition } from "./catalog.ts";
import { readFixture, writeFixture } from "./driver.ts";
import { appendLog, readLog, withLock, type HostLog, type LineIo, type StoredLine } from "./log.ts";
import { hmac, macEqual, withSecret } from "./mac.ts";
import { assertNoLink, canonicalVenture, confine, fixtureSegment, ventureLogDir } from "./paths.ts";
import type { VenturePolicy } from "./policy.ts";

declare const accountBrand: unique symbol;
declare const ventureBrand: unique symbol;
export type AccountId = string & { readonly [accountBrand]: "AccountId" };
export type VentureId = string & { readonly [ventureBrand]: "VentureId" };

export function accountId(input: string): AccountId {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(input)) throw new Error("outside: account id is not a single safe name");
  return input as AccountId;
}

export function ventureId(input: string): VentureId {
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(input)) throw new Error("outside: venture id is not a single safe name");
  return input as VentureId;
}

export interface PersonActor { readonly kind: "person"; readonly sessionUserId: AccountId; readonly venturePersonName: string }

export interface VentureScope {
  readonly ventureId: VentureId;
  readonly ventureDir: string;
  readonly functionId: string;
  readonly actor: PersonActor;
}

export interface CapabilityRequirement {
  readonly id: string;
  readonly ventureId: string;
  readonly functionId: string;
  readonly statement: string;
  readonly gap: string;
  readonly address: string | null;
  readonly support: {
    readonly status: "hypothesized";
    readonly evidence: { readonly kind: "founder-statement"; readonly recordPath: string };
    readonly provenance: { readonly by: string; readonly at: string };
  };
}

export interface HostOptions {
  readonly accountId: AccountId;
  readonly accountWorkspace: string;
  readonly signingKeyFile: string;
  readonly inboundKeyFile: string;
  readonly policy: VenturePolicy;
  readonly functionIds: readonly string[];
  /**
   * Production passes `naiveRequirementCheck` from `naive-requirement.ts`, which calls Naive's Validator.
   * There is no default that accepts a record.
   */
  readonly shapeCheck: { accepted(record: unknown): boolean };
  readonly now?: () => number;
  /**
   * The hosted log. When omitted, the host uses the account directory on this machine.
   * That directory is not durable on Vercel.
   */
  readonly log?: HostLog;
}

interface Intent {
  readonly id: string;
  readonly kind: string;
  readonly idempotencyKey: string;
  readonly accountId: string;
  readonly ventureId: string;
  readonly functionId: string;
  readonly requirementId: string;
  readonly connectionId: string | null;
  readonly payloadHash: string;
}

export interface ToolHost {
  inspect(scope: VentureScope, query: { readonly requirement: CapabilityRequirement; readonly receiptId: string | null; readonly inboundReceiptId: string | null }): Promise<InspectView | Refusal>;
  submit(scope: VentureScope, input: SubmitInput): Promise<SubmitResult>;
  receive(input: { readonly ventureId: VentureId; readonly connectionId: string; readonly eventId: string; readonly rawBody: Uint8Array; readonly signature: string }): Promise<ReceiveResult>;
}

type Refusal = { readonly status: "refused"; readonly reason: string };
type SubmitResult = { readonly status: string; readonly [key: string]: unknown } | Refusal;
type ReceiveResult = { readonly status: "stored" | "rejected"; readonly reason?: string; readonly receiptId?: string };
interface InspectView {
  readonly status: "ready";
  readonly condition: string;
  readonly provider: ProviderDefinition | null;
  readonly storeCoverage: "github-source" | "none";
  readonly health: { readonly receiptId: string; readonly at: string } | null;
  readonly relation: "match" | "mismatch" | null;
  readonly accepted: false;
}

export type SubmitInput =
  | { readonly kind: "bind"; readonly idempotencyKey: string; readonly requirement: CapabilityRequirement; readonly providerId: string; readonly fixture: string; readonly accountRef: "local" }
  | { readonly kind: "read"; readonly idempotencyKey: string; readonly connectionId: string }
  | { readonly kind: "write"; readonly idempotencyKey: string; readonly connectionId: string; readonly payload: Readonly<Record<string, string>> }
  | { readonly kind: "approve"; readonly idempotencyKey: string; readonly approves: string }
  | { readonly kind: "disconnect" | "delete-connection"; readonly idempotencyKey: string; readonly connectionId: string }
  | { readonly kind: "revoke"; readonly idempotencyKey: string; readonly authorizationId: string };

const PROOF_MS = 60_000;

function canon(value: unknown): string {
  const order = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(order);
    if (v !== null && typeof v === "object") {
      const src = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(src).sort()) out[key] = order(src[key]);
      return out;
    }
    return v;
  };
  return JSON.stringify(order(value));
}

function sha(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** The hash stored beside a hosted log line. It matches the chain inside the line. */
export function lineHash(line: StoredLine): string {
  return sha(canon(line));
}

function loadRequirement(record: unknown, functionIds: readonly string[]): CapabilityRequirement {
  if (record === null || typeof record !== "object" || Array.isArray(record)) throw new Error("outside: requirement is not a record");
  const row = record as Record<string, unknown>;
  const support = row.support as CapabilityRequirement["support"] | undefined;
  const requirement: CapabilityRequirement = {
    id: String(row.id ?? ""),
    ventureId: String(row.ventureId ?? ""),
    functionId: String(row.functionId ?? ""),
    statement: String(row.statement ?? ""),
    gap: String(row.gap ?? ""),
    address: row.address === null ? null : String(row.address ?? ""),
    support: support ?? { status: "hypothesized", evidence: { kind: "founder-statement", recordPath: "" }, provenance: { by: "", at: "" } },
  };
  if (!requirement.id || !requirement.statement || !requirement.gap) throw new Error("outside: requirement is missing a statement or a gap");
  if (!functionIds.includes(requirement.functionId)) throw new Error("outside: function id is not one of the thirteen");
  if (requirement.support.status !== "hypothesized" || requirement.support.evidence?.kind !== "founder-statement") {
    throw new Error("outside: a verified requirement waits on Naive's validate.mjs schema");
  }
  if (requirement.support.evidence.recordPath !== `knowledge/outside/${requirement.id}.json`) {
    throw new Error("outside: requirement evidence path does not match its id");
  }
  return requirement;
}

/** A reason safe to return. File paths and parser text stay out of it. */
function callerMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";
  if (
    message.startsWith("outside: ")
    && message.length <= 160
    && !message.includes("/")
    && !message.includes("\\")
    && !message.includes("\n")
    && !message.includes("Unexpected")
  ) return message;
  return fallback;
}

function githubCoverage(ventureDir: string): "github-source" | "none" {
  const knowledge = join(ventureDir, "knowledge");
  let directory;
  try {
    directory = lstatSync(knowledge);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "none";
    throw new Error("outside: sources.json is not available");
  }
  if (directory.isSymbolicLink() || !directory.isDirectory()) throw new Error("outside: sources.json must not be a symlink");
  const file = join(knowledge, "sources.json");
  let st;
  try {
    st = lstatSync(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "none";
    throw new Error("outside: sources.json is not available");
  }
  if (st.isSymbolicLink() || !st.isFile() || st.nlink !== 1) throw new Error("outside: sources.json must not be a symlink");
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd);
    if (!opened.isFile() || opened.nlink !== 1) throw new Error("outside: sources.json must not be a symlink");
    const text = readFileSync(fd, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw new Error("outside: sources.json is not valid");
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("outside: sources.json is not valid");
    const sources = (parsed as { sources?: unknown }).sources;
    if (!Array.isArray(sources)) throw new Error("outside: sources.json has no sources array");
    return sources.some((source) => {
      if (source === null || typeof source !== "object") return false;
      return (source as { connector?: unknown }).connector === "github";
    }) ? "github-source" : "none";
  } finally {
    closeSync(fd);
  }
}

interface Fold {
  connections: Map<string, Record<string, unknown>>;
  auths: Map<string, Record<string, unknown>>;
  receipts: Map<string, Record<string, unknown>>;
  cache: Map<string, { hash: string; result: SubmitResult }>;
  events: Map<string, string>;
}

/** The inbound MAC binds the body to this account, venture, connection, and event. A signature for one of those does not verify for another. */
export function inboundMessage(input: { readonly accountId: string; readonly ventureId: string; readonly connectionId: string; readonly eventId: string; readonly rawBody: Uint8Array }): string {
  return canon({
    accountId: input.accountId,
    ventureId: input.ventureId,
    connectionId: input.connectionId,
    eventId: input.eventId,
    bodyHash: sha(Buffer.from(input.rawBody).toString("base64url")),
  });
}

export function openToolHost(options: HostOptions): ToolHost {
  const now = options.now ?? Date.now;
  const accountReal = realpathSync(options.accountWorkspace);
  if (lstatSync(options.signingKeyFile).isSymbolicLink() || lstatSync(options.inboundKeyFile).isSymbolicLink()) {
    throw new Error("outside: secret file must not be a symlink");
  }
  const signingReal = realpathSync(options.signingKeyFile);
  const inboundReal = realpathSync(options.inboundKeyFile);
  if (signingReal.startsWith(accountReal + "/") || inboundReal.startsWith(accountReal + "/")) {
    throw new Error("outside: secret files must live outside the account workspace");
  }

  const refuse = (reason: string): Refusal => ({ status: "refused", reason });

  function scopeDir(scope: VentureScope): string {
    if (scope.actor.kind === "person" && scope.actor.sessionUserId !== options.accountId) {
      throw new Error("outside: session is a different account");
    }
    if (!options.functionIds.includes(scope.functionId)) throw new Error("outside: function id is not one of the thirteen");
    return canonicalVenture(accountReal, scope.ventureId, scope.ventureDir);
  }

  const logs: HostLog = options.log ?? {
    async run(ventureId, fn) {
      const dir = ventureLogDir(accountReal, ventureId);
      return withLock(accountReal, dir, () => fn({
        read: () => readLog(dir),
        append: (line) => appendLog(dir, line),
      }));
    },
  };

  function fixtureDirectory(segment: string): string {
    const raw = join(accountReal, "fixtures", fixtureSegment(segment));
    assertNoLink(accountReal, raw);
    return confine(accountReal, raw);
  }

  function sign(text: string): string {
    return withSecret(signingReal, (key) => hmac(key, text));
  }

  const trusted = new Set(["connection", "auth", "receipt", "cache", "event"]);

  /** A signed line is kept only when its signature matches the previous line. A bad latest line drops that id. */
  function opened(line: StoredLine, prev: string): Record<string, unknown> | null {
    if (typeof line.signature !== "string") return null;
    const body: Record<string, unknown> = {};
    for (const key of Object.keys(line)) {
      if (key === "signature") continue;
      body[key] = line[key];
    }
    if (body.prev !== prev || body.accountId !== options.accountId) return null;
    if (!macEqual(sign(canon(body)), line.signature)) return null;
    return body;
  }

  interface Book {
    state: Fold;
    append(line: StoredLine): void;
    seal(kind: string, fields: Record<string, unknown>): StoredLine;
  }

  function book(io: LineIo): Book {
    let tail = "";
    const state: Fold = { connections: new Map(), auths: new Map(), receipts: new Map(), cache: new Map(), events: new Map() };
    const take = (line: StoredLine, prev: string) => {
      if (!trusted.has(String(line.kind))) return;
      const body = opened(line, prev);
      const id = line.kind === "cache" ? String(line.key ?? "") : line.kind === "event" ? String(line.eventId ?? "") : String(line.id ?? "");
      if (line.kind === "connection") {
        if (body) state.connections.set(id, body);
        else state.connections.delete(id);
      } else if (line.kind === "auth") {
        if (body) state.auths.set(id, body);
        else state.auths.delete(id);
      } else if (line.kind === "receipt") {
        if (body) state.receipts.set(id, body);
      } else if (line.kind === "cache") {
        if (body) state.cache.set(id, { hash: String(body.hash), result: body.result as SubmitResult });
        else state.cache.delete(id);
      } else if (body) state.events.set(id, String(body.bodyHash));
      else state.events.delete(id);
    };
    for (const line of io.read()) {
      take(line, tail);
      tail = lineHash(line);
    }
    const append = (line: StoredLine) => {
      io.append(line);
      take(line, tail);
      tail = lineHash(line);
    };
    const seal = (kind: string, fields: Record<string, unknown>): StoredLine => {
      const body: Record<string, unknown> = { kind, ...fields, accountId: options.accountId, prev: tail };
      const line = { kind, ...body, signature: sign(canon(body)) } as unknown as StoredLine;
      append(line);
      return line;
    };
    return { state, append, seal };
  }

  function admitPerson(scope: VentureScope): Refusal | null {
    if (scope.actor.kind !== "person") return refuse("agents are not admitted");
    return null;
  }

  function actorAllows(scope: VentureScope, ventureReal: string, kind: string): boolean {
    const name = scope.actor.venturePersonName;
    const sessionUserId = scope.actor.sessionUserId;
    if (kind === "approve" || kind === "disconnect" || kind === "delete-connection" || kind === "revoke") {
      return options.policy.personMayApprove(ventureReal, name, sessionUserId);
    }
    return options.policy.personMayAct(ventureReal, name, sessionUserId);
  }

  const host: ToolHost = {
    async inspect(scope, query) {
      const denied = admitPerson(scope);
      if (denied) return denied;
      let dir: string;
      try { dir = scopeDir(scope); }
      catch (error) { return refuse(callerMessage(error, "refused")); }
      if (!options.shapeCheck.accepted(query.requirement)) return refuse("requirement shape was not accepted by Naive's validator");
      let requirement: CapabilityRequirement;
      try { requirement = loadRequirement(query.requirement, options.functionIds); }
      catch (error) { return refuse(callerMessage(error, "refused")); }
      if (requirement.ventureId !== scope.ventureId || requirement.functionId !== scope.functionId) return refuse("requirement is for a different venture or function");
      if (!options.policy.personMayAct(dir, scope.actor.venturePersonName, scope.actor.sessionUserId)) return refuse("actor");
      let state: Fold;
      try { state = (await logs.run(scope.ventureId, (io) => book(io))).state; }
      catch (error) { return refuse(callerMessage(error, "refused")); }
      const connection = [...state.connections.values()].find((row) => row.requirementId === requirement.id && row.lifecycle !== "deleted");
      const lifecycle = connection ? String(connection.lifecycle) : null;
      const condition = connection
        ? (lifecycle === "bound" ? "connected" : String(lifecycle))
        : (requirement.address === null ? "founder-words" : "pointed");
      const receipt = query.receiptId ? state.receipts.get(query.receiptId) : [...state.receipts.values()].at(-1);
      const inbound = query.inboundReceiptId ? state.receipts.get(query.inboundReceiptId) : undefined;
      const relation = receipt && inbound ? (receipt.bodyHash === inbound.bodyHash ? "match" : "mismatch") : null;
      let storeCoverage: "github-source" | "none" = "none";
      try { storeCoverage = githubCoverage(dir); }
      catch { return refuse("sources"); }
      return {
        status: "ready",
        condition,
        provider: connection && connection.providerId === LOCAL_FIXTURE_ID ? LOCAL_FIXTURE : null,
        storeCoverage,
        health: receipt ? { receiptId: String(receipt.id), at: String(receipt.at) } : null,
        relation,
        accepted: false,
      };
    },

    async submit(scope, input) {
      const denied = admitPerson(scope);
      if (denied) return denied;
      let ventureReal: string;
      try { ventureReal = scopeDir(scope); }
      catch (error) { return refuse(callerMessage(error, "refused")); }
      if (input.kind === "bind" && !options.shapeCheck.accepted(input.requirement)) return refuse("requirement shape was not accepted by Naive's validator");
      const keyHash = sha(canon(input));
      const actorKey = `${scope.actor.sessionUserId}\u001f${scope.actor.venturePersonName}\u001f${input.idempotencyKey}`;
      try {
        return await logs.run(scope.ventureId, (io) => {
          if (!actorAllows(scope, ventureReal, input.kind)) return refuse("actor");
          const log = book(io);
          const cached = log.state.cache.get(actorKey);
          if (cached) {
            if (cached.hash !== keyHash) return refuse("replay");
            if (!(cached.result.status === "refused" && cached.result.reason === "actor")) return cached.result;
          }
          const result = transition(scope, ventureReal, log, input, keyHash);
          if (result.status !== "refused") log.seal("cache", { key: actorKey, hash: keyHash, result });
          return result;
        });
      } catch (error) {
        const message = callerMessage(error, "refused");
        if (message === "outside: log is busy") return refuse("busy");
        return refuse(message);
      }
    },

    async receive(input) {
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(input.eventId)) return { status: "rejected", reason: "body" };
      try {
        return await logs.run(input.ventureId, (io) => {
          const log = book(io);
          const connection = log.state.connections.get(input.connectionId);
          if (!connection || connection.lifecycle !== "bound" || connection.ventureId !== input.ventureId) return { status: "rejected", reason: "lifecycle" };
          const bodyHash = sha(Buffer.from(input.rawBody).toString("base64url"));
          const mac = withSecret(inboundReal, (key) => hmac(key, inboundMessage({ accountId: options.accountId, ventureId: input.ventureId, connectionId: input.connectionId, eventId: input.eventId, rawBody: input.rawBody })));
          if (!macEqual(mac, input.signature)) return { status: "rejected", reason: "authenticity" };
          const prior = log.state.events.get(input.eventId);
          if (prior === bodyHash) {
            const existing = [...log.state.receipts.values()].find((row) => row.eventId === input.eventId && row.outcome === "completed");
            return { status: "stored", receiptId: existing ? String(existing.id) : undefined };
          }
          if (prior) {
            const receipt = log.seal("receipt", { id: randomUUID(), eventId: input.eventId, bodyHash, outcome: "replay-conflict", accepted: false, at: new Date(now()).toISOString(), connectionId: input.connectionId, ventureId: input.ventureId });
            return { status: "stored", receiptId: String(receipt.id) };
          }
          log.seal("event", { eventId: input.eventId, bodyHash, connectionId: input.connectionId, ventureId: input.ventureId });
          const receipt = log.seal("receipt", { id: randomUUID(), eventId: input.eventId, bodyHash, outcome: "completed", accepted: false, at: new Date(now()).toISOString(), connectionId: input.connectionId, ventureId: input.ventureId, providerId: LOCAL_FIXTURE_ID });
          return { status: "stored", receiptId: String(receipt.id) };
        });
      } catch (error) {
        const message = callerMessage(error, "secret-missing");
        return { status: "rejected", reason: message === "outside: log is busy" ? "busy" : message };
      }
    },
  };

  function transition(scope: VentureScope, ventureReal: string, log: Book, input: SubmitInput, keyHash: string): SubmitResult {
    const state = log.state;
    const actorRefused = (detail: string): Refusal => {
      log.append({ kind: "refusal", idempotencyKey: input.idempotencyKey, reason: "actor", detail });
      return refuse("actor");
    };
    const actorBody = (actor: PersonActor) => ({ kind: actor.kind, sessionUserId: actor.sessionUserId, venturePersonName: actor.venturePersonName });
    const sealAuth = (intent: Intent, actor: PersonActor, connectionId: string | null, granted: boolean, revoked: boolean) => log.seal("auth", {
      id: randomUUID(),
      intentId: intent.id,
      payloadHash: intent.payloadHash,
      connectionId,
      granted,
      revoked,
      expiresAt: new Date(now() + PROOF_MS).toISOString(),
      actor: actorBody(actor),
    });
    if (!actorAllows(scope, ventureReal, input.kind)) return actorRefused("person");

    if (input.kind === "bind") {
      if (isStoreConnectorId(input.providerId) || input.providerId !== LOCAL_FIXTURE_ID) return refuse("catalog");
      let requirement: CapabilityRequirement;
      try { requirement = loadRequirement(input.requirement, options.functionIds); }
      catch (error) { return refuse(callerMessage(error, "requirement")); }
      if (requirement.ventureId !== scope.ventureId || requirement.functionId !== scope.functionId) return refuse("scope");
      const segment = fixtureSegment(input.fixture);
      const fixtureDir = fixtureDirectory(segment);
      const id = randomUUID();
      const intent = intentOf(input.kind, input.idempotencyKey, scope, requirement.id, null, keyHash);
      log.seal("connection", { id, ventureId: scope.ventureId, functionId: scope.functionId, requirementId: requirement.id, providerId: LOCAL_FIXTURE_ID, catalogVersion: CATALOG_VERSION, accountRef: "local", fixture: segment, secretRefs: ["OUTSIDE_FIXTURE_HMAC_FILE"], lifecycle: "bound" });
      const auth = sealAuth(intent, scope.actor, null, true, false);
      return { status: "bound", connectionId: id, condition: "connected", authorizationId: String(auth.id), fixtureDir };
    }

    if (input.kind === "revoke") {
      const auth = state.auths.get(input.authorizationId);
      const connectionId = typeof auth?.connectionId === "string" ? auth.connectionId : "";
      const owned = connectionId ? state.connections.get(connectionId) : undefined;
      if (!auth || !owned || owned.ventureId !== scope.ventureId || owned.functionId !== scope.functionId) return refuse(auth ? "scope" : "signature");
      if (auth.revoked === true) return { status: "revoked", authorizationId: input.authorizationId };
      log.seal("auth", {
        id: String(auth.id),
        intentId: String(auth.intentId),
        payloadHash: String(auth.payloadHash),
        connectionId,
        granted: auth.granted === true,
        revoked: true,
        expiresAt: String(auth.expiresAt ?? ""),
        actor: auth.actor,
      });
      return { status: "revoked", authorizationId: input.authorizationId };
    }

    if (input.kind === "approve") {
      if (!options.policy.personMayApprove(ventureReal, scope.actor.venturePersonName, scope.actor.sessionUserId)) return actorRefused("approve");
      const prior = [...state.receipts.values()].find((row) => row.intentId === input.approves && row.outcome === "completed");
      if (prior) return { status: "done", receiptId: String(prior.id), authorizationId: String(prior.authorizationId), accepted: false, bodyHash: String(prior.bodyHash) };
      const held = [...state.auths.values()].find((row) => row.intentId === input.approves && row.granted === false);
      if (!held) return refuse("signature");
      if (held.revoked === true) return refuse("revoked");
      const expiry = Date.parse(String(held.expiresAt ?? ""));
      if (!Number.isFinite(expiry) || expiry <= now()) return refuse("expired");
      const connectionId = typeof held.connectionId === "string" ? held.connectionId : "";
      const connection = connectionId ? state.connections.get(connectionId) : undefined;
      if (!connection || connection.ventureId !== scope.ventureId || connection.functionId !== scope.functionId) return refuse("scope");
      if (connection.lifecycle !== "bound") return refuse("lifecycle");
      const fixtureDir = fixtureDirectory(String(connection.fixture));
      const driven = writeFixture(fixtureDir, String(held.intentId), String(held.payloadHash));
      const auth = sealAuth(intentOf("approve", input.idempotencyKey, scope, String(connection.requirementId), connectionId, String(held.payloadHash)), scope.actor, connectionId, true, false);
      const receipt = log.seal("receipt", { id: randomUUID(), intentId: held.intentId, authorizationId: auth.id, connectionId, providerId: LOCAL_FIXTURE_ID, bodyHash: driven.bodyHash, outcome: "completed", accepted: false, at: new Date(now()).toISOString(), ventureId: scope.ventureId });
      return { status: "done", receiptId: String(receipt.id), authorizationId: String(auth.id), accepted: false, bodyHash: driven.bodyHash };
    }

    if (!("connectionId" in input)) return refuse("scope");
    const connectionId = input.connectionId;
    const connection = connectionId ? state.connections.get(connectionId) : undefined;
    if (!connection || connection.ventureId !== scope.ventureId || connection.functionId !== scope.functionId) return refuse("scope");
    if (connection.lifecycle === "deleted") return refuse("lifecycle");

    if (input.kind === "disconnect" || input.kind === "delete-connection") {
      if (!options.policy.personMayApprove(ventureReal, scope.actor.venturePersonName, scope.actor.sessionUserId)) return actorRefused("approve");
      const lifecycle = input.kind === "disconnect" ? "disconnected" : "deleted";
      log.seal("connection", {
        id: String(connection.id),
        ventureId: String(connection.ventureId),
        functionId: String(connection.functionId),
        requirementId: String(connection.requirementId),
        providerId: String(connection.providerId),
        catalogVersion: connection.catalogVersion,
        accountRef: String(connection.accountRef ?? "local"),
        fixture: String(connection.fixture),
        secretRefs: lifecycle === "deleted" ? [] : connection.secretRefs,
        lifecycle,
      });
      return { status: lifecycle, connectionId };
    }

    if (connection.lifecycle !== "bound") return refuse("lifecycle");

    if (input.kind === "write") {
      const intent = intentOf("write", input.idempotencyKey, scope, String(connection.requirementId), connectionId, sha(canon(input.payload)));
      log.append({ ...intent, kind: "intent" } as StoredLine);
      const auth = sealAuth(intent, scope.actor, connectionId, false, false);
      return { status: "awaiting-approval", intentId: intent.id, authorizationId: String(auth.id), granted: false };
    }

    const fixtureDir = fixtureDirectory(String(connection.fixture));
    const driven = readFixture(fixtureDir);
    const intent = intentOf("read", input.idempotencyKey, scope, String(connection.requirementId), connectionId, driven.bodyHash);
    const auth = sealAuth(intent, scope.actor, connectionId, true, false);
    const receipt = log.seal("receipt", { id: randomUUID(), intentId: intent.id, authorizationId: auth.id, connectionId, providerId: LOCAL_FIXTURE_ID, bodyHash: driven.bodyHash, outcome: "completed", accepted: false, at: new Date(now()).toISOString(), ventureId: scope.ventureId });
    return { status: "done", receiptId: String(receipt.id), authorizationId: String(auth.id), accepted: false, bodyHash: driven.bodyHash };
  }

  function intentOf(kind: string, idempotencyKey: string, scope: VentureScope, requirementId: string, connectionId: string | null, payloadHash: string): Intent {
    return { id: randomUUID(), kind, idempotencyKey, accountId: options.accountId, ventureId: scope.ventureId, functionId: scope.functionId, requirementId, connectionId, payloadHash };
  }

  return host;
}

/** Test helper. Signs the same inbound context `receive` checks. The key is not returned. */
export function signBody(inboundKeyFile: string, input: { readonly accountId: string; readonly ventureId: string; readonly connectionId: string; readonly eventId: string; readonly rawBody: Uint8Array }): string {
  return withSecret(inboundKeyFile, (key) => hmac(key, inboundMessage(input)));
}

export { loadRequirement };
