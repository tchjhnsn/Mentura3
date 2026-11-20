import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import policySchema from "../schemas/presentation-policy.schema.json" with { type: "json" };
import recordSchema from "../schemas/presentation.schema.json" with { type: "json" };
import { filesPresentations, POLICY_FILE, presentationProblems } from "./files-presentations.ts";
import { checkInstance, initInstance } from "./instance.ts";
import { parseMemory } from "./memory.ts";
import {
  CHANNEL_KINDS,
  checkPresentationPolicy,
  defaultPolicy,
  draftPresentation,
  gateFor,
  newPresentationId,
  OCCASIONS,
  parsePresentation,
  parsePresentationPolicy,
  recordAfterward,
  VIRTUES,
  type Presentation,
  type PresentationPolicy,
} from "./presentation.ts";

const NOW = new Date("2026-11-19T15:00:00Z");
const policy = (): PresentationPolicy => structuredClone(defaultPolicy("p-1"));
const draft = (f: Partial<Parameters<typeof draftPresentation>[2]> = {}, existing: Presentation | null = null) =>
  draftPresentation(policy(), existing, { channel: "personal-site", ...f }, { id: "2026-11-19-personal-site", now: NOW });
const complete = () => draft({ role: "Founder", end: "show what I make and whom it serves", audience: "people who look me up", relation: "a stranger to most" });

