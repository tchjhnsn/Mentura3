// A working copy names a record by its venture-relative path; Naive's router writes a record by its route. These
// two turn one into the other, for the bridge's `syncPush` operation (the offline sync contract, 2026-11-25).
//
// The mapping is the route table's own `files` patterns, not a rule written out again here, so it follows the data
// model wherever it goes. A named pattern wins over a collection's wildcard, because the named record is the one
// the path means: `money/_summary.json` is `purpose/money/summary`, not an item of `money/[id]`.
//
// Pure: no framework import and no I/O. The caller passes the route table in, so sync-paths-test.ts can prove the
// two against Naive's real one and this file stays loadable anywhere.

/** The part of a route-table entry this file reads. */
export interface RouteEntry { route: string; files?: string[] }

/** A venture-relative path a push may name: no leading slash, no `..`, no empty segment, nothing hidden. */
export function syncPath(path: unknown): string {
  const p = typeof path === "string" ? path : "";
  const parts = p.split("/");
  if (!p || p.startsWith("/") || p.includes("\\") || parts.some((x) => !x || x === "." || x === ".." || x.startsWith("."))) {
    throw new Error(`${p || "that"} is not a path inside the business, so nothing was written.`);
  }
  return p;
}

/** A `files` pattern as a RegExp. A collection's one wildcard is a whole id, so it is the capture. */
const patternRe = (pattern: string): RegExp =>
  new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "([^/]+)")}$`);

/** The route that owns a venture-relative path, or null when no record type claims it. */
export function syncRoute(table: readonly RouteEntry[], path: string): string | null {
  for (const r of table) for (const pattern of r.files ?? []) if (pattern === path) return r.route;
  for (const r of table) {
    for (const pattern of (r.files ?? []).filter((p) => p.includes("*"))) {
      const m = patternRe(pattern).exec(path);
      if (m) return r.route.includes("[id]") ? r.route.replace("[id]", m[1] ?? "") : r.route;
    }
  }
  return null;
}
