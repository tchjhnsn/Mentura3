import { describe, expect, it } from "vitest";
import { occurrences } from "./calendar";
import { contentLine, feedEvents, feedUrl, inZoneOf, instantOf, isFeedEvent, lastDay, parseDuration, parseIcs, parseRule, parseTime, plainRepeat, ruleDays, unescapeText, unfold, type FeedRef } from "./ics";

const feed: FeedRef = { id: "f1", name: "Work", tile: "work" };
const cal = (...events: string[]) => ["BEGIN:VCALENDAR", "VERSION:2.0", "X-WR-CALNAME:Work", "X-WR-TIMEZONE:America/Chicago", ...events, "END:VCALENDAR"].join("\r\n");
const vevent = (...lines: string[]) => ["BEGIN:VEVENT", ...lines, "END:VEVENT"].join("\r\n");

describe("reading iCalendar text", () => {
  it("unfolds folded lines and keeps the rest", () => {
    expect(unfold("SUMMARY:Lunch with\r\n  the team\r\nUID:1\n\tcontinued\r\n")).toEqual(["SUMMARY:Lunch with the team", "UID:1continued"]);
    expect(unfold("﻿BEGIN:VCALENDAR")).toEqual(["BEGIN:VCALENDAR"]);
  });

  it("unescapes text", () => {
    expect(unescapeText("One\\, two\\; three\\\\four\\nfive\\Nsix")).toBe("One, two; three\\four\nfive\nsix");
  });

  it("splits a content line, with a colon inside a quoted parameter", () => {
    expect(contentLine('DTSTART;TZID="America/New_York":20261117T090000')).toEqual({ name: "DTSTART", params: { TZID: "America/New_York" }, value: "20261117T090000" });
    expect(contentLine('ATTENDEE;CN="A: B":mailto:a@b.c')).toMatchObject({ value: "mailto:a@b.c", params: { CN: "A: B" } });
    expect(contentLine("no colon here")).toBeNull();
  });

  it("reads DATE and DATE-TIME values, floating, UTC and with a TZID", () => {
    expect(parseTime("20261117")).toEqual({ day: "2026-11-17", time: null, tz: null });
    expect(parseTime("20261117T090000")).toEqual({ day: "2026-11-17", time: "09:00:00", tz: null });
    expect(parseTime("20261117T150000Z")).toEqual({ day: "2026-11-17", time: "15:00:00", tz: "UTC" });
    expect(parseTime("20261117T090000", { TZID: "Europe/Paris" })).toEqual({ day: "2026-11-17", time: "09:00:00", tz: "Europe/Paris" });
    expect(parseTime("20261117", { VALUE: "DATE" })).toMatchObject({ time: null });
    expect(parseTime("2026-11-17")).toBeNull();
    expect(parseTime("20261340")).toBeNull();
  });

  it("reads durations", () => {
    expect(parseDuration("PT1H30M")).toBe(5400);
    expect(parseDuration("P1D")).toBe(86400);
    expect(parseDuration("P1W")).toBe(604800);
    expect(parseDuration("-PT15M")).toBe(-900);
    expect(parseDuration("P")).toBeNull();
    expect(parseDuration("1H")).toBeNull();
  });

  it("reads rules and flags parts it does not expand", () => {
    expect(parseRule("FREQ=WEEKLY;BYDAY=MO,WE;INTERVAL=2;COUNT=10")).toMatchObject({ freq: "WEEKLY", interval: 2, count: 10, byDay: [{ n: null, wd: 1 }, { n: null, wd: 3 }], unknown: false });
    expect(parseRule("FREQ=MONTHLY;BYDAY=-1FR")).toMatchObject({ byDay: [{ n: -1, wd: 5 }], unknown: false });
    expect(parseRule("FREQ=MONTHLY;UNTIL=20261231T235959Z")!.until).toEqual({ day: "2026-12-31", time: "23:59:59", tz: "UTC" });
    expect(parseRule("FREQ=MONTHLY;BYSETPOS=-1;BYDAY=MO,TU")!.unknown).toBe(true);
    expect(parseRule("FREQ=YEARLY;BYDAY=20MO")!.unknown).toBe(true);
    expect(parseRule("FREQ=HOURLY")).toBeNull();
  });

  it("reads a calendar: its name, zone and events, skipping alarms and other components", () => {
    const c = parseIcs(cal(
      "BEGIN:VTIMEZONE", "TZID:America/Chicago", "BEGIN:STANDARD", "DTSTART:19701101T020000", "END:STANDARD", "END:VTIMEZONE",
      vevent("UID:a@x", "SUMMARY:Stand\\, up", "DTSTART;TZID=America/Chicago:20261117T090000", "DTEND;TZID=America/Chicago:20261117T093000", "DESCRIPTION:Line one\\nLine two",
        "BEGIN:VALARM", "TRIGGER:-PT10M", "DESCRIPTION:Reminder", "SUMMARY:Alarm", "END:VALARM"),
      vevent("UID:b@x", "DTSTART;VALUE=DATE:20261120"),
      "BEGIN:VTODO", "UID:t", "SUMMARY:Not an event", "DTSTART:20261120T090000Z", "END:VTODO",
      vevent("UID:nostart", "SUMMARY:No start"),
    ));
    expect(c.name).toBe("Work");
    expect(c.tz).toBe("America/Chicago");
    expect(c.events).toHaveLength(2);
    expect(c.events[0]).toMatchObject({ uid: "a@x", summary: "Stand, up", description: "Line one\nLine two", start: { day: "2026-11-17", time: "09:00:00", tz: "America/Chicago" }, end: { time: "09:30:00" } });
    expect(c.events[1]).toMatchObject({ uid: "b@x", summary: "Busy", start: { day: "2026-11-20", time: null } });
  });
});

