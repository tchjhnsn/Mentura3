#!/usr/bin/env node
// The launch line for function agents (EE-123): `node <EE>/platform/agents/bin.ts run|mcp ...`. It registers the
// loader that strips types from Naive's .ts files under node_modules (scripts/naive-ts.ts) and only then loads the
// CLI, so a caller (Grokbot's MCP config, a trigger, the shim spawning a run) needs no --import flag and no working
// directory. The CLI is imported dynamically on purpose: a static import would resolve Naive's .ts modules before the
// loader is registered. Remove the first import when Naive ships compiled JavaScript.

import "../../scripts/naive-ts.ts";

const { main } = await import("./cli.ts");
const code = await main(process.argv.slice(2), process.env, process.stdin);
// A provider client can keep sockets open after the run, so the process exits once stdout has flushed.
process.stdout.write("", () => process.exit(code));
