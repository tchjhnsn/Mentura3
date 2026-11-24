// The remote image fetcher (platform/integrations/remote-image.mjs, J-3 and J-4), against a local server: it
// fetches only from hosts the venture allows, checks a redirect's host again, takes only images, keeps the
// original private in raw/ and links it, copies it into public/ only under a license that allows a copy, and
// records what it fetched through Naive's addAsset and addRemote. These were the fetcher cases of Naive's
// interface/tests/brand-test.mjs before EE-118; Naive now tests what a fetcher records, and the fetcher is tested here.
//
//   node platform/integrations/remote-image-test.mjs

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { factsOf } from "naive-framework/src/engine/assets.mjs";
import { naivePath } from "../../scripts/naive.ts";

let failed = 0;
/** @param {string} name @param {unknown} ok @param {unknown} [detail] */
const expect = (name, ok, detail = "") => { console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  ${typeof detail === "string" ? detail : JSON.stringify(detail)}`}`); if (!ok) failed++; };

// A real PNG, so the fetcher's facts are read from real bytes.
const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, "latin1"), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function png(w, h) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// A workspace with a venture.
const ws = mkdtempSync(join(tmpdir(), "remote-image-test-"));
const W = join(ws, "ventures");
const env = /** @type {NodeJS.ProcessEnv} */ ({ ...process.env, MENTURA_WORKSPACE: W });
delete env.MENTURA_ACTOR_ID;
const mentura = (...a) => spawnSync("node", [naivePath("packages/naive/src/interfaces/cli/mentura.mjs"), ...a], { encoding: "utf8", env });
const init = mentura("init", join(W, "acme"), "--id", "acme", "--layers", "purpose");
expect("a venture to fetch images for", init.status === 0, init.stderr);
const dir = join(W, "acme");
const reg = () => JSON.parse(readFileSync(join(dir, "public/assets.json"), "utf8"));

const photo = png(640, 360);
const server = createServer((req, res) => {
  if (req.url === "/a.png") { res.writeHead(200, { "content-type": "image/png", "content-length": photo.length }); res.end(photo); }
  else if (req.url === "/hop") { res.writeHead(302, { location: "http://localhost:" + /** @type {import("node:net").AddressInfo} */ (server.address()).port + "/a.png" }); res.end(); }
  else if (req.url === "/page") { res.writeHead(200, { "content-type": "text/html" }); res.end("<html></html>"); }
  else { res.writeHead(404); res.end(); }
});
await /** @type {Promise<void>} */ (new Promise((ok) => server.listen(0, "127.0.0.1", ok)));
const host = `127.0.0.1:${/** @type {import("node:net").AddressInfo} */ (server.address()).port}`;
const base = `http://${host}`;
// The fetcher runs as its own process (asynchronously, so this process keeps serving).
const fetcher = new URL("./remote-image.mjs", import.meta.url).pathname;
/** @param {string[]} args @returns {Promise<{ status: number | null, stdout: string, stderr: string }>} */
const run = (args) => new Promise((ok) => {
  const p = spawn("node", [fetcher, ...args], { env });
  let out = "", err = "";
  p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
  p.on("close", (status) => ok({ status, stdout: out, stderr: err }));
});

try {
  let f = await run([`${base}/a.png`, "--venture", "acme", "--license", "CC-BY-4.0", "--credit", "Ana Photo"]);
  expect("J-3: a host not in remote_hosts is refused", f.status === 1 && /not in remote_hosts/.test(f.stderr), f.stderr);
  const r = mentura("assets", "hosts", host, "--venture", "acme", "--as", "person");
  expect("J-3: remote_hosts is set as a setting in the register", r.status === 0 && reg().remote_hosts[0] === host, r.stderr);
  f = await run([`${base}/hop`, "--venture", "acme", "--license", "CC-BY-4.0", "--credit", "Ana Photo"]);
  expect("J-3: a redirect to another host is checked again and refused", f.status === 1 && /localhost:\d+ is not in remote_hosts/.test(f.stderr), f.stderr);
  f = await run([`${base}/page`, "--venture", "acme", "--license", "CC-BY-4.0", "--credit", "Ana Photo"]);
  expect("J-3: something that is not an image is refused", f.status === 1 && /not an image/.test(f.stderr), f.stderr);
  f = await run([`${base}/a.png`, "--venture", "acme", "--license", "all-rights-reserved", "--credit", "Ana Photo", "--copy", "public/photo.png"]);
  expect("J-3: a copy is refused when the license does not allow one", f.status === 1 && /does not allow a full copy/.test(f.stderr) && !existsSync(join(dir, "public/photo.png")), f.stderr);
  f = await run([`${base}/a.png`, "--venture", "acme", "--license", "all-rights-reserved", "--credit", "Ana Photo", "--id", "hero-photo", "--json"]);
  const out = f.status === 0 ? JSON.parse(f.stdout) : {};
  expect("J-3: fetched, the original is kept private in raw/ and only linked", f.status === 0 && existsSync(join(dir, "raw/sources/hero-photo/original.png")) && !existsSync(join(dir, "public/photo.png")), f.stderr);
  expect("J-4: the fetched image's facts are read by code", out.facts?.width === 640 && out.facts?.height === 360 && reg().remote.find((q) => q.id === "hero-photo").fetched.sha256 === factsOf(photo).sha256);
  f = await run([`${base}/a.png`, "--venture", "acme", "--license", "CC-BY-4.0", "--credit", "Ana Photo", "--id", "cc-photo", "--copy", "public/photo.png", "--alt", "Clinic front desk"]);
  expect("J-3: a license that allows a copy keeps one in public/, registered with its origin", f.status === 0 && existsSync(join(dir, "public/photo.png")) && reg().assets.find((q) => q.path === "public/photo.png")?.origin_url === `${base}/a.png` && reg().remote.find((q) => q.id === "cc-photo").copy === "public/photo.png", f.stderr);
  const v = spawnSync(process.execPath, [naivePath("packages/naive/src/records/validate.mjs"), "--schema", "raw-source.schema.json", "--file", join(dir, "raw/sources/hero-photo/source.json")], { encoding: "utf8" });
  expect("the fetched image's note in raw/ validates against its schema", v.status === 0, v.stdout + v.stderr);
  const p = spawnSync("node", [naivePath("packages/naive/src/checks/check-provenance.mjs"), dir], { encoding: "utf8" });
  expect("every fetch kept the provenance chain", p.status === 0, p.stdout + p.stderr);
} finally {
  server.close();
}

console.log(failed ? `\n${failed} failing` : "\nall passing");
process.exit(failed ? 1 : 0);
