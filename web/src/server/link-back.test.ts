import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkLinkBack, fetchPage, LINK_BACK_MAX_BYTES, privateAddress, urlProblem } from "./link-back";

// Link-back (doc "Profiles and accounts design guide", 2026-11-18): which urls Reflect refuses to fetch, redirects,
// the size cap, and the rel="me" check, over a stand-in fetch and resolver (no network).
const publicLookup = async () => ["93.184.216.34"];
const page = (html: string, init: ResponseInit = {}) => new Response(html, { status: 200, headers: { "content-type": "text/html" }, ...init });
const redirect = (to: string) => new Response(null, { status: 302, headers: { location: to } });

describe("urlProblem", () => {
  it("allows a plain https address with a dot", () => {
    expect(urlProblem("https://ana.dev/about")).toBeNull();
    expect(urlProblem("https://github.com/ana")).toBeNull();
  });
  it.each([
    ["http://ana.dev", /https/],
    ["ftp://ana.dev", /https/],
    ["https://127.0.0.1/", /IP address/],
    ["https://10.0.0.5/", /IP address/],
    ["https://[::1]/", /IP address/],
    ["https://2130706433/", /IP address/],
    ["https://0x7f000001/", /IP address/],
    ["https://localhost/", /this computer/],
    ["https://api.localhost/", /this computer/],
    ["https://intranet/", /full web address/],
    ["https://printer.local/", /private network/],
    ["https://user:pw@ana.dev/", /sign-in/],
    ["https://ana.dev:8443/", /port/],
    ["not a link", /not a link/],
  ])("refuses %s", (url, why) => {
    expect(urlProblem(url)).toMatch(why);
  });
});

describe("privateAddress", () => {
  it("knows private, loopback and link-local addresses from public ones", () => {
    for (const ip of ["10.1.2.3", "127.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) expect(privateAddress(ip), ip).toBe(true);
    for (const ip of ["93.184.216.34", "8.8.8.8", "2606:4700::1111"]) expect(privateAddress(ip), ip).toBe(false);
  });
});

describe("fetchPage", () => {
  it("refuses a refused url before fetching anything", async () => {
    const f = vi.fn();
    await expect(fetchPage("https://localhost/", { fetch: f, lookup: publicLookup })).rejects.toThrow(/this computer/);
    await expect(fetchPage("http://ana.dev/", { fetch: f, lookup: publicLookup })).rejects.toThrow(/https/);
    expect(f).not.toHaveBeenCalled();
  });

  it("refuses a host that resolves to a private address", async () => {
    const f = vi.fn();
    await expect(fetchPage("https://sneaky.example/", { fetch: f, lookup: async () => ["169.254.169.254"] })).rejects.toThrow(/private network/);
    expect(f).not.toHaveBeenCalled();
  });

  it("follows redirects by hand, checking each host, at most three", async () => {
    const f = vi.fn().mockResolvedValueOnce(redirect("https://b.example/")).mockResolvedValueOnce(redirect("/c")).mockResolvedValueOnce(page("<p>hi</p>"));
    await expect(fetchPage("https://a.example/", { fetch: f, lookup: publicLookup })).resolves.toBe("<p>hi</p>");
    expect(f.mock.calls.map((c) => c[0])).toEqual(["https://a.example/", "https://b.example/", "https://b.example/c"]);
    expect(f.mock.calls[0]![1]).toMatchObject({ redirect: "manual" });
  });

  it("refuses a redirect to a refused host", async () => {
    const f = vi.fn().mockResolvedValueOnce(redirect("http://b.example/")).mockResolvedValueOnce(redirect("https://127.0.0.1/"));
    await expect(fetchPage("https://a.example/", { fetch: f, lookup: publicLookup })).rejects.toThrow(/https/);
    await expect(fetchPage("https://a.example/", { fetch: f, lookup: publicLookup })).rejects.toThrow(/IP address/);
  });

  it("stops after three redirects", async () => {
    const f = vi.fn().mockImplementation(async () => redirect("https://loop.example/"));
    await expect(fetchPage("https://loop.example/", { fetch: f, lookup: publicLookup })).rejects.toThrow(/too many/);
    expect(f).toHaveBeenCalledTimes(4);
  });

  it("reads at most 1 MB", async () => {
    const big = "a".repeat(LINK_BACK_MAX_BYTES + 5000);
    const f = vi.fn().mockResolvedValue(page(big));
    expect((await fetchPage("https://a.example/", { fetch: f, lookup: publicLookup })).length).toBe(LINK_BACK_MAX_BYTES);
  });

  it("says when a page answers with an error or times out", async () => {
    await expect(fetchPage("https://a.example/", { fetch: vi.fn().mockResolvedValue(new Response("no", { status: 404 })), lookup: publicLookup })).rejects.toThrow(/404/);
    const timeout = Object.assign(new Error("t"), { name: "TimeoutError" });
    await expect(fetchPage("https://a.example/", { fetch: vi.fn().mockRejectedValue(timeout), lookup: publicLookup })).rejects.toThrow(/too long/);
  });
});

describe("checkLinkBack", () => {
  beforeEach(() => vi.stubEnv("REFLECT_URL", "https://reflect.example"));
  afterEach(() => vi.unstubAllEnvs());

  it("passes when the page links back with rel=me to the person's handle or id on this site", async () => {
    const deps = (html: string) => ({ fetch: vi.fn().mockResolvedValue(page(html)), lookup: publicLookup });
    expect(await checkLinkBack("https://ana.dev/", { userId: "u1", handle: "ana" }, deps('<a rel="me" href="https://reflect.example/p/ana">Reflect</a>'))).toBe(true);
    expect(await checkLinkBack("https://ana.dev/", { userId: "u1", handle: null }, deps('<link rel="me authn" href="https://reflect.example/p/u1">'))).toBe(true);
  });

  it("fails without rel=me, for another person, or on another site", async () => {
    const deps = (html: string) => ({ fetch: vi.fn().mockResolvedValue(page(html)), lookup: publicLookup });
    const who = { userId: "u1", handle: "ana" };
    expect(await checkLinkBack("https://ana.dev/", who, deps('<a href="https://reflect.example/p/ana">Reflect</a>'))).toBe(false);
    expect(await checkLinkBack("https://ana.dev/", who, deps('<a rel="me" href="https://reflect.example/p/bo">Reflect</a>'))).toBe(false);
    expect(await checkLinkBack("https://ana.dev/", who, deps('<a rel="me" href="https://elsewhere.example/p/ana">x</a>'))).toBe(false);
  });
});
