import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchIcs } from "./calendar-feeds";

// Fetching a subscribed calendar, with fetch stubbed: nothing here reaches the network or the database.
const ICS = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n";
const stub = (...responses: Response[]) => {
  const f = vi.fn();
  for (const r of responses) f.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", f);
  return f;
};

describe("fetching a calendar by its address", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fetches https and webcal addresses", async () => {
    const f = stub(new Response(ICS));
    await expect(fetchIcs("webcal://example.com/cal.ics")).resolves.toBe(ICS);
    expect(String(f.mock.calls[0]![0])).toBe("https://example.com/cal.ics");
  });

  it("refuses http, private hosts, and redirects to either", async () => {
    stub();
    await expect(fetchIcs("http://example.com/cal.ics")).rejects.toThrow(/https/);
    await expect(fetchIcs("https://127.0.0.1/cal.ics")).rejects.toThrow(/not a public calendar/);
    await expect(fetchIcs("https://localhost/cal.ics")).rejects.toThrow(/not a public calendar/);
    await expect(fetchIcs("https://192.168.1.4/cal.ics")).rejects.toThrow(/not a public calendar/);
    stub(new Response(null, { status: 302, headers: { location: "http://example.com/x.ics" } }));
    await expect(fetchIcs("https://example.com/cal.ics")).rejects.toThrow(/not https/);
    stub(new Response(null, { status: 302, headers: { location: "https://10.0.0.1/x.ics" } }));
    await expect(fetchIcs("https://example.com/cal.ics")).rejects.toThrow(/not a public calendar/);
  });

  it("follows an https redirect", async () => {
    stub(new Response(null, { status: 301, headers: { location: "/moved.ics" } }), new Response(ICS));
    await expect(fetchIcs("https://example.com/cal.ics")).resolves.toBe(ICS);
  });

  it("refuses what is not a calendar, too large, or an error, and never names the full address", async () => {
    const secret = "https://calendar.google.com/calendar/ical/me/private-abc123/basic.ics";
    stub(new Response("<html>sign in</html>"));
    await expect(fetchIcs(secret)).rejects.toThrow(/iCal format/);
    stub(new Response("x".repeat(3 * 1024 * 1024 + 10)));
    await expect(fetchIcs(secret)).rejects.toThrow(/too large/);
    stub(new Response("no", { status: 404 }));
    const err = await fetchIcs(secret).catch((e: Error) => e.message);
    expect(err).toContain("calendar.google.com");
    expect(err).not.toContain("private-abc123");
  });
});
