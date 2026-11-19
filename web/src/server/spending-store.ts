// Food's spending on the server (`@reflect/core/spending`): receipts are hidden Home records of kind "receipt". A
// photo is read by a model that reads pictures, the person confirms what it read, and the photo is not kept.
import { generateText } from "ai";
import { counts } from "@reflect/core/household";
import { foodEstimate } from "@reflect/core/plan";
import { guessKind, linesText, monthSpend, parseLines, parseRead, type Receipt, type SpendKind } from "@reflect/core/spending";
import { visionModel } from "./chat-model";
import { householdOf } from "./household-store";
import { bodyOf } from "@reflect/core/life-body";
import { addLifeRecord, lifeRecord, lifeRecords, saveLifeRecord } from "./life-store";

export async function receipts(userId: string): Promise<Receipt[]> {
  return (await lifeRecords(userId, "home")).filter((r) => r.kind === "receipt").map((r) => {
    const b = bodyOf("receipt", r.body);
    return {
      id: r.id,
      store: b.store ?? "A store",
      day: b.day ?? r.createdAt.slice(0, 10),
      total: b.total ?? 0,
      kind: b.spend ?? "groceries",
      items: parseLines(b.items ?? ""),
      confirmed: b.confirmed === true,
    };
  }).sort((a, b) => b.day.localeCompare(a.day));
}

export const receiptOf = async (userId: string, id: string) => (await receipts(userId)).find((r) => r.id === id) ?? null;

const PROMPT = "Read this receipt. Answer with JSON only, in this shape: {\"store\": \"the store's name\", \"date\": \"YYYY-MM-DD\", \"total\": 0.00, \"items\": [{\"name\": \"the item in plain words\", \"price\": 0.00}]}. Leave out tax, totals, payment and discounts from items. Write each item's name in plain words (\"chicken thighs 3 lb\", not \"CHKN THGH 3LB\").";

/** Reads a receipt's photo and keeps what was read, not yet confirmed. Returns the receipt's id. */
export async function readReceipt(userId: string, image: Uint8Array, mediaType: string, today: string): Promise<string> {
  const model = visionModel();
  if (!model) throw new Error("Reading receipts needs a model that reads pictures, which is not set up here.");
  const { text } = await generateText({ model, messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image", image, mediaType }] }] });
  const read = parseRead(text, today);
  if (!read) throw new Error("Reflect could not read a receipt in that picture. Try a closer, flatter photo.");
  return addLifeRecord(userId, "home", "receipt", { store: read.store, day: read.day, total: String(read.total), spend: guessKind(read.store), items: linesText(read.items) });
}

async function own(userId: string, id: string) {
  const r = await lifeRecord(userId, id);
  if (!r || r.kind !== "receipt") throw new Error("No such receipt.");
  return r;
}

export async function setReceipt(userId: string, id: string, change: { spend?: SpendKind; confirmed?: boolean; dropLine?: number }): Promise<void> {
  const r = await own(userId, id);
  const body: Record<string, unknown> = { ...r.body };
  if (change.spend) body.spend = change.spend;
  if (change.confirmed !== undefined) body.confirmed = change.confirmed;
  if (change.dropLine !== undefined) {
    const lines = parseLines(String(body.items ?? ""));
    lines.splice(change.dropLine, 1);
    body.items = linesText(lines);
  }
  await saveLifeRecord(userId, id, body);
}

/** Food's money this month: what was spent, and what is set aside, from Food's cost or else the USDA low-cost plan. */
export async function foodMoney(userId: string, month: string) {
  const [home, household, list] = await Promise.all([lifeRecords(userId, "home"), householdOf(userId).catch(() => null), receipts(userId)]);
  const cost = home.find((r) => r.kind === "food")?.body.cost;
  const n = household ? counts(household.members, new Date().getUTCFullYear()) : { adults: 1, children: 0 };
  const usda = Math.round(foodEstimate("low", n.adults || 1, n.children));
  const set = typeof cost === "number" && cost > 0 ? cost : null;
  return { spent: monthSpend(list, month), allot: set ?? usda, from: set !== null ? ("set" as const) : ("usda" as const), people: (n.adults || 1) + n.children, receipts: list };
}
