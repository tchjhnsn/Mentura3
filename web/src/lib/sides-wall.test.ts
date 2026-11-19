// The wall between Reflect's two sides (doc "Private and shared Reflect plan", steps 2 and 3): no page on the shared
// side imports a store of the person's or the household's own records by path. A shared page that needs one goes
// through a module that returns only the shared part.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRIVATE_STORES, SHARED_PATHS, SHARED_ROUTE_DIRS, sideOfPath } from "./sides";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(SRC, "app");
const SERVER = join(SRC, "server");

/**
 * Shared pages that still import a private store, each with why. This list may only shrink: a new import of a private
 * store fails the test, and an entry no longer needed fails it too, so it is taken off. Paths are from `src/`.
 */
const EXEMPT: { file: string; store: (typeof PRIVATE_STORES)[number]; reason: string }[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

/** Every module a file imports by a string: static imports, re-exports, side-effect imports, `import()` and `require`. */
function specifiers(text: string): string[] {
  const out: string[] = [];
  const re = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["']([^"']+)["']/g;
  for (const m of text.matchAll(re)) if (m[1]) out.push(m[1]);
  return out;
}

/** The private store a specifier names, or null. */
function privateStoreOf(spec: string, file: string): string | null {
  let abs: string;
  if (spec.startsWith("@/")) abs = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) abs = resolve(dirname(file), spec);
  else return null;
  const rel = relative(SERVER, abs).replace(/\\/g, "/").replace(/\.(ts|tsx|js)$/, "").replace(/\/index$/, "");
  return (PRIVATE_STORES as readonly string[]).includes(rel) ? rel : null;
}

function crossings(): { file: string; store: string }[] {
  return SHARED_ROUTE_DIRS.flatMap((d) =>
    walk(join(APP, d)).flatMap((file) =>
      specifiers(readFileSync(file, "utf8"))
        .map((s) => privateStoreOf(s, file))
        .filter((s): s is string => s !== null)
        .map((store) => ({ file: relative(SRC, file).replace(/\\/g, "/"), store })),
    ),
  );
}

describe("the wall between Home and the shared side", () => {
  it("finds imports of private stores, by alias and by relative path", () => {
    const f = join(APP, "events", "page.tsx");
    expect(privateStoreOf("@/server/journal-store", f)).toBe("journal-store");
    expect(privateStoreOf("../../../server/life-store", join(APP, "events", "x", "page.tsx"))).toBe("life-store");
    expect(privateStoreOf("@/server/events-store", f)).toBeNull();
    expect(privateStoreOf("@/server/actions/records", f)).toBeNull();
    expect(privateStoreOf("@reflect/core/life", f)).toBeNull();
    expect(specifiers(`import { a } from "@/server/plan";\nconst m = await import('@/server/budget');\nexport * from "./x";`)).toEqual(["@/server/plan", "@/server/budget", "./x"]);
  });

  it("names only stores that exist", () => {
    for (const s of PRIVATE_STORES) expect(statSync(join(SERVER, `${s}.ts`)).isFile(), s).toBe(true);
  });

  it("keeps every shared page off the private stores, but for the listed exemptions", () => {
    const key = (x: { file: string; store: string }) => `${x.file} -> ${x.store}`;
    const found = crossings().map(key).sort();
    const allowed = EXEMPT.map(key).sort();
    expect(found.filter((k) => !allowed.includes(k)), "a shared page imports a private store").toEqual([]);
    expect(allowed.filter((k) => !found.includes(k)), "an exemption is no longer needed: take it off").toEqual([]);
  });

  it("puts every shared app folder under a shared path", () => {
    for (const d of SHARED_ROUTE_DIRS) {
      expect(SHARED_PATHS as readonly string[], d).toContain(`/${d}`);
      expect(sideOfPath(`/${d}`), d).toBe("polis");
      expect(statSync(join(APP, d)).isDirectory(), d).toBe(true);
    }
  });
});
