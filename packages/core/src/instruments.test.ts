import { describe, expect, it } from "vitest";
import { INSTRUMENTS, PIANO, daysInARow, instrumentByUrl, instrumentPart, instrumentView, minutesByDay, minutesThisWeek, nextPiece } from "./instruments";
import { audioOf } from "./media";

describe("the piano course", () => {
  it("is a graded path of public-domain pieces, each with a free credited recording and its IMSLP score", () => {
    expect(PIANO.pieces.length).toBeGreaterThanOrEqual(10);
    expect(PIANO.pieces.length).toBeLessThanOrEqual(15);
    expect(new Set(PIANO.pieces.map((p) => p.id)).size).toBe(PIANO.pieces.length);
    for (const p of PIANO.pieces) {
      expect(audioOf(p.recording.url), p.id).toBeTruthy();
      expect(p.recording.credit, p.id).toMatch(/(CC0|CC BY|Public domain)/);
      expect(p.imslp, p.id).toMatch(/^https:\/\/imslp\.org\/wiki\/\S+$/);
      expect(p.grade, p.id).toBeGreaterThanOrEqual(1);
      expect(p.grade, p.id).toBeLessThanOrEqual(8);
      expect(p.why.length, p.id).toBeGreaterThan(20);
    }
    // In order of difficulty: no piece is easier than the one before it.
    PIANO.pieces.forEach((p, i) => { if (i) expect(p.grade, p.id).toBeGreaterThanOrEqual(PIANO.pieces[i - 1]!.grade); });
  });

  it("is found by the url it is kept under, and no other", () => {
    expect(instrumentByUrl(PIANO.url)).toBe(PIANO);
    expect(instrumentByUrl("https://example.com")).toBeUndefined();
    expect(new Set(INSTRUMENTS.map((x) => x.url)).size).toBe(INSTRUMENTS.length);
  });
});

describe("the next piece", () => {
  const [a, b, c] = PIANO.pieces;
  it("is the first in order not learned, skipping ahead past pieces learned out of order", () => {
    expect(nextPiece(PIANO.pieces, [])).toBe(a);
    expect(nextPiece(PIANO.pieces, [a!.id])).toBe(b);
    expect(nextPiece(PIANO.pieces, [b!.id])).toBe(a);
    expect(nextPiece(PIANO.pieces, [a!.id, b!.id])).toBe(c);
    expect(nextPiece(PIANO.pieces, PIANO.pieces.map((p) => p.id))).toBeNull();
  });
});

describe("minutes", () => {
  const today = "2026-11-17";
  const sessions = [
    { day: "2026-11-17", minutes: 20 }, { day: "2026-11-17", minutes: 10 },
    { day: "2026-11-16", minutes: 15 }, { day: "2026-11-15", minutes: null },
    { day: "2026-11-11", minutes: 30 }, { day: "2026-11-10", minutes: 45 }, { day: "2026-11-03", minutes: 60 }, { day: "2026-11-18", minutes: 5 },
  ];
  it("adds up each day of the last two weeks, oldest first, today last", () => {
    const days = minutesByDay(sessions, today);
    expect(days).toHaveLength(14);
    expect(days[0]!.day).toBe("2026-11-04");
    expect(days.at(-1)).toEqual({ day: today, minutes: 30 });
    expect(days.find((d) => d.day === "2026-11-15")!.minutes).toBe(0);
    expect(days.reduce((n, d) => n + d.minutes, 0)).toBe(120);
  });
  it("counts this week as the last seven days, today included", () => {
    expect(minutesThisWeek(sessions, today)).toBe(75);
    expect(minutesThisWeek([], today)).toBe(0);
  });
  it("counts days in a row ending today or yesterday", () => {
    expect(daysInARow(sessions, today)).toBe(3);
    expect(daysInARow([{ day: "2026-11-16", minutes: 10 }], today)).toBe(1);
    expect(daysInARow([{ day: "2026-11-14", minutes: 10 }], today)).toBe(0);
  });
});

describe("the course view and its parts", () => {
  const today = "2026-11-17";
  const first = PIANO.pieces[0]!;
  const v = instrumentView(PIANO, { kept: "k", learned: [first.id, first.id, "not-a-piece"], sessions: [{ day: today, minutes: 25 }] }, today);
  it("marks what is learned and today's piece, ignoring units that are not pieces", () => {
    expect(v.learned).toEqual([first.id]);
    expect(v.current).toBe(PIANO.pieces[1]);
    expect(v.pieces.filter((p) => p.current)).toHaveLength(1);
    expect(v.week).toBe(25);
  });
  it("answers each path as JSON, and null for others", () => {
    expect(instrumentPart(v, "")).toMatchObject({ instrument: "Piano", learned: 1, of: PIANO.pieces.length, minutesThisWeek: 25, today: { id: PIANO.pieces[1]!.id } });
    expect((instrumentPart(v, "pieces") as unknown[]).length).toBe(PIANO.pieces.length);
    expect(instrumentPart(v, `pieces/${first.id}`)).toMatchObject({ learned: true, score: first.imslp });
    expect(instrumentPart(v, "practice")).toMatchObject({ minutesThisWeek: 25 });
    expect(instrumentPart(v, "pieces/nope")).toBeNull();
    expect(instrumentPart(v, "other")).toBeNull();
  });
});
