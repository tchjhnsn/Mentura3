// Sending one email (doc "Personal site and blog design guide", 2026-11-18: a subscriber's confirmation link). It
// sends through Resend only when RESEND_API_KEY and REFLECT_MAIL_FROM are set; otherwise it sends nothing and says so.
// Keys are read by name only and never logged.
import { outsideFetch } from "@/server/outside";

export const MAIL_ENV = ["RESEND_API_KEY", "REFLECT_MAIL_FROM"] as const;

/** Whether this deployment can send email. */
export const canSendMail = () => MAIL_ENV.every((k) => !!process.env[k]);

/** Sends a plain-text email. False when sending is not set up or the provider refused it. */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  if (!canSendMail()) return false;
  try {
    const r = await outsideFetch()("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.REFLECT_MAIL_FROM, to: [to], subject, text }),
      cache: "no-store",
    });
    return r.ok;
  } catch {
    return false;
  }
}
