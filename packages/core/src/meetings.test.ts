import { describe, expect, it } from "vitest";
import { agendaItems, canJoin, cleanEmail, cleanFollowup, cleanMeetingPart, emptyPrep, meetingState, readPrep, rehearsedCount, stateLine } from "./meetings";

const at = (iso: string) => new Date(iso);
const m = { startsAt: "2026-11-26T16:00:00.000Z", minutes: 45, cancelled: false };

describe("meetings", () => {
  it("moves from scheduled to live to ended around its start", () => {
    expect(meetingState({ ...m, startsAt: null })).toBe("draft");
    expect(meetingState({ ...m, cancelled: true }, at("2026-11-26T16:10:00Z"))).toBe("cancelled");
    expect(meetingState(m, at("2026-11-26T15:49:00Z"))).toBe("scheduled");
    expect(meetingState(m, at("2026-11-26T15:50:00Z"))).toBe("live");
    expect(meetingState(m, at("2026-11-26T17:15:00Z"))).toBe("live");
    expect(meetingState(m, at("2026-11-26T17:15:01Z"))).toBe("ended");
    expect(canJoin(m, at("2026-11-26T16:20:00Z"))).toBe(true);
    expect(canJoin(m, at("2026-11-26T12:00:00Z"))).toBe(false);
  });

  it("cleans each part or names what is wrong", () => {
    expect(cleanMeetingPart("title", "  Seed   conversation ")).toBe("Seed conversation");
    expect(() => cleanMeetingPart("title", " ")).toThrow("Name the meeting.");
    expect(cleanMeetingPart("starts_at", "2026-11-26T16:00:00Z")).toBe("2026-11-26T16:00:00.000Z");
    expect(cleanMeetingPart("starts_at", "")).toBeNull();
    expect(() => cleanMeetingPart("minutes", "2")).toThrow();
    expect(cleanMeetingPart("minutes", "60")).toBe(60);
    expect(cleanMeetingPart("call_url", "https://meet.google.com/abc-defg-hij")).toBe("https://meet.google.com/abc-defg-hij");
    expect(() => cleanMeetingPart("call_url", "http://zoom.us/j/1")).toThrow();
    expect(() => cleanMeetingPart("call_url", "javascript:alert(1)")).toThrow();
  });

  it("reads emails, agenda items and follow-ups", () => {
    expect(cleanEmail(" Alex@Example.com ")).toBe("alex@example.com");
    expect(() => cleanEmail("alex")).toThrow();
    expect(agendaItems("1. The problem\n\n- What is built\n* The raise")).toEqual(["The problem", "What is built", "The raise"]);
    expect(cleanFollowup({ text: " Send the deck ", owner: "Torian", due: "2026-12-01" })).toEqual({ text: "Send the deck", owner: "Torian", due: "2026-12-01" });
    expect(() => cleanFollowup({ text: "x", due: "Dec 1" })).toThrow();
  });

  it("reads a prep whole, dropping unsourced facts, and counts rehearsed answers", () => {
    expect(readPrep(null)).toEqual(emptyPrep());
    const p = readPrep({
      keyPoints: ["Why fund the founder", 3],
      questions: [{ id: "q1", question: "Why so many projects?", answer: "One system.", rehearsed: true }, { id: "q2", question: "How will it make money?" }],
      about: [{ id: "f1", fact: "Invests pre-seed", source: "https://example.com" }, { id: "f2", fact: "Unsourced", source: " " }],
    });
    expect(p.keyPoints).toEqual(["Why fund the founder"]);
    expect(p.about.map((f) => f.id)).toEqual(["f1"]);
    expect(p.checklist.length).toBe(3);
    expect(rehearsedCount(p)).toEqual({ done: 1, of: 2 });
  });

  it("says where a meeting stands", () => {
    expect(stateLine({ ...m, startsAt: null })).toBe("Pick a time");
    expect(stateLine(m, at("2026-11-26T15:40:00Z"))).toMatch(/^Starts in 20 minutes, Thu, Nov 26/);
    expect(stateLine(m, at("2026-11-26T15:55:00Z"))).toBe("Starts in 5 minutes");
    expect(stateLine(m, at("2026-11-26T16:05:00Z"))).toBe("Live now");
    expect(stateLine(m, at("2026-11-27T16:05:00Z"))).toMatch(/^Ended/);
  });
});
