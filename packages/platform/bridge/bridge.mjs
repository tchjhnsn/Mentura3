#!/usr/bin/env node
// @ts-check
// The console's only door into the Naive framework. The Next.js server runs this file in a child
// process with one operation as JSON and reads one JSON answer back, so the framework is never bundled
// into the app and the console calls the same modules the CLI and the MCP server call.
//
//   node lib/bridge.mjs '{"op":"docket","venture":"harbor"}'
//
// NAIVE_FRAMEWORK_DIR  the framework checkout (default: the installed naive-framework package)
// NAIVE_CONSOLE_WORKSPACE  the folder holding every account's workspace (default: console/.data/workspace)
// NAIVE_BRIDGE_KEY  verifies who is asking; lib/naive.ts sets it and no operation runs without it

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { openAssertion } from "./assertion.ts";
import { deleteStored, FILES_DIR, filesRoot, listFiles, makeFolder, moveStored, readStored, writeStored } from "./files.ts";
import { naiveFile } from "./naive-file.mjs";
import { closeClaim, openClaim, sharedRoot, stampedOwner } from "./claims.ts";
import { gateRefusal, phaseView, statable, wanted } from "./phase.ts";
import { CANONICAL_STATEMENTS, changesOf, cleaned, criteriaOf, filled, formOf, get, landedAsDraft, MAX_CHARS, merge, plainDecideRefusal, plainWriteRefusal, slug as itemSlug, STATEMENT_RECORD, STATEMENTS, throughArray } from "./record-forms.ts";

const framework = resolve(process.env.NAIVE_FRAMEWORK_DIR ?? dirname(fileURLToPath(import.meta.resolve("naive-framework/package.json"))));
const shared = sharedRoot();
/** @param {string} p */
const fw = (p) => import(naiveFile(framework, p));

const CHANGED = "This changed since you read it, so nothing was signed. Read it again, then try once more.";
const UNCONFIRMED = "Part of this record has not been confirmed by a person. Confirm that first, so saving here does not sign for what you have not read.";
/** @param {string} s */
const sha = (s) => createHash("sha256").update(s).digest("hex");

const HIDDEN = new Set(["node_modules", ".git", ".next", ".naive", ".vscode", ".DS_Store", ".env"]);
const ACTOR_ENV = ["MENTURA_ACTOR", "MENTURA_MODEL", "MENTURA_ACTOR_ID"];
const RECENT_MS = 10 * 60 * 1000;
const MAX_READ = 400_000;

/** One rule for what the console shows, used by the tree and by read alike: no dotfiles except
 *  .gitignore, nothing in HIDDEN, no .env variant, no .gitkeep.
 *  @param {string} name */
const hidden = (name) => HIDDEN.has(name) || name.startsWith(".env") || name === ".gitkeep" || (name.startsWith(".") && name !== ".gitignore");

/** One account, one workspace: every op resolves inside this folder and nothing outside it, so another
 *  account's venture, raw notes and logs do not exist as far as a request can tell. The folder is keyed
 *  by account because the owner stamps and signer_account on disk already hold the account id. The
 *  dot keeps it out of the framework's walks of the shared root.
 *  @param {string} userId */
function workspaceOf(userId) {
  if (!/^[A-Za-z0-9_-]+$/.test(userId)) throw new Error("The console refused this request: it carries no usable account.");
  const dir = join(shared, ".accounts", userId);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

/** Whether a venture may enter an account. A link inside it would point the account at anything on the
 *  disk, and a venture nested in it may belong to someone else, so neither moves.
 *  @param {string} dir @param {string} [at] @returns {boolean} */
function selfContained(dir, at = dir) {
  return readdirSync(at, { withFileTypes: true }).every((e) => {
    if (e.isSymbolicLink()) return false;
    if (at !== dir && e.name === "venture.json") return false;
    return !e.isDirectory() || selfContained(dir, join(at, e.name));
  });
}

/** Whether this venture would land on one the account already has, by folder or by id.
 *  @param {string} dir @param {string} workspace */
async function collides(dir, workspace) {
  const { ventureDir } = await fw("packages/naive/src/router/router.mjs");
  return ventureDir(JSON.parse(readFileSync(join(dir, "venture.json"), "utf8")).id, workspace) !== null || existsSync(join(workspace, basename(dir)));
}

/** Moves a venture from the shared root into an account's workspace. The rename is what makes a claim
 *  one-time: of two callers, the second finds nothing to move.
 *  @param {string} dir @param {string} workspace */
async function moveIn(dir, workspace) {
  const to = join(workspace, basename(dir));
  renameSync(dir, to);
  const { addVenture } = await fw("packages/naive/src/engine/workspace.mjs");
  addVenture(workspace, to);
}

/** @param {string} workspace */
async function listed(workspace) {
  const { ventures } = await fw("packages/naive/src/router/router.mjs");
  return ventures(workspace).filter((/** @type {any} */ v) => !v.broken).map((/** @type {any} */ { id, name, phase, dir }) => ({ id, name, phase, path: relative(workspace, dir) }));
}

/** @param {string} id @param {string} workspace @returns {Promise<string>} */
async function dirOf(id, workspace) {
  const { ventureDir } = await fw("packages/naive/src/router/router.mjs");
  // A slash would name a folder by path, and a venture is only ever named by its id here.
  const d = typeof id === "string" && !id.includes("/") ? ventureDir(id, workspace) : null;
  if (!d) throw new Error(`no venture ${id} in your workspace`);
  return d;
}

/** The venture's folders as a tree, newest changes marked so the founder sees what just landed.
 *  A file is new when it changed more than 5 s after create-venture wrote the venture (venture.json's
 *  own time) and less than 10 minutes ago. Links are left out: the tree shows only what is in the
 *  venture itself, and a dangling one cannot take the page down.
 *  @param {string} dir @param {string} [root] @param {number} [depth] @param {number} [born] @returns {any[]} */
function tree(dir, root = dir, depth = 0, born = ((s) => s.birthtimeMs || s.mtimeMs)(statSync(join(root, "venture.json")))) {
  const now = Date.now();
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => !hidden(e.name) && (e.isDirectory() || e.isFile()))
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
    .map((e) => {
      const p = join(dir, e.name), rel = relative(root, p);
      if (e.isDirectory()) {
        const children = depth < 6 ? tree(p, root, depth + 1, born) : [];
        return { name: e.name, path: rel, kind: "folder", children, recent: children.some((c) => c.recent) };
      }
      const { mtimeMs } = lstatSync(p);
      return { name: e.name, path: rel, kind: "file", recent: mtimeMs > born + 5000 && now - mtimeMs < RECENT_MS };
    });
}

