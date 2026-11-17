// Calendar subscriptions (Torian, 2026-11-17: "Calendar must SYNC with Google Calendar and other apps, not be
// rebuilt"). A person pastes a calendar's iCalendar address (Google Calendar's "Secret address in iCal format", an
// iCloud public calendar, Outlook's ICS link) and its events show in Reflect's calendar, read-only. This file is the
// pure half: it reads iCalendar text (RFC 5545) and turns its events into Reflect's calendar events for a window of
// days. Pure: no I/O.
//
// What it reads: VEVENT's UID, SUMMARY, DESCRIPTION, DTSTART, DTEND or DURATION (DATE and DATE-TIME, floating, UTC
// with Z, or with a TZID that the platform's time zone database knows), STATUS:CANCELLED, RRULE, EXDATE and
// RECURRENCE-ID. Folded lines are unfolded and escaped text unescaped. A repeat that maps onto Reflect's own repeats
// (every day, week, month or year, with an end day or a count) stays one repeating event; any other rule
// (INTERVAL above 1, several weekdays, "the second Tuesday", exceptions) is expanded into single occurrences inside
// the window. Rule parts it does not know (BYSETPOS, BYWEEKNO, BYYEARDAY, BYHOUR and the like) leave the first
// occurrence only, rather than guessing.

import { addDays, type CalEvent, type CalTile, type Repeat } from "./calendar";

/** A DATE or DATE-TIME: a day, a wall time ("HH:MM:SS", null for a whole day) and its zone ("UTC", a TZID, or null when floating). */
export type IcsTime = { day: string; time: string | null; tz: string | null };
export type IcsFreq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type IcsRule = {
  freq: IcsFreq;
  interval: number;
  count: number | null;
  until: IcsTime | null;
  /** BYDAY: weekday 0 (Sunday) to 6, with an ordinal (2 for the second, -1 for the last) or null for every one. */
  byDay: { n: number | null; wd: number }[];
  byMonthDay: number[];
  byMonth: number[];
  /** True when the rule has a part this reader does not expand. */
  unknown: boolean;
};
export type IcsEvent = {
  uid: string;
  summary: string;
  description: string | null;
  start: IcsTime;
  end: IcsTime | null;
  /** DURATION in seconds, when the event gives one instead of DTEND. */
  duration: number | null;
  rule: IcsRule | null;
  /** EXDATE days, each in the start's zone. */
  exdates: string[];
  recurrenceId: IcsTime | null;
  cancelled: boolean;
};
export type IcsCalendar = { name: string | null; tz: string | null; events: IcsEvent[] };

const WEEKDAY: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const MAX_EVENTS = 5000;

/** Unfolds folded lines (a line that starts with a space or a tab continues the one before) and splits on CRLF or LF. */
export function unfold(text: string): string[] {
  const out: string[] = [];
  for (const line of text.replace(/^﻿/, "").split(/\r\n|\n|\r/)) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) out[out.length - 1] += line.slice(1);
    else if (line) out.push(line);
  }
  return out;
}

/** Unescapes a TEXT value: \n or \N is a new line, and \, \; \\ stand for themselves. */
export function unescapeText(v: string): string {
  return v.replace(/\\([nN,;\\])/g, (_, c: string) => (c === "n" || c === "N" ? "\n" : c));
}

type Line = { name: string; params: Record<string, string>; value: string };

