// What a signed-in person may see when a hosted call fails. A process error quotes the command,
// and that command must not carry the signed assertion, a path, or a database URL.

const GENERIC = "Naive did not finish. Try again.";

function leaks(message: string): boolean {
  if (message.startsWith("Command failed")) return true;
  if (/\bEPIPE\b|\bETIMEDOUT\b|\bENOENT\b|\bEACCES\b|\bECONN\w*\b|\bENOTFOUND\b|\bEAI_AGAIN\b|\bspawn\b/.test(message)) return true;
  if (/pg_hba|password authentication failed|does not exist|could not connect|connection terminated|server closed the connection|too many clients|remaining connection slots|timeout expired/i.test(message)) return true;
  if (/\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(message)) return true;
  if (/postgres(ql)?:\/\//i.test(message)) return true;
  if (message.includes("BETTER_AUTH") || message.includes("NAIVE_BRIDGE_KEY") || message.includes("MENTURA_")) return true;
  if (/[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}/.test(message)) return true;
  if (/(?:^|[\s'"])\/(?:tmp|var|opt|home|Users|agent|private)\b/.test(message)) return true;
  if (/[A-Za-z]:\\/.test(message)) return true;
  return false;
}

/** A message safe to return from a server action. Process text becomes one fixed sentence. */
export function publicMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message || leaks(message)) return GENERIC;
  return message;
}

/** The `{ ok: false }` body every console action returns from a thrown error. */
export function actionFailure(error: unknown): { ok: false; message: string } {
  return { ok: false, message: publicMessage(error) };
}
