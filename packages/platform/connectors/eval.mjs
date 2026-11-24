// Evals for the platform's GitHub connector (EE-037, EE-041). The GitHub connector names a vendor
// and reaches it over the network, so it is platform, not framework; it proves itself against the
// framework's contract suite (knowledge/connectors/suite.mjs). Three parts:
//
//   contract   the shared suite, run against a fake of the GitHub API, plus GitHub's own cases
//   router     a venture whose source map keeps one record type in a GitHub repository: reads
//              come from there with their version, a write opens a draft pull request and is
//              logged with the source's version, nothing invalid reaches the source, and every
//              other record stays in the venture folder
//   catalog    one index across both sources, rebuilt after the pull request is merged
//
//   node platform/connectors/eval.mjs
//
// Live GitHub: with MENTURA_EVAL_GITHUB_REPO=owner/name (and a token in GITHUB_TOKEN, or the
// variable MENTURA_EVAL_GITHUB_TOKEN names), the read half of the contract also runs against that
// repository (MENTURA_EVAL_GITHUB_REF, MENTURA_EVAL_GITHUB_ROOT narrow it), and with
// MENTURA_EVAL_GITHUB_WRITE=1 it opens one real draft pull request. Without them it says it skipped.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { blobSha } from "naive-framework/src/store/connectors/contract.mjs";
import { contract, FIXTURE, harness, OUTSIDE } from "naive-framework/src/store/connectors/suite.mjs";
import { registry, useFetch } from "naive-framework/src/store/connectors/index.mjs";
import { build, FILE, load, search } from "naive-framework/src/store/connectors/catalog.mjs";
import { fakeGitHub } from "./fake-github.mjs";
import { connect as ghConnect } from "./github.mjs";
import { registerPlatformConnectors } from "./register.mjs";
import { naivePath } from "../../scripts/naive.ts";

const h = harness("platform-connectors");
const { expect, throws, skip, write, scratch, finish } = h;

// The GitHub connector, against the fake.
const ghMake = async ({ writes = "pull-request", search = "api" } = {}) => {
  const gh = fakeGitHub({ repo: "acme/knowledge", files: { ...Object.fromEntries(Object.entries(FIXTURE).map(([p, c]) => [`kb/${p}`, c])), ...OUTSIDE } });
  return { gh, c: ghConnect({ id: "acme", repo: "acme/knowledge", root: "kb", writes, search, token: "MENTURA_EVAL_FAKE_TOKEN", fetch: gh.fetch }),
    base: (p) => gh.files()[`kb/${p}`] ?? null, later: (p, branch) => gh.files(branch)[`kb/${p}`] ?? null, pulls: () => gh.pulls };
};
process.env.MENTURA_EVAL_FAKE_TOKEN = "fake";
const ghT = /** @type {Awaited<ReturnType<typeof ghMake>>} */ (await contract(h, "github (fake API)", ghMake));
{
  const a = await ghT.c.read("notes/alpha.md");
  expect("github (fake API): read gives the branch's commit and a permalink to the file at that commit", /^[0-9a-f]{40}$/.test(a.commit) && a.permalink === `https://github.com/acme/knowledge/blob/${a.commit}/kb/notes/alpha.md`);
  expect("github (fake API): a pull request targets the source's branch and says merging accepts it", ghT.gh.pulls.every((p) => p.base.ref === "main" && /Merging this pull request accepts the write/.test(p.body)));
  const scan = await ghMake({ search: "scan" });
  expect("github (fake API): search by scanning finds the same items as code search", JSON.stringify((await scan.c.search("kettle pilot")).map((x) => x.path)) === JSON.stringify(["notes/alpha.md"]));
  delete process.env.MENTURA_EVAL_FAKE_TOKEN;
  expect("github (fake API): without a token it fails and names the variable to set", await throws(() => ghT.c.list(), /no valid token in MENTURA_EVAL_FAKE_TOKEN/));
  process.env.MENTURA_EVAL_FAKE_TOKEN = "fake";
  expect("github: a source with no repo, or that asks to write directly, is refused", await throws(() => ghConnect({ repo: "nope" })) && await throws(() => ghConnect({ repo: "a/b", writes: "direct" })));
}

