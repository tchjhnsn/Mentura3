import { describe, expect, it } from "vitest";
import { cookieDomainOf, hrefOn, polisHostOf, sideOfPath } from "./sides";

describe("sides", () => {
  it("puts each page on one side, or neither", () => {
    expect(sideOfPath("/")).toBe("home");
    expect(sideOfPath("/journal")).toBe("home");
    expect(sideOfPath("/life/friends")).toBe("home");
    expect(sideOfPath("/v")).toBe("polis");
    expect(sideOfPath("/events/abc?x=1")).toBe("polis");
    expect(sideOfPath("/adventures")).toBe("polis");
    expect(sideOfPath("/p/torian/post")).toBe("polis");
    expect(sideOfPath("/life/polis?k=standing")).toBe("polis");
    expect(sideOfPath("/pa")).toBe("home");
    expect(sideOfPath("/chat")).toBeNull();
    expect(sideOfPath("/settings/account")).toBeNull();
    expect(sideOfPath("/meetings/abc")).toBeNull();
    expect(sideOfPath("/m/token")).toBeNull();
    expect(sideOfPath("/marketplace")).toBeNull();
  });

  it("finds the shared host only for a custom domain", () => {
    expect(cookieDomainOf("https://mentura.xyz")).toBe("mentura.xyz");
    expect(cookieDomainOf("https://www.mentura.xyz/")).toBe("mentura.xyz");
    expect(cookieDomainOf("https://reflect-wheat-three.vercel.app")).toBeNull();
    expect(cookieDomainOf("http://localhost:3000")).toBeNull();
    expect(cookieDomainOf(undefined)).toBeNull();
    expect(polisHostOf("https://mentura.xyz")).toBe("polis.mentura.xyz");
  });

  it("links across hosts only when the sides have their own", () => {
    const two = { home: "https://mentura.xyz", polis: "https://polis.mentura.xyz" };
    expect(hrefOn("/events", "home", two)).toBe("https://polis.mentura.xyz/events");
    expect(hrefOn("/v", "home", two)).toBe("https://polis.mentura.xyz/");
    expect(hrefOn("/v", "polis", two)).toBe("/");
    expect(hrefOn("/journal", "polis", two)).toBe("https://mentura.xyz/journal");
    expect(hrefOn("/chat", "polis", two)).toBe("/chat");
    expect(hrefOn("/events", "home", { home: "https://x.vercel.app", polis: null })).toBe("/events");
  });
});
