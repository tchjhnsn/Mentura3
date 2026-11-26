// Container ownership of a site or docs repository: the manifest's rules, who may write which path, the design-system
// lint, the guard backend that refuses before the disk, the site agents' rules, and check-containers over a real git
// range where each commit names its agent.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkChange, globToRegExp, lintContainerFile, mayWrite, reachOf, validateManifest, type Manifest } from "./containers.ts";
import { checkRange } from "./check-containers.ts";
import { ContainerGuardBackend, rolesNeeded, siteRoleOf, siteRules } from "./site-agents.ts";

let passed = 0;
const check = (name: string, fn: () => void | Promise<void>) => Promise.resolve(fn()).then(() => { passed++; console.log(`ok ${name}`); });

const FUNCTIONS = ["products", "marketing-and-sales", "strategy"];
const m: Manifest = {
  design_system: { paths: ["components/**", "app/globals.css", "tokens/**"], owner: "design-system-agent" },
  containers: [
    { id: "home", paths: ["app/(site)/page.tsx", "app/(site)/layout.tsx"], owner: "marketing-and-sales-agent", function: "marketing-and-sales", builder: "marketing-and-sales-it", may: ["copy", "order"], holds: ["hero", "features/time-travel"] },
    { id: "hero", paths: ["app/(site)/sections/hero/**"], owner: "marketing-and-sales-agent", function: "marketing-and-sales", builder: "marketing-and-sales-it", may: ["copy", "order", "props"] },
    { id: "features/time-travel", paths: ["app/(site)/features/time-travel/**", "content/docs/time-travel.mdx"], owner: "time-travel-agent", category: "records-and-history-agent", function: "products", builder: "products-it", may: ["copy", "order", "props"] },
  ],
};

await check("globs: ** crosses folders, * stays in one", () => {
  assert.ok(globToRegExp("components/**").test("components/ui/button.tsx"));
  assert.ok(globToRegExp("app/**/page.tsx").test("app/page.tsx"));
  assert.ok(globToRegExp("app/**/page.tsx").test("app/(site)/x/page.tsx"));
  assert.ok(!globToRegExp("app/*.tsx").test("app/x/page.tsx"));
  assert.ok(globToRegExp("app/(site)/page.tsx").test("app/(site)/page.tsx"));
});

await check("a sound manifest has no problems", () => assert.deepEqual(validateManifest(m, FUNCTIONS), []));

await check("the manifest's rules: builder is <function>-it, writer is not builder, holds resolve, one design-system owner", () => {
  const bad = structuredClone(m) as Manifest;
  bad.design_system.owner = "products-it";
  bad.containers[1].builder = "products-it";
  bad.containers[2].owner = "products-it";
  bad.containers[0].holds = ["nope"];
  bad.containers.push({ ...m.containers[1] });
  const p = validateManifest(bad, FUNCTIONS).join("\n");
  for (const want of ["design_system is owned by design-system-agent", "hero is built by marketing-and-sales-it", "features/time-travel: the agent that writes the copy is not the agent that builds it", "home holds nope", "hero is listed twice"]) assert.match(p, new RegExp(want.replace(/[()/]/g, "\\$&")));
  assert.match(validateManifest({ ...m, containers: [{ ...m.containers[1], function: "legal" }] }, FUNCTIONS).join(), /legal is not a function/);
});

await check("only a container's builder writes it; owner and category hand off", () => {
  assert.deepEqual(mayWrite(m, "products-it", "app/(site)/features/time-travel/page.tsx"), { ok: true, container: "features/time-travel" });
  const owner = mayWrite(m, "time-travel-agent", "app/(site)/features/time-travel/page.tsx");
  assert.ok(!owner.ok && /hand off the approved copy to products-it/.test(owner.fix));
  const other = mayWrite(m, "products-it", "app/(site)/sections/hero/index.tsx");
  assert.ok(!other.ok && /built only by marketing-and-sales-it/.test(other.why));
});

await check("only the design-system agent changes the design system", () => {
  assert.ok(mayWrite(m, "design-system-agent", "components/button.tsx").ok);
  const no = mayWrite(m, "products-it", "components/button.tsx");
  assert.ok(!no.ok && /only design-system-agent/.test(no.why));
  assert.ok(!mayWrite(m, "design-system-agent", "app/(site)/sections/hero/index.tsx").ok);
});

await check("fails closed: an unclaimed or doubly claimed path is nobody's; a person may write anything", () => {
  assert.ok(!mayWrite(m, "products-it", "README.md").ok);
  const twice = { ...m, containers: [...m.containers, { ...m.containers[1], id: "hero-2" }] };
  const v = mayWrite(twice, "marketing-and-sales-it", "app/(site)/sections/hero/a.tsx");
  assert.ok(!v.ok && /hero and hero-2/.test(v.why));
  assert.ok(mayWrite(m, null, "README.md").ok);
});