// ---- Router --------------------------------------------------------------------------------------
console.log("\n# router over a mapped source");
const ws = join(scratch, "workspace");
cpSync(naivePath("packages/naive/src/records/examples/workspace"), ws, { recursive: true });
process.env.MENTURA_WORKSPACE = ws;
const tandem = join(ws, "ventures/tandem");
expect("register: the GitHub connector is not Naive's; the platform adds it to the registry", !registry().has("github") && (registerPlatformConnectors(), registry().get("github")?.module.endsWith("platform/connectors/github.mjs")));
const router = await import("naive-framework/src/router/router.mjs");
/** @typedef {{ name?: string, draft?: boolean, pull_request?: string, version?: string, permalink?: string, [k: string]: unknown }} Res */
/** @typedef {{ source?: string, address?: string, version?: string, permalink?: string, pull_request?: string, connector?: string }} Src */
/** @typedef {{ ok: boolean, error?: string, result?: Res | null, source?: Src, pending_pull_requests?: { pull_request?: string }[], [k: string]: unknown }} Reply */
/** The router's answer, with the fields these evals read. */
const call = (/** @type {import("naive-framework/src/router/router.mjs").CallArgs} */ args) => /** @type {Promise<Reply>} */ (router.call(args));
const { entries } = await import("naive-framework/src/core/provenance.mjs");
const kettle = { ...Object.values(/** @type {Record<string, object>} */ ((await call({ venture: "tandem", route: "purpose/product", action: "read" })).result))[0], id: "kettle", name: "Kettle (in GitHub)" };
const team = fakeGitHub({ repo: "acme/tandem", files: { "ventures/tandem/products/kettle.json": JSON.stringify(kettle, null, 2) + "\n", "ventures/tandem/notes/launch.md": "# Launch plan\n\nShip the kettle subscription in spring.\n" } });
useFetch(team.fetch);
process.env.MENTURA_EVAL_FAKE_TOKEN = "fake";
const map = { sources: [{ id: "team-repo", connector: "github", repo: "acme/tandem", ref: "main", root: "ventures/tandem", token: "MENTURA_EVAL_FAKE_TOKEN" }], records: { product: "team-repo" } };
write(tandem, { "knowledge/sources.json": JSON.stringify(map, null, 2) + "\n" });
const localProducts = existsSync(join(tandem, "products")) ? spawnSync("ls", [join(tandem, "products")], { encoding: "utf8" }).stdout.trim().split("\n") : [];

const list = await call({ venture: "tandem", route: "purpose/product", action: "read" });
expect("router: a mapped record type is read from its source, not the venture folder", list.ok && JSON.stringify(Object.keys(list.result)) === JSON.stringify(["kettle"]) && localProducts.length > 0, JSON.stringify(list).slice(0, 300));
const one = await call({ venture: "tandem", route: "purpose/product/kettle", action: "read" });
expect("router: a read says which source and version it came from, with a permalink to cite", one.result?.name === "Kettle (in GitHub)" && one.source?.address === "team-repo://products/kettle.json"
  && one.source.version === blobSha(JSON.stringify(kettle, null, 2) + "\n") && /github\.com\/acme\/tandem\/blob\/[0-9a-f]{40}\/ventures\/tandem\/products\/kettle\.json$/.test(one.source.permalink ?? ""), JSON.stringify(one.source));
