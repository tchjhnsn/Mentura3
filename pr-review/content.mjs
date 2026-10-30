// The PR review agent's content pass (handoff 2026-10-29, item 7): fetch the markdown of each changed site page
// from the preview and look for text that must never be public.
//
//   node scripts/pr-review/content.mjs --preview <url> [--base origin/main] [--out findings.json]
//   node scripts/pr-review/content.mjs --fixtures <dir>        (offline: every .md file in <dir> is a page)
//
// A page's markdown comes from `Accept: text/markdown`, then from the `.md` route. The patterns come from an
// internal-terms dictionary when the branch has one (schema/internal-terms.json or governance/internal-terms.json),
// else from the fallback list below. It only reports: findings go in the PR comment, nothing is merged or blocked.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../../", import.meta.url).pathname;

// Used when the branch has no internal-terms dictionary. Severity `error` is a leak; `warn` asks a person to look.
export const FALLBACK_PATTERNS = [
  { id: "codename", severity: "error", pattern: "\\bmentura\\b", flags: "i", reason: "internal codename" },
  { id: "repo-name", severity: "warn", pattern: "\\beverything[- ]ecosystem\\b", flags: "i", reason: "internal repository name" },
  { id: "ledger-id", severity: "warn", pattern: "\\b(?:G|EE|D)-\\d{3}\\b", flags: "", reason: "internal decision ledger id" },
  { id: "private-path", severity: "error", pattern: "(?:^|/)_(?:private|internal)/", flags: "m", reason: "private folder path" },
  { id: "local-path", severity: "error", pattern: "/Users/[A-Za-z0-9._-]+/", flags: "", reason: "local machine path" },
  { id: "todo", severity: "warn", pattern: "\\b(?:TODO|FIXME|XXX)\\b", flags: "", reason: "unfinished marker" },
  { id: "secret-aws", severity: "error", pattern: "\\bAKIA[0-9A-Z]{16}\\b", flags: "", reason: "AWS access key shape" },
  { id: "secret-github", severity: "error", pattern: "\\bgh[pousr]_[A-Za-z0-9]{30,}\\b", flags: "", reason: "GitHub token shape" },
  { id: "secret-stripe", severity: "error", pattern: "\\b[sr]k_(?:live|test)_[A-Za-z0-9]{16,}\\b", flags: "", reason: "Stripe key shape" },
  { id: "secret-private-key", severity: "error", pattern: "-----BEGIN [A-Z ]*PRIVATE KEY-----", flags: "", reason: "private key block" },
  { id: "email", severity: "warn", pattern: "\\b[A-Za-z0-9._%+-]+@(?!example\\.(?:com|org))[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b", flags: "", reason: "personal email address" },
];

// Accepts { terms: [...] }, { patterns: [...] } or an array; each entry a string (a literal term) or { pattern|term, ... }.
export function loadPatterns(dir = root) {
  for (const rel of ["schema/internal-terms.json", "governance/internal-terms.json"]) {
    const file = join(dir, rel);
    if (!existsSync(file)) continue;
    const data = JSON.parse(readFileSync(file, "utf8"));
    const list = Array.isArray(data) ? data : data.terms ?? data.patterns ?? [];
    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = list.map((t, i) => typeof t === "string"
      ? { id: `term-${i + 1}`, severity: "error", pattern: `\\b${escape(t)}\\b`, flags: "i", reason: "internal term" }
      : { id: t.id ?? `term-${i + 1}`, severity: t.severity ?? "error", pattern: t.pattern ?? `\\b${escape(t.term)}\\b`, flags: t.flags ?? "i", reason: t.reason ?? "internal term" });
    return { source: rel, patterns };
  }
  return { source: "fallback", patterns: FALLBACK_PATTERNS };
}

export function checkMarkdown(text, patterns) {
  const findings = [];
  const lines = text.split("\n");
  for (const p of patterns) {
    const re = new RegExp(p.pattern, p.flags.includes("g") ? p.flags : p.flags + "g");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(re)) findings.push({ rule: p.id, severity: p.severity, line: i + 1, match: m[0], reason: p.reason });
    });
  }
  return findings;
}

// site/content/docs/a/index.mdx -> /docs/a ; site/content/(collection)/x.mdx -> /x. Only content pages have markdown.
export function pagesFromFiles(files) {
  const urls = new Set();
  for (const f of files) {
    const m = f.match(/^site\/content\/([^/]+)\/(.+)\.mdx?$/);
    if (!m) continue;
    const parts = m[2].split("/");
    if (parts.at(-1) === "index") parts.pop();
    urls.add(m[1] === "docs" ? "/" + ["docs", ...parts].join("/") : "/" + parts.join("/"));
  }
  return [...urls].sort();
}

export async function fetchMarkdown(base, path, fetchImpl = fetch) {
  const headers = process.env.VERCEL_BYPASS ? { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS } : {};
  const url = new URL(path, base).toString();
  const first = await fetchImpl(url, { headers: { ...headers, accept: "text/markdown" } });
  if (first.ok && /markdown|text\/plain/.test(first.headers.get("content-type") ?? "")) return first.text();
  const second = await fetchImpl(url.replace(/\/$/, "") + ".md", { headers });
  if (second.ok) return second.text();
  throw new Error(`no markdown for ${path} (${first.status}, .md ${second.status})`);
}

export function report(pages, source) {
  const out = [`### Content`, ``, `Patterns: ${source === "fallback" ? "built-in fallback list" : source}.`, ``];
  const hits = pages.filter((p) => p.error || p.findings.length);
  if (!pages.length) out.push("No changed site pages.");
  else if (!hits.length) out.push(`${pages.length} page(s) checked, nothing found.`);
  for (const p of hits) {
    out.push(`- \`${p.path}\`${p.error ? `: could not read (${p.error})` : ""}`);
    for (const f of p.findings) out.push(`  - ${f.severity} \`${f.rule}\` line ${f.line}: ${f.reason} (\`${f.match.slice(0, 40)}\`)`);
  }
  return out.join("\n");
}

export async function run({ preview, base = "origin/main", fixtures, files } = {}) {
  const { source, patterns } = loadPatterns();
  let inputs;
  if (fixtures) {
    inputs = readdirSync(fixtures).filter((f) => f.endsWith(".md")).sort()
      .map((f) => ({ path: relative(root, join(fixtures, f)), text: () => readFileSync(join(fixtures, f), "utf8") }));
  } else {
    const changed = files ?? execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
    inputs = pagesFromFiles(changed).map((path) => ({ path, text: () => fetchMarkdown(preview, path) }));
  }
  const pages = [];
  for (const input of inputs) {
    try { pages.push({ path: input.path, findings: checkMarkdown(await input.text(), patterns) }); }
    catch (e) { pages.push({ path: input.path, findings: [], error: e.message }); }
  }
  return { source, pages, markdown: report(pages, source) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
  const preview = arg("preview") ?? process.env.PREVIEW_URL;
  const fixtures = arg("fixtures");
  if (!preview && !fixtures) { console.error("usage: content.mjs --preview <url> | --fixtures <dir>"); process.exit(2); }
  const result = await run({ preview, fixtures, base: arg("base") });
  if (arg("out")) writeFileSync(arg("out"), JSON.stringify(result, null, 2));
  console.log(result.markdown);
}
