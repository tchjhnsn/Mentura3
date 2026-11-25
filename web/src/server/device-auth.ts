// Device sign-in for the Naive command line (RFC 8628 device authorization grant; offline sync, EE-174, design
// docs/design/OFFLINE_SYNC_2026-11-25.md in tchjhnsn/naive; migration 0069). The command line asks for a code
// (POST /api/naive/device/code), the person approves it at /device while signed in to Mentura, and the command line
// exchanges the device code for a bearer token scoped to one business (POST /api/naive/device/token). The sync API
// checks that token through ./sync-token.ts.
//
// Three rules hold the whole module together:
//   1. No secret is kept in the clear. Only the sha256 hex of the device code and of the token is stored, so a copy of
//      the table signs nothing in.
//   2. A device code is a small state machine: pending, then approved, denied or used (its token issued). Expiry is
//      read from `expires_at` on every poll, never swept, so a poll after a crash answers the same way.
//   3. Every step that must happen once (deciding a code, spending it for a token, revoking a token) is one claiming
//      UPDATE that names the state it moves from, so two polls at once cannot make two tokens.
//
// The rules are kept apart from Postgres: `DeviceAuthStore` is the only thing that touches rows, and
// `memoryDeviceAuthStore()` is the same store over memory for tests (as ./action-change-store.ts keeps its memory
// Layer beside the live one).
import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { db } from "@/db/pool";

/** RFC 8628 section 6.1: twenty letters, no vowels, so a code reads back over the phone and spells no word. */
const ALPHABET = "BCDFGHJKLMNPQRSTVWXZ";
const USER_CODE_LENGTH = 8;
/** How long a device code waits for the person, in seconds (the contract's `expires_in`). */
export const DEVICE_CODE_SECONDS = 900;
/** How often the command line may poll, in seconds (the contract's `interval`). */
export const POLL_SECONDS = 5;
/** RFC 8628 section 3.5: a poll inside the interval adds this many seconds to it, for this poll and every later one. */
const SLOW_DOWN_SECONDS = 5;
/** Timers drift, so a poll this many milliseconds early still counts as on time. */
const POLL_GRACE_MS = 500;
/** How long a command line token lasts. The command line keeps it in the operating system's keychain. */
export const TOKEN_DAYS = 90;
const DAY_MS = 86_400_000;
const CLIENTS = /^[a-z0-9][a-z0-9.-]{0,63}$/;
const BUSINESS = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{32,128}$/;

/** The sha256 hex of a secret, as it is stored. */
export const hashSecret = (secret: string) => createHash("sha256").update(secret).digest("hex");

/**
 * Whether a string is a plain id, as a business id and an account id must be: it goes into a sync file's object key
 * and into a lookup in Naive. One definition, read where a business is approved here and again where a token is
 * checked (./sync-token.ts), so the two cannot disagree about which ids are legal. There is no slash in it and the
 * first character is a letter or a digit, so an id is one key segment and cannot climb out of it.
 */
export const idShaped = (id: string) => BUSINESS.test(id);

/** A user code as it is stored: letters and digits, upper case. "abcd-efgh" and "ABCDEFGH" are the same code. */
export const normalizeUserCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
/** A user code as the person reads and types it: ABCD-EFGH. */
export const showUserCode = (code: string) => (code.length === USER_CODE_LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code);
/** Whether a string can be one of this server's user codes at all, before it is looked up. */
export const userCodeShaped = (code: string) => code.length === USER_CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c));

