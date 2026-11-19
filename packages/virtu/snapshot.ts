// Writes site/site.loaded.json: the personal site's Virtu system as Virtu's
// loader reads it, and site/looks.loaded.json, its shapes, ornaments, and seasons;
// so the web app can run the editor's engine on any host without reading files. Run after changing anything under site/:
//   node packages/virtu/snapshot.ts
// site.test.ts fails while the snapshot is stale.

import { writeFileSync } from "node:fs";
import { LOOKS_SNAPSHOT, looksSnapshot, siteSnapshot, SNAPSHOT } from "./snapshot-lib.ts";

writeFileSync(SNAPSHOT, `${JSON.stringify(siteSnapshot(), null, 2)}\n`);
writeFileSync(LOOKS_SNAPSHOT, `${JSON.stringify(looksSnapshot(), null, 2)}\n`);
console.log(`wrote ${SNAPSHOT} and ${LOOKS_SNAPSHOT}`);