/** A regular file inside the venture that the tree would show. The real paths are compared, so a
 *  link out of the venture is refused, and only a plain file is read (never a device or a FIFO).
 *  @param {string} base @param {string} rel */
function inside(base, rel) {
  const p = resolve(base, rel);
  if (p !== base && !p.startsWith(base + sep)) throw new Error("that path is outside the venture");
  if (relative(base, p).split(sep).some(hidden)) throw new Error("that file is not shown in the console");
  if (!existsSync(p)) throw new Error("that file is not in the venture");
  const real = realpathSync(p), realBase = realpathSync(base);
  if (!real.startsWith(realBase + sep)) throw new Error("that path is outside the venture");
  if (relative(realBase, real).split(sep).some(hidden)) throw new Error("that file is not shown in the console");
  if (!statSync(real).isFile()) throw new Error("that is not a file");
  return real;
}

/** A record's file through the same guard. Records sit under the layout's folders, so the name is resolved first.
 *  @param {string} dir @param {string} file */
async function recordFile(dir, file) {
  const { ventureFile } = await fw("packages/naive/src/core/venture-paths.mjs");
  return inside(dir, relative(dir, ventureFile(dir, file)));
}

/** The check approve makes, for the ops that write as the signed-in person: no declared agent, no role,
 *  and someone the venture's own roster names.
 *  @param {string} dir @param {any} actor @param {string} by */
async function refuseNonPerson(dir, actor, by) {
  for (const k of ACTOR_ENV) if (actor?.[k]) process.env[k] = String(actor[k]);
  const { refusedPerson } = await fw("packages/naive/src/engine/decisions.mjs");
  if (refusedPerson(dir, by)) throw new Error("Only a person named in this venture writes its records, and this request is not one.");
}

/** A person's write of a file signs all of it, so nothing is saved over a draft a person has not read.
 *  @param {string} route @param {string} venture @param {string} workspace */
async function refuseWaitingDraft(route, venture, workspace) {
  const { draftOf } = await fw("packages/naive/src/router/router.mjs");
  const { ventureFile } = await fw("packages/naive/src/core/venture-paths.mjs");
  const d = draftOf(route, venture, workspace);
  if (d && existsSync(ventureFile(d.dir, d.draft))) throw new Error("A draft of this record is waiting for a person, so nothing was saved.");
}

/** The canonical exit criteria file while an agent's last write stands unconfirmed. The foundation report
 *  tracks only the telos, so the log answers for this file directly.
 *  @param {string} dir @param {{ source: string | null, file: string | null }} l @returns {Promise<string | null>} */
async function unconfirmedCriteria(dir, l) {
  if (l.source === "telos" || !l.file) return null;
  const { confirmedIn, unsignedWrite } = await fw("packages/naive/src/engine/foundation.mjs");
  return unsignedWrite(dir, l.file) && !confirmedIn(dir, l.file, "exit-criteria") ? l.file : null;
}

/** Whether the criteria the lifecycle reads stand unconfirmed, whichever record holds them.
 *  @param {string} dir @param {any} l */
async function criteriaAwaitConfirm(dir, l) {
  if (l.source !== "telos") return !!(await unconfirmedCriteria(dir, l));
  const { foundation } = await fw("packages/naive/src/engine/foundation.mjs");
  return foundation(dir).flatMap((/** @type {any} */ q) => q.statements).some((/** @type {any} */ x) => x.record === "telos" && x.unsigned_write && !x.confirmed);
}

/** Replaces the current phase's exit criteria in the record the lifecycle reads them from. A canonical file
 *  written for an unmigrated venture would hide its telos, so the source decides the route.
 *  @param {string} dir @param {string} venture @param {{ identity: import("./assertion.ts").Identity, workspace: string }} account @param {string} note
 *  @param {(list: any[], measures: any[]) => any[]} change */
