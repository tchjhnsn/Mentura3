"use server";

// The Integrations screens' acts (V24, V26). Connecting is the marketplace's own sign-in at the service
// (startConnect); a short-lived cookie names the console page to come back to, which /api/connectors/callback reads.
// Disconnecting clears the sign-in. Both are the person's taps, as in the marketplace (page-actions.test.ts).
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ventureHref } from "@/components/studio/data";
import { CONNECT_BACK_COOKIE, consoleBack } from "@/components/studio/connect-back";
import { accountProblem } from "@/components/studio/integrations";
import { connectionsOf, disconnect, setBusinesses, startConnect } from "@/server/mcp-connections";
import { requireUser } from "@/server/session";

const page = (slug: string, id: string) => ventureHref(slug, `integrations/${encodeURIComponent(id)}`);

/** Continue on V24: off to the service's sign-in, or straight back when it needs none. With `scope` "this" only this
 * business may use the connection; otherwise every business may. `account` names which of the person's accounts of
 * the service to sign in (empty for the first), so Finish and Reconnect reach the right one. */
export async function connectIntegration(slug: string, id: string, form?: FormData): Promise<void> {
  const user = await requireUser();
  const back = page(slug, id);
  let to: string | null = null;
  try {
    const started = await startConnect(user.id, { connector: id }, String(form?.get("account") ?? "") || null);
    to = started.redirect;
    if (form?.get("scope") === "this") await setBusinesses(user.id, started.id, [decodeURIComponent(slug)]);
  } catch (e) {
    redirect(`${back}/connect?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not connect.")}`);
  }
  await goTo(slug, id, to);
}

/** Connect another account on V26 (R18, P26): a second sign-in to the same service under the name the person gives
 * it. It starts kept to this business, so a new account never reaches the others without a tick. */
export async function connectAnother(slug: string, id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const back = page(slug, id);
  const label = String(form.get("account") ?? "").trim();
  let to: string | null = null;
  try {
    const held = (await connectionsOf(user.id)).filter((c) => c.connector === id && c.status !== "pending").map((c) => c.account);
    const problem = accountProblem(label, held);
    if (problem) throw new Error(problem);
    const started = await startConnect(user.id, { connector: id }, label);
    to = started.redirect;
    await setBusinesses(user.id, started.id, [decodeURIComponent(slug)]);
  } catch (e) {
    redirect(`${back}?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not connect.")}`);
  }
  await goTo(slug, id, to);
}

async function goTo(slug: string, id: string, to: string | null): Promise<never> {
  const back = page(slug, id);
  if (to) {
    const at = consoleBack(back);
    if (at) (await cookies()).set(CONNECT_BACK_COOKIE, at, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
    redirect(to);
  }
  revalidatePath(back);
  redirect(`${back}?connected=1`);
}

/** Disconnect on V26: Reflect forgets the sign-in, for this business and every other. */
export async function disconnectIntegration(slug: string, id: string, connection: string): Promise<void> {
  const user = await requireUser();
  await disconnect(user.id, connection);
  revalidatePath(ventureHref(slug, "integrations"), "layout");
  redirect(`${page(slug, id)}?disconnected=1`);
}

/** Access on V26: every business, or the ones ticked. Ticking none keeps it to this business, so it never vanishes
 * from the page it was set on. */
export async function saveBusinesses(slug: string, id: string, connection: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const all = form.get("all") === "on";
  const picked = form.getAll("business").map(String);
  try {
    await setBusinesses(user.id, connection, all ? null : picked.length ? picked : [decodeURIComponent(slug)]);
  } catch (e) {
    redirect(`${page(slug, id)}?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not save.")}`);
  }
  revalidatePath(ventureHref(slug, "integrations"), "layout");
  redirect(`${page(slug, id)}?saved=1`);
}

/** Use it here (V23): add this business to a connection kept to others. */
export async function useHere(slug: string, id: string, connection: string, current: string[]): Promise<void> {
  const user = await requireUser();
  try {
    await setBusinesses(user.id, connection, [...current, decodeURIComponent(slug)]);
  } catch (e) {
    redirect(`${page(slug, id)}?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not save.")}`);
  }
  revalidatePath(ventureHref(slug, "integrations"), "layout");
  redirect(`${page(slug, id)}?saved=1`);
}
