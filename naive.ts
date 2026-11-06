// Where the installed Naive package sits (naive-framework, tchjhnsn/naive, EE-118).
//
// Code here imports Naive modules by package name (`naive-framework/src/engine/foundation.mjs`). A script that has to run a
// Naive file as its own process, or read a Naive data file by path, takes the path from naivePath.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The installed package's folder. */
export const naiveRoot: string = dirname(fileURLToPath(import.meta.resolve("naive-framework/package.json")));

/** A file in the installed package, by its path inside Naive (`packages/naive/src/checks/check-ventures.mjs`). */
export const naivePath = (rel: string): string => join(naiveRoot, rel);

/** Node's flag that lets a script import Naive's TypeScript modules: see naive-ts.ts. */
export const naiveTs: string[] = ["--import", join(dirname(fileURLToPath(import.meta.url)), "naive-ts.ts")];
