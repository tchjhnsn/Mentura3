/** The only provider this package runs. A row is not a grant. GitHub stays on the store connector. */

export const CATALOG_VERSION = "0";

export const LOCAL_FIXTURE_ID = "local-fixture";

/** Store-connector names. submit refuses them so record IO stays on platform/connectors. */
export const STORE_CONNECTOR_IDS = ["filesystem", "github", "postgres"] as const;

export interface ProviderClaim {
  readonly status: "hypothesized";
  readonly statement: string;
  readonly functionId: null;
  readonly evidence: { readonly kind: "unrun"; readonly check: "outside/host.test.ts" };
  readonly provenance: { readonly by: "catalog"; readonly catalogVersion: typeof CATALOG_VERSION };
}

export interface ProviderDefinition {
  readonly id: typeof LOCAL_FIXTURE_ID;
  readonly catalogVersion: typeof CATALOG_VERSION;
  readonly reach: "local-process";
  readonly operations: readonly ["read", "write", "inbound"];
  readonly claims: readonly [ProviderClaim];
}

export const LOCAL_FIXTURE: ProviderDefinition = {
  id: LOCAL_FIXTURE_ID,
  catalogVersion: CATALOG_VERSION,
  reach: "local-process",
  operations: ["read", "write", "inbound"],
  claims: [{
    status: "hypothesized",
    statement: "Reads and writes a directory on this machine. It is not a vendor and it is not a verified finance integration.",
    functionId: null,
    evidence: { kind: "unrun", check: "outside/host.test.ts" },
    provenance: { by: "catalog", catalogVersion: CATALOG_VERSION },
  }],
};

export function isStoreConnectorId(id: string): boolean {
  return (STORE_CONNECTOR_IDS as readonly string[]).includes(id);
}
