// The Integrations state machines as data (spec "Integrations: formal specification", Formal model, agreed 2026-11-25).
// Each row is one transition: from, event, guard, to, effect. A transition that is not listed cannot happen. The screens,
// the state lint and the model check (integrations-machines.test.ts) all read these definitions, so they cannot drift.
// Guards are named, not coded: the model check treats each guard as free to pass or fail, which covers every outcome.

export type Transition<S extends string, E extends string> = {
  from: readonly S[];
  on: E;
  /** The condition, named. Absent means the transition always fires. */
  guard?: string;
  to: S;
  effect?: string;
};

export type Machine<S extends string, E extends string> = {
  id: string;
  name: string;
  states: readonly S[];
  initial: S;
  /** States a run can stop in. Every other state must have a way out. */
  terminal: readonly S[];
  /** Each failure state and the one next action the screen shows for it (P31). */
  failures: Partial<Record<S, string>>;
  transitions: readonly Transition<S, E>[];
};

const machine = <S extends string, E extends string>(m: Machine<S, E>): Machine<S, E> => m;

// M1 Connection. A connection belongs to one person. Expired keeps its grants and sources; only removal clears them.
export const CONNECTION_STATES = ["none", "pending", "connected", "expired", "removed"] as const;
export type ConnectionState = (typeof CONNECTION_STATES)[number];
export type ConnectionEvent =
  | "connect" | "signed in" | "cancelled" | "denied" | "failed" | "timed out"
  | "token rejected" | "refreshed" | "reconnect" | "disconnect" | "owner deleted";

/** States in which sealed tokens may exist (P6). */
export const HOLDS_TOKENS: readonly ConnectionState[] = ["connected", "expired"];

export const M1 = machine<ConnectionState, ConnectionEvent>({
  id: "M1",
  name: "Connection",
  states: CONNECTION_STATES,
  initial: "none",
  terminal: ["none", "removed"],
  failures: { expired: "Reconnect" },
  transitions: [
    { from: ["none"], on: "connect", guard: "service ready and broker allowed", to: "pending", effect: "start M2; record broker" },
    { from: ["pending"], on: "signed in", guard: "M2 reached done", to: "connected", effect: "save sealed tokens, account name, connected at" },
    { from: ["pending"], on: "cancelled", to: "none", effect: "clear sealed sign-in data" },
    { from: ["pending"], on: "denied", to: "none", effect: "clear sealed sign-in data" },
    { from: ["pending"], on: "failed", to: "none", effect: "clear sealed sign-in data" },
    { from: ["pending"], on: "timed out", to: "none", effect: "clear sealed sign-in data" },
    { from: ["connected"], on: "token rejected", guard: "one refresh tried and failed (401)", to: "expired", effect: "keep grants and sources; show Reconnect" },
    { from: ["connected"], on: "refreshed", guard: "refresh succeeded", to: "connected", effect: "rotate the refresh token" },
    { from: ["expired"], on: "reconnect", guard: "same account chosen at the service", to: "connected", effect: "keep grants and sources" },
    { from: ["pending", "connected", "expired"], on: "disconnect", guard: "confirmed after seeing what depends on it", to: "removed", effect: "clear tokens, client, verifier, discovery; mark drawn records no longer synced" },
    { from: ["none", "pending", "connected", "expired", "removed"], on: "owner deleted", to: "removed", effect: "clear every sealed field" },
  ],
});

// M2 Sign-in. One run per Connect or Reconnect. Step-up for more permission is bounded at two tries, so every run ends.
export const SIGN_IN_STATES = [
  "discovering", "registering", "authorizing", "authorizing (step-up 1)", "authorizing (step-up 2)",
  "exchanging", "exchanging (step-up 1)", "exchanging (step-up 2)", "done",
  "cancelled", "denied", "wrong account", "needs more permission", "unreachable",
] as const;
export type SignInState = (typeof SIGN_IN_STATES)[number];
export type SignInEvent =
  | "metadata found" | "metadata unsafe" | "client registered" | "code returned" | "user cancelled" | "access denied"
  | "tokens saved" | "tokens for another account" | "insufficient scope" | "network error";

