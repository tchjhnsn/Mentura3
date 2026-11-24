// The bridge against a real workspace: signed identity, the path guard, and the setup and judge errors.
//
//   node bridge/bridge-test.ts

import { spawn, spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ventureFile as fileIn } from "naive-framework/src/core/venture-paths.mjs";
import { signAssertion, type Identity } from "./assertion.ts";
import { naiveFile } from "./naive-file.mjs";
import { gateRefusal, phaseView, type Lifecycle, type PhaseView } from "./phase.ts";
import { record as appendLog } from "naive-framework/src/core/provenance.mjs";
import { call } from "naive-framework/src/router/router.mjs";
import { phasesWithCriteria } from "naive-framework/src/engine/canonical.mjs";
import { writeHeld } from "naive-framework/src/engine/gate-drafts.mjs";
import { context } from "naive-framework/src/engine/upgrades.mjs";
import * as telosToGoals from "naive-framework/src/engine/migrations/telos-to-goals.mjs";
import { landedAsDraft, nextDecision, plainDecideRefusal, plainWriteRefusal, settlesHere, shownDecisions } from "./record-forms.ts";

const here = import.meta.dirname;
/** The installed Naive package (naive-framework), whose scripts the test runs as their own processes. */
const naive = dirname(fileURLToPath(import.meta.resolve("naive-framework/package.json")));
const scratch = mkdtempSync(join(tmpdir(), "bridge-test-"));
const shared = join(scratch, "ws");
const workspace = join(shared, ".accounts/acct-ada");
const temp = join(scratch, "tmp");
const xdg = join(scratch, "xdg");
mkdirSync(temp);
const key = "bridge-test-key";
const ada = { userId: "acct-ada", name: "Ada", email: "ada@example.test", organizationId: "org-ada", organizationRole: "owner" };
const judge = `node ${naiveFile(naive, "packages/naive/src/records/examples/frames/judge.mjs")}`;

type Answer = { ok: boolean; error?: string; result: { id: string; folder: string; name?: string; ventures: { id: string }[]; tree?: unknown; signer?: string; wording?: string | null; proposed?: unknown[]; chunks?: { venture: string }[]; next: { decision: string } } };
function bridge(input: { op: string; [k: string]: unknown }, env: Record<string, string> = {}, as: Identity = ada): Answer {
  return raw(signAssertion(as, input, key), { NAIVE_BRIDGE_KEY: key, ...env });
}
function raw(arg: string, env: Record<string, string>): Answer {
  const base: NodeJS.ProcessEnv = { ...process.env, NAIVE_CONSOLE_WORKSPACE: shared, TMPDIR: temp, XDG_CONFIG_HOME: xdg, ...env };
  for (const k of ["TYPESAFE_API_KEY", "TYPESAFEAI_API_KEY", "NAIVE_BRIDGE_KEY", "MENTURA_ACTOR", "MENTURA_MODEL", "MENTURA_ACTOR_ID"]) if (!(k in env)) delete base[k];
  if (!("NAIVE_JUDGE_CMD" in env)) delete base.NAIVE_JUDGE_CMD;
  const r = spawnSync(process.execPath, [join(here, "bridge.mjs"), arg], { encoding: "utf8", env: base, timeout: 60_000 });
  if (r.error) throw new Error(`the bridge did not answer: ${r.error.message}`);
  return JSON.parse(r.stdout);
}

/** Files under a venture, without following a symlink. The path-guard fixtures link a parent directory back in. */
function filesIn(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (ent.isSymbolicLink()) continue;
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(join(dir, ent.name), rel);
      else out.push(rel);
    }
  };
  walk(root, "");
  return out;
}

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok" : "FAIL"}  ${name}${ok ? "" : ` ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
};