const local = await call({ venture: "tandem", route: "purpose/validation/problem", action: "read" });
expect("router: every record type the map does not name stays in the venture folder", local.ok && local.source?.source === "venture" && local.source.version === blobSha(readFileSync(join(tandem, "purpose/validation/problem.json"))));
const teapot = { ...kettle, id: "teapot", name: "Teapot" };
const puts = () => team.calls.filter((x) => x.startsWith("PUT")).length;
const before = puts();
const bad = await call({ venture: "tandem", route: "purpose/product/teapot", action: "write", input: { id: "teapot" } });
expect("router: a write that does not match the schema never reaches the source", !bad.ok && /does not match/.test(bad.error) && puts() === before);
const w = await call({ venture: "tandem", route: "purpose/product/teapot", action: "write", input: teapot, actor: "person", via: "cli", provenance: { derived_from: [one.source.permalink], note: "add the teapot" } });
expect("router: a write to a pull-request source opens a draft pull request, for a person as for an agent", w.ok && w.result.draft === true && /^https:\/\/github\.com\/acme\/tandem\/pull\/1$/.test(w.result.pull_request ?? "") && team.pulls[0]?.draft === true, JSON.stringify(w));
expect("router: nothing lands in the venture folder or on the source's branch until the pull request is merged",
  !existsSync(join(tandem, "products/teapot.json")) && !team.files()["ventures/tandem/products/teapot.json"] && JSON.parse(team.files(team.pulls[0].head.ref)["ventures/tandem/products/teapot.json"]).name === "Teapot");
const e = entries(tandem).at(-1);
expect("router: the write is logged by address, with the source's version and the pull request",
  e.entity === "team-repo://products/teapot.json" && e.activity === "draft" && e.source?.version === w.result.version && e.source.pull_request === w.result.pull_request && e.source.connector === "github" && e.derived_from?.[0] === one.source.permalink, JSON.stringify(e));
const pending = await call({ venture: "tandem", route: "purpose/product/teapot", action: "read" });
expect("router: reading it before the merge says a pull request is waiting", pending.result === null && pending.pending_pull_requests?.[0]?.pull_request === w.result.pull_request);
const prov = spawnSync("node", [naivePath("packages/naive/src/checks/check-provenance.mjs"), ws], { encoding: "utf8" });
// check-sources runs as its own process, so the platform's connectors are preloaded into it (preload.mjs).
const srcCheck = (d) => spawnSync("node", ["--import", new URL("./preload.mjs", import.meta.url).pathname, naivePath("packages/naive/src/checks/check-sources.mjs"), d], { encoding: "utf8" });
expect("router: check-provenance accepts entries for records in another source", prov.status === 0, prov.stderr);
expect("router: check-sources accepts the map", srcCheck(ws).status === 0, srcCheck(ws).stderr);
const valid = spawnSync(process.execPath, [naivePath("packages/naive/src/records/validate.mjs"), "--schema", "knowledge-sources.schema.json", "--file", join(tandem, "knowledge/sources.json")], { encoding: "utf8" });
expect("router: the map matches its schema", valid.status === 0, valid.stdout + valid.stderr);
write(tandem, { "knowledge/sources.json": JSON.stringify({ sources: [{ id: "team-repo", connector: "notion" }], records: { product: "team-repo", venture: "team-repo" } }) });
const broken = srcCheck(ws);
expect("router: check-sources refuses an unknown connector and a record type that must stay in the folder", broken.status === 1 && /no connector notion/.test(broken.stderr) && /venture stays in the venture folder/.test(broken.stderr), broken.stderr);
const refused = await call({ venture: "tandem", route: "purpose/product", action: "read" });
expect("router: a read through an unknown connector fails and says which connectors exist", !refused.ok && /no connector notion: .*filesystem/.test(refused.error), refused.error);
write(tandem, { "knowledge/sources.json": JSON.stringify({ ...map, sources: [{ ...map.sources[0], writes: "none" }] }) });
const ro = await call({ venture: "tandem", route: "purpose/product/teapot", action: "write", input: teapot, actor: "person" });
expect("router: a write to a read-only source is refused", !ro.ok && /read-only/.test(ro.error));
write(tandem, { "knowledge/sources.json": JSON.stringify(map, null, 2) + "\n" });