await check("the design-system lint: no raw colour, colour function, stylesheet or inline style in a container", () => {
  assert.equal(lintContainerFile("a.tsx", "<Button variant='primary'>Go</Button>").length, 0);
  assert.match(lintContainerFile("a.tsx", "<div style={{ color: '#ff0000' }} />").join(), /raw colour \(#ff0000\)/);
  assert.match(lintContainerFile("a.tsx", "const c = 'rgb(1,2,3)'").join(), /colour function/);
  assert.match(lintContainerFile("a.css", "").join(), /no stylesheet/);
  assert.match(lintContainerFile("a.tsx", "<style>{`.x{}`}</style>").join(), /inline <style>/);
  assert.equal(lintContainerFile("a.mdx", "See [the top](#top)").length, 0);
  assert.equal(checkChange(m, "products-it", [{ path: "app/(site)/features/time-travel/a.tsx", content: "color: '#fff'" }]).length, 1);
  assert.equal(checkChange(m, "design-system-agent", [{ path: "components/a.tsx", content: "color: '#fff'" }]).length, 0);
});

await check("each agent's reach, and the roles a manifest needs", () => {
  assert.deepEqual(reachOf(m, "products-it"), { builds: ["features/time-travel"], owns: [], design_system: false });
  assert.deepEqual(reachOf(m, "records-and-history-agent").owns, ["features/time-travel"]);
  assert.deepEqual(rolesNeeded(m), ["design-system-agent", "marketing-and-sales-agent", "marketing-and-sales-it", "products-it", "records-and-history-agent", "time-travel-agent"]);
});

await check("site roles and their rules name their own reach", () => {
  assert.deepEqual(siteRoleOf("products-it", FUNCTIONS), { kind: "it", function: "products" });
  assert.deepEqual(siteRoleOf("design-system-agent", FUNCTIONS), { kind: "design-system" });
  assert.deepEqual(siteRoleOf("time-travel-agent", FUNCTIONS), { kind: "capability", capability: "time-travel" });
  assert.equal(siteRoleOf("products-agent", FUNCTIONS), null);
  assert.match(siteRules("products-it", m, FUNCTIONS).join("\n"), /You build the containers of products: features\/time-travel/);
  assert.match(siteRules("design-system-agent", m, FUNCTIONS).join("\n"), /You alone change the design system/);
  assert.match(siteRules("time-travel-agent", m, FUNCTIONS).join("\n"), /started by your category agent/);
});

const repo = mkdtempSync(join(tmpdir(), "containers-"));
const put = (p: string, s: string) => { mkdirSync(join(repo, p, ".."), { recursive: true }); writeFileSync(join(repo, p), s); };
put("containers.json", JSON.stringify(m, null, 2));
put("components/button.tsx", "export const Button = () => null;\n");
put("app/(site)/features/time-travel/page.tsx", "export default () => 'Time travel';\n");

await check("the guard refuses before the disk, and lets the builder write", async () => {
  const g = new ContainerGuardBackend({ rootDir: repo, manifest: m, agent: "products-it" });
  const no = await g.write("/components/button.tsx", "hacked");
  assert.ok("error" in no && /only design-system-agent/.test(String(no.error)));
  assert.equal(readFileSync(join(repo, "components/button.tsx"), "utf8"), "export const Button = () => null;\n");
  const ok = await g.write("/app/(site)/features/time-travel/new.tsx", "export default () => null;\n");
  assert.ok(!("error" in ok && ok.error), JSON.stringify(ok));
  assert.ok(existsSync(join(repo, "app/(site)/features/time-travel/new.tsx")));
  const lint = await g.edit("/app/(site)/features/time-travel/page.tsx", "'Time travel'", "<p style={{color:'#123456'}}>x</p>");
  assert.ok("error" in lint && /raw colour/.test(String(lint.error)));
  assert.match(readFileSync(join(repo, "app/(site)/features/time-travel/page.tsx"), "utf8"), /'Time travel'/);
  const del = await g.delete("/components/button.tsx");
  assert.ok("error" in del && del.error);
  await assert.rejects(g.uploadFiles([["/README.md", new Uint8Array()]]), /no container claims/);
});

await check("check-containers over a git range: each commit as the agent its trailer names", () => {
  const sh = (...a: string[]) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" });
  sh("init", "-q"); sh("config", "user.email", "t@example.com"); sh("config", "user.name", "t");
  sh("add", "-A"); sh("commit", "-qm", "start");
  const base = sh("rev-parse", "HEAD").trim();
  put("app/(site)/features/time-travel/page.tsx", "export default () => 'Go back in time';\n");
  sh("commit", "-qam", "Time travel copy\n\nAgent: products-it");
  put("components/button.tsx", "export const Button = () => 'x';\n");
  sh("commit", "-qam", "Button\n\nAgent: products-it");
  put("README.md", "notes\n");
  sh("add", "README.md"); sh("commit", "-qm", "A person's note");
  const problems = checkRange(repo, m, `${base}..HEAD`);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "components/button.tsx");
  assert.equal(problems[0].agent, "products-it");
  const cli = spawnSync(process.execPath, [new URL("./check-containers.ts", import.meta.url).pathname, repo, "--range", `${base}..HEAD`], { encoding: "utf8" });
  assert.equal(cli.status, 1, cli.stderr);
  assert.match(cli.stdout, /components\/button\.tsx: components\/button\.tsx is the design system/);
  const ok = spawnSync(process.execPath, [new URL("./check-containers.ts", import.meta.url).pathname, repo, "--agent", "products-it", "--paths", "app/(site)/features/time-travel/page.tsx"], { encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  writeFileSync(join(repo, "containers.json"), "{}");
  const broken = spawnSync(process.execPath, [new URL("./check-containers.ts", import.meta.url).pathname, repo, "--agent", "products-it", "--paths", "x"], { encoding: "utf8" });
  assert.equal(broken.status, 2);
});

console.log(`${passed} checks passed`);
