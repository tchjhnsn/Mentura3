#!/usr/bin/env node
// The launch line for function agents (EE-123): `node <EE>/platform/agents/bin.ts run|mcp ...`. The CLI is imported
// dynamically, so a caller (a harness's MCP config, a trigger, the shim spawning a run) needs no --import flag and
// no working directory. A static import would resolve Naive's .ts modules before this file finishes loading.


const { main } = await import("./cli.ts");
const code = await main(process.argv.slice(2), process.env, process.stdin);
// A provider client can keep sockets open after the run, so the process exits once stdout has flushed.
process.stdout.write("", () => process.exit(code));
