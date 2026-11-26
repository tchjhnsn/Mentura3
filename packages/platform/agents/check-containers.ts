// check-containers: whether every change to a site or docs repository was made by the agent that owns it
// (containers.ts). An IT specialist runs it as its own gate before it hands back; CI runs it again as a backstop.
//
//   node agents/check-containers.ts <repo dir> --agent products-it --paths app/(site)/features/time-travel/page.tsx
//   node agents/check-containers.ts <repo dir> --range origin/main..HEAD
//
// With --range, each commit is checked as the agent its `Agent:` trailer names; a commit with no trailer is a person's
// and may change anything. The manifest is <repo dir>/containers.json unless --manifest names another. It prints one
// line per problem and exits 1 when there is any, 2 on a usage error or an unsound manifest.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkChange, loadManifest, type Manifest, type Problem } from "./containers.ts";

const git = (dir: string, args: string[]): string => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** Each commit in a range with its agent (null for a person) and the files it added or changed, with their content. */
export function commitsIn(dir: string, range: string): { sha: string, agent: string | null, files: { path: string, content?: string }[] }[] {
  const shas = git(dir, ["rev-list", "--reverse", range]).split("\n").filter(Boolean);
  return shas.map((sha) => {
    const agent = git(dir, ["log", "-1", "--format=%(trailers:key=Agent,valueonly,separator=%x2C)", sha]).trim() || null;
    const files = git(dir, ["diff-tree", "--no-commit-id", "--name-status", "-r", "--root", sha]).split("\n").filter(Boolean).map((line) => {
      const [status, ...rest] = line.split("\t");
      const path = rest.at(-1) ?? "";
      return status.startsWith("D") ? { path } : { path, content: git(dir, ["show", `${sha}:${path}`]) };
    });
    return { sha, agent, files };
  });
}

/** Every problem in a range of commits. */
export function checkRange(dir: string, m: Manifest, range: string): (Problem & { sha: string, agent: string | null })[] {
  return commitsIn(dir, range).flatMap((c) => checkChange(m, c.agent, c.files).map((p) => ({ ...p, sha: c.sha, agent: c.agent })));
}

function main(argv: string[]): number {
  const [dir, ...rest] = argv;
  const flag = (name: string): string | undefined => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };
  if (!dir || (!flag("--range") && !flag("--agent"))) { console.error("usage: check-containers <repo dir> (--agent <id> --paths <path>... | --range <base>..<head>) [--manifest <file>]"); return 2; }
  let m: Manifest;
  try { m = loadManifest(flag("--manifest") ?? join(dir, "containers.json")); } catch (e) { console.error(String((e as Error).message)); return 2; }
  let problems: (Problem & { sha?: string })[];
  const range = flag("--range");
  if (range) problems = checkRange(dir, m, range);
  else {
    const i = rest.indexOf("--paths");
    const paths = i >= 0 ? rest.slice(i + 1).filter((p) => !p.startsWith("--")) : [];
    problems = checkChange(m, flag("--agent") ?? null, paths.map((path) => existsSync(join(dir, path)) ? { path, content: readFileSync(join(dir, path), "utf8") } : { path }));
  }
  for (const p of problems) console.log(`${p.sha ? `${p.sha.slice(0, 7)} ` : ""}${p.path}: ${p.why}${p.fix ? `. Next: ${p.fix}` : ""}`);
  if (!problems.length) console.log("Every change is its owner's.");
  return problems.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
