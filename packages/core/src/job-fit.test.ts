import { describe, expect, it } from "vitest";
import { craftOf } from "./crafts";
import { FEW_JOBS, fitJobs, hollandOrder, jobsForCraft, ventureCandidates, type SkillTable } from "./job-fit";
import type { Job } from "./work-browse";

const job = (code: string, title: string, interests: string[], people = 50_000, titles: string[] = []): Job => ({ code, title, about: "", tasks: [], emerging: [], interests, titles, related: [], people });
const JOBS = [
  job("47-2031.00", "Carpenters", ["Realistic", "Conventional"], 900_000),
  job("51-7011.00", "Cabinetmakers and Bench Carpenters", ["Realistic", "Artistic"], 80_000),
  job("51-9195.05", "Potters, Manufacturing", ["Realistic", "Artistic"], 5_000),
  job("27-1013.00", "Fine Artists, Including Painters, Sculptors, and Illustrators", ["Artistic", "Realistic"], 10_000),
  job("43-3031.00", "Bookkeeping, Accounting, and Auditing Clerks", ["Conventional", "Enterprising"], 1_500_000),
  job("49-9071.00", "Maintenance and Repair Workers, General", ["Realistic", "Conventional"], 1_400_000),
];
const carpentry = craftOf("carpentry")!;
const pottery = craftOf("pottery")!;

describe("jobs a craft leads to", () => {
  it("finds jobs named for the craft", () => {
    expect(jobsForCraft(carpentry, JOBS).map((j) => j.title)).toEqual(["Carpenters", "Cabinetmakers and Bench Carpenters"]);
    expect(jobsForCraft(pottery, JOBS).map((j) => j.title)).toEqual(["Potters, Manufacturing"]);
  });
});

describe("Holland order", () => {
  it("orders types by liked activities and leaves out types never liked", () => {
    expect(hollandOrder({ "cook-a-meal": "like", "not-real": "like" })).toEqual(["R"]);
    expect(hollandOrder({})).toEqual([]);
  });
});

describe("jobs that fit", () => {
  it("gives every match a reason and ranks a practised craft above interest alone", () => {
    const fits = fitJobs(JOBS, { holland: ["R"], crafts: [{ craft: carpentry, practising: true, stage: 2 }] });
    expect(fits[0]!.job.title).toBe("Carpenters");
    expect(fits[0]!.reasons).toEqual(["You practise carpentry (competent)", "Fits your Realistic interest"]);
    expect(fits.every((f) => f.reasons.length > 0)).toBe(true);
  });
  it("shows interest-only matches when the person keeps no crafts", () => {
    const fits = fitJobs(JOBS, { holland: ["C"], crafts: [] });
    expect(fits.map((f) => f.job.title)).toEqual(["Bookkeeping, Accounting, and Auditing Clerks"]);
  });
  it("drops interest-only matches once crafts are kept", () => {
    const fits = fitJobs(JOBS, { holland: ["C"], crafts: [{ craft: carpentry, practising: false, stage: -1 }] });
    expect(fits.map((f) => f.job.title)).toEqual(["Carpenters", "Cabinetmakers and Bench Carpenters"]);
    expect(fits[0]!.reasons).toEqual(["Drawn to carpentry"]);
  });
  it("names shared skills, never basic ones", () => {
    const skills: SkillTable = { skills: { names: ["Repairing", "Equipment Maintenance", "Critical Thinking"], jobs: { "47-2031.00": [0, 1, 2], "49-9071.00": [0, 1, 2] } }, knowledge: { names: [], jobs: {} } };
    const fits = fitJobs(JOBS, { holland: [], crafts: [{ craft: carpentry, practising: true, stage: 1 }], skills });
    const repair = fits.find((f) => f.job.code === "49-9071.00");
    expect(repair?.reasons).toEqual(["Uses skills you build: repairing, equipment maintenance"]);
  });
});

describe("venture candidates", () => {
  it("are crafts practised at Competent or beyond that few jobs pay for", () => {
    const v = ventureCandidates(JOBS, [
      { craft: pottery, practising: true, stage: 2 },
      { craft: carpentry, practising: true, stage: 4 },
      { craft: craftOf("knitting")!, practising: true, stage: 0 },
    ]);
    expect(v.map((x) => [x.craft.id, x.stage, x.jobs])).toEqual([["pottery", "Competent", 1]]);
    expect(FEW_JOBS).toBe(100_000);
  });
});
