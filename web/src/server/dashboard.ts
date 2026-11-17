import { CHAT_PROMPT, readChatPart } from "@reflect/core/chat-journal";
import { lifeTone, TILE_KIND } from "@reflect/core/life";
import type { Facts } from "@/app/home-tiles";
import { listEntries } from "./journal-store";
import { learnView } from "./learn-store";
import { lifeActs, lifeRecords } from "./life-store";
import { planOf } from "./plan";

/** What the main dashboard and the three group dashboards read: each tile's tone and the income plan. */
export async function dashboardFacts(userId: string) {
  const [learn, all, records, acts, { plan }] = await Promise.all([learnView(userId), listEntries(userId, 40), lifeRecords(userId), lifeActs(userId), planOf(userId)]);
  const today = new Date().toISOString().slice(0, 10);
  const recent = all.filter((e) => e.promptId !== CHAT_PROMPT);
  const facts: Facts = {
    learn: { underway: learn.books.some((b) => b.status === "reading"), stated: learn.books.length > 0 || learn.known.length > 0 },
    journal: { stated: recent.length > 0, open: recent.some((e) => !e.closedAt) },
    life: Object.fromEntries(Object.entries(TILE_KIND).map(([tile, t]) => [tile, lifeTone(t.app, t.kind, records.filter((r) => r.app === t.app), acts, today)])),
  };
  const chats = all.filter((e) => e.promptId === CHAT_PROMPT).slice(0, 5).map((c) => ({ id: c.id, title: c.parts.map((p) => readChatPart(p.text)).find((m) => m.who === "you")?.text ?? "A chat" }));
  return { facts, plan, today, chats };
}
