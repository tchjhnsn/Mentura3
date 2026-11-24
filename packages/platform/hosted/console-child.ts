// One hosted console call, in its own process. The Next server starts this file and does not import it,
// so the framework stays out of the server bundle. The request arrives on stdin, never as an argument.
//
//   node platform/hosted/console-child.ts   < {"userId","assertion","bridgePath","key","timeoutMs"}

import { readFileSync } from "node:fs";
import { closeWorkspacePools, runHostedBridge } from "./account-workspace.ts";
import { publicMessage } from "./public-error.ts";

interface Request {
  userId?: string;
  assertion?: string;
  bridgePath?: string;
  key?: string;
  timeoutMs?: number;
}

function reply(body: { ok: true; result: unknown } | { ok: false; error: string }): void {
  process.stdout.write(JSON.stringify(body));
}

let request: Request;
try {
  request = JSON.parse(readFileSync(0, "utf8")) as Request;
} catch {
  reply({ ok: false, error: publicMessage("") });
  process.exit(0);
}

try {
  if (!request.userId || !request.assertion || !request.bridgePath || !request.key) {
    reply({ ok: false, error: publicMessage("") });
  } else {
    const result = await runHostedBridge({
      userId: request.userId,
      assertion: request.assertion,
      bridgePath: request.bridgePath,
      key: request.key,
      timeoutMs: request.timeoutMs,
    });
    reply({ ok: true, result });
  }
} catch (error) {
  reply({ ok: false, error: publicMessage(error) });
} finally {
  await closeWorkspacePools();
}
