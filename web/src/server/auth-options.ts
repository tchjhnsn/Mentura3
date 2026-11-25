// Better Auth's options for Reflect, apart from the database, so tests can run the same OAuth server on an
// in-memory store (auth-options.test.ts) and the app runs it on Postgres (./auth.ts).
import type { BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { jwt, organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, ownerAc } from "better-auth/plugins/organization/access";
import { nextCookies } from "better-auth/next-js";
import { mcp } from "@better-auth/mcp";
import { ADULT_REQUIRED, confirmsAdult } from "./adult";
import { ensurePersonalTeam, PERSONAL_TEAM_KEPT, teamSlugProblem } from "./teams-core";

// Teams (doc "Mentura console: screens, navigation and teams", 2026-11-25): a team is a Better Auth organization, and
// Mentura says "team" on every screen. Three roles, cut down from Vercel's five: an Owner does everything, a Member
// works the team's businesses, a Viewer only sees them. Members and Viewers manage nobody. (Better Auth's own "teams"
// inside an organization stay off: Mentura's team is the organization.)
const teamAccess = createAccessControl(defaultStatements);
export const TEAM_ACCESS_ROLES = {
  owner: teamAccess.newRole(ownerAc.statements),
  member: teamAccess.newRole({ organization: [], member: [], invitation: [], team: [], ac: ["read"] }),
  viewer: teamAccess.newRole({ organization: [], member: [], invitation: [], team: [], ac: ["read"] }),
};

/** What a person's own AI may ask for. "journal" covers what the MCP tools do (see /consent for the words). */
export const MCP_SCOPES = ["openid", "profile", "offline_access", "journal"] as const;

export type AuthSite = { baseURL: string; trustedOrigins: string[]; resource: string; /** Set when Home and Village and polis have their own hosts, so one sign-in covers both. */ cookieDomain?: string | null };

export function reflectAuthOptions<D extends BetterAuthOptions["database"]>(database: D, site: AuthSite) {
  return {
    database,
    baseURL: site.baseURL,
    trustedOrigins: site.trustedOrigins,
    // One sign-in for both sides (doc "Private and shared Reflect plan", 2026-11-19): with a custom domain the session
    // cookie sits on the parent domain, so mentura.xyz and polis.mentura.xyz see the same person.
    ...(site.cookieDomain ? { advanced: { crossSubDomainCookies: { enabled: true, domain: site.cookieDomain } } } : {}),
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
    // Every person gets a personal team at sign-up, with the person's own id (./teams-core.ts), so the hosted business
    // store's tenant, which was the person's id, is now that team's id and every existing business stays where it is.
    databaseHooks: {
      user: { create: { after: async (user, ctx) => { if (ctx) await ensurePersonalTeam(ctx.context.adapter, user); } } },
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
      organization({
        ac: teamAccess,
        roles: TEAM_ACCESS_ROLES,
        creatorRole: "owner",
        allowUserToCreateOrganization: true,
        organizationHooks: {
          beforeCreateOrganization: async ({ organization: o }) => { const why = o.slug ? teamSlugProblem(o.slug) : null; if (why) throw new APIError("BAD_REQUEST", { message: why }); },
          beforeUpdateOrganization: async ({ organization: o }) => { const why = o.slug ? teamSlugProblem(o.slug) : null; if (why) throw new APIError("BAD_REQUEST", { message: why }); },
          // A personal team cannot be deleted or left: its id is its person's.
          beforeDeleteOrganization: async ({ organization: o, user }) => { if (o.id === user.id) throw new APIError("BAD_REQUEST", { message: PERSONAL_TEAM_KEPT }); },
          beforeRemoveMember: async ({ member, organization: o }) => { if (member.userId === o.id) throw new APIError("BAD_REQUEST", { message: PERSONAL_TEAM_KEPT }); },
        },
      }),
      nextCookies(),
    ],
  } satisfies BetterAuthOptions;
}
