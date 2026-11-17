import { afterEach, describe, expect, it, vi } from "vitest";
import { authUrl, graphBody, liveToken, pkce, pulledOf, REFLECT_PROP, SCOPE, toCal, type GraphEvent } from "./microsoft-calendar";

// Outlook Calendar through Microsoft Graph: the pure mappings both ways and the token refresh, with fetch faked.
// Nothing here reaches the network or the database.

const pulled = (e: GraphEvent) => { const p = pulledOf(e); if (!p) throw new Error("left out"); return p; };

describe("a Graph event read into Reflect", () => {
  it("maps a timed event to its start day and wall times", () => {
    const [e] = toCal(pulled({ id: "AAMk1", subject: "  Dentist  ", body: { contentType: "text", content: " Bring card " }, start: { dateTime: "2026-11-20T09:30:00.0000000", timeZone: "Central Standard Time" }, end: { dateTime: "2026-11-20T10:15:00.0000000" } }));
    expect(e).toMatchObject({ id: "microsoft:AAMk1", day: "2026-11-20", starts: "09:30", ends: "10:15", title: "Dentist", note: "Bring card", repeat: "none", tile: null, feed: { id: "microsoft", name: "Outlook Calendar" } });
  });

  it("drops an end on another day", () => {
    const [e] = toCal(pulled({ id: "x", subject: "Flight", start: { dateTime: "2026-11-20T22:00:00.0000000" }, end: { dateTime: "2026-11-21T06:00:00.0000000" } }));
    expect(e).toMatchObject({ day: "2026-11-20", starts: "22:00", ends: null });
  });

  it("spreads a whole-day event over its days, the end day excluded", () => {
    const out = toCal(pulled({ id: "t", subject: "Trip", isAllDay: true, start: { dateTime: "2026-12-01T00:00:00.0000000" }, end: { dateTime: "2026-12-04T00:00:00.0000000" } }));
    expect(out.map((e) => [e.id, e.day, e.starts])).toEqual([["microsoft:t", "2026-12-01", null], ["microsoft:t:1", "2026-12-02", null], ["microsoft:t:2", "2026-12-03", null]]);
  });

  it("leaves out cancelled events, Reflect's own pushes, and events with no start", () => {
    expect(pulledOf({ id: "c", isCancelled: true, start: { dateTime: "2026-11-20T09:00:00" } })).toBeNull();
    expect(pulledOf({ id: "r", start: { dateTime: "2026-11-20T09:00:00" }, singleValueExtendedProperties: [{ id: REFLECT_PROP, value: "abc" }] })).toBeNull();
    expect(pulledOf({ id: "n" })).toBeNull();
  });

  it("names an untitled event Busy and falls back to the preview for a note", () => {
    expect(pulled({ id: "b", subject: "", bodyPreview: "Agenda", start: { dateTime: "2026-11-20T09:00:00" } })).toMatchObject({ title: "Busy", note: "Agenda" });
  });
});

