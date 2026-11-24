// A file of the Naive package the console runs on, by its path inside Naive (`packages/naive/src/router/router.mjs`).
// An installed Naive publishes compiled JavaScript in dist/ (EE-159), where every module is named `.mjs` (EE-160) and
// every data file sits at its own path, so a path resolves to dist/ first. A source checkout named by
// NAIVE_FRAMEWORK_DIR has no dist/ and resolves to the file as named, or to its `.ts` when the module was converted.
// The same rule as naiveFile in scripts/naive.ts, kept here because the console is deployed on its own.

import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * @param {string} root the Naive package's folder
 * @param {string} rel a path inside Naive
 * @returns {string}
 */
export function naiveFile(root, rel) {
  const candidates = [join(root, "dist", rel.replace(/\.(ts|mjs)$/, ".mjs")), join(root, "dist", rel), join(root, rel), join(root, rel.replace(/\.mjs$/, ".ts"))];
  return candidates.find((p) => existsSync(p)) ?? join(root, rel);
}
