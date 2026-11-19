"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateText } from "ai";
import type { MeetingPrep } from "@reflect/core/meetings";
import { afterAnswer, readRound, roundParams } from "@reflect/core/meetings-practice";
import { chatModel } from "@/server/chat-model";
import { meetingFor, prepOf } from "@/server/meetings-store";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { setMeetingPrepAction } from "@/server/actions/meeting-prep";
import { seedOf, ventureOf } from "@/server/actions/ventures";
import { draftPrompt, mergeDraft, readDraft } from "./draft";
import { isPrepKind, type PrepKind } from "./kinds";

// Meeting prep (design guide "Meeting prep", 2026-11-19): every change on the prep page reads the host's prep, changes
// one thing and keeps it whole through set_meeting_prep, the entry the chat and MCP run, so each change is in the
// change log and can be undone. Only the host gets here: prepOf refuses anyone else.

const newId = () => randomUUID().replace(/-/g, "").slice(0, 12);
const text = (form: FormData, k: string) => String(form.get(k) ?? "").trim();
const isHttps = (v: string) => /^https:\/\/\S+$/.test(v) && v.length <= 2000;
const page = (id: string) => `/meetings/${id}/prep`;
const withError = (path: string, error: string) => `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}`;

/** Reads the host's prep, changes it, and keeps it whole through set_meeting_prep. */
async function keep(userId: string, meetingId: string, change: (p: MeetingPrep) => MeetingPrep): Promise<void> {
  const prep = change(await prepOf(userId, meetingId));
  await fromPage(setMeetingPrepAction, userId, { id: meetingId, prep });
}

const again = (id: string) => {
  revalidatePath(page(id));
  revalidatePath(`/meetings/${id}`);
};

class Plain extends Error {}

/**
 * Add (with no item id) or edit one item of the prep from its small form: a key point, a question and its answer, an
 * asset (name, optional https link, notes) or a fact about the other person (it must have its https source). An
 * asset whose link is not https is kept without it, so its notes are not lost, and the page says so.
 */
export async function savePrepItemAction(meetingId: string, kind: string, itemId: string, form: FormData): Promise<void> {
  const user = await requireUser();
  if (!isPrepKind(kind)) throw new Error("No such part of the prep.");
  const back = itemId ? `${page(meetingId)}?edit=${kind}:${itemId}` : `${page(meetingId)}?add=${kind}`;
  let note = null as string | null;
  try {
    await keep(user.id, meetingId, (p) => {
      switch (kind) {
        case "point": {
          const v = text(form, "text").slice(0, 500);
          if (!v) throw new Plain("Write the point.");
          const keyPoints = [...p.keyPoints];
          if (itemId) { const i = Number(itemId); if (!(i >= 0 && i < keyPoints.length)) throw new Plain("That point is gone."); keyPoints[i] = v; }
          else if (keyPoints.length >= 10) throw new Plain("Keep it to ten points at most. Three to five is best.");
          else keyPoints.push(v);
          return { ...p, keyPoints };
        }
        case "question": {
          const question = text(form, "question").slice(0, 1000);
          const answer = text(form, "answer").slice(0, 4000);
          if (!question) throw new Plain("Write the question.");
          if (!itemId) return { ...p, questions: [...p.questions, { id: newId(), question, answer, rehearsed: false }] };
          if (!p.questions.some((q) => q.id === itemId)) throw new Plain("That question is gone.");
          // A changed answer is not yet rehearsed.
          return { ...p, questions: p.questions.map((q) => (q.id === itemId ? { ...q, question, answer, rehearsed: q.rehearsed && q.answer === answer } : q)) };
        }
        case "asset": {
          const name = text(form, "name").slice(0, 200);
          const notes = text(form, "notes").slice(0, 4000);
          let url: string | null = text(form, "url") || null;
          if (!name) throw new Plain("Name the asset.");
          if (url && !isHttps(url)) { url = null; note = "Kept without its link: give an https:// link."; }
          if (!itemId) return { ...p, assets: [...p.assets, { id: newId(), name, url, notes }] };
          if (!p.assets.some((a) => a.id === itemId)) throw new Plain("That asset is gone.");
          return { ...p, assets: p.assets.map((a) => (a.id === itemId ? { ...a, name, url, notes } : a)) };
        }
        case "fact": {
          const fact = text(form, "fact").slice(0, 1000);
          const source = text(form, "source");
          if (!fact) throw new Plain("Write the fact.");
          if (!isHttps(source)) throw new Plain("Give the link the fact comes from (https://...). A fact without a source is not kept.");
          if (!itemId) return { ...p, about: [...p.about, { id: newId(), fact, source }] };
          if (!p.about.some((f) => f.id === itemId)) throw new Plain("That fact is gone.");
          return { ...p, about: p.about.map((f) => (f.id === itemId ? { ...f, fact, source } : f)) };
        }
        case "checklist": {
          const v = text(form, "text").slice(0, 200);
          if (!v) throw new Plain("Write the item.");
          if (!itemId) return { ...p, checklist: [...p.checklist, { id: newId(), text: v, done: false }] };
          return { ...p, checklist: p.checklist.map((c) => (c.id === itemId ? { ...c, text: v } : c)) };
        }
      }
    });
  } catch (e) {
    again(meetingId);
    redirect(withError(back, e instanceof Error ? e.message : "That could not be kept."));
  }
  again(meetingId);
  redirect(note ? withError(page(meetingId), note) : `${page(meetingId)}#${kind}`);
}

