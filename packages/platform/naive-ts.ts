// Temporary: lets everything-ecosystem import Naive's TypeScript modules (schema/terms/*.ts) from node_modules.
//
//   node --import ./naive-ts.ts scripts/reconcile-ideas.ts
//
// Node strips types from .ts files but refuses to for files under node_modules. This registers naive-ts-hooks.ts,
// which strips them for naive-framework's files only. Remove both files once Naive ships compiled JavaScript
// (the fourth phase of its move to TypeScript).

import { register } from "node:module";

register("./naive-ts-hooks.ts", import.meta.url);
