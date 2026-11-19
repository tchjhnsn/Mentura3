import { describe, expect, it } from "vitest";
import { frameVerdict, privateHost, siteUrl } from "./frame-check";

const O = "https://reflect.example.com";
const h = (o: Record<string, string>) => new Headers(o);

describe("frameVerdict", () => {
  it("allows a site with no framing headers", () => expect(frameVerdict(h({}), O)).toEqual({ ok: true }));
  it("refuses X-Frame-Options DENY and SAMEORIGIN", () => {
    expect(frameVerdict(h({ "x-frame-options": "DENY" }), O).ok).toBe(false);
    expect(frameVerdict(h({ "x-frame-options": "sameorigin" }), O).ok).toBe(false);
  });
  it("reads frame-ancestors", () => {
    expect(frameVerdict(h({ "content-security-policy": "default-src 'self'; frame-ancestors 'self'" }), O).ok).toBe(false);
    expect(frameVerdict(h({ "content-security-policy": "frame-ancestors 'none'" }), O).ok).toBe(false);
    expect(frameVerdict(h({ "content-security-policy": "frame-ancestors *" }), O).ok).toBe(true);
    expect(frameVerdict(h({ "content-security-policy": "frame-ancestors https://*.example.com" }), O).ok).toBe(true);
    expect(frameVerdict(h({ "content-security-policy": "script-src 'self'" }), O).ok).toBe(true);
  });
});

describe("siteUrl", () => {
  it("adds https to a bare name", () => expect(siteUrl("tcjcafe.com")?.href).toBe("https://tcjcafe.com/"));
  it("refuses other schemes, private hosts and credentials", () => {
    for (const t of ["javascript:alert(1)", "file:///etc/passwd", "http://localhost:3000", "http://127.0.0.1", "http://10.0.0.5", "http://192.168.1.1", "http://169.254.169.254/latest", "http://[::1]/", "https://a:b@example.com", "intranet", ""]) expect(siteUrl(t)).toBeNull();
  });
  it("knows private ranges", () => {
    expect(privateHost("172.20.1.1")).toBe(true);
    expect(privateHost("172.32.1.1")).toBe(false);
    expect(privateHost("example.com")).toBe(false);
  });
});
