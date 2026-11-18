// The dashboard beyond its page (dashboard, 2026-11-18): the glance a home-screen bookmark opens, the morning brief,
// the household's and a kept member's view, and the counts of what people tap. Only plain logic lives here, so it is
// tested without a database; ./dashboard-today.ts reads the records.

/** A calendar item as the dashboard shows it. */
export type DayItem = { id: string; day: string; title: string; when: string; starts: string | null; note?: string | null; href: string; tile_label?: string };

/** The next item today: the first not yet started (or all day), else the first of the day, else none. */
export function nextItem<T extends Pick<DayItem, "starts">>(todays: readonly T[], clock: string): T | null {
  return todays.find((e) => !e.starts || e.starts >= clock) ?? todays[0] ?? null;
}

/** The facts the glance, the brief, `/api/dashboard` and `dashboard_today` share. */
export type TodayFacts = {
  day: string;
  next: DayItem | null;
  today: DayItem[];
  tomorrow: DayItem[];
  people: { name: string; why: "wants to connect" | "wrote to you"; text: string; href: string }[];
  money: { left_to_allot: number; allotted: number; take_home: number; href: string };
  events: { id: string; title: string; starts_at: string | null; venue: string | null; going: boolean; href: string }[];
  cards: { id: string; title: string; tile: string; summary: string }[];
};

const dollars = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The morning brief in plain words: a subject line and a few short lines, from the same facts as the dashboard. */
export function briefOf(f: TodayFacts, name = ""): { subject: string; lines: string[] } {
  const lines: string[] = [];
  const hello = name ? `Good morning, ${name}.` : "Good morning.";
  lines.push(hello);
  if (f.today.length) {
    const first = f.next ?? f.today[0]!;
    lines.push(`${plural(f.today.length, "thing", "things")} on your calendar today. First: ${first.title}${first.starts ? ` at ${first.when}` : " (all day)"}.`);
  } else lines.push("Nothing on your calendar today.");
  if (f.people.length) {
    const names = [...new Set(f.people.map((p) => p.name))];
    lines.push(`Waiting on you: ${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""}.`);
  }
  if (f.money.take_home > 0) lines.push(f.money.left_to_allot < 0 ? `Your budget is over by ${dollars(-f.money.left_to_allot)} a month.` : `${dollars(f.money.left_to_allot)} left to allot this month.`);
  const going = f.events.find((e) => e.going);
  if (going) lines.push(`Going: ${going.title}.`);
  const subject = f.next ? `Today: ${f.next.title}` : f.people.length ? `Today: ${plural(f.people.length, "person", "people")} waiting` : "Your day";
  return { subject, lines };
}

/** Whether an item names a member: their first name (or full name) as a whole word in its title or note. */
export function namesMember(text: string | null | undefined, name: string): boolean {
  const t = (text ?? "").toLowerCase();
  const full = name.trim().toLowerCase();
  if (!t || !full) return false;
  const first = full.split(/\s+/)[0]!;
  const word = (w: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}('s)?($|[^\\p{L}\\p{N}])`, "u").test(t);
  return word(full) || (first.length >= 2 && word(first));
}

/** The middle value, or null for none. */
export function median(xs: readonly number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
}

/** One recorded dashboard event (migration 0054). */
export type DashEvent = { kind: "open" | "tap" | "first_act"; card: string; ms: number | null };

/** What the owner sees: taps per card, most first, opens, and the median time from opening to the first act. */
export function usageOf(rows: readonly DashEvent[]): { opens: number; taps: { card: string; taps: number }[]; firstActs: number; medianMs: number | null } {
  const taps = new Map<string, number>();
  const firsts: number[] = [];
  let opens = 0;
  for (const r of rows) {
    if (r.kind === "open") opens++;
    else if (r.kind === "tap") taps.set(r.card, (taps.get(r.card) ?? 0) + 1);
    else if (r.ms !== null) firsts.push(r.ms);
  }
  return { opens, taps: [...taps].map(([card, n]) => ({ card, taps: n })).sort((a, b) => b.taps - a.taps || a.card.localeCompare(b.card)), firstActs: firsts.length, medianMs: median(firsts) };
}

/** A beacon's body checked, or null: a known kind, a card id, and for a first act the milliseconds (at most an hour). */
export function cleanDashEvent(raw: unknown): DashEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const kind = o.kind;
  if (kind !== "open" && kind !== "tap" && kind !== "first_act") return null;
  const card = typeof o.card === "string" ? o.card : kind === "open" ? "page" : "";
  if (!/^[a-z0-9-]{1,40}$/.test(card)) return null;
  if (kind !== "first_act") return { kind, card, ms: null };
  const ms = typeof o.ms === "number" && Number.isFinite(o.ms) ? Math.round(o.ms) : NaN;
  return ms >= 0 && ms <= 3_600_000 ? { kind, card, ms } : null;
}

/** Whether the person is Reflect's owner: the open-mode owner, or an email named in `REFLECT_OWNER_EMAILS`. */
export function isOwnerOf(user: { id: string; email?: string | null }, ownerId: string, emails = ""): boolean {
  if (user.id === ownerId) return true;
  const e = (user.email ?? "").trim().toLowerCase();
  return Boolean(e) && emails.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).includes(e);
}

/** Who sends the brief, by env var names only: email through Resend, or web push with VAPID keys. Neither is built. */
export const BRIEF_SENDER_ENV = { email: ["RESEND_API_KEY", "REFLECT_BRIEF_FROM"], push: ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"], cron: ["CRON_SECRET"] } as const;
