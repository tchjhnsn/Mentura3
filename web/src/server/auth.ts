import { betterAuth } from "better-auth";
import { db } from "@/db/pool";
import { reflectAuthOptions } from "./auth-options";
import { cookieDomain, mcpResource, siteOrigins, siteUrl } from "./site";

export { MCP_SCOPES } from "./auth-options";

/** Better Auth on Neon Postgres: email and password, and the OAuth server for a person's own AI (./auth-options.ts). */
export const auth = betterAuth(reflectAuthOptions(db(), { baseURL: siteUrl(), trustedOrigins: siteOrigins(), resource: mcpResource(), cookieDomain: cookieDomain() }));