async function saveCriteria(dir, venture, { identity, workspace }, note, change) {
  const { goals } = await fw("packages/naive/src/engine/canonical.mjs");
  const { foundation } = await fw("packages/naive/src/engine/foundation.mjs");
  const { lifecycle } = await fw("packages/naive/src/engine/lifecycle.mjs");
  const { call } = await fw("packages/naive/src/router/router.mjs");
  const l = lifecycle(dir);
  const { phase, source, venture: id } = l;
  const telos = source === "telos";
  const route = telos ? STATEMENTS["exit-criteria"].route : `foundation/exit-criteria/${phase}`;
  await refuseWaitingDraft(route, venture, workspace);
  const { current } = await targetOf({ route }, venture, workspace);
  if (telos && !current.measures?.length) throw new Error("Each exit criterion serves a measure of your vision, and your vision names none yet, so nothing was saved. Add a measure to it first.");
  if (telos ? unconfirmed(foundation(dir).flatMap((/** @type {any} */ q) => q.statements), STATEMENTS["exit-criteria"], current) : await unconfirmedCriteria(dir, l)) throw new Error(UNCONFIRMED);
  const measures = telos ? current.measures : goals(dir).find((/** @type {any} */ g) => g.kind === "venture")?.measures ?? [];
  const stated = telos ? current.phases?.find((/** @type {any} */ p) => p.phase === phase)?.exit_criteria ?? [] : current.criteria ?? [];
  const list = change(stated, measures);
  const others = (current.phases ?? []).filter((/** @type {any} */ p) => p.phase !== phase);
  const input = telos ? { ...current, phases: [...others, { phase, exit_criteria: list }] } : { ...current, phase, venture: id, criteria: list };
  const r = await call({ venture, route, action: "write", input, actor: "person", workspace, via: "console", provenance: { agent: { id: identity.name, account: identity.userId }, note } });
  if (!r.ok) throw new Error(plainWriteRefusal(null, r.error));
  return landedAsDraft(r.result);
}

/** The checks a lifecycle write makes on top of the person check: the account the venture is stamped with.
 *  @param {string} dir @param {any} actor @param {import("./assertion.ts").Identity} identity */
async function refuseNonOwner(dir, actor, identity) {
  await refuseNonPerson(dir, actor, identity.name);
  const owner = stampedOwner(dir);
  if (owner && owner !== identity.userId) throw new Error("Only the account that owns this venture can do this.");
}

/** Whether the signer is someone who may sign for the venture's gate. A venture that names no one has only
 *  the account holding it, which refuseNonOwner checks first.
 *  @param {string} dir @param {any} actor @param {import("./assertion.ts").Identity} identity @param {string} refusal */
async function refuseNonSigner(dir, actor, identity, refusal) {
  await refuseNonOwner(dir, actor, identity);
  const { signers } = await fw("packages/naive/src/engine/decisions.mjs");
  const founders = signers(dir);
  if (founders.size && !founders.has(identity.name)) throw new Error(refusal);
}

/** A thrown framework error quotes paths and validator output, so it comes back as a refusal for the plain wording.
 *  @param {() => any} write */
function attempt(write) {
  try { return write(); } catch { return { ok: false, error: "failed" }; }
}

/** The open decision a docket shows, by id, or null once it is settled or held. @param {string} dir @param {string} id */
async function openDecision(dir, id) {
  const { docket } = await fw("packages/naive/src/engine/docket.mjs");
  return docket(dir).functions.flatMap((/** @type {any} */ f) => f.decisions).find((/** @type {any} */ d) => d.id === id) ?? null;
}

/** The record a statement lands on: its route once known, what it holds now, and its neighbours' ids.
 *  @param {any} s @param {string} venture @param {string} workspace */
async function targetOf(s, venture, workspace) {
  const { call } = await fw("packages/naive/src/router/router.mjs");
  const read = async (/** @type {string} */ route) => {
    const r = await call({ venture, route, action: "read", actor: "person", workspace, via: "console" });
    if (!r.ok) throw new Error("This record cannot be read here, so it cannot be changed here.");
    return r.result;
  };
  /** @type {string[]} */
  const none = [];
  const dir = await dirOf(venture, workspace);
  const { ventureFile } = await fw("packages/naive/src/core/venture-paths.mjs");
  if (!s.item) {
    const { draftOf } = await fw("packages/naive/src/router/router.mjs");
    const current = await read(s.route);
    // A record the router will not show this reader would otherwise look empty, and saving would replace it.
    if (!current && existsSync(ventureFile(dir, draftOf(s.route, venture, workspace)?.file ?? "-"))) throw new Error("This record cannot be read here, so it cannot be changed here.");
    return { route: s.route, current: current ?? {}, taken: none };
  }
  // The foundation check's own listing: a list read would walk the whole venture, and one dangling link would fail it.
  const { filesOf } = await fw("packages/naive/src/engine/foundation.mjs");
  const items = filesOf(dir, s.item.record).filter((/** @type {string} */ f) => /^[a-z0-9][a-z0-9-]*\.json$/.test(basename(f)) && existsSync(ventureFile(dir, f)))
    .map((/** @type {string} */ f) => [basename(f, ".json"), JSON.parse(readFileSync(ventureFile(dir, f), "utf8"))]);
  const unanswered = s.item.reuse ? items.filter((/** @type {any[]} */ [, r]) => r.status !== "retired" && !filled(get(r, s.item.reuse))) : [];
  const hit = unanswered.find((/** @type {any[]} */ [, r]) => !throughArray(r, s.item.reuse));
  return hit ? { route: `${s.route}/${hit[0]}`, current: hit[1], taken: none } : { route: null, current: {}, taken: items.map((/** @type {any[]} */ [id]) => id), several: unanswered.length > 0 };
}

/** The form table's entry for a statement, as this venture stores it.
 *  @param {string} dir @param {string} id */
async function statementOf(dir, id) {
  const { migrated } = await fw("packages/naive/src/engine/canonical.mjs");
  if (Object.hasOwn(CANONICAL_STATEMENTS, id) && migrated(dir)) return CANONICAL_STATEMENTS[id];
  return Object.hasOwn(STATEMENTS, id) ? STATEMENTS[id] : null;
}

/** The draft waiting on a route, each variant with what it would change, or null when this door cannot accept it.
 *  @param {string | null | undefined} route @param {string} venture @param {string} workspace */
