// The platform's connectors, registered with Naive (EE-041, EE-118). Naive's registry
// (naive-framework/knowledge/connectors/index.mjs) names only the connectors that ship with the framework; a
// connector that reaches a vendor lives here and is added in the process that uses it.
//
//   import { registerPlatformConnectors } from "./platform/connectors/register.mjs";
//   registerPlatformConnectors();
//
// GitHub: a source map entry { "connector": "github", "repo": "owner/name", ... } reads records from a repository
// and writes them as draft pull requests (github.mjs). Its eval is platform/connectors/eval.mjs (live:
// MENTURA_EVAL_GITHUB_REPO=owner/name).

import { fileURLToPath } from "node:url";
import { registerConnector } from "naive-framework/knowledge/connectors/index.mjs";

export const GITHUB = {
  name: "GitHub",
  module: fileURLToPath(new URL("./github.mjs", import.meta.url)),
  writes: ["pull-request", "none"],
  options: ["repo", "ref", "root", "token", "api", "search"],
};

// Postgres: a source map entry { "connector": "postgres", "tenant": "<id>", "root": "ventures/acme" } keeps the
// records in a tenant's Postgres store, Neon in production (postgres.ts, EE-118 step 9). The connection string
// is in the variable url names (default MENTURA_DATABASE_URL). Its eval is platform/connectors/postgres-eval.ts.
export const POSTGRES = {
  name: "Postgres",
  module: fileURLToPath(new URL("./postgres.ts", import.meta.url)),
  writes: ["direct", "none"],
  options: ["tenant", "root", "url"],
};

/** Adds every platform connector to Naive's registry in this process. */
export function registerPlatformConnectors() {
  registerConnector("github", GITHUB);
  registerConnector("postgres", POSTGRES);
}