const dirs: string[] = [];
afterAll(async () => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

describe("the presentation policy", () => {
  it("starts with the personal site, the Reflect profile, social, email and in person, and passes its own check", () => {
    const p = defaultPolicy("p-1");
    expect(p.channels.map((c) => [c.id, c.kind])).toEqual([["personal-site", "website"], ["reflect-profile", "profile"], ["social", "social"], ["email", "email"], ["in-person", "in-person"]]);
    expect(parsePresentationPolicy(JSON.parse(JSON.stringify(p)))).toEqual({ policy: p, problems: [] });
    expect(p.channels.find((c) => c.kind === "in-person")!.destination).toBeUndefined();
    for (const c of p.channels) for (const r of c.rules) expect(r.approvers).toEqual(["person"]);
  });

  it("refuses an agent approver, an in-person destination, a missing destination, an unknown guideline and a reserved id", () => {
    const p = policy();
    p.channels[0]!.rules[0]!.approvers = ["person", "agent"] as unknown as ["person"];
    p.channels[4]!.destination = "the kitchen";
    delete p.channels[1]!.destination;
    p.channels[2]!.guidelines = ["nope"];
    p.channels[3]!.id = "check";
    expect(checkPresentationPolicy(p)).toEqual([
      "channel personal-site rule 1: the approver is always the person, not agent",
      "channel reflect-profile: destination is required: where it lands",
      "channel social: guideline nope is not in the policy's guidelines",
      "channel check: check is a word reflect present reads; name the channel otherwise",
      "channel in-person: an in-person channel has no destination",
    ]);
  });

  it("refuses a rule with no role or end, a kind it does not know and a field it does not have", () => {
    const raw = JSON.parse(JSON.stringify(policy())) as { channels: Record<string, unknown>[]; extra?: number };
    (raw.channels[0]!.rules as Record<string, unknown>[])[0] = { content: "essays", approvers: ["person"] };
    raw.channels[1]!.kind = "billboard";
    raw.extra = 1;
    const r = parsePresentationPolicy(raw);
    expect(r.policy).toBeNull();
    expect(r.problems).toEqual(expect.arrayContaining([
      "policy: extra is not a field here",
      expect.stringMatching(/^channels\[0\]\.rules\[0\]: role is required/),
      expect.stringMatching(/^channels\[0\]\.rules\[0\]: end is required/),
      expect.stringMatching(/^channels\[1\]: kind is one of/),
    ]));
  });

  it("has JSON Schemas that name the same kinds, occasions and virtues as the code", () => {
    const channel = policySchema.properties.channels.items;
    expect(channel.properties.kind.enum).toEqual([...CHANNEL_KINDS]);
    expect(channel.properties.rules.items.required).toEqual(["content", "role", "end", "approvers"]);
    expect(channel.required).not.toContain("destination");
    expect(recordSchema.properties.occasion.enum).toEqual([...OCCASIONS]);
    expect(recordSchema.properties.virtue.oneOf.map((o) => [o.properties.id.const, o.properties.excess.const, o.properties.deficiency.const])).toEqual(VIRTUES.map((v) => [v.id, v.excess, v.deficiency]));
    expect(Object.keys(recordSchema.properties.circumstances.properties)).toEqual(["who", "what", "about", "means", "end", "how"]);
  });
});

describe("a presentation record", () => {
  it("holds the six circumstances, the occasion, the audience and the virtue with its two faults", () => {
    const p = draft({ who: "Tor", role: "founder", what: "the about page", about: "the site's readers", means: "the site", end: "show what I make and whom it serves", how: "plainly", occasion: "deliberative", audience: "readers", relation: "a stranger", virtue: "truthfulness" });
    expect(p).toEqual({
      id: "2026-11-19-personal-site",
      channel: "personal-site",
      circumstances: { who: { name: "Tor", role: "founder" }, what: "the about page", about: "the site's readers", means: "the site", end: "show what I make and whom it serves", how: "plainly" },
      occasion: "deliberative",
      audience: { who: "readers", relation: "a stranger" },
      virtue: { id: "truthfulness", excess: "boastfulness", deficiency: "false modesty" },
      created: NOW.toISOString(),
      updated: NOW.toISOString(),
    });
    expect(parsePresentation(p)).toEqual({ presentation: p, problems: [] });
    const later = draftPresentation(policy(), p, { channel: "personal-site", how: "", virtue: "" }, { id: p.id, now: new Date("2026-11-20T00:00:00Z") });
    expect(later.circumstances.how).toBeUndefined();
    expect(later.virtue).toBeUndefined();
    expect(later.circumstances.what).toBe("the about page");
    expect(later.created).toBe(NOW.toISOString());
  });

  it("refuses a channel the policy lacks, another channel for a draft, an unknown occasion or virtue, and a relation with no audience", () => {
    expect(() => draft({ channel: "billboard" })).toThrow(/no channel billboard/);
    expect(() => draft({ channel: "email" }, complete())).toThrow(/is for personal-site/);
    expect(() => draft({ occasion: "festive" })).toThrow(/deliberative, judicial or ceremonial|one of deliberative/);
    expect(() => draft({ virtue: "courage" })).toThrow(/virtue is one of/);
    expect(() => draft({ relation: "friend" })).toThrow(/audience before/);
  });

  it("refuses a virtue with the wrong faults", () => {
    const p = { ...complete(), virtue: { id: "wit", excess: "boastfulness", deficiency: "boorishness" } };
    expect(parsePresentation(p).problems).toEqual(["virtue: wit sits between buffoonery and boorishness"]);
  });

  it("keeps how it went afterward, and takes a new id when the day's is taken", () => {
    const after = recordAfterward(complete(), " Kind replies. ", "2026-11-21", NOW);
    expect(after.afterward).toEqual({ on: "2026-11-21", went: "Kind replies." });
    expect(() => recordAfterward(complete(), " ", "2026-11-21", NOW)).toThrow(/how it went/);
    expect(newPresentationId("email", "2026-11-19", new Set())).toBe("2026-11-19-email");
    expect(newPresentationId("email", "2026-11-19", new Set(["2026-11-19-email", "2026-11-19-email-2"]))).toBe("2026-11-19-email-3");
  });
});

describe("the gate", () => {
  it("is ready with the end, the role, the audience and a rule that matches, whatever the case", () => {
    const g = gateFor(policy(), complete(), "personal-site");
    expect(g).toMatchObject({ ready: true, channel: { id: "personal-site" }, rule: { role: "founder", end: "show what I make and whom it serves" } });
  });

  it("names each missing item", () => {
    expect(gateFor(policy(), null, "personal-site")).toEqual({ ready: false, missing: [{ item: "presentation", message: "no presentation record; draft one with reflect present personal-site" }] });
    const g = gateFor(policy(), draft(), "personal-site");
    expect(g.ready ? [] : g.missing.map((m) => m.item)).toEqual(["end", "role", "audience"]);
  });

  it("refuses a role and end no rule allows, and lists the channel's rules", () => {
    const g = gateFor(policy(), draft({ role: "citizen", end: "win an argument", audience: "anyone" }), "personal-site");
    expect(g).toEqual({ ready: false, missing: [{ item: "rule", message: "no rule on personal-site lets you speak as citizen for that end; its rules: as founder, to show what I make and whom it serves (pages about your work); as writer, to share what I have thought through (essays and notes)" }] });
  });

  it("refuses a record on another channel and a channel the policy lacks", () => {
    const wrong = gateFor(policy(), complete(), "email");
    expect(wrong.ready ? [] : wrong.missing.map((m) => m.item)).toEqual(["channel", "rule"]);
    const none = gateFor(policy(), complete(), "billboard");
    expect(none.ready ? [] : none.missing[0]!.message).toMatch(/^the policy has no channel billboard/);
  });
});

describe("presentations in a vault", () => {
  async function vault() {
    const root = await mkdtemp(join(tmpdir(), "reflect-presentations-"));
    dirs.push(root);
    const c = await initInstance(root, "Tester");
    return { root, person: c.person, store: filesPresentations(root, c.person, { now: () => NOW }) };
  }

  it("reads the default policy until one is written, writes it once, and keeps records in memory", async () => {
    const { root, person, store } = await vault();
    expect((await store.policy()).person).toBe(person);
    expect(await store.ensurePolicy()).toEqual({ written: true });
    expect(await store.ensurePolicy()).toEqual({ written: false });
    const p = { ...complete(), id: "2026-11-19-personal-site" };
    await store.put(p);
    expect(await store.get(p.id)).toEqual(p);
    expect((await store.list()).map((x) => x.id)).toEqual([p.id]);
    const memory = parseMemory(await readFile(join(root, "memory.jsonl"), "utf8")).map((l) => [l.op, l.path]);
    expect(memory.slice(-2)).toEqual([["create", POLICY_FILE], ["create", "presentations/2026-11-19-personal-site.json"]]);
    expect(await checkInstance(root)).toMatchObject({ problems: [], outside: [] });
    expect(await presentationProblems(root, person)).toEqual([]);
  });

  it("finds a record that is not one, a misnamed one, one on a missing channel, and a policy that fails", async () => {
    const { root, person, store } = await vault();
    await store.put({ ...complete(), id: "a" });
    await writeFile(join(root, "presentations", "b.json"), JSON.stringify({ ...complete(), id: "c" }));
    await writeFile(join(root, "presentations", "d.json"), JSON.stringify({ ...complete(), id: "d", channel: "billboard" }));
    await writeFile(join(root, "presentations", "e.json"), "{");
    expect(await presentationProblems(root, person)).toEqual(["presentations/b.json: its id is c", "presentations/d.json: the policy has no channel billboard", "presentations/e.json is not JSON"]);
    const bad = policy();
    bad.channels[4]!.destination = "the kitchen";
    await writeFile(join(root, POLICY_FILE), JSON.stringify(bad));
    await expect(store.policy()).rejects.toThrow(/in-person channel has no destination/);
    expect((await checkInstance(root)).problems).toContain(`${POLICY_FILE}: channel in-person: an in-person channel has no destination`);
  });
});
