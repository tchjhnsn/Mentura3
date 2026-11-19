import { describe, expect, it } from "vitest";
import { escapeText, fold, utcStamp, writeIcs } from "./ics-write";
import { parseIcs, unescapeText } from "./ics";

const ev = {
  uid: "m1@reflect",
  title: "Pitch, review; round 2",
  start: "2026-12-03T18:00:00-06:00",
  end: "2026-12-03T18:45:00-06:00",
  description: "1. Numbers\n2. Ask, then listen",
  location: "https://reflect.example/meetings/m1",
  url: "https://reflect.example/meetings/m1",
};

describe("writing an iCalendar file", () => {
  it("escapes commas, semicolons, backslashes and new lines, and reads back the same", () => {
    expect(escapeText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
    expect(unescapeText(escapeText("a,b;c\\d\ne"))).toBe("a,b;c\\d\ne");
  });

  it("writes times in UTC with Z", () => {
    expect(utcStamp("2026-12-03T18:00:00-06:00")).toBe("20261204T000000Z");
    expect(() => utcStamp("soon")).toThrow("not a date");
  });

  it("ends every line in CRLF and folds long lines at 75 octets", () => {
    const text = writeIcs({ ...ev, description: "word ".repeat(60) }, new Date("2026-11-19T12:00:00Z"));
    expect(text.endsWith("\r\n")).toBe(true);
    expect(text.replace(/\r\n/g, "")).not.toMatch(/\n|\r/);
    for (const line of text.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(text).toContain("DTSTAMP:20261119T120000Z\r\n");
    expect(fold("é".repeat(50)).split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });

  it("writes one event the reader parses back", () => {
    const cal = parseIcs(writeIcs(ev));
    expect(cal.events).toHaveLength(1);
    const e = cal.events[0]!;
    expect(e.uid).toBe("m1@reflect");
    expect(e.summary).toBe("Pitch, review; round 2");
    expect(e.description).toBe("1. Numbers\n2. Ask, then listen");
    expect(e.start).toEqual({ day: "2026-12-04", time: "00:00:00", tz: "UTC" });
    expect(e.end).toEqual({ day: "2026-12-04", time: "00:45:00", tz: "UTC" });
  });

  it("leaves out the parts it is not given", () => {
    const text = writeIcs({ uid: "x", title: "Call", start: ev.start, end: ev.end });
    expect(text).not.toMatch(/DESCRIPTION|LOCATION|URL:/);
  });
});