/** One content line: NAME;PARAM=VALUE;...:value. A colon inside a quoted parameter value does not end the name. */
export function contentLine(line: string): Line | null {
  let i = 0, quoted = false;
  for (; i < line.length; i++) {
    const c = line[i];
    if (c === '"') quoted = !quoted;
    else if (c === ":" && !quoted) break;
  }
  if (i >= line.length) return null;
  const head = line.slice(0, i), value = line.slice(i + 1);
  const parts: string[] = [];
  let cur = "";
  quoted = false;
  for (const c of head) {
    if (c === '"') quoted = !quoted;
    if (c === ";" && !quoted) { parts.push(cur); cur = ""; } else cur += c;
  }
  parts.push(cur);
  const name = (parts[0] ?? "").replace(/^.*\./, "").toUpperCase();
  const params: Record<string, string> = {};
  for (const p of parts.slice(1)) {
    const eq = p.indexOf("=");
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return { name, params, value };
}

/** A DATE or DATE-TIME value with its TZID, or null when it is not one. */
export function parseTime(value: string, params: Record<string, string> = {}): IcsTime | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const day = `${m[1]}-${m[2]}-${m[3]}`;
  if (Number.isNaN(Date.parse(`${day}T00:00:00Z`))) return null;
  if (!m[4] || params.VALUE === "DATE") return { day, time: null, tz: null };
  return { day, time: `${m[4]}:${m[5]}:${m[6]}`, tz: m[7] ? "UTC" : params.TZID ? params.TZID : null };
}

/** A DURATION (P1D, PT1H30M, P1W) in seconds, or null. */
export function parseDuration(v: string): number | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim());
  if (!m || v.trim() === "P" || v.trim().endsWith("T")) return null;
  const s = (Number(m[2] ?? 0) * 7 + Number(m[3] ?? 0)) * 86400 + Number(m[4] ?? 0) * 3600 + Number(m[5] ?? 0) * 60 + Number(m[6] ?? 0);
  return m[1] === "-" ? -s : s;
}

/** An RRULE value, or null when it has no frequency Reflect reads. */
export function parseRule(v: string): IcsRule | null {
  const parts = Object.fromEntries(v.split(";").map((p) => { const [k, x] = p.split("="); return [String(k).toUpperCase(), x ?? ""]; }));
  const freq = parts.FREQ as IcsFreq;
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) return null;
  const ints = (s: string | undefined) => (s ? s.split(",").map(Number).filter((n) => Number.isInteger(n) && n !== 0) : []);
  const byDay: IcsRule["byDay"] = [];
  let unknown = false;
  for (const d of parts.BYDAY ? String(parts.BYDAY).split(",") : []) {
    const m = /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/.exec(d.trim().toUpperCase());
    if (m) byDay.push({ n: m[1] ? Number(m[1]) : null, wd: WEEKDAY[m[2]!]! });
    else unknown = true;
  }
  const known = new Set(["FREQ", "INTERVAL", "COUNT", "UNTIL", "BYDAY", "BYMONTHDAY", "BYMONTH", "WKST"]);
  if (Object.keys(parts).some((k) => !known.has(k))) unknown = true;
  // An ordinal weekday in a yearly rule without BYMONTH counts weeks of the year, and weekly rules have no ordinals.
  if (byDay.some((d) => d.n !== null) && (freq === "WEEKLY" || freq === "DAILY" || (freq === "YEARLY" && !parts.BYMONTH))) unknown = true;
  if (freq === "YEARLY" && byDay.length && !parts.BYMONTH) unknown = true;
  const interval = Math.max(1, Math.min(1000, Number(parts.INTERVAL) || 1));
  const count = parts.COUNT && Number(parts.COUNT) > 0 ? Math.min(Number(parts.COUNT), 10000) : null;
  return { freq, interval, count, until: parts.UNTIL ? parseTime(String(parts.UNTIL)) : null, byDay, byMonthDay: ints(parts.BYMONTHDAY), byMonth: ints(parts.BYMONTH), unknown };
}