describe("time zones", () => {
  it("moves a UTC time into a zone, across daylight saving time", () => {
    expect(inZoneOf({ day: "2026-07-01", time: "15:00:00", tz: "UTC" }, "America/Chicago")).toEqual({ day: "2026-07-01", time: "10:00:00", tz: "America/Chicago" });
    expect(inZoneOf({ day: "2026-12-01", time: "15:00:00", tz: "UTC" }, "America/Chicago")).toEqual({ day: "2026-12-01", time: "09:00:00", tz: "America/Chicago" });
    expect(inZoneOf({ day: "2026-12-01", time: "02:00:00", tz: "UTC" }, "America/Chicago")).toMatchObject({ day: "2026-11-30", time: "20:00:00" });
  });

  it("moves a time from one named zone to another", () => {
    expect(inZoneOf({ day: "2026-11-17", time: "09:00:00", tz: "Europe/Paris" }, "America/New_York")).toMatchObject({ day: "2026-11-17", time: "03:00:00" });
    expect(instantOf("2026-11-17", "09:00:00", "Europe/Paris")).toBe(Date.parse("2026-11-17T08:00:00Z"));
  });

  it("leaves whole days, floating times and unknown zones as written", () => {
    expect(inZoneOf({ day: "2026-11-17", time: null, tz: null }, "Asia/Tokyo")).toEqual({ day: "2026-11-17", time: null, tz: null });
    expect(inZoneOf({ day: "2026-11-17", time: "09:00:00", tz: null }, "Asia/Tokyo")).toMatchObject({ time: "09:00:00" });
    expect(inZoneOf({ day: "2026-11-17", time: "09:00:00", tz: "Eastern Standard Time" }, "Asia/Tokyo")).toMatchObject({ time: "09:00:00", tz: "Eastern Standard Time" });
    expect(inZoneOf({ day: "2026-11-17", time: "09:00:00", tz: "UTC" }, "Not/AZone")).toMatchObject({ time: "09:00:00", tz: "UTC" });
  });
});