// ---- Catalog -------------------------------------------------------------------------------------
console.log("\n# catalog");
const { stats } = await build(tandem);
const cat = load(tandem);
expect("catalog: indexes every item in both sources", cat.items.some((x) => x.source === "team-repo" && x.path === "notes/launch.md") && cat.items.some((x) => x.source === "venture" && x.path === "purpose/validation/problem.json") && stats.errors.length === 0, JSON.stringify(stats));
expect("catalog: every item has an address and its version", cat.items.every((x) => x.address === `${x.source}://${x.path}` && /^[0-9a-f]{40}$/.test(x.version)));
expect("catalog: records are tied to their routes, wherever they live", cat.items.find((x) => x.address === "team-repo://products/kettle.json")?.route === "product/kettle" && cat.items.find((x) => x.path === "purpose/validation/problem.json")?.route === "foundation/problem");
const s1 = search(cat, "kettle subscription spring");
expect("catalog: search finds an item in the GitHub source", s1[0]?.address === "team-repo://notes/launch.md" && s1[0].title === "Launch plan", JSON.stringify(s1.slice(0, 2)));
const research = readFileSync(join(tandem, "knowledge/research/pilot-2026-10.md"), "utf8");
const s2 = search(cat, "pilot");
expect("catalog: search finds an item in the venture folder", s2.some((x) => x.address === "venture://knowledge/research/pilot-2026-10.md"));
const raw = readFileSync(join(tandem, FILE), "utf8");
const phrase = research.split("\n").find((l) => l.split(" ").length > 6)?.slice(0, 40);
expect("catalog: keeps no content (no sentence of an item appears in it)", phrase && !raw.includes(phrase) && !raw.includes("Ship the kettle subscription"), phrase);
const again = (await build(tandem)).stats;
expect("catalog: a rebuild with nothing changed reads nothing", again.read === 0 && again.reused === stats.items, JSON.stringify(again));
team.branches.set("main", team.branches.get(team.pulls[0].head.ref)); // the pull request is merged
const merged = (await build(tandem)).stats;
expect("catalog: after the merge, a rebuild reads only the new item", merged.read === 1 && load(tandem).items.some((x) => x.address === "team-repo://products/teapot.json"), JSON.stringify(merged));
expect("router: after the merge the record reads from the source", (await call({ venture: "tandem", route: "purpose/product/teapot", action: "read" })).result?.name === "Teapot");
useFetch(null);

// ---- Live GitHub (optional) ------------------------------------------------------------------------
console.log("\n# live github");
const live = process.env.MENTURA_EVAL_GITHUB_REPO;
const tokenVar = process.env.MENTURA_EVAL_GITHUB_TOKEN ?? "GITHUB_TOKEN";
if (!live || !process.env[tokenVar]) {
  skip(`live GitHub: set MENTURA_EVAL_GITHUB_REPO=owner/name and a token in ${tokenVar} to run it`);
} else {
  const c = ghConnect({ id: "live", repo: live, ref: process.env.MENTURA_EVAL_GITHUB_REF ?? "main", root: process.env.MENTURA_EVAL_GITHUB_ROOT ?? "", token: tokenVar });
  try {
    const items = await c.list();
    expect(`live github: lists ${live}`, items.length > 0);
    const first = items.find((x) => /\.(md|json|txt)$/.test(x.path)) ?? items[0];
    const r = await c.read(first.path);
    expect("live github: read gives content whose git blob SHA-1 is the version GitHub reports", r && blobSha(r.content) === r.version && r.version === first.version);
    expect("live github: read gives a permalink at a commit", /\/blob\/[0-9a-f]{40}\//.test(r.permalink ?? ""));
    const word = r.content.split(/[^A-Za-z]+/).find((x) => x.length > 6);
    if (word) { const hits = await c.search(word); expect(`live github: search for "${word}" returns items with versions`, hits.every((x) => /^[0-9a-f]{40}$/.test(x.version))); }
    if (process.env.MENTURA_EVAL_GITHUB_WRITE === "1") {
      const w = await c.write(`mentura-eval/${Date.now()}.md`, "# Mentura eval\n\nSafe to close.\n", { message: "Mentura connector eval (safe to close)" });
      expect("live github: a write opens a draft pull request", /\/pull\/\d+$/.test(w.pull_request?.url ?? ""), JSON.stringify(w));
      console.log(`     opened ${w.pull_request?.url}; close it and delete branch ${w.pull_request?.branch}`);
    }
  } catch (err) { expect("live github: reachable", false, err.message); }
}

finish();