/** Reads iCalendar text: the calendar's name and zone, and its events. Lines it does not know are skipped. */
export function parseIcs(text: string): IcsCalendar {
  const cal: IcsCalendar = { name: null, tz: null, events: [] };
  const stack: string[] = [];
  let ev: Partial<IcsEvent> & { exdates: string[] } | null = null;
  let endTime: IcsTime | null = null;
  for (const raw of unfold(text)) {
    const l = contentLine(raw);
    if (!l) continue;
    if (l.name === "BEGIN") {
      const what = l.value.trim().toUpperCase();
      stack.push(what);
      if (what === "VEVENT" && stack.length === 2) { ev = { exdates: [], rule: null, description: null, duration: null, recurrenceId: null, cancelled: false }; endTime = null; }
      continue;
    }
    if (l.name === "END") {
      const what = stack.pop();
      if (what === "VEVENT" && ev && stack.length === 1) {
        if (ev.start && cal.events.length < MAX_EVENTS) {
          cal.events.push({
            uid: ev.uid ?? `${ev.start.day}:${ev.summary ?? ""}`, summary: ev.summary || "Busy", description: ev.description ?? null, start: ev.start,
            end: endTime, duration: ev.duration ?? null, rule: ev.rule ?? null, exdates: ev.exdates, recurrenceId: ev.recurrenceId ?? null, cancelled: ev.cancelled ?? false,
          });
        }
        ev = null;
      }
      continue;
    }
    const top = stack[stack.length - 1];
    if (top === "VCALENDAR" && stack.length === 1) {
      if (l.name === "X-WR-CALNAME" && l.value.trim()) cal.name = unescapeText(l.value).trim().slice(0, 200);
      if (l.name === "X-WR-TIMEZONE" && l.value.trim()) cal.tz = l.value.trim();
      continue;
    }
    if (top !== "VEVENT" || !ev) continue; // properties of an alarm, a time zone or a to-do are not events
    switch (l.name) {
      case "UID": ev.uid = l.value.trim(); break;
      case "SUMMARY": ev.summary = unescapeText(l.value).replace(/\s+/g, " ").trim().slice(0, 200); break;
      case "DESCRIPTION": ev.description = unescapeText(l.value).trim().slice(0, 2000) || null; break;
      case "DTSTART": ev.start = parseTime(l.value, l.params) ?? undefined; break;
      case "DTEND": endTime = parseTime(l.value, l.params); break;
      case "DURATION": ev.duration = parseDuration(l.value); break;
      case "RRULE": ev.rule = parseRule(l.value); break;
      case "RECURRENCE-ID": ev.recurrenceId = parseTime(l.value, l.params); break;
      case "STATUS": ev.cancelled = l.value.trim().toUpperCase() === "CANCELLED"; break;
      case "EXDATE":
        for (const v of l.value.split(",")) { const t = parseTime(v, l.params); if (t) ev.exdates.push(JSON.stringify(t)); }
        break;
    }
  }
  // EXDATE values are kept as times until the event's start zone is known, then turned into days in that zone.
  for (const e of cal.events) e.exdates = e.exdates.map((x) => { const t = JSON.parse(x) as IcsTime; return inZoneOf(t, e.start.tz).day; });
  return cal;
}

// ---- Time zones, through the platform's Intl time zone database ----

const fmt = new Map<string, Intl.DateTimeFormat>();
function formatter(zone: string): Intl.DateTimeFormat | null {
  if (fmt.has(zone)) return fmt.get(zone)!;
  try {
    const f = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    fmt.set(zone, f);
    return f;
  } catch {
    return null; // a zone the database does not know, such as a Windows name; its times are read as floating
  }
}
export const knownZone = (zone: string | null | undefined): zone is string => !!zone && formatter(zone) !== null;