describe("recurrence", () => {
  const at = (day: string) => ({ day, time: "09:00:00", tz: null });
  it("counts the start as the first occurrence, with COUNT and INTERVAL", () => {
    expect(ruleDays(at("2026-11-02"), parseRule("FREQ=DAILY;INTERVAL=2;COUNT=3")!, "2027-01-01")).toEqual(["2026-11-02", "2026-11-04", "2026-11-06"]);
  });

  it("gives a week's chosen days", () => {
    // 2026-11-02 is a Monday.
    expect(ruleDays(at("2026-11-02"), parseRule("FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=5")!, "2027-01-01")).toEqual(["2026-11-02", "2026-11-04", "2026-11-06", "2026-11-09", "2026-11-11"]);
    expect(ruleDays(at("2026-11-02"), parseRule("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU")!, "2026-11-30")).toEqual(["2026-11-02", "2026-11-03", "2026-11-17"]);
  });

  it("gives the nth and last weekday of a month", () => {
    expect(ruleDays(at("2026-11-10"), parseRule("FREQ=MONTHLY;BYDAY=2TU;COUNT=3")!, "2027-12-31")).toEqual(["2026-11-10", "2026-12-08", "2027-01-12"]);
    expect(ruleDays(at("2026-11-27"), parseRule("FREQ=MONTHLY;BYDAY=-1FR;COUNT=3")!, "2027-12-31")).toEqual(["2026-11-27", "2026-12-25", "2027-01-29"]);
  });

  it("skips months without the day, as RFC 5545 does, and reads negative month days", () => {
    expect(ruleDays(at("2027-01-31"), parseRule("FREQ=MONTHLY;COUNT=3")!, "2027-12-31")).toEqual(["2027-01-31", "2027-03-31", "2027-05-31"]);
    expect(ruleDays(at("2027-01-31"), parseRule("FREQ=MONTHLY;BYMONTHDAY=-1;COUNT=3")!, "2027-12-31")).toEqual(["2027-01-31", "2027-02-28", "2027-03-31"]);
  });

  it("gives yearly days, Feb 29 only in leap years", () => {
    expect(ruleDays({ day: "2028-02-29", time: null, tz: null }, parseRule("FREQ=YEARLY;COUNT=2")!, "2040-01-01")).toEqual(["2028-02-29", "2032-02-29"]);
    expect(ruleDays(at("2026-03-01"), parseRule("FREQ=YEARLY;BYMONTH=3,9;COUNT=3")!, "2030-01-01")).toEqual(["2026-03-01", "2026-09-01", "2027-03-01"]);
  });

  it("stops at UNTIL, comparing the time of day", () => {
    expect(ruleDays(at("2026-11-02"), parseRule("FREQ=DAILY;UNTIL=20261104T080000")!, "2027-01-01")).toEqual(["2026-11-02", "2026-11-03"]);
    expect(ruleDays(at("2026-11-02"), parseRule("FREQ=DAILY;UNTIL=20261104")!, "2027-01-01")).toEqual(["2026-11-02", "2026-11-03", "2026-11-04"]);
    expect(lastDay(at("2026-11-02"), parseRule("FREQ=DAILY;UNTIL=20261104T080000")!)).toBe("2026-11-03");
    expect(lastDay(at("2026-11-02"), parseRule("FREQ=WEEKLY;COUNT=3")!)).toBe("2026-11-16");
    expect(lastDay(at("2026-11-02"), parseRule("FREQ=WEEKLY")!)).toBeNull();
  });

  it("leaves only the first occurrence for a rule it does not expand", () => {
    expect(ruleDays(at("2026-11-02"), parseRule("FREQ=MONTHLY;BYSETPOS=1;BYDAY=MO,TU")!, "2027-01-01")).toEqual(["2026-11-02"]);
  });

  it("knows which rules are Reflect's own repeats", () => {
    const s = at("2026-11-02");
    expect(plainRepeat(s, parseRule("FREQ=DAILY")!)).toBe("daily");
    expect(plainRepeat(s, parseRule("FREQ=WEEKLY;BYDAY=MO")!)).toBe("weekly");
    expect(plainRepeat(s, parseRule("FREQ=WEEKLY;BYDAY=TU")!)).toBeNull();
    expect(plainRepeat(s, parseRule("FREQ=WEEKLY;INTERVAL=2")!)).toBeNull();
    expect(plainRepeat(s, parseRule("FREQ=MONTHLY;BYMONTHDAY=2")!)).toBe("monthly");
    expect(plainRepeat(s, parseRule("FREQ=MONTHLY;BYDAY=1MO")!)).toBeNull();
    expect(plainRepeat(s, parseRule("FREQ=YEARLY;BYMONTH=11")!)).toBe("yearly");
  });
});

