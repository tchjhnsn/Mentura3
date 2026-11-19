// JSON helpers with no I/O, shared by the modules a browser can run
// (tokens.ts, build.ts, check.ts and what they import). load.ts re-exports
// isObject for the modules that already import it from there.

import type { Json, JsonObject } from "./model.ts";

export function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
