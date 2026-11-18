import { describe, expect, it } from "vitest";
import { AUSTIN, placeFor, birthdayName, birthdaysAhead, forecastUrl, leaveBy, looksLikeAddress, quietFriends, readForecast, sleepWeek, weatherWords, workoutsThisWeek } from "./world";
import { interestTerms, rankEvents, whyLine } from "./rank-events";

describe("weather", () => {
  it("asks Open-Meteo for the city's coordinates only", () => {
    const u = new URL(forecastUrl(AUSTIN));
    expect(u.host).toBe("api.open-meteo.com");
    expect([...u.searchParams.keys()].sort()).toEqual(["current", "daily", "forecast_days", "latitude", "longitude", "temperature_unit", "timezone"]);
    expect(u.searchParams.get("latitude")).toBe("30.2672");
  });
  it("forecasts the city for the county kept, else Austin", () => {
    expect(placeFor("Williamson County", "Texas").name).toBe("Round Rock");
    expect(placeFor("Travis", "TX")).toBe(AUSTIN);
    expect(placeFor("Cook", "IL")).toBe(AUSTIN);
    expect(placeFor(undefined, null)).toBe(AUSTIN);
  });
  it("reads a forecast and rounds it", () => {
    const f = readForecast({ current: { temperature_2m: 71.6, weather_code: 3 }, daily: { temperature_2m_max: [80.2], temperature_2m_min: [60.4], precipitation_probability_max: [20], weather_code: [61] } });
    expect(f).toEqual({ now: 72, high: 80, low: 60, rain: 20, words: "Cloudy" });
  });
  it("shows nothing rather than guesses when there is no temperature", () => {
    expect(readForecast({ current: {}, daily: {} })).toBeNull();
    expect(readForecast(null)).toBeNull();
    expect(readForecast("oops")).toBeNull();
  });
  it("names weather codes", () => {
    expect(weatherWords(0)).toBe("Clear");
    expect(weatherWords(63)).toBe("Rain");
    expect(weatherWords(95)).toBe("Thunderstorms");
    expect(weatherWords(null)).toBe("");
  });
});

describe("leave by", () => {
  it("takes the margin off the start", () => {
    expect(leaveBy("19:00")).toBe("18:30");
    expect(leaveBy("09:10", 15)).toBe("08:55");
    expect(leaveBy("00:10")).toBeNull();
    expect(leaveBy("7pm")).toBeNull();
  });
  it("knows an address from a note", () => {
    expect(looksLikeAddress("1100 Congress Ave, Austin")).toBe(true);
    expect(looksLikeAddress("Meet at 501 W 5th St")).toBe(true);
    expect(looksLikeAddress("Bring 2 books")).toBe(false);
    expect(looksLikeAddress(null)).toBe(false);
  });
});

describe("birthdays", () => {
  it("reads whose birthday a title names", () => {
    expect(birthdayName("Ana's birthday")).toBe("Ana");
    expect(birthdayName("James' birthday")).toBe("James");
    expect(birthdayName("Birthday: Sam Lee")).toBe("Sam Lee");
    expect(birthdayName("Birthday party planning")).toBeNull();
    expect(birthdayName("Dentist")).toBeNull();
  });
  it("lists birthdays ahead, soonest first and each person once", () => {
    const list = birthdaysAhead([
      { title: "Sam's birthday", day: "2026-11-25" },
      { title: "Ana's birthday", day: "2026-11-20" },
      { title: "Ana's birthday", day: "2026-11-20" },
      { title: "Old's birthday", day: "2026-11-01" },
      { title: "Far's birthday", day: "2027-02-01" },
    ], "2026-11-18");
    expect(list).toEqual([{ name: "Ana", day: "2026-11-20", inDays: 2 }, { name: "Sam", day: "2026-11-25", inDays: 7 }]);
  });
});

describe("friends", () => {
  it("puts overdue friends first, then long quiet ones without a rhythm", () => {
    const f = (name: string, since: number | null, overdue: boolean, every: string | null) => ({ name, since, overdue, every });
    const out = quietFriends([f("Recent", 3, false, null), f("Quiet", 40, false, null), f("Late", 20, true, "Every 2 weeks"), f("Never", null, false, null), f("Fine", 50, false, "Every 3 months")]);
    expect(out.map((x) => x.name)).toEqual(["Late", "Never", "Quiet"]);
  });
});

describe("body", () => {
  const acts = [
    { kind: "slept", day: "2026-11-18", minutes: 450 },
    { kind: "slept", day: "2026-11-15", minutes: 400 },
    { kind: "moderate", day: "2026-11-17", minutes: 30 },
    { kind: "strength", day: "2026-11-12", minutes: 30 },
    { kind: "vigorous", day: "2026-11-10", minutes: 30 },
  ];
  it("lays out a week of sleep, with nights not logged left empty", () => {
    const w = sleepWeek(acts, "2026-11-18");
    expect(w).toHaveLength(7);
    expect(w[0]!.day).toBe("2026-11-12");
    expect(w.map((n) => n.hours)).toEqual([null, null, null, 6.7, null, null, 7.5]);
  });
  it("counts a night logged twice once, by its newest entry", () => {
    const w = sleepWeek([{ kind: "slept", day: "2026-11-18", minutes: 420 }, { kind: "slept", day: "2026-11-18", minutes: 300 }], "2026-11-18");
    expect(w[6]!.hours).toBe(7);
  });
  it("counts workouts in the last seven days", () => {
    expect(workoutsThisWeek(acts, "2026-11-18")).toBe(2);
  });
});

describe("events for you", () => {
  const ev = (id: string, title: string, startsAt: string, extra: Partial<{ description: string; tags: string[]; forWhom: string }> = {}) => ({ id, title, startsAt, description: extra.description ?? null, tags: extra.tags ?? [], forWhom: extra.forWhom ?? null });
  const events = [
    ev("a", "Jazz night", "2026-11-19T01:00:00Z"),
    ev("b", "Founders breakfast", "2026-11-20T14:00:00Z", { forWhom: "looking for a co-founder" }),
    ev("c", "Reading group: ancient philosophy", "2026-11-21T00:00:00Z"),
    ev("d", "Philosophy pub talk", "2026-11-22T00:00:00Z"),
  ];
  const terms = interestTerms(["Ancient Philosophy", "ancient-philosophy", "co-founder", "", null]);

  it("turns interests into phrases once", () => {
    expect(terms).toEqual(["ancient philosophy", "co founder"]);
  });
  it("ranks people known going first, then interests, then time", () => {
    const known = new Map([["d", [{ id: "u1", name: "Ana", image: null }]]]);
    const r = rankEvents(events, terms, known);
    expect(r.map((x) => x.event.id)).toEqual(["d", "b", "c", "a"]);
    expect(r[0]!.score).toBe(4);
    expect(r[1]!.matched).toEqual(["co founder"]);
    expect(r[2]!.matched).toEqual(["ancient philosophy"]);
  });
  it("keeps time order when nothing is known", () => {
    expect(rankEvents(events, [], new Map()).map((x) => x.event.id)).toEqual(["a", "b", "c", "d"]);
  });
  it("says why", () => {
    expect(whyLine({ known: [{ id: "1", name: "Ana", image: null }, { id: "2", name: "Bo", image: null }], matched: ["jazz"] })).toBe("Ana and 1 other going, for your interest in jazz");
    expect(whyLine({ known: [], matched: ["jazz"] })).toBe("For your interest in jazz");
    expect(whyLine({ known: [], matched: [] })).toBe("");
  });
});
