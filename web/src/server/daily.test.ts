import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./meetings-store", () => ({ setDailyRoom: vi.fn() }));

import { alreadyExists, canUseDaily, createRoomBody, dailyRoomName, prebuiltUrl, roomExp, tokenBody } from "./daily";

describe("daily helpers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is off without the key", () => {
    vi.stubEnv("DAILY_API_KEY", "");
    expect(canUseDaily()).toBe(false);
    vi.stubEnv("DAILY_API_KEY", "k");
    expect(canUseDaily()).toBe(true);
  });

  it("names the room from the meeting id", () => {
    const n = dailyRoomName("3F2504E0-4F89-11D3-9A0C-0305E82C3301");
    expect(n).toBe("m-3f2504e04f8911d39a0c0305e82c3301");
    expect(n).toMatch(/^[a-z0-9-]{1,41}$/);
  });

  it("expires the room an hour after the planned end, never in the past", () => {
    const m = { startsAt: "2026-11-20T15:00:00.000Z", minutes: 45 };
    const before = new Date("2026-11-20T14:55:00.000Z");
    expect(roomExp(m, before)).toBe(Date.parse("2026-11-20T16:45:00.000Z") / 1000);
    const late = new Date("2026-11-20T16:00:00.000Z");
    expect(roomExp(m, late)).toBe(Date.parse("2026-11-20T17:00:00.000Z") / 1000);
    expect(roomExp({ startsAt: null, minutes: 45 })).toBeNull();
  });

  it("makes a private room with a lobby and no recording or transcription", () => {
    const b = createRoomBody("m-abc", 1_800_000_000);
    expect(b).toEqual({
      name: "m-abc",
      privacy: "private",
      properties: {
        exp: 1_800_000_000, eject_at_room_exp: true, enable_prejoin_ui: true, enable_knocking: true,
        enable_chat: true, enable_screenshare: true, enable_recording: null, enable_transcription_storage: false,
      },
    });
    expect(JSON.stringify(b)).not.toMatch(/auto_start_transcription|start_cloud_recording/);
  });

  it("gives the host an owner token and a guest a knocking one, both scoped to the room", () => {
    expect(tokenBody("m-abc", { userName: " Ada  L ", isOwner: true, exp: 5 })).toEqual({ properties: { room_name: "m-abc", user_name: "Ada L", is_owner: true, knocking: false, exp: 5 } });
    expect(tokenBody("m-abc", { userName: "", isOwner: false, exp: 5 }).properties).toMatchObject({ user_name: "Guest", is_owner: false, knocking: true });
  });

  it("puts the token on the room URL", () => {
    expect(prebuiltUrl("https://x.daily.co/m-abc", "tok.en")).toBe("https://x.daily.co/m-abc?t=tok.en");
  });

  it("reads Daily's room-exists error", () => {
    expect(alreadyExists({ error: "invalid-request-error", info: "a room named m-abc already exists" })).toBe(true);
    expect(alreadyExists({ error: "invalid-request-error", info: "missing required field" })).toBe(false);
    expect(alreadyExists(null)).toBe(false);
  });
});
