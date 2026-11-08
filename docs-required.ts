// The docs-required check's path rules for this repository (.github/workflows/docs-required.yml). Naive keeps its
// own in its schema/check-docs-claims.mjs; these name this repository's code and docs (EE-118).
//
//   node scripts/docs-required.ts --code < paths      the changed paths counted as code
//   node scripts/docs-required.ts --scanned < paths   the changed paths counted as docs
//   node scripts/docs-required.ts --readmes < paths   the README.md nearest each changed code file, searched up to its
//                                                     top-level folder, that the change does not touch
//
// Code is anything that is not Markdown under platform/, console/, identity/, outside/, scripts/ and the site's code
// (site/app, site/lib, site/components, site/scripts). Docs are the site's docs pages, docs/master/*.md, and every
// README.md, AGENTS.md and SKILL.md.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const hidden = (r: string): boolean => r.split("/").some((p) => p === "node_modules" || p.startsWith("."));

export const isCode = (r: string): boolean => !hidden(r) && /^(platform|console|scripts|identity|outside|site\/(app|lib|components|scripts))\/.*(?<!\.mdx?)$/.test(r);
export const isDocs = (r: string): boolean => !hidden(r) && ((r.startsWith("site/content/docs/") && r.endsWith(".mdx")) || /^docs\/master\/[^/]+\.md$/.test(r) || /(^|\/)(README|AGENTS|SKILL)\.md$/.test(r));

/** The README.md nearest a file, searched up to its top-level folder (never the repository's own README). */
export function nearestReadme(r: string, root: string = repo): string | null {
  for (let d = r.split("/").slice(0, -1); d.length; d.pop()) if (existsSync(join(root, ...d, "README.md"))) return [...d, "README.md"].join("/");
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2];
  const paths = readFileSync(0, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
  if (mode === "--code") for (const r of paths.filter(isCode)) console.log(r);
  else if (mode === "--scanned") for (const r of paths.filter(isDocs)) console.log(r);
  else if (mode === "--readmes") {
    const owed = new Set(paths.filter(isCode).map((r) => nearestReadme(r)).filter((r): r is string => r !== null && !paths.includes(r)));
    for (const r of [...owed].sort()) console.log(r);
  } else {
    console.error("usage: node scripts/docs-required.ts --code|--scanned|--readmes < paths");
    process.exit(2);
  }
}