const newUserCode = () => Array.from({ length: USER_CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const newSecret = () => randomBytes(32).toString("base64url");

// ---------------------------------------------------------------------------
// The domain
// ---------------------------------------------------------------------------

export type DeviceCodeState = "pending" | "approved" | "denied" | "used";

/** A device code as the store keeps it. The device code itself is not here: only its hash ever was. */
export type DeviceCodeRow = {
  id: string;
  userCode: string;
  client: string;
  /** The business the command line asked for, then the one the person approved. */
  business: string | null;
  state: DeviceCodeState;
  /** Who approved or denied it. */
  userId: string | null;
  expiresAt: Date;
  lastPolledAt: Date | null;
  intervalSeconds: number;
};

/** One command line signed in. The token itself is not here: only its hash ever was. */
export type CliTokenRow = {
  id: string;
  userId: string;
  business: string;
  client: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

/** The only thing that touches rows. Postgres in the app, `memoryDeviceAuthStore()` in tests. */
export interface DeviceAuthStore {
  /** Keeps a new code, or false when the user code or the device code hash is already taken. */
  insertCode(row: { id: string; deviceCodeHash: string; userCode: string; client: string; business: string | null; expiresAt: Date; intervalSeconds: number }): Promise<boolean>;
  codeByUserCode(userCode: string): Promise<DeviceCodeRow | null>;
  codeByDeviceHash(hash: string): Promise<DeviceCodeRow | null>;
  /** Moves a pending, unexpired code to approved or denied. False when it was already decided or has expired. */
  decideCode(id: string, decision: { state: "approved" | "denied"; userId: string; business: string | null; at: Date }): Promise<boolean>;
  /** Moves an approved code to used and gives back what its token needs. Null when another poll already spent it. */
  claimApprovedCode(id: string, at: Date): Promise<{ userId: string; business: string } | null>;
  /** Records a poll and the interval the next one must wait. */
  polled(id: string, at: Date, intervalSeconds: number): Promise<void>;
  insertToken(row: { id: string; userId: string; business: string; client: string; tokenHash: string; deviceCodeId: string; createdAt: Date; expiresAt: Date }): Promise<void>;
  tokenByHash(hash: string): Promise<CliTokenRow | null>;
  tokenUsed(id: string, at: Date): Promise<void>;
  tokensOf(userId: string): Promise<CliTokenRow[]>;
  /** Revokes one of this person's live tokens. False when it is not theirs, or was already revoked. */
  revokeToken(userId: string, id: string, at: Date): Promise<boolean>;
}

/** What the command line asked for. */
export type DeviceCodeRequest = { business: string | null; client: string };

/**
 * Reads the body of `POST /api/naive/device/code`, or says in one sentence what is wrong with it. External data is
 * untyped until it is parsed, and this is the only place that parses it.
 */
export function readCodeRequest(body: unknown): DeviceCodeRequest | string {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return "Send a JSON object.";
  const { business, client } = body as { business?: unknown; client?: unknown };
  if (client !== undefined && client !== null && typeof client !== "string") return "client is the name of the program signing in.";
  const named = typeof client === "string" ? client.trim().toLowerCase() : "naive-cli";
  if (!CLIENTS.test(named)) return "client is the name of the program signing in.";
  if (business === undefined || business === null || business === "") return { business: null, client: named };
  if (typeof business !== "string" || !BUSINESS.test(business.trim())) return "business is the id of one business.";
  return { business: business.trim(), client: named };
}

/** Reads the body of `POST /api/naive/device/token`, or says what is wrong with it. */
export function readTokenRequest(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const { device_code: code } = body as { device_code?: unknown };
  return typeof code === "string" && TOKEN_SHAPE.test(code.trim()) ? code.trim() : null;
}

type Options = { store?: DeviceAuthStore; now?: Date };
const of = (opts: Options) => ({ store: opts.store ?? postgresDeviceAuth, now: opts.now ?? new Date() });

// ---------------------------------------------------------------------------
// Asking for a code
// ---------------------------------------------------------------------------

/** A new device code, as the command line is told it. `userCode` is normalized; show it with `showUserCode`. */
export type DeviceCodeIssued = { deviceCode: string; userCode: string; expiresIn: number; interval: number };

/** Starts a sign-in: a device code for the command line and a user code for the person. */
export async function createDeviceCode(asked: DeviceCodeRequest, opts: Options = {}): Promise<DeviceCodeIssued> {
  const { store, now } = of(opts);
  const expiresAt = new Date(now.getTime() + DEVICE_CODE_SECONDS * 1000);
  // A user code is short on purpose, so two live codes can collide. Five tries make that vanishingly unlikely; the
  // unique indexes, not this loop, are what keep one code one sign-in.
  for (let attempt = 0; attempt < 5; attempt++) {
    const deviceCode = newSecret();
    const userCode = newUserCode();
    const kept = await store.insertCode({ id: randomUUID(), deviceCodeHash: hashSecret(deviceCode), userCode, client: asked.client, business: asked.business, expiresAt, intervalSeconds: POLL_SECONDS });
    if (kept) return { deviceCode, userCode, expiresIn: DEVICE_CODE_SECONDS, interval: POLL_SECONDS };
  }
  throw new Error("Mentura could not start a sign-in. Try again.");
}

/** The reply to `POST /api/naive/device/code`, in the contract's words (RFC 8628 section 3.2). */
export function codeReply(issued: DeviceCodeIssued, origin: string) {
  const userCode = showUserCode(issued.userCode);
  const verification = `${origin.replace(/\/$/, "")}/device`;
  return {
    device_code: issued.deviceCode,
    user_code: userCode,
    verification_uri: verification,
    verification_uri_complete: `${verification}?user_code=${encodeURIComponent(userCode)}`,
    expires_in: issued.expiresIn,
    interval: issued.interval,
  };
}

/** The reply to a poll that found an approved code (RFC 8628 section 3.5). */
export const tokenReply = (grant: TokenGrant) => ({ access_token: grant.accessToken, token_type: "Bearer", business: grant.business, expires_in: grant.expiresIn });

// ---------------------------------------------------------------------------
// The person approving or denying it
// ---------------------------------------------------------------------------

/** A code the person is being asked about, as /device shows it. */
export type WaitingCode = { userCode: string; client: string; business: string | null };

/** The code behind a user code while it still waits, else null (unknown, expired, or already decided). */
export async function waitingCode(raw: string, opts: Options = {}): Promise<WaitingCode | null> {
  const { store, now } = of(opts);
  const userCode = normalizeUserCode(raw);
  if (!userCodeShaped(userCode)) return null;
  const row = await store.codeByUserCode(userCode);
  if (!row || row.state !== "pending" || row.expiresAt <= now) return null;
  return { userCode: row.userCode, client: row.client, business: row.business };
}

/** Why a decision did not land. */
export type DecideProblem = "no-such-code" | "expired" | "already-decided" | "no-business";

/** The person approves the sign-in for one business. The token is made later, when the command line polls. */
export async function approveDeviceCode(raw: string, userId: string, business: string, opts: Options = {}): Promise<"approved" | DecideProblem> {
  if (!BUSINESS.test(business.trim())) return "no-business";
  return decide(raw, { state: "approved", userId, business: business.trim() }, opts);
}

/** The person denies the sign-in. The command line stops polling with `access_denied`. */
export async function denyDeviceCode(raw: string, userId: string, opts: Options = {}): Promise<"denied" | DecideProblem> {
  return decide(raw, { state: "denied", userId, business: null }, opts);
}

async function decide<S extends "approved" | "denied">(raw: string, d: { state: S; userId: string; business: string | null }, opts: Options): Promise<S | DecideProblem> {
  const { store, now } = of(opts);
  const userCode = normalizeUserCode(raw);
  if (!userCodeShaped(userCode)) return "no-such-code";
  const row = await store.codeByUserCode(userCode);
  if (!row) return "no-such-code";
  if (row.expiresAt <= now) return "expired";
  if (row.state !== "pending") return "already-decided";
  // The UPDATE names `pending`, so whoever gets there first decides and a second tap says so.
  return (await store.decideCode(row.id, { ...d, at: now })) ? d.state : "already-decided";
}

// ---------------------------------------------------------------------------
// The command line exchanging its device code for a token
// ---------------------------------------------------------------------------

/** RFC 8628 section 3.5. An unknown or already spent device code answers `expired_token`, so a client stops polling. */
export type TokenError = "authorization_pending" | "slow_down" | "expired_token" | "access_denied";
export type TokenGrant = { accessToken: string; business: string; expiresIn: number };

/** The token for an approved device code, or the error the command line should act on. */
export async function exchangeDeviceCode(deviceCode: string, opts: Options = {}): Promise<TokenGrant | TokenError> {
  const { store, now } = of(opts);
  if (!TOKEN_SHAPE.test(deviceCode)) return "expired_token";
  const row = await store.codeByDeviceHash(hashSecret(deviceCode));
  if (!row) return "expired_token";
  if (row.state === "denied") return "access_denied";
  if (row.state === "used") return "expired_token";
  if (row.expiresAt <= now) return "expired_token";
  if (row.state === "pending") {
    const early = row.lastPolledAt !== null && now.getTime() - row.lastPolledAt.getTime() + POLL_GRACE_MS < row.intervalSeconds * 1000;
    const interval = early ? row.intervalSeconds + SLOW_DOWN_SECONDS : row.intervalSeconds;
    await store.polled(row.id, now, interval);
    return early ? "slow_down" : "authorization_pending";
  }
  // One claiming UPDATE, so two polls arriving together cannot both make a token.
  const claimed = await store.claimApprovedCode(row.id, now);
  if (!claimed) return "expired_token";
  const token = newSecret();
  await store.insertToken({ id: randomUUID(), userId: claimed.userId, business: claimed.business, client: row.client, tokenHash: hashSecret(token), deviceCodeId: row.id, createdAt: now, expiresAt: new Date(now.getTime() + TOKEN_DAYS * DAY_MS) });
  return { accessToken: token, business: claimed.business, expiresIn: TOKEN_DAYS * 86_400 };
}

// ---------------------------------------------------------------------------
// Checking a token, listing and revoking
// ---------------------------------------------------------------------------

/** Who a command line token speaks for: the person's account id and the one business it may read and write. */
export type TokenHolder = { person: string; business: string };

/** The holder of a live token, else null for a token that is unknown, expired or revoked. */
export async function verifyCliToken(token: string, opts: Options = {}): Promise<TokenHolder | null> {
  const { store, now } = of(opts);
  if (!TOKEN_SHAPE.test(token)) return null;
  const row = await store.tokenByHash(hashSecret(token));
  if (!row || row.revokedAt !== null || row.expiresAt <= now) return null;
  await store.tokenUsed(row.id, now);
  return { person: row.userId, business: row.business };
}

/** One signed-in command line, as Settings lists it. */
export type CliToken = { id: string; business: string; client: string; createdAt: string; expiresAt: string; lastUsedAt: string | null };

/** This person's live command line tokens, newest first. Revoked and expired ones are left out. */
export async function cliTokens(userId: string, opts: Options = {}): Promise<CliToken[]> {
  const { store, now } = of(opts);
  const rows = await store.tokensOf(userId);
  return rows
    .filter((r) => r.revokedAt === null && r.expiresAt > now)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((r) => ({ id: r.id, business: r.business, client: r.client, createdAt: r.createdAt.toISOString(), expiresAt: r.expiresAt.toISOString(), lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null }));
}

/** Revokes one of this person's tokens. The command line holding it is signed out at its next call. */
export async function revokeCliToken(userId: string, id: string, opts: Options = {}): Promise<boolean> {
  const { store, now } = of(opts);
  return store.revokeToken(userId, id, now);
}

// ---------------------------------------------------------------------------
// The stores
// ---------------------------------------------------------------------------

const state = (raw: string): DeviceCodeState => {
  if (raw === "pending" || raw === "approved" || raw === "denied" || raw === "used") return raw;
  throw new Error(`a device code was kept in an unknown state: ${raw}`);
};

type CodeDb = { id: string; user_code: string; client: string; business: string | null; state: string; user_id: string | null; expires_at: Date; last_polled_at: Date | null; interval_seconds: number };
const toCode = (r: CodeDb): DeviceCodeRow => ({ id: r.id, userCode: r.user_code, client: r.client, business: r.business, state: state(r.state), userId: r.user_id, expiresAt: r.expires_at, lastPolledAt: r.last_polled_at, intervalSeconds: r.interval_seconds });
const CODE_COLUMNS = "id, user_code, client, business, state, user_id, expires_at, last_polled_at, interval_seconds";

type TokenDb = { id: string; user_id: string; business: string; client: string; created_at: Date; expires_at: Date; last_used_at: Date | null; revoked_at: Date | null };
const toToken = (r: TokenDb): CliTokenRow => ({ id: r.id, userId: r.user_id, business: r.business, client: r.client, createdAt: r.created_at, expiresAt: r.expires_at, lastUsedAt: r.last_used_at, revokedAt: r.revoked_at });
const TOKEN_COLUMNS = "id, user_id, business, client, created_at, expires_at, last_used_at, revoked_at";

/** The live store: migration 0069's two tables. */
export const postgresDeviceAuth: DeviceAuthStore = {
  async insertCode(row) {
    const r = await db().query(
      `INSERT INTO naive_device_code (id, device_code_hash, user_code, client, business, expires_at, interval_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING RETURNING id`,
      [row.id, row.deviceCodeHash, row.userCode, row.client, row.business, row.expiresAt, row.intervalSeconds],
    );
    return r.rowCount === 1;
  },
  async codeByUserCode(userCode) {
    const r = await db().query<CodeDb>(`SELECT ${CODE_COLUMNS} FROM naive_device_code WHERE user_code = $1`, [userCode]);
    return r.rows[0] ? toCode(r.rows[0]) : null;
  },
  async codeByDeviceHash(hash) {
    const r = await db().query<CodeDb>(`SELECT ${CODE_COLUMNS} FROM naive_device_code WHERE device_code_hash = $1`, [hash]);
    return r.rows[0] ? toCode(r.rows[0]) : null;
  },
  async decideCode(id, d) {
    const r = await db().query(
      `UPDATE naive_device_code SET state = $2, user_id = $3, business = coalesce($4, business), decided_at = $5
       WHERE id = $1 AND state = 'pending' AND expires_at > $5 RETURNING id`,
      [id, d.state, d.userId, d.business, d.at],
    );
    return r.rowCount === 1;
  },
  async claimApprovedCode(id, at) {
    const r = await db().query<{ user_id: string; business: string }>(
      `UPDATE naive_device_code SET state = 'used', used_at = $2
       WHERE id = $1 AND state = 'approved' AND user_id IS NOT NULL AND business IS NOT NULL RETURNING user_id, business`,
      [id, at],
    );
    const row = r.rows[0];
    return row ? { userId: row.user_id, business: row.business } : null;
  },
  async polled(id, at, intervalSeconds) {
    await db().query(`UPDATE naive_device_code SET last_polled_at = $2, interval_seconds = $3 WHERE id = $1`, [id, at, intervalSeconds]);
  },
  async insertToken(row) {
    await db().query(
      `INSERT INTO naive_cli_token (id, user_id, business, client, token_hash, device_code_id, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [row.id, row.userId, row.business, row.client, row.tokenHash, row.deviceCodeId, row.createdAt, row.expiresAt],
    );
  },
  async tokenByHash(hash) {
    const r = await db().query<TokenDb>(`SELECT ${TOKEN_COLUMNS} FROM naive_cli_token WHERE token_hash = $1`, [hash]);
    return r.rows[0] ? toToken(r.rows[0]) : null;
  },
  async tokenUsed(id, at) {
    await db().query(`UPDATE naive_cli_token SET last_used_at = $2 WHERE id = $1`, [id, at]);
  },
  async tokensOf(userId) {
    const r = await db().query<TokenDb>(`SELECT ${TOKEN_COLUMNS} FROM naive_cli_token WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return r.rows.map(toToken);
  },
  async revokeToken(userId, id, at) {
    const r = await db().query(`UPDATE naive_cli_token SET revoked_at = $3 WHERE id = $2 AND user_id = $1 AND revoked_at IS NULL RETURNING id`, [userId, id, at]);
    return r.rowCount === 1;
  },
};

/** The same store over memory, with the same claiming rules, for tests. */
export function memoryDeviceAuthStore(): DeviceAuthStore & { codes: DeviceCodeRow[]; tokens: (CliTokenRow & { tokenHash: string })[] } {
  const codes: (DeviceCodeRow & { deviceCodeHash: string })[] = [];
  const tokens: (CliTokenRow & { tokenHash: string })[] = [];
  return {
    codes,
    tokens,
    async insertCode(row) {
      if (codes.some((c) => c.userCode === row.userCode || c.deviceCodeHash === row.deviceCodeHash)) return false;
      codes.push({ id: row.id, deviceCodeHash: row.deviceCodeHash, userCode: row.userCode, client: row.client, business: row.business, state: "pending", userId: null, expiresAt: row.expiresAt, lastPolledAt: null, intervalSeconds: row.intervalSeconds });
      return true;
    },
    async codeByUserCode(userCode) {
      return codes.find((c) => c.userCode === userCode) ?? null;
    },
    async codeByDeviceHash(hash) {
      return codes.find((c) => c.deviceCodeHash === hash) ?? null;
    },
    async decideCode(id, d) {
      const row = codes.find((c) => c.id === id && c.state === "pending" && c.expiresAt > d.at);
      if (!row) return false;
      row.state = d.state;
      row.userId = d.userId;
      row.business = d.business ?? row.business;
      return true;
    },
    async claimApprovedCode(id) {
      const row = codes.find((c) => c.id === id && c.state === "approved");
      if (!row || row.userId === null || row.business === null) return null;
      row.state = "used";
      return { userId: row.userId, business: row.business };
    },
    async polled(id, at, intervalSeconds) {
      const row = codes.find((c) => c.id === id);
      if (!row) return;
      row.lastPolledAt = at;
      row.intervalSeconds = intervalSeconds;
    },
    async insertToken(row) {
      tokens.push({ id: row.id, userId: row.userId, business: row.business, client: row.client, tokenHash: row.tokenHash, createdAt: row.createdAt, expiresAt: row.expiresAt, lastUsedAt: null, revokedAt: null });
    },
    async tokenByHash(hash) {
      return tokens.find((t) => t.tokenHash === hash) ?? null;
    },
    async tokenUsed(id, at) {
      const row = tokens.find((t) => t.id === id);
      if (row) row.lastUsedAt = at;
    },
    async tokensOf(userId) {
      return tokens.filter((t) => t.userId === userId);
    },
    async revokeToken(userId, id, at) {
      const row = tokens.find((t) => t.id === id && t.userId === userId && t.revokedAt === null);
      if (!row) return false;
      row.revokedAt = at;
      return true;
    },
  };
}