/** Remove one item of the prep. */
export async function removePrepItemAction(meetingId: string, kind: string, itemId: string): Promise<void> {
  const user = await requireUser();
  if (!isPrepKind(kind)) throw new Error("No such part of the prep.");
  await keep(user.id, meetingId, (p) => {
    switch (kind as PrepKind) {
      case "point": return { ...p, keyPoints: p.keyPoints.filter((_, i) => String(i) !== itemId) };
      case "question": return { ...p, questions: p.questions.filter((q) => q.id !== itemId) };
      case "asset": return { ...p, assets: p.assets.filter((a) => a.id !== itemId) };
      case "fact": return { ...p, about: p.about.filter((f) => f.id !== itemId) };
      case "checklist": return { ...p, checklist: p.checklist.filter((c) => c.id !== itemId) };
    }
  });
  again(meetingId);
  redirect(`${page(meetingId)}#${kind}`);
}

/** Tick a checklist item or mark a question rehearsed (or take either back). */
export async function setPrepMarkAction(meetingId: string, kind: "question" | "checklist", itemId: string, on: boolean): Promise<void> {
  const user = await requireUser();
  await keep(user.id, meetingId, (p) => kind === "question"
    ? { ...p, questions: p.questions.map((q) => (q.id === itemId ? { ...q, rehearsed: on } : q)) }
    : { ...p, checklist: p.checklist.map((c) => (c.id === itemId ? { ...c, done: on } : c)) });
  again(meetingId);
}

/**
 * "Draft my prep": a model drafts key points, questions with answers and asset notes from the meeting's own title,
 * agenda and length, and its venture's name when it has one. The draft joins what the host wrote without deleting
 * any of it, and never adds facts about the other person (those need real sources).
 */
export async function draftPrepAction(meetingId: string): Promise<void> {
  const user = await requireUser();
  const m = await meetingFor(user.id, meetingId);
  if (!m || m.role !== "host") throw new Error("No such meeting.");
  const model = chatModel();
  if (!model) redirect(withError(page(meetingId), "Drafting needs a model, and none is set up here. Write your prep below."));
  let venture: { name: string; what?: string } | null = null;
  if (m.ventureId) {
    try { const s = seedOf(await ventureOf(user.id, m.ventureId)); venture = { name: s.name, what: s.what }; } catch { venture = null; }
  }
  let error: string | null = null;
  try {
    const { text: reply } = await generateText({ model, prompt: draftPrompt({ title: m.title, agenda: m.agenda, minutes: m.minutes, venture }), abortSignal: AbortSignal.timeout(90_000) });
    const draft = readDraft(reply);
    if (!draft) throw new Plain("The draft did not come back in a form that could be read. Try again, or write your prep below.");
    await keep(user.id, meetingId, (p) => mergeDraft(p, draft, newId));
  } catch (e) {
    error = e instanceof Plain ? e.message : "The draft could not be written just now. Try again, or write your prep below.";
  }
  again(meetingId);
  redirect(error ? withError(page(meetingId), error) : `${page(meetingId)}?drafted=1`);
}

/** Rehearsed, in practice: marks the question rehearsed and moves the round on to the next question. */
export async function practiceRehearsedAction(meetingId: string, questionId: string, seen: string, againIds: string): Promise<void> {
  const user = await requireUser();
  await keep(user.id, meetingId, (p) => ({ ...p, questions: p.questions.map((q) => (q.id === questionId ? { ...q, rehearsed: true } : q)) }));
  again(meetingId);
  const r = roundParams(afterAnswer(readRound(seen, againIds), questionId, "rehearsed"));
  redirect(`${page(meetingId)}/practice?${new URLSearchParams(r)}`);
}