describe("a Reflect event written to Graph", () => {
  const base = { title: "Run", note: null, day: "2026-11-18", starts: "07:00", ends: null, repeat: "none" as const, until: null };

  it("writes a timed event in the mailbox's zone, an hour long when no end is given, marked with Reflect's id", () => {
    expect(graphBody(base, "Central Standard Time", "id-1", true)).toEqual({
      subject: "Run", body: { contentType: "text", content: "" }, isAllDay: false,
      start: { dateTime: "2026-11-18T07:00:00", timeZone: "Central Standard Time" }, end: { dateTime: "2026-11-18T08:00:00", timeZone: "Central Standard Time" },
      singleValueExtendedProperties: [{ id: REFLECT_PROP, value: "id-1" }],
    });
  });

  it("writes a whole-day event from midnight to the next midnight", () => {
    const b = graphBody({ ...base, starts: null }, "UTC", "id-2", true);
    expect(b).toMatchObject({ isAllDay: true, start: { dateTime: "2026-11-18T00:00:00" }, end: { dateTime: "2026-11-19T00:00:00" } });
  });

  it("maps each repeat to Graph's recurrence", () => {
    const rec = (repeat: "daily" | "weekly" | "monthly" | "yearly", until: string | null = null) => (graphBody({ ...base, repeat, until }, "UTC", "i", true) as { recurrence?: unknown }).recurrence;
    expect(rec("daily")).toEqual({ pattern: { type: "daily", interval: 1 }, range: { type: "noEnd", startDate: "2026-11-18" } });
    expect(rec("weekly", "2026-12-31")).toEqual({ pattern: { type: "weekly", interval: 1, daysOfWeek: ["wednesday"], firstDayOfWeek: "sunday" }, range: { type: "endDate", startDate: "2026-11-18", endDate: "2026-12-31" } });
    expect(rec("monthly")).toMatchObject({ pattern: { type: "absoluteMonthly", dayOfMonth: 18 } });
    expect(rec("yearly")).toMatchObject({ pattern: { type: "absoluteYearly", dayOfMonth: 18, month: 11 } });
  });

  it("clears a dropped repeat on a change and does not send the property again", () => {
    const b = graphBody(base, "UTC", "i", false) as Record<string, unknown>;
    expect(b.recurrence).toBeNull();
    expect(b.singleValueExtendedProperties).toBeUndefined();
  });
});

describe("signing in to Microsoft", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("asks for the calendar scopes with a PKCE S256 challenge at the common endpoint", () => {
    vi.stubEnv("MICROSOFT_CLIENT_ID", "client-1");
    const { verifier, challenge } = pkce();
    expect(verifier).toMatch(/^[\w-]{43}$/);
    const u = new URL(authUrl("https://reflect.example", "st", challenge));
    expect(u.origin + u.pathname).toBe("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ client_id: "client-1", response_type: "code", redirect_uri: "https://reflect.example/api/connect/microsoft/callback", scope: SCOPE, state: "st", code_challenge: challenge, code_challenge_method: "S256" });
    expect(SCOPE.split(" ")).toEqual(expect.arrayContaining(["offline_access", "Calendars.ReadWrite", "User.Read"]));
  });
});

describe("keeping the access token live", () => {
  const now = Date.parse("2026-11-17T12:00:00Z");
  const fake = (res: Response) => vi.fn(async (..._args: Parameters<typeof fetch>) => res);

  it("uses the held token while it has more than a minute left", async () => {
    const f = fake(new Response("{}"));
    await expect(liveToken({ access: "a1", refresh: "r1", expiresAt: now + 5 * 60_000 }, now, f)).resolves.toEqual({ token: "a1", renewed: null });
    expect(f).not.toHaveBeenCalled();
  });

  it("refreshes near expiry and keeps the rotated refresh token", async () => {
    const f = fake(Response.json({ access_token: "a2", refresh_token: "r2", expires_in: 3599 }));
    await expect(liveToken({ access: "a1", refresh: "r1", expiresAt: now + 30_000 }, now, f)).resolves.toEqual({ token: "a2", renewed: { access: "a2", refresh: "r2", expiresIn: 3599 } });
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("https://login.microsoftonline.com/common/oauth2/v2.0/token");
    const sent = new URLSearchParams(String(init!.body));
    expect(sent.get("grant_type")).toBe("refresh_token");
    expect(sent.get("refresh_token")).toBe("r1");
    expect(sent.get("scope")).toBe(SCOPE);
  });

  it("keeps the old refresh token when Microsoft sends none", async () => {
    const f = fake(Response.json({ access_token: "a3", expires_in: 3600 }));
    await expect(liveToken({ access: null, refresh: "r1", expiresAt: null }, now, f)).resolves.toMatchObject({ renewed: { refresh: "r1" } });
  });

  it("asks to connect again with no refresh token, and says when Microsoft refuses", async () => {
    await expect(liveToken({ access: "a1", refresh: null, expiresAt: now - 1 }, now, fake(new Response("{}")))).rejects.toThrow(/connecting again/);
    await expect(liveToken({ access: null, refresh: "r1", expiresAt: null }, now, fake(new Response("{}", { status: 400 })))).rejects.toThrow(/refused the sign-in \(400\)/);
  });
});
