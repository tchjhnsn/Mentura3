// The meeting call on Daily (daily.co), embedded as Daily Prebuilt in the live page (doc "Mentura meetings and
// building-only Mentura design guide", 2026-11-19). It runs only when DAILY_API_KEY is set; otherwise canUseDaily()
// is false and the meeting's own call link is used. Each meeting gets one private room, named from its id, with a
// lobby: the host's token is an owner's and admits guests, whose tokens knock. No recording and no transcription.
// The key is read by name only and never logged. Daily REST API: https://docs.daily.co/reference/rest-api
// (rooms/create-room, meeting-tokens/create-meeting-token).
import { endsAt } from "@reflect/core/meetings";
import { setDailyRoom, type MeetingView } from "./meetings-store";
import { outsideFetch } from "@/server/outside";

export const DAILY_ENV = "DAILY_API_KEY";
export const DAILY_API = "https://api.daily.co/v1";
/** The room closes (and ejects everyone) this many minutes after the planned end. */
export const ROOM_AFTER_MIN = 60;

/** Whether this deployment can run calls on Daily. */
export const canUseDaily = () => !!process.env[DAILY_ENV];

// ---- Pure helpers (tested in ./daily.test.ts) ----

/** The room's name for a meeting: "m-" and the meeting id without dashes (only letters, digits and "-"). */
export const dailyRoomName = (meetingId: string) => `m-${meetingId.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

/** When the room expires, in Unix seconds: the planned end plus an hour, and never sooner than an hour from now.
 * Null when the meeting has no start. */
export function roomExp(m: Pick<MeetingView, "startsAt" | "minutes">, now = new Date()): number | null {
  const end = endsAt(m);
  if (!end) return null;
  const at = Math.max(Date.parse(end), now.getTime()) + ROOM_AFTER_MIN * 60_000;
  return Math.floor(at / 1000);
}

/** The room's properties: private, a lobby, prejoin, chat and screen sharing; no recording, no transcription. */
export const roomProperties = (exp: number) => ({
  exp,
  eject_at_room_exp: true,
  enable_prejoin_ui: true,
  enable_knocking: true,
  enable_chat: true,
  enable_screenshare: true,
  enable_recording: null,
  enable_transcription_storage: false,
});

/** The body of POST /rooms. */
export const createRoomBody = (name: string, exp: number) => ({ name, privacy: "private" as const, properties: roomProperties(exp) });

export type TokenOptions = { userName: string; isOwner: boolean; exp: number };

/** The body of POST /meeting-tokens: always scoped to the room; a guest's token knocks, the host's is an owner's. */
export const tokenBody = (room: string, o: TokenOptions) => ({
  properties: {
    room_name: room,
    user_name: o.userName.replace(/\s+/g, " ").trim().slice(0, 100) || "Guest",
    is_owner: o.isOwner,
    knocking: !o.isOwner,
    exp: o.exp,
  },
});

/** The room URL with the meeting token, as the iframe opens it. */
export function prebuiltUrl(roomUrl: string, token: string): string {
  const u = new URL(roomUrl);
  u.searchParams.set("t", token);
  return u.toString();
}

/** Whether a Daily error body says the room name is taken (so the room exists and is fetched instead). */
export const alreadyExists = (body: unknown) => {
  const info = body && typeof body === "object" ? String((body as { info?: unknown }).info ?? "") : "";
  return /already exists/i.test(info);
};

// ---- Network ----

async function daily<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T | null }> {
  const r = await outsideFetch()(`${DAILY_API}${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env[DAILY_ENV]}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await r.json().catch(() => null)) as T | null;
  return { ok: r.ok, status: r.status, data };
}

type DailyRoom = { name: string; url: string; config?: { exp?: number } };

/** A plain error for a Daily failure; never carries the key or the response. */
const failed = () => new Error("The call could not be set up on Daily just now. Try again in a moment.");

/**
 * The meeting's Daily room, made when missing: private, expiring an hour after the planned end, named from the
 * meeting id and saved on the meeting with setDailyRoom. A room whose expiry is too early (the meeting moved later)
 * gets its expiry moved. `hostId` is the meeting's host.
 */
export async function ensureRoom(hostId: string, meeting: Pick<MeetingView, "id" | "startsAt" | "minutes" | "dailyRoom">): Promise<{ name: string; url: string; exp: number }> {
  if (!canUseDaily()) throw new Error("Calls on Daily are not set up on this deployment.");
  const exp = roomExp(meeting);
  if (!exp) throw new Error("Pick the meeting's time first.");
  const name = meeting.dailyRoom ?? dailyRoomName(meeting.id);

  let room: DailyRoom | null = null;
  const got = await daily<DailyRoom>("GET", `/rooms/${encodeURIComponent(name)}`);
  if (got.ok && got.data?.url) {
    room = got.data;
    if ((room.config?.exp ?? 0) < exp) {
      const upd = await daily<DailyRoom>("POST", `/rooms/${encodeURIComponent(name)}`, { properties: { exp } });
      if (!upd.ok) throw failed();
    }
  } else if (got.status === 404) {
    const made = await daily<DailyRoom>("POST", "/rooms", createRoomBody(name, exp));
    if (made.ok && made.data?.url) room = made.data;
    else if (alreadyExists(made.data)) {
      const again = await daily<DailyRoom>("GET", `/rooms/${encodeURIComponent(name)}`);
      if (again.ok && again.data?.url) room = again.data;
    }
  }
  if (!room) throw failed();
  if (meeting.dailyRoom !== room.name) await setDailyRoom(hostId, meeting.id, room.name);
  return { name: room.name, url: room.url, exp };
}

/** A meeting token for one person in the room: an owner's for the host, a knocking guest's otherwise. */
export async function meetingToken(room: string, o: TokenOptions): Promise<string> {
  if (!canUseDaily()) throw new Error("Calls on Daily are not set up on this deployment.");
  const r = await daily<{ token?: string }>("POST", "/meeting-tokens", tokenBody(room, o));
  if (!r.ok || !r.data?.token) throw failed();
  return r.data.token;
}
