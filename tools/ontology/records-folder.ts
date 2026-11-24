// Where the ontology program's scripts find the company's records. The founder's idea records lived in this
// repository under instance/ until EE-118 step 9c; they now live in the company tenant's store, and the scripts
// read a folder exported from it:
//
//   node platform/connectors/store-export.ts <folder> --tenant everything-ecosystem
//
// Pass that folder as --records <folder>, or set MENTURA_RECORDS to it. Paths below are inside the folder.

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

/** The founder's person folder and the idea records in it, inside the records folder. */
export const PERSON = "people/p-54697df9";
export const IDEAS = `${PERSON}/ideas`;

/** The records folder: --records, else MENTURA_RECORDS. Throws a message that says how to get one. */
export function recordsFolder(argv: string[] = process.argv, env: NodeJS.ProcessEnv = process.env): string {
  const i = argv.indexOf("--records");
  const named = i >= 0 ? argv[i + 1] : env.MENTURA_RECORDS;
  if (!named) throw new Error("no records folder: export the company's records (node platform/connectors/store-export.ts <folder> --tenant everything-ecosystem), then pass --records <folder> or set MENTURA_RECORDS");
  const dir = resolve(named);
  if (!existsSync(dir)) throw new Error(`the records folder ${dir} does not exist`);
  return dir;
}

/** The idea records folder inside a records folder. */
export const ideasIn = (records: string): string => join(records, IDEAS);