describe("feed events in Reflect's calendar", () => {
  it("gives a timed event in the calendar's zone, read-only and marked with its calendar", () => {
    const c = parseIcs(cal(vevent("UID:a", "SUMMARY:Review", "DTSTART:20261117T150000Z", "DTEND:20261117T160000Z")));
    const [e, ...rest] = feedEvents(c, feed, "2026-11-01", "2026-11-30");
    expect(rest).toEqual([]);
    expect(e).toMatchObject({ id: "feed:f1:a", title: "Review", day: "2026-11-17", starts: "09:00", ends: "10:00", repeat: "none", tile: "work", feed: { id: "f1", name: "Work" } });
    expect(isFeedEvent(e!)).toBe(true);
    expect(isFeedEvent({})).toBe(false);
  });

  it("leaves out events outside the window and cancelled ones", () => {
    const c = parseIcs(cal(
      vevent("UID:a", "DTSTART;VALUE=DATE:20261001"),
      vevent("UID:b", "DTSTART;VALUE=DATE:20261110", "STATUS:CANCELLED"),
      vevent("UID:c", "DTSTART;VALUE=DATE:20261110"),
    ));
    expect(feedEvents(c, feed, "2026-11-01", "2026-11-30").map((e) => e.id)).toEqual(["feed:f1:c"]);
  });

  it("gives a whole-day event spanning days as one event a day (DTEND is exclusive)", () => {
    const c = parseIcs(cal(vevent("UID:trip", "SUMMARY:Trip", "DTSTART;VALUE=DATE:20261120", "DTEND;VALUE=DATE:20261123")));
    expect(feedEvents(c, feed, "2026-11-01", "2026-11-30").map((e) => [e.day, e.starts])).toEqual([["2026-11-20", null], ["2026-11-21", null], ["2026-11-22", null]]);
  });

  it("uses DURATION when there is no DTEND, and drops the end when it falls on another day", () => {
    const c = parseIcs(cal(
      vevent("UID:a", "DTSTART:20261117T090000", "DURATION:PT45M"),
      vevent("UID:b", "DTSTART:20261117T230000", "DTEND:20261118T010000"),
    ));
    expect(feedEvents(c, feed, "2026-11-01", "2026-11-30").map((e) => [e.starts, e.ends])).toEqual([["09:00", "09:45"], ["23:00", null]]);
  });

  it("keeps a plain repeat as one repeating event with its end day", () => {
    const c = parseIcs(cal(vevent("UID:w", "SUMMARY:Gym", "DTSTART;TZID=America/Chicago:20261102T070000", "DTEND;TZID=America/Chicago:20261102T080000", "RRULE:FREQ=WEEKLY;COUNT=4")));
    const es = feedEvents(c, feed, "2026-11-01", "2026-11-30");
    expect(es).toEqual([expect.objectContaining({ id: "feed:f1:w", day: "2026-11-02", starts: "07:00", ends: "08:00", repeat: "weekly", until: "2026-11-23" })]);
    expect(occurrences(es, "2026-11-01", "2026-12-31").map((o) => o.day)).toEqual(["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]);
  });

  it("drops a plain repeat that ended before the window", () => {
    const c = parseIcs(cal(vevent("UID:w", "DTSTART;VALUE=DATE:20260105", "RRULE:FREQ=WEEKLY;UNTIL=20260301")));
    expect(feedEvents(c, feed, "2026-11-01", "2026-11-30")).toEqual([]);
  });

  it("expands any other rule into single occurrences inside the window", () => {
    const c = parseIcs(cal(vevent("UID:x", "SUMMARY:Class", "DTSTART;TZID=America/Chicago:20261102T180000", "RRULE:FREQ=WEEKLY;BYDAY=MO,WE")));
    const es = feedEvents(c, feed, "2026-11-10", "2026-11-19");
    expect(es.map((e) => [e.id, e.day, e.starts, e.repeat])).toEqual([
      ["feed:f1:x:2026-11-11", "2026-11-11", "18:00", "none"],
      ["feed:f1:x:2026-11-16", "2026-11-16", "18:00", "none"],
      ["feed:f1:x:2026-11-18", "2026-11-18", "18:00", "none"],
    ]);
  });

  it("expands a UTC repeat so its local time follows daylight saving time", () => {
    const c = parseIcs(cal(vevent("UID:u", "DTSTART:20261026T140000Z", "RRULE:FREQ=WEEKLY")));
    // Chicago leaves daylight saving time on 2026-11-01.
    expect(feedEvents(c, feed, "2026-10-25", "2026-11-03").map((e) => [e.day, e.starts])).toEqual([["2026-10-26", "09:00"], ["2026-11-02", "08:00"]]);
  });

  it("leaves out EXDATE days and puts a RECURRENCE-ID replacement in its place", () => {
    const c = parseIcs(cal(
      vevent("UID:s", "SUMMARY:Sync", "DTSTART;TZID=America/Chicago:20261102T100000", "RRULE:FREQ=DAILY;COUNT=5", "EXDATE;TZID=America/Chicago:20261103T100000,20261104T100000"),
      vevent("UID:s", "SUMMARY:Sync (moved)", "RECURRENCE-ID;TZID=America/Chicago:20261105T100000", "DTSTART;TZID=America/Chicago:20261105T140000"),
    ));
    expect(feedEvents(c, feed, "2026-11-01", "2026-11-30").map((e) => [e.day, e.starts, e.title])).toEqual([
      ["2026-11-02", "10:00", "Sync"],
      ["2026-11-06", "10:00", "Sync"],
      ["2026-11-05", "14:00", "Sync (moved)"],
    ]);
  });

  it("reads a whole Google-style feed", () => {
    const text = [
      "BEGIN:VCALENDAR", "PRODID:-//Google Inc//Google Calendar 70.9054//EN", "VERSION:2.0", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "X-WR-CALNAME:Family", "X-WR-TIMEZONE:America/New_York",
      "BEGIN:VEVENT", "DTSTART:20261118T000000Z", "DTEND:20261118T010000Z", "DTSTAMP:20261117T000000Z", "UID:1abc@google.com",
      "DESCRIPTION:Bring the\\, salad.\\nSee you", "LOCATION:Home", "SEQUENCE:0", "STATUS:CONFIRMED",
      "SUMMARY:Dinner with Mom and Dad at the place we went to last year for the long", "  weekend", "TRANSP:OPAQUE", "END:VEVENT", "END:VCALENDAR", "",
    ].join("\r\n");
    const c = parseIcs(text);
    expect(c.name).toBe("Family");
    const [e] = feedEvents(c, { id: "g", name: c.name!, tile: null }, "2026-11-01", "2026-11-30");
    expect(e).toMatchObject({ day: "2026-11-17", starts: "19:00", ends: "20:00", note: "Bring the, salad.\nSee you", title: "Dinner with Mom and Dad at the place we went to last year for the long weekend", tile: null });
  });
});

describe("calendar addresses", () => {
  it("takes https and webcal, and refuses the rest", () => {
    expect(feedUrl("webcal://p01-caldav.icloud.com/published/2/abc")?.href).toBe("https://p01-caldav.icloud.com/published/2/abc");
    expect(feedUrl(" https://calendar.google.com/calendar/ical/x/private-y/basic.ics ")?.hostname).toBe("calendar.google.com");
    expect(feedUrl("http://example.com/a.ics")).toBeNull();
    expect(feedUrl("https://user:pw@example.com/a.ics")).toBeNull();
    expect(feedUrl("file:///etc/passwd")).toBeNull();
    expect(feedUrl("not a url")).toBeNull();
  });
});
