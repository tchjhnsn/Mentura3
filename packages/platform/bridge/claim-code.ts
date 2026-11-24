// Run on the server, by the person who operates it. Lists the ventures no account owns, or issues a
// one-time code for one of them. Check who the founder is before you hand the code over.
//
//   node bridge/claim-code.ts           the ventures waiting for an owner
//   node bridge/claim-code.ts <venture> a code for that venture, good for 24 hours

import { dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { issueClaim, sharedRoot, stampedOwner } from "./claims.ts";
import { naiveFile } from "./naive-file.mjs";

const root = sharedRoot();
const framework = process.env.NAIVE_FRAMEWORK_DIR ?? dirname(fileURLToPath(import.meta.resolve("naive-framework/package.json")));
const { ventures } = await import(naiveFile(framework, "packages/naive/src/router/router.mjs"));
const unowned = (ventures(root) as { id: string; name: string | null; dir: string }[]).filter((v) => !stampedOwner(v.dir));

const wanted = process.argv[2];
if (!wanted) {
  console.log(unowned.length ? unowned.map((v) => `${v.id}  ${v.name ?? ""}`).join("\n") : "Every venture has an owner.");
} else {
  const v = unowned.find((x) => x.id === wanted);
  if (!v) { console.error(`${wanted} is not a venture waiting for an owner.`); process.exit(1); }
  console.log(issueClaim(root, relative(root, v.dir)));
}