async function heldDraft(route, venture, workspace) {
  const { draftOf, routes } = await fw("packages/naive/src/router/router.mjs");
  const { sidecar } = await fw("packages/naive/src/engine/gate-drafts.mjs");
  const { ventureFile } = await fw("packages/naive/src/core/venture-paths.mjs");
  const d = route ? draftOf(route, venture, workspace) : null;
  if (!d || !existsSync(ventureFile(d.dir, d.draft)) || routes().find((/** @type {any} */ r) => r.route === d.route)?.view_of) return null;
  const now = existsSync(ventureFile(d.dir, d.file)) ? readFileSync(await recordFile(d.dir, d.file), "utf8") : "{}";
  const listed = sidecar(d.dir, d.draft)?.variants;
  const held = listed?.length ? listed : [{ variant: "a", file: d.draft }];
  const variants = await Promise.all(held.map(async (/** @type {any} */ v) => {
    const text = readFileSync(await recordFile(d.dir, v.file), "utf8");
    return { letter: v.variant, file: v.file, by: v.by ?? null, text, seen: sha(now + text), changes: changesOf(JSON.parse(now), JSON.parse(text)) };
  }));
  return { route: d.route, draft: d.draft, variants };
}

/** Whether saving onto this record would also sign for a statement an agent wrote there: the log counts a
 *  person's write of a file as confirming all of it.
 *  @param {any[]} said @param {any} s @param {any} current */
const unconfirmed = (said, s, current) => Object.keys(current).length > 0 && said.some((x) => x.status === "agent" && x.record === STATEMENT_RECORD[s.schema]);

/** A field's help and choices, from the schema and vocabulary that already define them. `readSchema` is the
 *  framework's record types resolver (packages/records/index.mjs), so the schema is read wherever it sits.
 *  @param {(name: string) => any} readSchema @param {string} schema @param {any} f */
function described(readSchema, schema, f) {
  const part = /** @type {any} */ (f.schema ? get(readSchema(schema), f.schema) : null);
  const vocab = f.vocabulary ? JSON.parse(readFileSync(naiveFile(framework, "packages/naive/src/records/vocab/business-models.json"), "utf8")) : null;
  const options = vocab ? [...vocab.patterns, ...vocab.extras].map((/** @type {any} */ p) => ({ value: p.id, label: p.name }))
    : part?.enum?.map((/** @type {string} */ value) => ({ value, label: value.replaceAll("-", " ") }));
  return { ...(part?.description && !f.quiet ? { help: part.description } : {}), ...(options ? { options } : {}) };
}

/** @param {string} s */
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "venture";

/** @type {Record<string, (input: any, account: { identity: import("./assertion.ts").Identity, workspace: string }) => Promise<any>>} */
/** The venture's files folder, where its layout puts the logical path `files`.
 *  @param {string} dir */
async function rootOf(dir) {
  const { ventureFile } = await fw("packages/naive/src/core/venture-paths.mjs");
  return filesRoot(dir, ventureFile(dir, FILES_DIR));
}

/** One provenance line for a change to the venture's files, signed as the person who made it. A moved folder logs the
 *  folder; an upload stores its bytes in the blob store, so time travel can bring a deleted file back.
 *  @param {string} dir @param {any} identity @param {string} entity @param {string} activity @param {string} [note] @param {string} [sha256] */
async function logFile(dir, identity, entity, activity, note, sha256) {
  const { agentFromEnv, record } = await fw("packages/naive/src/core/provenance.mjs");
  const agent = agentFromEnv("person", "console", { id: identity.name, account: identity.userId });
  const { ventureFile } = await fw("packages/naive/src/core/venture-paths.mjs");
  const p = ventureFile(dir, entity);
  const isFolder = existsSync(p) && statSync(p).isDirectory();
  record(dir, { entity, route: FILES_DIR, activity, agent, note, ...(sha256 ? { sha256 } : isFolder ? { content: Buffer.from(entity) } : {}) });
}

