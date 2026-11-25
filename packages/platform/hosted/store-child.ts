// One change to a whole business or team (hosted/store-change.ts), in its own process. The Next server starts this
// file and does not import it, so the framework and the database driver stay out of the server bundle, as with
// hosted/console-child.ts. The request arrives on stdin, never as an argument, and the answer is one line of JSON.
//
//   node packages/platform/hosted/store-child.ts   < {"op":"move","key","from","to"} | {"op":"remove","key","assertion"}

import { readFileSync } from "node:fs";
import { closeWorkspacePools } from "./account-workspace.ts";
import { publicMessage } from "./public-error.ts";
import { runStoreChange, type StoreRequest } from "./store-change.ts";

const reply = (body: { ok: true; result: unknown } | { ok: false; error: string }) => process.stdout.write(JSON.stringify(body));

try {
  const request = JSON.parse(readFileSync(0, "utf8")) as StoreRequest;
  reply({ ok: true, result: await runStoreChange(request) });
} catch (error) {
  reply({ ok: false, error: publicMessage(error) });
} finally {
  await closeWorkspacePools();
}