const ACTIVE_SIGN_IN: readonly SignInState[] = [
  "discovering", "registering", "authorizing", "authorizing (step-up 1)", "authorizing (step-up 2)",
  "exchanging", "exchanging (step-up 1)", "exchanging (step-up 2)",
];
const AUTHORIZING: readonly SignInState[] = ["authorizing", "authorizing (step-up 1)", "authorizing (step-up 2)"];
const EXCHANGING: readonly SignInState[] = ["exchanging", "exchanging (step-up 1)", "exchanging (step-up 2)"];
// The step-up count is part of the state, through the exchange too: an earlier model reset it there, and the model
// check found the loop (authorizing (step-up 1), exchanging, insufficient scope, authorizing (step-up 1) again).

export const M2 = machine<SignInState, SignInEvent>({
  id: "M2",
  name: "Sign-in",
  states: SIGN_IN_STATES,
  initial: "discovering",
  terminal: ["done", "cancelled", "denied", "wrong account", "needs more permission", "unreachable"],
  failures: {
    cancelled: "Try again",
    denied: "Try again",
    "wrong account": "Use the account this was connected with",
    "needs more permission": "Allow more",
    unreachable: "Try later",
  },
  transitions: [
    { from: ["discovering"], on: "metadata found", guard: "https address, PKCE S256, no client held", to: "registering" },
    { from: ["discovering"], on: "metadata found", guard: "https address, PKCE S256, client held", to: "authorizing" },
    { from: ["discovering"], on: "metadata unsafe", to: "unreachable", effect: "log the reason; never open the address" },
    { from: ["registering"], on: "client registered", to: "authorizing", effect: "seal the client" },
    { from: ["authorizing"], on: "code returned", guard: "state matches; resource indicator sent", to: "exchanging" },
    { from: ["authorizing (step-up 1)"], on: "code returned", guard: "state matches; resource indicator sent", to: "exchanging (step-up 1)" },
    { from: ["authorizing (step-up 2)"], on: "code returned", guard: "state matches; resource indicator sent", to: "exchanging (step-up 2)" },
    { from: AUTHORIZING, on: "user cancelled", to: "cancelled" },
    { from: AUTHORIZING, on: "access denied", to: "denied" },
    { from: EXCHANGING, on: "tokens saved", to: "done" },
    { from: EXCHANGING, on: "tokens for another account", to: "wrong account", effect: "discard the tokens" },
    { from: ["authorizing", "exchanging"], on: "insufficient scope", to: "authorizing (step-up 1)", effect: "ask for the named scope" },
    { from: ["authorizing (step-up 1)", "exchanging (step-up 1)"], on: "insufficient scope", to: "authorizing (step-up 2)", effect: "ask for the named scope" },
    { from: ["authorizing (step-up 2)", "exchanging (step-up 2)"], on: "insufficient scope", to: "needs more permission" },
    { from: ACTIVE_SIGN_IN, on: "network error", to: "unreachable" },
  ],
});

// M3 Grant, per connection and business. A new business starts with no grants (R21).
export const GRANT_STATES = ["none", "granted", "narrowed", "revoked"] as const;
export type GrantState = (typeof GRANT_STATES)[number];
export type GrantEvent = "grant" | "narrow" | "widen" | "revoke" | "connection removed";

export const M3 = machine<GrantState, GrantEvent>({
  id: "M3",
  name: "Grant",
  states: GRANT_STATES,
  initial: "none",
  terminal: ["none", "granted", "narrowed", "revoked"],
  failures: {},
  transitions: [
    { from: ["none", "revoked"], on: "grant", guard: "connection is connected or expired", to: "granted", effect: "record who in the business may use it" },
    { from: ["granted"], on: "narrow", guard: "kept capabilities are a subset of the service's", to: "narrowed" },
    { from: ["narrowed"], on: "widen", to: "granted" },
    { from: ["granted", "narrowed"], on: "revoke", to: "revoked", effect: "sources using it go unreachable; records stay, marked no longer synced" },
    { from: ["none", "granted", "narrowed", "revoked"], on: "connection removed", to: "revoked", effect: "same as revoke" },
  ],
});

