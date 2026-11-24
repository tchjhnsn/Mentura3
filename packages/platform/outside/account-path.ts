import { join } from "node:path";

/**
 * The console's account directory, from `console/README.md`: `<workspace>/.accounts/<account id>`.
 * The outside log is `<that directory>/outside/<venture id>/events.jsonl` on the same disk `npm start` uses.
 * The site's Vercel project is not this directory.
 */
export function consoleAccountWorkspace(root: string, userId: string): string {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(userId)) throw new Error("outside: account id is not a single safe name");
  return join(root, ".accounts", userId);
}
