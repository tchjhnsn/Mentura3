import { describe, expect, it } from "vitest";
import { guestMayOpen } from "./guest-wall";

describe("guest wall", () => {
  it("lets a guest account open its meetings, invite links, sign-in and Settings", () => {
    expect(guestMayOpen("/meetings")).toBe(true);
    expect(guestMayOpen("/meetings/0b6c0c5e-0000-4000-8000-000000000000")).toBe(true);
    expect(guestMayOpen("/meetings/abc/live?x=1")).toBe(true);
    expect(guestMayOpen("/m/abcdefghijklmnop")).toBe(true);
    expect(guestMayOpen("/sign-in")).toBe(true);
    expect(guestMayOpen("/settings/account")).toBe(true);
  });

  it("walls every other page", () => {
    expect(guestMayOpen("/")).toBe(false);
    expect(guestMayOpen("/journal")).toBe(false);
    expect(guestMayOpen("/events")).toBe(false);
    expect(guestMayOpen("/marketplace")).toBe(false);
    expect(guestMayOpen("/meetingsx")).toBe(false);
    expect(guestMayOpen("/mx")).toBe(false);
    expect(guestMayOpen("")).toBe(false);
  });

  it("does not wall a request the proxy did not see", () => {
    expect(guestMayOpen(null)).toBe(true);
    expect(guestMayOpen(undefined)).toBe(true);
  });
});
