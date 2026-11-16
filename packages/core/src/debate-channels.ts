/**
 * New debates from channels that publish them (Torian, 2026-11-16 19:56Z: "there are constantly debates taking place";
 * the channels named in the Dialectic design guide, approved 20:06Z). Each channel's public YouTube feed lists its last
 * fifteen uploads; shorts are left out, and each channel keeps only its whole debates. Pure: reading a feed, no I/O.
 */
import { yt, type CollectionItem } from "./collections";

export type DebateChannel = { name: string; id: string; keep: RegExp };

export const DEBATE_CHANNELS: readonly DebateChannel[] = [
  { name: "Jubilee", id: "UCJjSDX-jUChzOEyok9XYRJQ", keep: /\b(Surrounded|Middle Ground)\b/i },
  { name: "Open to Debate", id: "UCenxjWEkb0Sv67vejOgZ3Tg", keep: /\?/ },
  { name: "Oxford Union", id: "UCY7dD6waquGnKTZSumPMTlQ", keep: /Full Debate/i },
  { name: "Cambridge Union", id: "UCCYoxWaDf4WFTJIYNzor0gQ", keep: /Debate/i },
];

export const feedUrl = (c: DebateChannel) => `https://www.youtube.com/feeds/videos.xml?channel_id=${c.id}`;

const unescape = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export type FeedDebate = { item: CollectionItem; published: string };

/** A channel's feed read into its whole debates, newest first: watch links only (no shorts), titles the channel keeps. */
export function readChannelFeed(xml: string | null, c: DebateChannel): FeedDebate[] {
  if (!xml) return [];
  const out: FeedDebate[] = [];
  for (const e of xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []) {
    const link = e.match(/<link rel="alternate" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/)?.[1];
    const title = unescape(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim();
    const published = e.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
    if (!link || !title || !published || title.includes("#") || !c.keep.test(title)) continue;
    const d = new Date(published);
    const when = Number.isNaN(d.getTime()) ? "" : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    out.push({ item: yt("debate", link, title, c.name, `New from ${c.name}${when ? `, ${when}` : ""}.`), published });
  }
  return out.sort((a, b) => b.published.localeCompare(a.published));
}

/** The newest debates across channels within `days` of `now`, newest first, at most `n`, at most three a channel. */
export function newestDebates(feeds: readonly FeedDebate[][], now: Date, days = 45, n = 8): CollectionItem[] {
  const since = now.getTime() - days * 864e5;
  return feeds.flatMap((f) => f.filter((x) => Date.parse(x.published) >= since).slice(0, 3))
    .sort((a, b) => b.published.localeCompare(a.published)).slice(0, n).map((x) => x.item);
}
