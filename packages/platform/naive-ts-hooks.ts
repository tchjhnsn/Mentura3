// The load hook naive-ts.ts registers: a .ts file inside the installed naive-framework package is read and its
// types stripped (node:module stripTypeScriptTypes); every other file loads as Node would load it. Temporary, until
// Naive ships compiled JavaScript.

import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";

type LoadContext = { format?: string | null; conditions?: string[]; importAttributes?: Record<string, string> };
type LoadResult = { format?: string | null; source?: string | ArrayBuffer | Uint8Array; shortCircuit?: boolean };
type NextLoad = (url: string, context?: LoadContext) => Promise<LoadResult>;

const NAIVE_TS = /\/node_modules\/naive-framework\/.+\.ts$/;

export async function load(url: string, context: LoadContext, next: NextLoad): Promise<LoadResult> {
  if (!url.startsWith("file:") || !NAIVE_TS.test(url)) return next(url, context);
  const source = await readFile(fileURLToPath(url), "utf8");
  return { format: "module", source: stripTypeScriptTypes(source), shortCircuit: true };
}
