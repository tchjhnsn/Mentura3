// Learning an instrument in Scholē (`@reflect/core/instruments`). The course is kept as a learn item on the person's
// shelves under Practice (medium course, way practice, its url the instrument's), each practice a session on it with
// its minutes (learn_item_session), and each piece learned a finished unit (learn_item_unit). No table of its own.
import { instrumentPart, instrumentView, type Instrument, type InstrumentView } from "@reflect/core/instruments";
import { addItem, addSession, getItem, listItems, listUnits, setUnitDone } from "./ways-store";

const today = () => new Date().toISOString().slice(0, 10);

/** The person's kept course on an instrument, or null before they first practise. */
async function keptId(userId: string, x: Instrument): Promise<string | null> {
  return (await listItems(userId)).find((i) => i.medium === "course" && i.url === x.url)?.id ?? null;
}

/** Keeps the course on the person's shelves under Practice, once. */
export async function keepInstrument(userId: string, x: Instrument): Promise<string> {
  return (await keptId(userId, x)) ?? addItem(userId, { medium: "course", way: "practice", status: "doing", title: x.name, by: x.by, url: x.url, parts: x.pieces.length, startedOn: today() });
}

export async function instrumentViewOf(userId: string, x: Instrument, day = today()): Promise<InstrumentView> {
  const kept = await keptId(userId, x);
  const [units, item] = kept ? await Promise.all([listUnits(userId, kept), getItem(userId, kept)]) : [[], null];
  return instrumentView(x, { kept, learned: units.filter((u) => u.doneOn).map((u) => u.unit), sessions: item?.sessions ?? [] }, day);
}

export async function instrumentPartOf(userId: string, x: Instrument, path: string): Promise<unknown> {
  return instrumentPart(await instrumentViewOf(userId, x), path);
}

/** Keeps a practice: its minutes and what was practised (a piece's title, or scales), on the person's day. */
export async function logPractice(userId: string, x: Instrument, minutes: number, what: string, day?: string): Promise<void> {
  if (!(Number.isFinite(minutes) && minutes >= 1 && minutes <= 600)) throw new Error("Pick the minutes.");
  const id = await keepInstrument(userId, x);
  await addSession(userId, id, { minutes: Math.round(minutes), note: what, ...(day ? { day } : {}) });
}

/** Marks a piece learned, or not. */
export async function setPieceLearned(userId: string, x: Instrument, pieceId: string, learned: boolean): Promise<void> {
  if (!x.pieces.some((p) => p.id === pieceId)) throw new Error("No such piece.");
  const id = await keepInstrument(userId, x);
  await setUnitDone(userId, id, pieceId, learned, x.pieces.length);
}