const ops = {
  // Each venture's own storage (files.ts): the founder's files, logged in provenance as the person's acts.
  async files({ venture }, { workspace }) {
    return { files: listFiles(await rootOf(await dirOf(venture, workspace))) };
  },

  async fileRead({ venture, path }, { workspace }) {
    return readStored(await rootOf(await dirOf(venture, workspace)), path);
  },

  async fileWrite({ venture, path, base64, replace }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    const out = writeStored(await rootOf(dir), path, base64, replace === true);
    await logFile(dir, identity, `${FILES_DIR}/${out.path}`, replace === true ? "replace" : "upload");
    return out;
  },

  async fileFolder({ venture, path }, { workspace }) {
    return makeFolder(await rootOf(await dirOf(venture, workspace)), path);
  },

  async fileMove({ venture, from, to }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    const out = moveStored(await rootOf(dir), from, to);
    await logFile(dir, identity, `${FILES_DIR}/${to}`, "move", `moved from ${FILES_DIR}/${from}`);
    return out;
  },

  async fileDelete({ venture, path }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    const out = deleteStored(await rootOf(dir), path);
    for (const f of out.removed) await logFile(dir, identity, `${FILES_DIR}/${f.path}`, "delete", undefined, f.sha256);
    return out;
  },

  // Ventures made before isolation recorded their account in a stamp, and come home here. lib/naive.ts runs
  // this once per account, in the write queue. One that cannot move safely stays put and is reported.
  async adopt(_, { identity, workspace }) {
    const { ventures } = await fw("packages/naive/src/router/router.mjs");
    const skipped = [];
    for (const { id, dir, broken } of ventures(shared)) {
      if (stampedOwner(dir) !== identity.userId) continue;
      if (!broken && selfContained(dir) && !(await collides(dir, workspace))) await moveIn(dir, workspace);
      else skipped.push(id);
    }
    return { skipped };
  },

  async ventures(_, { workspace }) {
    return { ventures: await listed(workspace) };
  },

  async venture({ venture }, { workspace }) {
    const dir = await dirOf(venture, workspace);
    const v = JSON.parse(readFileSync(join(dir, "venture.json"), "utf8"));
    const { founderName, signers } = await fw("packages/naive/src/engine/decisions.mjs");
    let founder = null;
    try { if (signers(dir).size) founder = founderName(dir); } catch { /* a delegation file that does not parse */ }
    // departments: the functions this venture has turned on (venture.schema.json), which the console's sidebar lists.
    return { id: v.id, name: v.name, phase: v.phase, founder, departments: Array.isArray(v.departments) ? v.departments : [], tree: tree(dir) };
  },

  async read({ venture, path }, { workspace }) {
    const dir = await dirOf(venture, workspace);
    const p = inside(dir, path);
    const size = statSync(p).size;
    if (size > MAX_READ) return { path, size, text: null, note: "too large to show here" };
    return { path, size, text: readFileSync(p, "utf8") };
  },

  async docket({ venture }, { workspace }) {
    const { docket } = await fw("packages/naive/src/engine/docket.mjs");
    const { foundation } = await fw("packages/naive/src/engine/foundation.mjs");
    const { lifecycle } = await fw("packages/naive/src/engine/lifecycle.mjs");
    const dir = await dirOf(venture, workspace);
    const k = docket(dir);
    const said = foundation(dir).flatMap((/** @type {any} */ q) => q.statements);
    const { readSchema } = await fw("packages/naive/src/records/index.mjs");
    for (const d of k.functions.flatMap((/** @type {any} */ f) => f.decisions)) {
      const id = d.id.replace(/^foundation-/, ""), s = await statementOf(dir, id);
      if (d.action?.kind === "write" && id === "exit-criteria" && !s) d.action.on_phase = statable(lifecycle(dir));
      if (d.action?.kind === "write" && s) {
        // One record that cannot be read costs that card its form, never the page.
        const target = await targetOf(s, venture, workspace).catch(() => null);
        const form = target && formOf(s, target.current, (f) => described(readSchema, s.schema, f));
        if (target?.several) d.action.several = true;
        else if (form?.fields.length) d.action.form = form;
        if (target && unconfirmed(said, s, target.current)) d.action.confirm_first = true;
      }
      if (d.action?.kind === "confirm") {
        d.action.value = said.find((/** @type {any} */ x) => x.id === id)?.value ?? null;
        d.action.seen = sha(JSON.stringify(d.action.value));
      }
      if (d.action?.kind === "accept") {
        const held = await heldDraft(d.action.route, venture, workspace).catch(() => null);
        if (held) d.action.held = { route: held.route, variants: held.variants.map((/** @type {any} */ { letter, by, seen, changes }) => ({ letter, by, seen, changes })) };
      }
    }
    return k;
  },

  // A person writes the record a foundation statement asks for. The request names the decision, never a
  // route, and carries only values: the table in record-forms.ts decides where they land, the router checks
  // the schema, and the log names the signed-in account, which marks the writer as verified.
  async record({ venture, id, values, actor }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    await refuseNonPerson(dir, actor, identity.name);
    const s = await statementOf(dir, String(id).replace(/^foundation-/, ""));
    if (!s || (await openDecision(dir, id))?.action?.kind !== "write") throw new Error("This is already settled, or cannot be written here. Refresh the page.");
    const { route, current, taken, several } = await targetOf(s, venture, workspace);
    const { foundation } = await fw("packages/naive/src/engine/foundation.mjs");
    if (unconfirmed(foundation(dir).flatMap((/** @type {any} */ q) => q.statements), s, current)) throw new Error(UNCONFIRMED);
    if (several) throw new Error("This product lists several markets, which this form cannot change, so nothing was saved.");
    const given = cleaned(s, current, values);
    const { resolve: routeOf } = await fw("packages/naive/src/router/router.mjs");
    let item = current.id ?? null;
    if (s.item && !route) {
      const root = itemSlug(String(given[s.item.idFrom])) || "item";
      item = root;
      // A name can match a fixed route (product/lint), which is not an item.
      for (let n = 2; taken.includes(item) || routeOf(`${s.route}/${item}`).r?.collection !== "item"; n++) item = `${root}-${n}`;
    }
    const v = JSON.parse(readFileSync(join(dir, "venture.json"), "utf8"));
    const patch = s.patch(given, { venture: v.id, phase: v.phase, by: identity.name, today: new Date().toISOString().slice(0, 10), id: item, current });
    const record = s.partial ? patch : merge(current, patch);
    const { call } = await fw("packages/naive/src/router/router.mjs");
    const target = route ?? `${s.route}/${item}`;
    await refuseWaitingDraft(target, venture, workspace);
    const r = await call({ venture, route: target, action: "write", input: record, actor: "person", workspace, via: "console",
      provenance: { agent: { id: identity.name, account: identity.userId } } });
    if (!r.ok) throw new Error(plainWriteRefusal(s, r.error));
    return { written: r.result.written, draft: landedAsDraft(r.result), signer: "verified" };
  },

  // A person accepts an agent's draft: mentura accept, from a door that checked a sign-in. It is tied to what
  // the page showed, and the router checks the draft again as it moves it into place.
  async accept({ venture, id, pick, seen, actor }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    await refuseNonPerson(dir, actor, identity.name);
    const action = (await openDecision(dir, id))?.action;
    if (action?.kind !== "accept") throw new Error("This is already settled, or cannot be accepted here. Refresh the page.");
    const held = await heldDraft(action.route, venture, workspace).catch(() => null);
    if (!held) throw new Error("Naive cannot accept this draft on this card.");
    const variant = held.variants.find((/** @type {any} */ v) => v.letter === (pick ?? "a"));
    if (!variant || variant.seen !== seen) throw new Error(CHANGED);
    const { call } = await fw("packages/naive/src/router/router.mjs");
    const { settle } = await fw("packages/naive/src/engine/gate-drafts.mjs");
    const r = await call({ venture, route: held.route, action: "write", input: JSON.parse(variant.text), actor: "person", workspace, via: "console",
      provenance: { activity: "accept", derived_from: [variant.file], agent: { id: identity.name, account: identity.userId } } });
    if (!r.ok) throw new Error(plainWriteRefusal(null, r.error));
    const draft = landedAsDraft(r.result);
    const settled = draft ? null : settle(dir, held.draft, { picked: variant.letter, by: identity.name, account: identity.userId, via: "console" });
    if (settled?.decision && !settled.decided) throw new Error("The draft was accepted, but the decision about which draft to take is still open. Settle it on its card.");
    return { accepted: held.route, draft, signer: "verified" };
  },

  // A person takes a statement an agent or a tool wrote as their own, unchanged: mentura confirm, from a door that checked a sign-in.
  async confirm({ venture, id, seen, actor }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    await refuseNonPerson(dir, actor, identity.name);
    if ((await openDecision(dir, id))?.action?.kind !== "confirm") throw new Error("This is already settled, or cannot be confirmed here. Refresh the page.");
    const statement = String(id).replace(/^foundation-/, "");
    const { FRAME, foundation, statementFiles } = await fw("packages/naive/src/engine/foundation.mjs");
    const value = foundation(dir).flatMap((/** @type {any} */ q) => q.statements).find((/** @type {any} */ x) => x.id === statement)?.value ?? null;
    if (sha(JSON.stringify(value)) !== seen) throw new Error(CHANGED);
    const { agentFromEnv, record } = await fw("packages/naive/src/core/provenance.mjs");
    const { routes } = await fw("packages/naive/src/router/router.mjs");
    const { ventureFile } = await fw("packages/naive/src/core/venture-paths.mjs");
    const s = FRAME.questions.flatMap((/** @type {any} */ q) => q.statements).find((/** @type {any} */ x) => x.id === statement);
    const type = s.record;
    const route = routes().find((/** @type {any} */ x) => x.record === type && x.collection !== "list")?.route ?? type;
    const agent = agentFromEnv("person", "console", { id: identity.name, account: identity.userId });
    for (const f of statementFiles(dir, s).files.filter((/** @type {string} */ x) => existsSync(ventureFile(dir, x)))) record(dir, { entity: f, route, activity: "confirm", statement, agent });
    return { confirmed: statement, signer: "verified" };
  },

  // A person settles a decision; the docket re-ranks on the next read. The signed identity decides who
  // signs, so no caller chooses it. A caller that reports itself as an agent arrives in actor, and approve() refuses it as it does on the CLI.
  async decide({ venture, id, answer, actor }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    for (const k of ACTOR_ENV) if (actor?.[k]) process.env[k] = String(actor[k]);
    const { approve } = await fw("packages/naive/src/engine/decisions.mjs");
    const r = approve(dir, id, { by: identity.name, account: identity.userId, answer: answer || undefined, via: "console" });
    if (!r.ok) throw new Error(plainDecideRefusal(r.error));
    return r.result;
  },

  // Where the venture is in the lifecycle and what its gate still asks for.
  async phase({ venture }, { workspace }) {
    const { lifecycle, playbooks } = await fw("packages/naive/src/engine/lifecycle.mjs");
    const dir = await dirOf(venture, workspace);
    const l = lifecycle(dir);
    const file = await unconfirmedCriteria(dir, l);
    return phaseView(l, {
      playbooks: playbooks().map((/** @type {any} */ { id, title, description }) => ({ id, title, description })),
      chosen: JSON.parse(readFileSync(join(dir, "venture.json"), "utf8")).lifecycle_playbook ?? null,
      unconfirmed: file ? sha(readFileSync(await recordFile(dir, file), "utf8")) : null,
    });
  },

  // A person takes the canonical exit criteria an agent wrote as their own, unchanged.
  async confirmCriteria({ venture, seen, actor }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    await refuseNonOwner(dir, actor, identity);
    const { lifecycle } = await fw("packages/naive/src/engine/lifecycle.mjs");
    const l = lifecycle(dir);
    const file = await unconfirmedCriteria(dir, l);
    if (!file) throw new Error("This is already settled. Refresh the page.");
    if (sha(readFileSync(await recordFile(dir, file), "utf8")) !== seen) throw new Error(CHANGED);
    const { agentFromEnv, record } = await fw("packages/naive/src/core/provenance.mjs");
    record(dir, { entity: file, route: `foundation/exit-criteria/${l.phase}`, activity: "confirm", statement: "exit-criteria", agent: agentFromEnv("person", "console", { id: identity.name, account: identity.userId }) });
    return { confirmed: file, signer: "verified" };
  },

  // A founder chooses the lifecycle playbook, the venture's lifecycle_playbook through foundation/core. The
  // playbook decides what clears each gate, so this takes the same signer as the move itself.
  async playbook({ venture, id, from, actor }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    await refuseNonSigner(dir, actor, identity, "The playbook decides what clears the gate, so only a founder can choose it.");
    const { playbookOf } = await fw("packages/naive/src/engine/lifecycle.mjs");
    if (typeof id !== "string" || !playbookOf(id)) throw new Error("Naive has no such playbook. Refresh the page.");
    if ((JSON.parse(readFileSync(join(dir, "venture.json"), "utf8")).lifecycle_playbook ?? null) !== (from ?? null)) throw new Error(CHANGED);
    const { call } = await fw("packages/naive/src/router/router.mjs");
    const r = await call({ venture, route: "foundation/core", action: "write", input: { lifecycle_playbook: id }, actor: "person", workspace, via: "console",
      provenance: { agent: { id: identity.name, account: identity.userId }, note: `lifecycle playbook chosen: ${id}` } });
    if (!r.ok) throw new Error(plainWriteRefusal(null, r.error));
    return { chosen: id, signer: "verified" };
  },

  // A person marks an exit criterion of the current phase met, with the evidence for it.
  async meet({ venture, id, evidence, actor }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    await refuseNonOwner(dir, actor, identity);
    const said = typeof evidence === "string" ? evidence.trim() : "";
    if (!said) throw new Error("Say what shows this is true, so the record carries its evidence.");
    const { lifecycle, meet } = await fw("packages/naive/src/engine/lifecycle.mjs");
    const l = lifecycle(dir);
    const criterion = l.exit_criteria.find((/** @type {any} */ c) => c.id === id);
    if (!criterion || criterion.met) throw new Error("This is already settled, or is no longer asked for. Refresh the page.");
    await refuseWaitingDraft(l.source === "telos" ? STATEMENTS["exit-criteria"].route : `foundation/exit-criteria/${l.phase}`, venture, workspace);
    if (await criteriaAwaitConfirm(dir, l)) throw new Error(UNCONFIRMED);
    const { agentFromEnv } = await fw("packages/naive/src/core/provenance.mjs");
    const r = attempt(() => meet(dir, id, { evidence: said, by: agentFromEnv("person", "console", { id: identity.name, account: identity.userId }) }));
    if (!r.ok) throw new Error("Naive could not save this, so nothing changed. Try again, and if it happens twice, open the record from the file tree.");
    return { met: id, signer: "verified" };
  },

  // A person states what must be true to leave the current phase, once, while none are stated.
  async criteria({ venture, phase, statements, actor }, account) {
    const dir = await dirOf(venture, account.workspace);
    await refuseNonOwner(dir, actor, account.identity);
    const { lifecycle } = await fw("packages/naive/src/engine/lifecycle.mjs");
    const l = lifecycle(dir);
    if (l.current?.name !== phase || !statable(l)) throw new Error("This is already settled, or cannot be written here. Refresh the page.");
    const text = typeof statements === "string" ? statements : "";
    if (text.length > MAX_CHARS) throw new Error("This is too long. Shorten it, then try again.");
    const said = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!said.length) throw new Error("Say what must be true to leave this phase.");
    const draft = await saveCriteria(dir, venture, account, `exit criteria stated for ${l.phase}`, (_, measures) => {
      const serves = (measures.find((/** @type {any} */ m) => m.primary) ?? measures[0])?.id;
      return criteriaOf(said, serves ? [serves] : []);
    });
    return { stated: said.length, draft, signer: "verified" };
  },

  // A person adds evidence to a criterion already met. The criterion's own evidence field holds it, because
  // meet() would replace who met it and when; the gate reads both.
  async evidence({ venture, id, evidence, actor }, account) {
    const dir = await dirOf(venture, account.workspace);
    await refuseNonOwner(dir, actor, account.identity);
    const said = typeof evidence === "string" ? evidence.trim() : "";
    if (!said) throw new Error("Say what shows this is true, so the record carries its evidence.");
    if (said.length > MAX_CHARS) throw new Error("This is too long. Shorten it, then try again.");
    const { lifecycle } = await fw("packages/naive/src/engine/lifecycle.mjs");
    if (!lifecycle(dir).exit_criteria.find((/** @type {any} */ c) => c.id === id)?.met) throw new Error("This is no longer asked for. Refresh the page.");
    const draft = await saveCriteria(dir, venture, account, `evidence added to exit criterion ${id}`, (list) => list.map((c) => (c.id === id ? { ...c, evidence: [c.evidence, said].filter(Boolean).join("; ") } : c)));
    return { added: id, draft, wanted: wanted(lifecycle(dir)), signer: "verified" };
  },

  // The founder moves the venture to the next phase, through the framework's gate. No reason or override is
  // passed on, so from this door the gate cannot be overridden, a phase skipped or a step taken back.
  async advance({ venture, to, actor }, { identity, workspace }) {
    const dir = await dirOf(venture, workspace);
    await refuseNonSigner(dir, actor, identity, "A phase change is the founder's decision, and only the founder can sign it.");
    const { advance, lifecycle } = await fw("packages/naive/src/engine/lifecycle.mjs");
    if (await criteriaAwaitConfirm(dir, lifecycle(dir))) throw new Error(UNCONFIRMED);
    const { agentFromEnv } = await fw("packages/naive/src/core/provenance.mjs");
    const r = attempt(() => advance(dir, to, { by: agentFromEnv("person", "console", { id: identity.name, account: identity.userId }) }));
    if (r.ok) return { from: r.result.from, to: r.result.to, recheck: r.result.stale.length, signer: "verified" };
    if (r.result) throw new Error(gateRefusal(r.result));
    throw new Error(/schema|^failed$/.test(r.error) ? "Naive could not change the phase. Check that it did not move, then try again." : "This venture cannot move there from where it is now. Refresh the page.");
  },

  // create-venture, run the way a founder runs it, into the console's workspace.
  async create({ name, description }, { identity, workspace }) {
    const founder = identity.name;
    // create-venture reads flags from anywhere in argv, so no founder's text may look like one.
    for (const [what, v] of [["name", name], ["your name", founder]]) if (v && /^\s*-/.test(v)) throw new Error(`The ${what} cannot start with "-".`);
    // Without its own workspace file, create-venture would walk up and register in the shared root's.
    const { ensureWorkspace } = await fw("packages/naive/src/engine/workspace.mjs");
    ensureWorkspace(workspace);
    let folder = slug(name), n = 2;
    while (existsSync(join(workspace, folder))) folder = `${slug(name)}-${n++}`;
    const args = [naiveFile(framework, "packages/create-venture/index.mjs"), folder, "--yes", "--skip-install", "--no-git",
      "--framework", `file:${framework}`, "--venture-name", name, "--reset-preferences", "--door", "console", "--account", identity.userId, "--name", founder];
    // The founder's words go in a private folder of their own, removed when create-venture is done.
    const tmp = description ? mkdtempSync(join(tmpdir(), "naive-console-")) : null;
    try {
      if (tmp) {
        const f = join(tmp, "idea.md");
        writeFileSync(f, `${description}\n`, { mode: 0o600, flag: "wx" });
        args.push("--dump", f);
      }
      // HOME and XDG_CONFIG_HOME both point into the console's workspace, so the console's preferences
      // never replace the founder's own (~/.config/naive/create-venture.json).
      const home = join(workspace, ".home");
      const r = spawnSync(process.execPath, args, { cwd: workspace, encoding: "utf8", env: { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, ".config") } });
      if (r.status !== 0) throw new Error("Naive could not create this venture, so nothing was made. Try again, and if it happens twice, try another name.");
      const v = JSON.parse(readFileSync(join(workspace, folder, "venture.json"), "utf8"));
      return { id: v.id, folder, log: r.stdout.trim().split("\n").slice(0, 3).join("\n") };
    } finally {
      if (tmp) rmSync(tmp, { recursive: true, force: true });
    }
  },

  // The prompt: words that fit a frame in the decision library propose that frame's decisions; any
  // other words are captured as a draft in the venture's raw inbox for the founder to route. A frame
  // that fits and fails (no judge set, a judge error) is an error the founder sees, not a note.
  async prompt({ venture, text }, { workspace }) {
    const dir = await dirOf(venture, workspace);
    const frames = await fw("packages/naive/src/engine/frames.mjs");
    const hits = frames.match(text);
    if (hits.length) {
      const top = hits[0];
      const r = await frames.run(dir, { id: top.id, text, harness: "console", via: "console" });
      if (!r.ok) throw new Error(/no judge/.test(r.error)
        ? `That fits the frame "${top.title}", but no judge is set up, so nothing was saved. Set TYPESAFE_API_KEY (see console/README.md), restart the console and send it again.`
        : `That fits the frame "${top.title}", but Naive could not run it, so nothing was saved. Try again.`);
      return { kind: "frame", frame: top.id, title: top.title, proposed: r.result.proposed, skipped: r.result.skipped, reframe: r.result.reframe };
    }
    const { loadWorkspace, capture, assign } = await fw("packages/naive/src/engine/workspace.mjs");
    const ws = loadWorkspace(workspace);
    const r = capture(ws, text);
    // The founder typed it inside this venture, so a chunk the workspace could not place is assigned
    // here: the same choice `naive inbox assign` records, kept as a routing example. A chunk the
    // workspace placed in another venture stays there, and says which.
    const chunks = r.chunks.map((/** @type {any} */ c) => ({ to: c.to.startsWith("inbox/") ? assign(ws, c.id, venture) : c.to, confidence: c.confidence }));
    return { kind: "capture", raw: r.raw, chunks: chunks.map((/** @type {any} */ c) => { const [v, ...p] = c.to.split(":"); return { ...c, venture: v, path: p.join(":") }; }) };
  },

  // The rule: only a code issued on the server opens a claim (lib/claims.ts), so a stranger has nothing to
  // try. Every way a code can fail gives the same answer, and a code never reaches a venture with an owner.
  async claim({ code }, { identity, workspace }) {
    if (process.env.NAIVE_RUNTIME === "hosted") {
      throw new Error("The hosted console cannot redeem a code issued for a venture on disk.");
    }
    const refused = new Error("That code is not valid. Ask for a new one.");
    const claim = typeof code === "string" ? openClaim(shared, code) : null;
    const dir = claim && join(shared, claim.folder);
    if (!claim || !dir || !existsSync(join(dir, "venture.json")) || stampedOwner(dir)) throw refused;
    let v;
    try { v = JSON.parse(readFileSync(join(dir, "venture.json"), "utf8")); } catch { throw refused; }
    if (!selfContained(dir)) throw new Error("This venture holds links or other ventures, so it cannot be claimed. Ask the person running this console.");
    if (await collides(dir, workspace)) throw new Error("You already have a venture with this name, so nothing was claimed.");
    await moveIn(dir, workspace).catch((e) => { throw e.code === "ENOENT" ? refused : e; });
    closeClaim(shared, code, identity.userId);
    return { id: v.id, name: v.name };
  },
};

// The key leaves the environment here, so no framework module or child process can sign.
const key = process.env.NAIVE_BRIDGE_KEY;
delete process.env.NAIVE_BRIDGE_KEY;
try {
  const { identity, request } = openAssertion(process.argv[2] ?? readFileSync(0, "utf8"), key);
  const fn = Object.hasOwn(ops, request.op) ? ops[request.op] : null;
  if (!fn) throw new Error(`no operation ${request.op}`);
  const workspace = workspaceOf(identity.userId);
  process.stdout.write(JSON.stringify({ ok: true, result: await fn(request, { identity, workspace }) }));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
}
