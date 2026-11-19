// Writing one event as an iCalendar file (RFC 5545), so a person can put a meeting on any calendar app. The reading
// half is ./ics.ts. Pure: no I/O, and no clock unless given one.
//
// What it writes: a VCALENDAR with one VEVENT, its UID, DTSTAMP, DTSTART and DTEND in UTC (with Z), SUMMARY, and,
// when given, DESCRIPTION, LOCATION and URL. Lines end in CRLF and are folded at 75 octets; TEXT values escape
// backslashes, commas, semicolons and new lines.

/** One event to write. Times are instants (ISO strings or anything Date.parse reads). */
export type IcsWriteEvent = {
  uid: string;
  title: string;
  start: string;
  end: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
};

/** A TEXT value escaped: backslash, comma and semicolon get a backslash, and a new line becomes \n. */
export function escapeText(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
}

/** An instant as a UTC DATE-TIME, such as 20261203T000000Z. Throws on a value that is not a date. */
export function utcStamp(iso: string | Date): string {
  const t = typeof iso === "string" ? Date.parse(iso) : iso.getTime();
  if (Number.isNaN(t)) throw new Error("That is not a date and time.");
  return new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Folds a content line at 75 octets: each further piece starts with a space. Never splits a character. */
export function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "", size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length ? 74 : 75; // a continuation line spends one octet on its leading space
    if (size + n > limit) {
      out.push(cur);
      cur = "";
      size = 0;
    }
    cur += ch;
    size += n;
  }
  out.push(cur);
  return out.map((l, i) => (i ? ` ${l}` : l)).join("\r\n");
}

/** The whole file for one event, CRLF line endings throughout and a CRLF at the end. */
export function writeIcs(e: IcsWriteEvent, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reflect//Meetings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(e.uid)}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(e.start)}`,
    `DTEND:${utcStamp(e.end)}`,
    `SUMMARY:${escapeText(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
    ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
    ...(e.url ? [`URL:${e.url.replace(/[\r\n]/g, "")}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
