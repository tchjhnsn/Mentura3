// The chat's endpoint, on the pattern of json-render's chat example (vercel-labs/json-render,
// examples/chat): AI SDK streaming, tools first, cards streamed as json-render spec parts. One difference
// on purpose: the model never writes a spec. Each tool fetches the person's records and Reflect builds the
// card (../../chat/spec.ts), so a card can only show what the app holds. The tools are the action registry's
// chat actions (@/server/actions), rendered in ./tools.ts.
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, stepCountIs, streamText, type UIMessage } from "ai";
import { SPEC_DATA_PART_TYPE } from "@json-render/core";
import { ASK_SYSTEM, learnSummary } from "@reflect/core/ask";
import { acceptLocalDate, clean } from "@reflect/core/journal";
import { chatPart, isChatId } from "@reflect/core/chat-journal";
import { isoDate } from "@reflect/core/person";
import { mediumOf } from "@reflect/core/ways";
import { currentUser } from "@/server/session";
import { keepChatMessage } from "@/server/journal-store";
import { chatModel } from "@/server/chat-model";
import { learnView } from "@/server/learn-store";
import { listClaims, type ClaimOut } from "@/server/claims-store";
import { listItems, type LearnItem } from "@/server/ways-store";
import { buildSpec, type Piece } from "../../chat/spec";
import { chatTools } from "./tools";
import { crisisResponse, inCrisis, messageText } from "./crisis";

export const maxDuration = 60;
const MAX_MESSAGES = 40;
/** Steps in one answer: tool rounds, then always a last step in words (toolChoice none), so no answer ends on a card alone. */
const MAX_STEPS = 6;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: unknown; localDate?: unknown; messages?: UIMessage[] } | null;
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  if (!messages.length) return Response.json({ error: "messages are required" }, { status: 400 });
  // Crisis protocol (SB 243): a sign of suicide or self-harm gets the 988 Lifeline, never coaching, and needs no model.
  const crisis = inCrisis(messages);
  const model = chatModel();
  if (!model && !crisis) return Response.json({ error: "no model is set up" }, { status: 503 });
  // The chat is kept in the journal as one entry (its id is the chat's id), one part per message.
  const day = typeof body?.localDate === "string" ? isoDate(body.localDate) : null;
  const journal = isChatId(body?.id) && day && acceptLocalDate(day, new Date()) ? { chat: body.id as string, day } : null;
  const keep = async (who: "you" | "reflect", text: string) => {
    const words = clean(text);
    if (journal && words) await keepChatMessage(user.id, journal.chat, journal.day, chatPart(who, words)).catch(() => undefined);
  };
  const last = messages.at(-1);
  if (last?.role === "user") await keep("you", messageText(last));
  if (crisis || !model) return crisisResponse((text) => keep("reflect", text));

  const [view, claims, items] = await Promise.all([learnView(user.id), listClaims(user.id).catch((): ClaimOut[] | null => null), listItems(user.id).catch((): LearnItem[] => [])]);
  const summary = learnSummary({
    books: view.books.map((b) => ({ title: b.title, status: b.status })),
    subjects: [...new Set(view.books.flatMap((b) => b.subjects.map((s) => s.name)).concat(view.known.map((s) => s.name)))],
    claims: (claims ?? []).map((c) => ({ text: c.text, stance: c.stance?.stance ?? null })),
    items: items.map((i) => ({ title: i.title, medium: mediumOf(i.medium).label.toLowerCase(), status: i.status })),
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Every card of this answer, redrawn as one spec each time a tool adds one.
      const pieces: Piece[] = [];
      const show = (p: Piece) => {
        pieces.push(p);
        const spec = buildSpec(pieces);
        if (spec) writer.write({ type: SPEC_DATA_PART_TYPE, id: "cards", data: { type: "flat", spec } });
      };
      const result = streamText({
        model,
        system: `${ASK_SYSTEM}\n\n${day ? `The person's today is ${day}.\n\n` : ""}${summary}`,
        messages: await convertToModelMessages(messages),
        stopWhen: stepCountIs(MAX_STEPS),
        prepareStep: ({ stepNumber }) => (stepNumber >= MAX_STEPS - 1 ? { toolChoice: "none" } : undefined),
        onFinish: async ({ steps }) => keep("reflect", steps.map((st) => st.text).filter(Boolean).join("\n\n")),
        tools: chatTools({ userId: user.id, ...(day ? { today: day } : {}), view, claims, items, show }),
      });
      writer.merge(result.toUIMessageStream());
    },
    onError: () => "The model is not reachable right now. Your apps are all still there.",
  });
  return createUIMessageStreamResponse({ stream });
}
