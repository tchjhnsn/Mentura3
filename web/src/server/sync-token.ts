// The bearer token every offline sync call carries (offline sync contract, EE-174). The sync API calls
// `verifySyncToken(req)` first and answers 401 `{ "error": "unauthorized" }` when it gives back null, which covers a
// missing header, a token that was never issued, an expired one and a revoked one. The token itself is a command line
// token from device sign-in (./device-auth.ts); nothing else issues one.
import { verifyCliToken, type DeviceAuthStore, type TokenHolder } from "./device-auth";

/** The token in an `Authorization: Bearer <token>` header, or null when the header is missing or is another scheme. */
export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;
  const token = rest.join("");
  return token.length > 0 ? token : null;
}

/** Who a sync call speaks for: the person's account id and the one business their token is scoped to. */
export type { TokenHolder };

/**
 * The holder of the request's bearer token, or null when the call carries no live token. The sync API calls it with
 * the request alone; `opts` is how a test hands it a store over memory and a fixed time.
 */
export async function verifySyncToken(req: Request, opts: { store?: DeviceAuthStore; now?: Date } = {}): Promise<TokenHolder | null> {
  const token = bearerToken(req);
  return token === null ? null : verifyCliToken(token, opts);
}