/** An instant (milliseconds since the epoch) as a day and wall time in a zone. */
export function wallIn(ms: number, zone: string): { day: string; time: string } {
  const f = formatter(zone);
  if (!f) { const iso = new Date(ms).toISOString(); return { day: iso.slice(0, 10), time: iso.slice(11, 19) }; }
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === "24" ? "00" : p.hour}:${p.minute}:${p.second}` };
}
const wallMs = (day: string, time: string) => Date.parse(`${day}T${time}Z`);

/** The instant of a wall time in a zone (the earlier one in a fall-back hour, the later one past a spring-forward gap). */
export function instantOf(day: string, time: string, zone: string): number {
  const guess = wallMs(day, time);
  const off = (ms: number) => { const w = wallIn(ms, zone); return wallMs(w.day, w.time) - ms; };
  const first = guess - off(guess);
  const second = guess - off(first);
  return Math.min(first, second);
}

/** A time moved into another zone (null keeps it floating). A whole day, a floating time or an unknown zone stays as written. */
export function inZoneOf(t: IcsTime, zone: string | null): IcsTime {
  if (!t.time || !t.tz || !zone || t.tz === zone || !knownZone(zone)) return t;
  const ms = t.tz === "UTC" ? wallMs(t.day, t.time) : knownZone(t.tz) ? instantOf(t.day, t.time, t.tz) : null;
  if (ms === null) return t;
  return { ...wallIn(ms, zone), tz: zone };
}

// ---- Recurrence ----

const dayMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
const weekday = (d: string) => new Date(dayMs(d)).getUTCDay();
const ymd = (y: number, m: number, d: number) => { const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCMonth() === (((m - 1) % 12) + 12) % 12 && t.getUTCDate() === d ? t.toISOString().slice(0, 10) : null; };
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** The days of one month that a rule's BYMONTHDAY or BYDAY picks, or the start's day of the month. */
function monthDays(y: number, m: number, rule: IcsRule, startDay: number): string[] {
  const n = daysInMonth(y, m);
  if (rule.byMonthDay.length) return rule.byMonthDay.map((d) => ymd(y, m, d > 0 ? d : n + d + 1)).filter((d): d is string => d !== null);
  if (rule.byDay.length) {
    const out: string[] = [];
    for (const { n: ord, wd } of rule.byDay) {
      const all = Array.from({ length: n }, (_, i) => ymd(y, m, i + 1)!).filter((d) => weekday(d) === wd);
      if (ord === null) out.push(...all);
      else { const d = ord > 0 ? all[ord - 1] : all[all.length + ord]; if (d) out.push(d); }
    }
    return out;
  }
  const d = ymd(y, m, startDay);
  return d ? [d] : [];
}

/**
 * The days a rule falls on, in the start's own zone, in order, from the start through `last` (and at most `max`
 * occurrences, counting the start). The start always counts as the first occurrence, as RFC 5545 says. UNTIL is
 * compared with each occurrence's wall time in the start's zone.
 */
export function ruleDays(start: IcsTime, rule: IcsRule, last: string, max = 3000): string[] {
  const out = [start.day];
  if (rule.unknown) return out;
  const until = rule.until ? inZoneOf(rule.until, start.tz ?? null) : null;
  const within = (d: string) => !until || (until.time && start.time ? `${d}T${start.time}` <= `${until.day}T${until.time}` : d <= until.day);
  const limit = Math.min(rule.count ?? Infinity, max);
  const [sy, sm, sd] = start.day.split("-").map(Number) as [number, number, number];
  const okMonth = (d: string) => !rule.byMonth.length || rule.byMonth.includes(Number(d.slice(5, 7)));
  for (let k = 0; out.length < limit && k < 20000; k++) {
    let days: string[];
    let period: string;
    if (rule.freq === "DAILY") days = [period = addDays(start.day, k * rule.interval)];
    else if (rule.freq === "WEEKLY") {
      period = addDays(start.day, -((weekday(start.day) + 6) % 7) + 7 * k * rule.interval);
      const monday = period;
      const wds = rule.byDay.length ? rule.byDay.map((d) => d.wd) : [weekday(start.day)];
      days = [...new Set(wds)].map((wd) => addDays(monday, (wd + 6) % 7));
    } else if (rule.freq === "MONTHLY") {
      const mi = sm - 1 + k * rule.interval;
      const y = sy + Math.floor(mi / 12), m = (mi % 12) + 1;
      period = ymd(y, m, 1)!;
      days = monthDays(y, m, rule, sd);
    } else {
      const y = sy + k * rule.interval;
      period = ymd(y, 1, 1)!;
      days = (rule.byMonth.length ? rule.byMonth : [sm]).flatMap((m) => monthDays(y, m, rule, sd));
    }
    if (period > last) break;
    days = [...new Set(days)].filter((d) => d > start.day && okMonth(d) && (rule.freq !== "DAILY" || !rule.byDay.length || rule.byDay.some((b) => b.wd === weekday(d)))).sort();
    for (const d of days) {
      if (out.length >= limit || d > last || !within(d)) return out;
      out.push(d);
    }
  }
  return out;
}

// ---- Into Reflect's calendar ----

/** Where events came from: a calendar the person subscribes to, or their Google Calendar. */
export type FeedRef = { id: string; name: string; tile: CalTile | null };

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);
const plusSeconds = (day: string, time: string, s: number) => { const iso = new Date(wallMs(day, time) + s * 1000).toISOString(); return { day: iso.slice(0, 10), time: iso.slice(11, 19) }; };

/** How long an event lasts in seconds, and how many days a whole-day event covers. */
function length(e: IcsEvent): { seconds: number; days: number } {
  if (!e.start.time) {
    const end = e.end && !e.end.time ? e.end.day : e.duration ? addDays(e.start.day, Math.round(e.duration / 86400)) : addDays(e.start.day, 1);
    return { seconds: 0, days: Math.max(1, Math.min(60, Math.round((dayMs(end) - dayMs(e.start.day)) / 86400_000))) };
  }
  if (e.end?.time) {
    const a = e.start.tz && e.start.tz !== "UTC" && knownZone(e.start.tz) ? instantOf(e.start.day, e.start.time, e.start.tz) : wallMs(e.start.day, e.start.time);
    const endIn = inZoneOf(e.end, e.start.tz);
    const b = endIn.tz && endIn.tz !== "UTC" && knownZone(endIn.tz) ? instantOf(endIn.day, endIn.time!, endIn.tz) : wallMs(endIn.day, endIn.time!);
    return { seconds: Math.max(0, (b - a) / 1000), days: 1 };
  }
  return { seconds: Math.max(0, e.duration ?? 0), days: 1 };
}

/** The last day of a rule that ends (by UNTIL or COUNT), in the start's zone, or null for one that goes on. */
export function lastDay(start: IcsTime, rule: IcsRule): string | null {
  if (rule.until) {
    const u = inZoneOf(rule.until, start.tz);
    return start.time && u.time && start.time > u.time ? addDays(u.day, -1) : u.day;
  }
  if (rule.count) {
    const days = ruleDays(start, rule, addDays(start.day, 366 * 30), rule.count);
    return days.at(-1)!;
  }
  return null;
}

/** Which Reflect repeat a rule is, when it is exactly one: every day, week, month or year, with nothing else. */
export function plainRepeat(start: IcsTime, rule: IcsRule): Repeat | null {
  if (rule.unknown || rule.interval !== 1) return null;
  const [, m, d] = start.day.split("-").map(Number) as [number, number, number];
  const wd = weekday(start.day);
  const onlyStartDay = rule.byMonthDay.every((x) => x === d) && rule.byMonthDay.length <= 1;
  if (rule.freq === "DAILY") return !rule.byDay.length && !rule.byMonthDay.length && !rule.byMonth.length ? "daily" : null;
  if (rule.freq === "WEEKLY") return rule.byDay.every((b) => b.wd === wd && b.n === null) && rule.byDay.length <= 1 && !rule.byMonthDay.length && !rule.byMonth.length ? "weekly" : null;
  if (rule.freq === "MONTHLY") return !rule.byDay.length && onlyStartDay && !rule.byMonth.length ? "monthly" : null;
  return !rule.byDay.length && onlyStartDay && rule.byMonth.every((x) => x === m) && rule.byMonth.length <= 1 ? "yearly" : null;
}

/**
 * A calendar's events as Reflect calendar events for the days `from` through `to`, read-only and marked with the
 * calendar they came from. Times are moved into `zone` (the calendar's own zone by default). A plain repeat stays one
 * repeating event with its end day; anything else is expanded inside the window. Cancelled events, and occurrences
 * that EXDATE removes or a RECURRENCE-ID replaces, are left out; the replacement shows instead.
 */
export function feedEvents(cal: IcsCalendar, feed: FeedRef, from: string, to: string, zone: string | null = cal.tz): CalEvent[] {
  const target = knownZone(zone) ? zone : null;
  const out: CalEvent[] = [];
  const replaced = new Map<string, Set<string>>();
  for (const e of cal.events) if (e.recurrenceId) {
    const s = replaced.get(e.uid) ?? new Set<string>();
    const master = cal.events.find((x) => x.uid === e.uid && !x.recurrenceId);
    s.add(inZoneOf(e.recurrenceId, master?.start.tz ?? e.recurrenceId.tz).day);
    replaced.set(e.uid, s);
  }
  const base = (e: IcsEvent, id: string) => ({ id, tile: feed.tile, title: e.summary, note: e.description, recordId: null, feed: { id: feed.id, name: feed.name } });
  /** One occurrence starting on `day` (in the start's zone), moved into the target zone; a whole day spanning several days gives one per day. */
  const emit = (e: IcsEvent, day: string, id: string) => {
    const len = length(e);
    if (!e.start.time) {
      for (let i = 0; i < len.days; i++) {
        const d = addDays(day, i);
        if (d >= from && d <= to) out.push({ ...base(e, len.days > 1 ? `${id}:${i}` : id), day: d, starts: null, ends: null, repeat: "none", until: null });
      }
      return;
    }
    const s = inZoneOf({ day, time: e.start.time, tz: e.start.tz }, target);
    const endWall = plusSeconds(day, e.start.time, len.seconds);
    const en = len.seconds ? inZoneOf({ ...endWall, tz: e.start.tz }, target) : null;
    if (s.day < from || s.day > to) return;
    const ends = en && en.day === s.day && en.time! > s.time! ? hhmm(en.time) : null;
    out.push({ ...base(e, id), day: s.day, starts: hhmm(s.time), ends, repeat: "none", until: null });
  };
  for (const e of cal.events) {
    if (e.cancelled) continue;
    const id = `feed:${feed.id}:${e.uid}`;
    if (e.recurrenceId) { emit(e, e.start.day, `${id}:${e.start.day}`); continue; }
    if (!e.rule) { emit(e, e.start.day, id); continue; }
    const skip = new Set([...e.exdates, ...(replaced.get(e.uid) ?? [])]);
    const len = length(e);
    // A plain repeat stays one event when nothing about it changes from one occurrence to the next: no exceptions, a
    // single day, and a time that does not move when it is put in the target zone (floating, a whole day, or the same zone).
    const repeat = plainRepeat(e.start, e.rule);
    const steady = !e.start.time || !e.start.tz || !target || e.start.tz === target || !knownZone(e.start.tz);
    if (repeat && !skip.size && len.days === 1 && steady) {
      if (e.start.day > to) continue;
      const last = lastDay(e.start, e.rule);
      if (last !== null && last < from) continue;
      const startsAt = e.start.time ? hhmm(e.start.time) : null;
      const endsWall = e.start.time && len.seconds ? plusSeconds(e.start.day, e.start.time, len.seconds) : null;
      out.push({ ...base(e, id), day: e.start.day, starts: startsAt, ends: endsWall && endsWall.day === e.start.day ? hhmm(endsWall.time) : null, repeat, until: last });
      continue;
    }
    for (const d of ruleDays(e.start, e.rule, addDays(to, 1))) {
      if (skip.has(d) || addDays(d, len.days) < from) continue;
      emit(e, d, `${id}:${d}`);
    }
  }
  return out;
}

/** True for an event that came from a subscribed calendar or Google Calendar: it is read-only in Reflect. */
export const isFeedEvent = (e: Pick<CalEvent, "feed">) => !!e.feed;

/** A calendar address as the person pasted it, made fetchable: webcal:// is https://, and only https is accepted. */
export function feedUrl(raw: string): URL | null {
  const s = raw.trim().replace(/^webcals?:\/\//i, "https://");
  try {
    const u = new URL(s);
    return u.protocol === "https:" && u.hostname && !u.username && !u.password ? u : null;
  } catch {
    return null;
  }
}