try {
  const made = bridge({ op: "create", name: "Harbor", description: "Coffee for dock workers" });
  expect("create works with an idea", made.ok, made);
  const id = made.result.id;
  const dir = join(workspace, made.result.folder);
  expect("the temp dump is gone after create", readdirSync(temp).length === 0, readdirSync(temp));
  expect("create leaves the real config home alone", !existsSync(join(xdg, "naive")));
  expect("create's preferences stay in the console's home", existsSync(join(workspace, ".home/.config/naive")));

  const opened = readFileSync(join(dir, readdirSync(dir, { recursive: true, encoding: "utf8" }).find((f) => f.endsWith("provenance.jsonl"))!), "utf8");
  const founderLines = opened.trim().split("\n").map((l) => JSON.parse(l)).filter((e) => /^(people|raw)\b/.test(e.route));
  expect("create logs the signed-in founder as a person, with the account", founderLines.length > 0 && founderLines.every((e) => e.agent.kind === "person" && e.agent.via === "console" && e.agent.account === ada.userId), founderLines);
  expect("create keeps the server's temp path out of the log", !opened.includes(temp), opened);

  const outside = join(scratch, "outside.txt");
  writeFileSync(outside, "OUTSIDE\n");
  writeFileSync(join(dir, ".env"), "HIDDEN=1\n");
  symlinkSync(outside, join(dir, "k-base/out.md"));
  symlinkSync(scratch, join(dir, "k-base/outdir"));
  symlinkSync(join(dir, ".env"), join(dir, "k-base/env.md"));
  symlinkSync("/dev/zero", join(dir, "k-base/zero"));
  symlinkSync(join(dir, "nothing"), join(dir, "k-base/dangling"));
  spawnSync("mkfifo", [join(dir, "k-base/pipe")]);
  const read = (path: string) => bridge({ op: "read", venture: id, path });
  const refused = (name: string, path: string) => { const r = read(path); expect(name, !r.ok && !JSON.stringify(r).includes("OUTSIDE"), r); };
  refused("refuses a link to an outside file", "k-base/out.md");
  refused("refuses a path through a linked folder", "k-base/outdir/outside.txt");
  refused("refuses a link to a hidden file", "k-base/env.md");
  refused("refuses .env", ".env");
  refused("refuses a device", "k-base/zero");
  refused("refuses a FIFO", "k-base/pipe");
  refused("refuses ..", "../outside.txt");
  expect("reads a plain file", read("venture.json").ok);
  const shown = bridge({ op: "venture", venture: id });
  expect("a dangling link does not take the venture down", shown.ok, shown);
  expect("a venture names the functions it has turned on", Array.isArray(shown.result.departments) && shown.result.departments.every((d: unknown) => typeof d === "string"), shown.result.departments);

  const decision = bridge({ op: "docket", venture: id }).result.next.decision as string;
  const broken = join(scratch, "broken");
  mkdirSync(broken);
  writeFileSync(join(broken, "python3"), "#!/bin/sh\necho 'no python here' >&2\nexit 1\n");
  chmodSync(join(broken, "python3"), 0o755);
  const noPython = bridge({ op: "decide", venture: id, id: decision, answer: "Harbor pilots" }, { PATH: `${broken}:${process.env.PATH}` });
  expect("deciding needs no Python: a broken python3 on PATH changes nothing", noPython.ok, noPython);

  const agent = bridge({ op: "decide", venture: id, id: decision, answer: "Dock workers", actor: { MENTURA_ACTOR: "agent", MENTURA_MODEL: null } });
  expect("an actor marked agent is refused", !agent.ok && /only a person approves/.test(agent.error ?? ""), agent);

  const unsigned = (arg: string, env: Record<string, string>) => expect("refuses with no valid assertion", !raw(arg, env).ok, arg);
  unsigned(JSON.stringify({ op: "ventures" }), { NAIVE_BRIDGE_KEY: key });
  unsigned(signAssertion(ada, { op: "ventures" }, "guessed-key"), { NAIVE_BRIDGE_KEY: key });
  unsigned(signAssertion(ada, { op: "ventures" }, key), {});
  const [body, mac] = signAssertion({ ...ada, name: "Mallory" }, { op: "ventures" }, key).split(".");
  const [, adaMac] = signAssertion(ada, { op: "ventures" }, key).split(".");
  unsigned(`${body}.${adaMac}`, { NAIVE_BRIDGE_KEY: key });
  expect("the assertion's own mac still opens", Boolean(mac) && bridge({ op: "ventures" }).ok);
  const late = Date.now;
  Date.now = () => late() - 120_000;
  const stale = signAssertion(ada, { op: "ventures" }, key);
  Date.now = late;
  unsigned(stale, { NAIVE_BRIDGE_KEY: key });
  const signedBody = (claims: string) => {
    const b = Buffer.from(claims).toString("base64url");
    return `${b}.${createHmac("sha256", key).update(b).digest("base64url")}`;
  };
  const claims = (expires: string) => `{"identity":${JSON.stringify(ada)},"request":{"op":"ventures"}${expires}}`;
  expect("a correctly signed body with a future expiry opens", raw(signedBody(claims(`,"expires":${Date.now() + 60_000}`)), { NAIVE_BRIDGE_KEY: key }).ok);
  for (const [what, expires] of [["missing", ""], ["text", ',"expires":"soon"'], ["numeric text", ',"expires":"99999999999999"'], ["null", ',"expires":null'], ["infinite", ',"expires":1e999']]) {
    const r = raw(signedBody(claims(expires)), { NAIVE_BRIDGE_KEY: key });
    expect(`a signed assertion with ${what} expires is refused`, !r.ok && /no signed identity/.test(r.error ?? ""), r);
  }
  for (const op of ["constructor", "toString", "hasOwnProperty", "__proto__"]) {
    const r = bridge({ op });
    expect(`the inherited name ${op} is no operation`, !r.ok && r.error === `no operation ${op}`, r);
  }
  for (const said of ["AGENT", " Agent ", "robot"]) {
    const r = bridge({ op: "decide", venture: id, id: decision, answer: "Dock workers", actor: { MENTURA_ACTOR: said } });
    expect(`an actor declared as ${JSON.stringify(said)} is refused`, !r.ok && /only a person approves/.test(r.error ?? ""), r);
  }
  const mallory = { ...ada, userId: "acct-mallory" };
  const as = (input: { op: string; [k: string]: unknown }) => bridge(input, {}, mallory);
  const own = as({ op: "create", name: "Mallory Ltd" });
  expect("each account lists only its own ventures", as({ op: "ventures" }).result.ventures.map((v) => v.id).join() === own.result.id && bridge({ op: "ventures" }).result.ventures.every((v) => v.id !== own.result.id));
  const missing = as({ op: "venture", venture: "no-such-venture" }).error?.replace("no-such-venture", id);
  const foreign: [string, { op: string; [k: string]: unknown }][] = [
    ["venture", { op: "venture", venture: id }],
    ["read", { op: "read", venture: id, path: "venture.json" }],
    ["docket", { op: "docket", venture: id }],
    ["decide", { op: "decide", venture: id, id: decision, answer: "Dock workers" }],
    ["prompt", { op: "prompt", venture: id, text: "Harbor coffee for dock workers" }],
    ["venture by folder path", { op: "venture", venture: `../acct-ada/${made.result.folder}` }],
    ["read by a path out of the account", { op: "read", venture: own.result.id, path: `../../acct-ada/${made.result.folder}/venture.json` }],
  ];
  for (const [what, input] of foreign) {
    const r = as(input);
    expect(`another account gets nothing from ${what}`, !r.ok && !JSON.stringify(r).includes("Dock workers") && !JSON.stringify(r).includes("Coffee"), r);
  }
  expect("a foreign venture answers as a missing one", as({ op: "venture", venture: id }).error === missing, missing);
  const routed = as({ op: "prompt", venture: own.result.id, text: "Harbor" });
  expect("words typed in one's own venture never route into another account's", routed.ok && routed.result.chunks?.every((c) => c.venture === own.result.id) === true, routed);
  const same = as({ op: "create", name: "Harbor" });
  expect("two accounts can use the same name without learning of each other", same.ok && same.result.folder === made.result.folder, same);
  expect("one account's raw notes stay in its workspace", !readdirSync(join(workspace, "raw")).some((f) => readFileSync(join(workspace, "raw", f), "utf8").includes("Harbor")));
  expect("an account id cannot name a path", !bridge({ op: "ventures" }, {}, { ...ada, userId: "../acct-ada" }).ok);

  const venture = (folder: string, owner?: string) => {
    const made = bridge({ op: "create", name: folder }, {}, { ...ada, userId: "acct-maker" });
    const from = join(shared, ".accounts/acct-maker", made.result.folder), to = join(shared, folder);
    renameSync(from, to);
    if (owner) { mkdirSync(join(to, ".naive"), { recursive: true }); writeFileSync(join(to, ".naive/owner-account"), `${owner}\n`); }
    return made.result.id;
  };
  const tool = (...args: string[]) => spawnSync(process.execPath, [join(here, "claim-code.ts"), ...args], { encoding: "utf8", env: { ...process.env, NAIVE_CONSOLE_WORKSPACE: shared } });

  const stamped = venture("stamped", ada.userId);
  as({ op: "adopt" });
  expect("a stamped venture stays hidden from other accounts", !as({ op: "venture", venture: stamped }).ok);
  bridge({ op: "adopt" });
  expect("a stamped venture comes home to its owner", bridge({ op: "ventures" }).result.ventures.some((v) => v.id === stamped) && bridge({ op: "docket", venture: stamped }).ok);
  expect("a moved venture's provenance still checks", spawnSync(process.execPath, [naiveFile(naive, "packages/naive/src/checks/check-provenance.mjs"), join(workspace, "stamped")], { encoding: "utf8" }).status === 0);

  venture("stamped-free");
  const orphan = venture("orphan");
  expect("nobody sees a venture with no owner", ![ada, mallory].some((a) => bridge({ op: "ventures" }, {}, a).result.ventures.some((v) => v.id === orphan) || bridge({ op: "venture", venture: orphan }, {}, a).ok));
  expect("the operator's list names it", tool().stdout.includes(orphan));
  expect("no code is issued for an owned venture", tool(stamped).status === 1);
  const claim = (code: unknown, who: Identity = ada) => bridge({ op: "claim", code }, {}, who);
  for (const guess of ["", "orphan", "guess", 7, null]) expect(`the code ${JSON.stringify(guess)} claims nothing`, /not valid/.test(claim(guess).error ?? ""));
  const first = tool(orphan).stdout.trim();
  const code = tool(orphan).stdout.trim();
  expect("a newer code replaces the older one", first !== code && /not valid/.test(claim(first).error ?? ""));
  expect("no code is stored in the clear", !readdirSync(join(shared, ".claims")).some((f) => readFileSync(join(shared, ".claims", f), "utf8").includes(code) || f.includes(code)));
  const held = join(shared, ".claims", readdirSync(join(shared, ".claims")).find((f) => f.endsWith(".json"))!);
  const live = readFileSync(held, "utf8");
  writeFileSync(held, JSON.stringify({ ...JSON.parse(live), expires: Date.now() - 1 }));
  expect("an expired code claims nothing", /not valid/.test(claim(code).error ?? ""));
  writeFileSync(held, live);
  const taken = claim(code);
  expect("the code claims the venture", taken.ok && taken.result.id === orphan && bridge({ op: "docket", venture: orphan }).ok, taken);
  expect("the claim is on record", readFileSync(join(shared, ".claims/claimed.jsonl"), "utf8").includes(ada.userId));
  expect("the code works only once", /not valid/.test(claim(code, mallory).error ?? "") && !as({ op: "venture", venture: orphan }).ok);

  const twin = venture("orphan");
  const clash = tool(twin).stdout.trim();
  expect("a claim that would collide says so and moves nothing", /already have/.test(claim(clash).error ?? "") && existsSync(join(shared, "orphan")));
  expect("the code survives that refusal", as({ op: "claim", code: clash }).ok);

  const bob = join(shared, ".accounts/acct-mallory", own.result.folder);
  const linked = venture("linked");
  symlinkSync(bob, join(shared, "linked/k-base/x"));
  const trap = tool(linked).stdout.trim();
  expect("a venture holding a link cannot be claimed", /cannot be claimed/.test(claim(trap).error ?? "") && existsSync(join(shared, "linked")));
  rmSync(join(shared, "linked"), { recursive: true });
  const parent = venture("parent");
  renameSync(join(shared, "stamped-free"), join(shared, "parent/child"));
  const nest = tool(parent).stdout.trim();
  expect("a venture holding another venture cannot be claimed", /cannot be claimed/.test(claim(nest).error ?? "") && existsSync(join(shared, "parent")));
  rmSync(join(shared, "parent"), { recursive: true });
  expect("a slash cannot name a venture by path, even one's own", !bridge({ op: "venture", venture: made.result.folder + "/k-base" }).ok && !bridge({ op: "docket", venture: `./${made.result.folder}` }).ok);

  const dup = venture("orphan-dup", ada.userId);
  renameSync(join(shared, "orphan-dup"), join(shared, made.result.folder));
  const held2 = bridge({ op: "adopt" });
  expect("a venture that would collide stays put and is reported", held2.ok && (held2.result as unknown as { skipped: string[] }).skipped.includes(dup) && bridge({ op: "ventures" }).ok, held2);
  rmSync(join(shared, made.result.folder), { recursive: true });

  const racer = venture("racer");
  const raced = tool(racer).stdout.trim();
  const runs = await Promise.all(["acct-one", "acct-two", "acct-three"].map((userId) => new Promise<string>((done) => {
    const c = spawn(process.execPath, [join(here, "bridge.mjs"), signAssertion({ ...ada, userId }, { op: "claim", code: raced }, key)], { env: { ...process.env, NAIVE_CONSOLE_WORKSPACE: shared, NAIVE_BRIDGE_KEY: key } });
    let out = "";
    c.stdout.on("data", (d) => { out += d; });
    c.on("close", () => done(out));
  })));
  expect("of callers racing one code, exactly one wins", runs.filter((r) => JSON.parse(r).ok).length === 1, runs);

  const claimed = bridge({ op: "decide", venture: id, id: decision, answer: "Dock workers", actor: { MENTURA_ACTOR_ID: "some-agent" } });
  expect("an actor id that is not the signer is refused", !claimed.ok && /only a person approves/.test(claimed.error ?? ""), claimed);

  const decided = bridge({ op: "decide", venture: id, id: decision, answer: "Dock workers", actor: { MENTURA_ACTOR: "person", MENTURA_HARNESS: "smuggled", NAIVE_JUDGE_CMD: "smuggled" } });
  expect("a signed-in approval goes through", decided.ok, decided);
  const log = readFileSync(join(dir, filesIn(dir).find((f) => f.endsWith("provenance.jsonl"))!), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const line = log.findLast((e) => e.activity === "accept");
  expect("provenance says person, with the account", line?.agent.kind === "person" && line.agent.via === "console" && line.agent.id === "Ada" && line.agent.account === ada.userId, line);
  expect("decide takes no environment beyond the actor's three keys", !line?.agent.harness, line);
  expect("the decision says the signer is verified and claims its wording", decided.result?.signer === "verified" && Boolean(decided.result?.wording), decided);
  const record = filesIn(dir).filter((f) => f.endsWith(".decision.json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8"))).find((d) => d.id === decision);
  expect("the decision file names the account", record?.provenance.signer === "verified" && record.provenance.signer_account === ada.userId && record.provenance.approved_by === "Ada", record?.provenance);

  const words = "I want to raise money without giving up control";
  const noJudge = bridge({ op: "prompt", venture: id, text: words });
  expect("no judge is an error, not a note", !noJudge.ok && /no judge is set up/.test(noJudge.error ?? ""), noJudge);
  const inbox = join(dir, "k-base/raw/inbox");
  expect("no judge saves nothing", !existsSync(inbox) || !readdirSync(inbox).some((f) => readFileSync(join(inbox, f), "utf8").includes(words)));
  const check = spawnSync(process.execPath, [naiveFile(naive, "packages/naive/src/checks/check-provenance.mjs"), dir], { encoding: "utf8" });
  expect("the console's provenance entries pass the framework's check", check.status === 0, check.stdout + check.stderr);
  const judged = bridge({ op: "prompt", venture: id, text: words }, { NAIVE_JUDGE_CMD: judge });
  expect("a judge proposes the frame's decisions", judged.result?.proposed?.length === 2, judged);
  const proposedLog = readFileSync(join(dir, filesIn(dir).find((f) => f.endsWith("provenance.jsonl"))!), "utf8");
  expect("a frame's proposals are logged as coming through the console", proposedLog.trim().split("\n").map((l) => JSON.parse(l)).at(-1)?.agent.via === "console", proposedLog.slice(-400));

  {
    const made = bridge({ op: "create", name: "Pier" });
    const pier = made.result.id, home = join(workspace, made.result.folder, "k-base");
    const write = (decision: string, values: unknown, env = {}, as = ada, extra = {}) => bridge({ op: "record", venture: pier, id: `foundation-${decision}`, values, ...extra }, env, as) as Answer;
    const read = (f: string) => JSON.parse(readFileSync(join(home, f), "utf8"));
    const rows = () => (bridge({ op: "docket", venture: pier }).result as unknown as { functions: { decisions: { id: string; action: { kind: string; form?: { fields: { key: string; options?: { value: string }[] }[] }; value?: unknown } }[] }[] }).functions.flatMap((f) => f.decisions);
    const row = (id: string) => rows().find((d) => d.id === `foundation-${id}`);
    const log = () => readFileSync(join(workspace, made.result.folder, "meta/provenance.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));

    expect("the docket carries a form for a record it asks for", row("alignment")?.action.form?.fields[0].key === "principles", row("alignment"));
    expect("choices come from the schema", row("channels")?.action.form?.fields[0].options?.some((o) => o.value === "market-first") === true, row("channels"));
    expect("business models come from the vocabulary", row("business-models")?.action.form?.fields.at(-1)?.options?.some((o) => o.value === "freemium") === true);
    expect("the docket asks for the mission, competence and tagline", ["mission", "competence", "tagline"].every((s) => row(s)?.action.form?.fields.length === 1), rows());

    const empty = write("alignment", { principles: "  " });
    expect("an empty answer is refused in plain words", !empty.ok && /needs an answer/.test(empty.error ?? "") && !/schema|\.json/.test(empty.error ?? ""), empty);
    const mallory = { ...ada, userId: "acct-mallory", name: "Mallory" };
    expect("another account's write finds no venture", !write("alignment", { principles: "Mine now" }, {}, mallory).ok && !existsSync(join(home, "foundation/alignment.json")));
    const agent = write("alignment", { principles: "Agents obey" }, {}, ada, { actor: { MENTURA_ACTOR: "agent", MENTURA_MODEL: null } });
    expect("a declared agent writes nothing", !agent.ok && /Only a person/.test(agent.error ?? "") && !existsSync(join(home, "foundation/alignment.json")), agent);
    expect("the request cannot choose the route", write("mission", { route: "foundation/alignment" }).ok === false && !existsSync(join(home, "foundation/alignment.json")));

    const saved = write("alignment", { principles: "Tell the truth\nTell the truth\n\nNever sell data", route: "people/team", id: "x" });
    expect("a founder writes the alignment record", saved.ok, saved);
    const principles = read("foundation/alignment.json").principles;
    expect("each line is a principle with its own id, sourced to the founder", principles.length === 3 && new Set(principles.map((p: { id: string }) => p.id)).size === 3 && /^Ada, \d{4}-/.test(principles[0].source), principles);
    const entry = log().at(-1);
    expect("the log records the verified person", entry.entity === "foundation/alignment.json" && entry.activity === "write" && entry.agent.kind === "person" && entry.agent.id === "Ada" && entry.agent.account === ada.userId && entry.agent.via === "console", entry);
    expect("the statement leaves the docket, with no draft", !row("alignment") && readdirSync(join(home, "_drafts")).length === 0, row("alignment"));
    const again = write("alignment", { principles: "Overwrite" });
    expect("a settled statement is not overwritten", !again.ok && read("foundation/alignment.json").principles.length === 3, again);

    expect("the problem record writes", write("problem", { statement: "Docks have no coffee", segment: "Night shift" }).ok);
    expect("an ICP writes under its own id", write("icp", { who: "Night shift dock workers" }).ok && read("foundation/icp/night-shift-dock-workers.json").primary === true);
    expect("channels write", write("channels", { path: "market-first", channels: "Union halls\nReferral" }).ok && read("validation/go-to-market.json").channels[1].id === "referral");

    const telos = { statement: "Every dock has coffee", end_state: "No shift goes without", measure: "Docks served", measure_kind: "usage_or_adoption", outcome: "hold" };
    expect("the vision writes the telos", write("vision", telos).ok);
    expect("a field already answered is not asked again", row("exit-criteria")?.action.form?.fields.map((f) => f.key).join() === "criteria", row("exit-criteria"));
    expect("exit criteria join the same telos", write("exit-criteria", { criteria: "Ten docks say yes", statement: "Replaced" }).ok);
    const kept = read("foundation/telos.json");
    expect("the second write keeps the first", kept.statement === telos.statement && kept.phases[0].phase === "discovery" && kept.phases[0].exit_criteria[0].serves[0] === "docks-served", kept);

    expect("business models start a product", write("business-models", { name: "Pier Cart", description: "Coffee at the gate", models: ["subscription"] }).ok);
    expect("markets reuse that product", write("markets", { geography: "US ports", name: "Ignored" }).ok);
    const cart = read("product/pier-cart.json");
    expect("both land on one product", cart.name === "Pier Cart" && cart.business_model[0] === "subscription" && cart.market.geography === "US ports", cart);

    expect("a confirm shows what it confirms", row("phase")?.action.value === "discovery", row("phase"));
    const seenPhase = (bridge({ op: "docket", venture: pier }).result as unknown as { functions: { decisions: { id: string; action: { seen?: string } }[] }[] }).functions.flatMap((f) => f.decisions).find((d) => d.id === "foundation-phase")?.action.seen;
    const logLength = log().length;
    expect("confirm needs the value the founder saw", !bridge({ op: "confirm", venture: pier, id: "foundation-phase" }).ok && !bridge({ op: "confirm", venture: pier, id: "foundation-phase", seen: "stale" }).ok && log().length === logLength);
    const confirmed = bridge({ op: "confirm", venture: pier, id: "foundation-phase", seen: seenPhase });
    expect("a founder confirms a statement as verified", confirmed.ok && log().at(-1).activity === "confirm" && log().at(-1).agent.account === ada.userId, confirmed);
    expect("a confirmed statement leaves the docket", !row("phase"));
    expect("confirm refuses a declared agent", !bridge({ op: "confirm", venture: pier, id: "foundation-phase", actor: { MENTURA_ACTOR: "agent" } }).ok);

    const ventureFile = join(workspace, made.result.folder, "venture.json");
    const identity = JSON.parse(readFileSync(ventureFile, "utf8"));
    const refused = write("competence", { competence: "Logistics", id: "stolen", name: "Stolen", phase: "scale", owner: "x", status: "x", core: { promise: "x" } });
    const after = JSON.parse(readFileSync(ventureFile, "utf8"));
    expect("competence writes before the mission, and nothing else moves", refused.ok && after.core.competence === "Logistics" && after.core.promise === "" && ["id", "name", "phase", "owner", "status"].every((k) => after[k] === identity[k]), after);
    const logged = log().at(-1);
    expect("the log names the person and only that statement", logged.entity === "venture.json" && logged.route === "foundation/core" && logged.agent.account === ada.userId && logged.agent.kind === "person" && logged.statements.join() === "competence", logged);
    expect("a person's core write signs for no other statement in the file", !row("competence"));
    expect("the mission is still asked for once competence is saved", !!row("mission")?.action.form, row("mission"));
    expect("the mission and tagline land in their places", write("mission", { promise: "Coffee at every dock" }).ok && write("tagline", { tagline: "Hot by shift change" }).ok);
    const full = JSON.parse(readFileSync(ventureFile, "utf8"));
    expect("each field stays where the venture keeps it", full.core.promise === "Coffee at every dock" && full.core.competence === "Logistics" && full.brand.tagline === "Hot by shift change", full);
    expect("a settled core statement is not overwritten", !write("mission", { promise: "Another" }).ok && JSON.parse(readFileSync(ventureFile, "utf8")).core.promise === "Coffee at every dock");
    expect("a declared agent cannot write a core field", /Only a person/.test(write("tagline", { tagline: "x" }, {}, ada, { actor: { MENTURA_ACTOR: "agent" } }).error ?? ""));
    expect("products write", !row("products") || write("products", { name: "Pier Kiosk", description: "A stand" }).ok, row("products"));

    const phase = () => bridge({ op: "phase", venture: pier }).result as unknown as PhaseView;
    const inPhase = () => JSON.parse(readFileSync(ventureFile, "utf8")).phase;
    const move = (extra = {}, as: Identity = ada) => bridge({ op: "advance", venture: pier, to: "validation", ...extra }, {}, as);
    const meet = (extra = {}, as: Identity = ada) => bridge({ op: "meet", venture: pier, id: phase().criteria[0].id, evidence: "Ten docks signed", ...extra }, {}, as);
    const before = phase();
    expect("the gate names the phase, its gate and what comes next", before.name === "Discovery" && before.gate === "Problem-solution fit" && before.next?.id === "validation" && before.criteria.length === 1 && !before.ready, before);

    const early = move();
    expect("the gate refuses an unmet criterion in plain words", !early.ok && /Ten docks say yes/.test(early.error ?? "") && !/--|naive phase|\.json/.test(early.error ?? "") && inPhase() === "discovery", early);
    expect("no override reaches the gate", !move({ override: "because", reason: "because" }).ok && inPhase() === "discovery");

    expect("a criterion needs evidence", /what shows this is true/i.test(meet({ evidence: "  " }).error ?? "") && !phase().criteria[0].met);
    expect("a declared agent cannot meet a criterion", /Only a person/.test(meet({ actor: { MENTURA_ACTOR: "agent" } }).error ?? "") && !phase().criteria[0].met);
    expect("another account cannot meet a criterion", !meet({}, mallory).ok && !phase().criteria[0].met);
    const met = meet();
    expect("a founder meets a criterion as verified", met.ok && phase().criteria[0].met?.evidence === "Ten docks signed" && log().at(-1).agent.account === ada.userId, met);
    const firstMet = phase().criteria[0].met?.at;
    expect("a met criterion is not stamped again", !meet({ evidence: "Other" }).ok && phase().criteria[0].met?.at === firstMet);
    expect("the gate opens once every criterion is met", phase().ready);

    expect("a declared agent cannot move the phase", /Only a person/.test(move({ actor: { MENTURA_ACTOR: "agent" } }).error ?? "") && inPhase() === "discovery");
    expect("another account finds no venture to move", !move({}, mallory).ok && inPhase() === "discovery");
    expect("a same-named account from elsewhere finds no venture to move", !move({}, { ...mallory, name: "Ada" }).ok && inPhase() === "discovery");
    const owned = join(workspace, made.result.folder, ".naive/owner-account");
    const hadStamp = existsSync(owned) ? readFileSync(owned, "utf8") : null;
    mkdirSync(join(owned, ".."), { recursive: true });
    writeFileSync(owned, "acct-someone-else");
    expect("a stamp naming another account refuses the move", /owns this venture/.test(move().error ?? "") && inPhase() === "discovery");
    if (hadStamp === null) rmSync(owned); else writeFileSync(owned, hadStamp);
    expect("a phase past the next one is refused", !bridge({ op: "advance", venture: pier, to: "scale", override: "x" }).ok && inPhase() === "discovery");
    expect("no phase is refused plainly", /cannot move there/.test(bridge({ op: "advance", venture: pier, to: "nowhere" }).error ?? ""));

    const moved = move();
    const signed = log().filter((e: { note?: string }) => /discovery -> validation/.test(e.note ?? "")).at(-1);
    expect("the founder moves the phase, signed by their account", moved.ok && inPhase() === "validation" && signed.agent.kind === "person" && signed.agent.id === "Ada" && signed.agent.account === ada.userId, { moved, signed });
    expect("a repeat does nothing", !move().ok && inPhase() === "validation");
    expect("going back is refused here", !bridge({ op: "advance", venture: pier, to: "discovery", reason: "x" }).ok && inPhase() === "validation");
    expect("the next phase asks what must be true to leave it", phase().name === "Validation" && phase().gaps.length === 1 && phase().statable && !phase().ready, phase());
    const state = (statements: unknown, extra = {}, as: Identity = ada) => bridge({ op: "criteria", venture: pier, phase: phase().name, statements, ...extra }, {}, as);
    expect("a declared agent cannot state criteria", /Only a person/.test(state("x", { actor: { MENTURA_ACTOR: "agent" } }).error ?? "") && !phase().criteria.length);
    expect("another account cannot state criteria", !state("x", {}, mallory).ok && !phase().criteria.length);
    expect("a form left open on another phase writes nothing", !state("x", { phase: "Discovery" }).ok && !phase().criteria.length);
    expect("empty lines state nothing", !state(" \n ").ok && !phase().criteria.length);
    const stated = state("Twenty docks reorder\n\nTwenty docks reorder");
    const onDisk = () => read("foundation/telos.json") as { measures: { id: string }[]; phases: { phase: string; exit_criteria: { id: string; statement: string; serves: string[]; evidence?: string; met?: { by: string; at: string; evidence?: string } }[] }[] };
    const validation = () => onDisk().phases.find((p) => p.phase === "validation")!.exit_criteria;
    expect("a founder states this phase's criteria, one per line, in the telos, signed", stated.ok && validation().map((c) => c.id).join() === "twenty-docks-reorder,twenty-docks-reorder-2" && validation().every((c) => c.serves[0] === onDisk().measures[0].id) && log().at(-1).route === "foundation/telos" && log().at(-1).agent.account === ada.userId, { stated, t: onDisk() });
    expect("the lifecycle reads them, and the venture stays unmigrated", phase().criteria.length === 2 && !existsSync(join(home, "foundation/exit-criteria")), phase());
    expect("the last phase's record is untouched", onDisk().phases[0].exit_criteria[0].met?.by === "Ada");
    expect("criteria already stated are not replaced", !state("Other").ok && phase().criteria[0].statement === "Twenty docks reorder" && !phase().statable);
    expect("evidence goes only on a met criterion", !bridge({ op: "evidence", venture: pier, id: phase().criteria[0].id, evidence: "x" }).ok && !validation()[0].evidence);
    expect("stated criteria move through the gate", phase().criteria.every((c) => bridge({ op: "meet", venture: pier, id: c.id, evidence: "Signed orders" }).ok) && phase().ready);

    const playbook = (id: string | null) => { const v = JSON.parse(readFileSync(ventureFile, "utf8")); if (id) v.lifecycle_playbook = id; else delete v.lifecycle_playbook; writeFileSync(ventureFile, JSON.stringify(v, null, 2)); };
    playbook("revenue-first");
    const add = (evidence: string, extra = {}, as: Identity = ada) => bridge({ op: "evidence", venture: pier, id: phase().criteria[0].id, evidence, ...extra }, {}, as);
    const metBefore = phase().criteria[0].met;
    expect("a playbook can ask for evidence once every criterion is met", !phase().ready && phase().wanted.length === 1 && /Say so in the evidence/.test(phase().gaps[0]) && !phase().gaps[0].includes("Name it"), phase());
    expect("a declared agent cannot add evidence", /Only a person/.test(add("paid", { actor: { MENTURA_ACTOR: "agent" } }).error ?? "") && !phase().ready);
    expect("another account cannot add evidence", !add("paid", {}, mallory).ok && !phase().ready);
    expect("evidence needs words", !add("  ").ok);
    expect("evidence the gate cannot read says so", add("Warm notes").ok && phase().wanted.length === 1);
    const added = add("Three docks paid");
    const criterion = phase().criteria[0];
    expect("evidence added to a met criterion clears the playbook, keeping who met it and when", added.ok && phase().ready && JSON.stringify(criterion.met) === JSON.stringify(metBefore) && criterion.evidence === "Warm notes; Three docks paid" && log().at(-1).agent.account === ada.userId, { added, criterion });
    playbook(null);

    expect("the last phase's met criteria stay on record", read("foundation/telos.json").phases[0].exit_criteria[0].met?.by === "Ada");

    const chosen: Lifecycle = { step: 1, of: 5, current: { id: "discovery", name: "Discovery", question: "q", gate: "g" }, next: { id: "validation", name: "Validation", question: "q", gate: "g" }, ready: false, source: "telos", playbook: { id: "revenue-first", chosen: true }, gate_evidence: [{ statement: "a paying customer", met: false }], exit_criteria: [] };
    expect("a playbook's evidence and missing criteria read plainly", /a paying customer/.test(gateRefusal(chosen)) && /No exit criteria are stated/.test(phaseView(chosen)?.gaps[0] ?? "") && !/--|\.json/.test(gateRefusal(chosen)));

    const atGate = (name: string, people: { name: string; role?: string }[] | null) => {
      const v = bridge({ op: "create", name }), d = join(workspace, v.result.folder), roster = fileIn(d, "people/people.json");
      const measures = [{ id: "reorders", statement: "Reorders", kind: "leading", primary: true }];
      writeFileSync(fileIn(d, "foundation/telos.json"), JSON.stringify({ statement: "s", end_state: "e", measures, owner_outcome: { path: "keep" }, phases: [{ phase: "discovery", exit_criteria: [{ id: "c", statement: "c", serves: ["reorders"], met: { at: new Date().toISOString(), by: "Ada" } }] }] }));
      if (people) writeFileSync(roster, JSON.stringify({ people })); else rmSync(roster, { force: true });
      return { id: v.result.id, dir: d, phase: () => (JSON.parse(readFileSync(join(d, "venture.json"), "utf8")) as { phase: string }).phase };
    };
    const go = (id: string, as: Identity) => bridge({ op: "advance", venture: id, to: "validation" }, {}, as);
    const grace = { ...ada, name: "Grace" }, ben = { ...ada, name: "Ben" };

    const pair = atGate("Pair", [{ name: "Ada", role: "founder" }, { name: "Grace", role: "co-founder" }, { name: "Ben", role: "engineer" }]);
    expect("someone who is not a founder cannot sign the move", /only the founder/.test(go(pair.id, ben).error ?? "") && pair.phase() === "discovery");
    expect("a person the venture does not name cannot sign it", /Only a person/.test(go(pair.id, { ...ada, name: "Eve" }).error ?? "") && pair.phase() === "discovery");
    expect("the second founder signs the move", go(pair.id, grace).ok && pair.phase() === "validation");

    const crew = atGate("Crew", [{ name: "Ben", role: "engineer" }, { name: "Grace", role: "engineer" }]);
    expect("with no founding role only the first person signs", !go(crew.id, grace).ok && go(crew.id, ben).ok);

    const unnamed = atGate("Unnamed", null);
    const shownFounder = (bridge({ op: "venture", venture: unnamed.id }).result as unknown as { founder: string | null }).founder;
    expect("a venture naming no one shows no made-up founder", shownFounder === null, shownFounder);
    expect("a declared agent cannot move it", !bridge({ op: "advance", venture: unnamed.id, to: "validation", actor: { MENTURA_ACTOR: "agent" } }).ok && unnamed.phase() === "discovery");
    expect("another account finds no such venture", !go(unnamed.id, mallory).ok && unnamed.phase() === "discovery");
    expect("the account holding a venture that names no one signs the move", go(unnamed.id, { ...ada, name: "Whoever claimed it" }).ok && unnamed.phase() === "validation");

    const moved2 = atGate("Canon", [{ name: "Ada", role: "founder" }]);
    const goalsDir = fileIn(moved2.dir, "foundation/goals");
    mkdirSync(goalsDir, { recursive: true });
    writeFileSync(join(goalsDir, "telos.json"), JSON.stringify({ id: "telos", statement: "s", kind: "venture", measures: [{ id: "reorders", statement: "r", primary: true }] }));
    rmSync(fileIn(moved2.dir, "foundation/telos.json"));
    writeFileSync(join(moved2.dir, "venture.json"), JSON.stringify({ ...JSON.parse(readFileSync(join(moved2.dir, "venture.json"), "utf8")), phase: "validation", lifecycle_playbook: "revenue-first" }));
    const canon = () => bridge({ op: "phase", venture: moved2.id }).result as unknown as PhaseView;
    expect("a canonical venture can state its criteria", canon().statable && bridge({ op: "criteria", venture: moved2.id, phase: "Validation", statements: "Ten reorders" }).ok, canon());
    const file = fileIn(moved2.dir, "foundation/exit-criteria/validation.json");
    expect("they land in the canonical record, serving its measure", canon().criteria[0].id === "ten-reorders" && (JSON.parse(readFileSync(file, "utf8")) as { criteria: { serves: string[] }[] }).criteria[0].serves[0] === "reorders", canon());
    const canonEvidence = bridge({ op: "meet", venture: moved2.id, id: "ten-reorders", evidence: "Orders" }).ok && bridge({ op: "evidence", venture: moved2.id, id: "ten-reorders", evidence: "Paid invoices" });
    expect("evidence added to a canonical record clears the playbook", !!canonEvidence && canonEvidence.ok && canon().ready, canon());

    const agentTelos = atGate("Drafted", [{ name: "Ada", role: "founder" }]);
    writeFileSync(join(agentTelos.dir, "venture.json"), JSON.stringify({ ...JSON.parse(readFileSync(join(agentTelos.dir, "venture.json"), "utf8")), phase: "platform" }));
    const last = bridge({ op: "phase", venture: agentTelos.id }).result as unknown as PhaseView;
    expect("the last phase asks for no exit criteria", !last.statable && !last.gaps.length && !bridge({ op: "criteria", venture: agentTelos.id, phase: "Platform", statements: "x" }).ok, last);

    const unread = atGate("Unread", [{ name: "Ada", role: "founder" }]);
    writeFileSync(join(unread.dir, "venture.json"), JSON.stringify({ ...JSON.parse(readFileSync(join(unread.dir, "venture.json"), "utf8")), phase: "validation" }));
    const stateUnread = () => bridge({ op: "criteria", venture: unread.id, phase: "Validation", statements: "x" });
    expect("a telos no person confirmed is not signed for by stating criteria", /not been confirmed/.test(stateUnread().error ?? ""), stateUnread());
    const drafts = fileIn(unread.dir, "_drafts");
    mkdirSync(drafts, { recursive: true });
    writeFileSync(join(drafts, "foundation__telos.json.draft"), "{}");
    expect("a waiting draft is not overwritten", /draft of this record/.test(stateUnread().error ?? ""), stateUnread());

    {
    type Held = { route: string; variants: { letter: string; seen: string; changes: { field: string; draft: string }[] }[] };
    type Row = { id: string; question: string; action: { kind: string; route?: string | null; form?: unknown; confirm_first?: boolean; held?: Held; several?: boolean; on_phase?: boolean } | null };
    const rowsOf = (v: string) => (bridge({ op: "docket", venture: v }).result as unknown as { functions: { decisions: Row[] }[] }).functions.flatMap((f) => f.decisions);
    const fresh = (name: string) => { const m = bridge({ op: "create", name }); return { id: m.result.id, dir: join(workspace, m.result.folder) }; };
    const draftOn = (dir: string, name: string, body: unknown) => { const d = fileIn(dir, "_drafts"); mkdirSync(d, { recursive: true }); writeFileSync(join(d, name), typeof body === "string" ? body : JSON.stringify(body)); };
    const provOf = (dir: string) => readFileSync(fileIn(dir, "provenance.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));

    const gated = fresh("Gated");
    const alignment = { venture: gated.id, principles: [{ id: "a", statement: "Agent's principle", source: "bot", check: null }] };
    draftOn(gated.dir, "foundation__alignment.json.draft", alignment);
    const onDisk = fileIn(gated.dir, "foundation/alignment.json");
    const past = bridge({ op: "record", venture: gated.id, id: "foundation-alignment", values: { principles: "Mine" } });
    expect("a save does not sign past a waiting draft", !past.ok && !existsSync(onDisk), past);
    const card = rowsOf(gated.id).find((d) => d.id === "foundation-alignment")!;
    const variant = card.action?.held?.variants[0];
    expect("the card shows what the draft would change, with no command", settlesHere(card) && variant?.changes.some((c) => c.field === "principles" && c.draft.includes("Agent's principle")) === true && !JSON.stringify(card.action?.held).includes("mentura"), card);
    const accept = (extra: object, as: Identity = ada) => bridge({ op: "accept", venture: gated.id, id: "foundation-alignment", pick: "a", seen: variant?.seen, ...extra }, {}, as);
    expect("accepting needs what the page showed", /changed since/.test(accept({ seen: "stale" }).error ?? "") && !existsSync(onDisk));
    expect("a declared agent cannot accept", /Only a person/.test(accept({ actor: { MENTURA_ACTOR: "agent" } }).error ?? "") && !existsSync(onDisk));
    expect("another account cannot accept", !accept({}, { ...ada, userId: "acct-mallory" }).ok && !existsSync(onDisk));
    const accepted = accept({});
    const acceptLine = provOf(gated.dir).at(-1);
    expect("a person accepts the draft, signed by the account", accepted.ok && JSON.parse(readFileSync(onDisk, "utf8")).principles[0].statement === "Agent's principle" && acceptLine.activity === "accept" && acceptLine.agent.account === ada.userId && !existsSync(join(fileIn(gated.dir, "_drafts"), "foundation__alignment.json.draft")), { accepted, acceptLine });
    expect("the accepted statement leaves the docket", !rowsOf(gated.id).some((d) => d.id === "foundation-alignment"));

    const same = fresh("Same");
    const sameText = { venture: same.id, principles: [{ id: "a", statement: "Unchanged agent words", source: "bot", check: null }] };
    writeFileSync(fileIn(same.dir, "foundation/alignment.json"), JSON.stringify(sameText));
    appendLog(same.dir, { entity: "foundation/alignment.json", route: "foundation/alignment", activity: "write", agent: { kind: "agent", id: "bot", via: "router" } });
    draftOn(same.dir, "foundation__alignment.json.draft", sameText);
    expect("a draft equal to the record still shows every word accepting signs", JSON.stringify(rowsOf(same.id).find((d) => d.id === "foundation-alignment")?.action?.held?.variants[0].changes).includes("Unchanged agent words"), rowsOf(same.id));

    const badDraft = fresh("Bad draft");
    draftOn(badDraft.dir, "foundation__problem.json.draft", { venture: badDraft.id, stray: true });
    const badCard = rowsOf(badDraft.id).find((d) => d.id === "foundation-problem")!;
    const refusedDraft = bridge({ op: "accept", venture: badDraft.id, id: "foundation-problem", seen: badCard.action?.held?.variants[0].seen });
    expect("a draft that fails its schema is refused plainly and stays", !refusedDraft.ok && !/\.json|schema/i.test(refusedDraft.error ?? "") && existsSync(join(fileIn(badDraft.dir, "_drafts"), "foundation__problem.json.draft")), refusedDraft);

    const paired = fresh("Paired");
    draftOn(paired.dir, "foundation__alignment.json.draft", { venture: paired.id, principles: [{ id: "a", statement: "First", source: "bot", check: null }] });
    draftOn(paired.dir, "foundation__alignment.json.draft.b", { venture: paired.id, principles: [{ id: "b", statement: "Second", source: "bot", check: null }] });
    writeFileSync(fileIn(paired.dir, "_drafts/foundation__alignment.json.draft.gate"), JSON.stringify({ route: "foundation/alignment", file: "foundation/alignment.json", rule: "r", source: "s", then: "draft", variants: [{ variant: "a", file: "_drafts/foundation__alignment.json.draft", by: "one" }, { variant: "b", file: "_drafts/foundation__alignment.json.draft.b", by: "two" }] }));
    const pair = rowsOf(paired.id).find((d) => d.id === "foundation-alignment")!.action!.held!.variants;
    const pickedB = bridge({ op: "accept", venture: paired.id, id: "foundation-alignment", pick: "b", seen: pair[1].seen });
    expect("drafts side by side are each offered, and accepting one removes the others", pair.length === 2 && pickedB.ok && JSON.parse(readFileSync(fileIn(paired.dir, "foundation/alignment.json"), "utf8")).principles[0].id === "b" && !existsSync(join(fileIn(paired.dir, "_drafts"), "foundation__alignment.json.draft")), { pair, pickedB });

    const core = fresh("Core draft");
    draftOn(core.dir, "venture.json.draft", { id: "stolen" });
    const coreCard = rowsOf(core.id).find((d) => d.action?.kind === "accept");
    expect("a draft of the whole venture record is never offered", !coreCard?.action?.held && JSON.parse(readFileSync(join(core.dir, "venture.json"), "utf8")).id === core.id, coreCard);

    const tied = fresh("Tied");
    const chosen = () => bridge({ op: "phase", venture: tied.id }).result as unknown as PhaseView;
    const pick = (id: string, extra: object = {}, as: Identity = ada) => bridge({ op: "playbook", venture: tied.id, id, from: null, ...extra }, {}, as);
    const venture = () => JSON.parse(readFileSync(join(tied.dir, "venture.json"), "utf8"));
    const before = venture();
    expect("the phase card lists the framework's playbooks, none chosen", chosen().playbooks.map((p) => p.id).sort().join() === "product-first,revenue-first" && chosen().chosen === null, chosen());
    expect("a playbook Naive does not have is refused", /no such playbook/.test(pick("made-up").error ?? "") && !venture().lifecycle_playbook);
    expect("a declared agent cannot choose", /Only a person/.test(pick("revenue-first", { actor: { MENTURA_ACTOR: "agent" } }).error ?? "") && !venture().lifecycle_playbook);
    expect("another account cannot choose", !pick("revenue-first", {}, { ...ada, userId: "acct-mallory" }).ok && !venture().lifecycle_playbook);
    const teamed = atGate("Teamed", [{ name: "Ada", role: "founder" }, { name: "Ben", role: "engineer" }]);
    expect("someone who cannot sign the move cannot change its gate", /only a founder/.test(bridge({ op: "playbook", venture: teamed.id, id: "revenue-first", from: null }, {}, ben).error ?? ""));
    const statuses = () => rowsOf(tied.id).map((d) => d.id).join();
    const docketBefore = statuses();
    const pickedPlaybook = pick("revenue-first");
    const line = provOf(tied.dir).at(-1);
    const { lifecycle_playbook, ...rest } = venture();
    expect("a founder chooses through foundation/core, and nothing else in the file moves", pickedPlaybook.ok && lifecycle_playbook === "revenue-first" && JSON.stringify(rest) === JSON.stringify(before) && line.route === "foundation/core" && line.agent.account === ada.userId && line.statements.length === 0, { pickedPlaybook, line });
    expect("the framework reads the choice, and it signs for no statement", chosen().chosen === "revenue-first" && chosen().playbook === "Revenue first" && statuses() === docketBefore, chosen());
    expect("a choice made on a stale page is refused", /changed since/.test(pick("product-first").error ?? "") && venture().lifecycle_playbook === "revenue-first");

    const canonFile = "foundation/exit-criteria/validation.json";
    appendLog(moved2.dir, { entity: canonFile, route: "foundation/exit-criteria/validation", activity: "write", agent: { kind: "agent", id: "bot", via: "router" } });
    const unconfirmedSeen = canon().unconfirmed;
    const addCanon = () => bridge({ op: "evidence", venture: moved2.id, id: "ten-reorders", evidence: "More" });
    const heldWords = readFileSync(file, "utf8");
    expect("a save on the canonical route does not sign an agent's content", !!unconfirmedSeen && /not been confirmed/.test(addCanon().error ?? "") && readFileSync(file, "utf8") === heldWords, canon());
    expect("the canonical confirm is tied to what was shown", /changed since/.test(bridge({ op: "confirmCriteria", venture: moved2.id, seen: "stale" }).error ?? ""));
    expect("another account cannot confirm them", !bridge({ op: "confirmCriteria", venture: moved2.id, seen: unconfirmedSeen }, {}, { ...ada, userId: "acct-mallory" }).ok);
    const canonConfirmed = bridge({ op: "confirmCriteria", venture: moved2.id, seen: unconfirmedSeen });
    expect("after the founder confirms, saving works", canonConfirmed.ok && canon().unconfirmed === null && addCanon().ok, canonConfirmed);

    const uncf = atGate("Uncf", [{ name: "Ada", role: "founder" }]);
    const goalsUncf = fileIn(uncf.dir, "foundation/goals");
    mkdirSync(goalsUncf, { recursive: true });
    writeFileSync(join(goalsUncf, "telos.json"), JSON.stringify({ id: "telos", statement: "s", kind: "venture", measures: [{ id: "m", statement: "r", primary: true }] }));
    rmSync(fileIn(uncf.dir, "foundation/telos.json"));
    writeFileSync(join(uncf.dir, "venture.json"), JSON.stringify({ ...JSON.parse(readFileSync(join(uncf.dir, "venture.json"), "utf8")), phase: "validation" }));
    bridge({ op: "criteria", venture: uncf.id, phase: "Validation", statements: "Ten reorders" });
    appendLog(uncf.dir, { entity: canonFile, route: "foundation/exit-criteria/validation", activity: "write", agent: { kind: "agent", id: "bot", via: "router" } });
    const uncfMeet = bridge({ op: "meet", venture: uncf.id, id: "ten-reorders", evidence: "x" });
    expect("a criterion an agent wrote cannot be marked met before it is confirmed", /not been confirmed/.test(uncfMeet.error ?? ""), uncfMeet);
    const uncfMove = bridge({ op: "advance", venture: uncf.id, to: "beachhead" });
    expect("the move waits for the same confirmation", /not been confirmed/.test(uncfMove.error ?? ""), uncfMove);

    const bare = atGate("Bare", [{ name: "Ada", role: "founder" }]);
    const telosFile = fileIn(bare.dir, "foundation/telos.json");
    const { measures: _gone, ...noMeasures } = JSON.parse(readFileSync(telosFile, "utf8"));
    writeFileSync(telosFile, JSON.stringify({ ...noMeasures, phases: [] }));
    writeFileSync(join(bare.dir, "venture.json"), JSON.stringify({ ...JSON.parse(readFileSync(join(bare.dir, "venture.json"), "utf8")), phase: "validation" }));
    const noMeasure = bridge({ op: "criteria", venture: bare.id, phase: "Validation", statements: "x" });
    expect("a telos with no measures says so, not to check the words", /names none yet/.test(noMeasure.error ?? "") && !/check the words/i.test(noMeasure.error ?? ""), noMeasure);

    const held = fresh("Held item");
    const icpDraft = await call({ venture: held.id, route: "foundation/icp/bakers", action: "write", input: { venture: held.id, id: "bakers", who: "Weekly bakers", primary: true }, actor: "agent", workspace, via: "test", provenance: { agent: { id: "bot" } } });
    const icpCard = rowsOf(held.id).find((d) => d.id === "foundation-icp")!;
    const icpVariant = icpCard.action?.held?.variants[0];
    const icpAccepted = bridge({ op: "accept", venture: held.id, id: "foundation-icp", seen: icpVariant?.seen });
    expect("an agent's draft of a collection item is shown and accepted on its card", icpDraft.ok && icpAccepted.ok && existsSync(fileIn(held.dir, "foundation/icp/bakers.json")) && !existsSync(fileIn(held.dir, "_drafts/foundation__icp__bakers.json.draft")), { icpDraft, icpAccepted });

    const sided = fresh("Sided");
    const heldVariant = (who: string) => writeHeld(sided.dir, { draft: "_drafts/foundation__alignment.json.draft", file: "foundation/alignment.json", route: "foundation/alignment", agent: { id: who }, verdict: { then: "draft", rule: "r", source: "s", variants: true }, text: JSON.stringify({ venture: sided.id, principles: [{ id: who, statement: who, source: "bot", check: null }] }) });
    heldVariant("one");
    const second = heldVariant("two");
    const sideCard = rowsOf(sided.id).find((d) => d.id === "foundation-alignment")!.action!.held!.variants;
    const typed = bridge({ op: "decide", venture: sided.id, id: second.decision, answer: "b" });
    const tookB = bridge({ op: "accept", venture: sided.id, id: "foundation-alignment", pick: "b", seen: sideCard[1].seen });
    expect("variants held on a structured venture reach the card, and a choice already typed is no failure", sideCard.length === 2 && typed.ok && tookB.ok && !existsSync(fileIn(sided.dir, "_drafts/foundation__alignment.json.draft.b")), { sideCard, tookB });

    const telosAt = (name: string, writer: "agent" | "person") => {
      const v = atGate(name, [{ name: "Ada", role: "founder" }]);
      const f = fileIn(v.dir, "foundation/telos.json"), t = JSON.parse(readFileSync(f, "utf8"));
      t.phases[0].exit_criteria.push({ id: "open", statement: "Still open", serves: ["reorders"] });
      writeFileSync(f, JSON.stringify({ ...t, measures: [{ ...t.measures[0], kind: "usage_or_adoption" }], owner_outcome: { path: "acquisition" } }));
      appendLog(v.dir, { entity: "foundation/telos.json", route: "foundation/telos", activity: "write", statements: ["exit-criteria", "vision"], agent: { kind: writer, id: writer === "agent" ? "bot" : "ada", via: "router" } });
      return v;
    };
    const meetOpen = (venture: string) => bridge({ op: "meet", venture, id: "open", evidence: "x" });
    const statementOf = (venture: string, id: string) => rowsOf(venture).find((d) => d.id === `foundation-${id}`);

    const agentTelos = telosAt("Agent telos", "agent");
    const telosFileOf = fileIn(agentTelos.dir, "foundation/telos.json"), telosBefore = readFileSync(telosFileOf, "utf8");
    const telosMeet = meetOpen(agentTelos.id);
    expect("an open criterion in an agent's telos cannot be marked met before it is confirmed", /not been confirmed/.test(telosMeet.error ?? "") && readFileSync(telosFileOf, "utf8") === telosBefore, telosMeet);
    const personMeet = meetOpen(telosAt("Person telos", "person").id);
    expect("a person's telos is met as before", personMeet.ok, personMeet);
    const doneTelos = atGate("Done telos", [{ name: "Ada", role: "founder" }]);
    appendLog(doneTelos.dir, { entity: "foundation/telos.json", route: "foundation/telos", activity: "write", statements: ["exit-criteria", "vision"], agent: { kind: "agent", id: "bot", via: "router" } });
    const doneMove = bridge({ op: "advance", venture: doneTelos.id, to: "validation" });
    expect("the move waits for an agent's telos to be confirmed", /not been confirmed/.test(doneMove.error ?? "") && doneTelos.phase() === "discovery", doneMove);

    const forged = fresh("Forged");
    const forgedVariant = (who: string) => writeHeld(forged.dir, { draft: "_drafts/foundation__alignment.json.draft", file: "foundation/alignment.json", route: "foundation/alignment", agent: { id: who }, verdict: { then: "draft", rule: "r", source: "s", variants: true }, text: JSON.stringify({ venture: forged.id, principles: [{ id: who, statement: who, source: "bot", check: null }] }) });
    forgedVariant("one");
    const other = forgedVariant("two").decision!;
    const otherFile = fileIn(forged.dir, "foundation/decisions/alignment.variants.decision.json");
    const forgeAndAccept = (item: string, forge: Record<string, string>) => {
      const draft = `_drafts/foundation__icp__${item}.json.draft`, file = `foundation/icp/${item}.json`;
      writeHeld(forged.dir, { draft, file, route: `foundation/icp/${item}`, agent: { id: "bot" }, verdict: { then: "draft", rule: "r", source: "s" }, text: JSON.stringify({ venture: forged.id, id: item, who: "Bakers", primary: true }) });
      const gate = fileIn(forged.dir, `${draft}.gate`);
      writeFileSync(gate, JSON.stringify({ ...JSON.parse(readFileSync(gate, "utf8")), ...forge }));
      const seen = rowsOf(forged.id).find((d) => d.id === "foundation-icp")!.action!.held!.variants[0].seen;
      return { accepted: bridge({ op: "accept", venture: forged.id, id: "foundation-icp", seen }), status: JSON.parse(readFileSync(otherFile, "utf8")).status };
    };
    const byId = forgeAndAccept("bakers", { decision: other });
    expect("a sidecar naming another decision cannot sign it", byId.accepted.ok && byId.status === "open", byId);
    rmSync(fileIn(forged.dir, "foundation/icp/bakers.json"));
    const byFile = forgeAndAccept("makers", { file: "foundation/alignment.json", decision: other });
    expect("a sidecar naming another record's file cannot sign that record's decision", byFile.accepted.ok && byFile.status === "open", byFile);

    const migrate = (dir: string) => {
      const ctx = context(dir, { dry: false, git: false, cfg: {}, at: new Date().toISOString(), onConfig() {} });
      telosToGoals.apply(dir, ctx);
      for (const w of ctx.writes) appendLog(dir, { entity: w.path, activity: w.activity, derived_from: w.derived_from, agent: { kind: "agent", id: "naive-upgrade", via: "cli" } });
    };
    const moved = telosAt("Moved agent", "agent");
    migrate(moved.dir);
    const movedPhase = bridge({ op: "phase", venture: moved.id }).result as unknown as PhaseView;
    expect("criteria an agent wrote still need confirming after migration", !!movedPhase.unconfirmed && /not been confirmed/.test(meetOpen(moved.id).error ?? ""), movedPhase);
    const movedVision = statementOf(moved.id, "vision");
    expect("a migrated agent's statements ask to be confirmed, not rewritten", movedVision?.action?.kind === "confirm" && /agent wrote/.test(movedVision.question) && statementOf(moved.id, "exit-criteria")?.action?.kind === "confirm", movedVision);
    expect("confirming the phase's criteria on the page settles them", bridge({ op: "confirmCriteria", venture: moved.id, seen: movedPhase.unconfirmed }).ok && !statementOf(moved.id, "exit-criteria") && meetOpen(moved.id).ok);
    const visionConfirmed = bridge({ op: "confirm", venture: moved.id, id: "foundation-vision", seen: (movedVision?.action as { seen?: string } | undefined)?.seen });
    expect("confirming a migrated statement settles it", visionConfirmed.ok && !statementOf(moved.id, "vision"), visionConfirmed);
    const asked = spawnSync(process.execPath, [naiveFile(naive, "packages/naive/src/interfaces/cli/mentura.mjs"), "confirm", "exit-criteria", "--venture", moved.id], { input: "no\n", encoding: "utf8", env: { ...process.env, MENTURA_WORKSPACE: workspace } });
    expect("mentura confirm shows a migrated venture's criteria before asking", (asked.stdout + asked.stderr).includes("Still open"), asked.stdout + asked.stderr);
    const movedPerson = telosAt("Moved person", "person");
    migrate(movedPerson.dir);
    expect("a person's telos stays confirmed through migration", (bridge({ op: "phase", venture: movedPerson.id }).result as unknown as PhaseView).unconfirmed === null && !statementOf(movedPerson.id, "vision") && !statementOf(movedPerson.id, "exit-criteria") && meetOpen(movedPerson.id).ok);

    const phaseCard = fresh("Phase card");
    expect("no one is said to have written a phase no agent wrote", statementOf(phaseCard.id, "phase")?.question === "Confirm the phase statement", statementOf(phaseCard.id, "phase"));
    appendLog(phaseCard.dir, { entity: "venture.json", route: "foundation/core", activity: "write", statements: ["phase"], agent: { kind: "agent", id: "bot", via: "router" } });
    expect("a phase an agent wrote says so", statementOf(phaseCard.id, "phase")?.question === "Confirm the phase statement an agent wrote", statementOf(phaseCard.id, "phase"));

    const unsure = fresh("Unsure");
    appendLog(unsure.dir, { entity: "venture.json", route: "foundation/core", activity: "write", statements: ["phase"], agent: { kind: "tool", id: "importer", via: "cli" } });
    expect("a tool's write is not called an agent's, and still asks a person to confirm it", statementOf(unsure.id, "phase")?.question === "Confirm the phase statement" && statementOf(unsure.id, "phase")?.action?.kind === "confirm", statementOf(unsure.id, "phase"));
    const quietPhase = telosAt("Tool telos", "person");
    appendLog(quietPhase.dir, { entity: "foundation/telos.json", route: "foundation/telos", activity: "write", statements: ["exit-criteria"], agent: { kind: "tool", id: "importer", via: "cli" } });
    expect("a tool's criteria wait for a person, with no claim about who wrote them", /not been confirmed/.test(meetOpen(quietPhase.id).error ?? ""), meetOpen(quietPhase.id));

    const planted = fresh("Planted");
    const plantedDraft = "_drafts/foundation__alignment.json.draft";
    writeHeld(planted.dir, { draft: plantedDraft, file: "foundation/alignment.json", route: "foundation/alignment", agent: { id: "bot" }, verdict: { then: "draft", rule: "r", source: "s" }, text: JSON.stringify({ venture: planted.id, principles: [{ id: "p", statement: "P", source: "bot", check: null }] }) });
    const victim = fileIn(planted.dir, "foundation/victim.json");
    writeFileSync(victim, JSON.stringify({ secret: "another record" }));
    const plantedGate = fileIn(planted.dir, `${plantedDraft}.gate`);
    writeFileSync(plantedGate, JSON.stringify({ ...JSON.parse(readFileSync(plantedGate, "utf8")), variants: [{ variant: "a", file: "foundation/victim.json" }, { variant: "b", file: "foundation/victim.json" }, { variant: "../../victim", file: "foundation/victim.json" }] }));
    const plantedCard = rowsOf(planted.id).find((d) => d.id === "foundation-alignment")!.action!.held;
    expect("a forged sidecar cannot show another file on the card", plantedCard?.variants.length === 1 && plantedCard.variants[0].letter === "a" && !JSON.stringify(plantedCard).includes("another record"), plantedCard);
    const plantedAccept = bridge({ op: "accept", venture: planted.id, id: "foundation-alignment", seen: plantedCard?.variants[0].seen });
    expect("a forged sidecar cannot make accept delete another file", plantedAccept.ok && existsSync(victim) && !existsSync(fileIn(planted.dir, plantedDraft)), plantedAccept);

    const rounds = fresh("Rounds");
    const roundDraft = (who: string, variants: boolean) => writeHeld(rounds.dir, { draft: "_drafts/foundation__alignment.json.draft", file: "foundation/alignment.json", route: "foundation/alignment", agent: { id: who }, verdict: { then: "draft", rule: "r", source: "s", variants }, text: JSON.stringify({ venture: rounds.id, principles: [{ id: who, statement: who, source: "bot", check: null }] }) });
    const acceptRound = (pick?: string) => { const v = rowsOf(rounds.id).find((d) => d.id === "foundation-alignment")!.action!.held!.variants; return bridge({ op: "accept", venture: rounds.id, id: "foundation-alignment", pick, seen: v.find((x) => x.letter === (pick ?? "a"))!.seen }); };
    roundDraft("one", true);
    roundDraft("two", true);
    const firstRound = acceptRound("b");
    const closed = fileIn(rounds.dir, "foundation/decisions/alignment.variants.decision.json"), closedBefore = readFileSync(closed, "utf8");
    appendLog(rounds.dir, { entity: "foundation/alignment.json", route: "foundation/alignment", activity: "write", agent: { kind: "agent", id: "bot", via: "router" } });
    roundDraft("three", false);
    const laterRound = acceptRound();
    expect("a later single draft does not sign a closed variants decision again", firstRound.ok && laterRound.ok && readFileSync(closed, "utf8") === closedBefore, laterRound);

    const gone = telosAt("Gone vision", "agent");
    migrate(gone.dir);
    rmSync(fileIn(gone.dir, "foundation/goals/telos.json"));
    for (const f of readdirSync(fileIn(gone.dir, "foundation/exit-criteria"))) rmSync(fileIn(gone.dir, `foundation/exit-criteria/${f}`));
    const goneVision = statementOf(gone.id, "vision"), goneCriteria = statementOf(gone.id, "exit-criteria");
    expect("a migrated venture's missing vision asks for its canonical goal", goneVision?.action?.kind === "write" && goneVision.action.route === "foundation/goals/telos" && !!goneVision.action.form, goneVision);
    const goneSaved = bridge({ op: "record", venture: gone.id, id: "foundation-vision", values: { statement: "Every dock has coffee", end_state: "Docks run on it", measure: "Docks served" } });
    expect("and the router takes what that card sends", goneSaved.ok && !statementOf(gone.id, "vision"), goneSaved);
    expect("missing criteria offer no form the router refuses, and point to the phase page", goneCriteria?.action?.route === "foundation/exit-criteria/discovery" && !goneCriteria.action.form && goneCriteria.action.on_phase === true && !settlesHere(goneCriteria), goneCriteria);

    const reject = fresh("Reject");
    draftOn(reject.dir, "notes__plan.json.draft", { note: "x" });
    const waiting = rowsOf(reject.id).find((d) => d.id.startsWith("draft-"));
    expect("a draft's card promises only what the founder can do", !!waiting && /^Accept the agent's draft/.test(waiting.question) && !/reject/i.test(waiting.question), waiting);

    const draftedTelos = atGate("Drafted telos", [{ name: "Ada", role: "founder" }]);
    appendLog(draftedTelos.dir, { entity: "foundation/telos.json", route: "foundation/telos", activity: "write", statements: ["exit-criteria", "vision"], agent: { kind: "agent", id: "bot", via: "router" } });
    draftOn(draftedTelos.dir, "foundation__telos.json.draft", JSON.parse(readFileSync(fileIn(draftedTelos.dir, "foundation/telos.json"), "utf8")));
    const draftedMove = bridge({ op: "advance", venture: draftedTelos.id, to: "validation" });
    expect("a waiting draft does not pass an agent's unconfirmed telos through the gate", /not been confirmed/.test(draftedMove.error ?? "") && draftedTelos.phase() === "discovery", draftedMove);

    const adopted = fresh("Adopted");
    appendLog(adopted.dir, { entity: "venture.json", route: "foundation/core", activity: "baseline", agent: { kind: "agent", id: "cli", via: "cli" } });
    expect("a default baseline does not say an agent wrote the record, and still asks a person", statementOf(adopted.id, "phase")?.question === "Confirm the phase statement" && statementOf(adopted.id, "phase")?.action?.kind === "confirm", statementOf(adopted.id, "phase"));
    const lifted = fresh("Lifted");
    appendLog(lifted.dir, { entity: "venture.json", activity: "move", derived_from: ["venture.json"], agent: { kind: "agent", id: "naive-upgrade", via: "cli" } });
    expect("a migration lifting a field out does not say an agent wrote what stayed", !/an agent wrote/.test(statementOf(lifted.id, "phase")?.question ?? ""), statementOf(lifted.id, "phase"));
    const selfCited = fresh("Self cited");
    appendLog(selfCited.dir, { entity: "venture.json", route: "foundation/core", activity: "write", derived_from: ["venture.json"], statements: ["phase"], agent: { kind: "agent", id: "bot", via: "mcp" } });
    expect("an agent citing the file itself still wrote it", statementOf(selfCited.id, "phase")?.question === "Confirm the phase statement an agent wrote", statementOf(selfCited.id, "phase"));

    const omitted = fresh("Omitted");
    const omittedVariant = (who: string) => writeHeld(omitted.dir, { draft: "_drafts/foundation__alignment.json.draft", file: "foundation/alignment.json", route: "foundation/alignment", agent: { id: who }, verdict: { then: "draft", rule: "r", source: "s", variants: true }, text: JSON.stringify({ venture: omitted.id, principles: [{ id: "p", statement: who, source: "bot", check: null }] }) });
    omittedVariant("one");
    omittedVariant("two");
    const omittedGate = fileIn(omitted.dir, "_drafts/foundation__alignment.json.draft.gate"), omittedMeta = JSON.parse(readFileSync(omittedGate, "utf8"));
    writeFileSync(omittedGate, JSON.stringify({ ...omittedMeta, variants: omittedMeta.variants.filter((v: { variant: string }) => v.variant !== "a") }));
    expect("a sidecar that omits a variant cannot hide it from the card", rowsOf(omitted.id).find((d) => d.id === "foundation-alignment")?.action?.held?.variants.map((v) => v.letter).join() === "a,b", rowsOf(omitted.id).find((d) => d.id === "foundation-alignment"));
    writeFileSync(omittedGate, JSON.stringify({ ...omittedMeta, variants: omittedMeta.variants.filter((v: { variant: string }) => v.variant !== "b") }));
    expect("and a new variant takes a free letter, not the omitted one's file", omittedVariant("three").variant === "c" && /two/.test(readFileSync(fileIn(omitted.dir, "_drafts/foundation__alignment.json.draft.b"), "utf8")));

    for (const damage of ["bad", "gone"]) {
      if (damage === "bad") writeFileSync(omittedGate, JSON.stringify({ ...omittedMeta, variants: "x" })); else rmSync(omittedGate);
      const before = readFileSync(fileIn(omitted.dir, "_drafts/foundation__alignment.json.draft.b"), "utf8");
      const next = omittedVariant(`after-${damage}`);
      expect(`a ${damage} sidecar cannot overwrite a variant`, next.variant !== "b" && readFileSync(fileIn(omitted.dir, "_drafts/foundation__alignment.json.draft.b"), "utf8") === before, next);
    }

    const worded = fresh("Worded");
    draftOn(worded.dir, "foundation__alignment.json.draft", { venture: worded.id, principles: [{ id: "a", statement: "x", source: "bot", check: null }] });
    expect("a statement's draft card promises no change it cannot offer", statementOf(worded.id, "alignment")?.question === "Accept the agent's draft of the alignment statement", statementOf(worded.id, "alignment"));

    const planted2 = fresh("Planted phase");
    mkdirSync(fileIn(planted2.dir, "foundation/exit-criteria"), { recursive: true });
    writeFileSync(fileIn(planted2.dir, "foundation/exit-criteria/x.json"), JSON.stringify({ phase: "../../people/people", criteria: [] }));
    expect("a planted phase is not a path to read", !phasesWithCriteria(planted2.dir).length);

    const visionDraft = telosAt("Vision draft", "person");
    migrate(visionDraft.dir);
    const goal = JSON.parse(readFileSync(fileIn(visionDraft.dir, "foundation/goals/telos.json"), "utf8"));
    draftOn(visionDraft.dir, "foundation__goals__telos.json.draft", { ...goal, end_state: "A new end" });
    const visionCard = statementOf(visionDraft.id, "vision");
    expect("the vision card accepts the goal draft, and it is the only card for it", visionCard?.action?.route === "foundation/goals/telos" && visionCard.action.held?.variants.length === 1 && !rowsOf(visionDraft.id).some((d) => d.id.startsWith("draft-foundation-goals")), rowsOf(visionDraft.id).map((d) => d.id));
    const cli = spawnSync(process.execPath, [naiveFile(naive, "packages/naive/src/interfaces/cli/mentura.mjs"), "accept", "foundation/goals/telos", "--venture", visionDraft.id, "--workspace", workspace], { encoding: "utf8", input: "" });
    expect("the CLI wants the typed name before an accept that changes the vision", cli.status === 1 && /vision/.test(cli.stdout) && /A new end/.test(cli.stdout) && existsSync(fileIn(visionDraft.dir, "_drafts/foundation__goals__telos.json.draft")), cli.stdout + cli.stderr);

    const nextPhase = telosAt("Next phase", "person");
    migrate(nextPhase.dir);
    draftOn(nextPhase.dir, "foundation__exit-criteria__validation.json.draft", { venture: nextPhase.id, phase: "validation", criteria: [{ id: "new", statement: "A new bar", serves: ["reorders"] }] });
    const nextCli = spawnSync(process.execPath, [naiveFile(naive, "packages/naive/src/interfaces/cli/mentura.mjs"), "accept", "foundation/exit-criteria/validation", "--venture", nextPhase.id, "--workspace", workspace], { encoding: "utf8", input: "" });
    expect("the CLI wants the typed name for criteria of a phase with none yet", nextCli.status === 1 && /A new bar/.test(nextCli.stdout), nextCli.stdout + nextCli.stderr);
    const icpCli = fresh("Icp cli");
    draftOn(icpCli.dir, "foundation__icp__bakers.json.draft", { venture: icpCli.id, id: "bakers", who: "Night bakers", primary: true });
    const icpSeen = spawnSync(process.execPath, [naiveFile(naive, "packages/naive/src/interfaces/cli/mentura.mjs"), "accept", "foundation/icp/bakers", "--venture", icpCli.id, "--workspace", workspace], { encoding: "utf8", input: "" });
    expect("the CLI shows a whole-record statement before asking for its name", /Night bakers/.test(icpSeen.stdout), icpSeen.stdout + icpSeen.stderr);

    const lastPhase = telosAt("Last phase", "person");
    migrate(lastPhase.dir);
    for (const f of readdirSync(fileIn(lastPhase.dir, "foundation/exit-criteria"))) rmSync(fileIn(lastPhase.dir, `foundation/exit-criteria/${f}`));
    const lastFile = join(lastPhase.dir, "venture.json");
    writeFileSync(lastFile, JSON.stringify({ ...JSON.parse(readFileSync(lastFile, "utf8")), phase: "platform" }));
    const lastCard = statementOf(lastPhase.id, "exit-criteria");
    expect("the last phase's card does not point to a phase page that cannot take criteria", !!lastCard && !lastCard.action?.on_phase, lastCard);

    const ranked = [1, 2, 3, 4].map((n) => ({ id: `d${n}`, action: { kind: "decide" } })), draftLast = { id: "held", action: { kind: "accept" } };
    const surfaced = shownDecisions([...ranked, draftLast], 2);
    expect("a waiting draft surfaces past the cut, and is not counted as more", surfaced.shown.map((d) => d.id).join() === "d1,d2,held" && surfaced.more === 2, surfaced);
    expect("with no draft the cut is as ranked", shownDecisions(ranked, 2).shown.length === 2 && shownDecisions(ranked, 2).more === 2);

    const several = fresh("Several");
    const products = fileIn(several.dir, "products");
    mkdirSync(products, { recursive: true });
    writeFileSync(join(products, "docks.json"), JSON.stringify({ id: "docks", name: "Docks", description: "d", market: [{ geography: "UK", primary: true }, { geography: "US" }] }));
    const marketsCard = () => rowsOf(several.id).find((d) => d.id === "foundation-markets")!;
    expect("a product with several markets gets no form that always refuses", marketsCard().action?.several === true && !marketsCard().action?.form && !settlesHere(marketsCard()), marketsCard());
    const marketSave = bridge({ op: "record", venture: several.id, id: "foundation-markets", values: { geography: "EU" } });
    expect("and a save says why, in plain words", /several markets/.test(marketSave.error ?? ""), marketSave);
    writeFileSync(join(products, "ferries.json"), JSON.stringify({ id: "ferries", name: "Ferries", description: "f" }));
    expect("a product with one market still gets its form", !!marketsCard().action?.form && !marketsCard().action?.several, marketsCard());

    expect("a pull request or an attribute held in one counts as a draft", landedAsDraft({ draft: true }) && landedAsDraft({ draft: false, attributes: [{ pull_request: "u" }] }) && !landedAsDraft({ draft: false, attributes: [{}] }) && !landedAsDraft({}));
    const raw = ["foundation/x.json changed while this was being checked, so nothing was written: try again", "x lives in github, which is read-only", "only a person writes foundation/core, in the venture's own folder; it holds part of venture.json", "pilot keeps its goals and exit criteria as canonical records, so a telos.json is not written: write foundation/goals/telos", "github: 502 at /repos/a/b"];
    expect("a router refusal names no file, route or flag", raw.every((e) => !/\.json|foundation\/|github|--/.test(plainWriteRefusal(null, e))), raw.map((e) => plainWriteRefusal(null, e)));
    expect("a decide refusal names no flag", !/--/.test(plainDecideRefusal("x is already decided as worded; give a new --answer to make version 2")) && !/\.json|--/.test(plainDecideRefusal("x.decision.json: bad")));

    }

    const blank = bridge({ op: "create", name: "Quay" });
    const quay = () => bridge({ op: "docket", venture: blank.result.id }).result as unknown as { functions: { decisions: { id: string; action: { kind: string; form?: unknown; confirm_first?: boolean } | null }[] }[] };
    const live = nextDecision(quay().functions);
    expect("the next decision has a way forward", !!live && settlesHere(live), live);
    const stuck = { id: "stuck", action: { kind: "write" } }, fine = { id: "fine", action: { kind: "decide" } };
    expect("a card with no form is passed over", nextDecision([{ decisions: [stuck, fine] }])?.id === "fine");
    expect("no card is next when none can be acted on", nextDecision([{ decisions: [stuck] }]) === undefined);

    const other = bridge({ op: "create", name: "Slip" });
    const legacy = join(workspace, other.result.folder, "k-base/foundation/problem.json");
    writeFileSync(legacy, JSON.stringify({ venture: other.result.id, evidence: [], stray: true }));
    const bad = bridge({ op: "record", venture: other.result.id, id: "foundation-problem", values: { statement: "A", segment: "B" } });
    expect("a schema refusal reads plainly", !bad.ok && /Nothing was saved/.test(bad.error ?? "") && !/schema|\.json|additional/i.test(bad.error ?? ""), bad);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log("bridge: all passing");
