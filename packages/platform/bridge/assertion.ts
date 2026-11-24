// What the Next.js server tells the bridge: who is asking, for exactly this request, for one minute.
// This keeps a request from the console honest; it does not stop a program on the machine. The bridge
// takes its key from its caller's environment, so anyone who runs it by hand can choose a key and sign.

import { createHmac, timingSafeEqual } from "node:crypto";

export type Identity = { userId: string; name: string; email: string; organizationId: string; organizationRole: string };
type Request = { op: string; [k: string]: unknown };
type Claims = { identity: Identity; request: Request; expires: number };

const LIFETIME_MS = 60_000;
const mac = (body: string, key: string) => createHmac("sha256", key).update(body).digest();

export function signAssertion(identity: Identity, request: Request, key: string): string {
  const claims: Claims = { identity, request, expires: Date.now() + LIFETIME_MS };
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${body}.${mac(body, key).toString("base64url")}`;
}

export function openAssertion(assertion: string, key: string | undefined): Claims {
  const refused = new Error("The console refused this request: it carries no signed identity.");
  const [body, signature, extra] = assertion.split(".");
  if (!key || !body || !signature || extra !== undefined) throw refused;
  const given = Buffer.from(signature, "base64url"), expected = mac(body, key);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw refused;
  const claims: Claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!Number.isFinite(claims.expires) || Date.now() > claims.expires) throw refused;
  return claims;
}
