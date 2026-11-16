// Voice for Dialectic's rooms through Daily (daily.co), when DAILY_API_KEY is set. A room's voice channel is a Daily
// room named after it, made on first use, audio only, that expires after a day. Without the key, rooms run on chat.

const API = "https://api.daily.co/v1/rooms";

export const voiceOn = (): boolean => Boolean(process.env.DAILY_API_KEY);

/** The Daily room's address for a Dialectic room, made if it does not exist yet; null without a key or on failure. */
export async function voiceUrl(roomId: string): Promise<string | null> {
  const key = process.env.DAILY_API_KEY;
  if (!key || !/^[0-9a-f-]{36}$/i.test(roomId)) return null;
  const name = `reflect-${roomId}`;
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  try {
    const got = await fetch(`${API}/${name}`, { headers, cache: "no-store" });
    if (got.ok) return ((await got.json()) as { url: string }).url;
    const made = await fetch(API, {
      method: "POST", headers,
      body: JSON.stringify({ name, privacy: "public", properties: { start_video_off: true, start_audio_off: true, exp: Math.floor(Date.now() / 1000) + 86400 } }),
    });
    return made.ok ? ((await made.json()) as { url: string }).url : null;
  } catch {
    return null;
  }
}