// M4 Source of truth, per business and record kind. Leaving unreachable takes a person's choice, never a timer.
export const SOURCE_STATES = ["reflect", "outside", "unreachable"] as const;
export type SourceState = (typeof SOURCE_STATES)[number];
export type SourceEvent = "choose reflect" | "choose outside" | "access lost";

export const M4 = machine<SourceState, SourceEvent>({
  id: "M4",
  name: "Source of truth",
  states: SOURCE_STATES,
  initial: "reflect",
  terminal: ["reflect", "outside", "unreachable"],
  failures: { unreachable: "Choose a source" },
  transitions: [
    { from: ["reflect", "outside", "unreachable"], on: "choose outside", guard: "a granted service holds this record kind's capability", to: "outside", effect: "write a source map rule; copy nothing" },
    { from: ["outside", "unreachable"], on: "choose reflect", guard: "a person chose it", to: "reflect" },
    { from: ["outside"], on: "access lost", to: "unreachable", effect: "say so on every screen that reads it" },
  ],
});

// M7 Action. Reads run; anything else waits for Send unless delegation covers its class.
export const ACTION_STATES = ["drafted", "waiting", "sending", "done", "declined", "failed"] as const;
export type ActionState = (typeof ACTION_STATES)[number];
export type ActionEvent = "propose read" | "propose write" | "propose covered write" | "send" | "edit" | "decline" | "result" | "tool error";

export const M7 = machine<ActionState, ActionEvent>({
  id: "M7",
  name: "Action",
  states: ACTION_STATES,
  initial: "drafted",
  terminal: ["done", "declined", "failed"],
  failures: { failed: "Try again" },
  transitions: [
    { from: ["drafted"], on: "propose read", guard: "trusted read-only hint on a catalog service", to: "sending" },
    { from: ["drafted"], on: "propose write", guard: "delegation does not cover its class", to: "waiting", effect: "show the card in place and in Approvals" },
    { from: ["drafted"], on: "propose covered write", guard: "delegation covers its class", to: "sending", effect: "log under the delegation" },
    { from: ["waiting"], on: "send", guard: "Send pressed on a card naming connection, account, tool and arguments", to: "sending" },
    { from: ["waiting"], on: "edit", to: "drafted" },
    { from: ["waiting"], on: "decline", to: "declined", effect: "record the reason" },
    { from: ["sending"], on: "result", to: "done", effect: "append to activity" },
    { from: ["sending"], on: "tool error", to: "failed", effect: "append to activity" },
  ],
});

/** What a connection's change does to each of its grants. Expiry is absent on purpose: it never touches grants (P8). */
export const ON_CONNECTION: Partial<Record<ConnectionState, GrantEvent>> = { removed: "connection removed" };

/** The connection states in which a business may be granted a connection (M3 grant guard). */
export const GRANTABLE: readonly ConnectionState[] = ["connected", "expired"];

export const MACHINES = [M1, M2, M3, M4, M7] as const;

/** Where an event leads from a state: one target per matching row, since a guard may pass or fail. */
export function next<S extends string, E extends string>(m: Machine<S, E>, from: S, on: E): S[] {
  return m.transitions.filter((t) => t.on === on && t.from.includes(from)).map((t) => t.to);
}

/** Every state reachable from the initial state. */
export function reachable<S extends string, E extends string>(m: Machine<S, E>): Set<S> {
  const seen = new Set<S>([m.initial]);
  const queue: S[] = [m.initial];
  while (queue.length) {
    const s = queue.shift() as S;
    for (const t of m.transitions) {
      if (t.from.includes(s) && !seen.has(t.to)) {
        seen.add(t.to);
        queue.push(t.to);
      }
    }
  }
  return seen;
}
