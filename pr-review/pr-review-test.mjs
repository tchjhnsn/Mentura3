// Tests for the PR review agent (handoff 2026-10-29, items 7 and 12). Offline: content.mjs runs on fixture
// markdown, design.mjs's pure parts run without a browser, and preview hygiene is read from the site's source.
//
//   node scripts/pr-review/pr-review-test.mjs

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkMarkdown, FALLBACK_PATTERNS, fetchMarkdown, loadPatterns, pagesFromFiles, run } from "./content.mjs";
import { contrast, screenshotMode } from "./design.mjs";

const here = new URL(".", import.meta.url).pathname;
const root = join(here, "../..");
let failed = 0;
const check = (name, ok) => { if (!ok) failed++; console.log(`${ok ? "✓" : "✗ FAIL"} ${name}`); };

// Content, from fixtures.
const result = await run({ fixtures: join(here, "fixtures") });
const byName = Object.fromEntries(result.pages.map((p) => [p.path.split("/").at(-1), p]));
check("both fixture pages read", result.pages.length === 2);
check("a clean page has no findings (example.com email allowed)", byName["clean.md"].findings.length === 0);
const rules = new Set(byName["leaky.md"].findings.map((f) => f.rule));
for (const r of ["codename", "local-path", "private-path", "todo", "secret-aws"]) check(`leaky page flags ${r}`, rules.has(r));
check("findings carry line numbers", byName["leaky.md"].findings.find((f) => f.rule === "secret-aws").line === 7);
check("report names the leaky page only", result.markdown.includes("leaky.md") && !result.markdown.includes("clean.md"));
check("patterns come from the dictionary or the fallback", ["fallback", "schema/internal-terms.json", "governance/internal-terms.json"].includes(loadPatterns().source));
check("fallback patterns compile", FALLBACK_PATTERNS.every((p) => new RegExp(p.pattern, p.flags)));
check("a literal term becomes a whole-word pattern", checkMarkdown("Project Falcon ships", [{ id: "t", severity: "error", pattern: "\\bfalcon\\b", flags: "i", reason: "x" }]).length === 1);

// Changed files to page paths.
const paths = pagesFromFiles(["site/content/docs/index.mdx", "site/content/docs/guides/cli.mdx", "site/content/(home)/pricing.mdx", "schema/x.mjs"]);
check("changed files map to page paths", JSON.stringify(paths) === JSON.stringify(["/docs", "/docs/guides/cli", "/pricing"]));

// Markdown fetch: Accept header first, then the .md route (stub fetch, no network).
const calls = [];
const stub = async (url, opts) => {
  calls.push([url, opts.headers.accept]);
  if (opts.headers.accept) return { ok: true, status: 200, headers: new Map([["content-type", "text/html"]]), text: async () => "<html>" };
  return { ok: true, status: 200, headers: new Map(), text: async () => "# md" };
};
check("falls back to the .md route when Accept returns html", (await fetchMarkdown("https://p.example", "/docs/a", stub)) === "# md" && calls[1][0] === "https://p.example/docs/a.md");

// Design: screenshots and contrast.
check("screenshots off by default", screenshotMode({ labels: [], config: {} }) === false);
check("screenshots on with the label", screenshotMode({ labels: ["screenshots"], config: {} }) === true);
check("screenshots on when config says always", screenshotMode({ config: { pr_review: { screenshots: "always" } } }) === true);
check("black on white is 21:1", Math.round(contrast([0, 0, 0], [255, 255, 255])) === 21);
check("#777 on white fails 4.5", contrast([119, 119, 119], [255, 255, 255]) < 4.5);

// Preview hygiene: robots stays noindex, previews send X-Robots-Tag.
const robots = readFileSync(join(root, "site/app/robots.ts"), "utf8");
check("robots.ts disallows everything", /disallow:\s*"\/"/.test(robots) && !/allow:\s*"\/"/.test(robots.replace(/disallow/g, "")));
check("layout metadata keeps index: false", /robots:\s*\{\s*index:\s*false/.test(readFileSync(join(root, "site/app/layout.tsx"), "utf8")));
const next = readFileSync(join(root, "site/next.config.mjs"), "utf8");
check("next.config sends X-Robots-Tag noindex on preview", /VERCEL_ENV/.test(next) && /"preview"/.test(next) && /X-Robots-Tag[^\n]*\n?[^\n]*noindex/.test(next));

// The workflow never merges or approves.
const wf = readFileSync(join(root, ".github/workflows/pr-review.yml"), "utf8");
check("workflow never merges or approves", !/pulls\.merge|createReview|"APPROVE"|gh pr (?:merge|review)|git push/.test(wf));

console.log(failed ? `\n${failed} failing` : "\nall passing");
process.exit(failed ? 1 : 0);
