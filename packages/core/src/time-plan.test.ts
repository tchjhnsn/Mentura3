import { describe, expect, it } from "vitest";
import { atSpeed, dailyPlan, daysUntil, hours } from "./time-plan";

describe("time to finish", () => {
  it("halves at 2x: 120 hours become 60", () => {
    expect(atSpeed(120 * 3600, 2) / 3600).toBe(60);
  });
  it("counts days to a date, both ends, and none once it has passed", () => {
    expect(daysUntil("2026-11-16", "2026-11-23")).toBe(8);
    expect(daysUntil("2026-11-16", "2026-11-15")).toBe(0);
  });
  it("gives minutes a day at each speed", () => {
    const p = dailyPlan(10 * 3600, 5);
    expect(p.find((x) => x.speed === 1)!.minutesADay).toBe(120);
    expect(p.find((x) => x.speed === 2)!.minutesADay).toBe(60);
  });
  it("says lengths plainly", () => {
    expect(hours(45 * 60)).toBe("45 min");
    expect(hours(200 * 60)).toBe("3 h 20 min");
    expect(hours(120 * 3600)).toBe("120 h");
  });
});
