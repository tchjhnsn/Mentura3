// Home cards (`@reflect/core/home-cards`) kept as hidden `card` life records in the home app, so no migration: the
// whole card is sealed as JSON in the record's `card` field, with its title, tile and days beside it. Removing a
// card removes the record (kept with its removal time, as every life record is).
import { randomUUID } from "node:crypto";
import { cardsToday, markToday, newCard, readCard, toggleItem, type HomeCard, type NewCard } from "@reflect/core/home-cards";
import { addLifeRecord, lifeRecords, removeLifeRecord, saveLifeRecord } from "./life-store";

/** The record's fields; the card's id is the record's, so it is not kept in the JSON. */
function bodyOf(c: HomeCard) {
  const card = JSON.stringify({ ...c, id: undefined });
  // The record's long field keeps 20,000 characters; a card longer than that would be cut and lost.
  if (card.length > 20000) throw new Error("The card is too long; give fewer words or items.");
  return { title: c.title, tile: c.tile, start: c.start, end: c.end, card };
}

/** Every card the person keeps, ended ones too, each with its record's id. */
export async function homeCards(userId: string): Promise<HomeCard[]> {
  const recs = (await lifeRecords(userId, "home")).filter((r) => r.kind === "card");
  return recs.flatMap((r) => {
    try {
      const c = readCard({ ...JSON.parse(String(r.body.card ?? "")), id: r.id });
      return c ? [c] : [];
    } catch {
      return [];
    }
  });
}

/** The cards Home shows today. */
export async function homeCardsToday(userId: string, today: string): Promise<HomeCard[]> {
  return cardsToday(await homeCards(userId), today);
}

/** Places a card; the error in words when it cannot be one. */
export async function addHomeCard(userId: string, input: NewCard, today: string): Promise<HomeCard> {
  const c = newCard(input, today, randomUUID(), new Date().toISOString());
  if ("error" in c) throw new Error(c.error);
  const id = await addLifeRecord(userId, "home", "card", bodyOf(c));
  return { ...c, id };
}

async function cardOf(userId: string, id: string): Promise<HomeCard> {
  const c = (await homeCards(userId)).find((x) => x.id === id);
  if (!c) throw new Error("No such card.");
  return c;
}

export async function removeHomeCard(userId: string, id: string): Promise<void> {
  await cardOf(userId, id);
  await removeLifeRecord(userId, id);
}

/** Toggles one checklist item, or marks a streak card's day; returns the card as it now is. */
export async function checkHomeItem(userId: string, id: string, item: number | null, today: string): Promise<HomeCard> {
  const c = await cardOf(userId, id);
  const next = c.content.kind === "streak" ? markToday(c, today) : toggleItem(c, item ?? -1);
  if (next === c) throw new Error(c.content.kind === "checklist" ? "No such item." : "Only a checklist or a streak card has items to check.");
  await saveLifeRecord(userId, id, bodyOf(next));
  return next;
}
