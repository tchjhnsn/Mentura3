// The MCP connector against a fake Reflect route: it signs each read for the acting person and business, reads only
// inside a signed request, shows records as files and refuses every write (connectors/mcp.ts).
import assert from "node:assert/strict";
import { actAs, connect, signBody } from "./mcp.ts";

const key = "k".repeat(64);
const seen: { body: string; sig: string }[] = [];
const fake = async (_url: string, init: { headers: Record<string, string>; body: string }) => {
  seen.push({ body: init.body, sig: init.headers["x-naive-signature"] ?? "" });
  const items = [{ path: "customers/cus_1.json", content: '{"id":"cus_1","name":"Ada"}\n' }, { path: "customers/cus_2.json", content: '{"id":"cus_2","name":"Bo"}\n' }];
  return new Response(JSON.stringify({ items }), { status: 200 });
};
const c = connect({ id: "mcp-stripe-00000001", api: "stripe", url: "http://reflect.test/api/naive/mcp", fetch: fake as never });

await assert.rejects(c.list("customers/"), /signed request/);
actAs({ user: "u1", venture: "biz", key });
assert.deepEqual((await c.list("customers/")).map((x) => x.path), ["customers/cus_1.json", "customers/cus_2.json"]);
assert.equal((await c.read("customers/cus_2.json"))?.content, '{"id":"cus_2","name":"Bo"}\n');
assert.equal(await c.read("customers/cus_9.json"), null);
assert.equal((await c.search("Ada")).length, 1);
await assert.rejects(c.write(), /read-only/);
const last = seen.at(-1)!;
assert.equal(last.sig, signBody(last.body, key));
assert.deepEqual(JSON.parse(last.body), { ...JSON.parse(last.body), op: "list", user: "u1", venture: "biz", source: "mcp-stripe-00000001", api: "stripe" });
assert.equal(JSON.parse(seen[1]!.body).folder, "customers");
assert.throws(() => connect({ api: "stripe", writes: "direct" }), /read-only/);
assert.throws(() => connect({ api: "Bad Id" }), /service id/);
actAs(null);
console.log("mcp connector: ok");
