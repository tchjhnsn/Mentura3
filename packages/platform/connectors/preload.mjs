// Registers the platform's connectors before a Naive script runs, so a Naive checker run as its own process
// (check-sources, the router CLI) knows them too:
//
//   node --import ./platform/connectors/preload.mjs node_modules/naive-framework/packages/naive/src/checks/check-sources.mjs <dir>

import { registerPlatformConnectors } from "./register.mjs";

registerPlatformConnectors();
