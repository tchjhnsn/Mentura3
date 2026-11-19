// Calls to services outside Reflect (Open Library, Wikipedia, Apple's podcast search and the rest), in one place, with
// Effect (effect.website): each call has a time limit, is tried again with jittered backoff when the service is busy
// or cannot be reached, and fails with a tagged error saying which. Callers on Promises use `outsideFetch` (a fetch
// that times out and retries) or `outsideText` (the body, or null on any failure); Effect code uses `call`.
import { Data, Duration, Effect, Schedule } from "effect";

/** The service did not answer in time. */
export class TimedOut extends Data.TaggedError("TimedOut")<{ readonly url: string; readonly ms: number }> {}
/** The request did not reach the service (DNS, connection, TLS). */
export class Unreachable extends Data.TaggedError("Unreachable")<{ readonly url: string; readonly cause: unknown }> {}
/** The service answered 429 or 5xx: worth trying again. Carries the last response. */
export class Busy extends Data.TaggedError("Busy")<{ readonly url: string; readonly status: number; readonly response: Response }> {}

export type OutsideError = TimedOut | Unreachable | Busy;

export type CallOptions = {
  /** Time limit for one try, in milliseconds. Default 8000. */
  timeoutMs?: number;
  /** Tries after the first. Default 2. */
  retries?: number;
  /** The first wait between tries, doubled each time and jittered. Default 200 ms. */
  backoffMs?: number;
  /** The user-agent Reflect sends. Default "reflect-app". */
  userAgent?: string;
  /** The fetch to use; tests pass their own. */
  fetcher?: typeof fetch;
};

const DEFAULTS = { timeoutMs: 8000, retries: 2, backoffMs: 200, userAgent: "reflect-app" };

/** Whether a status is worth trying again. */
export const retryable = (status: number): boolean => status === 429 || status >= 500;

/**
 * One call to an outside service. Succeeds with the response for any status that is not worth trying again (a 404
 * included: the caller decides what it means); fails with Busy after the last try still got 429 or 5xx.
 */
export function call(url: string, init: RequestInit = {}, opts: CallOptions = {}): Effect.Effect<Response, OutsideError> {
  const o = { ...DEFAULTS, ...opts };
  const doFetch = o.fetcher ?? fetch;
  const headers = new Headers(init.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", o.userAgent);
  const once = Effect.tryPromise({
    try: (signal) => doFetch(url, { ...init, headers, signal: init.signal ? AbortSignal.any([init.signal, signal]) : signal }),
    catch: (cause) => new Unreachable({ url, cause }),
  }).pipe(
    Effect.timeoutOrElse({ duration: Duration.millis(o.timeoutMs), orElse: () => Effect.fail(new TimedOut({ url, ms: o.timeoutMs })) }),
    Effect.flatMap((response) => (retryable(response.status) ? Effect.fail(new Busy({ url, status: response.status, response })) : Effect.succeed(response))),
  );
  if (o.retries <= 0) return once;
  return once.pipe(Effect.retry({ schedule: Schedule.exponential(Duration.millis(o.backoffMs)).pipe(Schedule.jittered), times: o.retries }));
}

/**
 * A fetch for Promise callers and for core's injected fetchers: times out and retries like `call`. It resolves with
 * the response for every status (after the last try, a 429 or 5xx too) and rejects only when no answer came.
 */
export function outsideFetch(opts: CallOptions = {}): (url: string, init?: RequestInit) => Promise<Response> {
  return (url, init) =>
    Effect.runPromise(
      call(url, init, opts).pipe(
        Effect.catchTag("Busy", (e) => Effect.succeed(e.response)),
      ),
    );
}

/** The body of a call that answered 2xx, or null for any other status or failure. */
export function outsideText(url: string, init: RequestInit = {}, opts: CallOptions = {}): Promise<string | null> {
  return Effect.runPromise(
    call(url, init, opts).pipe(
      Effect.flatMap((r) => (r.ok ? Effect.tryPromise({ try: () => r.text(), catch: (cause) => new Unreachable({ url, cause }) }) : Effect.succeed(null))),
      Effect.catchTags({ TimedOut: () => Effect.succeed(null), Unreachable: () => Effect.succeed(null), Busy: () => Effect.succeed(null) }),
    ),
  );
}
