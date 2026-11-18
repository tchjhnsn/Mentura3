// Better Auth's options for Reflect, apart from the database, so tests can run the same OAuth server on an
// in-memory store (auth-options.test.ts) and the app runs it on Postgres (./auth.ts).
import type { BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mcp } from "@better-auth/mcp";
import { ADULT_REQUIRED, confirmsAdult } from "./adult";

/** What a person's own AI may ask for. "journal" covers what the MCP tools do (see /consent for the words). */
export const MCP_SCOPES = ["openid", "profile", "offline_access", "journal"] as const;

export type AuthSite = { baseURL: string; trustedOrigins: string[]; resource: string };

export function reflectAuthOptions<D extends BetterAuthOptions["database"]>(database: D, site: AuthSite) {
  return {
    database,
    baseURL: site.baseURL,
    trustedOrigins: site.trustedOrigins,
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
    // Continue with Google (doc "Profiles and accounts design guide", 2026-11-18), only once the deployment holds
    // GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (by name). Google never makes a new account, since sign-up asks the
    // person to confirm they are 18 or older (./adult.ts); a signed-in person links it to their account
    // (Settings, Account, Sign-in), and from then on it signs them in.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? { socialProviders: { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, disableSignUp: true } } }
      : {}),
    account: { accountLinking: { enabled: true, trustedProviders: ["google"], allowDifferentEmails: true } },
    // 18 or older (./adult.ts): a sign-up without the person's confirmation is refused.
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email" && !confirmsAdult(ctx.body)) throw new APIError("BAD_REQUEST", { message: ADULT_REQUIRED });
      }),
    },
    // Browser tests sign up many accounts from one address; they turn the limit off explicitly.
    rateLimit: { enabled: process.env.REFLECT_RATE_LIMIT !== "off" },
    plugins: [
      jwt(),
      // Reflect as an OAuth 2.1 server for MCP clients (Claude, ChatGPT and others), per the MCP authorization spec:
      // protected resource metadata (RFC 9728) and authorization server metadata (RFC 8414) for discovery, dynamic
      // client registration (RFC 7591, since a person's AI app is not known in advance), PKCE on every code, the
      // person signs in to Reflect and agrees on /consent, and the access token is a JWT bound to /api/mcp whose
      // `sub` is the Reflect user.
      mcp({
        loginPage: "/sign-in",
        consentPage: "/consent",
        resource: site.resource,
        scopes: [...MCP_SCOPES],
        clientRegistrationDefaultScopes: [...MCP_SCOPES],
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
      }),
      nextCookies(),
    ],
  } satisfies BetterAuthOptions;
}
