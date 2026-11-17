// The chat's crisis protocol (@reflect/core/crisis): when the person's latest message shows a sign of suicide
// or self-harm, the model is not called. Reflect streams one fixed reply, which says it is an AI and points to
// the 988 Suicide and Crisis Lifeline, and the Lifeline card with its call, text and chat links.
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { SPEC_DATA_PART_TYPE } from "@json-render/core";
import { CRISIS_REPLY, crisisSignal } from "@reflect/core/crisis";
import { buildSpec } from "../../chat/spec";

/** The words of a message, its text parts joined. */
export const messageText = (m: UIMessage | undefined) => (m ? m.parts.map((p) => (p.type === "text" ? p.text : "")).join("") : "");

/** True when the latest message is the person's and shows a crisis signal. */
export function inCrisis(messages: readonly UIMessage[]): boolean {
  const last = messages.at(-1);
  return last?.role === "user" && crisisSignal(messageText(last));
}

/** The crisis reply as a chat stream, kept in the transcript by `keep` like any answer. */
export function crisisResponse(keep: (text: string) => Promise<void>): Response {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "text-start", id: "crisis" });
      writer.write({ type: "text-delta", id: "crisis", delta: CRISIS_REPLY });
      writer.write({ type: "text-end", id: "crisis" });
      const spec = buildSpec([{ kind: "lifeline" }]);
      if (spec) writer.write({ type: SPEC_DATA_PART_TYPE, id: "cards", data: { type: "flat", spec } });
      await keep(CRISIS_REPLY);
    },
  });
  return createUIMessageStreamResponse({ stream });
}
